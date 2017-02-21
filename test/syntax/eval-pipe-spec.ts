import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";

import { EvalPipe } from "../../src/syntax/piper";

describe("EvalPipe", () => {
  let out: frame.FrameArray;

  beforeEach(() => {
    out = new frame.FrameArray([]);
  });

  it("is exported", () => {
    expect(EvalPipe).to.be.ok;
  });

  it("Evaluates arguments", () => {
    //expect(result.toString()).to.equal("()");
  });
});
