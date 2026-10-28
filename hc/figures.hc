#!/usr/bin/env hc
```
Figures (#382, #395)

Relational Construction Theory has one generative operation: construct a Figure
out of zero or more already constructed Figures, its children. This module
ports History 005.30c, "The Figure class as idiomatic HC", in
`quilt+s3://protology#package=occurrence/history`.

`Figure` is a constructor closure, and the object it returns is the class: each
method below is documented by the paragraph above it. A paragraph ends in `;`,
so it is a statement of the object rather than one of its elements, and it
never affects `=`. Every observer answers a Figure, never a number or a
Boolean: `A`, with no children, means no, and `B` means yes. So every answer can
be a child, a receiver, or an argument, and the class is closed under its own
methods. Only Cells, Form and Text leave the class, on purpose: Cells answers
a plain array of Figures, Form a bracket tree, and Text spells one, for reading
a Figure rather than computing with it.

Three observers share one form: a stream, a mark for each thing in it, and one
construction. Manyness marks each child, Size marks each cell, and
Multiplication puts y at each cell. They are fewer than three constructions:
Size is Multiplication by the unit, and Tally multiplication is Multiplication
of a Manyness, so Multiplication holds the only zero guard. No observer
computes: an observer may count, and may construct n things for a count n, but
it never does arithmetic on counts (#435). A tally reads as a number because
its children are an aggregate, so
`(x.size()).children.#` is the FrameCount it spells, as `(x.cells()).#` is, and
`x.children.#` counts x's children. A Figure's own `.#` and `.##` are `0`,
because its children are a property rather than its elements (#407, #411).
v0.22.0 counted cells and built from the count, but Tally multiplication also
multiplied two counts (#414). v0.24.0 removed the counting along with the
arithmetic (#415), and v0.26.2 restores the counting alone (#435). Before
v0.22.0, Size joined its children's Sizes one unit at a time through a helper.

Three Figures play the roles of zero and one, and keeping them apart is what
the guards below are for. `Z` is zero. `U` is the unit cell that Size counts.
`Figure [U]` is the tally one, the Size of `U`. `U` is itself `Figure [Z]`,
one row of nothing, so wrapping zero in one Figure makes a cell: construction
of two or more Figures adds, and construction of one wraps (#415).

A method names its own Figure `_^`, because a bare name is looked up on the
argument first (spec 7), and the argument is usually another Figure. For the
same reason, a block inside a method reads only names the method bound
```
.Figure {[
```
**Children.** `Figure [c, …]` keeps exactly the Figures in the bracket, in
order, each one itself rather than a copy, so `(x.children .0) === c`
```;
  .children (_ | []);
```
**Application**, `x y` (#375): x's children followed by y. It is a mutating
method, `apply_`, so through a name, `x y` is a functional update: it answers a
new Figure and leaves x unchanged. A reduce writes only the Figure its own
first step answered, so `ys | x` joins two Figures, copying x once, and
`cs | (Figure [])` constructs one out of a stream. It forgets nothing
```;
  .apply_ {@children (_^.children _);};
```
**Manyness**, `x.many()`: a tally with one mark `B` per immediate child. It
keeps how many children there are and forgets what they are, everything below
them, their order and their identity
```;
  .many {Figure (_^.children & {B})};
```
**Size**, `x.size()`: a tally with one unit cell `U` per cell, as Manyness has
one mark per child. That is Multiplication by `U`, which puts a `U` at every
cell. It keeps the cell count and forgets shape, nesting, order, reuse and
identity
```;
  .size {_^.mul U};
```
**Cells**, `x.cells()`: the cells of x, in order, each one itself. Any Figure
shaped like `U` is a cell, and every other Figure's cells are its children's,
spliced into one array by `&|` (#421). The unit case comes first, because a
unit's only child is `Z`. When every child is already a cell, the cells are the
children themselves. Cells sees that by comparing the children with as many
units, which counts rather than walks, so a tally answers at once. It keeps the
cells and their order, and forgets where they were. A block in a method counts
carets lexically, so the cell itself is `_^^` inside the branch
```;
  .cells {.kids _^.children;
    (kids = U.children) ? {[_^^]} : {(kids = ((kids.#) [U])) ? {kids} : {kids &| {_.cells()}}}};
```
**Multiplication**, `x.mul y`: y at every cell of x, and `Z` when y is `Z`. It
counts x's cells and constructs y that many times, so it keeps y's identity in
every position and forgets x's shape. Without the guard, a one-cell x would
answer `Figure [Z]`, which is a cell rather than zero
```;
  .mul {.y _; .n ((_^.cells()).#); (y = Z) ? {Z} : {Figure (n [y])}};
```
**Tally multiplication**, `x.size_mul y`: the Size of a Figure holding y once
per child of x, and `Z` when y is `Z`. Manyness marks each child with `B`,
which is `U`, so it is a tally of the children, and multiplying it by y holds y
once per child. Multiplication's guard answers `Z` for a zero factor, so this
needs no guard of its own. It keeps the cell count and forgets both shapes
```;
  .size_mul {((_^.many()).mul _).size()};
```
**Size-equivalence**, `x.size_equivalent y`: `U` when the two Sizes are the
same tally and `Z` otherwise. It keeps only whether the cell counts agree
```;
  .size_equivalent {((_^.size()) = (_.size())) ? {U} : {Z}};
```
**Sameness of form**, `x.sameform y`: `B` when `x = y`. It compares child by
child and forgets identity and reuse
```;
  .sameform {(_^ = _) ? {B} : {A}};
```
**Sameness**, `x.sameness y`: `B` when `x === y`, the same constructed Figure.
It keeps identity only and forgets form
```;
  .sameness {(_^ === _) ? {B} : {A}};
```
**Withness**, `x.withness [f, …]`: `B` when every f is an immediate child of x,
the same Figure rather than an equal-looking one. It is relative to one parent,
the receiver, and forgets the children's order, repeats, and everything below
them. A requested Figure is absent when no child is identical to it
```;
  .withness {.kids _^.children;
    .absent (_ &| {.f _; ((kids &| {(_ === f) ? {[f]}}) = []) ? {[f]}});
    (absent = []) ? {B} : {A}};
```
**Gap**, `x.gap()`: the alternating sum of the Sizes of x's immediate children,
`Size(F₁) − Size(F₂) + Size(F₃) − …`, read as a FrameCount. The empty Figure
has Gap `0`, and each child contributes its existing Size with a sign that
starts positive and flips child by child. Nesting reaches a child only through
that Size, never through its construction. Gap observes rather than constructs,
so like Cells, Form and Text it leaves the class on purpose: a count can be
negative and no Figure is, and signed difference needs reading as a number
rather than a tally (#445). It reads each child's Size the way the semiring
examples do, as `(_.size()).children.#`, and folds those readings with native
arithmetic without touching construction, so it never asserts arithmetic
equations or actual closure: a zero Gap is an observed value, not a proof. `_^`
names the receiver so the alternating fold can read the children in order; the
fold subtracts the Gap of the rest, which flips the sign of every later child
```;
  .gap {.kids _^.children;
    .count {(_.size()).children.#};
    .tail {(_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) &| {_}};
    .alt {.cs _; (cs = []) ? {0} : {(count (cs .0)) - (alt (tail cs))}};
    alt kids};
```
**Form**, `x.form()`: the plain bracket tree of x, one bracket per Figure, the
way 005.30c wrote Figures before they were a class. It keeps shape and order,
and forgets identity and the methods
```;
  .form {_^.children & {_.form()}};
```
**Text**, `“” x`: the form spelled as text, so a Figure interpolates as
`[[], [[]]]` rather than as every method it declares (#398). Printing x still
shows its full spelling, which reads back
```;
  .toText {“” (_^.form())}
]};
```
**The marks.** The observers answer `A`, the Figure with no children, for no
and `B`, the Figure holding `A`, for yes. Size counts in the same two: `Z`
reuses `A` as the additive zero and `U` reuses `B` as the unit cell. The class
reads all four, so they are declared with it rather than in the examples below
```
.A (Figure []); .B (Figure [A]); .Z A; .U B;
```
## Construction

The example family reuses one `A` under both `B` and `E`. Indexing reaches a
child itself, not a copy
```
; .C (Figure [B]); .D (Figure [C]);
; .E (Figure [A, B]); .F (Figure [B, C]); .G (Figure [E, F]);
; [(G.children .0) === E, (E.children .1) === B, (F.children .0) === B, (E.children .0) === (B.children .0)]
# [<>, <>, <>, <>]
```
Form is the bracket tree a Figure is built as, and text spells it
```
; [(E.form()) = [[], [[]]], (E.form()) = [A.form(), B.form()], ((Figure []).form()) = []]
# [<>, <>, <>]
; [(“” E) = “[[], [[]]]”, (“G is ” G) = “G is [[[], [[]]], [[[]], [[[]]]]]”]
# [<>, <>]
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
Repetition applies a Figure rather than concatenating, because a Figure
declares its application: `3 U` is `(U U) U`, and each child it appends is `U`
itself. U is the operand, never the receiver written
```
; [(3 U) = ((U U) U), ((3 U).children .0) === Z, ((3 U).children .2) === U, U = (Figure [Z])]
# [<>, <>, <>, <>]
```
So `n U` is not the tally n. Repetition starts from nil, so its first step
answers U itself, whose child is `Z`, and `3 U` holds `Z` and two units. A tally
starts from zero instead: join n units onto `Z`, or construct them. Repetition
keeps nil as its start, because a declared zero would be a new protocol point
with this one use (#415)
```
; [((3 U).size()).children.#, (((3 [U]) | Z).size()).children.#, ((3 [U]) | Z) = (Figure (3 [U]))]
# [2, 3, <>]
```
A join copies its receiver once and appends in place after that, so it is
quick, and the receiver and every child keep their identity. Each step still
copies the children it has so far, because a collect through a name always lands
on a fresh array (#386). That keeps a join quadratic in pointer copies, about
0.2 s for 4,096 units, and the observers never join: they construct from a
stream in one step (#415)
```
; .joined ((512 [U]) | Z);
; [joined.children.#, Z = (Figure []), (joined.children .511) === U]
# [512, <>, <>]
; [(E.children & {_ A}) = [Figure [A], Figure [Z, A]], A = (Figure []), B = (Figure [A])]
# [<>, <>, <>]
```
## Manyness and Size

Manyness marks the immediate children and looks no deeper
```
; [(A.many()) = A, (E.many()) = (Figure [B, B]), (G.many()) = (E.many()), (E.many()) = (B.many())]
# [<>, <>, <>, ()]
```
Size is recursive cell volume. `Z` is `A` and `U` is `B`, the same mark
Manyness uses, so a count is itself a Figure of units. Size marks each of the
cells Cells finds, as Manyness marks each child. Cells tests form, so any Figure
shaped like `U` is a cell
```
; [Z === A, U === B]
# [<>, <>]
; [(Z.size()) = Z, (U.size()) = (Figure [U]), ((Figure [U]).size()) = ((Figure [Figure [A]]).size())]
# [<>, <>, <>]
; .row2 (Figure [U, U]); .row3 (Figure [U, U, U]); .row4 (Figure [U, U, U, U]);
; .deep4 (Figure [Figure [Figure [row4]]]); .two_fours (Figure [row4, row4]);
; [(row4.size()) = row4, (deep4.size()) = row4, (two_fours.size()) = (row4.children | row4)]
# [<>, <>, <>]
; [(row4.many()) = (row4.size()), (deep4.many()) = (deep4.size()), (two_fours.many()) = row2]
# [<>, (), <>]
```
Tallies add without a helper: the Size of a Figure holding two tallies joins
them, and two `Z`s add to `Z`. Add two at a time, because two children are
never shaped like `U`. One child can be: `Figure [Z]` has the form of `U`, so
its Size is one cell, the rule that makes Multiplication guard `Z`, for
itself and for Tally multiplication
```
; [((Figure [row2, row3]).size()) = (row3.children | row2), ((Figure [Z, Z]).size()) = Z, ((Figure [Z]).size()) = (Figure [U])]
# [<>, <>, <>]
```
Size constructs its answer, so a Figure with no cells has a Size equal to `Z`
in form but not `Z` itself: having no cells and being zero are different facts,
and Size promises the first. Every unit of a Size is `U` itself
```
; [(Z.size()) = Z, (Z.size()) === Z, ((Figure [Z, Z]).size()) = Z, ((U.size()).children .0) === U]
# [<>, (), <>, <>]
```
A tally is its own Size, so Size is idempotent
```
; ((two_fours.size()).size()) = (two_fours.size())
# <>
```
Construction from a stream is linear, so a large Size is quick: 256 cells,
built by Multiplication
```
; .row16 (row4.mul row4); .row256 (row16.mul row16);
; [(row256.size()).children.#, ((row256.size()).children .255) === U]
# [256, <>]
```
A tally reads as a natural number, because its children are an aggregate and
`.#` counts them. A Figure's own `.#` and `.##` are `0`: its children are a
property, not its elements, and `.##` counts only what is not an aggregate
```
; [E.children.#, (E.many()).children.#, (two_fours.size()).children.#, E.#, E.##, E.children.##] = [2, 2, 8, 0, 0, 0]
# <>
```
A tally built by repetition is its own cells and its own Size, and every cell
is `U` itself. Multiplication of it constructs y once per cell, each one y
itself. A Figure whose children are not all cells is still walked
```
; .rep (Figure (6 [U]));
; [(rep.cells()) = rep.children, ((rep.cells()) .5) === U, (rep.size()) = rep, (rep.mul row2) = (Figure (6 [row2])), ((rep.mul row2).children .5) === row2]
# [<>, <>, <>, <>, <>]
; [((Figure [row2, U]).cells()) = [U, U, U], (((Figure [row2, U]).cells()) .2) === U]
# [<>, <>]
```
Zero is a quotient of zeros. A Figure made of nothing, or of several nothings,
has no cells and a Size of `Z`'s form, but it is not `Z`, and it keeps its own
form
```
; [((Figure [Z, Z]).cells()) = [], ((Figure [Z, Z]).size()) = Z, (Figure (0 [U])) = Z, (Figure (0 [U])) === Z, (Figure [Z, Z]) = Z]
# [<>, <>, <>, (), ()]
```
Cells answers the cells themselves, in order, wherever they were nested, and
`.#` reads how many there are, as it reads a tally
```
; [(E.cells()) = [B], ((E.cells()) .0) === B, (deep4.cells()) = row4.children, (Z.cells()) = [], ((U.cells()) .0) === U]
# [<>, <>, <>, <>, <>]
; [(two_fours.cells()).#, (deep4.cells()).#, (two_fours.size()).children.#] = [8, 4, 8]
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
That exception is the price of a unit defined by form, and the module pays it
on purpose (#415). Construction of two or more Figures adds, and construction
of one wraps: wrapping keeps the Size of anything that is not shaped like zero,
and wrapping zero makes a cell. Counting cells by identity instead, as `_^ === U`,
would remove both guards, but a separately built `Figure [Figure []]`, equal to
`U` in every child, would then have no cells, so Size would no longer be a
function of form. Tried against the 55 claims this file held at v0.24.0,
identity cells failed only the three that say a form-equal unit is a cell
```
; [(Figure [row2]).size_equivalent row2, (Figure [Z]).size_equivalent U, (Figure [Z]).size_equivalent Z] = [U, U, Z]
# <>
; .U2 (Figure [Figure []]);
; [U2 = U, U2 === U, (U2.size()) = (U.size())]
# [<>, (), <>]
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
recipes respect `≈`; the checks also use differently nested, equal-Size inputs.
Size, `size_mul` and `size_equivalent` all construct, and none counts, so every
check here and below compares two constructions (#415)
```
; [((Figure [row2, row3]).size()) = (Figure [U, U, U, U, U]), (rectangle23.size()) = ((row2.size()).size_mul (row3.size()))]
# [<>, <>]
```
Size is Multiplication by the unit, and Tally multiplication is Multiplication
of a Manyness, whatever the nesting
```
; [(row2.size()) = (row2.mul U), (deep4.size()) = (deep4.mul U), (Z.size()) = (Z.mul U)]
# [<>, <>, <>]
; [(row2.size_mul row3) = (((row2.many()).mul row3).size()), (deep4.size_mul row3) = (((deep4.many()).mul row3).size())]
# [<>, <>]
```
At a zero factor both recipes answer `Z`, a one-cell factor included
```
; [(U.size_mul Z) = Z, ((Figure [U]).size_mul Z) = Z, ((U.mul Z).size()) = ((U.size()).size_mul (Z.size()))]
# [<>, <>, <>]
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
```
Read as natural numbers, Size takes construction to `+` and multiplication to
`*`, so the same laws hold of FrameCount arithmetic, where they are native.
Each side reads a tally that was constructed, so the reading checks the
construction rather than replacing it
```
; [((Figure [row2, row3]).size()).children.# = (((row2.size()).children.#) + ((row3.size()).children.#)), (rectangle23.size()).children.# = (((row2.size()).children.#) * ((row3.size()).children.#)), (rectangle23.size()).children.# = 6]
# [<>, <>, <>]
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
## Gap

Gap reads the Sizes of a Figure's immediate children and folds them with
alternating signs, `Size(F₁) − Size(F₂) + Size(F₃) − …`, starting positive. It
observes rather than constructs, so it answers a FrameCount, which can be
negative where no Figure is, and the empty Figure has Gap `0`. One child is its
own Size, so `A` and `U` both have Gap `0` because `U`'s one child `Z` has Size
`0`, while a Figure holding `row2` has Gap `2`. Two children are the first Size
less the second
```
; [(A.gap()) = 0, (U.gap()) = 0, ((Figure [row2]).gap()) = 2, ((Figure [row2, row3]).gap()) = (2 - 3)]
# [<>, <>, <>, <>]
```
Each child contributes its existing Size, so nesting reaches a child only
through that Size: a one-child Figure's Gap is that child's Size whatever its
nesting, and `deep4` nests `row4` to Size 4. The minimal witness is three
children of Sizes 2, 5 and 3, whose Gap is `0`; the Sizes come from ordinary
Figures and `row5` is one of Size 5
```
; .row5 (Figure [U, U, U, U, U]);
; [(row5.size()).children.# = 5, ((Figure [row2, row5, row3]).gap()) = 0, ((Figure [row4]).gap()) = 4]
# [<>, <>, <>]
; [((Figure [row2, row5, row3]).gap()) = (((row2.size()).children.#) - ((row5.size()).children.#) + ((row3.size()).children.#))]
# [<>]
```
Gap is signed and order matters: reordering the same three children changes it,
and it is an observation only, never a claim that a Walk is closed
```
; [((Figure [row2, row3, row5]).gap()) = 4, ((Figure [row5, row2, row3]).gap()) = 6, ((Figure [row3, row2, row5]).gap()) = 6]
# [<>, <>, <>]
```
A child's own Size decides its contribution, so a child built differently but of
equal Size contributes the same, and construction, observation and
interpretation stay apart: Gap reports a number, not a meaning
```
; [((Figure [deep4, row2, row3]).gap()) = ((Figure [row4, row2, row3]).gap()), ((Figure [Z, U]).gap()) = (0 - 1)]
# [<>, <>]
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
Read as natural numbers, the table counts three on the diagonal and one
everywhere else
```
; (point_table & {_ & {_.children.#}}) = (originals.children & {.p _; originals.children & {(p === _) ? {3} : {1}}})
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
## Reading the methods

A method read through a Figure walks as the atoms of its body, unevaluated
(#429), so the module can read what an observer is built from. Size is
Multiplication by the unit, and its body says so
```
; (E.size) & {“” _}
# [“_^”, “.mul”, “U”]
```
## Names

A bare name inside a block that a map applies to Figures reads each Figure's
own members first (spec 7), so it cannot reach the method's. That is why a
method names its own Figure `_^` and binds `kids` or `n` before its blocks read
it
```
; (E.children & {children}) = [A.children, B.children]
# <>
```
A method's own locals come ahead of any binding where it is called, and a
Figure passed as an argument contributes only its members, never the names of
the scope that built it. The Fano plane above already binds `f`, the name
Withness uses inside its blocks; these bind the other locals
```
; .kids 9; .y 9; .n 9; .cells 9; .found 9; .absent 9;
; [(E.withness [A, B]) = B, (row2.mul row3) = rectangle23, (E.size()) = (Figure [U]), (row2.size_mul row3) = (rectangle23.size())]
# [<>, <>, <>, <>]
```
A method's free names resolve where the method was written, never where its
receiver was read (#400). So a scope that binds its own `B` and reads a Figure
by name there still gets the class's `B` back from Manyness
```
; .theB B;
; .rebinds {.B 5; .mine (Figure [A]); ((mine.many()).children .0) === theB};
; rebinds()
# <>
```
## Functional updates

A mutating method reached through an immutable handle is a functional update,
and it copies only what it writes (#401). A Figure the receiver holds is never
written, so the result holds the very same Figure, and identity observers
answer about it
```
; .keeper [.fig E; .touch_ {@fig fig;}];
; .kept ((keeper.touch_ ()).fig);
; [kept === E, (kept.children .0) === A]
# [<>, <>]
; [kept.sameness kept, kept.withness [kept.children .0]] = [B, B]
# <>
```
A write that constructs answers a new Figure, which is a Figure like any other
```
; .grower [.fig E; .grow_ {@fig (fig B);}];
; .grown ((grower.grow_ ()).fig);
; [(grown.sameness grown) = B, (grown.withness [grown.children .2]) = B, grown === E]
# [<>, <>, ()]
```
## Spelling

`(x)` is `x`, so `Figure (B)` collects B's elements, of which an object with
only properties has none. Write `Figure [B]`
```
; [(Figure (B)) = A, (Figure [B]) = C]
# [<>, <>]
; (Figure [A, B]) = E
# <>
```
Importing this file skips its examples and answers its last form, which the
hosts' smoke tests read, so the file ends on code that holds however the rest of
it changes
```
B = (Figure [A])
