# Error Handling: A Parent-Scope Recovery Property

**Status:** Proposed. Not implemented — design points only, no code.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360) (this
design). Blocks [#361](https://github.com/TheSwanFactory/hclang/issues/361)
(M-3, via [`a08`](a08-rationalizing-numbers.md) §11.1, T-4).

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
  default if it's refused" cannot be written, because asking "did this fail?"
  at all is itself a term subject to the same propagation rule that made the
  failure terminal in the first place.

## 2. Errors are terminal because of one generic fold, not a special rule

`FrameExpr.evaluateTerms` (`lib/frames/frame-expr.ts`) is the single left-to-right
reduce every expression in the language goes through — arithmetic, function
calls, and the conditional operators alike. Two checks inside it are what make
errors terminal:

- Once the accumulated result of a term list has already failed, no further
  term in that list is even evaluated.
- The instant a freshly evaluated term is itself an error, the whole reduce
  returns that error immediately, without ever calling the generic
  apply-to-accumulator step that would otherwise hand it to whatever operator
  was waiting for it.

Nothing about `?` and `:` is special-cased in the parser or evaluator — they are
ordinary operator symbols (`lib/ops.ts`) dispatched through that same generic
step. So the reason an error never reaches a conditional operator is not that
the conditional operators reject it; it's that the fold never gets that far.

## 3. Key reframing: recovery does not require touching `?` or `:`

The original issue treats "what does an error mean in conditional position" and
"how do we detect one" as one question, because `IfThen`/`IfElse`'s own truthy
tests already encode an answer (an error is truthy today) that is the wrong one
— just unreachable.

This design does not reconcile that encoding, and does not need to. Recovery
happens entirely inside the generic fold, upstream of any operator dispatch. A
term that gets recovered never becomes an error by the time an operator sees
it. A term that isn't recovered stays exactly as terminal, and exactly as
unreachable to `?`/`:`, as it is today. `IfThen`/`IfElse` never learn anything
about errors under this design — the question of what they'd do with one stays
permanently moot rather than answered.

## 4. Rejected alternatives, and why

- **Bare `$` as a new ternary leg.** Already claimed: bare `$` is
  `FrameScopeAnchor`'s file-scope anchor, `$$` is its host-scope anchor
  (`lib/frames/frame-scope-anchor.ts`). Not available to repurpose.
- **`::` as a new ternary leg.** Free as a token — operator characters lex by
  maximal munch, and `lib/ops.ts` only registers `:` and `?` — but it doesn't
  fix reachability. `?`/`:`/`::` would still be ordinary operators dispatched
  through the same fold, so the condition operand would still be swallowed by
  the fold's short-circuit before any of the three ever got invoked.
- **Removing the fold's short-circuit entirely.** Considered and rejected as
  the wrong direction: it inverts one centralized, auditable invariant ("an
  operation on an error is an error") into a distributed convention every
  operator implementation — every arithmetic op, every string op, every
  iterator — would have to reimplement correctly on its own. It also removes
  the "stop evaluating later terms" property that effect ordering for resource
  reads and writes currently depends on: without it, a term after a failed one
  would still run, side effects included.
- **Making the conditional's own condition operand lazy**, so `?`/`:`/`::` force
  it themselves instead of the generic fold forcing it first. This does fix
  reachability without new lookup machinery, but it changes how conditional
  operators receive their operands — a change to evaluation order and timing,
  not just to what's visible. Rejected as a deeper cut into the language's
  evaluation model than the problem calls for.

## 5. The chosen shape: a reserved recovery property, `.$:`

A handler is an ordinary named property, not new evaluation machinery and not a
new leg of the ternary:

- The reserved key is `.$:`. Setting it on a frame declares that frame's scope
  as one a failing term below it can recover through.
- Lookup is the same mechanism any other name already uses — the layered
  lookup chain a nested expression accumulates as it descends
  (`EvaluationScope.withLayer`), continuing through declared parents and
  lexical `up` exactly as `MetaFrame.get` already does for any property. No new
  field on `EvaluationScope` and no new traversal are needed.
- The search starts in the scope enclosing the failing term — the parent scope,
  not the failing expression manufacturing its own escape hatch — and walks
  outward from there. The nearest declared `.$:` wins, the same way any other
  name would shadow an outer one of the same spelling.

## 6. Substitute-and-continue semantics

When the fold's per-term check sees an error where it previously would have
returned immediately, it does one lookup instead:

- Resolve `.$:` from the enclosing scope. If nothing resolves, fall back to
  today's behavior exactly — return the error, terminal, no change for any
  program that never declares a handler.
- If something resolves, call it with the error value as its argument. The
  error already carries its own reason as its printable/data string
  (`Frame.error`'s `source`), so a handler that wants to discriminate reasons
  can just inspect its argument — this design adds no separate "is this an
  error" or "what kind" predicate; the existing value is enough.
- If the handler's own result is not itself an error, treat that result as the
  value the failing term would have produced, and resume the fold's ordinary
  per-term logic from there — the same operator-combination step that runs for
  any successful term. From the rest of the expression's point of view, the
  term simply produced the recovered value.
- If the handler's result is itself an error, or the handler itself fails while
  running, propagate — same terminal behavior as having no handler at all.

The other existing check — stop evaluating later terms once the accumulated
result has already failed for good — is unchanged. Recovery is attempted
exactly once, at the moment a term first fails; it is not retried term by term
afterward.

## 7. Hazard: a handler must not catch its own failure

A `.$:` handler is ordinary HC code, evaluated through the same `FrameExpr`
machinery as anything else. If its own body fails, and it resolves `.$:` from
the same enclosing scope that declared it, it could find itself and recurse
into itself forever trying to recover from its own failure.

This needs an explicit rule, not an implicit one: while a given `.$:` handler is
running, that binding must not be available to catch a failure raised during
its own execution — the same rule ordinary try/catch designs use so a catch
block isn't wrapped by its own handler. Left open here: whether the masking is
scoped to that exact handler value, or to every `.$:` visible from inside the
handler's own call. Needs deciding before implementation.

## 8. Syntax: `$:` is not valid source today

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
only because `$` was the character already associated with errors in the
printed form of `Frame.error` values — which is a coincidence of string
formatting, not a shared meaning with the note family it would be joining.

## 9. What does not change

- `IfThen`/`IfElse` (`lib/ops/conditionals.ts`) are untouched. See §3.
- `Frame.error`'s own behavior is untouched — its `call()` still returns itself
  unconditionally when an error is the receiver of a later application. This
  design is entirely about what happens to a term *before* it becomes part of
  the fold's accumulator, not about redefining what an error frame does once it
  is one.
- No third leg is added to the ternary, and `?:` gains no new arity. The
  earlier idea of a `::`-spelled branch attached syntactically to
  `a ? {…} : {…}` is superseded by this design: `.$:` is a freestanding
  property, scoped to wherever it's declared, independent of any particular
  conditional expression.

## 10. Relationship to #361 / M-3

This does not automatically preserve `(1 + "text") : {"else"}`-style fallback
idioms once M-3 ships. That idiom relied on the result being nil, which `:`
already tests for; under this design, a program that wants equivalent fallback
behavior for a computation that now produces an error must declare `.$:`
explicitly. The old behavior was implicit and free; the new equivalent is
opt-in and requires a source change. Whether that migration cost is acceptable,
or whether M-3 needs additional bridging, is not resolved here.

## Noted, not resolved here

- The exact masking rule that stops a handler from catching its own failure
  (§7).
- Whether `$:` is the right spelling, or whether joining the note family is the
  wrong neighborhood for what a handler means (§8).
- Whether M-3 needs migration support beyond "authors add `.$:` wherever they
  relied on the old nil fallback" (§10).
- Whether bare recovery (one handler, argument inspection for reason
  discrimination) is sufficient, or whether real usage wants per-reason
  handlers as a first-class construct rather than manual matching inside one
  handler body.
