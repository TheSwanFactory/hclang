import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Frame, FrameArray, FrameExpr, FrameSymbol } from "../frames.ts";
describe("FrameList observation", () => {
  // A failed statement is the one list flagged an error. HC answers its
  // failure before anything can observe it, so a host observes it here (#524).
  it("answers a failed statement's own failure for every size operator", () => {
    const statement = new FrameExpr([FrameSymbol.for("nope")]);
    statement.is.statement = true;
    const failed = statement.in([new FrameArray([])]);
    expect(failed).toBeInstanceOf(FrameExpr);
    expect(failed.is.error).toBe(true);
    expect(failed.toString()).toMatch(/^\(\$!\.name-missing “.*\.nope”;\)$/);
    for (const key of Frame.SIZE_OPERATORS) {
      expect(failed.sizeFor(key)).toBe(failed);
    }
    expect(failed.nativeSize(new Set())).toBe(failed);
    expect(failed.sizeFor("x")).toBe(Frame.nil);
  });
});
