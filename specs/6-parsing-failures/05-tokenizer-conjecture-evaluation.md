# Evaluation of the Tokenizer Conjecture

**Status:** Evaluation\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Evaluates:** [04-tokenizer-conjecture.md](./04-tokenizer-conjecture.md)\
**Related:** #293 and [03-lookahead-tensions.md](./03-lookahead-tensions.md)

**Subsequent decision:**
[11-candidate-composition-spec.md](./11-candidate-composition-spec.md) chooses
explicit dot-led comparison properties and numeric-property evaluation for
phone-shaped values. Those decisions remove the pre-recognizer ambiguities used
as evidence below. The back-half `scan(Symbol)` findings remain applicable; the
candidate-composition conclusion is historical rather than an implementation
requirement.

## Verdict

The Tokenizer conjecture survives, but only in a narrower form than a general
solution to HC's lexical warts.

There is strong evidence for a missing **pre-recognizer commitment boundary**.
HC needs an owner for source prefixes that cannot yet choose between an atom
recognizer and a structural terminal. The `<`/`<<` and `>`/`>>` collision is the
clearest example, and neither `FrameAtom.canInclude()` nor the current `Lex`
instance can own it because both are reached only after dispatch has committed.

There is equally strong evidence that a Tokenizer alone does not cover the full
problem. Several known warts occur after a recognizer has been selected:

- name/operator continuation;
- quote and comment terminal handling;
- document-fence run classification;
- byte-payload modes;
- boundary-character consumption and redispatch; and
- incomplete-token and EOF validation.

Those cases still require a richer recognizer-transition contract or specialized
lexical modes. Parser-stack validity and conditional evaluation remain separate
again.

The evaluated conjecture is therefore:

> HC is missing an explicit token-start commitment responsibility between
> symbolication and selected atom recognition. That responsibility is a
> plausible Tokenizer, but it is only one part of the broader lexical-boundary
> problem tracked by #292.

## Evaluation Criteria

Each known wart is tested against four questions:

1. Does the problem exist before or after a recognizer is selected?
2. Does a Tokenizer provide a natural owner for the missing decision?
3. Would assigning the problem to a Tokenizer reduce concrete-type knowledge in
   generic `Lex` or `LexPipe`?
4. What responsibility necessarily remains elsewhere?

The verdicts used below are:

- **Strong support:** the wart directly demonstrates missing token-start
  commitment or arbitration.
- **Partial support:** a Tokenizer could coordinate the boundary, but
  recognition or validation remains elsewhere.
- **Neutral:** the wart neither supports nor contradicts the conjecture.
- **Scope warning:** treating the wart as tokenization would make the conjecture
  too broad or move another layer's responsibility into it.

## Summary Matrix

| Known wart                                           | Primary phase                  | Verdict                   |
| ---------------------------------------------------- | ------------------------------ | ------------------------- |
| `<`/`>` delimiters versus `<<`/`>>` operators        | Before selection               | Strong support            |
| Exact terminals silently outrank pattern recognizers | Before selection               | Strong support            |
| Arbitrary operator runs become one token             | During recognition             | Partial support           |
| `FrameName` handling inside generic `Lex.isEnd()`    | During recognition             | Scope warning             |
| Quote and comment checks inside generic `Lex`        | During recognition             | Scope warning             |
| Boundary consumption and redispatch                  | Recognizer transition          | Partial support           |
| Maximal document-fence runs                          | Specialized recognition        | Neutral / scope warning   |
| Byte-string registration and payload mode            | Selection plus mode transition | Partial support           |
| Phone literal versus leading `+` operator            | Selection plus literal grammar | Partial to strong support |
| Transport-chunk invariance                           | Pending lexical state          | Partial support           |
| EOF and incomplete-token validation                  | All lexical states             | Partial support           |
| Unmatched and mismatched structural closers          | Parser structure               | Scope warning             |
| Source preservation and rendering                    | Recognizer and token value     | Neutral                   |
| Ternary `?`/`:` composition                          | Evaluation                     | Out of scope              |

## Wart 1: Type Delimiters Versus Comparison Operators

### Current behavior

`terminals.ts` registers `<` and `>` as immediate `FrameSchema` push and pop
actions. `FrameOperator` also advertises these characters and the operation
table contains `<<`, `>>`, `<=`, and `>=` comparisons.

Exact terminal lookup wins before the operator pattern is considered. Therefore
the first character never reaches `Lex(FrameOperator)`.

Focused probes demonstrate the consequences:

```text
1 >> 5  => [5], with two top-level-pop diagnostics
1 >= 5  => [],  with one top-level-pop diagnostic
<<>>    => [<<>>]
```

The `[5]` result is particularly hazardous. It can resemble successful
evaluation even though both greater-than characters were discarded as invalid
structural closes. Conversely, `<<>>` is accepted as nested type/schema
structure, demonstrating that doubled delimiters already have a potential
meaning that conflicts with longest-operator recognition.

### Evaluation

**Strong support.** This problem occurs entirely before atom recognition. A
component must retain the first `<` or `>` without executing its structural side
effect until the language's commitment rule has enough evidence.

The current `Lex` cannot do that because it has not been selected. A richer
`canInclude()` cannot do it because no atom owns the first character. This is
the best evidence that token-start commitment is a distinct responsibility.

### What remains outside the Tokenizer

The language must still decide whether adjacent type delimiters are legal, which
comparison spellings are normative, and whether context or maximal length
resolves the collision. A Tokenizer supplies ownership, not policy.

## Wart 2: Implicit Dispatch Priority

### Current behavior

`syntax.ts` stores exact terminal characters and atom-start patterns in one
`Context`. `MetaFrame.get_here()` checks an exact key before scanning regular-
expression keys. If multiple patterns match, `match_here()` retains the last
matching value encountered.

This creates two implicit priority rules:

1. exact registrations beat pattern registrations; and
2. overlapping patterns are resolved by registration order.

The first rule causes the type/comparison collision. The second is currently
mostly hidden because the registered atom-start patterns are largely disjoint.
Adding new literal forms can expose it.

### Evaluation

**Strong support.** Candidate ownership and priority are Tokenizer concerns
under the conjecture. The existing context lookup is already a rudimentary
Tokenizer, but it can produce only one immediate winner and cannot represent
ambiguity or pending commitment.

This suggests that the conjecture may name a responsibility already embedded in
`syntax.ts` and `LexPipe`, rather than require an entirely new runtime layer.

### What remains outside the Tokenizer

Atom registrations must still define their valid starts. The conjecture does not
determine whether priority should remain, be explicit, or be replaced by another
language rule.

## Wart 3: Operator Runs Ignore the Operation Vocabulary

### Current behavior

Once selected, `FrameOperator.canInclude()` accepts every following operator
character. It does not consult the actual keys registered in `Ops`.

Consequently, a source such as `+?` becomes one operator token even though `+?`
has no implementation. A focused probe produces a missing-name result for the
combined operator rather than two recognized operators.

This is maximal accumulation over a character class, not longest recognition
over a vocabulary of legal operators.

### Evaluation

**Partial support.** Conventional tokenizers commonly own longest-match
selection among valid operator tokens. Under the narrower HC-local vocabulary of
the conjecture, however, `FrameOperator` has already been selected, so the
problem is one of recognizer continuation and completion.

If the Tokenizer owns all valid-token matching, it could explain this wart, but
then the proposed boundary between Tokenizer and `Lex` becomes much weaker. This
case pressures the conjecture to define whether it selects only a token family
or recognizes a complete token.

### What remains outside the Tokenizer

HC must decide whether arbitrary operator sequences are valid names that may be
bound later, or whether the lexical vocabulary is limited to currently declared
operators. The observed missing lookup is not by itself proof of a lexical
error.

## Wart 4: Names and Operators Leak Into Generic `Lex`

### Current behavior

`FrameName.canInclude()` accepts identifier and operator characters. Generic
`Lex.isEnd()` then checks specifically for `FrameName`, inspects the accumulated
body, distinguishes names that begin with operators, and special-cases hyphens
continuing identifiers.

The initial dot already selected `FrameName` unambiguously. No competing token-
start decision remains.

### Evaluation

**Scope warning.** This is evidence that `canInclude(): boolean` is too weak or
that the name recognizer does not own enough of its continuation state. It is
not evidence for a pre-recognizer Tokenizer.

Moving the logic into a Tokenizer would make that component inspect the body and
concrete kind of a selected atom, recreating the same leak one layer earlier.

### What remains outside the Tokenizer

A recognizer-transition contract must express history-sensitive continuation
without a `FrameName` branch in generic `Lex`. Whether that contract is state,
an outcome value, or a specialized recognizer remains open.

## Wart 5: Quotes and Comments Leak Into Generic `Lex`

### Current behavior

Generic `Lex.call()` changes terminal behavior according to whether its sample
is a `FrameQuote` or `FrameComment`:

- quoted terminals remain content;
- an atom-ending character may or may not be redispatched; and
- comments consume their closing boundary differently from ordinary atoms.

Both strings and comments have unambiguous opening characters. The special
behavior begins only after recognizer selection.

### Evaluation

**Scope warning.** Like the name case, this supports a richer continuation and
boundary-disposition protocol, not token-start arbitration.

A Tokenizer may coordinate return from a recognizer, but it should not need
concrete `FrameQuote` or `FrameComment` checks merely to decide what the active
recognizer consumes.

### What remains outside the Tokenizer

The active recognizer must report whether a terminal is content, closes the
token, is consumed, or must be redispatched. The current boolean atom contract
cannot express all four outcomes.

## Wart 6: Boundary Consumption and Redispatch

### Current behavior

`Lex.finish(argument, passAlong)` exports a token and optionally sends the
boundary character back through the parent pipe. The `passAlong` decision is
made through generic conditions and concrete-type checks.

`LexDoc` implements the same fundamental transition explicitly when the
character that proves a run complete belongs to the next lexical context.

### Evaluation

**Partial support.** The Tokenizer is a natural place to receive a character
returned by a completed recognizer and begin the next commitment decision. This
makes it a plausible coordinator of redispatch.

The recognizer must nevertheless decide whether the character belonged to the
old token. The Tokenizer cannot infer that without acquiring atom-specific
grammar knowledge.

### What remains outside the Tokenizer

The recognizer/Tokenizer boundary needs a disposition richer than include or
end: consumed close, unconsumed boundary, literal content, incomplete, and error
are observably different.

## Wart 7: Document-Fence Runs

### Current behavior

Backtick dispatch is unambiguous. Once selected, `LexDoc` counts a maximal run,
tracks the active opening fence, preserves shorter interior runs, recognizes an
equal close, rejects a greater run, retains state across chunks, and validates
EOF.

This behavior is covered by focused chunk-invariance and EOF tests.

### Evaluation

**Neutral with a scope warning.** Document fences show that stateful recognition
and pending input are necessary, but they do not demonstrate missing token-start
arbitration. The first backtick always selects the correct recognizer.

Absorbing fence parity and interior-run comparison into a Tokenizer would turn
the Tokenizer into the complete lexer. Keeping them in `LexDoc` preserves the
narrow conjecture.

### What remains outside the Tokenizer

Specialized recognizers or lexical modes must be able to own unbounded pending
runs, source preservation, state-dependent errors, and EOF completion.

## Wart 8: Byte Strings

### Current behavior

`FrameBytes` does not satisfy the `AtomFactory` constructor assumed by
`syntax.ts`, so it is omitted from `atomClasses` with a FIXME. Generic `Lex`
still contains a `FrameBytes` type check intended to transition into `LexBytes`,
and the end-to-end byte-string test remains skipped.

A probe of `\1\a` reaches no byte recognizer and reports the leading backslash
as a missing name.

The known byte design therefore combines at least three concerns:

- registering a token-start recognizer;
- parsing a length declaration; and
- transitioning to a fixed-count payload mode.

### Evaluation

**Partial support.** A Tokenizer registry separated from runtime value
constructors could remove the assumption that every token family is selected by
`new Atom(source)`. It could also provide a named transition from a completed
prefix to a payload recognizer.

The byte syntax is not initially ambiguous, however. Its fixed-count body is a
recognizer-mode problem rather than token-start arbitration. The conjecture
explains the registration seam better than it explains payload consumption.

### What remains outside the Tokenizer

`LexBytes` must own exact payload consumption, premature EOF, output frame
construction, and any byte-specific errors. The evaluator must also retain a
specialized active mode that is not necessarily a subclass of generic `Lex`.

## Wart 9: Phone Literals

### Current behavior

`+1.408.555.1212` begins with a character currently owned by `FrameOperator`.
After the plus operator ends, the remaining source is divided among numbers,
names, and additional operator punctuation. No phone frame or phone grammar is
registered.

### Evaluation

**Partial to strong support, conditional on the grammar.** If leading `+` can
begin either an operator or a phone literal, the Tokenizer provides the missing
owner for that initial ambiguity. It could keep the plus uncommitted until the
language-defined prefix is distinguishable.

The complete phone spelling also requires history-sensitive segment recognition
and boundary validation. Those responsibilities remain in the selected phone
recognizer. If HC instead introduces an unambiguous phone sigil, initial
Tokenizer arbitration would no longer be required.

### What remains outside the Tokenizer

Issue #293 must specify the phone grammar, runtime frame, rendering, invalid
forms, and relationship to arithmetic. The Tokenizer cannot infer these from the
example.

## Wart 10: Transport Chunks and Active State

### Current behavior

`HCEval` buffers transport fragments and retains an unfinished `Lex` across
calls. Document tests prove that physical chunk boundaries do not terminate
backtick runs.

Active-state handling is nevertheless type-shaped:

- `HCEval` checks specifically for `LexDoc` to handle document EOF and errors;
- only results that are instances of `Lex` are retained as active lexical state;
  and
- `LexBytes` extends `Frame`, not `Lex`, so the current retention rule would not
  preserve it in the same way if its path were reachable.

### Evaluation

**Partial support.** An ambiguous token start must survive physical chunks, so a
Tokenizer needs persistent pending state. This supports treating commitment as
part of the ongoing lexical session rather than a stateless table lookup.

The existing wart is broader: all active lexical modes need a common persistence
and completion contract. Naming a Tokenizer does not provide that contract.

### What remains outside the Tokenizer

The evaluator must distinguish physical chunks, logical newlines, token
boundaries, and EOF without knowing concrete lexical-mode classes.

## Wart 11: EOF and Incomplete Tokens

### Current behavior

`LexDoc` has explicit EOF validation and a structured failure message. Generic
`Lex` does not expose comparable completion or failure semantics.

A focused probe with an unterminated smart string demonstrates the asymmetry:

```text
source: “abc
finish(): true
error(): null
output: []
```

The source is silently lost even though lexical completion reports success.
Ordinary atoms such as numbers and names, by contrast, validly complete at EOF.

### Evaluation

**Partial support.** A pending token-start prefix needs Tokenizer EOF behavior,
but the observed smart-string problem occurs inside a selected recognizer. A
complete design needs EOF to visit every active lexical state, not only the
Tokenizer and `LexDoc`.

This is evidence for a shared completion protocol alongside the Tokenizer
conjecture.

### What remains outside the Tokenizer

Each recognizer must classify EOF as completion, incomplete input, or error. The
evaluator must propagate that result without concrete-type checks or false-green
completion.

## Wart 12: Structural Errors Are Console Side Effects

### Current behavior

An unmatched closing delimiter produces a console diagnostic and drops the
character. A mismatched close also logs from `ParsePipe.canPop()` without
producing a normal structured error value.

The comparison collision makes this behavior visible, but the validity of a
close depends on the parser's aggregate stack rather than token recognition
alone.

### Evaluation

**Scope warning.** A Tokenizer should prevent a potential operator prefix from
triggering a premature close. Once a delimiter has been committed, however,
whether it matches the open aggregate is a structural parser responsibility.

Making the Tokenizer validate nesting would couple tokenization to parser state
and would not by itself improve error propagation.

### What remains outside the Tokenizer

`ParsePipe` needs structured mismatch and unmatched-close outcomes. The pipeline
needs one error path capable of representing both lexical and structural
failures without silently discarding source.

## Wart 13: Source Preservation

### Current behavior

Document fences retain their original fence spelling, and phone literals require
similar preservation of punctuation and a leading plus. Pending prefixes may
eventually belong to tokens with different value and rendering rules.

### Evaluation

**Neutral.** A Tokenizer must not destroy source while commitment remains
pending, but exact rendering belongs to the selected recognizer and resulting
frame. This is an invariant imposed on tokenization, not evidence for a distinct
Tokenizer.

## Wart 14: Ternary Composition

### Current behavior

Even if a comparison token is recognized, the current stateless `?` and `:`
operations do not compose into `condition ? then : else` under left-to-right
evaluation.

### Evaluation

**Out of scope.** A Tokenizer can make comparison and conditional operator
tokens reachable. It cannot retain the condition across operator evaluation or
define branch laziness. Treating this as tokenization would conceal an evaluator
design problem.

## Additional Wart: Blob Recognition

### Current behavior

`FrameBlob` is selected unambiguously by leading `0`, but its `canInclude()`
accepts the base-64 character set regardless of the actual base encoded by the
prefix. Validation and token continuation therefore are not fully owned by the
literal's selected base.

### Evaluation

**Scope warning.** This is another selected-recognizer grammar problem. It adds
evidence that the atom continuation contract may be underpowered, but not that
token-start arbitration is missing.

## Coverage Assessment

The known warts divide into four architectural regions:

### A. Pre-recognizer commitment

- terminal versus operator prefix collisions;
- implicit exact-versus-pattern priority;
- future literal families sharing an initial character; and
- ambiguous prefixes split across chunks.

The Tokenizer conjecture explains this region well.

### B. Selected-recognizer transitions

- name/operator continuation;
- quoted terminal behavior;
- comment boundaries;
- operator-run completion;
- phone segments after commitment;
- document runs;
- byte payloads; and
- base-specific blob validation.

This region needs a richer atom/recognizer transition contract or specialized
modes. Calling all of it Tokenizer behavior would erase the useful boundary
proposed by the conjecture.

### C. Lexical-session lifecycle

- state persistence across chunks;
- logical-line handling;
- EOF completion;
- incomplete-token errors;
- recovery after failure; and
- source retention while pending.

Both Tokenizer and recognizers participate. `HCEval` currently coordinates this
through concrete-type tests, so a shared lifecycle contract appears to be
missing independently of the Tokenizer name.

### D. Parser and evaluator behavior

- matched aggregate nesting;
- structured unmatched-close errors; and
- ternary conditional composition.

These are not Tokenizer responsibilities.

## Conjecture Refinement

The original conjecture described the Tokenizer as deciding when enough source
had been observed to select a recognizer or structural action. Evaluation
supports that definition.

It does not support expanding the Tokenizer to recognize every complete token.
Doing so would absorb `Lex`, `LexDoc`, and `LexBytes` and reduce the conjecture
to the conventional statement that HC needs a lexer. That would be true but
would not identify the missing architectural seam.

The useful distinction is:

```text
symbolication
    ↓
token-start commitment
    ↓
selected recognizer continuation
    ↓
Token
    ↓
structural parsing and evaluation
```

The name **Tokenizer** remains plausible for token-start commitment, but the
name creates pressure because a conventional Tokenizer is expected to emit
complete tokens. **Token dispatch**, **lexical arbitration**, or **scanner
dispatch** may describe the narrowed responsibility more precisely. Naming
should follow the eventual input/output contract rather than settle it in
advance.

## Final Assessment

The Tokenizer conjecture is **supported as a partial architectural diagnosis**.
It identifies a real missing owner for ambiguous token starts and directly
explains the otherwise unreachable symbolic comparison operators.

It is **not sufficient as the general solution to #292**. Evaluation exposes at
least two additional contracts:

1. a selected-recognizer transition contract for continuation, boundary
   disposition, lexical modes, and errors; and
2. a lexical-session lifecycle contract for chunk persistence, EOF validation,
   and failure propagation.

Parser structure and conditional evaluation remain outside all three.

The next design step should test whether these are genuinely distinct contracts
or different views of one Frame-like monadic transition. This evaluation does
not choose between them or prescribe their representation.
