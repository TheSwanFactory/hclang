# Odd Backtick Fences for HC Document Strings

**Status:** Proposed\
**Issue:**
[#284 — Make white-paper doctest traverse the full document](https://github.com/TheSwanFactory/hclang/issues/284)\
**Related:** #197, #282

## Summary

HC document strings use runs of backticks as fences. Outside a document, any
odd-length run opens a document and any even-length run represents an empty
document. Inside a document, a backtick run shorter than the opening fence is
literal content, a run equal to the opening fence closes the document, and a run
longer than the opening fence is a lexical error.

Backtick runs are maximal consecutive sequences in the logical character stream.
Their meaning cannot depend on physical read chunks or evaluator call
boundaries.

This rule makes triple-backtick document fences first-class HC syntax, permits
one- and two-backtick AsciiDoc spans inside them, supports larger odd fences
without adding named delimiter levels, and preserves the established two-
backtick spelling of an empty document.

Issue #284 also requires migrating `cli/hc/white-paper.hc` so executable
examples use HC document fences, non-executable examples remain document
content, and a full-document doctest reaches EOF with authoritative counts and
no prose-derived diagnostics.

This document specifies required behavior and affected areas. It intentionally
does not prescribe implementation code, classes, algorithms, or internal data
structures.

## Problem

`cli/hc/white-paper.hc` alternates between prose and executable examples.
Triple-backtick lines are intended to switch between document content and HC
input. The original lexer instead treated each backtick as an independent
single-character delimiter.

Consequently, inline AsciiDoc or Markdown backticks could change evaluator
state. Prose could be evaluated as HC, produce missing-name errors, become the
actual value of a pending doctest, invert later prose and executable regions, or
provoke parser-stack diagnostics. A summary could appear even when the final
document remained lexically incomplete.

The language needs one rule for all document fences rather than special cases
for one and three backticks.

## Goals

1. Define document fences by maximal backtick-run length.
2. Allow any odd-length opening fence.
3. Require an exactly equal backtick run to close a non-empty document.
4. Preserve even-length top-level runs as empty documents.
5. Treat shorter interior runs as literal document content.
6. Reject interior runs longer than the opening fence.
7. Preserve the original fence representation when a `FrameDoc` is rendered.
8. Make results independent of input chunk and evaluator call boundaries.
9. Detect unterminated documents and invalid runs at EOF.
10. Traverse the complete white paper with deterministic doctest counts and no
    prose-derived diagnostics.
11. Prefer native AsciiDoc notation over HTML substitutions.

## Non-goals

- Parsing AsciiDoc or Markdown in the HC lexer.
- Assigning documentation meaning to interior backtick runs.
- Adding a backslash escape system to HC quote types.
- Changing smart-string syntax.
- Changing expression grammar, aggregate terminals, or evaluation semantics.
- Implementing every aspirational example in the white paper.
- Prescribing an implementation design in this specification.

## Terminology

### Backtick run

A **backtick run** is a maximal consecutive sequence of backtick characters in
the logical source stream.

A run ends when one of the following occurs:

- a non-backtick source character arrives;
- a logical newline arrives; or
- EOF is reached.

A physical read-chunk or evaluator call boundary does not end a run.

### Fence length

The **fence length** is the number of backticks in a run. A document opened by
an odd run retains that opening fence length until it closes or fails.

### Outside and inside

**Outside** means the lexer is processing ordinary HC source rather than the
body of a document string. **Inside** means an opening odd run has selected an
active document fence that has not yet closed.

## Normative lexical semantics

### Outside a document

When a maximal backtick run ends outside a document:

- an odd-length run opens a document using that entire run as its fence;
- an even-length run produces one empty document; and
- the character that ended the run is processed according to the lexical state
  resulting from that classification.

The even-run rule applies only outside a document. An even run inside a document
is compared with the active opening fence in the same way as every other
interior run.

Examples of outside runs include:

- one backtick opens a one-backtick document;
- two backticks produce an empty document;
- three backticks open a three-backtick document;
- four backticks produce an empty document;
- five backticks open a five-backtick document; and
- six backticks produce an empty document.

An even run is one empty-document token, not an implicit series of smaller empty
documents.

### Inside a document

Let the active opening fence have length N. When an interior backtick run is
classified:

- a run shorter than N is appended literally to the document body;
- a run equal to N closes the document; and
- a run greater than N is a lexical error.

The closing delimiter is the entire equal run. A greater run MUST NOT close the
document using an equal-length prefix and reprocess the remainder.

For a three-backtick document, one or two backticks are content, three close,
and four or more are errors. For a five-backtick document, runs of one through
four are content, five close, and six or more are errors.

For a one-backtick document, one backtick closes and every longer interior run
is an error.

### Ordinary characters after runs

The non-backtick character that establishes the end of a run is not part of that
run.

- After an odd opening run, it is the first character processed inside the new
  document.
- After an even outside run, it is processed outside after the empty document.
- After a shorter interior run, the backticks and the terminating character are
  document content.
- After an equal closing run, it is processed outside the completed document.
- After a greater interior run, normal processing does not continue unless a
  separately specified error-recovery policy permits it.

### Newlines

A logical newline is a source character and ends a backtick run.

- After an opening fence, the newline is document content.
- After a shorter interior run, the run and newline are document content.
- After a closing fence, the newline is processed outside the document.
- Blank physical lines inside documents must remain logical blank lines in the
  document value.

### EOF

EOF ends any pending backtick run and then validates lexical completion.

Outside a document:

- an even run at EOF produces an empty document;
- an odd run at EOF opens a document that is immediately unterminated.

Inside a document:

- an equal run at EOF closes the document successfully;
- a shorter run is literal body content, after which the document is still
  unterminated;
- a greater run is a lexical error; and
- EOF without a closing run is an unterminated-document error.

An incomplete or erroneous document MUST NOT yield successful CLI status or a
false-green doctest traversal.

### Streaming equivalence

Lexical results MUST depend on the logical character stream, not its transport.
Supplying the same stream in one evaluator call, in multiple calls, or in
arbitrary read chunks MUST produce the same frames, document values, errors, and
completion status.

Pending runs and active document fences may cross chunk and call boundaries. A
logical line boundary remains meaningful even when it coincides with a call
boundary. An evaluator that reports a failed lexical finish must be reusable
without retaining content or fence state from the failed input.

Independent evaluators MUST NOT share mutable document-lexing state.

## Frame representation and round-tripping

A parsed `FrameDoc` MUST retain enough source information to render its fence
form again.

For a non-empty document, `toString()` MUST emit the same odd opening fence on
both sides of the body. For an empty document produced by an even outside run,
`toString()` MUST preserve that even-run spelling.

Fence syntax is not user data:

- opening and closing fences are excluded from the document body;
- shorter interior runs are included literally in the body; and
- fence metadata is not exposed as document-string content during evaluation.

Fence preservation is required even when two differently fenced documents have
identical bodies. The body alone cannot reconstruct the original source form.

## Existing processing path and required areas of change

This section identifies where the implementation must be assessed or changed. It
does not specify how those changes are to be implemented.

### Syntax dispatch: `lib/execute/syntax.ts`

`getSyntax()` generates a character-to-parser context from registered atom
classes. A sample atom supplies `string_start()`, and the initial backtick maps
to the configured `FrameDoc` lexer.

Required outcome:

- document syntax continues to enter through the ordinary single-character
  lookup;
- no separate multi-character grammar entry is required for each fence length;
- registration remains compatible with the dynamic atom-class dispatch model;
  and
- syntax dispatch does not interpret AsciiDoc or Markdown.

### Character reduction and dispatch

`FrameString.reduce()` turns source characters into `FrameSymbol` calls.
`LexPipe` provides the syntax context, handles terminals, and forwards completed
tokens toward parsing.

Affected files: `lib/frames/frame-string.ts` and `lib/execute/lex-pipe.ts`.

Required outcome:

- arbitrary chunk boundaries do not masquerade as logical source boundaries;
- logical newlines remain visible to document lexing;
- empty logical lines inside documents are preserved; and
- initial backtick dispatch remains consistent with other atom types.

### Atom lexing: `lib/execute/lex.ts`

`Lex` is the generic monadic atom parser selected by `syntax.ts`. It currently
accumulates atom bodies, determines completion, constructs frames, emits tokens,
and returns control to its parent `LexPipe`.

Required outcome:

- maximal backtick runs are classified according to this specification;
- no behavior is limited to fence lengths one and three;
- an equal run closes only after the run is known to be equal;
- a greater run produces an error rather than a prefix close;
- characters following classified runs are processed in the correct lexical
  context;
- pending document state survives streaming boundaries; and
- behavior for identifiers, operators, comments, strings, bytes, terminals, and
  other atoms remains compatible.

### Existing deferred-classification precedents

The implementation review should inspect the following pre-existing behavior.
These cases demonstrate useful parts of the required control flow, but none is a
complete model for document-fence recognition.

- `FrameName` accepts both identifier and operator characters. `Lex.isEnd()`
  uses the accumulated atom and the arriving character to decide whether a
  hyphen continues an identifier or an operator character begins a different
  token. This is state-dependent classification rather than true
  future-character lookahead.
- `Lex.finish()` can complete the current atom and redispatch the character that
  exposed its boundary through the parent pipe. This is the existing precedent
  for processing the non-backtick that ends a maximal run in the resulting
  lexical context.
- `HCEval.call()` retains an unfinished `Lex` between calls. This demonstrates
  persistent monadic lexer state, although the historical call model treats a
  call boundary as a logical line boundary rather than an arbitrary transport
  chunk.
- `LexBytes` demonstrates a stateful lexer consuming a fixed amount of
  subsequent input before returning to its parent. Its end-to-end test is
  currently skipped, so it is evidence of an intended transition pattern, not a
  conformance baseline.
- `FrameString` is not a lookahead precedent. Its asymmetric smart opening and
  closing quotes avoid an escape ambiguity, while the generic
  `FrameAtom.canInclude()` still makes an immediate one-character decision.

The existing `FrameName` and `FrameBytes` paths also place atom-type-specific
decisions inside generic `Lex`. Adding document runs creates another demand that
does not fit the current boolean `canInclude()` contract. This is evidence that
a more general atom/lexer boundary may be missing, but it does not determine
what that abstraction should be.

Before adding another document-specific path, the implementation design MUST
assess whether one shared lexical-transition abstraction can cover the
demonstrated cases while preserving the character-to-parser dispatch model. The
assessment must not expand into a parser redesign without an independently
demonstrated need. This specification does not prescribe an API, state machine,
class hierarchy, or ownership model for that abstraction.

### Atom lexical contract: `lib/frames/frame-atom.ts`

`FrameAtom.canInclude()` currently provides a one-character include-or-end
decision. `FrameQuote` is currently a marker subclass.

Required outcome:

- the atom/lexer boundary can represent a decision that cannot be committed
  until a maximal run is known;
- atom-specific lexical boundaries remain compatible with the data-driven
  registration in `syntax.ts`; and
- ordinary one-character atom boundaries retain their behavior.

This specification does not prescribe changes to method signatures, return
types, class hierarchy, or state ownership.

### Document representation: `lib/frames/frame-doc.ts`

`FrameDoc` extends `FrameString` and currently represents document data and its
rendering delimiters.

Required outcome:

- it can represent every valid odd opening fence;
- it can preserve every valid even empty-document spelling;
- it round-trips shorter literal interior runs;
- rendering uses the parsed fence form; and
- document evaluation remains string-like.

No fixed set of named short or long levels is part of the language semantics.

### Evaluator streaming and finish: `lib/execute/hc-eval.ts`

`HCEval.call()` retains lexical state across calls. Evaluator completion is the
point at which pending source and lexical completeness are validated.

Required outcome:

- active fences and pending runs survive non-logical call boundaries;
- logical line endings remain distinguishable from arbitrary chunks;
- EOF classifies the final pending run and detects unterminated documents;
- lexical failure contributes to unsuccessful traversal status;
- a failed finish leaves the evaluator safe for clean reuse; and
- separate evaluator instances remain isolated.

### Parser handoff: `lib/execute/parse-pipe.ts`

`Token.called_by()` forwards a completed contained frame to `ParsePipe`, which
collects frames into expressions and aggregates.

Required outcome:

- every valid non-empty document produces exactly one `Token(FrameDoc)`;
- every valid even empty run produces exactly one `Token(FrameDoc)`;
- fence length is not interpreted by `ParsePipe`; and
- no new expression production or aggregate terminal is introduced.

No parser behavior change is expected unless testing reveals that the existing
handoff violates these outcomes.

### File traversal and CLI completion: `cli/runfile.ts` and `cli/hc.ts`

`runfile()` reconstructs lines from file chunks and sends them to the evaluator.
For `.md` and `.adoc` files it injects triple-backtick wrappers. `main()` owns
final traversal status.

Required outcome:

- file chunking does not alter run classification;
- logical newlines and blank lines are preserved inside documents;
- synthetic triple fences remain valid odd fences;
- EOF completion is checked exactly once after traversal;
- unterminated documents and greater-run errors produce nonzero CLI status; and
- successful status proves lexical completion rather than merely the presence of
  a doctest summary.

### Doctest accounting: `lib/execute/hc-test.ts`

`HCTest` observes source and expectation markers and emits the final summary.

Required outcome:

- semicolon and hash text inside any valid document fence remains document
  content;
- lexical errors cannot be hidden by a successful assertion summary;
- the final summary appears exactly once; and
- existing assertion and unimplemented counts retain their meaning.

No counting-semantics change is expected unless focused tests expose an
independent defect.

## AsciiDoc conventions for the white paper

### Inline code

Prose SHOULD use ordinary AsciiDoc monospace spans with one backtick on each
side. Inside a triple-backtick HC document, one- and two-backtick runs are
shorter than the active fence and therefore remain literal body text.

HTML code elements are neither required nor preferred. The lexer does not need
to know that these shorter runs are AsciiDoc markup.

### Executable examples

Bare triple-backtick fences delimit transitions between prose documents and
executable HC examples. Triple fences are one ordinary instance of the general
odd-fence rule.

Executable cases use the maintained doctest convention: one semicolon source and
one hash expectation for a value-returning expression. An expression ending in
the HC semicolon terminal is a statement: it intentionally produces no output,
has no hash expectation, and is not counted as an assertion. An intended
value-returning example whose correct behavior is not implemented uses
`$!.unimplemented` with a concrete expected value.

Language tags MUST NOT follow executable HC fences because text outside the
document is HC input.

### Non-executable examples

Shell commands, pseudocode, incomplete HC fragments, and aspirational examples
that must not execute SHOULD use backtick-free AsciiDoc source or listing blocks
inside the active document.

The preferred form is an AsciiDoc source attribute followed by a `----` listing
block. Such blocks remain `FrameDoc` content and do not contribute to doctest
totals.

All AsciiDoc blocks and the enclosing HC document MUST be explicitly closed
before EOF.

## Compatibility requirements

- Existing one-backtick documents remain valid.
- Two adjacent top-level backticks remain an empty document.
- Triple-backtick documents remain valid and become one `FrameDoc` token.
- One- and two-backtick runs inside a triple document are literal content.
- Ordinary smart strings are unchanged.
- Comments, byte literals, identifiers, groups, schemas, and terminals are
  unchanged.
- `.md` and `.adoc` synthetic triple wrappers remain valid.
- Existing valid inputs have chunk-independent behavior.

The following behavior is intentionally clarified or changed:

- odd fences greater than three are valid;
- even outside runs of any length are one empty document;
- greater interior runs are lexical errors;
- a greater run does not close by an equal prefix;
- incidental sequences of multiple empty `FrameDoc` tokens from a single maximal
  run are not preserved; and
- incomplete documents cannot succeed silently at EOF.

## White-paper migration

After the lexical behavior conforms to this specification:

1. Retain or normalize prose inline code as ordinary AsciiDoc single-backtick
   spans.
2. Retain bare triple fences only for examples intended to execute.
3. Convert illustrative fences to AsciiDoc source/listing blocks or indented
   literal blocks inside document content.
4. Normalize malformed, indented, and unclosed delimiters.
5. Remove escaped-backtick workarounds that are no longer needed.
6. Pair every intended value-returning semicolon source with one hash
   expectation; leave statement sources without an expectation.
7. Do not change an example's semantics merely to make the migration pass: do
   not turn a statement into a value-returning expression, replace one source
   with another, or reinterpret a source line as an expectation. An
   independently identified documentation defect may be corrected explicitly and
   tested. Add an expectation only when the documented result is unambiguous;
   otherwise retain the example in a non-executable listing block.
8. Mark unsupported required behavior with `$!.unimplemented` and a concrete
   expected value.
9. Inventory executable and non-executable examples before accepting totals.
10. Close the final AsciiDoc block and enclosing HC document before EOF.
11. Record reviewed exact total, pass, fail, and unimplemented counts in the
    full-document CLI regression, with zero failures.

## Required tests

### Frame tests: `lib/frames/frame-doc.test.ts`

Cover:

- non-empty documents using odd fences of lengths one, three, five, and at least
  one larger odd length;
- empty documents using even runs of lengths two, four, six, and at least one
  larger even length;
- preservation of the original fence form;
- exclusion of opening and closing fences from document data;
- preservation of shorter interior runs; and
- `toString()` round-tripping for identical bodies with different fences.

### Lexer and evaluator tests

Affected files: `lib/execute/evaluate.test.ts` and
`lib/execute/hc-eval.test.ts`.

Cover:

- every outside odd run opens using its full maximal length;
- every outside even run produces one empty document;
- the non-backtick following an even run is processed outside;
- the non-backtick following an odd opener becomes document content;
- shorter interior runs are literal for three-, five-, and larger fences;
- an equal maximal run closes;
- a greater run is an error and never closes by a prefix;
- a one-backtick document rejects an interior run longer than one;
- adjacent ordinary characters are neither swallowed nor duplicated;
- consecutive documents produce the expected number of tokens;
- opening, shorter, equal, and greater runs split at every chunk position;
- results are identical across one-call, multi-call, and arbitrary-chunk input;
- logical newlines end runs while non-logical chunk boundaries do not;
- blank document lines are preserved;
- even runs classify correctly at EOF;
- odd openers at EOF are unterminated;
- shorter final runs remain body content followed by an unterminated error;
- equal final runs close at EOF;
- greater final runs are errors;
- an evaluator is cleanly reusable after failed completion;
- independent evaluators do not share pending content or fence state; and
- ordinary strings, comments, identifiers, operators, bytes, terminals, and
  aggregates retain existing behavior.

### Parser handoff tests: `lib/execute/parse.test.ts` and related tests

Cover:

- one completed `FrameDoc` reaches `ParsePipe` for each non-empty document;
- one completed `FrameDoc` reaches `ParsePipe` for each maximal even run;
- no partial fence token reaches parsing; and
- invalid or unterminated documents do not masquerade as completed frames.

### Doctest tests: `lib/execute/hc-test.test.ts`

Cover:

- semicolon and hash lines inside documents using multiple odd fence lengths;
- shorter inline backtick runs never becoming doctest input;
- statement sources producing no output and requiring no hash expectation;
- lexical failure preventing a false-green finish; and
- exactly one authoritative summary after successful completion.

### File and CLI tests: `cli/runfile.test.ts` and `cli/hc.test.ts`

Cover:

- multi-line document values across physical lines and file chunks;
- blank physical lines inside synthetic `.md` and `.adoc` wrappers;
- synthetic triple-fence opening and closing;
- nonzero status for unterminated documents;
- nonzero status for greater interior runs;
- lexical completion at EOF;
- the maintained `cli/hc/testdoc.hc` examples containing one- and two-backtick
  spans inside a triple document; and
- complete `cli/hc/white-paper.hc` traversal with exactly one reviewed summary,
  zero failures, and no name-resolution, missing-test, lexer, parser-stack, or
  prose-derived diagnostics.

## Alternatives considered

### Fixed one- and three-backtick levels

Rejected. Naming short and long levels hardcodes two instances of a general
run-length rule, scatters numeric assumptions through representation and lexing,
and provides no principled meaning for larger runs.

### Close on the first equal-length prefix

Rejected. A greater run inside a document is an error. It must not silently
close the document and reinterpret its remainder in another lexical context.

### Replace inline code with HTML

Rejected. HTML avoids the collision but discards the desired AsciiDoc source
convention and leaves HC document fences underspecified.

### Replace inline code with plus-delimited passthroughs

Rejected as the primary solution. It changes authoring conventions without
defining backtick-run behavior.

### Special-case two backticks in the white paper

Rejected. Fence behavior is an HC lexical rule, independent of file name and
documentation format.

### Parse AsciiDoc in the lexer

Rejected. HC classifies only its own maximal backtick runs. It does not assign
markup meaning to shorter document content.

## Validation commands

The implementation should be checked with targeted tests before the complete
suite:

    deno test lib/frames/frame-doc.test.ts lib/execute/evaluate.test.ts
    deno test lib/execute/hc-eval.test.ts lib/execute/hc-test.test.ts
    deno test --allow-env --allow-read --allow-write cli/runfile.test.ts cli/hc.test.ts
    deno task hc cli/hc/white-paper.hc -t
    deno task test:lib
    deno task test:cli
    deno task test:doc
    deno task test:all

## Acceptance criteria

- Maximal backtick runs are independent of input chunking.
- Every odd outside run opens a document with that full fence.
- Every even outside run produces one empty document.
- A shorter interior run is literal content.
- An equal interior run closes the document.
- A greater interior run is a lexical error.
- One- and two-backtick AsciiDoc spans remain content inside triple documents.
- Fence form survives frame construction and `toString()` round-tripping.
- Opening and closing fences are excluded from document data.
- EOF rejects unterminated and invalid documents.
- Failed completion leaves evaluators reusable and isolated.
- Each valid document reaches parsing as exactly one `FrameDoc` token.
- No new `ParsePipe` grammar production or aggregate terminal is introduced.
- Synthetic `.md` and `.adoc` wrappers continue to work.
- `testdoc.hc` demonstrates shorter inline runs inside a triple document.
- `white-paper.hc` uses native AsciiDoc inline spans and backtick-free listing
  blocks for non-executable examples.
- Every intended value-returning executable white-paper example is counted
  exactly once; statement examples are executed without being counted.
- The full white-paper doctest reaches EOF with exactly one final summary, zero
  failures, and no lexer, parser, missing-test, name-resolution, or
  prose-derived diagnostics.
- Existing maintained library, CLI, document, and web tests remain green.

## Expected implementation scope

A conforming change is expected to assess or modify:

- `lib/execute/syntax.ts` for continued single-character atom dispatch;
- `lib/frames/frame-string.ts` and `lib/execute/lex-pipe.ts` for logical stream
  boundaries;
- `lib/execute/lex.ts` for maximal-run recognition and token completion;
- `lib/frames/frame-atom.ts` for the atom lexical-boundary contract;
- `lib/frames/frame-doc.ts` for arbitrary fence representation and rendering;
- `lib/execute/hc-eval.ts` for streaming, EOF, failure, isolation, and reuse;
- `lib/execute/parse-pipe.ts` only if token-handoff tests expose a violation;
- `lib/execute/hc-test.ts` only if doctest tests expose an independent defect;
- `cli/runfile.ts` and `cli/hc.ts` for file boundaries and final status;
- the corresponding test files identified above;
- `cli/hc/testdoc.hc`;
- `cli/hc/white-paper.hc`; and
- `cli/hc.test.ts` for the full-document baseline.

Expression evaluation, aggregate grammar, and documentation markup parsing are
outside the expected implementation scope.
