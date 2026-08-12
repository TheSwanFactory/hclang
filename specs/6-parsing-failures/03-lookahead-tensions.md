# Lookahead and Lexical-Boundary Tensions

**Status:** Analysis\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Related:** #293

## Purpose

This document analyzes the pressures commonly grouped under the word "lookahead"
in the HC lexer. It does not select an abstraction, prescribe an API, or propose
an implementation.

The immediate example is the collision between `<` and `>` as type delimiters
and `<<` and `>>` as comparison operators. The same architectural question is
also visible in document fences, names adjacent to operators, fixed-length byte
strings, phone-number literals, boundary redispatch, input chunking, EOF, and
lexical errors.

These cases are related, but they do not all require the same kind of future
knowledge. Treating every case as "lookahead" risks hiding materially different
requirements.

## Existing Contract

HC begins with data-driven single-character dispatch. `syntax.ts` registers an
atom lexer under the atom's `string_start()` value and registers structural
terminals such as spaces, separators, and aggregate delimiters under their
literal characters.

After dispatch selects an atom, generic `Lex` asks
`FrameAtom.canInclude(char): boolean` whether each subsequent character belongs
to that atom. The answer supports only two outcomes:

- include the character in the current atom; or
- end the current atom.

`Lex` separately decides whether the boundary character is consumed, discarded,
or sent back through the parent pipe. It also contains type-specific behavior
for names and byte strings. Specialized `LexDoc` retains additional state for
maximal backtick runs and validates that state at EOF.

The result is not a purely one-character lexer today. It is a mixture of:

- single-character initial dispatch;
- stateful atom accumulation;
- terminal actions that execute immediately;
- boundary-character redispatch;
- specialized lexers;
- transport state retained across calls; and
- end-of-input completion and validation.

The open question is therefore not simply whether HC permits lookahead. The
question is which component owns an undecided character, what information may be
used to decide it, and how that decision participates in the monadic pipeline.

## Different Problems Hidden by "Lookahead"

### Prefix ambiguity

The `<`/`<<` and `>`/`>>` collision is a prefix ambiguity. On receiving the
first character, the lexer cannot know whether it has seen a complete structural
delimiter or the prefix of a longer operator.

This is true future-character dependence: the classification of the first
character changes according to what follows it.

The tension is visible before `canInclude()` is called. Exact terminal dispatch
claims `<` or `>` immediately, so no operator lexer exists yet to ask whether a
second character belongs to it.

### Maximal-run classification

Document fences require a whole run of backticks to be counted before its
meaning is known. Outside a document, parity determines whether the run opens a
document or denotes an empty one. Inside a document, run length relative to the
opening fence determines content, closure, or error.

This is more than a one-character prefix choice. The lexer must retain a
potentially unbounded run until a non-backtick, newline, or EOF proves that the
run is maximal.

### Boundary detection with redispatch

Ordinary atoms frequently know that a character does not belong to them, but
that character may begin the next token or invoke a structural action. Generic
`Lex.finish()` can export the current atom and send the boundary character back
to the parent pipe.

No future character is required here. The tension concerns ownership of the
current character and whether ending one token consumes it.

### State-dependent inclusion

Names accept both identifier and operator characters, but whether an operator
character continues a name depends on the body accumulated so far. A hyphen can
continue an identifier while another operator transition ends it. Generic
`Lex.isEnd()` currently knows specifically about `FrameName` to make this
decision.

This is history-sensitive classification rather than lookahead. The current atom
body, not a future character, supplies the missing information.

### Fixed-count continuation

Byte strings select a lexer that consumes a declared number of subsequent
characters. The transition from the count token to `LexBytes` is currently
recognized through a `FrameBytes` type check in generic `Lex`.

This is not lookahead in the usual sense because the characters are not
inspected to choose a token class. It is a lexical-mode transition with a known
future consumption obligation.

### Internal punctuation

A phone-number literal such as `+1.408.555.1212` needs punctuation normally
associated with operators or names to remain inside one value. Recognition may
depend on position, previous segments, permitted segment lengths, and the
character that terminates the literal.

Whether this requires lookahead depends on the eventual literal grammar. A
grammar can be history-sensitive, boundary-sensitive, or require evidence from a
later character before accepting punctuation. Issue #293 should not assume which
of these applies before the literal is specified.

### Incomplete input and EOF

Some source prefixes are valid but not yet classifiable. A single `>` might be a
complete closing delimiter or the prefix of `>>`. A backtick run may still grow.
A byte string may still be waiting for its declared payload.

EOF is therefore not merely another delimiter. It forces every pending lexical
decision to resolve as a token, a structural action, or an error.

## Central Tensions

### 1. Immediate dispatch versus delayed commitment

Single-character dispatch is simple, deterministic, and central to HC's current
syntax model. It lets the first character select a monadic parser without a
separate centralized token table.

Prefix ambiguity requires the opposite behavior: receiving the first character
must sometimes leave the selection pending. The system must distinguish
"selected but incomplete" from "not yet selected" or otherwise represent an
undecided dispatch.

The tension is not whether one character may be buffered. It is whether the
first-character lookup remains the authoritative classification step when its
result can later be revised.

### 2. Structural terminals versus ordinary atoms

Aggregate delimiters currently execute parser-stack actions immediately. `<`
pushes `FrameSchema`; `>` pops it. Operators are ordinary atoms accumulated and
later evaluated.

Allowing `<<` and `>>` means a character currently treated as an immediate
parser action can also begin a value token. Arbitration must occur before the
structural side effect, because a speculative push or pop cannot safely be
treated as harmless token buffering.

This creates a category tension: are delimiters privileged syntax, atom-like
recognizers, or candidates in a shared competition? The answer affects more than
comparisons.

### 3. Atom ownership versus cross-atom arbitration

Issue #292 aims to keep lexical rules with atoms rather than grow type checks in
generic `Lex`. An atom can naturally decide how its body continues after it has
been selected.

It is harder for an atom to own the choice between itself and another atom when
both claim the same initial character. `<` belongs simultaneously to the schema
delimiter and to the potential `<<` operator prefix. Neither recognizer can make
that decision solely through its current `canInclude()` method because initial
dispatch has already chosen between them.

Moving arbitration outward risks a centralized lexer that knows every overlap.
Moving it inward requires some shared mechanism for candidates, transitions, or
deferred selection. This document does not choose between those costs.

### 4. Maximal munch versus language-specific boundaries

A conventional lexer often chooses the longest valid token. That rule would
appear to favor `>>` over two `>` delimiters and longer operator runs over their
prefixes.

HC cannot assume unrestricted maximal munch without examining consequences:

- consecutive structural closers may be meaningful in nested aggregates;
- an operator character can terminate a name or continue an operator;
- document runs use parity and relative length, not merely the longest token in
  a static vocabulary;
- quoted content deliberately suppresses ordinary terminal behavior; and
- phone punctuation may resemble a sequence of otherwise valid tokens.

"Longest token wins" is therefore itself a language rule, not a neutral
implementation detail.

### 5. Token recognition versus parser context

One possible way to interpret `>` is to ask whether a schema is currently open.
That would let parser-stack state influence lexical classification. It could
also make the same source characters tokenize differently according to nesting
history.

Keeping lexing independent of parser context favors stable tokenization and
focused lexer tests. Consulting parser context may reduce ambiguity or preserve
compact syntax. The tension is between context-free lexical predictability and
context-sensitive convenience.

The current implementation already couples terminals to parser actions, but that
does not necessarily mean atom recognition should inspect the parser stack.
Those are distinct forms of coupling.

### 6. Streaming behavior versus decision latency

`HCEval` processes logical input incrementally and retains an unfinished lexer
between calls. Document-fence work established that physical chunk boundaries
must not alter lexical meaning.

An undecided prefix may arrive at the end of a chunk. Correct classification may
require waiting for the next chunk, logical newline, or EOF. Waiting preserves
chunk invariance but delays token emission and possibly parser actions.
Immediate classification preserves responsiveness but makes results depend on
transport boundaries.

The relevant boundary types must remain distinct:

- a physical transport chunk;
- an evaluator call;
- a logical newline;
- an HC token boundary; and
- EOF.

Conflating any two can make interactive and file evaluation disagree.

### 7. Redispatch versus double processing

When a character proves that a pending token or run has ended, that same
character may need to be processed in the newly selected lexical state.
`Lex.finish(..., passAlong)` already provides this behavior for ordinary token
boundaries, and `LexDoc` explicitly redispatches the character after a completed
fence.

As pending states become richer, every transition must answer whether the
deciding character was:

- consumed by the old state;
- the first character of the new state;
- a structural action to execute once;
- literal content;
- evidence only; or
- invalid input.

The danger on one side is dropping a boundary character. On the other is
executing it twice. A boolean inclusion result cannot express this distinction.

### 8. Recoverable incompleteness versus lexical error

An incomplete prefix is not necessarily erroneous. A `>` at the end of a
physical chunk may become `>>` when more input arrives. The same `>` at EOF may
validly close a schema or may be unmatched. A document run longer than its
opening fence is already known to be invalid before EOF.

The lexer therefore needs conceptual distinctions among:

- valid and complete;
- valid but incomplete;
- complete with a boundary to redispatch;
- invalid immediately;
- invalid only because EOF arrived; and
- lexically valid but structurally invalid.

Today these outcomes are distributed across return values, retained lexer
instances, console diagnostics, `HCEval.error()`, and parser-stack checks.
Generalizing the contract risks either collapsing important distinctions or
expanding a small interface into a general parser protocol.

### 9. Monadic simplicity versus richer transition results

The current pipeline encodes control flow by returning the next `Frame`: remain
in the current lexer, return to the parent, or transition to another parser.
This is compact and compositional.

Richer lexical decisions may need to carry several facts at once: emitted
tokens, next state, boundary disposition, incomplete status, and an error. A
richer result can make those facts explicit but may duplicate the monadic
transition model or create two competing representations of control flow.

Conversely, encoding every outcome only by choosing a returned `Frame` can make
important distinctions implicit in class identity and encourage additional
`instanceof` checks.

### 10. Source preservation versus semantic normalization

Some lexical forms must preserve their exact spelling. Document fences render
with their parsed fence form, and phone-number literals must retain punctuation
and a leading plus sign. Operators and delimiters may normalize to semantic
frames after recognition.

Delayed classification means the lexer temporarily owns source that may later
belong to different token classes. Any abstraction must clarify when buffered
characters become semantic data and whether their original spelling remains
available. Premature normalization can make diagnostics and round-tripping
incorrect.

### 11. Small shared abstraction versus accidental lexer redesign

There is strong evidence that `canInclude(char): boolean` is too small for all
demonstrated cases. There is not yet evidence that every case should share one
fully general mechanism.

A narrow abstraction may leave document, byte, name, and ambiguous-prefix paths
separate. A broad abstraction may unify them but effectively introduce a lexer
state-machine framework. Either outcome can be reasonable; the tension is how
much generality is justified by current language requirements rather than by
hypothetical syntax.

## The `<`, `>`, `<<`, and `>>` Collision

This collision is the sharpest test of the architecture because it occurs at
initial dispatch rather than inside an already selected atom.

The intended possibilities currently overlap as follows:

| Source prefix | Potential interpretation                             |
| ------------- | ---------------------------------------------------- |
| `<`           | Open a type/schema                                   |
| `>`           | Close a type/schema                                  |
| `<<`          | Less-than comparison operator                        |
| `>>`          | Greater-than comparison operator                     |
| `<=`          | Less-than-or-equal operation currently registered    |
| `>=`          | Greater-than-or-equal operation currently registered |

The operation table demonstrates an intention to retain symbolic comparisons,
but exact terminal dispatch makes every operator beginning with `<` or `>`
unreachable through the ordinary operator lexer.

Several tensions converge here:

- delaying `<` may delay opening a schema;
- delaying `>` may delay closing one and exposing the completed type to the
  enclosing parser;
- choosing `<<` by maximal munch may conflict with two adjacent type openings;
- choosing `>>` may conflict with two adjacent type closings in nested syntax;
- whitespace could disambiguate some cases but would make formatting
  semantically significant;
- parser nesting could disambiguate some cases but would make lexing
  context-sensitive;
- declaring only doubled forms as operators preserves type delimiters but still
  requires the first character to remain pending; and
- `<=` and `>=` add a second continuation family whose intended status must be
  decided independently of `<<` and `>>`.

No observation above determines the correct language rule. It establishes why
the collision belongs to #292 rather than being patched inside comparison
evaluation or the ternary example.

## EOF and Error Tensions Exposed by Comparisons

A delayed `>` at EOF could mean:

- a valid schema close;
- an unmatched structural close;
- an incomplete `>>` operator, if the language treats its prefix as incomplete;
  or
- a valid single-character operator, if that spelling is retained.

Those meanings cannot be selected by character inspection alone. The language
must decide which facts are lexical, which are structural, and which are
semantic.

The current unmatched-close behavior writes a console diagnostic and drops the
character. It does not produce a normal token or a structured lexical error.
Lookahead work therefore intersects error representation: delaying commitment
without defining failure outcomes may only move the point at which input is
silently lost.

## Test Dimensions Needed Before a Design Decision

Any later proposal should be evaluated against a matrix that separates syntax
meaning from input delivery. At minimum, evidence is needed for:

- solitary `<` and `>`;
- `<<`, `>>`, `<=`, and `>=`;
- adjacent and nested type delimiters;
- operators next to numbers, names, groups, and types;
- each ambiguous prefix split across physical chunks;
- each prefix before whitespace, newline, another terminal, and EOF;
- unmatched opening and closing delimiters;
- a boundary character that must be redispatched;
- ordinary atoms whose current one-character behavior must not change;
- document runs split across chunks;
- name/operator boundaries involving hyphens;
- fixed-length byte payload completion and premature EOF; and
- phone-literal punctuation once its grammar is specified.

These tests should expose current behavior and required invariants. They should
not encode a candidate transition API before the language choices are made.

## Questions Left Open

This analysis intentionally leaves the following unresolved:

1. Is first-character dispatch allowed to return a pending decision?
2. Are structural delimiters and atom recognizers peers during arbitration?
3. Does HC adopt any maximal-munch rule, and if so, over which syntax classes?
4. May lexical classification consult aggregate nesting state?
5. Can adjacent type delimiters coexist unambiguously with `<<` and `>>`?
6. Which comparison spellings are normative: doubled forms, equals-suffixed
   forms, both, or something else?
7. What outcome vocabulary replaces or supplements `canInclude()`?
8. Who owns boundary consumption and redispatch?
9. How are incomplete states represented across chunks and at EOF?
10. Which failures are lexical errors versus structural parser errors?
11. Should existing `FrameName`, `FrameBytes`, and `LexDoc` exceptions migrate
    to one abstraction or remain specialized?
12. How much source spelling must every lexical state retain?

## Conclusion

The lookahead problem is a boundary-ownership problem spanning dispatch,
accumulation, structural actions, streaming, EOF, errors, and monadic control
flow. The `<`/`>` versus `<<`/`>>` conflict demonstrates a real design hole: the
current system must commit to a terminal before it has enough information to
recognize the longer operator.

At the same time, the other motivating cases are not uniform. Some require true
future-character dependence, some require accumulated history, some require
redispatch of the current character, and some require a lexical-mode transition.
Issue #292 should preserve those distinctions while identifying the smallest
contract that can express the language decisions ultimately made.
