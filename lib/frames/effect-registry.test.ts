import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameName } from "./frame-name.ts";
import {
  afterCommit,
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
/** A callback stub that counts its invocations in `fired.count`. */
const counter = (): { callback: Frame; fired: { count: number } } => {
  const fired = { count: 0 };
  const callback = node();
  (callback as unknown as { call: () => Frame }).call = (): Frame => {
    fired.count += 1;
    return Frame.nil;
  };
  return { callback, fired };
};
// Every commit site closes through the notifying `afterCommit` (#529), so each
// one fires a value's subscribers. Only `MetaFrame.set` is known to reach a
// subscribed value from HC today (the #529 probe: `set_` fired once). The
// other sites reach only frames that cannot have subscribers yet, such as
// fresh copies, constructions and parser state, so HC cannot drive them here:
// each is driven through its method on a subscribed value instead.
describe("every commit site notifies (#529)", () => {
  /** Subscribes a counter to `managed`, runs `commit`, answers the count. */
  const firesOn = (managed: Frame, commit: () => unknown): number => {
    const { callback, fired } = counter();
    registerEffect(managed, callback);
    commit();
    return fired.count;
  };
  it("MetaFrame.set", () => {
    const managed = node();
    expect(firesOn(managed, () => managed.set("k", node()))).toBe(1);
  });
  it("MetaFrame.setParent (unreachable from HC on a subscribed value)", () => {
    const managed = node();
    expect(firesOn(managed, () => managed.setParent(node()))).toBe(1);
  });
  it("MetaFrame.match_here (unreachable from HC on a subscribed value)", () => {
    const managed = node();
    managed.set("/^p/", new FrameName("x"));
    // A lookup that only a pattern answers rewrites the bound name's source.
    expect(firesOn(managed, () => managed.get_here("pin"))).toBe(1);
  });
  it("MetaFrame.match_here fires once for two reads of the same name", () => {
    const managed = node();
    managed.set("/^p/", new FrameName("x"));
    // The second read finds the source already rewritten, so it changes
    // nothing and neither commits nor notifies.
    const fired = firesOn(managed, () => {
      managed.get_here("pin");
      managed.get_here("pin");
    });
    expect(fired).toBe(1);
  });
  it("Frame.replaceMember (unreachable from HC on a subscribed value)", () => {
    const managed = node();
    const member = node();
    managed.set("k", member);
    expect(firesOn(managed, () => managed.replaceMember(member, node())))
      .toBe(1);
  });
  it("FrameArray.replaceMember on an element (unreachable from HC on a subscribed value)", () => {
    const member = node();
    const managed = new FrameArray([member]);
    expect(firesOn(managed, () => managed.replaceMember(member, node())))
      .toBe(1);
  });
  it("FrameArray.collect (unreachable from HC on a subscribed value)", () => {
    const managed = new FrameArray([]);
    expect(firesOn(managed, () => managed.collect(node()))).toBe(1);
  });
  it("FrameArray.reset (unreachable from HC on a subscribed value)", () => {
    const managed = new FrameArray([node()]);
    expect(firesOn(managed, () => managed.reset())).toBe(1);
  });
  it("afterCommit, the helper every site above closes through", () => {
    const managed = node();
    expect(firesOn(managed, () => afterCommit(managed))).toBe(1);
  });
  it("registerEffect fires neither the new arrow nor the earlier ones", () => {
    const managed = node();
    const first = counter();
    const second = counter();
    registerEffect(managed, first.callback);
    expect(first.fired.count).toBe(0);
    registerEffect(managed, second.callback);
    // Re-declaring an arrow already registered fires nothing either.
    registerEffect(managed, first.callback);
    expect([first.fired.count, second.fired.count]).toEqual([0, 0]);
    // A later committed mutation fires each arrow once.
    managed.set("k", node());
    expect([first.fired.count, second.fired.count]).toEqual([1, 1]);
  });
});
