# Python-Style Backtick Levels for HC Document Strings

**Status:** Proposed\
**Issue:**
[#284 — Make white-paper doctest traverse the full document](https://github.com/TheSwanFactory/hclang/issues/284)\
**Related:** #197, #282

## Summary

HC currently treats every backtick as an independent document-string delimiter.
Triple-backtick document fences therefore work only as three adjacent
single-backtick transitions, and inline AsciiDoc code spans can accidentally
leave document text and enter executable HC.

HC should instead recognize one-backtick and three-backtick document-string
levels in the same structural manner as Python recognizes short and
triple-quoted strings. A three-backtick document string accumulates consecutive
backticks before deciding whether they are content or its closing delimiter. One
or two backticks inside that string remain text; three close it.

This permits native AsciiDoc unconstrained monospace spans written with two
backticks inside a triple-backtick HC document string. It also makes triple
fences first-class HC syntax rather than an accidental consequence of repeatedly
opening and closing one-backtick strings.

Issue #284 should be completed by specifying and implementing that lexical
behavior, retaining AsciiDoc notation in `cli/hc/white-paper.hc`, classifying
non-executable examples with backtick-free AsciiDoc blocks, and adding a
full-document doctest regression. This document specifies the work but does not
implement it.

## Problem

`cli/hc/white-paper.hc` alternates between prose and executable examples. A
triple-backtick line is intended to leave prose, execute HC, and then re-enter
prose at the next fence. The current lexer has no concept of a three-character
quote delimiter. Each backtick independently terminates or starts a `FrameDoc`.

As a result, prose such as an AsciiDoc or Markdown code span changes lexer
state. Text inside that span may be evaluated as HC, producing missing-name
errors or becoming the actual value of a pending doctest. Later fences can then
invert the intended prose/executable regions or attempt invalid parser-stack
operations. The resulting assertion totals do not reliably describe the
document.

## Goals

1. Make three-backtick document strings a real lexical construct.
2. Preserve one-backtick document strings and empty one-backtick strings.
3. Allow one- and two-backtick AsciiDoc notation inside a three-backtick
   document string without changing HC evaluation state.
4. Preserve delimiter level when a parsed `FrameDoc` is rendered again.
5. Work correctly when source arrives incrementally through `HCEval.call()`.
6. Traverse the complete white paper with deterministic doctest counts and no
   prose-derived diagnostics.
7. Prefer native AsciiDoc notation over HTML substitutions.

## Non-goals

- Parsing AsciiDoc or Markdown in the HC lexer.
- Treating arbitrary documentation markup as executable HC syntax.
- Implementing every aspirational example in the white paper.
- Changing expression grammar, grouping terminals, or HC evaluation semantics.
- Adding a general backslash escape system for every HC quote type.
- Implementing the feature in this specification document.

## Proposed lexical semantics

### Delimiter levels

HC document strings have two delimiter levels:

- **short document string:** one backtick opens and one backtick closes;
- **long document string:** three consecutive backticks open and three
  consecutive backticks close.

The delimiter used to open a `FrameDoc` determines the delimiter required to
close it. Delimiter characters are syntax and are not part of the document
value.

This is deliberately Python-style rather than an arbitrary-length fence system.
Two adjacent backticks at top level retain their existing interpretation as an
empty short document string. Three adjacent backticks select the long form.

### Accumulation inside a long document string

While a long document string is active, the lexer MUST accumulate a candidate
run of consecutive backticks before classifying it:

- a run interrupted after one backtick is appended to the document body;
- a run interrupted after two backticks is appended to the document body;
- reaching three consecutive backticks closes the long document string.

If more backticks immediately follow a closing run, the first three close the
long string and the remaining characters are reprocessed in the surrounding
lexical state. This mirrors Python's recognition of the first complete closing
delimiter rather than defining an unbounded exact-length fence language.

A non-backtick character terminates an incomplete candidate run, appends the one
or two accumulated backticks to the body, and is then appended normally. A
logical newline likewise terminates an incomplete candidate run and preserves
those backticks as body text.

### Short document strings

A short document string retains current behavior: the next backtick closes it.
It does not gain embedded-backtick escaping. Existing forms, including an empty
short string represented by two adjacent backticks, MUST remain valid.

### Streaming and boundaries

Delimiter recognition MUST depend on the logical character stream, not on how
that stream is divided among reducer calls, input chunks, or lines. Quote state
and an incomplete closing candidate may therefore need to survive a call
boundary.

A physical newline is still a source character and breaks a consecutive backtick
run. `runfile()` currently feeds trimmed lines through separate `HCEval.call()`
invocations, so the implementation design MUST preserve the existing logical
newline behavior while carrying long-string state between calls.

At EOF, an incomplete one- or two-backtick candidate inside a long string is
body text, but the surrounding unclosed string remains an unterminated-document
condition. EOF handling MUST not silently reinterpret an incomplete candidate as
a closing delimiter.

## Frame representation and round-tripping

A parsed `FrameDoc` MUST retain whether it was opened with the short or long
delimiter. Rendering it through `toString()` MUST emit the same delimiter level
on both sides.

Preserving the level is semantically necessary. A long document may contain one
or two consecutive backticks; rendering that value with a short delimiter would
produce different source or fail to round-trip.

The body stored by `FrameDoc` MUST contain literal interior backticks but MUST
exclude the opening and closing delimiters. Evaluation remains string-like and
must not expose delimiter metadata as user data.

## AsciiDoc conventions for the white paper

### Inline code

Inline code in prose SHOULD use AsciiDoc unconstrained monospace spans with two
backticks. For example, the words `nil` and `()` in prose would each be enclosed
by two backticks in `white-paper.hc`.

The two backticks are ordinary body text inside a long HC document string and
therefore cannot close it. HTML `<code>` elements are neither required nor the
preferred migration strategy.

A single-backtick AsciiDoc monospace span is also lexically safe inside a long
document string, but the white paper SHOULD use the two-backtick form
consistently. The unconstrained form behaves predictably when HC punctuation is
adjacent to the span.

### Executable examples

Bare triple-backtick fences continue to delimit transitions between long prose
strings and executable HC examples. Executable cases use the existing doctest
markers: one `;` source followed by one `#` expectation.

An intended executable example whose correct behavior is not implemented uses
`$!.unimplemented` with its concrete expected value. Such a case contributes to
`total` and `unimplemented`; it is not illustrative prose.

Language tags MUST NOT appear after executable triple-backtick delimiters,
because text outside the document string is HC input.

### Non-executable examples

Shell commands, pseudocode, incomplete HC fragments, and other examples that
must not execute SHOULD use native backtick-free AsciiDoc source or listing
blocks inside the long document string. The preferred source form is an AsciiDoc
`[source,<language>]` attribute followed by a `----` delimited listing block.

These blocks remain entirely in `FrameDoc` content, are visibly classified by
language, and do not contribute to doctest totals. Indented AsciiDoc literal
blocks MAY be used where a source language is not useful.

## Existing TypeScript processing path

Document strings pass through the following concrete path. These are the code
areas an implementation must assess; listing them does not prescribe a patch.

### File and CLI input

- `cli/hc.ts` — `main()` selects normal or `HCTest` output, invokes `runfile()`
  for each file, and calls `HCTest.finish()` after traversal.
- `cli/runfile.ts` — `runfile()` reads files in chunks, reconstructs lines,
  trims each line, and sends it to `HCEval.call()`. For `.md` and `.adoc` inputs
  it injects the `RUNDOC` and `ENDDOC` triple-backtick wrappers. An `.hc` file
  such as `white-paper.hc` supplies its own opening fence.

`runfile()` is relevant because delimiter state crosses line calls and because
its synthetic wrappers are intended to become genuine long `FrameDoc`
delimiters. Its trimming behavior also means quote recognition MUST NOT rely on
original indentation or column position.

### Evaluation pipeline

- `lib/execute/hc-eval.ts` — `HCEval.make_pipe()` constructs
  `LexPipe → ParsePipe(FrameGroup) → EvalPipe`.
- `lib/execute/hc-eval.ts` — `HCEval.call()` reduces each input string through
  the retained lexical state. If reduction ends in a `Lex`, it saves that object
  in `this.lex` for the next call. This is how multiline document strings
  currently survive line-by-line input.
- `lib/execute/lex-pipe.ts` — `LexPipe.lex()` reduces a `FrameString` character
  stream through the lexer. `LexPipe.perform()` handles parser terminals and
  tracks aggregate nesting in `level`; that level is not document-quote level.
- `lib/execute/syntax.ts` — `getSyntax()` registers `FrameDoc` in `atomClasses`.
  It creates a sample atom, indexes it by `string_start()`, and maps the initial
  backtick to `new Lex(FrameDoc)`.

### Quote lexing and representation

- `lib/execute/lex.ts` — `Lex.call()` receives characters, asks `isEnd()`
  whether the current atom is complete, accumulates `body`, and exports a
  `Token`.
- `lib/execute/lex.ts` — `Lex.isEnd()` currently delegates quote termination to
  `sample.canInclude(char)`. This one-character decision is the primary reason
  triple delimiters are not represented as a unit.
- `lib/execute/lex.ts` — `Lex.isQuote()` identifies quote atoms through
  `FrameQuote`; `finish()`, `exportFrame()`, and `makeFrame()` then construct
  and forward the completed atom.
- `lib/execute/lex.ts` — `AtomFactory` currently accepts only a body string. If
  delimiter level becomes `FrameDoc` construction state, this factory boundary
  must be accounted for in the design.
- `lib/frames/frame-atom.ts` — `FrameAtom.canInclude()` currently ends an atom
  whenever one character equals `string_suffix()`. `FrameQuote` is an empty
  marker subclass and adds no quote state.
- `lib/frames/frame-atom.ts` — `FrameAtom.toStringData()` formats an atom from
  `string_prefix()`, data, and `string_suffix()`. Long-document round-tripping
  ultimately passes through this method.
- `lib/frames/frame-doc.ts` — `FrameDoc extends FrameString` and currently fixes
  both `DOC_BEGIN` and `DOC_END` to one backtick. It stores no delimiter level.

The implementation must choose where the quote-specific state machine resides.
It may specialize `Lex` for `FrameQuote`, introduce a document lexer, or move
quote matching behind a richer Frame API. Regardless of structure, generic
identifier and terminal lexing MUST retain current behavior.

### Parser handoff

- `lib/execute/lex.ts` — `Token.called_by()` forwards the completed contained
  Frame to the next stage.
- `lib/execute/parse-pipe.ts` — `ParsePipe` collects completed Frames into
  expressions and groups. It does not inspect document delimiters.
- `lib/execute/terminals.ts` — `terminals` registers newline, separators, and
  aggregate open/close characters. Backticks are not aggregate terminals.

Therefore this feature is principally lexical and representational. No new
`ParsePipe` grammar production or aggregate terminal is expected. The parser
should continue to receive one completed `Token(FrameDoc)` for either delimiter
level.

## Compatibility requirements

- Existing one-backtick, multiline `FrameDoc` input remains valid.
- Two adjacent top-level backticks remain an empty short document string.
- Existing triple-backtick documents retain their evaluated body, but are now
  represented as one long `FrameDoc` rather than incidental adjacent short
  frames.
- Ordinary HC strings using smart quotes are unchanged.
- Comments, byte literals, identifiers, parser groups, and schemas are
  unchanged.
- `.md` and `.adoc` synthetic wrappers from `runfile()` continue to work.
- A long `FrameDoc` containing one- or two-backtick runs round-trips without
  changing its value or delimiter level.

Any observable dependency on the incidental empty `FrameDoc` tokens formerly
created by a triple fence is not preserved. Those intermediate tokens were an
implementation artifact, not intended document syntax.

## White-paper migration

After the lexical behavior exists, migrate `cli/hc/white-paper.hc` as follows:

1. Normalize prose inline code to AsciiDoc two-backtick spans; do not replace it
   with HTML.
2. Retain bare triple fences only for examples intended to execute.
3. Convert illustrative fences to AsciiDoc source/listing blocks or indented
   literal blocks so they remain inside the long `FrameDoc`.
4. Normalize malformed delimiters and remove escaped-backtick workarounds that
   are no longer needed.
5. Pair every intended `;` source with one `#` expectation. Mark unsupported but
   required behavior with `$!.unimplemented` and a concrete expected value.
6. Inventory all executable and non-executable examples before accepting a final
   count.
7. Record the reviewed exact `total`, `pass`, `fail`, and `unimplemented` values
   in the full-document CLI regression. The committed baseline has zero
   failures.

## Required tests for a future implementation

No tests are added by this specification. A future implementation must cover the
following behavior in the existing test areas.

### Frame tests

Extend `lib/frames/frame-doc.test.ts` to verify short and long construction,
delimiter-level preservation, literal one- and two-backtick body content, and
`toString()` round-tripping.

### Lexer and evaluator tests

Extend `lib/execute/evaluate.test.ts` and `lib/execute/hc-eval.test.ts` to
verify:

- short delimiters close with one backtick;
- an empty short document still uses two adjacent backticks;
- long delimiters close with three backticks;
- one and two backticks are preserved inside a long document;
- the first complete three-backtick closing sequence closes a long document;
- trailing backticks after that close are reprocessed in outer lexical state;
- delimiter candidates adjacent to ordinary characters are preserved correctly;
- long-document state survives multiple `HCEval.call()` invocations; and
- behavior does not depend on chunk or call boundaries.

Extend `lib/execute/hc-test.test.ts` where necessary to prove that `;` and `#`
text inside either document-string level never becomes doctest input.

### CLI and file tests

Extend `cli/runfile.test.ts` to cover long document strings across lines and the
synthetic `.md`/`.adoc` wrappers. Add a case to `cli/hc.test.ts` that runs the
entire `cli/hc/white-paper.hc` in testdoc mode and asserts successful status
plus the exact reviewed summary.

The full-document test must also demonstrate that prose produces no
name-resolution, missing-actual, missing-source, missing-expectation, or
parser-stack diagnostics.

## Alternatives considered

### Replace inline code with HTML

Rejected. HTML avoids backticks but discards the desired AsciiDoc source
convention and works around a limitation in HC's own document-string syntax.
Long document strings should be able to contain ordinary documentation markup.

### Replace inline code with plus-delimited AsciiDoc passthroughs

Rejected as the primary solution. It avoids the immediate delimiter collision
but changes authoring conventions and does not fix the underlying accidental
triple-fence semantics.

### Special-case two backticks inside the white paper

Rejected. A filename- or document-format-specific exception would couple the
lexer to one document. Quote behavior must be an HC lexical rule and apply to
all inputs.

### Support arbitrary-length exact-match fences

Deferred. Arbitrary fence lengths could solve the collision, but they would
change the established meaning of two adjacent top-level backticks and require a
more general delimiter representation. The short/long model is sufficient,
preserves the empty short string, and follows the familiar Python design.

### Parse AsciiDoc in the lexer

Rejected. HC only needs to recognize its own quote delimiters. It must not
decide whether an interior backtick run is valid AsciiDoc markup.

## Validation commands for a future implementation

The implementation should be checked with targeted tests before the complete
suite:

    deno test lib/frames/frame-doc.test.ts lib/execute/evaluate.test.ts
    deno test lib/execute/hc-eval.test.ts lib/execute/hc-test.test.ts
    deno test --allow-env --allow-read --allow-write cli/runfile.test.ts cli/hc.test.ts
    deno task hc cli/hc/white-paper.hc -t
    deno task test:lib
    deno task test:cli
    deno task test:doc

## Acceptance criteria

- A one-backtick `FrameDoc` retains its existing syntax and behavior.
- Two adjacent top-level backticks still represent an empty short `FrameDoc`.
- Three backticks open and close one long `FrameDoc`.
- One or two consecutive backticks inside a long `FrameDoc` are literal body
  content and do not change evaluation state.
- The delimiter level survives token construction and `toString()`
  round-tripping.
- Incremental input produces the same result as the same logical source supplied
  in one call.
- `runfile()` continues to wrap `.md` and `.adoc` files successfully.
- `white-paper.hc` uses AsciiDoc two-backtick inline code and backtick-free
  AsciiDoc blocks for non-executable examples.
- Every intended executable white-paper example is counted exactly once.
- The full white-paper doctest reaches EOF with no lexer/parser stack errors or
  prose-derived evaluation diagnostics.
- Its final summary appears once, records reviewed exact totals, and has zero
  failures.
- Existing maintained doctest and CLI tests remain green.

## Expected implementation scope

A future code change is expected to assess or modify:

- `lib/execute/lex.ts`;
- `lib/frames/frame-atom.ts` and `lib/frames/frame-doc.ts`;
- `lib/execute/syntax.ts` if Frame construction must carry delimiter level;
- `lib/execute/hc-eval.ts` for streaming and EOF state handling;
- `cli/runfile.ts` only if its call-boundary behavior must expose logical
  newlines or EOF explicitly;
- the corresponding tests identified above;
- `cli/hc/white-paper.hc`; and
- `cli/hc.test.ts` for the full-document baseline.

`ParsePipe`, aggregate terminals, evaluator semantics, and `HCTest` counting are
not expected to change unless focused tests expose an independent defect.
