
import { Frame, FrameArray } from "../../src/frames/frame";
import * as chai from "chai";

const expect = chai.expect;

describe("Frame", () => {
  it("is constructed from nothing", () => {
    const frame = new Frame();
    expect(frame).to.be.instanceOf(Frame);
  });
});

describe("FrameArray", () => {
  const frame = new Frame();
  const frame_array = new FrameArray([frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_array).to.be.instanceOf(FrameArray);
  });

  it("uses 'at' to access elements by index", () => {
    const first_element = frame_array.at(0);
    expect(first_element).to.be.ok;
    expect(first_element).to.be.instanceOf(Frame);
  });
});
