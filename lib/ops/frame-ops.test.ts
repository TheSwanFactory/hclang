import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { evaluate } from "../execute/evaluate.ts";
describe("FrameOps", () => {
  it("has no operation for a spelling outside the global table", () => {
    // `++` is not a global operation, so the operator reads the operand's
    // member of that name (015.02), which is missing, and the right operand
    // is never applied.
    expect(evaluate("1 ++ 2").at(0).toString())
      .toMatch(/^\$!\.name-missing “\$:FrameCount\.\d+\.\+\+”;$/);
    expect(evaluate("[1, 2] ++ 3").at(0).toString())
      .toMatch(/^\$!\.name-missing “\$:FrameArray\.\d+\.\+\+”;$/);
    // A defined spelling still finds its operation.
    expect(evaluate("1 + 2").at(0).toString()).toEqual("3");
  });
});
