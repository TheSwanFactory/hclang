# The Sigilizer Phase

**Status:** Implemented with the interface and representation refinements in
[09-sigilizer-spec.md](./09-sigilizer-spec.md) and
[12-sigilizer-refactoring.md](./12-sigilizer-refactoring.md)\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Supersedes the naming in:**
[04-tokenizer-conjecture.md](./04-tokenizer-conjecture.md),
[06-tokenizer-phase.md](./06-tokenizer-phase.md), and
[07-lex-tokenizer-split.md](./07-lex-tokenizer-split.md)\
**Related:** #293, [03-lookahead-tensions.md](./03-lookahead-tensions.md), and
[05-tokenizer-conjecture-evaluation.md](./05-tokenizer-conjecture-evaluation.md)

**Subsequent decision:**
[11-candidate-composition-spec.md](./11-candidate-composition-spec.md) reserves
raw `<` and `>` for structural Sigils and uses dot-led `FrameName` properties
for comparisons. It also classifies phone-shaped values as numeric-property
evaluation. Candidate composition is therefore not required by the known
failures; the Sigilizer direction remains for uniform discovery and Frame-owned
scanning.

This document records the architectural decision and its pre-implementation
evidence. Specifications 09 and 12 are normative for the implemented static
`SIGIL_STARTS` and plain-`ScanResult` interfaces.

## Decision

Keep the existing **Lex** name and introduce an earlier, stateless **Sigilizer**
phase.

The Sigilizer converts symbolicated source into a Frame-shaped **Sigil**. A
Sigil is the shortest source prefix sufficient to select either:

- an HC lexical recognizer, represented today by `Lex`; or
- a structural action, represented today by a terminal action routed toward
  parsing.

When a prefix is not yet sufficient to select one interpretation, the returned
Sigil remains pending and represents the unresolved alternatives. The Sigilizer
itself retains no input-dependent state.

This direction replaces the proposed `PreToken`, `Candidate`, and Tokenizer
phase terminology. The current `Lex` remains responsible for building completed
`Token` values.

## Pipeline

```text
source text
    ↓ symbolication
FrameSymbol
    ↓ Sigilizer
Sigil
    ├─ pending → another FrameSymbol refines the Sigil
    ├─ committed structural action → Parse
    ├─ lexical-selection error → shared failure path
    └─ committed lexical recognizer
            ↓ Lex
          Token
            ↓ Parse
          FrameExpr / aggregate structure
            ↓ Eval
          result
```

In compact form:

```text
String → Symbol → Sigilizer → Sigil → Lex → Token → Parse → Eval
```

Unambiguous syntax may pass through a transient Sigil immediately. The pipeline
does not require every source character to allocate a persistent Sigil object.

## Terminology

### Symbol

A Symbol is the Frame representation of one source character supplied by the
existing reduction path.

`FrameString.reduce()` currently converts each character to `FrameSymbol`, calls
the current receiver with it, and uses the returned Frame as the receiver for
the next character.

Within this specification, that transformation remains called **symbolication**.
This is HC-local terminology; elsewhere, symbolication often means resolving
machine addresses to debugging symbols.

### Sigilizer

The Sigilizer is the stateless phase that invokes syntax-owned sigil-recognition
behavior and routes its returned Frame.

It does not contain the rules for `>`, `>>`, names, phone numbers, strings, or
type delimiters. Existing syntax classes supply those rules through new
polymorphic methods.

### Sigil

A Sigil is the shortest committed source prefix that selects an HC `Lex`
recognizer or structural action.

A Sigil may also be pending when its current prefix is valid but insufficient to
commit. In that state, it represents the prefix and viable syntax-owned
interpretations and acts as the next monadic receiver.

This use is broader than the conventional meaning of sigil. A sigil usually
means punctuation attached to an identifier or literal, such as `$name`. HC uses
the term for any source prefix that selects syntax, including implicit letter
and digit sigils.

### Lex

Lex retains its current conceptual responsibility. After a Sigil selects a token
family, Lex accumulates the token body, determines its boundary, constructs the
value Frame, and emits `Token` to Parse.

### Token

Token remains the completed artifact emitted by Lex and consumed by Parse.

### Parse and Eval

Parse builds expressions and aggregate structure from committed tokens and
structural actions. Eval applies the resulting expressions. Neither phase is
renamed by this direction.

## Why Sigil Is the Missing Artifact

The earlier documents tried to name the unresolved state `PreToken`,
`Candidate`, or `LexicalContinuation`. Each name captured one aspect but
obscured another:

- `PreToken` suggested that every outcome eventually becomes a Token, although
  some outcomes are structural actions.
- `Candidate` emphasized ambiguity but did not name the committed lexical
  selector.
- `LexicalContinuation` described monadic behavior but not the syntax artifact
  being recognized.
- `Tokenizer` confused the selecting phase with the existing token-building
  responsibility of `Lex`.

Sigil names the source prefix whose recognition is at stake. The same Frame can
represent a pending sigil and, after refinement, a committed sigil. Ambiguity is
a state of sigil recognition rather than a separate kind of pre-token object.

## Why the Existing `Lex` Name Remains Correct

The existing `Lex` class operates only after `syntax.ts` has selected an atom
factory. It accumulates source, asks the selected atom whether the body may
continue, constructs the selected Frame, wraps it in `Token`, and sends that
Token to `ParsePipe`.

Calling this Lex is consistent with HC's established code and with the broader
use of lexing for token recognition. No rename is required merely because an
earlier sigil-selection responsibility has become explicit.

The phase vocabulary is intentionally HC-specific:

```text
Sigilizer recognizes the selector.
Lex recognizes the selected token.
```

In conventional compiler terminology, both activities may be considered parts of
lexical analysis.

## Stateless Sigilizer, Stateful Sigil

The Sigilizer MUST NOT retain input-dependent recognition state, including:

- buffered source characters;
- ambiguous-prefix text;
- viable interpretation lists;
- syntax-specific flags;
- parser nesting;
- boundary characters awaiting redispatch;
- accumulated errors; or
- state spanning physical input chunks.

All such state belongs in Frames returned through the monadic pipeline.

A pending Sigil may retain:

- its exact source prefix;
- one or more viable syntax interpretations;
- the behavior needed to consume the next Symbol;
- the information needed to commit to Lex or a structural action; and
- any syntax-owned failure state.

The evaluator already retains the Frame returned by the last source reduction. A
pending Sigil therefore survives physical chunk boundaries without a private
Sigilizer buffer.

## Syntax-Owned Recognition

The Sigilizer calls one or more new methods on existing syntax classes. Those
methods describe how each class participates in sigil recognition.

Conceptually, a syntax participant must be able to express outcomes such as:

- the supplied Symbol cannot begin my sigil;
- the current prefix remains viable but incomplete;
- return a pending Sigil;
- commit a Sigil that selects my Lex recognizer;
- commit a Sigil that selects my structural action; or
- report an invalid sigil.

This specification does not prescribe method names, method count, return types,
candidate containers, or new class hierarchies. The outcomes may be represented
directly by Frames and existing double dispatch.

The generic Sigilizer must not accumulate concrete checks for `FrameOperator`,
`FrameSchema`, future phone frames, or other syntax families.

## Explicit and Implicit Sigils

Many HC forms have an explicit punctuation sigil:

| Sigil                                  | Selected syntax |
| -------------------------------------- | --------------- |
| `.`                                    | `FrameName`     |
| `@`                                    | `FrameAlias`    |
| `“`                                    | `FrameString`   |
| `` ` `` or a committed backtick prefix | `FrameDoc`      |
| `$`                                    | `FrameNote`     |
| `_`                                    | `FrameArg`      |
| `#`                                    | `FrameComment`  |

Other forms begin with source that is also part of their value. These are
**implicit sigils**:

| Sigil class               | Selected syntax |
| ------------------------- | --------------- |
| leading digit `1`–`9`     | `FrameNumber`   |
| leading `0`               | `FrameBlob`     |
| leading letter            | `FrameSymbol`   |
| committed operator prefix | `FrameOperator` |

Calling these prefixes sigils is an HC language choice. The definition is
functional rather than typographic: a sigil selects syntax whether or not it is
rendered as a detachable punctuation marker.

## Sigil Length

A Sigil is not necessarily one character.

The current architecture assumes that initial dispatch can commit after one
source Symbol. The type/comparison collision disproves that assumption if HC
retains both type delimiters and symbolic comparisons.

Examples of potentially multi-symbol sigils include:

- `<<` for less-than;
- `>>` for greater-than;
- `<=` and `>=` if retained;
- a leading `+` followed by enough source to distinguish a phone literal from an
  operator; and
- a document opening whose fence behavior is selected by a backtick run.

Not all maximal token prefixes are sigils. After a Sigil has selected Lex, later
source belongs to token-body recognition. The boundary between multi-symbol
sigil and token body must be defined by each syntax class.

## Pending Sigils

A pending Sigil represents a valid source prefix that has not yet selected one
interpretation.

For example:

```text
Sigil(">", pending: schema-close | operator-prefix)
```

When another Symbol arrives, syntax-owned behavior may refine it:

```text
pending ">" + ">"     → committed Sigil(">>", FrameOperator)
pending ">" + "="     → committed Sigil(">=", FrameOperator)
pending ">" + boundary → committed Sigil(">", schema-close)
```

The boundary case may also need to redispatch the boundary Symbol after the
schema-close action. The Sigil or selected syntax participant must report that
disposition; the stateless Sigilizer only routes it.

This example does not decide which comparison spellings are accepted or how
adjacent type delimiters are disambiguated.

## Committed Sigils

A committed Sigil has selected exactly one next responsibility.

### Lexical commitment

A lexical Sigil selects a Lex recognizer and supplies any source already known
to belong to that token.

For example, the number sigil `1` selects `Lex(FrameNumber)` and must preserve
the initial digit as part of the eventual number value. The name sigil `.`
selects `Lex(FrameName)` but is a rendered prefix rather than part of the name's
data body.

How a committed Sigil communicates prefix source to Lex is an implementation
question. The existing `Lex.source` behavior is relevant evidence.

### Structural commitment

A structural Sigil selects an action such as opening or closing a `FrameSchema`.
The action executes only after commitment.

Structural Sigils need not become ordinary Tokens under this direction. Whether
all delimiters should eventually be emitted to Parse as Tokens is a separate
parser design question.

## Type Delimiters and Symbolic Comparisons

The `<`/`>` versus `<<`/`>>` conflict is the primary motivation.

Today, exact terminal lookup commits `<` and `>` immediately and executes parser
push/pop actions before `FrameOperator` can participate. A source such as
`1 >> 5` may log invalid structural closes, discard both characters, and return
the remaining value, creating a false-success shape.

Under the Sigilizer model:

1. symbolication produces `<` or `>` as a Symbol;
2. the Sigilizer invokes relevant syntax-owned sigil behavior;
3. the returned pending Sigil represents the delimiter and operator
   interpretations;
4. later Symbols refine that Sigil;
5. a committed operator Sigil selects `Lex(FrameOperator)`;
6. a committed delimiter Sigil selects the structural action; and
7. no parser mutation occurs before commitment.

The Sigilizer has no type-specific branch and retains no pending character.

This makes `<<` and `>>` architecturally reachable without giving up `<...>` as
type delimiters. It does not solve the language tension between doubled
operators and adjacent nested type delimiters.

## Phone Literals

A phone literal such as `+1.408.555.1212` may share its initial `+` with
`FrameOperator`.

If the phone grammar requires delayed selection, the initial plus produces a
pending Sigil representing both interpretations. When enough source identifies
the phone syntax, the committed Sigil selects a phone-specific Lex recognizer.
That recognizer owns phone segments, punctuation, boundaries, exact rendering,
and value construction.

If HC chooses an unambiguous phone sigil, selection can commit immediately.

The Sigilizer model provides the selection mechanism but does not define the
phone grammar or runtime Frame.

## Document Fences

Document syntax tests the boundary between sigil recognition and Lex.

The first backtick unambiguously selects document syntax, but the meaning of the
opening run depends on maximal run length and parity. There are at least two
consistent classifications:

- the first backtick is the Sigil, and `LexDoc` owns the rest of the opening
  run; or
- the committed opening run is a multi-symbol Sigil that selects document Lex
  with its fence length already known.

Existing behavior places run classification in `LexDoc` and covers it with
chunk-invariance and EOF tests. The Sigilizer phase does not justify moving that
working behavior by itself.

This case should be used to test the definition of a Sigil: it must not become
"every prefix whose meaning is not yet complete," or it will absorb all Lex
responsibilities.

## Byte Strings

Byte-string syntax has an unambiguous leading backslash, but its registration is
currently incomplete and generic `Lex` contains a `FrameBytes` transition to
`LexBytes`.

The leading backslash can be treated as a committed Sigil selecting byte syntax.
Length recognition and fixed-count payload consumption then belong to Lex or a
specialized lexical continuation.

No pending Sigil is required unless another syntax form shares the byte start.
The Sigilizer does not solve byte payload modes merely by selecting them.

## Names, Quotes, Comments, and Operators

The Sigilizer resolves token-family selection. It does not resolve warts after
selection:

- `FrameName` continuation rules remain embedded in generic `Lex.isEnd()`;
- quotes and comments still alter terminal consumption through concrete checks;
- `FrameOperator` accepts arbitrary operator-character runs rather than a
  defined operator vocabulary; and
- boundary disposition still exceeds the expressiveness of
  `canInclude(char): boolean`.

These remain Lex-contract problems tracked by #292. They should not move into
the Sigilizer unless multiple syntax interpretations genuinely remain viable.

## Relationship to `syntax.ts`

`syntax.ts` currently combines a syntax registry with final one-character
dispatch. It maps exact terminal characters and atom-start patterns directly to
terminal actions or preconstructed `Lex` instances.

Under this direction, it becomes or supplies the Sigilizer's registry of syntax
participants. Single-character lookup may still discover likely participants,
but discovery is not necessarily commitment.

The registry must support overlapping sigils without depending on implicit
exact-key priority or registration order. Ordinary disjoint sigils should retain
their direct path.

## Relationship to `LexPipe`

`LexPipe` currently receives Symbols, contains the syntax lookup context,
coordinates Lex return, redispatches boundaries, performs structural terminals,
and manipulates `ParsePipe` nesting.

The Sigilizer responsibility may be hosted by `LexPipe`, inserted before it, or
expressed through registered Frames that `LexPipe` calls. This specification
does not select the placement.

The required outcome is that syntax-owned Sigils, not `LexPipe` fields or
concrete branches, carry unresolved selection state.

## Boundary Redispatch

When Lex completes a Token on a character that belongs to the next source form:

1. Lex reports that the boundary Symbol was not consumed;
2. the pipeline returns that Symbol to the Sigilizer;
3. the Sigilizer invokes syntax-owned sigil recognition; and
4. the returned Sigil begins or commits the next source form.

Likewise, a pending Sigil may commit on evidence supplied by a boundary Symbol
without consuming that boundary. It must then perform its committed action and
redispatch the Symbol through the Sigilizer exactly once.

The Sigilizer does not decide consumption; it routes the disposition reported by
the responsible Frame.

## Streaming and EOF

Physical input chunks do not terminate Sigils or Tokens.

At the end of a non-final chunk, the evaluator retains the returned Frame:

- a pending Sigil while lexical selection remains unresolved;
- an active Lex while a selected token remains incomplete; or
- the ordinary lexical entry receiver when neither remains active.

The Sigilizer retains nothing between chunks.

At EOF:

- a pending Sigil must commit or report an incomplete/invalid sigil;
- an active Lex must complete its Token or report an incomplete/invalid token;
- Parse must validate aggregate structure; and
- Eval runs only on successfully completed expressions.

The current evaluator has special lifecycle handling for `LexDoc` and does not
uniformly recognize every incomplete lexical state. The Sigilizer model exposes
but does not solve that separate lifecycle contract.

## Error Ownership

Errors belong to the phase with enough information to classify them:

- **Sigil error:** no syntax interpretation owns the source prefix, or a pending
  Sigil cannot resolve validly.
- **Lex error:** a selected token has an invalid or incomplete body.
- **Parse error:** a committed structural action is unmatched or mismatched, or
  aggregate structure remains incomplete.
- **Eval error:** a valid expression fails runtime application.

The pipeline must preserve the source and propagate a structured failure. The
current behavior of logging unmatched structural closes and discarding them is
not sufficient.

## Required Invariants

1. The Sigilizer is a stateless phase.
2. Existing syntax classes own sigil-recognition behavior through polymorphic
   methods.
3. Every unresolved sigil is represented by a Frame returned through the monadic
   pipeline.
4. A Sigil is the shortest committed prefix sufficient to select Lex or a
   structural action.
5. A Sigil may be explicit punctuation or an implicit letter/digit selector.
6. Structural actions execute only after sigil commitment.
7. Lex retains responsibility for selected-token accumulation and Token
   emission.
8. Generic Sigilizer code contains no syntax-family-specific branches.
9. Generic Lex does not absorb cross-syntax selection rules.
10. Physical chunk boundaries do not force sigil or token completion.
11. Boundary Symbols are consumed or redispatched exactly once.
12. Pending source and errors preserve their original spelling.
13. Parse and Eval responsibilities remain distinct from sigil recognition.

## Open Questions

1. What methods do existing syntax classes expose to the Sigilizer?
2. How does the syntax registry return overlapping sigil participants?
3. Is pending state represented by a common `Sigil` class, specialized Sigil
   Frames, or ordinary syntax Frames acting in a sigil role?
4. How are several viable interpretations composed into one returned Frame?
5. What source belongs to the committed Sigil versus the selected Lex body?
6. How does a Sigil select or construct the appropriate Lex instance?
7. How do structural Frames participate without executing their actions early?
8. Are explicit and implicit sigils represented uniformly?
9. Does document-fence length belong to the Sigil or `LexDoc`?
10. How does EOF invoke pending Sigils and active Lex instances uniformly?
11. Should `LexPipe` host the Sigilizer or remain only a pipeline coordinator?
12. Is `Sigilizer` the class name, the phase name, or both?

## Validation Criteria

The direction is supported if an implementation can demonstrate that:

- existing `Lex` continues building Tokens without a conceptual rename;
- a stateless Sigilizer invokes syntax-owned methods without concrete type
  branches;
- `>` can remain a pending Sigil without mutating `ParsePipe`;
- `>>` and other committed operator sigils can select `Lex(FrameOperator)`;
- a solitary committed delimiter performs exactly one structural action;
- an ambiguous sigil split across arbitrary physical chunks resolves
  identically;
- boundary redispatch re-enters the Sigilizer exactly once;
- ordinary letters, digits, names, strings, comments, and unambiguous operators
  retain a direct selection path; and
- invalid sigils produce structured errors without dropping source.

The direction is weakened if the Sigilizer must retain its own mutable prefix,
candidate list, lookahead cursor, syntax-specific state, or parser-stack mirror.

## Superseding the Earlier Naming

The useful findings of the earlier documents remain:

- token-start selection is distinct from selected-token continuation;
- pending state must live in returned Frames rather than a phase driver;
- `<`/`>` ambiguity occurs before `canInclude()`;
- document, name, byte, EOF, parser, and evaluator warts must not all be
  collapsed into one mechanism; and
- syntax-specific behavior should remain polymorphic.

This document changes the names and artifact boundary:

```text
Earlier term                     Current term
─────────────────────────────────────────────
Tokenizer/Tokenize phase         Sigilizer
PreToken or Candidate            Sigil
renamed Tokenizer                existing Lex
Token                            Token
Parse                            Parse
Eval                             Eval
```

The corrected phase flow is:

```text
String → Symbol → Sigilizer → Sigil → Lex → Token → Parse → Eval
```

## Conclusion

HC does not need to rename `Lex` to expose the missing phase.

The new phase is the stateless **Sigilizer**. It invokes syntax-owned behavior
to recognize a Frame-shaped **Sigil**, which may remain pending or commit to
either an existing Lex recognizer or a structural action. Existing Lex then
builds and emits the completed Token.

This model gives the ambiguous source prefix a language-specific name without
mistaking it for an incomplete Token. It also preserves HC's monadic invariant:
phases route behavior, while returned Frames carry all input-dependent state.
