import { expect } from "chai";
import { Frame, FrameArg, FrameArray, FrameExpr, FrameName, FrameString, FrameSymbol, FrameLazy } from "../../src/frames";

describe("FrameLazy", () => {
  const slow = new FrameString("slow");
  const space = new FrameString(" ");
  const turtle = new FrameString("turtle");

  const lazy_array = [new FrameSymbol("speed"), new FrameSymbol("gap"), FrameArg.here()];
  const lazy = new FrameLazy(lazy_array, {speed: slow});
  const context = new FrameString("context", {gap: space});

  it("takes an Array<Frame>", () => {
    expect(lazy).to.be.instanceof(FrameLazy);
  });

  it("stringifies to { expr, meta }", () => {
    const result = lazy.toString();
    expect(result).to.include(`{ speed gap _, `);
  });

  it("evalutes to an Expr with merged context", () => {
    const expr = lazy.in(context);

    expect(expr).to.be.instanceof(FrameExpr);
    expect(expr.toString()).to.equal(`(speed gap _, .speed “slow”; .gap “ ”;)`);
    expect(expr.get("speed")).to.equal(slow);
    expect(expr.get("gap")).to.equal(space);
    expect(expr.call(turtle).toString()).to.equal(`“slow turtle”`);
  });

  describe("Codify", () => {
    const codify = new FrameLazy([]);

    it("is created with an empty Array", () => {
      expect(codify.toString()).to.equal("{  }");
    });

    it("returns itself when Frame is nil", () => {
      expect(codify.in(context)).to.equal(codify);
    });

    it("converts Array to Expr when called", () => {
      const array = new FrameArray(lazy_array, {speed: slow, gap:space});
      const codified = codify.call(array);

      expect(codified).to.be.instanceof(FrameExpr);
      expect(codified.toString()).to.equal("(speed gap _)");
      expect(codified.call(turtle).toString()).to.equal(`“slow turtle”`);
    });

    it("treats other Frames as Arrays when called", () => {
      const wrap = codify.call(turtle);

      expect(wrap).to.be.instanceof(FrameExpr);
      expect(wrap.at(0)).to.equal(turtle);
      expect(wrap.in()).to.equal(turtle);
    });
  });
});
