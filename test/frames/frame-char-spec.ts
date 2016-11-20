
import { FrameChar } from "../../src/frames/frame-char";
import * as chai from "chai";

const expect = chai.expect;

describe("FrameChar", () => {
  it("should exist", () => {
    const frame_char = new FrameChar();
    expect(frame_char).to.be.instanceOf(FrameChar);
  });
});
