import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { FrameNumber, FrameString, FrameType } from "../frames.ts";

describe("FrameType", () => {
  it("represents and matches an extracted runtime frame class", () => {
    const type = FrameType.of(new FrameString(""));

    expect(type.toString()).toEqual("~~“”");
    expect(type.matches(new FrameString("Q"))).toEqual(true);
    expect(type.matches(new FrameNumber("1"))).toEqual(false);
  });
});
