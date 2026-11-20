/**
 * Denum / Cayley–Dickson Space Elevator feasibility probe.
 *
 * A Denum's nonnegative loads can be observed as signed basis coordinates,
 * but the resulting coordinates do NOT determine a multiplication law.
 * This experiment keeps the law explicit and records that dependency.
 *
 * No runtime observer, grammar, Denum state, or HC operation is changed.
 */
import { BigIntRing, cdProduct } from "./cayley-dickson.ts";

/** The rank-r KDSL coordinate reading of a Denum's stored loads.
 * This mirrors the published virtual-slot alignment and signed pairing;
 * it is intentionally a standalone experiment, not a runtime observer.
 */
export function denumSignedCoordinates(
  rank: number,
  loads: readonly bigint[],
): bigint[] {
  if (!Number.isInteger(rank) || rank < 0 || rank > 15) {
    throw new RangeError("rank must be an integer between 0 and 15");
  }
  if (loads.length === 0 || loads.some((x) => x < 0n)) {
    throw new RangeError("Denum loads must be nonempty nonnegative counts");
  }
  const slots = new Array<bigint>(2 ** rank).fill(0n);
  for (let i = 0; i < loads.length; i++) {
    slots[i % slots.length] += loads[i];
  }
  if (rank === 0) return slots;
  const half = slots.length / 2;
  return slots.slice(0, half).map((x, i) => x - slots[i + half]);
}

/** An explicit candidate law, NOT derivable from Denum coordinates alone. */
export type ProductLaw = (
  x: readonly bigint[],
  y: readonly bigint[],
) => bigint[];

export const cayleyDicksonLaw: ProductLaw = (x, y) =>
  cdProduct(BigIntRing, x, y);

/** A competing law on exactly the same coordinate vectors. */
export const coordinatewiseLaw: ProductLaw = (x, y) => {
  if (x.length !== y.length) throw new RangeError("dimension mismatch");
  return x.map((v, i) => v * y[i]);
};

function difference(a: readonly bigint[], b: readonly bigint[]): bigint[] {
  return a.map((x, i) => x - b[i]);
}

/** A phase-sensitive incidence diagnostic: the commutator [x,y].
 * It is NOT the audited Space Elevator curvature cable of Explore 016.
 */
export function commutatorWitness(
  law: ProductLaw,
  x: readonly bigint[],
  y: readonly bigint[],
): bigint[] {
  if (x.length !== y.length) throw new RangeError("dimension mismatch");
  return difference(law(x, y), law(y, x));
}

/** Returns a sparse signed basis vector, representable by nonnegative
 * Denum loads through opposite-channel subtraction.
 */
export function signedBasis(
  dimension: number,
  index: number,
  sign: 1 | -1 = 1,
): bigint[] {
  if (
    !Number.isInteger(dimension) || dimension < 1 ||
    !Number.isInteger(index) || index < 0 || index >= dimension
  ) {
    throw new RangeError("invalid basis dimension or index");
  }
  const result = new Array<bigint>(dimension).fill(0n);
  result[index] = BigInt(sign);
  return result;
}
