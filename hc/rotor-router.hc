#!/usr/bin/env hc
```
RotorRouter (occurrence/figure 011.21)

A RotorRouter is a two-channel router that keeps what it routes. Its state is
two ordered arrays, left and right, of the Frames routed into them, and nothing
else. Applying a router to a Frame appends that Frame, the same Frame, to the
channel its Count selects. A Demi follows the same alternation by Size alone; a
router keeps the children, so its numerical shadow is a Demi and its state is
everything that shadow forgets: which Frames, in what order, and which channel.

`RotorRouter` is an ordinary HC class, like `Demi` in `hc/demi.hc`: a
constructor closure answering a fresh aggregate whose fields are its state and
whose methods are the class. Import it with
`Routers <- './hc/rotor-router.hc'`, then `Routers.RotorRouter [[], []]`.

**State (007.25e).** `RotorRouter [left, right]` takes two arrays, the two
ordered channels. There is no phase argument: the router's Count is
`C = left.# + right.#`, the children it holds, and its phase is read from the
parity of C exactly as a Demi's is, 2 when C is even (left next) and 1 when C is
odd (right next). Earlier versions took `RotorRouter [phase, left, right]`, a
free phase beside the channels; that form is removed, with no alias, so the
router's routing phase, its Count and the phase of its Demi are one fact.

**Admissibility.** Routing from empty channels starts left and alternates, so
every routed history has `left.# = right.#` (C even) or
`left.# = right.# + 1` (C odd), and conversely every such pair is the one
history that sent `left.0`, `right.0`, `left.1`, … in turn. The constructor
admits exactly those pairs and refuses every other pair with
`$!!.invalid-router`, a named error, as `Demi` refuses with `$!!.invalid-demi`:
`RotorRouter [[A], [B, C]]` and `RotorRouter [[A, B], []]` are not histories,
and no history or offset is invented for them. Routing keeps the invariant, so
every router a program can hold satisfies it. A channel is its elements: an
array's properties are configuration, not routed Frames, so the constructor
keeps the elements in a fresh array of its own, counts them there, and a
channel argument that declares `apply` cannot change what appending means.
Anything that is not two arrays is refused the same way.

**Routing**, `router x`: append x as one member of the channel the parity of C
selects; the Count grows by one and the phase flips with it. `router.phase` is
a field written only together with that append, read from the same parity, so
it is never independent state. Routing never evaluates x, never measures it,
and never runs its methods, so a closure is kept uncalled, an array or group is
kept as one member, and a Frame whose Size fails or runs code is routed like any
other. A Frame of Size zero still takes a slot and flips the phase. It is a
mutating method, `apply_`, so through a name it is a functional update that
leaves the router as it was, and through a mutable name it writes the router in
place. Routing nil routes nothing and leaves the router as it was, as applying a
Demi to nil does. A flagged error such as `1 / 0` is the answer of the
expression that applies the router, so it is never routed.

**Observers.** A router declares its Count, Size and residual as a Demi does
(007.25c): its Count C, its total load L+R and the signed difference L−R, where
each load is the sum of the Sizes of the children routed into that channel. So
`router.####` derives the router's Demi as it derives any Frame's,
`Demi(C, L, R)`, and that Demi is the router's numerical shadow. Its phase is
the router's phase, because both are the parity of the same C. An empty channel
has load 0, the empty sum; a nonempty channel's load is its native Size, which
is that sum. Observation is where children are measured, so it is where their
failures show, and declared observers run only when the router is observed:
routing runs none of them, and observing writes nothing. The Demi forgets which
Frames were routed and their order, so distinct routers can share one.

**The projection law.** For every router r whose fourth hash exists, that is
every router with C ≥ 1 whose children have Sizes, and every Frame y,
`(r y).#### = (r.####) y`: routing y into the channel the parity of C selects
and then observing adds `y.##` to that channel's load and one to C, which is
exactly what applying `Demi(C, L, R)` to y does. The empty router `[[], []]` is
the boundary: it has routed nothing, so like the empty host `[]` its Count is
zero and `.####` is nil, not a Demi conjured to make the equation look true.
There the law reads through the zero-Count lifting the Demi class names,
`(r0 y).#### = (Demi [0, 0, 0]) y`.

**Text.** A router prints as its fields and methods, and as text reads
`RotorRouter([…],[…])`, each channel as its spelling, the constructor's own
shape.

**Methods read their own state through `_^`.** A router is applied to
arbitrary Frames, and a bare name in a method is looked up on the argument
first (spec 7), so a router reads its fields through the receiver, `_^` from
the method body. What a branch needs is bound as a local at method level.
```
.channel-load {.c _; (c.# = 0) ? {0} : {c.##}};
.RotorRouter {((_ ~ ([].<>)) ? {(__ .#) = 2}) ? {.l (__ .0); .r (__ .1);
  ((l ~ ([].<>)) ? {r ~ ([].<>)}) ? {.lc (l | []); .rc (r | []); .a (lc.#); .b (rc.#);
  ((a = b) : {a = (b + 1)}) ? {[
    .phase ((a = b) ? {2} : {1});
    .left lc;
    .right rc;
    .apply_ {.x _; .l (_^ .left); .r (_^ .right); .n (l.# + r.#);
      ((n %% 2) = 0) ? {@left (l x); @phase 1;} : {@right (r x); @phase 2;};};
    .# {.l (_^ .left); .r (_^ .right); l.# + r.#};
    .## {(channel-load (_^ .left)) + (channel-load (_^ .right))};
    .### {(channel-load (_^ .left)) - (channel-load (_^ .right))};
    .toText {“RotorRouter(” (_^ .left) “,” (_^ .right) “)”}
  ]} : {$!!.invalid-router}} : {$!!.invalid-router}} : {$!!.invalid-router}};
```
## Construction

A router holds exactly its two channels, and the phase they fix. The initial
router is present, both channels empty, Count zero, phase 2
```
; .r0 (RotorRouter [[], []]);
; [r0.phase, r0.left, r0.right, r0.#, “” r0]
# [2, [], [], 0, “RotorRouter([],[])”]
```
Every admissible pair is a router, in the phase its Count fixes: as many
children left as right is even and phase 2, one more left is odd and phase 1.
Preloads of any length are admitted on the same terms
```
; [RotorRouter [[5], []], RotorRouter [[5], [6]], RotorRouter [[5, 7], [6]], RotorRouter [[1, 2, 3, 4], [5, 6, 7, 8]], RotorRouter [[1, 2, 3, 4, 5], [6, 7, 8, 9]]] & {[_.#, _.phase]}
# [[1, 1], [2, 2], [3, 1], [8, 2], [9, 1]]
```
A pair that is not a left-first alternating history is refused: right ahead of
left, left more than one ahead, and the old phase-first form, whose three
arguments are not two channels. No history is invented for them
```
; [RotorRouter [[], [5]], RotorRouter [[5], [6, 7]], RotorRouter [[5, 6], []], RotorRouter [[1, 2, 3], [4]], RotorRouter [[], [1, 2, 3]]]
# [$!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router]
; [RotorRouter [2, [], []], RotorRouter [1, [5], []], RotorRouter [2, [5]], RotorRouter [1, []]]
# [$!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router]
```
Anything but two arrays is refused
```
; [RotorRouter [[], 5], RotorRouter [(1, 2), []], RotorRouter [[]], RotorRouter [[], [], []], RotorRouter 5, RotorRouter ()]
# [$!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router, $!!.invalid-router]
```
A channel is its elements. The router keeps them in an array of its own, so a
channel's properties and a declared `apply` do not come with it, and only the
elements are counted for admissibility
```
; .Hijack [.apply {“hijack”}; 1];
; [(RotorRouter [[.tag 9; 5], []]).left, ((RotorRouter [Hijack, []]) 7).right, RotorRouter [[.a 1; .b 2], [5]]]
# [[5], [7], $!!.invalid-router]
```
## Routing alternates

From the initial router, routing A, B and C sends A and C left and B right,
and the next route goes right
```
; .A [1, [2]]; .B “b”; .C {5 + 3};
; .r3 (((r0 A) B) C);
; [r3.phase, r3.left, r3.right, r3.#]
# [1, [[1, [2]], { 5 + 3 }], [“b”], 3]
; “” r3
# “RotorRouter([[1, [2]], { 5 + 3 }],[“b”])”
```
The router that was routed into is left as it was
```
; [r0.phase, r0.left, r0.right]
# [2, [], []]
```
The phase is the parity of the Count after every route, so each successor is
admissible again: routing from Count 0 through Count 6 alternates
left, right, left, …
```
; .steps [r0, (r0 1), ((r0 1) 2), (((r0 1) 2) 3), ((((r0 1) 2) 3) 4), (((((r0 1) 2) 3) 4) 5), ((((((r0 1) 2) 3) 4) 5) 6)];
; [steps & {_.#}, steps & {_.phase}, steps & {_.left.#}, steps & {_.right.#}]
# [[0, 1, 2, 3, 4, 5, 6], [2, 1, 2, 1, 2, 1, 2], [0, 1, 1, 2, 2, 3, 3], [0, 0, 1, 1, 2, 2, 3]]
; steps & {(RotorRouter [_.left, _.right]) = _}
# [<>, <>, <>, <>, <>, <>, <>]
```
## Routing keeps the Frame

A channel member is the routed Frame itself. An array or a group is routed as
one member, never spread into its elements, and a closure is kept, not called.
Iterating a channel yields its members as they are. Reading a closure by dot
from an aggregate, `r3.left.1`, answers a method bound to that aggregate,
which is the general rule for methods and not the router's, so the closure's
identity is seen by iterating
```
; [r3.left.0 === A, r3.right.0 === B, r3.left & {_ === C}]
# [<>, <>, [(), <>]]
; [(r0 [1, 2]).left, (r0 (4, 5)).left, (r0 {5 + 3}).left, (r0 []).left]
# [[[1, 2]], [(4, 5)], [{ 5 + 3 }], [[]]]
```
A Frame held through a mutable name is the same Frame in the channel, so a
write through that name shows there. A write reached through an immutable
router is a functional update, as it is everywhere, so it changes neither
```
; .kid_ [.n 1; .set_ {@n _;}];
; .rk (r0 kid_);
; kid_.set_ 5;
; [rk.left.0 === kid_, rk.left.0.n]
# [<>, 5]
; [(rk.left.0.set_ 9).n, kid_.n, rk.left.0.n]
# [9, 5, 5]
```
## Preloaded states

An admissible preload continues its history: here one child left, so Count 1
and phase 1, and the next two routes go right then left
```
; .p1 (RotorRouter [[A], []]);
; .p2 ((p1 B) C);
; [p1.phase, p1.#, p2.phase, p2.left, p2.right, p1.right]
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
; [m_.phase, m_.left, m_.right, u.left, v.left, ch]
# [1, [[1, [2]], { 5 + 3 }], [“b”], [[1, [2]]], [[1, [2]]], [[1, [2]]]]
; [u.left === ch, u.left === v.left, u.left.0 === v.left.0]
# [(), (), <>]
```
A router captured by a closure, mapped, or reduced into routes the same way,
and the captured one stays as it was
```
; .start (RotorRouter [[], []]); .step {start _};
; [(step 5).left, (step 3).left, start.left]
# [[5], [3], []]
; [r0, p1] & {(_ 5).right}
# [[], [5]]
; “” ([A, B, C] | r0)
# “RotorRouter([[1, [2]], { 5 + 3 }],[“b”])”
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
; [rf.phase, rf.left.#, rf.right.#, counter_.n]
# [2, 2, 2, 0]
```
Observing the router is where they are measured, so it is where they fail and
where the counting code runs. The fourth hash reads the router's Size and its
residual, and each measures both channels, so a child's Size is read twice
```
; (r0 Failing).####
# $!.name-missing “...
; (r0 Cyclic).####
# $!.cyclic-observation .##
; “” ((r0 Counted).####)
# “Demi(1,5,0)”
; counter_.n
# 2
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
; [(r0 ()).phase, (r0 ()).left, (p1 ()).#]
# [2, [], 1]
```
## Empty and zero

The initial router has routed no children, so its Count is zero, and like the
empty host it has no Demi. Its Size and residual still read zero, and it is a
present router in phase 2. The Demi of Count zero is a different thing, a Demi
constructed as such, which routing from the router reaches after one route
```
; [r0.#, r0.##, r0.###, r0.phase, r0.####, [].####]
# [0, 0, 0, 2, (), ()]
; Demis <- './hc/demi.hc';
; [((r0 0).####) = ((Demis.Demi [0, 0, 0]) 0), ((r0 []).####) = ([] []).####]
# [<>, <>]
```
A Frame of Size zero takes a slot and flips the phase, and an empty array
routed as a child has Size 1, while an empty channel has load 0
```
; .z (r0 0);
; [z.phase, z.left, z.#, “” (z.####)]
# [1, [0], 1, “Demi(1,0,0)”]
; [“” ((r0 []).####), “” (((r0 []) []).####), “” ((((r0 0) 0) 0).####)]
# [“Demi(1,1,0)”, “Demi(2,1,1)”, “Demi(3,0,0)”]
```
## The router's Demi

Each load is the sum of its channel's child Sizes, as exact Counts, over text,
numbers, nested arrays, groups, closures, all, and a Frame routed twice, which
counts each time it was routed
```
; .shared [[], []];
; .mix ((((((((r0 “hello”) 7) [[1, 2], [3]]) (4, 5)) shared) shared) {5 + 3}) <>);
; [mix.left, mix.right]
# [[“hello”, [[1, 2], [3]], [[], []], { 5 + 3 }], [7, (4, 5), [[], []], <>]]
; [mix.left & {_.##}, mix.right & {_.##}, “” (mix.####)]
# [[5, 6, 2, 9], [7, 9, 2, 1], “Demi(8,22,19)”]
; “” (((r0 123456789012345678901234567890) 987654321098765432109876543210).####)
# “Demi(2,123456789012345678901234567890,987654321098765432109876543210)”
```
A router's Demi is `Demi(C, L, R)` of its own channels, and its phase is the
router's phase, for every Count from 1 to 6 and for preloads
```
; .sh (steps & {_.####});
; [sh & {_ = ()}, sh & {_.#}]
# [[<>, (), (), (), (), (), ()], [(), 1, 2, 3, 4, 5, 6]]
; [steps &| {.k _; (k.# .> 0) ? {[k.phase = k.####.phase]} : {[]}}, (RotorRouter [[2, 3], [1]]).#### = (Demis.Demi [3, 5, 1])]
# [[<>, <>, <>, <>, <>, <>], <>]
```
## Observing commutes with routing

Routing each child of an array X in turn, from the initial router, is the
reduce `X | r0`. Its left channel holds the children at even positions and its
right channel those at odd positions, and its phase is the parity of X's Count.
That interleaving is the admissibility invariant, so the same router is
constructed directly from the two channels
```
; .X [5, “ab”, [1, 2]];
; .rx (X | r0);
; [rx.left, rx.right, rx.phase, rx = (RotorRouter [[5, [1, 2]], [“ab”]])]
# [[5, [1, 2]], [“ab”], 1, <>]
```
For every router whose fourth hash exists, routing Y then observing is applying
the router's Demi to Y, which adds one to the Count. Its fourth hash is X's,
Count included. The law holds for routers built by routing and for admissible
preloads alike, in both phases, and for a zero-Size child
```
; .Y [[], [], []];
; [(rx.####) = X.####, ((rx Y).####) = (X Y).####, ((rx Y).####) = ((rx.####) Y), (rx.####).# = X.#, ((rx Y).####).# = (X.# + 1)]
# [<>, <>, <>, <>, <>]
; [((p1 Y).####) = ((p1.####) Y), ((p2 {5 + 3}).####) = ((p2.####) {5 + 3}), ((p1 0).####) = ((p1.####) 0)]
# [<>, <>, <>]
; .pre [RotorRouter [[A], []], RotorRouter [[A], [B]], RotorRouter [[A, B], [C]], RotorRouter [[1, 2, 3, 4], [5, 6, 7, 8]], RotorRouter [[1, 2, 3, 4, 5], [6, 7, 8, 9]]];
; [pre & {((_ Y).####) = ((_.####) Y)}, pre & {((_ 0).####) = ((_.####) 0)}, pre & {(_ Y).phase = ((_.####) Y).phase}]
# [[<>, <>, <>, <>, <>], [<>, <>, <>, <>, <>], [<>, <>, <>, <>, <>]]
```
The same holds at every step of a walk, Count 1 to 6, and a router can never
route to the channel its Demi does not deposit into
```
; steps &| {.k _; (k.# .> 0) ? {[((k Y).####) = ((k.####) Y)]} : {[]}}
# [<>, <>, <>, <>, <>, <>]
; steps &| {.k _; (k.# .> 0) ? {[[((k 4).left.# - k.left.#), (((k.####) 4).left - k.####.left)]]} : {[]}}
# [[0, 0], [1, 4], [0, 0], [1, 4], [0, 0], [1, 4]]
```
A failed Size is the answer on both sides: the router routes the Frame and its
Demi fails when observed, and the Demi refuses the deposit with the same error
```
; [((p1 Failing).####), ((p1.####) Failing)]
# [$!.name-missing “..., $!.name-missing “...]
```
The empty host is the boundary. `[].####` is nil, so `X.####` fails the first
equation when X is empty, and so does the initial router, which has routed
nothing and so has Count zero: it has no Demi, and none is faked. The law there
reads through the Demi class's zero-Count lifting, `Demi [0, 0, 0]`, and after
one route the equation holds again
```
; [r0.####, ([] | r0) = r0, (([] | r0).####) = [].####, (([Y] | r0).####) = ([] Y).####, ((r0 Y).####) = ((Demis.Demi [0, 0, 0]) Y), ((r0 0).####) = ((Demis.Demi [0, 0, 0]) 0)]
# [(), <>, <>, <>, <>, <>]
```
## The Demi forgets

Distinct routers can share a Demi: the fourth hash keeps only the Count and two
sums, not which Frames were routed, nor their order, nor how the load was split
among them. It does keep how many were routed, so a router with fewer children
and the same loads has a different Demi
```
; .s1 (RotorRouter [[2, 3], [1]]); .s2 (RotorRouter [[5], [1]]); .s3 (RotorRouter [[3, 2], [1]]); .s4 (RotorRouter [[1, 4], [1]]);
; [s1 = s2, s1 = s3, (s1.####) = (s3.####), (s1.####) = (s4.####), (s1.####) = (s2.####), s1.#, s2.#, s1.##, s2.##]
# [(), (), <>, <>, (), 3, 2, 6, 6]
```
## Observers, declared

A router's Count, Size and residual are its Demi's, and its fourth hash is a
Demi, not the router: equal, it would have to be the same class. Its channels
are fields, not elements, so iterating a router yields nothing. A router
inside an aggregate contributes its declared Size, as a Demi does
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
; [seen = r3, seen.phase, seen.left.#, seen.right.#]
# [<>, 1, 2, 1]
```
## Reading the receiver

An argument whose fields share the router's names, or its locals', is routed
as one member, and the router reads only its own fields and its own Count
```
; .masked (r0 [.phase 1; .left [8]; .x 9; .l [7]; .n 1; 4]);
; [masked.phase, masked.left.#, masked.left.0.x, masked.right]
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
# [.phase 1; .left [5]; .right []; .apply_ {...
; (RotorRouter [[5], []]) = [.phase 1; .left [5]; .right []; .apply_ { .x _; .l (_^ .left); .r (_^ .right); .n (l.# + r.#); ((n %% 2) = 0) ? { @left (l x); @phase 1; } : { @right (r x); @phase 2; }; }; .# { .l (_^ .left); .r (_^ .right); l.# + r.# }; .## { (channel-load (_^ .left)) + (channel-load (_^ .right)) }; .### { (channel-load (_^ .left)) - (channel-load (_^ .right)) }; .toText { “RotorRouter(” (_^ .left) “,” (_^ .right) “)” };]
# <>
```
## Importing

Imported, the file binds the same class. The import is an example line, so
importing this file does not import it again
```
; Routers <- './hc/rotor-router.hc';
; [(Routers.RotorRouter [[], []]) = r0, “” ((Routers.RotorRouter [[], []]) 4), (((Routers.RotorRouter [[], []]) 4).####) = [4].####]
# [<>, “RotorRouter([4],[])”, <>]
