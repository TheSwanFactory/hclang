# Error Handling: A Parent-Scope Recovery Property

**Status:** Proposed. Not implemented — design points only, no code.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360) (this
design). Blocks [#361](https://github.com/TheSwanFactory/hclang/issues/361)
(M-3, via [`a08`](a08-rationalizing-numbers.md) §11.1, T-4).\
**Tutorial:** [`cli/hc/exception-tutorial.md`](../cli/hc/exception-tutorial.md)
describes the result as if it had shipped.\
**Spike:** [`a13a`](a13a-recovery-spike.md) is the brief for proving the
mechanism before any of the proposed rulings below are ratified.

## 1. Why this is needed at all

Two independent pressures converge on the same seam, and "leave it" is not free
for either:

- **#361 (M-3)** turns ten numeric fallbacks in `lib/ops/math.ts` from `nil`
  into error frames. `(1 + "text") : {"else"}` runs today because the result is
  nil, an ordinary falsy value. Once the result is an error instead, `:` stops
  firing — silently, with no error of its own — because an error is not nil.
  Every program using `:` as a fallback-on-failed-computation idiom changes
  behavior the day M-3 ships, unless something is decided.
- **a07/a10's resource track** already ships refusals — unbound scheme, path
  outside root, exhausted budget — as ordinary error values. There is currently
  no way to recover from one in a program: "try to read this, fall back to a
  default if it's refused" cannot be written, because asking "did this fail?" at
  all is itself a term subject to the same propagation rule that made the
  failure terminal in the first place.

## 2. Failure is a permanent property of a value, not a transient state

This is the mechanical fact the rest of the design has to respect, and it is
stronger than "an expression stops when something goes wrong."

`Frame.error` sets `is.error` **once, on the frame object**
(`lib/frames/frame.ts`, immediately after the class expression), and
`isFailedResult` reads that same flag plus one shallow level of aggregate
contents. Nothing anywhere distinguishes _a term that just failed_ from _a value
that happens to be a failure_. They are the same object answering the same
question.

`FrameExpr.evaluateTerms` (`lib/frames/frame-expr.ts`) is the single
left-to-right reduce every expression goes through — arithmetic, function calls,
and the conditional operators alike — and it asks that question twice per term:

- Before evaluating a term, whether the accumulator has already failed. If so,
  no further term in the list is evaluated at all.
- After evaluating a term, whether the **value** is an error. If so, the reduce
  returns it immediately, without reaching the apply-to-accumulator step that
  would otherwise hand it to whatever operator was waiting.

Because the flag is intrinsic, the second check fires on any term that
_evaluates to_ a failure, including a bare read of a name bound to one. Reading
a variable that holds a failure ends the expression that read it, at whatever
position the read occurred. That is the fact §7 turns on.

Nothing about `?` and `:` is special-cased in the parser or evaluator — they are
ordinary operator symbols (`lib/ops.ts`) dispatched through that same reduce. So
the reason an error never reaches a conditional operator is not that the
conditional operators reject it; it's that the reduce never gets that far.

## 3. Key reframing: recovery does not require touching `?` or `:`

The original issue treats "what does an error mean in conditional position" and
"how do we detect one" as one question, because `IfThen`/`IfElse`'s own truthy
tests already encode an answer (an error is truthy today) that is the wrong one
— just unreachable.

This design does not reconcile that encoding, and does not need to. Recovery
happens entirely inside the reduce, upstream of any operator dispatch. A term
that gets recovered never becomes an error by the time an operator sees it. A
term that isn't recovered stays exactly as terminal, and exactly as unreachable
to `?`/`:`, as it is today. `IfThen`/`IfElse` never learn anything about errors
under this design — the question of what they'd do with one stays permanently
moot rather than answered.

## 4. Rejected alternatives, and why

- **Bare `$` as a new ternary leg.** Already claimed: bare `$` is
  `FrameScopeAnchor`'s file-scope anchor, `$$` is its host-scope anchor
  (`lib/frames/frame-scope-anchor.ts`). Not available to repurpose.
- **`::` as a new ternary leg.** Free as a token — operator characters lex by
  maximal munch, and `lib/ops.ts` only registers `:` and `?` — but it doesn't
  fix reachability. `?`/`:`/`::` would still be ordinary operators dispatched
  through the same reduce, so the condition operand would still be swallowed
  before any of the three ever got invoked.
- **Removing the reduce's short-circuit entirely.** Considered and rejected as
  the wrong direction: it inverts one centralized, auditable invariant ("an
  operation on an error is an error") into a distributed convention every
  operator implementation — every arithmetic op, every string op, every iterator
  — would have to reimplement correctly on its own. It also removes the "stop
  evaluating later terms" property that effect ordering for resource reads and
  writes currently depends on: without it, a term after a failed one would still
  run, side effects included.
- **Making the conditional's own condition operand lazy**, so `?`/`:`/`::` force
  it themselves instead of the reduce forcing it first. This does fix
  reachability without new lookup machinery, but it changes how conditional
  operators receive their operands — a change to evaluation order and timing,
  not just to what's visible. Rejected as a deeper cut into the language's
  evaluation model than the problem calls for.

## 5. The chosen shape: a reserved recovery property, `.$:`

A handler is an ordinary named property, not new evaluation machinery and not a
new leg of the ternary:

- The reserved key is `.$:`. Setting it on a frame declares that frame's scope
  as one a failing term below it can recover through.
- Lookup is the same mechanism any other name already uses — the layered lookup
  chain a nested expression accumulates as it descends
  (`EvaluationScope.withLayer`), continuing through declared parents and lexical
  `up` exactly as `MetaFrame.get` already does for any property. No new field on
  `EvaluationScope` and no new traversal are needed.
- The search starts in the scope enclosing the failing term — the parent scope,
  not the failing expression manufacturing its own escape hatch — and walks
  outward from there. The nearest declared `.$:` wins, the same way any other
  name would shadow an outer one of the same spelling.

## 6. Substitute-and-continue semantics

When the reduce's per-term check sees an error where it previously would have
returned immediately, it does one lookup instead:

- Resolve `.$:` from the enclosing scope. If nothing resolves, fall back to
  today's behavior exactly — return the error, terminal, no change for any
  program that never declares a handler.
- If something resolves, call it. What it is called _with_ is §7.
- If the handler answers an ordinary value, treat that answer as the value the
  failing term would have produced, and resume the reduce's ordinary per-term
  logic from there — the same operator-combination step that runs for any
  successful term. From the rest of the expression's point of view, the term
  simply produced the recovered value.
- If the handler answers nil or an error, it has declined: propagate, exactly as
  if no handler had been declared. §7a rules the nil case and §9 rules which
  error survives.

**Collecting opts out of recovery, and should.** A reduce into an aggregate
never reaches this path: `Frame.reduceInto` calls the accumulator directly, so a
refusal meets the error's own `called_by` and its `context.collects()` branch,
and the array holds it as an ordinary element. The expression's value is then a
well-formed array, not an error, so the per-term check never fires and no
handler is consulted. `'./missing.txt' | []` answers `[$!.resource-absent …]`
with or without a `.$:` in scope, while `'./missing.txt' | “”` propagates and
recovers, because text joins rather than collects.

That asymmetry is the right one. Collecting is already declared not to be an
operation on the value, and a program that collected chose to inspect the
results itself; a handler firing there would overrule a decision the author
already made. Worth stating because the two spellings differ by one seed and
land in different regimes.

Note also that such an array is half-failed by the existing rules:
`isFailedResult` sees the error one level down, so the array stops the
_accumulator_ on the next term even though it never triggered the per-term error
check itself. This design changes nothing there.

The other existing check — stop evaluating later terms once the accumulated
result has already failed for good — is unchanged. Recovery is attempted exactly
once, at the moment a term first fails; it is not retried term by term
afterward.

## 7. A handler cannot be handed the failure and still be useful

The obvious shape — call the handler with the error frame as its argument, and
let it inspect what it caught — **does not work**, and §2 is why.

If `_` is bound to the failure, then reading `_` inside the handler's body is a
term that evaluates to a failure, so the handler's own reduce ends right there
and answers the failure unchanged. This holds at every position: `_` alone
answers it, `“caught: ” _` answers it and discards the text, `_ .reason` answers
it without ever dispatching the property read. A handler handed the failure can
do exactly two things — return it, or ignore it entirely and answer something
built from no part of it. There is no third move.

The obvious workaround fails too, for a reason worth recording. Aggregates _do_
hold errors as ordinary elements, but that seam lives outside the reduce, in
exactly two places: array literal construction (`FrameArray.in` → `array_eval`)
and `Frame.reduceInto`, which calls the accumulator directly with no error check
and so reaches the error's own `called_by` override and its `context.collects()`
branch. Inside `evaluateTerms` the per-term check preempts the apply step that
would reach that same override. So `[] _` inside a handler body does not stash
the failure in an array; it answers the failure, like everything else.

**Proposed ruling: the handler receives the reason as text, not the failure.**

`_` is the refusal **name**, as ordinary text, in the `$!.…` vocabulary without
the sigil — `“division-by-zero”`, `“resource-absent”`. `resource-reference.ts`
already names its refusals exactly that way, so this is the existing vocabulary
reaching source rather than a new one.

Because text is not an error, every ordinary operation works on it: comparison,
message building, matching. No carve-out in the propagation rule is needed, no
inspection predicate has to exist, and §2 stays true as written. The cost is
that `_` is a _description_ of the failure rather than the failure, which is a
homoiconicity concession and is argued as one in the closing notes.

The simple cases never mention `_` at all — a handler answering `0` or
`“(defaults)”` is unchanged. The text only buys back the expressiveness §2 takes
away.

## 7a. Declining: a falsy answer propagates the original

A handler is not obliged to answer for every failure it sees, and the spelling
for that has to survive HC's actual conditional composition. It does not compose
as C's ternary: `5.> 1 ? {100} : {10}` answers `()`, because `:` tests the
**then-branch's result**, not the original condition (`cli/hc/testdoc.hc` pins
this). A partial handler written with `?` alone therefore answers nil whenever
its test misses.

**Proposed ruling: nil declines.** A handler answering nil propagates the
original failure, exactly as if no handler had been declared.

That makes the natural spelling the working one:

> `.$: {_ = “resource-absent” ? {“(defaults)”}}`

recovers a missing resource and declines everything else, using nothing but the
one operator that composes. Answering an error declines for the same reason
(§2), and §9 rules that a handler failing on its own does too, so all three
paths converge on one outcome.

The price is that a handler cannot deliberately recover **to** nil. That is
acceptable, and arguably correct: M-3 exists precisely to stop nil from meaning
failure, and letting a handler re-appoint it as a recovery value would walk that
back.

## 8. Discrimination is positional, not predicative

Because a handler cannot ask "which failure is this?" without the text from §7,
and because the text answer is a proposal rather than a settled ruling, the axis
this design actually guarantees is **where you declare `.$:`**, not what a
handler tests at runtime.

A narrower scope wrapping one operation you expect to fail in one way is the
idiomatic shape: the handler answers for that operation and nothing else, and
every other failure keeps going outward to whoever encloses it. This is a
property worth stating rather than an accident — it matches how the rest of the
language prefers a declaration to a runtime junction, and it stays true whether
or not §7 is adopted.

§7a's conditional finding reinforces this. Because a full `? … : …` chain does
not compose as if/then/else, a handler that tries to fan out over several
reasons in one body fights the language, while several `.$:` declarations at the
scopes that care each stay a single `?`. Where the recovery is declared carries
the discrimination that a predicate would otherwise have to.

## 9. Hazard: a handler must not catch its own failure

A `.$:` handler is ordinary HC code, evaluated through the same `FrameExpr`
machinery as anything else. If its own body fails, and it resolves `.$:` from
the same enclosing scope that declared it, it could find itself and recurse into
itself forever trying to recover from its own failure.

This needs an explicit rule, not an implicit one: while a given `.$:` handler is
running, that binding must not be available to catch a failure raised during its
own execution — the same rule ordinary try/catch designs use so a catch block
isn't wrapped by its own handler. Left open: whether the masking is scoped to
that exact handler value, or to every `.$:` visible from inside the handler's
own call.

**Proposed ruling on which failure survives: the original, not the handler's.**
A handler that fails on its own — a division by zero in the recovery path, a
missing name — is broken diagnostic machinery, and replacing the real failure
with a secondary one from the code meant to explain it loses the only
information the program had. The handler's own failure is therefore discarded
rather than substituted. This also collapses cleanly into §7a: answering nil,
answering an error, and failing outright all propagate the original, so a
handler has one way to succeed and no way to make things worse.

## 10. Syntax: `$:` is not valid source today

`$` is governed by the dollar family's recognizer
(`lib/frames/frame-scope-anchor.ts`), which only accepts specific continuation
characters after a leading `$`: `!`, `+`, `-`, `~`, `=`, `>`, and `<` (for
`<>`). `:` is not one of them. As things stand, `.$: {…}` does not lex as one
atomic property-name token — it lexes as `.` followed by a complete bare `$`
(the file-scope anchor) followed by a separate `:` operator token. The two are
indistinguishable from today's grammar without a lexer change.

Making `$:` denote one thing requires whitelisting `:` as an accepted
continuation in that same family — the family that already owns `$!`, `$+`,
`$-`, `$~`, `$=`, `$>` as diagnostic-note spellings (`name-missing`,
`test-pass`, `test-fail`, `test-unimplemented`, `test-summary`,
`bounds-exceeded`). Open question, not settled here: whether a recovery handler
belongs in that same family conceptually, or whether riding the note family is
only because `$` was the character already associated with errors in the printed
form of `Frame.error` values — which is a coincidence of string formatting, not
a shared meaning with the note family it would be joining.

## 11. What does not change

- `IfThen`/`IfElse` (`lib/ops/conditionals.ts`) are untouched. See §3.
- `Frame.error`'s own behavior is untouched — its `call` still answers itself,
  and its `called_by` still lets a collecting aggregate hold it. This design is
  entirely about what the reduce does with a term before that term becomes part
  of the accumulator, not about redefining what an error frame does once it is
  one.
- No third leg is added to the ternary, and `?:` gains no new arity. The earlier
  idea of a `::`-spelled branch attached syntactically to `a ? {…} : {…}` is
  superseded by this design: `.$:` is a freestanding property, scoped to
  wherever it's declared, independent of any particular conditional expression.

## 12. Relationship to #361 / M-3

This does not automatically preserve `(1 + "text") : {"else"}`-style fallback
idioms once M-3 ships. That idiom relied on the result being nil, which `:`
already tests for; under this design, a program that wants equivalent fallback
behavior for a computation that now produces an error must declare `.$:`
explicitly. The old behavior was implicit and free; the new equivalent is opt-in
and requires a source change. Whether that migration cost is acceptable, or
whether M-3 needs additional bridging, is not resolved here.

## Noted, not resolved here

- **Whether handing over text is the right shape.** It buys expressiveness with
  no carve-out in the propagation rule, but it makes `_` a _description_ of the
  failure rather than the failure, which is a homoiconicity concession and
  should be argued on those terms. The alternative is the carve-out #360
  sketched as option 4 — an inspection that does not propagate — which keeps `_`
  the value at the cost of the one exception this design was shaped to avoid. A
  third shape, not pursued here, hands the failure itself through the dot
  parameter alongside the text; `EvaluationScope.call` has both slots free, so
  it stays available if a use for the value itself appears.
- **Whether the refusal vocabulary is stable enough to match against.** §7 makes
  refusal names a program-visible discrimination channel, which is exactly the
  question a07 §7 left open and [`a12`](a12-resource-frames.md) records as
  unresolved: whether an ungranted resource may say _why_ it refused. Whatever a
  program can read here is exactly what it can branch on, so the two questions
  have to be answered together — and any split where the program sees one
  spelling and the exported note carries the reason would narrow what a handler
  can discriminate.
- **Recovering to nil is unspellable** under §7a, by construction. Recorded in
  case a use appears that makes the trade look wrong.
- The exact masking rule that stops a handler from catching its own failure
  (§9).
- Whether `$:` is the right spelling, or whether joining the note family is the
  wrong neighborhood for what a handler means (§10).
- Whether M-3 needs migration support beyond "authors add `.$:` wherever they
  relied on the old nil fallback" (§12).
