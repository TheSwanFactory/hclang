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

  it("prints a word as it was written", () => {
    expect(FrameWord.word("a").toString()).toEqual("a");
    expect(FrameWord.address("a").toString()).toEqual(".a");
    expect(FrameWord.word("+").is.operator).toBeUndefined();
  });
});
