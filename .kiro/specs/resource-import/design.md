# Design Document: Resource Import

## Overview

Resource import is a narrow parser/evaluator extension for two HC expressions:

```hc
. <- './source.hc'
name <- './source.hc'
```

The local form evaluates imported source in the active `EvaluationScope`. The
named form creates a fresh `FrameArray` namespace, binds it to `name` in the
active declaration target, and evaluates imported source with that namespace as
the innermost declaration and lookup scope.

The implementation reuses four existing contracts:

- `FrameURI.in(scope)` performs the existing ambient-authority resolution and
  either returns a `FrameResource` or leaves the URI inert.
- `FrameResource.elements()` performs the existing resource read and returns
  ordered character frames or the existing refusal value.
- `LexPipe` → `ParsePipe` → `EvalPipe` remains the only HC source pipeline.
- `EvaluationScope` remains the authority for lookup order and declaration
  ownership.

There is no resource registry, module cache, cycle graph, package resolver, or
generalized loader. Every import evaluation resolves and reads its right-hand
resource again.

## Existing Constraints

1. `<` currently opens `FrameSchema`, while `-` belongs to `FrameOperator`;
   therefore `<-` needs exact two-character disambiguation without changing
   schema syntax or dotted comparison names.
2. Spaces are represented by `FrameBind` wrappers. For example, a normal
   infix-shaped expression parses as a target followed by singleton bound
   expressions for the operator and right operand.
3. `EvalPipe` currently creates a new root scope for every parsed group.
   Imported forms instead need one supplied scope reused across all forms.
4. `HCEval.call(input, false)` buffers transport fragments until a logical line
   boundary. It cannot enforce evaluation immediately at a top-level semicolon,
   so resource characters must be driven directly through the existing pipes.
5. A normal root `ParsePipe` collects every semicolon-separated expression in a
   line before `EvalPipe` sees the group. Import parsing needs an opt-in root
   mode that emits a completed source form at each top-level semicolon.
6. `FrameResource.elements()` is intentionally the effectful read view.
   `asArray()` and `isFailedResult()` must not be used to obtain resource
   content because doing so would change the established authority/read
   contract.

## Architecture

```text
outer HC source
    │
    ├─ exact `<-` lexing
    │
    └─ ParsePipe recognizes ImportTarget <- ResourceExpression
           │
           ▼
       FrameImport.in(CurrentScope)
           │
           ├─ named only: create namespace, attach a live ordered
           │              read-only projection of caller lookup, bind target
           │
           ├─ evaluate ResourceExpression once in CurrentScope
           │
           ├─ require the resulting value to be FrameResource
           │
           ├─ FrameResource.elements() exactly once
           │
           └─ ImportedSourceEvaluator
                  │
                  ├─ LexPipe
                  ├─ ParsePipe (emit completed top-level forms)
                  ├─ EvalPipe (use supplied EvaluationScope)
                  └─ first failure or final successful result
```

The imported source pipeline has private output state. Imported forms do not
append their intermediate results to the caller's result array; the outer import
expression contributes one result: the first failure, or the final source-form
result (`Frame.nil` for no forms).

## Components and Interfaces

### 1. Exact Import-Arrow Lexing

**Files:** `lib/execute/terminals.ts`, `lib/execute/lex-pipe.ts`,
`lib/execute/lex.test.ts`

Replace the immediate schema-open handling of `<` with a narrow angle-start
discriminator owned by `LexPipe`:

- On `<`, retain one pending angle character.
- If the next character is `-`, emit exactly one `FrameOperator("<-")` token and
  consume both characters.
- Otherwise, perform the existing `FrameSchema` push and redispatch the next
  character unchanged.
- At physical end after a lone `<`, take the schema branch; strict
  imported-source parsing will report the unclosed schema.

This is intentionally not a generalized multi-character terminal facility. `>`
remains the existing schema pop, dotted names such as `.<` and `.<=` remain
owned by `FrameName`, and ordinary schemas including `<>` retain their current
parse tree.

The pending character lives in the lexical receiver, so `<-` must work when `<`
and `-` arrive in different resource elements or input chunks.

### 2. Parsed Import Expression

**Files:** `lib/frames/frame-import.ts` (new), `lib/frames.ts`,
`lib/execute/parse-pipe.ts`, `lib/execute/parse.test.ts`

Introduce an internal executable frame with a small data model:

```ts
type ImportTarget =
  | { readonly kind: "local" }
  | { readonly kind: "named"; readonly key: string };

type ImportSourceEvaluator = (
  resource: FrameResource,
  scope: EvaluationScope,
) => Frame;

class FrameImport extends Frame {
  constructor(
    readonly target: ImportTarget,
    readonly resourceExpression: Frame,
    readonly evaluateSource: ImportSourceEvaluator,
  );

  override in(input: EvaluationInput): Frame;
}
```

`ParsePipe` recognizes the import shape when it completes an expression. It
unwraps only singleton `FrameBind`/`FrameExpr` wrappers needed to inspect the
three logical terms; it does not generally flatten HC expressions.

Accepted targets are:

- a bare `FrameName` whose source is empty (`.`) for a local import;
- a bare identifier `FrameSymbol` for a named import.

The middle logical term must be exactly `FrameOperator("<-")`, and the right
side must be one expression (a grouped expression remains one expression).
Recognition occurs before normal expression evaluation, so `.` is not
interpreted as a parameter read and an undeclared named target is not looked up.

Malformed uses of the reserved arrow become a parse failure rather than falling
through to global operator lookup. `<-` is not added to `Ops`.

`ParsePipe` receives the `ImportSourceEvaluator` callback as an option and
propagates it to child parse pipes. This dependency inversion keeps
`FrameImport` in the frame layer without making `lib/frames` import the
execution pipeline. `HCEval.make_pipe` and the imported-source pipeline provide
the same callback, allowing imports inside imported source without a global
loader.

### 3. Scope Derivation and Namespace Binding

**File:** `lib/frames/evaluation-scope.ts`

Local import passes the exact current immutable `EvaluationScope` to imported
evaluation. No root scope is reconstructed, so its write target, lookup layers,
host namespace, receiver state, and enclosing lexical state remain those of the
containing expression.

Named import creates a fresh empty `FrameArray` because namespaces own mutable
bindings and observable identity. It then sets the namespace's lexical `up` link
to a lightweight live, read-only projection of `CurrentScope`'s complete ordered
lookup layers. The projection retains the existing frame identities rather than
copying their bindings and carries neither `CurrentScope`'s write target nor its
receiver capability.

Add one focused scope constructor:

```ts
class EvaluationScope {
  public namedChild(namespace: FrameArray): EvaluationScope;
}
```

`namedChild` returns a scope with these roles:

| Role                     | Value                                               |
| ------------------------ | --------------------------------------------------- |
| `argument`               | the fresh namespace                                 |
| `writeTarget`            | the fresh namespace                                 |
| `writeTargetRole`        | `"statement"`                                       |
| lookup order             | namespace, then the parent's existing lookup frames |
| `lexicalTarget`          | the fresh namespace                                 |
| `fileScope`              | the fresh namespace                                 |
| `hostNamespace`          | inherited unchanged                                 |
| `enclosing`              | the current scope                                   |
| receiver write authority | not copied into the child                           |

Lookup layers contain references to the existing frames. Replacing a binding on
a referenced caller frame is therefore visible to later lookups and to closures
that capture the named child scope. Imported declarations stop at the namespace
because it is the explicit write target.

Named evaluation order is fixed:

1. Create the fresh namespace and attach its live lexical parent.
2. Bind it to `Target_Name` on `CurrentScope.writeTarget` using the existing
   `FrameSymbol.setter(...).apply(...)` declaration path.
3. If binding fails under an existing schema/constant rule, return that failure
   and do not read.
4. Evaluate the resource expression in `CurrentScope`.
5. Evaluate imported forms in `CurrentScope.namedChild(namespace)`.

Binding precedes resource evaluation/read so every later failure preserves the
target binding and namespace identity. Re-evaluation always allocates before
binding, so replacing an existing target never reuses the earlier namespace.

### 4. Resource Resolution and Read

**Files:** `lib/frames/frame-import.ts`, `lib/execute/resource-import.ts` (new)

`FrameImport.in` evaluates the right-hand expression exactly once in
`CurrentScope`.

- If it returns a failed result, return that value unchanged.
- If it does not return `FrameResource`, return one narrow resource-import
  source-type failure. In particular, an inert `FrameURI` is not upgraded or
  resolved again.
- Call `FrameResource.elements()` exactly once for this import evaluation.

The imported-source driver consumes the returned elements in order:

1. A failed element is returned unchanged. This preserves the exact
   authority/refusal decision and its diagnostic.
2. A non-character element returns the source-type failure; typed handler values
   are not generalized into source loaders.
3. Character content is fed to the front end in its original order. If one
   element exposes more than one character, its characters remain contiguous and
   ordered.
4. Once parsing or evaluation fails, remaining elements are not processed as HC
   source.

The current resource API may read a store eagerly before returning `elements()`.
This design does not introduce host streaming; “stop processing” means no
remaining returned character is lexed, parsed, or evaluated after failure.

### 5. Incremental Imported-Source Evaluation

**Files:** `lib/execute/resource-import.ts` (new), `lib/execute/parse-pipe.ts`,
`lib/execute/eval-pipe.ts`

`ImportedSourceEvaluator` directly composes the existing pipe classes and
retains the active lexical receiver between characters. It does not route
resource content through `HCEval`'s transport buffer.

Add opt-in `ParsePipe` options:

```ts
type ParsePipeOptions = {
  readonly importSource?: ImportSourceEvaluator;
  readonly emitCompletedForms?: boolean;
  readonly strictStructure?: boolean;
};
```

When `emitCompletedForms` is true on the root parser:

- a top-level semicolon finalizes and emits the source form accumulated so far;
- the emitted form is evaluated before the lexer accepts the next source
  character;
- comma grouping and every nested parser retain existing behavior;
- newline/end-of-input emits the remaining complete form;
- a trailing separator does not synthesize a second empty form.

This ordering matters for context-sensitive syntax as well as ordinary lookup: a
declaration in one form must be visible before lexical or evaluation work begins
on the next form.

When `strictStructure` is true, unmatched/mismatched closes and nonzero
structural depth at end-of-input are exposed as a failed parse result instead of
only logging or silently producing no group. Normal non-import callers retain
their existing mode.

Extend `EvalPipe` with a scoped construction path while retaining its current
constructor behavior:

```ts
class EvalPipe extends Frame {
  static scoped(out: Frame, scope: EvaluationScope): EvalPipe;
}
```

A scoped pipe calls `expr.in(scope)` for every emitted form rather than
constructing `EvaluationScope.root(...)`. Because the scope is immutable while
its referenced frames are live, prior declarations are visible to later forms
without replacing the scope object.

A private result sink stores:

```ts
type ImportProgress = {
  lastResult: Frame; // initially Frame.nil
  firstFailure?: Frame;
};
```

After every character that can complete a form, the driver checks
`firstFailure`. At EOF it finishes the active lexical receiver, verifies strict
structural completion, flushes the final form, and checks once more. It never
snapshots or restores a frame.

### 6. Success and Failure Result

The import expression returns:

- the exact first resource-read or source-form evaluation `Failed_Result` when
  one exists;
- a failed result carrying the existing lexical/parse diagnostic for malformed
  imported source;
- otherwise the final completed source-form result;
- `Frame.nil` when the resource contains no source forms.

For a named import, the target binding and every successful namespace
declaration preceding a failure remain in place. For a local import, every
completed mutation to the current scope remains in place. Later forms produce no
effects after the first failure.

## Data and Ownership Invariants

1. Every named import evaluation allocates one new namespace object.
2. Only `CurrentScope.writeTarget` owns the target binding.
3. Only the imported namespace owns declarations made by a named import.
4. Local imports create no namespace and use `CurrentScope.writeTarget`
   directly.
5. A named namespace shadows its caller with owned bindings and falls through
   only on a local miss.
6. Parent lookup is live because frames are linked/referenced, never copied.
7. Resource content is read once per evaluation and never cached.
8. Imported effects are committed one completed form at a time; there is no
   rollback path.

## Error Handling

| Failure point                                     | Result                                 | State retained                                          | Further work                |
| ------------------------------------------------- | -------------------------------------- | ------------------------------------------------------- | --------------------------- |
| malformed outer import shape                      | parse failure                          | state before evaluating the expression                  | no resource evaluation/read |
| named target binding                              | existing declaration failure           | any state already changed by existing binding semantics | no resource evaluation/read |
| right-hand expression                             | same failed result                     | named target and empty namespace, if already bound      | no read                     |
| right-hand value is not `FrameResource`           | resource-import source-type failure    | named target and namespace                              | no read                     |
| `FrameResource.elements()` authority/read refusal | exact existing refusal                 | named target and namespace                              | no source processing        |
| non-character resource element                    | resource-import source-type failure    | all earlier completed forms                             | no later element processing |
| lexical or structural parse failure               | failed result with existing diagnostic | all earlier completed forms                             | no later source processing  |
| source-form evaluation failure                    | exact first failed result              | all earlier completed forms and partial named namespace | no later source processing  |

No error path substitutes a different resource root, retries a handler, rolls
back bindings, or reads through another API.

## Property Reflection

The prework identified many acceptance criteria with overlapping state
observations. The properties below consolidate them as follows:

- character order and reuse of lexical/parse/evaluation rules are one
  differential source-fidelity property;
- the three local-scope criteria are one scope-equivalence property;
- namespace creation, binding, ownership, fallback, and liveness are one
  named-namespace invariant, while repeated-evaluation identity remains
  separate;
- source ordering, immediate evaluation, first-failure return, stopping, and
  both local/named no-rollback behavior are one prefix property;
- authority pass-through remains separate because it protects a security
  boundary not implied by ordinary failure short-circuiting.

The fixed local spelling in Requirement 1.1 remains an example-based parser
test; turning that one token sequence into a randomized property would add no
coverage.

## Correctness Properties

_A property is a behavior that must hold across all valid generated executions.
Each property below is suitable for an automated property test and is
complementary to focused unit and integration examples._

### Property 1: Named import parsing preserves target and source

For any valid HC target identifier and any valid resource-reference expression,
parsing the corresponding `<Target_Name> <- <Resource_Reference>` expression
produces one named import whose target key and right-hand expression are
unchanged, regardless of legal surrounding whitespace or input chunk boundaries.

**Validates: Requirements 1.2**

### Property 2: Every evaluation performs an ordered source read

For any readable `FrameResource`, any valid character-backed HC source stored in
it, and any positive evaluation count, evaluating the import that many times
performs exactly one resource read per evaluation and produces the same result
and binding effects as feeding the same characters in the same order through the
existing incremental HC pipeline.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 3: Resource authority outcomes pass through unchanged

For any `FrameResource` reference and authority configuration, if its existing
resource read returns a refusal, resource import returns that same first failed
result without attempting a fallback store, handler, normalization, or authority
decision.

**Validates: Requirements 1.6**

### Property 4: Local import is scope-equivalent to direct evaluation

For any current `EvaluationScope` and any valid imported source consisting of
declarations and lookups, local import produces the same lookup results as
direct evaluation in that scope, and every successful imported declaration is
owned by that scope's existing write target.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Named imports isolate declarations behind a live parent

For any current `EvaluationScope`, valid target name, caller bindings, and valid
imported declarations/lookups, named import binds a fresh namespace at the
target, owns imported declarations only in that namespace, resolves unshadowed
names through the caller, and observes any later replacement of a reachable
caller binding on the next lookup.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 6: Repeated named imports have pairwise-distinct identity

For any named import and any number of evaluations greater than one, every
evaluation creates a namespace identity distinct from all namespaces created by
earlier evaluations of that import.

**Validates: Requirements 3.7**

### Property 7: Import state equals the successful prefix

For any local or named imported source containing an ordered list of source
forms and any generated first failure in resource reading, parsing, or form
evaluation, import returns that first failure, evaluates no later form, and
leaves observable state equal to exactly the successfully completed prefix; for
a named import, that state also retains the target binding and the same
partially populated namespace.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

## Testing Strategy

### Unit and Example Tests

- `lib/execute/lex.test.ts`
  - `. <- './a.hc'` and `name <- './a.hc'` emit one arrow token.
  - `<`/`-` split at every chunk boundary still emits one arrow token.
  - `<>`, populated schemas, nested schemas, `.<`, and `.<=` retain existing
    behavior.
- `lib/execute/parse.test.ts`
  - the fixed local form satisfies Requirement 1.1;
  - named targets become `FrameImport` without looking up the target;
  - malformed missing-target, missing-right-side, and extra-term forms fail as
    parse errors.
- `lib/execute/eval-pipe.test.ts`
  - a scoped pipe reuses the supplied `EvaluationScope` and does not create a
    root scope.
- `lib/execute/resource-import.test.ts` (new)
  - use `MemoryStore` and an instrumented `ResourceStore`/handler;
  - cover empty source, Unicode characters, same-line semicolon forms, multiline
    forms, nested syntax, and an import inside imported source;
  - cover local ownership, named ownership, shadowing, live caller updates, and
    repeated fresh identity;
  - cover absent/unbound/escaped resource refusals and verify their exact values
    and lack of fallback calls;
  - cover lexical, structural parse, and evaluation failures before/after
    successful declarations, including sentinels proving that later source was
    not processed.

### Property Tests

Use deterministic local generators in the new test file so this focused feature
does not add a production or test dependency. Run at least 100 generated cases
per property. Every property test must include this tag in its test name or
adjacent comment:

```text
Feature: resource-import, Property {number}: {property title}
```

Generators should produce bounded valid identifiers, URI-safe MemoryStore paths,
character-backed HC declarations/lookups, distinct values for live-parent
checks, repetition counts, and a selected failure phase/index. Shrinking is not
required for the local generator, but every failing assertion must print the
seed and generated case for reproduction.

### Targeted Validation Commands

```sh
deno test lib/execute/lex.test.ts lib/execute/parse.test.ts lib/execute/eval-pipe.test.ts lib/execute/resource-import.test.ts
deno test lib
deno fmt --check .kiro/specs/resource-import/design.md
deno lint lib
```

## Explicitly Out of Scope

- registries or import aliases beyond binding the explicit target;
- package discovery, versions, dependency resolution, or package management;
- memoization, caching, or once-only execution;
- cycle detection;
- generalized loaders, receivers, or public resource APIs;
- changes to FrameResource normalization, authority, handler dispatch, store
  access, or eager-read behavior;
- unrelated issue #301 module-framework behavior.
