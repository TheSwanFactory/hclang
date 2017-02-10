import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";
import { ParsePipe } from "../../src/syntax/pipes";

describe("ParsePipe", () => {
  const success = new frame.FrameString("success!");
  let out: frame.FrameArray;
  let pipe: ParsePipe;

  beforeEach(() => {
    out = new frame.FrameArray([]);
    out.set(frame.Frame.kEND, success);
    pipe = new ParsePipe(out);
  });

  it("is exported", () => {
    expect(ParsePipe).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).to.be.ok;
  });

});
