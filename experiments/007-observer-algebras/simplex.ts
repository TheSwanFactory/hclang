/**
 * Algebra A — the centered cyclic simplex quotient (occurrence/figure 007.41).
 *
 * For a positive Count C let e₀…e₍C−1₎ be C cyclic formal coordinates with
 * eᵢeⱼ = e₍ᵢ₊ⱼ mod C₎, and identify the balanced direction u = Σeᵢ with zero:
 *
 *     S_C = ℤ[ℤ/Cℤ] / ⟨u⟩.
 *
 * u generates an ideal (e·u is a permutation of u's summands), so the cyclic
 * convolution descends to the quotient. For C ≥ 2 the quotient has C−1
 * independent dimensions; C = 1 is the zero ring and is handled explicitly.
 *
 * An element is a coefficient array of length C. It is canonicalized modulo
 * uniform shifts by subtracting the last coefficient from every coefficient
 * (the exact integer representative (a₀−a₍C−1₎, …, a₍C−2₎−a₍C−1₎, 0)).
 *
 * The geometric reading puts C unit vertices vᵢ of a centered regular simplex
 * in dimension C−1 (Σvᵢ = 0, vᵢ·vⱼ = −1/(C−1) for i ≠ j), so the C weights a
 * of a Count-bound Denum give the vector Σ aᵢvᵢ. Its squared length is
 *
 *     R²_C(a) = [C·Σaᵢ² − (Σaᵢ)²] / (C−1),   C > 1,
 *
 * and R²₁ = 0 by definition. This is not Denum `.##` or `.###`.
 *
 * The product uses an additional cyclic labeling: an unlabeled simplex does not
 * pick a cyclic product or a vertex v₀ as identity, and not every vertex
 * permutation preserves it.
 *
 * @module
 */
import {
  assertCoefficients,
  ObserverDomainError,
  type Rational,
  rational,
} from "./exact.ts";

/** Canonical representative of a class modulo uniform shifts. */
export function simplexCanonical(a: readonly bigint[]): bigint[] {
  assertCoefficients(a);
  const last = a[a.length - 1];
  return a.map((x, i) => (i === a.length - 1 ? 0n : x - last));
}

/** The class sum a + b. */
export function simplexAdd(
  a: readonly bigint[],
  b: readonly bigint[],
): bigint[] {
  assertCoefficients(a);
  assertCoefficients(b, a.length);
  return simplexCanonical(a.map((x, i) => x + b[i]));
}

/** The class difference a − b. */
export function simplexSub(
  a: readonly bigint[],
  b: readonly bigint[],
): bigint[] {
  assertCoefficients(a);
  assertCoefficients(b, a.length);
  return simplexCanonical(a.map((x, i) => x - b[i]));
}

/** True when two arrays are the same class modulo uniform shifts. */
export function simplexEqual(
  a: readonly bigint[],
  b: readonly bigint[],
): boolean {
  if (a.length !== b.length) return false;
  const ca = simplexCanonical(a);
  const cb = simplexCanonical(b);
  return ca.every((x, i) => x === cb[i]);
}

/** True when the class is zero (every coefficient equal). */
export function simplexIsZero(a: readonly bigint[]): boolean {
  return simplexCanonical(a).every((x) => x === 0n);
}

/** The basis class eᵢ of Count C (index taken mod C). */
export function simplexBasis(count: number, index: number): bigint[] {
  if (count < 1) throw new ObserverDomainError("Count 0 has no simplex");
  const out = new Array<bigint>(count).fill(0n);
  out[((index % count) + count) % count] = 1n;
  return out;
}

/**
 * The simplex product: cyclic convolution of the coefficient arrays, then
 * canonicalization. It is commutative and associative, with identity e₀.
 */
export function simplexProduct(
  a: readonly bigint[],
  b: readonly bigint[],
): bigint[] {
  assertCoefficients(a);
  assertCoefficients(b, a.length);
  const c = a.length;
  const out = new Array<bigint>(c).fill(0n);
  for (let i = 0; i < c; i++) {
    if (a[i] === 0n) continue;
    for (let j = 0; j < c; j++) out[(i + j) % c] += a[i] * b[j];
  }
  return simplexCanonical(out);
}

/**
 * The left action Lₓ(y) = x·y as the C×C circulant matrix on raw coefficient
 * arrays: column j is x·eⱼ. It maps the ideal ⟨u⟩ into itself, so it is a
 * well-defined endomorphism of the quotient.
 */
export function simplexLeftActionRaw(x: readonly bigint[]): bigint[][] {
  assertCoefficients(x);
  const c = x.length;
  const m = Array.from({ length: c }, () => new Array<bigint>(c).fill(0n));
  for (let j = 0; j < c; j++) {
    for (let i = 0; i < c; i++) m[(i + j) % c][j] += x[i];
  }
  return m;
}

/**
 * The left action Lₓ on the quotient in the canonical chart: the
 * (C−1)×(C−1) integer matrix M with column j the first C−1 canonical
 * coordinates of x·eⱼ, acting on the first C−1 canonical coordinates of y.
 * C = 1 answers the empty 0×0 matrix of the zero ring.
 */
export function simplexLeftAction(x: readonly bigint[]): bigint[][] {
  assertCoefficients(x);
  const c = x.length;
  const dim = c - 1;
  const m = Array.from({ length: dim }, () => new Array<bigint>(dim).fill(0n));
  for (let j = 0; j < dim; j++) {
    const column = simplexProduct(x, simplexBasis(c, j));
    for (let i = 0; i < dim; i++) m[i][j] = column[i];
  }
  return m;
}

/** Applies an integer matrix to a vector. */
export function applyMatrix(
  m: readonly (readonly bigint[])[],
  v: readonly bigint[],
): bigint[] {
  return m.map((row) => row.reduce((sum, x, j) => sum + x * v[j], 0n));
}

/**
 * The bilinear simplex metric ⟨a,b⟩ = [C·Σaᵢbᵢ − Σaᵢ·Σbᵢ]/(C−1) as an exact
 * rational; for C = 1 the zero ring has the zero metric.
 */
export function simplexInner(
  a: readonly bigint[],
  b: readonly bigint[],
): Rational {
  assertCoefficients(a);
  assertCoefficients(b, a.length);
  const c = BigInt(a.length);
  if (c === 1n) return rational(0n);
  const dot = a.reduce((s, x, i) => s + x * b[i], 0n);
  const sa = a.reduce((s, x) => s + x, 0n);
  const sb = b.reduce((s, x) => s + x, 0n);
  return rational(c * dot - sa * sb, c - 1n);
}

/**
 * The squared geometric resultant R²_C(a), exact; zero for C = 1. Invariant
 * under adding one constant to every coefficient.
 */
export function simplexResultantSquared(a: readonly bigint[]): Rational {
  return simplexInner(a, a);
}

/**
 * The signed cyclic comparison product of 007.39b in ℝ[t]/(tᶜ+1) (integer
 * coefficients): t^C = −1, so wrap-around terms are subtracted. It does not
 * respect Σvᵢ = 0; it is here only to contrast with the simplex quotient.
 */
export function negacyclicProduct(
  a: readonly bigint[],
  b: readonly bigint[],
): bigint[] {
  assertCoefficients(a);
  assertCoefficients(b, a.length);
  const c = a.length;
  const out = new Array<bigint>(c).fill(0n);
  for (let i = 0; i < c; i++) {
    for (let j = 0; j < c; j++) {
      const k = i + j;
      if (k < c) out[k] += a[i] * b[j];
      else out[k - c] -= a[i] * b[j];
    }
  }
  return out;
}
