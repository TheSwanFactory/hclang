import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FrameRational } from "../frames.ts";
describe("FrameRational", () => {
  // `FrameRational.create` answers a zero denominator as division by zero
  // before it constructs one, so only a host reaches this (#524).
  it("refuses to construct a ratio with a zero denominator", () => {
    expect(() => new FrameRational(1n, 0n)).toThrow(
      "rational denominator must not be zero",
    );
  });
});
