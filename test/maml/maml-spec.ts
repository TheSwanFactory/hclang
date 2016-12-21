import { expect } from "chai";
import { Frame, FrameExpr, FrameString } from "../../src/frames";
import { maml } from "../../src/maml";

describe("maml", () => {
  const body_text = "Hello, MAML!";
  const body = new FrameString(body_text);
  const result = maml.call(body);
  const result_string = result.toString();

  it("is a FrameExpr", () => {
    expect(maml).to.be.instanceOf(FrameExpr);
  });

  it("has a tag property", () => {
    const tag = maml.get("tag");
    expect(tag).to.be.instanceOf(FrameExpr);
  });

  it("wraps everything in an HTML tag", () => {
    expect(result).to.be.instanceOf(FrameString);
    expect(result_string).to.match(/<html>([\s\S]*)<\/html>/);
  });

  it("wraps its argument in a body tag", () => {
    expect(result).to.be.instanceOf(FrameString);
    expect(result_string).to.equal(`“<body>${body_text}<\/body>”`);
  });
});