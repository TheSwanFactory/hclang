import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  type Context,
  Frame,
  FrameString,
  FrameSymbol,
  type IKeyValuePair,
} from "../frames.ts";

describe("MetaFrame", () => {
  const frame = new Frame({ nil: Frame.nil });
  it("returns a copy", () => {
    const new_meta: Context = frame.meta_copy();
    expect(new_meta.nil).toEqual(Frame.nil);

    new_meta.symbol = new FrameSymbol("symbolic");
    expect(frame.toString()).toEqual("(.nil ();)");

    const new_frame = new Frame(new_meta);
    expect(new_frame.get("nil")).toEqual(Frame.nil);
    expect(new_frame.toString()).toEqual("(.nil (); .symbol symbolic;)");
  });

  it("returns list of meta_keys", () => {
    const keys = frame.meta_keys();
    expect(keys).toEqual(["nil"]);
  });

  it("returns list of meta_pairs of type IKeyValuePair[]", () => {
    const pairs: IKeyValuePair[] = frame.meta_pairs();
    expect(pairs).toEqual([["nil", Frame.nil]]);
  });

  it("stringifies meta_pairs as `.key value;`", () => {
    expect(frame.meta_string()).toEqual(".nil ();");
  });

  it("gets values from context with string key", () => {
    expect(frame.get_here("nil")).toEqual(Frame.nil);
    expect(frame.get("nil")).toEqual(Frame.nil);
  });

  it("gets values where key matches a pattern", () => {
    const pattern = "/[A-Z]/";
    const value = new FrameString("value");
    const key = "A";
    frame.set(pattern, value);
    const result = frame.get(key);
    expect(result.toString()).toEqual(value.toString());
  });

  it("gets Frame.missing if missing key", () => {
    const value = frame.get("missing");
    expect(value.is.missing).toBe(true);
  });

  it("get searches 'up' recursively if not get_here", () => {
    const key = "has";
    const value = new FrameString("candy");
    const grand = new FrameString("Grand", { has: value });
    const parent = new FrameString("Parent");
    const child = new FrameString("Child");

    child.up = parent;
    parent.up = grand;

    expect(grand.get_here(key)).toEqual(value);
    expect(parent.get_here(key).is.missing).toBe(true);
    expect(parent.get(key)).toEqual(value);
    expect(child.get_here(key).is.missing).toBe(true);
    expect(child.get(key)).toEqual(value);
  });

  describe("visibility", () => {
    const publicValue = new FrameString("public");
    const protectedValue = new FrameString("protected");
    const privateValue = new FrameString("private");
    const parent = new Frame();
    const owner = new Frame({
      name: publicValue,
      _protected: protectedValue,
      __private: privateValue,
    });
    const child = new Frame();
    const peer = new Frame();
    owner.up = parent;
    child.up = owner;
    peer.up = parent;

    it("allows the owner to read every visibility", () => {
      expect(owner.get("name", owner)).toBe(publicValue);
      expect(owner.get("protected", owner)).toBe(protectedValue);
      expect(owner.get("private", owner)).toBe(privateValue);
    });

    it("allows children to read public and protected values", () => {
      expect(owner.get("name", child)).toBe(publicValue);
      expect(owner.get("protected", child)).toBe(protectedValue);
      expect(owner.get("private", child).toString()).toEqual(
        "$!.is-private .private",
      );
    });

    it("denies protected and private values to parents and peers", () => {
      for (const origin of [parent, peer]) {
        expect(owner.get("name", origin)).toBe(publicValue);
        expect(owner.get("protected", origin).toString()).toEqual(
          "$!.is-protected .protected",
        );
        expect(owner.get("private", origin).toString()).toEqual(
          "$!.is-private .private",
        );
      }
    });

    it("does not fall through a denied binding to an ancestor", () => {
      parent.set("private", publicValue);
      const denied = owner.get("private", child);

      expect(denied.is.error).toBe(true);
      expect(denied.toString()).toEqual("$!.is-private .private");
    });
  });

  it("returns metadata when called with a symbol", () => {
    const frame_symbol = FrameSymbol.for("nil");
    const result = frame.call(frame_symbol);
    expect(result).toEqual(Frame.nil);
  });

  describe("Frame.set", () => {
    const value = new Frame({ frame });
    const context = new Frame();
    const new_context = context.set("key", value);

    it("returns (mutable) this", () => {
      expect(new_context).toBeInstanceOf(Frame);
      expect(new_context).toEqual(context);
    });

    it("sets metadata in a Frame", () => {
      const result = context.get("key");
      expect(result).toEqual(value);
    });
  });
});
