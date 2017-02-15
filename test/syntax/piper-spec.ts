import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/syntax/lex-pipe";
import * as parse from "../../src/syntax/parse";

import { piper } from "../../src/syntax/piper";

describe("Piper", () => {
  let out: frame.FrameArray;

  beforeEach(() => {
    out = new frame.FrameArray([]);
  });

  it("is exported", () => {
    expect(piper).to.be.ok;
  });

  it("is constructed from an out parameter", () => {
  });

  it("returns nil from empty string", () => {
  });
});
