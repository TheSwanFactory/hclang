/**
 * The Cayley–Dickson doubling law as an executable oracle (occurrence/figure
 * 007.46): i² = −1, ij = k, ji = −k, octonion nonassociativity, and the norm
 * and conjugation laws that distinguish the product from the KDSL residual.
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

Deno.test("the product is not the KDSL residual or its squared norm", () => {
  // At rank 2 the KDSL residual of [a0, a1, a2, a3] is [a0 − a2, a1 − a3]:
  // two coordinates, where the product of two elements has four.
  const x = [3n, 2n, 1n, 4n];
  const residual = [x[0] - x[2], x[1] - x[3]];
  expect(residual).toEqual([2n, -2n]);
  expect(cdProduct(x, x).length).toEqual(4);
  expect(cdProduct(x, x)).toEqual([-12n, 12n, 6n, 24n]);
  // Equal residual norm does not mean equal product: x and its conjugate.
  expect(norm(x)).toEqual(norm(cdConjugate(x)));
  expect(cdProduct(x, x)).not.toEqual(
    cdProduct(cdConjugate(x), cdConjugate(x)),
  );
});

Deno.test("lengths other than 2^r are refused", () => {
  expect(isCayleyDicksonLength(1)).toBe(true);
  expect(isCayleyDicksonLength(16)).toBe(true);
  expect(isCayleyDicksonLength(0)).toBe(false);
  expect(isCayleyDicksonLength(6)).toBe(false);
  expect(() => cdProduct([1n, 2n, 3n], [1n, 2n, 3n])).toThrow(RangeError);
  expect(() => cdProduct([1n, 2n], [1n, 2n, 3n, 4n])).toThrow(RangeError);
  expect(() => cdConjugate([])).toThrow(RangeError);
  expect(() => cdBasis(4, 4)).toThrow(RangeError);
});
