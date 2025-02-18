import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import {
  Frame,
  FrameArg,
  FrameArray,
  FrameExpr,
  FrameName,
  FrameString,
  FrameSymbol,
} from "../../lib/frames.ts";

describe("FrameExpr", () => {
  const frame = new Frame();
  const js_string = "Hello";
  const frame_string = new FrameString(js_string);
  const context = new FrameString("context", { key: frame_string });

  it("stringifies with parentheses", () => {
    const frame_expr = new FrameExpr([frame, frame_string], { context });
    expect(frame_expr.toString()).to.equal(
      `(() “${js_string}”, .context (“context”, .key “Hello”;);)`,
    );
  });

  it("replaces nil when evaluated", () => {
    const frame_expr = new FrameExpr([frame, frame_string], { context });
    const result = frame_expr.in([frame]);
    expect(result).to.equal(frame_string);
  });

  it("concatenates string expressions when called", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_expr = new FrameExpr([frame_string, frame_string_2]);
    const result = frame_expr.in([frame]);

    expect(result.toString()).to.equal(`“${js_string}${js_string_2}”`);
  });

  it("returns context for FrameArg.here", () => {
    const frame_expr = new FrameExpr([FrameArg.here()]);
    const result = frame_expr.in([context]);

    expect(result).to.equal(context);
  });

  it("applies FrameName to FrameArray to extract elements that index", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_array = new FrameArray([frame_string, frame_string_2]);
    const frame_name = new FrameName("1");
    const frame_expr = new FrameExpr([frame_array, frame_name]);
    const result = frame_expr.in([frame]);

    expect(result).to.equal(frame_string_2);
  });

  it("evaluates in context when called", () => {
    const frame_expr = new FrameExpr([
      FrameArg.here(),
      new FrameName("key"),
    ]);
    const result = frame_expr.call(context);

    expect(result).to.equal(frame_string);
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

      expect(frame_expr.call(Frame.nil).toString()).to.equal("“slow”");
    });

    it("evaluates a sequence of properties", () => {
      const frame_expr = new FrameExpr(expr_array, { speed: slow, gap: space });

      expect(frame_expr.call(turtle).toString()).to.equal("“slow turtle”");
    });

    it("evaluates recursively", () => {
      const sub_expr = new FrameExpr(expr_array);
      const frame_expr = new FrameExpr([sub_expr], { speed: slow, gap: space });

      expect(frame_expr.call(turtle).toString()).to.equal("“slow turtle”");
    });
  });
});
