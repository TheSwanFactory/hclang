import { Frame } from "../../src/frames/frame";
import { FrameSymbol } from "../../src/frames/frame-symbol";
import { FrameName } from "../../src/frames/frame-name";
import { FrameExpr } from "../../src/frames/frame-expr";

import * as chai from "chai";
const expect = chai.expect;

describe("FrameName", () => {
  const symbol = "atom";
  const frame_name = new FrameName(symbol);

  it("is created from a string", () => {
    expect(frame_name).to.be.instanceOf(FrameName);
  });

  it("stringifies with a dot prefix", () => {
    expect(frame_name.toString()).to.equal(`.${symbol}`);
  });

  it("evaluates to a FrameSymbol object", () => {
    const frame_symbol = FrameSymbol.for(symbol);
    const result = frame_name.in();
    expect(result).to.equal(frame_symbol);
  });

  it("extracts properties in an expression", () => {
    const value = FrameSymbol.for("smasher");
    const context = new Frame({atom: value});
    const frame_expr = new FrameExpr([FrameSymbol.here(), frame_name]);
    const result = frame_expr.call(context);

    expect(result).to.equal(value);
  });
});
