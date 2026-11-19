#!/usr/bin/env hc
```
Cart and Zip: derived pairing patterns (#498)

These are executable HC testdoc expectations, not new evaluator primitives.
Cart pairs every immediate element of A with every immediate element of B.
Zip pairs elements at corresponding addresses. Composition and arrangement
remain separate choices.

The testdoc runner evaluates each '; ' example and checks the following '# '
expectation. Run with deno task test:doc.

## Pair construction

```
; [1, 10]
# [1, 10]
```

## Cartesian pairing: nested and flat arrangements

```
; .A [1, 2];
; .B [10, 20, 30];
; A & {.a _; B & {[a, _]}}
# [[[1, 10], [1, 20], [1, 30]], [[2, 10], [2, 20], [2, 30]]]
; A &| {.a _; B & {[a, _]}}
# [[1, 10], [1, 20], [1, 30], [2, 10], [2, 20], [2, 30]]
```

## Cartesian pairing: empty sources and repeated occurrences

```
; [] & {.a _; B & {[a, _]}}
# []
; A & {.a _; [] & {[a, _]}}
# [[], []]
; A &| {.a _; [] & {[a, _]}}
# []
; [1, 1] &| {.a _; [2, 2] & {[a, _]}}
# [[1, 2], [1, 2], [1, 2], [1, 2]]
```

## Cartesian pairing: nested children are paired as immediate elements

```
; [[1], [2]] &| {.a _; [[3], [4]] & {[a, _]}}
# [[[1], [3]], [[1], [4]], [[2], [3]], [[2], [4]]]
```

## Zip: corresponding positions

The doubled map yields [address, value]. Its address can be applied to B.

```
; .C [10, 20];
; A && {[_.1, C (_.0)]}
# [[1, 10], [2, 20]]
; [] && {[_.1, C (_.0)]}
# []
; [1, 1] && {[_.1, C (_.0)]}
# [[1, 10], [1, 20]]
```

## Zip includes the property plane under doubled iteration

A property-bearing source does not have the same correspondence domain as
an element-only list. This expectation pins the documented && behavior.

```
; [.meta 9; 1, 2] && {_}
# [[.meta, 9], [.0, 1], [.1, 2]]
```

## Composition after pairing

```
; (A &| {.a _; B & {[a, _]}}) & {(_.0 * _.1)}
# [10, 20, 30, 20, 40, 60]
```

## Flop: concatenate by folding Apply over immediate children

Flop is the FOIST name for repeated Apply: B | A threads A as the
receiver while visiting each immediate child of B. It is a derived
left fold, not argument spreading or a new HC evaluator primitive.

```
; [3, 4] | [1, 2]
# [1, 2, 3, 4]
; [] | [1, 2]
# [1, 2]
; [3, 4] | []
# [3, 4]
; [2, 2] | [1]
# [1, 2, 2]
; [[3], [4, 5]] | [1, 2]
# [1, 2, [3], [4, 5]]
; .flop {(_ .1) | (_ .0)};
; flop [[1, 2], [3, 4]]
# [1, 2, 3, 4]
```

This also pins the direction: the second collection is traversed,
while the first collection supplies the initial receiver. Empty
inputs and repeated occurrences retain their usual Apply semantics.

## Open design boundary

Zip against an empty right-hand source is intentionally not asserted: absent
addresses require a policy (truncate, refuse or propagate a missing value),
which is also unresolved for other unequal lengths. A general element-only Zip
must additionally decide whether to filter the property plane. Those policies
require separate tests.

```
