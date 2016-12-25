import { expect } from "chai";
import { Frame, FrameExpr, FrameString } from "../../src/frames";
import { maml } from "../../src/maml";

describe("maml", () => {
  const body_text = "Hello, MAML!";
  const body = new FrameString(body_text, {title: new FrameString("First MAML Document!")});
  const result = maml.call(body);
  const result_string = result.toString();

  it("is a FrameExpr", () => {
    expect(maml).to.be.instanceOf(FrameExpr);
  });

  it("when called, returns a FrameString", () => {
    expect(result).to.be.instanceOf(FrameString);
  });

  it("has a tag property", () => {
    const tag = maml.get("tag");
    expect(tag).to.be.instanceOf(FrameExpr);
  });

  it("wraps everything in an HTML tag", () => {
    expect(result_string).to.match(/<html>([\s\S]*)<\/html>/);
  });

  it("wraps arg contents in a body tag", () => {
    expect(result_string).to.include(`<body>${body_text}<\/body>`);
  });

  it("wraps arg metas in a head tag", () => {
    expect(result_string).to.include(`<head>([\s\S]*)<\/head>`);
  });
});
