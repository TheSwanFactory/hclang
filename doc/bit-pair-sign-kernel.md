# BitScheme sign kernels via HC observation and fold

**Status:** Exploratory, executable HC proof-of-concept. The implementation is
[`hc/cd-bit-kernel.hc`](../hc/cd-bit-kernel.hc), which is both the source and
the automatically discovered HC testdoc. It adds **no parser grammar, runtime
intrinsic, or schema side effects**.

## Motivation

The idealized Cayley–Dickson sign-kernel HLIR in Occurrence Explore 023 uses
`scan msb_to_lsb`, paired patterns `00/01/10/11`, `empty(u↓)`,
`empty(v↓)`, and state changes `swap/flip/stop`. The current BitScheme
implementation supports pure, evidence-producing bit schemas but does not
offer these as one stateful two-operand scanning facility.

This experiment asks what can already be written as **ordinary HC** before
changing BitScheme's grammar or making schemas effectful.

## Data path

1. **Observation (pure):** `cd_observe [u, v, powers]` maps a descending list
   of powers of two to `[u_bit, v_bit, u_lower_nonzero, v_lower_nonzero]`.
   Bit inspection uses exact integer `%%` and comparisons, not a new bitwise
   operator. Observations hold the original operands and are immutable.
2. **Transition (explicit):** `CdSignState ()` constructs a state Frame with
   properties `parity`, `swapped`, and `halted`. Its `apply_` method
   selects the currently oriented bit pair and lower-tail flags, then handles
   the Rust reference's four transition cases. `swapped` is a one-bit
   orientation, not a physical exchange of operands.
3. **Reduction (existing HC):** `observations | (CdSignState ())` applies the
   transition for each observation. A halted state is **absorbing**; the fold
   still visits remaining items. No short-circuit primitive is claimed.
4. **Result:** `cd_sign` returns parity 0 or 1, and explicitly handles an
   input basis index zero as the identity case. Parity 0 means coefficient +1,
   not the algebraic zero element.

The required `powers` sequence is a complete descending list
`[2^(n−1), ..., 1]`; `u` and `v` are nonnegative indices smaller than
`2^n`. They are checked by this document as **preconditions**, not by a
runtime type checker. The testdoc exercises widths 3 and 8. Inputs are numeric
basis indices, not native binary `FrameBlob` pairs.

## Test coverage

The discovered testdoc asserts:

- individual bit extraction and the paired observation shape;
- identity-index and asymmetric early-return cases;
- the **complete 8×8** sign table on octonionic basis indices, with expected
  values independently generated from the Rust reference;
- representative bit-7 / leading-zero cases with the complete width-8 scan.

Run the executable assertions with:

```sh
deno task test:doc
```

The full repository suite is `deno task test`.

**Review note:** When the PR was authored, Deno execution was not available in
the author's environment. Treat the result as source-written and rely on actual
CI/testdoc execution before merging; do not interpret the reference-generated
expectations as independently passing HC tests.

## Deliberate non-goals

- A new BitScheme keyword, a native `scan` operator or `u↓` syntax.
- A public synchronized cursor over two `FrameBlob` values. That is the
  next **optional** enhancement if numeric observation is too awkward.
- A semantic early-stop optimization to HC fold.
- Generalized CD signatures, the zero-aware Clifford product, or the
  conjectural `assoc` hybrid. Those should be separate experiments after this
  common observation/transition/fold boundary passes.
- Any assertion that the proposed HLIR is implemented by this testdoc.

This preserves the explicit [pure schema-matcher contract](../spec/9-minimal-schema-deconstruction.md)
and follows current [HC fold semantics](../hc/apply-tutorial.md) while retaining
a testable path toward future paired-blob observation evidence.
