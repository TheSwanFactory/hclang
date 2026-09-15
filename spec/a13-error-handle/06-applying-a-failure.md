# What a Failure May Be Applied To

**Status:** Analysis, not a design. One question, with the measurements that
make it worth asking. It proposes no mechanism, no spelling, and no ruling, and
it does not claim [`a13`](01-error-handling.md) is wrong — both spikes ran a13's
mechanism end to end and it works. What it claims is that a13's costs all have
one cause, that the codebase already contains half of the alternative, and that
the alternative is one line away from being testable.\
**Design record:** [`a13`](01-error-handling.md).\
**Spikes:** [`a13a`](02-recovery-spike.md) /
[`a13b`](03-recovery-spike-findings.md), and [`a13c`](04-masking-bound-spike.md)
/ [`a13d`](05-masking-bound-findings.md).\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360), and
[#361](https://github.com/TheSwanFactory/hclang/issues/361) behind it.\
**Measured at:**
[`3c95828`](https://github.com/TheSwanFactory/hclang/commit/3c9582856888a46f7c9cd7a3438d26e0f972681a)
on `a13-error-handling`, with the unmodified evaluator, plus two temporary
one-line edits to `lib/frames/frame-expr.ts` described in §3 and reverted. Every
result quoted below is pasted output; every source block is pasted source.

**The short version.** #360 asks what an error means in conditional position.
a13 reframes it as where the evaluator looks for a handler, and the two spikes
then spend themselves on masking rules, handler identity, per-failure
bookkeeping, a synthesized argument, and an underscore ladder. Every one of
those exists because the evaluator locates and invokes the handler. None of them
exists for a receiver already sitting in the fold. HC already has the
receiver-side protocol — `collects()` is documented as existing for exactly one
argument, an error — and the reduce preempts it in one line. Removing that line
leaves the entire suite and every doctest green, and makes `[] (1 / 0)` answer
what `[(1 / 0)]` already answers. So the question underneath #360 is not where a
handler is found. It is **what may a failure be applied to, and what may be
applied to a failure** — which is a question about frames, answered by double
dispatch, in a language whose whole thesis is that there is one verb.

## 1. The question

Two directions, because HC's one verb has two sides.

- **A failure as argument.** `receiver failure`. Which receivers may take one,
  and which are poisoned by it?
- **A failure as receiver.** `failure argument`. What does a failure answer when
  something is applied to it?

Today the language has an answer to both, written in `Frame.error`
(`lib/frames/frame.ts:110-137`), and the evaluator reaches neither in the common
case. §2 is the answer; §3 is the reaching.

a13 asks a different question — _where does the evaluator look for a handler_ —
and it is a good question with a working answer. It is also a question about the
evaluator rather than about frames, which is why answering it needed
interpreter-global state (a13b Q2), a parse-time identity stamp (a13d, "Where
the bound comes from"), a second identity notion for §6a (a13d A4), a
synthesized text argument (a13 §7), and a rule for counting underscores that
depends on how deep the reader is (a13d, "Checking the outward spelling").

## 2. The receiver-side protocol exists, is correct, and is unreachable

`Frame.error` overrides two methods, and they are exactly the two sides of §1:

```ts
public override call(_argument: Frame): Frame {
  return this;
}

/**
 * An operation on an error is an error, but collecting is not an
 * operation on the value. A refusal is a value, so an aggregate holds it
 * and reports the failure through its own contents, exactly as it already
 * holds a missing-name note. Preempting a collect would drop the refusal
 * and let the reduce answer as though nothing had gone wrong.
 */
public override called_by(context: Frame, parameter: Frame): Frame {
  return context.collects() ? context.apply(this, parameter) : this;
}
```

A failure as receiver answers itself. A failure as argument **asks the
receiver** — one question, `collects()`, whose own doc comment says why it
exists:

```ts
/**
 * Whether applying to this frame collects the argument rather than consuming it.
 *
 * Only an aggregate answers yes. The distinction matters for one argument: an
 * error preempts application everywhere else, because an operation on an error
 * is an error, and a collect is not such an operation.
 */
public collects(): boolean {
  return false;
}
```

**`collects()` is already the receiver-side answer to "may a failure be applied
to me?"** It has a default of no, one overrider, no source spelling, and a
documented reason that names errors specifically. That is not a general protocol
yet, but it is the shape of one, drawn in the right place, by the right hand.

It is also unreachable from the spelling that matters. `evaluateTerms`
(`lib/frames/frame-expr.ts:84-95`) returns a failing term before
`sum.call(value)` can dispatch, so the two ways of collecting a failure
disagree:

```
[(1 / 0)]                => [$!.division-by-zero /]
[] (1 / 0)               => $!.division-by-zero /
```

The literal reaches `called_by` through `FrameArray.in` → `array_eval`; the
reduce never gets there. a13 §7 records this seam accurately and treats it as an
obstacle to a handler inspecting a failure. Read the other way it is the design
showing through: the frame asked the receiver, and the evaluator answered first.

The `called_by` comment says preempting a collect "would drop the refusal and
let the reduce answer as though nothing had gone wrong." The reduce preempts the
collect, three files away, and the comment is describing its own caller.

One more baseline fact sharpens it. An aggregate **already collects a note**
through the reduce, because a note is not `is.error`:

```
[] nope-name             => [$!.name-missing “$:Frame.31.nope-name”;]
[] (1 / 0)               => $!.division-by-zero /
```

So the aggregate is willing, the failure is willing, and the refusal is the
evaluator's alone.

## 3. What each of the reduce's two checks actually costs

The reduce carries two failure checks. They are usually described together, as
one invariant. They are not one invariant, they do not cost the same thing, and
**neither is pinned by any test.**

```ts
// A failed term is the result of the expression. In particular, a
// missing dot-parameter read must not be replaced by the operator or
// operand that follows it.
if (sum.isFailedResult()) return sum; // :87  the accumulator

const value = item.in(scope);
if (value.is.error === true) return value; // :90  the term
```

Each was removed on its own, the suite and both doctest harnesses run, and the
edit reverted. Both experiments are green:

```
ok | 71 passed (1085 steps) | 0 failed | 4 ignored (4 steps) (1s)
$=.test-summary “HCTest”; .n “{"total":47,"pass":47,"fail":0,"unimplemented":0}”;
```

That is the first result, and it is about the test suite rather than about
errors: a13 §4 calls the propagation rule "one centralized, auditable
invariant." It is centralized and auditable. It is not audited. Every assertion
in the repository holds with either half deleted.

### 3a. The per-term check is what blocks the protocol

Dropping `:90` lets a failing term reach `sum.call(value)`, and therefore reach
`Frame.error.called_by`:

```
[] (1 / 0)               => [$!.division-by-zero /]
[1] (1 / 0)              => [1, $!.division-by-zero /]
“a” (1 / 0)              => $!.division-by-zero /
(1 / 0) “a”              => $!.division-by-zero /
(1 / 0) ? {“t”}          => $!.division-by-zero /
```

The two spellings of §2 now agree. Text is still poisoned, a failure as receiver
still answers itself, and a failure still ends a conditional — all by frame-side
dispatch rather than by evaluator fiat, and all identical to today.

**`:90` does not protect effect ordering, which is a13 §4's second objection to
touching any of this.** When the receiver declines, `called_by` answers the
failure, the failure becomes the accumulator, and `:87` stops the next term
exactly as before. The cost of removing `:90` in the default case is one extra
`call` per failing term.

### 3b. The per-term check also hides M-3's hole

One probe changes for the worse, and it is the most useful result here:

```
1 + (1 / 0)              => ()
```

Baseline answers `$!.division-by-zero /`. The curried `+` does not go through
`Frame.call`, so it never reaches `called_by`; it reaches the single numeric
gate in `lib/ops/math.ts`, which asks whether both operands are `FrameNumeric`
and returns `Frame.nil` when they are not. A failure is not a `FrameNumeric`, so
it is swallowed, silently, into nil.

This is not a new defect. It is the defect `#361` exists to fix, seen from a new
angle — and the gate already does it to the other two non-answers today, at
baseline:

```
1 + nope-name            => ()
1 + “text”               => ()
```

So **a13 §4's first objection is not a worry, it is a measurement**: the
receiver-side rule really does depend on receivers implementing it, and
operators do not. What §4 does not say, and what matters for sequencing, is that
the set of receivers that bypass `called_by` is small, enumerable, and already
has a ticket: `math.ts` has one gate, and M-3 is the change to it.

### 3c. The accumulator check is what kills the caller's half

`:87` tests `isFailedResult()`, which is true for an error **and** for any
aggregate holding one immediately (`frame.ts:465-468`). Narrowing it to
`is.error` alone — so a half-failed aggregate is still an ordinary accumulator —
revives every read that is dead today:

| source                  | baseline                     | narrowed                          |
| ----------------------- | ---------------------------- | --------------------------------- |
| `[(1 / 0)] .0`          | `[$!.division-by-zero /]`    | `$!.division-by-zero /`           |
| `[1, (1 / 0)] .0`       | `[1, $!.division-by-zero /]` | `1`                               |
| `'./nope.txt' \| [] .0` | `[$!.resource-absent …]`     | `$!.resource-absent './nope.txt'` |
| `[(1 / 0)] = [(1 / 0)]` | `[$!.division-by-zero /]`    | `<>`                              |
| `(1 / 0) “a”`           | `$!.division-by-zero /`      | `$!.division-by-zero /`           |
| `(1 / 0) ? {“t”}`       | `$!.division-by-zero /`      | `$!.division-by-zero /`           |

A bare failure as accumulator still stops everything, because `Frame.error.call`
answers itself. What changes is only the aggregate that _holds_ one.

The fourth row is the one to look at twice. Two separate `1 / 0` evaluations
build two distinct `Frame.error` objects, and the moment comparison is reachable
they answer `<>`. That is `#358`'s axis arriving at the failure family: a
failure carries no metadata, so nothing distinguishes two failures that spell
the same, and nothing distinguishes _where_ either came from.

This is recorded as a measurement, not a proposal. `isFailedResult`'s shallow
aggregate clause is load-bearing for a11: it is what makes `'./nope.txt' | []`
report itself as a failed result rather than as content, and a harness reading
that predicate still must see failure. The finding is narrower and is about
**two questions sharing one predicate** — "may this accumulate?" and "did this
fail?" — which is §7.

## 4. Every cost the spikes measured has one cause

The two spikes are thorough and their findings are not in dispute. Lined up,
they have a shape: each mechanism exists because the evaluator, not a frame,
decides what happens to the failure.

| a13 mechanism                                       | Exists because                                                                  | Receiver-side equivalent                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| §9 masking, and its identity (a13d A1–A3)           | The evaluator can re-enter the same handler from inside that handler's own body | A failure meets each receiver once, positionally. No identity to take. |
| §6a once-per-failure (a13d A6)                      | An unrecovered failure is re-offered at every enclosing reduce                  | A failure is one term of one reduce. Nothing re-offers it.             |
| §6a / §9 needing **different** identities (a13d A4) | Masking wants coarse, bookkeeping wants fine, from one notion                   | No bookkeeping.                                                        |
| §7's text `_` (a13b Q6)                             | The evaluator has to invent an argument for a call the source did not write     | The failure _is_ the argument. Double dispatch decides.                |
| The underscore ladder (a13d §6)                     | The handler body is a closure the evaluator called, so `_` counts invocations   | No synthesized invocation to count past.                               |
| §7a's four ways to decline                          | The evaluator must interpret a synthesized answer against the original          | The receiver's answer is its answer.                                   |
| §6 substituting the accumulator                     | Recovery lands mid-reduce, so "what the expression computed so far" is replaced | A receiver's scope is the term it was applied to.                      |
| a13b Q2's interpreter-global state                  | The handler runs in the closure's captured scope, not the failure's             | No out-of-band channel needed.                                         |

a13d's own summary of its safety case is the tell:

> the bound is a parse-time property of the program text, not a runtime property
> of the interpreter

That is a true and careful statement, and it is a strange thing to need. It is
needed because the evaluator invokes handlers it located dynamically. The one
sentence that follows it in a13d — "Any future in-language eval, import, or
macro expansion reopens this" — names `#301` as a dependency of an
error-handling ruling, which is a coupling worth not having.

## 5. Nil is the precedent, and the three non-answers have no ruling between them

The receiver-side story is not hypothetical in HC. It is how nil already works:

```
() (2 + 2)               => 4
() “x”                   => “x”
```

`Frame.call` answers the argument when the receiver `is.void`
(`frame.ts:244-251`), and `Frame.called_by` answers the context for the same
reason. Nil keeps folding and each receiver decides. `doc/LANGUAGE.md` states it
as a rule: "applying nil to anything other than a closure has no effect."

HC has three values that mean "no answer," and they behave three different ways
on every axis there is:

| value            | in `?` | in `:` | as receiver           | as argument to `[]`   |
| ---------------- | ------ | ------ | --------------------- | --------------------- |
| nil, `()`        | skips  | fires  | answers the argument  | never collected       |
| a note, `$!…;`   | fires  | skips  | absorbs it into `.++` | collected             |
| a failure, `$!…` | —      | —      | answers itself        | refused by the reduce |

```
() ? {“t”}               => ()
() : {“e”}               => “e”
nope-name ? {“t”}        => “t”
nope-name : {“e”}        => ()
(1 / 0) ? {“t”}          => $!.division-by-zero /

() “x”                   => “x”
nope-name “x”            => $!.name-missing “$:Frame.31.nope-name”; .++ [“x”];
(1 / 0) “x”              => $!.division-by-zero /

[1] ()                   => [1]
[] nope-name             => [$!.name-missing “$:Frame.31.nope-name”;]
[] (1 / 0)               => $!.division-by-zero /
```

A note is **truthy**, so `nope-name : {“e”}` does not run its branch. A failure
reaches neither operator. And the middle row of the receiver column is the one
that should sting: `FrameNote.call` **absorbs** what is applied to it, gathering
context into its extras (`frame-note.ts`, `addExtra`). That is a diagnostic
value implementing exactly the receiver-side protocol §1 asks about — deciding
for itself what application means — while `Frame.error.call` answers itself and
drops the argument on the floor.

Nothing in the specs rules this axis. It is three independent accidents of three
implementations, and the only one of the three that cannot be applied to
anything is the one a07 makes load-bearing for refusal.

**M-3 moves a value across that table, and the table has no rulings on it.**
`1 + “text”` is row one today and row three after `#361`. a08 §11.1 and #361
both describe the migration as being about `:` no longer firing. The table says
the change is larger than that: it is a value moving from "vanishes and folds
on" to "ends the expression," which is a statement about the fold, not about the
conditional operators. #360's framing — "what does an error mean in conditional
position" — asks about one column of one row.

## 6. Collecting opts out into something nothing can read

a13 §6a rules that collecting opts out of recovery, and argues it well: "a
program that collected chose to inspect the results itself." a13b Q5 verified
it, and a13d left it alone as settled. It is the one part of a13 that both
spikes tried to break and could not.

What no one checked is whether the program can then inspect them. It cannot:

```
[(1 / 0)] .0             => [$!.division-by-zero /]
[(1 / 0)] & {“got ” _}   => [$!.division-by-zero /]
[(1 / 0)] = [(1 / 0)]    => [$!.division-by-zero /]
```

In all three the array is the answer and the operation never ran, because the
array `isFailedResult()` and `:87` stops the reduce at the next term. You may
read an index out of an aggregate holding a failure only if the failure is two
deep, and then only once, because what you get back is itself a failed
accumulator.

So the opt-out hands the program an array it chose, and then refuses it every
verb. a13 §6a notes the mechanism in passing — "the array stops the accumulator
on the next term" — and files it as "This design changes nothing there." True,
and the reason it can be filed that way is that a13 is a design about recovery,
not about failures as values. The question in §1 does not get to file it: if the
answer to "what may be applied to a collected failure" is "nothing," then a11's
collectable refusal is a write-only channel, and a07 §6's claim that a refusal
"composes: callers can handle it" is half true. Iterators collect it. Callers
cannot handle it.

## 7. Asking it forces a failure to become a frame

The question cannot be answered while a failure is not a value the language can
talk about, and today it is not:

- **`Frame.error` is an anonymous class over a string** (`frame.ts:110-137`),
  constructed fresh per call site, with no class name, no key, and no structure.
  Everything a program could branch on is inside `toString()`.
- **There is no source syntax.** A failure cannot be written, constructed, or
  matched. `FrameNote`, by contrast, is a real class with a `LABELS` vocabulary
  table, a `where` recording origin, extras it accumulates, and a `call` that
  absorbs what is applied to it (§5). The diagnostic family is first class; the
  refusal family, which a07 makes load-bearing for security, is a string.
- **The vocabulary is not one family.** Around seventy `Frame.error(…)` call
  sites in `lib/` spell it three ways: `$!.name arg` for most,
  `$error{$is-constant .key}` in `frame-symbol.ts`, and
  `$!invalid-argument-list` with no dot in `frame-lazy.ts`. a13 already lists
  this as open; a13b Q6 measured the consequence, which is that reading a
  refusal's name took three regexes, an unwrap, and a fallthrough.
- **Exactly one site treats the name as data.** `frame-resource.ts:244` builds
  `$!.${reason} …` from a reason it was handed. Everywhere else the name is a
  literal baked into a template string.

a13 §7's ruling — hand the handler the reason as text — is a way of working
around this rather than a position on it, and a13 says so honestly ("a
homoiconicity concession"). The concession is smaller than it looks once the
cause is named: the handler gets text because there is no frame to get. In a
language whose thesis is that code and data share one representation, the value
that reports what went wrong is the one value with no representation.

This is also where `#358` arrives, and the order matters. `#358` is that
equality conflates frames carrying no metadata; a failure carries none at all,
so every two failures are candidates for it. That defect is invisible today only
because `:87` stops the comparison before it happens (§3c) — narrow the check
and `[(1 / 0)] = [(1 / 0)]` answers `<>`. So `#358` is not a separate cleanup
that happens to be nearby: it is the first thing a program would meet on the day
failures became comparable, and any answer to §1 has to arrive with one.

## 8. What the question would collapse

Three of a13's open items are one decision under this framing:

- **Whether `_` is the text or the failure** (§7, and "Noted"). Becomes: what
  does a failure answer when a receiver is applied to it?
- **Whether the refusal vocabulary is one family** ("Noted"). Becomes: what is a
  failure frame's structure?
- **Whether refusal names are a legitimate discrimination channel** (a07 §7, a12
  "Noted"). Becomes: which of that structure is visible to a program, and which
  only to the exported note — which is the split a07 §7 already implies.

And three tickets change shape rather than waiting:

- **#360's literal question becomes one row.** `?` and `:` are receivers, so
  "what does an error mean in conditional position" is "what do `IfThen` and
  `IfElse` answer to a failure," asked the same way it would be asked of `+` or
  of `[]`. This contradicts a13 §3 and §11, which are built on never touching
  `lib/ops/conditionals.ts` — deliberately, and the contradiction is the point
  of recording it.
- **#361's migration is decided per receiver.** Today it is one global question
  about whether `:` fires. Per receiver it is the same question `math.ts`
  already has to answer for `nope-name` and `“text”`, which §3b shows is
  unanswered for all three.
- **#375 is this question for accumulators.** "What must a class answer to work
  as a reduce accumulator" and "what must a receiver answer to take a failure"
  are the same protocol question about the same fold.

## 9. What it costs, honestly

**a13's mechanism works, and nothing here shows otherwise.** 38 corpus examples,
41 test steps, every attack in a13c bounded, a measured linear cost. This
document is a claim about where the costs come from, not a defect report.

Four costs the framing owes, two of them real:

1. **Operators must implement the protocol, and today they silently do not.**
   §3b is the demonstration: `1 + (1 / 0)` answers `()` the moment the evaluator
   stops intervening. a13 §4 predicted exactly this and called it inverting a
   centralized invariant into a distributed convention. It is bounded — one gate
   in `math.ts`, already ticketed as M-3 — but it is real work and it must land
   before, not after.
2. **Terms after a failure would evaluate, where a receiver answers.** The fold
   would run side effects that today it skips. §3a shows `:90` is not what
   protects this and `:87` is, so the cost is narrower than a13 §4's version of
   it, but it is a ruling to make and `()` is the only precedent for making it.
3. **The dynamic property is given up.** a13's handler answers for failures in
   code the declaring scope never wrote, including inside helpers. A receiver
   only meets the failure that reaches it. a13 §8 already concluded that
   discrimination is positional and that a fanned-out body is "silently wrong,"
   so most of what is lost is something a13 had argued against relying on — but
   "recover anything beneath this point" would have no spelling at all.
4. **It is more work than a13.** a13 is a lookup and a guard. This is a
   protocol, a frame type, and a vocabulary. That is a reason to sequence it,
   not a reason to answer the narrower question first and inherit the shape.

## Noted, not resolved here

- **Whether `?` and `:` should answer a failure at all**, or stay two-valued
  with the failure ending the reduce as it does today. §5's table is the input
  to that and does not decide it.
- **What a failure frame would be.** A `FrameError` peer to `FrameNote`, with
  the reason as a key rather than a substring, is the obvious shape and is not
  argued here. §7 establishes only that the question is upstream of a13 §7's
  ruling.
- **Whether `isFailedResult`'s two callers want the same predicate.** §3c
  separates "may this accumulate?" from "did this fail?" and shows they disagree
  on a half-failed aggregate. a11's shallow rule is right for the second;
  nothing here says what the first should be.
- **Whether the collecting opt-out survives.** §6 shows it currently opts out
  into an unreadable value. If reading is fixed, a13 §6a's argument for the
  opt-out gets stronger rather than weaker, because inspecting the results
  becomes something a program can actually do.
- **The order against M-3.** §3b makes `#361` a prerequisite of the
  receiver-side framing rather than a consumer of it, which inverts the
  dependency recorded on #360 and #361. If that inversion is right, #361 is
  unblocked and should be re-sequenced; if it is wrong, the reason should be
  written down here.
- **Whether this is worth reopening at all.** a13 is implementable today and
  this is a question. The case for asking it now is that a13's rulings are
  proposals, not that they are wrong.
