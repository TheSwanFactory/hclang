import { expect } from "chai";
import * as frame from "../../src/frames";
import { LexPipe } from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";

describe.only("LexPipe", () => {
  let out: frame.FrameArray;
  let pipe: LexPipe;
  beforeEach(() => {
    out = new frame.FrameArray([]);
    pipe = new LexPipe(out);
  });

  it("is exported", () => {
    expect(LexPipe).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).to.be.ok;
  });

  it("emits ParseTerminal on empty string", () => {
    pipe.lex_string("");
    const result = out.at(0);
    expect(result).to.be.an.instanceof(parse.ParseTerminal);
  });
});
