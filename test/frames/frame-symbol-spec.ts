import chai = require("chai");
import cpe = require("chai-pretty-expect");
//chai.use(cpe);
const expect = chai.expect;
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
    const value = FrameSymbol.for("smasher");
    const context = new FrameSymbol("parent", {atom: value});
    const result = frame_symbol.in([context]);
    expect(result).to.equal(value);
  });
});
