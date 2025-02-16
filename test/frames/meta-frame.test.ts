import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import {
  type Context,
  contextEqual,
  contextString,
  Frame,
  FrameString,
  FrameSymbol,
  type IKeyValuePair,
} from "../../src/frames.ts";

describe("MetaFrame", () => {
  const frame = new Frame({ nil: Frame.nil });
  it("returns a copy", () => {
    const new_meta: Context = frame.meta_copy();
    expect(new_meta.nil).to.equal(Frame.nil);

    new_meta.symbol = new FrameSymbol("symbolic");
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

  it("gets values where key matches a pattern", () => {
    const pattern = "/[A-Z]/";
    const value = new FrameString("value");
    const key = "A";
    frame.set(pattern, value);
    const result = frame.get(key);
    expect(result.toString()).to.equal(value.toString());
  });

  it("gets Frame.missing if missing key", () => {
    const value = frame.get("missing");
    expect(value.is.missing).to.be.true;
  });

  it("get searches 'up' recursively if not get_here", () => {
    const key = "has";
    const value = new FrameString("candy");
    const grand = new FrameString("Grand", { has: value });
    const parent = new FrameString("Parent");
    const child = new FrameString("Child");

    child.up = parent;
    parent.up = grand;

    expect(grand.get_here(key)).to.equal(value);
    expect(parent.get_here(key).is.missing).to.be.true;
    expect(parent.get(key)).to.equal(value);
    expect(child.get_here(key).is.missing).to.be.true;
    expect(child.get(key)).to.equal(value);
  });

  it("returns metadata when called with a symbol", () => {
    const frame_symbol = FrameSymbol.for("nil");
    const result = frame.call(frame_symbol);
    expect(result).to.equal(Frame.nil);
  });

  describe("Frame.set", () => {
    const value = new Frame({ frame });
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
  describe("contextEqual", () => {
    const base: Context = { key: Frame.nil };
    const same: Context = { key: Frame.nil };
    const different: Context = { key: Frame.missing };
    const other: Context = { other: Frame.nil };
    const more: Context = { key: Frame.nil, other: Frame.nil };

    it("returns true for identical contexts", () => {
      expect(contextEqual(base, same)).to.be.true;
    });

    it("returns false for different contexts", () => {
      expect(contextEqual(base, different)).to.be.false;
      expect(contextEqual(base, more)).to.be.false;
      expect(contextEqual(base, other)).to.be.false;
    });
  });
  describe("contextString", () => {
    const context: Context = { nil: Frame.nil, all: Frame.all };
    const result = contextString(context);
    it("returns a string", () => {
      expect(result).to.be.a("string");
    });
    it("returns a string of meta_pairs", () => {
      expect(result).to.equal(".nil (); .all <>;");
    });
  });
});
