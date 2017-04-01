import {} from "mocha";
import { expect } from "chai";
import * as frame from "../../src/frames";

describe("FrameGroup", () => {
  const a_frame = new frame.FrameString("a");
  const b_frame = new frame.FrameString("b");
  const frame_group = new frame.FrameGroup([a_frame, b_frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_group).to.be.instanceOf(frame.FrameGroup);
  });

});
