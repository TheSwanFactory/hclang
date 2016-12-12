import { expect } from "chai";
import { Frame, FrameArray, FrameExpr, FrameName, FrameString, FrameLazy } from "../../src/frames";

describe("FrameLazy", () => {
  const sloth = new FrameString("sloth");
  const in_lazy = new FrameString("in_lazy");
  const lazy = new FrameLazy(sloth, {in_lazy: in_lazy});
  const context = new FrameString("context", {nil: Frame.nil});
  const evaluated = lazy.in(context);

  it("takes a Frame", () => {
    expect(lazy).to.be.instanceof(FrameLazy);
  });

  it("returns that Frame when evaluated", () => {
    expect(evaluated).to.equal(sloth);
  });

  it("places that Frame inside the calling context", () => {
    const value = evaluated.get("nil");
    expect(value).to.equal(Frame.nil);
  });

  it("places that Frame inside this context", () => {
    const value = evaluated.get("in_lazy");
    expect(value).to.equal(in_lazy);
  });

  it("stringifies to { frame }", () => {
    const result = lazy.toString();
    expect(result).to.equal(`{ ${sloth.toString()} }`);
  });

  describe("Codify", () => {
    const codify = new FrameLazy(Frame.nil);

    it("returns itself when Frame is nil", () => {
      expect(codify.in(Frame.nil)).to.equal(codify);
    });

    it("converts Array to Expr when called", () => {
      const array = new FrameArray([context, new FrameName("nil")]);
      const expr = codify.call(array);

      expect(expr).to.be.instanceof(FrameExpr);
      expect(expr.at(0)).to.equal(context);
    });

    it("wraps other Frames in Expr when called", () => {
      const wrap = codify.call(sloth);

      expect(wrap).to.be.instanceof(FrameExpr);
      expect(wrap.at(0)).to.equal(sloth);
    });
  });
});
