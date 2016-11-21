
import { Frame, FrameArray } from "../../src/frames/frame";
import * as chai from "chai";

const expect = chai.expect;

describe("Frame", () => {
  const frame = new Frame();

  it("is constructed from nothing", () => {
    expect(frame).to.be.instanceOf(Frame);
  });

  it("returns argument when called", () => {
    const frame2 = new Frame();
    const result = frame.call(frame2);
    expect(result).to.equal(frame2);
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
