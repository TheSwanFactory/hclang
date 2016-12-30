import { expect } from "chai";
import { Frame, FrameArg, FrameArray, FrameExpr, FrameParam, FrameString } from "../../src/frames";
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
      const foo = () => {Ops.get_here("&&", frame)};
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
  });
});
