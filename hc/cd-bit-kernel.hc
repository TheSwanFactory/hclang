#!/usr/bin/env hc
```
BitScheme sign-kernel experiment (Explore 023.05)

This executable testdoc builds a paired-bit observation stream from nonnegative
integer basis indices and descending powers of two. A pure mapping creates
observations; an ordinary HC Frame with apply_ folds them into a Cayley–Dickson
sign parity. It needs no new parser syntax and deliberately leaves the existing
BitScheme schema matcher pure.

The input powers must be a complete descending list [2^(n-1), ..., 1] and both
indices must be in [0, 2^n). The example supplies explicit width-3 and width-8
power lists. This is a U8 proof-of-concept, not a U64/bit-blob native API.
The output 0 or 1 is the exponent of (-1), NOT a zero algebra coefficient.
The doubling convention is (a,b)(c,d) = (ac - d* b, da + b c*).
```
```
Bit observation: bit(x,p) uses modulo rather than a newly invented HC bitwise
operator. p is a power of two and the input is a nonnegative integer.
```
; .cd_bit {.args _; .x (args .0); .p (args .1); ((x %% (2 * p)) .>= p) ? {1} : {0}};
; .cd_bool {_ ? {1} : {0}};
; cd_bit [5, 4]
# 1
; cd_bit [5, 2]
# 0
; cd_bit [5, 1]
# 1
```
The observation map is pure: [u_bit, v_bit, lower_u_nonzero, lower_v_nonzero], from high to low. The lower-tail predicates refer to the
original operands. The transition applies the current swapped orientation
before interpreting each observation. Values below bit k are x %% 2^k.
```
; .cd_observe {
  .args _;
  .u (args .0);
  .v (args .1);
  .powers (args .2);
  powers & {.p _;
    [cd_bit [u, p], cd_bit [v, p], cd_bool ((u %% p) .> 0), cd_bool ((v %% p) .> 0)]}
};
; cd_observe [5, 3, [4, 2, 1]]
# [[1, 0, 1, 1], [0, 1, 1, 1], [1, 1, 0, 0]]
```
The accumulator has three visible state bits: parity, swapped, halted.
Its apply_ rule consumes one observation and returns the same receiver for
the next fold step. Once halted, further steps are observationally inert;
this models early return without claiming native short-circuit iteration.

Guard order is explicit. On 01: stop iff current u has no lower bits, else
toggle orientation. On 10: stop iff current v has no lower bits, else flip
parity. On 11: flip and stop iff current v has no lower bits, else toggle
orientation. On 00: pass. All state changes are explicit alias assignments.
Each conditional branch returns <> so a nil branch result cannot fall through.
```
; .CdSignState {
  [.parity 0; .swapped 0; .halted 0;
   .apply_ {
     .obs _;
     (halted = 0) ? {
       .a ((swapped = 0) ? {obs .0} : {obs .1});
       .b ((swapped = 0) ? {obs .1} : {obs .0});
       .alow ((swapped = 0) ? {obs .2} : {obs .3});
       .blow ((swapped = 0) ? {obs .3} : {obs .2});
       (a = 0) ? {
         (b = 1) ? {
           (alow = 0) ? {@halted 1; <>} : {@swapped (1 - swapped); <>}
         } : {<>}
       } : {
         (b = 0) ? {
           (blow = 0) ? {@halted 1; <>} : {@parity (1 - parity); <>}
         } : {
           (blow = 0) ? {@parity (1 - parity); @halted 1; <>} : {
             @swapped (1 - swapped); <>
           }
         }
       };
       <>
     } : {<>}
   }]
};
```
A separate wrapper preserves the Rust reference's u=0 or v=0 return-0
convention (basis index zero is the identity, not an algebraic zero).
A fixed full-width scan is equivalent to starting at msb(u|v) because
leading 00 observations leave the state unchanged.
```
; .cd_sign {
  .args _;
  .u (args .0);
  .v (args .1);
  .powers (args .2);
  (u = 0) ? {0} : {
    (v = 0) ? {0} : {
      (cd_observe [u, v, powers] | (CdSignState ())).parity
    }
  }
};
; cd_sign [0, 7, [4, 2, 1]]
# 0
; cd_sign [7, 0, [4, 2, 1]]
# 0
; cd_sign [1, 1, [4, 2, 1]]
# 1
; cd_sign [1, 2, [4, 2, 1]]
# 0
; cd_sign [2, 1, [4, 2, 1]]
# 1
; cd_sign [4, 2, [4, 2, 1]]
# 1
; cd_sign [2, 3, [4, 2, 1]]
# 0
; cd_sign [5, 3, [4, 2, 1]]
# 0
```
Complete 8-by-8 octonion basis-sign matrix at width 3. Expected data were
computed independently from the Rust reference in Explore 023.01. This
exercises all four current-bit cases and orientation/early-stop paths.
```
; .cd_oct [0, 1, 2, 3, 4, 5, 6, 7];
; cd_oct & {.left _; cd_oct & {cd_sign [left, _, [4, 2, 1]]}}
# [[0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 1, 0], [0, 1, 1, 0, 0, 0, 1, 1], [0, 0, 1, 1, 0, 1, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0], [0, 0, 1, 0, 1, 1, 1, 0], [0, 0, 0, 1, 1, 0, 1, 1], [0, 1, 0, 0, 1, 1, 0, 1]]
```
Bit 7 and leading-zero coverage with an explicit 8-bit scan. No U64 shift
coercions or JavaScript bitwise truncation are involved in the HC arithmetic.
```
; .cd_sign8 {cd_sign [(_ .0), (_ .1), [128, 64, 32, 16, 8, 4, 2, 1]]};
; cd_sign8 [128, 128]
# 1
; cd_sign8 [128, 1]
# 1
; cd_sign8 [128, 129]
# 0
; cd_sign8 [255, 255]
# 1
; cd_sign8 [255, 127]
# 0
```
The fold is an implementation of CD sign parity over numeric basis indices, not a new BitScheme syntax, a generalized signature kernel, or a proof about
the physical geometry of the indexing space.
```
