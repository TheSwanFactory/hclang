/**
 * Geometric observers of a Count-bound Denum (occurrence/figure 007.41b,
 * 007.41c). Experimental: they read a Denum and answer numbers and lists, and
 * change nothing native.
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

/** A reduced nonnegative fraction. */
interface Fraction {
  readonly num: bigint;
  readonly den: bigint;
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function fraction(num: bigint, den: bigint): Fraction {
  const divisor = gcd(num, den) || 1n;
  return { num: num / divisor, den: den / divisor };
}

function add(left: Fraction, right: Fraction): Fraction {
  return fraction(
    left.num * right.den + right.num * left.den,
    left.den * right.den,
  );
}

/** An exact nonnegative magnitude: a Count when whole, a rational otherwise. */
function magnitude(value: Fraction): Frame {
  return value.den === 1n
    ? new FrameCount(value.num)
    : new FrameRational(value.num, value.den);
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
 */
function simplexSize(loads: readonly bigint[]): Frame {
  const c = BigInt(loads.length);
  if (c === 1n) return new FrameCount(0n);
  const total = sum(loads);
  const squares = sum(loads.map((load) => load * load));
  return magnitude(fraction(c * squares - total * total, c - 1n));
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

/** Whether C is a power of two, the Cayley–Dickson dimensions. */
const isPowerOfTwo = (c: number): boolean => c > 0 && (c & (c - 1)) === 0;

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

/** `C/((C−1)·k·(k+1))`, the squared scale of imaginary coordinate k. */
function helmertScale(c: number, k: number): Fraction {
  const kk = BigInt(k);
  return fraction(BigInt(c), BigInt(c - 1) * kk * (kk + 1n));
}

/**
 * Cayley–Dickson, `.##%%`: `N(x) = Σ xₖ²` for the pure imaginary
 * `x = φ_C(B)`. Each `xₖ²` is the exact rational `C·sₖ²/((C−1)k(k+1))`, so
 * the norm is exact although x itself has radicals; it equals `.##%`.
 */
function cdSize(loads: readonly bigint[]): Frame {
  if (!isPowerOfTwo(loads.length)) return Frame.error("$!.denum-cd-count");
  let total: Fraction = { num: 0n, den: 1n };
  helmertNumerators(loads).forEach((s, index) => {
    const scale = helmertScale(loads.length, index + 1);
    total = add(total, fraction(scale.num * s * s, scale.den));
  });
  return magnitude(total);
}

/**
 * Cayley–Dickson, `.###%%`: the coefficients `[0, x₁, …, x(C−1)]` of
 * `x = φ_C(B)` on the basis `e₀ = 1, e₁, …`, with
 * `xₖ = √(C/(C−1))·sₖ/√(k(k+1))`. The real part is the exact 0; a coordinate is
 * exact when its scale is a rational square, and a double otherwise, computed
 * as the 007.41 experiment computes it.
 */
function cdResidual(loads: readonly bigint[]): Frame {
  const c = loads.length;
  if (!isPowerOfTwo(c)) return Frame.error("$!.denum-cd-count");
  const coordinates: Frame[] = [new FrameInt(0n)];
  const scale = c > 1 ? Math.sqrt(c / (c - 1)) : 0;
  for (const [index, s] of helmertNumerators(loads).entries()) {
    const k = index + 1;
    const square = helmertScale(c, k);
    const num = exactRoot(square.num);
    const den = exactRoot(square.den);
    if (s === 0n || (num !== undefined && den !== undefined)) {
      coordinates.push(FrameRational.create(s * (num ?? 0n), den ?? 1n));
      continue;
    }
    const value = (scale * Number(s)) / Math.sqrt(k * (k + 1));
    if (!Number.isFinite(value)) {
      return Frame.error("$!.numeric-range .###%%");
    }
    coordinates.push(new FrameNumber(value));
  }
  return new FrameArray(coordinates);
}

/**
 * Cross-polytope, one load per vertex (007.41b §5.A): C = 2n loads sit on the
 * vertices `+e₀ … +e(n−1), −e₀ … −e(n−1)`, so `bᵢ` and `b(i+n)` are opposite.
 * Odd C has no such pairing and is `$!.denum-cross-count`; that refuses only
 * this binding, not odd-dimensional cross-polytopes.
 */
function crossResidualValues(loads: readonly bigint[]): bigint[] | Frame {
  if (loads.length % 2 !== 0) return Frame.error("$!.denum-cross-count");
  const n = loads.length / 2;
  return loads.slice(0, n).map((load, i) => load - loads[i + n]);
}

/** `.##%%%`: `Q_X = Σ rᵢ²`, zero exactly when every opposite pair matches. */
function crossSize(loads: readonly bigint[]): Frame {
  const r = crossResidualValues(loads);
  if (r instanceof Frame) return r;
  return new FrameCount(sum(r.map((value) => value * value)));
}

/** `.###%%%`: the antipodal residual `rᵢ = bᵢ − b(i+n)`, i = 0 … n−1. */
function crossResidual(loads: readonly bigint[]): Frame {
  const r = crossResidualValues(loads);
  if (r instanceof Frame) return r;
  return new FrameArray(r.map((value) => new FrameInt(value)));
}

const OBSERVERS: Record<string, (loads: readonly bigint[]) => Frame> = {
  "##%": simplexSize,
  "###%": simplexResidual,
  "##%%": cdSize,
  "###%%": cdResidual,
  "##%%%": crossSize,
  "###%%%": crossResidual,
};

/**
 * Answers one geometric observer of a source: binds it with `.#%`, answering
 * that binding's failure as it is, then reads the bound loads.
 *
 * @param source The observed Frame.
 * @param key One of `Frame.GEOMETRIC_OBSERVERS`.
 * @returns The observation, or an error.
 */
export function observeGeometry(source: Frame, key: string): Frame {
  const observer = OBSERVERS[key];
  if (!observer) return Frame.nil;
  const loads = boundLoads(source);
  return loads instanceof Frame ? loads : observer(loads);
}

Frame.observeGeometry = observeGeometry;
