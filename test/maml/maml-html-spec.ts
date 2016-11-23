
import { Frame } from "../../src/frames/frame";
import { FrameString } from "../../src/frames/frame-string";
import { FrameExpr } from "../../src/frames/frame-expr";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameHTML", () => {
  const frame = new Frame();
  const js_string = "Hello";
  const frame_string = new FrameString(js_string);
  const frame_expr = new FrameExpr([frame, frame_string])

  it("concatenates string expressions when called", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_expr_2 = new FrameExpr([frame_string, frame_string_2]);
    const result = frame_expr_2.call(frame);

    expect(result.toString()).to.equal(`“${js_string}${js_string_2}”`);
  });
});
