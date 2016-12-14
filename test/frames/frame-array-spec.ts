import { expect } from "chai";
import { Frame, FrameArray, FrameExpr, FrameString} from "../../src/frames";

describe("FrameArray", () => {
  const a_frame = new FrameString("a");
  const b_frame = new FrameString("b");
  const frame_array = new FrameArray([a_frame, b_frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_array).to.be.instanceOf(FrameArray);
  });

  it("stringifies with brackets", () => {
    expect(frame_array.toString()).to.equal("[“a”, “b”]")
  });

  it("uses 'at' to access elements by index", () => {
    const first_element = frame_array.at(0);
    expect(first_element).to.be.ok;
    expect(first_element).to.equal(a_frame);
  });

  it("evaluates its components into an array", () => {
    const string = new FrameString("string");
    const array_of_expr = new FrameArray([
      Frame.nil,
      string,
      new FrameExpr([
        new FrameString("prefix-"),
        new FrameString("-suffix")
      ])
    ]);
    const result = array_of_expr.in();
    const expr_result = result.at(2);

    expect(result).to.be.instanceOf(FrameArray);
    expect(result.at(0)).to.equal(Frame.nil);
    expect(result.at(1)).to.equal(string);
    expect(expr_result.toString()).to.include("prefix--suffix");
  });
});
