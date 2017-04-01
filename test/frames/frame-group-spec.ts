import {} from "mocha";
import { expect } from "chai";
import * as frame from "../../src/frames";

describe("FrameGroup", () => {
  const a_frame = new frame.FrameString("a");
  const b_frame = new frame.FrameString("b");
  const c_frame = new frame.FrameString("c");
  const frame_group = new frame.FrameGroup([a_frame], {c: c_frame});
  const multi_group = new frame.FrameGroup([a_frame, b_frame], {c: c_frame});

  it("is constructed from an array of frames", () => {
    expect(frame_group).to.be.instanceOf(frame.FrameGroup);
  });

  it("with multiple arguments, evaluates to FrameArray", () => {
    const result = multi_group.in();
    expect(result).to.be.instanceOf(frame.FrameArray);
  });

  it("with single argument, evaluates that", () => {
    const result = frame_group.in();
    expect(result).to.be.instanceOf(frame.FrameString);
  });

});
