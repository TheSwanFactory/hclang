# BitScheme sign kernels via HC observation and fold

**Status:** Exploratory, executable HC proof-of-concept. The implementation is
[`hc/cd-bit-kernel.hc`](../hc/cd-bit-kernel.hc), which is both the source and
the automatically discovered HC testdoc. It adds **no parser grammar, runtime
intrinsic, or schema side effects**.

## Motivation

The idealized Cayley–Dickson sign-kernel HLIR in Occurrence Explore 023 uses
`scan msb_to_lsb`, paired patterns `00/01/10/11`, `empty(u↓)`, `empty(v↓)`, and
state changes `swap/flip/stop`. The current BitScheme implementation supports
pure, evidence-producing bit schemas but does not offer these as one stateful
two-operand scanning facility.

This experiment asks what can already be written as **ordinary HC** before
changing BitScheme's grammar or making schemas effectful.

## Data path

1. **Observation (pure):** `cd_observe [u, v, powers]` maps a descending list of
   powers of two to `[u_bit, v_bit, u_lower_nonzero, v_lower_nonzero]`. Bit
   inspection uses exact integer `%%` and comparisons, not a new bitwise
   operator. Observations hold the original operands and are immutable.
2. **Transition (explicit):** `CdSignState ()` constructs a state Frame with
   properties `parity`, `swapped`, and `halted`. Its `apply_` method selects the
   currently oriented bit pair and lower-tail flags, then handles the Rust
   reference's four transition cases. `swapped` is a one-bit orientation, not a
   physical exchange of operands.
3. **Reduction (existing HC):** `observations | (CdSignState ())` applies the
   transition for each observation. A halted state is **absorbing**; the fold
   still visits remaining items. No short-circuit primitive is claimed.
4. **Schema ingress (pure):** `CdByte` uses the implemented BitScheme matcher
   for eight exact 1-bit captures. `cd_byte_index` converts that evidence into
   an integer, and `cd_sign_bits8` delegates to the same fold. No matcher state
   or implicit blob-to-integer cast is introduced.
5. **Result:** `cd_sign` returns parity 0 or 1, and explicitly handles an input
   basis index zero as the identity case. Parity 0 means coefficient +1, not the
   algebraic zero element.

The required `powers` sequence is a complete descending list
`[2^(n−1), ..., 1]`; `u` and `v` are nonnegative indices smaller than `2^n`.
These are **preconditions**, not runtime checks; this example intentionally
omits range guards. Inputs outside the specified index domain are undefined, and
their returned parity must not be interpreted as a valid product sign. The core
testdoc exercises ranks 0 through 5 and width 8 with numeric basis indices. The
separate byte-ingress wrapper accepts two exact-width binary blobs through pure
schema evidence, then converts them to the same numeric kernel input.

## Test coverage

The discovered testdoc asserts:

- individual bit extraction and the paired observation shape;
- identity-index and asymmetric early-return cases;
- a small executable ladder of real, complex, quaternion, octonion, sedenion,
  and rank-5 basis-sign witnesses using the same kernel;
- a short Cayley–Dickson ladder of rank-by-rank sign witnesses, including
  quaternion anticommutation, an octonion associator sign, and embedding;
- the **complete 8×8** sign table on octonionic basis indices, with expected
  values independently generated from the Rust reference;
- representative bit-7 / leading-zero cases with the complete width-8 scan;
- fixed-width BitScheme schema capture, binary-blob ingress cases, and negative
  examples for invalid or incorrectly sized ingress.

Run the executable assertions with:

```sh
deno task test:doc
```

The full repository suite is `deno task test`.

**Verification history:** Before the ladder revision, CI run 721 and a local
interpreter run passed all 25 original testdoc assertions. The 8×8 table and
65,536 eight-bit sign pairs were independently cross-checked against a
reference. The newly added ladder and negative-ingress assertions require a
fresh testdoc run before their passing status can be claimed.

## Deliberate non-goals

- A new BitScheme keyword, a native `scan` operator or `u↓` syntax.
- A public synchronized cursor over two `FrameBlob` values. That is the next
  **optional** enhancement if numeric observation is too awkward.
- A semantic early-stop optimization to HC fold.
- Generalized CD signatures, the zero-aware Clifford product, or the conjectural
  `assoc` hybrid. Those should be separate experiments after this common
  observation/transition/fold boundary passes.
- Any assertion that the proposed HLIR is implemented by this testdoc.

This preserves the explicit
[pure schema-matcher contract](../spec/9-minimal-schema-deconstruction.md) and
follows current [HC fold semantics](../hc/apply-tutorial.md) while retaining a
testable path toward future paired-blob observation evidence.
