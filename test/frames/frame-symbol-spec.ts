import { expect } from "chai";
import { FrameString, FrameSymbol } from "../../src/frames";

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
    const value = new FrameString("smasher");
    const context = new FrameString("parent", {atom: value});
    const result = frame_symbol.in([context]);
    expect(result).to.equal(value);
  });

  it("returns the value when called_by", () => {
    const value = new FrameString("smasher");
    const context = new FrameString("parent", {atom: value});
    const result = context.call(frame_symbol)
    expect(result).to.equal(value);
  });
});
