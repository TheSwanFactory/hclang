# FOIST 19a — implemented HC operator and observer contract

**Authority:**
[Occurrence FOIST 19a](https://nightly.quilttest.com/b/protology/packages/occurrence/foist/tree/ffc2e2188d5c93e6eaa96e0f363f88aa54ac560ec5623dcf1e78d73221ae5d80/19a-Foist-Raw-Denum-KD-Coordinates-Cart-and-Signed-XOR-Product.md).

This document records the **breaking**, implemented FOIST 19a operator contract
and its rationale. It links runtime dispatch, executable HC testdocs, the exact
signed-XOR load kernel and independent recursive Cayley–Dickson regressions. The
implementation passed the full Deno validation gate in
[run 44861795939](https://github.com/TheSwanFactory/hclang/actions/runs/44861795939);
later code changes must pass fresh checks before merge.

## Target public semantics

- `F.###` answers an unnormalized Denum, retaining Count and ordered loads.
- `F.####` answers observed KD coordinates after lazy arity completion.
- `A+B = B|A` is Flop (ordered repeated Apply).
- `A*B` is ordered Cartesian pairing, for Frames and Denums.
- `A &|& B` is signed-XOR KD multiplication returning a **Denum**, with raw
  nonnegative loads. `(A &|& B).####` reads the result coordinates.
- Unary `-D` zero-pads only when necessary and rotates by half the signed arity.
  A valid `[3,1]` negates to `[1,3]`, **without** rank promotion.
- Remove `.#%`, `.##%`, `.###%`, `.##%%`, `.###%%`, `.##%%%`, and `.###%%%` from
  the public observer surface. This does not remove ordinary modulo/remainder.

Before this PR, HC `*` meant Star, `&|&` meant Cart, `.###` was a residual, and
`.####` constructed a two-load Denum. This branch replaces those public
meanings. **Numeric scalar** `+`, `-`, and `*` remain ordinary exact numeric
arithmetic so HC's own scalar implementation works.

## Observable prefix instability (intentional)

The third hash exposes raw loads, so **appending another raw load can change the
interpretation of every earlier load** when the least power-of-two slot arity
changes. This is inherent in lazy trailing-zero completion, not a mutation of
the original Denum. In particular:

- Raw `[3,1]`: arity 2, antipodal pair `3 − 1`, so `.#### = [2]`.
- Append a load to get raw `[3,1,5]`: arity 4, virtually `[3,1,5,0]`, so
  `.#### = [-2,1]`. The former negative-real slot now denotes positive `e₁`. No
  implicit value-preserving cross-rank embedding occurred.
- Explicit value-preserving embedding is **separate**: `[3,1] → [3,0,1,0]`,
  still observing `[2,0]`.

The executable [FOIST 19a testdoc](../../hc/foist-19a.hc) now pins the behavior:

```hc
; [3, 1].####
# [2]
; [3, 1, 5].####
# [-2, 1]
```

The runtime observer tests and the pure-load unit tests pin the same
distinctions.

## Flop preserves construction phase, not coordinate addition

On Denums, `A + B = B | A` replays **B's ordered loads** into a fresh A using
A's native `apply_`. The initial destination is `C(A) mod arity(A)`; the result
Count is `C(A) + arity(B)`, **not** `C(A) + C(B)`. Consequently, two receivers
with the same KD coordinates but different Counts can give different results
under Flop. This behavior is intentional structural composition, not slotwise
Cayley–Dickson addition:

- `([3,1].### + [1,2].###).#### = [1]`
- `((([3,1].###) 0) + [1,2].###).#### = [3]`, even though the receiver's `.####`
  is still `[2]`.

The public `A - B` on Denums is the proposed structural expression `A + (-B)`,
inheriting the same Count dependence; it is **not** claimed to be coordinate
subtraction. Outside the numeric-numeric case, subtraction requires a Denum on
the right and otherwise refuses `$!.flop-domain -`. Numeric scalar arithmetic
remains native. Flop with a numeric **left** receiver uses scalar Apply:
`3 + [2,5] = 30`, `5 - ([3,1].###) = 15`, and `0 - ([3,1].###) = 0`. Thus `0-D`
is not unary `-D`. KD bilinearity is with respect to **coordinate addition**,
which is a separate not-yet-installed algebraic operation. Do not use Flop as a
surrogate in algebraic proofs or tests.

## Cart allocation bound

Public structural Cart materializes all ordered pairs. To prevent unbounded
allocation, `A * B` refuses when the pair count exceeds
`CART_MAX_PAIRS = 262144`, returning `$!.cart-product-budget *` before building
pairs. This implementation resource policy does not alter FOIST 19a's ordered
Cartesian semantics.

## Unsigned multiplication and work budget

Two one-load unsigned scalar inputs **stay unsigned** under KD multiplication:
`[3] &|& [3]` must produce raw loads `[9]`, not `[9,0]`. Promoting an unsigned
scalar is needed for negation or multiplication with a signed-rank operand, not
for unsigned × unsigned. This chooses _load arity_; the result's **construction
Count** follows `C(A &|& B)=C(A)×C(B)`, independently of the load arity.

The load kernel does **not** execute a dense loop over all 65536² possible
pairs. It enumerates nonzero input slots and rejects any multiplication
exceeding `KD_MAX_PRODUCT_TERMS = 262144` **active Cartesian pairs** before the
product begins. Sparse high-arity inputs can therefore run without a quadratic
traversal. This is a provisional runtime resource bound, not a mathematical
restriction on Cayley–Dickson multiplication; the public HC operator must retain
an explicit and testable resource policy.

## Product construction

For signed-slot indices `i=(s,u)` and `j=(t,v)`, at common signed slot arity
`2d`, use the unchanged Explore 023 sign convention:

`w=u XOR v; q=s XOR t XOR cd_sign(u,v)`.

Deposit `loadsA[i] * loadsB[j]` into output slot `w+qd`. Sum nonnegative
contributions in the **full signed slot** without quotienting opposite halves.
The product loads are one flat value; the observed coefficients are the
differences of the opposite slots. The separate rank-embedding rule pads **both
orientation halves** individually, not the tail of an already canonical
lower-rank value.

## Implementation committed

- Pure, arbitrary-supported-width guarded `cd_sign` using exact bigint indices.
- Lazy raw-load completion, coordinate observation and half-turn.
- Correct value-preserving halfwise CD embedding.
- Pure signed-XOR load convolution and independent recursive-CD differential
  tests on all ordered basis pairs through the sedenion rung.
- Count is **not inferred from array length**: the kernel answers loads and
  leaves HC Denum construction to the public operator implementation.

The runtime is wired in `lib/frames/fourth-hash.ts`, `lib/ops.ts`,
`lib/ops/math.ts`, and `lib/ops/pairings.ts`. The public `&|&` answers an HC
Denum, with output Count chosen explicitly as the product of the construction
Counts. See [the updated manual](../../doc/FRAME-DENUM.md).

## Merge blockers and completed items

- [x] Define output construction Count as `C(A)×C(B)`, independent of arity.
- [x] Wire `.###` and `.####` to raw Denum and KD coordinate observation,
      including the canonical zero-arity state.
- [x] Remove the seven `#%`-family observer dispatch paths **and complete
      migration** of all legacy tests, docs and syntax highlighting. Native
      dispatch has been removed.
- [x] Reassign native `*` to Cart and `&|&` to KD multiplication, including the
      Denum-returning constructor and mixed-rank behavior.
- [x] Reassign aggregate `+` to Flop and Denum unary `-` to half-turn;
      numeric-scalar arithmetic is deliberately retained.
- [x] Establish and pin Flop's Count-phase dependence independently of
      **slotwise KD addition**. Bilinearity must not be assumed for Flop.
- [x] Complete full Deno build and `test:all` regression validation of public
      dispatch, including CLI, library, MAML, scripts, observer algebra, web,
      all 21 HC testdocs, npm and compiled CLI:
      [run 44861795939](https://github.com/TheSwanFactory/hclang/actions/runs/44861795939).
- [x] Enforce the repository's existing `deno lint` contract in the CI build
      gate and remove the final reported unused import. Final branch-head status
      is always determined by the live GitHub checks.

**Historical scope:** This PR changes implementation only as files explicitly
committed. FOIST 19 and 19a remain immutable; Explore 023 and Figure 018 are
unchanged.
