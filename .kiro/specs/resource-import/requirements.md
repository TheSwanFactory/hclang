# Requirements Document

## Introduction

Resource import adds a focused HC source-loading operation. A local import,
`. <- 'resource'`, evaluates resource-backed HC source in the current
declaration scope. A named import, `name <- 'resource'`, evaluates the same
source in a fresh namespace bound to `name`. The feature reuses existing
resource-read, evaluation-scope, live-parent, and failed-sequence behavior
without introducing the broader module framework proposed by issue #301.

## Glossary

- **FrameResource**: The existing HC resource frame that enforces resource
  authority and exposes store-backed content as an ordered sequence of
  characters.
- **Resource_Reference**: The right-hand expression of an import that evaluates
  to a FrameResource, such as `'resource'`.
- **Resource_Read**: The existing FrameResource operation that yields ordered
  characters or a Failed_Result.
- **Character_Sequence**: The ordered characters yielded by a Resource_Read.
- **HC_Source**: Characters interpreted according to the existing HC lexical,
  parsing, and evaluation rules.
- **Source_Form**: One complete HC form produced from HC_Source and eligible for
  evaluation.
- **Imported_Declaration**: A top-level declaration evaluated from imported
  HC_Source.
- **Binding**: An association between an HC name and a value, owned by one
  EvaluationScope.
- **EvaluationScope**: The existing HC frame that owns local bindings and
  participates in name lookup.
- **Current_Scope**: The active current or file EvaluationScope containing the
  import expression.
- **Name_Lookup**: The existing search for a Binding, beginning in an
  EvaluationScope and continuing through eligible parent scopes.
- **Live_Parent_Relationship**: A parent-scope relationship that consults the
  parent's current bindings at lookup time rather than copying parent bindings.
- **Target_Name**: The explicit name to the left of `<-` in a Named_Import.
- **Imported_Namespace**: A fresh EvaluationScope bound to a Target_Name, with
  Current_Scope as the live parent and imported bindings as owned bindings.
- **Local_Import**: The form `. <- <Resource_Reference>`.
- **Named_Import**: The form `<Target_Name> <- <Resource_Reference>`.
- **Import_Expression**: A Local_Import or Named_Import.
- **Failed_Result**: The existing HC result value that marks resource reading,
  parsing, or evaluation as failed.
- **Resource_Import**: The HC feature that evaluates Import_Expressions.

## Requirements

### Requirement 1: Import Forms and Source Reading

**User Story:** As an HC author, I want a resource to supply HC source through
`<-`, so that stored source can be evaluated without a separate loader
subsystem.

#### Acceptance Criteria

1. THE Resource_Import SHALL recognize `. <- <Resource_Reference>` as a
   Local_Import.
2. THE Resource_Import SHALL recognize `<Target_Name> <- <Resource_Reference>`
   as a Named_Import.
3. WHEN an Import_Expression is evaluated, THE Resource_Import SHALL perform a
   Resource_Read for that evaluation.
4. WHEN a Resource_Read yields a Character_Sequence, THE Resource_Import SHALL
   preserve character order while interpreting the Character_Sequence as
   HC_Source.
5. WHEN imported HC_Source produces a Source_Form, THE Resource_Import SHALL
   apply the existing HC lexical, parsing, and Source_Form evaluation rules.
6. WHEN a Resource_Read applies a FrameResource authority decision, THE
   Resource_Import SHALL use the Resource_Read outcome without replacing the
   authority decision.

### Requirement 2: Local Import Scope

**User Story:** As an HC author, I want a local import to evaluate in the
current scope, so that imported declarations become declarations of the current
file or context.

#### Acceptance Criteria

1. WHEN a Local_Import selects a Source_Form for evaluation, THE Resource_Import
   SHALL evaluate the Source_Form in Current_Scope.
2. WHEN an Imported_Declaration succeeds during a Local_Import, THE
   Resource_Import SHALL make Current_Scope the owner of the resulting Binding.
3. WHEN a Source_Form performs a Name_Lookup during a Local_Import, THE
   Resource_Import SHALL begin the Name_Lookup in Current_Scope.

### Requirement 3: Named Import Namespace

**User Story:** As an HC author, I want a named import to own imported
declarations in a child namespace, so that imported names remain qualified while
imported source can read caller bindings.

#### Acceptance Criteria

1. WHEN a Named_Import is evaluated, THE Resource_Import SHALL create a fresh
   Imported_Namespace with a Live_Parent_Relationship to Current_Scope.
2. WHEN the Resource_Import creates an Imported_Namespace, THE Resource_Import
   SHALL bind the Imported_Namespace to Target_Name in Current_Scope.
3. WHEN a Named_Import selects a Source_Form for evaluation, THE Resource_Import
   SHALL evaluate the Source_Form in the Imported_Namespace.
4. WHEN an Imported_Declaration succeeds during a Named_Import, THE
   Resource_Import SHALL make the Imported_Namespace the owner of the resulting
   Binding.
5. WHILE an Imported_Namespace has no owned Binding for a requested name, THE
   Resource_Import SHALL continue Name_Lookup through Current_Scope.
6. WHILE an Imported_Namespace has no owned Binding for a requested name, WHEN
   the reachable Current_Scope Binding changes, THE Resource_Import SHALL use
   the changed Binding for the next Name_Lookup.
7. WHEN the same Named_Import is evaluated again, THE Resource_Import SHALL
   create an Imported_Namespace with an identity distinct from every
   Imported_Namespace created by an earlier evaluation.

### Requirement 4: Incremental Evaluation and Failure

**User Story:** As an HC author, I want import evaluation to retain completed
work and stop at the first failure, so that import behavior matches HC sequence
evaluation.

#### Acceptance Criteria

1. WHEN imported HC_Source contains multiple Source_Forms, THE Resource_Import
   SHALL evaluate the Source_Forms in source order.
2. WHEN parsing completes a Source_Form, THE Resource_Import SHALL evaluate the
   completed Source_Form before processing a later Source_Form.
3. IF Resource_Read, HC_Source parsing, or Source_Form evaluation produces a
   Failed_Result, THEN THE Resource_Import SHALL return the first Failed_Result.
4. IF Resource_Read, HC_Source parsing, or Source_Form evaluation produces a
   Failed_Result, THEN THE Resource_Import SHALL stop processing HC_Source at
   the failed operation.
5. IF a Failed_Result occurs after completed state changes, THEN THE
   Resource_Import SHALL preserve every state change completed before the failed
   operation.
6. IF a Named_Import produces a Failed_Result after binding Target_Name, THEN
   THE Resource_Import SHALL preserve the Target_Name Binding and the completed
   state of the Imported_Namespace.

## Out of Scope

- Resource or module registries
- Aliases other than binding Target_Name to the fresh Imported_Namespace
- Package discovery, versioning, or package management
- Memoization or caching
- Cycle detection
- A generalized loader or receiver API
- Changes to FrameResource authority, normalization, handler dispatch, or store
  access
- Any other issue #301 module-framework behavior not stated in these
  requirements
