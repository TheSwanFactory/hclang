import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import * as frame from "../frames.ts";

/** Any id substituted for a frame already being rendered. */
const anId = /\$:\w+\.\d+/;

/**
 * Cyclic frame graphs are representable, so rendering must terminate on them.
 * Each case builds the cycle directly rather than through source, because the
 * guarantee is about the formatter and must hold however the graph was built:
 * source input must never reach a host `RangeError`.
 */
describe("stringify cycle detection", () => {
  it("renders a metadata self-reference as an id", () => {
    const self = new frame.Frame();
    self.set("target", self);

    const result = self.toString();
    expect(result).toContain(".target");
    expect(result).toContain(self.id);
  });

  it("renders an aggregate that contains itself", () => {
    const array = new frame.FrameArray([]);
    array.asArray().push(array);

    expect(array.toString()).toContain(array.id);
    expect(array.dataString()).toContain(array.id);
  });

  it("renders a mutual metadata cycle between two frames", () => {
    const left = new frame.Frame();
    const right = new frame.Frame();
    left.set("right", right);
    right.set("left", left);

    expect(left.toString()).toMatch(anId);
    expect(right.toString()).toMatch(anId);
  });

  it("renders an aggregate reached through metadata and data", () => {
    const inner = new frame.FrameArray([new frame.FrameNumber("1")]);
    const outer = new frame.FrameArray([inner]);
    inner.set("owner", outer);

    const result = outer.toString();
    expect(result).toContain("1");
    expect(result).toContain(".owner");
    expect(result).toMatch(anId);
  });

  it("renders a closure body that contains the closure", () => {
    const body = new frame.FrameExpr([]);
    const lazy = new frame.FrameLazy([body]);
    body.asArray().push(lazy);

    expect(lazy.toString()).toMatch(anId);
  });

  it("still renders a repeated acyclic value in full", () => {
    // Only re-entrancy substitutes an id: the same value used twice in one
    // aggregate is not a cycle and must render both times.
    const shared = new frame.FrameNumber("7");
    const array = new frame.FrameArray([shared, shared]);

    expect(array.toString()).toEqual("[7, 7]");
  });

  it("restores the guard after a render throws", () => {
    const boom = new (class extends frame.Frame {
      public override toString(): string {
        throw new Error("boom");
      }
    })();
    const holder = new frame.FrameArray([boom]);

    expect(() => holder.toString()).toThrow("boom");
    expect(() => holder.toString()).toThrow("boom");

    const array = new frame.FrameArray([new frame.FrameNumber("7")]);
    expect(array.toString()).toEqual("[7]");
  });
});
