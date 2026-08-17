# Unified Quote Delimiters

**Status:** Implemented\
**Issue:**
[#316 — Unify quote delimiters: nesting, resource URIs, ASCII alias, GFM prose](https://github.com/TheSwanFactory/hclang/issues/316)\
**Related:** #277 resource frames, #301 module imports, #284, #282, #197\
**Revises:** [5-inline-code-spans.md](5-inline-code-spans.md)

## Summary

HC now claims every ASCII quote character, on the principle that a delimiter
earns its keep only when it changes what the delimited text **denotes**.

| Denotation       | Delimiter | Value is                                    |
| ---------------- | --------- | ------------------------------------------- |
| itself           | `“ ”`     | the characters                              |
| itself           | `" "`     | the characters, in ASCII input spelling     |
| something absent | `'…'`     | a name for a thing not in the program       |
| foreign content  | `` ` ``   | verbatim, line-structured, fence-preserving |

Four independently testable parts follow. The usual raw-versus-interpolating
justification for a second string type does not apply to HC: adjacent strings
join by juxtaposition, so `“a” x “b”` already is the interpolation feature.

## 1. Curly quotes nest

`FrameQuote` tracks nesting depth from the text it has already consumed. An
interior prefix increments depth and is literal content, an interior suffix
decrements it while depth is positive, and only a suffix at depth zero completes
the atom.

- `“a “b” c”` is one string whose data contains balanced interior quotes.
- `toString()` round-trips that data.
- An unmatched interior open does not truncate the string; the value stays
  pending and `finishInput()` reports `unterminated FrameString`.
- An unmatched interior close cannot truncate one either. A `”` at depth zero
  completes its string by definition, so the mistake is only detectable at the
  next one: `FrameStringEnd` claims `”` outside a string and reports
  `unmatched string terminator`, which turns `“a ” b”` into a lexical error
  instead of a value that silently loses its tail.
- Depth is computed from the accumulated source rather than stored, so it is
  chunk-independent and cannot leak between lexemes or evaluators.

`“a ” 2` remains one string applied to `2`, because that is also the spelling of
legitimate string application. Only a later unmatched terminator distinguishes
the two, which is why detection lives there.

Symmetric delimiters cannot nest, so the rule is expressed once for the whole
quote family and returns depth zero for `#…#` and `'…'`.

## 2. `'…'` names a resource

`'…'` lexes to `FrameURI`: an inert URI reference decomposed into `scheme`,
`authority`, `path`, `query`, and `fragment` properties.

The hard constraint comes from
[07-dtrb-solved-in-theory.md](4-ai-security/07-dtrb-solved-in-theory.md): source
text can name a resource but cannot authorize it. If `'…'` evaluated to anything
authority-bearing, the lexer would become an authority-granting construct and
DTRB would collapse at the character level. So a resource identifier:

- performs no network, filesystem, or registry access at lex or eval time;
- evaluates to itself rather than to a lookup;
- is comparable, printable, and round-trippable; and
- resolves only when applied to, or by, a constructed resource Frame reachable
  in the invocation context, which is what makes the same source text yield
  different results under different ambient authority.

Content must be URI-shaped. Whitespace ends an identifier with
`unterminated resource identifier`, the characters RFC 3986 excludes end it with
`invalid resource identifier`, and `''` is rejected outright. This turns an
English apostrophe into a fast lexical error instead of a swallowed remainder.

Beyond ergonomics, every external identity is now lexically marked and
greppable, and #301 gains a specifier type:
`.hclang <- 'jsr:@swanfactory/hclang'` unifies import specifiers with URIs
instead of inventing a second notation.

## 3. `"` is an alias, not a type

`"` is the ASCII input spelling of `“ ”`. It introduces no new type and no new
semantics: `"…"` completes an ordinary `FrameString`, and output is always
canonical curly quotes, so the alias is erased by round-tripping.

Run length selects **nesting depth**, using the same odd/even parity rule as
document fences:

- an odd run opens with that entire run as its delimiter;
- an even run is the empty string;
- an equal run closes;
- a shorter interior run is literal content; and
- a longer interior run is a lexical error.

`""` is the empty string and `"""…"""` permits interior `"` and `""` as content.
Inside `"` strings, `“` and `”` are ordinary content; inside `“ ”` strings, `"`
is ordinary content. `"""` must not open a document.

Because the rule is shared, `LexRun` replaces the document-specific `LexDoc`:
`FrameDoc` and `FrameString` each register a run-delimited Sigil start and
supply `RUN_DELIMITER`, `RUN_LABEL`, `RUN_OPAQUE`, and `fromRun()`. The lexical
mode is therefore named `run` rather than `document`.

Alias equivalence extends to line structure. A pending lexeme of any family owns
the line structure of its own body, so a blank logical line reaches it and a
multi-line `"""…"""` string produces the same value as the same body in `“ ”`.
`RUN_OPAQUE` marks the one genuine difference: document bodies are foreign
prose, so HC reads no doctest markers inside them, while string bodies are HC
data in two spellings and follow the ordinary line rules.

The redundancy is deliberate and confined to the surface. Backticks and curly
quotes are a genuine problem to type on mobile keyboards, and a canonicalizing
input dialect costs nothing semantically — the same trick `cli/runfile.ts`
already uses when it injects synthetic fences for prose files.

## 4. Document content is GFM

Prose inside a backtick fence is [GFM](https://github.github.com/gfm/); AsciiDoc
conventions are dropped. This is a documentation-format decision, not a lexical
one: a fence toggles _out_ of HC into prose, where GFM's own containment rules
apply to the prose, not to HC's fence.

- `cli/hc/white-paper.hc` prose is GFM. Its former `[source,hc]` and `----`
  listing blocks are GFM fenced blocks, and the two prose regions that contain
  them are opened by five-backtick HC fences so interior three- and
  four-backtick GFM fences remain content.
- `spec/5-inline-code-spans.md` documents GFM conventions in place of AsciiDoc
  listing blocks and source attributes.
- `cli/runfile.ts` keeps synthetic wrapping for `.md`; `.adoc` remains only as a
  compatibility shim.
- Converting the `.adoc` files under `doc/`, and the AsciiDoc prose in
  `cli/hc/BitScheme.hc`, is tracked separately in #319.

The white paper retains its Madoko constructs (`[TITLE]`, `~ Abstract`,
`[@Cite]` citations, header attributes). Madoko is a Markdown dialect, so those
are prose conventions rather than AsciiDoc holdovers, and removing them would
break the paper's own build.

## Resolved open questions

1. **Apostrophe collision.** `'` is claimed, with URI-shape validation as the
   mitigation. A `$“…”` note form was rejected: it hides the external surface
   behind a general note type and gives up the greppability that motivates
   lexical marking. The residual cost is that prose apostrophes are only safe
   inside strings, comments, and documents — which is where prose belongs.
2. **Nesting for `'`.** A resource identifier is always single-delimiter. URIs
   do not nest, its delimiters are symmetric, and the parity rule would make
   `''` ambiguous between an empty identifier and a depth marker.
3. **Comment nesting.** `#…#` remains non-nesting by decision, not by accident.
   Its delimiters are symmetric, so there is no way to tell an opening from a
   closing one, and `#` also serves as an end-of-line comment.

## Known limitation

Unbalanced interior curly quotes do not round-trip: `"a”b"` prints as `“a”b”`,
and re-lexing that output is a lexical error rather than a silently shorter
string. Balanced interior quotes, which are what nesting is for, round-trip
exactly. Fixing the unbalanced case would require either an escape character or
output rewriting, both of which the language rejects, so the failure is at least
loud.

## Acceptance criteria

- `“a “b” c”` is one string whose data contains balanced interior quotes and
  which round-trips through `toString()`.
- An unmatched `”` is a lexical error, not a truncated string.
- `"…"` produces a `FrameString` that prints with curly quotes.
- `""` is the empty string; `"""` nests.
- `'…'` produces an inert URI value that touches no external system at lex or
  eval time.
- Non-URI-shaped `'…'` content is a lexical error, not a swallowed remainder.
- Backtick parity behavior is unchanged.
- Chunk-independence, EOF detection, evaluator reuse, and evaluator isolation
  hold for every delimiter family.
- The full `cli/hc/white-paper.hc` doctest reaches EOF with one summary and zero
  failures.
- Existing library, CLI, doc, and web suites remain green.

## Validation commands

    deno test lib/frames/frame-uri.test.ts lib/frames/frame-string.test.ts
    deno test lib/execute/lex.test.ts lib/execute/hc-eval.test.ts
    deno task test:doc
    deno task test:bs
    deno task hc cli/hc/white-paper.hc -t
    deno task test
