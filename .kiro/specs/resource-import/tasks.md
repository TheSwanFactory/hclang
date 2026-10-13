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
      and file scope; persist the parent's complete ordered lookup through one
      live read-only projection of its frame references, inherit only the host
      namespace, and link the current scope as `enclosing` without copying
      receiver write authority.
    - Remove parallel binding-metadata lookup state. Resolve values and schemas
      through the same graph, retaining the physical declaration owner across
      derived closure-call scopes.
    - Prebuild immutable lookup-layer projections and cache only raw
      identity-owning values by target for the projection's fixed continuation;
      never conflate contextual handles with other continuations.
    - Keep the scope immutable so later replacement of caller bindings remains
      visible and creates a projection for the new target.
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
      lookahead: retain `<-` through one additional symbol, send an ASCII
      decimal start through `FrameSchema` with the buffered `-`, and otherwise
      emit one `FrameOperator("<-")` before redispatching unchanged.
    - Preserve pending state across chunks/resource elements; send a lone `<`
      through schema completion and a lone `<-` through reserved-arrow parsing
      at physical end.
    - Leave `>`, negative and zero-led schemas, nested schemas, `.<`, `.<=`, and
      all other operator/name boundaries unchanged; do not add a generalized
      multi-character terminal mechanism.
    - _Requirements: 1.1, 1.2_

  - [~] 2.2 Create the executable import frame in `lib/frames/frame-import.ts`
    and export it from `lib/frames.ts`
    - Define the local/named target model and injected `ImportSourceEvaluator`
      callback described by the design, keeping the frame layer independent of
      execution-pipeline modules.
    - In `FrameImport.in`, normalize the current scope once; for a local target
      pass that exact scope to source evaluation without creating a namespace.
    - Evaluate and validate the right-hand expression first. For a named target,
      then allocate a fresh empty `FrameArray`, attach its live read-only caller
      projection, and evaluate source in `namedChild(namespace)` while the child
      remains unbound.
    - On any right-side, non-resource, read, parse, or evaluation failure,
      preserve the prior target binding or absence and do not expose the child.
      After source success, commit the exact child through
      `FrameSymbol.setter(...).apply(...)`; a setter refusal also preserves the
      prior target.
    - Never reuse a prior named namespace. Local imports retain every completed
      prefix before a failure.
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.6_

  - [~] 2.3 Recognize import forms in `lib/execute/parse-pipe.ts`
    - Add an optional `ImportSourceEvaluator` parser dependency and propagate it
      unchanged to child parse pipes.
    - Before ordinary expression evaluation, inspect only the singleton
      `FrameBind`/`FrameExpr` wrappers needed to identify three logical terms: a
      bare empty-source `FrameName` (`.`) or a concrete ordinary `FrameSymbol`
      identifier, exact `FrameOperator("<-")`, and one right-hand expression.
    - Accept zero or more spaces on either side of a named arrow. Reject
      specialized argument/parameter targets and malformed arrow boundaries
      before resource access. Construct `FrameImport` without looking up the
      target and preserve grouped right-hand expressions.
    - Keep `<-` out of `Ops`; do not create a global operator or loader hook.
    - _Requirements: 1.1, 1.2_

  - [ ]* 2.4 Add targeted lexer and parser examples in `lib/execute/lex.test.ts`
    and `lib/execute/parse.test.ts`
    - Verify all four spacing combinations around named arrows and every split
      around `<`, `-`, and the following symbol.
    - Regression-test `<-1>`, zero-led negatives, `<>`, populated and nested
      schemas, `.<`, and `.<=` so arrow disambiguation preserves schema syntax.
    - Verify ordinary named targets, reject `_`, `__`, `_^`, and `_^^` before
      reads, preserve grouped right sides, and return import syntax failures for
      malformed boundaries.
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
    - In `strictStructure` mode, surface unmatched or mismatched closes as
      existing-style failures. Permit logical newlines inside open structures
      and report nonzero depth only at physical `LexPipe.finish`.
    - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4_

  - [~] 4.2 Implement the private imported-source driver in
    `lib/execute/resource-import.ts`
    - Use the shared `makeSourcePipe` builder for strict/immediate `ParsePipe`
      options and `EvalPipe.scoped`; retain the active lexical receiver across
      characters instead of using `HCEval.call` transport buffering.
    - Carry an immutable invocation-local active chain keyed by host namespace
      identity and resource spelling. Refuse a repeated active resource before
      `elements()` and pass the extended chain only to nested imports.
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
    - Make both `HCEval.make_pipe` and imported source call the one
      `makeSourcePipe` builder with their intentional options. Supply the nested
      active-chain callback for imports inside imported source without a global
      loader.
    - Ensure one outer import expression contributes only its first failure or
      final imported-form result to the caller result stream.
    - Keep all non-import `HCEval` behavior and transport buffering unchanged.
    - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.4 Add ordered-read and local-import examples in
    `lib/execute/resource-import.test.ts`
    - Use `MemoryStore` plus an instrumented `ResourceStore`/handler to cover
      empty source, Unicode, same-line forms, arrays and closures across logical
      newlines, malformed physical EOF, nested syntax, and nested imports.
    - Cover self and mutual active-chain recursion failures, bounded read
      prefixes, later-form suppression, acyclic nesting, and clean independent
      evaluations.
    - Assert one right-hand evaluation and one `elements()` read per import
      evaluation, original character/form order, final-result behavior, and no
      leakage of intermediate form results.
    - Compare local declaration ownership and lookup with direct evaluation in
      the exact current scope.
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 4.1, 4.2_

  - [ ]* 4.5 Add named-namespace examples in
    `lib/execute/resource-import.test.ts`
    - Verify delayed target binding on the caller write target, imported
      declaration ownership only in the fresh child, shadowing, ordered
      fallback, and live caller replacement.
    - Verify caller binding-schema lookup at named top level and inside an
      imported closure, plus repeated immutable aggregate projection identity,
      no write authority, and replacement after caller rebinding.
    - Re-evaluate the same import and assert pairwise-distinct namespace
      identity while the newest namespace replaces the target binding.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 4.6 Add first-failure and retained-prefix examples in
    `lib/execute/resource-import.test.ts`
    - Cover right-hand evaluation failure, non-resource values, read refusals,
      non-character elements, malformed lexical/structural source, source-form
      failure, and post-success constant/schema setter refusal.
    - Prove every named failure preserves the prior target or absence and does
      not expose a partial namespace. Separately prove local imports retain
      completed prefixes and no later source is processed.
    - Cover absent, unbound-scheme, and escaped resource refusals; assert the
      exact returned refusal and instrument fallback paths to prove that no
      alternate authority, store, normalization, or handler decision occurs.
    - Add sentinels proving no later source is processed after the first
      failure; successful local prefixes remain visible, while failed named
      children remain unbound.
    - _Requirements: 1.6, 3.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.7 Write the reflected property test for named import parsing in
    `lib/execute/resource-import.test.ts`
    - **Property 1: Named import parsing preserves target and source**
    - Generate bounded ordinary identifiers, valid resource-reference
      expressions, zero or more spaces on each side of the arrow, and input
      chunk boundaries; assert one named `FrameImport` with unchanged target key
      and right-hand expression.
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
      shadows, schemas, and later caller replacements; assert delayed target
      commit, namespace-only ownership, ordered live fallback, physical schema
      ownership through closures, immutable projection reuse, and replacement
      after rebinding.
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
      spanning resource read, parsing, evaluation, and named setter refusal;
      assert the exact first failure and no later effects.
    - For local cases, assert visible state equals the completed prefix. For
      named cases, assert the prior target or absence is unchanged and the
      partially evaluated child is not exposed.
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
  discovery/versioning/management, persistent caching, dependency graphs,
  cross-evaluation cycle state, generalized loaders/receivers, or unrelated
  issue #301 behavior. The invocation-local active chain and immutable
  projection-handle reuse are the only narrow exceptions.
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
