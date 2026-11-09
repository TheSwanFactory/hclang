#!/usr/bin/env hc
```
Literal division (occurrence/figure 007.26, 007.27, 007.27c)

Division by n, taken literally, is dealing a pile into n channels in turn: the
first to channel 0, the next to channel 1, and so on round the n channels.
Parity is the case n = 2. Nothing about it needs a host divisor, a quotient
type or a fraction; it redistributes what is there and keeps its total.

`x ./ n` is that dealing for three receivers. `./` is the dotted spelling of `/`
(GRAMMAR "Mathematical Operators"), so `x / n` means the same, and a pair of
numbers keeps its exact numeric division: `6 ./ 3` is 2 and `7 ./ 2` is 7/2.
The divisor is always the channel Count itself: a positive Count, never a Size
read from some other Frame.

- **A list** (an array or a group) deals its immediate elements whole, in
  order, into n channels: the element at index i goes to channel i mod n.
  Elements are the same Frames, never copied, evaluated, measured or
  flattened, so identity, nesting and duplicates are kept. Properties are not
  elements and are not dealt. The answer is a `RotorRouter` of those n
  channels, read as `.channels`, not a bare list of lists (007.27c): a list
  whose children happen to be lists is a plain list, and a router keeps its
  channels as channels, so dividing the answer again re-deals the same Frames.
  The dealing is native, in `/`.
- **A RotorRouter** (`hc/rotor-router.hc`) keeps the Frames it routed, so it
  re-deals them: it reconstructs the order they were routed in from its
  channels, which a round-robin history fixes, and routes that history through
  a fresh router of n channels. Its Count is unchanged and its next route goes
  to channel C mod n.
- **A Denum** (`hc/denum.hc`) forgot its Frames and kept only their Sizes, so it
  deals Size units. `D ./ n` keeps the Count C and the total Size S and
  canonicalizes the loads to S units dealt round-robin into n channels, so the
  first S mod n channels hold ⌈S/n⌉ and the rest ⌊S/n⌋. Its next application
  deposits into channel C mod n.

Router and list deal whole Frames, and a Denum deals Size units. Both conserve
the summed Size, but their channel loads differ in general: children of Sizes
5 and 2 dealt whole into two channels load them 5 and 2, while a Denum of Size 7
normalizes to 4 and 3. No law makes them commute, and none is claimed here.

Refusals are the native ones for all three: a divisor of zero is
`$!.division-by-zero /`, as it is for numbers, and anything but a Count is
`$!.division-domain /`, a negative or fractional number, a decimal, text, an
aggregate or a Denum included. A divisor above both 1,000,000 and the element count is `$!.repetition-size 1000000`, checked before anything is built; up to the element count is always allowed, so the answer stays proportional to the list.
```
```
## Lists

Seven Frames dealt into three channels: the element at index i goes to channel
i mod 3. Nested arrays, an aggregate with a property, a closure and a group are
each one element, dealt whole. The answer is the router of those channels
```
; .A [1, [2]]; .B “b”; .C {5 + 3}; .D [.k 9; 4]; .E 5; .F (6, 7); .G 7;
; .xs [A, B, C, D, E, F, G];
; “” (xs ./ 3)
# “RotorRouter([[[1, [2]], [.k 9; 4], 7], [“b”, 5], [{ 5 + 3 }, (6, 7)]])”
; .t ((xs ./ 3).channels);
; [t, t & {_.#}, (xs / 3) = (xs ./ 3), ((t .0) .1).k, (xs ./ 3).#]
# [[[[1, [2]], [.k 9; 4], 7], [“b”, 5], [{ 5 + 3 }, (6, 7)]], [3, 2, 2], <>, 9, 7]
```
Each channel holds the same Frames, in their original order, each once. A
Frame that occurs twice is dealt twice, and both are it
```
; [(t .0) &| {[_ === A]}, (t .2) &| {[_ === C]}, (t &| {_}).#, (t &| {_}) = [A, D, G, B, E, C, F]]
# [[<>, (), ()], [<>, ()], 7, <>]
; [([A, A, A] ./ 2).channels, ([A, A, A] ./ 2).channels &| {_} &| {[_ === A]}]
# [[[[1, [2]], [1, [2]]], [[1, [2]]]], [<>, <>, <>]]
```
Two channels are the binary router, with its `left`, `right` and `phase`. One
channel is the whole list, and more channels than elements leave the last ones
empty. An empty list deals into n empty channels; empty elements are dealt
like any other
```
; [“” ([1, 2, 3] ./ 2), ([1, 2, 3] ./ 2).left, ([1, 2, 3] ./ 2).phase]
# [“RotorRouter([1, 3],[2])”, [1, 3], 1]
; [(xs ./ 1).channels, ([1, 2] ./ 5).channels, ([] ./ 3).channels, ([[], []] ./ 2).channels]
# [[[[1, [2]], “b”, { 5 + 3 }, [.k 9; 4], 5, (6, 7), 7]], [[1], [2], [], [], []], [[], [], []], [[[]], [[]]]]
```
Properties are not elements, so they are not dealt. A group deals its elements
too, and its channels are arrays
```
; [([.k 1; 1, 2, 3] ./ 2).channels, ((1, 2, 3) ./ 2).channels]
# [[[1, 3], [2]], [[1, 3], [2]]]
```
The channel Counts are the canonical dealing: for seven elements into three
channels they are 3, 2, 2, whatever the elements are
```
; [(xs ./ 3).channels & {_.#}, ((7 [0]) ./ 3).channels & {_.#}, ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] ./ 4).channels & {_.#}]
# [[3, 2, 2], [3, 2, 2], [3, 3, 2, 2]]
```
## Dividing a division (007.27c)

A division keeps its channels as channels, so dividing it again reads them
breadth-first, the first of each channel, then the second of each, and deals
that sequence: `(X ./ n) ./ m` is `X ./ m`, the same Frames in the same
order, with no extra nesting. Dividing by the same n again changes nothing
```
; .X [A, 2, 3, 4, 5, 6];
; [“” (X ./ 2), “” ((X ./ 2) ./ 2), ((X ./ 2) ./ 2) = (X ./ 2), ((X ./ 2) ./ 3) = (X ./ 3), ((X ./ 3) ./ 2) = (X ./ 2)]
# [“RotorRouter([[1, [2]], 3, 5],[2, 4, 6])”, “RotorRouter([[1, [2]], 3, 5],[2, 4, 6])”, <>, <>, <>]
; [((X ./ 2) ./ 3).channels, (((X ./ 2) ./ 3).channels .0 .0) === A]
# [[[[1, [2]], 4], [2, 5], [3, 6]], <>]
```
A plain list whose children are lists is not a division: its two children are
two whole Frames, dealt as such, even when they look like channels
```
; .N [[1, 3, 5], [2, 4, 6]];
; [“” (N ./ 2), (N ./ 2).left .0 = [1, 3, 5], (N ./ 2).# , “” ((N ./ 2) ./ 2)]
# [“RotorRouter([[1, 3, 5]],[[2, 4, 6]])”, <>, 2, “RotorRouter([[1, 3, 5]],[[2, 4, 6]])”]
```
Uneven channels read back in dealt order: seven Frames into three channels,
then into one, give the seven in order; into two they are dealt again from
that order
```
; .Y [1, 2, 3, 4, 5, 6, 7];
; [“” (Y ./ 3), (((Y ./ 3) ./ 1).channels .0) = Y, “” ((Y ./ 3) ./ 2), ((Y ./ 3) ./ 2) = (Y ./ 2)]
# [“RotorRouter([[1, 4, 7], [2, 5], [3, 6]])”, <>, “RotorRouter([1, 3, 5, 7],[2, 4, 6])”, <>]
```
Channels that no round-robin history left have no dealt order to read, so no
router holds them and they are not divided: the constructor refuses them, and
a plain list of such lists is a plain list
```
; Routers <- './hc/rotor-router.hc';
; .RotorRouter Routers.RotorRouter;
; [RotorRouter [[1], [2, 3]], ([[1], [2, 3]] ./ 2).channels]
# [$!!.invalid-router, [[[1]], [[2, 3]]]]
```
## Refusals

The divisor is a positive Count. Zero is division by zero, and anything else is
outside the domain, whatever its Size: a negative or fractional number, a
decimal, text, an aggregate, a Denum. A divisor that is already an error is
answered as it is
```
; [[1, 2] ./ 0, [1, 2] ./ (3 - 1), [1, 2] ./ (0 - 2), [1, 2] ./ (1 / 2), [1, 2] ./ 1.5, [1, 2] ./ “two”, [1, 2] ./ [2]]
# [$!.division-by-zero /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /]
; [1, 2] ./ (1 / 0)
# $!.division-by-zero /
; [[1, 2] ./ (2 ** 30), [1, 2] ./ 1000001, ([1] ./ 1000).channels.#]
# [$!.repetition-size 1000000, $!.repetition-size 1000000, 1000]
```
Numbers keep exact numeric division, and a Frame that is neither a number nor
an ordered list still answers nil
```
; [6 ./ 3, 7 ./ 2, 7 / 2, “abcd” ./ 2, <1, 2> ./ 2]
# [2, 7/2, 7/2, (), ()]
```
## Conservation and empty channels

The summed Size of the dealt children is the list's Size: each child is in
exactly one channel. Each channel's load is the sum of its children's Sizes,
and an empty channel's load is 0. The router's `.##` is that sum. The `.##`
of its channels taken as a plain list of lists is not, because an empty array
has Size 1, so an empty channel adds one
```
; .load {.c _; (c.# = 0) ? {0} : {c.##}};
; .loads {_ & {load _}};
; [loads ([5, 2] ./ 2).channels, loads ([5, 2] ./ 3).channels, (loads ([5, 2] ./ 3).channels).##, [5, 2].##, ([5, 2] ./ 3).##, ([5, 2] ./ 3).channels.##]
# [[5, 2], [5, 2, 0], 7, 7, 7, 8]
```
Zero-Size children take a slot, and empty children count their own Size 1
```
; [loads ([0, 0, 0] ./ 2).channels, loads ([[], [], 0] ./ 2).channels, [[], [], 0].##]
# [[0, 0], [1, 1], 2]
```
Dealing measures nothing, so a child whose Size fails is dealt like any other.
Its failure shows where the channel is measured
```
; .Failing [.## {[].nope}; 1];
; ([Failing, 1] ./ 2).channels & {_.#}
# [1, 1]
; ([Failing, 1] ./ 2).##
# $!.name-missing “...
```
## Denum

A Denum of any arity is `Denum [C, loads]`, a Count and a nonempty list of
Counts. Two loads are the binary Denum `Denum [C, L, R]` itself, the same
instance, with its `left`, `right` and `phase`; any other arity is a channel
Denum, which reads as `Denum(C,[…])`. Every Denum stores `count` and `loads`
```
; Denums <- './hc/denum.hc';
; .Denum Denums.Denum;
; [“” (Denum [3, [5, 2]]), (Denum [3, [5, 2]]) == (Denum [3, 5, 2]), (Denum [3, [5, 2]]).left (), (Denum [3, 5, 2]).loads]
# [“Denum(3,5,2)”, <>, 5, [5, 2]]
; [“” (Denum [0, [0, 0, 0]]), “” (Denum [4, [7]]), “” (Denum [2, [1, 2, 3, 4]]), (Denum [2, [1, 2, 3]]).loads, (Denum [2, [1, 2, 3]]).count]
# [“Denum(0,[0, 0, 0])”, “Denum(4,[7])”, “Denum(2,[1, 2, 3, 4])”, [1, 2, 3], 2]
```
No channels, a load that is not a Count, and any other shape are refused
```
; [Denum [2, []], Denum [2, [1, (0 - 1), 3]], Denum [2, [1, 1.5]], Denum [2, [1, [2]]], Denum [(0 - 2), [1]], Denum [2, 5], Denum [2, [1], 3], Denum [2, [1, 2], 3, 4]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
```
A channel Denum observes as its loads do: its Count is C, its Size the sum of
its loads, and its residual their alternating sum, `e0 − e1 + e2 − …`, the
list residual, which for two loads is `L − R`
```
; .d7 (Denum [3, 5, 2]); .q3 (d7 ./ 3);
; [q3.#, q3.##, q3.###, q3.count, q3.loads]
# [3, 7, 3, 3, [3, 2, 2]]
```
## Denum division redistributes Size units

`D ./ n` keeps the Count and the Size and deals the Size units round-robin into
n channels. For S = 7: into 2, 4 and 3; into 3, 3, 2 and 2; into 4, 2, 2, 2
and 1. Into one channel it is the whole Size, and into more channels than units
the last are empty
```
; [“” (d7 ./ 2), “” (d7 ./ 3), “” (d7 ./ 4), “” (d7 ./ 1), “” (d7 ./ 9)]
# [“Denum(3,4,3)”, “Denum(3,[3, 2, 2])”, “Denum(3,[2, 2, 2, 1])”, “Denum(3,[7])”, “Denum(3,[1, 1, 1, 1, 1, 1, 1, 0, 0])”]
```
`Denum(3,[5,2]) ./ 3` is `Denum(3,[3,2,2])`, and so is the different state
`Denum(3,[4,3]) ./ 3`. Normalization is many-to-one: equal Count and Size give
the same result, and the original distribution cannot be recovered
```
; [q3 = (Denum [3, [3, 2, 2]]), ((Denum [3, 4, 3]) ./ 3) = q3, (Denum [3, 4, 3]) = d7, (d7 / 3) = q3, q3 = d7]
# [<>, <>, (), <>, ()]
```
It is idempotent, and dividing again renormalizes from the same Count and Size,
so the earlier division leaves no trace
```
; [(q3 ./ 3) = q3, (q3 ./ 2) = (d7 ./ 2), ((d7 ./ 4) ./ 3) = q3, “” (q3 ./ 2), ((q3 ./ 2) ./ 3) = q3]
# [<>, <>, <>, “Denum(3,4,3)”, <>]
```
Zero Size, zero Count, one channel, and more channels than Size or Count
```
; [“” ((Denum [0, 0, 0]) ./ 3), “” ((Denum [0, 9, 0]) ./ 4), “” ((Denum [0, 9, 0]) ./ 1), “” ((Denum [2, 1, 1]) ./ 5), “” ((Denum [1, 0, 0]) ./ 2)]
# [“Denum(0,[0, 0, 0])”, “Denum(0,[3, 2, 2, 2])”, “Denum(0,[9])”, “Denum(2,[1, 1, 0, 0, 0])”, “Denum(1,0,0)”]
```
The divisor is a channel Count, refused as a list refuses it, never coerced to
its Size
```
; [d7 ./ 0, d7 ./ (3 - 1), d7 ./ 1.5, d7 ./ (1 / 2), d7 ./ [3], d7 ./ “three”, d7 ./ (Denum [1, 1, 1])]
# [$!.division-by-zero /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /]
```
## Applying after division

After `./ n` the next application deposits into channel C mod n and adds one to
the Count, a Size of zero included. `q3` has Count 3, so it deposits into
channels 0, 1, 2, 0 in turn
```
; [“” (q3 10), “” ((q3 10) 1), “” (((q3 10) 1) 1), “” ((((q3 10) 1) 1) 1)]
# [“Denum(4,[13, 2, 2])”, “Denum(5,[13, 3, 2])”, “Denum(6,[13, 3, 3])”, “Denum(7,[14, 3, 3])”]
; [“” ((Denum [0, [0, 0, 0]]) 4), “” (((Denum [0, [0, 0, 0]]) 4) 0), “” ((((Denum [0, [0, 0, 0]]) 4) 0) 6)]
# [“Denum(1,[4, 0, 0])”, “Denum(2,[4, 0, 0])”, “Denum(3,[4, 0, 6])”]
```
A reduce applies it the same way, and through a mutable name it writes in
place. One channel takes every deposit, and two channels are the binary Denum's
parity
```
; “” ([5, 2, 7, 1, 0] | (Denum [0, [0, 0, 0]]))
# “Denum(5,[6, 2, 7])”
; .m_ (Denum [0, [0, 0, 0]]);
; m_ 5;
; m_ 6;
; [“” m_, “” ((d7 ./ 1) 4), “” ((d7 ./ 2) 4), “” (d7 4)]
# [“Denum(2,[5, 6, 0])”, “Denum(4,[11])”, “Denum(4,4,7)”, “Denum(4,5,6)”]
```
## Denum laws

For every Count 0 to 3, every pair of loads 0 to 4 (100 states) and every n
from 1 to 4: the Count and Size are kept, there are n loads, they are the
dealing of S unit Frames into n channels, division is idempotent, and for every
m from 1 to 4 dividing by n then m is dividing by m
```
; .cs [0, 1, 2, 3]; .ls [0, 1, 2, 3, 4]; .ns [1, 2, 3, 4];
; .states (cs &| {.c _; ls &| {.l _; ls & {Denum [c, l, _]}}});
; .law {.k _; ns &| {.n _; .q (k ./ n); [q.# = k.#, q.## = k.##, q.loads.# = n, q.loads = (((k.## [1]) ./ n).channels & {_.#}), (q ./ n) = q]}};
; .renorm {.k _; ns &| {.n _; ns & {.m _; ((k ./ n) ./ m) = (k ./ m)}}};
; .checks ((states &| law) | (states &| renorm));
; [states.#, checks.#, checks = (checks & {<>})]
# [100, 3600, <>]
```
## Channel Denum operations

Its fourth hash is intrinsic, as for the binary Denum: a fresh equal channel Denum
of the same arity, Count zero included. A record that only spells the fields is
not one, and forged observers give the ordinary derived binary Denum
```
; [(q3.####) == q3, (q3.####) === q3, ((Denum [0, [0, 0, 0]]).####) = (Denum [0, [0, 0, 0]]), ([5, 2].#### ./ 3) = (Denum [2, [3, 2, 2]])]
# [<>, (), <>, <>]
; [[.count 3; .loads [3, 2, 2]].####, “” ([.count 3; .loads [3, 2, 2]; .# {3}; .## {7}; .### {3}].####)]
# [(), “Denum(3,5,2)”]
```
`*` and `scale_` scale every load and keep the Count; the ratios read Size and
residual over the Count, nil at Count zero
```
; [“” (q3 * 2), “” (q3.scale_ 3), q3.size-ratio (), q3.residual-ratio (), (Denum [0, [3, 2, 2]]).size-ratio ()]
# [“Denum(3,[6, 4, 4])”, “Denum(3,[9, 6, 6])”, 7/3, 1, ()]
```
`+` and `-` follow the residual's signs. The residual adds the loads at even
indices and subtracts those at odd ones, so `-` deposits `x.##` on the first
even load, load 0, and raises the residual, and `+` deposits on the first odd
load, load 1, and lowers it. For two loads these are the binary Denum's left and
right. Both keep the Count, and both are `deposit-left_` and `deposit-right_`
by the operand's Size. One load has no odd index, so there `+` is
`$!!.invalid-arity`
```
; [“” (q3 + 1), “” (q3 - 1), q3.###, (q3 + 1).###, (q3 - 1).###, (q3 + 1).#]
# [“Denum(3,[3, 3, 2])”, “Denum(3,[4, 2, 2])”, 3, 2, 4, 3]
; [“” ((d7 ./ 4) + 1), “” ((d7 ./ 4) - 2.5), (d7 ./ 1) + 1, “” ((d7 ./ 1) - 1), “” (d7 + 1), “” (d7 - 1)]
# [“Denum(3,[2, 3, 2, 1])”, “Denum(3,[4, 2, 2, 1])”, $!!.invalid-arity, “Denum(3,[8])”, “Denum(3,5,3)”, “Denum(3,6,2)”]
; [((q3 + 4) - 2) = ((q3 - 2) + 4), ((q3 + 1) ./ 3) = ((q3 - 1) ./ 3), q3 + ([].nope), q3.deposit-right_ (0 - 1), q3.deposit-left_ 1.5, “” q3]
# [<>, <>, $!.name-missing “..., $!!.invalid-denum, $!!.invalid-denum, “Denum(3,[3, 2, 2])”]
```
## RotorRouter

`RotorRouter [ch0, …, chk−1]` takes k ≥ 1 channel arrays. Two are the binary
router, with its `left`, `right` and `phase`; every router stores `channels`.
A round-robin history from channel 0 fills the channels so that the first
C mod k hold one more than the rest, so the constructor admits exactly the
channels whose Counts are the dealing of C into k, and refuses every other
```
; [[[]], [[], []], [[], [], []], [[], [], [], []]] & {“” (RotorRouter _)}
# [“RotorRouter([[]])”, “RotorRouter([],[])”, “RotorRouter([[], [], []])”, “RotorRouter([[], [], [], []])”]
; [[[5]], [[5], [6]], [[5], [], []], [[5], [6], []], [[5, 8], [6], [7]], [[5, 9], [6], [7], [8]]] & {(RotorRouter _).#}
# [1, 2, 1, 2, 4, 5]
; [RotorRouter [[1], [2], [3, 4]], RotorRouter [[1], [], [2]], RotorRouter [[1, 2, 3], [4], [5]], RotorRouter [[], [1]], RotorRouter [[1, 2], [3], [4], [5], [6, 7]], RotorRouter []]
# [$!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router]
```
Routing appends the Frame to channel C mod k, from Count 0 through 6 here, so
every successor is admissible again. Routing nil routes nothing
```
; .s0 (RotorRouter [[], [], []]);
; [0, 1, 2, 3, 4, 5, 6] & {.n _; ((n [0]) | s0).channels & {_.#}}
# [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 1, 1], [2, 2, 1], [2, 2, 2]]
; [“” ((s0 A) B), (((s0 A) B) C).channels .2 &| {[_ === C]}, (s0 ()).#]
# [“RotorRouter([[[1, [2]]], [“b”], []])”, [<>], 0]
```
## Router division re-deals the Frames

Routing xs from the initial router, then dividing by 3, is the router of
`xs ./ 3`: the router's history is reconstructed from its channels and dealt
again. The Count and the summed Size are kept, every Frame is the same Frame,
and dividing by one gives the history back in routed order
```
; .r0 (RotorRouter [[], []]);
; .r7 (xs | r0); .t3 (r7 ./ 3);
; [“” t3, t3.channels & {_.#}, t3.# = r7.#, t3.## = r7.##, t3 = (xs ./ 3)]
# [“RotorRouter([[[1, [2]], [.k 9; 4], 7], [“b”, 5], [{ 5 + 3 }, (6, 7)]])”, [3, 2, 2], <>, <>, <>]
; [(t3.channels .0) &| {[_ === A]}, (t3.channels .2) &| {[_ === C]}, ((t3.channels .0) .1).k, ((t3 ./ 1).channels .0) = xs]
# [[<>, (), ()], [<>, ()], 9, <>]
```
Division is idempotent and renormalizes: dividing again re-deals the same
history, so a router divided by 3 and then 2 is the binary router it came
from. The empty router divides into empty channels
```
; [(t3 ./ 3) = t3, (t3 ./ 2) = r7, ((r7 ./ 4) ./ 3) = t3, ((t3 ./ 4) ./ 2) = r7, “” (r0 ./ 3), (r0 ./ 3).#, ((RotorRouter [[], [], []]) ./ 2) = r0]
# [<>, <>, <>, <>, “RotorRouter([[], [], []])”, 0, <>]
```
After division the next route goes to channel C mod n: `t3` has Count 7, so 8,
9 and 10 go to channels 1, 2 and 0. Divided back into two, it is the binary
router that routed the same Frames
```
; [“” (t3 8), “” ((t3 8) 9), “” (((t3 8) 9) 10)]
# [“RotorRouter([[[1, [2]], [.k 9; 4], 7], [“b”, 5, 8], [{ 5 + 3 }, (6, 7)]])”, “RotorRouter([[[1, [2]], [.k 9; 4], 7], [“b”, 5, 8], [{ 5 + 3 }, (6, 7), 9]])”, “RotorRouter([[[1, [2]], [.k 9; 4], 7, 10], [“b”, 5, 8], [{ 5 + 3 }, (6, 7), 9]])”]
; [((t3 8) ./ 2) = (r7 8), (((t3 8) 9) ./ 1).channels .0 = ((xs 8) 9)]
# [<>, <>]
```
Division routes and measures nothing. A Frame held through a mutable name is
the same Frame after division, so a later write shows; a child whose Size
fails is re-dealt and fails only where the router is measured; zero-Size
children and empty arrays take slots, and nested arrays stay whole
```
; .kid_ [.n 1; .set_ {@n _;}];
; .rk ((r0 kid_) ./ 3);
; kid_.set_ 5;
; [(rk.channels .0 .0) === kid_, rk.channels .0 .0 .n]
# [<>, 5]
; .rf (((r0 Failing) 0) ./ 3);
; [rf.channels & {_.#}, ((r0 Failing) ./ 3) = (RotorRouter [[Failing], [], []])]
# [[1, 1, 0], <>]
; rf.##
# $!.name-missing “...
; .rz ((((r0 0) []) <>) ./ 2);
; [rz.channels, rz.##, rz.###]
# [[[0, <>], [[]]], 2, 0]
; [((RotorRouter [[[1, 2]], [[3]]]) ./ 1).channels, ((RotorRouter [[[1, 2]], [[3]]]) ./ 1).## = (RotorRouter [[[1, 2]], [[3]]]).##]
# [[[[1, 2], [3]]], <>]
```
A router's history is not bounded by the channel limit: its readout divides by
its longest channel's length, which never exceeds the Frames it holds, so a
one-channel router of 1,000,001 Frames divides into two (PR #482 review)
```
; .big ((500001 [1]) | (500000 [1]));
; [big.#, ((RotorRouter [big]) ./ 2).channels & {_.#}]
# [1000001, [500001, 500000]]
```
Routing appends to channel C mod k directly, without replaying the history, so
routing grows linearly: three thousand Frames route into three channels in turn
```
; .grown ((3000 [1]) | (RotorRouter [[], [], []]));
; [grown.#, grown.channels & {_.#}, (grown ./ 3) = grown, ((grown ./ 1).channels .0).# ]
# [3000, [1000, 1000, 1000], <>, 3000]
```
The divisor is refused as for a list
```
; [r7 ./ 0, r7 ./ (3 - 1), r7 ./ 1.5, r7 ./ [2], r7 ./ (Denum [1, 1, 1]), r7 ./ “two”]
# [$!.division-by-zero /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /, $!.division-domain /]
```
## A router's observers and fourth hash

A router of any arity declares its Count C, its Size, the sum of its channel
loads, and its residual, their alternating sum, as a channel Denum does. Its
fourth hash is the Denum of the same arity: a router of k channels other than
two is recognized intrinsically, as an instance of the shipped class, and
answers `Denum [C, loads]`, one load per channel, so it routes to channel
C mod k as its Denum deposits there. The binary router answers the binary Denum
it always did. At Count zero there is no Denum, for any arity
```
; [t3.#, t3.##, t3.###, “” t3.####, t3.#### = (Denum [7, [14, 6, 22]]), t3.####.## = t3.##, t3.####.### = t3.###]
# [7, 42, 30, “Denum(7,[14, 6, 22])”, <>, <>, <>]
; [“” (r7.####), ([] ./ 3).####, (RotorRouter [[], [], []]).####, “” ((([] ./ 3) 5).####)]
# [“Denum(7,24,18)”, (), (), “Denum(1,[5, 0, 0])”]
```
So the projection law `(r y).#### = r.#### y` holds for every arity: routing y
to channel C mod k and observing is depositing `y.##` there
```
; .nine [1, 2, 3, 4, 5, 6, 7, 8, 9];
; [1, 2, 3, 4, 5] & {.r (nine ./ _); ((r 10).####) = ((r.####) 10)}
# [<>, <>, <>, <>, <>]
; [“” ((t3 10).####), “” ((nine ./ 1).####), “” ((nine ./ 4).####)]
# [“Denum(8,[14, 16, 22])”, “Denum(9,[45])”, “Denum(9,[15, 8, 10, 12])”]
```
Recognition reads nothing the router computes: a record that only spells
`channels` is not a router, and a failed child Size is answered as it is
```
; [[.channels [[1], [], []]].####, ([Failing] ./ 3).####]
# [(), $!.name-missing “...]
```
## Whole Frames and Size units

Whole-Frame division and Size-unit division agree on the total and differ on
the channels. Children of Sizes 5 and 2 dealt into two channels load them 5
and 2, as list and router; the Denum of the same list, normalized, loads them 4
and 3. They are different states with the same Size, and neither is wrong
```
; .two [5, 2];
; [loads (two ./ 2).channels, ((two | r0) ./ 2).channels & {load _}, “” (two.#### ./ 2), ((two | r0) ./ 2).#### = (two.#### ./ 2), ((two | r0) ./ 2).####.## = (two.#### ./ 2).##]
# [[5, 2], [5, 2], “Denum(2,4,3)”, (), <>]
```
They agree when every child has Size one, since then each Frame is one Size
unit. With other Sizes they need not
```
; .ones [1, 1, 1, 1, 1, 1, 1];
; [((ones | r0) ./ 3).channels & {load _}, (ones.#### ./ 3).loads, loads ([5, 2, 9, 1] ./ 3).channels, ([5, 2, 9, 1].#### ./ 3).loads]
# [[3, 2, 2], [3, 2, 2], [6, 2, 9], [6, 6, 5]]
