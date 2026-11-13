/**
 * The Cayley–Dickson multiplication law that the KDSL observer family
 * (`.##%%%`, `.###%%%`) is named for (occurrence/figure 007.46, 007.31,
 * 007.32d). It is a reference algebra on exact integer coordinate arrays of
 * length 2ʳ. It is not a Frame, installs no operator or observer, and native
 * Figure `*` does not call it.
 *
 * The law is the recursive doubling, with the first half of an array the "a"
 * part and index 0 the real unit:
 *
 *     real base:  a·b = ab,            conj(a) = a
 *     doubling:   (a,b)·(c,d) = (ac − conj(d)·b,  d·a + b·conj(c))
 *     conjugate:  conj(a,b) = (conj(a), −b)
 *
 * Rung 1 (length 2, complex): i = (0,1), and (a,b)(c,d) = (ac − bd, da + bc).
 * Rung 2 (length 4, quaternion): i = e1, j = e2, k = e3 = i·j. Rung 3 (length
 * 8, octonion) is nonassociative, rung 4 (sedenion) has zero divisors.
 *
 * The KDSL observers answer the signed-basis residual `vᵢ − v(i+n)` and its
 * squared norm. Those are readings of coordinates, not this product: the
 * product of two elements is a third element, and a squared norm of the
 * residual is a number.
 *
 * @module
 */

/** True when `length` is 2ʳ for some r ≥ 0. */
export function isCayleyDicksonLength(length: number): boolean {
  return Number.isInteger(length) && length >= 1 &&
    (length & (length - 1)) === 0;
}

function assertLength(length: number): void {
  if (!isCayleyDicksonLength(length)) {
    throw new RangeError(
      `Cayley–Dickson arrays have length 2^r, not ${length}`,
    );
  }
}

/** Conjugate: the real coordinate kept, every other coordinate negated. */
export function cdConjugate(x: readonly bigint[]): bigint[] {
  assertLength(x.length);
  if (x.length === 1) return [x[0]];
  const h = x.length / 2;
  return [...cdConjugate(x.slice(0, h)), ...x.slice(h).map((v) => -v)];
}

/**
 * The product x·y of two arrays of the same length 2ʳ, by the doubling
 * recurrence above. Operand order matters from rung 2, and association from
 * rung 3.
 */
export function cdProduct(
  x: readonly bigint[],
  y: readonly bigint[],
): bigint[] {
  assertLength(x.length);
  if (y.length !== x.length) {
    throw new RangeError(`length mismatch: ${x.length} vs ${y.length}`);
  }
  if (x.length === 1) return [x[0] * y[0]];
  const h = x.length / 2;
  const [a, b, c, d] = [x.slice(0, h), x.slice(h), y.slice(0, h), y.slice(h)];
  const ac = cdProduct(a, c);
  const dbar_b = cdProduct(cdConjugate(d), b);
  const da = cdProduct(d, a);
  const bcbar = cdProduct(b, cdConjugate(c));
  return [
    ...ac.map((v, i) => v - dbar_b[i]),
    ...da.map((v, i) => v + bcbar[i]),
  ];
}

/** The basis element eᵢ of length 2ʳ: 1 at index i, 0 elsewhere. */
export function cdBasis(length: number, index: number): bigint[] {
  assertLength(length);
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new RangeError(`basis index ${index} outside 0..${length - 1}`);
  }
  return Array.from({ length }, (_, i) => (i === index ? 1n : 0n));
}
