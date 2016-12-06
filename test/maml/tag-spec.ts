import { expect } from "chai";
import { FrameExpr } from "../../src/frames";
import { tag } from "../../src/maml";

describe("MAML Tag", () => {
  const result = tag("a");

  it("returns a FrameExpr", () => {
    expect(result).to.be.instanceOf(FrameExpr);
  });
});
