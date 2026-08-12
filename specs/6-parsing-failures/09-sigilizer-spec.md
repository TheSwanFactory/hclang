# Sigilizer Interface Specification

**Status:** Proposed\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Feature issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Builds on:** [08-sigilizer-phase.md](./08-sigilizer-phase.md)\
**Related analysis:** [01-parsing-triage.md](./01-parsing-triage.md),
[02-ternary-failure-analysis.md](./02-ternary-failure-analysis.md),
[03-lookahead-tensions.md](./03-lookahead-tensions.md), and
[05-tokenizer-conjecture-evaluation.md](./05-tokenizer-conjecture-evaluation.md)

## Summary

HC requires a stateless Sigilizer phase between source symbolication and the
existing Lex phase.

The Sigilizer MUST call polymorphic methods on registered syntax Frames. It MUST
NOT recognize particular token families through concrete class checks or retain
input-dependent state. A returned Frame-shaped Sigil carries every pending or
committed lexical-selection decision.

The existing Frame API does not yet expose all behavior required by this phase.
This specification defines five method contracts to add to the existing Frame
hierarchy:

| Method           | Responsibility                                                        |
| ---------------- | --------------------------------------------------------------------- |
| `sigilStarts()`  | Advertise one or more possible initial sigil forms.                   |
| `advanceSigil()` | Refine an initial or pending sigil with a source Symbol.              |
| `commitSigil()`  | Turn a committed sigil into Lex state or a structural action.         |
| `advanceLex()`   | Decide selected-token continuation, completion, transition, or error. |
| `finishInput()`  | Resolve any active sigil, token, or lexical mode at EOF.              |

These are method contracts, not implementations. This specification does not
prescribe signatures, return classes, algorithms, storage, or control-flow
mechanics beyond HC's existing requirement that returned Frames represent the
next monadic state.

## Problem Statement

1. **Token-family commitment happens too early.** Exact structural terminals
   currently claim `<` and `>` before operator syntax can recognize `<<`, `>>`,
   `<=`, or `>=`. The discarded characters can leave apparently successful
   residual expressions.
2. **Syntax-owned behavior leaks into generic Lex.** Names, comments, quotes,
   and byte strings require concrete-class checks because
   `canInclude(char): boolean` cannot express the required transitions.
3. **Active lexical states do not share a lifecycle.** Document strings alone
   expose structured EOF validation. Other unfinished forms, including smart
   strings and byte payloads, can be lost or handled through concrete checks.
4. **New literal families cannot participate cleanly.** A native phone literal
   shares `+` with operator syntax but has no protocol for remaining viable
   before selection and then owning its internal punctuation after selection.
5. **Rendering and recognition contracts are conflated.** Methods such as
   `string_start()`, `string_open()`, and `string_close()` are used to derive
   lexical dispatch even though their names and other uses concern source
   rendering and aggregate notation.

## Goals

1. Define the Frame methods required by the stateless Sigilizer phase.
2. Separate sigil selection from selected-token recognition.
3. Keep syntax-specific decisions on the relevant Frame classes.
4. Represent all incomplete state through returned Frames.
5. Delay structural side effects until a sigil commits.
6. Replace boolean token continuation with syntax-owned transition outcomes.
7. Give pending Sigils and active Lex states one EOF completion contract.
8. Make phone syntax extensible without adding phone-specific branches to
   Sigilizer or Lex.
9. Preserve exact source while selection or token recognition is incomplete.
10. Preserve the existing monadic Symbol-to-Frame reduction model.

## Non-goals

- Implementing the Sigilizer, Sigil, phone literal, comparison operators, or any
  method defined here.
- Selecting a concrete method signature or TypeScript return type.
- Choosing an internal candidate collection, automaton, parser combinator, or
  buffering algorithm.
- Renaming the existing `Lex`, `Token`, `ParsePipe`, or `EvalPipe` concepts.
- Defining whether `<<` and `>>` outrank adjacent nested type delimiters.
- Defining whether `<=` and `>=` remain HC comparison spellings.
- Defining the full native phone-number grammar or runtime representation.
- Changing the left-to-right expression model.
- Fixing the evaluator semantics of chained `?` and `:` conditionals.
- Moving structural nesting validation from Parse into Sigilizer.
- Rewriting white-paper examples into different syntax.

## Terminology and Phase Boundary

The normative phase flow is:

**String → Symbol → Sigilizer → Sigil → Lex → Token → Parse → Eval**

### Symbol

A Symbol is the Frame representation of one source character supplied to the
lexical pipeline.

### Sigilizer

Sigilizer is a stateless phase driver. It discovers relevant syntax
participants, invokes their sigil methods, and routes the returned Frame.

### Sigil

A Sigil is source state sufficient, or potentially sufficient after more input,
to select an HC Lex recognizer or structural action.

A Sigil is **pending** while more than one interpretation remains viable or the
sole interpretation is not yet complete. A Sigil is **committed** when exactly
one Lex recognizer or structural action owns the source.

### Lex

Lex begins after token-family commitment. It recognizes and completes the
selected token, then emits Token to Parse.

### Lexical mode

A lexical mode is a selected, stateful continuation with token-specific rules,
such as document-fence recognition or fixed-count byte payload consumption. A
mode is downstream of sigil commitment unless its token family itself remains
ambiguous.

## Key Entities

### Syntax participant

An existing Frame class that advertises a sigil start and supplies behavior for
recognizing, committing, or lexing that syntax.

### Sigil registration

The source-start description returned by `sigilStarts()`. It discovers
participants but does not necessarily commit one.

### Sigil transition

The Frame returned after `advanceSigil()` processes a Symbol. It represents
non-participation, continued viability, commitment, boundary redispatch, or
failure.

### Lex transition

The Frame returned after `advanceLex()` processes a Symbol for a selected token
family. It represents continuation, completion, boundary disposition, a lexical
mode transition, or failure.

### Completion result

The Frame returned by `finishInput()`. It represents successful completion,
valid termination without a value, incomplete input, or a structured failure.

## Method Contract Overview

The five methods form two syntax protocols plus one shared lifecycle protocol:

| Protocol          | Methods                                            | Active before or after commitment |
| ----------------- | -------------------------------------------------- | --------------------------------- |
| Sigil recognition | `sigilStarts()`, `advanceSigil()`, `commitSigil()` | Before commitment                 |
| Token recognition | `advanceLex()`                                     | After token-family commitment     |
| Input lifecycle   | `finishInput()`                                    | Both                              |

No additional generic method is required solely for boundary redispatch,
candidate priority, error retrieval, or lexical-mode entry. Those meanings MUST
be conveyed by the Frames returned from these methods.

## Method: `sigilStarts()`

### Purpose

Advertise the source forms that make a Frame class relevant to initial sigil
recognition.

### Receiver

Every existing Frame class that defines lexical or structural source syntax. The
base `Frame` contract supplies no registrations unless a subclass advertises
them.

### Required information

Each advertised start MUST identify:

- the exact character or character-class pattern that triggers participation;
- the syntax role being considered;
- whether the start can commit immediately or may require refinement; and
- enough identity to return to the responsible syntax participant.

One Frame class MAY advertise multiple starts or roles. `FrameSchema`, for
example, participates separately as an opening and closing structural form.

### Required behavior

- Registration discovers candidates; it MUST NOT execute a structural action.
- Overlapping registrations MUST coexist without relying on exact-key priority
  or incidental insertion order.
- A registration MUST NOT require the Sigilizer to know the concrete Frame
  subclass.
- Explicit punctuation sigils and implicit letter/digit sigils MUST use the same
  discovery contract.

### Relationship to existing methods

`sigilStarts()` becomes the normative recognition-registration method.

- `string_start()` MAY serve as a compatibility source for simple atom classes,
  but MUST NOT remain the only contract for overlapping sigils.
- `string_prefix()` and `string_suffix()` remain rendering methods.
- `string_open()` and `string_close()` remain aggregate notation and rendering
  methods; structural registration moves to `sigilStarts()`.

### Classes requiring participation

- `FrameAtom` supplies a default for ordinary atom subclasses.
- `FrameList` supplies structural registration behavior that subclasses can
  refine.
- `FrameSchema` advertises distinct `<` and `>` structural roles.
- `FrameOperator` advertises every valid operator-start class, including starts
  overlapping with structural syntax.
- `FrameBytes` advertises its leading backslash without depending on its runtime
  value constructor.
- A future phone Frame advertises its chosen explicit or ambiguous leading form.

## Method: `advanceSigil()`

### Purpose

Process one source Symbol while a syntax participant or pending Sigil is
deciding whether and how the source commits.

### Receiver

- A registered syntax participant during initial discovery; or
- a returned pending Sigil during refinement.

The base `Frame` contract represents non-participation unless a subclass or
Sigil role supplies recognition behavior.

### Inputs

The method MUST have access to:

- the next source Symbol;
- the exact prefix already represented by the receiver, if any; and
- the syntax role or viable interpretations represented by the receiver.

The method MUST NOT require mutable pending state on the Sigilizer.

### Required outcomes

The returned Frame MUST distinguish these semantic outcomes:

1. **No match:** this participant cannot own the prefix.
2. **Pending:** the prefix remains valid but cannot commit yet.
3. **Committed:** exactly one syntax interpretation owns the prefix.
4. **Committed with unconsumed boundary:** the interpretation commits, and the
   Symbol that exposed the boundary must be redispatched.
5. **Invalid sigil:** no valid continuation exists for this participant, with
   the original source retained for diagnostics.

The specification does not prescribe separate result subclasses or flags for
these meanings.

### Required behavior

- A pending result MUST itself be a valid next monadic receiver.
- A physical chunk boundary MUST NOT force a pending result to commit.
- Refinement MUST preserve exact source spelling.
- The method MAY narrow several viable interpretations to one or more remaining
  interpretations.
- The method MUST NOT execute parser-stack mutations before commitment.
- The method MUST report whether the deciding Symbol was consumed.

### Class-specific responsibilities

#### `FrameSchema`

`advanceSigil()` MUST allow `<` and `>` to remain viable structural forms while
overlapping operator forms remain viable. It MUST NOT push or pop Parse during
this stage.

#### `FrameOperator`

`advanceSigil()` MUST participate in every operator prefix that overlaps another
syntax family, including the type delimiters and any future phone prefix. The
operator grammar, not Sigilizer, decides when an operator sigil can commit.

#### Future phone Frame

If phone syntax retains a leading `+`, `advanceSigil()` MUST represent the phone
interpretation alongside the operator interpretation until the language-defined
prefix commits or fails.

#### Ordinary atoms

Numbers, symbols, names, strings, comments, aliases, arguments, notes, blobs,
and unambiguous operators MAY commit after their first Symbol through the
default `FrameAtom` behavior.

## Method: `commitSigil()`

### Purpose

Convert a committed Sigil into the next executable lexical or structural state.

### Receiver

The syntax participant selected by the committed Sigil, or the committed Sigil
acting on behalf of that participant.

### Inputs

The method MUST receive or have access to:

- the exact committed sigil source;
- the selected syntax role;
- the downstream Parse receiver or pipeline link; and
- any source already belonging to the eventual token value.

### Required outcomes

For lexical syntax, `commitSigil()` returns or selects the appropriate Lex
state.

For structural syntax, `commitSigil()` returns or performs the already selected
structural action through the existing pipeline, after which control returns to
sigil recognition.

For invalid commitment, it returns a structured failure preserving source.

### Required behavior

- Commitment MUST occur exactly once.
- Structural side effects MUST begin only here or downstream of here.
- The initial source MUST be transferred without duplication or loss.
- The generic Sigilizer MUST NOT construct special Lex subclasses through
  concrete type checks.
- Syntax classes MAY select a generic Lex or a specialized lexical mode.
- A committed structural Sigil MUST retain its opening-versus-closing role.

### Special cases regularized by this method

#### Generic atoms

`FrameAtom` supplies the default commitment to generic Lex using the selected
atom family and committed source.

#### Documents

`FrameDoc` selects document-specific Lex behavior without a central `atomLexers`
map keyed by concrete class.

#### Byte strings

`FrameBytes` selects its length/payload lexical path without satisfying the
generic atom constructor assumption and without a `FrameBytes` branch in generic
Lex.

#### Structural aggregates

`FrameList` subclasses commit opening and closing actions without treating their
rendering delimiters as immediately executable lookup entries.

#### Future phone literals

The future phone Frame selects generic or specialized phone Lex behavior without
adding phone-specific construction to Sigilizer.

## Method: `advanceLex()`

### Purpose

Replace `canInclude(char): boolean` with a syntax-owned selected-token
transition that can express continuation, completion, boundary disposition, mode
changes, and errors.

### Receiver

The selected token-family participant or lexical mode used by Lex.

### Inputs

The method MUST have access to:

- the next source Symbol;
- the exact source accumulated for the selected token;
- the committed Sigil and syntax role; and
- any token-family state needed to interpret the next Symbol.

This access MAY be represented by the receiver, the Lex state, method arguments,
or Frame context. This specification does not choose the representation.

### Required outcomes

The returned Frame MUST distinguish:

1. **Continue and consume:** the Symbol belongs to the selected token.
2. **Complete and consume:** the Symbol closes or terminates the token and does
   not begin another source form.
3. **Complete and redispatch:** the Symbol does not belong to this token and
   must return to Sigilizer exactly once.
4. **Transition lexical mode:** token recognition continues in another
   syntax-owned Frame state.
5. **Remain incomplete:** the token remains active across a non-final transport
   boundary.
6. **Lexical error:** the selected token body is invalid, with exact source
   retained.

### Required behavior

- Generic Lex MUST route the returned transition without inspecting concrete
  Frame subclasses.
- Token-family rules MUST remain on the relevant Frame class or specialized
  lexical mode.
- A Symbol MUST be consumed or redispatched exactly once.
- A transition MUST NOT silently discard invalid source.
- A completed result MUST emit exactly one Token unless the selected syntax is
  explicitly void, such as a comment.
- The result MUST preserve the existing monadic parent-return behavior.

### Relationship to `canInclude()`

`canInclude()` is insufficient as the normative contract because it cannot
express consumed closure, redispatched boundary, lexical-mode transition,
incompleteness, or error.

During migration, a default `advanceLex()` MAY adapt simple atom classes whose
complete behavior is genuinely equivalent to include-or-end. After migration,
generic Lex MUST NOT depend on concrete-class checks to supplement
`canInclude()`.

### Class-specific responsibilities

#### `FrameName`

`advanceLex()` owns the distinction among identifier hyphens, operator-starting
names, and a new operator token. Generic Lex MUST no longer compare its factory
against `FrameName`.

#### `FrameQuote`

`advanceLex()` supplies shared quoted-token behavior: ordinary terminals remain
content unless the selected quote syntax classifies them as closure or error.
Generic Lex MUST no longer ask whether the selected atom is a quote.

#### `FrameString`

`advanceLex()` recognizes the smart closing quote as consumed closure and keeps
ordinary punctuation as content.

#### `FrameComment`

`advanceLex()` distinguishes explicit `#` closure from logical-newline
termination and reports whether the terminating Symbol is consumed or
redispatched. Generic Lex MUST no longer special-case comment boundaries.

#### `FrameOperator`

`advanceLex()` owns operator continuation and completion after the operator
family has committed. Whether HC permits arbitrary operator names or only a
declared vocabulary remains a language decision, but generic Lex MUST not decide
it from an undifferentiated character class.

#### `FrameBlob`

`advanceLex()` validates continuation according to the base selected by the
literal prefix rather than accepting the base-64 character set for every blob.

#### `FrameDoc` or document lexical mode

The document participant owns maximal run classification, fence comparison,
source preservation, and document-specific errors. These rules MAY remain in a
specialized Lex mode; they MUST NOT move into generic Sigilizer.

#### `FrameBytes` or byte lexical mode

The byte participant owns the transition from length recognition to fixed-count
payload consumption. Generic Lex MUST no longer test for `FrameBytes` to create
`LexBytes`.

#### Future phone Frame

After its Sigil commits, `advanceLex()` owns phone segments, punctuation,
termination, invalid forms, and exact spelling. `FrameNumber` MUST NOT acquire
phone-specific continuation rules.

## Method: `finishInput()`

### Purpose

Provide one EOF completion contract for every active Sigil, Lex state, and
specialized lexical mode.

### Receiver

Any Frame that can remain active after the final source Symbol, including:

- pending Sigils;
- generic Lex states;
- quote, comment, document, byte, and future phone Lex states; and
- specialized lexical modes returned by `advanceLex()`.

The base `Frame` behavior represents already-complete stateless input unless a
subclass owns active source.

### Required outcomes

The returned completion result MUST distinguish:

1. **Complete:** the active source validly completes and any final Token or
   structural action has been emitted.
2. **Complete without value:** the active syntax validly terminates without a
   Token, as permitted for void syntax.
3. **Incomplete:** more source is required for a valid completion.
4. **Invalid:** the source cannot complete validly, with a structured error and
   exact source.

### Required behavior

- EOF MUST reach the active returned Frame, not only selected concrete classes.
- A physical chunk boundary MUST NOT call `finishInput()`.
- Pending Sigils MUST resolve solitary valid forms or report incomplete/invalid
  sigils.
- Generic atoms such as numbers and names MUST emit their final Token at EOF.
- Unterminated smart strings MUST report failure rather than successful lexical
  completion with no output.
- Comments MAY terminate validly at EOF according to their language rule.
- Documents MUST retain the behavior already covered by fence and chunk tests.
- Byte modes MUST reject payloads shorter than their declared length.
- A future phone recognizer MUST accept or reject its final segment according to
  the phone grammar.
- Completion failure MUST be available directly from the returned Frame result;
  callers MUST NOT require a separate concrete-class `failure()` query.

### Relationship to existing methods

`LexDoc.finishInput()` is the working precedent and becomes an implementation of
the common contract rather than a document-only evaluator exception.

The current document-only `failure()` side channel SHOULD be superseded by a
structured completion result. `ParsePipe.finish()` and terminal `finish()` have
different phase meanings and are not replaced by this lexical-input contract.

## Required Method Placement by Existing Class

The following table identifies the minimum expected ownership. “Default” means
the class provides behavior inherited by ordinary subclasses; “override” means
the class has demonstrated syntax that cannot be represented by the default.

| Existing class                                                      | Required methods or changes                                                                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Frame`                                                             | Define default contracts for `sigilStarts()`, `advanceSigil()`, `commitSigil()`, and `finishInput()` so all returned Frames participate uniformly.                  |
| `FrameAtom`                                                         | Default atom `sigilStarts()`, immediate `advanceSigil()` for disjoint starts, generic-Lex `commitSigil()`, and compatibility `advanceLex()` for truly simple atoms. |
| `FrameList`                                                         | Structural `sigilStarts()` and `commitSigil()` roles derived from aggregate syntax without executing them during registration.                                      |
| `FrameSchema`                                                       | Override sigil behavior for ambiguous `<` and `>` opening/closing roles.                                                                                            |
| `FrameOperator`                                                     | Override sigil refinement for overlapping prefixes and token advancement for operator completion.                                                                   |
| `FrameName`                                                         | Override `advanceLex()` for name/operator and hyphen boundaries.                                                                                                    |
| `FrameQuote`                                                        | Shared quoted-token `advanceLex()` behavior.                                                                                                                        |
| `FrameString`                                                       | Smart-quote closure and incomplete-string `finishInput()`.                                                                                                          |
| `FrameComment`                                                      | Comment closure/newline boundary behavior and EOF completion.                                                                                                       |
| `FrameDoc`                                                          | Specialized-Lex `commitSigil()`; document mode owns `advanceLex()` and `finishInput()`.                                                                             |
| `FrameBytes`                                                        | Reachable `sigilStarts()` and specialized `commitSigil()` independent of its runtime constructor.                                                                   |
| `FrameBlob`                                                         | Base-aware `advanceLex()` validation.                                                                                                                               |
| `FrameNumber`, `FrameSymbol`, `FrameAlias`, `FrameArg`, `FrameNote` | Use defaults unless focused tests demonstrate a richer boundary.                                                                                                    |
| `Lex`                                                               | Route `advanceLex()` results and implement the common `finishInput()` lifecycle without concrete syntax checks.                                                     |
| `LexDoc`                                                            | Conform existing document completion/error behavior to common `advanceLex()` and `finishInput()` results.                                                           |
| `LexBytes`                                                          | Conform fixed-count consumption and premature EOF to common `advanceLex()` and `finishInput()` results.                                                             |
| `LexPipe`                                                           | Host or call stateless sigilization and redispatch without retaining syntax-specific pending state.                                                                 |
| `HCEval`                                                            | Retain any active Frame returned by Sigilizer or Lex and call common `finishInput()` without `LexDoc` checks.                                                       |

A future phone Frame is not an existing class and therefore is not part of this
method-addition table. It MUST implement the same five-method protocol as
applicable and MUST NOT require new generic phase methods.

## Methods Not Required

This specification deliberately does not add the following methods:

- A candidate-priority method. Overlapping valid interpretations remain pending
  until syntax-owned rules commit them.
- A lookahead-count method. The responsible Sigil or Lex state retains as much
  source as its grammar requires.
- A boundary-consumption method. Consumption and redispatch are outcomes of
  `advanceSigil()` and `advanceLex()`.
- A lexical-error getter. Errors are structured returned Frames, including from
  `finishInput()`.
- A parser-nesting query. Structural validity remains a Parse responsibility.
- Phone-specific methods on `FrameNumber`, `FrameOperator`, Sigilizer, or Lex.
- Ternary-specific methods. `?`/`:` composition is an Eval concern.

Adding one of these methods later requires evidence that the five specified
contracts cannot express a required behavior without concrete-class branching.

## Functional Requirements

### Sigil discovery and commitment

- **FR-001:** Every lexical and structural syntax class MUST advertise its
  initial participation through `sigilStarts()`.
- **FR-002:** The registry MUST preserve all participants whose advertised
  starts overlap.
- **FR-003:** Sigilizer MUST invoke `advanceSigil()` polymorphically and MUST
  NOT branch on syntax subclasses.
- **FR-004:** Every pending result MUST carry all source-dependent state as a
  returned Frame.
- **FR-005:** Every commitment MUST pass through `commitSigil()` exactly once.
- **FR-006:** Structural actions MUST NOT execute before sigil commitment.
- **FR-007:** A committed sigil MUST preserve and transfer its exact source.

### Selected-token recognition

- **FR-008:** Generic Lex MUST use `advanceLex()` as its normative continuation
  contract.
- **FR-009:** `advanceLex()` MUST distinguish consumed continuation, consumed
  completion, redispatched completion, mode transition, incompleteness, and
  lexical error.
- **FR-010:** Generic Lex MUST contain no syntax-specific tests for names,
  comments, quotes, documents, bytes, blobs, operators, or phones.
- **FR-011:** A selected token MUST emit exactly one Token unless its syntax is
  explicitly void.
- **FR-012:** Every boundary Symbol MUST be consumed or redispatched exactly
  once.

### Streaming and completion

- **FR-013:** Physical input chunking MUST NOT change sigil selection, token
  recognition, structural actions, errors, or results.
- **FR-014:** `HCEval` MUST retain any active returned Frame without testing its
  concrete lexical class.
- **FR-015:** EOF MUST invoke `finishInput()` on the active state.
- **FR-016:** Every incomplete sigil, token, and lexical mode MUST report a
  structured completion failure.
- **FR-017:** A failed completion MUST preserve source and prevent false-success
  doctest summaries.
- **FR-018:** An evaluator MUST be reusable after a lexical completion failure.

### Issue #293 behavior

- **FR-019:** `<` and `>` MUST be discoverable as structural sigils while
  `FrameOperator` remains discoverable for overlapping comparison prefixes.
- **FR-020:** No comparison-prefix character may be discarded through a parser
  action before lexical commitment.
- **FR-021:** A native phone syntax sharing `+` with operators MUST use the
  generic sigil protocol and a phone-owned Lex contract.
- **FR-022:** The four original phone examples MUST retain their exact spelling;
  no syntax rewrite may substitute for recognition.
- **FR-023:** The Sigilizer work MUST NOT claim to solve `?`/`:` conditional
  composition.

## User Scenarios and Testing

The primary users are HC language implementers, specification authors, and test
authors.

### Scenario 1: Ambiguous greater-than prefix

Given a source `>`, Sigilizer discovers both the schema-close and operator
participants. No parser action occurs. A subsequent `>` can commit the operator
interpretation, while a language-defined boundary can commit the structural
interpretation and be redispatched exactly once.

Tests MUST cover the prefix in one chunk, across every chunk split, before
whitespace, before newline, and at EOF.

### Scenario 2: Nested type syntax

Given adjacent `<` or `>` characters in nested type notation, syntax-owned sigil
rules produce either the language-defined structural sequence or a comparison
operator. The result MUST not depend on parser side effects executed before
commitment.

The scenario records the architectural requirement without deciding the grammar.

### Scenario 3: Native phone literal

Given `+1.408.555.1212`, operator and phone syntax participate without a generic
phase branch. Once phone syntax commits, the phone recognizer consumes the
literal as one value and preserves its exact spelling through EOF and HCSV/HCSON
boundaries.

Tests MUST include standalone, HCSV, HCSON, whitespace, comma, closing
delimiter, EOF, invalid phone forms, and adjacent arithmetic syntax.

### Scenario 4: Name and operator boundary

Given `.a-b`, `.a+b`, an operator-starting name, and a name followed by an
operator, `FrameName.advanceLex()` owns the distinction. Generic Lex produces
the correct Token sequence without a `FrameName` class check.

### Scenario 5: Quotes and comments

Given punctuation inside a smart string, the punctuation remains content. Given
an explicit comment close, newline termination, or comment EOF, the comment
participant reports the correct consumption and completion. Generic Lex does not
inspect quote or comment classes.

An unterminated smart string at EOF MUST fail explicitly.

### Scenario 6: Document fences

All existing odd/even fence, maximal-run, boundary-redispatch, chunk-invariance,
and EOF tests continue to pass through the common lifecycle contract. `HCEval`
does not identify `LexDoc` by class.

### Scenario 7: Byte payload

Given a byte-string start, `FrameBytes.commitSigil()` selects its lexical path
without a constructor-shape workaround in the generic registry. A complete
payload emits one byte Token; premature EOF reports a structured failure.

### Scenario 8: Structural failure

After a close delimiter has committed, Parse reports an unmatched or mismatched
close as a structured structural error. Sigilizer does not inspect parser
nesting, and the source delimiter is not discarded.

### Scenario 9: Ternary listing

Comparison sigil recognition is evaluated separately from conditional runtime
behavior. The exact white-paper ternary listing remains classified according to
the comparison spelling and `?`/`:` semantics; passing sigil tests alone does
not promote it to an executable doctest.

## Edge Cases

- An ambiguous sigil ending at a physical chunk boundary.
- An ambiguous sigil ending at logical newline or EOF.
- A committed sigil followed immediately by another sigil with no whitespace.
- A boundary Symbol that is also a structural terminal.
- Several structural closers adjacent to one another.
- An operator prefix that is valid but not a complete operator.
- An arbitrary operator run not present in the built-in operation table.
- A void token such as a comment ending immediately before another token.
- An empty quote, empty document, and empty aggregate.
- An unterminated quote, document, byte payload, or future phone literal.
- A lexical error followed by evaluator reuse.
- Source split at every possible two-chunk boundary.
- A Sigil that commits on EOF without a trailing boundary character.
- A selected Lex mode that returns another lexical mode.
- A closing delimiter that commits lexically but fails structurally.

## Assumptions

- Existing and future syntax participants remain Frame classes or expose
  Frame-compatible polymorphic behavior.
- Returned Frames remain the sole representation of input-dependent pipeline
  state.
- The syntax registry can expose overlapping participants without committing an
  implementation strategy.
- The exact representation of transition outcomes will be designed later.
- The existing document-fence behavior is correct and forms a compatibility
  baseline.
- A future native phone literal will have its own Frame responsibility rather
  than extending numeric arithmetic semantics.
- `?` and `:` remain ordinary runtime operators unless a separate specification
  changes them.

## Dependencies

- Issue #292 must decide how overlapping syntax participants compose into one
  returned Sigil Frame.
- Issue #293 or a follow-up must define the native phone grammar and value
  Frame.
- A separate conditional-semantics decision is required for chained `?` and `:`.
- Structural errors require a Parse-level structured error path.
- The full white-paper doctest remains the authoritative integration baseline.

## Success Criteria

1. All lexical and structural syntax starts are discoverable through one
   `sigilStarts()` contract, with zero dispatch-order dependencies.
2. Generic Sigilizer contains zero concrete syntax-family branches.
3. Generic Lex contains zero concrete branches for names, quotes, comments,
   documents, bytes, blobs, operators, or phones.
4. Every demonstrated boundary case reports exactly one consumption or
   redispatch of its deciding Symbol.
5. Every two-chunk split of ambiguous comparison, document, byte, string, and
   phone fixtures produces the same Tokens, actions, errors, and results as
   unsplit input.
6. EOF produces an explicit completion or failure for 100% of active Sigil and
   Lex states; no incomplete source is silently lost.
7. `<<`, `>>`, and any retained equals-suffixed comparisons reach operator Lex
   whenever the eventual grammar classifies them as operators.
8. The four original HCSV/HCSON phone fixtures parse as one phone value without
   changing their source spelling once the phone grammar is implemented.
9. Existing document-fence tests and the complete white-paper doctest retain
   zero failures.
10. No passing Sigilizer test is used as evidence that chained `?`/`:`
    evaluation has been solved.

## Specification Readiness

This specification is ready for architectural planning after #292 selects how a
pending Sigil composes multiple viable syntax participants. That choice affects
the representation of returned Frames but does not change the five method
contracts defined here.

No implementation work is authorized or included by this document.
