#!/usr/bin/env hc
```
RotorRouter — retain structured routing, expose its raw Denum (FOIST 19a)

A RotorRouter stores k≥1 ordered channels of Frames, not their numerical
summaries. Its Count C is the total number of routed child occurrences.
Applying a Frame routes it to the channel C mod k, then increases C; it
does not execute or measure the child. The same class works at any arity.

The third-hash observer now constructs the router's raw Denum of Count C
and one load per channel, each the sum of its children's Sizes. Unlike the
ordinary empty Frame, an empty two-channel router has the raw Denum
Denum(0,[0,0]) because its two channels already exist. The fourth hash
reads the resulting KD coordinate vector. A router itself stores no Denum.

The constructor accepts exactly round-robin histories. `./` redistributes
the original Frames across channels without measuring them, keeping routing
order and identity. The old declared alternating-residual `.###` method
is retired; this class relies on the native FOIST observer.
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
    ./ {.ways _; ((_^^ .history) (_^ .channels)) / ways};
    .toText {“RotorRouter(” (_^ .channels) “)”}
  ]};
.RotorRouter {((_ ~ ([].<>)) ? {(__ .#) .> 0}) ? {.a __;
  ((a &| {.x _; (x ~ ([].<>)) ? {[]} : {[x]}}).# = 0) ? {.cs (a & {_ | []}); .k (cs.#); .n ((cs &| {_}).#);
    ((k .> 0) ? {(((cs & {_.#}) | (round-robin [n, k])) .ok) = 1}) ? {router-instance cs} : {$!!.invalid-router}
  } : {$!!.invalid-router}} : {$!!.invalid-router}};
```
The empty router has Count 0 and two empty stored channels.
```
; .r0 (RotorRouter [[], []]);
; [r0.#, r0.##, (r0.channels .0), (r0.channels .1)]
# [0, 0, [], []]
; “” r0
# “RotorRouter([[], []])”

```
Routing stores whole Frames in round-robin order without flattening.
```
; .r1 (r0 5); .r2 (r1 6); .r3 (r2 7);
; [r1.channels, r2.channels, r3.channels]
# [[[5], []], [[5], [6]], [[5, 7], [6]]]
; [r1.#, r2.#, r3.#]
# [1, 2, 3]
; (RotorRouter [[], [5]])
# $!!.invalid-router
; (RotorRouter [[5], [6, 7]])
# $!!.invalid-router

```
Third hash is raw Denum. Fourth hash is KD antipodal coordinates.
```
; “” r0.###
# “Denum(0,[0, 0])”
; “” r1.###
# “Denum(1,[5, 0])”
; “” r2.###
# “Denum(2,[5, 6])”
; r2.####
# [-1]
; [r1.####, r2.####, r3.####]
# [[5], [-1], [6]]

```
A record that only stores a `channels` field is not a router, whether the
list is empty, holds a value that is not a channel, or holds channels. Its
third hash is the derived Denum of a Frame with no children, where a router
built from the same channels has their Count and loads.
```
; “” [.channels []].###
# “Denum(0,[])”
; “” [.channels [5]].###
# “Denum(0,[])”
; “” [.channels [[5]]].###
# “Denum(0,[])”
; “” (RotorRouter [[5]]).###
# “Denum(1,[5])”

```
Rebalancing into fresh channels is a structural operation, not KD product.
```
; “” ([1, 2, 3] / 2)
# “RotorRouter([[1, 3], [2]])”
; “” (([1, 2, 3] / 2) / 3)
# “RotorRouter([[1], [2], [3]])”

```
The imported module has no ambient side effects on the caller.
```
[] = []
