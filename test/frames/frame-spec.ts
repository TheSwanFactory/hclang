import { expect } from "chai";
import { IKeyValuePair, Frame, FrameArray, FrameSymbol } from "../../src/frames";

describe("Frame", () => {
  const frame = new Frame({nil: Frame.nil});

  it("is constructed from a dictionary", () => {
    expect(frame).to.be.instanceOf(Frame);
  });

  it("has a unique nil for a property", () => {
    const nil = Frame.nil;
    expect(nil).to.be.instanceOf(Frame);
    expect(Frame.nil).to.equal(nil);
  });

  it("returns argument when called", () => {
    const frame2 = new Frame();
    const result = frame.call(frame2);
    expect(result).to.equal(frame2);
  });

  it("stringifies to context", () => {
    expect(Frame.nil.toString()).to.equal("()");
    expect(frame.toString()).to.equal("(.nil ();)");
  });

  it("is in-dependent of context (literal)", () => {
    expect(frame.in()).to.equal(frame);
  });

  describe("FrameMETA", () => {
    it("returns list of meta_keys", () => {
      const keys = frame.meta_keys();
      expect(keys).to.eql(["nil"]);
    });

    it("returns list of meta_pairs of type IKeyValuePair[]", () => {
      const pairs: IKeyValuePair[] = frame.meta_pairs();
      expect(pairs).to.eql([["nil", Frame.nil]]);
    });

    it("stringifies meta_pairs as `.key value;`", () => {
      expect(frame.meta_string()).to.eql(".nil ();");
    });

    it("gets values from context with string key", () => {
      expect(frame.get_here("nil")).to.equal(Frame.nil);
      expect(frame.get("nil")).to.equal(Frame.nil);
    });

    it("gets Frame.missing if missing key", () => {
      const value = frame.get("missing");
      expect(value).to.equal(Frame.missing);
    });

    it("get searches 'up' if not get_here", () => {
      const key = "has";
      const parent = new Frame({has: frame});
      const child = new Frame();
      child.set(Frame.kUP, parent);

      expect(parent.get_here(key)).to.equal(frame);
      expect(child.get_here(key)).to.equal(Frame.missing);
      expect(child.get(key)).to.equal(frame);
    });

    it("returns metadata when called with a symbol", () => {
      const frame_symbol = FrameSymbol.for("nil");
      const result = frame.call(frame_symbol);
      expect(result).to.equal(Frame.nil);
    });
  });

  describe("FrameSET", () => {
    const value = new Frame({frame: frame});
    const context = new Frame();
    const new_context = context.set(Frame.kUP, value);

    it("returns (mutable) this", () => {
      expect(new_context).to.be.instanceOf(Frame);
      expect(new_context).to.equal(context);
    });

    it("sets metadata in a Frame", () => {
      const result = context.get(Frame.kUP);
      expect(result).to.equal(value);
    });

    it("can change up path", () => {
      const result = context.get("frame");
      expect(result).to.equal(frame);
    });
  });
});

describe("FrameArray", () => {
  const frame = new Frame();
  const frame_array = new FrameArray([frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_array).to.be.instanceOf(FrameArray);
  });

  it("uses 'at' to access elements by index", () => {
    const first_element = frame_array.at(0);
    expect(first_element).to.be.ok;
    expect(first_element).to.be.instanceOf(Frame);
  });

  it("evalates its components", () => {
    expect(frame_array).to.be.instanceOf(FrameArray);
  });

});
