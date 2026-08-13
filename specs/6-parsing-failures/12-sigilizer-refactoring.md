# Sigilizer Refactoring

**Status:** Implemented in v0.8.4\
**Refines:** [09-sigilizer-spec.md](./09-sigilizer-spec.md)

## Purpose

The first implementation regularized lexical special cases, but put two parts of
the new protocol in the wrong places:

- syntax registration is read from fabricated Frame instances; and
- lexical decisions are represented by a `LexicalScan` Frame and interpreted
  inside `Lex`.

This refactoring makes the phase boundary explicit without changing HC syntax.
It refines the implementation shape in specifications 09 and 10.

## Decisions

### Syntax starts are class metadata

Each registered syntax class exposes an immutable static `SIGIL_STARTS` value.
The syntax registry reads that value directly from the class. Registration MUST
NOT construct a sample runtime value.

`scan(Symbol)` and `finishInput()` remain instance behavior because they depend
on the active lexeme.

### A scan decision is not a Frame

Replace `LexicalScan extends Frame` with a plain `ScanResult` record containing
a `ScanDisposition` enum and optional payloads:

- consume the Symbol;
- complete, either consuming or redispatching the Symbol, with an optional
  completed value;
- transition to another lexical receiver; or
- fail with a message.

An error produced from that result may become an error Frame at the pipeline
boundary. The decision itself MUST NOT impersonate a language value or active
lexical receiver.

The protocol MUST NOT introduce a factory namespace or helper language for
constructing results. Syntax participants return ordinary object literals such
as `{ disposition: ScanDisposition.Consume }`.

### The scan protocol is neutral

`ScanDisposition`, `ScanResult`, `ScanResponse`, and `SigilStart` live in a
neutral lexical protocol module. Frame classes and Sigilizer both depend on that
module; neither obtains the protocol through the other.

The protocol's reference to `Frame` is type-only. It MUST NOT introduce a
runtime dependency from the neutral module back into the Frame hierarchy.

### Sigilizer routes decisions

The flow for every source Symbol is:

1. Sigilizer invokes `receiver.scan(Symbol)`.
2. A returned Frame becomes the next receiver directly.
3. A returned `ScanResult` is interpreted by Sigilizer.
4. Sigilizer asks the active lexical host to consume, complete, or transition.
5. For redispatch, Sigilizer submits the same Symbol to the resulting receiver
   exactly once.

`Lex` owns mutable token-building state and exposes the primitive host
operations needed by this routing. It MUST NOT contain the disposition switch.
Syntax-specific Frames still decide which disposition applies.

EOF uses the same routing path after `finishInput()`; it is not a second result
protocol.

## Non-goals

- No syntax, comparison, ternary, or phone-number semantics change.
- Sigilizer retains no input-dependent state.
- The refactoring does not yet redesign the runtime-value constructor used by
  generic `Lex`; that concern is independent of class-level registration.

## Acceptance

- No `LexicalScan` Frame class remains.
- No `Scan` factory namespace or frozen constructor table remains.
- Frame classes do not import scan protocol types or values from Sigilizer.
- Sigil starts are obtained from static class values without sample instances.
- Sigilizer contains the sole scan-disposition routing switch.
- Redispatch and EOF pass through Sigilizer.
- `Lex` retains token state but contains no syntax-family or disposition branch.
- Existing lexical, parser, evaluator, doctest, and white-paper results remain
  green.
