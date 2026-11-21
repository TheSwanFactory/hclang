# FOIST 19a — HC operator migration (draft)

**Authority:**
[Occurrence FOIST 19a](https://nightly.quilttest.com/b/protology/packages/occurrence/foist/tree/ffc2e2188d5c93e6eaa96e0f363f88aa54ac560ec5623dcf1e78d73221ae5d80/19a-Foist-Raw-Denum-KD-Coordinates-Cart-and-Signed-XOR-Product.md).

This branch is an **implementation-in-progress** of the intentionally breaking
FOIST 19a operator contract. The first code slice is a reusable exact-integer
signed-XOR load convolution in `lib/frames/kd-signed-xor.ts`, with tests against
the independent recursive CD reference in `lib/frames/cayley-dickson.ts`. **Do
not merge the draft based on that slice alone.**

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

Existing HC `*` means Star, `&|&` means Cart, `.###` is residual, and `.####`
means the older two-load Denum; the branch must update dispatch, docs and
existing tests before it can claim these public semantics.

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

## What the first code slice establishes

- Pure, arbitrary-supported-width guarded `cd_sign` using exact bigint indices.
- Lazy raw-load completion, coordinate observation and half-turn.
- Correct value-preserving halfwise CD embedding.
- Pure signed-XOR load convolution and independent recursive-CD differential
  tests on all ordered basis pairs through the sedenion rung.
- Count is **not inferred from array length**: the kernel answers loads and
  leaves HC Denum construction to the public operator implementation.

This math layer neither changes the interpreter nor answers `A &|& B` as a Denum
yet. It deliberately avoids silently choosing the unapproved **output Denum
Count** policy.

## Merge blockers

- [ ] Decide how the KD multiplication result's **construction Count** is
      defined while keeping Count distinct from load arity.
- [ ] Wire `.###` to the raw Denum for ordinary Frame families, including the
      FOIST zero-arity Denum boundary; wire `.####` to coordinate observation.
- [ ] Remove the seven `#%`-family observer dispatch paths and migrate tests,
      docs and syntax highlighting.
- [ ] Reassign native `*` to Cart and `&|&` to KD multiplication, including the
      Denum-returning constructor and mixed-rank behavior.
- [ ] Reassign `+` to Flop and unary `-` to Denum half-turn without breaking
      unrelated syntax or silently importing numeric arithmetic.
- [ ] Verify Flop/structural addition versus **slotwise KD addition**. They are
      not automatically the same operation, and bilinearity must not be assumed.
- [ ] Run the full Deno suite, executable HC testdocs, formatter, package
      validation and review the breaking changes. No Deno runtime is available
      in the authoring environment, so CI results must be inspected after
      creation.

**Historical scope:** This PR changes implementation only as files explicitly
committed. FOIST 19 and 19a remain immutable; Explore 023 and Figure 018 are
unchanged.
