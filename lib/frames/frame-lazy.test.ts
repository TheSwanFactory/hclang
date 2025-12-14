import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

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

  it("stringifies to {expr} without metadata", () => {
    const result = lazy.toString();
    // Closures don't show captured metadata in toString (use inspect() for that)
    expect(result).toEqual("{speed gap _}");
  });

  it("captures context but stays lazy until called", () => {
    const result = lazy.in([context]);

    expect(result).toBe(lazy);
    expect(lazy.get("speed")).toEqual(slow);
    expect(lazy.get("gap")).toEqual(space);
    // Closures don't show captured metadata in toString
    expect(lazy.toString()).toEqual("{speed gap _}");
    // But inspect() shows metadata for debugging
    expect(lazy.inspect()).toContain(".speed");
    expect(lazy.inspect()).toContain(".gap");
    expect(lazy.call(turtle).toString()).toEqual("\u201cslow turtle\u201d");
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
