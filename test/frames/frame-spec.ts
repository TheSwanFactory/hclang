
import { Frame, FrameArray } from "../../src/frames/frame";
import * as chai from "chai";

const expect = chai.expect;

describe("Frame", () => {
  it("should exist", () => {
    const frame = new Frame();
    expect(frame).to.be.instanceOf(Frame);
  });
});

describe("FrameArray", () => {
  const frame = new Frame();
  const frame_array = new FrameArray([frame]);
  it("should exist", () => {
    expect(frame).to.be.instanceOf(FrameArray);
  });
  it("is constructed from an array of frames", () => {
    expect(frame).to.be.instanceOf(FrameArray);
  });
});
