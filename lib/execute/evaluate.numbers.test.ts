import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { evaluate } from "./evaluate.ts";
import * as frame from "../frames.ts";

describe("evaluate: numbers", () => {
  it("repeats strings when applied", () => {
    const input = "3“Hello”";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[“HelloHelloHello”]");
  });

  it("multiplies numbers when applied", () => {
    const input = "3 2";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[6]");
  });

  describe("numeric properties", () => {
    it("routes zero and zero-led decimals through the numeric ladder", () => {
      const zero = evaluate("0");
      const decimal = evaluate("0.5");

      expect(zero.toString()).toEqual("[0]");
      expect(zero.at(0)).toBeInstanceOf(frame.FrameCount);
      expect(evaluate("1 + 0").toString()).toEqual("[1]");
      expect(decimal.toString()).toEqual("[0.5]");
      expect(decimal.at(0)).toBeInstanceOf(frame.FrameDecimal);
    });

    it("composes an integer and numeric property into a decimal", () => {
      const result = evaluate("1.408");

      expect(result.toString()).toEqual("[1.408]");
      expect(result.at(0)).toBeInstanceOf(frame.FrameDecimal);
    });

    it("preserves additional segments and their leading zeroes", () => {
      const result = evaluate("1.408.055.1212");

      expect(result.toString()).toEqual("[1.408.055.1212]");
      expect(result.at(0)).toBeInstanceOf(frame.FrameSequence);
    });

    it("completes at an expression boundary", () => {
      expect(evaluate("1.408, 2").toString()).toEqual("[(1.408, 2)]");
    });

    it("reports a nonnumeric property as missing", () => {
      expect(evaluate("1.invalid").toString()).toContain("name-missing");
    });

    // A dotted numeric value carries the receiver it was read from as its
    // lexical `up`, so before FrameNumeric dropped that link an unhandled key
    // climbed back through the receiver and on into the enclosing scope. At
    // v0.12.0 this returned 7.
    it("does not resolve a name through the numeric receiver it came from", () => {
      const leaked = evaluate(".foo 7;\n.x 9.8;\nx.5.foo\n");
      const quantity = evaluate(".foo 7;\n.x 9.8;\nx.m.foo\n");

      expect(leaked.at(-1).toString()).toContain("name-missing");
      expect(leaked.at(-1).toString()).not.toContain("7");
      // A unit segment is absorbed before the link question arises, so this
      // one is a quantity rather than a leak or a missing name.
      expect(quantity.at(-1).toString()).toEqual("9.8.m.foo");
    });

    // Dropping the link is only safe because the lookup driver consults
    // globals after the links rather than through them.
    it("still reaches a built-in operator through the globals tier", () => {
      expect(evaluate("9.8.m.< 10.2.m").toString()).toEqual(
        "[$!.numeric-domain < FrameTypedNumber FrameTypedNumber]",
      );
      expect(evaluate("9.8.5.< 2").toString()).toEqual(
        "[$!.numeric-domain < FrameSequence FrameCount]",
      );
      expect(evaluate("3.%%2").toString()).toEqual("[1]");
    });
  });

  describe("unary plus", () => {
    it("preserves a leading plus on a number", () => {
      expect(evaluate("+1").toString()).toEqual("[+1]");
    });

    it("preserves the exact spelling of a numeric-property chain", () => {
      expect(evaluate("+1.408.055.1212").toString()).toEqual(
        "[+1.408.055.1212]",
      );
    });

    it("does not change binary addition", () => {
      expect(evaluate("1 + 2").toString()).toEqual("[3]");
    });
  });

  describe("unary minus", () => {
    it("negates integer and decimal source", () => {
      expect(evaluate("-1").toString()).toEqual("[-1]");
      expect(evaluate("-1.5").toString()).toEqual("[-1.5]");
      expect(evaluate("-0.5").toString()).toEqual("[-0.5]");
    });

    it("negates evaluated values and normalizes a double negative", () => {
      expect(evaluate("-(1 + 2)").toString()).toEqual("[-3]");
      expect(evaluate("-(1 - 2)").toString()).toEqual("[1]");
    });

    it("distinguishes invalid signed properties from sequence negation", () => {
      const propertyError = "[$!.numeric-domain property FrameDecimal]";
      const unaryError = "[$!.numeric-domain unary- FrameSequence]";

      expect(evaluate("-1.2.3").toString()).toEqual(propertyError);
      expect(evaluate("-1.2.3 = 1.2.3").toString()).toEqual(propertyError);
      expect(evaluate("-(1.2.3)").toString()).toEqual(unaryError);
    });

    it("does not change binary subtraction", () => {
      expect(evaluate("1 - 2").toString()).toEqual("[-1]");
    });
  });

  describe("dotted comparisons", () => {
    it("evaluates dotted less-than and greater-than properties", () => {
      expect(evaluate("1.< 3").toString()).toEqual("[<>]");
      expect(evaluate("1.> 3").toString()).toEqual("[]");
    });

    it("retains dotted equals-suffixed comparisons", () => {
      expect(evaluate("1.<= 1").toString()).toEqual("[<>]");
      expect(evaluate("3.>= 4").toString()).toEqual("[]");
    });

    it("keeps raw angle brackets as schema delimiters", () => {
      expect(evaluate("<1, 3>").toString()).toEqual("[<1, 3>]");
    });

    it("treats a false comparison as false for an else branch", () => {
      expect(evaluate("3.> 4 : {1}").toString()).toEqual("[1]");
    });
  });

  describe("binary conditionals", () => {
    it("calls the right operand of ? only for a truthy receiver", () => {
      const callable = new (class extends frame.Frame {
        calls = 0;
        override call(argument: frame.Frame): frame.Frame {
          this.calls++;
          expect(argument).toBe(frame.Frame.nil);
          return new frame.FrameInt("4");
        }
      })();

      expect(frame.FrameInt.for("1").get("?").call(callable).toString())
        .toEqual("4");
      expect(callable.calls).toEqual(1);
      expect(frame.Frame.nil.get("?").call(callable)).toBe(frame.Frame.nil);
      expect(callable.calls).toEqual(1);
    });

    it("calls the right operand of : only for nil, else answers the receiver", () => {
      const callable = new (class extends frame.Frame {
        calls = 0;
        override call(argument: frame.Frame): frame.Frame {
          this.calls++;
          expect(argument).toBe(frame.Frame.nil);
          return new frame.FrameInt("4");
        }
      })();

      const one = frame.FrameInt.for("1");
      expect(one.get(":").call(callable)).toBe(one);
      expect(callable.calls).toEqual(0);
      expect(frame.Frame.nil.get(":").call(callable).toString()).toEqual("4");
      expect(callable.calls).toEqual(1);
    });

    it("propagates nil returned by a selected callable", () => {
      const returnsNil = new (class extends frame.Frame {
        override call(): frame.Frame {
          return frame.Frame.nil;
        }
      })();

      expect(frame.FrameInt.for("1").get("?").call(returnsNil)).toBe(
        frame.Frame.nil,
      );
      expect(frame.Frame.nil.get(":").call(returnsNil)).toBe(frame.Frame.nil);
    });

    it("applies binary rules to comparison predicates", () => {
      expect(evaluate("1.> 5 : {10}").toString()).toEqual("[10]");
      expect(evaluate("5.> 1 ? {100}").toString()).toEqual("[100]");
    });
  });

  describe("chained conditionals", () => {
    it("selects the else branch for a false dotted predicate", () => {
      expect(evaluate("1.> 5 ? (2 * 50) : 10").toString()).toEqual("[10]");
    });

    it("answers the then value when a true then call returns a frame", () => {
      expect(evaluate("5.> 1 ? (2 * 50) : 10").toString()).toEqual("[100]");
    });

    it("does not evaluate a lazy then branch when false", () => {
      expect(evaluate("1.> 5 ? {missing} : {10}").toString()).toEqual(
        "[10]",
      );
    });

    it("evaluates else when a true then call returns nil", () => {
      expect(evaluate("5.> 1 ? {()} : {10}").toString()).toEqual("[10]");
    });
  });

  it("uses .+ for addition", () => {
    const input = "3.+2";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[5]");
  });

  it("uses non-dot + for addition", () => {
    const input = "3+2";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[5]");
  });

  it("uses .%% for modulo", () => {
    const input = "3.%%2";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[1]");
  });

  it("uses .** for power", () => {
    const input = "3.**2";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[9]");
  });

  describe("binding", () => {
    it("accesses array items by index", () => {
      const input = "[9,8].0";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[9]");
    });

    it("groups properties explicitly", () => {
      const input = "([9,8].0)+([7,6].1)";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[15]");
    });

    it("binds expressions with initial spaces", () => {
      const input = " [9,8].0";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[9]");
    });

    it("binds expressions with interior spaces", () => {
      const input = "[9,8] .0";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[9]");
    });

    it("binds a dotted operator with interior spaces", () => {
      const input = "1 .+ 2";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[3]");
    });

    it("groups properties using spaces", () => {
      const input = "[9,8].0 + [7,6].1";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[15]");
    });
  });
});
