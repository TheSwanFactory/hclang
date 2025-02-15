import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import { FrameArg, FrameParam, FrameString } from "../../src/frames.ts";

describe("FrameArg", () => {
  const frame_arg = FrameArg.here();

  describe("here", () => {
    it("is created from 'here'", () => {
      expect(frame_arg).to.be.instanceOf(FrameArg);
    });

    it("stringifies to underscore", () => {
      expect(frame_arg.toString()).to.equal("_");
    });

    it("evaluates to the context", () => {
      const context = new FrameString("context", { atom: frame_arg });
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

    it("evaluates to a lower level", () => {
      const context = new FrameString("context", { atom: frame_arg });
      const level_3 = FrameArg.level(3);
      const level_2 = FrameArg.level(2);
      expect(level_3.in([context])).to.equal(level_2);
      expect(level_2.in([context])).to.equal(frame_arg);
    });
  });

  describe("FrameParam", () => {
    const frame_param = FrameParam.there();
    const context = new FrameString("context");
    const param = new FrameString("param");

    it("is created from 'there'", () => {
      expect(frame_param).to.be.instanceOf(FrameParam);
    });

    it("stringifies to _^", () => {
      expect(frame_param.toString()).to.equal("_^");
    });

    it("evaluates to the parameter", () => {
      expect(frame_param.in([context, param])).to.equal(param);
    });

    it("evaluates to higher-level parameters", () => {
      const frame_param_2 = FrameParam.level(2);
      const param2 = new FrameString("param level 2");
      const stack = [context, param, param2];
      expect(frame_param_2.toString()).to.equal("_^^");
      expect(frame_param_2.in(stack)).to.equal(param2);
    });
  });
});
