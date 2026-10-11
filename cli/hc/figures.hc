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
The semiring carrier is not raw Figures under structural or identity equality.
Let `F` be the finite, well-founded Figures made with the bracket, with `U`
distinguished as the unit cell, and write `x ≈ y` when `(size x) = (size y)`.
The carrier is the quotient `F/≈`; HC's structural `=` compares the canonical
Figure-valued Size answers. Its zero and one representatives are `Z` and `U`.
Addition constructs `Figure(x, y)`. Multiplication first observes `size x`, then
constructs a recursive row stack
`rows(Z,y)=Z`; `rows([n],y)=Figure(y,rows(n,y))`. Thus a product reuses `y`
once for every cell of `x` while every result remains a Figure
```
; .figure_zero Z; .figure_one U;
; .figure_add {[(_ .0), (_ .1)]};
; .size_mul {((_ .0) = Z) ? {Z} : {size_add [(__ .1), size_mul [((__ .0) .0), (__ .1)]]}};
; .figure_mul_rows {((_ .0) = Z) ? {Z} : {[__ .1, figure_mul_rows [((__ .0) .0), (__ .1)]]}};
; .figure_mul {figure_mul_rows [size (_ .0), (_ .1)]};
; .size_equivalent {((size (_ .0)) = (size (_ .1))) ? {U} : {Z}};
; [figure_zero === Z, figure_one === U]
# [<>, <>]
```
A non-square product is two occurrences of one three-cell row. Its outer Figure
holds the first row and the recursive remainder; both row positions reuse the
same `row3`. Manyness sees that nesting, while Size sums six unit occurrences
```
; .row2 [U, U]; .row3 [U, U, U];
; .rectangle23 (figure_mul [row2, row3]);
; rectangle23 = [row3, [row3, Z]]
# <>
; [(rectangle23 .0) === row3, ((rectangle23 .1) .0) === row3]
# [<>, <>]
; size rectangle23
# [[[[[[[]]]]]]]
```
The defining equations are executable: Size takes Figure addition to
`size_add`, and the row recursion to `size_mul`. Induction on the first Size
argument gives the multiplication equation. Therefore both recipes respect
`≈`; the representative checks also use differently nested, equal-Size inputs
```
; [(size (figure_add [row2, row3])) = (size_add [size row2, size row3]), (size rectangle23) = (size_mul [size row2, size row3])]
# [<>, <>]
; .deep2 [[row2]]; .deep3 [[[row3]]];
; [size_equivalent [row2, deep2], size_equivalent [row3, deep3], size_equivalent [figure_add [row2, row3], figure_add [deep2, deep3]], size_equivalent [figure_mul [row2, row3], figure_mul [deep2, deep3]]]
# [[[]], [[]], [[]], [[]]]
```
On canonical Size Figures, `size_add` and `size_mul` are the usual zero/successor
recurrences. Induction gives additive identity, associativity and commutativity;
multiplicative identity and associativity; both distributive laws; and both zero
annihilations. Transport along Size proves those laws on `F/≈`. These executed
instances witness every law without pretending that testing replaces the
inductive proof
```
; [size_equivalent [figure_add [figure_zero, row2], row2], size_equivalent [figure_add [row2, figure_zero], row2]]
# [[[]], [[]]]
; [size_equivalent [figure_mul [figure_one, row2], row2], size_equivalent [figure_mul [row2, figure_one], row2]]
# [[[]], [[]]]
; [size_equivalent [figure_add [figure_add [row2, row3], row4], figure_add [row2, figure_add [row3, row4]]], size_equivalent [figure_add [row2, row3], figure_add [row3, row2]]]
# [[[]], [[]]]
; size_equivalent [figure_mul [figure_mul [row2, row3], row4], figure_mul [row2, figure_mul [row3, row4]]]
# [[]]
; [size_equivalent [figure_mul [row2, figure_add [row3, row4]], figure_add [figure_mul [row2, row3], figure_mul [row2, row4]]], size_equivalent [figure_mul [figure_add [row2, row3], row4], figure_add [figure_mul [row2, row4], figure_mul [row3, row4]]]]
# [[[]], [[]]]
; [size_equivalent [figure_mul [figure_zero, row3], figure_zero], size_equivalent [figure_mul [row3, figure_zero], figure_zero]]
# [[[]], [[]]]
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
Withness asks whether all requested Figures are immediate children of one
parent. It uses identity `===`, not equal-looking form: `B` is reused under both
`E` and `F`, while the separately constructed `B2` is not a child of either
```
; .absent {(figs & {(((parent & {(_ === __) ? {[<>]}}) | []) = []) ? {[<>]}}) | []};
; .withness {((absent _) = []) ? {B} : {A}};
; withness [.parent E; .figs [A, B];]
# [[]]
; withness [.parent F; .figs [A, B];]
# []
; withness [.parent G; .figs [E, F];]
# [[]]
; withness [.parent E; .figs [B2];]
# []
```
The Fano construction starts with seven distinguishable Figures. Lowercase `b`
and `b_copy` have equal form but are separate constructions. The seven triples
below reuse exactly `a,b,c,d,e,f,g`, and Withness checks their common immediate
containment by identity
```
; .a []; .b [a]; .c [b]; .d [c]; .e [d]; .f [e]; .g [f];
; .originals [a, b, c, d, e, f, g];
; .abd [a, b, d]; .bce [b, c, e]; .cdf [c, d, f];
; .deg [d, e, g]; .efa [e, f, a]; .fgb [f, g, b]; .gac [g, a, c];
; .fano [abd, bce, cdf, deg, efa, fgb, gac];
; .Three [[U]]; .Seven [[[[[[U]]]]]];
; [(many originals) = Seven, (many fano) = Seven]
# [<>, <>]
; .triple_arity_checks (fano & {((many _) = Three) ? {U} : {Z}});
; (size triple_arity_checks) = Seven
# <>
; sameness [b, b]
# [[]]
; .b_copy [a];
; b = b_copy
# <>
; sameness [b, b_copy]
# []
; withness [.parent abd; .figs [a, b, d];]
# [[]]
; withness [.parent abd; .figs [a, c];]
# []
```
For the first exhaustive incidence check, `point_pairs` explicitly lists all
6+5+4+3+2+1 = 21 unordered pairs. `containing_triples` returns the Figure-valued
number of Fano triples containing both originals. There are 21 listed pairs,
all originals in them are distinct by Sameness, and every count is exactly `U`
```
; .point_pairs [[a, b], [a, c], [a, d], [a, e], [a, f], [a, g], [b, c], [b, d], [b, e], [b, f], [b, g], [c, d], [c, e], [c, f], [c, g], [d, e], [d, f], [d, g], [e, f], [e, g], [f, g]];
; .TwentyOne (size_add [Eight, size_add [Eight, size_add [Four, U]]]);
; (many point_pairs) = TwentyOne
# <>
; (size (point_pairs & {sameness _})) = Z
# <>
; .containing_triples {size (fano & {withness [.parent _; .figs __;]})};
; .is_one {(_ = U) ? {U} : {Z}};
; .point_pair_checks (point_pairs & {is_one (containing_triples _)});
; (size point_pair_checks) = TwentyOne
# <>
```
For the dual exhaustive check, `triple_pairs` lists all 21 unordered pairs of
the seven constructed triples. For each original, multiplying its two
Figure-valued Withness answers contributes one cell exactly when that same
original is an immediate child of both triples. Every shared-original count is
one
```
; .triple_pairs [[abd, bce], [abd, cdf], [abd, deg], [abd, efa], [abd, fgb], [abd, gac], [bce, cdf], [bce, deg], [bce, efa], [bce, fgb], [bce, gac], [cdf, deg], [cdf, efa], [cdf, fgb], [cdf, gac], [deg, efa], [deg, fgb], [deg, gac], [efa, fgb], [efa, gac], [fgb, gac]];
; (many triple_pairs) = TwentyOne
# <>
; .shared_original_count {size (originals & {figure_mul [withness [.parent (__ .0); .figs [_];], withness [.parent (__ .1); .figs [_];]]})};
; .triple_pair_checks (triple_pairs & {is_one (shared_original_count _)});
; (size triple_pair_checks) = TwentyOne
# <>
```
Finally `a,b,c,f` are four originals with no three in a Fano triple. Their four
3-subsets are listed rather than sampled, and every containing-triple count is
zero
```
; .no_three_originals [a, b, c, f];
; (many no_three_originals) = Four
# <>
; .no_three_subsets [[a, b, c], [a, b, f], [a, c, f], [b, c, f]];
; (many no_three_subsets) = Four
# <>
; .is_zero {(_ = Z) ? {U} : {Z}};
; .no_three_checks (no_three_subsets & {is_zero (containing_triples _)});
; (size no_three_checks) = Four
# <>
```
Both results use the bracket as their sole `Figure(children...)` constructor.
HC, not the Figure theory, supplies child addressing and `&`/`|` traversal,
closure calls, recursion and conditional control, fresh aggregate allocation,
reference reuse and copy-on-write behavior, structural `=`, and identity
`===`. The corpus derives Manyness, Size, Size-equivalence, the Figure-valued
operations, Sameness, Withness, and the finite incidence checks from those
services. Multiplication invokes no copy primitive: its identity assertions show
that it reuses `row3`. `b_copy` is a fresh bracket construction, not a derived
copy operation. Neither the semiring laws nor the Fano pattern is claimed for
arbitrary Figure observations outside the stated quotient and construction.
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
