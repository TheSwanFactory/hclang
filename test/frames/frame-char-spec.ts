
import { FrameChar } from "../../src/frames/frame-char";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameChar", () => {
  it("takes a string of length one", () => {
    const frame_char = new FrameChar("a");
    expect(frame_char).to.be.instanceOf(FrameChar);
  });
  it("stringifies to a unit netstring", () => {
    const frame_char = new FrameChar("a");
    expect(frame_char.toString()).to.equal("\\\\a");
  });
});
