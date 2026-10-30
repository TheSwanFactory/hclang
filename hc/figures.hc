#!/usr/bin/env hc
```
Figures are native frames (#454; issue occurrence/figure 010.02)

A Figure is a finite, property-free nested array built from `[]`. Construction
is brackets, form is the value itself, immediate size is `.#`, terminal count
is `.##`, form equality is `=`, and identity is `===`. The empty frame is one
terminal: `[].#` is 0 and `[].##` is 1. The signed residual `.###` is
`x₁.## − x₂.## + x₃.## − …` over the immediate elements, a FrameInt that is 0
for `[]` (issue occurrence/figure 010.04).

There are no Figure constructors, marks, tally observers, count aliases or
comparison wrappers. Use native operations directly. Multiplication that places
y once per terminal of x is `x.## [y]`. A tally, when wanted, is an explicit
construction, such as `x & {[[]]}` for one fresh mark per immediate element.
Native `.##` also counts atoms in mixed trees; this module's traversals stay
within the Figure domain so reconstruction cannot silently discard properties.

Only operations that add a traversal or calculation remain: `inlay`, `withness`, `gap` and `spin`, with `pure` and `need` for domain validation.
The traversals validate at their public boundary; their recursive steps use
native operations directly. Withness returns a native boolean, `<>` or `()`.
```
```
Supported domain: `pure x` accepts property-free nested arrays and rejects
atoms, strings and property-bearing frames.
```
.pure {.x _;
  .go {.n _;
    (n = []) ? {<>} : {
      .rebuilt (n & {.e _; e});
      (rebuilt = n) ? {(n &| {(go _) ? {[]} : {[0]}}) = []} : {()}}};
  go x};
```
`need x` returns a supported frame itself, or a native refusal.
```
.need {.x _; (pure x) ? {x} : {unsupported-figure}};
```
`inlay x y` replaces every terminal of x with y, retaining nonterminal nesting.
The replacement is reused by identity; ancestors are freshly constructed.
The host is validated once, and the replacement can be any native value.
```
.inlay {.x _; .host x;
  (pure host) ? {
    {.y _;
      .go {.n _; (n = []) ? {y} : {n & {go _}}};
      go host}} : {
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
immediate elements' `.##` counts. The empty frame has Gap 0.
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
# [<>, <>, (), ()]
; [(need e) = e, (need e) === e]
# [<>, <>]
; inlay [.k 1; []] [[]]
# $!.name-missing “$:Frame.0.unsupported-figure”;
; inlay 5 [[]]
# $!.name-missing “$:Frame.0.unsupported-figure”;
; gap [.k 1; [[], []]]
# $!.name-missing “$:Frame.0.unsupported-figure”;
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
positive. It refuses anything that is not a Figure.
```
; [[].###, [[]].###, [[], []].###, [[], [[], []]].###, [[[], []], []].###]
# [0, 1, 0, -1, 1]
; [[], [[], []], [[], [], []]].###
# 2
; [([].###) == (0 - 0), ([[]].###) == (1 - 0), ([[]].###) == 1]
# [<>, <>, ()]
; [[[], [[]]], [[[], []], []], [[[[], [], []]]]].###
# 2
; [1, []].###
# $!.unsupported-figure .###
; [.k 1; []].###
# $!.unsupported-figure .###
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
