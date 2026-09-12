import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { type DimensionalKind, dimensionalResult } from "../frames.ts";

const KINDS: readonly DimensionalKind[] = ["point", "interval", "scalar"];

describe("dimensionalResult", () => {
  it("relates points only by difference", () => {
    expect(dimensionalResult("-", "point", "point")).toEqual("interval");
    expect(dimensionalResult("+", "point", "point")).toBeUndefined();
  });

  it("displaces a point by an interval, from either side of a sum", () => {
    expect(dimensionalResult("+", "point", "interval")).toEqual("point");
    expect(dimensionalResult("+", "interval", "point")).toEqual("point");
    expect(dimensionalResult("-", "point", "interval")).toEqual("point");
  });

  it("refuses an interval minus a point, because subtraction is ordered", () => {
    expect(dimensionalResult("-", "interval", "point")).toBeUndefined();
  });

  it("adds intervals and scales them by a scalar from either side", () => {
    expect(dimensionalResult("+", "interval", "interval")).toEqual("interval");
    expect(dimensionalResult("-", "interval", "interval")).toEqual("interval");
    expect(dimensionalResult("*", "interval", "scalar")).toEqual("interval");
    expect(dimensionalResult("*", "scalar", "interval")).toEqual("interval");
    expect(dimensionalResult("/", "interval", "scalar")).toEqual("interval");
  });

  it("answers a scalar for the ratio of two intervals", () => {
    expect(dimensionalResult("/", "interval", "interval")).toEqual("scalar");
  });

  it("names no result for any product or quotient involving a point", () => {
    for (const kind of KINDS) {
      expect(dimensionalResult("*", "point", kind)).toBeUndefined();
      expect(dimensionalResult("*", kind, "point")).toBeUndefined();
      expect(dimensionalResult("/", "point", kind)).toBeUndefined();
      expect(dimensionalResult("/", kind, "point")).toBeUndefined();
    }
  });

  it("refuses a scalar where a dimensioned operand is required", () => {
    expect(dimensionalResult("+", "interval", "scalar")).toBeUndefined();
    expect(dimensionalResult("+", "scalar", "interval")).toBeUndefined();
    expect(dimensionalResult("-", "point", "scalar")).toBeUndefined();
    expect(dimensionalResult("/", "scalar", "interval")).toBeUndefined();
  });

  it("leaves plain scalar arithmetic to the numeric tower", () => {
    expect(dimensionalResult("+", "scalar", "scalar")).toEqual("scalar");
    expect(dimensionalResult("*", "scalar", "scalar")).toEqual("scalar");
  });
});
