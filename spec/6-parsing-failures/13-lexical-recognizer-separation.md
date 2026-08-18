# Lexical Recognizer Separation

**Status:** Implemented in v0.10.0\
**Issue:**
[#298 — Separate lexical recognizers from runtime Frame construction](https://github.com/TheSwanFactory/hclang/issues/298)\
**Refines:** [12-sigilizer-refactoring.md](./12-sigilizer-refactoring.md)\
**Preserves:** #220, #314

## Summary

Generic `Lex` currently treats a runtime Frame constructor as a
lexical-recognizer factory. It constructs `new Factory("")` to obtain something
that can answer `scan()`, `finishInput()`, and `className()`, then calls the
same constructor a second time with completed source to produce the real value.

This specification separates the two roles. Recognition becomes a class-side
syntax facet; construction becomes an explicit value factory. `Lex` holds a
descriptor and, only after a transition, an active receiver Frame. It never
fabricates a value in order to ask a question about syntax.

The change is an implementation boundary. HC syntax, token boundaries, parsing,
and evaluation semantics are unchanged.

## Problem Statement

1. **Recognition is obtained by construction.**
   `AtomFactory = new (body: string) => FrameAtom` forces every registered
   family to be constructible from a placeholder string.
2. **A runtime constructor absorbs a lexical domain.** `FrameBytes` denotes
   bytes, but its constructor accepts `number[] | string` and silently maps the
   string branch to an empty byte value. That branch has exactly one caller,
   `new Factory("")` in `Lex`, and exists only for lexical compatibility.
3. **Recognizer identity comes from a fabricated value.** `Lex` reads
   `className()` off the placeholder to name itself in diagnostics.
4. **Reset means reconstruct.** After completing a value, `Lex` restores
   recognition by constructing another placeholder.
5. **One method name serves two protocols.** `Frame.scan()` is both lexical
   recognition and runtime double dispatch. `FrameNote.scan()` demonstrates the
   collision: it branches on `source === undefined` to decide which protocol the
   caller meant.

## The observation that shapes the design

Every ordinary atom recognizer in the codebase is already stateless.

`FrameAlias`, `FrameArg`, `FrameBlob`, `FrameBytes`, `FrameComment`,
`FrameName`, `FrameNumber`, `FrameOperator`, `FrameString`, `FrameStringEnd`,
`FrameSymbol`, and `FrameURI` read only `(symbol, source, context)` and class
constants such as `BLOB_DIGITS`, `NOTE_END`, and `SYMBOL_CHAR`. The lexeme
buffer already lives in `Lex`, which is why these rules receive `source` as a
parameter.

Recognition is therefore a property of the syntax family, not of any value. It
was an instance method only because `Lex` needed an object to call it on, and a
value instance was the nearest one available.

`FrameParam` originally remained an exception: the first caret transitioned to
`FrameParam.level()`, and that runtime value recognized the rest. But the source
buffer already carries the complete caret run, so `FrameArg.SYNTAX` recognizes
it class-side and constructs `FrameParam` only in its completion result. The
only stateful receiver left is `FrameBytePayload(count)`, whose count is genuine
lexical configuration rather than a runtime byte value.

## Decision

### Registration exposes a class-side syntax facet

Two neutral interfaces live beside the existing protocol in `lib/scan.ts`, whose
reference to `Frame` remains type-only:

```ts
export interface SyntaxFacet {
  readonly NAME: string;
  readonly SIGIL_STARTS: readonly SigilStart[];
}

export interface AtomSyntax extends SyntaxFacet {
  recognize(symbol: Frame, source: string, context: Frame): ScanResult;
  finish(source: string): ScanResult;
  readonly fromSource?: (source: string) => Frame;
}

export interface RunSyntax extends SyntaxFacet {
  readonly RUN_DELIMITER: string;
  readonly RUN_LABEL: string;
  readonly RUN_OPAQUE: boolean;
  fromRun(body: string, runLength: number): Frame;
}
```

Each registered class publishes an immutable `static readonly SYNTAX`. A family
implements the facet its `SIGIL_STARTS` modes require: `FrameDoc` is run-only,
most families are atom-only, and `FrameString` publishes both because it
registers `“` as an atom and `"` as a run.

`syntax.ts` registers descriptors rather than classes and validates the required
facet per mode, replacing the current `asRunFactory` duck-type probe.

### A stateless recognizer needs no factory and no reset

`Lex` stores its descriptor and an optional active receiver:

- recognition delegates to `active` when present, otherwise to
  `syntax.recognize()`;
- `transitionScan(next)` installs `active`;
- completing a token clears `active` to `null`; and
- the diagnostic name comes from `syntax.NAME`.

Reset is the absence of a receiver. The descriptor therefore does not carry a
lexical-receiver factory: there is nothing to construct, so no construction path
replaces `new Factory("")`.

This refines the #298 acceptance criterion "recognizer reset uses the
descriptor's lexical-receiver factory" to "recognizer reset discards the active
receiver without constructing a value," which satisfies the criterion's intent
more directly.

### Value construction is explicit

Completed source becomes a value only through an optional
`syntax.fromSource(source)`, `syntax.fromRun(body, runLength)`, or a `frame:`
payload supplied by a scan result. Generic `Lex` performs no other construction.

A family whose every successful completion supplies a value omits `fromSource`.
`FrameBytes`, `FrameStringEnd`, and `FrameArg` therefore carry no throwing or
unreachable factory. If a factoryless family violates its contract by completing
without a value, `Lex` returns a lexical protocol error rather than throwing or
fabricating a runtime value.

### Byte recognition leaves the byte value

`FrameBytes` takes `number[]` only. Byte-length recognition moves to
`FrameBytes.SYNTAX.recognize`, which still receives the live evaluation context,
so the symbolic byte lengths from #220 and #314 keep resolving through it. It
still completes an empty payload as `new FrameBytes([])` and still transitions
to `FrameBytePayload`, which still constructs `FrameBytes(number[])`.

### The two `scan` protocols separate

Removing the lexical override from families that only served `Lex` leaves
`Frame.scan()` as runtime double dispatch. `FrameNote` no longer needs its
`source === undefined` branch, because the base `Frame.scan()` already performs
the `call()` it selected.

## Goals

1. Replace the constructor-shaped `AtomFactory` with explicit descriptors.
2. Remove every `new Factory("")` and the fabricated `sample` from `Lex`.
3. Take recognizer identity from registration metadata.
4. Keep recognition in atom-owned behavior and routing in Sigilizer.
5. Keep `SIGIL_STARTS` immutable class-level metadata.
6. Restore a domain-correct `FrameBytes(number[])` constructor.
7. Preserve literal, symbolic, zero-length, chunked, and premature-EOF byte
   behavior, including live-context lookup.
8. Add no new receiver class, and keep `LexRun` free of a sample value.

## Non-goals

- Changing HC syntax, token boundaries, parsing, or evaluation semantics.
- Changing the neutral `ScanResult` / `ScanDisposition` protocol.
- Moving syntax-family decisions into generic `Lex` or Sigilizer.
- Redesigning schema matching or reusing `FrameMatcher` as a lexical protocol.
- Requiring one receiver class per family.

## Risks

**Static inheritance is silent.** `FrameArg extends FrameSymbol`, and TypeScript
will not demand a `SYNTAX` override. Registering descriptors explicitly turns an
inherited descriptor into a duplicate `NAME`, which registration rejects
alongside the existing conflicting-Sigil check.

**Behavior must move unchanged.** Each recognizer moves verbatim, with
`this.canInclude(c)` becoming the family predicate and `this.string_suffix()`
becoming the class constant. Existing recognition tests are retargeted from a
value instance to the descriptor without changing their assertions.

**Vestigial predicates must not survive the move.** `canInclude()` existed to
serve `FrameAtom.scan()`. Once recognition moves class-side it has no caller,
and leaving it behind would create two unlinked definitions of which characters
a family accepts. It is removed with its overrides, so each family states that
rule once, in its recognizer. `FrameComment` keeps `COMMENT_END_REGEX` as that
single statement and its recognizer branches on the terminator the regex
matched.

## Acceptance

- No `AtomFactory` type and no `new Factory("")` remain.
- `Lex` holds no `sample` and constructs no value for recognition.
- `Lex` names itself from `SYNTAX.NAME`.
- Runtime Frames arrive only from explicit value factories or completed scan
  results; `FrameParam` is never a lexical receiver.
- A result-completed family may omit `fromSource`, and no registered source
  factory deliberately throws.
- `FrameBytes` accepts bytes only, and no test constructs `new FrameBytes("")`.
- No `canInclude()` remains, and each family's accepted characters are stated
  once.
- Every shared recognizer helper has more than one caller.
- Symbolic byte lengths still resolve against the live context.
- Generic `Lex`, `LexRun`, and Sigilizer contain no atom-family check.
- Registration rejects a duplicate descriptor name and a missing facet.
- Existing lexical, parser, evaluator, doctest, BitScheme, and white-paper
  results remain green.
