#!/usr/bin/env hc
```
Figures over native frames (#382, #395, #451; issue occurrence/figure 009.09,
010.02)

Relational Construction Theory has one generative operation: construct a Figure
out of zero or more already constructed Figures, its children. v0.27.0 makes
that construction *native*. A Figure is now an ordinary nested HC frame — a
`FrameArray` whose elements are its children — rather than a bespoke wrapper
that hid its children in a `.children` property. `Figure [c, …]` is written
`[c, …]`, the empty Figure is `[]`, and a cell is `[[]]`. There is no separate
tree constructor and no hidden child plane: a Figure's children *are* its
native elements, so `.#` counts them, `&` maps them, `x .0` indexes them, and
`=`/`===` compare them, all with the runtime's own array semantics.

This module is therefore an *observational layer*, not a class. Its operations
read and transform native nested frames: `size`, `cells`, `form`, `many`, `mul`,
`inlay`, `gap`, `spin`, `sameform`, `sameness`, `withness`, `size_equivalent`,
plus `pure` and `need` that police the supported domain. Each is a top-level
closure that takes the frame as its argument, because a bare native frame carries
no methods to dispatch; an import reaches them qualified, `Figures.size x`. The
constructor `Figure` is kept as the identity on its argument, so historical
construction spellings keep reading, while `Figure [A, B]` now denotes the plain
array `[A, B]`.

Why the migration. Issue 009.07 proposed one Inlay that substitutes at every
*native terminal*, traversing only enumerable structure. Issue 009.08a showed
that the old `.children` wrapper made that impossible: a real Figure enumerated
zero elements, so a frame-native operation could not reach its children and the
`&` reconstruction dropped properties. 009.09 authorises removing the wrapper
rather than faking enumeration, so the native operation and the Figure observer
become the *same* operation on the *same* carrier. The cost is a changed public
surface and some changed observations, documented explicitly below.

What a cell is now. A Figure is built from the empty frame by nesting, so the
natural native terminal is the empty frame `[]` itself. `size` counts those
terminals. This differs from the old Size, which counted cells of the form
`[[]]` and read the empty Figure as `0`. Natively the empty frame is one terminal, so
`size []` is one, not zero; `size [[]]` is also one, counting the inner `[]`;
and `size [[], []]` is two. The counting law is unchanged in spirit: inserting a
Figure of n terminals at each of a host's m terminals yields m×n terminals.

That terminal count is the runtime's own. Native `.##` counts the terminals of
any aggregate's structure, the elements that are not aggregates and the
aggregates with no elements (issue 010.02), so on the supported domain, where
every terminal is an empty frame, `count x` is `x.##`. This module reads it
there rather than recounting: `count` is the guarded `.##`. `size` and `cells`
still walk the frame, because they construct: `size` builds a fresh mark per
terminal, and `cells` answers the terminals themselves.

Supported inputs. The operations are defined for finite, well-founded,
property-free nested frames: every node is either `[]` or a plain array of
supported children, with no extra visible properties. `pure` answers `<>` for
exactly those and `()` otherwise; it rejects atoms, strings, and
property-bearing frames, because `&` reconstruction would silently drop their
non-enumerable content. A bare declared parent with no own visible properties is
not observable in pure HC and is outside the validated domain: the operations
preserve elements and order, and neither rely on nor claim to preserve parent
links. `need` returns its argument when `pure` and a native refusal otherwise.
The public observers and transforms — `size`, `count`, `cells`, `form`, `many`,
`inlay`, `mul`, `gap`, `spin` — enforce this domain at their own boundary: each
gates on `pure` and refuses an unsupported argument through `need`, so a direct
call such as `inlay` on a property-bearing frame, or `size` on an atom, yields
an explicit `$!` refusal rather than silently dropping non-enumerable content or
treating an atom as structure. The comparisons `sameform`, `sameness`,
`size_equivalent` and `withness` read native `=`/`===` identity and delegate
counting to the guarded `count`, so they stay honest without a separate gate.

A free name in an operation resolves where the operation is written — this file's
top level — so `count` reaching `size` and `gap` reaching `count` keep working
after an import carries the operation elsewhere (#400). Every operation names its
host and binds any second operand through currying, so a native-array argument
never shadows the operation's own helpers.
```
```
**Marks and roles.** The observers answer `A`, the empty frame, for no and `B`,
the frame holding `A`, for yes. Both are ordinary native frames, `[]` and
`[[]]`, and `B` is also the form of the mark `size` writes per terminal. The
old counting aliases `Z` and `U` were the same two frames and are gone
```
.A []; .B [[]];
```
**Constructor**, `Figure x`: the identity on its argument, kept so historical
construction spellings keep reading. `Figure [A, B]` is the native array
`[A, B]`, each child itself
```
.Figure {_};
```
**Supported domain**, `pure x`: `<>` when x is a finite, well-founded,
property-free nested frame, `()` otherwise. The empty frame is pure; a nonempty
frame is pure when it carries no extra properties — its native reconstruction
`x & {.e _; e}` equals it — and every element is pure. Atoms, strings, and
property-bearing frames are not pure. The helper recurses the element plane
```
.pure {.x _;
  .go {.n _;
    (n = []) ? {<>} : {
      .rebuilt (n & {.e _; e});
      (rebuilt = n) ? {(n &| {(go _) ? {[]} : {[0]}}) = []} : {()}}};
  go x};
```
**Guard**, `need x`: x itself when x is pure, and a native name-missing refusal
otherwise, so an unsupported input is rejected explicitly rather than silently
observed
```
.need {.x _; (pure x) ? {x} : {unsupported-figure}};
```
**Form**, `form x`: the plain bracket tree of x, which a native Figure already
is. Form is the identity on a supported frame, and text spells it: `“” x` prints
`[[], [[]]]` directly, with no wrapper methods to hide. It guards its argument
first so an unsupported input is refused rather than returned as if it were a
pure Figure
```
.form {.x _; (pure x) ? {x} : {need x}};
```
**Count**, `count x`: the terminal count of x read as a native FrameCount. On
the supported domain that is native `.##`, which reads each empty frame as one
terminal at any depth, so `count []` is `1` and `count [[], [[], []]]` is `3`.
It observes a number, so it leaves the Figures on purpose, the way `cells` and
`form` do. It guards its argument first: `.##` would also count atoms and
strings, so an unsupported input is refused through `need` rather than counted
```
.count {.x _; (pure x) ? {x.##} : {need x}};
```
**Size**, `size x`: a tally with one fresh mark `[[]]`, equal to `B`, per
native terminal `[]`, so `(size x).#` is `count x`. It keeps the terminal count
and forgets shape, nesting, order, reuse and identity. The empty frame is one
terminal, so `size []` is one cell; a nonempty frame's size splices its
elements' sizes. Each mark is built where its terminal is visited, so no mark is
`B` itself or another mark, and the tally is not built by repetition, so it has
no element cap. Like every public observer here it guards its argument first:
an unsupported input is refused through `need` rather than observed as a
degraded tally
```
.size {.x _; (pure x) ? {
  .go {.n _; (n = []) ? {[[[]]]} : {n &| {go _}}};
  go x} : {need x}};
```
**Cells**, `cells x`: the terminals of x, in order, each one itself. The empty
frame is its own only cell; every other frame's cells are its elements',
spliced into one array by `&|`. It keeps the cells and their order, and forgets
where they were nested. It guards its argument first, refusing an unsupported
input through `need`
```
.cells {.x _; (pure x) ? {
  .go {.n _; (n = []) ? {[n]} : {n &| {go _}}};
  go x} : {need x}};
```
**Manyness**, `many x`: a tally with one mark `B` per immediate element. It
keeps how many children there are and forgets what they are, everything below
them, their order and their identity. It guards its argument first, refusing an
unsupported input through `need` rather than marking a degraded element count
```
.many {.x _; (pure x) ? {x & {[[]]}} : {need x}};
```
**Inlay**, `inlay x y`: replace each native terminal of x with y, preserving the
ordered nesting around those terminals. This is the frame-native enumerable
Inlay of 009.07: a terminal `[]` becomes y, and a nonempty frame reconstructs
its elements in order. There is no right-zero guard; an empty y still replaces
each terminal, so the surrounding construction is not annihilated. The operation
is curried, so `inlay x y` reads as placing y throughout x. The local recursion
returns y itself at each terminal, reusing y by identity, and builds fresh
nonterminal ancestors. Inlay guards its host x first: an unsupported host is
refused through `need` rather than rebuilt by `&`, which would silently drop a
property-bearing frame's non-enumerable content
```
.inlay {.x _; .host x;
  (pure host) ? {
    {.y _;
      .go {.n _; (n = []) ? {y} : {n & {go _}}};
      go host}} : {
    {.y _; need host}}};
```
**Multiplication**, `mul x y`: y once per terminal of x, spliced into one flat
array, so it keeps the terminal count and forgets x's shape. Where `inlay`
preserves nesting, `mul` forgets it: `count (mul x y)` is `(count x) × (count y)`
for every y, which is how positive counting multiplies. It is curried like
`inlay` and guards its host x first, refusing an unsupported host through `need`
```
.mul {.x _; .host x;
  (pure host) ? {
    {.y _; (count host) [y]}} : {
    {.y _; need host}}};
```
**Sameness of form**, `sameform x y`: `<>` when `x = y`. It compares element by
element and forgets identity and reuse. Curried
```
.sameform {.x _; {.y _; (x = y)}};
```
**Sameness**, `sameness x y`: `<>` when `x === y`, the same constructed frame. A
native array owns identity, so `===` is reference equality. Curried
```
.sameness {.x _; {.y _; (x === y)}};
```
**Size-equivalence**, `size_equivalent x y`: `B` when the two terminal counts
agree and `A` otherwise. It keeps only whether the counts are equal. Curried
```
.size_equivalent {.x _;
  {.y _; ((count x) = (count y)) ? {[[]]} : {[]}}};
```
**Withness**, `withness x [f, …]`: `B` when every f is an immediate element of x,
the same frame rather than an equal-looking one. It is relative to one parent, x,
and forgets order, repeats and everything below the elements. A requested frame
is absent when no element is identical to it. Curried
```
.withness {.x _; .host x;
  {.fs _;
    .absent (fs &| {.f _; ((host &| {(_ === f) ? {[f]}}) = []) ? {[f]}});
    (absent = []) ? {[[]]} : {[]}}};
```
**Gap**, `gap x`: the absolute value of the alternating sum of the counts of x's
immediate elements, `|count(F₁) − count(F₂) + count(F₃) − …|`, read as a
FrameCount. The empty frame has Gap `0`; each element contributes its count with
a sign that starts positive and flips element by element; Gap drops the sign, so
it is never negative. It observes rather than constructs, so it leaves the
Figures, answering a number. It guards its argument first, refusing an
unsupported input through `need`
```
.gap {.x _; (pure x) ? {
  .cnt {(count _)};
  .tail {(_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) &| {_}};
  .alt {.cs _; (cs = []) ? {0} : {(cnt (cs .0)) - (alt (tail cs))}};
  .signed (alt x);
  (signed .< 0) ? {0 - signed} : {signed}} : {need x}};
```
**Spin**, `spin x N`: the signed alternating sum of the counts of x's immediate
elements divided by a positive resolution N, an exact FrameRational in
revolutions. It folds the same counts Gap does, in the same order and with the
same signs that start positive, but keeps the sign Gap drops, so the two
directions read as `−` and `+`; the empty frame has Spin `0` at every N. N must
be a positive count, bound as `.n <~~1>`, so a non-count N is refused with a
native `$!.type-error` and `N=0` is the native `$!.division-by-zero`. Curried on
N. Spin guards its host x first; an unsupported host is refused through `need`
before N is read, so the host-domain refusal wins over the N type check
```
.spin {.x _; .host x;
  (pure host) ? {
    {.n <~~1> _;
      .cnt {(count _)};
      .tail {(_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) &| {_}};
      .alt {.cs _; (cs = []) ? {0} : {(cnt (cs .0)) - (alt (tail cs))}};
      .signed (alt host);
      (n .< 1) ? {signed / 0} : {signed / n}}} : {
    {.n _; need host}}};
```
## Native construction

A Figure is a native nested frame, so construction is native bracketing and the
marks are ordinary arrays. Indexing reaches an element itself, not a copy
```
; [A, B] = [[], [[]]]
# <>
; [(Figure [A, B]) = [A, B], (Figure [A, B]) = [[], [[]]]]
# [<>, <>]
; .E (Figure [A, B]); .G (Figure [E, Figure [B, Figure [B]]]);
; [(E .0) === A, (E .1) === B, E.# = 2, E.## = 2]
# [<>, <>, <>, <>]
```
A Figure's children are its native elements, so `.#` counts them and `&` maps
them — the facts the old wrapper hid behind a `.children` property
```
; [E.#, (E & {_}).#, (Figure [B, B]).#]
# [2, 2, 2]
; (E & {_}) = [A, B]
# <>
```
Form is the bracket tree a Figure already is, and text spells it
```
; [(form E) = [[], [[]]], (“” (form E)) = “[[], [[]]]”, (form A) = []]
# [<>, <>, <>]
```
Equal children make equal Figures by `=`, each construction a distinct frame by
`===`
```
; [E = [A, B], E === [A, B], E = [B, A]]
# [<>, (), ()]
```
## The supported domain

`pure` accepts finite well-founded property-free nested frames and rejects
atoms, strings, and property-bearing frames. `need` returns a pure frame and a
native refusal otherwise
```
; [(pure []), (pure [[], [[]]]), (pure [[[]], [[], []]])]
# [<>, <>, <>]
; [(pure 5), (pure “hi”), (pure [[], 5]), (pure [.k 1; []])]
# [(), (), (), ()]
; [(need E) = E, (need E) === E]
# [<>, <>]
; ((need 5) = 5)
# ()
```
The public operations enforce the domain at their own boundary, so a direct call
on an unsupported input is an explicit `$!` refusal, not a silently degraded
observation. A property-bearing frame is refused rather than rebuilt by `&`
```
; size [.k 1; []]
# $!.name-missing “$:Frame.0.unsupported-figure”;
; many [.k 1; []]
# $!.name-missing “$:Frame.0.unsupported-figure”;
; inlay [.k 1; []] [[]]
# $!.name-missing “$:Frame.0.unsupported-figure”;
; gap [.k 1; [[], []]]
# $!.name-missing “$:Frame.0.unsupported-figure”;
```
An atom or string is refused the same way, not read as structure
```
; size 5
# $!.name-missing “$:Frame.0.unsupported-figure”;
; form “hi”
# $!.name-missing “$:Frame.0.unsupported-figure”;
```
## Size and counting

Size marks each native terminal with a fresh `[[]]`, and `count` reads how many
terminals there are. The empty frame is one terminal, so `size []` is one cell —
the documented change from the old Size, which read the empty Figure as zero
```
; [(count A), (count B), (count [[], []]), (count [[[], []], [[], [], []]])]
# [1, 1, 2, 5]
; [(size A) = [[[]]], (size [[], []]) = [[[]], [[]]], ((size [[[],[]],[[],[],[]]]).#) = 5]
# [<>, <>, <>]
```
Cells answers the terminals themselves, in order, wherever they were nested, and
`.#` reads how many there are
```
; [(cells [[[], []], [[], [], []]]) = [[], [], [], [], []], (cells A) = [[]]]
# [<>, <>]
; [(cells E) = [[], []], ((cells E) .0) === A]
# [<>, <>]
```
Terminal count is native `.##` (issue 010.02). `.##` reads each empty frame as
one terminal, so on the supported domain it answers exactly what `count` does,
and `.#` stays the immediate element count
```
; [[].##, [[]].##, [[], []].##, [[], [[], []]].##]
# [1, 1, 2, 3]
; [(count []), (count [[]]), (count [[], []]), (count [[], [[], []]])]
# [1, 1, 2, 3]
; [[].#, [[]].#, [[], []].#, [[], [[], []]].#]
# [0, 1, 2, 2]
```
`.##` is defined for every aggregate, so it also counts an atom as a terminal.
`count` stays inside the supported domain and refuses a mixed tree that `.##`
counts
```
; [[1, [2, []]].##, [[], 5, [[], “ab”]].##, (pure [1, [2, []]])]
# [3, 4, ()]
```
Each mark in the tally is a fresh frame: equal to `B`, but neither `B` itself
nor another mark. `count x` is also the number of terminals `cells` lists
```
; .t (size [[], []]);
; [(t .0) = B, (t .0) === B, (t .0) === (t .1)]
# [<>, (), ()]
; [(count [[], [[], []]]) = ((cells [[], [[], []]]).#), (count A) = ((cells A).#)]
# [<>, <>]
```
Manyness marks the immediate elements and looks no deeper
```
; [(many A) = [], (many E) = [[[]], [[]]], (many [B, B, B]) = [[[]], [[]], [[]]]]
# [<>, <>, <>]
```
## Inlay

Inlay replaces native terminals and retains nonterminal nesting even for an
empty right operand. A terminal `[]` becomes y; a nonempty frame reconstructs
its elements
```
; [(inlay A [[], []]) = [[], []], (inlay B [[], []]) = [[[], []]], (inlay [[], []] [[]]) = [[[]], [[]]]]
# [<>, <>, <>]
; (inlay [[], [], [[], []]] “x”) = [“x”, “x”, [“x”, “x”]]
# <>
```
An empty right operand still replaces each terminal, so the surrounding
construction is not annihilated — the 009.07 contrast with a right-zero guard
```
; [(inlay [[], []] []) = [[], []], (inlay B []) = [[]], (inlay [[], []] [[], []]) = [[[], []], [[], []]]]
# [<>, <>, <>]
```
The right operand is reused by identity at each terminal, and nonterminal
ancestors are freshly built, including separate occurrences of a shared left
subtree. Neither operand is written
```
; .yy (Figure [A, Figure [B, A]]); .host (Figure [[], Figure [[], []]]);
; .rr (inlay host yy);
; [((rr .0) === yy), (((rr .1) .0) === yy), (((rr .1) .1) === yy), (rr === host)]
# [<>, <>, <>, ()]
; [host = [[], [[], []]], yy = [[], [[[]], []]]]
# [<>, <>]
```
The counting law. For a host of m terminals and a y of n terminals, Inlay places
a copy of y at each terminal, so the result has m×n terminals. Two by three
observes six through Size, without hardcoding a multiplication rule
```
; .h2 [[], []]; .y3 [[], [], []];
; [(inlay h2 y3) = [[[], [], []], [[], [], []]], (count (inlay h2 y3)) = 6]
# [<>, <>]
; [(count (inlay [[], [], []] [[], []])) = 6, (count (inlay [[[]], [[]]] y3)) = 6]
# [<>, <>]
```
## Multiplication

Multiplication puts y once per terminal of x and splices the copies flat,
forgetting x's nesting, so it differs from Inlay on a nested host even though the
terminal counts agree
```
; .nested [[[], []]];
; [(mul nested [[]]) = [[[]], [[]]], (inlay nested [[]]) = [[[[]], [[]]]]]
# [<>, <>]
; [(count (mul nested [[]])) = (count (inlay nested [[]])), (mul nested [[]]) = (inlay nested [[]])]
# [<>, ()]
; (count (mul h2 y3)) = 6
# <>
```
## Sameness, Withness, Size-equivalence

Sameness of form is `=` and sameness of the constructed frame is `===`. A fresh
array equals `B` in form but is not the same frame
```
; .fresh [[]];
; [(sameform B fresh), (sameness B B), (sameness B fresh)]
# [<>, <>, ()]
```
Withness asks whether every requested frame is an immediate element of x by
identity. One child reused under two parents is with both; a fresh look-alike is
with neither. An empty parent holds nothing, and every one of no frames is with
any parent
```
; .shared [[]]; .p1 [shared, []]; .p2 [[], shared];
; [(withness p1 [shared]), (withness p2 [shared]), (withness p1 [[[]]])]
# [[[]], [[]], []]
; [(withness [] [[[]]]), (withness [shared] [])]
# [[], [[]]]
```
Size-equivalence keeps only whether the terminal counts agree. Note the native
boundary: `B` and `A` both have count 1, so they are size-equivalent here, where
the old reading of the empty Figure as zero made them differ
```
; [(size_equivalent [[], []] [[[], []]]), (size_equivalent [[], []] B), (size_equivalent B A)]
# [[[]], [], [[]]]
```
## Gap and Spin

Gap folds the counts of x's immediate elements with alternating signs, starting
positive, and drops the sign. The empty frame has Gap `0`; one element is its own
count; two elements are the difference of their counts
```
; [(gap A) = 0, (gap [[[], []]]) = 2, (gap [[[], []], [[], [], []]]) = 1, (gap [[[], [], []], [[], []]]) = 1]
# [<>, <>, <>, <>]
; (gap [[[], []], [[], [], [], [], []], [[], [], []]]) = 0
# <>
```
Spin keeps the sign Gap drops and divides by a positive resolution N, answering
an exact FrameRational. Reversing two elements flips the sign; the empty frame
is `0` at every N
```
; [(spin [[[], []], [[], [], [], [], []]] 4) = (0 - (3 / 4)), (spin [[[], [], [], [], []], [[], []]] 4) = (3 / 4)]
# [<>, <>]
; [(spin [[[], []]] 1) = 2, (spin A 4) = 0]
# [<>, <>]
```
N must be a positive count: a non-count is a type error and zero is a
division-by-zero
```
; spin [[[], []], [[], [], [], [], []]] 2.5
# $!.type-error .n <~~1> 2.5
; spin [[[], []], [[], [], [], [], []]] 0
# $!.division-by-zero /
```
## Closure and importing

Every observer that stays in the Figures answers a native Figure, so it can be
observed again; `count`, `form`, `cells`, `gap` and `spin` observe numbers,
arrays or ratios on purpose. Importing this file skips the examples and answers
its last form, which the hosts' smoke tests read, so the file ends on code that
holds however the rest of it changes
```
; [(many (many E)) = (many E), (size (size [B, B])) = (size [B, B])]
# [<>, <>]

B = [[]]
