import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import { Frame, FrameNumber } from "../frames.ts";

describe("FrameNumber", () => {
  const source = "12345667890";
  const frame_number = new FrameNumber(source);

  it("is exported", () => {
    expect(FrameNumber).to.be.ok;
  });

  it("is created from a string", () => {
    expect(frame_number).to.be.instanceOf(FrameNumber);
  });

  it("stringifies back to that string", () => {
    expect(frame_number.toString()).to.equal(source);
  });

  it("returns a range", () => {
    const range = new FrameNumber("3").range();
    expect(range).to.be.instanceOf(Array);
    expect(range).to.have.lengthOf(3);
    expect(range).to.deep.equal([0, 1, 2]);
  });

  it("is equal to the same number", () => {
    const same = new FrameNumber(source);
    expect(frame_number.equals(same)).to.equal(Frame.all);
    expect(frame_number == same).to.be.false;
    expect(frame_number).to.not.equal(same);
  });
});
