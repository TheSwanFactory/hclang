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
