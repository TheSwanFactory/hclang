import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import "../frames.ts";

import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameHandle } from "./frame-handle.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameNumber } from "./frame-number.ts";
import { FrameString } from "./frame-string.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { BoundMethod } from "./bound-method.ts";
import { LookupProbe, withLookupProbe } from "./reference-tracking.ts";

describe("FrameHandle", () => {
  const target = (): FrameArray =>
    new FrameArray([new FrameNumber("1")], {
      field: new FrameString("value"),
    });

  describe("transparency", () => {
    it("renders, exposes, and compares as its target does", () => {
      const value = target();
      const handle = new FrameHandle(value, false);

      expect(handle.toString()).toEqual(value.toString());
      expect(handle.dataString()).toEqual(value.dataString());
      expect(handle.metadataView()).toEqual(value.metadataView());
      expect(handle.asArray()).toEqual(value.asArray());
    });

    it("is invisible to equality in either direction", () => {
      const value = target();
      const handle = new FrameHandle(value, false);
      const twin = target();

      expect(handle.equals(twin)).toBe(value.equals(twin));
      expect(twin.equals(handle)).toBe(twin.equals(value));
    });

    it("unwraps to the identity a mutation must land on", () => {
      const value = target();
      const handle = new FrameHandle(value, true);

      expect(handle.unwrap()).toBe(value);
    });

    it("collects like its target, into a fresh aggregate", () => {
      for (const mutable of [false, true]) {
        const value = target();
        const element = value.asArray()[0];
        const handle = new FrameHandle(value, mutable);
        const added = new FrameNumber("2");

        const result = handle.call(added);

        expect(handle.collects()).toBe(true);
        expect(result).not.toBe(value);
        expect(result.toString()).toEqual("[.field “value”; 1, 2]");
        expect(result.asArray()[0]).toBe(element);
        expect(result.asArray()[1]).toBe(added);
        expect(value.toString()).toEqual("[.field “value”; 1]");
      }
    });

    it("applies as its target does when the target does not collect", () => {
      const value = new FrameString("text");
      const handle = new FrameHandle(value, false);
      const argument = new FrameNumber("3");

      expect(handle.collects()).toBe(false);
      expect(handle.apply(argument, Frame.nil).toString())
        .toEqual(value.apply(argument).toString());
      expect(value.toString()).toEqual("“text”");
    });
  });

  describe("caller-scoped lookup", () => {
    it("answers get_here with missing so the caller stays the origin", () => {
      const handle = new FrameHandle(target(), false);

      // The wrapper declines to resolve, which is what keeps visibility graded
      // against the frame that asked rather than against the handle.
      expect(handle.get_here("field").is.missing).toBe(true);
      // Full lookup still reaches the target.
      expect(handle.get("field").toString()).toEqual("“value”");
    });

    it("forwards an explicit origin to the target unchanged", () => {
      const value = new FrameArray([], {
        _guarded: new FrameString("protected"),
      });
      const handle = new FrameHandle(value, false);
      const stranger = new Frame();

      expect(handle.get("guarded", value).toString()).toEqual("“protected”");
      expect(handle.get("guarded", stranger).toString()).toContain(
        "$!.is-protected",
      );
    });

    it("terminates mutually targeting handles and still reaches globals", () => {
      const left = new FrameHandle(Frame.missing, false);
      const right = new FrameHandle(left, false);
      Reflect.set(left, "target", right);

      expect(left.get("absent").is.missing).toBe(true);
      expect(left.get("&&").is.missing).not.toBe(true);
    });
  });

  describe("bound methods", () => {
    const method = (): FrameLazy => new FrameLazy([FrameSymbol.for("field")]);
    const boundOn = (handle: FrameHandle, key: string): BoundMethod =>
      handle.get(key) as unknown as BoundMethod;

    it("pairs a discovered method with its receiver", () => {
      const value = target();
      value.set("read", method());
      const handle = new FrameHandle(value, false);

      const bound = handle.get("read");

      expect(bound).toBeInstanceOf(BoundMethod);
      expect(bound.call(Frame.nil).toString()).toEqual("“value”");
    });

    it("answers a closure held as an element as itself, not bound", () => {
      const element = method();
      const value = new FrameArray([element], { read: method() });
      const handle = new FrameHandle(value, true);

      // An element is data the aggregate holds; only a field is a method.
      expect(handle.get("0")).toBe(element);
      expect(handle.get("read")).toBeInstanceOf(BoundMethod);
    });

    it("never supplies a method's free names from its read context", () => {
      const value = new FrameArray([], {
        read: new FrameLazy([FrameSymbol.for("lexical")]),
      });
      const leftContext = new Frame({
        lexical: new FrameString("left"),
      });
      const rightContext = new Frame({
        lexical: new FrameString("right"),
      });
      const left = new FrameHandle(value, false, undefined, leftContext);
      const right = new FrameHandle(value, false, undefined, rightContext);

      // `read` was written in no scope that binds `lexical`, so reaching it
      // through either context answers missing rather than acquiring (#400).
      expect(boundOn(left, "read").call(Frame.nil).toString()).toContain(
        "$!.name-missing",
      );
      expect(boundOn(right, "read").call(Frame.nil).toString()).toContain(
        "$!.name-missing",
      );
      expect(value.up).toBe(Frame.missing);
    });

    it("reports a mutating method by its declared effect", () => {
      const value = target();
      value.set("write_", method());
      value.set("read", method());
      const handle = new FrameHandle(value, true);

      expect(boundOn(handle, "write_").isMutating()).toBe(true);
      expect(boundOn(handle, "read").isMutating()).toBe(false);
    });

    it("acts on the receiver itself through a mutable handle", () => {
      const value = target();
      value.set("write_", method());
      const handle = new FrameHandle(value, true);

      const result = boundOn(handle, "write_").call(Frame.nil);

      expect(result).toBe(value);
    });

    it("forks a copy-on-write member for a mutating method, except under a probe", () => {
      const bump = method();
      const member = (): FrameArray => new FrameArray([], { bump_: bump });
      const setup = () => {
        const inner = member();
        const holder = new FrameArray([], { inner_: inner });
        const graph = new WeakSet<Frame>([holder]);
        const handle = new FrameHandle(inner, true, graph, new Frame())
          .heldBy(holder);
        return { inner, holder, handle };
      };
      const probed = setup();
      const probe = new LookupProbe();
      withLookupProbe(probe, () => probed.handle.get("bump_"));
      expect(probed.holder.get_here("inner_")).toBe(probed.inner);
      expect(probe.answer).toBe(bump);
      const plain = setup();
      expect(plain.handle.get("bump_")).toBeInstanceOf(BoundMethod);
      expect(plain.holder.get_here("inner_")).not.toBe(plain.inner);
    });
    it("acts on an instance copy through an immutable handle", () => {
      const value = target();
      value.set("write_", method());
      const handle = new FrameHandle(value, false);

      const result = boundOn(handle, "write_").call(Frame.nil);

      // Functional update: the original identity is shielded and the call
      // evaluates to the new value.
      expect(result).not.toBe(value);
      expect(result.toString()).toEqual(value.toString());
    });
  });
});
