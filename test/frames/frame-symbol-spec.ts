
import { FrameSymbol } from "../../src/frames/frame-symbol";
import * as chai from "chai";

const expect = chai.expect;

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
    expect(frame_context.toString()).to.equal(`(.atom ${symbol}; ${context})`);
  });

  it("always returns the same FrameSymbol object", () => {
    const frame_symbol_2 = FrameSymbol.for(symbol);
    expect(frame_symbol).to.equal(frame_symbol_2);
  });

  it("looks itself up in context", () => {
    const value = FrameSymbol.for("smasher");
    const context = new FrameSymbol("parent", {atom: value});
    const result = frame_symbol.in(context);
    expect(result).to.equal(value);
  });

  it ("reflector '_' returns the context", () => {
    const context = new FrameSymbol("context", {atom: frame_symbol});
    const reflector = FrameSymbol.for("_");
    expect(reflector.in(context)).to.equal(context);
  });
});
