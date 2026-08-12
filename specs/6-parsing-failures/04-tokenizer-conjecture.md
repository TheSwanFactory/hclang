# The Tokenizer Conjecture

**Status:** Conjecture\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Related:** #293 and [03-lookahead-tensions.md](./03-lookahead-tensions.md)

## Conjecture

HC is missing an explicit **Tokenizer** between source-character symbolication
and the existing `Lex` recognizers.

The proposed name describes a responsibility, not an implementation. The
Tokenizer would own the point at which source symbols become committed to a
token kind or structural action. It would account for ambiguity that exists
before any one `Lex` instance can correctly be selected.

In HC-local terminology, the conjectured pipeline is:

```text
source text
    ↓ symbolication
FrameSymbol stream
    ↓ tokenization
token kind or structural action selected
    ↓ lexing
completed Token
    ↓ parsing
FrameExpr and aggregate structure
```

This is a local decomposition of conventional terminology. In compiler
literature, scanning, lexing, and tokenization commonly name most or all of the
combined character-to-token process. The conjecture does not claim that
"tokenization before lexing" is a standard universal phase ordering. It claims
that these names may usefully distinguish two responsibilities already present
but conflated in HC:

- **Tokenizer:** determine what recognizer or structural action owns the source
  prefix;
- **Lex:** accumulate and complete a value after its recognizer has been
  selected.

## Motivation

The current architecture assumes that the first source character can always
select the correct next parser. `syntax.ts` builds a context mapping character
patterns and exact terminal characters to `Lex` instances or immediate terminal
actions. A `FrameSymbol` lookup performs that dispatch.

This works when token kinds have disjoint starting characters. It fails when the
first character is insufficient evidence:

- `<` may open a type/schema or begin `<<` or `<=`;
- `>` may close a type/schema or begin `>>` or `>=`;
- a backtick begins a run whose meaning depends on its eventual length;
- operator punctuation may begin an operator or participate in a literal; and
- an apparent token boundary may need to be processed again as the start of the
  next token.

By the time `FrameAtom.canInclude(char)` is consulted, initial dispatch has
already committed to a recognizer. Making `canInclude()` richer can improve
decisions within a selected atom, but cannot by itself arbitrate between a
terminal and an atom that claim the same first character.

The conjecture is that this is not merely a deficient atom-boundary method. A
distinct responsibility is missing at the commitment point.

## Meaning of Tokenization in This Conjecture

Tokenization means deciding when enough source has been observed to commit to
one of the following outcomes:

- select an atom recognizer;
- perform a structural terminal action;
- remain pending because the prefix is valid but ambiguous;
- reject the prefix as a lexical error; or
- resolve pending input at a logical boundary or EOF.

The Tokenizer would conceptually own undecided source. This does not establish
how source is buffered, how many characters may remain pending, whether
recognizers compete, or whether the result is represented by a `Frame`.

The key boundary is commitment. Before tokenization, a source symbol may still
belong to more than one lexical interpretation. After tokenization selects a
`Lex`, the selected recognizer owns the token's internal accumulation and
completion rules.

## Current Components Under the Conjecture

### `FrameString.reduce()`

This supplies source characters to the monadic pipeline as `FrameSymbol`
instances. Within this document, that transformation is called
**symbolication**.

The term is HC-specific. Elsewhere, "symbolication" commonly refers to mapping
machine addresses to debugging symbols. Character lifting or source-character
normalization may be less ambiguous descriptions, but renaming this stage is not
part of the conjecture.

### `syntax.ts`

This currently acts as a static token-start dispatch table. Under the
conjecture, it is evidence for a Tokenizer vocabulary or registry, but it is not
yet a complete Tokenizer because it requires immediate, unique selection.

### `LexPipe`

`LexPipe` currently combines several roles:

- receiving symbolicated input;
- providing the syntax lookup context;
- returning from atom recognizers;
- executing structural terminal actions;
- manipulating parser nesting; and
- forwarding completed lexical results toward `ParsePipe`.

Some of this behavior resembles the conjectured Tokenizer, while some is
pipeline coordination or structural parsing. The conjecture does not determine
whether `LexPipe` should become, contain, or remain separate from a Tokenizer.

### `Lex`, `LexDoc`, and `LexBytes`

These are selected recognizers with different continuation rules:

- `Lex` accumulates an ordinary atom until its boundary;
- `LexDoc` retains document-fence state and classifies maximal runs; and
- `LexBytes` consumes a fixed-size payload after a mode transition.

They support the idea that lexing after selection is an independently useful
responsibility. They also challenge the conjecture because `LexDoc` performs
some classification that could instead be considered tokenization.

### `Token`

`Token` is already the wrapper emitted by `Lex` and delivered to the parser. It
is the product, not the name of the missing stage.

Calling the conjectured component `Tokenizer` creates an expectation that it
emits `Token` values directly. If it merely selects a `Lex`, the name may be
misleading unless the combined Tokenizer-plus-recognizer path is treated as one
tokenization phase. This naming tension is part of what the conjecture must
resolve.

### `ParsePipe`

`ParsePipe` aggregates completed frames into expressions and aggregate values.
It should not need to reconstruct characters dropped by premature terminal
dispatch. The conjecture places ambiguity resolution before `ParsePipe`, while
leaving open whether lexical decisions may consult parser nesting.

## What the Conjecture Explains

### Type delimiters and comparison operators

The `<`/`<<` and `>`/`>>` collision occurs before an operator `Lex` can be
selected. An explicit Tokenizer would provide a conceptual owner for the pending
first character and the eventual delimiter-versus-operator commitment.

This does not decide which interpretation wins or whether lookahead, maximal
munch, whitespace, or parser context supplies the rule.

### Generic `Lex` type checks

The `FrameName` and `FrameBytes` exceptions in generic `Lex` suggest that token
selection and lexical-mode transitions are leaking into atom accumulation. A
Tokenizer might provide a home for some transitions without teaching generic
`Lex` about concrete atom classes.

It is also possible that these exceptions belong in richer recognizers rather
than a Tokenizer. Their existence supports investigation, not migration by
default.

### Boundary redispatch

When a character ends one token and begins another, some component must retain
and reprocess it exactly once. A Tokenizer is a plausible owner because it sits
at the boundary between recognizers, but existing `Lex.finish()` already
provides redispatch through the parent pipe.

The conjecture explains the responsibility but does not prove that moving it
would improve the design.

### Streaming and EOF

An ambiguous prefix split across physical chunks must remain pending without
changing program meaning. A Tokenizer gives that pending state a conceptual home
before recognizer commitment. EOF then becomes an explicit request to resolve or
reject every pending token-start decision.

Specialized recognizers still need their own EOF behavior for incomplete token
bodies, such as document strings or byte payloads.

## What the Conjecture Does Not Explain Automatically

### Language policy

A Tokenizer cannot decide whether HC gives `>>` precedence over adjacent `>`
delimiters. It only supplies a place to implement a policy after the language
defines one.

### Conditional semantics

Recognizing `>>`, `?`, and `:` does not make the conditional chain behave like a
C ternary. The state and evaluation issues identified in
`02-ternary-failure-analysis.md` remain separate.

### Phone-literal grammar

A Tokenizer cannot recognize a phone number until the language defines its valid
spelling, boundaries, and runtime representation. The conjecture may provide a
place to arbitrate a leading `+`, but it does not supply the grammar.

### Parser-context dependence

If delimiter/operator ambiguity can be resolved only by inspecting open
aggregate state, the Tokenizer must either consult parser context or defer some
decision to the parser. The conjecture does not establish whether that coupling
is acceptable.

### Rich token-body state

Document fences and fixed-length payloads may remain specialized lexical modes.
Introducing a Tokenizer does not imply that all token recognition should be
centralized within it.

## Architectural Tensions

### Tokenizer versus richer dispatch

The missing behavior might be expressible by generalizing `syntax.ts` so an
initial symbol selects multiple candidates or a pending recognizer. In that
case, "Tokenizer" may be only a name for richer dispatch rather than a new
pipeline component.

### Tokenizer versus richer atoms

If atom registrations can describe prefixes and continuation transitions, a
shared driver could arbitrate them without a separately visible Tokenizer. The
responsibility would exist, but ownership would remain distributed among atom
contracts.

### Tokenizer versus parser

Structural terminals currently manipulate `ParsePipe` immediately. Treating them
as tokenization outcomes may clarify commitment but blur the boundary between
token emission and parser action. Treating delimiters as tokens instead would be
a larger architectural change than the conjecture itself requires.

### One monad versus another layer

HC's current control flow is expressed through `Frame.call()` and returning the
next parser or lexer. A distinct component could make ambiguity explicit, but it
could also introduce an unnecessary intermediate protocol between compatible
monadic states.

The conjecture concerns a missing responsibility. It does not prove that the
responsibility deserves a new class or additional runtime layer.

### Conventional terminology versus HC terminology

Most compiler descriptions would call both Tokenizer and `Lex` parts of the
lexer or scanner. HC's narrower use of `Lex` is internally useful because the
class represents a selected atom recognizer.

The names should make this decomposition clear enough that readers do not infer
that tokenization is conventionally a phase before lexical analysis.

## Evidence That Would Support the Conjecture

The Tokenizer conjecture gains strength if one shared commitment boundary can
describe several existing cases while preserving atom-owned recognition. Useful
evidence would include:

- `<`/`<<` and `>`/`>>` can remain undecided without speculative parser-stack
  actions;
- physical chunk boundaries do not affect the commitment decision;
- the deciding boundary character is consumed or redispatched exactly once;
- structural terminals and atom recognizers participate without concrete type
  checks in a generic loop;
- `Lex` becomes simpler because token-start arbitration no longer leaks into
  atom accumulation;
- EOF produces explicit completion or error outcomes for pending prefixes; and
- ordinary disjoint token starts retain their direct single-character path.

The strongest evidence would not be the presence of a class named `Tokenizer`.
It would be a stable architectural boundary that explains these behaviors with
fewer special cases.

## Evidence That Would Weaken or Falsify the Conjecture

The conjecture should be rejected or narrowed if investigation shows that:

- all demonstrated ambiguity is naturally expressible inside independently
  selected atom recognizers;
- the only unresolved collision is `<`/`>` and a language-level spelling rule
  removes it without delayed commitment;
- structural dispatch must inherently remain fused to parser state;
- a separate commitment boundary duplicates `LexPipe` without reducing special
  cases;
- document, byte, name, operator, and literal behavior share no useful
  pre-recognizer contract; or
- calling the component a Tokenizer obscures rather than clarifies where
  complete `Token` values are emitted.

## Questions for #292

1. Is token-kind commitment a distinct operation from accumulating a selected
   atom?
2. Can a source prefix remain uncommitted within the existing monadic pipeline?
3. Does `syntax.ts` describe token candidates, final dispatch choices, or both?
4. Are structural terminals token kinds, parser actions, or a privileged third
   category?
5. Should the deciding character remain owned by the Tokenizer until commitment?
6. Does the Tokenizer emit `Token`, select `Lex`, or conceptually encompass
   both?
7. Which current `LexPipe` responsibilities belong to tokenization?
8. Which current `Lex` exceptions are selection problems rather than
   continuation problems?
9. Can EOF and lexical errors use the same commitment vocabulary as ordinary
   input?
10. Is Tokenizer the clearest name once its actual input and output are known?

## Conclusion

The Tokenizer conjecture reframes #292: HC may not merely need a richer
`canInclude()` result after recognizer selection. It may be missing an explicit
commitment step before selection, where ambiguous source prefixes are retained
and arbitrated.

This framing accounts naturally for the `<`/`<<` and `>`/`>>` design hole while
preserving the possibility that `Lex` remains the atom-specific accumulator. It
does not prescribe a new class, maximal-munch policy, lookahead count, candidate
algorithm, or parser dependency. Its value depends on whether the commitment
boundary unifies real cases and reduces existing special behavior.
