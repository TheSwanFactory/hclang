import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import * as frame from "../frames.ts";
import type { ReceiverState } from "../frames/bound-method.ts";
import { MapEnumerable, MapProperties, ReduceEnumerable } from "./iterators.ts";

describe("iterators", () => {
  const base = new frame.Frame({
    author: new frame.FrameString("An Author"),
    title: new frame.FrameString("A Title"),
  });

  const block = new frame.FrameString("Prefix: ");

  it("maps enumerable data with |", () => {
    const result = frame.FrameNumber.for("1").get("|").call(block);
    expect(result.toString()).toEqual("[“Prefix: 1”]");
  });

  it("reduces enumerable data with & using . as the accumulator", () => {
    const source = new frame.FrameArray([
      frame.FrameNumber.for("1"),
      frame.FrameNumber.for("2"),
      frame.FrameNumber.for("3"),
    ]);
    const reducer = new frame.FrameLazy([
      new frame.FrameName(""),
      new frame.FrameOperator("+"),
      frame.FrameArg.here(),
    ]);

    expect(source.get("&").call(reducer).toString()).toEqual("6");
  });

  it("treat frame.Frames as iteratee blocks", () => {
    const arg = new frame.FrameString("argument");
    const result = block.call(arg);
    expect(result.toString()).toEqual("“Prefix: argument”");
  });

  it("forwards receiver state through every iterator callback", () => {
    class CapturingBlock extends frame.Frame {
      public readonly seen: Array<ReceiverState | undefined> = [];

      public override call(
        argument: frame.Frame,
        _parameter = frame.Frame.nil,
        receiverState?: ReceiverState,
      ): frame.Frame {
        this.seen.push(receiverState);
        return argument;
      }
    }

    const receiverState: ReceiverState = {
      receiver: new frame.Frame(),
      mutable: false,
    };
    const enumerable = new frame.FrameArray([
      frame.FrameNumber.for("1"),
      frame.FrameNumber.for("2"),
    ]);
    const enumerableBlock = new CapturingBlock();
    const propertyBlock = new CapturingBlock();
    const reduceBlock = new CapturingBlock();

    MapEnumerable(enumerable, enumerableBlock, receiverState);
    MapProperties(base, propertyBlock, receiverState);
    ReduceEnumerable(enumerable, reduceBlock, receiverState);

    expect(enumerableBlock.seen).toEqual([receiverState, receiverState]);
    expect(propertyBlock.seen).toEqual([receiverState, receiverState]);
    expect(reduceBlock.seen).toEqual([receiverState]);
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

    it("calls block with key readable through the bare name `.`", () => {
      const expr = new frame.FrameExpr([
        new frame.FrameName(""),
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
        new frame.FrameName(""),
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
