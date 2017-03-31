import { expect } from "chai";
import * as frame from "../../src/frames";
import { LexPipe } from "../../src/execute/lex-pipe";
import * as parse from "../../src/execute/parse-pipe";
import { Terminal, terminals } from "../../src/execute/terminals";

describe("LexPipe", () => {
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

  it("returns Terminal(ender) for END", () => {
    const terminal = pipe.get(frame.Frame.kEND);
    expect(terminal).to.be.instanceof(Terminal);

    const result = terminal.call(pipe);
    expect(result.toString()).to.equal(success.toString());
  });

  it("calls ender on END", () => {
    const result = pipe.call(frame.FrameSymbol.end());
    expect(result.toString()).to.equal(success.toString());
  });

  it("emits END when lex empty string", () => {
    const result = pipe.lex_string("");
    expect(result.toString()).to.equal(success.toString());
  });
});
