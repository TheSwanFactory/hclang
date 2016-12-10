import { expect } from "chai";
import { Frame, FrameArray } from "../../src/frames";

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

  it("evalates its components", () => {
    expect(frame_array).to.be.instanceOf(FrameArray);
  });

});
