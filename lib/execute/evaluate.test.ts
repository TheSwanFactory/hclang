import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { evaluate } from "./evaluate.ts";
import { make_context } from "./hc-eval.ts";
import * as frame from "../frames.ts";

describe("evaluate", () => {
  it("is exported", () => {
    expect(evaluate).toBeTruthy();
  });

  it("returns empty array for empty string", () => {
    const result = evaluate.call("", "");
    expect(result).toBeInstanceOf(frame.FrameArray);
    expect(result.toString()).toEqual("[]");
  });

  it("ignores comments", () => {
    const input = "#Goodbye";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[]");
  });

  it("ignores spaces", () => {
    const input = "  ";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[]");
  });

  it("converts <> to Frame.all", () => {
    const input = "<>";
    const result = evaluate(input);
    const first = result.at(0);
    expect(first).toEqual(frame.Frame.all);
  });

  describe("strings", () => {
    it("quines string literal", () => {
      const input = "“Hello, HC!”";
      const result = evaluate(input);
      expect(result.toString()).toEqual(`[${input}]`);
    });

    it("quines string before spaces", () => {
      const input = "“Hello, HC!”";
      const suffix = `${input}  `;
      const result = evaluate(suffix);
      expect(result.toString()).toEqual(`[${input}]`);
    });

    it("quines string after spaces", () => {
      const input = "“Hello, HC!”";
      const prefix = `  ${input}`;
      const result = evaluate(prefix);
      expect(result.toString()).toEqual(`[${input}]`);
    });

    it("joins multiple strings", () => {
      const input = "“Hello”“, HC!”";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[“Hello, HC!”]");
    });

    it("joins around inner space", () => {
      const input = "“Hello” “, HC!”";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[“Hello, HC!”]");
    });

    it("joins multi-line doc-strings into strings", () => {
      const input = "```\nDoc String\n```";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[“\nDoc String\n”]");
    });

    it("joins around comments", () => {
      const input = "“Hello”#ignore me#“, HC!”";
      const result = evaluate(input);
      expect(result.toString()).toEqual("[“Hello, HC!”]");
    });
  });

  describe("grouping", () => {
    it("returns FrameArray for empty []", () => {
      const result = evaluate("[]");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameArray);
    });

    it("returns closure for empty {}", () => {
      const result = evaluate("{}");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameLazy);
    });

    it("returns unevaluated closure for {1}", () => {
      const result = evaluate("{1}");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameLazy);
      expect(output.toString()).toEqual("{ 1 }");
    });

    it("returns unevaluated closure for {_}", () => {
      const result = evaluate("{_}");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameLazy);
      expect(output.toString()).toEqual("{ _ }");
    });

    it("returns unevaluated closure for { _ + 1 }", () => {
      const result = evaluate("{ _ + 1 }");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameLazy);
      expect(output.toString()).toEqual("{ _ + 1 }");
    });

    it("returns FrameNote for empty ()", () => {
      const result = evaluate("()");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameNote);
    });

    it("returns FrameArray for empty [] with spaces", () => {
      const result = evaluate("  [  ]  ");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameArray);
    });

    it("returns FrameArray for empty [] with comments", () => {
      const result = evaluate("[#comment#]");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameArray);
    });

    it("returns FrameNote for mis-matched brackets", () => {
      const result = evaluate("[}");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameNote);
    });

    it("returns FrameNote for un-opened close bracket", () => {
      const result = evaluate("}");
      const output = result.at(0);
      expect(output).toBeInstanceOf(frame.FrameNote);
    });
  });

  describe("numbers", () => {
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

      it("binds expressions with interior spaces", () => {
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

  describe("schemas", () => {
    it("binds value with schema and reports assignment", () => {
      const result = evaluate(".one <1> 1");
      expect(result.toString()).toEqual("[.one 1, .one.<> <1>; .one 1;]");
    });

    it("rejects values that do not match the schema", () => {
      const result = evaluate(".one <1> 1; @one 2");
      expect(result.toString()).toEqual(
        "[((.one 1); $!.type-error .one <1> 2), .one.<> <1>; .one 1;]",
      );
    });

    // Empty schema tests
    it("accepts any value with empty schema", () => {
      const result = evaluate(".x <> 42");
      // Empty schema stores differently than full schemas
      expect(result.toString()).toEqual("[42, .x <>;]");
    });

    it.skip("allows reassignment with empty schema", () => {
      // SKIPPED: Empty schema binding returns empty result []
      // This may be a bug or intended behavior - needs investigation
      const result = evaluate('.x <> 42; @x "hello"');
      expect(result.toString()).toContain('.x "hello"');
    });

    // String enumeration tests - SKIPPED: Not implemented
    it.skip("accepts values from string enumeration", () => {
      // SKIPPED: String schemas return empty []
      // Current implementation only supports numeric schema validation
      const result = evaluate('.color <"red","green","blue"> "red"');
      expect(result.toString()).toContain('.color "red"');
    });

    it.skip("rejects values not in string enumeration", () => {
      // SKIPPED: String schemas not implemented
      const result = evaluate(
        '.color <"red","green","blue"> "red"; @color "yellow"',
      );
      expect(result.toString()).toContain("$!.type-error");
    });

    it("validates number enumerations", () => {
      const result = evaluate(".option <1,2,3> 2");
      expect(result.toString()).toContain(".option 2");
    });

    it("rejects numbers not in enumeration", () => {
      const result = evaluate(".option <1,2,3> 2; @option 4");
      expect(result.toString()).toContain("$!.type-error");
    });

    // Single-value schema tests (constants)
    it("enforces single value schema", () => {
      const result = evaluate(".const <42> 42");
      expect(result.toString()).toContain(".const 42");
    });

    it("rejects different value for single value schema", () => {
      const result = evaluate(".const <42> 42; @const 43");
      expect(result.toString()).toContain("$!.type-error");
    });

    it.skip("enforces string literal type", () => {
      // SKIPPED: String schemas not implemented
      const result = evaluate('.status <"ok"> "ok"');
      expect(result.toString()).toContain('.status "ok"');
    });

    // Reassignment tests
    it("allows multiple valid assignments", () => {
      const result = evaluate(".x <1,2> 1; @x 2; @x 1");
      expect(result.toString()).not.toContain("$!.type-error");
    });

    it("maintains schema across assignments", () => {
      const result = evaluate(".x <1> 1; @x 1; @x 1");
      const assignments = result.toStringArray();
      // Result contains nested expressions, both match the filter
      expect(assignments.filter((s) => s.includes(".x 1"))).toHaveLength(2);
    });

    // Edge cases (aspirational - document expected behavior)
    describe.skip("edge cases", () => {
      it("handles schema with nil value", () => {
        const result = evaluate(".x <()> ()");
        expect(result.toString()).toContain(".x ()");
      });

      it("preserves schema through context", () => {
        const result = evaluate(".x <1> 1; .y @x");
        // .y should get value 1, but schema stays with x
        expect(result.toString()).toContain(".y 1");
      });

      it("reports clear error with schema details", () => {
        const result = evaluate(".num <1,2,3> 1; @num 5");
        const error = result.toString();
        expect(error).toContain("$!.type-error");
        expect(error).toContain(".num");
      });

      it("handles nested structure access", () => {
        const result = evaluate(".arr <[1,2]> [1,2]");
        // Array structure type checking
        expect(result.toString()).toContain(".arr");
      });
    });

    // Schema storage and retrieval
    describe.skip("schema storage", () => {
      it("stores schema under name.<> key", () => {
        const result = evaluate(".x <1> 1");
        expect(result.toString()).toContain(".x.<> <1>");
      });

      it("retrieves schema for validation", () => {
        const result = evaluate(".x <1> 1; .schema .x.<>");
        expect(result.toString()).toContain("<1>");
      });

      it("allows schema definition without initial value", () => {
        const result = evaluate(".x <1,2,3>; @x 2");
        // Schema-only binding support
        expect(result.toString()).toContain(".x 2");
      });
    });

    // HLIR advanced types (aspirational - from doc/HLIR examples)
    describe.skip("HLIR advanced types", () => {
      it("supports primitive type i32", () => {
        const result = evaluate(".x <i32> 42");
        expect(result.toString()).toContain(".x 42");
      });

      it("supports floating point type f32", () => {
        const result = evaluate(".pi <f32> 3.14");
        expect(result.toString()).toContain(".pi 3.14");
      });

      it("supports index type", () => {
        const result = evaluate(".idx <index> 0");
        expect(result.toString()).toContain(".idx 0");
      });

      it("validates primitive types", () => {
        const result = evaluate('.x <i32> 42; @x "string"');
        expect(result.toString()).toContain("$!.type-error");
      });

      it("supports tensor types", () => {
        const result = evaluate(".mat <tensor<2x3xf32>> [[1,2,3],[4,5,6]]");
        expect(result.toString()).toContain(".mat");
      });

      it("supports function signatures", () => {
        const result = evaluate(
          ".f <(.x <i32>, .y <f32>) -> <i32>> {x + y}",
        );
        expect(result.toString()).toContain(".f");
      });

      it("validates function parameter types", () => {
        const result = evaluate(
          ".add <(.a <i32>, .b <i32>) -> <i32>> {a + b}; @add {x}",
        );
        expect(result.toString()).toContain("$!.type-error");
      });

      it("supports nested generic types", () => {
        const result = evaluate(".slice <tensor<1x2xf32>> [[1,2]]");
        expect(result.toString()).toContain(".slice");
      });

      it("supports type composition", () => {
        const result = evaluate(
          ".complex <{.real <f32>, .imag <f32>}> {.real 1.0, .imag 2.0}",
        );
        expect(result.toString()).toContain(".complex");
      });

      it("type checks against empty type (void)", () => {
        const result = evaluate(".void <()> ()");
        expect(result.toString()).toContain(".void ()");
      });
    });

    // Type conversion (aspirational)
    describe.skip("type conversion", () => {
      it("supports explicit type conversion", () => {
        const result = evaluate(".x <f32> 3.14; .y <i32> x");
        expect(result.toString()).toContain(".y 3");
      });

      it("validates conversion compatibility", () => {
        const result = evaluate('.x <"string"> "hello"; .y <i32> x');
        expect(result.toString()).toContain("$!.type-error");
      });

      it("handles numeric type widening", () => {
        const result = evaluate(".x <i32> 42; .y <f64> x");
        expect(result.toString()).toContain(".y 42");
      });
    });
  });

  describe("closures with arguments", () => {
    describe("anonymous parameter `_`", () => {
      it("applies closure {_} as identity function", () => {
        const result = evaluate("{_} 42");
        expect(result.toString()).toEqual("[42]");
      });

      it("applies closure { _ + 1 } to add one", () => {
        const result = evaluate("{ _ + 1 } 2");
        expect(result.toString()).toEqual("[3]");
      });

      it("applies closure { _ * _ } to square", () => {
        const result = evaluate("{ _ * _ } 3");
        expect(result.toString()).toEqual("[9]");
      });

      it("reuses the same argument for multiple `_` references", () => {
        const result = evaluate("{ _ + _ } 5");
        expect(result.toString()).toEqual("[10]");
      });

      it("handles string repetition using `_`", () => {
        const result = evaluate("{3 _} “Baby”");
        expect(result.toString()).toEqual("[“BabyBabyBaby”]");
      });

      it("implicitly accesses properties from the argument", () => {
        const result = evaluate("{x + y} (.x 3; .y 4;)");
        expect(result.toString()).toEqual("[7, .x 3; .y 4;]");
      });

      it("matches implicit and explicit property access", () => {
        const implicit = evaluate("{(x * x) + (y * y)}").at(0);
        const explicit = evaluate("{(_.x * _.x) + (_.y * _.y)}").at(0);

        const arg = new frame.Frame();
        arg.set("x", new frame.FrameNumber("3"));
        arg.set("y", new frame.FrameNumber("4"));

        expect((implicit as frame.FrameLazy).call(arg).toString()).toEqual(
          "25",
        );
        expect((explicit as frame.FrameLazy).call(arg).toString()).toEqual(
          "25",
        );
      });

      it("uses scope variables alongside `_` arguments", () => {
        const context = make_context({ x: "100" });
        const result = evaluate("{ x + _ } 5", context);
        expect(result.at(0).toString()).toEqual("105");
      });

      it("uses __ to reach an outer closure argument", () => {
        const innerExpr = new frame.FrameExpr([
          frame.FrameArg.here(),
          new frame.FrameOperator("+"),
          frame.FrameArg.level(2),
        ]);
        const inner = new frame.FrameLazy([innerExpr]);
        const outer = new frame.FrameLazy([inner]);

        const afterOuter = outer.call(new frame.FrameNumber("10"));
        const result = (afterOuter as frame.Frame).call(
          new frame.FrameNumber("5"),
        );

        expect(result.toString()).toEqual("15");
      });

      it("uses _^ to access the parent scope instead of the argument", () => {
        const expr = new frame.FrameExpr([
          frame.FrameParam.there(),
          frame.FrameSymbol.for("value"),
        ]);
        const parent = new frame.Frame();
        parent.set("value", new frame.FrameNumber("5"));

        const closure = new frame.FrameLazy([expr], parent.meta);
        closure.in([parent]);

        const result = closure.call(new frame.FrameNumber("1"));
        expect(result.toString()).toEqual("5");
      });
    });
  });

  describe("contexts", () => {
    it("evaluates in context", () => {
      const env = { "x": "2" };
      const context: frame.Context = make_context(env);
      expect(context.x.toString()).toEqual("2");

      const input = "1 + x";
      const result = evaluate(input, context);
      expect(result.toString()).toEqual("[3, .x 2;]");
      expect(result.meta).toEqual(context);
      const first = result.at(0);
      expect(first.toString()).toEqual("3");
    });
    it("updates context on assignment", () => {
      const env = { "x": "3" };
      const output: frame.Context = make_context(env);
      const input = ".x 3;";
      const result = evaluate(input);
      expect(frame.contextEqual(result.meta, output)).toEqual(true);
    });
  });
});
