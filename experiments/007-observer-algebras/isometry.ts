/**
 * The observer coordinate choice φ_C (occurrence/figure 007.41).
 *
 * At C = 2ⁿ the simplex quotient S_C ⊗ ℝ has dimension C−1, the dimension of
 * the Cayley–Dickson imaginary space. φ_C is a deterministic linear isometry
 *
 *     φ_C : (S_C ⊗ ℝ, simplex metric) → (Im CD_C, Euclidean Σxᵢ²)
 *
 * built from the fixed-sign Helmert basis. For k = 1…C−1 the Helmert row is
 *
 *     hₖ = (1, …, 1 [k times], −k, 0, …, 0) / √(k(k+1)),
 *
 * which is orthonormal and orthogonal to the all-ones vector, so it is
 * constant on classes modulo uniform shifts. Since the simplex length of
 * Σaᵢvᵢ is √(C/(C−1)) times the Euclidean length of a with its mean removed,
 *
 *     φ_C(a) = (0, √(C/(C−1))·h₁·a, …, √(C/(C−1))·h₍C−1₎·a)
 *
 * satisfies N(φ_C(a)) = R²_C(a). The real part is 0 and the imaginary index k
 * carries Helmert row k.
 *
 * This is an observer coordinate choice. It is determined by the Count and the
 * stated vertex ordering and sign convention only; it is not a canonical or
 * physical Fano orientation, and it is not assumed to preserve multiplication.
 *
 * Floating point: Helmert rows contain square roots, so φ_C returns IEEE
 * doubles. Inputs must be safe integers (|aᵢ| ≤ 2⁵³−1). Tests compare with the
 * explicit tolerances below; `phiNormSquaredExact` gives the same norm exactly.
 *
 * @module
 */
import { cdAssertCount, cdProduct, NumberRing } from "./cayley-dickson.ts";
import {
  ObserverDomainError,
  ratAdd,
  type Rational,
  rational,
} from "./exact.ts";
import { simplexProduct, simplexResultantSquared } from "./simplex.ts";

/** Relative tolerance for comparing doubles, scaled by magnitude (≈ 2⁻⁴³). */
export const RELATIVE_TOLERANCE = 1e-12;

/** The floating comparison: |a−b| ≤ tol·max(1,|a|,|b|). */
export function nearlyEqual(
  a: number,
  b: number,
  tol: number = RELATIVE_TOLERANCE,
): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Largest absolute componentwise difference of two vectors. */
export function maxDifference(
  a: readonly number[],
  b: readonly number[],
): number {
  return a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i])), 0);
}

function safeNumber(x: bigint): number {
  if (
    x > BigInt(Number.MAX_SAFE_INTEGER) || x < -BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError(`coefficient ${x} is not a safe integer`);
  }
  return Number(x);
}

/** Helmert numerator s_k = a₀+…+a₍k−1₎ − k·aₖ (integer, exact). */
function helmertNumerator(a: readonly bigint[], k: number): bigint {
  let s = 0n;
  for (let i = 0; i < k; i++) s += a[i];
  return s - BigInt(k) * a[k];
}

/**
 * φ_C of a simplex class given by any representative a of length C = 2ⁿ ≥ 2.
 * Answers a length-C Cayley–Dickson vector with real part 0. C = 1 answers
 * `[0]` (the imaginary space is zero-dimensional); other Counts are refused.
 */
export function phi(a: readonly bigint[]): number[] {
  const c = a.length;
  cdAssertCount(c);
  const out = new Array<number>(c).fill(0);
  if (c === 1) return out;
  const scale = Math.sqrt(c / (c - 1));
  for (let k = 1; k < c; k++) {
    const s = safeNumber(helmertNumerator(a, k));
    out[k] = (scale * s) / Math.sqrt(k * (k + 1));
  }
  return out;
}

/**
 * The exact squared Euclidean length of φ_C(a),
 * Σₖ (C/(C−1))·sₖ²/(k(k+1)). It equals R²_C(a) exactly, by arithmetic and not
 * by construction of the decomposition; tests compare the two.
 */
export function phiNormSquaredExact(a: readonly bigint[]): Rational {
  const c = a.length;
  cdAssertCount(c);
  let total = rational(0n);
  if (c === 1) return total;
  for (let k = 1; k < c; k++) {
    const s = helmertNumerator(a, k);
    total = ratAdd(
      total,
      rational(BigInt(c) * s * s, BigInt(c - 1) * BigInt(k * (k + 1))),
    );
  }
  return total;
}

/** Euclidean N(x) = Σxᵢ² in doubles. */
export function normSquared(x: readonly number[]): number {
  return x.reduce((s, v) => s + v * v, 0);
}

/** Result of comparing φ(x·_S y) with φ(x)·_CD φ(y). */
export interface ProductComparison {
  readonly count: number;
  /** x·y in the simplex quotient (canonical representative). */
  readonly simplexProduct: bigint[];
  /** φ(x·_S y); its real part is 0. */
  readonly phiOfSimplexProduct: number[];
  /** φ(x)·_CD φ(y), including the scalar component at index 0. */
  readonly cdProductOfPhi: number[];
  /** Largest componentwise gap, scalar component included. */
  readonly maxGap: number;
  /** Real part of φ(x)·φ(y); equals −⟨φx,φy⟩ for the imaginary φ images. */
  readonly cdScalarPart: number;
  /** True when the gap is within `RELATIVE_TOLERANCE` scaled by magnitude. */
  readonly homomorphic: boolean;
}

/**
 * Compares the images of the simplex product and the CD product of images.
 * No homomorphism is demanded: the result reports the measured gap.
 */
export function compareProducts(
  x: readonly bigint[],
  y: readonly bigint[],
): ProductComparison {
  if (x.length === 0) {
    throw new ObserverDomainError("Count 0 has no observer algebra");
  }
  const sp = simplexProduct(x, y);
  const left = phi(sp);
  const right = cdProduct(NumberRing, phi(x), phi(y));
  const maxGap = maxDifference(left, right);
  const scale = Math.max(1, ...left.map(Math.abs), ...right.map(Math.abs));
  return {
    count: x.length,
    simplexProduct: sp,
    phiOfSimplexProduct: left,
    cdProductOfPhi: right,
    maxGap,
    cdScalarPart: right[0],
    homomorphic: maxGap <= RELATIVE_TOLERANCE * scale,
  };
}

/**
 * R² as a double, from the exact rational, for tolerance comparison with
 * N(φ(a)).
 */
export function resultantAsNumber(a: readonly bigint[]): number {
  const r = simplexResultantSquared(a);
  return Number(r.num) / Number(r.den);
}
