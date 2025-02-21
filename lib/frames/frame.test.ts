import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import { Frame, NilContext } from "../frames.ts";

describe("Frame", () => {
  const frame = new Frame({ nil: Frame.nil });

  it("is constructed from a dictionary", () => {
    expect(frame).to.be.instanceOf(Frame);
  });

  it("has a unique nil for a property", () => {
    const nil = Frame.nil;
    expect(nil).to.be.instanceOf(Frame);
    expect(Frame.nil).to.equal(nil);
  });

  it("returns argument when called with non-nil", () => {
    const frame2 = new Frame(NilContext, false);
    const result = frame.call(frame2);
    expect(result).to.equal(frame2);
  });

  it("returns self when called with nil", () => {
    const result = frame.call(Frame.nil);
    expect(result).to.equal(frame);
  });

  it("stringifies to context", () => {
    expect(Frame.nil.toString()).to.equal("()");
    expect(frame.toString()).to.equal("(.nil ();)");
  });

  it("is in-dependent of context (literal)", () => {
    expect(frame.in()).to.equal(frame);
  });

  describe("equals", () => {
    it("returns true for identical frames", () => {
      const frame2 = new Frame({ nil: Frame.nil });
      expect(frame.isEqualTo(frame2)).to.be.true;
      expect(frame.equals(frame2)).to.equal(Frame.all);
    });

    it("returns false for different frames", () => {
      const frame2 = new Frame({ all: Frame.all });
      expect(frame.isEqualTo(frame2)).to.be.false;
      expect(frame.equals(frame2)).to.equal(Frame.nil);
    });
  });
});
