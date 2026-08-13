# The Stateless Tokenizer Phase

**Status:** Historical architectural conjecture; naming superseded by
[08-sigilizer-phase.md](./08-sigilizer-phase.md)\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Refines:** [04-tokenizer-conjecture.md](./04-tokenizer-conjecture.md) and
[05-tokenizer-conjecture-evaluation.md](./05-tokenizer-conjecture-evaluation.md)\
**Related:** #293 and [03-lookahead-tensions.md](./03-lookahead-tensions.md)

## Correction

The earlier Tokenizer conjecture assigned too much responsibility to a Tokenizer
component. It described the Tokenizer as owning undecided source, buffering
ambiguous prefixes, and retaining pending state across input chunks.

That framing is inconsistent with HC's existing architecture.

The corrected conjecture is:

> Tokenization is a new, stateless phase that invokes new tokenization behavior
> on existing syntax classes. Syntax objects and the Frames returned through the
> monadic pipeline represent all input-dependent recognition state.

The Tokenizer is therefore not a state machine placed in front of `Lex`. It is a
phase driver, comparable to the way the existing lexical and parsing phases
invoke behavior on Frames and use the returned Frame as the next receiver.

## Proposed Phase Boundary

In HC-local terminology, the corrected pipeline is:

```text
source text
    ↓ symbolication
FrameSymbol stream
    ↓ stateless Tokenize phase
syntax-owned token-start decision
    ↓ selected Lex or structural action
token recognition and completion
    ↓ Token
Parse phase
    ↓ FrameExpr / aggregate structure
Eval phase
```

This is a conceptual phase decomposition. It does not prescribe a class named
`Tokenizer`, `TokenizePipe`, or any particular method signature.

The distinguishing responsibility is the method invocation:

- the Tokenize phase receives a source symbol and the current Frame-shaped
  participant;
- it invokes tokenization behavior supplied by syntax classes;
- those classes decide how they participate in token-start recognition; and
- the returned Frame determines the next monadic state or phase transition.

The phase itself does not remember what happened previously.

## Meaning of Stateless

The Tokenize phase MUST NOT own input-dependent recognition state such as:

- a buffered `<` or `>`;
- the characters of an ambiguous prefix;
- a set of still-viable token candidates;
- the current document-fence run;
- the remaining length of a byte payload;
- a partially recognized phone literal;
- parser nesting;
- a pending boundary character; or
- an accumulated lexical error.

The phase may depend on stable configuration such as registered syntax classes,
an output link, or the next pipeline phase. Such configuration does not make it
the owner of token-recognition state.

When recognition is incomplete, that incompleteness must be represented by a
Frame returned through the pipeline. When recognition requires historical
source, the participating syntax Frame must retain or encode that history.

Statelessness is a property of the phase driver, not a claim that tokenization
requires no state anywhere.

## Existing Monadic Precedent

HC already expresses parsing control through returned Frames.

`FrameString.reduce()` converts each source character into a `FrameSymbol`,
calls the current Frame with that symbol, and uses the returned Frame as the
receiver for the next character:

```text
current Frame + FrameSymbol → next Frame
```

The current lexical path follows the same pattern:

- `Lex` returns itself while an atom remains active;
- `Lex.finish()` returns to its parent after emitting a token;
- boundary redispatch calls the parent with the unconsumed character;
- `LexDoc` returns itself while a document or backtick run remains incomplete;
  and
- `LexBytes` represents a transition into a fixed-count lexical mode.

`ParsePipe` likewise receives completed token contents and returns the parser
state appropriate to the current aggregate.

The Tokenize phase should participate in this existing control model. It should
not introduce a second, privately stateful scanning loop alongside it.

## Syntax-Owned Tokenization Behavior

The missing behavior belongs on the syntax classes that already define token
starts and lexical continuation.

Today, an atom exposes:

- `string_start()` to register its first-character lookup; and
- `canInclude(char): boolean` to decide continuation after selection.

Structural Frames expose delimiters through `string_open()` and
`string_close()`, which `terminals.ts` converts directly into parser actions.

The Tokenize phase conjecture adds one or more conceptual operations between
these contracts. Existing syntax classes would be asked how they respond to a
source symbol before the pipeline commits to a `Lex` or executes a structural
action.

This document does not name those methods. It requires only that the behavior be
polymorphic and syntax-owned rather than encoded as a growing list of concrete
class checks in the phase driver.

Conceptually, a syntax participant must be able to express outcomes such as:

- this source cannot begin my syntax;
- this source may begin my syntax, but the decision is incomplete;
- select my lexical recognizer;
- commit my structural action;
- return another Frame representing the remaining decision; or
- report invalid source.

These are semantic outcomes, not a proposed enum or return type. In HC they may
be expressible directly through Frames and ordinary `call`, `apply`, or new
phase-specific methods.

## Where Pending State Lives

The phase does not hold a pending `<`. A syntax-owned Frame does.

The phase does not retain the candidate interpretations of `>`. A returned
Frame, or composition of participating Frames, represents those interpretations.

The phase does not count backticks. `LexDoc` or another document-recognition
Frame does.

The phase does not count byte payload characters. `LexBytes` does.

The phase does not remember the segments of a phone literal. A future phone
recognizer does.

This keeps recognition state inspectable and compositional within HC's Frame
model. It also means an unfinished tokenization decision can cross a physical
input chunk simply because the evaluator retains the Frame returned by the last
symbol reduction.

No separate Tokenizer buffer is needed.

## Ambiguous Candidates

The hardest unresolved question is how more than one syntax interpretation
remains live without putting candidate state in the phase driver.

For an initial `>`, at least two existing participants may be relevant:

- the closing delimiter of `FrameSchema`; and
- `FrameOperator`, because `>` may begin `>>` or `>=`.

The first character is insufficient to commit either interpretation. The
pipeline nevertheless expects one returned Frame to receive the next symbol.

The returned state could conceptually be:

- one participating Frame capable of deferring its own commitment;
- a composition of the viable syntax Frames;
- a syntax-provided continuation representing the shared prefix; or
- another Frame-shaped expression of ambiguity.

This document does not choose among them or require a new candidate class. It
establishes the invariant that any candidate plurality belongs in the returned
Frame state, not in mutable fields on the Tokenize phase.

Candidate plurality is therefore a test of the Frame model, not a reason to make
the phase stateful.

## Type Delimiters and Comparison Operators

The `<`/`<<` and `>`/`>>` collision demonstrates the proposed phase boundary.

Current behavior performs `<` and `>` terminal actions immediately. That is too
early because the same source symbols may begin comparison operators. The
current operator `Lex` never receives the first character and therefore cannot
participate in the decision.

Under the corrected conjecture:

1. symbolication produces `<` or `>` as a `FrameSymbol`;
2. the Tokenize phase invokes tokenization behavior on the relevant syntax
   participants;
3. those participants return a Frame representing commitment or incompleteness;
4. a later source symbol is delivered to that returned Frame through the same
   reduction pipeline; and
5. only the eventual committed result selects `Lex(FrameOperator)` or performs
   the schema terminal action.

The Tokenize phase does not know that doubled characters mean comparison, that
single characters delimit types, or that parser nesting might matter. Those are
language rules expressed by the participating syntax classes.

This model preserves the possibility of `<<` and `>>` without making the phase a
central table of comparison-specific exceptions.

It does not decide how adjacent nested type delimiters coexist with doubled
operators. That remains a language-design question for #292.

## Relationship to `syntax.ts`

`syntax.ts` currently constructs a context whose lookup performs immediate
token-start selection. Exact terminal keys take precedence over pattern keys,
and matching atom patterns resolve to one preconstructed `Lex` instance.

Under the phase conjecture, the syntax registry would instead supply
participants in tokenization behavior. It may still use single-character lookup
to find relevant syntax quickly, but lookup would no longer necessarily mean
final commitment.

This distinction preserves the valuable part of the existing design:

- syntax remains data-driven;
- syntax classes advertise their own entry conditions;
- ordinary disjoint starts can retain a direct path; and
- adding a syntax class does not require a central conditional branch.

The registry may return one participant for ordinary syntax or several relevant
participants for an overlapping start. How that is represented remains open.

## Relationship to `Lex`

The existing `Lex` is best understood as a recognizer for a token family after
that family has been selected. It accumulates source, decides token completion,
constructs a value Frame, emits a `Token`, and returns to its parent.

The Tokenize phase does not replace those responsibilities.

The corrected boundary is:

```text
Tokenize: Which syntax owns this token start?
Lex:      How does the selected syntax continue and complete?
```

This boundary is not absolute. An ambiguous token-start continuation may itself
need more than one source symbol before selecting a `Lex`. Conversely, a
selected `Lex` may later return an unconsumed boundary symbol to tokenization.

The important distinction is ownership rather than lookahead count:

- cross-syntax commitment belongs to tokenization behavior;
- syntax-internal continuation belongs to the selected recognizer.

## Relationship to `LexPipe`

`LexPipe` currently combines several responsibilities:

- the syntax lookup context;
- initial character dispatch;
- return from lexical recognizers;
- boundary redispatch;
- structural terminal execution;
- parser-stack manipulation; and
- finalization.

The Tokenize phase identifies a responsibility inside this collection, but does
not by itself imply that `LexPipe` must be replaced or split.

Possible implementations might add a phase method to `LexPipe`, introduce a
neighboring pipe, or express tokenization entirely through registered Frames.
This document deliberately leaves that placement open.

The required property is that `LexPipe` or any successor does not accumulate
syntax-specific pending state on behalf of the participating syntax classes.

## Relationship to Structural Terminals

Structural terminals currently bypass `Token` emission and immediately mutate
the parser stack. This makes ambiguous terminal prefixes especially dangerous:
the system performs a side effect before token ownership is settled.

The Tokenize phase must delay commitment to such a terminal until syntax-owned
behavior resolves the prefix. Once committed, the action may continue to use the
existing terminal mechanism.

This conjecture does not require structural terminals to become ordinary `Token`
values. It requires only that their side effects occur after tokenization, not
as a substitute for tokenization.

Whether structural actions should eventually be represented as tokens is a
separate parser-design question.

## Relationship to Known Warts

### Directly explained by the phase

- `<`/`>` structural terminals colliding with `<<`/`>>` and `<=`/`>=`;
- exact terminal lookup silently outranking overlapping atom starts;
- new token families sharing an initial character with existing syntax; and
- ambiguous token starts split across physical input chunks.

These require syntax-owned commitment before selecting `Lex` or executing a
terminal.

### Partly coordinated by the phase

- redispatching a boundary symbol after one token completes;
- entering a specialized recognizer such as `LexBytes`;
- resolving a leading `+` between an operator and a future phone literal; and
- delivering EOF to an unfinished token-start continuation.

The phase invokes the next behavior, but the participating Frame owns the state
and grammar.

### Not solved by the phase

- `FrameName` continuation rules inside generic `Lex`;
- quoted terminal and comment-boundary behavior;
- arbitrary operator-run completion after `FrameOperator` is selected;
- document-fence run counting after `FrameDoc` is selected;
- byte-payload consumption after byte syntax is selected;
- phone segment recognition after a phone recognizer is selected;
- base-specific blob validation;
- incomplete smart-string detection at EOF;
- structural aggregate mismatch errors; and
- `?`/`:` conditional evaluation semantics.

Those remain recognizer, lifecycle, parser, or evaluator concerns. A stateless
Tokenize phase should not absorb them merely because they involve source text.

## EOF and Chunk Boundaries

Physical input chunks do not become syntax boundaries. If token-start
recognition is incomplete at the end of a chunk, the returned Frame remains the
current receiver for the next chunk.

The phase stores nothing between calls. The evaluator already retains the
current returned Frame, and that Frame carries any unresolved recognition state.

EOF differs from a physical chunk because it forces the current Frame to
complete or fail. The Tokenize phase may deliver the EOF symbol or completion
message, but the active syntax Frame must determine whether its state
represents:

- a complete token start;
- a committed structural terminal;
- valid but incomplete input; or
- invalid source.

This exposes a remaining lifecycle problem: `HCEval` currently recognizes
special completion behavior through concrete `LexDoc` checks and treats other
unfinished lexical states inconsistently. The Tokenize phase does not solve that
problem, but it should participate in the same eventual Frame-shaped completion
protocol.

## Error Ownership

The Tokenize phase does not accumulate or interpret syntax errors. A
participating Frame reports an error when its tokenization behavior cannot
continue validly.

The phase may route that returned error into the shared output or completion
path. It should not translate syntax-specific failure into console-only side
effects or silently discard the offending source.

Errors remain classified by the layer that has enough information:

- token-start ambiguity and invalid prefixes belong to tokenization
  participants;
- incomplete or invalid token bodies belong to selected recognizers;
- unmatched or mismatched aggregate delimiters belong to parsing; and
- invalid operator application belongs to evaluation.

## Required Invariants

Any design derived from this conjecture should preserve the following:

1. The Tokenize phase owns no input-dependent recognition state.
2. Every incomplete decision is represented by the Frame returned through the
   monadic pipeline.
3. Syntax classes own their token-start rules through polymorphic behavior.
4. Structural side effects occur only after token-start commitment.
5. Ordinary unambiguous syntax retains an efficient single-character path.
6. A physical chunk boundary does not force commitment.
7. A deciding boundary symbol is consumed or redispatched exactly once.
8. Tokenization does not acquire token-body grammar already owned by a selected
   recognizer.
9. Generic phase code does not grow concrete syntax-class branches.
10. EOF reaches every unfinished Frame-shaped state and produces completion or
    an explicit failure.
11. Parser nesting and evaluator semantics remain outside tokenization unless a
    separately justified language rule requires their input.
12. The original source spelling remains available until the responsible syntax
    Frame commits or reports an error.

## Questions Left Open

1. What new method or methods do syntax classes expose to the Tokenize phase?
2. Does tokenization invoke one registered participant or all participants that
   match an initial symbol?
3. How is candidate plurality represented by one returned Frame?
4. Can existing Frames represent an ambiguous continuation without introducing a
   new candidate-container type?
5. Does an incomplete tokenization state return directly as the next receiver,
   or does a phase-specific pipe remain the receiver and call it?
6. How does an atom participant select its existing `Lex` without coupling
   itself to construction details?
7. How do structural Frames expose tokenization behavior without immediately
   mutating `ParsePipe`?
8. Does boundary redispatch re-enter the Tokenize phase through ordinary
   `Frame.call()`?
9. How is EOF invoked uniformly on tokenization continuations and selected
   recognizers?
10. Is "Tokenizer" still the best component name if the phase does not itself
    produce complete `Token` values?

## Tests of the Conjecture

The corrected conjecture gains support if a prototype can demonstrate that:

- the phase driver remains unchanged and stateless across `<`, `<<`, `>`, and
  `>>`;
- syntax participants, rather than the driver, express each viable
  interpretation;
- an ambiguous first character is represented entirely by the returned Frame;
- splitting an ambiguous operator across arbitrary chunks produces identical
  results;
- structural push or pop occurs exactly once and only after commitment;
- an unrelated following symbol is redispatched exactly once;
- ordinary numbers, names, strings, and unambiguous operators retain their
  existing direct behavior; and
- adding another overlapping token family requires new syntax behavior but no
  token-family branch in the phase driver.

The conjecture is weakened if the phase must maintain its own candidate list,
source buffer, lookahead cursor, syntax-specific flags, or parser-stack mirror.
Those outcomes would mean the recognition state has not remained Frame-shaped
and syntax-owned as proposed.

## Superseding the Earlier Framing

The following claims in `04-tokenizer-conjecture.md` and
`05-tokenizer-conjecture-evaluation.md` should no longer guide design:

- the Tokenizer "owns" undecided source;
- the Tokenizer buffers ambiguous prefixes;
- the Tokenizer itself remains pending across input chunks;
- the Tokenizer stores candidate interpretations; and
- the Tokenizer validates syntax-specific EOF state.

Their corrected forms are:

- syntax Frames own undecided source;
- returned Frames represent ambiguous or incomplete recognition;
- the evaluator retains the returned Frame across chunks;
- syntax-owned behavior represents candidate interpretations; and
- the active Frame validates its own EOF state.

The earlier wart classification remains useful when read as a distinction among
token-start commitment, selected-recognizer continuation, lifecycle, parsing,
and evaluation. Only the location of pending state is superseded.

## Conclusion

HC appears to be missing a tokenization **phase**, not a stateful Tokenizer
object.

The phase invokes syntax-owned methods between symbolication and `Lex`
selection. It does not buffer source, count lookahead, retain candidates, or
mirror parser state. Any incomplete or ambiguous recognition is represented by
the Frame returned through HC's existing monadic pipeline.

This refined conjecture explains how HC can introduce delayed token-start
commitment without abandoning its Frame model. It also preserves the central
architectural constraint of #292: lexical behavior belongs to syntax Frames,
while generic phases call that behavior and route its results.
