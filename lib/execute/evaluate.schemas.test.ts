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

  it("rejects values not in string enumeration", () => {
    const result = evaluate(
      '.color <"red","green","blue"> "red"; @color "yellow"',
    );
    expect(result.toString()).toContain("$!.type-error");
  });

  it("rejects numbers not in enumeration", () => {
    const result = evaluate(".option <1,2,3> 2; @option 4");
    expect(result.toString()).toContain("$!.type-error");
  });

  // Single-value schema tests (constants)
  it("rejects different value for single value schema", () => {
    const result = evaluate(".const <42> 42; @const 43");
    expect(result.toString()).toContain("$!.type-error");
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
        "[0b101]",
      );
      expect(evaluate("<3@Bit> 0b10").toString()).toEqual(
        "[$!.insufficient-bits <3@Bit> 0]",
      );
      expect(evaluate("<3@Bit> 0b1010").toString()).toEqual(
        "[$!.unconsumed-bits 1]",
      );
    });
    it("constructs a remainder from Counts and refuses text", () => {
      expect(evaluate("<[@Bit]> 5").toString()).toEqual(
        "[0b101]",
      );
      expect(evaluate("<[@Bit]> “101”").toString()).toEqual(
        "[$!.bit-input-invalid “101”]",
      );
    });

    it("constructs exact and minimal blobs without broadening membership", () => {
      for (
        const [source, expected] of [
          ["<8@Bit> 5", "[0b00000101]"],
          ["<8@Bit> 0", "[0b00000000]"],
          ["<8@Bit> 255", "[0b11111111]"],
          ["<8@Bit> 256", "[$!.bit-width 8]"],
          ["<2@Bit> 5", "[$!.bit-width 2]"],
          ["<[@Bit]> 0", "[0b0]"],
          ["<64@Bit> 18446744073709551615", "[0b" + "1".repeat(64) + "]"],
          ["<9007199254740991@Bit> 1", "[$!.bit-width 9007199254740991]"],
        ]
      ) expect(evaluate(source).toString()).toEqual(expected);
      for (const value of ["-1", "1.5", "1.0", "“101”"]) {
        for (const schema of ["<8@Bit>", "<[@Bit]>"]) {
          expect(evaluate(`${schema} ${value}`).toString()).toContain(
            "$!.bit-input-invalid",
          );
        }
      }
      for (const schema of ["<8@Bit>", "<[@Bit]>"]) {
        expect(evaluate(`5 ~ ${schema}`).toString()).toEqual("[]");
        const rejected = evaluate(`.x ${schema} 5`);
        expect(rejected.meta.x).toBeUndefined();
        expect(rejected.toString()).toContain("$!.type-error");
      }
    });

    it("iterates bits as Counts in significance order and decodes with HC", () => {
      expect(evaluate("[0b00101 | [], 0b00101 & {_}, 0x0a | []]").toString())
        .toEqual(
          "[[[0, 0, 1, 0, 1], [0, 0, 1, 0, 1], [0, 0, 0, 0, 1, 0, 1, 0]]]",
        );
      expect(
        evaluate("(0b101 | [.n 0; .apply_ {@n (n * 2 + _); }]).n").toString(),
      ).toEqual("[5]");
      expect(evaluate("0b101 = 5").toString()).toEqual("[]");
    });

    it("constructs an ordered capture sequence and validates its fields", () => {
      const schema = "<[.head <3@Bit>; .tail <[@Bit]>;]>";
      expect(evaluate(`${schema} | [.tail 0b111; .head 0b000;]`).toString())
        .toEqual("[[0b000, 0b111]]");
      expect(evaluate(`${schema} | [.head 0b00; .tail 0b1;]`).toString())
        .toEqual("[$!.bit-width 3]");
      expect(evaluate(`${schema} | [.head 3; .tail 0b1;]`).toString()).toEqual(
        "[$!.bit-input-invalid 3]",
      );
      expect(evaluate(`${schema} | [.head 0b000;]`).toString()).toEqual(
        "[$!.property-missing .tail]",
      );
      expect(evaluate(`${schema} | [.__head 0b000; .tail 0b1;]`).toString())
        .toContain("$!.is-private .head");
    });

    it("resolves deferred capture schemas from each call's earlier captures", () => {
      const schema = "<[.n <4@Bit>; .string {<n@Byte>};]>";
      const parsed = evaluate(`${schema} 0x548656c6c6f`).at(0);
      expect(parsed.get_here("n").toString()).toEqual("0b0101");
      expect(parsed.get_here("string").toString()).toEqual(
        "0b0100100001100101011011000110110001101111",
      );
      expect(evaluate(`${schema} | [.n 0b0001; .string 0x48;]`).toString())
        .toEqual("[[0b0001, 0x48]]");
      expect(evaluate(`${schema} 0x548`).toString()).toEqual(
        "[$!.insufficient-bits .string 4]",
      );
      expect(evaluate(`${schema} 0x14800`).toString()).toEqual(
        "[$!.unconsumed-bits 8]",
      );
      const twice = evaluate(`.Net ${schema}; [Net 0x148, Net 0x24869]`)
        .toString();
      expect(twice).toContain(".string 0b01001000;");
      expect(twice).toContain(".string 0b0100100001101001;");
    });

    it("preserves dynamic width scope when a schema is repeated once", () => {
      expect(evaluate(".n 3; (1 <n@Bit>) 5").toString()).toContain("0b101");
      const result = evaluate(
        ".Net <[.n <4@Bit>; .string {<n@Byte>};]>; (1 Net) 0x148",
      );
      expect(result.toString()).toContain("[.n 0b0001; .string 0b01001000;]");
    });

    it("refuses invalid and effectful deferred captures atomically", () => {
      expect(evaluate("<[.n <1@Bit>; .x {42};]> 0b11").toString()).toEqual(
        "[$!.invalid-bit-capture .x]",
      );
      expect(evaluate("<[.x {<[@Bit]>}; .y <1@Bit>;]> 0b11").toString())
        .toEqual("[$!.invalid-remainder-position .x]");
      const result = evaluate(
        ".tally 0; <[.n <1@Bit>; .x {@tally 1; <1@Bit>};]> 0b11",
      );
      expect(result.meta.tally.toString()).toEqual("0");
      expect(result.toString()).toContain("$!.schema-predicate-effect");
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

  describe("edge cases", () => {
    it("leaves a declaration applied to nil unbound", () => {
      // Applying nil to a pending declaration answers the declaration
      // unchanged, so the schema installs and no value binds.
      const result = evaluate(".x <()> ()");
      expect(result.toString()).toEqual("[.x.<> <()>; .x]");
      expect(result.meta.x).toBeUndefined();
    });

    it("leaves a plain declaration applied to nil unbound", () => {
      // Pins doc/LANGUAGE.md "Nil (False)": `.nil ()` answers `.nil`.
      const result = evaluate(".nil ()");
      expect(result.toString()).toEqual("[.nil]");
      expect(result.meta.nil).toBeUndefined();
    });

    it("leaves a nil-valued declaration unbound under the void schema", () => {
      // Same rule as the `.x` case; kept for the old HLIR "void" intent.
      const result = evaluate(".void <()> ()");
      expect(result.toString()).toEqual("[.void.<> <()>; .void]");
      expect(result.meta.void).toBeUndefined();
    });

    it("copies the value of a schema-bound name, not its schema", () => {
      // `@x` is the write alias of `x`, not its value, so the lookup `x`
      // reads the value (spec/a15-closure-inspection.md).
      const result = evaluate(".x <1> 1; .y x");
      expect(result.toString()).toEqual(
        "[.x.<> <1>; .x 1; .y 1; ((.x 1); .y 1)]",
      );
      expect(result.meta["y.<>"]).toBeUndefined();
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
  describe("schema storage", () => {
    it("stores schema under name.<> key", () => {
      const result = evaluate(".x <1> 1");
      expect(result.toString()).toContain(".x.<> <1>");
    });

    it("retrieves schema for validation", () => {
      // `x.<^>` reads the binding's schema; binding a schema to a name
      // installs it as that name's schema.
      const result = evaluate(".x <1> 1; .schema x.<^>");
      expect(result.meta["schema.<>"]).toBe(result.meta["x.<>"]);
      expect(result.meta["schema.<>"]?.toString()).toEqual("<1>");
    });

    it("allows schema definition without initial value", () => {
      const result = evaluate(".x <1,2,3>; @x 2");
      // Schema-only binding support
      expect(result.toString()).toContain(".x 2");
    });
    // A one-term closure or array is a value, not a wrapper around its schema,
    // so declaring one binds it rather than defining a schema (#428).
    it("binds a one-term closure of a schema as the closure", () => {
      const result = evaluate(".s {<_, 1>}; [s 1, s 2]");
      expect(result.meta["s.<>"]).toBeUndefined();
      expect(result.toString()).toEqual(
        "[.s { <_, 1> }; ((.s { <_, 1> }); [<1, 1>, <2, 1>])]",
      );
    });
    it("binds a one-term array of a schema as the array", () => {
      const result = evaluate(".u [<.x>]; [u, u.#]");
      expect(result.meta["u.<>"]).toBeUndefined();
      expect(result.toString()).toEqual(
        "[.u [<.x>]; ((.u [<.x>]); [[<.x>], 1])]",
      );
    });
    it("prints a declared one-term closure of a schema as the closure", () => {
      // `c` prints as the literal `{<.x>}` prints outside a declaration.
      expect(evaluate("{<.x>}").toString()).toEqual("[{ <.x> }]");
      expect(evaluate(".c {<.x>}; c").toString()).toEqual(
        "[.c { <.x> }; ((.c { <.x> }); { <.x> })]",
      );
    });
  });

  // A closure inside a schema is a predicate candidate (#536); the HC-level
  // claims live in the "Predicate schema candidates" section of hc/testdoc.hc.
  describe("predicate schema candidates (#536)", () => {
    it("admits a value the predicate answers and refuses one it nils", () => {
      expect(evaluate("[5 ~ <{_.< 10}>, 50 ~ <{_.< 10}>]").toString())
        .toEqual("[[<>, ()]]");
    });
    it("binds an admitted value and refuses a later write", () => {
      const result = evaluate(".small <{_.< 10}> 5; @small 50");
      expect(result.toString()).toContain(
        "$!.type-error .small <{ _ .< 10 }> 50",
      );
      expect(result.meta["small"]?.toString()).toEqual("5");
    });
    it("composes with other candidates in a union", () => {
      expect(
        evaluate(
          "[0 ~ <0, {_.> 100}>, 101 ~ <0, {_.> 100}>, 50 ~ <0, {_.> 100}>]",
        )
          .toString(),
      ).toEqual("[[<>, <>, ()]]");
    });
    it("treats a predicate's error as a failure and its reason", () => {
      expect(evaluate("<{$!!.too-big}> 5").toString()).toEqual(
        "[$!!.too-big]",
      );
      expect(evaluate("[“a” ~ <{_.< 10}>]").toString()).toEqual("[[()]]");
    });
    it("binds the value unchanged", () => {
      expect(evaluate(".d <{_ ~ 1.5.<>}> 3; 1 / d").toString()).toEqual(
        "[.d.<> <{ _ ~ (1 .5 .<>) }>; .d 3; ((.d 3); 1/3)]",
      );
    });
    it("admits a closure read from an aggregate", () => {
      expect(evaluate(".n [.p {_.< 10}]; 5 ~ <n.p>").toString()).toEqual(
        "[.n [.p { _ .< 10 };]; ((.n [.p { _ .< 10 };]); <>)]",
      );
    });
    it("refuses an effectful predicate when the schema is built", () => {
      expect(
        evaluate(".tally 0; .bump {@tally (tally + 1); <>}; <bump>")
          .toString(),
      ).toContain("$!.schema-predicate-effect");
      const result = evaluate(
        ".tally 0; .bump {@tally (tally + 1); <>}; 5 ~ <bump>",
      );
      expect(result.meta["tally"]?.toString()).toEqual("0");
    });
    it("refuses a predicate that calls a writing closure", () => {
      const source = ".tally 0; .bump {@tally (tally + 1); <>}; .p {bump _}; ";
      expect(evaluate(source + "<p>").toString()).toContain(
        "$!.schema-predicate-effect",
      );
      const result = evaluate(source + "5 ~ <p>");
      expect(result.meta["tally"]?.toString()).toEqual("0");
    });
    // The construction-time walk cannot see these writes, so the call's
    // guard refuses them and the match fails with nothing written.
    it("refuses a write through the matched value", () => {
      const source = ".tally 0; .bump {@tally (tally + 1); <>}; ";
      const called = evaluate(source + ".p {_ (); <>}; [bump ~ <p>, <p> bump]");
      expect(called.toString()).toContain("[(), $!.schema-predicate-effect]");
      expect(called.meta["tally"]?.toString()).toEqual("0");
      const iterated = evaluate(
        source + ".q {_ & {_ ()}; <>}; [[bump] ~ <q>, <q> [bump]]",
      );
      expect(iterated.toString()).toContain(
        "[(), $!.schema-predicate-effect]",
      );
      expect(iterated.meta["tally"]?.toString()).toEqual("0");
    });
    it("refuses a write through an iterated aggregate of closures", () => {
      const result = evaluate(
        ".tally 0; .bump {@tally (tally + 1); <>}; .fns [bump]; " +
          ".p {fns & {_ ()}; <>}; [5 ~ <p>, 6 ~ <p>, <p> 7]",
      );
      expect(result.toString()).toContain(
        "[(), (), $!.schema-predicate-effect]",
      );
      expect(result.meta["tally"]?.toString()).toEqual("0");
    });
    it("lets a predicate write frames it creates", () => {
      expect(evaluate("5 ~ <{.v _; v.< 10}>").toString()).toEqual("[<>]");
    });
    it("admits a read-only closure over a file name", () => {
      expect(evaluate(".limit 10; 5 ~ <{_.< limit}>").toString()).toEqual(
        "[.limit 10; ((.limit 10); <>)]",
      );
    });
  });
});
