# 017.11 — the classical Cayley–Dickson lane in HC

Research program for Occurrence task 017.10
(`quilt+s3://protology#package=occurrence/explore@dafd253e97cf16c9f074ec9508f6de65e0394a9abaf063c63136999db76ab4f3&path=issues/017-cayley-dickson-space-elevator-explained-linearly/017.10-Invariant-task-classical-Cayley-Dickson-HC-lane.md`).
It is research code, not part of the shipped runtime, and it is not wired into
`deno task test:all`: the evidence run takes tens of minutes and about 20 GB of
memory.

HC builds the classical sign tables w₀ = 0 → w₁ → w₂ → w₃ → w₄ (dimensions 1, 2,
4, 8, 16) with the literal Dickson/Schafer doubling, checks every floor against
the lawful domain 𝒲, checks K∘CD = S∘K on every triple of every step, and
interrogates the 16-dimensional floor for positive-holonomy matched squares (K
= 0) and two-term annihilation. An independent host oracle recomputes all of it
with dense integer arithmetic and compares.

## Convention

New sheet bit most significant: (a, α) is the label a + α·2^d. e_a e_c =
(−1)^{w(a,c)} e_{a⊕c}; (x + yℓ)(z + wℓ) = (xz − w̄y) + (wx + yz̄)ℓ; ē_b =
(−1)^{ν(b)} e_b with ν(b) = [b ≠ 0]. 𝒲_d = {w : w(b, b) = ν(b), wᵀ = w ⊕ δν}.
CD(w) = Lift(w) ⊕ P_ν and S(H) = Lift(H) ⊕ J_V are specified separately and
compared only on 𝒲.

## Files and authorship

| File               | Author of its values | Role                                                                                                                                                                                                                  |
| ------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cd-core.hc`       | HC                   | Definitions: F₂ helpers, label order, lookup trees, signed monomials, the doubling (Dickson/Schafer, Baez, two mutants), the closed form, 𝒲, K, S, squares, two-term products, graphs, components. Prints only prose. |
| `main.hc`          | HC                   | The classical lane d = 0…4 and the sedenion interrogation.                                                                                                                                                            |
| `controls.hc`      | HC                   | C1 r = 0 on 𝔽₂² (off 𝒲); C2 Baez law; C3 mutants “Ma” (drops the minus) and “Mb” (drops the conjugations); C4 one flipped w₃ entry.                                                                                   |
| `alt-seed.hc`      | HC                   | C5, a second lawful seed w₂′ = w₂ ⊕ f doubled to 16, in its own process. At 16 its two-term search stops before the support graph: the full search exhausted a 30 GB V8 heap.                                         |
| `closure-probe.hc` | HC                   | C6: the same successor as closure factories, plus the 017.09 P5 shape. An observation about the runtime, not a gate.                                                                                                  |
| `gate0.hc`         | HC testdoc           | The language behaviors the lane relies on.                                                                                                                                                                            |
| `oracle.ts`        | host                 | Independent dense Cayley–Dickson arithmetic, rank by elimination, BFS components. Never reads HC output.                                                                                                              |
| `compare.ts`       | host                 | Builds the records HC should print from the oracle and compares field by field.                                                                                                                                       |
| `parse.ts`         | host                 | Reads HC records (serialization only).                                                                                                                                                                                |
| `run.ts`           | host                 | Composes, guards, runs, times, compares. Computes no lane value.                                                                                                                                                      |

`run.ts` composes each executed file as `#!/usr/bin/env hc` + `cd-core.hc` + one
variant file (shebangs stripped) and writes it to `<out>/build/`; that file is
the exact source that ran. It fails closed when the runtime or experiment tree
is dirty, and it rejects any composed file whose code lines (outside prose
blocks) contain the integer tokens 168, 84, 42, 336 or 3168. No HC source reads
anything the host computed, and no reference count is an input. The guard does
not detect a hard-coded table literal (see Limits).

## Records

Each observation is printed as `[“record”, “<tag>”, field, …]`; fields are HC
integers or strings with no comma, space or bracket. Points print as binary
labels, newest bit first. Tables print row-major in label order; lists are
joined with `/`. A two-term element e_p + (−1)^e e_q (p < q, e₀ = 1 included)
prints as `p+q` or `p-q`. The field names are in `SCHEMA` in `compare.ts`.

The quantities are kept apart: ordered positive squares, unordered positive
squares, supports, projective signed two-term zero divisors (vertices), ordered
annihilating pairs, unordered graph edges, support edges, components. Nothing
here asserts a map from positive squares to zero divisors; per unordered
positive square HC only counts the graph edges supported on it.

## Commands

From the repository root, on a clean checkout:

```sh
deno test experiments/017-classical-cd
(cd cli && deno task hc ../experiments/017-classical-cd/gate0.hc -t)
deno run --allow-read --allow-write --allow-run experiments/017-classical-cd/run.ts \
  --variant all --budget-min 120 --out /tmp/017.11-out
```

Each HC variant runs as
`deno run --v8-flags=--max-old-space-size=32768 --allow-read --allow-write --allow-env --deny-run --deny-ffi ./hc.ts <composed file>`
from `cli/`, which is `deno task hc` plus a larger V8 heap: the exhaustive
sedenion two-term search does not finish inside V8's default heap (it stopped
with an allocation failure near 4 GB). `run.ts` writes `<variant>-output.txt`,
`<variant>-stderr.txt` (with `/usr/bin/time -l`), `run-log.txt`, `runtime.json`
(HEAD, Deno, `lib/version.ts`, SHA-256 of every source, composed file and
output), `validation-report.json` and `observations.json`. It exits 2 if any
gated comparison disagrees.

`--src-dir <dir> --allow-dirty` runs scratch copies of the HC sources; it is for
checker self-tests only and is recorded in `runtime.json`.

## Limits

- A finite classical lane, d ≤ 4. It does not construct the completed T04/T05
  relation, prove universal recovery or scaling, or close Issue 017.
- The two-term search covers basis-pair elements only, not arbitrary sedenion
  zero divisors.
- K∘CD = S∘K is asserted only on 𝒲. It is checked on the constructed floors and,
  in the oracle tests, on all of 𝒲₁ and 𝒲₂; control C1 checks it off 𝒲 (r = 0 on
  𝔽₂²) and finds it failing on 96 of 512 triples.
- Two per-record checks are internal consistency checks, not independent support
  for T03: the single-signed-monomial check on each doubling product (for a
  basis input x + yℓ one of x, y is zero, so it cannot fail), and the per-pair
  equal-displacement and forced-relative-sign check on each annihilating pair
  (xy = 0 already forces both). The two-term search itself is cross-checked by
  HC's label-sum test and by the oracle's dense products.
- Hard-coding in `main.hc` itself is not gated. The literal guard blocks only
  the reference counts, and C4 diffs against the controls' own rebuild of w₄, so
  a correct table literal written into `main.hc` would pass every gate. That
  `main.hc` builds w₁…w₄ through `succ` rests on source review.
- C5 checks one alternate lawful seed, not all of 𝒲, and at 16 it reports the
  two-term counts up to supports but not the support graph or its components.
- The 017.09 closure pitfall P5 still reproduces on this runtime (`p5-depth`
  answers 1, 3, 5 instead of 1, 2, 3). The lane avoids it by keeping floors as
  data; the closure factories in `closure-probe.hc` that pass fresh argument
  literals agree with the data route. It is recorded, not fixed: it is a
  name-resolution design question in the evaluator, not a defect the lane needs
  fixed.
