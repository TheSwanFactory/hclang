import { expect } from "chai";
import { Frame, FrameExpr, FrameString } from "../../src/frames";
import { maml } from "../../src/maml";

describe("maml", () => {
  it("is a FrameExpr", () => {
    expect(maml).to.be.instanceOf(FrameExpr);
  });

  it("has a tag property", () => {
    const tag = maml.get("tag");
    expect(tag).to.be.instanceOf(FrameExpr);
  });
});
