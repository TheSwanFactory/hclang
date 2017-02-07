import { expect } from "chai";
import * as frame from "../../src/frames";
import { ender, LexPipe } from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";

describe.only("LexPipe", () => {
  const success = new frame.FrameString("success!");
  let out: frame.FrameArray;
  let pipe: LexPipe;

  beforeEach(() => {
    out = new frame.FrameArray([]);
    out.set(frame.Frame.kEND, success);
    pipe = new LexPipe(out);
  });

  it("is exported", () => {
    expect(LexPipe).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).to.be.ok;
  });

  it("emits END on finish", () => {
    const result = pipe.finish();
    expect(result.toString()).to.equal(success.toString());
  });

  it.skip("calls finish from ender'", () => {
    ender(pipe, out);
    const result = out.at(0);
    expect(result).to.equal(frame.FrameSymbol.end());
  });


  it.skip("emits END when lex empty string", () => {
    pipe.lex_string("");
    const result = out.at(0);
    expect(result).to.equal(frame.FrameSymbol.end());
  });
});
