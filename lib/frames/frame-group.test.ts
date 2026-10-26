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

  describe("integer repetition (v0.22.0)", () => {
    /** The answer of the last line; earlier lines are setup statements. */
    const answer = (...lines: string[]): frame.Frame =>
      evaluate(lines.join("\n")).at(-1);
    const text = (...lines: string[]): string => answer(...lines).toString();

    it("concatenates a group's elements into a group", () => {
      expect(text("3 (1, 2)")).toEqual("(1, 2, 1, 2, 1, 2)");
      expect(answer("3 (1, 2)")).toBeInstanceOf(frame.FrameGroup);
      expect(text(".g (7, 8);", "[2 g, g]")).toEqual("[(7, 8, 7, 8), (7, 8)]");
    });

    it("answers nil only when no term is left, since `()` is nil", () => {
      const pair = new frame.FrameGroup([a_frame, b_frame]);

      expect(new frame.FrameCount(0n).apply(pair, frame.Frame.nil))
        .toBe(frame.Frame.nil);
      expect(text("[(0 (1, 2)) === (), [] (0 (1, 2))]")).toEqual("[<>, []]");
    });

    it("keeps a group's properties once, with or without elements", () => {
      // A held property leaves its echo as a term, so a group of properties
      // alone is still a group, whatever the count.
      expect(text(".gr (.k 1; .j 2;);", "[(2 gr).k, (2 gr).#, (2 gr) === ()]"))
        .toEqual("[1, 0, ()]");
      expect(answer(".gp (.k 1; 4, 5);", "0 gp"))
        .toBeInstanceOf(frame.FrameGroup);
      expect(text(".gp (.k 1; 4, 5);", "[0 gp, (0 gp).k, 2 gp]"))
        .toEqual("[(.k 1;), 1, (.k 1; 4, 5, 4, 5)]");
    });
  });

  describe("evaluation, every time afresh (#404)", () => {
    /** The answer of the last line; earlier lines are setup statements. */
    const text = (...lines: string[]): string =>
      evaluate(lines.join("\n")).at(-1).toString();

    it("answers a fresh group and leaves the one it evaluated alone", () => {
      const group = new frame.FrameGroup([a_frame, b_frame], { c: c_frame });
      const result = group.in();

      expect(result).toBeInstanceOf(frame.FrameGroup);
      expect(result).not.toBe(group);
      expect(result.get("c")).toEqual(c_frame);
      expect(group.asArray()).toEqual([a_frame, b_frame]);
    });

    it("answers each call's values as a closure's body, as brackets do", () => {
      expect(text(".f {(.a _; .b (a + 1);)};", "[f 1, f 2]"))
        .toEqual("[(.a 1; .b 2;), (.a 2; .b 3;)]");
      expect(text(".f {[.a _; .b (a + 1);]};", "[f 1, f 2]"))
        .toEqual("[[.a 1; .b 2;], [.a 2; .b 3;]]");
      expect(text(".g {(_, 1)};", "[g 1, g 2]")).toEqual("[(1, 1), (2, 1)]");
      expect(text(".c {(.a _, 7)};", "[(c 1).a, (c 2).a, (c 3).#]"))
        .toEqual("[1, 2, 1]");
    });

    it("answers each element's values in a map block", () => {
      expect(text("[1, 2] & {(_, _)}")).toEqual("[(1, 1), (2, 2)]");
    });

    it("keeps a closure's source, which used to print the first answer", () => {
      expect(text(".q {(_, 1)};", "q 5;", "q"))
        .toEqual(text(".q {(_, 1)};", "q"));
    });

    it("searches an aggregate's own declarations first, as spec 7 §2 orders", () => {
      // A name an aggregate literal declares shadows the same name in the
      // enclosing scope, as a closure's local does. The literal's own layer
      // used to join lookup last, so it read the outer value (Figure 004.09a).
      const answers = (source: string, expected: string) =>
        expect(evaluate(source).toString()).toContain(expected);
      answers(".gb 1; (.gb 2; gb)", "(.gb 2; 2)");
      answers(".gb 1; [.gb 2; gb]", "[.gb 2; 2]");
      answers("{.a 1; (.a 2; a)} ()", "(.a 2; 2)");
      answers("{.a 1; [.a 2; a]} ()", "[.a 2; 2]");
      // A name the literal does not declare still reads the enclosing one.
      answers("{.e 1; (.f 2; [e, f])} ()", "(.f 2; [1, 2])");
    });

    it("collects a group of one's declarations on each call alone", () => {
      // Each call answers what the literal with that call's value answers. The
      // first call used to leave its declaration on the group, so later calls
      // answered a different shape.
      expect(text(".h {(.a _;)};", "[h 1, h 2]"))
        .toEqual(text("[(.a 1;), (.a 2;)]"));
    });
  });
});
