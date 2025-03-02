import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import * as frame from "../frames.ts";

describe("FrameGroup", () => {
  const a_frame = new frame.FrameString("a");
  const b_frame = new frame.FrameString("b");
  const c_frame = new frame.FrameString("c");
  const frame_group = new frame.FrameGroup([a_frame], { c: c_frame });
  const multi_group = new frame.FrameGroup([a_frame, b_frame], { c: c_frame });
  const value = frame_group.in();

  it("is constructed from an array of frames", () => {
    expect(frame_group).toBeInstanceOf(frame.FrameGroup);
  });

  it("with multiple arguments, evaluates to FrameGroup", () => {
    const result = multi_group.in();
    expect(result).toBeInstanceOf(frame.FrameGroup);
  });

  it("with single argument, evaluates that", () => {
    expect(value).toBeInstanceOf(frame.FrameString);
  });

  it("includes meta in result", () => {
    const result = value.get("c");
    expect(result).toBeTruthy();
    expect(result).toEqual(c_frame);
  });
});
