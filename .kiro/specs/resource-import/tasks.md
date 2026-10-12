# Implementation Plan: Resource Import

## Overview

Implement the minimal TypeScript parser/evaluator extension for
`. <- 'resource'` and `name <- 'resource'`. Reuse the existing resource
authority/read contract, HC lexical/parse/evaluation pipes, and immutable
`EvaluationScope`; local imports evaluate in the current scope, while named
imports allocate and bind a fresh live-child namespace. The steps below build
the scope and frontend seams first, then wire ordered incremental source
evaluation and its focused automated coverage.

## Tasks

-
  1. [ ] Add scope-aware evaluation foundations
  - [~] 1.1 Implement named child scope derivation in
    `lib/frames/evaluation-scope.ts`
    - Add `EvaluationScope.namedChild(namespace: FrameArray)` with the namespace
      as argument, statement write target, first lookup layer, lexical target,
      and file scope; retain references to the parent lookup frames, inherit
      only the host namespace, and link the current scope as `enclosing` without
      copying receiver write authority.
    - Keep the scope immutable so later replacement of bindings on referenced
      caller frames remains visible through lookup.
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

  - [~] 1.2 Add supplied-scope evaluation to `lib/execute/eval-pipe.ts`
    - Add `EvalPipe.scoped(out, scope)` while preserving the existing
      constructor/root-scope behavior for all current callers.
    - Make the scoped path evaluate every emitted form with the exact supplied
      `EvaluationScope` and collect results through the existing output
      capability.
    - _Requirements: 2.1, 2.2, 2.3, 3.3, 3.4, 4.2_

  - [ ]* 1.3 Add focused scoped-pipe unit tests in
    `lib/execute/eval-pipe.test.ts`
    - Verify that multiple emitted forms reuse the same supplied scope, see
      bindings created by earlier forms, and never construct or substitute a
      root scope.
    - Retain coverage for the existing unscoped constructor behavior.
    - _Requirements: 2.1, 2.2, 2.3, 4.2_

-
  2. [ ] Add the reserved resource-import expression to the frontend
  - [~] 2.1 Implement exact `<-` lexing in `lib/execute/terminals.ts` and
    `lib/execute/lex-pipe.ts`
    - Replace only the immediate `<` schema-open path with a pending-angle
      discriminator: emit one `FrameOperator("<-")` for `<` followed by `-`,
      otherwise open the existing `FrameSchema` and redispatch the following
      character unchanged.
    - Preserve pending state across input chunks/resource elements and send a
      lone `<` at physical end through the schema branch.
    - Leave `>`, ordinary and nested schemas, `.<`, `.<=`, and all other
      operator/name boundaries unchanged; do not add a generalized
      multi-character terminal mechanism.
    - _Requirements: 1.1, 1.2_

  - [~] 2.2 Create the executable import frame in `lib/frames/frame-import.ts`
    and export it from `lib/frames.ts`
    - Define the local/named target model and injected `ImportSourceEvaluator`
      callback described by the design, keeping the frame layer independent of
      execution-pipeline modules.
    - In `FrameImport.in`, normalize the current scope once; for a local target
      pass that exact scope to source evaluation without creating a namespace.
    - For a named target, allocate a fresh empty `FrameArray`, attach its
      lexical `up` link to `CurrentScope.lexicalTarget`, bind it on
      `CurrentScope.writeTarget` through the existing
      `FrameSymbol.setter(...).apply(...)` declaration path, and then derive
      `namedChild(namespace)`.
    - Preserve the required named ordering: allocate and bind before evaluating
      the right-hand expression; stop before resource work if binding fails;
      evaluate the right-hand expression exactly once in the current scope; pass
      through its failed result; reject any non-`FrameResource` with one narrow
      import source-type failure; then invoke the injected source evaluator.
    - Never reuse a prior named namespace and never roll back a completed target
      binding.
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.6_

  - [~] 2.3 Recognize import forms in `lib/execute/parse-pipe.ts`
    - Add an optional `ImportSourceEvaluator` parser dependency and propagate it
      unchanged to child parse pipes.
    - Before ordinary expression evaluation, inspect only the singleton
      `FrameBind`/`FrameExpr` wrappers needed to identify three logical terms: a
      bare empty-source `FrameName` (`.`) or bare identifier `FrameSymbol`,
      exact `FrameOperator("<-")`, and one right-hand expression.
    - Construct `FrameImport` without looking up `.` or the named target,
      preserve the target key and grouped right-hand expression, and turn
      missing targets, missing sources, invalid targets, or extra terms using
      the reserved arrow into parse failures.
    - Keep `<-` out of `Ops`; do not create a global operator or loader hook.
    - _Requirements: 1.1, 1.2_

  - [ ]* 2.4 Add targeted lexer and parser examples in `lib/execute/lex.test.ts`
    and `lib/execute/parse.test.ts`
    - Verify that both `. <- './a.hc'` and `name <- './a.hc'` contain one arrow
      token, including every split around `<` and `-`.
    - Regression-test `<>`, populated and nested schemas, `.<`, and `.<=` so
      exact arrow disambiguation does not change existing syntax.
    - Verify the fixed local spelling, named-target preservation without lookup,
      grouped right-hand expressions, and parse failures for missing-target,
      missing-source, invalid-target, and extra-term arrow forms.
    - _Requirements: 1.1, 1.2_

-
  3. [ ] Checkpoint - Ensure frontend and scoped evaluation tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run
    `deno test lib/execute/lex.test.ts lib/execute/parse.test.ts lib/execute/eval-pipe.test.ts`.

-
  4. [ ] Integrate incremental resource-backed source evaluation
  - [~] 4.1 Add opt-in imported-source modes to `lib/execute/parse-pipe.ts`
    - Extend parser options with `emitCompletedForms` and `strictStructure`,
      propagate both to nested pipes, and leave default parsing unchanged.
    - In root `emitCompletedForms` mode, emit each nonempty top-level
      semicolon-completed form immediately, retain existing comma/nested
      behavior, flush one remaining complete form at newline/end, and avoid a
      synthetic form after a trailing separator.
    - In `strictStructure` mode, surface unmatched or mismatched closes and
      nonzero structural depth at end as existing-style failed parse results
      rather than only logging or dropping the group.
    - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4_

  - [~] 4.2 Implement the private imported-source driver in
    `lib/execute/resource-import.ts`
    - Compose `LexPipe`, strict/immediate `ParsePipe`, and `EvalPipe.scoped`
      directly; retain the active lexical receiver across characters instead of
      using `HCEval.call` transport buffering.
    - Call `FrameResource.elements()` exactly once per import evaluation,
      inspect returned elements in order, pass through the first failed element
      unchanged, reject a non-character element with the narrow source-type
      failure, and feed every character of a multi-character element
      contiguously in original order.
    - Maintain a private sink whose initial result is `Frame.nil`, whose success
      result is the last completed source form, and whose first failure stops
      all later lexing, parsing, and evaluation without exposing intermediate
      results in the caller output.
    - At end of input, finish the active lexical receiver, enforce strict
      structural completion, flush the final complete form, and return the first
      failure or final result without snapshotting, rollback, retries, alternate
      reads, or cache state.
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [~] 4.3 Wire the shared source evaluator through `lib/execute/hc-eval.ts`
    - Supply the same `ImportSourceEvaluator` callback from `HCEval.make_pipe`
      and from the imported-source parser so an import inside imported HC source
      uses the identical scoped pipeline without a global loader.
    - Ensure one outer import expression contributes only its first failure or
      final imported-form result to the caller result stream.
    - Keep all non-import `HCEval` behavior and transport buffering unchanged.
    - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.4 Add ordered-read and local-import examples in
    `lib/execute/resource-import.test.ts`
    - Use `MemoryStore` plus an instrumented `ResourceStore`/handler to cover
      empty source, Unicode, same-line semicolon forms, multiline forms, nested
      syntax, and an import inside imported source.
    - Assert one right-hand evaluation and one `elements()` read per import
      evaluation, original character/form order, final-result behavior, and no
      leakage of intermediate form results.
    - Compare local declaration ownership and lookup with direct evaluation in
      the exact current scope.
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 4.1, 4.2_

  - [ ]* 4.5 Add named-namespace examples in
    `lib/execute/resource-import.test.ts`
    - Verify target binding on the caller write target, imported declaration
      ownership only in the fresh child, local shadowing, fallback on a child
      miss, and observation of a caller binding replaced after import.
    - Re-evaluate the same import and assert pairwise-distinct namespace
      identity while the newest namespace replaces the target binding.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 4.6 Add first-failure and retained-prefix examples in
    `lib/execute/resource-import.test.ts`
    - Cover named binding failure, right-hand evaluation failure, non-resource
      values, non-character elements, malformed lexical/structural source, and
      source-form evaluation failure before and after successful declarations.
    - Cover absent, unbound-scheme, and escaped resource refusals; assert the
      exact returned refusal and instrument fallback paths to prove that no
      alternate authority, store, normalization, or handler decision occurs.
    - Add sentinels proving no later source is processed after the first
      failure, while earlier local state and the named target's same partially
      populated namespace remain committed.
    - _Requirements: 1.6, 3.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.7 Write the reflected property test for named import parsing in
    `lib/execute/resource-import.test.ts`
    - **Property 1: Named import parsing preserves target and source**
    - Generate bounded valid identifiers, valid resource-reference expressions,
      legal whitespace, and input chunk boundaries; assert one named
      `FrameImport` with unchanged target key and right-hand expression.
    - Establish a deterministic local seeded generator harness (no new
      dependency), run at least 100 cases, and print the seed and generated case
      on failure. Tag the test
      `Feature: resource-import, Property 1: Named import parsing preserves target and source`.
    - **Validates: Requirements 1.2**

  - [ ]* 4.8 Write the reflected property test for ordered reads in
    `lib/execute/resource-import.test.ts`
    - **Property 2: Every evaluation performs an ordered source read**
    - Generate readable resources, character-backed valid HC source, and
      positive evaluation counts; instrument exactly one read per evaluation and
      compare results/binding effects with the existing incremental HC pipeline
      fed the same characters in the same order.
    - Reuse the deterministic generator harness for at least 100 cases and
      include the required property tag plus seed/case diagnostics.
    - **Validates: Requirements 1.3, 1.4, 1.5**

  - [ ]* 4.9 Write the reflected property test for authority pass-through in
    `lib/execute/resource-import.test.ts`
    - **Property 3: Resource authority outcomes pass through unchanged**
    - Generate resource references and authority configurations that refuse
      reads; assert the same first failed result is returned and instrument all
      fallback stores, handlers, normalization, and authority paths to prove
      none is attempted.
    - Reuse the deterministic generator harness for at least 100 cases and
      include the required property tag plus seed/case diagnostics.
    - **Validates: Requirements 1.6**

  - [ ]* 4.10 Write the reflected property test for local scope equivalence in
    `lib/execute/resource-import.test.ts`
    - **Property 4: Local import is scope-equivalent to direct evaluation**
    - Generate current scopes and valid declaration/lookup source; compare
      local-import lookup results and write-target ownership with direct
      evaluation in the same scope.
    - Reuse the deterministic generator harness for at least 100 cases and
      include the required property tag plus seed/case diagnostics.
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 4.11 Write the reflected property test for live named children in
    `lib/execute/resource-import.test.ts`
    - **Property 5: Named imports isolate declarations behind a live parent**
    - Generate caller bindings, targets, imported declarations/lookups, child
      shadows, and later caller replacements; assert target binding,
      namespace-only ownership, fallback on misses, shadowing, and live
      observation of replacement values.
    - Reuse the deterministic generator harness for at least 100 cases and
      include the required property tag plus seed/case diagnostics.
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

  - [ ]* 4.12 Write the reflected property test for fresh namespace identity in
    `lib/execute/resource-import.test.ts`
    - **Property 6: Repeated named imports have pairwise-distinct identity**
    - Generate named imports and evaluation counts greater than one; retain each
      resulting namespace reference and assert all identities are pairwise
      distinct.
    - Reuse the deterministic generator harness for at least 100 cases and
      include the required property tag plus seed/case diagnostics.
    - **Validates: Requirements 3.7**

  - [ ]* 4.13 Write the reflected property test for successful-prefix state in
    `lib/execute/resource-import.test.ts`
    - **Property 7: Import state equals the successful prefix**
    - Generate ordered local/named source forms and a first failure phase/index
      spanning resource read, parsing, and form evaluation; assert the exact
      first failure, no later effects, and observable state equal to the
      completed prefix.
    - For named cases, also assert that the target still refers to the same
      partially populated namespace allocated for that evaluation.
    - Reuse the deterministic generator harness for at least 100 cases and
      include the required property tag plus seed/case diagnostics.
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

-
  5. [ ] Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Run the focused suite:
    `deno test lib/execute/lex.test.ts lib/execute/parse.test.ts lib/execute/eval-pipe.test.ts lib/execute/resource-import.test.ts`.
  - Run regression and static validation: `deno test lib`,
    `deno fmt --check lib .kiro/specs/resource-import/design.md`, and
    `deno lint lib`.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for a faster
  implementation; core implementation tasks are never optional.
- Use TypeScript and the existing Deno test stack; deterministic property
  generators stay test-local and add no dependency.
- This plan intentionally adds only `. <- <Resource_Reference>` and
  `<Target_Name> <- <Resource_Reference>` with a fresh live-child namespace for
  the named form.
- Do not add registries, aliases beyond the explicit target binding, package
  discovery/versioning/management, caching or memoization, cycle detection,
  generalized loaders/receivers, or unrelated issue #301 behavior.
- Do not change `FrameResource` authority, normalization, handler dispatch,
  store access, eager-read behavior, or unrelated resource APIs. Resource
  content must come only from the existing `elements()` read and must be read
  anew for every evaluation.
- Do not add `<-` to `Ops`, expose intermediate imported-form results,
  snapshot/rollback scope state, or introduce deployment/documentation work.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["1.3", "2.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["2.4", "4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["4.3"] },
    { "id": 6, "tasks": ["4.4"] },
    { "id": 7, "tasks": ["4.5"] },
    { "id": 8, "tasks": ["4.6"] },
    { "id": 9, "tasks": ["4.7"] },
    { "id": 10, "tasks": ["4.8"] },
    { "id": 11, "tasks": ["4.9"] },
    { "id": 12, "tasks": ["4.10"] },
    { "id": 13, "tasks": ["4.11"] },
    { "id": 14, "tasks": ["4.12"] },
    { "id": 15, "tasks": ["4.13"] }
  ]
}
```
