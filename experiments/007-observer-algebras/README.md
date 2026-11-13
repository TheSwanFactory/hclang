# 007.41 — simplex and Cayley–Dickson observer algebras

Experimental code for Occurrence task 007.41. It is not part of the shipped
runtime and changes no Denum or Frame state, grammar, operator or version. The
native HC observers `.##%` … `.###%%%` that 007.41b/c later asked for live in
`lib/frames/denum-observers.ts` (see `doc/FRAME-DENUM.md`); a test here checks
them against these algebras on the same inputs. Since 007.46 `%%` is KPSL and
`%%%` is KDSL. Both algebras produce separate **observer values** with signed or
rational coefficients; nothing here converts a product back into a nonnegative
native Denum.

```sh
deno task test:observer-algebras        # 32 tests, also part of test:all
deno task experiment:observer-algebras  # prints the report below
```

`expected-output.txt` is the committed output of the second command; the test
suite fails if the report changes.

## Input

A Denum is bound with the real `d.#%` (007.39a, 007.40), through the TypeScript
bridge (`constructDenum` then `sizeFor(Frame.kBIND)`) and independently through
a bare evaluator that runs the bundled `hc/denum.hc` followed by
`(Denum [C, [loads]]).#%`. Count C and the C loads are read from that answer.
The experiment does not reimplement the `bⱼ = Σ_{i mod C = j} aᵢ` folding.
Native `.#`, `.##` and `.###` are read from the same bound Denum and reported
next to the algebras.

## Algebra A — centered cyclic simplex (`simplex.ts`)

`S_C = ℤ[ℤ/Cℤ] / ⟨Σeᵢ⟩`, with `eᵢeⱼ = e₍ᵢ₊ⱼ mod C₎`. Elements are length-C
integer arrays, canonicalized by subtracting the last coefficient. The product
is cyclic convolution then canonicalization; `Lₓ` is the C×C circulant on raw
arrays and a (C−1)×(C−1) integer matrix in the canonical chart. The squared
geometric resultant is the exact rational `R²_C(a) = [CΣaᵢ² − (Σaᵢ)²]/(C−1)`,
with `R²₁ = 0`. C = 1 is the zero ring and C = 0 is refused.

The product relies on an extra cyclic labeling of the simplex vertices; it is
not preserved by every vertex permutation.

## Algebra B — recursive Cayley–Dickson (`cayley-dickson.ts`)

C = 2ⁿ only. Convention used:

```
real base:  a·b = ab,  conj(a) = a
doubling:   (a,b)·(c,d) = (ac − conj(d)·b,  d·a + b·conj(c))
conjugate:  conj(a,b) = (conj(a), −b)
```

`N(x) = Σxᵢ²`, `Lₓ(y) = x·y` as a C×C matrix. The recursion is generic over a
coefficient ring: exact `bigint` for every law and witness, `number` only for
the embedding comparison. Other Counts throw `ObserverDomainError`.

## Comparison (`isometry.ts`)

`φ_C` sends the simplex class of the C loads to the Cayley–Dickson imaginary
space by the fixed-sign Helmert basis scaled by `√(C/(C−1))`; imaginary index k
carries Helmert row k. It is an observer coordinate choice, not a canonical or
physical Fano orientation. `N(φ(a)) = R²(a)` holds exactly
(`phiNormSquaredExact`) and to a relative tolerance of 1e-12 in doubles.
`compareProducts` reports, without demanding a homomorphism, the gap between
`φ(x·_S y)` and `φ(x)·_CD φ(y)` including the scalar part.

## Files

| File                  | Role                                                          |
| --------------------- | ------------------------------------------------------------- |
| `exact.ts`            | Rationals, `ObserverDomainError`                              |
| `sample.ts`           | Seeded deterministic sample vectors                           |
| `simplex.ts`          | Algebra A                                                     |
| `cayley-dickson.ts`   | Algebra B and its witness searches                            |
| `bridge.ts`           | Real `.#%` binding through the TS bridge and a bare evaluator |
| `isometry.ts`         | `φ_C`, tolerances, product comparison                         |
| `experiment.ts`       | Same-Denum report                                             |
| `report.ts`           | Prints the report                                             |
| `*.test.ts`           | Law, witness, boundary and fixture tests                      |
| `expected-output.txt` | Committed report                                              |
