import { expect } from "chai";
import { Frame, FrameArg, FrameArray, FrameExpr, FrameLazy, FrameName, FrameParam, FrameString } from "../../src/frames";
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
    Frame.globals = Ops;
    const operator = frame.get("&&");
    const result = operator.call(block);

    it("lives in the global namespace", () => {
      expect(operator).to.not.equal(Frame.missing);
    });

    it("is retrieved as an expression", () => {
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

    it("calls block with key as second parameter", () => {
      const expr = new FrameExpr([
        FrameParam.there(),
        new FrameString(": "),
        FrameArg.here(),
      ]);
      const expr_result = operator.call(expr);
      const expr_string = expr_result.toString();
      expect(expr_string).to.include("author: An Author");
      expect(expr_string).to.include("title: A Title");
    });

    it("is curried using a name", () => {
      const curry = new FrameExpr([
        FrameArg.here(),
        new FrameName("&&"),
      ]);
      const curry_result = curry.call(frame);
      const curry_string = curry_result.toString();
      expect(curry_string).to.include("FrameCurry");
      expect(curry_string).to.include(frame.toString());
      expect(curry_string).to.equal(operator.toString());
    });

    it("is called as a name with a lazy block", () => {
      const TestBlock = new FrameLazy([
        new FrameString(" [ key: "),
        FrameParam.there(),
        new FrameString("| value: "),
        FrameArg.here(),
        new FrameString(" ] "),
      ]);
      const expr = new FrameExpr([
        FrameArg.here(),
        new FrameName("&&"),
        TestBlock,
      ]);
      const expr_result = expr.call(frame);
      const expr_string = expr_result.toString();
      expect(expr_string).to.include("[ key: author| value: An Author ]");
    });
  });
});
