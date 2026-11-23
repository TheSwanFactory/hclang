import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { evaluate } from "./evaluate.ts";
import * as frame from "../frames.ts";

describe("evaluate: schemas", () => {
  it("evaluates negative schemas and installs their metadata", () => {
    const schema = evaluate("<-1>");
    const declaration = evaluate(".t <-1 | 2>");

    expect(schema.at(0)).toBeInstanceOf(frame.FrameSchema);
    expect(schema.at(0).toString()).toEqual("<-1>");
    expect(declaration.meta["t.<>"]).toBeInstanceOf(frame.FrameSchema);
    expect(declaration.meta["t.<>"]?.toString()).toEqual("<-2>");
    expect(declaration.toString()).not.toContain("resource-import-syntax");
  });

  it("binds value with schema and reports assignment", () => {
    const result = evaluate(".one <1> 1");
    expect(result.toString()).toEqual("[.one.<> <1>; .one 1;]");
  });

  it("rejects values that do not match the schema", () => {
    const result = evaluate(".one <1> 1; @one 2");
    // The program frame holds `one`, so its own echo prints once from the
    // property plane. The statement group does not hold it, so the echo
    // inside that group is the only record of what that statement did.
    expect(result.toString()).toEqual(
      "[.one.<> <1>; .one 1; ((.one 1); $!.type-error .one <1> 2)]",
    );
  });

  // Empty schema tests
  it("accepts any value with empty schema", () => {
    const result = evaluate(".x <> 42");
    // Empty schema stores differently than full schemas
    expect(result.toString()).toEqual("[.x <>; 42]");
  });

  it("allows reassignment with empty schema", () => {
    const result = evaluate('.x <> 42; @x "hello"');
    expect(result.toString()).toContain(".x “hello”");
  });

  it("accepts values from string enumeration", () => {
    const result = evaluate('.color <"red","green","blue"> "red"');
    expect(result.toString()).toContain(".color “red”");
  });

  it("rejects values not in string enumeration", () => {
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

  it("enforces string literal type", () => {
    const result = evaluate('.status <"ok"> "ok"');
    expect(result.toString()).toContain(".status “ok”");
  });

  // Reassignment tests
  it("returns the assigned value when reassigning a variable", () => {
    const result = evaluate(".variable 42; .variable 113");
    expect(result.at(0).toString()).toEqual("((.variable 42); 113)");
    expect(result.meta.variable.toString()).toEqual("113");
  });

  it("rejects reassignment of a constant without changing its value", () => {
    const result = evaluate(".Constant 21; .Constant 7");
    expect(result.at(0).toString()).toEqual(
      "((.Constant 21); $error{$is-constant .Constant})",
    );
    expect(result.meta.Constant.toString()).toEqual("21");
  });

  it("allows multiple valid assignments", () => {
    const result = evaluate(".x <1,2> 1; @x 2; @x 1");
    expect(result.toString()).not.toContain("$!.type-error");
  });

  it("maintains schema across assignments", () => {
    const result = evaluate(".x <1> 1; @x 1; @x 1");
    const lines = result.toStringArray();

    // Properties come first, and the schema prints beside the value it
    // grades rather than after the statements.
    expect(lines[0]).toEqual(".x.<> <1>; .x 1;");
    expect(lines[1]).toEqual("((.x 1); (1); 1)");
  });

  describe("minimal deconstruction", () => {
    it("aligns membership with evidence-producing application", () => {
      const cases = [
        ["2", "<1,2>", "2"],
        ["[.x 1;]", "<.x>", "[1]"],
        ["0b101", "<3@Bit>", "0b101"],
        ["0b101", "<[@Bit]>", "0b101"],
        [
          "0b10101",
          "<[.head <3@Bit>; .tail <[@Bit]>;]>",
          "[.head 0b101; .tail 0b01;]",
        ],
      ];

      for (const [value, schema, evidence] of cases) {
        expect(evaluate(`${value} ~ ${schema}`).at(0)).toBe(frame.Frame.all);
        expect(evaluate(`${schema} ${value}`).at(0).toString()).toEqual(
          evidence,
        );

        const binding = evaluate(`.value ${schema} ${value}`);
        expect(binding.meta.value).toBeDefined();
        expect(binding.toString()).not.toContain("$!.type-error");
      }
      expect(evaluate("0b10 ~ <3@Bit>").toString()).toEqual("[]");
      expect(evaluate("<3@Bit> 0b10").at(0).toString()).toEqual(
        "$!.insufficient-bits <3@Bit> 0",
      );

      const rejected = evaluate(".value <3@Bit> 0b10");
      expect(rejected.meta.value).toBeUndefined();
      expect(rejected.at(0).toString()).toEqual(
        "$!.type-error .value <3@Bit> 0b10",
      );
    });

    it("composes named schema and runtime-type candidates", () => {
      const nested = evaluate(
        ".Small <1,2>; .value <Small> 2; @value 3",
      );
      expect(nested.meta.value.toString()).toEqual("2");
      expect(nested.at(0).toString()).toContain(
        "$!.type-error .value <<1, 2>> 3",
      );

      const runtime = evaluate(
        ".Text <(“”).<>>; .value <Text> “Q”; @value 1",
      );
      expect(runtime.meta.value.toString()).toEqual("“Q”");
      expect(runtime.at(0).toString()).toContain(
        "$!.type-error .value <<(“”).<>>> 1",
      );
    });

    it("keeps ordinary aggregate values available to enumeration", () => {
      expect(evaluate("<[1,2]> [1,2]").toString()).toEqual("[[1, 2]]");
    });

    it("retrieves the schema attached to a binding after reassignment", () => {
      const result = evaluate(".x <1,2> 1; @x 2; x.<^>");
      expect(result.at(0).toString()).toContain("<1, 2>");
      expect(result.meta.x.toString()).toEqual("2");
    });

    it("reports a missing binding schema", () => {
      const result = evaluate(".plain 1; plain.<^>");
      expect(result.at(0).toString()).toContain("$!.schema-missing .plain");
    });

    it("selects direct properties in schema order without mutation", () => {
      const result = evaluate("<.x, .z> [.x 1; .y 2; .z 3;]");
      expect(result.toString()).toEqual("[[1, 3]]");
    });

    it("rejects invalid, missing, and inaccessible selector inputs", () => {
      expect(evaluate("<.x> 1").toString()).toEqual(
        "[$!.selector-input-invalid 1]",
      );
      expect(evaluate("<.x> [.y 2;]").toString()).toEqual(
        "[$!.property-missing .x]",
      );
      expect(evaluate("<.secret> [.__secret 1;]").toString()).toEqual(
        "[$!.is-private .secret]",
      );
    });

    it("matches exact and complete bit schemas", () => {
      expect(evaluate("<8@Bit> 0xff").toString()).toEqual("[0xff]");
      expect(evaluate("<[@Bit]> 0b101").toString()).toEqual("[0b101]");
    });

    it("requires exact safe integers for bit widths", () => {
      expect(evaluate("<1.0@Bit> 0b1").toString()).toEqual(
        "[$!.unsupported-schema-match]",
      );
      expect(
        evaluate("<9007199254740992@Bit> 0b1").toString(),
      ).toEqual("[$!.unsupported-schema-match]");
    });

    it("distinguishes invalid, short, and long bit inputs", () => {
      expect(evaluate("<3@Bit> 5").toString()).toEqual(
        "[$!.bit-input-invalid 5]",
      );
      expect(evaluate("<3@Bit> 0b10").toString()).toEqual(
        "[$!.insufficient-bits <3@Bit> 0]",
      );
      expect(evaluate("<3@Bit> 0b1010").toString()).toEqual(
        "[$!.unconsumed-bits 1]",
      );
    });

    it("defines and reuses a named bit splitter with exact-width results", () => {
      const result = evaluate(
        ".Split <[.head <3@Bit>; .tail <[@Bit]>;]>; " +
          "Split 0b00101; Split 0b11000; Split.<^>",
      );
      const output = result.at(0).toString();
      expect(output).toContain("[.head 0b001; .tail 0b01;]");
      expect(output).toContain("[.head 0b110; .tail 0b00;]");
      expect(output).toContain(
        "<[.head <3@Bit>; .tail <[@Bit]>;]>",
      );
    });

    it("fails sequences atomically for empty remainder and leftovers", () => {
      expect(
        evaluate("<[.head <3@Bit>; .tail <[@Bit]>;]> 0b101").toString(),
      ).toEqual("[$!.insufficient-bits .tail 3]");
      expect(evaluate("<[.head <3@Bit>;]> 0b1010").toString()).toEqual(
        "[$!.unconsumed-bits 1]",
      );
    });

    it("rejects misplaced remainders, duplicate names, and mixed forms", () => {
      expect(
        evaluate(
          "<[.tail <[@Bit]>; .head <1@Bit>;]> 0b1",
        ).toString(),
      ).toEqual("[$!.invalid-remainder-position .tail]");
      expect(
        evaluate("<[.x <1@Bit>; .x <1@Bit>;]> 0b11").toString(),
      ).toEqual("[$!.duplicate-capture-name .x]");
      expect(evaluate("<1,.x> 1").toString()).toEqual(
        "[$!.unsupported-schema-match]",
      );
    });
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
