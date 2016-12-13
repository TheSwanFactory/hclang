import { expect } from "chai";
import { Frame, FrameExpr, FrameString } from "../../src/frames";
import { maml } from "../../src/maml";

describe("maml", () => {
  const text = "Hello, MAML!";
  const body = new FrameString(text);
  const result = maml.call(body);
  const result_string = result.toString();

  it("is a FrameExpr", () => {
    expect(maml).to.be.instanceOf(FrameExpr);
  });

  it("has a tag property", () => {
    const tag = maml.get("tag");
    expect(tag).to.be.instanceOf(FrameExpr);
  });

  it("wraps its argument in a body tag", () => {
    expect(result).to.be.instanceOf(FrameString);
    expect(result_string).to.match(/<body>([\s\S]*)<\/body>/);
  });
});
