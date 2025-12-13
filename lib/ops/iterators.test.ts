import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import * as frame from "../frames.ts";

describe("iterators", () => {
  const base = new frame.Frame({
    author: new frame.FrameString("An Author"),
    title: new frame.FrameString("A Title"),
  });

  const block = new frame.FrameString("Prefix: ");

  it("treat frame.Frames as iteratee blocks", () => {
    const arg = new frame.FrameString("argument");
    const result = block.call(arg);
    expect(result.toString()).toEqual("“Prefix: argument”");
  });

  describe("&& iterate over metas", () => {
    const operator = base.get("&&");
    const result = operator.call(block);

    it("lives in the global namespace", () => {
      expect(operator).toBeTruthy();
      expect(operator).not.toEqual(frame.Frame.missing);
      expect(operator.is.missing).not.toEqual(true);
    });

    it("returns frame.FrameArray when called", () => {
      expect(result).toBeInstanceOf(frame.FrameArray);
    });

    it("calls block with each element", () => {
      const result_string = result.toString();
      expect(result_string).toContain("Prefix: An Author");
      expect(result_string).toContain("Prefix: A Title");
    });

    it("calls block with key as second parameter", () => {
      const expr = new frame.FrameExpr([
        frame.FrameParam.there(),
        new frame.FrameString(": "),
        frame.FrameArg.here(),
      ]);
      const expr_result = operator.call(expr);
      const expr_string = expr_result.toString();
      expect(expr_string).toContain("author: An Author");
      expect(expr_string).toContain("title: A Title");
    });

    it("is curried using a name", () => {
      const curry = new frame.FrameExpr([
        frame.FrameArg.here(),
        new frame.FrameName("&&"),
      ]);
      const curry_result = curry.call(base);
      const curry_string = curry_result.toString();
      expect(curry_string).toContain("FrameCurry");
    });

    it("is called as a name with a lazy block", () => {
      const TestBlock = new frame.FrameLazy([
        new frame.FrameString(" [ key: "),
        frame.FrameParam.there(),
        new frame.FrameString("| value: "),
        frame.FrameArg.here(),
        new frame.FrameString(" ] "),
      ]);
      const expr = new frame.FrameExpr([
        frame.FrameArg.here(),
        new frame.FrameName("&&"),
        TestBlock,
      ]);
      const expr_result = expr.call(base);
      const expr_string = expr_result.toString();
      expect(expr_string).toContain("[ key: author| value: An Author ]");
    });
  });
});
