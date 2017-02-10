import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/syntax/lex-pipe";
import { ParsePipe }from "../../src/syntax/parse";

describe("ParsePipe", () => {
  let out: frame.FrameArray;
  let pipe: ParsePipe;

  beforeEach(() => {
    out = new frame.FrameArray([]);
    pipe = new ParsePipe(out);
  });

  it("is exported", () => {
    expect(ParsePipe).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).to.be.ok;
  });

  it("emits an empty Expr when called with end()", () => {
    const result = pipe.call(frame.FrameSymbol.end());
    expect(result.toString()).to.equal("()");
  });
});
