# Text-Backed Frame Hierarchy

**Status:** Specified for v0.10.0\
**Issue:** follow-on to
[#298 — Separate lexical recognizers from runtime Frame construction](https://github.com/TheSwanFactory/hclang/issues/298),
delivered on [PR #322](https://github.com/TheSwanFactory/hclang/pull/322)\
**Refines:** [a03-unified-quote-delimiters.md](a03-unified-quote-delimiters.md),
[6-parsing-failures/13-lexical-recognizer-separation.md](6-parsing-failures/13-lexical-recognizer-separation.md)

## Summary

Four quoted families store a string body and render it through their own
delimiters: `FrameString`, `FrameDoc`, `FrameComment`, and `FrameURI`. Each
declares that storage separately, and `FrameDoc` obtains it by extending
`FrameString`.

That inheritance is code reuse, not an is-a. The delimiter table in a03 says a
delimiter earns its keep by changing what the text denotes, and `` ` `` denotes
foreign content while `“ ”` denotes characters. The subclass relationship also
forces `FrameDoc` to satisfy `FrameString`'s static side, which is why its
`SYNTAX` descriptor currently spreads `FrameString.SYNTAX` and carries an
unreachable `fromSource`.

Introduce an abstract `FrameText` under `FrameQuote` that owns the string body,
and make all four families siblings. Keep string coercion separate from storage:
appending to a string must still take the raw body of a string or document, and
the rendered spelling of a comment or resource identifier.

## Decisions

Storage moves up; coercion does not. `FrameText` owns the body and its data
accessor. Contributing raw characters to a larger string is a capability that
only `FrameString` and `FrameDoc` advertise, so `FrameString`'s application path
tests for that capability rather than for a position in the hierarchy. Testing
`instanceof FrameText` there would silently strip comment and URI delimiters.

`FrameBytes` stays directly under `FrameQuote`. Its body is a byte array whose
printable form is derived, not stored text.

`FrameNote` stays where it is. It holds a string, but that string is a label key
resolved through `LABELS`, and the class renders itself through `toString()`
rather than the `toStringData()` path the text families share. Folding it in
would mean changing what a note denotes, which is out of scope here.

`FrameDoc` stops being assignable to `FrameString` for library consumers. No
caller in this repository depends on that relationship, and the version is
already carrying a breaking change for this release.

## Behavior to preserve

`FrameString` application must keep appending exactly this text:

| Appended argument | Contributed text  |
| ----------------- | ----------------- |
| `FrameString`     | raw body          |
| `FrameDoc`        | raw body          |
| `FrameComment`    | rendered `#body#` |
| `FrameURI`        | rendered `'uri'`  |
| any other atom    | rendered spelling |

The `FrameDoc` row is the one at risk: it holds today only because `FrameDoc`
inherits `FrameString`, and it is currently untested.

## Checklist

### Hierarchy

- [ ] Add an abstract text base under `FrameQuote` in a new
      `lib/frames/frame-text.ts`, owning the string body and returning it as the
      atom's data.
- [ ] Make the body immutable. No current text family reassigns it; confirm that
      before choosing the modifier.
- [ ] Reparent `FrameString`, `FrameComment`, and `FrameURI` onto the new base
      and delete their duplicated body declarations and data accessors.
- [ ] Reparent `FrameDoc` onto the new base rather than `FrameString`, keeping
      its fence length, its prefix, and its empty-even-fence suffix rule.
- [ ] Preserve each subclass's remaining constructor work: the comment's void
      flag, the resource identifier's decomposition, and the document's fence
      length.
- [ ] Leave `FrameBytes` under `FrameQuote`, and leave `FrameNote` unchanged.

### Coercion capability

- [ ] Declare a narrow capability for "contributes raw characters to a string",
      with a type guard, beside the text base.
- [ ] Implement it on `FrameString` and `FrameDoc` only.
- [ ] Rewrite `FrameString`'s application path to use the guard instead of an
      `instanceof` check against a class.
- [ ] Confirm no import cycle results: the text base must not import either
      concrete family.

### Descriptors

- [ ] Type the document's `SYNTAX` as run-only, dropping the spread of
      `FrameString.SYNTAX` and the unreachable source factory.
- [ ] Remove the `override` modifiers on the document's static members that no
      longer override anything, including its Sigil starts, run metadata, and
      run factory.
- [ ] Keep `FrameString.SYNTAX` typed as both facets, which stays honest because
      it registers an atom start and a run start itself.
- [ ] Drop the previously proposed widen-to-facet workaround; reparenting
      removes the variance conflict that motivated it.
- [ ] Confirm the registry's duplicate-name guard still catches a family that
      forgets its own descriptor.

### Exports and reach

- [ ] Export the text base and the coercion capability from `lib/frames.ts`.
- [ ] Verify nothing depended on the document inheriting string application or
      string reduction, both of which it loses.
- [ ] Verify no remaining parameter or return type requires a document where a
      string is declared.
- [ ] Decide whether to retire `IStringConstructor`, an exported type with no
      consumer in the repository.

### Regression tests

- [ ] Cover all five rows of the application table above, including the document
      row that currently has no test.
- [ ] Assert that a document is no longer an instance of a string, so the intent
      is locked rather than discovered later.
- [ ] Assert that a comment and a resource identifier keep their delimiters when
      appended to a string.
- [ ] Assert the type guard accepts strings and documents and rejects comments,
      resource identifiers, and byte strings.
- [ ] Keep the existing document tests unchanged: fence lengths, empty even
      fences, interior backtick runs, and round-tripping.
- [ ] Keep the existing resource identifier tests unchanged, including
      decomposition into its five components and its evaluation to itself.
- [ ] Confirm comment voidness and comment round-tripping still hold.
- [ ] Confirm the document lexical path is untouched end to end: run-length
      classification, chunk independence, and opaque bodies that suppress prompt
      markers.

### Documentation

- [ ] Update the frame hierarchy and protocol notes in `lib/frames/CLAUDE.md`,
      including where storage lives and why coercion is a separate capability.
- [ ] Note the byte and note exclusions so the next reader does not repeat the
      question.
- [ ] Add CHANGELOG lines under the current unreleased version for the hierarchy
      change and for the document no longer being a string.
- [ ] Record the outcome in this document's status line when it lands.

### Verification

- [ ] `deno task test` green, including doctests and BitScheme.
- [ ] `deno task build` green.
- [ ] `deno publish --dry-run` green from `lib/`, confirming no slow types from
      the new base or capability.
- [ ] Push to the #298 branch and confirm PR checks stay green.

## Deferred decisions

- [ ] `FrameQuote.nestingDepth` is now a test-only wrapper around the shared
      nesting rule, the same defect class as the removed `canInclude`. Decide
      whether to delete it and point its two test files at the shared rule.
- [ ] Whether a document's body should be reachable as ordinary character data
      through evaluation, rather than only through string application.

## Non-goals

- Changing HC syntax, token boundaries, parsing, or evaluation semantics.
- Changing what any delimiter denotes.
- Folding notes, symbols, blobs, or byte strings into the text base.
- Revisiting the recognizer boundary settled in
  [13-lexical-recognizer-separation.md](6-parsing-failures/13-lexical-recognizer-separation.md).
