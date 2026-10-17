#!/usr/bin/env hc
```
Figures (#382, #395)

Relational Construction Theory has one generative operation: construct a Figure
out of zero or more already constructed Figures, its children. This module
ports History 005.30c, "The Figure class as idiomatic HC", in
`quilt+s3://protology#package=occurrence/history`.

`Figure` is a constructor closure. `Figure [c, …]` answers a fresh object that
holds its `children` and declares the methods below. Every observer answers a
Figure, never a number or a Boolean: `A`, with no children, means no, and `B`
means yes. So every answer can be a child, a receiver, or an argument, and the
class is closed under its own methods.

- `x y`: a new Figure with x's children followed by y (#375)
- `x.many()`: Manyness, a tally with one mark `B` per immediate child
- `x.size()`: Size, a tally with one unit cell `U` per cell, where any Figure
  shaped like `U` is a cell and every other Figure adds up its children
- `x.mul y`: y once for every cell of x, or `Z` when y is `Z`
- `x.size_mul y`: the Size of y repeated once per child of x
- `x.size_equivalent y`: `U` when the two Sizes agree, `Z` otherwise
- `x.sameform y`: `B` when `x = y`, the same form
- `x.sameness y`: `B` when `x === y`, the same Figure
- `x.withness [f, …]`: `B` when every f is an immediate child of x, by identity

A method names its own Figure `_^`, because a bare name is looked up on the
argument first (spec 7), and the argument is usually a Figure too. For the same
reason, a block inside a method reads only names the method bound
```
.Figure {[.children (_ | []);
  .apply {Figure ((_^.children | []) _)};
  .many {Figure (_^.children & {B})};
  .size {.kids _^.children;
    (kids = U.children) ? {Figure [U]} : {((kids & {_.size()}) | (Tally Z)).row}};
  .mul {.y _; .cells ((_^.size()).children);
    (y = Z) ? {Z} : {Figure (cells & {y})}};
  .size_mul {.y _; (Figure (_^.children & {y})).size()};
  .size_equivalent {((_^.size()) = (_.size())) ? {U} : {Z}};
  .sameform {(_^ = _) ? {B} : {A}};
  .sameness {(_^ === _) ? {B} : {A}};
  .withness {.kids _^.children;
    .absent ((_ & {.f _;
      .found ((kids & {(_ === f) ? {f}}) | []);
      (found = []) ? {f}}) | []);
    (absent = []) ? {B} : {A}}
]};
```
`Tally` joins tallies. Its `row` starts at `Z`, and applying a tally to it
appends that tally's units, one at a time, through `x y`
```
.Tally {[.row _; .apply {Tally (_.children | _^.row)}]};
```
## Construction

The example family reuses one `A` under both `B` and `E`. Indexing reaches a
child itself, not a copy
```
; .A (Figure []); .B (Figure [A]); .C (Figure [B]); .D (Figure [C]);
; .E (Figure [A, B]); .F (Figure [B, C]); .G (Figure [E, F]);
; [(G.children .0) === E, (E.children .1) === B, (F.children .0) === B, (E.children .0) === (B.children .0)]
# [<>, <>, <>, <>]
```
Equal children make equal Figures, but each construction is a different Figure
```
; [E = (Figure [A, B]), E == (Figure [A, B]), E === (Figure [A, B]), E = (Figure [B, A])]
# [<>, <>, (), ()]
```
Application appends one child and leaves the receiver alone, so a reduce into
an empty Figure constructs, and a map extends one Figure per element
```
; [(E B) = (Figure [A, B, B]), ((E B).children .2) === B, E = (Figure [A, B])]
# [<>, <>, <>]
; [([A, B] | (Figure [])) = E, ([A, B] | (Figure [])) === E]
# [<>, ()]
; ([A, B] & (Figure [C])) = [Figure [C, A], Figure [C, B]]
# <>
```
## Manyness and Size

Manyness marks the immediate children and looks no deeper
```
; [(A.many()) = A, (E.many()) = (Figure [B, B]), (G.many()) = (E.many()), (E.many()) = (B.many())]
# [<>, <>, <>, ()]
```
Size is recursive cell volume. `Z` reuses `A` as the additive zero and `U`
reuses `B` as the unit cell, the same mark Manyness uses, so a count is itself a
Figure of units. Size maps each child to its Size and joins them into
`Tally Z`; the unit case comes first because a unit's only child is `Z`, and it
tests form, so any Figure shaped like `U` is a cell
```
; .Z A; .U B;
; [(Z.size()) = Z, (U.size()) = (Figure [U]), ((Figure [U]).size()) = ((Figure [Figure [A]]).size())]
# [<>, <>, <>]
; .row2 (Figure [U, U]); .row3 (Figure [U, U, U]); .row4 (Figure [U, U, U, U]);
; .deep4 (Figure [Figure [Figure [row4]]]); .two_fours (Figure [row4, row4]);
; [(row4.size()) = row4, (deep4.size()) = row4, (two_fours.size()) = (row4.children | row4)]
# [<>, <>, <>]
; [(row4.many()) = (row4.size()), (deep4.many()) = (deep4.size()), (two_fours.many()) = row2]
# [<>, (), <>]
; ((Tally Z).row) = Z
# <>
```
A tally is its own Size, so Size is idempotent
```
; ((two_fours.size()).size()) = (two_fours.size())
# <>
```
## The semiring

The carrier is not raw Figures. Let `F` be the finite, well-founded Figures,
with the form of `U` as the unit cell, and write `x ≈ y` when
`(x.size()) = (y.size())`. The carrier is the quotient `F/≈`, with zero `Z` and
one `U`. Addition is construction, `Figure [x, y]`. Multiplication maps every
cell of `x.size()` to `y`, so a product reuses `y` once per cell of `x`. A
product by `Z` is `Z`, because one row of nothing, `Figure [Z]`, has the form of
`U` and would count as a cell
```
; [(U.mul Z) = Z, ((Figure [Z]).size()) = (Figure [U])]
# [<>, <>]
```
A non-square product is two occurrences of one three-cell row, and both
positions are the same `row3`. Manyness sees two rows, while Size counts six
```
; .rectangle23 (row2.mul row3);
; [rectangle23 = (Figure [row3, row3]), (rectangle23.children .0) === row3, (rectangle23.children .1) === row3]
# [<>, <>, <>]
; [(rectangle23.many()) = row2, (rectangle23.size()) = (Figure [U, U, U, U, U, U])]
# [<>, <>]
```
Size takes construction to joining and multiplication to `size_mul`, so both
recipes respect `≈`; the checks also use differently nested, equal-Size inputs
```
; [((Figure [row2, row3]).size()) = (Figure [U, U, U, U, U]), (rectangle23.size()) = ((row2.size()).size_mul (row3.size()))]
# [<>, <>]
; .deep2 (Figure [Figure [row2]]); .deep3 (Figure [Figure [Figure [row3]]]);
; [row2.size_equivalent deep2, row3.size_equivalent deep3, (Figure [row2, row3]).size_equivalent (Figure [deep2, deep3]), (row2.mul row3).size_equivalent (deep2.mul deep3)] = [U, U, U, U]
# <>
```
Tallies are the natural numbers in unary, so induction gives every semiring law
on tallies, and transport along Size gives them on `F/≈`. The raw product is not
commutative: `row2` by `row3` is two rows of three, `row3` by `row2` three rows
of two, and they agree only in Size. These instances witness each law without
replacing the proof
```
; [(row2.mul row3) = (row3.mul row2), ((row2.mul row3).size_equivalent (row3.mul row2)) = U]
# [(), <>]
; [(Figure [Z, row2]).size_equivalent row2, (Figure [row2, Z]).size_equivalent row2, (U.mul row2).size_equivalent row2, (row2.mul U).size_equivalent row2] = [U, U, U, U]
# <>
; [(Figure [Figure [row2, row3], row4]).size_equivalent (Figure [row2, Figure [row3, row4]]), (Figure [row2, row3]).size_equivalent (Figure [row3, row2])] = [U, U]
# <>
; (((row2.mul row3).mul row4).size_equivalent (row2.mul (row3.mul row4))) = U
# <>
; [(row2.mul (Figure [row3, row4])).size_equivalent (Figure [row2.mul row3, row2.mul row4]), ((Figure [row2, row3]).mul row4).size_equivalent (Figure [row2.mul row4, row3.mul row4])] = [U, U]
# <>
; [(Z.mul row3).size_equivalent Z, (row3.mul Z).size_equivalent Z] = [U, U]
# <>
```
## Sameness and Withness

Sameness of form is `=` and sameness of the constructed Figure is `===`
```
; .B2 (Figure [A]);
; [B.sameform B2, B.sameness B, B.sameness B2, (E.children .0).sameness A] = [B, B, A, B]
# <>
```
Withness asks whether every requested Figure is an immediate child of the
receiver, by identity rather than form: `B` is reused under both `E` and `F`,
while the separately constructed `B2` is a child of neither. An empty parent
holds nothing, and every one of no Figures is a child of any parent
```
; [E.withness [A, B], F.withness [A, B], G.withness [E, F], E.withness [B2]] = [B, A, B, A]
# <>
; [A.withness [B], B.withness []] = [A, B]
# <>
```
## The Fano plane

Seven originals of identical form, each a fresh `Figure []`, and seven triples
of identical form `[[], [], []]`. The incidence lives only in which originals
each triple reuses, so only Withness, by identity, can see it. `b_copy` equals
every original in form and is a child of no triple
```
; .a (Figure []); .b (Figure []); .c (Figure []); .d (Figure []); .e (Figure []); .f (Figure []); .g (Figure []);
; .originals (Figure [a, b, c, d, e, f, g]);
; .abd (Figure [a, b, d]); .bce (Figure [b, c, e]); .cdf (Figure [c, d, f]);
; .deg (Figure [d, e, g]); .efa (Figure [e, f, a]); .fgb (Figure [f, g, b]); .gac (Figure [g, a, c]);
; .fano (Figure [abd, bce, cdf, deg, efa, fgb, gac]);
; .Three (Figure [U, U, U]); .b_copy (Figure []);
; [(originals.many()) = (fano.many()), (fano.children & {_.many()}) = (fano.children & {Three})]
# [<>, <>]
; [abd = bce, abd === bce, b = b_copy, b === b_copy]
# [<>, (), <>, ()]
; [abd.withness [a, b, d], abd.withness [a, c], abd.withness [b_copy]] = [B, A, A]
# <>
```
`on` answers one Withness mark per triple, so its Size counts the triples that
hold every requested original. Over every ordered pair, generated rather than
listed, two distinct originals lie in exactly one triple and each lies in three
```
; .on {.points _; Figure (fano.children & {_.withness points})};
; .point_table (originals.children & {.p _; originals.children & {(on [p, _]).size()}});
; point_table = (originals.children & {.p _; originals.children & {(p === _) ? {Three} : {Figure [U]}}})
# <>
```
Dually, `meet` counts the originals two triples share: multiplying their two
Withness marks leaves one cell exactly when both hold it. The two tables are
equal, which is the plane's self-duality
```
; .meet {.lines _; (Figure (originals.children & {.o _; ((lines .0).withness [o]).mul ((lines .1).withness [o])})).size()};
; .line_table (fano.children & {.l _; fano.children & {meet [l, _]}});
; [line_table = (fano.children & {.l _; fano.children & {(l === _) ? {Three} : {Figure [U]}}}), point_table = line_table]
# [<>, <>]
```
`a, b, c, f` are four originals with no three in a triple
```
; ([[a, b, c], [a, b, f], [a, c, f], [b, c, f]] & {(on _).size()}) = [Z, Z, Z, Z]
# <>
```
## Closure

Every answer is a Figure, so it can be observed again or become a child, and
observing does not mutate, even with a local name inside a map
```
; [((E.many()).many()) = (E.many()), ((Figure [E.many(), F.size()]).size()) = row4]
# [<>, <>]
; .E5 (Figure [A, Figure [A]]);
; E5.children & {.o _; o};
; [E5 = (Figure [A, B]), A = (Figure [])]
# [<>, <>]
```
## Names

A bare name inside a block that a map applies to Figures reads each Figure's
own members first (spec 7), so it cannot reach the method's. That is why a
method names its own Figure `_^` and binds `kids` before its blocks read it
```
; (E.children & {children}) = [A.children, B.children]
# <>
```
A method's own locals come ahead of any binding where it is called, and a
Figure passed as an argument contributes only its members, never the names of
the scope that built it. The Fano plane above already binds `f`, the name
Withness uses inside its blocks; these bind the other locals
```
; .kids 9; .y 9; .cells 9; .found 9; .absent 9;
; [(E.withness [A, B]) = B, (row2.mul row3) = rectangle23, (E.size()) = (Figure [U])]
# [<>, <>, <>]
```
## What HC does not yet give the class

A method's free names resolve first in the scope its receiver was read from,
ahead of the scope that built the method (#382 H11). So a scope that binds its
own `B` and reads a Figure by name there gets that `B` back from Manyness. An
importer that binds `Figure`, `A`, `B`, `U`, `Z` or `Tally` must not read
Figures by name in the same scope
```
; .theB B;
; .rebinds {.B 5; .mine (Figure [A]); ((mine.many()).children .0) === theB};
; rebinds()
# $!.unimplemented <>
```
`_^` is the lexical construction target, so an instance copy, which a
functional update takes of every Figure it reaches, keeps the original's
methods and observes the original. Nothing here copies a Figure: application
constructs, and `Tally` answers a new `Tally` rather than writing
```
; .keeper [.fig (Figure [A]); .touch_ {@fig fig;}];
; .touched (keeper.touch_ ());
; ((touched.fig).sameness (touched.fig)) = B
# $!.unimplemented <>
```
`(x)` is `x`, so `Figure (B)` collects B's elements, of which an object with
only properties has none. Write `Figure [B]`
```
; [(Figure (B)) = A, (Figure [B]) = C]
# [<>, <>]
```
Importing this file answers its last form, which the hosts' smoke tests read,
so the file ends on a claim that no gap fix can flip
```
; (Figure [A, B]) = E
# <>
