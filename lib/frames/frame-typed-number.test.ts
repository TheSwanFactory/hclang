import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame, FrameDecimal, FrameInt, FrameTypedNumber } from "../frames.ts";

const typed = (magnitude: string, unit: string): FrameTypedNumber =>
  new FrameTypedNumber(new FrameDecimal(magnitude), unit);

describe("FrameTypedNumber", () => {
  it("accepts letters with an optional signed integer exponent", () => {
    for (const unit of ["m", "USD", "m2", "s-1", "m.s-1", "kg.m.s-2"]) {
      expect(typed("9.8", unit).unit).toEqual(unit);
    }
  });

  it("rejects a segment that is not letters plus an integer exponent", () => {
    for (const unit of ["", "2s", "s_1", "m/s", "µ", "m-", "m.", "m..s"]) {
      expect(() => typed("9.8", unit)).toThrow(TypeError);
    }
  });

  it("exposes composite units as frozen segments", () => {
    const quantity = typed("9.8", "kg.m.s-2");

    expect(quantity.segments).toEqual(["kg", "m", "s-2"]);
    expect(Object.isFrozen(quantity.segments)).toEqual(true);
    expect(quantity.spelling).toEqual("9.8.kg.m.s-2");
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

  it("leaves a malformed or negated property segment to its own path", () => {
    expect(new FrameDecimal("9.8").get("2s").is.missing).toEqual(true);
    expect(new FrameDecimal("9.8").get("s_1").is.missing).toEqual(true);
    expect(new FrameDecimal("-9.8").get("m2").toString())
      .toEqual("$!.numeric-domain property FrameDecimal");
  });

  it("carries a leading plus through into the magnitude spelling", () => {
    const quantity = new FrameDecimal("+9.8").get("m");

    expect(quantity).toBeInstanceOf(FrameTypedNumber);
    expect(quantity.toString()).toEqual("+9.8.m");
    expect(quantity.equals(typed("9.8", "m"))).toBe(Frame.all);
    expect(quantity.dataEquals(typed("9.8", "m"))).toBe(Frame.nil);
  });

  it("absorbs a further unit segment and refuses anything else", () => {
    const quantity = typed("9.8", "m");
    const composite = quantity.get("s-1");

    expect(composite).toBeInstanceOf(FrameTypedNumber);
    expect(composite.toString()).toEqual("9.8.m.s-1");
    expect(composite.get("kg").toString()).toEqual("9.8.m.s-1.kg");
    expect(quantity.get("5").is.missing).toEqual(true);
    expect(quantity.get("2s").is.missing).toEqual(true);
  });

  it("compares composite units by spelling rather than by dimension", () => {
    expect(typed("9.8", "m.s-1").equals(typed("9.8", "m.s-1")))
      .toBe(Frame.all);
    expect(typed("9.8", "m.s-1").equals(typed("9.8", "s-1.m")))
      .toBe(Frame.nil);
    expect(typed("9.8", "m2").equals(typed("9.8", "m.m"))).toBe(Frame.nil);
  });
});
