#!/usr/bin/env hc
```
Figures are native frames (#454; issue occurrence/figure 010.02)

A Figure is a finite nested array built from `[]`, read through its elements
only: properties and declared parents are ignored by observations. Inlay keeps
nonterminal metadata when rebuilding frames. Construction is brackets, form is the value itself, immediate size is `.#`, terminal count
is `.##`, form equality is `=`, and identity is `===`. The empty frame is one
terminal: `[].#` is 0 and `[].##` is 1. The signed residual `.###` is
`x₁.## − x₂.## + x₃.## − …` over the immediate elements, a FrameInt that is 0
for `[]` (issue occurrence/figure 010.04).

There are no Figure constructors, marks, tally observers, count aliases or
comparison wrappers. Use native operations directly. Star `x * y` places y at each terminal of x, preserving nesting.
Flat repetition is `x.## [y]`. A tally, when wanted, is an explicit
construction, such as `x & {[[]]}` for one fresh mark per immediate element.
Native `.##` weights nested counts by their Size and other atoms by one;
native `.###` answers nil on
anything that is not a Figure, so this module's traversals stay in the domain.

Only operations that add a traversal or calculation remain: `inlay`, `withness`, `gap` and `spin`, with `pure` and `need` for domain validation.
The traversals validate at their public boundary; their recursive steps use
native operations directly. Withness returns a native boolean, `<>` or `()`.
```
```
Supported domain: `pure x` accepts nested arrays, ignoring their properties
and declared parents at every level, and rejects atoms, strings, groups, schemas and closures anywhere in them. It is
the native `.###` check: a FrameInt, even 0, is true, and nil is false.
```
.pure {.x _; (x.###) ? {<>} : {()}};
```
`need x` returns a supported frame itself, or a native refusal.
```
.need {.x _; (pure x) ? {x} : {unsupported-figure}};
```
`inlay x y` replaces every terminal of x with y, retaining nonterminal nesting.
The replacement is reused by identity; ancestors are freshly constructed,
preserving their properties and declared parents. A terminal is recognized by
its element count; its replacement is y itself, including y’s metadata.
A terminal with properties, statements or a declared parent is refused by Star rather than
silently losing its metadata. Count hosts use native Star directly: `n * y`
constructs n occurrences for nonnumeric y; `0 * y` is count 0 (Size 0).
Numeric pairs keep numeric multiplication.
The host is validated once, and the replacement can be any native value.
```
.inlay {.x _; .host x;
  (pure host) ? {
    {.y _;
      host * y}} : {
    {.y _; need host}}};
```
`withness x [f, …]` asks whether every requested frame is an immediate element
of x by native identity. It returns a native boolean. No requested frames is true.
```
.withness {.x _; .host x;
  {.fs _;
    .absent (fs &| {.f _; ((host &| {(_ === f) ? {[f]}}) = []) ? {[f]}});
    absent = []}};
```
`gap x` is the absolute value of native `x.###`, the alternating sum of its
immediate elements' `.##` counts, always a nonnegative FrameInt (Owner decision
for #455). The empty frame has Gap 0 as a FrameInt too.
```
.gap {.x _; (pure x) ? {
  .signed (x.###);
  (signed .< 0) ? {0 - signed} : {signed}} : {need x}};
```
`spin x N` keeps the sign of `x.###` and divides by a positive count N.
Non-count N is a type error; zero is division-by-zero. The host is validated
before the resolution is checked.
```
.spin {.x _; .host x;
  (pure host) ? {
    {.n <~~1> _;
      .signed (host.###);
      (n .< 1) ? {signed / 0} : {signed / n}}} : {
    {.n _; need host}}};
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
Native terminal counting needs no enumeration or tally construction.
```
; [(pure []), (pure [[], [[]]]), (pure [[], 5]), (pure [.k 1; []])]
# [<>, <>, (), <>]
; [(need e) = e, (need e) === e]
# [<>, <>]
; inlay [[], 5] [[]]
# $!.name-missing “$:Frame.0.unsupported-figure”;
; inlay 5 [[]]
# $!.name-missing “$:Frame.0.unsupported-figure”;
; gap ([], [[], []])
# $!.name-missing “$:Frame.0.unsupported-figure”;
```
Properties and declared parents never decide the domain or an observation.
Inlay preserves metadata on rebuilt nonterminal ancestors and leaves its host
unchanged.
```
; [(gap [.k 1; [[], []]]) = 2, [.k 1; [], [[], []]].### = -1]
# [<>, <>]
; (inlay [.k 1; [], [.j 2; []]] [[]]) = [.k 1; [[]], [.j 2; [[]]]]
# <>
; .p [.k 1; []]; .q (inlay p [[]]);
; [q = [.k 1; [[]]], p.k, p = [.k 1; []]]
# [<>, 1, <>]
```
Inlay preserves nesting and empty replacements; native repetition constructs a
flat product. Both have the same terminal count on Figures.
```
; [(inlay [] [[], []]) = [[], []], (inlay [[]] [[], []]) = [[[], []]]]
# [<>, <>]
; [(inlay [[], []] []) = [[], []], (inlay [[]] []) = [[]]]
# [<>, <>]
; (inlay [[], [], [[], []]] “x”) = [“x”, “x”, [“x”, “x”]]
# <>
; .y [[], [], []]; .host [[], [[], []]]; .r (inlay host y);
; [((r .0) === y), (((r .1) .0) === y), (((r .1) .1) === y), r === host]
# [<>, <>, <>, ()]
; [(inlay [[], []] y).##, ([[], []].## [y]).##]
# [6, 6]
; [([[[], []]].## [[[]]]) = [[[]], [[]]], (inlay [[[], []]] [[]]) = [[[[]], [[]]]]]
# [<>, <>]
```
Withness uses identity, and its answer is the native boolean.
```
; .shared [[]]; .p1 [shared, []]; .p2 [[], shared];
; [(withness p1 [shared]), (withness p2 [shared]), (withness p1 [[[]]])]
# [<>, <>, ()]
; [(withness [] [[[]]]), (withness [shared] [])]
# [(), <>]
```
Native `.###` folds the immediate elements' terminal counts with alternating
signs, one sign per element, and answers a FrameInt even when it is 0 or
positive. Anything that is not a Figure answers nil.
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
# [(), (), (), ()]
```
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
# $!.type-error .n <~~1> 2.5
; spin [[[], []]] 0
# $!.division-by-zero /
```
Importing skips the examples and ends on a native true value.
```
[] = []

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
