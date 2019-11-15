
import { expect } from "chai";
import {} from "mocha";
import { Lex } from "../../src/execute/lex";
import { LexBytes } from "../../src/execute/lex-bytes";
import { LexPipe } from "../../src/execute/lex-pipe";
import * as frame from "../../src/frames";

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

  it("returns itself on finish", () => {
    const result = pipe.finish(frame.Frame.nil);
    expect(result).to.equal(pipe);
  });

  it("returns LexBytes on \\1\\1", () => {
    const slash = frame.FrameSymbol.for("\\");
    const one = frame.FrameSymbol.for("1");
    let result = pipe.call(slash);
    expect(result).to.be.instanceof(Lex);
    result = pipe.call(one);
    result = pipe.call(slash);
    expect(result).to.be.instanceof(LexBytes);
    result = pipe.call(one);
    expect(result).to.be.instanceof(LexPipe);
    console.error(out);
    expect(out.length()).to.equal(1);
  });
});
