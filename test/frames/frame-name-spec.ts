
import { expect } from "chai";
import {} from "mocha";
import { FrameArg, FrameExpr, FrameName, FrameString, FrameSymbol } from "../../src/frames";

describe("FrameName", () => {
  const symbol = "atom";
  const frame_name = new FrameName(symbol);

  it("is created from a string", () => {
    expect(frame_name).to.be.instanceOf(FrameName);
  });

  it("stringifies with a dot prefix", () => {
    expect(frame_name.toString()).to.equal(`.${symbol}`);
  });

  it("evaluates to a setter", () => {
    const frame_symbol = FrameSymbol.for(symbol);
    const result = frame_name.in();
    expect(result.toString()).to.equal(frame_symbol.toString());
  });

  it("extracts properties in an expression", () => {
    const value = FrameSymbol.for("smasher");
    const context = new FrameString("context", {atom: value});
    const frame_expr = new FrameExpr([FrameArg.here(), frame_name]);
    const result = frame_expr.in([context]);

    expect(result).to.equal(value);
  });
});
