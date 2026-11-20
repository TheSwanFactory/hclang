#!/usr/bin/env hc
```
Native Cart &|& and Zip |&| — FOIST 15

The former derived Cart and Zip design patterns are tested in cart-zip.hc.
These operators pair immediate positional elements as values, without
evaluating or descending into nested children. Cart enumerates a flat
left-major product; Zip truncates to the shorter list. Named properties
are excluded from the pairing domains.
```

```
Cart: left-major, flat Cartesian pairing.
```
; [1, 2] &|& [10, 20, 30]
# [[1, 10], [1, 20], [1, 30], [2, 10], [2, 20], [2, 30]]
; [1, 1] &|& [2, 2]
# [[1, 2], [1, 2], [1, 2], [1, 2]]
; [] &|& [10, 20]
# []
; [1, 2] &|& []
# []
; [[1], [2]] &|& [[3], [4]]
# [[[1], [3]], [[1], [4]], [[2], [3]], [[2], [4]]]

```
Zip: equal inputs, unequal inputs, and empty inputs.
```
; [1, 2] |&| [10, 20]
# [[1, 10], [2, 20]]
; [1, 2] |&| [10, 20, 30]
# [[1, 10], [2, 20]]
; [1, 2, 3] |&| [10]
# [[1, 10]]
; [1, 2] |&| []
# []
; [] |&| [10, 20]
# []
; [1, 1] |&| [2, 2]
# [[1, 2], [1, 2]]
; [[1], [2]] |&| [[3]]
# [[[1], [3]]]

```
Named properties are not positional elements, on either side.
```
; [.meta 9; 1, 2] |&| [.tag 8; 10, 20, 30]
# [[1, 10], [2, 20]]
; [.meta 9; 1, 2] &|& [.tag 8; 10]
# [[1, 10], [2, 10]]

```
Native operations agree with the derived patterns on their shared domain.
The derived Zip still has its own property and missing-address semantics.
```
; .A [1, 2];
; .B [10, 20];
; A &|& B
# [[1, 10], [1, 20], [2, 10], [2, 20]]
; A &| {.a _; B & {[a, _]}}
# [[1, 10], [1, 20], [2, 10], [2, 20]]
; A |&| B
# [[1, 10], [2, 20]]
; A && {[_.1, B (_.0)]}
# [[1, 10], [2, 20]]
