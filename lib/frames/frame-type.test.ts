import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FrameNumber, FrameString, FrameType } from "../frames.ts";

describe("FrameType", () => {
  it("represents and matches an extracted runtime frame class", () => {
    const type = FrameType.of(new FrameString(""));

    expect(type.toString()).toEqual("(“”).<>");
    expect(type.matches(new FrameString("Q"))).toEqual(true);
    expect(type.matches(new FrameNumber("1"))).toEqual(false);
  });

  it("returns evidence on application and an error on mismatch", () => {
    const type = FrameType.of(new FrameString(""));
    const string = new FrameString("Q");

    expect(type.call(string)).toEqual(string);
    expect(type.call(new FrameNumber("1")).toString()).toEqual(
      "$!.type-error (“”).<> 1",
    );
  });
});
