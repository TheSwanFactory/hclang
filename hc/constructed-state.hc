#!/usr/bin/env hc
```
Constructed physical state — updated VACT test witness for FOIST 19a

The source study is occurrence/explore 022.05a (Hilary correction):
https://nightly.quilttest.com/b/protology/packages/occurrence/explore/tree/9d966bd95a783849c0363d82ee295586e0ffc6db581815b443140d746843eec8/issues/022-constructed-physical-state/022.05a-Hilary-VACT-correction-constructive-physical-state.md

Construction -> specified observation -> vacted fact -> interpretation remains
the research methodology. This testdoc is a reproducible software witness,
**not** an executed laboratory experiment or an assertion that a physical
theorem has been proved.

The v0.53.1 testdoc demonstrated alternating-residual and terminal Star
foliation identities. Those are no longer public HC semantics. FOIST 19a
supersedes their software observer/operator allocation. This migration
supplies fresh constructive witnesses, without claiming that the old
homomorphism laws remain true for the new operators.

Two distinct physical-state construction paths can share observed KD
coordinates but differ in immediate children and raw loads; observational
equality is weaker than identity or structural equality.
```

```
Constructive arrays preserve child shape; Size sums immediate child's Size.
```
; .E []; .X [[], [[], []], []]; .A [[]]; .B [[[]]];
; [E.#, E.##, X.#, X.##, A.#, A.##]
# [0, 1, 3, 4, 1, 1]
; [A = B, A.#### = B.####]
# [(), <>]
```
Raw Denumeration retains Count and ordered nonnegative Size loads.
The canonical empty Frame has the zero-arity raw Denum.
```
; “” E.###
# “Denum(0,[])”
; “” X.###
# “Denum(3,[1, 2, 1])”
; “” A.###
# “Denum(1,[1])”
; “” B.###
# “Denum(1,[1])”
; [E.####, X.####, A.####, B.####]
# [[], [0, 2], [1], [1]]
```
Appending to raw sequences can move the sign boundary after KD arity
completion. It is not value-preserving rank embedding.
```
; [3, 1].####
# [2]
; [3, 1, 5].####
# [-2, 1]
; “” [3, 1, 5].###
# “Denum(3,[3, 1, 5])”
```
An ordinary Frame append and a Denum Apply need not commute: a Denum's
existing arity routes by C mod k, while ordinary Frame append creates a
new immediate child and extends the raw load list. These two constructions
must not be conflated when asserting physical-state invariants.
```
; .Y [[], [], []];
; “” (A Y).###
# “Denum(2,[1, 3])”
; “” (A.### Y)
# “Denum(2,[4])”
; (A Y).#### = (A.### Y).####
# ()
```
Flop and Cart distinguish append-like combination from pairing.
Neither imposes the CD phase law; the signed-XOR KD product does.
```
; [1, 2] + [3, 4]
# [1, 2, 3, 4]
; [1, 2] * [3, 4]
# [[1, 3], [1, 4], [2, 3], [2, 4]]
; ([0, 1].### &|& [0, 1].###).####
# [1]
```
The imported module contributes no ambient declaration or side effect.
```
[] = []
