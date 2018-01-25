import { expect } from "chai";
import {} from "mocha";
import * as frame from "../../src/frames";
import { FrameSymbol } from "../../src/frames";

describe("FrameSymbol", () => {
  const symbol = "atom";
  const frame_symbol = FrameSymbol.for(symbol);

  it("is created from a string", () => {
    expect(frame_symbol).to.be.instanceOf(FrameSymbol);
  });

  it("stringifies back to that string", () => {
    expect(frame_symbol.toString()).to.equal(symbol);
  });

  it("stringifies meta into an expression", () => {
    const context = "context";
    const frame_context = new FrameSymbol(context, {atom: frame_symbol});
    expect(frame_context.toString()).to.equal(`(${context}, .atom ${symbol};)`);
  });

  it("always returns the same FrameSymbol object", () => {
    const frame_symbol_2 = FrameSymbol.for(symbol);
    expect(frame_symbol).to.equal(frame_symbol_2);
  });

  it("looks itself up in context", () => {
    const value = new frame.FrameString("smasher");
    const context = new frame.FrameString("parent", {atom: value});
    const result = frame_symbol.in([context]);
    expect(result).to.equal(value);
  });

  it("returns the value when called_by", () => {
    const value = new frame.FrameString("smasher");
    const context = new frame.FrameString("parent", {atom: value});
    const result = context.call(frame_symbol);
    expect(result).to.equal(value);
  });

  it("evaluates value when callme = true", () => {
    const value1 = new frame.FrameString("Atom ");
    const value2 = new frame.FrameString("Smasher");
    const expr = new frame.FrameExpr([value1, value2]);
    const context = new frame.FrameString("parent", {atom: expr});

    const result = context.call(frame_symbol);
    expect(result.toString()).to.equal("(“Atom ” “Smasher”)");

    expr.callme = true;
    const result2 = context.call(frame_symbol);
    expect(result2.toString()).to.equal("“Atom Smasher”");
  });

  describe.only("setter", () => {
    const value = "value";
    const frame_value = new frame.FrameString(value);
    const out = new frame.FrameString("out");
    const setter = frame_symbol.setter(out);
    const result = setter.call(frame_value);

    it("has out parameter", () => {
      expect(setter.get(frame.Frame.kOUT)).to.equal(out);
    });

    it("returns setter", () => {
      expect(result).to.equal(setter);
    });

    it("sets value in out", () => {
      const extracted = out.get(symbol);
      expect(extracted).to.equal(frame_value);
    });
  });

});
