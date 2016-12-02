import { FrameChar } from "../../src/frames";
import {expect} from "chai";

describe("FrameChar", () => {
  const frame_char = FrameChar.for("a");

  it("takes a string of length one", () => {
    expect(frame_char).to.be.instanceOf(FrameChar);
  });

  it("stringifies to a unit netstring", () => {
    expect(frame_char.toString()).to.equal("\\\\a");
  });

  it("returns the char for 'toStringData'", () => {
    expect(frame_char.toStringData()).to.equal("a");
  });

  it("always returns the same FramChar object", () => {
    const frame_char_2 = FrameChar.for("a");
    expect(frame_char).to.equal(frame_char_2);
  });
});
