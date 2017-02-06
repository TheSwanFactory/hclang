import { expect } from "chai";
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
    const result = context.call(frame_symbol)
    expect(result).to.equal(value);
  });

  describe("direct", () => {
    const value1 = new frame.FrameString("Atom ");
    const value2 = new frame.FrameString("Smasher");
    const expr = new frame.FrameExpr([value1, value2]);
    const direct_symbol = new FrameSymbol("atom", {"!": frame.Frame.nil});

    it("has a well-known kDIRECT key", () => {
      const key = FrameSymbol.kDIRECT;
      expect(key).to.equal("!");
    });

    it("has as symbol with the direct key", () => {
      const direct = direct_symbol.get_here(FrameSymbol.kDIRECT);
      expect(direct).to.not.equal(frame.Frame.missing);
    });

    it("evaluates that value when direct is not missing", () => {
      const context = new frame.FrameString("parent", {atom: expr});
      const result = context.call(direct_symbol);
      expect(result.toString()).to.equal("“Atom Smasher”");
    });
  });
});
