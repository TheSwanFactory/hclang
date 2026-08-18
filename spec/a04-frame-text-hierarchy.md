# Text-Backed Frame Hierarchy

**Status:** Implemented in v0.10.0\
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

Juxtaposition concatenates character content, so the two families that advertise
that capability keep the application behavior they have today, sharing one
implementation. A comment and a resource identifier do not gain it: a comment is
void and an identifier is an inert name.

`FrameQuote` loses its last member and becomes a marker for "atom with explicit
delimiters", which is a real distinction from bare atoms like symbols and
numbers. It stays exported and stays the base of the text families, byte
strings, and notes. Retiring it would remove a published type for no behavioral
gain, so that is left alone.

A document publishes its body as a readable `body` property, computed on access
rather than stored as metadata. Storing it would put an entry in the document's
metadata, and the shared atom renderer switches to a braced form once metadata
is present, which would break fence round-tripping. Computing it on lookup keeps
rendering untouched and avoids holding the body twice. `FrameNumber` already
resolves digit properties this way.

What a document denotes is unchanged. It still evaluates to itself, still prints
its fences verbatim, and still suppresses prompt markers inside its body.
Reading `.body` is an additional way to reach the characters, not a new meaning
for the `` ` `` delimiter.

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

- [x] Add an abstract text base under `FrameQuote` in a new
      `lib/frames/frame-text.ts`, owning the string body and returning it as the
      atom's data.
- [x] Make the body immutable. No current text family reassigns it; confirm that
      before choosing the modifier.
- [x] Reparent `FrameString`, `FrameComment`, and `FrameURI` onto the new base
      and delete their duplicated body declarations and data accessors.
- [x] Reparent `FrameDoc` onto the new base rather than `FrameString`, keeping
      its fence length, its prefix, and its empty-even-fence suffix rule.
- [x] Preserve each subclass's remaining constructor work: the comment's void
      flag, the resource identifier's decomposition, and the document's fence
      length.
- [x] Leave `FrameBytes` under `FrameQuote`, and leave `FrameNote` unchanged.

### Coercion capability

- [x] Declare a narrow capability for "contributes raw characters to a string",
      with a type guard, beside the text base.
- [x] Implement it on `FrameString` and `FrameDoc` only.
- [x] Rewrite `FrameString`'s application path to use the guard instead of an
      `instanceof` check against a class.
- [x] Share one concatenation implementation between the two capable families,
      so a document keeps the application behavior it inherits today and still
      yields a string.
- [x] Confirm no import cycle results: the text base must not import either
      concrete family.

### Quote marker

- [x] Delete the instance nesting-depth wrapper from `FrameQuote`; the shared
      rule beside the descriptors is the single implementation.
- [x] Retarget its four assertions in the string and resource identifier tests
      to the shared rule.
- [x] Document `FrameQuote` as a marker for delimited atoms, and keep it
      exported.

### Document body property

- [x] Resolve a document's `body` property on lookup, returning its characters
      as a string.
- [x] Do not store the body as metadata, and do not override the document's
      rendering.
- [x] Leave every other property lookup on a document delegating to the base.

### Descriptors

- [x] Type the document's `SYNTAX` as run-only, dropping the spread of
      `FrameString.SYNTAX` and the unreachable source factory.
- [x] Remove the `override` modifiers on the document's static members that no
      longer override anything, including its Sigil starts, run metadata, and
      run factory.
- [x] Keep `FrameString.SYNTAX` typed as both facets, which stays honest because
      it registers an atom start and a run start itself.
- [x] Drop the previously proposed widen-to-facet workaround; reparenting
      removes the variance conflict that motivated it.
- [x] Confirm the registry's duplicate-name guard still catches a family that
      forgets its own descriptor.

### Exports and reach

- [x] Export the text base and the coercion capability from `lib/frames.ts`.
- [x] Verify nothing depended on the document inheriting string application or
      string reduction, both of which it loses.
- [x] Verify no remaining parameter or return type requires a document where a
      string is declared.
- [x] Decide whether to retire `IStringConstructor`, an exported type with no
      consumer in the repository. Retired, along with the unused `Flag` type and
      the superseded `lexer.ts` module.

### Regression tests

- [x] Cover all five rows of the application table above, including the document
      row that currently has no test.
- [x] Assert that a document is no longer an instance of a string, so the intent
      is locked rather than discovered later.
- [x] Assert that a comment and a resource identifier keep their delimiters when
      appended to a string.
- [x] Assert the type guard accepts strings and documents and rejects comments,
      resource identifiers, and byte strings.
- [x] Keep the existing document tests unchanged: fence lengths, empty even
      fences, interior backtick runs, and round-tripping.
- [x] Keep the existing resource identifier tests unchanged, including
      decomposition into its five components and its evaluation to itself.
- [x] Confirm comment voidness and comment round-tripping still hold.
- [x] Confirm the document lexical path is untouched end to end: run-length
      classification, chunk independence, and opaque bodies that suppress prompt
      markers.
- [x] Cover the document `body` property: it returns the characters without
      fences, it leaves rendering unchanged after being read, and an unrelated
      property lookup still reports a missing key.
- [x] Cover `body` on a fenced document whose text contains interior delimiter
      runs, confirming the property is the body rather than the spelling.
- [x] Confirm a document still evaluates to itself.
- [x] Confirm the retargeted nesting-depth assertions still distinguish
      asymmetric from symmetric delimiters.

### Documentation

- [x] Update the frame hierarchy and protocol notes in `lib/frames/CLAUDE.md`,
      including where storage lives and why coercion is a separate capability.
- [x] Note the byte and note exclusions so the next reader does not repeat the
      question.
- [x] Add CHANGELOG lines under the current unreleased version for the hierarchy
      change and for the document no longer being a string.
- [x] Record the outcome in this document's status line when it lands.
- [x] Add doctest coverage for `.body` in the maintained testdoc fixture, and
      update its authoritative totals.

### Verification

- [x] `deno task test` green, including doctests and BitScheme.
- [x] `deno task build` green.
- [x] `deno publish --dry-run` green from `lib/`, confirming no slow types from
      the new base or capability.
- [x] Push to the #298 branch and confirm PR checks stay green.

## Resolved decisions

Both questions previously deferred here are resolved above: the test-only
nesting wrapper is removed, and a document's body is reachable as a computed
`body` property. Neither changes what a delimiter denotes.

## Non-goals

- Changing HC syntax, token boundaries, parsing, or evaluation semantics.
- Changing what any delimiter denotes.
- Folding notes, symbols, blobs, or byte strings into the text base.
- Retiring `FrameQuote`, or making a document evaluate to anything but itself.
- Revisiting the recognizer boundary settled in
  [13-lexical-recognizer-separation.md](6-parsing-failures/13-lexical-recognizer-separation.md).
