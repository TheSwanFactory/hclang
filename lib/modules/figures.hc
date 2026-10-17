#!/usr/bin/env hc
```
Figures (#382, #395)

Ported from History 005.30c, "The Figure class as idiomatic HC", in
`quilt+s3://protology#package=occurrence/history`. Relational Construction Theory
has one generative operation: construct a Figure with optional, already
constructed children. Here that operation is a class. `Figure` is a constructor
closure, and `Figure [c, …]` answers a fresh aggregate whose elements are
exactly the Figures in the bracket, in order. Its methods live on the
aggregate's declared parent, so a Figure prints, compares, indexes and iterates
as its children, as the bare bracket of 005.30c did, and it also answers its
observers. Every observer answers a Figure, never a number or a Boolean: `A`
means no and `B` means yes. A method's answer is itself a Figure, so it can be
a child, a receiver, or an argument, and the class is closed under its own
methods.

## Domain

A Figure is a value built by `Figure` at every node. A bare bracket, the answer
of `&` or `| []`, and a printed Figure read back as source are not Figures:
they compare equal but have no methods. Wrap each level with `Figure (…)`. A
binary method takes exactly one Figure, in a bracket. Outside this domain a
method does not refuse: it answers a wrong Figure, or one holding refusals, as
the last section pins. Nothing tests whether a value is a Figure, and nothing
lifts a bracket tree into one, because the naive `.lift {Figure (_ & {lift _})}`
overflows the stack on an atom. Both are left to #360 or an issue of their own.

## Projections

Each projection, from what it reads to what it answers, with what it keeps,
what it forgets, the HC operation it rests on, and a claim below that runs it.
Every input is a Figure in the sense above.

- **Construction**, `Figure [c, …]`: a bracket of zero or more Figures to a
  fresh Figure with exactly those children. Keeps every child's identity and
  their order. Forgets nothing. HC: a collect, `_ | []`, and a declared
  parent, `.^`. Claim: `[Figure [], Figure [A, B, C]]`.
- **Application**, `x y`: a Figure and a Figure to a fresh Figure with x's
  children followed by y. Keeps x unchanged and the identity of x's children
  and of y. Forgets nothing. So `ys | x` joins two Figures, and
  `cs | (Figure [])` constructs a Figure from a stream of Figures. HC: a
  declared `apply` (#375). Claim: `[E B, E]`.
- **Manyness**, `x.many()`: a Figure to a tally, one mark `B` per immediate
  child. Keeps how many children there are. Forgets what they are, everything
  below them, their order, and identity. HC: a map, `&`. Claim:
  `[A.many(), B.many(), E.many()]`.
- **Size**, `x.size()`: a Figure to a tally, one unit cell `U` per cell, where
  any Figure of the form of `U` is a cell and every other Figure adds up its
  children. Keeps the cell count. Forgets shape, nesting, order, reuse and
  identity. A tally is its own Size, and Size takes construction to joining
  and `mul` to `size_mul`. HC: `=`, conditional control, recursion, `&`, and a
  reduce into `Tally Z`. Claim: `two_fours.size()`.
- **Multiplication**, `x.mul [y]`: a Figure and a bracket holding one Figure y
  to a Figure holding y once for every cell of `x.size()`, and `Z` when y is
  `Z`. Keeps y's identity in every position. Forgets x's shape. HC: `&` over
  `x.size()`. Claim: `[(rectangle23 .0) === row3, (rectangle23 .1) === row3]`.
- **Tally multiplication**, `x.size_mul [y]`: a Figure x and a bracket holding
  one Figure y to the Size of a Figure holding one y per child of x. Keeps the
  cell count. Forgets both shapes, order, reuse and identity. HC: `&`, then
  Size. Claim: `(rectangle23.size()) = ((row2.size()).size_mul [row3.size()])`.
- **Size-equivalence**, `x.size_equivalent [y]`: a Figure and a bracket
  holding one Figure to `U` when the two Sizes agree, and `Z` otherwise. Keeps
  only whether the cell counts agree. Forgets everything else about both. HC:
  `=` on the two tallies. Claim: `row2.size_equivalent [deep2]`.
- **Sameness of form**, `x.sameform [y]`: a Figure and a bracket holding one
  Figure to `B` when `x = y`, and `A` otherwise. Keeps form child by child.
  Forgets identity, reuse and the class. HC: `=`. Claim:
  `B.sameform [Figure [A]]`.
- **Sameness**, `x.sameness [y]`: a Figure and a bracket holding one Figure to
  `B` when `x === y`, and `A` otherwise. Keeps identity only. Forgets form. HC:
  `===`. Claim: `B.sameness [Figure [A]]`.
- **Withness**, `x.withness [f, …]`: a Figure and a bracket of zero or more
  Figures to `B` when every f is an immediate child of x, the same Figure and
  not an equal-looking one, and `A` otherwise. It is relative to one parent,
  the receiver. Keeps the identity of x's immediate children. Forgets their
  order, repeats, and everything below them. HC: `&`, `|` and `===`. Claim:
  `E.withness [B2]`.
- **Tally**, `xs | (Tally Z)` read with `.row`: a stream of tallies to a Tally
  whose `row` joins them from `Z`. Keeps the total cell count. Forgets which
  tally each cell came from. A helper receiver, not a Figure. HC: a declared
  `apply` (#375) and a reduce. Claim: `([] | (Tally Z)) .row`.
- **Incidence**, `on [p, …]` and `meet [l, m]`: example projections of the
  Fano construction below, not class methods. `on` takes a bracket of
  originals and answers a Figure of one Withness mark per triple, so its Size
  counts the triples that hold them all. It keeps, triple by triple, whether
  the triple holds every requested original, and forgets its other children.
  `meet` takes a bracket of two triples and answers the Size of the originals
  both hold. It keeps how many there are, and forgets which. Neither reads
  form, which all seven originals share. HC: `&` and `===`, through Withness
  and `mul`. Claim: `point_table = line_table`.

Sameness has three rungs. `=` compares form, child by child, `==` also asks for
the same type at every node, and `===` asks for the same Figure. The class is
not part of a Figure's value: a Figure equals the bracket of its children under
`=` and `==`, and its printed form reads back as that bracket, without methods.

HC supplies, and the class does not derive, child addressing (`.0`),
traversal (`&` and `|`), structural `=` and `==`, identity `===`, closure calls,
recursion, conditional control, fresh allocation, and reference reuse.

## The class

`Figure` collects its argument's elements into a fresh aggregate and installs
`Figure-methods` of that aggregate as its declared parent. The table is built
for each Figure, so inside a method `_` is the method's argument and `__` is
the Figure it belongs to, and each block nested in a method adds one
underscore. A method that relates two Figures takes the second in a bracket,
`x.sameness [y]`. The table is a bracket rather than a group because of
#382 H1, pinned below. The parent is installed by the mutating `adopt_` rather
than written in construction position, because a construction-position `.^`
leaves its echo among the elements, where it would print the whole table and
take index `.0`
```
; .Figure {.adopt_ {.^ _;}; .figure_ (_ | []); .figure figure_; figure_.adopt_ (Figure-methods figure); figure};
; .Figure-methods {[.apply {Figure ((__ | []) _)}; .many {Figure (__ & {B})}; .size {(__ = U) ? {Figure [U]} : {((___ & {_.size()}) | (Tally Z)) .row}}; .mul {.product (Figure ((__.size()) & {__ .0})); ((_ .0) = Z) ? Z : product}; .size_mul {(Figure (__ & {__ .0})).size()}; .size_equivalent {((__.size()) = ((_ .0).size())) ? {U} : {Z}}; .sameform {(__ = (_ .0)) ? {B} : {A}}; .sameness {(__ === (_ .0)) ? {B} : {A}}; .withness {(((_ & {(((___ & {(_ === __) ? {[<>]}}) | []) = []) ? {[<>]}}) | []) = []) ? {B} : {A}}]};
; .Tally {[.row _; .apply {Tally (_ | row)}]};
```
The constructor takes its children in a bracket, so the whole example family is
built with the class, and the same `A` is reused under `B` and `E`
```
; .A (Figure []); .B (Figure [A]); .C (Figure [B]); .D (Figure [C]);
; .E (Figure [A, B]); .F (Figure [B, C]); .G (Figure [E, F]);
; G
# [[[], [[]]], [[[]], [[[]]]]]
; [(G .0) === E, (E .1) === B, (F .0) === B]
# [<>, <>, <>]
```
Any number of children is one bracket. A Figure is equal to the bracket of its
children in form and in type at every node, is a different Figure from a fresh
construction of the same children, and iterates its children
```
; [Figure [], Figure [A, B, C]]
# [[], [[], [[]], [[[]]]]]
; [E = [A, B], E == [A, B], E === (Figure [A, B]), E & {_}]
# [<>, <>, (), [[], [[]]]]
```
A Figure declares its own application (#375). Applying it answers a new Figure
with the argument appended as a child and leaves the receiver alone, so a
reduce into an empty Figure constructs, and a map extends one Figure once per
element
```
; [E B, E]
# [[[], [[]], [[]]], [[], [[]]]]
; [[A, B] | (Figure []), ([A, B] | (Figure [])) = E, ([A, B] | (Figure [])) === E]
# [[[], [[]]], <>, ()]
; [A, B] & (Figure [C])
# [[[[[]]], []], [[[[]]], [[]]]]
```
Manyness is a tally of the immediate children: one mark `B` for each child, so
a count is a row of marks rather than a nest of successors. It maps the children
and looks no deeper
```
; [A.many(), B.many(), E.many()]
# [[], [[[]]], [[[]], [[]]]]
; [(G.many()) = (E.many()), (E.many()) = (B.many())]
# [<>, ()]
```
Size is recursive cell volume, not immediate Manyness. `Z` reuses `A` as the
additive zero and `U` reuses `B` as the unit cell, the same mark Manyness uses.
Size answers a tally, one `U` for every unit cell, so a count is itself a Figure
of units. Joining two tallies is a reduce of one into the other, because
applying a Figure appends. `Tally` is a receiver that declares its own
application: each tally applied to it is joined to the row it holds, and it
answers a new `Tally`. Size maps every immediate child to its Size and reduces
those into `Tally Z`; with no children the reduce answers that seed. The unit
case comes first because its child is `Z`, and it tests form with `=`, so any
Figure shaped like `U` is a unit cell, and Figures built by the constructor at
every node that look equal always have equal Size
```
; .Z A; .U B;
; [Z.size(), U.size()]
# [[], [[[]]]]
; ((Figure [U]).size()) = ((Figure [Figure [A]]).size())
# <>
; .row4 (Figure [U, U, U, U]);
; (row4.size()) = row4
# <>
; .deep4 (Figure [Figure [Figure [row4]]]);
; (deep4.size()) = row4
# <>
; [(row4.many()) = (row4.size()), (deep4.many()) = (deep4.size())]
# [<>, ()]
; .two_fours (Figure [row4, row4]);
; two_fours.size()
# [[[]], [[]], [[]], [[]], [[]], [[]], [[]], [[]]]
; [(two_fours.size()) = (row4 | row4), two_fours.many(), ([] | (Tally Z)) .row]
# [<>, [[[]], [[]]], []]
```
A tally is its own Size, so Size is idempotent: every count it answers
represents the class it names
```
; ((two_fours.size()).size()) = (two_fours.size())
# <>
```
The semiring carrier is not raw Figures under structural or identity equality.
Let `F` be the finite, well-founded Figures made with the constructor, with the
form of `U` as the unit cell, and write `x ≈ y` when `(x.size()) = (y.size())`.
The carrier is the quotient `F/≈`; HC's structural `=` compares the tallies
Size answers. Because Size reads only form, `x = y` implies `x ≈ y`. Its zero
and one are `Z` and `U`. Addition is construction itself, `Figure [x, y]`.
Multiplication maps every cell of `x.size()` to `y`, so a product reuses `y`
once for every cell of `x` while every result remains a Figure. A product by
`Z` is `Z`, because one row of nothing would be `Figure [Z]`, which has the
form of `U` and would count as a cell. On tallies, `size_mul` is the same map
followed by Size
```
; [U.mul [Z], (Figure [Z]).size()]
# [[], [[[]]]]
```
A non-square product is two occurrences of one three-cell row, and both
positions reuse the same `row3`. Manyness sees two rows, while Size counts six
unit cells
```
; .row2 (Figure [U, U]); .row3 (Figure [U, U, U]);
; .rectangle23 (row2.mul [row3]);
; rectangle23 = (Figure [row3, row3])
# <>
; [(rectangle23 .0) === row3, (rectangle23 .1) === row3]
# [<>, <>]
; rectangle23.size()
# [[[]], [[]], [[]], [[]], [[]], [[]]]
```
The defining equations are executable: Size takes construction to joining,
and multiplication to `size_mul`. Therefore both recipes respect `≈`; the
representative checks also use differently nested, equal-Size inputs
```
; [((Figure [row2, row3]).size()) = ((row3.size()) | (row2.size())), (rectangle23.size()) = ((row2.size()).size_mul [row3.size()])]
# [<>, <>]
; .deep2 (Figure [Figure [row2]]); .deep3 (Figure [Figure [Figure [row3]]]);
; [row2.size_equivalent [deep2], row3.size_equivalent [deep3], (Figure [row2, row3]).size_equivalent [Figure [deep2, deep3]], (row2.mul [row3]).size_equivalent [deep2.mul [deep3]]]
# [[[]], [[]], [[]], [[]]]
```
Tallies are the natural numbers in unary, one row of `n` units for each count
`n`, with joining as addition and `size_mul` as multiplication. Induction gives
additive identity, associativity and commutativity; multiplicative identity,
associativity and commutativity; both distributive laws; and both zero
annihilations. Transport along Size proves those laws on `F/≈`. The raw product
is not commutative: it maps over the Size of its receiver and reuses its
argument whole, so `row2` by `row3` is two rows of three, `row3` by `row2` is
three rows of two, and they agree only in Size. These executed instances
witness every law without replacing the inductive proof
```
; [(row2.mul [row3]) = (row3.mul [row2]), (row2.mul [row3]).size_equivalent [row3.mul [row2]]]
# [(), [[]]]
; [(Figure [Z, row2]).size_equivalent [row2], (Figure [row2, Z]).size_equivalent [row2]]
# [[[]], [[]]]
; [(U.mul [row2]).size_equivalent [row2], (row2.mul [U]).size_equivalent [row2]]
# [[[]], [[]]]
; [(Figure [Figure [row2, row3], row4]).size_equivalent [Figure [row2, Figure [row3, row4]]], (Figure [row2, row3]).size_equivalent [Figure [row3, row2]]]
# [[[]], [[]]]
; ((row2.mul [row3]).mul [row4]).size_equivalent [row2.mul [row3.mul [row4]]]
# [[]]
; [(row2.mul [Figure [row3, row4]]).size_equivalent [Figure [row2.mul [row3], row2.mul [row4]]], ((Figure [row2, row3]).mul [row4]).size_equivalent [Figure [row2.mul [row4], row3.mul [row4]]]]
# [[[]], [[]]]
; [(Z.mul [row3]).size_equivalent [Z], (row3.mul [Z]).size_equivalent [Z]]
# [[[]], [[]]]
```
Sameness has two rungs here. Sameness of form is `=`, and sameness of the
constructed Figure is `===`, which 30c recorded as unanswerable in v0.16.0
```
; [B.sameform [Figure [A]], B.sameness [B], B.sameness [Figure [A]], (E .0).sameness [A]]
# [[[]], [[]], [], [[]]]
; .B2 (Figure [A]);
; [B = B2, B == B2, B === B2]
# [<>, <>, ()]
```
Withness asks whether all requested Figures are immediate children of one
parent, the receiver. It uses identity `===`, not equal-looking form: `B` is
reused under both `E` and `F`, while the separately constructed `B2` is not a
child of either
```
; [E.withness [A, B], F.withness [A, B], G.withness [E, F], E.withness [B2]]
# [[[]], [], [[]], []]
```
Both edges follow from the empty reduce answering its receiver. An empty parent
holds nothing, so no Figure is with it; and every one of no Figures is a child of
any parent, so asking about none answers yes
```
; [A.withness [B], B.withness []]
# [[], [[]]]
```
The Fano construction starts with seven Figures of identical form: each original
is a fresh `Figure []`, so all seven triples below have the same form
`[[], [], []]`. The incidence pattern lives only in which originals each triple
reuses, and Withness checks that common immediate containment by identity.
Under structural `=` every original would be a child of every triple. `b_copy`
is one more fresh `Figure []`, equal in form to every original and a child of no
triple
```
; .a (Figure []); .b (Figure []); .c (Figure []); .d (Figure []); .e (Figure []); .f (Figure []); .g (Figure []);
; .originals (Figure [a, b, c, d, e, f, g]);
; .abd (Figure [a, b, d]); .bce (Figure [b, c, e]); .cdf (Figure [c, d, f]);
; .deg (Figure [d, e, g]); .efa (Figure [e, f, a]); .fgb (Figure [f, g, b]); .gac (Figure [g, a, c]);
; .fano (Figure [abd, bce, cdf, deg, efa, fgb, gac]);
; .Three (Figure [U, U, U]);
; [originals.many(), (originals.many()) = (fano.many())]
# [[[[]], [[]], [[]], [[]], [[]], [[]], [[]]], <>]
; (fano & {_.many()}) = (fano & {Three})
# <>
; [abd = bce, abd === bce]
# [<>, ()]
; [a.sameform [b], a.sameness [b], b.sameness [b]]
# [[[]], [], [[]]]
; .b_copy (Figure []);
; [b = b_copy, b.sameness [b_copy]]
# [<>, []]
; [abd.withness [a, b, d], abd.withness [a, c], abd.withness [b_copy]]
# [[[]], [], []]
```
Incidence is a table. `on` answers, for each triple, whether it holds every
requested original, so its Size counts the triples that do. `point_table`
applies it to every ordered pair of originals, generated with the Cartesian
idiom of 005.30b rather than listed, so the check is exhaustive by
construction. Two distinct originals lie in exactly one triple, and each
original lies in three
```
; .on {.points _; Figure (fano & {_.withness points})};
; .point_table (originals & {.p _; originals & {(on [p, _]).size()}});
; point_table = (originals & {.p _; originals & {(p === _) ? {Three} : {Figure [U]}}})
# <>
```
Dually, `meet` counts the originals two triples share. For each original,
multiplying its two Figure-valued Withness answers leaves one cell exactly when
both triples hold it. Two distinct triples share exactly one original, and each
triple holds three. The two tables are equal, which is the plane's
self-duality
```
; .meet {.lines _; (Figure (originals & {.o _; ((lines .0).withness [o]).mul [(lines .1).withness [o]]})).size()};
; .line_table (fano & {.l _; fano & {meet [l, _]}});
; line_table = (fano & {.l _; fano & {(l === _) ? {Three} : {Figure [U]}}})
# <>
; point_table = line_table
# <>
```
Finally `a, b, c, f` are four originals with no three in a triple. All four of
their 3-subsets are listed, and no triple holds any of them
```
; [[a, b, c], [a, b, f], [a, c, f], [b, c, f]] & {(on _).size()}
# [[], [], [], []]
```
Every answer above is a Figure, so the class is closed: a method's answer can
be observed again, and can be a child of a new Figure. Observation does not
mutate, even with a local name inside a map
```
; [((E.many()).many()) = (E.many()), (Figure [E.many(), F.size()]).size()]
# [<>, [[[]], [[]], [[]], [[]]]]
; .E5 (Figure [A, Figure [A]]);
; E5 & {.o _; o};
; [E5, A, E = [A, B]]
# [[[], [[]]], [], <>]
```
005.30b's Cartesian product. The grid is one source element, so reducing it
into an empty Figure appends it once, and the answer has the grid as its sole
child. 30b wrote the receiver as `Figure`, the one-child closure of v0.16.0;
`Figure` now takes its children in a bracket, so the empty Figure is the
receiver that holds what a reduce hands it
```
; .Pa [“a”, “b”]; .Pb [“c”, “d”];
; [(Pa & { Pb & { [__, _] } })] | (Figure [])
# [[[[“a”, “c”], [“a”, “d”]], [[“b”, “c”], [“b”, “d”]]]]
; (([(Pa & { Pb & { [__, _] } })] | (Figure [])).many()) = (Figure [U])
# <>
; (([(Pa & { Pb & { [__, _] } })] | (Figure [])) .0) = (Pa & { Pb & { [__, _] } })
# <>
; ((Figure (Pa & { Pb & { [__, _] } })).many()) = (Figure [U, U])
# <>
```
## What HC does not yet give the class

Outside the domain a method answers a wrong Figure, or one holding refusals,
instead of refusing. A Figure of bare brackets compares equal to the Figure of
`A`s it looks like, but its children have no methods, so its Size holds
refusals. A refusal inside `=` reads as no, so Size-equivalence answers `Z` for
an operand of bare brackets even though both Sizes would be `[U]`. `E & {_}`
answers the bracket of E's children, which equals `E` but is not a Figure. A
binary method reads its operand as `_ .0`, so an operand outside a bracket is
misread: `row2.mul row3` takes `row3 .0` as y, and `E.sameness E` compares `E`
with its first child. A bare Figure operand would also come before the receiver
in name lookup, as `.P {[.X _; .mine {X}]}; (P 1).mine (P 2)` answering `2`
shows
```
; (Figure [[], []]) = (Figure [A, A])
# <>
; (Figure [[], []]).size()
# [$!.name-missing “$:FrameArray...
; [B.size_equivalent [[A]], (E & {_}) = E]
# [[], <>]
; [row2.mul row3, E.sameness E]
# [[[[]], [[]]], []]
```
A method's free names, and the names its blocks read, resolve first in the
scope its receiver was read from, ahead of the scope that built the method
(#382 H11). So a scope that binds its own `B` and reads a Figure by name gets
that `B` back from Manyness. The methods above read no local name from a
nested block, and nothing in this file rebinds the class's names, but an
importer that binds `Figure`, `A`, `B`, `U`, `Z` or `Tally` must not read
Figures by name in the same scope. The pin is a reduction of H11 to this class
```
; .rebinds {.B 5; .mine (Figure [A]); mine.many()};
; rebinds()
# $!.unimplemented [[[]]]
```
An inherited method cannot name the receiver it runs against, because `_^` is
the lexical construction target, which for an inherited method is its parent.
So each Figure's methods find it lexically. An instance copy, which a
functional update takes of every Figure it reaches, keeps the original's
methods and observes the original. Nothing in this file copies a Figure:
application constructs, and `Tally` answers a new `Tally` rather than writing
```
; .keeper [.fig (Figure [A]); .touch_ {@fig fig;}];
; .touched (keeper.touch_ ());
; (touched.fig).sameness [touched.fig]
# $!.unimplemented [[]]
```
A group of declarations inside a closure is evaluated once and reused
(#382 H1), so the method table is a bracket, `{[…]}`. Built as a group, every
Figure would observe the first
```
; .twice {(.a _; .b _;).a};
; [twice 1, twice 2]
# $!.unimplemented [1, 2]
```
A group passes its elements as children when it has two or more, but `(x)` is
`x`, so `Figure (B)` builds a new Figure from B's children instead of one with
B as its child. Write `Figure [B]` (#382)
```
; [Figure (A, B), Figure (B), (Figure (B)) === B, (Figure (B)) = B]
# [[[], [[]]], [[]], (), <>]
```
A taken branch that answers nil falls through to the else branch (#382 item 4,
ruled; pinned in `cli/hc/testdoc.hc`, `5.> 1 ? {()} : {10}` → `10`), so no
method's then-branch answers nil.

Importing this file answers its last form, which the hosts' smoke tests read,
so the file ends on a claim that no gap fix can flip
```
; (Figure [A, B]) = E
# <>
