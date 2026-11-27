#!/usr/bin/env hc
```
KD — the Cayley–Dickson signed-XOR sign and multiply kernel, in pure HC
This module is the executable specification of the native `&|&` load kernel
(`kdCdSign` and `kdMultiplyLoads` in lib/frames/kd-signed-xor.ts). It uses
only Counts, recursion by name and `%%`; no bit primitive is needed. The
native kernel stays for speed, and lib/execute/kd-module.test.ts checks this
module against it. Import it with `KD <- './hc/kd.hc'`.
```
```
Bits of a Count. half n is n shifted right by one, xor [u, v] the bitwise
exclusive or, width n the number of bits (width 0 is 0), bit [x, k] bit k of
x, and low [x, k] is 1 when any bit of x below bit k is set, else 0.
```
.half {.n _; ((n - (n %% 2)) / 2).##};
.xor {.a _; .u (a .0); .v (a .1);
  ((u + v) = 0) ? {0} : {(((u %% 2) + (v %% 2)) %% 2) + (2 * (xor [half u, half v]))}};
.width {.n _; (n = 0) ? {0} : {1 + (width (half n))}};
.bit {.a _; .x (a .0); .p (2 ** (a .1)); ((x %% (2 * p)) .>= p) ? {1} : {0}};
.low {.a _; .x (a .0); .k (a .1); ((x %% (2 ** k)) .> 0) ? {1} : {0}};
```
cd_sign [u, v] is the exponent of −1 in e_u e_v = ±e_(u xor v): 0 or 1. It is
the guarded parity/swapped walk of Explore 023.02a, from the most significant
bit of u or v down to bit 0. At each bit, a and b are u and v, exchanged while
swapped is 1:
- a 0, b 1: stop if a has no lower bits, else toggle swapped;
- a 1, b 0: stop if b has no lower bits, else flip parity;
- a 1, b 1: flip parity and stop if b has no lower bits, else toggle swapped;
- a 0, b 0: go on.
cd_walk [u, v, k, parity, swapped] walks bits k − 1 down to 0.
```
.cd_walk {.a _; .u (a .0); .v (a .1); .k (a .2); .parity (a .3); .swapped (a .4);
  (k = 0) ? {parity} : {
    .i ((k - 1).##);
    .x ((swapped = 0) ? {u} : {v});
    .y ((swapped = 0) ? {v} : {u});
    .xb (bit [x, i]);
    .yb (bit [y, i]);
    .flip ((parity = 0) ? {1} : {0});
    .turn ((swapped = 0) ? {1} : {0});
    (xb = 0) ? {
      (yb = 0) ? {cd_walk [u, v, i, parity, swapped]} : {
        ((low [x, i]) = 0) ? {parity} : {cd_walk [u, v, i, parity, turn]}}
    } : {
      (yb = 0) ? {
        ((low [y, i]) = 0) ? {parity} : {cd_walk [u, v, i, flip, swapped]}
      } : {
        ((low [y, i]) = 0) ? {flip} : {cd_walk [u, v, i, parity, turn]}}
    }
  }};
.cd_sign {.a _; .u (a .0); .v (a .1); .wu (width u); .wv (width v);
  (((u = 0) ? {1} : {(v = 0) ? {1} : {0}}) = 1) ? {0} : {
    cd_walk [u, v, ((wu .>= wv) ? {wu} : {wv}), 0, 0]}};
```
kd_multiply [left, right] answers the raw loads of the signed-XOR product,
as `&|&` stores them. Each side is completed lazily to the next power of two
m by appending zero loads. A side of m = 1 is an unsigned scalar, and two
unsigned scalars multiply at arity one: [3] by [3] is [9]. Otherwise both
sides are embedded at the common arity 2d = max(2, m_left, m_right) by padding
each orientation half separately, so slot i of a side with half size h
(h = 1 for an unsigned scalar) has basis u = i mod h and orientation
s = 1 when i ≥ h, and keeps them as slot u + s·d. Each ordered pair of
nonzero slots (s, u) and (t, v) deposits the product of their loads at slot
xor [u, v] + d · (s xor t xor cd_sign [u, v]). Opposite orientations are
not cancelled. active [loads, h] lists [u, s, load] for each nonzero slot,
and gather [contributions, lo, n] sums [slot, load] contributions into the n
slots from lo, halving the slot range, so empty ranges cost nothing.
The work is the number of nonzero ordered pairs, and above 262,144 of them
the product answers `$!.denum-product-budget &|&`, the native refusal. HC
source can raise only `$!!` errors, so budget-refusal makes the native
operator refuse one over-budget product (513 by 513 nonzero loads) to answer
that same system error. The decision to refuse is made here, before any
product is formed. An empty side answers [], as `&|&` does.
```
.pow2 {.n _; 2 ** (width ((n - 1).##))};
.budget-refusal {((513 [1]).###) &|& ((513 [1]).###)};
.active {.a _; .loads (a .0); .h (a .1);
  .cursor [.index 0; .size h; .out [];
    .apply_ {.m _; .i (_^ .index); .z (_^ .size); .o (_^ .out);
      @out ((m = 0) ? {o} : {o + [[(i %% z), ((i .>= z) ? {1} : {0}), m]]});
      @index (i + 1);}];
  (loads | cursor) .out};
.gather {.a _; .cs (a .0); .lo (a .1); .n (a .2);
  (cs.# = 0) ? {n [0]} : {(n = 1) ? {[(cs & {_ .1}).##]} : {
    .h ((n / 2).##);
    .mid (lo + h);
    .below (cs &| {.c _; ((c .0) .< mid) ? {[c]} : {[]}});
    .above (cs &| {.c _; ((c .0) .< mid) ? {[]} : {[c]}});
    (gather [below, lo, h]) + (gather [above, mid, h])}}};
.kd_multiply {.a _; .left (a .0); .right (a .1);
  ((((left.#) = 0) ? {1} : {((right.#) = 0) ? {1} : {0}}) = 1) ? {[]} : {
    .ml (pow2 (left.#));
    .mr (pow2 (right.#));
    ((((ml = 1) ? {mr = 1}) ? {1} : {0}) = 1) ? {[(left .0) * (right .0)]} : {
      .slots ((ml .>= mr) ? {(ml .>= 2) ? {ml} : {2}} : {mr});
      .d ((slots / 2).##);
      .xs (active [left, ((ml = 1) ? {1} : {(ml / 2).##})]);
      .ys (active [right, ((mr = 1) ? {1} : {(mr / 2).##})]);
      (((xs.#) * (ys.#)) .> 262144) ? {budget-refusal ()} : {
        gather [xs &| {.p _; ys & {.q _; .u (p .0); .v (q .0);
          [(xor [u, v]) + (d * ((((p .1) + (q .1)) + (cd_sign [u, v])) %% 2)), (p .2) * (q .2)]}}, 0, slots]}}}};
```
The bit helpers answer Counts.
```
; [half 7, xor [5, 3], xor [255, 256], width 0, width 5, width 256]
# [3, 6, 511, 0, 3, 9]
; [bit [5, 2], bit [5, 1], low [4, 2], low [5, 2]]
# [1, 0, 0, 1]
```
The octonion basis-sign table: row u, column v is cd_sign [u, v], so
e_u e_v = (−1)^(cd_sign [u, v]) e_(xor [u, v]). Row 1 says e1 e1 = −e0,
e1 e2 = e3 and e1 e3 = −e2.
```
; .row {.u _; [0, 1, 2, 3, 4, 5, 6, 7] & {.v _; cd_sign [u, v]}};
; row 0
# [0, 0, 0, 0, 0, 0, 0, 0]
; row 1
# [0, 1, 0, 1, 0, 1, 1, 0]
; row 2
# [0, 1, 1, 0, 0, 0, 1, 1]
; row 3
# [0, 0, 1, 1, 0, 1, 0, 1]
; row 4
# [0, 1, 1, 1, 1, 0, 0, 0]
; row 5
# [0, 0, 1, 0, 1, 1, 1, 0]
; row 6
# [0, 0, 0, 1, 1, 0, 1, 1]
; row 7
# [0, 1, 0, 0, 1, 1, 0, 1]
```
Unsigned scalars stay at arity one, and i i = −1 deposits on the negative
real slot.
```
; [kd_multiply [[3], [3]], kd_multiply [[0, 1, 0, 0], [0, 1, 0, 0]]]
# [[9], [0, 0, 1, 0]]
```
A mixed-rank product: the signed real [3, 1] (value 2) times the quaternion
unit e1. The real embeds halfwise as [3, 0, 0, 0, 1, 0, 0, 0], not as
[3, 1, 0, 0, 0, 0, 0, 0], so its negative load lands on −e1 and the product
reads 2 e1. The native &|& stores the same loads.
```
; .mixed (kd_multiply [[3, 1], [0, 1, 0, 0, 0, 0, 0, 0]]);
; [mixed, mixed.####]
# [[0, 3, 0, 0, 0, 1, 0, 0], [0, 2, 0, 0]]
; mixed = (([3, 1].###) &|& ([0, 1, 0, 0, 0, 0, 0, 0].###)).loads
# <>
