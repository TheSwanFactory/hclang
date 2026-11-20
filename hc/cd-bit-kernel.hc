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
power lists. This is a bounded basis-sign testdoc, not a U64/bit-blob native API.
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
The observation map is pure:
[u_bit, v_bit, lower_u_nonzero, lower_v_nonzero], from high to low.
The lower-tail predicates refer to the
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
Executable witnesses for the conventional Cayley–Dickson ladder.
These are basis-product SIGN tests, not construction of the number carriers.
For basis units e_u and e_v, the product index is u XOR v and this kernel
supplies the coefficient (-1)^parity. The same cd_sign implementation is
used at every rank; only the complete descending powers list changes.

Real (rank 0): e_0 is the multiplicative identity. An empty scan is valid
for its sole basis index; the identity wrapper returns parity 0.
```
; cd_sign [0, 0, []]
# 0
```
Complex (rank 1): e_1 squared is -e_0.
```
; cd_sign [1, 1, [1]]
# 1
```
Quaternion (rank 2): e_1 e_2 = +e_3 and e_2 e_1 = -e_3.
This demonstrates anticommutation without a rank-specific kernel.
```
; cd_sign [1, 2, [2, 1]]
# 0
; cd_sign [2, 1, [2, 1]]
# 1
```
Octonion (rank 3): a newly introduced unit e_4 squares to -e_0,
and anticommutes with the earlier unit e_1.
```
; cd_sign [4, 4, [4, 2, 1]]
# 1
; cd_sign [1, 4, [4, 2, 1]]
# 0
; cd_sign [4, 1, [4, 2, 1]]
# 1
```
Sedenion (rank 4): the new e_8 also squares to -e_0.
The quaternion signs embed unchanged when a leading zero bit is added.
```
; cd_sign [8, 8, [8, 4, 2, 1]]
# 1
; cd_sign [1, 2, [8, 4, 2, 1]]
# 0
; cd_sign [2, 1, [8, 4, 2, 1]]
# 1
```
Rank 5 (32 dimensions): e_16 squares to -e_0 and the same
quaternion signs persist through another doubling.
```
; cd_sign [16, 16, [16, 8, 4, 2, 1]]
# 1
; cd_sign [1, 2, [16, 8, 4, 2, 1]]
# 0
; cd_sign [2, 1, [16, 8, 4, 2, 1]]
# 1
```
These witnesses demonstrate sign behavior and lower-rank embedding.
They do not by themselves prove nonassociativity, zero divisors,
or the emergence of negative integers from counting numbers.
```
```
Cayley–Dickson ladder: a few executable witnesses, one sign kernel.

For basis units e_u e_v = (-1)^parity e_(u XOR v), these assertions check
the coefficient sign only; the basis-index XOR is a mathematical convention,
not an operation implemented by this kernel. The full algebra of linear
combinations is deliberately out of scope. All ranks use the same cd_sign.

Rank 0, real: e_0 is the identity (parity 0).
Rank 1, complex: e_1 squared is -e_0 (parity 1).
Rank 2, quaternion: e_1 e_2 = +e_3 and e_2 e_1 = -e_3.
```
; cd_sign [0, 0, [1]]
# 0
; cd_sign [0, 1, [1]]
# 0
; cd_sign [1, 1, [1]]
# 1
; cd_sign [1, 2, [2, 1]]
# 0
; cd_sign [2, 1, [2, 1]]
# 1
; cd_sign [3, 3, [2, 1]]
# 1
```
Rank 3, octonion: e_1, e_2, e_4 give a nonassociative witness.
(e_1 e_2) e_4 has sign 0; e_1 (e_2 e_4) has sign 1.
The products have the same final basis index 7, but opposite signs.
We compute each composite sign from two calls to the same kernel.
```
; cd_sign [1, 2, [4, 2, 1]]
# 0
; cd_sign [3, 4, [4, 2, 1]]
# 0
; cd_sign [2, 4, [4, 2, 1]]
# 0
; cd_sign [1, 6, [4, 2, 1]]
# 1
; ((cd_sign [1, 2, [4, 2, 1]]) + (cd_sign [3, 4, [4, 2, 1]])) %% 2
# 0
; ((cd_sign [2, 4, [4, 2, 1]]) + (cd_sign [1, 6, [4, 2, 1]])) %% 2
# 1
```
Rank 4, sedenion: e_8 squared is -e_0, and its products with
the existing quaternion generator are orientation-sensitive.
The embedded quaternion product e_1 e_2 retains its sign.
Rank 5: a new e_16 also squares to -e_0; the embedded e_1 e_2
still has the same sign. No zero-divisor claim follows from signs alone.
```
; cd_sign [8, 8, [8, 4, 2, 1]]
# 1
; cd_sign [8, 1, [8, 4, 2, 1]]
# 1
; cd_sign [1, 8, [8, 4, 2, 1]]
# 0
; cd_sign [1, 2, [8, 4, 2, 1]]
# 0
; cd_sign [16, 16, [16, 8, 4, 2, 1]]
# 1
; cd_sign [1, 2, [16, 8, 4, 2, 1]]
# 0
```
Flat counting-number coordinates, before signed-coefficient flattening.

ONE number is a FLAT list of nonnegative counting magnitudes. For a
Cayley-Dickson rung with m basis directions, its signed presentation has
2m counting slots in the order

    [positive e0, ..., positive e(m-1),
     negative e0, ..., negative e(m-1)].

The second half is not another number or another basis dimension. It is
the opposite orientation for the SAME m basis directions. For the complex
rung one number has four counts [a,b,c,d]; its eventual algebraic
observation is (a-c) + (b-d)i. No signed literals, quotient classes or
nested signed-coefficient pairs occur as primitive HC inputs here.

The observational gauge identifies two equal-length flat lists x,y iff
for EVERY basis position j in [0,m), x[j]+y[j+m]=x[j+m]+y[j].
The quotient interprets the flat states as signed coefficients; the
states themselves are retained, not silently normalized.
```
; .cd_flat_eq {
  .xy _;
  .x (xy .0);
  .y (xy .1);
  .half (((x.#) / 2).##);
  .checks (x && {.cell _; .i (cell .0);
    (i .< half) ? {
      cd_bool (((x i) + (y (i + half))) = ((x (i + half)) + (y i)))
    } : {0}
  });
  cd_bool ((checks.##) = half)
};
; cd_flat_eq [[3, 4, 1, 2], [4, 5, 2, 3]]
# 1
; cd_flat_eq [[3, 4, 1, 2], [3, 4, 1, 3]]
# 0
```
A sign reversal is ONLY a half-rotation of the flat sequence after
zero-padding to its chosen CD power-of-two arity n=2m. At n=2 it swaps
two counts; at n=4 it rotates four counts by two slots; at n=8 it
rotates eight by four. It neither calls an integer minus nor introduces
a new algebraic operation. The next CD arity is supplied explicitly,
as with the descending sign-scan powers; the zero template is n long.
```
; .cd_flat_pad {
  .args _;
  .x (args .0);
  .zeros (args .1);
  zeros && {.cell _; .i (cell .0); (i .< x.#) ? {x i} : {0}}
};
; .cd_flat_neg {
  .x _;
  .n (x.#);
  .half ((n / 2).##);
  x && {.cell _; .i (cell .0); x ((i + half) %% n)}
};
; cd_flat_pad [[3, 4, 1], [0, 0, 0, 0]]
# [3, 4, 1, 0]
; cd_flat_neg [3, 1]
# [1, 3]
; cd_flat_neg [3, 4, 1, 0]
# [1, 0, 3, 4]
; cd_flat_neg [1, 2, 3, 4, 5, 6, 7, 8]
# [5, 6, 7, 8, 1, 2, 3, 4]
; cd_flat_neg (cd_flat_neg [3, 4, 1, 0])
# [3, 4, 1, 0]
; cd_flat_eq [cd_flat_neg [3, 4, 1, 2], [2, 3, 4, 5]]
# 1
```
Addition is slotwise counting-number addition, and the quotient sees
the usual cancellation. Both addends are flat states, and so is the
result. The modulo-two sign is enacted by the same half-rotation.
```
; .cd_flat_add {
  .xy _;
  ((xy .0) |&| (xy .1)) & {((_ .0) + (_ .1))}
};
; cd_flat_add [[3, 4, 1, 2], cd_flat_neg [3, 4, 1, 2]]
# [4, 6, 4, 6]
; cd_flat_eq [cd_flat_add [[3, 4, 1, 2], cd_flat_neg [3, 4, 1, 2]], [0, 0, 0, 0]]
# 1
```
Product generation from the SAME cd_sign rule.

The slot address i names (i mod m) as a CD basis index and (i<m)
as its positive/negative orientation. Native Cart forms all input-slot
pairs; each contributes its magnitude product to a destination basis
index u XOR v, with sign = input orientations XOR cd_sign(u,v).
No double-counting of basis dimensions: there are m basis directions
and 2m sign-oriented counting slots for ONE represented number.

cd_flat_xor uses the same observed bits as cd_sign, with no added
bitwise-language primitive. Powers [] is the real, rank-zero case.
```
; .cd_flat_xor {
  .args _;
  .u (args .0);
  .v (args .1);
  .powers (args .2);
  (powers.# = 0) ? {0} : {
    (powers & {.p _; (((cd_bit [u, p]) + (cd_bit [v, p])) %% 2) * p}).##
  }
};
; cd_flat_xor [1, 2, [2, 1]]
# 3
; cd_flat_xor [3, 3, [2, 1]]
# 0
; .cd_flat_slots {
  .args _;
  .x (args .0);
  .half (args .1);
  x && {.cell _; .i (cell .0); .mag (cell .1);
    [mag, (i %% half), ((i .< half) ? {0} : {1})]
  }
};
; .cd_flat_term {
  .args _;
  .ab (args .0);
  .powers (args .1);
  .half (args .2);
  .a (ab .0);
  .b (ab .1);
  .u (a .1);
  .v (b .1);
  .mag ((a .0) * (b .0));
  .parity ((((a .2) + (b .2)) + (cd_sign [u, v, powers])) %% 2);
  [mag, ((cd_flat_xor [u, v, powers]) + (half * parity))]
};
; .CdFlatCollector {
  [.counts _;
   .apply_ {
     .term _;
     .mag (term .0);
     .destination (term .1);
     @counts (counts && {.cell _; .i (cell .0); .value (cell .1);
       value + ((i = destination) ? {mag} : {0})
     });
     _^^
   }]
};
; .cd_flat_mul {
  .args _;
  .x (args .0);
  .y (args .1);
  .powers (args .2);
  .half (((x.#) / 2).##);
  .xs (cd_flat_slots [x, half]);
  .ys (cd_flat_slots [y, half]);
  .terms ((xs &|& ys) & {cd_flat_term [_, powers, half]});
  (terms | (CdFlatCollector (x & {0}))).counts
};
```
Real (one CD basis direction; two counting slots), complex (two basis
directions; four slots), and quaternion (four basis directions; eight
slots) reuse this SINGLE flat sign/multiply/rotation construction.
```
; cd_flat_mul [[0, 1], [0, 1], []]
# [1, 0]
; cd_flat_mul [[0, 1, 0, 0], [0, 1, 0, 0], [1]]
# [0, 0, 1, 0]
; cd_flat_mul [[0, 1, 0, 0], [1, 0, 0, 0], [1]]
# [0, 1, 0, 0]
; cd_flat_eq [cd_flat_mul [[2, 0, 1, 0], [0, 3, 0, 2], [1]], [0, 1, 0, 0]]
# 1
; cd_flat_eq [cd_flat_mul [cd_flat_neg [0, 1, 0, 0], cd_flat_neg [0, 1, 0, 0], [1]], [0, 0, 1, 0]]
# 1
; cd_flat_mul [[0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [2, 1]]
# [0, 0, 0, 1, 0, 0, 0, 0]
; cd_flat_mul [[0, 0, 1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [2, 1]]
# [0, 0, 0, 0, 0, 0, 0, 1]
```
Scope and interpretation:

One flat list gives ONE signed CD value on the selected rung.
Its n/2 rotation is a concrete permutation of the padded counting slots;
the gauge quotient is a later observational flattening, not an input
assumption. The same cd_sign kernel governs the destination-half choice
for every basis product, while cd_flat_xor routes to a CD basis direction.

The witnesses use real/complex/quaternion powers and do not claim a
new HCLang general-Frame unary Permute, the full FOIST Denumeration
semantics, automatic arbitrary-width CD arity selection, or a theorem
that cd_sign alone constructs the gauge quotient.
```
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
The fold implements CD sign parity over numeric basis indices.
It is not new BitScheme syntax, a generalized signature kernel,
or a proof about the physical geometry of the indexing space.
```

```
The BitScheme matcher also serves as a pure ingress adapter. This fixed-width schema captures eight individual bits without
changing its input. A separate ordinary HC computation converts the evidence
to the numeric index consumed by the scan; schema matching stays read-only.
This is an 8-bit bridge, NOT a public two-blob cursor or an implicit cast.
```
; .CdByte <[
  .b7 <1@Bit>; .b6 <1@Bit>; .b5 <1@Bit>; .b4 <1@Bit>;
  .b3 <1@Bit>; .b2 <1@Bit>; .b1 <1@Bit>; .b0 <1@Bit>;
]>;
; .cd_byte_index {
  .bits (CdByte _);
  .w76 (((cd_bool (bits.b7 = 0b1)) * 128) + ((cd_bool (bits.b6 = 0b1)) * 64));
  .w54 (((cd_bool (bits.b5 = 0b1)) * 32) + ((cd_bool (bits.b4 = 0b1)) * 16));
  .w32 (((cd_bool (bits.b3 = 0b1)) * 8) + ((cd_bool (bits.b2 = 0b1)) * 4));
  .w10 (((cd_bool (bits.b1 = 0b1)) * 2) + (cd_bool (bits.b0 = 0b1)));
  w76 + w54 + w32 + w10
};
; cd_byte_index 0b10100101
# 165
; cd_byte_index 0b00000000
# 0
; .cd_sign_bits8 {.inputs _; cd_sign8 [cd_byte_index (inputs .0), cd_byte_index (inputs .1)]};
; cd_sign_bits8 [0b10000000, 0b10000001]
# 0
; cd_sign_bits8 [0b10000000, 0b00000001]
# 1
; cd_sign_bits8 [0b10000000, 0b00000000]
# 0
; cd_sign_bits8 [0b00000010, 0b00000001]
# 1
; cd_sign_bits8 [0b00000101, 0b00000011]
# 0

```
Negative ingress witnesses: schema matching rejects undersized,
oversized, and non-binary input instead of implicitly coercing it.
```
; cd_byte_index 0b101
# $!.insufficient-bits .b4 3
; cd_byte_index 0b111111111
# $!.unconsumed-bits 1
; cd_byte_index 5
# $!.bit-input-invalid 5
```
BitScheme ingress rejects incomplete, oversized, or non-blob inputs.
These are executable error-contract witnesses, not new parser behavior.
```
; cd_byte_index 0b101
# $!.insufficient-bits .b4 3
; cd_byte_index 0b111111111
# $!.unconsumed-bits 1
; cd_byte_index 5
# $!.bit-input-invalid 5
