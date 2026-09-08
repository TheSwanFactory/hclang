import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame, FrameDecimal, FrameInt, FrameTypedNumber } from "../frames.ts";

const typed = (magnitude: string, unit: string): FrameTypedNumber =>
  new FrameTypedNumber(new FrameDecimal(magnitude), unit);

describe("FrameTypedNumber", () => {
  it("rejects a unit segment that is not letters only", () => {
    for (const unit of ["m2", "s-1", "", "m/s", "µ"]) {
      expect(() => typed("9.8", unit)).toThrow(TypeError);
    }
  });

  it("round-trips the written spelling through data and rendering", () => {
    const quantity = typed("9.8", "m");

    expect(quantity.spelling).toEqual("9.8.m");
    expect(quantity.dataString()).toEqual("9.8.m");
    expect(quantity.toString()).toEqual("9.8.m");
    expect(quantity.unit).toEqual("m");
    expect(quantity.magnitude.toString()).toEqual("9.8");
    expect(quantity.rank).toEqual(null);
  });

  it("preserves the magnitude spelling rather than normalizing it", () => {
    expect(typed("9.80", "m").toString()).toEqual("9.80.m");
    expect(typed("0.10", "USD").toString()).toEqual("0.10.USD");
  });

  it("compares structurally on unit and magnitude value", () => {
    const quantity = typed("9.8", "m");

    expect(quantity.equals(typed("9.8", "m"))).toBe(Frame.all);
    expect(quantity.equals(typed("9.80", "m"))).toBe(Frame.all);
    expect(quantity.equals(typed("1.2", "m"))).toBe(Frame.nil);
    expect(quantity.equals(typed("9.8", "kg"))).toBe(Frame.nil);
    expect(quantity.equals(new FrameDecimal("9.8"))).toBe(Frame.nil);
    expect(quantity.equals(new FrameInt(9n))).toBe(Frame.nil);
  });

  it("separates units on the data plane through the spelling alone", () => {
    const quantity = typed("9.8", "m");

    expect(quantity.dataEquals(typed("9.8", "m"))).toBe(Frame.all);
    expect(quantity.dataEquals(typed("9.80", "m"))).toBe(Frame.nil);
    expect(quantity.dataEquals(typed("9.8", "kg"))).toBe(Frame.nil);
  });

  it("returns an error frame from projection instead of throwing", () => {
    const projection = typed("9.8", "m").valueOf();

    expect(projection).toBeInstanceOf(Frame);
    expect(projection.toString())
      .toEqual("$!.numeric-domain projection FrameTypedNumber");
    expect(Number(typed("9.8", "m"))).toBeNaN();
  });

  it("refuses exact integer extraction with a stable error", () => {
    const extracted = typed("9.8", "m").exactInt();

    expect(extracted).toBeInstanceOf(Frame);
    expect((extracted as Frame).toString())
      .toEqual("$!.exact-integer-required FrameTypedNumber");
  });

  it("delegates zero to its magnitude", () => {
    expect(typed("0.0", "m").isZero()).toEqual(true);
    expect(typed("9.8", "m").isZero()).toEqual(false);
  });

  it("refuses every arithmetic operation, including same-unit operands", () => {
    const left = typed("9.8", "m");
    const right = typed("1.2", "m");

    expect(left.add(right).toString())
      .toEqual("$!.numeric-domain + FrameTypedNumber FrameTypedNumber");
    expect(left.subtract(right).toString())
      .toEqual("$!.numeric-domain - FrameTypedNumber FrameTypedNumber");
    expect(left.multiply(right).toString())
      .toEqual("$!.numeric-domain * FrameTypedNumber FrameTypedNumber");
    expect(left.divide(right).toString())
      .toEqual("$!.numeric-domain / FrameTypedNumber FrameTypedNumber");
    expect(left.modulo(right).toString())
      .toEqual("$!.numeric-domain %% FrameTypedNumber FrameTypedNumber");
    expect(left.power(right).toString())
      .toEqual("$!.numeric-domain ** FrameTypedNumber FrameTypedNumber");
    expect(left.lessThan(right).toString())
      .toEqual("$!.numeric-domain < FrameTypedNumber FrameTypedNumber");
    expect(left.greaterThanOrEqual(right).toString())
      .toEqual("$!.numeric-domain >= FrameTypedNumber FrameTypedNumber");
  });

  it("builds a quantity from an alphabetic property on a decimal", () => {
    const quantity = new FrameDecimal("9.8").get("m");

    expect(quantity).toBeInstanceOf(FrameTypedNumber);
    expect(quantity.toString()).toEqual("9.8.m");
  });

  it("leaves a mixed or negated property segment to the missing-name path", () => {
    expect(new FrameDecimal("9.8").get("m2").is.missing).toEqual(true);
    expect(new FrameDecimal("-9.8").get("m").toString())
      .toEqual("$!.numeric-domain property FrameDecimal");
  });

  it("carries a leading plus through into the magnitude spelling", () => {
    const quantity = new FrameDecimal("+9.8").get("m");

    expect(quantity).toBeInstanceOf(FrameTypedNumber);
    expect(quantity.toString()).toEqual("+9.8.m");
    expect(quantity.equals(typed("9.8", "m"))).toBe(Frame.all);
    expect(quantity.dataEquals(typed("9.8", "m"))).toBe(Frame.nil);
  });

  it("takes no further segment, alphabetic or numeric", () => {
    const quantity = typed("9.8", "m");

    expect(quantity.get("s").is.missing).toEqual(true);
    expect(quantity.get("5").is.missing).toEqual(true);
  });
});
