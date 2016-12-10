import { expect } from "chai";
import { FrameArg, FrameString } from "../../src/frames";


describe("FrameArg", () => {
  const frame_arg = FrameArg.here();

  it("is created from 'here'", () => {
    expect(frame_arg).to.be.instanceOf(FrameArg);
  });

  it("stringifies to underscore", () => {
    expect(frame_arg.toString()).to.equal("_");
  });

  it ("'in' returns the context", () => {
    const context = new FrameString("context", {atom: frame_arg});
    expect(FrameArg.here().in(context)).to.equal(context);
  });

describe("level", () => {
    it("level 1 returns 'here'", () => {
      const frame_level = FrameArg.level();
      expect(frame_arg).to.equal(frame_level);
    });
  });
});
