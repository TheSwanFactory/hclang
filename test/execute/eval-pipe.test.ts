import { expect } from "npm:chai";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { EvalPipe } from "../../lib/execute/eval-pipe.ts";
import * as frame from "../../lib/frames.ts";

describe("EvalPipe", () => {
  const strA = new frame.FrameString("A");
  const strB = new frame.FrameString("B");
  const expr = new frame.FrameExpr([strA, strB]);
  const value = new frame.FrameString("Value");
  const context = { key: value };
  let out: frame.FrameArray;
  let pipe: EvalPipe;

  beforeEach(() => {
    out = new frame.FrameArray([], context);
    pipe = new EvalPipe(out);
  });

  it("is exported", () => {
    expect(EvalPipe).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).to.be.ok;
  });

  it("evaluates arguments", () => {
    const result = pipe.call(expr);
    expect(result.toString()).to.equal("“AB”");
  });

  it("evaluates symbols in context", () => {
    const symbol = new frame.FrameSymbol("key");
    const result = pipe.call(symbol);
    expect(result.toString()).to.equal(value.toString());
  });

  it("evaluates symbols in expressions", () => {
    const symbol = new frame.FrameSymbol("key");
    const wrap = new frame.FrameExpr([symbol]);
    const result = pipe.call(wrap);
    expect(result.toString()).to.equal(value.toString());
  });

  it("stores result in out", () => {
    expect(out.size()).to.equal(0);
    const result = pipe.call(expr);
    expect(out.size()).to.equal(1);
    expect(out.at(0)).to.equal(result);
  });
});
