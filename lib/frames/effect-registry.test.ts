import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import {
  EFFECT_DELIVERY_LIMIT,
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

  it("delivers each nested commit as a new invocation (PR #475 review)", () => {
    const managed = node();
    const seen: string[] = [];
    const callback = node();
    (callback as unknown as { call: () => Frame }).call = (): Frame => {
      seen.push(`start ${seen.length}`);
      // Two nested commits of the same value during delivery: neither may be
      // dropped, and neither may recurse into the round in flight.
      if (seen.length === 1) {
        managed.set("value", new FrameArray([]));
        managed.set("value", new FrameArray([]));
      }
      seen.push("end");
      return Frame.nil;
    };
    registerEffect(managed, callback);
    managed.set("value", new FrameArray([]));
    // Three committed mutations, three invocations, each run to completion
    // before the next starts.
    expect(seen).toEqual([
      "start 0",
      "end",
      "start 2",
      "end",
      "start 4",
      "end",
    ]);
  });
  it("bounds a callback that keeps mutating its own value", () => {
    const managed = node();
    let fired = 0;
    const callback = node();
    (callback as unknown as { call: () => Frame }).call = (): Frame => {
      fired += 1;
      managed.set("value", new FrameArray([]));
      return Frame.nil;
    };
    registerEffect(managed, callback);
    expect(() => managed.set("value", new FrameArray([]))).toThrow(
      "$!.effect-delivery-limit",
    );
    expect(fired).toBe(EFFECT_DELIVERY_LIMIT);
    // The bound resets: a later commit is delivered afresh.
    (callback as unknown as { call: () => Frame }).call = (): Frame => {
      fired += 1;
      return Frame.nil;
    };
    managed.set("value", new FrameArray([]));
    expect(fired).toBe(EFFECT_DELIVERY_LIMIT + 1);
  });
  it("a failing callback stops neither its siblings nor the commit (PR #475 review)", () => {
    const managed = node();
    const order: string[] = [];
    const make = (tag: string, act: () => Frame): Frame => {
      const cb = node();
      (cb as unknown as { call: () => Frame }).call = (): Frame => {
        order.push(tag);
        return act();
      };
      return cb;
    };
    // An HC failure is a returned Frame; a host failure is a thrown exception.
    registerEffect(managed, make("hc", () => Frame.error("$!!.callback")));
    registerEffect(
      managed,
      make("host", () => {
        throw new Error("host failure");
      }),
    );
    registerEffect(managed, make("after", () => Frame.nil));
    const value = new FrameArray([]);
    // The host exception surfaces once every sibling has run.
    expect(() => managed.set("value", value)).toThrow("host failure");
    expect(order).toEqual(["hc", "host", "after"]);
    expect(managed.get("value")).toBe(value);
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
