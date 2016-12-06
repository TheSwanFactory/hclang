import { expect } from "chai";
import { FrameExpr, FrameString } from "../../src/frames";
import { tag } from "../../src/maml";

describe("MAML Tag", () => {
  const expr = tag("a");
  const result = expr.in();

  it("returns a FrameExpr", () => {
    expect(expr).to.be.instanceOf(FrameExpr);
  });

  it("evaluates to a FrameString", () => {
    expect(result).to.be.instanceOf(FrameString);
  });
});
