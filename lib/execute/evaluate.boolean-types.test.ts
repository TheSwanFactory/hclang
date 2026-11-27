import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { evaluate } from "./evaluate.ts";
import * as frame from "../frames.ts";
import { lastTermOfLast, lastText as result } from "../test-helpers.test.ts";

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

  it("enforces closure signature required properties", () => {
    const declaration =
      ".join-name (.first “Jane”, .last) ^ {last “, ” first}; ";

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

  describe("`^` and `^^` refine a copy of the closure (#485)", () => {
    // The last statement's answer, after the declarations before it.
    const answer = (source: string): string =>
      lastTermOfLast(source).toString();

    describe("the decision comment's programs", () => {
      it("leaves f and its alias g alone when h refines f with ^^", () => {
        expect(answer(
          ".f (.x) ^ {x}; .g f; .h f ^^ <1, 2, 3>; " +
            "[f (.x 9), g (.x 9), h (.x 9)]",
        )).toEqual("[9, 9, $!.type-error <1, 2, 3> 9]");
      });

      it("leaves the alias g alone when h refines it with ^^", () => {
        expect(answer(
          ".f {x}; .g f; .h g ^^ <1, 2, 3>; [g (.x 9), h (.x 9)]",
        )).toEqual("[9, $!.type-error <1, 2, 3> 9]");
      });

      it("leaves f and g alone when h narrows f with ^", () => {
        const program = ".f {x}; .g f; .h (.x, .y) ^ f; ";
        expect(answer(program + "[f (.x 1), g (.x 1)]")).toEqual("[1, 1]");
        expect(answer(program + "h (.x 1)")).toEqual(
          "$!invalid-argument-list (.x 1, $!missing-required-argument .y;)",
        );
      });

      it("rebinds f to a refined copy on .f f ^^, keeping the alias g", () => {
        expect(answer(
          ".f (.x) ^ {x}; .g f; .f f ^^ <1, 2, 3>; [g (.x 9), f (.x 9)]",
        )).toEqual("[9, $!.type-error <1, 2, 3> 9]");
      });
    });

    it("keeps declaration-time ^ and ^^ chains working", () => {
      expect(answer(".f (.x) ^ {x} ^^ <1, 2>; [f (.x 2), f (.x 3)]"))
        .toEqual("[2, $!.type-error <1, 2> 3]");
      expect(answer(".f (.x, .y) ^ {x} ^^ <1, 2>; f (.x 1)")).toEqual(
        "$!invalid-argument-list (.x 1, $!missing-required-argument .y;)",
      );
    });

    it("lets .f f ^^ narrow an existing contract, keeping the alias's", () => {
      expect(answer(
        ".f (.x) ^ {x} ^^ <1, 2>; .g f; .f f ^^ <1>; " +
          "[g (.x 2), f (.x 2), f (.x 1)]",
      )).toEqual("[2, $!.type-error <1> 2, 1]");
    });

    it("ignores ^^ on a bare read, which names no declaration", () => {
      expect(answer(".f {x}; .g f; g ^^ <1>; [f (.x 9), g (.x 9)]"))
        .toEqual("[9, 9]");
    });

    it("keeps the scope a refined closure captured (#424)", () => {
      expect(answer(
        ".mk {.k _; {k + x}}; .add5 (mk 5); .h add5 ^^ <15>; " +
          "[h (.x 10), h (.x 1), add5 (.x 1)]",
      )).toEqual("[15, $!.type-error <15> 6, 6]");
    });

    it("lets no argument rewrite a closure's body or contracts", () => {
      expect(answer(
        ".f (.x) ^ {x} ^^ <1, 2>; f (.x 1, .signature (.y), .x_ {9}); " +
          "[f (.x 2), f (.x 3), f]",
      )).toEqual("[2, $!.type-error <1, 2> 3, { x }]");
      expect(answer(
        ".outer {.inner (.x) ^ {x} ^^ <1>; inner}; .i (outer ()); " +
          "i (.x 9, .inner {7}); [i (.x 1), i (.x 9)]",
      )).toEqual("[1, $!.type-error <1> 9]");
    });

    it("still lets a closure under contract write a mutable Figure", () => {
      // Supplied through the argument, and captured through a mutating method.
      expect(answer(
        ".X_ [1]; .f {.o 2; o} ^^ <2>; .g f; f X_; [X_, g [], f []]",
      )).toEqual("[[.o 2; 1], 2, 2]");
      expect(answer(
        ".Cell [.n 0; .set_ {@n 5}]; .cell_ Cell; " +
          ".bump {cell_.set_ (); cell_.n} ^^ <5>; .alias bump; " +
          ".strict bump ^^ <6>; [bump (), cell_.n, alias (), strict ()]",
      )).toEqual("[5, 5, 5, $!.type-error <6> 5]");
    });

    it("keeps prior aliases through unrelated reads and method bindings", () => {
      expect(answer(
        ".f {x}; .g f; f (.x 1); .C [.m f]; C.m (.x 2); .h f ^^ <1>; " +
          "[g (.x 9), f (.x 9), C.m (.x 9), h (.x 9)]",
      )).toEqual("[9, 9, 9, $!.type-error <1> 9]");
    });

    it("changes no alias through writes or rebinding of a _ name", () => {
      const declared = ".f_ (.x) ^ {x} ^^ <1>; .g f_; ";
      const reading = "[g (.x 1), g (.x 7)]";
      expect(answer(declared + "@f_.x 7; " + reading))
        .toEqual("[1, $!.type-error <1> 7]");
      expect(answer(declared + "f_.y_ 5; " + reading + " | [f_ (.x 1)]"))
        .toEqual("[1, 1, $!.type-error <1> 7]");
      expect(answer(".f_ {1}; .g f_; @f_ {2}; [f_ (), g ()]"))
        .toEqual("[2, 1]");
    });

    describe("a _ key holding a closure still declares a method", () => {
      it("binds and calls .set_ {…} methods that write the receiver", () => {
        expect(answer(
          ".C [.n 1; .set_ {@n 2}]; .c_ C; c_.set_ (); c_.n",
        )).toEqual("2");
        expect(answer(
          ".P [.n 1; .bump_ {@n (n + 1)}]; .p_ P; " +
            "p_.bump_ (); p_.bump_ (); p_.n",
        )).toEqual("3");
      });

      it("binds and calls .f_ {x}, with or without a signature", () => {
        expect(answer(".f_ {x}; f_ (.x 3)")).toEqual("3");
        expect(answer(".f_ (.x) ^ {x}; f_ (.x 4)")).toEqual("4");
      });

      it("binds and calls .g_ f", () => {
        expect(answer(".f {x}; .g_ f; g_ (.x 5)")).toEqual("5");
      });
    });
  });
});
