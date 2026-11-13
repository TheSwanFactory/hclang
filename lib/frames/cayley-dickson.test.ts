/**
 * The Cayley–Dickson doubling law as an executable oracle (occurrence/figure
 * 007.46): i² = −1, ij = k, ji = −k, octonion nonassociativity, and the norm
 * and conjugation laws, with typed witnesses separating rank-r signature loads
 * (2ʳ nonnegative) from their observed 2^(r−1) signed coefficients.
 */
import { expect } from "jsr:@std/expect@^0.219.1";
import {
  cdBasis,
  cdConjugate,
  cdProduct,
  isCayleyDicksonLength,
} from "./cayley-dickson.ts";

const e = (length: number, index: number): bigint[] => cdBasis(length, index);
const neg = (x: readonly bigint[]): bigint[] => x.map((v) => -v);
const norm = (x: readonly bigint[]): bigint =>
  x.reduce((total, v) => total + v * v, 0n);

Deno.test("complex rung: i² = −1", () => {
  expect(cdProduct(e(2, 1), e(2, 1))).toEqual([-1n, 0n]);
  expect(cdProduct([1n, 2n], [3n, 4n])).toEqual([-5n, 10n]);
  expect(cdProduct(e(2, 1), e(2, 1))).toEqual(neg(e(2, 0)));
});

Deno.test("quaternion rung: i² = j² = k² = −1, ij = k, ji = −k", () => {
  const [i, j, k] = [e(4, 1), e(4, 2), e(4, 3)];
  const minusOne = neg(e(4, 0));
  expect(cdProduct(i, i)).toEqual(minusOne);
  expect(cdProduct(j, j)).toEqual(minusOne);
  expect(cdProduct(k, k)).toEqual(minusOne);
  expect(cdProduct(i, j)).toEqual(k);
  expect(cdProduct(j, i)).toEqual(neg(k));
  expect(cdProduct(j, k)).toEqual(i);
  expect(cdProduct(k, i)).toEqual(j);
  expect(cdProduct(i, cdProduct(j, k))).toEqual(minusOne);
  // ijk = −1 in the associative rung.
  expect(cdProduct(cdProduct(i, j), k)).toEqual(minusOne);
});

Deno.test("the scalar coordinate and sign orientation of a full product", () => {
  // (1 + 2i + 3j + 4k)(5 + 6i + 7j + 8k) in the quaternions.
  expect(cdProduct([1n, 2n, 3n, 4n], [5n, 6n, 7n, 8n]))
    .toEqual([-60n, 12n, 30n, 24n]);
  expect(cdProduct([5n, 6n, 7n, 8n], [1n, 2n, 3n, 4n]))
    .toEqual([-60n, 20n, 14n, 32n]);
});

Deno.test("quaternions are associative; octonions are not", () => {
  const q = [e(4, 1), e(4, 2), e(4, 3), [1n, 2n, 3n, 4n], [-2n, 1n, 0n, 5n]];
  for (const x of q) {
    for (const y of q) {
      for (const z of q) {
        expect(cdProduct(cdProduct(x, y), z)).toEqual(
          cdProduct(x, cdProduct(y, z)),
        );
      }
    }
  }
  // Octonion witness: (e1 e2) e4 = e7 but e1 (e2 e4) = −e7.
  const [a, b, c] = [e(8, 1), e(8, 2), e(8, 4)];
  expect(cdProduct(cdProduct(a, b), c)).toEqual(e(8, 7));
  expect(cdProduct(a, cdProduct(b, c))).toEqual(neg(e(8, 7)));
  // The octonions stay alternative: x(xy) = (xx)y.
  const x = [1n, 2n, 0n, 3n, 0n, -1n, 2n, 1n];
  const y = [0n, 1n, 4n, 0n, 2n, 1n, 0n, -3n];
  expect(cdProduct(x, cdProduct(x, y))).toEqual(
    cdProduct(cdProduct(x, x), y),
  );
});

Deno.test("conjugation reverses products and the norm is multiplicative through the octonions", () => {
  const x4 = [1n, -2n, 3n, 4n];
  const y4 = [5n, 6n, -7n, 8n];
  for (const [x, y] of [[x4, y4], [[3n, 4n], [-1n, 2n]]]) {
    expect(cdConjugate(cdProduct(x, y))).toEqual(
      cdProduct(cdConjugate(y), cdConjugate(x)),
    );
  }
  const x8 = [1n, 2n, 0n, 3n, 0n, -1n, 2n, 1n];
  const y8 = [0n, 1n, 4n, 0n, 2n, 1n, 0n, -3n];
  for (const [x, y] of [[x4, y4], [x8, y8]]) {
    expect(norm(cdProduct(x, y))).toEqual(norm(x) * norm(y));
  }
});

Deno.test("sedenions have zero divisors, so the norm is no longer multiplicative", () => {
  // (e1 + e10)(e4 − e15) = 0 with both factors nonzero.
  const x = e(16, 1).map((v, i) => v + e(16, 10)[i]);
  const y = e(16, 4).map((v, i) => v - e(16, 15)[i]);
  expect(norm(x)).toEqual(2n);
  expect(norm(y)).toEqual(2n);
  expect(cdProduct(x, y).every((v) => v === 0n)).toBe(true);
});

/**
 * The observed signed coefficients of a rank-r KDSL load: 2ʳ nonnegative
 * signature loads B give Φᵣ(B)ᵢ = Bᵢ − B(i+2^(r−1)), 2^(r−1) coefficients.
 */
const phi = (loads: readonly bigint[]): bigint[] => {
  const n = loads.length / 2;
  return loads.slice(0, n).map((load, i) => load - loads[i + n]);
};

Deno.test("a unary residual or norm is not a binary product", () => {
  // Rank 2 loads are four signature slots, not four quaternion coefficients:
  // the observed coefficient array has two entries, and the squared norm is a
  // number. Neither has the shape of a product of two elements.
  const load = [3n, 2n, 1n, 4n];
  const observed = phi(load);
  expect(observed).toEqual([2n, -2n]);
  expect(norm(observed)).toEqual(8n);
  expect(observed.length).toEqual(load.length / 2);
  // Equal observed norm does not mean equal products: x and its conjugate.
  expect(norm(observed)).toEqual(norm(cdConjugate(observed)));
  expect(cdProduct(observed, observed)).not.toEqual(
    cdProduct(cdConjugate(observed), cdConjugate(observed)),
  );
});

Deno.test("typed witnesses: observed rank-r coefficients are the rung r−1 algebra (007.46b)", () => {
  // Rank 1: loads [5, 3] observe the integer [2]; its square is [4].
  expect(phi([5n, 3n])).toEqual([2n]);
  expect(cdProduct([2n], [2n])).toEqual([4n]);
  // Rank 2, Gaussian: loads [3, 2, 1, 4] observe 2 − 2i, and (2 − 2i)² = −8i.
  expect(phi([3n, 2n, 1n, 4n])).toEqual([2n, -2n]);
  expect(cdProduct([2n, -2n], [2n, -2n])).toEqual([0n, -8n]);
  // Rank 3, quaternion: eight loads observe 5 − 4i − 4j − 4k. In an
  // alternative algebra x² = 2x₀x − |x|², with |x|² = 73.
  const q = phi([9n, 1n, 2n, 3n, 4n, 5n, 6n, 7n]);
  expect(q).toEqual([5n, -4n, -4n, -4n]);
  expect(cdProduct(q, q)).toEqual([-23n, -40n, -40n, -40n]);
  // Rank 4, octonion: sixteen loads observe an eight-coefficient x, |x|² = 111
  // and x² = 2x₀x − |x|² = [−93, −12, 24, −30, 0, 24, −30, 24].
  const o = phi([
    ...[3n, 0n, 5n, 1n, 2n, 7n, 0n, 4n],
    ...[0n, 2n, 1n, 6n, 2n, 3n, 5n, 0n],
  ]);
  expect(o).toEqual([3n, -2n, 4n, -5n, 0n, 4n, -5n, 4n]);
  expect(norm(o)).toEqual(111n);
  expect(cdProduct(o, o)).toEqual([-93n, -12n, 24n, -30n, 0n, 24n, -30n, 24n]);
  // The coefficient array is one rung below the loads: raw loads of length 2ʳ
  // are a different, larger algebra element and give a different shape.
  expect(cdProduct(o, o).length).toEqual(8);
  expect(() => cdProduct(o, [1n, 2n, 3n, 4n])).toThrow(RangeError);
});

Deno.test("lengths other than 2^r are refused", () => {
  expect(isCayleyDicksonLength(1)).toBe(true);
  expect(isCayleyDicksonLength(16)).toBe(true);
  expect(isCayleyDicksonLength(0)).toBe(false);
  expect(isCayleyDicksonLength(6)).toBe(false);
  // The predicate is exact beyond 32 bits, where `&` would coerce.
  expect(isCayleyDicksonLength(2 ** 32)).toBe(true);
  expect(isCayleyDicksonLength(2 ** 32 + 1)).toBe(false);
  expect(isCayleyDicksonLength(2 ** 32 - 1)).toBe(false);
  expect(isCayleyDicksonLength(2 ** 31)).toBe(true);
  expect(isCayleyDicksonLength(2 ** 33 + 2 ** 32)).toBe(false);
  expect(isCayleyDicksonLength(2 ** 52)).toBe(true);
  expect(isCayleyDicksonLength(2 ** 53 - 1)).toBe(false);
  expect(isCayleyDicksonLength(-4)).toBe(false);
  expect(isCayleyDicksonLength(2.5)).toBe(false);
  expect(isCayleyDicksonLength(NaN)).toBe(false);
  expect(isCayleyDicksonLength(Infinity)).toBe(false);
  expect(() => cdProduct([1n, 2n, 3n], [1n, 2n, 3n])).toThrow(RangeError);
  expect(() => cdProduct([1n, 2n], [1n, 2n, 3n, 4n])).toThrow(RangeError);
  expect(() => cdConjugate([])).toThrow(RangeError);
  expect(() => cdBasis(4, 4)).toThrow(RangeError);
});
