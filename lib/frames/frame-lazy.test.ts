import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import * as frame from "../frames.ts";

describe("FrameLazy", () => {
  const slow = new frame.FrameString("slow");
  const space = new frame.FrameString(" ");
  const turtle = new frame.FrameString("turtle");

  const lazy_array = [
    new frame.FrameSymbol("speed"),
    new frame.FrameSymbol("gap"),
    frame.FrameArg.here(),
  ];
  const lazy = new frame.FrameLazy(lazy_array, { speed: slow });
  const context = new frame.FrameString("context", { gap: space });

  it("takes an Array<Frame>", () => {
    expect(lazy).to.be.instanceof(frame.FrameLazy);
  });

  it("stringifies to {expr, meta}", () => {
    const result = lazy.toString();
    expect(result).to.include("{speed gap _, ");
  });

  it("evalutes to an Expr with merged context", () => {
    const expr = lazy.in([context]);

    expect(expr).to.be.instanceof(frame.FrameExpr);
    expect(expr.toString()).to.equal("(speed gap _, .speed “slow”; .gap “ ”;)");
    expect(expr.get("speed")).to.equal(slow);
    expect(expr.get("gap")).to.equal(space);
    expect(expr.call(turtle).toString()).to.equal("“slow turtle”");
  });

  describe("Codify", () => {
    const codify = new frame.FrameLazy([]);
    const fast = new frame.FrameString("fast");

    it("is created with an empty Array", () => {
      expect(codify.toString()).to.equal("{}");
    });

    it("returns itself when Frame is nil", () => {
      expect(codify.in([context])).to.equal(codify);
    });

    it("converts Array to unevaluated Expr when called", () => {
      const array = new frame.FrameArray(lazy_array, {
        speed: fast,
        gap: space,
      });
      const codified = codify.call(array);

      expect(codified).to.be.instanceof(frame.FrameExpr);
      expect(codified.toString()).to.include(
        "(speed gap _, .speed “fast”; .gap “ ”;)",
      );
      expect(codified.call(turtle).toString()).to.equal("“fast turtle”");
    });

    it("treats other Frames as Arrays when called", () => {
      const wrap = codify.call(turtle);

      expect(wrap).to.be.instanceof(frame.FrameExpr);
      expect(wrap.call(frame.Frame.nil).toString()).to.equal("“turtle”");
    });
  });
});
