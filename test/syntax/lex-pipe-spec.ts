import { expect } from "chai";
import * as frame from "../../src/frames";
import { LexPipe } from "../../src/syntax/lex-pipe";

describe.only("LexPipe", () => {
  const out = new frame.FrameArray([]);
  const pipe = new LexPipe(out);

  it("is exported", () => {
    expect(LexPipe).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).to.be.ok;
  });
});
