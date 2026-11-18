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

## Open design boundary

Unequal-length Zip is intentionally not asserted: an absent address is not
automatically a truncation rule. A general element-only Zip must also decide
whether to filter the property plane. Those policies require separate tests.
