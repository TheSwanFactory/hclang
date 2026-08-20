import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameArray,
  FrameExpr,
  FrameLazy,
  FrameNumber,
  FrameString,
} from "../frames.ts";

describe("FrameArray", () => {
  const a_frame = new FrameString("a");
  const b_frame = new FrameString("b");
  const frame_array = new FrameArray([a_frame, b_frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_array).toBeInstanceOf(FrameArray);
  });

  it("stringifies with brackets", () => {
    expect(frame_array.toString()).toEqual("[“a”, “b”]");
  });

  it("uses 'at' to access elements by index", () => {
    const first_element = frame_array.at(0);
    expect(first_element).toBeTruthy();
    expect(first_element).toEqual(a_frame);
  });

  it("uses only decimal digit keys for positional lookup", () => {
    const array = new FrameArray([a_frame, b_frame]);
    for (const key of ["Infinity", "1e3", "0x10", ""]) {
      const value = new FrameString(`property:${key}`);
      array.set(key, value);
      expect(array.get(key)).toBe(value);
    }

    array.set("0", new FrameString("metadata zero"));
    expect(array.get("0")).toBe(a_frame);
    expect(array.get("1")).toBe(b_frame);
  });

  it("uses -1 to access last element", () => {
    const last_element = frame_array.at(-1);
    expect(last_element).toBeTruthy();
    expect(last_element).toEqual(b_frame);
  });

  it("appends when called", () => {
    const array = new FrameArray([]);
    array.call(a_frame);
    array.call(b_frame);
    expect(array.toString()).toEqual("[“a”, “b”]");
  });

  it("appends when non-nil", () => {
    const array = new FrameArray([]);
    array.call(a_frame);
    array.call(Frame.nil);
    expect(array.toString()).toEqual("[“a”]");
  });

  it("evaluates its components into an array", () => {
    const string = new FrameString("string");
    const array_of_expr = new FrameArray([
      Frame.nil,
      string,
      new FrameExpr([
        new FrameString("prefix-"),
        new FrameString("-suffix"),
      ]),
    ]);
    const result = array_of_expr.in();
    const expr_result = result.at(2);

    expect(result).toBeInstanceOf(FrameArray);
    expect(result.at(0)).toEqual(Frame.nil);
    expect(result.at(1)).toEqual(string);
    expect(expr_result.toString()).toContain("prefix--suffix");
  });

  describe("instanceCopy", () => {
    it("gives a nested aggregate fresh identity in both planes", () => {
      const inner = new FrameArray([new FrameNumber("1")]);
      const outer = new FrameArray([inner]);
      outer.set("inner", inner);

      const clone = outer.instanceCopy();
      const copiedInner = clone.get("inner");

      expect(clone).not.toBe(outer);
      expect(copiedInner).not.toBe(inner);
      // One source aggregate stays one aggregate in the copy, so the data-plane
      // item and the metadata binding do not drift apart.
      expect(clone.at(0)).toBe(copiedInner);

      copiedInner.set("added", new FrameString("written through the copy"));
      expect(inner.get_here("added").is.missing).toBe(true);
    });

    it("shares atoms and closure bodies, which own no identity to write to", () => {
      const atom = new FrameNumber("1");
      const method = new FrameLazy([atom]);
      const owner = new FrameArray([atom]);
      owner.set("method", method);

      const clone = owner.instanceCopy();

      expect(clone.at(0)).toBe(atom);
      expect(clone.get("method")).toBe(method);
    });

    it("terminates when nested aggregates refer to each other", () => {
      const left = new FrameArray([]);
      const right = new FrameArray([left]);
      left.set("right", right);

      const clone = left.instanceCopy();

      expect(clone.get("right").at(0)).toBe(clone);
    });

    it("preserves a declared parent and takes a fresh id", () => {
      const base = new FrameArray([]);
      const derived = new FrameArray([]);
      derived.setParent(base);

      const clone = derived.instanceCopy();

      expect(clone.parent).toBe(base);
      expect(clone.hasDeclaredParent()).toBe(true);
      expect(clone.id).not.toEqual(derived.id);
    });
  });
});
