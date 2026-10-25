import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { FrameWord } from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

const answer = (source: string): string => evaluate(source).at(0).toString();

describe("walking a closure (#429)", () => {
  it("yields the atoms of the body, in order, without evaluating", () => {
    expect(answer("{4 + 5} & {_}")).toEqual("[4, +, 5]");
    expect(answer("{{1 + 2}} & {_}")).toEqual("[{ 1 + 2 }]");
    expect(answer("{} & {_}")).toEqual("[]");
  });

  it("counts the atoms it yields, instead of running the body", () => {
    expect(answer("{4 + 5}.#")).toEqual("3");
    expect(answer("{4 + 5}.##")).toEqual("3");
    expect(answer(".f {4 + 5}; [f.#, f ()]")).toContain("[3, 9]");
  });

  it("keeps statements and declarations, with `;` as an atom", () => {
    expect(answer("{.a 1; a + 2} & {“” _}"))
      .toEqual("[“.a”, “1”, “;”, “a”, “+”, “2”]");
    expect(answer("{1 + 2; 3 * 4}.#")).toEqual("7");
    expect(answer("{.a 1} && {_}")).toEqual("[[.0, .a], [.1, 1]]");
  });

  it("yields a name that never resolves, wherever it is carried", () => {
    expect(answer(".x 5; {x} & {_}")).toContain("[x]");
    expect(answer(".x 5; .n (({x} & {_}) .0); [n, “” n, (“” n) = “x”]"))
      .toContain("[x, “x”, <>]");
    expect(answer(".w (({x} & {_}) .0); .z [w]; z")).toContain("[x]");
    expect(
      answer(
        "[(({x} & {_}) .0) = (({x} & {_}) .0), (({x} & {_}) .0) = (({y} & {_}) .0)]",
      ),
    )
      .toEqual("[<>, ()]");
  });

  it("performs no effect written in the body", () => {
    expect(answer("{'clock:now' | []} & {“” _}"))
      .toEqual("[“'clock:now'”, “|”, “[]”]");
  });

  it("walks an aggregate written in the body as its own atoms", () => {
    expect(answer("(({[1, [2, 3]]} & {_}) .0) & {_.#}")).toEqual("[1, 2]");
    expect(answer("(((({[1, [2, 3]]} & {_}) .0) & {_}) .1) & {_}"))
      .toEqual("[2, 3]");
    expect(answer("[1 + 2] & {_}")).toEqual("[3]");
  });

  it("leaves the closure unchanged by a call in between", () => {
    expect(answer(
      ".f {.a _; [a, a]}; .b (f & {“” _}); .r (f 1); .c (f & {“” _}); [b = c, r]",
    )).toContain("[<>, [1, 1]]");
  });

  it("runs the atoms when they are folded, with the receiver as the scope", () => {
    // `|` applies each element to the running answer, which is what the
    // evaluator does with terms, so a fold over a walk is a call.
    expect(answer("{4 + 5} | ()")).toEqual("9");
    expect(answer("{x + 1} | (.x 5)")).toEqual("6");
    expect(answer("{x * y} | (.x 6, .y 7)")).toEqual("42");
    expect(answer("{_ + 1} | 3")).toEqual("4");
    expect(answer("{.a 1; a + 2} | ()")).toEqual("3");
    expect(answer("{1; 2} | ()")).toEqual("2");
    expect(answer("{4 + 5} | []")).toEqual("9");
    expect(answer(".y 1; .f {x + y}; f | (.x 5)")).toContain("; 6)");
    expect(answer(".f {x * y}; (f & {_}) | (.x 6, .y 7)")).toContain("; 42)");
    expect(answer(".f {x + 1}; .g (f & {_}); [g | (.x 5), g | (.x 10)]"))
      .toContain("[6, 11]");
    expect(answer("{x} | (.y 5)")).toContain("$!.name-missing");
  });

  it("keeps a word under every application that is not a fold", () => {
    expect(answer("{x} & {“” _}")).toEqual("[“x”]");
    expect(answer(".w (({x} & {_}) .0); [w]")).toContain("[x]");
  });

  it("equals the written name with its spelling, either way round", () => {
    expect(answer("[({x} & {_}) .0 = (.x), (.x) = (({x} & {_}) .0)]"))
      .toEqual("[<>, <>]");
    expect(answer("[(({x} & {_}) .0) = (.y)]")).toEqual("[()]");
  });

  describe("binding identity, `===`", () => {
    it("tells shadowed names apart, and keeps a lookup with its declaration", () => {
      expect(answer(
        ".c {.a 1; {.a 2; a}}; .o ((c & {_}) .0); .i (((c & {_}) .3) & {_}); [(i .3) === (i .0), (i .3) === o, (i .3) = o]",
      )).toContain("[<>, (), <>]");
    });

    it("resolves a lookup to the declaration before it, in order", () => {
      expect(answer(
        ".f {.a 1; .b a; b}; .w (f & {_}); [(w .4) === (w .0), (w .6) === (w .3), (w .6) === (w .0)]",
      )).toContain("[<>, <>, ()]");
      expect(
        answer(
          ".f {a; .a 1}; .w (f & {_}); [(w .0) === (w .2), (w .0) = (w .2)]",
        ),
      )
        .toContain("[(), <>]");
    });

    it("keeps a lookup's binding below a group or an array written in the body", () => {
      // A group is scoped inside the body that holds it, so a name inside it
      // resolves to the declaration before it, exactly as execution does.
      // The walk used to lose the binding at every group (Figure 004.08).
      const cond =
        ".f {.k _; (k = 3) ? {1} : {2}}; .w (f & {_}); .c ((((w .3) & {_}) .0) & {_}); [(c .0) === (w .0), (c .0) === (({k} & {_}) .0)]";
      expect(answer(cond)).toContain("[<>, ()]");
      const array =
        ".f {.a 1; [a]}; .w (f & {_}); .e (((w .3) & {_}) .0); [e === (w .0)]";
      expect(answer(array)).toContain("[<>]");
    });

    it("gives a member name no local binding", () => {
      expect(
        answer(
          ".f {.a 1; o .a}; .w (f & {_}); [(w .4) === (w .0), (w .4) = (w .0)]",
        ),
      )
        .toContain("[(), <>]");
    });

    it("answers alike for a closure walked before or after the one around it", () => {
      expect(
        answer(".f {.a _; {a}}; .g (f 1); ((g & {_}) .0) === ((f & {_}) .0)"),
      )
        .toContain("; <>)");
      expect(
        answer(
          ".c {.a 1; {a}}; .i (((c & {_}) .3) & {_}); (i .0) === ((c & {_}) .0)",
        ),
      )
        .toContain("; <>)");
    });

    it("identifies free names by spelling, because each call resolves them", () => {
      expect(
        answer(
          "[({x} & {_}) .0 === (({x} & {_}) .0), ({x} & {_}) .0 === (({y} & {_}) .0)]",
        ),
      )
        .toEqual("[<>, ()]");
    });
  });

  describe("a name kept in a variable", () => {
    it("reads the member later, applied by an aggregate", () => {
      expect(answer(".o [.x 5]; .k .x; o k")).toContain("; 5)");
      expect(answer(".o [.x 5, .y 6]; .ks [.x, .y]; ks & {o _}")).toContain(
        "[5, 6]",
      );
    });

    it("prints and compares as the name", () => {
      expect(answer(".k .x; [k, “” k, k = (.x), k = (.y)]"))
        .toContain("[.x, “.x”, <>, ()]");
      expect(answer("“” .x")).toEqual("“.x”");
    });

    it("carries no write authority over the scope it was written in", () => {
      expect(answer(".k .x; k 7; x")).toContain("$!.name-missing");
    });

    it("keeps an alias as the name only", () => {
      expect(answer(".x 1; .k (@x); k")).toContain("; .x)");
    });
  });

  describe("a method read through its receiver", () => {
    const method = ".o [.m {_^.n + _}; .n 1]";

    it("walks as its closure, without being called", () => {
      expect(answer(`${method}; (o.m) & {“” _}`))
        .toContain("[“_^”, “.n”, “+”, “_”]");
      expect(answer(`${method}; (o.m).#`)).toContain("; 4)");
    });

    it("is called against its receiver when folded", () => {
      expect(answer(`${method}; (o.m) | 2`)).toContain("; 3)");
    });
  });

  it("prints a word as it was written", () => {
    expect(FrameWord.word("a").toString()).toEqual("a");
    expect(FrameWord.address("a").toString()).toEqual(".a");
    expect(FrameWord.word("+").is.operator).toBeUndefined();
  });
});
