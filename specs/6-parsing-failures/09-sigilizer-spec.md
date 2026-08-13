# Sigilizer Interface Specification

**Status:** Implemented in v0.8.4\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Feature issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Builds on:** [08-sigilizer-phase.md](./08-sigilizer-phase.md)\
**Implementation refinement:**
[12-sigilizer-refactoring.md](./12-sigilizer-refactoring.md) supersedes the
instance-registration and `LexicalScan` representation details below; those
sections preserve the original design rationale.\
**Sigil disambiguation decision:**
[11-candidate-composition-spec.md](./11-candidate-composition-spec.md)\
**Related analysis:** [01-parsing-triage.md](./01-parsing-triage.md),
[02-ternary-failure-analysis.md](./02-ternary-failure-analysis.md),
[03-lookahead-tensions.md](./03-lookahead-tensions.md), and
[05-tokenizer-conjecture-evaluation.md](./05-tokenizer-conjecture-evaluation.md)

## Summary

HC requires a stateless Sigilizer phase between source symbolication and Parse.
The Sigilizer drives the complete lexical path: it discovers possible syntax at
token entry, calls the current Frame-shaped lexical state for every subsequent
Symbol, and routes the returned Frame until a Token, structural action, or error
reaches the next phase.

The Sigilizer owns no input-dependent state and contains no syntax-family rules.
Pending Sigils, active Lex recognizers, specialized lexical modes, completed
Tokens, structural actions, and errors are all represented by Frames returned
through the existing monadic pipeline.

The existing Frame API needs three method contracts:

| Method          | Responsibility                                                   |
| --------------- | ---------------------------------------------------------------- |
| `sigilStarts()` | Advertise one or more possible initial sigil forms.              |
| `scan(Symbol)`  | Perform one syntax-owned lexical transition in any active state. |
| `finishInput()` | Resolve any active lexical state at EOF.                         |

`scan(Symbol)` is the simplifying contract. It replaces separate methods for
advancing a pending Sigil, committing a Sigil, and advancing a selected Lex
recognizer. The active receiver determines which of those meanings applies. The
Sigilizer only calls and routes the result.

These contracts do not require one return representation beyond the invariant
that returned Frames represent the next monadic state. The v0.8.4 implementation
uses `LexicalScan` Frames for consumption, redispatch, mode transition,
completion, and error outcomes.

## Problem Statement

1. **Generic terminal routing overrides selected syntax.** After `.` has already
   selected `FrameName`, generic Lex still redispatches `<` and `>` as
   structural terminals even though the name recognizer accepts operator
   characters. This prevents the explicit comparison properties `.<` and `.>`.
2. **Selected-token transitions have no sufficient abstraction.** The path after
   Sigil commitment still depends on `canInclude(char): boolean` plus terminal
   overrides and concrete checks in generic Lex.
3. **Syntax-owned behavior leaks into generic phases.** Names, comments, quotes,
   byte strings, and documents require concrete-class branches because the
   current boolean contract cannot express their transitions.
4. **Active lexical states do not share a lifecycle.** Document strings expose
   structured EOF validation, while other unfinished forms can be lost or
   handled through concrete checks.
5. **Rendering and recognition contracts are conflated.** Methods such as
   `string_start()`, `string_open()`, and `string_close()` are used to derive
   dispatch even though their names and other uses concern rendering and
   aggregate notation.

## Goals

1. Define the minimal Frame methods required by the stateless Sigilizer.
2. Use one `scan(Symbol)` contract before and after token-family commitment.
3. Keep syntax-specific decisions on the relevant Frame classes.
4. Represent all incomplete state through returned Frames.
5. Execute structural side effects only for committed structural Sigils.
6. Replace boolean token continuation with syntax-owned transition outcomes.
7. Give pending Sigils and active Lex states one EOF completion contract.
8. Preserve exact source while recognition is incomplete.
9. Preserve the existing monadic Symbol-to-Frame reduction model.

## Non-goals

- Designing or implementing candidate composition without a concrete
  overlapping-Sigil requirement.
- Renaming the existing `Lex`, `Token`, `ParsePipe`, or `EvalPipe` concepts.
- Implementing dotted comparison property lookup or changing the operation
  registry; issue #293 owns those evaluation changes.
- Fixing the white-paper phone examples, which compose existing operator,
  number, and numeric-name/property forms rather than introducing phone syntax.
- Changing the left-to-right expression model.
- Fixing the evaluator semantics of chained `?` and `:` conditionals.
- Moving structural nesting validation from Parse into Sigilizer.
- Changing the original phone-shaped white-paper spellings.

## Phase Model

The conceptual flow is:

**String → Symbol → Sigilizer ↔ lexical Frame states → Token/Action → Parse →
Eval**

The expanded flow is:

```text
source text
    ↓ symbolication
Symbol
    ↓ Sigilizer calls current.scan(Symbol)
Frame-shaped lexical state
    ├─ entry/discovery state
    ├─ pending Sigil
    ├─ committed Sigil
    ├─ active Lex
    ├─ specialized lexical mode
    ├─ completed Token
    ├─ committed structural action
    └─ structured lexical error
```

Every new source Symbol passes through the stateless Sigilizer. The current
Frame determines whether the Symbol begins syntax, refines a Sigil, continues a
selected token, closes a token, causes redispatch, changes lexical mode, commits
a structural action, or fails.

### Symbol

A Symbol is the Frame representation of one source character supplied to the
lexical pipeline.

### Sigilizer

Sigilizer is a stateless phase driver. At entry it discovers syntax participants
through `sigilStarts()`. In every active state it calls `scan(Symbol)` and
routes the returned Frame.

### Sigil

A Sigil is source state sufficient, or potentially sufficient after more input,
to select an HC Lex recognizer or structural action.

A Sigil is **pending** while more than one interpretation remains viable or the
sole interpretation is incomplete. It is **committed** when exactly one Lex
recognizer or structural action owns the source.

### Lex

Lex is an active Frame state after token-family commitment. It accumulates and
completes a selected token, then emits Token to Parse. Lex participates in the
same `scan(Symbol)` protocol as pending Sigils.

### Lexical mode

A lexical mode is a selected continuation with token-specific state, such as
document-fence recognition or fixed-count byte payload consumption. It also
participates through `scan(Symbol)`.

### Token

Token is the completed lexical artifact delivered to Parse. Token is an outcome
of scanning, not a separate method protocol.

## Central Simplification

The previous version separated lexical behavior into:

- initial Sigil refinement;
- explicit Sigil commitment; and
- selected-token advancement.

That split regularized the front half of `canInclude()` but left the Sigilizer
outside the back half. It also forced generic phases to distinguish pending
Sigils from active Lex states before calling them.

The revised model has one transition:

```text
current lexical Frame + next Symbol → next Frame
```

The receiver supplies the meaning:

- an entry participant uses `scan()` to accept, decline, or defer a sigil;
- a pending Sigil uses `scan()` to refine its viable interpretations;
- a committed Sigil uses `scan()` to enter Lex or perform a structural action;
- an active Lex uses `scan()` to continue or complete its Token;
- a specialized mode uses `scan()` according to its token grammar; and
- a lexical error remains or routes through the failure path.

The Sigilizer does not inspect the receiver's concrete class to choose a method.

## Method Contract Overview

The three methods form one lexical-transition protocol plus registration and
input completion:

| Protocol           | Method          | When used                                  |
| ------------------ | --------------- | ------------------------------------------ |
| Syntax discovery   | `sigilStarts()` | No active lexical state                    |
| Lexical transition | `scan(Symbol)`  | Every source Symbol in every lexical state |
| Input lifecycle    | `finishInput()` | EOF only                                   |

Boundary redispatch, Sigil refinement, commitment, Token emission, structural
actions, lexical-mode entry, and errors are outcomes of `scan(Symbol)`. They do
not require separate generic methods.

## Method: `sigilStarts()`

### Purpose

Advertise the source forms that make a Frame class relevant when no lexical
state is active.

### Receiver

Every existing Frame class that defines lexical or structural source syntax. The
base `Frame` contract supplies no registrations unless a subclass advertises
them.

### Required information

Each advertised start MUST identify:

- the exact character or character-class pattern that triggers participation;
- the syntax role being considered;
- whether the start can commit immediately or may remain pending; and
- enough identity to invoke the responsible syntax participant's `scan()`.

One Frame class MAY advertise multiple starts or roles. `FrameSchema`, for
example, participates separately as an opening and closing structural form.

### Required behavior

- Registration discovers participants; it MUST NOT execute a structural action.
- Registrations in the current scope MUST have unambiguous starts. A future
  overlapping registration MUST require an explicit composition specification
  rather than rely on exact-key priority or incidental insertion order.
- A registration MUST NOT require Sigilizer to know the concrete Frame subclass.
- Explicit punctuation sigils and implicit letter/digit sigils MUST use the same
  discovery contract.
- After discovery, all recognition proceeds through `scan(Symbol)`.

### Relationship to existing methods

`sigilStarts()` becomes the normative recognition-registration method.

- `string_start()` MAY serve as a compatibility source for simple atom classes,
  but MUST NOT silently resolve conflicting registrations.
- `string_prefix()` and `string_suffix()` remain rendering methods.
- `string_open()` and `string_close()` remain aggregate notation and rendering
  methods; structural registration moves to `sigilStarts()`.

### Classes requiring participation

- `FrameAtom` supplies a default for ordinary atom subclasses.
- `FrameList` supplies structural registration behavior that subclasses can
  refine.
- `FrameSchema` advertises distinct `<` and `>` structural roles.
- `FrameOperator` advertises valid undotted operator starts other than the raw
  structural `<` and `>` forms.
- `FrameName` advertises `.` and owns dotted operator names after selection.
- `FrameBytes` advertises its leading backslash independently of its runtime
  value constructor.

## Method: `scan(Symbol)`

### Purpose

Perform one syntax-owned lexical transition regardless of whether the receiver
is discovering a sigil, refining ambiguity, committing syntax, recognizing a
selected token, or operating a specialized lexical mode.

### Receiver

Any Frame that can be active during lexical processing, including:

- a syntax participant selected by `sigilStarts()`;
- a pending or committed Sigil;
- generic Lex state;
- quote, comment, document, byte, and operator Lex states;
- specialized lexical modes; and
- structured lexical failure states.

The base `Frame` contract supplies a neutral or non-participating default. Every
Frame returned as an active lexical receiver MUST implement meaningful scanning
behavior directly or through inherited behavior.

### Inputs

The method MUST have access to:

- the next source Symbol;
- the exact source already represented by the receiver;
- the syntax role or token family represented by the receiver;
- any token-family state needed to process the Symbol.

This information belongs to returned Frames or their context. It MUST NOT be
stored as input-dependent state on Sigilizer.

### Required outcomes

The returned Frame MUST distinguish these semantic outcomes:

1. **No match:** a discovered participant cannot own the initial prefix.
2. **Pending Sigil:** the selected interpretation remains incomplete.
3. **Lex selected:** one token family has committed and Lex owns subsequent
   token recognition.
4. **Continue and consume:** the Symbol belongs to the active lexical state.
5. **Complete and consume:** the Symbol completes the token or void syntax and
   does not begin another source form.
6. **Complete and redispatch:** the active state completes without consuming the
   Symbol; the Symbol must re-enter Sigilizer exactly once.
7. **Transition lexical mode:** recognition continues in another Frame state.
8. **Token complete:** exactly one Token is emitted to Parse unless the syntax
   is explicitly void.
9. **Structural action committed:** a selected delimiter or separator action may
   now enter Parse.
10. **Lexical error:** the prefix or token body is invalid, with exact source
    retained.

The specification does not prescribe separate result subclasses, flags, or an
enum for these meanings. A result MAY both emit an artifact and identify the
next active Frame through existing monadic behavior.

### Required behavior

- Sigilizer MUST call the same method for every active lexical receiver.
- A pending or continuing result MUST itself be a valid next monadic receiver.
- A physical chunk boundary MUST NOT force a transition or commitment.
- Exact source spelling MUST be preserved until completion or failure.
- Structural parser mutation MUST NOT occur before lexical commitment.
- The deciding Symbol MUST be consumed or redispatched exactly once.
- No invalid source may be silently discarded.
- Generic Sigilizer and generic Lex MUST route results without concrete syntax
  checks.
- Syntax classes MAY return generic Lex, specialized lexical modes, Tokens,
  structural actions, or errors as appropriate.

### Relationship to `canInclude()`

`scan(Symbol)` supersedes `canInclude(char): boolean` as the normative lexical
contract.

`canInclude()` can express only two outcomes: include the character or end the
atom. It cannot express:

- a consumed closing delimiter;
- an unconsumed boundary requiring redispatch;
- a lexical-mode transition;
- successful void syntax;
- a completed Token;
- a committed structural action;
- recoverable incompleteness; or
- a structured lexical error.

During migration, a default `scan()` MAY adapt simple atom classes whose full
behavior is genuinely equivalent to include-or-end. After migration, generic
phases MUST NOT use concrete-class checks to supplement `canInclude()`.

### Class-specific responsibilities

#### `FrameSchema`

`scan()` MUST commit raw `<` and `>` as structural opening or closing roles.
Dotted comparisons do not participate in this registration, so no future Symbol
is required before the Parse push or pop action.

#### `FrameOperator`

`scan()` MUST handle operator continuation after commitment. Raw `<` and `>` are
not operator starts under the explicit-dot decision. The operator grammar, not
Sigilizer, decides when any other operator commits and when its token body
completes.

Whether HC permits arbitrary operator names or only a declared vocabulary
remains a language decision.

#### `FrameName`

`scan()` MUST own the distinction among identifier hyphens, operator-starting
names, dotted comparison properties, and boundaries that begin a new operator
token. Once `.` selects `FrameName`, `<`, `>`, and a following `=` when retained
MUST be eligible name-body Symbols despite their raw terminal registrations.
Generic Lex MUST no longer compare its factory against `FrameName` or override
its accepted continuation because a Symbol is also a terminal.

#### `FrameQuote`

`scan()` MUST supply shared quoted-token behavior. Ordinary terminals remain
content unless the selected quote syntax classifies them as closure or error.
Generic Lex MUST no longer ask whether the selected atom is a quote.

#### `FrameString`

`scan()` MUST recognize the smart closing quote as consumed closure and retain
ordinary punctuation as content.

#### `FrameComment`

`scan()` MUST distinguish explicit `#` closure, logical-newline termination, and
ordinary content. Its result reports whether the terminating Symbol is consumed
or redispatched. Generic Lex MUST no longer special-case comments.

#### `FrameBlob`

`scan()` MUST validate continuation according to the base selected by the
literal prefix rather than accepting the base-64 character set for every blob.

#### `FrameDoc` or document lexical mode

The document participant owns initial selection, maximal backtick-run
classification, fence comparison, boundary redispatch, source preservation, and
document-specific errors through `scan()`. These rules MAY remain in a
specialized Lex mode; they MUST NOT move into Sigilizer.

#### `FrameBytes` or byte lexical mode

The byte participant owns initial selection, length recognition, transition to
fixed-count payload consumption, and token completion through `scan()`. Generic
Lex MUST no longer test for `FrameBytes` to create `LexBytes`.

#### Ordinary atoms

Numbers, symbols, aliases, arguments, notes, and other unambiguous simple atoms
MAY use inherited `FrameAtom.scan()` behavior if focused tests prove their full
transition is equivalent to include-or-end plus ordinary boundary redispatch.

## Method: `finishInput()`

### Purpose

Provide one EOF completion contract for every active lexical Frame.

### Receiver

Any Frame that can remain active after the final source Symbol, including:

- pending Sigils;
- generic Lex states;
- quote, comment, document, and byte states;
- specialized lexical modes returned by `scan()`; and
- lexical error states.

The base `Frame` behavior represents already-complete stateless input unless a
subclass owns active source.

### Required outcomes

The returned Frame MUST distinguish:

1. **Complete:** active source validly completes and any final Token or
   structural action has been emitted.
2. **Complete without value:** active void syntax validly terminates without a
   Token.
3. **Incomplete:** more source is required for a valid completion.
4. **Invalid:** source cannot complete validly, with a structured error and
   exact source.

### Required behavior

- EOF MUST reach the active returned Frame, not only selected concrete classes.
- A physical chunk boundary MUST NOT call `finishInput()`.
- Pending Sigils MUST resolve solitary valid forms or report incomplete/invalid
  sigils.
- Generic atoms such as numbers and names MUST emit their final Token at EOF.
- Unterminated smart strings MUST fail rather than report successful completion
  with no output.
- Comments MAY terminate validly at EOF according to their language rule.
- Documents MUST retain the behavior covered by existing fence and chunk tests.
- Byte modes MUST reject payloads shorter than their declared length.
- Failure MUST be available directly from the returned Frame; callers MUST NOT
  require a concrete-class `failure()` query.

### Relationship to existing methods

`LexDoc.finishInput()` is the working precedent and becomes an implementation of
the common contract rather than a document-only evaluator exception.

The current document-only `failure()` side channel SHOULD be superseded by a
structured returned result. `ParsePipe.finish()` and terminal `finish()` have
different phase meanings and are not replaced by this lexical-input contract.

## Required Method Placement by Existing Class

The following table identifies minimum ownership. “Default” means inherited
behavior for ordinary subclasses; “override” means demonstrated syntax cannot be
represented by that default.

| Existing class                                                      | Required methods or changes                                                                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Frame`                                                             | Define defaults for `sigilStarts()`, `scan(Symbol)`, and `finishInput()` so every returned Frame participates uniformly.    |
| `FrameAtom`                                                         | Supply default atom registration and simple selected-token scanning, including ordinary boundary redispatch.                |
| `FrameList`                                                         | Advertise structural sigils and scan them to commitment without executing actions during discovery.                         |
| `FrameSchema`                                                       | Scan raw `<` and `>` as immediately committed opening/closing structural roles.                                             |
| `FrameOperator`                                                     | Override `scan()` for undotted operator continuation/completion; do not claim raw `<` or `>` starts.                        |
| `FrameName`                                                         | Override `scan()` for name/operator, hyphen, and dotted comparison boundaries, including terminal characters after `.`.     |
| `FrameQuote`                                                        | Supply shared quoted-token `scan()` behavior.                                                                               |
| `FrameString`                                                       | Override smart-quote closure and incomplete-string `finishInput()`.                                                         |
| `FrameComment`                                                      | Override comment closure/newline scanning and EOF completion.                                                               |
| `FrameDoc`                                                          | Advertise document syntax and own document scanning/completion directly or through its specialized Lex mode.                |
| `FrameBytes`                                                        | Advertise byte syntax and select its specialized mode independently of its runtime constructor.                             |
| `FrameBlob`                                                         | Override `scan()` for base-aware continuation validation.                                                                   |
| `FrameNumber`, `FrameSymbol`, `FrameAlias`, `FrameArg`, `FrameNote` | Use defaults unless focused tests demonstrate a richer transition.                                                          |
| `Lex`                                                               | Participate through `scan()`, delegate syntax decisions polymorphically, emit Token, and contain no concrete syntax checks. |
| `LexDoc`                                                            | Conform document behavior to common `scan()` and `finishInput()` results.                                                   |
| `LexBytes`                                                          | Conform fixed-count behavior and premature EOF to common `scan()` and `finishInput()` results.                              |
| `LexPipe` / Sigilizer host                                          | Discover starts, invoke `scan()` on the active Frame, and route redispatch without syntax-specific pending state.           |
| `HCEval`                                                            | Retain any active returned Frame and call common `finishInput()` without `LexDoc` checks.                                   |

## Methods Explicitly Not Required

This specification does not add:

- `advanceSigil()`: pending Sigils implement `scan()`.
- `commitSigil()`: commitment is a `scan()` outcome.
- `advanceLex()`: active Lex states implement `scan()`.
- A candidate-priority or composition method: the known collision is removed by
  explicit dotted comparison names, and no concrete overlapping Sigil remains.
- A lookahead-count method: the active Frame retains as much source as its
  grammar requires.
- A boundary-consumption method: consumption and redispatch are `scan()`
  outcomes.
- A lexical-error getter: errors are structured returned Frames, including from
  `finishInput()`.
- A parser-nesting query: structural validity remains a Parse responsibility.
- Phone-specific lexical methods: the white-paper spelling already decomposes
  into existing operator, number, and numeric-name/property forms.
- Ternary-specific methods: `?`/`:` composition is an Eval concern.

Adding another generic method later requires evidence that the three specified
contracts cannot express required behavior without concrete-class branching.

## Functional Requirements

### Discovery and scanning

- **FR-001:** Every lexical and structural syntax class MUST advertise initial
  participation through `sigilStarts()`.
- **FR-002:** The registry MUST reject or explicitly report conflicting starts;
  it MUST NOT choose among them by exact-key priority or registration order.
- **FR-003:** Sigilizer MUST invoke `scan(Symbol)` polymorphically for every
  active lexical state and MUST NOT branch on syntax subclasses.
- **FR-004:** Every pending result MUST carry all source-dependent state as a
  returned Frame.
- **FR-005:** Every commitment MUST be represented as a `scan()` transition and
  occur exactly once.
- **FR-006:** Structural actions MUST NOT execute before lexical commitment.
- **FR-007:** Every transition MUST preserve and transfer exact source without
  duplication or loss.

### Selected-token behavior

- **FR-008:** Generic Lex MUST use `scan()` as its normative continuation
  contract.
- **FR-009:** `scan()` MUST express initial non-match, pending interpretation,
  commitment, consumed continuation, consumed completion, redispatched
  completion, mode transition, Token completion, structural action, and error.
- **FR-010:** Generic Lex MUST contain no syntax-specific tests for names,
  comments, quotes, documents, bytes, blobs, or operators.
- **FR-011:** A selected token MUST emit exactly one Token unless its syntax is
  explicitly void.
- **FR-012:** Every deciding Symbol MUST be consumed or redispatched exactly
  once.

### Streaming and completion

- **FR-013:** Physical input chunking MUST NOT change sigil selection, token
  recognition, structural actions, errors, or results.
- **FR-014:** `HCEval` MUST retain any active returned Frame without testing its
  concrete lexical class.
- **FR-015:** EOF MUST invoke `finishInput()` on the active state.
- **FR-016:** Every incomplete sigil, token, and lexical mode MUST report a
  structured completion failure.
- **FR-017:** Failed completion MUST preserve source and prevent false-success
  doctest summaries.
- **FR-018:** An evaluator MUST be reusable after lexical completion failure.

### Issue #293 behavior

- **FR-019:** Raw `<` and `>` MUST be exclusively discoverable as structural
  Sigils; comparison properties use dot-led `FrameName` syntax.
- **FR-020:** After `.` selects `FrameName`, `<`, `>`, and any retained
  following `=` MUST be scanned as name-body Symbols rather than redispatched as
  structural actions.
- **FR-021:** `+1.408.555.1212` MUST remain lexically expressible as the
  existing `+`, `1`, `.408`, `.555`, and `.1212` forms; Sigilizer MUST NOT
  introduce a phone-specific participant.
- **FR-022:** The four original phone examples MUST retain their exact spelling;
  their separate property/evaluation work MUST NOT be claimed as Sigilizer work.
- **FR-023:** Sigilizer work MUST NOT claim to solve `?`/`:` conditional
  composition.

## User Scenarios and Testing

The primary users are HC language implementers, specification authors, and test
authors.

### Scenario 1: Dotted comparison property

Given `1.> 3`, `.` selects `FrameName`, and the selected name consumes `>` as
its body. The raw schema-close action never participates. A following boundary
completes `.>` and is redispatched exactly once.

Tests MUST cover `.<`, `.>`, any retained `.<=` and `.>=`, every chunk split,
whitespace, newline, and EOF. Evaluation of the property keys belongs to #293.

### Scenario 2: Nested type syntax

Given adjacent raw `<` or `>` characters in nested type notation, each is a
structural Sigil. Parse validates the resulting nesting. No raw run is
reclassified as a comparison operator; comparisons require a leading dot.

### Scenario 3: Phone-shaped property composition

Given `+1.408.555.1212`, existing syntax produces `FrameOperator(+)`,
`FrameNumber(1)`, `FrameName(.408)`, `FrameName(.555)`, and `FrameName(.1212)`.
Sigilizer does not classify the sequence as a phone token.

Making the full expression evaluate to one phone-shaped value requires numeric
property and possibly unary-plus semantics outside this specification. Focused
lexical tests MUST preserve the existing decomposition while that work proceeds.

### Scenario 4: Name and operator boundary

Given `.a-b`, `.a+b`, an operator-starting name, and a name followed by an
operator, `FrameName.scan()` owns the distinction. Generic Lex produces the
correct Token sequence without a `FrameName` class check.

### Scenario 5: Quotes and comments

Given punctuation inside a smart string, punctuation remains content. Given an
explicit comment close, newline termination, or comment EOF, the comment
participant reports the correct transition and boundary disposition through
`scan()`. Generic Lex does not inspect quote or comment classes.

An unterminated smart string at EOF MUST fail explicitly.

### Scenario 6: Document fences

All existing odd/even fence, maximal-run, boundary-redispatch, chunk-invariance,
and EOF tests continue to pass through `scan()` and common lifecycle completion.
`HCEval` does not identify `LexDoc` by class.

### Scenario 7: Byte payload

Given a byte-string start, `FrameBytes.scan()` selects and transitions through
its lexical modes without a constructor-shape workaround in the generic
registry. A complete payload emits one byte Token; premature EOF reports a
structured failure.

### Scenario 8: Structural failure

After a close delimiter commits through `scan()`, Parse reports an unmatched or
mismatched close as a structured structural error. Sigilizer does not inspect
parser nesting, and the source delimiter is not discarded.

### Scenario 9: Ternary listing

Comparison recognition is evaluated separately from conditional runtime
behavior. Passing Sigilizer tests alone does not promote the white-paper ternary
listing to an executable doctest.

## Edge Cases

- A dot-led operator name ending at a physical chunk boundary.
- A selected name ending at logical newline or EOF.
- A committed sigil followed immediately by another sigil with no whitespace.
- A boundary Symbol that is also a structural terminal.
- Several structural closers adjacent to one another.
- An operator prefix that is valid but not a complete operator.
- An arbitrary operator run not present in the built-in operation table.
- A void token such as a comment ending immediately before another token.
- An empty quote, empty document, and empty aggregate.
- An unterminated quote, document, or byte payload.
- A lexical error followed by evaluator reuse.
- Source split at every possible two-chunk boundary.
- A Sigil that commits on EOF without a trailing boundary Symbol.
- An active Lex state that returns another lexical mode.
- A closing delimiter that commits lexically but fails structurally.
- A `scan()` result that emits a Token and returns the unconsumed Symbol to
  entry discovery.

## Assumptions

- Existing and future syntax participants remain Frame classes or expose
  Frame-compatible polymorphic behavior.
- Returned Frames remain the sole representation of input-dependent pipeline
  state.
- The syntax registry reports conflicting starts instead of selecting by
  incidental lookup priority; no conflicting start is required in this scope.
- v0.8.4 represents transition outcomes as `LexicalScan` Frames; future syntax
  may add Frame-compatible states without changing the three contracts.
- Existing document-fence behavior is correct and forms a compatibility
  baseline.
- Dot-prefixed numeric names remain ordinary property syntax; phone-shaped
  examples compose those names with numbers and `+` during evaluation.
- `?` and `:` remain ordinary runtime operators unless a separate specification
  changes them.

## Dependencies

- The explicit-dot decision in 11 removes schema/comparison candidate
  composition from this scope.
- Issue #293 or a follow-up must define numeric-property composition and whether
  leading unary `+` is an identity operation for the phone-shaped examples.
- A separate conditional-semantics decision is required for chained `?` and `:`.
- Structural errors require a Parse-level structured error path.
- The full white-paper doctest remains the authoritative integration baseline.

## Success Criteria

1. All lexical and structural syntax starts are discoverable through one
   `sigilStarts()` contract, with zero dispatch-order dependencies.
2. Every active lexical Frame is advanced through `scan(Symbol)`; generic
   Sigilizer contains zero concrete syntax-family branches.
3. Generic Lex contains zero concrete branches for names, quotes, comments,
   documents, bytes, blobs, or operators.
4. Every demonstrated boundary case consumes or redispatches its deciding Symbol
   exactly once.
5. Every two-chunk split of dotted comparison names, documents, bytes, and
   strings produces the same Tokens, actions, errors, and results as unsplit
   input.
6. EOF produces explicit completion or failure for 100% of active lexical
   Frames; no incomplete source is silently lost.
7. `.<`, `.>`, and any retained `.<=` or `.>=` each reach `FrameName` as one
   dot-led property without executing a schema action.
8. `+1.408.555.1212` retains its existing five-form lexical decomposition;
   completing its property/evaluation semantics neither changes Sigilizer nor
   rewrites the source spelling.
9. Existing document-fence tests and the complete white-paper doctest retain
   zero failures.
10. No passing Sigilizer test is used as evidence that chained `?`/`:`
    evaluation has been solved.

## Implementation Result

Version 0.8.4 implements this specification and 11 without candidate
composition. Dotted comparison names are covered by the `FrameName.scan(Symbol)`
migration, while comparison lookup and evaluation stay in #293. The explicit-dot
decision does not change the three method contracts defined here.
