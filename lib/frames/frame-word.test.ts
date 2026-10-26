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

  it("keeps `,` and a tight expression, so the walk is the source (a16)", () => {
    expect(answer("{.a 1; a + 2, b} & {“” _}"))
      .toEqual("[“.a”, “1”, “;”, “a”, “+”, “2”, “,”, “b”]");
    expect(answer("{1, 2}.#")).toEqual("3");
    // Terms that abut bind before their neighbour applies: one atom.
    expect(answer("{f o.x} & {“” _}")).toEqual("[“f”, “(o .x)”]");
    expect(answer(".o [.x 5]; .f {_ + 1}; [{f o.x} (), {f (o .x)} ()]"))
      .toContain("[6, 6]");
    // A fold re-reads both: the comma as a term boundary, the tight
    // expression as itself.
    expect(answer("({x + y.v} & {_}) | (.x 1, .y [.v 5])")).toEqual("6");
    expect(answer("({1, 2} & {_}) | ()")).toEqual("2");
  });

  it("walks a source aggregate as a body, statements and bindings kept (a16)", () => {
    expect(answer(".f {.a 1; (.a 2; a)}; ((f & {_}) .3) & {“” _}"))
      .toContain("[“.a”, “2”, “;”, “a”]");
    // Its own declaration shadows the enclosing one, as it does when run.
    expect(answer(
      ".f {.a 1; (.a 2; a)}; .w (f & {_}); .i ((w .3) & {_}); [(i .3) === (i .0), (i .3) === (w .0), f ()]",
    )).toContain("[<>, (), (.a 2; 2)]");
    expect(answer(".f {.a 1; [a, b]}; ((f & {_}) .3) & {“” _}"))
      .toContain("[“a”, “,”, “b”]");
    // A value walks as its elements, statements left out, as before.
    expect(answer("(.a 2; a) & {_}")).toEqual("[2]");
  });

  it("prints a source aggregate as it was written (a16)", () => {
    expect(answer("“” {.a 1; (.a 2; a)}")).toEqual("“{ .a 1; (.a 2; a) }”");
    expect(answer("“” {.a 1; [a + 1, b]}")).toEqual("“{ .a 1; [a + 1, b] }”");
    expect(answer(".f {(1 + 2) * 3}; [“” f, f ()]")).toContain(
      "[“{ (1 + 2) * 3 }”, 9]",
    );
  });

  it("prints a closure as it was written, so it reads back (a16)", () => {
    expect(answer("“” {.a 1; a + 2, b}")).toEqual("“{ .a 1; a + 2, b }”");
    expect(answer("“” {f o.x}")).toEqual("“{ f (o .x) }”");
    expect(answer("“” {4 + 5}")).toEqual("“{ 4 + 5 }”");
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
    // A source aggregate walks as a body, its `,` kept (spec a16).
    expect(answer("(({[1, [2, 3]]} & {_}) .0) & {“” _}"))
      .toEqual("[“1”, “,”, “[2, 3]”]");
    expect(answer("(((({[1, [2, 3]]} & {_}) .0) & {_}) .2) & {“” _}"))
      .toEqual("[“2”, “,”, “3”]");
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

  describe("resuming where the closure was bound (a17)", () => {
    it("finishes a walk's evaluation in its closure's scope", () => {
      expect(answer(".o [.x 5]; .f {_ + 1}; ({f o.x} & {_}) | ()"))
        .toContain("; 6)");
      expect(answer(".a 1; .f {{a}}; ((f & {_}) .0) | ()")).toContain("; 1)");
    });

    it("resolves the receiver ahead of the closure's scope", () => {
      expect(answer(".a 1; .p {a}; (p & {_}) | (.a 7)")).toContain("; 7)");
    });

    it("resumes each atom in its own scope, never the fold's", () => {
      expect(answer(
        ".a 1; .p {a}; .q ({.a 2; {a}} ()); ([p, {+}, q] &| {_ & {_}}) | ()",
      )).toContain("; 3)");
      expect(answer(".a 1; .p {a}; {.a 5; (p & {_}) | ()} ()"))
        .toContain("; 1)");
      expect(answer(".b 10; .p {x + b}; {.b 20; (p & {_}) | (.x 1)} ()"))
        .toContain("; 11)");
    });

    it("declares into its own frame, never the closure's scope", () => {
      expect(answer(".a 1; .r (({.a 9; a} & {_}) | ()); [r, a]"))
        .toContain("[9, 1]");
    });

    it("discloses the values the body names, read-only", () => {
      expect(answer(".s 42; .f {.k s; 0}; [f (), [((f & {_}) .1)] | ()]"))
        .toContain("[0, 42]");
    });

    it("keeps a compound atom transparent: printed, walked and counted", () => {
      expect(answer("“” ({f o.x} & {_})")).toEqual("“[f, (o .x)]”");
      expect(answer("(({f o.x} & {_}) .1) & {“” _}")).toEqual("[“o”, “.x”]");
      expect(answer("(({f o.x} & {_}) .1).#")).toEqual("2");
    });

    it("answers as the call when the whole walk resumes", () => {
      for (
        const body of [
          "{.a 1; .b (a + 1); [a, b]}",
          "{.a 1; {.a 2; a} ()}",
          "{x * 2}",
          "{.a 1; (.a 2; a)}",
          "{.n 3; n [7]}",
        ]
      ) {
        const [called, resumed] = evaluate(
          `.x 5; .f ${body}; [f (.x 5), (f & {_}) | (.x 5)]`,
        ).at(0).asArray().at(-1)!.asArray();
        expect(resumed.toString()).toEqual(called.toString());
      }
      expect(answer(".f {.a 1; {a}}; [(f ()) (), ((f & {_}) | ()) ()]"))
        .toContain("[1, 1]");
    });

    it("answers as a call of that part when part of a walk resumes", () => {
      // The inner `{a}` is a step of the outer's execution, frozen as a
      // closure of its own only once that execution reaches it.
      const part = answer(".f {.a 1; {a}}; ((f & {_}) .3) | ()");
      const alone = answer(".f {{a}}; (f ()) ()");
      expect(part).toContain("$!.name-missing");
      expect(alone).toContain("$!.name-missing");
    });
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
