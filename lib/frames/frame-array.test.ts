import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
  FrameInt,
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

  describe("indexing", () => {
    it("addresses elements, so a property never shifts an index", () => {
      const aggregate = evaluate("[.k 1; 4, 5]").at(0);

      expect(aggregate.at(0).toString()).toEqual("4");
      expect(aggregate.at(-1).toString()).toEqual("5");
      expect(aggregate.at(2).toString()).toContain("[0..2].2");
      expect(evaluate("[.k 1; 4, 5] .1").at(0).toString()).toEqual("5");
    });

    it("skips a declared parent's echo", () => {
      expect(evaluate("[.^ [.m 1]; 4, 5] .0").at(0).toString()).toEqual("4");
    });
  });

  describe("size operators (#411)", () => {
    /** The answer of the last statement in a source sequence. */
    const last = (source: string): Frame =>
      evaluate(source).at(-1).asArray().at(-1)!;
    const names = ".a 1; .b 2; .c 3; ";

    it("counts elements with .# and terminals with .##, as counts", () => {
      const table = [
        ["[a, b, c]", "3", "6"],
        ["[[a, b], [c]]", "2", "6"],
        ["[]", "0", "1"],
        ["[[], [a]]", "2", "2"],
      ];
      for (const [aggregate, count, leaves] of table) {
        const immediate = last(`${names}${aggregate}.#`);
        const recursive = last(`${names}${aggregate}.##`);

        expect(immediate.className()).toEqual("FrameCount");
        expect(immediate.toString()).toEqual(count);
        expect(recursive.className()).toEqual("FrameCount");
        expect(recursive.toString()).toEqual(leaves);
      }
    });

    it("counts elements, never properties", () => {
      expect(last("[.meta 1; 2, 3] .#").toString()).toEqual("2");
      expect(last("[.meta [1, 2]; [3]] .##").toString()).toEqual("3");
    });

    it("counts an aggregate with no elements as one terminal (010.02)", () => {
      // The terminals of a nested frame are the nodes with nothing below
      // them, so the empty frame is one, at the root or nested. This is
      // Figure terminal count on property-free nested arrays.
      const table = [
        ["[]", "1"],
        ["[[]]", "1"],
        ["[[], []]", "2"],
        ["[[], [[], []]]", "3"],
        ["[[[], []], [[], [], []]]", "5"],
      ];
      for (const [aggregate, terminals] of table) {
        const answer = last(`${aggregate}.##`);

        expect(answer.className()).toEqual("FrameCount");
        expect(answer.toString()).toEqual(terminals);
      }
      // An atom is a terminal and an empty frame is one, side by side.
      expect(last("[1, [2, []]].##").toString()).toEqual("4");
      expect(last("[[], 5, [[], “ab”]].##").toString()).toEqual("9");
      // Properties are not elements, so a frame holding only properties is a
      // terminal, and repeating a frame zero times leaves one terminal.
      expect(last("[.k 1] .##").toString()).toEqual("1");
      expect(last("[[.k 1], 2] .##").toString()).toEqual("3");
      expect(last("(0 [1, 2]).##").toString()).toEqual("1");
    });

    it("weights nested values by their native Size", () => {
      expect(last("[5, 6].##").toString()).toEqual("11");
      expect(last("[“ab”, 12345, ()].##").toString()).toEqual("12348");
    });

    it("uses group data Sizes and schema alternative counts", () => {
      // Groups sum their data; schemas count alternatives without descending.
      expect(last("[“ab”, (1, 2), [12345]].##").toString()).toEqual("12350");
      expect(last("[1, (2, [3, (4, 5)])].##").toString()).toEqual("15");
      expect(last("[<1, 2>, 3].##").toString()).toEqual("5");
      // `.#` still counts each of them as one element.
      expect(last("[“ab”, (1, 2), [12345]].#").toString()).toEqual("3");
    });

    it("enters a closure, whose elements are the terms of its body", () => {
      // A closure is a list too. Applying one calls it, so it has no size as a
      // receiver, but inside an aggregate `.##` counts its body's terms, and an
      // empty body is one terminal.
      expect(last("[{}, 1].##").toString()).toEqual("2");
      expect(last("[{_ + 1}].##").toString()).toEqual("3");
      expect(last("[{_ + 1}].#").toString()).toEqual("1");
    });

    it("counts a shared branch at every occurrence", () => {
      const shared = `${names}.x [a, b]; `;

      expect(last(`${shared}x.#`).toString()).toEqual("2");
      expect(last(`${shared}[x, x].##`).toString()).toEqual("6");
      expect(last(`${shared}[x, [x]].##`).toString()).toEqual("6");
    });

    it("refuses .## on an aggregate that contains itself, while .# counts", () => {
      // Built directly, since the cycle is the subject and not how one arises.
      const direct = new FrameArray([a_frame]);
      direct.collect(direct);
      const indirect = new FrameArray([]);
      indirect.collect(new FrameArray([indirect]));

      for (const xs of [direct, indirect]) {
        const refusal = evaluate("$$.xs.##", { xs }).at(0);

        expect(refusal.is.error).toBe(true);
        expect(refusal.toString()).toEqual("$!.cyclic-aggregate .##");
      }
      expect(evaluate("$$.xs.#", { xs: direct }).at(0).toString())
        .toEqual("2");
      expect(evaluate("$$.xs.#", { xs: indirect }).at(0).toString())
        .toEqual("1");
    });

    it("still refuses a cycle when empty frames sit beside it (010.02)", () => {
      // An empty frame answers 1 before it joins the walk's path, so a cycle
      // must still be found past one, at the root and nested.
      const empty = new FrameArray([]);
      const beside = new FrameArray([empty]);
      beside.collect(beside);
      const deep = new FrameArray([new FrameArray([])]);
      deep.collect(new FrameArray([new FrameArray([]), deep]));

      for (const xs of [beside, deep]) {
        const refusal = evaluate("$$.xs.##", { xs }).at(0);

        expect(refusal.is.error).toBe(true);
        expect(refusal.toString()).toEqual("$!.cyclic-aggregate .##");
      }
    });

    it("counts a shared empty frame at every occurrence (010.02)", () => {
      // The empty frame is never added to the path, so meeting it again,
      // beside itself or below, is a second terminal rather than a cycle.
      const empty = new FrameArray([]);
      const twice = new FrameArray([empty, empty]);
      const below = new FrameArray([empty, new FrameArray([empty, empty])]);

      expect(evaluate("$$.xs.##", { xs: twice }).at(0).toString())
        .toEqual("2");
      expect(evaluate("$$.xs.##", { xs: below }).at(0).toString())
        .toEqual("3");
    });
  });

  describe("signed residual .### (010.04)", () => {
    /** The answer of the last statement in a source sequence. */
    const last = (source: string): Frame =>
      evaluate(source).at(-1).asArray().at(-1)!;

    it("folds immediate terminal counts with alternating signs, as a FrameInt", () => {
      const table = [
        ["[]", "0"],
        ["[[]]", "1"],
        ["[[], []]", "0"],
        ["[[], [[], []]]", "-1"],
        ["[[[], []], []]", "1"],
        ["[[], [[], []], [[], [], []]]", "2"],
        // Three levels: the children have 2, 3 and 3 terminals, and each
        // child takes one sign however deep its terminals lie.
        ["[[[], [[]]], [[[], []], []], [[[[], [], []]]]]", "2"],
        ["[[[], []], [[], [], [], [], []]]", "-3"],
      ];
      for (const [figure, residual] of table) {
        const answer = last(`${figure}.###`);

        expect(answer, figure).toBeInstanceOf(FrameInt);
        expect(answer, figure).not.toBeInstanceOf(FrameCount);
        expect(answer.className(), figure).toEqual("FrameInt");
        expect(answer.toString(), figure).toEqual(residual);
      }
    });

    it("leaves .# and .## counts on the same Figures", () => {
      const answer = last("[[], [[], []]].##");

      expect(answer.className()).toEqual("FrameCount");
      expect(answer.toString()).toEqual("3");
      expect(last("[[], [[], []]].#").toString()).toEqual("2");
    });

    it("counts a shared branch at every occurrence", () => {
      expect(last(".x [[], []]; [x, x, [x]].###").toString()).toEqual("2");
      const empty = new FrameArray([]);
      const xs = new FrameArray([empty, new FrameArray([empty, empty])]);
      expect(evaluate("$$.xs.###", { xs }).at(0).toString()).toEqual("-1");
    });

    it("ignores properties and a declared parent at every level", () => {
      const table = [
        ["[.k 1; []]", "1"],
        ["[[], [.k 1; [], []]]", "-1"],
        ["[.^ [.m 1]; [[], []]]", "2"],
        ["[.k 1]", "0"],
        ["[[], [.^ [.m 1]; .k 2; [], []]]", "-1"],
        ["[.^ [.m 1]; .k 2]", "0"],
      ];
      for (const [figure, residual] of table) {
        const answer = last(`${figure}.###`);

        expect(answer.className(), figure).toEqual("FrameInt");
        expect(answer.toString(), figure).toEqual(residual);
      }
    });

    it("extends residual to mixed arrays and evaluated groups", () => {
      for (
        const [host, expected] of [
          ["[1, []]", "0"],
          ["[[], [1]]", "0"],
          ["[[], [“ab”]]", "-1"],
          ["[[], ([], [])]", "-1"],
          ["([], [])", "0"],
        ]
      ) expect(last(`${host}.###`).toString(), host).toEqual(expected);
    });

    it("answers nil on schemas and Count parity on atoms (011.18k)", () => {
      // nil, so the source answers no value.
      expect(evaluate("<[], []>.###").toString()).toEqual("[]");
      for (
        const [source, parity] of [["“ab”", "0"], ["(0 - 5)", "1"], [
          "1.5",
          "1",
        ]]
      ) {
        expect(evaluate(`${source}.###`).toString(), source)
          .toEqual(`[${parity}]`);
      }
    });

    it("propagates the cycle error on an aggregate that contains itself", () => {
      const direct = new FrameArray([new FrameArray([])]);
      direct.collect(direct);
      const indirect = new FrameArray([new FrameArray([])]);
      indirect.collect(new FrameArray([new FrameArray([]), indirect]));

      for (const xs of [direct, indirect]) {
        expect(evaluate("$$.xs.###", { xs }).at(0).toString())
          .toEqual("$!.cyclic-aggregate .##");
      }
    });
  });

  describe("a key the aggregate already assigns", () => {
    it("answers the refusal, because nothing well-formed was built", () => {
      expect(evaluate("[.0 9; 1, 2]").at(0).toString())
        .toEqual("$!.numeric-key .0");
    });

    it("leaves a refused write inspectable, with that write undone", () => {
      const result = evaluate(".owner [.A 1; .A 2; 3]");

      expect(result.asArray()[0].toString()).toContain(
        "$error{$is-constant .A}",
      );
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
    it("holds its own declaration echoes, so it renders and iterates alike", () => {
      const original = evaluate("[.v 1; 5]").at(-1);
      for (const copy of [original.instanceCopy(), original.collectingCopy()]) {
        expect(copy.toString()).toEqual(original.toString());
        expect(copy.elements().map(String)).toEqual(["5"]);
      }
    });

    it("shares a nested aggregate until a write copies it (#401)", () => {
      const inner = new FrameArray([new FrameNumber("1")]);
      const outer = new FrameArray([inner]);
      outer.set("inner", inner);

      const clone = outer.instanceCopy();

      expect(clone).not.toBe(outer);
      expect(clone.get("inner")).toBe(inner);
      expect(clone.at(0)).toBe(inner);

      // A write installs a copy of the member in both planes of the copy that
      // holds it, and leaves the original holding the original.
      const copiedInner = inner.instanceCopy();
      expect(clone.replaceMember(inner, copiedInner)).toBe(true);
      expect(clone.get("inner")).toBe(copiedInner);
      expect(clone.at(0)).toBe(copiedInner);
      expect(outer.get("inner")).toBe(inner);
      expect(outer.at(0)).toBe(inner);
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

    it("copies an aggregate that refers to itself without walking it", () => {
      const left = new FrameArray([]);
      const right = new FrameArray([left]);
      left.set("right", right);

      const clone = left.instanceCopy();

      expect(clone.get("right")).toBe(right);
      expect(clone.get("right").at(0)).toBe(left);
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

  describe("integer repetition (v0.22.0)", () => {
    /** The answer of the last line; earlier lines are setup statements. */
    const answer = (...lines: string[]): Frame =>
      evaluate(lines.join("\n")).at(-1);
    const text = (...lines: string[]): string => answer(...lines).toString();

    it("concatenates the elements n times into a fresh array", () => {
      expect(text("3 [1, 2]")).toEqual("[1, 2, 1, 2, 1, 2]");
      expect(answer("3 [1, 2]")).toBeInstanceOf(FrameArray);
      expect(text("1 [1, 2]")).toEqual("[1, 2]");
      expect(text("0 [1, 2]")).toEqual("[]");
      expect(text("(3 [1, 2]).#")).toEqual("6");
    });

    it("never answers or writes the receiver, so it builds no cycle", () => {
      expect(text(".r (3 [1]);", "[r.#, r.##, (r.1) === r]"))
        .toEqual("[3, 3, ()]");
      expect(text(".xs [1, 2];", "[(1 xs) === xs, (1 xs) = xs]"))
        .toEqual("[(), <>]");
      expect(text(".xs [1, 2];", "3 xs;", "xs")).toEqual("[1, 2]");
      // A mutable name is not written either.
      expect(text(".xs_ [1, 2];", "3 xs_;", "xs_")).toEqual("[1, 2]");
      expect(text("(2 [[1, 2]]).##")).toEqual("6");
    });

    it("keeps a statement once, as a reduce's receiver does", () => {
      expect(text("2 [1; 2, 3]")).toEqual("[(1); 2, 3, 2, 3]");
      expect(text("0 [1; 2, 3]")).toEqual("[(1);]");
    });

    it("shares the elements rather than copying them", () => {
      expect(text(
        ".y [7];",
        ".t (3 [y]);",
        "[(t .0) === y, (t .1) === y, (t .2) === y]",
      )).toEqual("[<>, <>, <>]");

      const y = new FrameArray([new FrameString("y")]);
      const repeated = new FrameCount(2n).apply(new FrameArray([y]), Frame.nil);
      expect(repeated.elements()[0]).toBe(y);
      expect(repeated.elements()[1]).toBe(y);
    });

    it("keeps the receiver's properties and declared parent once", () => {
      expect(text("3 [.k 1; 4, 5]")).toEqual("[.k 1; 4, 5, 4, 5, 4, 5]");
      expect(text("(3 [.k 1; 4, 5]).k")).toEqual("1");
      expect(text("0 [.k 1; 4, 5]")).toEqual("[.k 1;]");
      expect(text(".p [.^ [.hi {“hi”}]; 1];", "[(2 p).hi(), (2 p).#]"))
        .toEqual("[“hi”, 2]");
    });

    it("concatenates as reducing the receiver into itself does", () => {
      expect(text(".xs [1, 2];", "(3 xs) = (xs | (xs | xs))")).toEqual("<>");
    });

    it("refuses a negative, fractional or non-integer count as text does", () => {
      for (const count of ["(0 - 1)", "1.5", "2.0", "(3 / 2)", "1.408.555"]) {
        expect(text(`${count} [1]`)).toEqual(text(`${count} “x”`));
        expect(answer(`${count} [1]`).is.error).toBe(true);
      }
      // A whole integer repeats as a count does.
      expect(text("(4 / 2) [1]")).toEqual("[1, 1]");
      expect(text("(5 - 3) [1]")).toEqual("[1, 1]");
    });

    it("bounds the answer's elements, not the applications", () => {
      const repeat = (count: bigint, items: number): Frame =>
        new FrameInt(count).apply(
          new FrameArray(
            Array.from({ length: items }, () => new FrameString("x")),
          ),
          Frame.nil,
        );

      expect(repeat(65_537n, 1).elements().length).toEqual(65_537);
      expect(repeat(1_000_000n, 1).elements().length).toEqual(1_000_000);
      for (const refused of [repeat(1_000_001n, 1), repeat(500_001n, 2)]) {
        expect(refused.is.error).toBe(true);
        expect(refused.toString()).toEqual("$!.repetition-size 1000000");
      }
      // Nothing to repeat answers at once, however large the count.
      expect(repeat(2n ** 100n, 0).toString()).toEqual("[]");
    });

    it("repeats an aggregate that declares apply by its rule, as before", () => {
      const units = ".Units {[.row _; .apply {Units (_^.row + 1)}]};";

      expect(text(units, "(5 (Units 0)).row")).toEqual("4");
      expect(text(units, "(5 [Units 0]).#")).toEqual("5");
    });
  });
});
