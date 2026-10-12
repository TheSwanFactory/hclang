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
import { evaluate } from "../execute/evaluate.ts";

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

  describe("properties print before elements", () => {
    it("prints a declaration once, from the property plane it wrote", () => {
      // Both planes held it before, so re-reading the output declared `.a`
      // twice: once from the echo and once from the property.
      expect(evaluate("[.a 1; a, 2]").at(0).toString())
        .toEqual("[.a 1; 1, 2]");
      expect(evaluate("[.a 1]").at(0).toString()).toEqual("[.a 1;]");
    });

    it("keeps an echo whose property landed somewhere else", () => {
      // An aggregate under construction absorbs declarations, so it holds the
      // property and prints it once.
      expect(evaluate("(.a 1, .b 2)").at(0).toString())
        .toEqual("(.a 1; .b 2;)");

      // A bare comma expression is not one, so its terms declare into the
      // enclosing scope and the echo is the only record left here. Dropping it
      // would print the row as `()`.
      expect(evaluate(".a 1, .b 2").at(0).toString())
        .toEqual("(.a 1, .b 2)");
    });

    it("prints an element-only aggregate unchanged", () => {
      expect(evaluate("[1, 2]").at(0).toString()).toEqual("[1, 2]");
    });
  });

  describe("a key the aggregate already assigns", () => {
    it("answers the refusal, because nothing well-formed was built", () => {
      expect(evaluate("[.0 9; 1, 2]").at(0).toString())
        .toEqual("$!.numeric-key .0");
    });

    it("leaves a refused write inspectable, with that write undone", () => {
      const result = evaluate(".owner [.A 1; .A 2; 3]");

      expect(result.at(0).toString()).toContain("$error{$is-constant .A}");
      expect(result.meta.owner.get_here("A").toString()).toEqual("1");
    });

    it("collects a refusal that arrived as a value", () => {
      // An aggregate holding an error is an ordinary value: that is what a
      // collected refusal looks like, so it is never promoted.
      expect(evaluate("[1, nope, 2]").at(0).toString())
        .toContain("$!.name-missing");
      expect(evaluate("[1, nope, 2]").at(0)).toBeInstanceOf(FrameArray);
    });
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

  describe("a declared application (#375)", () => {
    const summer = (body: string): string => `.Summer {[.total _; ${body}]}; `;
    /** The answer of the last statement in a source sequence. */
    const last = (source: string): Frame =>
      evaluate(source).at(-1).asArray().at(-1)!;

    it("calls apply_ instead of collecting, answering the receiver", () => {
      const result = last(
        summer(".apply_ {@total (total + _);}") +
          "([1, 2, 4] | (Summer 0)) .total",
      );
      expect(result.toString()).toEqual("7");
    });

    it("updates a copy through an immutable name and fills a mutable one", () => {
      const result = last(
        summer(".apply_ {@total (total + _);}") +
          ".s (Summer 0); .r_ (Summer 0); " +
          "[1, 2] | r_; [([1, 2] | s) .total, s.total, r_.total]",
      );
      expect(result.toString()).toEqual("[3, 0, 3]");
    });

    it("keeps the receiver when a non-mutating step answers nil", () => {
      const result = last(
        ".Max {[.best _; .apply {(_ .> best) ? {Max __}}]}; " +
          "([3, 9, 4] | (Max 0)) .best",
      );
      expect(result.toString()).toEqual("9");
    });

    it("is found on declared parents but not in the surrounding scope", () => {
      const setup = ".apply {_}; .Tick [.apply_ {@n (n + 1);}]; " +
        ".Ticks {[.^ Tick; .n 0]}; ";
      expect(last(setup + "([7, 7] | (Ticks())) .n").toString()).toEqual("2");
      expect(last(setup + "([1] 2) = [1, 2]").toString()).toEqual("<>");
    });

    it("never runs while the interpreter collects its own output", () => {
      // The file scope is the output array, so a top-level declaration lands
      // on it; collecting each statement's result must not call it.
      const result = evaluate(".apply {()}; 1; 2");
      expect(result.at(-1).asArray().at(-1)!.toString()).toEqual("2");
      expect(evaluate("[.apply {()}; 1, 2]").at(-1).toString())
        .toEqual("[.apply { () }; 1, 2]");
    });

    it("stops collecting, so a refusal applied to it stays a refusal", () => {
      const declared = last(
        summer(".apply_ {@total (total + _);}") + "Summer 0",
      );
      expect(declared.collects()).toBe(false);
      expect(new FrameArray([]).collects()).toBe(true);
    });
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
