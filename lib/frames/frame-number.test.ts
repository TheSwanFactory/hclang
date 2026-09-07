import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame, FrameNumber } from "../frames.ts";

describe("FrameNumber", () => {
  it("stores the inexact host value and synthesizes host spelling", () => {
    const value = new FrameNumber("1.2500");

    expect(value).toBeInstanceOf(FrameNumber);
    expect(value.valueOf()).toEqual(1.25);
    expect(value.toString()).toEqual("1.25");
  });

  it("retains host-number arithmetic artifacts honestly", () => {
    expect(
      new FrameNumber(0.1).add(new FrameNumber(0.2)).toString(),
    ).toEqual("0.30000000000000004");
  });

  it("does not expose an inexact value through exactInt", () => {
    const result = new FrameNumber(3).exactInt();

    expect(result).toBeInstanceOf(Frame);
    expect(result.toString()).toEqual("$!.exact-integer-required FrameNumber");
  });

  it("interns by synthesized host spelling", () => {
    expect(FrameNumber.for("1.0")).toBe(FrameNumber.for(1));
  });
});
