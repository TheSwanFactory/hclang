#!/usr/bin/env hc
```
Figures as projections of native HC frames (#454; occurrence/figure 010.09)

A figure is a projection of HC frames through which we observe invariants that
embody mathematical relations. This is a working definition: each investigation
specifies its projection, transformations and invariants.

Finite nested arrays built from `[]` are the simplest construction family used
below. They do not define the full domain of native observations. Size, residual
and immediate identity membership exclude properties and declared parents;
Star keeps nonterminal metadata when rebuilding frames. Construction is brackets,
form is the value itself, immediate arity is `.#`, Size is `.##`, form equality
is `=`, and identity is `===`. The empty frame is one terminal: `[].#` is 0 and
`[].##` is 1. The signed residual `.###` is
`x₁.## − x₂.## + x₃.## − …` over the immediate elements, a FrameInt that is 0
for `[]` (issue occurrence/figure 010.04).

There are no Figure constructors, marks, tally observers, count aliases or
comparison wrappers. Use native operations directly. Star `x * y` places y at
each terminal of x, preserving nesting.
Flat repetition is `x.## [y]`. A tally, when wanted, is an explicit
construction, such as `x & {[[]]}` for one fresh mark per immediate element.
Native `.##` uses each child's native Size, including numeric magnitude and
text length. Native `.###` also accepts mixed arrays, groups, and non-schema list syntax/closures. Every other
value with a Count answers its parity (`.# mod 2`, a FrameInt), including valid zero, so equal quantities
observe alike whatever their kind or numeric type; schemas answer nil. `()` has no Count; `<>` observes as `[]`.
Missing Count rules fall back to Size, including sized atoms. Explicit Counts take precedence.
Stored errors and failed child quantities propagate rather than acquiring a load.
Star keeps its narrower array/Count composition domain.

For Counts, Gap and Spin now use parity too: `gap 7` is 1 and `spin 2 4` is 0.

Only two derived mathematical abbreviations remain: Gap = |signed residual|
and Spin = signed residual / positive Count. They define no Figure domain.
Incidence is native `point ~~~ line`; collective incidence uses ordinary
iteration. Observer eligibility is `x.###` itself: a FrameInt, including zero,
is true; an unsupported host answers nil. No `pure`, `need` or `withness`
helper is exported (issue occurrence/figure 010.09).

Gap keeps a FrameInt result. Using `(x.###).##` instead would change the type
to Count and would even give Size 1 for an unsupported host's nil. Test residual
availability directly, then bind its value and choose its sign with native HC.
```
.gap {.x _; (x.###) ? {
  .signed (x.###);
  (signed .< 0) ? {0 - signed} : {signed}} : {unsupported-figure}};
```
Spin retains a typed positive Count divisor. Bare `x.### / N` would accept
negative or fractional divisors and silently answer nil for an unsupported
host. This abbreviation keeps host refusal before divisor validation, Count
type errors, and division-by-zero even for a zero residual. These two short
definitions are mathematical conveniences, not constructors or type guards.
```
.spin {.x _; .host x;
  (host.###) ? {
    {.n <(1).<>> _; .signed (host.###);
      (n .< 1) ? {signed / 0} : {signed / n}}} : {
    {.n _; unsupported-figure}}};
```
Native construction, counting and comparisons need no module helpers.
```
; .a []; .b [[]]; .e [a, b];
; [e.#, e.##, [].#, [].##]
# [2, 2, 0, 1]
; [e = [[], [[]]], e === [a, b], (e .0) === a]
# [<>, (), <>]
; [e.## = [[], []].##, [].## = [[]].##]
# [<>, <>]
```
Native observations need no domain wrapper, enumeration or tally construction.
```
; [([].### ? {<>} : {()}), ([[], [[]]].### ? {<>} : {()}), ([[], 5].### ? {<>} : {()}), ([.k 1; []].### ? {<>} : {()})]
# [<>, <>, <>, <>]
; [(e.### ? {e} : {unsupported-figure}) = e, (e.### ? {e} : {unsupported-figure}) === e]
# [<>, <>]
; [[], “a”] * [[]]
# $!.star-domain *
; (0 - 5) * [[]]
# $!.star-domain *
; gap ([], [[], []])
# 1
```
Properties and declared parents never decide the observer domain or an observation.
Star preserves metadata on rebuilt nonterminal ancestors and leaves its host
unchanged.
```
; [(gap [.k 1; [[], []]]) = 2, [.k 1; [], [[], []]].### = -1]
# [<>, <>]
; ([.k 1; [], [.j 2; []]] * [[]]) = [.k 1; [[]], [.j 2; [[]]]]
# <>
; .p [.k 1; []]; .q (p * [[]]);
; [q = [.k 1; [[]]], p.k, p = [.k 1; []]]
# [<>, 1, <>]
```
Star preserves nesting and empty replacements; native repetition constructs a
flat product. Both have the same terminal count on Figures.
```
; [([] * [[], []]) = [[], []], ([[]] * [[], []]) = [[[], []]]]
# [<>, <>]
; [([[], []] * []) = [[], []], ([[]] * []) = [[]]]
# [<>, <>]
; ([[], [], [[], []]] * “x”) = [“x”, “x”, [“x”, “x”]]
# <>
; .y [[], [], []]; .host [[], [[], []]]; .r (host * y);
; [((r .0) === y), (((r .1) .0) === y), (((r .1) .1) === y), r === host]
# [<>, <>, <>, ()]
; [([[], []] * y).##, ([[], []].## [y]).##]
# [6, 6]
; [([[[], []]].## [[[]]]) = [[[]], [[]]], ([[[], []]] * [[]]) = [[[[]], [[]]]]]
# [<>, <>]
```
Incidence uses immediate identity. These shared frame objects illustrate Fano
incidence (see `hc/membership.hc`; occurrence/figure 010.06), without claiming
that the complete Fano geometry has been derived. Equal form is not incidence.
Collective incidence keeps the absent requested points and asks if none remain;
empty requests are true, repeats need one match, and nested-only points fail.
```
; .shared [[]]; .p1 [shared, []]; .p2 [[], shared];
; [shared ~~~ p1, shared ~~~ p2, [[]] ~~~ p1]
# [<>, <>, ()]
; [[[]] ~~~ [], ([] &| {.f _; (f ~~~ p1) ? {[]} : {[f]}}) = []]
# [(), <>]
; ([shared, shared] &| {.f _; (f ~~~ p1) ? {[]} : {[f]}}) = []
# <>
; ([shared, [[]]] &| {.f _; (f ~~~ p1) ? {[]} : {[f]}}) = []
# ()
; .nested [p1];
; ([shared] &| {.f _; (f ~~~ nested) ? {[]} : {[f]}}) = []
# ()
```
Native `.###` folds the immediate elements' Sizes with alternating
signs, one sign per element, and answers a FrameInt even when it is 0 or
positive. Mixed arrays and evaluated groups use the same rule.
```
; [[].###, [[]].###, [[], []].###, [[], [[], []]].###, [[[], []], []].###]
# [0, 1, 0, -1, 1]
; [[], [[], []], [[], [], []]].###
# 2
; [([].###) == (0 - 0), ([[]].###) == (1 - 0), ([[]].###) == 1]
# [<>, <>, ()]
; [[[], [[]]], [[[], []], []], [[[[], [], []]]]].###
# 2
; [[1, []].###, [[], “ab”].###, [[], ([], [])].###, 5.###]
# [0, -1, -1, 1]
```
Native Size also measures mixed values, independently of structural Star.
Numeric magnitude truncates exactly; text length uses native Unicode code-point iteration,
blob width uses bits, and schemas count declared alternatives.
```
; [(7.9).##, (-7.9).##, (-3).##, (0.9).##, 0.##, (-7 / 2).##]
# [7, 7, 3, 0, 0, 3]
; [“”.##, “hello”.##, “é😀”.##, 0x00ff.##]
# [0, 5, 2, 16]
; [(1).<>.##, <2, 3, 5>.##, <2, 2, [3, 5]>.##, <.a, .b>.##, <>.##]
# [1, 3, 3, 1, 1]
; [[5, “hello”].##, [5, “hello”].###, (5, 3).###, [5, 3, 2, 7].###]
# [10, 0, 2, -3]
; [([5, “hello”].### ? {<>} : {()}), (5.### ? {<>} : {()})]
# [<>, <>]
; { .x <[].<>> _; x.### } [[], [“nested atom”]]
# -10
```
Outer array binding accepts nested atoms, and rejects groups despite their valid
residual. It is neither a recursive array-only constraint nor the residual domain.

Gap is `|x.###|` and Spin is `x.### / N`, including shared branches at every
occurrence. Reversing two unequal branches reverses Spin's sign.
```
; [(gap []) = 0, (gap [[[], []]]) = 2, (gap [[[], []], [[], [], []]]) = 1]
# [<>, <>, <>]
; (gap [[[], []], [[], [], [], [], []], [[], [], []]]) = 0
# <>
; [(spin [[[], []], [[], [], [], [], []]] 4) = (0 - (3 / 4)), (spin [[[], [], [], []], [[], []]] 4) = (2 / 4)]
# [<>, <>]
; [(spin [[[], []]] 1) = 2, (spin [] 4) = 0]
# [<>, <>]
; .z [[[], []], [[], [], [], [], []]];
; [z.###, (gap z) = (0 - z.###), (spin z 4) = (z.### / 4)]
# [-3, <>, <>]
; spin [[[], []]] 2.5
# $!.type-error .n <(1).<>> 2.5
; spin [[[], []]] 0
# $!.division-by-zero /
; [gap [5, “hello”], spin [5, “hello”] 4]
# [0, 0]
; spin [] (0 - 2)
# $!.type-error .n <(1).<>> -2
; spin [] 0
# $!.division-by-zero /

```
Star uses native `*` dispatch; numeric pairs keep arithmetic.
```
; [2 * 3, 2 * [[], []], [[], []] * 3, [] * [[], []]]
# [6, [[[], []], [[], []]], [3, 3], [[], []]]
; [(2 * [[], [], []]).##, ([[], []] * 3).##, (0 * [[]]).##]
# [6, 6, 0]
; [[], [[], []]] * [[]]
# [[[]], [[[]], [[]]]]
; [.tag 1;] * [[]]
# $!.star-metadata *
```
The fourth observer derives a Demi from Count, Size and residual.
A zero Count or absent residual gives no Demi; errors propagate. A schema used
as an explicit element contributes Size normally, even though its own Demi is nil.
A present Demi has Size L+R and residual L−R. Its Count is the least positive
representative of its stored parity: 2 for all/even and 1 for nil/odd. The same
universal derivation therefore reconstructs its data value on repeated fourth
observation, including present zero loads, without a special fourth-hash rule.
A present Demi is an instance of the HC class in `hc/demi.hc` (011.20), and
reads as text `Demi(phase,left,right)`. Applying a Demi to Y deposits Y's Size
and flips the phase, so for a nonempty Figure host X, (X Y).#### is
X.#### Y; for an empty host, start from the zero-load Demi in phase 2 instead,
because [].#### is nil. Scaling is the method `scale_`, the shadow of Star:
(X * Y).#### is X.####.scale_ (Y.##) for a nonempty host. Count is a terminal
quantity: positive Counts agree with pure Figures of that terminal Size, but 0
has Size 0 while [] has Size 1. Mixed values may have present zero-load Demis,
including [0].####.
```
; [[].####, 0.####, “” “hello”.####, <2,3,5>.####]
# [(), (), “Demi((),3,2)”, ()]
; [(10 - 5).#### = 5.####, (0 - 5).#### = 5.####, (5.0).#### = 5.####, “hello”.#### = 5.####]
# [<>, <>, <>, <>]
; [<>.#, <>.##, <>.###, ().##]
# [0, 1, 0, 1]
; [1, 2, 3, 7] & {“” _.####}
# [“Demi((),1,0)”, “Demi(<>,1,1)”, “Demi((),2,1)”, “Demi((),4,3)”]
; [[0], [“hello”], [<2,3,5>,2], {5 + 3}] & {“” _.####}
# [“Demi((),0,0)”, “Demi((),5,0)”, “Demi(<>,3,2)”, “Demi((),8,1)”]
; [“” ([[],[]].#### 3), “” (7.####.scale_ 2), ([[],[]] 3).#### = ([[],[]].#### 3)]
# [“Demi((),4,1)”, “Demi((),8,6)”, <>]

```
Importing skips the examples and ends on a native true value.
```
[] = []
