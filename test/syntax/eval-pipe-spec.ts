import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";

import { EvalPipe } from "../../src/syntax/piper";

describe("EvalPipe", () => {
  let out: frame.FrameArray;
  let pipe: EvalPipe;

  beforeEach(() => {
    out = new frame.FrameArray([]);
    pipe = new EvalPipe(out);
  });

  it("is exported", () => {
    expect(EvalPipe).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).to.be.ok;
  });

  it("evaluates arguments", () => {
    const strA = new frame.FrameString("A");
    const strB = new frame.FrameString("B");
    const expr = new frame.FrameExpr([strA, strB]);
    const result = pipe.call(expr);
    expect(result.toString()).to.equal("“A B”");
  });
});
