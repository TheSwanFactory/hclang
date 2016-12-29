import { expect } from "chai";
import { Frame, FrameArray, FrameExpr, FrameString } from "../../src/frames";
import { Ops } from "../../src/ops";

describe("iterators", () => {
  const frame = new Frame({
    author: new FrameString("An Author"),
    title: new FrameString("A Title"),
  });

  const block = new FrameString("Prefix: ");

  it("treat Frames as iteratee blocks", () => {
    const arg = new FrameString("argument");
    const result = block.call(arg);
    expect(result.toString()).to.equal("“Prefix: argument”");
  });

  describe("&& iterate over metas", () => {
    const operator = frame.get("&&");
    const result = operator.call(block);

    it("live in the global namespace", () => {
      expect(operator).to.not.equal(Frame.missing);
    });

    it("is retrieved as an expression", () => {
      Ops.get("&&", frame);
      expect(operator).to.be.instanceOf(FrameExpr);
    });

    it("returns FrameArray when called", () => {
      expect(result).to.be.instanceOf(FrameArray);
    });

    it("calls block with each element", () => {
      const result_string = result.toString();
      expect(result_string).to.include("Prefix: An Author");
      expect(result_string).to.include("Prefix: A Title");
    });
  });
});
