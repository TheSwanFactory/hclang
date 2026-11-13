import { expect } from "jsr:@std/expect@^0.219.1";
import {
  cdConjugate as shippedConjugate,
  cdProduct as shippedProduct,
} from "../../lib/frames/cayley-dickson.ts";
import { ObserverDomainError } from "./exact.ts";
import { sampleVectors } from "./sample.ts";
import {
  BigIntRing as R,
  cdAssociator,
  cdBasisInt,
  cdCommutator,
  cdConj,
  cdInner,
  cdIsZero,
  cdLeftAction,
  cdNormSquared,
  cdProduct,
  cdSupported,
  findBasisAssociatorWitness,
  findBasisNoncommutativeWitness,
  findNormCompositionFailure,
  findZeroDivisor,
} from "./cayley-dickson.ts";

const DIMS = [1, 2, 4, 8, 16];
const e = cdBasisInt;
const mul = (x: bigint[], y: bigint[]): bigint[] => cdProduct(R, x, y);
const norm = (x: bigint[]): bigint => cdNormSquared(R, x);
const zeros = (c: number): bigint[] => new Array<bigint>(c).fill(0n);
const scalar = (c: number, v: bigint): bigint[] => {
  const out = zeros(c);
  out[0] = v;
  return out;
};
/** A random-ish pure imaginary vector (real part forced to 0). */
const imaginary = (c: number, n: number, seed: number): bigint[][] =>
  sampleVectors(c, n, seed).map((v) => [0n, ...v.slice(1)]);

Deno.test("supported counts are exactly the powers of two; others are explicit refusals", () => {
  expect(DIMS.every(cdSupported)).toBe(true);
  expect([0, 3, 5, 6, 7, 9, 12].some(cdSupported)).toBe(false);
  for (const c of [3, 5, 7]) {
    expect(() => mul(zeros(c), zeros(c))).toThrow(ObserverDomainError);
    expect(() => cdNormSquared(R, zeros(c))).toThrow(ObserverDomainError);
    expect(() => cdLeftAction(R, 1n, zeros(c))).toThrow(ObserverDomainError);
  }
  expect(() => mul([], [])).toThrow(ObserverDomainError);
  expect(() => mul(zeros(2), zeros(4))).toThrow(RangeError);
});

Deno.test("C = 1 is the real line: product is multiplication, conj is identity", () => {
  expect(mul([6n], [7n])).toEqual([42n]);
  expect(cdConj(R, [5n])).toEqual([5n]);
  expect(norm([-4n])).toEqual(16n);
  expect(cdLeftAction(R, 1n, [3n])).toEqual([[3n]]);
});

Deno.test("C = 2 (complex): i² = −1, associative and commutative", () => {
  expect(mul(e(2, 1), e(2, 1))).toEqual([-1n, 0n]);
  for (const [x, y, z] of [sampleVectors(2, 3, 11)]) {
    expect(mul(x, y)).toEqual(mul(y, x));
    expect(cdAssociator(R, x, y, z)).toEqual([0n, 0n]);
  }
  expect(findBasisAssociatorWitness(2)).toBeUndefined();
  expect(findBasisNoncommutativeWitness(2)).toBeUndefined();
});

Deno.test("C = 4 (quaternions under this convention): i² = j² = k² = ijk = −1, associative, noncommutative", () => {
  for (let i = 1; i < 4; i++) {
    expect(mul(e(4, i), e(4, i))).toEqual(scalar(4, -1n));
  }
  // With this convention e1·e2 = e3 and e2·e1 = −e3.
  expect(mul(e(4, 1), e(4, 2))).toEqual(e(4, 3));
  expect(mul(e(4, 2), e(4, 1))).toEqual([0n, 0n, 0n, -1n]);
  expect(mul(mul(e(4, 1), e(4, 2)), e(4, 3))).toEqual(scalar(4, -1n));
  const [x, y, z] = sampleVectors(4, 3, 12);
  expect(cdAssociator(R, x, y, z)).toEqual(zeros(4));
  expect(findBasisAssociatorWitness(4)).toBeUndefined();
  // Reproducible basis witness: the first noncommuting pair is (1,2).
  const w = findBasisNoncommutativeWitness(4)!;
  expect([w.i, w.j]).toEqual([1, 2]);
  expect(w.commutator).toEqual([0n, 0n, 0n, 2n]);
});

Deno.test("C = 8 (octonions): alternative, norm composing, not associative; reproducible witness", () => {
  for (const [x, y] of [sampleVectors(8, 2, 13), sampleVectors(8, 2, 14)]) {
    // Alternativity: (xx)y = x(xy) and (yx)x = y(xx).
    expect(mul(mul(x, x), y)).toEqual(mul(x, mul(x, y)));
    expect(mul(mul(y, x), x)).toEqual(mul(y, mul(x, x)));
    // Composition holds at 1, 2, 4, 8.
    expect(norm(mul(x, y))).toEqual(norm(x) * norm(y));
  }
  const w = findBasisAssociatorWitness(8)!;
  expect([w.i, w.j, w.k]).toEqual([1, 2, 4]);
  expect(w.associator.some((v) => v !== 0n)).toBe(true);
  // (e1 e2) e4 = −e1 (e2 e4): the associator is twice the product, anti-associative.
  expect(w.associator).toEqual(
    mul(mul(e(8, 1), e(8, 2)), e(8, 4)).map((v) => 2n * v),
  );
  // Imaginary part and scalar part decompose: product of imaginaries keeps a scalar.
  const [x, y] = imaginary(8, 2, 15);
  const p = mul(x, y);
  expect(p[0]).toEqual(-cdInner(R, x, y));
});

Deno.test("C = 16 (sedenion-type): alternativity, composition lost; zero divisors exist", () => {
  const [x, y] = sampleVectors(16, 2, 16);
  // Alternativity fails for generic vectors.
  expect(mul(mul(x, x), y)).not.toEqual(mul(x, mul(x, y)));
  const failure = findNormCompositionFailure(16)!;
  expect(failure).toBeDefined();
  expect(failure.normOfProduct).not.toEqual(failure.productOfNorms);
  // Composition holds on the same sparse families at C ≤ 8.
  for (const c of [1, 2, 4, 8]) {
    expect(findNormCompositionFailure(c), `C=${c}`).toBeUndefined();
  }
  const zd = findZeroDivisor(16);
  expect("x" in zd).toBe(true);
  if ("x" in zd) {
    expect(norm(zd.x) > 0n && norm(zd.y) > 0n).toBe(true);
    expect(cdIsZero(mul(zd.x, zd.y))).toBe(true);
  }
  // No zero divisor in the sparse family below 16 (division algebras).
  for (const c of [2, 4, 8]) {
    expect("x" in findZeroDivisor(c), `C=${c}`).toBe(false);
  }
});

Deno.test("pure imaginary x obeys x² = −N(x)·1 and Re(xy) = −⟨x,y⟩ for every supported C", () => {
  for (const c of DIMS) {
    const vs = imaginary(c, 6, 17);
    for (const x of vs) {
      expect(mul(x, x), `C=${c}`).toEqual(scalar(c, -norm(x)));
    }
    for (let i = 0; i + 1 < vs.length; i += 2) {
      const [x, y] = [vs[i], vs[i + 1]];
      expect(mul(x, y)[0], `C=${c}`).toEqual(-cdInner(R, x, y));
    }
  }
});

Deno.test("the imaginary subspace is not closed: a product of imaginaries has a scalar part", () => {
  for (const c of [2, 4, 8, 16]) {
    const p = mul(e(c, 1), e(c, 1));
    expect(p[0]).toEqual(-1n);
  }
});

Deno.test("left action is the product, linear, and L_conj is the adjoint reading", () => {
  for (const c of DIMS) {
    const [x, y] = sampleVectors(c, 2, 18);
    const m = cdLeftAction(R, 1n, x);
    const applied = m.map((row) => row.reduce((s, v, j) => s + v * y[j], 0n));
    expect(applied, `C=${c}`).toEqual(mul(x, y));
    // Linear in x: L_{x+y} = L_x + L_y.
    const sum = x.map((v, i) => v + y[i]);
    const lsum = cdLeftAction(R, 1n, sum);
    const ly = cdLeftAction(R, 1n, y);
    expect(lsum).toEqual(m.map((row, i) => row.map((v, j) => v + ly[i][j])));
  }
});

Deno.test("conj is an involution, x·conj(x) = N(x), and commutators vanish only up to C = 2", () => {
  for (const c of DIMS) {
    for (const x of sampleVectors(c, 3, 19)) {
      expect(cdConj(R, cdConj(R, x))).toEqual(x);
      expect(mul(x, cdConj(R, x)), `C=${c}`).toEqual(scalar(c, norm(x)));
    }
  }
  const [x, y] = sampleVectors(4, 2, 20);
  expect(cdIsZero(cdCommutator(R, x, y))).toBe(false);
});

Deno.test("the shipped reference product agrees with the experiment's on all samples (007.46)", () => {
  for (const c of [1, 2, 4, 8, 16]) {
    const samples = sampleVectors(c, 6, 4646);
    for (const x of samples) {
      expect(shippedConjugate(x)).toEqual(cdConj(R, x));
      for (const y of samples) {
        expect(shippedProduct(x, y)).toEqual(mul(x, y));
      }
    }
  }
});
