# Lex and Tokenizer Phase Separation

**Status:** Superseded by [08-sigilizer-phase.md](./08-sigilizer-phase.md),
which keeps `Lex` and names the new phase Sigilizer\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Refines:** [04-tokenizer-conjecture.md](./04-tokenizer-conjecture.md),
[05-tokenizer-conjecture-evaluation.md](./05-tokenizer-conjecture-evaluation.md),
and [06-tokenizer-phase.md](./06-tokenizer-phase.md)\
**Related:** #293 and [03-lookahead-tensions.md](./03-lookahead-tensions.md)

## Decision

The architectural correction consists of two conceptual changes:

1. Rename the existing `Lex` token-building responsibility to **Tokenizer**.
2. Introduce a new, earlier **Lex** phase between source-symbol creation and
   token-family commitment.

The new Lex phase performs syntax-owned lexical selection. It does not build a
complete token and does not retain input-dependent state itself. When lexical
selection cannot yet commit, it returns a Frame-shaped **PreToken** representing
the unresolved source and its viable interpretations.

The renamed Tokenizer begins only after Lex has selected a token family. It
accumulates that token's body, recognizes its boundary, constructs its value
Frame, and emits the existing `Token` artifact to parsing.

## Corrected Pipeline

```text
source text
    ↓ symbolication
FrameSymbol
    ↓ Lex phase
PreToken or committed interpretation
    ├─ unresolved → another FrameSymbol enters Lex through the PreToken
    ├─ structural terminal → Parse phase action
    ├─ lexical error → shared failure path
    └─ selected token family
            ↓ Tokenizer phase
          completed Token
            ↓ Parse phase
          FrameExpr / aggregate structure
            ↓ Eval phase
```

In compact form:

```text
Symbol → Lex → PreToken → Tokenizer → Token → Parse → Eval
```

`PreToken` is conditional in this notation. Unambiguous syntax may pass directly
from Lex to a selected Tokenizer or structural action without constructing a
long-lived intermediate value.

## Why the Existing `Lex` Is a Tokenizer

The current `Lex` class is constructed with a selected atom `Factory`. It no
longer decides which token family owns the initial source character.

After selection, it:

- retains a sample of the selected atom class;
- accumulates source in `body`;
- asks `canInclude(char)` whether the token continues;
- identifies a token boundary;
- decides whether the boundary character must be redispatched;
- constructs the selected value Frame;
- wraps that Frame in `Token`; and
- emits the completed `Token` to `ParsePipe`.

Those are token-building responsibilities. The class converts an already
classified source prefix into a completed `Token`; it is therefore a Tokenizer
in the phase vocabulary adopted here.

The current name `Lex` hides the absence of an earlier lexical-selection phase.
It makes failures such as `<` versus `<<` appear to belong to token continuation
even though the current class is never selected for the ambiguous first
character.

## The New Lex Phase

The new Lex phase owns the transition from a symbolicated source character to a
committed lexical interpretation.

It must be able to invoke new lexical-selection behavior on the existing syntax
classes that advertise atoms, delimiters, and other source forms. The syntax
classes, not a central conditional statement, define how they participate.

Conceptually, Lex must route outcomes such as:

- this syntax cannot begin with the supplied source;
- this syntax is a viable interpretation but cannot commit yet;
- return a PreToken representing an unresolved prefix;
- commit to a particular Tokenizer;
- commit to a structural terminal action; or
- report an invalid lexical prefix.

This list describes required meanings, not a proposed enum, method signature, or
class hierarchy.

### Lex is stateless

The Lex phase does not own:

- buffered source characters;
- the current ambiguous prefix;
- a mutable candidate list;
- document-fence counts;
- token bodies;
- byte-payload counts;
- parser nesting; or
- syntax-specific errors.

Lex may have stable access to a syntax registry, output phase, or pipeline
context. All input-dependent state belongs to the Frame returned through the
monadic pipeline.

### Lex calls syntax-owned behavior

Lex should resemble the other HC phases: it invokes polymorphic Frame behavior
and routes the returned Frame. It should not decide that `>` means a schema
close, `>>` means greater-than, or `+1` may begin a phone literal.

Those rules belong to the participating syntax classes through one or more new
methods. This document deliberately does not name the methods before their
required inputs and outputs are understood.

## PreToken

A PreToken is the Frame-shaped result of lexical selection that has not yet
committed to a Tokenizer or structural action.

It may represent:

- one incomplete interpretation;
- several viable interpretations sharing a prefix;
- the exact source required to resolve them;
- syntax-owned continuation behavior; and
- a transition to a committed result, another PreToken, or an error.

The PreToken, not Lex, receives or represents the next source-dependent state.
Because `FrameString.reduce()` uses each returned Frame as the next receiver, an
unresolved PreToken naturally survives subsequent characters and physical input
chunks within the monadic pipeline.

### Broader than a partial ordinary token

A PreToken may eventually commit to a structural terminal rather than a `Token`.
Its name therefore means "source before token-family or structural commitment,"
not necessarily "the first bytes of an ordinary token."

This slight broadness is preferable to calling the state a Tokenizer. It keeps
the phase, state, and final artifact distinct:

| Name      | Meaning                                               |
| --------- | ----------------------------------------------------- |
| Lex       | Phase that selects a lexical interpretation           |
| PreToken  | Uncommitted Frame-shaped lexical state                |
| Tokenizer | Phase/recognizer that builds a selected token         |
| Token     | Completed artifact delivered to Parse                 |
| Parse     | Phase that builds expressions and aggregate structure |

## Tokenizer

Tokenizer is the renamed responsibility of the current `Lex` class.

It begins with a committed token family and ends by emitting one `Token`.
Tokenizer state is allowed and necessary: it includes the selected factory,
accumulated body, and any token-family-specific continuation state.

The distinction between PreToken and Tokenizer state is the point of commitment:

- PreToken state exists because more than one lexical interpretation remains
  possible, or because no final interpretation has yet committed.
- Tokenizer state exists after one token family owns the source and must
  recognize its body and end.

Tokenizer may return an unconsumed boundary character to the Lex phase. Lex then
starts a fresh lexical-selection decision for that character.

## `Token` Remains the Completed Artifact

The existing `Token` wrapper already marks the transition from token building to
parsing. It contains the completed Frame and uses double dispatch to deliver
that Frame to `ParsePipe`.

The phase rename does not require `Token` itself to change meaning:

```text
Tokenizer emits Token
Parse consumes Token
```

This naming is conventional and internally consistent. A Tokenizer is allowed to
be stateful while building the Token it eventually emits.

## Type Delimiters and Comparisons

The `<`/`<<` and `>`/`>>` collision demonstrates all four concepts.

### First character

Symbolication produces a `FrameSymbol` containing `>`.

Lex asks the relevant syntax participants how they interpret that start. The
schema delimiter and operator syntax are both viable, so the result cannot yet
be a Tokenizer or an immediate pop action. Lex returns or routes a PreToken that
represents the unresolved prefix.

### Continuation

The next source character is processed through that PreToken's syntax-owned
behavior.

Depending on language rules not chosen here, it may:

- commit `>>` to `Tokenizer(FrameOperator)`;
- commit `>=` to `Tokenizer(FrameOperator)`;
- commit a solitary `>` to the schema-close terminal and redispatch the boundary
  character;
- preserve more than one interpretation for longer; or
- report an invalid prefix.

Lex routes the committed result but does not contain these comparison-specific
branches.

### Structural action

A schema pop occurs only after the PreToken has committed to the structural
interpretation. This prevents the current false-success behavior in which
comparison characters are logged as invalid closes, discarded, and followed by
an apparently valid remaining expression.

### Remaining language question

The split does not determine how doubled operators coexist with adjacent nested
type delimiters. It provides the phases and state location in which that
language decision can be expressed.

## Phone Literals

A future phone literal may share leading `+` with `FrameOperator`.

If its grammar requires delayed commitment, Lex can return a PreToken containing
the viable operator and phone interpretations. Once enough source establishes
the phone family, Lex selects its Tokenizer. The phone Tokenizer then owns
segment recognition, punctuation, boundaries, source preservation, and runtime
Frame construction.

If the language chooses an unambiguous phone sigil, Lex may select the phone
Tokenizer immediately and no persistent PreToken is required.

The phase separation provides a home for the ambiguity without defining the
phone grammar.

## Document Fences

Backtick syntax has an unambiguous token family at its first character. Lex can
therefore select the document Tokenizer immediately.

The existing `LexDoc` responsibility is not a PreToken merely because it retains
an incomplete run. Once the first backtick selects document syntax, fence
parity, interior run length, closure, source preservation, and EOF validation
are token-family-internal behavior. They belong to a specialized Tokenizer.

Under a literal rename, `LexDoc` would become a document Tokenizer such as
`TokenizerDoc`. The exact class name is less important than preserving this
phase boundary.

## Byte Strings

The byte-string start is presently unambiguous, but registration is incomplete
and the path into `LexBytes` is encoded as a concrete type check inside current
`Lex`.

Under the new vocabulary:

- Lex selects byte syntax;
- a byte-prefix Tokenizer recognizes the declared length;
- the returned lexical mode continues tokenization of the fixed-count payload;
  and
- a completed byte `Token` is emitted to Parse.

Whether the prefix and payload are one Tokenizer, chained Tokenizers, or syntax-
owned continuation Frames remains open. No PreToken is required unless multiple
lexical interpretations share the byte prefix.

## Names, Operators, Quotes, and Comments

The phase split does not automatically resolve continuation warts inside the
renamed Tokenizer.

After Lex has selected `FrameName`, current generic token building still knows
specifically about name/operator transitions and identifier hyphens. After Lex
has selected a quote or comment, generic token building still changes terminal
and boundary behavior through concrete type checks.

These are Tokenizer-contract problems because the token family is already known.
They require syntax-owned continuation and boundary outcomes richer than
`canInclude(char): boolean`, but they do not require a PreToken unless another
token family remains viable.

This distinction keeps #292 from treating all lexical state as lookahead.

## Relationship to `syntax.ts`

`syntax.ts` currently maps source starts directly to preconstructed current
`Lex` instances or immediate terminal actions. Under the new names, that table
maps directly to Tokenizers and terminals, bypassing the missing Lex phase.

The registry should instead make relevant syntax participants available to Lex.
For ordinary disjoint starts, the result may still be one direct Tokenizer. For
overlapping starts, Lex must allow the syntax-owned behavior to produce a
PreToken rather than selecting one immediate winner.

Single-character lookup can remain an efficient candidate-discovery mechanism.
It must no longer be confused with final lexical commitment.

## Relationship to `LexPipe`

The existing `LexPipe` is the natural location to inspect because it already:

- receives symbolicated characters;
- carries the syntax lookup context;
- accepts return from current token builders;
- redispatches boundaries;
- performs terminals; and
- connects to `ParsePipe`.

Its current implementation performs immediate dispatch rather than a distinct
Lex phase. It also contains parser-stack manipulation and mutable nesting level,
which are not lexical-selection state.

This design direction does not yet decide whether:

- `LexPipe` becomes the coordinator containing a new stateless `Lex` phase;
- `LexPipe` itself implements the Lex phase through syntax-owned calls;
- parser terminal actions move behind a separate boundary; or
- the pipeline is renamed more extensively.

The required outcome is conceptual: Lex performs lexical selection, Tokenizer
builds selected tokens, and PreToken represents incomplete commitment.

## Boundary Redispatch

When a Tokenizer sees a character that does not belong to its token, it may need
to complete the current `Token` and send that character back to Lex.

The responsibilities are divided as follows:

- the selected Tokenizer decides that the character is not consumed by the
  current token;
- the pipeline delivers the character back to Lex exactly once; and
- Lex begins a new selection or PreToken transition for that character.

The current `Lex.finish(argument, passAlong)` already demonstrates this control
flow. Renaming the class clarifies that redispatch crosses from the Tokenizer
phase back to the Lex phase.

## Streaming and EOF

A physical input chunk does not force either a PreToken or Tokenizer to commit.
The evaluator retains the Frame returned by the reduction pipeline:

- a PreToken when lexical selection remains unresolved;
- a Tokenizer when a selected token remains incomplete; or
- the lexical entry phase when no input-dependent state remains active.

The Lex phase stores none of this state itself.

At EOF, the active Frame must resolve according to its phase:

- a PreToken commits or reports an incomplete/invalid lexical prefix;
- a Tokenizer completes its token or reports an incomplete/invalid token body;
  and
- Parse validates aggregate completion and structure.

The current evaluator's special handling of `LexDoc` and its retention of only
`Lex` subclasses reveal that a common lexical-state lifecycle is still missing.
The rename makes the required categories clearer but does not prescribe that
protocol.

## Error Boundaries

The phase split gives errors a clearer owner:

- **Lex error:** no valid token or structural interpretation can own the source
  prefix, or a PreToken cannot resolve validly.
- **Tokenizer error:** a selected token family contains an invalid body or ends
  incomplete.
- **Parse error:** a committed structural terminal is unmatched or mismatched,
  or an aggregate remains incomplete.
- **Eval error:** a valid expression cannot be applied according to runtime
  semantics.

The current unmatched-close console diagnostics straddle Lex and Parse because
the structural action executes before lexical commitment. The phase split
requires lexical commitment first and structural validation second.

## Rename Surface

If adopted literally in code, the first change affects more than one class name.
Likely terminology updates include:

- `Lex` → `Tokenizer`;
- `LexDoc` → a document-specific Tokenizer name;
- `LexBytes` → a byte-specific Tokenizer or tokenizer-mode name;
- `AtomFactory` uses in the renamed class;
- active-state checks in `HCEval`;
- `syntax.ts` factory and registry names;
- comments and tests describing token building as lexing; and
- imports and exports throughout `lib/execute`.

`LexPipe` should not be mechanically renamed until the new Lex phase's placement
is decided. Its name may become more accurate once it actually coordinates Lex,
PreToken, and Tokenizer transitions.

The existing `Token` and `ParsePipe` names remain semantically appropriate.

## Required Invariants

1. Lex is the phase that selects among lexical and structural interpretations.
2. Lex owns no input-dependent state.
3. Existing syntax classes supply lexical-selection behavior through polymorphic
   methods.
4. PreToken is the only Frame category introduced by this direction for
   uncommitted lexical state.
5. Tokenizer begins only after one token family has committed.
6. Tokenizer emits exactly one completed `Token` before returning control to
   Lex.
7. Structural terminal actions execute only after Lex commits their
   interpretation.
8. A physical input chunk does not force PreToken or Tokenizer completion.
9. Returned Frames, rather than phase-owned buffers, preserve all incomplete
   state.
10. Boundary characters are consumed or redispatched exactly once.
11. Generic Lex and Tokenizer drivers do not acquire syntax-class-specific
    branches.
12. Parse and Eval responsibilities remain outside both Lex and Tokenizer.

## Open Questions

1. Which method or methods let existing syntax classes participate in Lex?
2. Does Lex call all matching participants or receive a syntax-provided
   composition from the registry?
3. What exact Frame representation serves as PreToken?
4. How does one PreToken compose multiple viable interpretations?
5. Does a committed PreToken construct, select, or call a Tokenizer?
6. How are structural delimiter participants represented before commitment?
7. Does the renamed Tokenizer retain `canInclude()` or consume a richer
   syntax-owned transition result?
8. How do specialized Tokenizers share EOF and error behavior?
9. What common interface lets `HCEval` retain either a PreToken or Tokenizer
   across chunks?
10. Does `LexPipe` host the new phase or require a structural refactor?
11. Which current terminal actions are truly lexical and which belong entirely
    to Parse?
12. Should Tokenizer be a class name, a phase name, or both?

## Validation Criteria

The separation is supported if an implementation can demonstrate that:

- the current `Lex` behavior can be renamed Tokenizer without changing its
  token-building semantics;
- a new stateless Lex phase can call syntax-owned behavior without concrete type
  branches;
- the first `<` or `>` produces a returned PreToken without mutating the parser
  stack;
- a committed `<<`, `>>`, `<=`, or `>=` reaches `FrameOperator` tokenization;
- a committed delimiter performs exactly one structural action;
- arbitrary physical chunk splits do not change commitment;
- a Tokenizer boundary returns to Lex and redispatches exactly once;
- unambiguous existing syntax does not require persistent PreTokens; and
- errors retain the original source instead of logging and discarding it.

This document does not define which ambiguous spellings must ultimately be
accepted. Validation of the phase separation is distinct from deciding the HC
grammar.

## Relationship to Earlier Documents

`04-tokenizer-conjecture.md` correctly identified a missing commitment boundary
but gave the name Tokenizer to the earlier phase.

`05-tokenizer-conjecture-evaluation.md` correctly separated pre-selection,
selected-recognizer, lifecycle, parser, and evaluator warts. Its classification
remains useful, but its phase names should be read through this document.

`06-tokenizer-phase.md` correctly moved pending state into returned Frames and
made the new phase stateless. It still assigned the name Tokenize to that phase.

This document supersedes the phase naming:

```text
Earlier name                    Corrected name
─────────────────────────────────────────────
stateless Tokenize phase        Lex phase
returned ambiguous Frame        PreToken
existing Lex recognizer         Tokenizer
completed Token                 Token
```

## Conclusion

HC needs a Lex phase before token building, and its existing `Lex` class already
implements the Tokenizer responsibility.

The two changes are therefore:

1. rename the existing `Lex` responsibility to Tokenizer; and
2. add a stateless Lex phase that calls syntax-owned methods and returns
   Frame-shaped PreTokens whenever lexical commitment is incomplete.

This naming exposes the missing architectural step without assigning state to a
phase driver. It preserves HC's monadic model: source-dependent state lives in
Frames, Tokenizer produces `Token`, and Parse consumes the completed artifact.
