import { expect } from "chai";
import { FrameExpr, FrameString } from "../../src/frames";
import { maml } from "../../src/maml";

describe("MAML Tag", () => {
  const tag = maml.get("tag");
  const text = "Hello, MAML!";
  const body = new FrameString(text);
  const expr = tag.call(body);

  it("is a FrameExpr", () => {
    expect(tag).to.be.instanceOf(FrameExpr);
  });

  it("converts a string into an expr", () => {
    expect(expr).to.be.instanceOf(FrameExpr);
  });

});
