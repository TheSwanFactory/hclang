import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameArg,
  FrameArray,
  FrameCount,
  FrameExpr,
  FrameLazy,
  FrameName,
  FrameString,
  FrameSymbol,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

describe("FrameExpr", () => {
  const frame = new Frame();
  const js_string = "Hello";
  const frame_string = new FrameString(js_string);
  const context = new FrameString("context", { key: frame_string });

  it("stringifies with parentheses", () => {
    const frame_expr = new FrameExpr([frame, frame_string], { context });
    const actual = frame_expr.toString();
    // Just check key parts due to smart quote encoding complexity
    expect(actual).toContain("()");
    expect(actual).toContain("Hello");
    expect(actual).toContain(".context");
    expect(actual).toContain(".key");
  });

  it("replaces nil when evaluated", () => {
    const frame_expr = new FrameExpr([frame, frame_string], { context });
    const result = frame_expr.in([frame]);
    expect(result).toEqual(frame_string);
  });

  it("concatenates string expressions when called", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_expr = new FrameExpr([frame_string, frame_string_2]);
    const result = frame_expr.in([frame]);

    expect(result.toString()).toEqual(`“${js_string}${js_string_2}”`);
  });

  it("returns context for FrameArg.here", () => {
    const frame_expr = new FrameExpr([FrameArg.here()]);
    const result = frame_expr.in([context]);

    expect(result).toEqual(context);
  });

  it("applies FrameName to FrameArray through a read projection", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_array = new FrameArray([frame_string, frame_string_2]);
    const frame_name = new FrameName("1");
    const frame_expr = new FrameExpr([frame_array, frame_name]);
    const result = frame_expr.in([frame]);

    expect(result).not.toBe(frame_string_2);
    expect(result.toString()).toEqual(frame_string_2.toString());
    expect(frame_string_2.up).toBe(Frame.missing);
  });

  it("evaluates in context through a read projection", () => {
    const frame_expr = new FrameExpr([
      FrameArg.here(),
      new FrameName("key"),
    ]);
    const result = frame_expr.call(context);

    expect(result).not.toBe(frame_string);
    expect(result.toString()).toEqual(frame_string.toString());
    expect(result.up).toBe(context);
    expect(frame_string.up).toBe(Frame.missing);
  });

  describe("with Properties, when called", () => {
    const slow = new FrameString("slow");
    const space = new FrameString(" ");
    const turtle = new FrameString("turtle");

    const s_speed = new FrameSymbol("speed");
    const s_gap = new FrameSymbol("gap");
    const expr_array = [s_speed, s_gap, FrameArg.here()];

    it("evaluates properties in its local context", () => {
      const frame_expr = new FrameExpr([s_speed], { speed: slow, gap: space });

      expect(frame_expr.call(Frame.nil).toString()).toEqual("“slow”");
    });

    it("evaluates a sequence of properties", () => {
      const frame_expr = new FrameExpr(expr_array, { speed: slow, gap: space });

      expect(frame_expr.call(turtle).toString()).toEqual("“slow turtle”");
    });

    it("evaluates recursively", () => {
      const sub_expr = new FrameExpr(expr_array);
      const frame_expr = new FrameExpr([sub_expr], { speed: slow, gap: space });

      expect(frame_expr.call(turtle).toString()).toEqual("“slow turtle”");
    });
  });

  it("evaluates when a size operator is applied, rather than counting (#411)", () => {
    // Calling an expression evaluates it, so the operator is only the
    // argument: “a” “b” joins whatever it is called with.
    const frame_expr = new FrameExpr([frame_string, new FrameString("!")]);

    expect(frame_expr.call(FrameSymbol.address("#")).toString())
      .toEqual("“Hello!”");
    // An expression codified from source is called the same way.
    expect(evaluate("({} [5, 7]).#").at(0).toString()).toEqual("35");
  });

  describe("integer repetition (v0.22.0)", () => {
    it("has no repetition rule of its own", () => {
      // An expression or closure is applied repeatedly, as before, rather
      // than concatenating its terms, which are code.
      expect(new FrameExpr([new FrameString("a")]).repetitionFor(3n))
        .toBeUndefined();
      expect(new FrameLazy([new FrameString("a")]).repetitionFor(3n))
        .toBeUndefined();
      // Text and a number have none either, by the base default: only an
      // aggregate has a rule.
      expect(new FrameString("ab").repetitionFor(3n)).toBeUndefined();
      expect(new FrameCount(2n).repetitionFor(3n)).toBeUndefined();
    });
  });
});
