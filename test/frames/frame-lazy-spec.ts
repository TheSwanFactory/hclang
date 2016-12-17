import { expect } from "chai";
import { Frame, FrameArg, FrameArray, FrameExpr, FrameName, FrameString, FrameSymbol, FrameLazy } from "../../src/frames";

describe("FrameLazy", () => {
  const slow = new FrameString("slow");
  const space = new FrameString(" ");
  const turtle = new FrameString("turtle");

  const lazy_array = [new FrameSymbol("speed"), new FrameSymbol("gap"), FrameArg.here()];

  const lazy = new FrameLazy(lazy_array, {speed: slow});
  const context = new FrameString("context", {gap: space});
  const expr = lazy.in(context);

  it("takes an Array<Frame>", () => {
    expect(lazy).to.be.instanceof(FrameLazy);
  });

  it("stringifies to { expr, meta }", () => {
    const result = lazy.toString();
    expect(result).to.include(`{ speed gap _, `);
  });

  it("evalutes to an Expr with merged context", () => {
    expect(expr).to.be.instanceof(FrameExpr);
    expect(expr.toString()).to.equal(`(speed gap _, .speed “slow”; .gap “ ”;`);
    expect(expr.get("speed")).to.equal(slow);
    expect(expr.get("gap")).to.equal(space);
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
      const wrap = codify.call(turtle);

      expect(wrap).to.be.instanceof(FrameExpr);
      expect(wrap.at(0)).to.equal(turtle);
      expect(wrap.in()).to.equal(turtle);
    });
  });
});
