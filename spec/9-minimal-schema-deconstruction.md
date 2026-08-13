# Minimal Schema Retrieval and Deconstruction

**Status:** Proposed\
**Issue:**
[#310 — Implement BitScheme schema retrieval, deconstructors, and bit captures](https://github.com/TheSwanFactory/hclang/issues/310)\
**Related:** #311, #312

## Summary

This specification defines the smallest coherent extension to HC schemas that
supports:

1. retrieving the schema attached to a binding;
2. selecting named properties from a compound value;
3. validating and consuming an exact number of bits;
4. consuming the remaining bits at the end of a sequence; and
5. returning named captures from one ordered bit sequence.

The design deliberately implements less than the full schema language imagined
by the original BitScheme tutorial. It does not add general parser alternatives,
backtracking, reverse constructors, deferred capture lengths, user-defined
capture units, or writes into outer scopes.

The goal is deterministic behavior that fits the current language, makes the
first five #310 assertions executable, and creates a stable base for later work.

## Problem Statement

1. **Schemas cannot be observed**: A binding may enforce a numeric schema, but
   evaluating `name.<>` does not return the schema belonging to that binding.
2. **Schemas are not callable patterns**: Applying a schema to a value currently
   aggregates the value into the schema instead of selecting or consuming data.
3. **Bit layouts cannot be decomposed**: There is no supported operation for
   consuming a fixed prefix and returning named bit captures.
4. **The aspirational language is too broad**: Alternatives, repetition,
   deferred lengths, cross-scope mutation, and construction introduce ambiguity
   and transactionality that are unnecessary for the first useful increment.

## Goals

1. Preserve existing numeric enumeration validation.
2. Make a binding's schema retrievable through the documented `<>` property.
3. Make property-selector schemas deterministic and non-mutating.
4. Support exact fixed-width bit captures.
5. Support one terminal remainder capture.
6. Support ordered sequences of named bit captures.
7. Preserve leading zeroes and bit widths in captured values.
8. Return errors without partially mutating schemas, inputs, or surrounding
   scopes.
9. Keep all matching linear and free of backtracking.

## Non-goals

- General schema alternatives such as command or instruction unions.
- Repetition except for a terminal remainder capture.
- Backtracking, lookahead, or ambiguity detection.
- Reverse construction of a bitstream from captures.
- Deferred lengths such as `<n@Byte>`.
- User-defined units such as `.Byte <8@Bit>`.
- Cross-scope capture forms such as `@width`.
- Arbitrary expressions inside bit counts.
- Nested property paths or optional property selection.
- Extending enumeration validation to every Frame type.
- Completing the framebuffer or RISC-V examples.

## Terminology

### Binding schema

A **binding schema** is a schema associated with a named binding rather than
with the bound value itself. Two bindings may contain equal values and have
different schemas.

### Schema definition

A **schema definition** is a name whose value is itself a schema. A schema-only
declaration ends after the schema and makes that schema callable by name.

### Property selector

A **property selector** is a schema containing only direct property names. It
returns those properties from another Frame in schema order.

### Bit cursor

A **bit cursor** is a read-only position in one input blob. Captures consume
bits from the most-significant end toward the least-significant end.

### Fixed capture

A **fixed capture** consumes an exact literal number of bits.

### Remainder capture

A **remainder capture** consumes every bit left in the current bit cursor. It is
valid only as the final element of an ordered sequence.

## Core Design Decisions

### 1. Schemas belong to bindings

A schema attached during a declaration MUST remain associated with that binding.
It MUST NOT be copied onto the bound value.

This preserves the following properties:

- equal values may have different schemas under different names;
- reassignment retains the schema of the target binding;
- aliases that update a binding continue to enforce its schema; and
- retrieving a schema does not depend on mutable metadata on a shared value.

### 2. Schemas are immutable

Calling, validating with, or retrieving a schema MUST NOT add elements to it or
otherwise change it. Reusing one schema against multiple inputs MUST yield
independent results.

### 3. Schema forms are deliberately closed

This increment recognizes only these schema forms:

| Form               | Meaning                                 |
| ------------------ | --------------------------------------- |
| `<number, ...>`    | Existing numeric enumeration constraint |
| `<.name, ...>`     | Direct property selector                |
| `<N@Bit>`          | Exact fixed-width bit capture           |
| `<[@Bit]>`         | Entire remaining bit sequence           |
| `<[capture; ...]>` | Ordered bit-capture sequence            |

Mixed forms are invalid. Commas do not introduce general parser alternatives.

### 4. Matching never backtracks

An ordered sequence processes each capture exactly once from left to right. A
failed capture ends the match. No capture result or cursor position is retried.

The remainder capture MUST be last, so its boundary is always unambiguous.

### 5. Captures are local results

Named captures use local property names and are returned on the deconstruction
result. They do not assign to bindings in the caller or any ancestor.

This removes the need for speculative writes, rollback, visibility checks, and
cross-scope mutation authority in the minimal implementation.

## Normative Behavior

### Existing schema-constrained assignment

Existing numeric enumeration declarations continue to validate assignments.

```hc
; .enum123 <1,2,3> 2
# .enum123 2
; @enum123 4
# $!.type-error .enum123 <1, 2, 3> 4
```

This specification does not broaden enumeration membership beyond behavior
already supported for numeric values.

### Schema retrieval

Evaluating `name.<>` MUST return the schema attached to the binding named
`name`.

```hc
; .enum123 <1,2,3> 2;
; enum123.<>
# <1, 2, 3>
```

Retrieval MUST use the binding that resolved `name`, including an inherited
binding. It MUST NOT search for `<>` on the resulting numeric or blob value.

If the binding exists without an attached schema, retrieval MUST report that no
schema is present. If the binding itself is missing or inaccessible, ordinary
name and visibility errors apply.

### Schema-only declarations

A declaration that ends immediately after its schema defines a named callable
schema.

```hc
; .BitSplitter3 <[.head <3@Bit>; .tail <[@Bit]>;]>;
```

If another value follows the schema in the same declaration, the schema remains
a constraint on that value rather than becoming the binding's value.

The statement boundary therefore distinguishes a schema definition from a
schema-constrained value declaration.

### Property selection

A schema containing only property names acts as a direct selector when applied
to a Frame with properties.

```hc
; <.x, .z> [.x 1; .y 2; .z 3;]
# [1, 3]
```

Selection rules:

1. Properties are read in schema order.
2. Only direct properties are considered.
3. The result is an ordinary array of values, not a copy of the source Frame.
4. A missing or inaccessible property fails the entire selection.
5. The source and schema remain unchanged.
6. Duplicate selector names are allowed and produce duplicate result values.

### Exact fixed-width bit capture

`<N@Bit>` is a bit pattern where `N` is a positive decimal integer literal.
`Bit` is a built-in capture unit in this syntax; it is not resolved as an alias
or user binding.

When applied directly to a blob, the blob MUST contain exactly `N` bits. On
success, the original blob value is returned unchanged.

```hc
; <8@Bit> 0xff
# 0xff
```

A shorter input reports insufficient bits. A longer input reports unconsumed
bits. Zero, negative, fractional, symbolic, or computed counts are not supported
by this increment.

### Terminal remainder capture

`<[@Bit]>` consumes every bit remaining in the current cursor.

When applied directly to a blob, it returns the entire blob unchanged. Within an
ordered sequence it MUST be the final capture. It may consume zero bits only
when it is unnamed; a named empty remainder is an error so every returned named
capture has a concrete blob value.

```hc
; <[@Bit]> 0b101
# 0b101
```

### Ordered bit sequences

`<[...]>` defines one deterministic sequence. Its elements are processed from
left to right against a single bit cursor.

The minimal sequence supports only named fixed captures followed optionally by
one named terminal remainder capture:

```hc
; .BitSplitter3 <[.head <3@Bit>; .tail <[@Bit]>;]>;
; BitSplitter3 0b10101100
# [.head 0b101; .tail 0b01100;]
```

Sequence rules:

1. Fixed captures consume from the most-significant end.
2. Every fixed capture must have enough input bits.
3. A remainder capture, if present, consumes all remaining bits and must be
   final.
4. Without a remainder capture, successful application requires exact total
   consumption.
5. Named captures become direct properties of the returned array in declaration
   order.
6. Capture names must be unique within one sequence.
7. Nested sequences are not supported.
8. The input and schema remain unchanged.
9. No partial result is returned after failure.

### Capture representation

A direct exact capture returns its original blob, preserving its source base and
leading zeroes.

A proper subcapture produced by a sequence renders in binary with exactly the
captured width. Binary output avoids alignment questions when a capture does not
begin or end on a hexadecimal, octal, or base-32 digit boundary.

## Error Behavior

The minimal feature MUST distinguish these failure categories:

| Condition                                            | Error category             |
| ---------------------------------------------------- | -------------------------- |
| Retrieving `<>` from a binding without a schema      | schema missing             |
| Applying a property selector to a non-property value | selector input invalid     |
| A selected property is missing or inaccessible       | property lookup failure    |
| Applying a bit schema to a non-blob                  | bit input invalid          |
| A fixed capture has too few bits                     | insufficient bits          |
| Exact matching leaves bits unconsumed                | unconsumed bits            |
| A remainder capture is not final                     | invalid remainder position |
| A sequence repeats a capture name                    | duplicate capture name     |
| A schema mixes unsupported forms                     | unsupported schema form    |

Errors SHOULD identify the schema element and current bit position where the
failure occurred. Errors MUST NOT alter the schema, input, result scope, or
surrounding bindings.

## User Scenarios and Acceptance Tests

### Scenario 1: Inspect a binding constraint

An author declares a numeric schema and value, then retrieves the exact schema
through `name.<>`.

### Scenario 2: Select two properties

An author applies `<.x,.z>` to a property-bearing Frame and receives `[1,3]` in
selector order without modifying the source.

### Scenario 3: Validate an exact byte-sized blob

An author applies `<8@Bit>` to `0xff` and receives the unchanged blob. Seven-
and nine-bit inputs fail for different reasons.

### Scenario 4: Capture an entire bitstream

An author applies `<[@Bit]>` to a blob and receives the unchanged blob.

### Scenario 5: Split a bitstream

An author defines `BitSplitter3`, applies it to `0b10101100`, and receives a
three-bit `head` plus a five-bit `tail`.

### Scenario 6: Reuse one schema

Applying the same named schema to multiple blobs produces independent captures,
and retrieving the schema afterward returns its original definition.

## Functional Requirements

- **FR-001**: Existing numeric enumeration validation MUST remain compatible.
- **FR-002**: `name.<>` MUST retrieve the schema belonging to the resolved
  binding.
- **FR-003**: Schema retrieval MUST remain binding-local across aliases,
  inheritance, and reassignment.
- **FR-004**: Schema application MUST NOT mutate the schema or input.
- **FR-005**: Property selectors MUST return direct properties in schema order.
- **FR-006**: `<N@Bit>` MUST accept only a positive literal integer count and an
  exact-width blob when applied directly.
- **FR-007**: `<[@Bit]>` MUST consume the complete remaining cursor and MUST be
  terminal within a sequence.
- **FR-008**: Ordered sequences MUST consume from most-significant to
  least-significant bits without backtracking.
- **FR-009**: Named sequence captures MUST be returned as local properties in
  declaration order.
- **FR-010**: Proper bit subcaptures MUST preserve their exact width, including
  leading zeroes.
- **FR-011**: Any failed match MUST leave schemas, inputs, and surrounding
  bindings unchanged.
- **FR-012**: Unsupported schema forms MUST fail explicitly rather than falling
  back to list aggregation or ordinary application.

## Success Criteria

1. The five #310 assertions for schema retrieval, fixed capture, remainder
   capture, property selection, and `BitSplitter3` pass.
2. Existing schema-assignment tests continue to pass without changed results.
3. Reusing one schema for at least two inputs yields independent results and an
   unchanged retrieved schema.
4. Tests cover every error category listed above.
5. All proper subcaptures preserve their specified bit width in 100% of test
   cases, including leading-zero cases.
6. Matching time grows linearly with the number of captures plus input bits for
   every supported schema form.
7. No constructor, deferred-length, alternative, or cross-scope-capture behavior
   is accidentally accepted.

## Assumptions

- Blobs are the only bit-capture input in this increment.
- Bit position zero is the most-significant bit of the rendered input width.
- `Bit` is a built-in syntactic unit for captures.
- Numeric enumeration behavior remains exactly as currently supported.
- A statement boundary is available to distinguish schema-only declarations from
  schema-constrained value declarations.

## Deferred Work and Differences from #310

This specification intentionally leaves the following original requests
unimplemented:

### Reverse constructors

`BitSplitter3 | [.head ...; .tail ...;]` is deferred. The existing `|` operator
already means ordinary mapping, so construction needs a separate design for
direction, required keys, extra keys, validation, and round-trip guarantees.

### Deferred capture lengths

`<n@Byte>` is deferred. A later specification must define capture lookup,
numeric units, overflow, zero length, and whether arbitrary expressions are
permitted. Dynamic byte strings in `spec/8-dynamic-byte-strings.md` remain a
separate lexical feature.

### User-defined capture units

Declarations such as `.Bit <0b0,0b1>` and `.Byte <8@Bit>` are deferred. Only the
built-in `Bit` unit is recognized inside minimal bit captures.

### Alternatives and repetition

Schemas such as `<parse-x, parse-y, parse-data>` and repeated command sequences
are deferred. Supporting them requires branch ordering, recoverable mismatch,
transactional captures, and resource limits for backtracking or repetition.

### Cross-scope captures

Forms such as `@width` and `@height` are deferred. Minimal captures are returned
locally and never mutate caller or ancestor scopes. Exported captures require an
authority and rollback model.

### General recursive schemas

Nested sequences, recursive schema references, optional elements, nested
property paths, and mixed selector/bit forms are deferred.

Consequently, completing this specification does not complete the framebuffer
example in #311 or the RISC-V example in #312. It establishes only the
deterministic schema-retrieval and bit-splitting foundation on which those
features can later be designed.
