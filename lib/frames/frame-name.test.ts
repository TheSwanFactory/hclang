import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameArg,
  FrameArray,
  FrameExpr,
  FrameName,
  FrameString,
  FrameSymbol,
} from "../frames.ts";
import { FrameHandle } from "./frame-handle.ts";

describe("FrameName", () => {
  const symbol = "atom";
  const frame_name = new FrameName(symbol);

  it("is created from a string", () => {
    expect(frame_name).toBeInstanceOf(FrameName);
  });

  it("stringifies with a dot prefix", () => {
    expect(frame_name.toString()).toEqual(`.${symbol}`);
  });

  it("evaluates to a setter", () => {
    const frame_symbol = FrameSymbol.for(symbol);
    const result = frame_name.in();
    expect(result.toString()).toEqual(frame_symbol.toString());
  });

  it("extracts properties in an expression", () => {
    const value = FrameSymbol.for("smasher");
    const context = new FrameString("context", { atom: value });
    const frame_expr = new FrameExpr([FrameArg.here(), frame_name]);
    const result = frame_expr.in([context]);

    expect(result).toEqual(value);
  });

  describe("declaration target", () => {
    it("binds to the innermost frame that accepts declarations", () => {
      const statement = new FrameString("statement");
      const target = new FrameArray([]);
      target.declares = true;
      const wrapper = new FrameString("wrapper");

      const setter = frame_name.in([statement, target, wrapper]);

      expect(setter.get(Frame.kOUT)).toBe(target);
    });

    it("binds to the statement context when nothing accepts declarations", () => {
      const statement = new FrameString("statement");
      const wrapper = new FrameString("wrapper");

      const setter = frame_name.in([statement, wrapper]);

      expect(setter.get(Frame.kOUT)).toBe(statement);
    });

    it("declares a parent only on the frame under construction", () => {
      const parent = new FrameName(FrameName.PARENT_DECLARATION);
      const underConstruction = new FrameArray([]);
      underConstruction.declares = true;

      expect(parent.in([new FrameString("statement"), underConstruction]))
        .not.toHaveProperty("is.error", true);

      // A method body offers no aggregate under construction. Its target would
      // be the argument, so the declaration is refused rather than re-parenting
      // the wrong frame.
      const inMethodBody = parent.in([
        new FrameHandle(new FrameArray([]), true),
        new FrameString("receiver"),
      ]);

      expect(inMethodBody.is.error).toBe(true);
      expect(inMethodBody.toString()).toEqual("$!.parent-not-declarable .^");
    });

    it("prefers the innermost of several declaration targets", () => {
      const outer = new FrameArray([]);
      const inner = new FrameArray([]);
      outer.declares = true;
      inner.declares = true;

      const setter = frame_name.in([outer, inner]);

      expect(setter.get(Frame.kOUT)).toBe(inner);
    });
  });
});
