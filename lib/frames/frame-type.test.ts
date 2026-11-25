import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Frame, FrameNumber, FrameString, FrameType } from "../frames.ts";
import { lastResult as answer } from "../test-helpers.test.ts";

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
  it("prints inside an aggregate's data plane as its own form", () => {
    expect(answer("[1 .<>]").dataString()).toEqual("[(1).<>]");
    expect(answer("[1 .<>]").dataEquals(answer("[1 .<>]"))).toBe(Frame.all);
    expect(answer("[1 .<>]").dataEquals(answer("[“a” .<>]")))
      .toBe(Frame.nil);
  });
});
