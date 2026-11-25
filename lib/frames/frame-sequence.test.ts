import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FrameSequence } from "../frames.ts";
describe("FrameSequence", () => {
  // The lexer builds a sequence only from two or more numeric lookups, so
  // only a host can hand it another spelling (#524).
  it("refuses a source with fewer than three dotted segments", () => {
    for (const source of ["1", "1.2", "1..2.3", "a.b.c", "-1.2.3"]) {
      expect(() => new FrameSequence(source)).toThrow(
        `invalid numeric sequence source: ${source}`,
      );
    }
    expect(new FrameSequence("1.2.3").segments).toEqual(["1", "2", "3"]);
  });
});
