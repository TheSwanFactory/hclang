# Reference Tracking and Event Dispatch

**Status:** Implemented as a library-level vertical slice; no HC syntax or
evaluation semantics changed. Opened by occurrence/figure 015.24f, after the
research in 015.22–015.24c; the conjecture it tests is 015.23a.\
**Modules:**
[`lib/frames/reference-tracking.ts`](../lib/frames/reference-tracking.ts),
[`lib/frames/access-footprint.ts`](../lib/frames/access-footprint.ts),
[`lib/frames/event-dispatch.ts`](../lib/frames/event-dispatch.ts).

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
  written, since the body may call it;
- an unresolved name, an import, a resource, or a `BoundMethod` reached as a
  value makes the footprint **opaque**.

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
no unverified claim admits a conflict the walk would refuse. The policy is sound
relative to the walk: two events the walk sees to conflict run in program order.

Every event runs under an `AccessRecord`; shared state written outside the
potential footprint is an **escape** and shared state read outside it a **read
escape**, where state is what the walk counts as state, an aggregate or a plain
scope `Frame` whose binding a `@name` can rebind. An escape means the walk
under-inferred; it is reported after the writes committed and nothing is rolled
back, so it is a diagnostic of the walk, not a safety net. An event the walk
cannot read is opaque and serialized against everything, which is the
fail-closed case.

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
- Not a verified contract. A declared footprint is checked, not trusted:
  scheduling never rests on a declaration narrower than the walk's own reading.

## Cost

Ordinary evaluation pays one array-length check per keyed read and one `WeakMap`
update per committed write, plus one set insertion when an aggregate is bound.
Three timed runs of `deno test lib` on the baseline and on this branch (the new
tests excluded) are recorded in the PR.
