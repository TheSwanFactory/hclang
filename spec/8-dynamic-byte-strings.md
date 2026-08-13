# Dynamic Byte Strings

**Status:** Implemented for ordinary identifiers in v0.9.1\
**Issue:**
[#311 — Implement the BitScheme framebuffer parsing and symbolic-output example](https://github.com/TheSwanFactory/hclang/issues/311)\
**Related:** #310

## Summary

HC byte strings use a length prefix followed by exactly that many payload
characters. In addition to a decimal literal, the length may be an ordinary
identifier that resolves to an already evaluated non-negative integer:

```hc
; .v 4;
; .h 2;
; .size (v * h);
; \size\01234567
# \8\01234567
```

The symbolic form is dynamic only while source is recognized. Its resulting byte
value is identical to the equivalent literal form and renders with the resolved
numeric length.

This feature supplies the dynamic-length primitive needed by the framebuffer
example in #311. It does not implement the example's schema deconstruction,
capture propagation, command parsing, or reverse symbolic mapping.

## Problem

Byte-string lengths were limited to decimal source text. A layout whose payload
size depends on earlier fields therefore had to duplicate a computed value or
leave byte-string syntax. The framebuffer example needs a payload length derived
from dimensions parsed or computed earlier.

Dynamic lengths must retain the properties of literal byte strings:

- consume exactly the declared payload;
- return following source to ordinary recognition;
- behave identically across transport chunk boundaries;
- fail clearly when the length or payload is invalid; and
- leave an evaluator reusable after failure.

## Goals

1. Accept one ordinary identifier in the byte-length position.
2. Resolve that identifier from the live scope visible before the byte string.
3. Require a finite, safe, non-negative integer.
4. Consume exactly the resolved number of payload characters.
5. Produce the same value and canonical rendering as a literal-length byte
   string.
6. Preserve literal byte-string syntax and behavior.
7. Preserve streaming equivalence and evaluator isolation.
8. Distinguish missing names, invalid values, unterminated lengths, and short
   payloads.

## Non-goals

- Arbitrary expressions in the byte-length position.
- Dotted, alias, protected, or private length references.
- Forward references or declarations that have not evaluated.
- Changing how payload characters are counted.
- Defining new resource limits for byte-string allocation.
- Completing the framebuffer or general schema/capture features tracked by #310
  and #311.

## Syntax

A byte string begins with a backslash, contains a length specifier, then a
separating backslash and the payload.

The length specifier is either:

- one or more decimal digits; or
- an ordinary identifier beginning with an alphabetic character and continuing
  with letters, digits, underscores, or hyphens.

The payload contains exactly the number of characters named by the resolved
length. No trailing delimiter is required.

## Normative Semantics

### Literal lengths

The existing decimal form remains unchanged. `\3\abc` consumes three payload
characters and produces `\3\abc`.

### Symbolic lengths

When the separating backslash after an identifier is reached, the identifier
MUST resolve from the live scope available to the evaluator before the dynamic
byte string began.

The resolved value MUST be a finite, safe, non-negative integer. Boolean,
string, collection, fractional, negative, infinite, and unsafe integer values
are invalid byte lengths.

If `size` resolves to `3`, `\size\abc` MUST produce the same byte value as
`\3\abc`.

### Evaluation timing

The referenced binding MUST already have evaluated. A declaration completed by
an earlier statement or logical line is available. A declaration earlier in the
same unevaluated expression is not a forward reference and need not be visible.

This timing is required because the payload boundary cannot be known until the
length resolves.

### Canonical representation

A dynamic byte string MUST render with its resolved numeric length. Source
spelling is not retained as part of the byte value.

Thus `\size\abc`, with `size` equal to `3`, renders as `\3\abc`.

### Payload boundary

Recognition MUST consume exactly the resolved number of payload characters. The
next source character MUST be processed normally.

A resolved length of zero produces an empty byte string. The first character
after the separating backslash is not payload and MUST be returned to ordinary
recognition.

### Streaming equivalence

Results MUST depend on the logical character stream, not transport chunks or
evaluator call boundaries. Every chunking of the same valid dynamic byte string
MUST produce the same byte value.

Length identifiers and payloads may span chunks. An evaluator that fails while
recognizing a dynamic byte string MUST be reusable without stale length or
payload state. Independent evaluators MUST NOT share mutable recognition state.

## Diagnostics

The following failure categories MUST remain distinguishable:

| Condition                                                    | Required category                        |
| ------------------------------------------------------------ | ---------------------------------------- |
| Identifier is absent from the live scope                     | missing byte length                      |
| Identifier resolves to a nonnumeric or invalid numeric value | invalid byte length value                |
| End of input arrives before the separating backslash         | unterminated byte length                 |
| End of input arrives before the resolved payload count       | byte payload shorter than resolved count |

Diagnostic text MUST identify the relevant identifier or resolved count.

## Required Examples

### Computed length

```hc
; .v 4;
; .h 2;
; .size (v * h);
; \size\01234567
# \8\01234567
```

### Following source remains separate

```hc
; .size 3;
; \size\abc,7
# (\3\abc, 7)
```

### Zero length

With `size` bound to zero, `\size\` produces `\0\` and consumes no following
payload characters.

## Acceptance Criteria

1. Existing literal byte-string tests remain unchanged and passing.
2. Named integer lengths are value-equivalent to literal lengths.
3. Every two-chunk split of a representative dynamic byte string produces the
   unsplit result.
4. Tests cover zero, missing names, invalid types, invalid numeric values,
   unterminated lengths, short payloads, following-source boundaries, and
   evaluator recovery.
5. The executable BitScheme tutorial includes a passing computed-length example.
6. The complete project validation suite passes without new ignored or
   unimplemented cases attributable to dynamic byte strings.
