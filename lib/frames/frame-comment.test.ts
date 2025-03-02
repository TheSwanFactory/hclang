import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import { FrameComment } from "../frames.ts";

describe("FrameComment", () => {
  const source = "Frankly, my dear";
  const frame_comment = new FrameComment(source);

  it("is exported", () => {
    expect(FrameComment).to.be.ok;
  });

  it("is created from a string", () => {
    expect(frame_comment).to.be.instanceOf(FrameComment);
  });

  it("stringifies with `#`", () => {
    expect(frame_comment.toString()).to.equal(`#${source}#`);
  });
});
