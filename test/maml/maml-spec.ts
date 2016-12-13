import { expect } from "chai";
import { Frame, FrameExpr, FrameString } from "../../src/frames";
import { maml } from "../../src/maml";

describe("maml", () => {
  const tag = maml.get("tag");

  it("is a Frame", () => {
    expect(maml).to.be.instanceOf(Frame);
  });

});
