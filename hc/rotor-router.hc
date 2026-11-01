#!/usr/bin/env hc
```
RotorRouter (occurrence/figure 011.21)

A RotorRouter is a two-channel router that keeps what it routes. It holds a
phase and two ordered arrays, left and right, of the Frames routed into them.
Applying a router to a Frame appends that Frame, the same Frame, to the active
channel and flips the phase. A Demi follows the same alternation by Size alone;
a router keeps the children, so its numerical shadow is a Demi and its state is
everything that shadow forgets: which Frames, in what order, and which channel.

`RotorRouter` is an ordinary HC class, like `Demi` in `hc/demi.hc`: a
constructor closure answering a fresh aggregate whose fields are its state and
whose methods are the class. Import it with
`Routers <- './hc/rotor-router.hc'`, then `Routers.RotorRouter [2, [], []]`.

**State.** `RotorRouter [phase, left, right]` takes a Count phase and two
arrays. The phase is the state of the next route, encoded as a Demi's is:
2 when left is next and 1 when right is next. A channel is its elements: an
array's properties are configuration, not routed Frames, so the constructor
keeps the elements in a fresh array of its own, and a channel argument that
declares `apply` cannot change what appending means. Anything else is refused
with `invalid-router`, a missing name, as `Demi` refuses with `invalid-demi`.
Any phase and any two channels are a state; nothing requires the channels to
be a history the router could have produced.

**Routing**, `router x`: append x as one member of the active channel and flip
the phase. Routing never evaluates x, never measures it, and never runs its
methods, so a closure is kept uncalled, an array or group is kept as one
member, and a Frame whose Size fails or runs code is routed like any other. A
Frame of Size zero still takes a slot and flips the phase. It is a mutating
method, `apply_`, so through a name it is a functional update that leaves the
router as it was, and through a mutable name it writes the router in place.
Routing nil routes nothing and leaves the router as it was, as applying a Demi
to nil does. A flagged error such as `1 / 0` is the answer of the expression
that applies the router, so it is never routed.

**Observers.** A router declares its Count, Size and residual as a Demi does:
its phase, its total load L+R and the signed difference L−R, where each load is
the sum of the Sizes of the children routed into that channel. So `router.####`
derives the router's Demi as it derives any Frame's, and that Demi is the
router's numerical shadow. An empty channel has load 0, the empty sum; a
nonempty channel's load is its native Size, which is that sum. Observation is
where children are measured, so it is where their failures show, and declared
observers run only when the router is observed: routing runs none of them, and
observing writes nothing. The Demi forgets which Frames were routed and their
order, so distinct routers can share one.

**Text.** A router prints as its fields and methods, and as text reads
`RotorRouter(<>,[…],[…])`, with the phase spelled as the orientation it stands
for and each channel as its spelling.

**Methods read their own state through `_^`.** A router is applied to
arbitrary Frames, and a bare name in a method is looked up on the argument
first (spec 7), so a router reads its fields through the receiver, `_^` from
the method body. What a branch needs is bound as a local at method level.
```
.channel-load {.c _; (c.# = 0) ? {0} : {c.##}};
.RotorRouter {.p (_ .0); .l (_ .1); .r (_ .2);
  ((((p = 2) : {p = 1}) ? {p ~ (0.<>)}) ? {(l ~ ([].<>)) ? {r ~ ([].<>)}}) ? {[
    .phase p;
    .left (l | []);
    .right (r | []);
    .apply_ {.x _; .l (_^ .left); .r (_^ .right);
      ((_^ .phase) = 2) ? {@left (l x); @phase 1;} : {@right (r x); @phase 2;};};
    .# {_^.phase};
    .## {(channel-load (_^ .left)) + (channel-load (_^ .right))};
    .### {(channel-load (_^ .left)) - (channel-load (_^ .right))};
    .toText {“RotorRouter(” (((_^ .phase) = 2) ? {“<>”} : {“()”}) “,” (_^ .left) “,” (_^ .right) “)”}
  ]} : {invalid-router}};
```
## Construction

A router holds exactly its phase and its two channels. The initial router is
present, phase 2 with both channels empty
```
; .r0 (RotorRouter [2, [], []]);
; [r0.phase, r0.left, r0.right, “” r0]
# [2, [], [], “RotorRouter(<>,[],[])”]
```
Anything but a phase of 1 or 2 and two arrays is refused
```
; RotorRouter [3, [], []]
# $!.name-missing “$:Frame.0.invalid-router”;
; [RotorRouter [(5 - 3), [], []], RotorRouter [2, [], 5], RotorRouter [2, (1, 2), []], RotorRouter [2, []], RotorRouter 5]
# [$!.name-missing “$:Frame.0.invalid-router”;, $!.name-missing “$:Frame.0.invalid-router”;, $!.name-missing “$:Frame.0.invalid-router”;, $!.name-missing “$:Frame.0.invalid-router”;, $!.name-missing “$:Frame.0.invalid-router”;]
```
A channel is its elements. The router keeps them in an array of its own, so a
channel's properties and a declared `apply` do not come with it
```
; .Hijack [.apply {“hijack”}; 1];
; [(RotorRouter [2, [.tag 9; 5], []]).left, ((RotorRouter [2, Hijack, []]) 7).left]
# [[5], [1, 7]]
```
## Routing alternates

From the initial router, routing A, B and C sends A and C left and B right,
and the next route goes right
```
; .A [1, [2]]; .B “b”; .C {5 + 3};
; .r3 (((r0 A) B) C);
; [r3.phase, r3.left, r3.right]
# [1, [[1, [2]], { 5 + 3 }], [“b”]]
; “” r3
# “RotorRouter((),[[1, [2]], { 5 + 3 }],[“b”])”
```
The router that was routed into is left as it was
```
; [r0.phase, r0.left, r0.right]
# [2, [], []]
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
## Independent states

Any phase and channels construct a router, here phase 1 with a preloaded
left channel. Routing continues from that state
```
; .p1 (RotorRouter [1, [A], []]);
; .p2 ((p1 B) C);
; [p2.phase, p2.left, p2.right, p1.phase, p1.right]
# [1, [[1, [2]], { 5 + 3 }], [“b”], 1, []]
```
Routers built from the same channel share no writable state: each holds its
own channel array. Through a mutable name, routing writes that router in place
and no other
```
; .ch [A];
; .u (RotorRouter [2, ch, []]); .v (RotorRouter [2, ch, []]);
; .m_ (RotorRouter [2, ch, []]);
; m_ B;
; m_ C;
; [m_.phase, m_.left, m_.right, u.left, v.left, ch]
# [2, [[1, [2]], “b”], [{ 5 + 3 }], [[1, [2]]], [[1, [2]]], [[1, [2]]]]
; [u.left === ch, u.left === v.left, u.left.0 === v.left.0]
# [(), (), <>]
```
A router captured by a closure, mapped, or reduced into routes the same way,
and the captured one stays as it was
```
; .start (RotorRouter [2, [], []]); .step {start _};
; [(step 5).left, (step 3).left, start.left]
# [[5], [3], []]
; [r0, p1] & {(_ 5).right}
# [[], [5]]
; “” ([A, B, C] | r0)
# “RotorRouter((),[[1, [2]], { 5 + 3 }],[“b”])”
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
# “Demi((),5,0)”
; counter_.n
# 2
```
A flagged error is the answer of the expression that applies the router, so it
is never routed. A diagnostic note such as a missing name is a value and is
routed like one, until #467 decides otherwise, and observing it fails
```
; r0 (1 / 0)
# $!.division-by-zero /
; .noted (r0 ([].nope));
; [noted.phase, noted.left.#]
# [1, 1]
; noted.####
# $!.name-missing “...
```
Routing nil routes nothing
```
; [(r0 ()).phase, (r0 ()).left]
# [2, []]
```
## Empty and zero

The initial router observes as the present zero-load Demi in phase 2. That is
the router's state, and it leaves the fourth hash's convention alone: the
empty host still has no Demi
```
; [“” (r0.####), (r0.####) = [0, 0].####, [].####]
# [“Demi(<>,0,0)”, <>, ()]
```
A Frame of Size zero takes a slot and flips the phase, and an empty array
routed as a child has Size 1, while an empty channel has load 0
```
; .z (r0 0);
; [z.phase, z.left, “” (z.####)]
# [1, [0], “Demi((),0,0)”]
; [“” ((r0 []).####), “” (((r0 []) []).####), “” ((((r0 0) 0) 0).####)]
# [“Demi((),1,0)”, “Demi(<>,1,1)”, “Demi((),0,0)”]
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
# [[5, 6, 2, 9], [7, 9, 2, 1], “Demi(<>,22,19)”]
; “” (((r0 123456789012345678901234567890) 987654321098765432109876543210).####)
# “Demi(<>,123456789012345678901234567890,987654321098765432109876543210)”
```
## Observing commutes with routing

Routing each child of an array X in turn, from the initial router, is the
reduce `X | r0`. Its left channel holds the children at even positions and its
right channel those at odd positions, and its phase is the parity of X's Count.
That interleaving is the invariant a router reached this way keeps: left has
as many children as right in phase 2, and one more in phase 1
```
; .X [5, “ab”, [1, 2]];
; .rx (X | r0);
; [rx.left, rx.right, rx.phase, rx = (RotorRouter [1, [5, [1, 2]], [“ab”]])]
# [[5, [1, 2]], [“ab”], 1, <>]
```
For such a router its fourth hash is X's, and routing Y then observing is
observing X Y. The state-level law holds for every router: observing after a
route is applying the router's Demi to the routed Frame
```
; .Y [[], [], []];
; [(rx.####) = X.####, ((rx Y).####) = (X Y).####, ((rx Y).####) = ((rx.####) Y)]
# [<>, <>, <>]
; [((p1 Y).####) = ((p1.####) Y), ((p2 {5 + 3}).####) = ((p2.####) {5 + 3}), ((r0 0).####) = ((r0.####) 0)]
# [<>, <>, <>]
```
The empty host is the boundary. `[].####` is nil, so `X.####` fails the first
equation when X is empty, while the initial router observes as a present Demi.
The router is the empty host lifted: routing nothing from it leaves it as it
is, and after one route the two agree again
```
; [([] | r0) = r0, (([] | r0).####) = [].####, (([Y] | r0).####) = ([] Y).####]
# [<>, (), <>]
```
The equation with the fourth hash needs the interleaving. A preloaded router
can break it: one child left and none right in phase 2 is a state no array's
routing reaches, yet its fourth hash equals that of an array whose
history is different
```
; .pre (RotorRouter [2, [A], []]);
; [(pre.####) = [A, 0].####, ([A, 0] | r0) = pre]
# [<>, ()]
```
## The Demi forgets

Distinct routers can share a Demi: the fourth hash keeps only the
phase and two sums, not which Frames were routed, nor their order, nor how
the load was split among them
```
; .s1 (RotorRouter [2, [2, 3], [1]]); .s2 (RotorRouter [2, [5], [1]]); .s3 (RotorRouter [2, [3, 2], [1]]);
; [s1 = s2, s1 = s3, (s1.####) = (s2.####), (s1.####) = (s3.####)]
# [(), (), <>, <>]
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
as one member, and the router reads only its own fields
```
; .masked (r0 [.phase 1; .left [8]; .x 9; .l [7]; 4]);
; [masked.phase, masked.left.#, masked.left.0.x, masked.right]
# [1, 1, 9, []]
```
Carets count lexically (spec a06). Inside a branch, `_^` is the method's own
scope, so a router that reads its channel there reads nothing, and the failure
is written to the field. `_^^` is the receiver from inside the branch
```
; .WrongRouter {[.phase 2; .left []; .apply_ {.x _; ((_^ .phase) = 2) ? {@left (_^ .left x); @phase 1;};}]};
; .w ((WrongRouter ()) 5);
; [w.phase, w.left]
# [1, $!.name-missing “...
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
; RotorRouter [1, [5], []]
# [.phase 1; .left [5]; .right []; .apply_ {...
; (RotorRouter [1, [5], []]) = [.phase 1; .left [5]; .right []; .apply_ { .x _; .l (_^ .left); .r (_^ .right); ((_^ .phase) = 2) ? { @left (l x); @phase 1; } : { @right (r x); @phase 2; }; }; .# { _^ .phase }; .## { (channel-load (_^ .left)) + (channel-load (_^ .right)) }; .### { (channel-load (_^ .left)) - (channel-load (_^ .right)) }; .toText { “RotorRouter(” (((_^ .phase) = 2) ? { “<>” } : { “()” }) “,” (_^ .left) “,” (_^ .right) “)” };]
# <>
```
## Importing

Imported, the file binds the same class. The import is an example line, so
importing this file does not import it again
```
; Routers <- './hc/rotor-router.hc';
; [(Routers.RotorRouter [2, [], []]) = r0, “” ((Routers.RotorRouter [2, [], []]) 4), (((Routers.RotorRouter [2, [], []]) 4).####) = [4].####]
# [<>, “RotorRouter((),[4],[])”, <>]
