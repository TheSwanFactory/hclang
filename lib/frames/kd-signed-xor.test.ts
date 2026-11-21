import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { cdBasis, cdProduct } from "./cayley-dickson.ts";
import {
  kdCdSign,
  kdCompleteLoads,
  kdCoordinates,
  kdEmbedLoads,
  kdMultiplyLoads,
  kdNegateLoads,
} from "./kd-signed-xor.ts";

const basis = (dimensions: number, index: number): bigint[] =>
  Array.from({ length: 2 * dimensions }, (_, i) =>
    i === index ? 1n : 0n
  );

describe("FOIST 19a: raw KD loads and coordinate observation", () => {
  it("preserves the raw two-load value without imaginary-rank promotion", () => {
    const raw = [3n, 1n];
    expect(kdCompleteLoads(raw)).toEqual([3n, 1n]);
    expect(kdCoordinates(raw)).toEqual([2n]);
    expect(kdNegateLoads(raw)).toEqual([1n, 3n]);
    expect(raw).toEqual([3n, 1n]);
  });

  it("completes a partial arity lazily, without mutating its source", () => {
    const raw = [3n, 1n, 5n];
    expect(kdCompleteLoads(raw)).toEqual([3n, 1n, 5n, 0n]);
    expect(kdCoordinates(raw)).toEqual([-2n, 1n]);
    expect(kdNegateLoads(raw)).toEqual([5n, 0n, 3n, 1n]);
    expect(kdNegateLoads(kdNegateLoads(raw))).toEqual([
      3n,
      1n,
      5n,
      0n,
    ]);
    expect(raw).toEqual([3n, 1n, 5n]);
  });

  it("distinguishes one unsigned load from the first signed rank", () => {
    expect(kdCoordinates([3n])).toEqual([3n]);
    expect(kdNegateLoads([3n])).toEqual([0n, 3n]);
    expect(kdCoordinates(kdNegateLoads([3n]))).toEqual([-3n]);
  });

  it("embeds each sign half separately, not by trailing padding", () => {
    expect(kdEmbedLoads([3n, 1n], 4)).toEqual([3n, 0n, 1n, 0n]);
    expect(kdEmbedLoads([3n, 4n, 1n, 2n], 8)).toEqual([
      3n, 4n, 0n, 0n, 1n, 2n, 0n, 0n,
    ]);
    expect(kdCoordinates(kdEmbedLoads([3n, 1n], 4))).toEqual([2n, 0n]);
    expect(kdEmbedLoads(kdNegateLoads([3n, 1n]), 4)).toEqual(
      kdNegateLoads(kdEmbedLoads([3n, 1n], 4)),
    );
  });

  it("rejects empty states and negative or inexact raw magnitudes", () => {
    expect(() => kdCompleteLoads([])).toThrow(RangeError);
    expect(() => kdCompleteLoads([-1n])).toThrow(RangeError);
    expect(() => kdCompleteLoads([1 as unknown as bigint])).toThrow(RangeError);
    expect(() => kdEmbedLoads([1n, 0n], 3)).toThrow(RangeError);
    expect(() => kdCdSign(-1n, 1n)).toThrow(RangeError);
  });
});

describe("FOIST 19a: exact signed-XOR product (pure-load kernel)", () => {
  it("handles (-1)^2 and imaginary i^2 without negative raw loads", () => {
    expect(kdMultiplyLoads([0n, 1n], [0n, 1n])).toEqual([1n, 0n]);
    expect(kdMultiplyLoads([0n, 1n, 0n, 0n], [0n, 1n, 0n, 0n]))
      .toEqual([0n, 0n, 1n, 0n]);
    expect(kdCoordinates(kdMultiplyLoads([0n, 1n, 0n, 0n], [
      0n, 1n, 0n, 0n,
    ]))).toEqual([-1n, 0n]);
  });

  it("respects asymmetric quaternion basis order", () => {
    expect(kdMultiplyLoads(basis(4, 1), basis(4, 2))).toEqual(basis(4, 3));
    expect(kdMultiplyLoads(basis(4, 2), basis(4, 1)))
      .toEqual(basis(4, 7));
  });

  it("has a nonzero octonion associator", () => {
    const a = basis(8, 1);
    const b = basis(8, 2);
    const c = basis(8, 4);
    expect(kdCoordinates(kdMultiplyLoads(kdMultiplyLoads(a, b), c)))
      .toEqual(kdCoordinates(basis(8, 7)));
    expect(kdCoordinates(kdMultiplyLoads(a, kdMultiplyLoads(b, c))))
      .toEqual(kdCoordinates(basis(8, 15)));
  });

  it("matches an independent recursive CD vector oracle on ordered basis pairs", () => {
    // cdProduct uses recursive doubling, not kdCdSign or this convolution.
    for (let rung = 0; rung <= 4; rung++) {
      const d = 2 ** rung;
      for (let u = 0; u < d; u++) {
        for (let v = 0; v < d; v++) {
          const observed = kdCoordinates(
            kdMultiplyLoads(basis(d, u), basis(d, v)),
          );
          expect(observed).toEqual(cdProduct(cdBasis(d, u), cdBasis(d, v)));
        }
      }
    }
  });

  it("matches CD on sparse coefficients without normalizing gauge counts", () => {
    const x = [3n, 4n, 1n, 2n];
    const y = [2n, 0n, 0n, 1n];
    expect(kdCoordinates(kdMultiplyLoads(x, y)))
      .toEqual(cdProduct(kdCoordinates(x), kdCoordinates(y)));

    const gaugeShift = [4n, 5n, 2n, 3n];
    expect(kdCoordinates(gaugeShift)).toEqual(kdCoordinates(x));
    expect(kdCoordinates(kdMultiplyLoads(gaugeShift, y)))
      .toEqual(kdCoordinates(kdMultiplyLoads(x, y)));
    expect(kdMultiplyLoads(gaugeShift, y).every((n) => n >= 0n))
      .toEqual(true);
  });

  it("embeds scalar and complex inputs into a shared rank", () => {
    const integerTwo = [3n, 1n];
    const imaginaryUnit = [0n, 1n, 0n, 0n];
    expect(kdCoordinates(kdMultiplyLoads(integerTwo, imaginaryUnit)))
      .toEqual([0n, 2n]);
  });

  it("preserves the old product under halfwise rank embedding", () => {
    const x = [2n, 0n, 1n, 0n];
    const y = [0n, 3n, 0n, 2n];
    const lower = kdEmbedLoads(kdMultiplyLoads(x, y), 8);
    const higher = kdMultiplyLoads(kdEmbedLoads(x, 8), kdEmbedLoads(y, 8));
    expect(kdCoordinates(lower)).toEqual(kdCoordinates(higher));
  });
});
