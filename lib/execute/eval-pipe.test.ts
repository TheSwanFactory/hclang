import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { EvalPipe } from "./eval-pipe.ts";
import * as frame from "../frames.ts";

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
    expect(EvalPipe).toBeTruthy();
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).toBeTruthy();
  });

  it("evaluates arguments", () => {
    const result = pipe.call(expr);
    expect(result.toString()).toEqual("“AB”");
  });

  it("evaluates symbols in context", () => {
    const symbol = new frame.FrameSymbol("key");
    const result = pipe.call(symbol);
    expect(result.toString()).toEqual(value.toString());
  });

  it("evaluates symbols in expressions", () => {
    const symbol = new frame.FrameSymbol("key");
    const wrap = new frame.FrameExpr([symbol]);
    const result = pipe.call(wrap);
    expect(result.toString()).toEqual(value.toString());
  });

  it("stores result in out", () => {
    expect(out.size()).toEqual(0);
    const result = pipe.call(expr);
    expect(out.size()).toEqual(1);
    expect(out.at(0)).toEqual(result);
  });
});
