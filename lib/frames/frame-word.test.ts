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

  it("prints a word as it was written", () => {
    expect(FrameWord.word("a").toString()).toEqual("a");
    expect(FrameWord.address("a").toString()).toEqual(".a");
    expect(FrameWord.word("+").is.operator).toBeUndefined();
  });
});
