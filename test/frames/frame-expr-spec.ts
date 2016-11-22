
import { Frame } from "../../src/frames/frame";
import { FrameString } from "../../src/frames/frame-string";
import { FrameExpr } from "../../src/frames/frame-expr";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameExpr", () => {
  const frame = new Frame();
  const js_string = "Hello";
  const frame_string = new FrameString(js_string);
  const frame_expr = new FrameExpr([frame, frame_string])

  it("stringifies with parentheses", () => {
    expect(frame_expr.toString()).to.equal(`(() “${js_string}”)`);
  });

  it("replaces nil when called", () => {
    const result = frame_expr.call(frame);
    expect(result).to.equal(frame_string);
  });

});
