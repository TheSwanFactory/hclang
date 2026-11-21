# FOIST 19a — HC operator migration (draft)

**Authority:**
[Occurrence FOIST 19a](https://nightly.quilttest.com/b/protology/packages/occurrence/foist/tree/ffc2e2188d5c93e6eaa96e0f363f88aa54ac560ec5623dcf1e78d73221ae5d80/19a-Foist-Raw-Denum-KD-Coordinates-Cart-and-Signed-XOR-Product.md).

This branch implements the proposed **breaking** FOIST 19a operator contract in
the HC runtime and tracks the migration of the legacy testdocs and tests. It
also contains the exact signed-XOR load kernel and independent recursive-CD
regressions. The PR remains **draft** until the entire active suite passes; do
not treat the focused green FOIST tests as approval to merge.

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
- [ ] Remove the seven `#%`-family observer dispatch paths **and complete
      migration** of all legacy tests, docs and syntax highlighting. Native
      dispatch has been removed.
- [ ] Reassign native `*` to Cart and `&|&` to KD multiplication, including the
      Denum-returning constructor and mixed-rank behavior.
- [x] Reassign aggregate `+` to Flop and Denum unary `-` to half-turn;
      numeric-scalar arithmetic is deliberately retained.
- [ ] Verify Flop/structural addition versus **slotwise KD addition**. They are
      not automatically the same operation, and bilinearity must not be assumed.
- [ ] Re-run the full Deno suite, executable HC testdocs, formatter, package
      validation and review after **public operator dispatch** is implemented.
      The reviewed first slice passed Deno 2.9.5 tests and formatting (235
      library tests, 10 CLI tests, 20 testdocs) and CI `test:all` in
      [run 755](https://github.com/TheSwanFactory/hclang/actions/runs/44849829075).
      These later review-driven code and test changes require fresh CI.

**Historical scope:** This PR changes implementation only as files explicitly
committed. FOIST 19 and 19a remain immutable; Explore 023 and Figure 018 are
unchanged.
