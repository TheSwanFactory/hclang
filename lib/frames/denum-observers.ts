/**
 * Geometric observers of a Count-bound Denum (occurrence/figure 007.41b,
 * 007.41c). They read a Denum and answer numbers and lists, and change nothing
 * native.
 *
 * Each observer first applies the real Count binding `.#%` to its receiver,
 * so every one of them reads the same bound loads `B = (C; [b0, …, b(C−1)])`,
 * and every failure of `.#%` (a receiver that is not a Denum, Count zero, a
 * Count past the binding capacity) is answered as it is. The six spellings
 * pair a Size-like squared magnitude (`##…`) with a Residual-like list of
 * signed coordinates (`###…`) for three geometries:
 *
 * | Geometry | Size-like | Residual-like | Count domain |
 * | --- | --- | --- | --- |
 * | centered simplex `%` | `.##%` | `.###%` | C ≥ 1 (C = 1 is zero) |
 * | Cayley–Dickson imaginaries `%%` | `.##%%` | `.###%%` | C = 2ⁿ |
 * | cross-polytope `%%%` | `.##%%%` | `.###%%%` | C = 2n, one load per vertex |
 *
 * Return types (007.41b §2): a squared magnitude is exact and nonnegative, a
 * FrameCount when whole and a FrameRational otherwise. Coordinates are a fresh
 * array of signed numbers, never a Denum: a FrameInt or FrameRational when the
 * coordinate is rational, and an IEEE double (FrameNumber) only where it is
 * irrational, which happens only for Cayley–Dickson coordinates. No native
 * observer, operator or Denum load changes, and no algebra product is
 * installed.
 *
 * @module
 */
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";
import { FrameNumber } from "./frame-number.ts";
import { FrameRational } from "./frame-rational.ts";
import { boundLoads } from "./fourth-hash.ts";

/** An exact nonnegative magnitude: a Count when whole, a rational otherwise. */
function magnitude(num: bigint, den: bigint): Frame {
  const value = FrameRational.create(num, den);
  return value instanceof FrameInt ? new FrameCount(value.data) : value;
}

/** The exact square root of a nonnegative bigint, or undefined. */
function exactRoot(value: bigint): bigint | undefined {
  if (value < 2n) return value;
  let root = value;
  let next = (root + 1n) / 2n;
  while (next < root) {
    root = next;
    next = (root + value / root) / 2n;
  }
  return root * root === value ? root : undefined;
}

const sum = (values: readonly bigint[]): bigint =>
  values.reduce((total, value) => total + value, 0n);

/**
 * Centered simplex, `.##%`: `Q_S = (C·Σbᵢ² − S²)/(C−1)` with `S = Σbᵢ`, the
 * squared length of `Σbᵢvᵢ` over the C unit vertices of a centered regular
 * simplex. Count 1 is degenerate and answers 0.
 *
 * It is also the Cayley–Dickson norm `.##%%`: the Helmert map φ_C is an
 * isometry, so `N(φ_C(B)) = Σxₖ²` equals this form exactly. The identity is
 * checked by test rather than computed twice.
 */
function simplexSize(loads: readonly bigint[]): Frame {
  const c = BigInt(loads.length);
  if (c === 1n) return new FrameCount(0n);
  const total = sum(loads);
  const squares = sum(loads.map((load) => load * load));
  return magnitude(c * squares - total * total, c - 1n);
}

/**
 * Centered simplex, `.###%`: the centered coefficients `bᵢ − S/C`, whose
 * numerators over C are `C·bᵢ − S` (007.41b §3). They sum to zero.
 */
function simplexResidual(loads: readonly bigint[]): Frame {
  const c = BigInt(loads.length);
  const total = sum(loads);
  return new FrameArray(
    loads.map((load) => FrameRational.create(c * load - total, c)),
  );
}

/**
 * The Helmert numerators `sₖ = b₀ + … + b(k−1) − k·bₖ`, k = 1 … C−1, of the
 * fixed-sign Helmert basis the 007.41 experiment's φ_C uses.
 */
function helmertNumerators(loads: readonly bigint[]): bigint[] {
  const numerators: bigint[] = [];
  let prefix = 0n;
  for (let k = 1; k < loads.length; k++) {
    prefix += loads[k - 1];
    numerators.push(prefix - BigInt(k) * loads[k]);
  }
  return numerators;
}

/**
 * Cayley–Dickson, `.###%%`: the coefficients `[0, x₁, …, x(C−1)]` of
 * `x = φ_C(B)` on the basis `e₀ = 1, e₁, …`, with
 * `xₖ = sₖ·√(C/((C−1)k(k+1)))`. Writing `d = (C−1)k(k+1)`, that is
 * `sₖ·√(C·d)/d`, so a coordinate is the exact rational `sₖ·√m/d` when
 * `m = C·d` is a perfect square, and a double otherwise, computed as the
 * 007.41 experiment computes it. The real part is the exact 0.
 */
function cdResidual(loads: readonly bigint[]): Frame {
  const c = loads.length;
  const coordinates: Frame[] = [new FrameInt(0n)];
  const scale = c > 1 ? Math.sqrt(c / (c - 1)) : 0;
  for (const [index, s] of helmertNumerators(loads).entries()) {
    const k = BigInt(index + 1);
    const d = BigInt(c - 1) * k * (k + 1n);
    const root = s === 0n ? 0n : exactRoot(BigInt(c) * d);
    if (root !== undefined) {
      coordinates.push(FrameRational.create(s * root, d));
      continue;
    }
    const kk = index + 1;
    const value = (scale * Number(s)) / Math.sqrt(kk * (kk + 1));
    if (!Number.isFinite(value)) {
      return Frame.error("$!.numeric-range .###%%");
    }
    coordinates.push(new FrameNumber(value));
  }
  return new FrameArray(coordinates);
}

/**
 * Cross-polytope, one load per vertex (007.41b §5.A): C = 2n loads sit on the
 * vertices `+e₀ … +e(n−1), −e₀ … −e(n−1)`, so `bᵢ` and `b(i+n)` are opposite,
 * and the antipodal residual is `rᵢ = bᵢ − b(i+n)`, i = 0 … n−1.
 */
function antipodalResidual(loads: readonly bigint[]): bigint[] {
  const n = loads.length / 2;
  return loads.slice(0, n).map((load, i) => load - loads[i + n]);
}

/** One geometry: the Counts it is defined for, and its two observers. */
interface Geometry {
  /** An error when the bound Count is outside the geometry, else undefined. */
  readonly domain: (count: number) => Frame | undefined;
  /** The Size-like squared magnitude, `.##` + suffix. */
  readonly size: (loads: readonly bigint[]) => Frame;
  /** The Residual-like coordinates, `.###` + suffix. */
  readonly residual: (loads: readonly bigint[]) => Frame;
}

/** Whether C is a power of two, the Cayley–Dickson dimensions. */
const isPowerOfTwo = (c: number): boolean => c > 0 && (c & (c - 1)) === 0;

/**
 * The geometries by the `%` suffix that follows `##` or `###`. Their keys are
 * `Frame.GEOMETRY_SUFFIXES`, from which `Frame.GEOMETRIC_OBSERVERS` is spelled.
 * Odd C has no antipodal pairing, so `$!.denum-cross-count` refuses only this
 * binding, not odd-dimensional cross-polytopes.
 */
export const GEOMETRIES: Readonly<Record<string, Geometry>> = {
  "%": {
    domain: () => undefined,
    size: simplexSize,
    residual: simplexResidual,
  },
  "%%": {
    domain: (c) =>
      isPowerOfTwo(c) ? undefined : Frame.error("$!.denum-cd-count"),
    size: simplexSize,
    residual: cdResidual,
  },
  "%%%": {
    domain: (c) =>
      c % 2 === 0 ? undefined : Frame.error("$!.denum-cross-count"),
    size: (loads) =>
      new FrameCount(sum(antipodalResidual(loads).map((r) => r * r))),
    residual: (loads) =>
      new FrameArray(antipodalResidual(loads).map((r) => new FrameInt(r))),
  },
};

/**
 * Answers one geometric observer of a source: binds it with `.#%`, answering
 * that binding's failure as it is, checks the geometry's Count domain once,
 * then reads the bound loads.
 *
 * @param source The observed Frame.
 * @param key One of `Frame.GEOMETRIC_OBSERVERS`.
 * @returns The observation, or an error.
 */
function observeGeometry(source: Frame, key: string): Frame {
  const residual = key.startsWith("###");
  const geometry = GEOMETRIES[key.slice(residual ? 3 : 2)];
  const loads = boundLoads(source);
  if (loads instanceof Frame) return loads;
  const refusal = geometry.domain(loads.length);
  if (refusal) return refusal;
  return residual ? geometry.residual(loads) : geometry.size(loads);
}

Frame.observeGeometry = observeGeometry;
