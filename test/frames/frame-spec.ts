import chai = require("chai");
chai.use(require("chai-pretty-expect"));
const expect = chai.expect;
import { IKeyValuePair, Context, Frame, FrameArray, FrameString, FrameSymbol } from "../../src/frames";

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

  it("returns argument when called with non-nil", () => {
    const frame2 = new Frame(Void, false);
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

  describe("FrameMETA", () => {
    it("returns a copy", () => {
      const new_meta: Context = frame.meta_copy();
      expect(new_meta["nil"]).to.equal(Frame.nil);

      new_meta["symbol"] = new FrameSymbol("symbolic");
      expect(frame.toString()).to.equal("(.nil ();)");

      const new_frame = new Frame(new_meta);
      expect(new_frame.get("nil")).to.equal(Frame.nil);
      expect(new_frame.toString()).to.equal("(.nil (); .symbol symbolic;)");
    });

    it("returns list of meta_keys", () => {
      const keys = frame.meta_keys();
      expect(keys).to.eql(["nil"]);
    });

    it("returns list of meta_pairs of type IKeyValuePair[]", () => {
      const pairs: IKeyValuePair[] = frame.meta_pairs();
      expect(pairs).to.eql([["nil", Frame.nil]]);
    });

    it("stringifies meta_pairs as `.key value;`", () => {
      expect(frame.meta_string()).to.equal(".nil ();");
    });

    it("gets values from context with string key", () => {
      expect(frame.get_here("nil")).to.equal(Frame.nil);
      expect(frame.get("nil")).to.equal(Frame.nil);
    });

    it("gets Frame.missing if missing key", () => {
      const value = frame.get("missing");
      expect(value).to.equal(Frame.missing);
    });

    it("get searches 'up' recursively if not get_here", () => {
      const key = "has";
      const value = new FrameString("candy");
      const grand = new FrameString("Grand", {has: value});
      const parent = new FrameString("Parent");
      const child = new FrameString("Child");

      child.up = parent;
      parent.up = grand;

      expect(grand.get_here(key)).to.equal(value);
      expect(parent.get_here(key)).to.equal(Frame.missing);
      expect(parent.get(key)).to.equal(value);
      expect(child.get_here(key)).to.equal(Frame.missing);
      expect(child.get(key)).to.equal(value);
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
    const new_context = context.set("key", value);

    it("returns (mutable) this", () => {
      expect(new_context).to.be.instanceOf(Frame);
      expect(new_context).to.equal(context);
    });

    it("sets metadata in a Frame", () => {
      const result = context.get("key");
      expect(result).to.equal(value);
    });
  });
});
