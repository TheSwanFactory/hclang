
import { FrameChar } from "../../src/frames/frame-char";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameChar", () => {
  const frame_char = new FrameChar("a");
  it("takes a string of length one", () => {
    expect(frame_char).to.be.instanceOf(FrameChar);
  });
  it("stringifies to a unit netstring", () => {
    expect(frame_char.toString()).to.equal("\\\\a");
  });
});
