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
    it("always returns the same FrameArg object", () => {
      const frame_arg_2 = FrameArg.for(symbol);
      expect(frame_arg).to.equal(frame_arg_2);
    });
  });
});
