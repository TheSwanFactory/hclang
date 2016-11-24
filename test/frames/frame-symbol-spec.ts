
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

  it("always returns the same FramSymbol object", () => {
    const frame_symbol_2 = FrameSymbol.for(symbol);
    expect(frame_symbol).to.equal(frame_symbol_2);
  });
});
