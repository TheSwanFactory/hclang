# Denums, KD coordinates, and structural operators (FOIST 19a)

The current HC public contract follows
[FOIST 19a](https://nightly.quilttest.com/b/protology/packages/occurrence/foist/tree/ffc2e2188d5c93e6eaa96e0f363f88aa54ac560ec5623dcf1e78d73221ae5d80/19a-Foist-Raw-Denum-KD-Coordinates-Cart-and-Signed-XOR-Product.md).
This is a **breaking migration** from the two-load fourth-hash observer,
alternating residual, Star/Foliation product, and the `#%` geometry family. See
[the prior version](https://github.com/TheSwanFactory/hclang/blob/a375dfc0fb661de6667b43b63d6a5b9a0caa767f/doc/FRAME-DENUM.md)
for the pre-migration observations and experiments.

## 1. Constructive Denum state

`Denum [C, [w₀,…,wₖ₋₁]]` is the HC class implemented in
[`hc/denum.hc`](../hc/denum.hc), with an exact Count `C` and an ordered list of
nonnegative exact Count loads. Count is **not** the number of slots or a stored
CD rank. A constructed Denum may retain a Count distinct from its load arity.

The canonical empty state is `Denum [0, []]`; applying any nonnegative Size `s`
initializes it as `Denum [1, [s]]`. Applying a nonempty Denum routes Size `s` to
slot `C mod k` and advances Count by one. Apply does not normalize or cancel the
loads.

The HC class retains its `scale_`, `deposit_`, `size-ratio`, `residual-ratio`,
and `./` methods as explicit operations; these do not redefine the public `+`,
`*`, or `&|&` operators. Numeric scalars retain their existing native arithmetic
so class implementation can use exact Count arithmetic.

## 2. Raw Denumeration: `.###`

`F.###` returns the raw, **unnormalized Denum**:

- An ordinary ordered Frame `F=[a₀,…,aₖ₋₁]` supplies Count `k` and loads
  `[a₀.##,…,aₖ₋₁.##]`.
- A recognized Denum answers an equal reconstructed Denum, preserving its
  original Count and loads without normalizing them.
- The empty ordinary array reads as `Denum(0,[])`.
- **Scalar extension beyond FOIST 19a's ordered-Frame formula:** a scalar contributes
  its nonnegative *Size*, not its signed numerical value. Therefore
  `(0 - 2).###` gives `Denum(2,[2])` and `.####` reads `[2]`—the sign
  does not survive. Fractional scalars follow native Count and Size:
  `(7 / 2).#### = [3]`, and `(1 / 2).### = Denum(0,[])`.
  For a KD value of `-2`, construct explicit signed loads `Denum(2,[0,2])`.
- Other Frames follow the ordinary Count and Size contracts; inability to supply
  an exact nonnegative load is a diagnostic error.

The observer does not compute an alternating sum and does not infer rank from
Count. A Denum is recognized by its genuine class-state reconstruction, not by a
lookalike record.

## 3. KD coordinates: `.####`

Fourth hash is a **pure observation of the third**.

For nonempty raw loads of arity `k`, virtually append zeros to the least
power-of-two arity `n≥k`. At `n=1`, observe the unsigned coefficient vector
`[w₀]`. At `n=2d≥2`, split the loads into opposing halves
`[p₀,…,p₍d−1₎, m₀,…,m₍d−1₎]` and return `[p₀−m₀,…,p₍d−1₎−m₍d−1₎]`. For the empty
canonical Denum, return `[]`.

Examples:

- `[3,1].###` → `Denum(2,[3,1])`, and `[3,1].####` → `[2]`.
- `[3,1,5].###` → `Denum(3,[3,1,5])`, and `[3,1,5].####` → `[-2,1]`.

**Prefix instability is intentional:** appending the third load changes where
the sign-half boundary falls. This is lazy completion, not a value-preserving
embedding of the already valid two-slot number.

Coordinate equality at a given rank is a _gauge_ observation: equally increasing
the two opposing loads does not change their difference, but raw Denums remain
different.

## 4. Frame products and addition

- `A+B`: **Flop**, applying the immediate children of `B` to a fresh receiver
  `A` in order. Its old derived spelling is `B|A`. A numeric left receiver
  applies its usual multiplication rule: `3 + [2,5] = 30`. This is
  *structural* Flop, not addition of values.
- `A*B`: **Cart**, a flat left-major Cartesian list of immediate ordered pairs
  `[[a₀,b₀],...,[aᵢ,bⱼ],...]`. For Denums, pair the stored raw load occurrences,
  not the class's named state fields. No signed routing is performed.
- `A &|& B`: **KD multiplication**, returning a new Denum with nonnegative loads
  and the appropriate power-of-two arity. The two operands' raw Denums are
  completed to their own KD arity, then valid lower-rank signed values are
  embedded **halfwise** to align ranks.

For every pair of signed slots `i=(s,u)` and `j=(t,v)` in common `2d`-load
arity, deposit magnitude `aᵢ×bⱼ` at `w + qd`, with basis `w=u⊕v` and orientation
parity `q=s⊕t⊕θ(u,v)`. `θ` is the bitwise `cd_sign` rule of
[Explore 023](https://github.com/TheSwanFactory/hclang/pull/504). All
contributions at each full signed slot accumulate before coordinates are
observed. **No cancellation occurs in the stored Denum.**

For this implementation, the result construction Count is `C(A &|& B)=C(A)×C(B)`
independently of its output load arity. This convention is an explicit
implementation choice beyond FOIST 19a's otherwise-unspecified Count policy.

All unsigned one-load products remain one-load: `[3]&|&[3]` answers
`Denum(1,[9])`. A valid two-load signed scalar must embed into a complex value
by padding **each orientation half**: `[3,1] → [3,0,1,0]`, not by appending
zeros.

The native signed-XOR implementation iterates only nonzero slots and bounds the
number of active Cartesian term pairs. It refuses exceeding the runtime product
budget with a diagnostic instead of stalling the evaluator.

## 5. Negation and subtraction

Outside numeric-numeric subtraction, `A - D = A + (-D)` requires a recognized
Denum on the right. Any other right operand returns `$!.flop-domain -`, not
silent nil. A numeric receiver retains scalar application semantics:
`5 - ([3,1].###) = 15` and `0 - ([3,1].###) = 0`, so `0 - D` is
**not** unary Denum negation.

Unary `−D` on a Denum uses the least even power-of-two arity `n≥k`, with
trailing zero completion only when necessary. It rotates the sequence by `n/2`
and preserves construction Count:

- `−[3,1]=[1,3]`, no padding.
- `−[3,1,5]=[5,0,3,1]`.
- `−[3]=[0,3]`, promoting the unsigned scalar to the first signed arity.

The binary structural proposal is `A−B=A+(−B)` when `B` admits Denum negation.
This is _not_ a claim that general Flop is coordinatewise KD addition or that
arbitrary Frame operations obey ring laws. Scalar numeric `−` is unchanged.

## 6. Retired observer family

The following are no longer public observers: `.#%`, `.##%`, `.###%`, `.##%%`,
`.###%%`, `.##%%%`, and `.###%%%`. They are not compatibility aliases. Only
`.#`, `.##`, `.###`, and `.####` are the public hash observations. Ordinary `%%`
remainder is **not** removed.

## 7. Validation and migration

- [`hc/foist-19a.hc`](../hc/foist-19a.hc) is the executable public semantics
  testdoc, including the prefix-instability case.
- [`lib/execute/foist-19a.test.ts`](../lib/execute/foist-19a.test.ts) exercises
  runtime dispatch and construction Count.
- [`lib/frames/kd-signed-xor.test.ts`](../lib/frames/kd-signed-xor.test.ts)
  compares the nonnegative load kernel with independent recursive CD.
- Previous historical HC examples and tests that assert the retired operators
  require a breaking-change migration; see
  [PR #506](https://github.com/TheSwanFactory/hclang/pull/506).

No interpreter or grammar mode restores the old `#%` family. Historical testdocs
and experiments are available in pre-FOIST 19a Git history.
