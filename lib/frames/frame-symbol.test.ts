import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import * as frame from "../frames.ts";
import { FrameSymbol } from "../frames.ts";

describe("FrameSymbol", () => {
  const symbol = "atom";
  const frame_symbol = FrameSymbol.for(symbol);

  it("is created from a string", () => {
    expect(frame_symbol).toBeInstanceOf(FrameSymbol);
  });

  it("stringifies back to that string", () => {
    expect(frame_symbol.toString()).toEqual(symbol);
  });

  it("stringifies meta into an expression", () => {
    const context = "context";
    const frame_context = new FrameSymbol(context, { atom: frame_symbol });
    expect(frame_context.toString()).toEqual(`(${context}, .atom ${symbol};)`);
  });

  it("always returns the same FrameSymbol object", () => {
    const frame_symbol_2 = FrameSymbol.for(symbol);
    expect(frame_symbol).toEqual(frame_symbol_2);
  });

  it("looks itself up in context", () => {
    const value = new frame.FrameString("smasher");
    const context = new frame.FrameString("parent", { atom: value });
    const result = frame_symbol.in([context]);
    expect(result).toEqual(value);
  });

  it("returns the value when called_by", () => {
    const value = new frame.FrameString("smasher");
    const context = new frame.FrameString("parent", { atom: value });
    const result = context.call(frame_symbol);
    expect(result).toEqual(value);
  });

  it("evaluates value when callme = true", () => {
    const value1 = new frame.FrameString("Atom ");
    const value2 = new frame.FrameString("Smasher");
    const expr = new frame.FrameExpr([value1, value2]);
    const context = new frame.FrameString("parent", { atom: expr });

    const result = context.call(frame_symbol);
    expect(result.toString()).toEqual("(“Atom ” “Smasher”)");

    expr.is.immediate = true;
    const result2 = context.call(frame_symbol);
    expect(result2.toString()).toEqual("“Atom Smasher”");
  });

  describe("setter", () => {
    const value = "value";
    const frame_value = new frame.FrameString(value);
    const out = new frame.FrameString("out");
    const setter = frame_symbol.setter(out);
    const result = setter.call(frame_value);

    it("has out parameter", () => {
      expect(setter.get(frame.Frame.kOUT)).toEqual(out);
    });

    it("returns setter", () => {
      expect(result).toEqual(setter);
    });

    it("sets value in out", () => {
      const extracted = out.get(symbol);
      expect(extracted).toEqual(frame_value);
    });
  });
});
