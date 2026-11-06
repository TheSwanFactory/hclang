# Reference Tracking and Event Dispatch

**Status:** Implemented as a library-level vertical slice; no HC syntax or
evaluation semantics changed. Opened by occurrence/figure 015.24f, after the
research in 015.22–015.24c; the conjecture it tests is 015.23a. The admitted
footprint is enforced as a certificate since 015.24j, and the claim was repaired
after the PR #484 review (015.24l): a conditional theorem against a serial
prefix-and-failure baseline (§ Soundness below).\
**Modules:**
[`lib/frames/reference-tracking.ts`](../lib/frames/reference-tracking.ts),
[`lib/frames/access-footprint.ts`](../lib/frames/access-footprint.ts),
[`lib/frames/event-dispatch.ts`](../lib/frames/event-dispatch.ts),
[`lib/frames/dispatch-host.ts`](../lib/frames/dispatch-host.ts).\
**Witness:** [`hc/art-dispatch-vact.hc`](../hc/art-dispatch-vact.hc), run by
`deno task test:doc`, and
[`lib/frames/event-dispatch.vact.test.ts`](../lib/frames/event-dispatch.vact.test.ts),
which re-runs the same construction from the host side.

## The question

HC's effect discipline is BitC's: mutability is a property of the handle, not
the object. A trailing underscore on a key grants a name authority to write what
it holds, and a mutating method reached through an immutable handle is a
functional update on a copy. Figure 015.23a conjectured that this homoiconic,
effect-typed representation might let the runtime discover which operations may
overlap, without application source changing, if it also tracked the _actual_
references and accesses (Automated Reference Tracking, ART) rather than only the
_permitted_ ones.

015.24c sharpened the question into four facts that must be kept apart:

1. **Permission**: what a key's spelling allows (`touchesIdentity`).
2. **Possession**: which bindings currently hold an identity.
3. **Active access**: what a running event has actually read and written.
4. **The event boundary**: the unit whose effects are complete before another
   event's begin.

Before this slice, the runtime held (1) and nothing else: a `FrameHandle` knows
its own mutability, a `BoundMethod` its method's, but no structure answers "who
holds x", "what did this call touch", or "where may another call be admitted".

## What the runtime already defined

- **Identity.** Only a `FrameArray` owns identity (`ownsIdentity`). Atoms and
  closures are shared freely because sharing them is unobservable.
- **The one write seam.** Every committed mutation lands at `MetaFrame.set`,
  `MetaFrame.replaceMember`, `Frame.setParent`, `FrameArray.collect` or
  `FrameArray.reset`. The effect registry (`A -> B`, 006.17) already relied on
  the first two being complete.
- **Aliases.** `.y_ x_` binds the same aggregate under a second mutable key,
  because assignment unwraps the handle. A mutation through either is seen
  through the other; a mutation through an immutable alias is a functional
  update. `hc/class-support.hc` pins all three.
- **The statement.** `FrameExpr.evaluateBody` runs a sequenced body one
  statement at a time in one scope. Nothing finer is a boundary.

Two behaviours the slice had to respect rather than idealize, both verified by
running the interpreter at the baseline commit:

- Reaching a member through a marked key or an element index hands out the
  identity itself, whatever the outer name's mutability: `h.inner_.set_ 9` and
  `xs.0.set_ 5` through immutable `h` and `xs` write the shared member in place.
  Outer mutability governs only a functional update's copy-on-write graph.
- A marked local declaration mints authority: `.w_ x` inside a body makes `w_` a
  mutable handle on whatever `x` denotes, and `@x_ y_` rebinds a name. The
  marker is therefore not a capability that can be reasoned about statically
  from one declaration site; it has to be read wherever a name is spelled.

## The slice

### Reference tracking

`reference-tracking.ts` keeps, keyed weakly by the identity:

- the **holders** of each identity: holder frame, key and plane, maintained at
  every commit of a binding. A **member** holding is a named binding graded by
  its marker; an **element** holding is an index into an aggregate's data plane,
  mutable because an index hands out the identity itself (`xs.0.set_ 5` through
  immutable `xs` writes the shared element); a **parent** holding is the
  declared-parent edge, keyed `^`, which conveys lookup and no authority. The
  commit points are `set`, `replaceMember` (both planes), `setParent`,
  `collect`, `reset`, whole data-plane assignment, and the copy paths that
  duplicate bindings without `set`;
- a **version** per identity, advanced at every commit point;
- the **actual access** of each active `AccessRecord`: reads at `get_here` (a
  miss included) and `FrameArray.elements`, writes at the commit points, at an
  arrow registration and at a pattern match that rewrites a bound value's
  source, each dated by version, and the frames created meanwhile, so an event's
  own copies are told apart from shared state.

Holders are held strongly. A `WeakRef` is kept alive for the whole job (#426),
and the strong edge only closes a cycle the collector already frees.

### Potential footprint

`potentialFootprint(target, argument)` walks a `BoundMethod` or bound closure
body as the Frames it is and resolves each name against the scope the call would
run in (`FrameLazy.scopeForCall`, `BoundMethod.scopeForCall`, which select the
real receiver capability without running the body). The rules are the runtime's
own, read conservatively:

- a marked name handed on whole, a marked method reached with authority, a
  marked local declaration, and the owner of an `@name` are potential writes; so
  is every identity under a marked key of a writable one;
- every resolved referent and everything reachable from it is a potential read,
  and so is every frame a name was looked up in, the one it was found in and the
  ones it missed in before it;
- the left operand of an arrow `managed -> callback` is a potential write,
  whatever the handle's authority: registering changes what every later write of
  the managed value invokes;
- the path carries authority: an unmarked name hands out an immutable handle, a
  marked name or an index the identity itself;
- inside a functional update nothing counts as written, because every write
  forks or meets `$!.copy-on-write-boundary`;
- a nested callee found by name is walked too, as a method of the receiver when
  found there; a closure handed in as the argument is walked where it was
  written, since the body may call it; so is every callback an arrow
  `x -> callback` registered on an identity the event may write, since a
  committed write of `x` invokes it;
- an unresolved name, an import, a resource, a member answered only by a pattern
  binding, or a `BoundMethod` reached as a value makes the footprint **opaque**;
- a closure the walk reaches only through a value, an element of an aggregate
  the body reads (`fns & {_ ()}`) or of a data argument (`_ & {_ ()}`), is not
  walked: the walk reads the aggregate and stops. This is the known
  under-inference; the guard below is what keeps it from admitting anything.

### Dispatch

`dispatch(events, policy)` steps each event one statement at a time
(`FrameLazy.steps`, `BoundMethod.steps`, `FrameExpr.stepBody`, which share their
prelude and statement loop with `call` and `evaluateBody`). Four policies:

- `sequential`: each event to completion in program order, unguarded;
- `certified-sequential`: each event alone in program order under the guard of
  the certificate inferred when it starts, stopping at its first refused access
  with what it committed before kept: the serial **prefix-and-failure** baseline
  of § Soundness;
- `interleave`: round-robin with no coordination, the executable counterexample;
- `footprint`: events start in program order, and an event starts only when no
  unfinished earlier event and no running event has a conflicting footprint.
  Conflicting events run in program order; disjoint ones interleave. A later
  event never starts ahead of an earlier one that has not started (PR #484
  review): the earlier footprint is read only at its start, and could by then
  name what the later event had already written, which would put the two in the
  wrong order (W17).

Admission rests only on the footprint the walk infers, and the walk runs when
the event is about to start: an earlier event may have rebound a name the body
uses, and names resolve to what they denote then. A caller may `declare` a
footprint, which widens the inferred one for scheduling and is checked against
the event's actual writes (`undeclared`); it cannot narrow the inferred one, so
no unverified claim admits a conflict the walk would refuse.

Every event runs under an `AccessRecord`. Under `footprint` and
`certified-sequential` the record carries a **guard**: the footprint admission
rested on is the event's **certificate**, and every keyed or indexed lookup (hit
or miss), every commit of shared state, every arrow registration and every
pattern match is checked against it before it happens (`guardAccess`, at the
same seams the record is fed from). State is what the walk counts as state, an
aggregate or a plain scope `Frame` whose binding a `@name` can rebind; state the
event created is its own. An access outside the certificate is refused where it
would have occurred: the value is not handed out, the mutation does not land,
and the event ends at that statement with the failed result
`$!.uncertified-read` or `$!.uncertified-write` (`EventOutcome.refused`). A
refusal raised inside an arrow callback ends delivery there: no later callback
or round runs (an ordinary host exception in a callback still lets its siblings
run and is rethrown afterwards). A refusal carries the record whose guard
refused (`UncertifiedAccess.record`), and a dispatcher handles only its own
events' refusals, rethrowing any other, so a dispatch nested inside an event
cannot absorb a refusal that ends the outer event. An event the walk cannot read
is opaque and serialized against everything, so its guard allows everything.
Under `sequential` and `interleave` no guard is installed; shared state touched
outside the potential footprint is then reported afterwards as an **escape** or
**read escape**, the diagnostic of the walk's reach that the guard turns into a
refusal.

### The dispatch namespace

`dispatchNamespace()` (`dispatch-host.ts`) is the four policies as host values.
A harness that binds it under `dispatch` in its host namespace lets HC source
write `$$.dispatch.footprint [e₁, e₂, …]`: each `eᵢ` is a bound closure or
method, or a pair `[callable, argument]`. The CLI binds it for every program it
runs, not only testdocs, and `HCLang` (so the playground) binds it in every
session; it grants no authority, since every event is a closure the program
already holds. A host that binds neither has no `$$.dispatch`. The answer is one
aggregate whose elements are the events' results in program order and whose
properties `trace`, `waited` and `escapes` record the schedule. A bare name
never searches `$$`, so this adds no HC syntax and changes no evaluation; it is
the bridge through which the testdoc reaches the dispatcher under test.

## Soundness: what is enforced, what is proved, what is assumed

This section was rewritten after the PR #484 review. The claim of 015.24j
compared a `footprint` dispatch with the serial run of the events that
_completed_; a refused event's certified prefix stays committed, so that claim
was false (W13), and four further gaps let two schedules diverge without any
access leaving a certificate: arrow registration (W14), a lookup miss (W16), a
later event overtaking an earlier unstarted one (W17), and callback delivery
continuing after a refusal (W15). The repaired claim below is **conditional**:
it holds for events whose accesses all pass the seams, and the dispatcher does
not check that condition.

### Definitions

An **event** is one call of a `FrameLazy` bound in a scope or a `BoundMethod`,
with an argument; `E = e₁ … eₙ` in program order. A **step** is one statement of
a sequenced body (`FrameExpr.stepBody`); a nested call, every arrow callback a
commit fires, a functional update and the whole of a one-statement body are
inside their step. The **state** is the set of frames `isState` accepts:
aggregates, which own identity, and plain scope `Frame`s. A frame's state is its
bindings, its element plane, its declared parent and its **subscriber list**
(the callbacks arrows registered on it). **Shared** state is state that existed
before the dispatch, as opposed to frames an event created.

The **observable** `O` of a run is `(r₁, …, rₙ; σ)`: each event's result in
program order, a failure (`$!.uncertified-read`, `$!.uncertified-write`, or any
other) included, and `σ`, the final shared state, subscriber lists included. A
callback is code, so which callbacks fired is observed through what they did to
state; the witnesses' callbacks count their firings in shared state. The
schedule (`trace`, `waited`, `escapes`) is instrumentation, not observed.

An **access** is what passes a seam: a keyed lookup at `get_here`, hit or miss,
which is a read of that frame (a miss is the frame's answer that the key is
absent); an element read at `elements`; a commit at `set`, `replaceMember`,
`setParent`, `collect` or `reset`; an arrow registration (`registerEffect`), a
write of the managed value; a pattern match that rewrites the bound value's
source (`match_here`), a write of the frame holding the pattern.

The **certificate** `C(e) = (R, W)` is the footprint the walk infers when `e`
starts, widened by any declaration; opaque if the walk could not read `e`.

The **certified serial run** `CS(E)` (the `certified-sequential` policy) runs
`e₁, …, eₙ` alone, in program order; each `eᵢ` gets the certificate inferred in
the state its predecessors left, runs under its guard, and stops at its first
refused access with result `$!.uncertified-*`, keeping everything it committed
before (its **certified prefix**). Where no event is refused, `CS(E)` is the
plain `sequential` run.

### What the runtime enforces (proved by reading the code)

- **(A1) In-order admission.** Under `footprint`, `eⱼ` starts only after every
  `eᵢ` with `i < j` has started (`mayStart`).
- **(A2) Pairwise non-conflict.** When `eⱼ` starts, every unfinished earlier
  event and every running event has a certificate that does not conflict with
  `C(eⱼ)`: `W(e) ∩ (R(f) ∪ W(f)) = ∅` and `W(f) ∩ R(e) = ∅`, neither opaque.
- **(A3) Guard before access.** While `e` runs under a non-opaque certificate,
  every access at a seam to shared state outside `C(e)` throws before it takes
  effect: the value is not handed out, the commit does not land, the callback is
  not registered, the source is not rewritten.
- **(A4) A refusal ends its own event at that access.** Delivery to arrow
  callbacks stops at a refusal (`notifyEffect` rethrows `UncertifiedAccess` at
  once), and only the dispatcher whose event's record refused handles it
  (`UncertifiedAccess.record`); a nested dispatcher rethrows it.
- **(A5) The certificate covers the subscriber list.** A write of `x` walks the
  callbacks registered on `x`, and every registration on `x` is a write of `x`
  (guarded at the seam, inferred from `x -> cb` by the walk), so no event can
  change the callbacks another event's certified write of `x` fires.

### Hypotheses (assumed, not established)

- **(H1) Seam completeness.** Every read or write of shared state that the
  events make passes a seam. The dispatcher does not check this: it is a
  hypothesis about the events handed to it, not an admission gate.
- **(H2) Determinism.** A step's result, its writes and the point it is refused
  at are a function of the shared state it read, its event's private state and
  its certificate (no clock or randomness inside a non-opaque event; a resource
  or import makes an event opaque, which serializes it).
- **(H3) Locality of the walk.** The certificate the walk infers is a function
  of the code (immutable) and of the state of the frames it puts in `R`. By
  inspection of `access-footprint.ts`, the walk reads state only through
  `meta_pairs`, `resolve_here`, `asArray`, the declared parent and
  `effectSubscribersOf`, each on a frame it adds to `R` (every frame a name
  lookup consults, hit or miss, and every frame reachable from a read referent);
  frames the walk itself makes to stand for the call are not shared. This is
  argued from the code, and is the paragraph a reviewer should check.

### Theorem (conditional serializability)

Under H1–H3, for every `footprint` dispatch of `E`,
`O(footprint(E)) = O(CS(E))`.

Corollary: if no event is refused under `footprint`, then
`O(footprint(E)) = O(sequential(E))`.

**Proof.** Take the `footprint` trace of steps, a refused event's last step
being the one cut short by its refusal. If a step `b` of `eⱼ` immediately
precedes a step `a` of `eᵢ` with `i < j`, then `eᵢ` was unfinished when `eⱼ`
started and, by A1, had started, so by A2 their certificates do not conflict. By
A3 and H1 every shared access of `a` lies in `C(eᵢ)` and every shared access of
`b` in `C(eⱼ)`, so neither step wrote what the other read or wrote; private
state is touched by one event only. By H2 swapping `a` and `b` changes neither
step's result, writes or refusal, nor the state after both. Repeating the swap
sorts the trace into program order with each event's steps contiguous, the same
per-step results and the same final state. In the sorted trace `eᵢ` runs under
the certificate inferred in the `footprint` run, in the state `S` there at its
start; in `CS(E)` it is inferred in the state `S′` left by `e₁ … eᵢ₋₁`. `S` and
`S′` differ only by the steps of earlier events still running when `eᵢ` started,
whose writes lie in their certificates and so, by A2, outside `R(eᵢ)`; by H3 the
walk reads the same values in both and infers the same certificate. So by
induction on `i` each event of the sorted trace runs as in `CS(E)`: same
certificate, same steps, same refusal (A4: at the first refused access, a
callback included), same certified prefix. Hence the observables are equal. The
corollary follows because with no refusal the guard never acts, so `CS(E)` is
`sequential(E)`. ∎

A2's program-order clause is what makes the serial order the program order and
not merely some order; A1 is what keeps A2 true of certificates read late (W17).

### Where the claim stops: unproved native paths

H1 is not true of the whole evaluator. These are the paths known to read shared
state without a seam; an event that takes one is neither certified nor refused,
and the theorem says nothing about it:

- a host native that reads `meta` or `data` directly (the companion test's
  boundary witness: a native that reads `y_.n` from `meta` is admitted beside
  `incr-y`, is not refused, reports no escape, and returns 11 where the
  certified serial run returns 10);
- `=` and `==` on aggregates compare the visible key lists before any lookup and
  answer nil on a mismatch (`FrameArray`), so the key set, not the values, is
  read without a seam;
- a plain `Frame` value (not an aggregate) read by name is handed out as a fresh
  copy (`FrameSymbol.in`), whose bindings are copied natively and then read as
  the event's own; HC source has no literal for such a value, but a host can
  bind one;
- `@name` finds the binding's owner with `resolve_here`, so the frames it misses
  on before the owner are read without a seam (the write to the owner is
  guarded);
- printing a result (the bridge's report) happens after the dispatch, outside
  every event.

The HC-reachable natives that render, copy or measure an aggregate (`yl_ 3`,
`2 yl_`, `“a” yl_`, `yl_ .#`, `.##`, `&`, `|`) all begin with a guarded lookup
or element read on that aggregate, so through data they are refused (W9–W10 and
the probes recorded in 015.24m); they are inside the fragment.

### Excluded, by construction

- A closure reached only through a value (an element the body iterates, a data
  argument's element): not walked, so refused if it touches state outside the
  certificate (`hidden-incr-x`, `each`, `arm-hidden`, `peek-k`). This is the
  fail-closed case: such an event is refused, not admitted.
- A refused event is not rolled back: its certified prefix stays committed, and
  the baseline keeps it too.
- A dispatch nested in an event from HC is refused at the read of `$$`, which
  the walk does not follow (W18); one nested from the host is attributed to the
  guard that refused (A4).
- Interleaving in one interpreter, not parallelism; versions xᵢ are recorded,
  not published; readers wait for earlier writers rather than reading snapshots.

### The witnesses (vacted facts, for these executions)

`hc/art-dispatch-vact.hc` constructs the state and closures and hands them to
`$$.dispatch`; every `#` line is the recorded output of the policy named. The
companion test dispatches the same construction, extracted from the testdoc, and
applies the observers the bridge does not print: for every scenario, refused
events included, the `footprint` observable equals the program-order
`certified-sequential` one, and equals the `sequential` one wherever nothing is
refused; every event's actual accesses lie within its certificate and no two
events whose steps interleaved have conflicting certificates; `interleave` on
W1, W6 and W9 matches no serial order. Its last block is the boundary witness
above.

| Witness                                               | before the repair (`footprint`, at `334b160`) | `footprint` = `certified-sequential`          |
| ----------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| W1 two `incr-x`                                       | serialized, `6, 7` (`interleave`: `6, 6`)     | serialized, `6, 7`                            |
| W2 `incr-x` with a mutable alias writer               | serialized                                    | serialized                                    |
| W3 `incr-x` with `incr-y`                             | interleaved, baseline observable              | interleaved, baseline observable              |
| W4 writer/reader both orders                          | one committed version each way                | one committed version each way                |
| W5 functional update through an immutable alias       | no wait, x untouched                          | no wait, x untouched                          |
| W6 `move` with `sum-slow`; two `move`                 | 15; conserved (`interleave`: 16; not)         | 15; conserved                                 |
| W7 `retarget`, `via-t`, `incr-y`                      | `via-t` re-read at start, writes y; 12        | same                                          |
| W8 closure returned by a call, then called            | walked by name, serialized                    | same                                          |
| W9 `hidden-incr-x` (calls through data) with `incr-x` | `$!.uncertified-read`, 6                      | same                                          |
| W10 `[each, setters]`; `hidden-write-x` with `read-x` | `$!.uncertified-read`; `$!.uncertified-write` | same                                          |
| W11 `cell-twice` (arrow callback writes `log_`)       | callback walked, serialized, 12               | same                                          |
| W12 `ghost` (import) with `incr-y`                    | opaque, serialized, fails, 11                 | same                                          |
| W13 `prefix-x` (writes x, then refused) with `read-x` | `$!.uncertified-read, 6`; old baseline read 5 | `$!.uncertified-read, 6`, x = 6, both runs    |
| W14 `arm-hidden` then `poke`                          | `0, 0`, no callback; `sequential` fires once  | registration refused, `0`; nothing fires      |
| W14 `poke-late` then `arm-hidden`                     | registration admitted unseen                  | registration refused; nothing fires           |
| W14 `arm` (by name) with `poke`, both orders          | serialized through the read of w              | serialized as a write of w; fires as serially |
| W15 `poke2` (first callback refused, second ticks)    | second callback ran: `log2_` = 1              | stops at the refusal: `log2_` = 0             |
| W16 `peek-k` (miss through data) with `rebase`        | `2, 0`; the serial order reads 1              | miss refused, `$!.uncertified-read, 0`        |
| W17 `retarget-holder`, `via-holder`, `incr-y`         | `0, 12, 11`; `sequential` gives `0, 11, 12`   | `incr-y` waits for `via-holder`: `0, 11, 12`  |
| W18 `nested` (`$$.dispatch` inside an event)          | refused at the read of `$$`                   | same; host nesting attributed to its guard    |

A passing run is a vacted fact for those executions. It is not a proof of the
claim for every HC program; the argument above is what carries the claim over
the fragment, under H1–H3, and the boundary witness is where it stops.

## What the tests establish

`event-dispatch.test.ts` runs one HC program, unchanged across policies:

| Scenario                                         | `interleave`      | `footprint`                             |
| ------------------------------------------------ | ----------------- | --------------------------------------- |
| two `incr-x` (read x, write x)                   | lost update: 6    | 7, second waits                         |
| `incr-x` with `incr-y`                           | interleaved       | interleaved, no wait                    |
| `incr-x` then `read-x`                           | —                 | reader waits, reads the written version |
| `read-x` then `incr-x`                           | —                 | reader first, writer waits              |
| two `poke-inner` (nested callee writes x.inner)  | —                 | serialized, k = 2                       |
| `alias-write` (`.w_ x_` local) with `read-x`     | —                 | serialized                              |
| two `move` (x − 1, y + 1)                        | sum not conserved | conserved                               |
| `move` with a two-statement reader               | torn sum          | consistent sum                          |
| opaque event                                     | —                 | serialized against everything           |
| functional update through an immutable alias     | —                 | no shared write, no wait                |
| `incr-x` declared empty, with `incr-x`           | —                 | still serialized, 7; `undeclared` = x   |
| `retarget` (`@t_ y_`), `via-t`, `incr-y`         | —                 | `via-t` re-read at start, writes y; 12  |
| `apply` with closure argument `incr-x`, `incr-x` | —                 | argument walked, serialized, 7          |
| `bump` (`@count`) on a plain `Frame` scope       | —                 | writer and reader serialized            |

The VACT witnesses of 015.24j and 015.24l are listed under _Soundness_ above.
The scenario "a later disjoint event overtakes an earlier blocked one" of
015.24f is now "waits for it to start, then overlaps it" (A1).

The walk over-approximates where the runtime's own behaviour is permissive: a
marked name used only to read, then handed to another closure, is counted as a
write; a path through an argument index is counted as a write although the
argument arrives read-only. The escape check is one-sided: it detects a write
the walk missed, not a write it over-counted. Known gaps of the walk, each of
which fails closed (opaque) or is reported as an escape rather than admitted
silently: a `BoundMethod` reached as a value; a closure returned from a call and
called later; a callable reached through a native.

## What this is not

- Not threads. The interpreter is single-threaded; "overlap" here is statement
  interleaving under a deterministic scheduler, which is the same decision a
  parallel scheduler would commit to, made observable.
- Not a transaction. Separate `await`-like steps, separate statements and
  separate calls are not atomic together; the `interleave` policy proves it. The
  slice supplies a _coordination_ boundary (an event under `footprint`), not a
  consistency contract, and no rollback.
- Not snapshots. A reader of `x` waits for an earlier writer of `x` and blocks a
  later one. Versions xᵢ are recorded, not published; a read-your-own-version
  policy is the next step, and `instanceCopy` would be its cheap shallow
  snapshot, with the caveat that members are shared.
- Not an alias analysis. Names are resolved to the identities they denote when
  the event starts; a value the event constructs at run time is not followed.
- Not a trusted contract. A declared footprint can only widen the walk's own
  reading, and the footprint admission rests on is enforced on every access the
  event makes at a seam, so scheduling never rests on a claim the runtime does
  not hold the event to, within H1.
- Not a guarantee for unrestricted HC. The theorem is conditional on H1; the
  dispatcher admits events it cannot see are seam-complete.

## Cost

Ordinary evaluation pays one array-length check per keyed read and one `WeakMap`
update per committed write, plus one set insertion when an aggregate is bound;
the guard adds one more length check at each of those points when no record is
active, and one `WeakSet` lookup per guarded record otherwise. Three timed runs
of `deno test lib` on the baseline and on this branch (the new tests excluded)
are recorded in the PR.
