import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import * as frame from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

describe("FrameGroup", () => {
  const a_frame = new frame.FrameString("a");
  const b_frame = new frame.FrameString("b");
  const c_frame = new frame.FrameString("c");
  const frame_group = new frame.FrameGroup([a_frame], { c: c_frame });
  const multi_group = new frame.FrameGroup([a_frame, b_frame], { c: c_frame });
  const value = frame_group.in();

  it("is constructed from an array of frames", () => {
    expect(frame_group).toBeInstanceOf(frame.FrameGroup);
  });

  it("with multiple arguments, evaluates to FrameGroup", () => {
    const result = multi_group.in();
    expect(result).toBeInstanceOf(frame.FrameGroup);
  });

  it("with single argument, evaluates that", () => {
    expect(value).toBeInstanceOf(frame.FrameString);
  });

  it("includes meta in result", () => {
    const result = value.get("c");
    expect(result).toBeTruthy();
    expect(result).toEqual(c_frame);
  });

  describe("size operators (#411)", () => {
    /** The answer of the last statement in a source sequence. */
    const last = (source: string): frame.Frame =>
      evaluate(source).at(-1).asArray().at(-1)!;

    it("counts a group's elements and leaves, as an array's", () => {
      const table = [
        ["(1, 2)", "2", "2"],
        ["(1, [2, 3])", "2", "3"],
        ["((1, 2), (3, 4))", "2", "4"],
        ["(.a 1, 2, 3)", "2", "2"],
      ];
      for (const [group, count, leaves] of table) {
        const immediate = last(`${group}.#`);
        const recursive = last(`${group}.##`);

        expect(immediate.className()).toEqual("FrameCount");
        expect(immediate.toString()).toEqual(count);
        expect(recursive.className()).toEqual("FrameCount");
        expect(recursive.toString()).toEqual(leaves);
      }
    });

    it("counts a named group, and every occurrence of a shared one", () => {
      expect(last(".g (1, 2); g.#").toString()).toEqual("2");
      expect(last(".g (1, 2); [g, (g, 3)].##").toString()).toEqual("5");
    });

    it("leaves a group of one or none to the value it evaluates to", () => {
      // Neither is a group once evaluated: `(x)` is `x`, and `()` is nil,
      // which answers its argument.
      expect(last("([1, 2]).#").toString()).toEqual("2");
      expect(last("(5).##").toString()).toEqual("5");
      expect(last("().#").toString()).toEqual(".#");
    });

    it("refuses .## on a group that contains itself, while .# counts", () => {
      // Built directly, since the cycle is the subject and not how one arises.
      const items: frame.Frame[] = [a_frame];
      const direct = new frame.FrameGroup(items);
      items.push(direct);
      const through: frame.Frame[] = [];
      const indirect = new frame.FrameGroup(through);
      through.push(a_frame, new frame.FrameArray([indirect]));

      for (const g of [direct, indirect]) {
        const refusal = evaluate("$$.g.##", { g }).at(0);

        expect(refusal.is.error).toBe(true);
        expect(refusal.toString()).toEqual("$!.cyclic-aggregate .##");
        expect(evaluate("$$.g.#", { g }).at(0).toString()).toEqual("2");
      }
    });
  });
});
