/**
 * Exact arithmetic helpers shared by the 007.41 observer algebras.
 *
 * Everything here is experimental observer code (occurrence/figure 007.41). It
 * is not part of the shipped runtime and installs no HC operator.
 *
 * @module
 */

/**
 * Raised when a Count lies outside an observer algebra's domain, for example
 * Count 0 for either algebra or Count 3 for Cayley–Dickson. It is an explicit
 * refusal: nothing is rounded, padded or reinterpreted.
 */
export class ObserverDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObserverDomainError";
  }
}

/** An exact rational, always in lowest terms with a positive denominator. */
export interface Rational {
  readonly num: bigint;
  readonly den: bigint;
}

/** Greatest common divisor of two bigints, nonnegative. */
export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/**
 * Builds a normalized rational.
 *
 * @param num The numerator.
 * @param den The denominator, nonzero.
 * @returns The rational in lowest terms with a positive denominator.
 */
export function rational(num: bigint, den: bigint = 1n): Rational {
  if (den === 0n) throw new RangeError("rational: zero denominator");
  if (den < 0n) [num, den] = [-num, -den];
  const g = gcd(num, den) || 1n;
  return { num: num / g, den: den / g };
}

/** Sum of two rationals. */
export function ratAdd(a: Rational, b: Rational): Rational {
  return rational(a.num * b.den + b.num * a.den, a.den * b.den);
}

/** Product of two rationals. */
export function ratMul(a: Rational, b: Rational): Rational {
  return rational(a.num * b.num, a.den * b.den);
}

/** True when two rationals are the same number. */
export function ratEqual(a: Rational, b: Rational): boolean {
  return a.num === b.num && a.den === b.den;
}

/** `num/den`, or just `num` when the denominator is 1. */
export function ratToString(r: Rational): string {
  return r.den === 1n ? `${r.num}` : `${r.num}/${r.den}`;
}

/**
 * Rejects coefficient arrays that are empty or hold non-integers.
 *
 * @param count The expected Count, or undefined to accept any positive length.
 */
export function assertCoefficients(
  a: readonly bigint[],
  count?: number,
): void {
  if (a.length === 0) {
    throw new ObserverDomainError("Count 0 has no observer algebra");
  }
  if (count !== undefined && a.length !== count) {
    throw new RangeError(`expected ${count} coefficients, got ${a.length}`);
  }
}
