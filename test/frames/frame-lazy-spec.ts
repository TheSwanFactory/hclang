import { expect } from "chai";
import { Frame, FrameArg, FrameArray, FrameExpr, FrameName, FrameString, FrameLazy } from "../../src/frames";

describe("FrameLazy", () => {
  const sloth = new FrameString("sloth");
  const turtle = new FrameString("turtle");
  const in_lazy = new FrameString("in_lazy");
  const lazy = new FrameLazy([sloth, FrameArg.here()], {in_lazy: in_lazy});
  const context = new FrameString("context", {nil: Frame.nil});
  const expr = lazy.in(context);

  it("takes an Array<Frame>", () => {
    expect(lazy).to.be.instanceof(FrameLazy);
  });

  it("stringifies to { expr, meta }", () => {
    const result = lazy.toString();
    expect(result).to.include(`{ ${sloth.toString()} _, `);
  });

  it("evalutes to an Expr", () => {
    const result = expr.toString();
    expect(expr).to.be.instanceof(FrameExpr);
    expect(result).to.equal(`(${sloth.toString()} _, `);
  });

  it("evalutes to an Expr", () => {
    expect(expr).to.be.instanceof(FrameExpr);
  });

  it("evaluates expr to inside self and context", () => {
    const evaluated = expr.call(turtle);
    expect(evaluated.get("in_lazy")).to.equal(in_lazy);
    expect(evaluated.get("nil")).to.equal(Frame.nil);
  });


  describe("Codify", () => {
    const codify = new FrameLazy([Frame.nil]);

    it("returns itself when Frame is nil", () => {
      expect(codify.in(Frame.nil)).to.equal(codify);
    });

    it("converts Array to Expr when called", () => {
      const array = new FrameArray([context, new FrameName("nil")]);
      expect(array.toString()).to.equal("[“context”, .nil]");

      const expr = codify.call(array);
      expect(expr.toString()).to.equal("{ “context” .nil }");
      expect(expr).to.be.instanceof(FrameExpr);
      expect(expr.at(0)).to.equal(context);
      expect(expr.in()).to.equal(Frame.nil);
    });

    it("wraps other Frames in Expr when called", () => {
      const wrap = codify.call(sloth);

      expect(wrap).to.be.instanceof(FrameExpr);
      expect(wrap.at(0)).to.equal(sloth);
      expect(wrap.in()).to.equal(sloth);
    });
  });
});
