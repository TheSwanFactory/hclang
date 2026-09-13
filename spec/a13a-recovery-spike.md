# Recovery Spike: Answering a13 With Code

**Status:** Spike brief. Throwaway by design — this is not a feature branch.\
**Design record:** [`a13`](a13-error-handling.md), which proposes parent-scope
error recovery and leaves four rulings unratified.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).

## 1. What this is

a13 proposes that a failing term can be recovered by a `.$:` handler declared in
an enclosing scope, found by ordinary name lookup. The mechanism is plausible
but unproven, and the design has already been corrected once when the evaluator
contradicted it. Four of its rulings are proposals rather than decisions.

**This spike exists to answer questions, not to ship a feature.** Its most
valuable output is a list of places a13 is wrong. Working code is the
instrument, not the deliverable.

Do not edit `a13-error-handling.md`. Report what you find and let the design
record be updated deliberately.

## 2. Mechanics you will need

Verified, so you do not have to rediscover them:

- **Failure is intrinsic and permanent.** `Frame.error` (`lib/frames/frame.ts`)
  sets `is.error = true` on the frame object once, and `isFailedResult`
  (`frame.ts:465-468`) reads that flag plus one shallow level of aggregate
  contents. Nothing distinguishes a term that just failed from a value that is a
  failure. Reading a name bound to a failure ends the expression that read it.
- **Three boundaries stop on failure**, and a13 only addresses the first:
  - `frame-expr.ts:87` — the accumulator has already failed, so no later term in
    the list is evaluated.
  - `frame-expr.ts:90` — the term just evaluated **is** an error, so the reduce
    returns it without reaching the apply step. **This is where a13 puts the
    handler lookup.**
  - `frame-expr.ts:62` — `evaluateBody`, which stops a `;`-separated statement
    sequence at its first failing statement. a13 says nothing about this.
  - `bound-method.ts:100` — a third site, also unaddressed.
- **Collecting bypasses all of it.** `Frame.reduceInto` (`frame.ts:440-452`)
  calls the accumulator directly with no error check, so a refusal reaches the
  error's own `called_by` override and its `context.collects()` branch.
  `FrameArray` overrides `collects()` to true (`frame-array.ts:99`); the default
  is false (`frame.ts:388`).
- **`? … : …` is not if/then/else.** `:` tests what the `?` branch answered, not
  the original condition, so `5.> 1 ? {100} : {10}` answers `()`. The truth
  table is pinned in `cli/hc/testdoc.hc`, around the "Conditionals" heading.
  Read it before writing any handler body.

## 3. What to build

The smallest thing that answers §4. Expect to throw it away.

- **Use a placeholder key, not `$:`.** a13 §10 establishes that `$:` does not
  lex today and would need the dollar family's recognizer extended. Skip that
  entirely: use an ordinary name such as `.recover`, which already lexes. The
  spelling is a separate decision and must not gate this work.
- **Wire the lookup at `frame-expr.ts:90`** — on seeing an error term, resolve
  the placeholder key through ordinary name lookup from the current scope, and
  if it resolves to something callable, call it.
- **Implement a13's proposed rulings so they can be tested:**
  - the handler receives the refusal **name** as text in `_` — the `$!.…`
    vocabulary with the sigil stripped, e.g. `“division-by-zero”` (a13 §7);
  - an ordinary value answers → substitute it and continue the reduce as if the
    term had produced it (a13 §6);
  - nil or an error answers → decline, and the **original** failure propagates
    (a13 §7a, §9).

## 4. The questions

Answer each explicitly, with evidence. "It worked" is not an answer; show the
source and the actual output.

**Q1. Which boundaries need the lookup?** Wire `frame-expr.ts:90` only, then
find out what a multi-statement block does — does
`.recover {0}; (1 / 0); “next”` recover, and what does it answer? Then determine
whether `evaluateBody` (`:62`) and `bound-method.ts:100` need it too, and
whether wiring them is coherent or double-fires. **Decides:** whether a13's
scope is one site or three.

**Q2. Does the lookup itself recurse or fail?** A missing name answers
`$!.name-missing`, so resolving the key when no handler exists produces an error
value — inside the code path that reacts to error values. Does that re-enter?
What guard did you need, and is it a flag, a scope field, or a sentinel?
**Decides:** whether a13 §5's "no new field on `EvaluationScope`" survives.

**Q3. What masking does a self-failing handler need?** Try `.recover {1 / 0}`,
and a handler whose body reaches the same binding that declared it. Confirm it
terminates. **Decides:** a13 §9's open question — masking by exact handler value
versus by key for the duration of the call.

**Q4. Is the handler visible as data?** Does the placeholder property appear in
`visibleKeys()`, print in an aggregate's rendering, and stream under `&&`?
Report the unmodified behavior first, then say whether it should be hidden. Note
that a13's tutorial currently prints it (`[.$: {0}; 0]`), so declaring recovery
changes what a value _is_. **Decides:** whether recovery is ordinary data or
needs to be excluded from iteration and rendering.

**Q5. Does collecting really opt out?** a13 §6 claims `'./missing.txt' | []`
never fires a handler while `| “”` does, reasoned from code rather than
observed. Verify both. **Decides:** whether that section is describing reality.

**Q6. Is a text handler actually pleasant to write?** Write at least five
realistic handler bodies and report friction honestly. At minimum: a constant
fallback; a partial handler spelled `{_ = “resource-absent” ? {“(defaults)”}}`;
one that builds a message from `_`; one that recovers by reading a different
resource; one nested inside another handler's scope. **Decides:** whether a13 §7
is worth its homoiconicity concession, or whether #360's option 4 (an inspection
that does not propagate) should come back.

**Q7. What does it cost?** The error branch gains a scope walk. Rough numbers
only — is there a measurable effect on the existing suite's runtime?

## 5. Deliverables, and where each one goes

The code and the findings go to different places, because they have different
lifespans. The code is instrumentation and is expected to die. The findings are
what a13 gets rewritten from, so they have to outlive it.

**Code, tests, and corpus → branch `a13a-recovery-spike`, off
`a13-error-handling`.** Push it; do not merge it, do not open a PR, and do not
rewrite the commits already on `a13-error-handling`.

**Findings → `spec/a13b-recovery-spike-findings.md`, committed onto
`a13-error-handling` itself** — not onto the spike branch, where they would be
deleted along with the code they describe. a13 and this brief already live
there, so that branch ends up holding the design, the question set, and the
answers as one reviewable whole.

Make it a single commit touching that one new file, and nothing else on that
branch. One section per question, headed `## Q1` through `## Q7`, each carrying
the source you ran and the output you actually got — paste real REPL or test
output, not a description of it. Head the file with a `**Status:**` line naming
the **spike branch commit** the findings were taken at, the way the other
`spec/a*` documents open; that SHA is the only link back to the code, so it has
to be exact.

Close that file with a section headed **`## Contradicts a13`**, listing every
place the design is wrong, each naming the a13 section it breaks. Put it under
that exact heading so it can be found without reading the rest. If the list is
empty, say so explicitly and say what you tried that failed to break anything —
an empty list is a claim, and it needs its evidence too.

**Scratch corpus → `cli/hc/recovery-spike.hc`.** Both doctest harnesses name
their files explicitly — `cli/deno.json`'s `test:doc` task and the `new URL(…)`
list in `cli/hc.test.ts` — so a new file there is inert until registered.
**Leave it unregistered.** It exists so the examples in the findings are real
and re-runnable, not to become a baseline.

**Tests → beside the code they cover**, following the existing `*.test.ts`
convention. Enough to pin each answer and no more; they are expected to be
discarded.

Leave `spec/a13-error-handling.md` and this file unedited.

## 6. Out of scope

- The `$:` spelling and the dollar-family lexer change (a13 §10).
- M-3 / [#361](https://github.com/TheSwanFactory/hclang/issues/361) — do not
  touch `lib/ops/math.ts`.
- `lib/ops/conditionals.ts` — a13 §3 and §11 turn on leaving it alone.
- Making `cli/hc/exception-tutorial.md` executable. That is the eventual target,
  but the tutorial encodes unratified rulings and must not become a baseline
  while they are still proposals. Leave `cli/hc.test.ts` alone.
- Any decision about whether refusal names are a legitimate discrimination
  channel. That is a07 §7's open question, recorded in
  [`a12`](a12-resource-frames.md), and this spike only reports what it makes
  possible.

## 7. How this will be judged

In order:

1. Are Q1–Q7 answered with real output rather than assertion?
2. Are the contradictions with a13 stated plainly, including any that make the
   design look worse?
3. Is the mechanism the smallest thing that answers the questions?
4. Did it stay out of §6's scope?

A spike that concludes "a13's shape does not work" is a success. A spike that
reports everything went fine will be read as not having looked hard enough.
