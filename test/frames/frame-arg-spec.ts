import { expect } from "chai";
import { FrameArg, FrameString } from "../../src/frames";

describe("FrameArg", () => {
  const frame_arg = FrameArg.here();

  describe("here", () => {
    it("is created from 'here'", () => {
      expect(frame_arg).to.be.instanceOf(FrameArg);
    });

    it("stringifies to underscore", () => {
      expect(frame_arg.toString()).to.equal("_");
    });

    it ("evaluates to the context", () => {
      const context = new FrameString("context", {atom: frame_arg});
      expect(FrameArg.here().in([context])).to.equal(context);
    });
  });

  describe("level", () => {
    it("returns 'here' at level 1", () => {
      const frame_level = FrameArg.level();
      expect(frame_level).to.equal(frame_arg);
    });

    it("returns the same object at each level", () => {
      const level_2 = FrameArg.level(2);
      expect(FrameArg.level(2)).to.equal(level_2);
    });

    it ("evaluates to a lower level", () => {
      const context = new FrameString("context", {atom: frame_arg});
      const level_3 = FrameArg.level(3);
      const level_2 = FrameArg.level(2);
      expect(level_3.in([context])).to.equal(level_2);
      expect(level_2.in([context])).to.equal(frame_arg);
    });
  });
});
