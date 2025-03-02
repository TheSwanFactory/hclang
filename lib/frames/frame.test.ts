import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import { Frame, NilContext } from "../frames.ts";

describe("Frame", () => {
  const frame = new Frame({ nil: Frame.nil });

  it("is constructed from a dictionary", () => {
    expect(frame).toBeInstanceOf(Frame);
  });

  it("has a unique nil for a property", () => {
    const nil = Frame.nil;
    expect(nil).toBeInstanceOf(Frame);
    expect(Frame.nil).toEqual(nil);
  });

  it("returns argument when called with non-nil", () => {
    const frame2 = new Frame(NilContext, false);
    const result = frame.call(frame2);
    expect(result).toEqual(frame2);
  });

  it("returns self when called with nil", () => {
    const result = frame.call(Frame.nil);
    expect(result).toEqual(frame);
  });

  it("stringifies to context", () => {
    expect(Frame.nil.toString()).toEqual("()");
    expect(frame.toString()).toEqual("(.nil ();)");
  });

  it("is in-dependent of context (literal)", () => {
    expect(frame.in()).toEqual(frame);
  });

  describe("all", () => {
    it("is a Frame", () => {
      const all = Frame.all;
      expect(all).toBeInstanceOf(Frame);
    });

    it("has a unique all for all Frames", () => {
      const all = Frame.all;
      expect(all).toBeInstanceOf(Frame);
      expect(Frame.all).toEqual(all);
    });

    it("returns self when called with all, nil, or any frame", () => {
      expect(Frame.all.call(Frame.all)).toEqual(Frame.all);
      expect(Frame.all.call(Frame.nil)).toEqual(Frame.all);
      expect(Frame.all.call(frame)).toEqual(Frame.all);
    });

    it("stringifies to <>", () => {
      expect(Frame.all.toString()).toEqual("<>");
    });

    it("always evaluates to itself", () => {
      expect(Frame.all.in()).toEqual(Frame.all);
    });
  });

  describe("equals", () => {
    it("returns true for identical frames", () => {
      const frame2 = new Frame({ nil: Frame.nil });
      expect(frame.isEqualTo(frame2)).to.be.true;
      expect(frame.equals(frame2)).toEqual(Frame.all);
    });

    it("returns false for different frames", () => {
      const frame2 = new Frame({ all: Frame.all });
      expect(frame.isEqualTo(frame2)).to.be.false;
      expect(frame.equals(frame2)).toEqual(Frame.nil);
    });
  });
});
