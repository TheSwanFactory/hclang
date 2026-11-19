# HC Cart and Zip — executable design test cases

Status: **proposed; unverified**. Tracks #498.

## Hypothesis

Cart and Zip are distinct derived pairing patterns, requiring no new evaluator
primitive. Pairing, composition and arrangement must remain separate.

## Operator assumptions to test

- `&`: map immediate children.
- `&|`: map then splice one level.
- `&&`: indexed map, with `[address,value]` as argument.
- `B (address)`: indexed lookup.

## Cart — nested arrangement

```hc
.A [1, 2];
.B [10, 20, 30];
A & {.a _; B & {[a, _]}}
```

Expected: `[[[1,10],[1,20],[1,30]],[[2,10],[2,20],[2,30]]]`

## Cart — flattened arrangement

```hc
.A [1, 2];
.B [10, 20, 30];
A &| {.a _; B & {[a, _]}}
```

Expected: `[[1,10],[1,20],[1,30],[2,10],[2,20],[2,30]]`

## Zip — positional pairing

```hc
.A [1, 2];
.B [10, 20];
A && {[_.1, B (_.0)]}
```

Expected: `[[1,10],[2,20]]`

## Regression matrix

1. Cart 2×3 preserves six pairs and row-major ordering.
2. Zip 2×2 preserves two corresponding pairs.
3. Cart with empty A produces an empty enumeration.
4. Cart with empty B: inspect nested empty rows versus flat empty result.
5. Zip with empty A and/or B: determine behavior.
6. Zip unequal lengths both ways: explicitly select truncate, reject or
   missing-value semantics.
7. Duplicate values remain distinct positional occurrences.
8. Nested children: verify immediate-level traversal.
9. Named properties: verify indexed map visitation/filtering.
10. Composition can be mapped over produced pairs independently.
11. Nested and flat Cart share pair membership while differing in arrangement.

## Required evidence before claiming success

- Run the examples with the HC interpreter and capture actual output.
- Confirm `&&` address shape and missing-index behavior.
- Confirm `&|` flattening behavior.
- Decide unequal-length Zip semantics and encode executable assertions.
- If existing operators suffice, document both as named derived patterns.
  Otherwise identify the smallest missing primitive.

This file is a **test design document**, not an executable test suite. A CI
check that merely builds or lints this PR does not validate these HC
expressions.
