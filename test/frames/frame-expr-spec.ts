import { expect } from "chai";
import { Frame, FrameArg, FrameExpr, FrameString } from "../../src/frames";

describe("FrameExpr", () => {
  const frame = new Frame();
  const js_string = "Hello";
  const context = new FrameString("context");
  const frame_string = new FrameString(js_string);
  const frame_expr = new FrameExpr([frame, frame_string], {context: context});

  it("stringifies with parentheses", () => {
    expect(frame_expr.toString()).to.equal(`(() “${js_string}”, .context “context”;)`);
  });

  it("replaces nil when evaluated", () => {
    const result = frame_expr.in(frame);
    expect(result).to.equal(frame_string);
  });

  it("concatenates string expressions when called", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_expr_2 = new FrameExpr([frame_string, frame_string_2]);
    const result = frame_expr_2.in(frame);

    expect(result.toString()).to.equal(`“${js_string}${js_string_2}”`);
  });

  it("returns context for FrameArg.here", () => {
    const context = new FrameString("context", {key: frame_string});
    const frame_expr = new FrameExpr([FrameArg.here()]);
    const result = frame_expr.in(context);

    expect(result).to.equal(context);
  });

  it("extracts properties from the context", () => {
    const context = new FrameString("context", {key: frame_string});
    const frame_expr = FrameExpr.extract("key");
    const result = frame_expr.in(context);

    expect(result).to.equal(frame_string);
  });

  it("evaluates in context when called", () => {
    const context = new FrameString("context", {key: frame_string});
    const frame_expr = FrameExpr.extract("key");
    const result = frame_expr.call(context);

    expect(result).to.equal(frame_string);
  });

});
