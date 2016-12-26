import { expect } from "chai";
import { Frame, FrameArg, FrameExpr, FrameName, FrameString, FrameSymbol } from "../../src/frames";

describe("FrameExpr", () => {
  const frame = new Frame();
  const js_string = "Hello";
  const context = new FrameString("context");
  const frame_string = new FrameString(js_string);

  it("stringifies with parentheses", () => {
    const frame_expr = new FrameExpr([frame, frame_string], {context: context});
    expect(frame_expr.toString()).to.equal(`(() “${js_string}”, .context “context”;)`);
  });

  it("replaces nil when evaluated", () => {
    const frame_expr = new FrameExpr([frame, frame_string], {context: context});
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
    const context = new FrameString("context", {key: frame_string});
    const frame_expr = new FrameExpr([FrameArg.here()]);
    const result = frame_expr.in([context]);

    expect(result).to.equal(context);
  });

  it("evaluates in context when called", () => {
    const context = new FrameString("context", {key: frame_string});
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
      const frame_expr = new FrameExpr([s_speed], {speed: slow, gap: space});

      expect(frame_expr.call(Frame.nil).toString()).to.equal(`“slow”`);
    });

    it("evaluates a sequence of properties", () => {
      const frame_expr = new FrameExpr(expr_array, {speed: slow, gap: space});

      expect(frame_expr.call(turtle).toString()).to.equal(`“slow turtle”`);
    });

    it("evaluates recursively", () => {
      const sub_expr = new FrameExpr(expr_array)
      const frame_expr = new FrameExpr([sub_expr], {speed: slow, gap: space});

      expect(frame_expr.call(turtle).toString()).to.equal(`“slow turtle”`);
    });
  });
});
