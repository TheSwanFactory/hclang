
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

  it("always returns the same FrameSymbol object", () => {
    const frame_symbol_2 = FrameSymbol.for(symbol);
    expect(frame_symbol).to.equal(frame_symbol_2);
  });

  it("looks itself up in context", () => {
    const value = new FrameSymbol("smasher");
    const context = new FrameSymbol("parent", {atom: value});
    const result = frame_symbol.in(context);
    expect(result).to.equal(value);
  });
});
