# HC Cart, Zip, and Flop — Derived Design Patterns

Status: **executable and CI-verified for the asserted cases**. The authoritative
HC testdoc is [`hc/cart-zip.hc`](../hc/cart-zip.hc). Tracks #498.

## 1. Principle

Cart and Zip are distinct pairing patterns derived from existing HC operators.
Flop is a derived fold of repeated Apply. None requires a new evaluator
primitive. Pairing, composition, and arrangement remain separate decisions.

## 2. Verified Operators

- `&`: map immediate children.
- `&|`: map then splice one level.
- `&&`: indexed map over address/value tuples, including named properties.
- `B (address)`: indexed lookup.
- `B | A`: Flop; reduce the immediate children of B into receiver A.

## 3. Cartesian Product

Nested arrangement:

```hc
.A [1, 2];
.B [10, 20, 30];
A & {.a _; B & {[a, _]}}
```

Expected: `[[[1,10],[1,20],[1,30]],[[2,10],[2,20],[2,30]]]`.

Flat arrangement:

```hc
A &| {.a _; B & {[a, _]}}
```

Expected: `[[1,10],[1,20],[1,30],[2,10],[2,20],[2,30]]`.

The corresponding executable assertions, including empty inputs, duplicates, and
immediate-level nested children, live in the HC testdoc.

## 4. Positional Zip

```hc
.A [1, 2];
.C [10, 20];
A && {[_.1, C (_.0)]}
```

Expected: `[[1,10],[2,20]]`.

This follows corresponding addresses rather than enumerating all pairs. An empty
**left** source is tested. An empty **right** source is not yet a defined Zip
case: a missing address lookup does not determine whether Zip should truncate,
reject, or propagate the lookup refusal.

## 5. Flop (Fold of Apply)

```hc
[3, 4] | [1, 2]
```

Expected: `[1,2,3,4]`.

Flop traverses the immediate children of its left-hand source and applies them
successively to the right-hand receiver. Empty inputs, duplicates, nested
children, and a named `flop` closure are asserted in the testdoc.

## 6. Open Design Boundaries

- **Unequal-length Zip:** choose truncation, refusal, or explicit missing
  values; this includes the empty-right-source case.
- **Property-plane Zip:** `&&` visits named properties as well as indexed
  elements. Decide whether a general Zip should include or filter those
  properties.
- **Generality:** the testdoc demonstrates useful constructions, not a proof of
  a complete algebra for arbitrary Frames.

Run the executable examples with `deno task test:doc`; CI discovers the testdoc
automatically, so no filename registration is necessary.
