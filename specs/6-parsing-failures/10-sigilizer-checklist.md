# Sigilizer Green–Red–Green Checklist

**Status:** Completed for v0.8.4\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Feature issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Specification:** [09-sigilizer-spec.md](./09-sigilizer-spec.md)\
**Implementation refinement:**
[12-sigilizer-refactoring.md](./12-sigilizer-refactoring.md)\
**Sigil disambiguation decision:**
[11-candidate-composition-spec.md](./11-candidate-composition-spec.md)

**Verification:** `deno task test:all`, `deno task test:maml`, and
`deno task test:doc` pass. The authoritative white-paper result remains 57
total, 31 passing, 0 failing, and 26 explicitly unimplemented. Comparison
evaluation, phone-number composition, and ternary semantics remain assigned to
issue #293 as specified below.

## Implementation Result

The migration followed the intended incremental sequence from working behavior
to the uniform transition contract:

1. insert a behavior-preserving Sigilizer pass;
2. remove exactly one existing generic workaround and observe the focused
   failure;
3. add the smallest Frame-level affordance that restores the behavior;
4. return the full repository to green; and
5. repeat with the next workaround.

The implemented phase is stateless. `FrameName`, quotes, comments, byte modes,
documents, operators, and blobs own their scan decisions; generic Lex contains
none of their former concrete-class workarounds. `HCEval` retains and completes
lexical states through common Frame flags and `finishInput()` rather than
checking `LexDoc`.

Comparison lookup, numeric-property composition, and related doctest promotion
remain in #293 rather than this Sigilizer migration.

| Slice                    | Result                                                 |
| ------------------------ | ------------------------------------------------------ |
| 0 — nil Sigilizer        | Complete; forwarding order and statelessness tested    |
| 1 — `FrameName`          | Complete; dotted angles and chunk splits tested        |
| 2 — quotes/comments      | Complete; concrete Lex branches removed                |
| 3 — bytes                | Complete; skipped test enabled and EOF failures tested |
| 4 — lifecycle            | Complete; concrete evaluator checks removed            |
| 5 — documents            | Complete; mode selected by static `SIGIL_STARTS`       |
| 6 — operators/blobs      | Complete; raw angles excluded and bases validated      |
| Candidate composition    | Not required by the explicit-dot decision              |
| Phone/ternary evaluation | Deferred to #293                                       |

The unchecked boxes below remain as the reusable per-slice procedure and audit
questions. The table above records the outcome of this implementation run;
deferred #293 work is intentionally not represented as completed here.

## Green–Red–Green Rule

Every slice MUST follow this sequence.

### Green: establish the protected behavior

- [ ] Identify one concrete workaround or missing generic contract.
- [ ] Identify the focused tests that exercise its current behavior.
- [ ] Add a characterization test first if the behavior is not already covered.
- [ ] Run the focused tests and record the passing baseline.
- [ ] Run the relevant integration baseline when the slice affects chunking,
      documents, or the white-paper path.
- [ ] Keep the change behavior-preserving at this stage.

### Red: delete only the workaround

- [ ] Remove or disable exactly one concrete-class branch, side channel, or
      special registration.
- [ ] Run the smallest focused test command.
- [ ] Confirm at least one test fails.
- [ ] Confirm the failure is caused by the removed workaround, not an unrelated
      formatting, type, import, or fixture failure.
- [ ] Record the expected red behavior in the slice notes.
- [ ] Do not combine the red state with another workaround deletion.
- [ ] Do not push or merge a red state.

### Green: add the Frame-level affordance

- [ ] Add or override only the static `SIGIL_STARTS`, `scan(Symbol)`, or
      `finishInput()` behavior required by this slice.
- [ ] Make the stateless Sigilizer or generic Lex route the returned Frame
      without a new syntax-family check.
- [ ] Re-run the focused test and confirm it passes for the expected reason.
- [ ] Re-run neighboring lexical tests.
- [ ] Run formatting, lint, type diagnostics, and the relevant full test suite.
- [ ] Confirm the removed generic workaround has not reappeared under another
      name.
- [ ] End with fewer concrete syntax checks than the slice began with.

## Slice Exit Gate

A slice is complete only when all of the following are true:

- [ ] The focused red failure was observed after deleting the workaround.
- [ ] The final green behavior is owned by the relevant Frame class or returned
      lexical Frame state.
- [ ] Sigilizer remains free of input-dependent state.
- [ ] Generic phase code contains no replacement branch for the migrated syntax
      class.
- [ ] Each deciding Symbol is consumed or redispatched exactly once.
- [ ] Physical input chunking does not change behavior where applicable.
- [ ] EOF reports completion or structured failure where applicable.
- [ ] Existing source rendering remains unchanged.
- [ ] Repository diagnostics are clean.
- [ ] The slice is small enough to review independently.

## Phase 0: Baseline and Nil Sigilizer

The nil Sigilizer proves that the phase can exist without changing behavior.

### Green baseline

- [ ] Record the current branch and clean/known worktree state.
- [ ] Run the focused Lex, LexPipe, Parse, and HCEval tests.
- [ ] Run the document-fence tests.
- [ ] Run the complete library test suite.
- [ ] Run the white-paper doctest and record its authoritative totals.

### Nil pass

- [ ] Introduce the Sigilizer at the intended pipeline boundary.
- [ ] Forward every Symbol to the existing receiver without buffering, candidate
      selection, syntax inspection, or changed terminal behavior.
- [ ] Preserve the current returned Frame as the next monadic receiver.
- [ ] Preserve physical chunk, newline, and EOF behavior exactly.
- [ ] Add a focused test proving that the nil pass receives and forwards Symbols
      in order.
- [ ] Add a focused test proving the phase itself retains no per-input state.

### Green exit

- [ ] All baseline tests remain green without fixture updates.
- [ ] White-paper totals are unchanged.
- [ ] No syntax-class branch is added to the Sigilizer.
- [ ] No existing workaround is removed in this slice.

## Phase 1: Establish the Uniform `scan(Symbol)` Spine

The first workaround migration establishes the back-half protocol. `FrameName`
is the preferred first slice because its special case is isolated in
`Lex.isEnd()` and its behavior is focused and observable.

### Slice 1A: `FrameName` boundary logic

#### Green

- [ ] Characterize `.a-b`, `.a+b`, an operator-starting name, a plain name, and
      a name followed by a terminal.
- [ ] Confirm the current `FrameName` branch in generic Lex is the behavior
      under test.

#### Red

- [ ] Delete only the `FrameName`-specific decision in generic `Lex.isEnd()`.
- [ ] Confirm the focused name/operator boundary tests fail.
- [ ] Confirm ordinary unrelated atom tests remain green where possible.

#### Green

- [ ] Add the base `Frame.scan(Symbol)` contract or compatibility behavior
      needed for simple atoms.
- [ ] Add or override `FrameName.scan(Symbol)` for identifier hyphens,
      operator-starting names, and unconsumed operator boundaries.
- [ ] Route the returned transition generically through Sigilizer/Lex.
- [ ] Confirm generic Lex no longer compares its factory to `FrameName`.
- [ ] Run FrameName, Lex, Parse, and evaluator tests.

### Slice 1B: Selected dotted names containing raw terminals

#### Green

- [ ] Preserve existing `2.+` property/operator behavior.
- [ ] Preserve existing raw `<...>` type/schema behavior.
- [ ] Record that raw `<` and `>` are structural only.

#### Red

- [ ] Add focused Lex expectations that `.<` and `.>` each form one `FrameName`.
- [ ] Add `.<=` and `.>=` expectations only if #293 retains them.
- [ ] Confirm the current generic terminal override redispatches `<` or `>` as a
      schema action after `.` has already selected `FrameName`.
- [ ] Do not use the entire ternary listing as the first red test.

#### Green

- [ ] Make selected `FrameName.scan(Symbol)` consume its accepted
      operator-character body even when the Symbol is a raw entry terminal.
- [ ] Keep raw `<` and `>` structural when no dot-led name is active.
- [ ] Confirm the boundary after the dotted name is consumed or redispatched
      exactly once.
- [ ] Confirm `.<` and `.>` results are invariant across every two-chunk split.
- [ ] Confirm Sigilizer and generic Lex contain no comparison-specific branch.
- [ ] Stop at lexical Frame production; property lookup, comparison evaluation,
      and doctest promotion belong to #293.

## Phase 2: Remove Quote and Comment Workarounds

Quote and comment behavior is intertwined in generic Lex. Migrate it in two
separate slices so each red signal remains attributable.

### Slice 2A: `FrameQuote` terminal suppression

#### Green

- [ ] Characterize punctuation and structural terminal characters inside smart
      strings.
- [ ] Characterize the smart closing quote as consumed closure.
- [ ] Characterize an unterminated smart string at EOF as the currently known
      lifecycle gap, without silently redefining it in this slice.

#### Red

- [ ] Delete only generic Lex's quote test or quote-specific terminal
      suppression.
- [ ] Confirm quoted terminal characterization tests fail.

#### Green

- [ ] Add shared `FrameQuote.scan(Symbol)` behavior.
- [ ] Add `FrameString.scan(Symbol)` behavior for smart closure.
- [ ] Route content, closure, and boundary disposition through returned Frames.
- [ ] Confirm generic Lex no longer checks `FrameQuote`.
- [ ] Run string, Lex, parser, evaluator, and doctest-marker isolation tests.

### Slice 2B: `FrameComment` boundary behavior

#### Green

- [ ] Characterize explicit `#` closure.
- [ ] Characterize logical-newline termination.
- [ ] Characterize a comment followed immediately by another token.
- [ ] Characterize comment termination at EOF according to the existing language
      rule.

#### Red

- [ ] Delete only generic Lex's comment-specific boundary disposition.
- [ ] Confirm comment closure or redispatch tests fail.

#### Green

- [ ] Add `FrameComment.scan(Symbol)` for content, explicit closure, newline
      termination, and boundary consumption.
- [ ] Preserve void-token behavior without generic comment checks.
- [ ] Confirm generic Lex no longer checks `FrameComment`.
- [ ] Run comment, Lex, evaluator, and white-paper traversal tests.

## Phase 3: Remove the Byte-Mode Workaround

### Slice 3A: `FrameBytes` registration and mode transition

#### Green

- [ ] Unskip or replace the existing byte-string end-to-end test with a focused
      characterization of the intended syntax.
- [ ] Characterize exact payload length, completion, and the Symbol immediately
      following a complete payload.
- [ ] Characterize premature EOF as a required structured failure.

#### Red

- [ ] Delete only the `FrameBytes` type check and `LexBytes` construction path
      from generic Lex.
- [ ] Confirm the focused byte recognition test fails for the missing mode
      transition.

#### Green

- [ ] Add `FrameBytes.SIGIL_STARTS` so byte syntax is reachable independently of
      its runtime constructor shape.
- [ ] Add Frame-owned `scan(Symbol)` transitions for length recognition and
      fixed-count payload mode entry.
- [ ] Make the byte lexical mode participate through the same `scan(Symbol)`
      contract.
- [ ] Confirm generic Lex contains no `FrameBytes` check.
- [ ] Confirm the evaluator can retain the returned byte mode across chunks.
- [ ] Run byte, Lex, evaluator, chunk-split, and EOF tests.

## Phase 4: Generalize Lexical Lifecycle

The document implementation is working evidence, but evaluator knowledge of
`LexDoc` is a lifecycle workaround.

### Slice 4A: Active lexical-state retention

#### Green

- [ ] Characterize an active generic Lex state across non-final chunks.
- [ ] Characterize `LexDoc` across arbitrary chunk splits.
- [ ] Characterize the future byte mode across chunk splits once Phase 3 is
      green.

#### Red

- [ ] Delete only the evaluator rule that retains active state by checking for a
      particular Lex class hierarchy.
- [ ] Confirm a chunked lexical-state test fails.

#### Green

- [ ] Make every active returned lexical Frame identifiable through the common
      protocol rather than concrete class identity.
- [ ] Retain the returned Frame as the next receiver.
- [ ] Confirm documents, generic atoms, and bytes survive chunk boundaries.

### Slice 4B: Common `finishInput()`

#### Green

- [ ] Characterize generic atom completion at EOF.
- [ ] Characterize document success and failure at EOF.
- [ ] Add a failing requirement test for unterminated smart strings.
- [ ] Add a failing requirement test for premature byte payload EOF.

#### Red

- [ ] Delete only `HCEval`'s `LexDoc`-specific `finishInput()` and `failure()`
      path.
- [ ] Confirm document EOF tests fail for the missing common lifecycle.

#### Green

- [ ] Add or regularize `Frame.finishInput()` defaults.
- [ ] Override completion on smart strings, comments, documents, byte modes, and
      other incomplete lexical Frames as required.
- [ ] Return structured completion or failure directly from the active Frame.
- [ ] Confirm `HCEval` contains no `LexDoc` check or document-only error getter.
- [ ] Confirm evaluator reuse after lexical failure.
- [ ] Run all chunk, EOF, CLI failure, and white-paper tests.

## Phase 5: Remove Specialized Document Registration

Document scanning itself is not a workaround; the concrete-class factory map in
`syntax.ts` is.

### Slice 5A: `FrameDoc` selects its Lex mode

#### Green

- [ ] Run every existing document-fence, maximal-run, redispatch, chunk, and EOF
      test.
- [ ] Confirm the current specialized `FrameDoc` to `LexDoc` registry entry is
      the only behavior being removed.

#### Red

- [ ] Delete only the concrete `FrameDoc` entry from the specialized Lex factory
      map.
- [ ] Confirm document selection fails while unrelated syntax remains green.

#### Green

- [ ] Add `FrameDoc.SIGIL_STARTS` and Frame-owned selection through
      `scan(Symbol)`.
- [ ] Preserve the existing specialized document lexical mode if still useful.
- [ ] Confirm generic registry code does not name `FrameDoc`.
- [ ] Run all document and full white-paper tests with unchanged results.

## Phase 6: Regularize Remaining Selected-Token Warts

These slices can proceed in either order after the uniform scan spine is stable.

### Slice 6A: `FrameOperator` token continuation

#### Green

- [ ] Characterize valid existing operators.
- [ ] Characterize an arbitrary operator run such as `+?`.
- [ ] Record whether arbitrary operator names are intentionally valid or should
      fail lexically before changing behavior.

#### Red

- [ ] Delete only the current undifferentiated
      `FrameOperator.canInclude()`-based continuation.
- [ ] Confirm focused operator token tests fail.

#### Green

- [ ] Add `FrameOperator.scan(Symbol)` for the documented operator policy.
- [ ] Preserve a clear boundary between operator Sigil recognition and selected
      operator continuation.
- [ ] Run operator, math, conditional, Lex, and evaluator tests.

### Slice 6B: `FrameBlob` base-aware continuation

#### Green

- [ ] Characterize valid digits for every supported blob base.
- [ ] Characterize digits valid in base 64 but invalid in the selected lower
      base.
- [ ] Define required invalid-digit boundary/error behavior before deletion.

#### Red

- [ ] Delete only the base-64-for-all continuation rule.
- [ ] Confirm lower-base blob tests fail.

#### Green

- [ ] Add base-aware `FrameBlob.scan(Symbol)` behavior.
- [ ] Confirm generic Lex remains unaware of blob bases.
- [ ] Run blob, Lex, evaluator, and source-round-trip tests.

## Explicitly Not Planned: Candidate Composition

The explicit-dot decision removes the demonstrated schema/comparison collision.

- [ ] Do not register raw `<` or `>` as `FrameOperator` starts.
- [ ] Do not add a candidate collection, priority policy, lookahead count, or
      parser-context query to Sigilizer.
- [ ] Report conflicting future start registrations instead of resolving them by
      insertion order.
- [ ] Require a concrete overlapping-Sigil case and a separate specification
      before adding candidate composition.

## Explicitly Deferred: Phone-Shaped Property Composition

The source `+1.408.555.1212` already decomposes into `+`, `1`, `.408`, `.555`,
and `.1212`. It does not require a phone Sigil, phone Lex mode, or
phone-specific Frame methods.

- [ ] Preserve that decomposition in a focused characterization test.
- [ ] Do not add phone-specific behavior to Sigilizer, generic Lex, or
      `FrameNumber.scan(Symbol)`.
- [ ] Specify numeric-name/property application and leading unary `+`
      separately.
- [ ] Promote the four white-paper assertions only after that evaluation work is
      green without source rewrites.

## Explicitly Deferred: Ternary Composition

- [ ] Do not treat lexable `.<`, `.>`, `?`, and `:` Frames as proof that
      `condition ? then : else` evaluates correctly.
- [ ] Keep the lexical comparison tests separate from conditional evaluation.
- [ ] Address state preservation and branch semantics in a separate evaluator
      slice under #293.
- [ ] Update and promote the white-paper ternary doctest only after the explicit
      comparison spelling and conditional evaluation are independently green.

## Per-Slice Review Questions

- [ ] Is exactly one workaround or missing affordance in scope?
- [ ] Was the initial state demonstrably green?
- [ ] Did deleting the workaround produce an attributable red test?
- [ ] Does the final green behavior reside on the responsible Frame?
- [ ] Does Sigilizer only invoke and route `scan(Symbol)`?
- [ ] Did generic Lex lose, rather than relocate, a concrete-class check?
- [ ] Are consumption, redispatch, mode transition, and EOF behavior explicit?
- [ ] Are source spelling and existing rendering preserved?
- [ ] Are physical chunks distinguished from logical newlines and EOF?
- [ ] Is Parse still responsible for structural validity?
- [ ] Is Eval still responsible for runtime operator semantics?
- [ ] Can the slice be reverted without reverting later independent slices?

## Completion Criteria

The Sigilizer migration is complete when:

- [ ] The nil Sigilizer has become the sole stateless driver of lexical Symbols.
- [ ] All active lexical Frames advance through `scan(Symbol)`.
- [ ] All active lexical Frames complete through `finishInput()`.
- [ ] Syntax discovery uses static `SIGIL_STARTS` without dispatch-order
      dependence.
- [ ] Generic Lex contains no concrete syntax-family workarounds.
- [ ] `HCEval` contains no concrete lexical-state lifecycle checks.
- [ ] Structural actions occur only after Sigil commitment.
- [ ] Every tested boundary Symbol is consumed or redispatched exactly once.
- [ ] Every tested chunk split is behaviorally invariant.
- [ ] Every incomplete lexical form reports a structured EOF failure.
- [ ] `.<`, `.>`, and any retained `.<=` or `.>=` each lex as one `FrameName`
      without a schema action.
- [ ] Raw `<` and `>` remain structural Sigils.
- [ ] Sigilizer contains no candidate-composition machinery.
- [ ] Phone-shaped composition remains outside the Sigilizer implementation and
      retains its existing lexical decomposition.
- [ ] The full test suite and white-paper doctest report zero failures.
- [ ] Conditional composition remains separately classified until implemented.
