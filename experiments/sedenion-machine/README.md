# Minimal exact-rational sedenion machine

This directory implements the standalone 061.11 handoff as a Python 3
standard-library experiment. A value is an immutable tuple of 16
`fractions.Fraction` coefficients in basis order `e0, e1, ..., e15`. This is an
exact executable rational subalgebra of the real sedenions; it does not
represent every real coefficient.

The reference multiplication recursively splits a vector into `(a, b)` and pins
this Cayley–Dickson convention:

```text
conj(scalar) = scalar
conj((a,b)) = (conj(a), -b)
mul((a,b),(c,d)) = (mul(a,c) - mul(d,conj(b)),
                     mul(conj(a),d) + mul(c,b))
```

No reassociation is performed. An ordered event program left-multiplies each
event, so events `[z1, z2]` produce `z2*(z1*initial)`, which need not equal
`(z2*z1)*initial`.

Run conformance tests:

```bash
python3 -m unittest -v test_sedenion.py
```

Run the deterministic witness searches and experiments, regenerating
`results.json` and `observations.md`:

```bash
python3 experiments.py
```

The tests cover all ordered imaginary-basis relations and finite samples from a
documented PRNG seed. The generated report distinguishes conformance guarantees
from observations; sampled success is not claimed as a universal algebraic
proof.

Files:

- `sedenion.py`: exact values, arithmetic, JSON expressions, ordered traces,
  exact replay, and ray mode.
- `test_sedenion.py`: conformance, embedded-subalgebra, expression, trace,
  replay, and ray tests.
- `experiments.py`: deterministic witness searches and six requested experiment
  families.
- `results.json`: generated machine-readable operands, traces, endpoints, norms,
  and coverage.
- `observations.md`: generated concise interpretation and domain boundaries.
