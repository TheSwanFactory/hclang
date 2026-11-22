import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "./evaluate.ts";
import * as frame from "../frames.ts";
import { lastText as result } from "../test-helpers.test.ts";

describe("evaluate: boolean and type operations", () => {
  it("negates the nil and all singleton booleans", () => {
    expect(evaluate("().!").at(0)).toBe(frame.Frame.all);
    expect(evaluate("<>.!").toString()).toEqual("[]");
  });

  it("defines all and nil membership", () => {
    expect(evaluate("1 ~ <>").at(0)).toBe(frame.Frame.all);
    expect(evaluate("2 ~ ()").toString()).toEqual("[]");
  });

  it("extracts first-class runtime types for membership", () => {
    expect(evaluate("(“”).<>").at(0)).toBeInstanceOf(frame.FrameType);
    expect(evaluate("“Q” ~ (“”).<>").at(0)).toBe(frame.Frame.all);
    expect(evaluate("“Q” ~ (1).<>").toString()).toEqual("[]");
  });

  it("enforces closure signature defaults and required properties", () => {
    const declaration =
      ".join-name (.first “Jane”, .last) ^ {last “, ” first}; ";

    expect(
      evaluate(
        declaration + "join-name (.first “John”, .last “Doe”)",
      ).at(0).toString(),
    ).toContain("“Doe, John”");
    expect(
      evaluate(
        declaration + "join-name (.middle “Q”, .last “Doe”)",
      ).at(0).toString(),
    ).toContain("“Doe, Jane”");
    expect(
      evaluate(declaration + "join-name (.middle “Q”)").at(0).toString(),
    ).toContain(
      "$!invalid-argument-list (.middle “Q”, " +
        "$!missing-required-argument .last;)",
    );
  });

  describe("closure return contracts `^^` (006.17)", () => {
    it("accepts a return that conforms to the declared output schema", () => {
      const declaration = ".pick (.x) ^ {x} ^^ <1, 2, 3>; ";
      expect(result(declaration + "pick (.x 2)")).toContain("2");
    });

    it("refuses a return that violates the declared output schema", () => {
      const declaration = ".pick (.x) ^ {x} ^^ <1, 2, 3>; ";
      expect(result(declaration + "pick (.x 9)")).toContain(
        "$!.type-error <1, 2, 3> 9",
      );
    });

    it("binds a return contract without an input signature", () => {
      expect(result(".three {3} ^^ <1, 2, 3>; three ()")).toContain("3");
      expect(result(".four {4} ^^ <1, 2, 3>; four ()")).toContain(
        "$!.type-error <1, 2, 3> 4",
      );
    });

    it("leaves an undeclared closure's implicit behavior unchanged", () => {
      expect(result(".id (.x) ^ {x}; id (.x 9)")).toContain("9");
    });

    it("checks the computed result, not the input", () => {
      // `x + x` doubles, so only an even input lands in <2, 4>.
      const declaration = ".twice (.x) ^ {x + x} ^^ <2, 4>; ";
      expect(result(declaration + "twice (.x 1)")).toContain("2");
      expect(result(declaration + "twice (.x 2)")).toContain("4");
      expect(result(declaration + "twice (.x 3)")).toContain(
        "$!.type-error <2, 4> 6",
      );
    });

    it("propagates a body failure instead of masking it as a type error", () => {
      // The body never produced a value to expose, so the contract adds no
      // second complaint over the original refusal.
      expect(result(".boom {missingName} ^^ <1>; boom ()")).toContain(
        "$!.name-missing",
      );
    });
  });
});
