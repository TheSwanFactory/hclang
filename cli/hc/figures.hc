#!/usr/bin/env hc
```
Figures (#382)

Ported from History 005.30c, "The Figure class as idiomatic HC", in
`quilt+s3://protology#package=occurrence/history`. Relational Construction Theory
has one generative operation: construct a Figure with optional, already
constructed children. In HC that operation is the array literal, so nothing is
added to get it. Every observer below answers a Figure, never a number or a
Boolean: `A` means no and `B` means yes.

30c was written against v0.16.0 and had to work around three behaviours that
v0.17.0 changes. Its observers needed a boxed if/else, they could not use local
names without writing onto the Figure observed, and identity-sameness was
unanswerable. Here each one is written plainly.

The constructor is the bracket
```
; .A []; .B [A]; .C [B]; .D [C];
; .E [A, B]; .F [B, C]; .G [E, F];
; G
# [[[], [[]]], [[[]], [[[]]]]]
```
A named closure is the one-child form, so a Figure can receive a reduce. For n
children, write the bracket: a group passed to a closure stays one argument
```
; .Figure {[_]};
; Figure (B)
# [[[]]]
; Figure (B, A)
# [([[]], [])]
; [B, A]
# [[[]], []]
```
rest: the children after the first. A then-branch that answers nil is boxed, so
it does not fall through to the else branch
```
; .rest {((_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) | []) & {_ .0}};
; rest E
# [[[]]]
```
Manyness folds the immediate children into a successor-shaped Figure. A plain
conditional answers either branch
```
; .many {(_ = []) ? {A} : {[many (rest __)]}};
; many A
# []
; many B
# [[]]
; many E
# [[[]]]
; (many G) = C
# <>
; (many E) = B
# ()
```
The tally form is the native idiom: one `A` per child, with no recursion
```
; .tally {_ & {A}};
; tally E
# [[], []]
; (tally G) = (tally E)
# <>
```
Size is recursive cell volume, not immediate Manyness. `Z` reuses `A` as the
additive zero and `U` reuses `B` as the distinguished unit cell. `size_add`
adds successor-shaped Figure numerals, and `size_children` adds the recursive
Size of every immediate child. The special `U` case comes first because its
child is `Z`. HC supplies recursive control, child traversal, structural `=`
for Size values, and identity `===` to recognize the distinguished `U`; every
mathematical value below is made only with the bracket Figure constructor
```
; .Z A; .U B;
; .size_add {((_ .1) = Z) ? {__ .0} : {[size_add [(__ .0), ((__ .1) .0)]]}};
; .size_children {(_ = Z) ? {Z} : {size_add [size (__ .0), size_children (rest __)]}};
; .size {(_ === U) ? {U} : {size_children __}};
; size Z
# []
; size U
# [[]]
; .Four [[[U]]]; .Eight [[[[[[[U]]]]]]];
; .row4 [U, U, U, U];
; size row4
# [[[[[]]]]]
; (size row4) = Four
# <>
; .deep4 [[[row4]]];
; size deep4
# [[[[[]]]]]
; .two_fours [row4, row4];
; size two_fours
# [[[[[[[[[]]]]]]]]]
; (size two_fours) = Eight
# <>
```
Sameness has two rungs. Sameness of form is `=`, and sameness of the
constructed Figure is `===`, which 30c recorded as unanswerable in v0.16.0
```
; .sameform {((_ .0) = (_ .1)) ? {B} : {A}};
; .sameness {((_ .0) === (_ .1)) ? {B} : {A}};
; sameform [B, [A]]
# [[]]
; sameness [B, B]
# [[]]
; sameness [B, [A]]
# []
; sameness [(E .0), A]
# [[]]
; .B2 [A];
; [B = B2, B == B2, B === B2]
# [<>, <>, ()]
```
Withness asks whether all the given Figures are children of one parent. `B` is
a child of both `E` and `F`, but the question is asked of one parent at a time
```
; .absent {(figs & {(((parent & {(_ = __) ? {[<>]}}) | []) = []) ? {[<>]}}) | []};
; .withness {((absent _) = []) ? {B} : {A}};
; withness [.parent E; .figs [A, B];]
# [[]]
; withness [.parent F; .figs [A, B];]
# []
; withness [.parent G; .figs [E, F];]
# [[]]
```
Observation does not mutate, even with a local name inside a map
```
; E = [A, B]
# <>
; .E5 [A, [A]];
; E5 & {.o _; o};
; E5
# [[], [[]]]
; A
# []
```
005.30b's Cartesian product, executed verbatim. The grid is one source element,
so `Figure` is applied once and the answer has the grid as its sole child
```
; .Pa [“a”, “b”]; .Pb [“c”, “d”];
; [(Pa & { Pb & { [__, _] } })] | Figure
# [[[[“a”, “c”], [“a”, “d”]], [[“b”, “c”], [“b”, “d”]]]]
; (many ([(Pa & { Pb & { [__, _] } })] | Figure)) = B
# <>
; (([(Pa & { Pb & { [__, _] } })] | Figure) .0) = (Pa & { Pb & { [__, _] } })
# <>
; (many (Pa & { Pb & { [__, _] } })) = C
# <>
