import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FrameInt } from "../frames.ts";
describe("FrameInt", () => {
  // The lexer builds an integer only from digits, so only a host can hand it
  // another spelling (#524).
  it("refuses a source or spelling that is not an integer", () => {
    for (const source of ["1.5", "", "-", "12a", "+-1"]) {
      expect(() => new FrameInt(source)).toThrow(
        `invalid integer source: ${source}`,
      );
    }
    expect(() => new FrameInt(5n, undefined, "five")).toThrow(
      "invalid integer source: five",
    );
  });
  it("refuses a negative range before its size (#524)", () => {
    expect(new FrameInt(-1n).range().toString())
      .toEqual("$!.repetition-count -1");
    expect(new FrameInt(-65_537n).range().toString())
      .toEqual("$!.repetition-count -65537");
    expect(new FrameInt(3n).range()).toEqual([0, 1, 2]);
  });
});
