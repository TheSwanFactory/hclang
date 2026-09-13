# Error Handling: A Parent-Scope Recovery Property

**Status:** Proposed. Not implemented — design points only, no code.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360) (this
design). Blocks [#361](https://github.com/TheSwanFactory/hclang/issues/361)
(M-3, via [`a08`](a08-rationalizing-numbers.md) §11.1, T-4).\
**Tutorial:** [`cli/hc/exception-tutorial.md`](../cli/hc/exception-tutorial.md)
describes the result as if it had shipped.\
**Spikes:** [`a13a`](a13a-recovery-spike.md) is the first brief and
[`a13b`](a13b-recovery-spike-findings.md) is what it answered;
[`a13c`](a13c-masking-bound-spike.md) attacks the one ruling below whose failure
would be unsafe rather than merely wrong.\
**Revised:** One pass against the spike. The mechanism survives — parent-scope
property, ordinary lookup, substitute-and-continue, nearest-wins, and the
collecting opt-out were all confirmed by running them. What moved: §2 and §6 had
the recovery site wrong, §6a replaces a false claim that recovery happens once,
§5 withdraws a boundary it could not enforce, §9 gained a case it had missed,
and §7 gained the spelling that makes discrimination work. Every rewritten claim
is marked where it sits, so a reader can tell a correction from an original. The
rulings below are still proposals.

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
and the conditional operators alike. It carries two failure checks, and **both
inspect values that already exist**:

- Before evaluating a term, whether the accumulator has already failed. If so,
  no further term in the list is evaluated at all.
- After evaluating a term, whether the **value** is an error. If so, the term's
  value becomes the accumulator without reaching the apply step.

Because the flag is intrinsic, the second check fires on any term that
_evaluates to_ a failure, including a bare read of a name bound to one. Reading
a variable that holds a failure ends the expression that read it, at whatever
position the read occurred. That is the fact §7 turns on.

**Neither check sees where failures are made.** A term evaluates to a failure
only when it is a parenthesized subexpression or a name already bound to one.
The commonest failing expression in the language does not qualify: `1 / 0` fails
at `sum.call(value)`, the combination step, where the curried divide meets its
second operand — and nothing inspects the result of that step at all. `(1 / 0)`
trips the per-term check; `1 / 0` never does. The spike
([`a13b`](a13b-recovery-spike-findings.md) Q1) measured the gap: with recovery
wired only at the per-term check, 14 of the 36 corpus examples it reaches fail,
including every arithmetic failure and every resource read.

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
  `up` exactly as `MetaFrame.get` already does for any property. The lookup
  itself needs no new field and no new traversal, and the spike confirmed it: an
  undeclared handler answers a `FrameNote`, not an error, so there is no
  re-entry to guard and a program that declares none is bit-for-bit unchanged.
- The search runs from the failing term's own scope and walks outward. The
  nearest declared `.$:` wins, the same way any other name would shadow an outer
  one of the same spelling.

Two things an earlier draft of this section claimed, corrected by
[`a13b`](a13b-recovery-spike-findings.md):

- **A frame may recover its own terms.** This document used to say the search
  starts in the parent scope, "not the failing expression manufacturing its own
  escape hatch." With ordinary lookup that is simply not what happens —
  `[.$: {0}, 1 / 0]` answers `[.$: {0}; 0]`, recovering a term of itself. The
  claim is withdrawn rather than enforced: an aggregate declaring how its own
  elements recover is reasonable, and excluding the current scope would need a
  rule this design would then have to justify.
- **The masking of §9 cannot live on `EvaluationScope`.** A handler's body runs
  in a scope derived from the closure's own capture, and the failing term's
  scope is not in that chain, so nothing set there is visible inside the
  handler. Masking needs interpreter-global state. Only the _lookup_ is free.

## 6. Substitute-and-continue semantics

**The primary site is the combination step**, `sum.call(value)`, because §2 is
where failures are made. When that step answers an error, the reduce resolves
`.$:` and offers it the failure:

- If nothing resolves, fall back to today's behavior exactly — the failure
  becomes the accumulator, terminal, no change for any program that never
  declares a handler.
- If something resolves, call it. What it is called _with_ is §7.
- If the handler answers an ordinary value, **that answer replaces the
  accumulator** and the reduce carries on with it. Note the difference from the
  per-term case: at the combination step there is no "term's value" left to
  substitute for, because the term has already been combined. The recovered
  value is what the expression has computed so far, not what one term produced.
- If the handler answers nil or an error, it has declined: propagate, exactly as
  if no handler had been declared. §7a rules the nil case and §9 rules which
  error survives.

**The per-term check keeps a lookup too**, because a value that is already a
failure can arrive as a term without any combination — a visibility refusal
returned by `FrameSymbol.in`, for instance. The spike found no example that the
combination step misses and the per-term check catches, and says so plainly: a
search that came up empty rather than a proof. Both stay wired until one is
shown to be dead.

**The other two boundaries are not needed.** `evaluateBody` (`frame-expr.ts:62`)
has nothing left to recover, because a statement whose own reduce recovered no
longer fails; wiring it instead of the combination step recovers closure bodies
and nothing else, since file-scope statements are an aggregate reduce rather
than a body sequence. `bound-method.ts:100` likewise, and it additionally has no
`EvaluationScope` to look up from.

### 6a. A failure is offered to each handler once

An earlier draft said recovery is "attempted exactly once, at the moment a term
first fails." That is false as observed: an unrecovered failure is offered again
at every enclosing reduce it passes through, and each offer **re-runs the
handler body** — four times for `(1 / 0)`, five for `((1 / 0) + 5)`. Handler
bodies are ordinary HC that may write resources, so the repetition is
semantically visible, not a wasted cycle.

The repetition is not the same thing as bubbling, and only one of them is
wanted. §7a's story — a declining handler passes the failure outward to whoever
encloses it — requires that _different_ handlers each get a look. What nothing
requires is that the _same_ handler be asked four times about the same failure.

**Proposed ruling: a failure is offered to each distinct handler at most once.**
Identity is the closure template, the same notion §9's masking needs, because
`FrameSymbol.in` hands out a fresh bound copy per read. A handler that declines
is not re-consulted as its failure rises; an enclosing handler that has not yet
seen that failure still gets its single look. Recovery then costs one handler
call per handler, and the bubbling in §7a keeps working.

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

**Inside a branch the reason is `__`, not `_`, and getting it wrong fails
silently.** `_` names the innermost invocation's argument, and a conditional
branch is an invocation — `IfThen` and `IfElse` call it with nil. So
`{_ = “division-by-zero” ? {“saw ” _}}` answers `“saw ”`: the test matched, the
branch ran, and the reason was replaced by the branch's own empty argument with
no refusal raised. The outward spelling reaches past it, and `EvaluationScope`
already resolves it:

> `.$: {_ = “division-by-zero” ? {“saw ” __}}` answers `“saw division-by-zero”`

This is not specific to recovery or to conditionals — any closure invoked with
nil shadows an enclosing `_` the same way, and a named binding made before the
test works equally well. It is recorded here because a handler that both tests
the reason and reports it is the shape most likely to meet it, and because
[`a13b`](a13b-recovery-spike-findings.md) Q6 concluded from the `_` spelling
alone that the reason was unreachable inside a branch. It is reachable; the
spelling is `__`.

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

§7a's conditional finding reinforces this, and the spike showed it is stronger
than "fights the language." A body fanning out over two reasons,
`{_ = “a” ? {x} : {_ = “b” ? {y}}}`, **declines on both inputs**. On the hit,
`?` answers and the trailing `:` sees a truthy source, so `:` nils it. On the
miss, the `:` branch runs but needs `__` to see the reason at all (§7). Fix the
spelling and the miss works; the hit is still nil, because that half is the
composition rule and no spelling repairs it.

So a multi-reason handler in one body is not awkward, it is **silently wrong**,
and that is not a style preference but the reason the positional shape is the
one to reach for. Several `.$:` declarations at the scopes that care each stay a
single `?`, and where the recovery is declared carries the discrimination a
predicate cannot.

## 9. Hazard: a handler must not catch its own failure

A `.$:` handler is ordinary HC code, evaluated through the same `FrameExpr`
machinery as anything else. If its own body fails, and it resolves `.$:` from
the same enclosing scope that declared it, it could find itself and recurse into
itself forever trying to recover from its own failure.

This needs an explicit rule, not an implicit one: while a given `.$:` handler is
running, that binding must not be available to catch a failure raised during its
own execution — the same rule ordinary try/catch designs use so a catch block
isn't wrapped by its own handler. The spike confirmed the hazard is real —
unmasked, it exhausts the stack — and that both candidate rules stop it.

**Proposed ruling: mask the handler, not the key.** The two are not
interchangeable, and the one that sounds safer is the worse one. Masking every
`.$:` visible from inside the handler makes any recovery declared within a
handler body — or within any helper it happens to call, whose author cannot see
it coming — into dead code. Masking only the running handler keeps those working
and still terminates.

Two caveats belong with that ruling. "The running handler" cannot mean the value
the scope answered: `FrameSymbol.in` hands out a fresh bound copy on every read,
so identity has to be taken against the shared closure template. And the
termination argument — that depth is bounded by the number of distinct
templates, each masked while it runs — was measured once rather than proved.
**That bound is the whole safety case for this ruling, and deserves an
adversarial attempt before it is ratified.**

**Proposed ruling on which failure survives: the original, not the handler's.**
A handler that fails on its own — a division by zero in the recovery path — is
broken diagnostic machinery, and replacing the real failure with a secondary one
from the code meant to explain it loses the only information the program had.
The handler's own failure is therefore discarded rather than substituted.

**A note declines, because otherwise it wins.** This section used to name "a
missing name" as an example of the case above, and the rule did not reach it: a
missing name is a `FrameNote` carrying `is.note` and no `is.error`, so it is
neither nil nor a failure, and it counts as a successful answer.
`{.$: {nope-name}; 1 / 0}` answers `$!.name-missing …` — the real refusal
replaced by a note about the broken recovery code, precisely the outcome this
section exists to prevent. A note therefore declines too.

So a handler has one way to succeed — answering an ordinary value — and four
ways to decline: nil, an error, a note, or failing outright. All four leave the
original failure standing, and none of them can make things worse.

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

- `IfThen`/`IfElse` (`lib/ops/conditionals.ts`) are untouched. See §3. The spike
  reached this conclusion the other way and then doubted it, on the grounds that
  a handler's discrimination depends on how a branch receives its argument. It
  does not: `__` already reaches the reason (§7), so nothing in
  `conditionals.ts` has to move for recovery to work, and neither operator is
  ever handed an error — a recovered term is ordinary by the time an operator
  sees it, and an unrecovered one still ends the reduce. §3 survives intact.
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
- **Recovering to nil is unspellable** under §7a, by construction, and a note
  and an error are unspellable answers for the same reason (§9). Recorded in
  case a use appears that makes the trade look wrong.
- **The termination bound for §9's masking ruling.** Depth is bounded by the
  number of distinct handler templates only if each is genuinely masked for the
  whole of its own call, and only if that set cannot grow at runtime. Measured
  once; not proved. This is the one open item that can make the design unsafe
  rather than merely awkward, and [`a13c`](a13c-masking-bound-spike.md) is the
  brief for attacking it.
- **Whether the refusal vocabulary is one family.** §7 says `_` is "the `$!.…`
  vocabulary without the sigil", and two of the trusted base's own spellings are
  not: `$error{$is-constant …}` and `$!invalid-argument-list …`, the latter in
  the family but carrying no dot. Naming a refusal took three patterns and an
  unwrap rather than a slice. Either the vocabulary is regularized or §7 admits
  that the name is computed, not read off.
- **How much repetition §6a's ruling actually removes.** The once-per-handler
  rule is proposed against measured behavior but has not been built; the
  interaction between it and §9's masking, which share one notion of handler
  identity, is the first thing an implementation should pin.
- Whether `$:` is the right spelling, or whether joining the note family is the
  wrong neighborhood for what a handler means (§10).
- Whether M-3 needs migration support beyond "authors add `.$:` wherever they
  relied on the old nil fallback" (§12).
