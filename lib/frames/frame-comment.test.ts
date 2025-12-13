import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { FrameComment } from "../frames.ts";

describe("FrameComment", () => {
  const source = "Frankly, my dear";
  const frame_comment = new FrameComment(source);

  it("is exported", () => {
    expect(FrameComment).toBeTruthy();
  });

  it("is created from a string", () => {
    expect(frame_comment).toBeInstanceOf(FrameComment);
  });

  it("stringifies with `#`", () => {
    expect(frame_comment.toString()).toEqual(`#${source}#`);
  });
});
