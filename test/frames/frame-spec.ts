
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
  it("should exist", () => {
    const frame = new FrameArray();
    expect(frame).to.be.instanceOf(FrameArray);
  });
});
