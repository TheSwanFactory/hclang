/**
 * Geometric observers of a Denum, read by rank (occurrence/figure 007.41b,
 * 007.41c, 007.43h, 007.43i, 007.44). They read a Denum and answer numbers and
 * lists, and change nothing native.
 *
 * The Count of the Denum is the rank `r`. Each geometry wants a definite
 * number of slots for that rank, and the Denum's stored loads are aligned to
 * it into a virtual array: missing slots are 0, and excess slots wrap by index
 * modulo the wanted length, their loads adding into the slot they wrap to, as
 * `.#%` folds. The residual is then the geometry's ordinary formula on that
 * virtual array, so every Count has a defined reading under every observer.
 * The Count binding `.#%` itself is unchanged and is not applied here.
 *
 * | Geometry | Size-like | Residual-like | Wanted slots |
 * | --- | --- | --- | --- |
 * | centered simplex (SSL) `%` | `.##%` | `.###%` | r + 1 |
 * | cross-polytope (KPSL) `%%%` | `.##%%%` | `.###%%%` | 2r |
 * | Cayley–Dickson signed basis (KDSL) `%%` | `.##%%` | `.###%%` | 2ʳ |
 *
 * KDSL (007.43h) reads signed basis pairs: at rank 0 the single value, at rank
 * r ≥ 1 the 2^(r−1) differences `vᵢ − v(i+2^(r−1))`. Its Size-like is the sum
 * of their squares. A wanted length past `DENUM_BINDING_CAPACITY` is refused as
 * `$!.denum-binding-capacity`.
 *
 * Return types: a squared magnitude is exact and nonnegative, a FrameCount
 * when whole and a FrameRational otherwise. Coordinates are a fresh array of
 * signed exact numbers, never a Denum. No native observer, operator or Denum
 * load changes, and no algebra product is installed.
 *
 * @module
 */
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";
import { FrameRational } from "./frame-rational.ts";
import { DENUM_BINDING_CAPACITY, denumState } from "./fourth-hash.ts";

/** An exact nonnegative magnitude: a Count when whole, a rational otherwise. */
function magnitude(num: bigint, den: bigint): Frame {
  const value = FrameRational.create(num, den);
  return value instanceof FrameInt ? new FrameCount(value.data) : value;
}

const sum = (values: readonly bigint[]): bigint =>
  values.reduce((total, value) => total + value, 0n);

/**
 * Centered simplex (SSL), `.##%`: `Q_S = (C·Σbᵢ² − S²)/(C−1)` with `S = Σbᵢ`, the
 * squared length of `Σbᵢvᵢ` over the C unit vertices of a centered regular
 * simplex. Count 1 is degenerate and answers 0.
 */
function simplexSize(loads: readonly bigint[]): Frame {
  const c = BigInt(loads.length);
  if (c === 1n) return new FrameCount(0n);
  const total = sum(loads);
  const squares = sum(loads.map((load) => load * load));
  return magnitude(c * squares - total * total, c - 1n);
}

/**
 * Centered simplex, `.###%`: the centered coefficients `zᵢ = bᵢ − S/C`, whose
 * numerators over C are `C·bᵢ − S` (007.41b §3). They sum to zero. They are
 * coefficients on the C unit vertices, not orthonormal coordinates, so `.##%`
 * is their norm in the simplex Gram metric, `C/(C−1)·Σzᵢ²` (007.41e).
 */
function simplexResidual(loads: readonly bigint[]): Frame {
  const c = BigInt(loads.length);
  const total = sum(loads);
  return new FrameArray(
    loads.map((load) => FrameRational.create(c * load - total, c)),
  );
}

/**
 * Cross-polytope (KPSL), 2n slots (007.41b §5.A): the slots sit on the
 * vertices `+e₀ … +e(n−1), −e₀ … −e(n−1)`, so `bᵢ` and `b(i+n)` are opposite,
 * and the antipodal residual is `rᵢ = bᵢ − b(i+n)`, i = 0 … n−1.
 */
function antipodalResidual(slots: readonly bigint[]): bigint[] {
  const n = slots.length / 2;
  return slots.slice(0, n).map((slot, i) => slot - slots[i + n]);
}

/**
 * Cayley–Dickson signed basis (KDSL, 007.43h), 2ʳ slots in the reference order
 * `+e₀ … +e(n−1), −e₀ … −e(n−1)`: rank 0 is the single value, and rank r ≥ 1
 * is `Rᵢ = vᵢ − v(i+n)` with n = 2^(r−1). The real coordinate is included.
 */
function signedBasisResidual(slots: readonly bigint[]): bigint[] {
  return slots.length === 1 ? [slots[0]] : antipodalResidual(slots);
}

const sumSquares = (values: readonly bigint[]): Frame =>
  new FrameCount(sum(values.map((value) => value * value)));
const integers = (values: readonly bigint[]): Frame =>
  new FrameArray(values.map((value) => new FrameInt(value)));

/** One geometry: its wanted slot count by rank, and its two observers. */
interface Geometry {
  /** The slots rank r wants, a value past the binding capacity is refused. */
  readonly wanted: (rank: bigint) => bigint;
  /** The Size-like squared magnitude, `.##` + suffix, of the virtual array. */
  readonly size: (slots: readonly bigint[]) => Frame;
  /** The Residual-like coordinates, `.###` + suffix, of the virtual array. */
  readonly residual: (slots: readonly bigint[]) => Frame;
}

/**
 * The geometries by the `%` suffix that follows `##` or `###`. Their keys are
 * `Frame.GEOMETRY_SUFFIXES`, from which `Frame.GEOMETRIC_OBSERVERS` is spelled.
 */
export const GEOMETRIES: Readonly<Record<string, Geometry>> = {
  "%": {
    wanted: (r) => r + 1n,
    size: simplexSize,
    residual: simplexResidual,
  },
  "%%": {
    // 2ʳ, saturated so a huge rank is refused rather than computed.
    wanted: (r) => r > 64n ? DENUM_BINDING_CAPACITY + 1n : 1n << r,
    size: (slots) => sumSquares(signedBasisResidual(slots)),
    residual: (slots) => integers(signedBasisResidual(slots)),
  },
  "%%%": {
    wanted: (r) => 2n * r,
    size: (slots) => sumSquares(antipodalResidual(slots)),
    residual: (slots) => integers(antipodalResidual(slots)),
  },
};

/**
 * Aligns stored loads to a wanted length: shorter is zero-filled, longer wraps
 * by index modulo the wanted length, adding into the slot it wraps to.
 */
function align(loads: readonly bigint[], wanted: number): bigint[] {
  const slots = new Array<bigint>(wanted).fill(0n);
  if (wanted === 0) return slots;
  loads.forEach((load, index) => {
    slots[index % wanted] += load;
  });
  return slots;
}

/**
 * Answers one geometric observer of a source: recognizes the Denum, takes its
 * Count as the rank, aligns its stored loads to the rank's wanted slots, and
 * reads the virtual array.
 *
 * @param source The observed Frame.
 * @param key One of `Frame.GEOMETRIC_OBSERVERS`.
 * @returns The observation, or an error.
 */
function observeGeometry(source: Frame, key: string): Frame {
  const residual = key.startsWith("###");
  const geometry = GEOMETRIES[key.slice(residual ? 3 : 2)];
  const state = denumState(source);
  if (state instanceof Frame) return state;
  const wanted = geometry.wanted(state.count);
  if (wanted > DENUM_BINDING_CAPACITY) {
    return Frame.error("$!.denum-binding-capacity");
  }
  const slots = align(state.loads, Number(wanted));
  return residual ? geometry.residual(slots) : geometry.size(slots);
}

Frame.observeGeometry = observeGeometry;
