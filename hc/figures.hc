#!/usr/bin/env hc
```
Figures are native frames (#454; issue occurrence/figure 010.02)

A Figure is a finite, property-free nested array built from `[]`. Construction
is brackets, form is the value itself, immediate size is `.#`, terminal count
is `.##`, form equality is `=`, and identity is `===`. The empty frame is one
terminal: `[].#` is 0 and `[].##` is 1.

There are no Figure constructors, marks, tally observers, count aliases or
comparison wrappers. Use native operations directly. Multiplication that places
y once per terminal of x is `x.## [y]`. A tally, when wanted, is an explicit
construction, such as `x & {[[]]}` for one fresh mark per immediate element.
Native `.##` also counts atoms in mixed trees; this module's traversals stay
within the Figure domain so reconstruction cannot silently discard properties.

Only operations that add a traversal or calculation remain: `cells`, `inlay`,
`withness`, `gap` and `spin`, with `pure` and `need` for domain validation.
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
`cells x` lists the native terminal frames, retaining their order and identity.
```
.cells {.x _; (pure x) ? {
  .go {.n _; (n = []) ? {[n]} : {n &| {go _}}};
  go x} : {need x}};
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
`gap x` is the absolute alternating sum of its immediate elements' `.##`
counts. The empty frame has Gap 0. The validated host needs no per-child guard.
```
.gap {.x _; (pure x) ? {
  .tail {(_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) &| {_}};
  .alt {.cs _; (cs = []) ? {0} : {(cs .0).## - (alt (tail cs))}};
  .signed (alt x);
  (signed .< 0) ? {0 - signed} : {signed}} : {need x}};
```
`spin x N` keeps the sign of the alternating sum and divides by a positive
count N. Non-count N is a type error; zero is division-by-zero. The host is
validated before the resolution is checked.
```
.spin {.x _; .host x;
  (pure host) ? {
    {.n <~~1> _;
      .tail {(_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) &| {_}};
      .alt {.cs _; (cs = []) ? {0} : {(cs .0).## - (alt (tail cs))}};
      .signed (alt host);
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
Terminal enumeration keeps identity, while counting needs no construction.
```
; [(cells e) = [[], []], ((cells e) .0) === a, (cells e).# = e.##]
# [<>, <>, <>]
; [(pure []), (pure [[], [[]]]), (pure [[], 5]), (pure [.k 1; []])]
# [<>, <>, (), ()]
; [(need e) = e, (need e) === e]
# [<>, <>]
; cells [.k 1; []]
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
Gap and Spin read native terminal counts, including shared branches at every
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
; spin [[[], []]] 2.5
# $!.type-error .n <~~1> 2.5
; spin [[[], []]] 0
# $!.division-by-zero /
```
Importing skips the examples and ends on a native true value.
```
[] = []
