import { expect } from "jsr:@std/expect@^0.219.1";
import { ObserverDomainError, ratToString } from "./exact.ts";
import { sampleVectors } from "./sample.ts";
import {
  applyMatrix,
  negacyclicProduct,
  simplexAdd,
  simplexBasis,
  simplexCanonical,
  simplexEqual,
  simplexInner,
  simplexIsZero,
  simplexLeftAction,
  simplexLeftActionRaw,
  simplexProduct,
  simplexResultantSquared,
  simplexSub,
} from "./simplex.ts";

const COUNTS = [2, 3, 4, 5, 8, 12];
const r2 = (a: bigint[]): string => ratToString(simplexResultantSquared(a));

Deno.test("canonical form is (a_i − a_last, …, 0) and shift invariant", () => {
  expect(simplexCanonical([3n, 1n])).toEqual([2n, 0n]);
  expect(simplexCanonical([9n, 9n, 3n])).toEqual([6n, 6n, 0n]);
  for (const c of COUNTS) {
    for (const a of sampleVectors(c, 6, 1)) {
      const shifted = a.map((x) => x + 7n);
      expect(simplexCanonical(shifted)).toEqual(simplexCanonical(a));
      expect(simplexEqual(a, shifted)).toBe(true);
      expect(r2(shifted)).toEqual(r2(a));
    }
  }
});

Deno.test("product is well defined on classes: invariant under input shifts", () => {
  for (const c of COUNTS) {
    const xs = sampleVectors(c, 5, 2);
    const ys = sampleVectors(c, 5, 3);
    xs.forEach((x, i) => {
      const y = ys[i];
      const p = simplexProduct(x, y);
      const q = simplexProduct(x.map((v) => v + 3n), y.map((v) => v - 11n));
      expect(q).toEqual(p);
    });
  }
});

Deno.test("commutative, associative, distributive, with identity e0 (C = 2,3,4,5,8,12)", () => {
  for (const c of COUNTS) {
    const v = sampleVectors(c, 9, 4);
    const one = simplexBasis(c, 0);
    for (let i = 0; i < 9; i += 3) {
      const [x, y, z] = [v[i], v[i + 1], v[i + 2]];
      expect(simplexProduct(x, y), `C=${c}`).toEqual(simplexProduct(y, x));
      expect(simplexProduct(simplexProduct(x, y), z), `C=${c}`).toEqual(
        simplexProduct(x, simplexProduct(y, z)),
      );
      expect(simplexProduct(x, simplexAdd(y, z)), `C=${c}`).toEqual(
        simplexAdd(simplexProduct(x, y), simplexProduct(x, z)),
      );
      expect(simplexProduct(one, x)).toEqual(simplexCanonical(x));
    }
  }
});

Deno.test("the all-ones direction u generates an ideal: u·e_j is zero for every basis element", () => {
  for (const c of [1, 2, 3, 4, 5, 8, 16]) {
    const u = new Array<bigint>(c).fill(1n);
    expect(simplexIsZero(u)).toBe(true);
    for (let j = 0; j < c; j++) {
      expect(simplexIsZero(simplexProduct(u, simplexBasis(c, j)))).toBe(true);
    }
    for (const x of sampleVectors(c, 3, 5)) {
      expect(simplexIsZero(simplexProduct(u, x))).toBe(true);
    }
  }
});

Deno.test("left action: raw circulant and canonical chart agree with the product", () => {
  for (const c of COUNTS) {
    const xs = sampleVectors(c, 4, 6);
    const ys = sampleVectors(c, 4, 7);
    xs.forEach((x, i) => {
      const y = ys[i];
      const product = simplexProduct(x, y);
      // Raw: L_x y, then canonicalize, is the product.
      expect(simplexCanonical(applyMatrix(simplexLeftActionRaw(x), y)))
        .toEqual(product);
      // Chart: first C−1 canonical coordinates of y map to those of x·y.
      const chart = simplexLeftAction(x);
      const coords = simplexCanonical(y).slice(0, c - 1);
      expect(applyMatrix(chart, coords)).toEqual(product.slice(0, c - 1));
      // Linear and compatible with the product: L_x L_y = L_(x·y).
      const lxly = simplexLeftAction(x).map((row) =>
        simplexLeftAction(y)[0].map((_, j) =>
          row.reduce((s, v, k) => s + v * simplexLeftAction(y)[k][j], 0n)
        )
      );
      expect(lxly).toEqual(simplexLeftAction(product));
    });
  }
});

Deno.test("C = 3 probes: v1v2 = v0, v1² = v2, and v0+v1+v2 is a valid zero", () => {
  const v = (i: number): bigint[] => simplexBasis(3, i);
  expect(simplexEqual(simplexProduct(v(1), v(2)), v(0))).toBe(true);
  expect(simplexEqual(simplexProduct(v(1), v(1)), v(2))).toBe(true);
  const zero = simplexAdd(simplexAdd(v(0), v(1)), v(2));
  expect(simplexIsZero(zero)).toBe(true);
  for (let i = 0; i < 3; i++) {
    expect(simplexIsZero(simplexProduct(v(i), [1n, 1n, 1n]))).toBe(true);
  }
  // Two different representatives of one class are the same element.
  expect(simplexEqual([2n, 5n, 3n], [9n, 12n, 10n])).toBe(true);
  expect(simplexSub([2n, 5n, 3n], [2n, 5n, 3n])).toEqual([0n, 0n, 0n]);
});

Deno.test("resultant: exact rationals, R²(9,9,3) = 36, uniform loads are zero, never truncated", () => {
  expect(r2([9n, 9n, 3n])).toEqual("36");
  expect(r2([3n, 1n])).toEqual("4");
  // A single vertex is a unit vector: (C·1 − 1)/(C−1) = 1.
  expect(r2([1n, 0n, 0n, 0n])).toEqual("1");
  // Two adjacent vertices: (4·2 − 4)/3 = 4/3 and (5·2 − 4)/4 = 3/2, not integers.
  expect(r2([1n, 1n, 0n, 0n])).toEqual("4/3");
  expect(r2([1n, 1n, 0n, 0n, 0n])).toEqual("3/2");
  for (const c of [2, 3, 4, 8, 16]) {
    expect(r2(new Array<bigint>(c).fill(4n)), `C=${c}`).toEqual("0");
  }
  // Distinct vertices: ⟨vᵢ,vᵢ⟩ = 1 and ⟨vᵢ,vⱼ⟩ = −1/(C−1).
  for (const c of [3, 4, 8]) {
    expect(ratToString(simplexInner(simplexBasis(c, 0), simplexBasis(c, 0))))
      .toEqual("1");
    expect(ratToString(simplexInner(simplexBasis(c, 0), simplexBasis(c, 1))))
      .toEqual(`-1/${c - 1}`);
  }
});

Deno.test("boundary: C = 1 is the zero ring with R² = 0; C = 0 is refused", () => {
  expect(simplexCanonical([7n])).toEqual([0n]);
  expect(simplexProduct([7n], [5n])).toEqual([0n]);
  expect(simplexIsZero([7n])).toBe(true);
  expect(r2([9n])).toEqual("0");
  expect(simplexLeftAction([9n])).toEqual([]);
  expect(() => simplexCanonical([])).toThrow(ObserverDomainError);
  expect(() => simplexProduct([], [])).toThrow(ObserverDomainError);
  expect(() => simplexBasis(0, 0)).toThrow(ObserverDomainError);
});

Deno.test("contrast: the signed cyclic ring R[t]/(t^C+1) does not make all-ones a zero class", () => {
  for (const c of [2, 3, 4, 8]) {
    const ones = new Array<bigint>(c).fill(1n);
    const oneMinusT = new Array<bigint>(c).fill(0n);
    oneMinusT[0] = 1n;
    oneMinusT[1] = -1n;
    // (Σ tⁱ)(1 − t) = 1 − t^C = 2 in R[t]/(t^C+1): all-ones is not zero there…
    expect(negacyclicProduct(ones, oneMinusT)).toEqual([
      2n,
      ...new Array<bigint>(c - 1).fill(0n),
    ]);
    // …and all-ones is not annihilated: it is a nonzero coefficient vector.
    expect(negacyclicProduct(ones, ones).every((x) => x === 0n)).toBe(false);
    // In the simplex quotient the same inputs give zero.
    expect(simplexIsZero(simplexProduct(ones, oneMinusT))).toBe(true);
  }
});
