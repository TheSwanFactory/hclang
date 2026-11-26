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
Two channels are a router like any other. One
channel is the whole list, and more channels than elements leave the last ones
empty. An empty list deals into n empty channels; empty elements are dealt
like any other
```
; [“” ([1, 2, 3] ./ 2), (([1, 2, 3] ./ 2).channels .0), (([1, 2, 3] ./ 2).# %% 2)]
# [“RotorRouter([[1, 3], [2]])”, [1, 3], 1]
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
# [“RotorRouter([[[1, [2]], 3, 5], [2, 4, 6]])”, “RotorRouter([[[1, [2]], 3, 5], [2, 4, 6]])”, <>, <>, <>]
; [((X ./ 2) ./ 3).channels, (((X ./ 2) ./ 3).channels .0 .0) === A]
# [[[[1, [2]], 4], [2, 5], [3, 6]], <>]
```
A plain list whose children are lists is not a division: its two children are
two whole Frames, dealt as such, even when they look like channels
```
; .N [[1, 3, 5], [2, 4, 6]];
; [“” (N ./ 2), ((N ./ 2).channels .0) .0 = [1, 3, 5], (N ./ 2).# , “” ((N ./ 2) ./ 2)]
# [“RotorRouter([[[1, 3, 5]], [[2, 4, 6]]])”, <>, 2, “RotorRouter([[[1, 3, 5]], [[2, 4, 6]]])”]
```
Uneven channels read back in dealt order: seven Frames into three channels,
then into one, give the seven in order; into two they are dealt again from
that order
```
; .Y [1, 2, 3, 4, 5, 6, 7];
; [“” (Y ./ 3), (((Y ./ 3) ./ 1).channels .0) = Y, “” ((Y ./ 3) ./ 2), ((Y ./ 3) ./ 2) = (Y ./ 2)]
# [“RotorRouter([[1, 4, 7], [2, 5], [3, 6]])”, <>, “RotorRouter([[1, 3, 5, 7], [2, 4, 6]])”, <>]
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
Numbers keep exact numeric division. Any other pair, such as a Frame that is
neither a number nor an ordered list, or a number divided by text, is outside
the domain too (#361)
```
; [6 ./ 3, 7 ./ 2, 7 / 2, “abcd” ./ 2, <1, 2> ./ 2, 1 / “text”]
# [2, 7/2, 7/2, $!.division-domain /, $!.division-domain /, $!.division-domain /]
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
## Denum — constructive Size-unit division (FOIST 19a)

The divisor redistributes Size units, not whole routed Frames. Denum Count
remains independent of arity, and the new public third hash exposes the raw
Denum. Fourth hash is KD coordinates. The complete old Denum and Router observer
test contracts before FOIST 19a remain available in Git history.
```
; Denums <- './hc/denum.hc';
; .Denum Denums.Denum;
; “” (Denum [2, [5, 3]])
# “Denum(2,[5, 3])”
; “” ((Denum [2, [5, 3]]) ./ 3)
# “Denum(2,[3, 3, 2])”
; “” ((Denum [3, [5, 2]]) / 2)
# “Denum(3,[4, 3])”
; [(Denum [2, [5, 3]]).#, (Denum [2, [5, 3]]).##]
# [2, 8]
; “” (Denum [2, [5, 3]]).###
# “Denum(2,[5, 3])”
; (Denum [2, [5, 3]]).####
# [2]
```
## Router — routed Frames are not Denum Size units

A RotorRouter retains the Frames it routed. Its raw third hash observes one
Size load per already existing channel; its fourth hash reads their antipodal
KD coordinates. The Count-zero router retains its channel slots, unlike
the canonical zero-load empty ordinary array.
```
; Routers <- './hc/rotor-router.hc';
; .r0 (Routers.RotorRouter [[], []]);
; .r2 ((r0 5) 2);
; [r0.#, r2.#, r2.channels]
# [0, 2, [[5], [2]]]
; “” r0.###
# “Denum(0,[0, 0])”
; “” r2.###
# “Denum(2,[5, 2])”
; r2.####
# [3]
; (r2 / 3).channels
# [[5], [2], []]
```
## Flop, Cart, and signed-XOR product

Unlike structural Cart, KD multiplication accumulates routed nonnegative
magnitudes into a new Denum; the product Count is the product of operand Counts.
```
; “” ((Denum [2, [5, 3]]) + (Denum [2, [1, 2]]))
# “Denum(4,[6, 5])”
; (Denum [2, [5, 3]]) * (Denum [2, [1, 2]])
# [[5, 1], [5, 2], [3, 1], [3, 2]]
; “” ((Denum [2, [0, 1]]) &|& (Denum [2, [0, 1]]))
# “Denum(4,[1, 0])”
; ((Denum [2, [0, 1]]) &|& (Denum [2, [0, 1]])).####
# [1]
```
## Importing

The bundled file is an executable testdoc; it installs no global rebindings.
```
[] = []
