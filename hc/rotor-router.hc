#!/usr/bin/env hc
```
RotorRouter (occurrence/figure 011.21)

A RotorRouter is a router of k ordered channels, k ≥ 1, that keeps what it
routes. Its state is the channels, arrays of the Frames routed into them, and
nothing else. Applying a router to a Frame appends that Frame, the same Frame,
to channel `C mod k`, where C is the children it holds. A Denum follows the same
round-robin by Size alone; a router keeps the children, so its numerical shadow
is a Denum and its state is everything that shadow forgets: which Frames, in
what order, and which channel. Every number of channels is the same class, with
the same fields, methods and text; two channels are not a special case.

`RotorRouter` is an ordinary HC class, like `Denum` in `hc/denum.hc`: a
constructor closure answering a fresh aggregate whose fields are its state and
whose methods are the class. Import it with
`Routers <- './hc/rotor-router.hc'`, then `Routers.RotorRouter [[], []]`.

**State (007.25e, 007.40).** `RotorRouter [ch0, …, chk−1]` takes k ≥ 1 arrays,
the ordered channels. A router stores exactly one field, `channels`, so nothing
can disagree with it. Its Count C is the children it holds, and the next route
goes to channel `C mod k`. There is no phase argument: earlier versions took
`RotorRouter [phase, left, right]`, a free phase beside the channels; that form
is removed, with no alias. Through v0.49.0 the two-channel router was a
separate builder that also stored `left`, `right` and `phase`.

**Admissibility.** Routing from empty channels starts at channel 0 and deals
round-robin, so a routed history leaves the first `C mod k` channels one longer
than the rest, and conversely every such profile is the one history that sent
`ch0.0`, `ch1.0`, …, `ch0.1`, … in turn. The constructor admits exactly the
channels whose Counts are the dealing of C children into k,
`round-robin [C, k]`, and refuses every other with `$!!.invalid-router`, a
named error, as `Denum` refuses with `$!!.invalid-denum`: with two channels,
`RotorRouter [[A], [B, C]]` and `RotorRouter [[A, B], []]` are not histories,
and no history or offset is invented for them. Routing keeps the invariant, so
every router a program can hold satisfies it. A channel is its elements: an
array's properties are configuration, not routed Frames, so the constructor
keeps the elements in a fresh array of its own, counts them there, and a
channel argument that declares `apply` cannot change what appending means.
Anything that is not a nonempty list of arrays is refused the same way.

**Routing**, `router x`: append x as one member of channel `C mod k`; the Count
grows by one. A small cursor, built in the route itself, rebuilds the list of
channels with the Frame added to that one, so a route costs one pass over the k channels and
never replays the history (PR #482 review). Routing never evaluates x, never
measures it, and never runs its methods, so a closure is kept uncalled, an
array or group is kept as one member, and a Frame whose Size fails or runs code
is routed like any other. A Frame of Size zero still takes a slot. It is a
mutating method, `apply_`, so through a name it is a functional update that
leaves the router as it was, and through a mutable name it writes the router in
place. Routing nil routes nothing and leaves the router as it was, as applying a
Denum to nil does. A flagged error such as `1 / 0` is the answer of the
expression that applies the router, so it is never routed.

**Observers.** A router declares its Count, Size and residual as a Denum does
(007.25c): its Count C, the sum of its channel loads and their alternating sum,
where each load is the sum of the Sizes of the children routed into that
channel. An empty channel has load 0, the empty sum; a nonempty channel's load
is its native Size, which is that sum. Its fourth hash is the Denum of its
Count and channel loads, `Denum [C, [load0, …]]`: the fourth hash recognizes
an instance of this class intrinsically, as it recognizes a Denum, and reads
each channel's Size once. That Denum is the router's numerical shadow; at
Count zero there is none. Observation is where children are measured, so it is
where their failures show, and declared observers run only when the router is
observed: routing runs none of them, and observing writes nothing. The Denum
forgets which Frames were routed and their order, so distinct routers can share
one.

**The projection law.** For every router r whose fourth hash exists, that is
every router with C ≥ 1 whose children have Sizes, and every Frame y,
`(r y).#### = (r.####) y`: routing y into channel `C mod k` and then observing
adds `y.##` to that channel's load and one to C, which is exactly what applying
the Denum to y does. The empty router is the boundary: it has routed nothing,
so like the empty host `[]` its Count is zero and `.####` is nil, not a Denum
conjured to make the equation look true. There the law reads through the
zero-Count lifting the Denum class names, `(r0 y).#### = (Denum [0, 0, 0]) y`.

**Text.** A router prints as its fields and methods, and as text reads
`RotorRouter([ch0, ch1, …])`, the list of its channels, for every number of
channels.

`router ./ n`, also spelled `router / n`, re-deals the Frames it holds: it
reconstructs the order they were routed in from its channels, which their
admissibility fixes, and routes that history through a fresh router of n
channels, that is, it is the history divided as a list, `history / n`, since
list division answers the n-channel router of its channels (007.27c).
Reconstructing the history is the breadth-first readout of 007.27c: the first
Frame of each channel in channel order, then the second of each, and so on. Every Frame stays the
same Frame, whole, in order, exactly once, and nothing is evaluated or
measured; the Count is kept and the next route goes to channel C mod n. The
history is the dealing inverted: the channels, the short ones padded with a
sentinel to the longest, are concatenated and dealt into that many channels,
which are the rounds, and the sentinels removed. One channel is its own
history, and channels of equal length need no sentinel. The readout divides by
the longest channel's length, which never exceeds the Frames held, so it is
never refused by the channel limit. The divisor is refused as a list refuses
it. `hc/division.hc` is its specification.

**Methods read their own state through `_^`.** A router is applied to
arbitrary Frames, and a bare name in a method is looked up on the argument
first (spec 7), so a router reads its fields through the receiver, `_^` from
the method body. What a branch needs is bound as a local at method level. The
file's own names, `RotorRouter` and `history`, are read through the scope a
caret ladder reaches, `(_^^ .history)` from the method body, so an argument's
fields never stand in for them.
```
.channel-load {.c _; (c.# = 0) ? {0} : {c.##}};
.history {.cs _; .k (cs.#); .w ((cs .0).#); .pad [];
  (k = 1) ? {cs .0} : {(w = 0) ? {[]} : {
    .even ((((cs &| {_}).#) = (k * w)) ? {1} : {0});
    .padded ((even = 1) ? {cs} : {cs & {.ch _; (ch.# = w) ? {ch} : {ch pad}}});
    .flat ((((padded &| {_}) / w) .channels) &| {_});
    (even = 1) ? {flat} : {flat &| {.x _; (x === (_^^^^ .pad)) ? {[]} : {[x]}}}}}};
.round-robin {.s (_ .0); .ways (_ .1); .q (((s - (s %% ways)) / ways).##);
  [.low q; .short 0; .ok 1;
    .apply_ {.c _; .lo (_^ .low); .seen (_^ .short); .fine (_^ .ok);
      @ok ((((c = (lo + 1)) ? {seen = 0} : {c = lo}) ? {fine = 1}) ? {1} : {0}); @short ((c = lo) ? {1} : {seen});}]};
.router-instance {.cs _; [
    .channels cs;
    .apply_ {.x _; .cs (_^ .channels); .n ((cs & {_.#}).##);
      .at (n %% (cs.#)); .item [x];
      .cursor [.index 0; .target at; .item item; .out []; .apply_ {.v _; .i (_^ .index); .t (_^ .target); .it (_^ .item); .o (_^ .out); @out (o ((i = t) ? {it | v} : {v})); @index (i + 1);}];
      @channels ((cs | cursor) .out);};
    .# {((_^ .channels) &| {_}).#};
    .## {((_^ .channels) & {channel-load _}).##};
    .### {((_^ .channels) & {channel-load _}).###};
    ./ {.ways _; ((_^^ .history) (_^ .channels)) / ways};
    .toText {“RotorRouter(” (_^ .channels) “)”}
  ]};
.RotorRouter {((_ ~ ([].<>)) ? {(__ .#) .> 0}) ? {.a __;
  ((a &| {.x _; (x ~ ([].<>)) ? {[]} : {[x]}}).# = 0) ? {.cs (a & {_ | []}); .k (cs.#); .n ((cs &| {_}).#);
    ((k .> 0) ? {(((cs & {_.#}) | (round-robin [n, k])) .ok) = 1}) ? {router-instance cs} : {$!!.invalid-router}
  } : {$!!.invalid-router}} : {$!!.invalid-router}};
```
## Construction

A router holds exactly its channels. The initial router of two channels is
present, both channels empty, Count zero, next route to channel 0
```
; .r0 (RotorRouter [[], []]);
; [(r0.# %% 2), (r0.channels .0), (r0.channels .1), r0.#, “” r0]
# [0, [], [], 0, “RotorRouter([[], []])”]
```
Every admissible pair is a router, its next channel the parity of its Count: as
many children in channel 0 as in channel 1 is even and next 0, one more in
channel 0 is odd and next 1.
Preloads of any length are admitted on the same terms
```
; [RotorRouter [[5], []], RotorRouter [[5], [6]], RotorRouter [[5, 7], [6]], RotorRouter [[1, 2, 3, 4], [5, 6, 7, 8]], RotorRouter [[1, 2, 3, 4, 5], [6, 7, 8, 9]]] & {[_.#, (_.# %% 2)]}
# [[1, 1], [2, 0], [3, 1], [8, 0], [9, 1]]
```
A pair that is not a round-robin history from channel 0 is refused: channel 1
ahead of channel 0, channel 0 more than one ahead, and the old phase-first form, whose three
arguments are not two channels. No history is invented for them
```
; [RotorRouter [[], [5]], RotorRouter [[5], [6, 7]], RotorRouter [[5, 6], []], RotorRouter [[1, 2, 3], [4]], RotorRouter [[], [1, 2, 3]]]
# [$!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router]
; [RotorRouter [2, [], []], RotorRouter [1, [5], []], RotorRouter [2, [5]], RotorRouter [1, []]]
# [$!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router]
```
Anything but a nonempty list of arrays is refused. One channel or three are
not refused: they are routers of another arity (007.27, `hc/division.hc`)
```
; [RotorRouter [[], 5], RotorRouter [(1, 2), []], RotorRouter [], RotorRouter [[], [5], []], RotorRouter 5, RotorRouter ()]
# [$!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router]
```
A channel is its elements. The router keeps them in an array of its own, so a
channel's properties and a declared `apply` do not come with it, and only the
elements are counted for admissibility
```
; .Hijack [.apply {“hijack”}; 1];
; [((RotorRouter [[.tag 9; 5], []]).channels .0), (((RotorRouter [Hijack, []]) 7).channels .1), RotorRouter [[.a 1; .b 2], [5]]]
# [[5], [7], $!!.invalid-router]
```
## Routing alternates

From the initial router, routing A, B and C sends A and C to channel 0 and B to
channel 1, and the next route goes to channel 1
```
; .A [1, [2]]; .B “b”; .C {5 + 3};
; .r3 (((r0 A) B) C);
; [(r3.# %% 2), (r3.channels .0), (r3.channels .1), r3.#]
# [1, [[1, [2]], { 5 + 3 }], [“b”], 3]
; “” r3
# “RotorRouter([[[1, [2]], { 5 + 3 }], [“b”]])”
```
The router that was routed into is left as it was
```
; [(r0.# %% 2), (r0.channels .0), (r0.channels .1)]
# [0, [], []]
```
The next channel is the parity of the Count after every route, so each
successor is admissible again: routing from Count 0 through Count 6 alternates
channel 0, 1, 0, …
```
; .steps [r0, (r0 1), ((r0 1) 2), (((r0 1) 2) 3), ((((r0 1) 2) 3) 4), (((((r0 1) 2) 3) 4) 5), ((((((r0 1) 2) 3) 4) 5) 6)];
; [steps & {_.#}, steps & {(_.# %% 2)}, steps & {(_.channels .0).#}, steps & {(_.channels .1).#}]
# [[0, 1, 2, 3, 4, 5, 6], [0, 1, 0, 1, 0, 1, 0], [0, 1, 1, 2, 2, 3, 3], [0, 0, 1, 1, 2, 2, 3]]
; steps & {(RotorRouter [(_.channels .0), (_.channels .1)]) = _}
# [<>, <>, <>, <>, <>, <>, <>]
```
## Routing keeps the Frame

A channel member is the routed Frame itself. An array or a group is routed as
one member, never spread into its elements, and a closure is kept, not called.
Iterating a channel yields its members as they are. Reading a closure by dot
from an aggregate, `(r3.channels .0) .1`, answers a method bound to that aggregate,
which is the general rule for methods and not the router's, so the closure's
identity is seen by iterating
```
; [(r3.channels .0) .0 === A, (r3.channels .1) .0 === B, (r3.channels .0) & {_ === C}]
# [<>, <>, [(), <>]]
; [((r0 [1, 2]).channels .0), ((r0 (4, 5)).channels .0), ((r0 {5 + 3}).channels .0), ((r0 []).channels .0)]
# [[[1, 2]], [(4, 5)], [{ 5 + 3 }], [[]]]
```
A Frame held through a mutable name is the same Frame in the channel, so a
write through that name shows there. A write reached through an immutable
router is a functional update, as it is everywhere, so it changes neither
```
; .kid_ [.n 1; .set_ {@n _;}];
; .rk (r0 kid_);
; kid_.set_ 5;
; [((rk.channels .0) .0) === kid_, ((rk.channels .0) .0).n]
# [<>, 5]
; [(((rk.channels .0) .0).set_ 9).n, kid_.n, ((rk.channels .0) .0).n]
# [9, 5, 5]
```
## Preloaded states

An admissible preload continues its history: here one child in channel 0, so
Count 1, and the next two routes go to channel 1 then channel 0
```
; .p1 (RotorRouter [[A], []]);
; .p2 ((p1 B) C);
; [(p1.# %% 2), p1.#, (p2.# %% 2), (p2.channels .0), (p2.channels .1), (p1.channels .1)]
# [1, 1, 1, [[1, [2]], { 5 + 3 }], [“b”], []]
; [p2 = r3, p2 = (RotorRouter [[A, C], [B]])]
# [<>, <>]
```
Routers built from the same channel share no writable state: each holds its
own channel array. Through a mutable name, routing writes that router in place
and no other
```
; .ch [A];
; .u (RotorRouter [ch, []]); .v (RotorRouter [ch, []]);
; .m_ (RotorRouter [ch, []]);
; m_ B;
; m_ C;
; [(m_.# %% 2), (m_.channels .0), (m_.channels .1), (u.channels .0), (v.channels .0), ch]
# [1, [[1, [2]], { 5 + 3 }], [“b”], [[1, [2]]], [[1, [2]]], [[1, [2]]]]
; [(u.channels .0) === ch, (u.channels .0) === (v.channels .0), ((u.channels .0) .0) === ((v.channels .0) .0)]
# [(), (), <>]
```
A router captured by a closure, mapped, or reduced into routes the same way,
and the captured one stays as it was
```
; .start (RotorRouter [[], []]); .step {start _};
; [((step 5).channels .0), ((step 3).channels .0), (start.channels .0)]
# [[5], [3], []]
; [r0, p1] & {((_ 5).channels .1)}
# [[], [5]]
; “” ([A, B, C] | r0)
# “RotorRouter([[[1, [2]], { 5 + 3 }], [“b”]])”
```
## Routing measures nothing

Routing does not observe the Frame it routes. A Frame whose Size fails, one
whose Size is cyclic, and one whose Size runs code that counts are routed
like any other, and nothing ran
```
; .counter_ [.n 0; .inc_ {@n (_^.n + 1);}];
; .Counted [.## {counter_.inc_ (); 5}; 1];
; .Failing [.## {[].nope}; 1];
; .Cyclic [.## {_^.##}];
; .rf ((((r0 Counted) Failing) Cyclic) Counted);
; [(rf.# %% 2), (rf.channels .0).#, (rf.channels .1).#, counter_.n]
# [0, 2, 2, 0]
```
Observing the router is where they are measured, so it is where they fail and
where the counting code runs. The fourth hash reads each channel's Size once,
so a child's Size is read once
```
; (r0 Failing).####
# $!.name-missing “...
; (r0 Cyclic).####
# $!.cyclic-observation .##
; “” ((r0 Counted).####)
# “Denum(1,[5, 0])”
; counter_.n
# 1
```
An error is the answer of the expression that applies the router, so it is
never routed. A diagnostic failure such as a missing name is an error too
(#467), so it is not routed either
```
; r0 (1 / 0)
# $!.division-by-zero /
; r0 ([].nope)
# $!.name-missing “...
```
Routing nil routes nothing
```
; [((r0 ()).# %% 2), ((r0 ()).channels .0), (p1 ()).#]
# [0, [], 1]
```
## Empty and zero

The initial router has routed no children, so its Count is zero, and like the
empty host it has no Denum. Its Size and residual still read zero, and it is a
present router. The Denum of Count zero is a different thing, a Denum
constructed as such, which routing from the router reaches after one route
```
; [r0.#, r0.##, r0.###, (r0.# %% 2), r0.####, [].####]
# [0, 0, 0, 0, (), ()]
; Denums <- './hc/denum.hc';
; [((r0 0).####) = ((Denums.Denum [0, 0, 0]) 0), ((r0 []).####) = ([] []).####]
# [<>, <>]
```
A Frame of Size zero takes a slot and moves the next channel, and an empty array
routed as a child has Size 1, while an empty channel has load 0
```
; .z (r0 0);
; [(z.# %% 2), (z.channels .0), z.#, “” (z.####)]
# [1, [0], 1, “Denum(1,[0, 0])”]
; [“” ((r0 []).####), “” (((r0 []) []).####), “” ((((r0 0) 0) 0).####)]
# [“Denum(1,[1, 0])”, “Denum(2,[1, 1])”, “Denum(3,[0, 0])”]
```
## The router's Denum

Each load is the sum of its channel's child Sizes, as exact Counts, over text,
numbers, nested arrays, groups, closures, all, and a Frame routed twice, which
counts each time it was routed
```
; .shared [[], []];
; .mix ((((((((r0 “hello”) 7) [[1, 2], [3]]) (4, 5)) shared) shared) {5 + 3}) <>);
; [(mix.channels .0), (mix.channels .1)]
# [[“hello”, [[1, 2], [3]], [[], []], { 5 + 3 }], [7, (4, 5), [[], []], <>]]
; [(mix.channels .0) & {_.##}, (mix.channels .1) & {_.##}, “” (mix.####)]
# [[5, 6, 2, 9], [7, 9, 2, 1], “Denum(8,[22, 19])”]
; “” (((r0 123456789012345678901234567890) 987654321098765432109876543210).####)
# “Denum(2,[123456789012345678901234567890, 987654321098765432109876543210])”
```
A router's Denum is `Denum [C, [load0, load1]]` of its own channels, and its
parity is the router's, for every Count from 1 to 6 and for preloads
```
; .sh (steps & {_.####});
; [sh & {_ = ()}, sh & {_.#}]
# [[<>, (), (), (), (), (), ()], [(), 1, 2, 3, 4, 5, 6]]
; [steps &| {.k _; (k.# .> 0) ? {[(k.# %% 2) = (k.#### .# %% 2)]} : {[]}}, (RotorRouter [[2, 3], [1]]).#### = (Denums.Denum [3, 5, 1])]
# [[<>, <>, <>, <>, <>, <>], <>]
```
## Observing commutes with routing

Routing each child of an array X in turn, from the initial router, is the
reduce `X | r0`. Its channel 0 holds the children at even positions and its
channel 1 those at odd positions, and its next channel is the parity of X's Count.
That interleaving is the admissibility invariant, so the same router is
constructed directly from the two channels
```
; .X [5, “ab”, [1, 2]];
; .rx (X | r0);
; [(rx.channels .0), (rx.channels .1), (rx.# %% 2), rx = (RotorRouter [[5, [1, 2]], [“ab”]])]
# [[5, [1, 2]], [“ab”], 1, <>]
```
For every router whose fourth hash exists, routing Y then observing is applying
the router's Denum to Y, which adds one to the Count. Its fourth hash is X's,
Count included. The law holds for routers built by routing and for admissible
preloads alike, in both parities, and for a zero-Size child
```
; .Y [[], [], []];
; [(rx.####) = X.####, ((rx Y).####) = (X Y).####, ((rx Y).####) = ((rx.####) Y), (rx.####).# = X.#, ((rx Y).####).# = (X.# + 1)]
# [<>, <>, <>, <>, <>]
; [((p1 Y).####) = ((p1.####) Y), ((p2 {5 + 3}).####) = ((p2.####) {5 + 3}), ((p1 0).####) = ((p1.####) 0)]
# [<>, <>, <>]
; .pre [RotorRouter [[A], []], RotorRouter [[A], [B]], RotorRouter [[A, B], [C]], RotorRouter [[1, 2, 3, 4], [5, 6, 7, 8]], RotorRouter [[1, 2, 3, 4, 5], [6, 7, 8, 9]]];
; [pre & {((_ Y).####) = ((_.####) Y)}, pre & {((_ 0).####) = ((_.####) 0)}, pre & {((_ Y).# %% 2) = (((_.####) Y).# %% 2)}]
# [[<>, <>, <>, <>, <>], [<>, <>, <>, <>, <>], [<>, <>, <>, <>, <>]]
```
The same holds at every step of a walk, Count 1 to 6, and a router can never
route to the channel its Denum does not deposit into
```
; steps &| {.k _; (k.# .> 0) ? {[((k Y).####) = ((k.####) Y)]} : {[]}}
# [<>, <>, <>, <>, <>, <>]
; steps &| {.k _; (k.# .> 0) ? {[[(((k 4).channels .0).# - (k.channels .0).#), ((((k.####) 4).loads .0) - (k.#### .loads .0))]]} : {[]}}
# [[0, 0], [1, 4], [0, 0], [1, 4], [0, 0], [1, 4]]
```
A failed Size is the answer on both sides: the router routes the Frame and its
Denum fails when observed, and the Denum refuses the deposit with the same error
```
; [((p1 Failing).####), ((p1.####) Failing)]
# [$!.name-missing “..., $!.name-missing “...]
```
The empty host is the boundary. `[].####` is nil, so `X.####` fails the first
equation when X is empty, and so does the initial router, which has routed
nothing and so has Count zero: it has no Denum, and none is faked. The law there
reads through the Denum class's zero-Count lifting, `Denum [0, 0, 0]`, and after
one route the equation holds again
```
; [r0.####, ([] | r0) = r0, (([] | r0).####) = [].####, (([Y] | r0).####) = ([] Y).####, ((r0 Y).####) = ((Denums.Denum [0, 0, 0]) Y), ((r0 0).####) = ((Denums.Denum [0, 0, 0]) 0)]
# [(), <>, <>, <>, <>, <>]
```
## The Denum forgets

Distinct routers can share a Denum: the fourth hash keeps only the Count and two
sums, not which Frames were routed, nor their order, nor how the load was split
among them. It does keep how many were routed, so a router with fewer children
and the same loads has a different Denum
```
; .s1 (RotorRouter [[2, 3], [1]]); .s2 (RotorRouter [[5], [1]]); .s3 (RotorRouter [[3, 2], [1]]); .s4 (RotorRouter [[1, 4], [1]]);
; [s1 = s2, s1 = s3, (s1.####) = (s3.####), (s1.####) = (s4.####), (s1.####) = (s2.####), s1.#, s2.#, s1.##, s2.##]
# [(), (), <>, <>, (), 3, 2, 6, 6]
```
## Observers, declared

A router's Count, Size and residual are its Denum's, and its fourth hash is a
Denum, not the router: equal, it would have to be the same class. Its channels
are fields, not elements, so iterating a router yields nothing. A router
inside an aggregate contributes its declared Size, as a Denum does
```
; [[r3.#, r3.##, r3.###] = [r3.####.#, r3.####.##, r3.####.###], r3.#### = r3, r3.####.#### = r3.####]
# [<>, (), <>]
; [r3 & {_}, [r3, r3].##, [r3].#### = [13].####]
# [[], 26, <>]
```
Observing a router runs its declared observers and nothing else. It routes
nothing and writes nothing, so the router is as it was
```
; .seen (((r0 A) B) C);
; seen.####;
; [seen = r3, (seen.# %% 2), (seen.channels .0).#, (seen.channels .1).#]
# [<>, 1, 2, 1]
```
## Reading the receiver

An argument whose fields share the router's names, or its locals', is routed
as one member, and the router reads only its own fields and its own Count
```
; .masked (r0 [.phase 1; .left [8]; .x 9; .l [7]; .n 1; 4]);
; [(masked.# %% 2), (masked.channels .0).#, ((masked.channels .0) .0).x, (masked.channels .1)]
# [1, 1, 9, []]
```
Carets count lexically (spec a06). Inside a branch, `_^` is the method's own
scope, so a router that reads its channel there reads nothing. That failure is
the method's answer and ends it at the failed write (#467), so even through a
mutable name the router is unchanged. `_^^` is the receiver from inside the
branch
```
; .WrongRouter {[.phase 2; .left []; .apply_ {.x _; ((_^ .phase) = 2) ? {@left (_^ .left x); @phase 1;};}]};
; .w_ (WrongRouter ());
; w_ 5
# $!.name-missing “...
; [w_.phase, w_.left]
# [2, []]
; .RightRouter {[.phase 2; .left []; .apply_ {.x _; ((_^ .phase) = 2) ? {@left (_^^ .left x); @phase 1;};}]};
; .rr ((RightRouter ()) 5);
; [rr.phase, rr.left]
# [1, [5]]
```
## Text and spelling

A router prints as the aggregate it is, and that spelling, written back as
source, is an equal router. Its declared observers are spelled `.#`, `.##` and
`.###`, which an expectation line, itself a `#…#` comment, cannot hold, so the
printed form is matched here by its beginning
```
; RotorRouter [[5], []]
# [.channels [[5], []]; .apply_ {...
; (RotorRouter [[5], []]) = [.channels [[5], []]; .apply_ { .x _; .cs (_^ .channels); .n ((cs & { _ .# }) .##); .at (n %% (cs .#)); .item [x]; .cursor [.index 0; .target at; .item item; .out []; .apply_ { .v _; .i (_^ .index); .t (_^ .target); .it (_^ .item); .o (_^ .out); @out (o ((i = t) ? { it | v } : { v })); @index (i + 1); }]; @channels ((cs | cursor) .out); }; .# { ((_^ .channels) &| { _ }) .# }; .## { ((_^ .channels) & { channel-load _ }) .## }; .### { ((_^ .channels) & { channel-load _ }) .### }; ./ { .ways _; ((_^^ .history) (_^ .channels)) / ways }; .toText { “RotorRouter(” (_^ .channels) “)” };]
# <>
```
## Importing

Imported, the file binds the same class. The import is an example line, so
importing this file does not import it again
```
; Routers <- './hc/rotor-router.hc';
; [(Routers.RotorRouter [[], []]) = r0, “” ((Routers.RotorRouter [[], []]) 4), (((Routers.RotorRouter [[], []]) 4).####) = [4].####]
# [<>, “RotorRouter([[4], []])”, <>]
