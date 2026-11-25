import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FrameDecimal } from "../frames.ts";
describe("FrameDecimal", () => {
  // No HC path reads it: a decimal promotes to a rational, never straight to a
  // host number. A host does, through `Number(...)`.
  it("projects to a host number through valueOf", () => {
    expect(Number(new FrameDecimal("-12.50"))).toEqual(-12.5);
  });
  // The lexer builds a decimal only from a numeric lookup, so only a host
  // can hand it another spelling (#524).
  it("refuses a source that is not a decimal spelling", () => {
    for (const source of ["1.2.3", "abc", ".5", "1."]) {
      expect(() => new FrameDecimal(source)).toThrow(
        `invalid decimal source: ${source}`,
      );
    }
  });
});
