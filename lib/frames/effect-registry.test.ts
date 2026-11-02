import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import {
  hasEffectSubscribers,
  installEffectInvoker,
  notifyEffect,
  registerEffect,
} from "./effect-registry.ts";

/** A managed value that records how many times a mutation committed on it. */
const node = (): Frame => new FrameArray([]);

// Install the invocation strategy this unit tests against directly: call the
// callback with the managed value, matching what the runtime installs. Loading
// this module alone would otherwise leave the invoker uninstalled.
installEffectInvoker((callback: Frame, managed: Frame): Frame =>
  callback.call(managed, Frame.nil)
);

describe("effect registry (006.17 §3-4)", () => {
  it("fires a registered callback on a committed named-property mutation", () => {
    const managed = node();
    let fired = 0;
    // The callback is any Frame; the installed invoker calls it. Here a stub
    // counts invocations. (The runtime installs a closure-calling invoker.)
    const callback = node();
    (callback as unknown as { call: () => Frame }).call = (): Frame => {
      fired += 1;
      return Frame.nil;
    };
    registerEffect(managed, callback);

    expect(hasEffectSubscribers(managed)).toBe(true);
    managed.set("value", new FrameArray([]));
    expect(fired).toBe(1);
  });

  it("does not fire when a write stores the identical value", () => {
    const managed = node();
    let fired = 0;
    const callback = node();
    (callback as unknown as { call: () => Frame }).call = (): Frame => {
      fired += 1;
      return Frame.nil;
    };
    const same = new FrameArray([]);
    managed.set("value", same);
    registerEffect(managed, callback);

    managed.set("value", same); // no change: previous === value
    expect(fired).toBe(0);
  });

  it("is idempotent per (managed, callback) pair", () => {
    const managed = node();
    let fired = 0;
    const callback = node();
    (callback as unknown as { call: () => Frame }).call = (): Frame => {
      fired += 1;
      return Frame.nil;
    };
    registerEffect(managed, callback);
    registerEffect(managed, callback); // same identity, recorded once

    managed.set("value", new FrameArray([]));
    expect(fired).toBe(1);
  });

  it("fires every distinct callback in registration order", () => {
    const managed = node();
    const order: number[] = [];
    const make = (tag: number): Frame => {
      const cb = node();
      (cb as unknown as { call: () => Frame }).call = (): Frame => {
        order.push(tag);
        return Frame.nil;
      };
      return cb;
    };
    registerEffect(managed, make(1));
    registerEffect(managed, make(2));

    managed.set("value", new FrameArray([]));
    expect(order).toEqual([1, 2]);
  });

  it("bounds reentrancy: a callback mutating its own value does not recurse", () => {
    const managed = node();
    let fired = 0;
    const callback = node();
    (callback as unknown as { call: () => Frame }).call = (): Frame => {
      fired += 1;
      // A nested mutation of the same value during delivery must not re-enter
      // this callback set, or it would not terminate.
      if (fired < 3) managed.set("value", new FrameArray([]));
      return Frame.nil;
    };
    registerEffect(managed, callback);

    managed.set("value", new FrameArray([]));
    expect(fired).toBe(1);
  });

  it("is a no-op for a value with no subscribers", () => {
    const managed = node();
    expect(hasEffectSubscribers(managed)).toBe(false);
    // Must not throw and must do nothing observable.
    notifyEffect(managed);
    managed.set("value", new FrameArray([]));
    expect(hasEffectSubscribers(managed)).toBe(false);
  });
});
