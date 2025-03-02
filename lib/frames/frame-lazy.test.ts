import { expect } from "jsr:@std/expect";
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
    expect(lazy).toBeInstanceOf(frame.FrameLazy);
  });

  it("stringifies to {expr, meta}", () => {
    const result = lazy.toString();
    expect(result).toContain("{speed gap _, ");
  });

  it("evalutes to an Expr with merged context", () => {
    const expr = lazy.in([context]);

    expect(expr).toBeInstanceOf(frame.FrameExpr);
    expect(expr.toString()).toEqual("(speed gap _, .speed “slow”; .gap “ ”;)");
    expect(expr.get("speed")).toEqual(slow);
    expect(expr.get("gap")).toEqual(space);
    expect(expr.call(turtle).toString()).toEqual("“slow turtle”");
  });

  describe("Codify", () => {
    const codify = new frame.FrameLazy([]);
    const fast = new frame.FrameString("fast");

    it("is created with an empty Array", () => {
      expect(codify.toString()).toEqual("{}");
    });

    it("returns itself when Frame is nil", () => {
      expect(codify.in([context])).toEqual(codify);
    });

    it("converts Array to unevaluated Expr when called", () => {
      const array = new frame.FrameArray(lazy_array, {
        speed: fast,
        gap: space,
      });
      const codified = codify.call(array);

      expect(codified).toBeInstanceOf(frame.FrameExpr);
      expect(codified.toString()).toContain(
        "(speed gap _, .speed “fast”; .gap “ ”;)",
      );
      expect(codified.call(turtle).toString()).toEqual("“fast turtle”");
    });

    it("treats other Frames as Arrays when called", () => {
      const wrap = codify.call(turtle);

      expect(wrap).toBeInstanceOf(frame.FrameExpr);
      expect(wrap.call(frame.Frame.nil).toString()).toEqual("“turtle”");
    });
  });
});
