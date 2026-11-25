import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FrameDecimal } from "../frames.ts";
describe("FrameDecimal", () => {
  // No HC path reads it: a decimal promotes to a rational, never straight to a
  // host number. A host does, through `Number(...)`.
  it("projects to a host number through valueOf", () => {
    expect(Number(new FrameDecimal("-12.50"))).toEqual(-12.5);
  });
});
