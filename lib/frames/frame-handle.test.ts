import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import "../frames.ts";

import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameHandle } from "./frame-handle.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameNumber } from "./frame-number.ts";
import { FrameString } from "./frame-string.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { BoundMethod } from "./bound-method.ts";

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

    it("keeps each read context live through a bound method", () => {
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

      expect(boundOn(left, "read").call(Frame.nil).toString()).toEqual(
        "“left”",
      );
      expect(boundOn(right, "read").call(Frame.nil).toString()).toEqual(
        "“right”",
      );
      leftContext.set("lexical", new FrameString("updated"));
      expect(boundOn(left, "read").call(Frame.nil).toString()).toEqual(
        "“updated”",
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
