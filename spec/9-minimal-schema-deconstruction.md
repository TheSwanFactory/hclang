# Minimal Schema Typing, Retrieval, and Deconstruction

**Status:** Implemented on the #310 feature branch\
**Issue:**
[#310 — Implement BitScheme schema retrieval, deconstructors, and bit captures](https://github.com/TheSwanFactory/hclang/issues/310)\
**Related:** #311, #312

## Summary

This specification defines schemas as immutable types whose successful matches
produce evidence. It then defines the smallest coherent set of schema matchers
needed to support:

1. retrieving the schema attached to a binding;
2. selecting named properties from a compound value;
3. validating and consuming an exact number of bits;
4. consuming the remaining bits at the end of a sequence; and
5. returning named captures from one ordered bit sequence.

Type membership asks only whether matching succeeded and discards the evidence.
Applying a schema returns the evidence: an enumerated value returns itself, a
structural schema returns selected properties, and a bit schema returns the
validated blob or named captures.

The design deliberately implements fewer matchers than the full schema language
imagined by the original BitScheme tutorial. It does not add general parser
alternatives, backtracking, reverse constructors, deferred capture lengths,
user-defined capture units, or writes into outer scopes.

The goal is deterministic behavior that fits the current language, makes the
first five #310 assertions executable, and creates a stable base for later work.

## Problem Statement

1. **Schemas cannot be observed**: A binding may enforce a numeric schema, but
   evaluating `name.<>` does not return the schema belonging to that binding.
2. **Schema typing and application are disconnected**: Membership needs a pure
   success/failure result while schema application needs the evidence produced
   by the same match. Without one shared matching contract, validation and
   deconstruction can disagree.
3. **Bit layouts cannot be decomposed**: There is no supported operation for
   consuming a fixed prefix and returning named bit captures.
4. **Bit behavior can capture the schema abstraction**: Treating bit layouts as
   schema kinds makes general typing, structural constraints, runtime types, and
   future capture units difficult to compose.
5. **The aspirational language is too broad**: Alternatives, repetition,
   deferred lengths, cross-scope mutation, and construction introduce ambiguity
   and transactionality that are unnecessary for the first useful increment.

## Goals

1. Preserve existing numeric enumeration validation.
2. Define all supported schemas as pure membership predicates.
3. Make successful schema matching produce evidence usable by application.
4. Make a binding's schema retrievable through the documented `<>` property.
5. Make structural property schemas deterministic and non-mutating.
6. Support exact fixed-width bit captures through a specialized matcher.
7. Support one terminal remainder capture.
8. Support ordered sequences of named bit captures.
9. Preserve leading zeroes and bit widths in captured values.
10. Return errors without partially mutating schemas, inputs, or surrounding
    scopes.
11. Keep all matching linear and free of backtracking.
12. Keep schema storage, retrieval, membership, and application independent of
    any specific data representation such as blobs.

## Non-goals

- Implementing every possible type, schema alternative, or matcher.
- Repetition except for a terminal remainder capture.
- Backtracking, lookahead, or ambiguity detection.
- Reverse construction of a bitstream from captures.
- Deferred lengths such as `<n@Byte>`.
- User-defined units such as `.Byte <8@Bit>`.
- Cross-scope capture forms such as `@width`.
- Arbitrary expressions inside bit counts.
- Nested property paths or optional property selection.
- Defining coercion or subtyping between unrelated runtime Frame classes.
- Completing the framebuffer or RISC-V examples.

## Terminology

### Binding schema

A **binding schema** is a schema associated with a named binding rather than
with the bound value itself. Two bindings may contain equal values and have
different schemas.

### Schema type

A **schema type** is an immutable value that determines membership by matching a
candidate. Every supported schema can be used for binding validation and with
the ordinary type-membership operation.

### Match evidence

**Match evidence** is the value returned by a successful schema match. Evidence
does not affect whether the candidate belongs to the schema. Membership discards
it; schema application exposes it.

### Schema matcher

A **schema matcher** interprets one supported schema shape. It accepts a
candidate without mutating it and returns either evidence or a failure. Matchers
may specialize in equality, structure, bit cursors, or future domains without
changing the meaning of schemas themselves.

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

### 3. Schemas are evidence-producing types

Every supported schema MUST have one pure matching operation with two possible
outcomes:

1. success with evidence; or
2. failure with a diagnostic.

Binding validation and type membership MUST use only the success or failure of
that operation. Applying the schema MUST return its evidence on success and its
diagnostic on failure.

The same candidate and schema MUST therefore agree across assignment,
membership, and application. Producing or discarding evidence MUST NOT change
the candidate, schema, bindings, or later results.

### 4. Matcher support is deliberately bounded

This increment recognizes only these schema forms:

| Form               | Membership rule                   | Evidence                 |
| ------------------ | --------------------------------- | ------------------------ |
| `<value, ...>`     | Equal to one enumerated candidate | Original candidate       |
| `<.name, ...>`     | Has every direct visible property | Selected property values |
| `<N@Bit>`          | Blob has exactly `N` bits         | Original blob            |
| `<[@Bit]>`         | Candidate is a blob               | Original blob            |
| `<[capture; ...]>` | Blob satisfies the ordered layout | Named capture result     |

An enumerated candidate that is itself a schema or first-class runtime type MUST
test membership through that candidate rather than by object identity. This
provides minimal composition without defining a complete union or subtype
algebra.

Shapes not handled by these matchers fail explicitly when used for membership or
application. That is a capability boundary for this increment, not a claim that
those shapes are permanently invalid HC schemas. In particular, mixed forms do
not yet introduce general parser alternatives.

### 5. Matching never backtracks

An ordered sequence processes each capture exactly once from left to right. A
failed capture ends the match. No capture result or cursor position is retried.

The remainder capture MUST be last, so its boundary is always unambiguous.

### 6. Captures are local evidence

Named captures use local property names and are returned on the deconstruction
evidence. They do not assign to bindings in the caller or any ancestor.

This removes the need for speculative writes, rollback, visibility checks, and
cross-scope mutation authority in the minimal implementation.

## Normative Behavior

### Membership and application

For any supported schema `S` and candidate `v`:

- binding `v` under `S` succeeds exactly when `S` matches `v`;
- the type-membership operation reports true exactly when the same match
  succeeds; and
- applying `S` to `v` returns the evidence from that same match.

Membership MUST NOT depend on whether evidence is the original candidate, a
projection, or a capture aggregate. Failed matching MUST preserve the most
specific available diagnostic for direct application; binding validation MAY
wrap it in the existing binding-oriented type error.

### Existing schema-constrained assignment

Existing enumeration declarations continue to validate assignments by equality.

```hc
; .enum123 <1,2,3> 2
# .enum123 2
; @enum123 4
# $!.type-error .enum123 <1, 2, 3> 4
```

Enumeration candidates may be any values with existing equality behavior.
Schemas and first-class runtime types used as candidates delegate to their own
membership predicates, allowing named types to be composed without teaching the
schema core about their domains.

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

A schema containing only property names is a structural type requiring those
direct properties. When applied to a matching Frame, its evidence is the
selected values.

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

`<N@Bit>` is an exact-width blob type interpreted by the bit matcher, where `N`
is a positive decimal integer literal. `Bit` is a built-in capture unit in this
syntax; it is not resolved as an alias or user binding.

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

`<[@Bit]>` is a blob type whose evidence consumes every bit remaining in the
current cursor.

When applied directly to a blob, it returns the entire blob unchanged. Within an
ordered sequence it MUST be the final capture. It may consume zero bits only
when it is unnamed; a named empty remainder is an error so every returned named
capture has a concrete blob value.

```hc
; <[@Bit]> 0b101
# 0b101
```

### Ordered bit sequences

`<[...]>` defines one deterministic blob-layout type. Its bit matcher processes
elements from left to right against a single bit cursor and returns named
capture evidence.

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
| No matcher supports a schema shape                   | unsupported schema match   |

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
- **FR-002**: Every supported schema MUST use the same pure match outcome for
  binding validation, type membership, and application.
- **FR-003**: Successful application MUST return evidence while membership MUST
  discard that evidence without changing the outcome.
- **FR-004**: Schema matching MUST be extensible by domain-specific matchers;
  general schema storage and binding logic MUST NOT depend on blobs or bit
  cursors.
- **FR-005**: `name.<>` MUST retrieve the schema belonging to the resolved
  binding.
- **FR-006**: Schema retrieval MUST remain binding-local across aliases,
  inheritance, and reassignment.
- **FR-007**: Schema application MUST NOT mutate the schema or input.
- **FR-008**: Property selectors MUST return direct properties in schema order.
- **FR-009**: `<N@Bit>` MUST accept only a positive literal integer count and an
  exact-width blob when applied directly.
- **FR-010**: `<[@Bit]>` MUST consume the complete remaining cursor and MUST be
  terminal within a sequence.
- **FR-011**: Ordered sequences MUST consume from most-significant to
  least-significant bits without backtracking.
- **FR-012**: Named sequence captures MUST be returned as local properties in
  declaration order.
- **FR-013**: Proper bit subcaptures MUST preserve their exact width, including
  leading zeroes.
- **FR-014**: Any failed match MUST leave schemas, inputs, and surrounding
  bindings unchanged.
- **FR-015**: Unsupported schema applications MUST fail explicitly rather than
  falling back to list aggregation or ordinary application.
- **FR-016**: Enumerated schema and runtime-type candidates MUST delegate
  membership to the nested type instead of comparing only object identity.

## Success Criteria

1. The five #310 assertions for schema retrieval, fixed capture, remainder
   capture, property selection, and `BitSplitter3` pass.
2. Existing schema-assignment tests continue to pass without changed results.
3. Assignment, membership, and direct application agree on success and failure
   for enumeration, structural, fixed-bit, remainder, and sequence schemas.
4. Reusing one schema for at least two inputs yields independent results and an
   unchanged retrieved schema.
5. A schema containing a named or nested schema candidate composes membership
   without bit-specific logic in the schema container.
6. Tests cover every error category listed above.
7. All proper subcaptures preserve their specified bit width in 100% of test
   cases, including leading-zero cases.
8. Matching time grows linearly with the number of captures plus input bits for
   every supported schema form.
9. No constructor, deferred-length, alternative, or cross-scope-capture behavior
   is accidentally accepted.

## Assumptions

- Blobs are the only bit-capture input in this increment.
- Bit position zero is the most-significant bit of the rendered input width.
- `Bit` is the only built-in domain matcher unit in this increment; it is not a
  special case in general binding, retrieval, or type-membership semantics.
- Enumeration uses existing value equality, with membership delegation for
  nested schemas and first-class runtime types.
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

### General recursive schemas and type algebra

Recursive schema references, optional elements, nested property paths, mixed
matcher alternatives, intersections, coercions, and subtyping are deferred. The
evidence-producing match contract is intended to support those additions without
redefining schema storage, membership, or application.

Consequently, completing this specification does not complete the framebuffer
example in #311 or the RISC-V example in #312. It establishes only the
deterministic schema-retrieval and bit-splitting foundation on which those
features can later be designed.
