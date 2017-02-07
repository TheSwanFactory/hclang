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

  it("calls finish from ender", () => {
    const result = ender(pipe, out);
    expect(result.toString()).to.equal(success.toString());
  });

  it("returns Terminal for END", () => {
    const terminal = pipe.get(frame.Frame.kEND);
    expect(terminal).to.be.instanceof(parse.ParseTerminal);


  });

  it.skip("calls ender on END", () => {
    const result = pipe.call(frame.FrameSymbol.end());
    expect(result.toString()).to.equal(success.toString());
  });

  it.skip("emits END when lex empty string", () => {
    const result = pipe.lex_string("");
    console.error(` * out ${out}`)
    expect(result.toString()).to.equal(success.toString());
  });
});
