import { expect } from "chai";
import { FrameExpr, FrameString } from "../../src/frames";
import { tag_lazy } from "../../src/maml";

describe("MAML Tag", () => {
  const text = "Hello, MAML!";
  const body = new FrameString(text);
  const expr = new FrameExpr([tag_lazy("a"), body]);
  const result = expr.in();
  const js_result = result.toString();

  it("returns a FrameExpr", () => {
    expect(expr).to.be.instanceOf(FrameExpr);
  });

  it("evaluates to a FrameString", () => {
    expect(result).to.be.instanceOf(FrameString);
  });

  it("creates a tag", () => {
    expect(js_result).to.include(`<a>`);
    expect(js_result).to.include(`</a>`);
  });

  it("includes a body literal", () => {
    expect(js_result).to.include(text);
  });
});
