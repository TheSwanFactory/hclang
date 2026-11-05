# Reference Tracking and Event Dispatch

**Status:** Implemented as a library-level vertical slice; no HC syntax or
evaluation semantics changed. Opened by occurrence/figure 015.24f, after the
research in 015.22–015.24c; the conjecture it tests is 015.23a. The admitted
footprint is enforced as a certificate since 015.24j (§ Soundness below).\
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
- the **actual access** of each active `AccessRecord`: reads at `get_here` and
  `FrameArray.elements`, writes at the commit points, each dated by version, and
  the frames created meanwhile, so an event's own copies are told apart from
  shared state.

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
  and so is the frame a binding was read in;
- the path carries authority: an unmarked name hands out an immutable handle, a
  marked name or an index the identity itself;
- inside a functional update nothing counts as written, because every write
  forks or meets `$!.copy-on-write-boundary`;
- a nested callee found by name is walked too, as a method of the receiver when
  found there; a closure handed in as the argument is walked where it was
  written, since the body may call it; so is every callback an arrow
  `x -> callback` registered on an identity the event may write, since a
  committed write of `x` invokes it;
- an unresolved name, an import, a resource, or a `BoundMethod` reached as a
  value makes the footprint **opaque**;
- a closure the walk reaches only through a value, an element of an aggregate
  the body reads (`fns & {_ ()}`) or of a data argument (`_ & {_ ()}`), is not
  walked: the walk reads the aggregate and stops. This is the known
  under-inference; the guard below is what keeps it from admitting anything.

### Dispatch

`dispatch(events, policy)` steps each event one statement at a time
(`FrameLazy.steps`, `BoundMethod.steps`, `FrameExpr.stepBody`, which share their
prelude and statement loop with `call` and `evaluateBody`). Three policies:

- `sequential`: the baseline, each event to completion in order;
- `interleave`: round-robin with no coordination, the executable counterexample;
- `footprint`: an event starts only when no unfinished earlier event and no
  running event has a conflicting footprint. Conflicting events run in program
  order; disjoint ones interleave.

Admission rests only on the footprint the walk infers, and the walk runs when
the event is about to start: an earlier event may have rebound a name the body
uses, and names resolve to what they denote then. A caller may `declare` a
footprint, which widens the inferred one for scheduling and is checked against
the event's actual writes (`undeclared`); it cannot narrow the inferred one, so
no unverified claim admits a conflict the walk would refuse.

Every event runs under an `AccessRecord`. Under `footprint` the record carries a
**guard**: the footprint admission rested on is the event's **certificate**, and
every keyed or indexed read and every commit of shared state is checked against
it before it happens (`guardAccess`, at the same seams the record is fed from).
State is what the walk counts as state, an aggregate or a plain scope `Frame`
whose binding a `@name` can rebind; state the event created is its own. An
access outside the certificate is refused where it would have occurred: the
value is not handed out, the mutation does not land, and the event ends at that
statement with the failed result `$!.uncertified-read` or `$!.uncertified-write`
(`EventOutcome.refused`). An event the walk cannot read is opaque and serialized
against everything, so its guard allows everything. Under `sequential` and
`interleave` no guard is installed; shared state touched outside the potential
footprint is then reported afterwards as an **escape** or **read escape**, the
diagnostic of the walk's reach that the guard turns into a refusal.

### The dispatch namespace

`dispatchNamespace()` (`dispatch-host.ts`) is the three policies as host values.
A harness that binds it under `dispatch` in its host namespace, as the CLI does
beside the resource root, lets HC source write
`$$.dispatch.footprint [e₁, e₂, …]`: each `eᵢ` is a bound closure or method, or
a pair `[callable, argument]`. The answer is one aggregate whose elements are
the events' results in program order and whose properties `trace`, `waited` and
`escapes` record the schedule. A bare name never searches `$$`, so this adds no
HC syntax and changes no evaluation; it is the bridge through which the testdoc
reaches the dispatcher under test.

## Soundness: what is enforced, what is proved, what is assumed

### The fragment

The claim is about the evaluator as it is, restricted to what the walk and the
record can see. An **event** is one call of a `FrameLazy` bound in a scope or a
`BoundMethod`, with an argument. A **step** is one statement of a sequenced body
(`FrameExpr.stepBody`); a nested call, a callback fired by a commit, a
functional update and the whole of a one-statement body are inside their step.
The **state** is the set of frames `isState` accepts: aggregates, which own
identity, and plain scope `Frame`s. **Shared** state is state the event did not
create. The **observable** of a dispatch is the tuple of event results in
program order, the final shared state, and each event's failure if any. A
schedule trace is instrumentation and is not observed.

Accesses are what the runtime notes: a read is a keyed hit at `get_here` or a
reading of the element plane (`elements`); a write is a commit at `set`,
`replaceMember`, `setParent`, `collect` or `reset`. A native that reaches into
`meta` or `data` without those seams (printing, form equality, Size) is not an
access of the fragment. This is the first explicit assumption.

### The contract

Let `C(e) = (R, W)` be the certificate of event `e`, the footprint admission
rested on. The dispatcher admits `e` beside a running `f` only when
`W(e) ∩ (R(f) ∪ W(f)) = ∅` and `W(f) ∩ R(e) = ∅` (`footprintsConflict`), and
never when either is opaque. The guard then enforces, for every step of `e`
while it runs: every shared read is in `R(e)` and every shared write is in
`W(e)`, or the access is refused before it happens.

**Claim (enforced serializability).** In any `footprint` dispatch, the events
that complete produce the observable that the `sequential` policy produces for
those same events in program order, and an event that does not complete ended
with `$!.uncertified-read` or `$!.uncertified-write` at the first access the
guard refused, having committed only certified writes before it.

**Argument.** Take the trace of steps. Two adjacent steps of different events
`a` (earlier in program order) and `b` with `b`'s step first can be swapped
without changing either step's result or the state after both, because both
events were running at once, so both were admitted beside each other, so their
certificates do not conflict, so, by the guard, the accesses the two steps made
to shared state are disjoint in the conflict sense: neither wrote what the other
read or wrote. Private state (created by the event) is touched by that event
alone. A step's result is a function of what it read and of private state, so it
is unchanged by the swap. Repeating the swap sorts the trace into program order,
step by step, with the same per-step results and the same final state, which is
the `sequential` trace of the completed events. A refused event contributes only
its certified prefix, which commutes by the same argument; its refusal replaces
the first access that would have left the certificate, so nothing uncertified
was read or written. Conflicting events are never running at once (`mayStart`),
so an event waits for every earlier conflicting one, and program order is the
serial order, not merely some serial order.

What this rests on, by kind:

- **Proved from the code, given the fragment.** Admission is pairwise
  non-conflicting (`mayStart`); the guard is checked at every seam the record is
  fed from, before the access; a frame the event created is never shared;
  `sequential` is the program-order serial run of the same steps.
- **Assumed.** The seams are the only accesses that can affect a result or the
  final state (natives that bypass them are outside the fragment); a step's
  result depends only on its reads and private state (no clock, no host
  randomness inside the fragment; resources and imports make an event opaque,
  which serializes it); `isState` is the whole of what can be shared (atoms and
  closures are immutable values, so sharing them is unobservable).
- **Execution evidence only.** That the walk's over-approximation is wide enough
  for the programs that matter: a program whose actual accesses leave its
  certificate is refused, not admitted, so the claim holds, but the event fails
  rather than runs. The witnesses show both sides.

### Excluded, by construction

- A closure reached only through a value (an element the body iterates, a data
  argument's element): not walked, so refused if it touches state outside the
  certificate (`hidden-incr-x`, `each`). This is the fail-closed case the guard
  adds; before 015.24j it was admitted and reported as an escape after the lost
  update.
- Anything reaching `meta` or `data` without the seams: unobserved, so neither
  certified nor refused.
- A refused event is not rolled back: its certified prefix stays committed. The
  claim is about completed events plus that prefix, and the refusal is a
  reported failure, not an equivalence with a sequential run in which the event
  would have completed.
- Interleaving in one interpreter, not parallelism; versions xᵢ are recorded,
  not published; readers wait for earlier writers rather than reading snapshots.

### The witnesses (vacted facts, for these executions)

`hc/art-dispatch-vact.hc` constructs the state and closures and hands them to
`$$.dispatch`; every `#` line is the recorded output of the policy named. The
companion test dispatches the same construction, extracted from the testdoc, and
applies the observers the bridge does not print: for every scenario the
`footprint` observable equals the program-order `sequential` one; every
completed event's actual accesses lie within its certificate and no two events
whose steps interleaved have conflicting certificates; `interleave` on W1, W6
and W9 matches no serial order; the refused events of W9 and W10 have no read or
write of `x` in their record and `x`'s version is unchanged by them.

| Witness                                               | `interleave`                    | `footprint`                                   |
| ----------------------------------------------------- | ------------------------------- | --------------------------------------------- |
| W1 two `incr-x`                                       | lost update, `6, 6`             | serialized, `6, 7`                            |
| W2 `incr-x` with a mutable alias writer               | —                               | serialized                                    |
| W3 `incr-x` with `incr-y`                             | —                               | interleaved, baseline observable              |
| W4 writer/reader both orders                          | —                               | one committed version each way                |
| W5 functional update through an immutable alias       | —                               | no wait, x untouched                          |
| W6 `move` with `sum-slow`; two `move`                 | torn sum 16; sum not conserved  | 15; conserved                                 |
| W7 `retarget`, `via-t`, `incr-y`                      | —                               | `via-t` re-read at start, writes y; 12        |
| W8 closure returned by a call, then called            | —                               | walked by name, serialized                    |
| W9 `hidden-incr-x` (calls through data) with `incr-x` | lost update `6, 6`, escape of x | `$!.uncertified-read`, x untouched by it, 6   |
| W10 `[each, setters]`; `hidden-write-x` with `read-x` | —                               | `$!.uncertified-read`; `$!.uncertified-write` |
| W11 `cell-twice` (arrow callback writes `log_`)       | —                               | callback walked, serialized, 12               |
| W12 `ghost` (import) with `incr-y`                    | —                               | opaque, serialized, fails, 11                 |

A passing run is a vacted fact for those executions. It is not a proof of the
claim for every HC program; the argument above is what carries the claim over
the fragment, and the assumptions it names are where it stops.

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

The VACT witnesses of 015.24j are listed under _Soundness_ above.

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
  event makes, so scheduling never rests on a claim the runtime does not hold
  the event to.

## Cost

Ordinary evaluation pays one array-length check per keyed read and one `WeakMap`
update per committed write, plus one set insertion when an aggregate is bound;
the guard adds one more length check at each of those points when no record is
active, and one `WeakSet` lookup per guarded record otherwise. Three timed runs
of `deno test lib` on the baseline and on this branch (the new tests excluded)
are recorded in the PR.
