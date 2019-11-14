
import { expect } from "chai";
import {} from "mocha";
import { Lex } from "../../src/execute/lex";
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

  describe.skip("FrameBytes", () => {
    it("returns Lex on /", () => {
      const slash = frame.FrameSymbol.for("/");
      const result = pipe.call(slash);
      console.error(result);
      expect(result).to.be.instanceof(LexPipe);
    });
  });

});
