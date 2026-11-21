#!/usr/bin/env hc
```
FOIST 19a — executable operator/observer witnesses

The raw Denum observer returns Count and ordered load magnitudes;
the KD coordinate observer only reads the antipodal differences.
Appending a load may change which half an earlier load occupies.
Cartesian product preserves left-major ordered pairing, while the
signed-XOR product accumulates magnitudes in its routed output Denum.
```

```
Third hash: raw Denum, including the canonical zero-arity state.
```
; “” [3, 1].###
# “Denum(2,[3, 1])”
; “” [3, 1, 5].###
# “Denum(3,[3, 1, 5])”
; “” [].###
# “Denum(0,[])”

```
Fourth hash: signed coordinates, with lazy trailing completion.
```
; [3, 1].####
# [2]
; [3, 1, 5].####
# [-2, 1]
; [].####
# []

```
Flop and structural Cartesian product are distinct.
```
; [1, 2] + [3, 4]
# [1, 2, 3, 4]
; [1, 2] * [3, 4]
# [[1, 3], [1, 4], [2, 3], [2, 4]]

```
KD multiplication returns a Denum, and its fourth hash observes the
product's coefficients. The product Count is C(A) × C(B).
```
; “” ([0, 1].### &|& [0, 1].###)
# “Denum(4,[1, 0])”
; ([0, 1].### &|& [0, 1].###).####
# [1]

```
Standalone modulo remains.
```
; 5 %% 2
# 1
