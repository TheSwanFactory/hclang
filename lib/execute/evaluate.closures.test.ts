import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "./evaluate.ts";
import { make_context } from "./hc-eval.ts";
import * as frame from "../frames.ts";

describe("evaluate: closures with arguments", () => {
  describe("write target", () => {
    const last = (source: string): string => {
      const results = evaluate(source).asArray();
      return results[results.length - 1].toString();
    };

    it("binds locally when the argument is a plain name", () => {
      expect(last(".X [1];\n.f {.o 2; o};\nf X;\nX\n")).toEqual("[1]");
    });

    it("writes through a name declared mutable", () => {
      expect(last(".X_ [1];\n.f {.o 2; o};\nf X_;\nX_\n")).toEqual(
        "[.o 2; 1]",
      );
    });

    it("leaves a child reached by name untouched under map", () => {
      expect(last(".A [];\n.E [A];\nE & {.o 2; o};\nA\n")).toEqual("[]");
    });

    it("does not make a mapped Figure refer to itself (005.30c probe 6.4)", () => {
      expect(last(".A [];\n.E5 [A, [A]];\n.r5 (E5 & {.o _; o});\nE5\n"))
        .toEqual("[[], [[]]]");
    });
  });

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

    it("returns the last statement while preserving one-statement results", () => {
      const two = evaluate(".two {1; 2}").meta.two as frame.FrameLazy;
      const setup = evaluate(".h {.k {7}; k()}").meta.h as frame.FrameLazy;
      const one = evaluate(".one {1;}").meta.one as frame.FrameLazy;

      expect(two.call(frame.Frame.nil).toString()).toEqual("2");
      expect(setup.call(frame.Frame.nil).toString()).toEqual("7");
      expect(one.call(frame.Frame.nil).toString()).toEqual("(1)");
    });

    it("sequences only a body the source separated with `;`", () => {
      // The parser records the separator, so intent distinguishes the two
      // cases: an assembled body is one juxtaposed expression as before,
      // even though its items happen to carry the statement flag.
      const parsed = evaluate(".seq {1; 2}").meta.seq as frame.FrameLazy;
      expect(parsed.is.sequence).toBe(true);
      expect(parsed.call(frame.Frame.nil).toString()).toEqual("2");

      const first = new frame.FrameExpr([new frame.FrameInt("1")]);
      const second = new frame.FrameExpr([new frame.FrameInt("2")]);
      first.is.statement = true;
      second.is.statement = true;
      const assembled = new frame.FrameLazy([first, second]);

      expect(assembled.is.sequence).toBeUndefined();
      expect(assembled.call(frame.Frame.nil).toString()).toEqual("(1)");
    });

    it("stops a sequenced body at its first failing statement", () => {
      // Later statements were written to run after the earlier ones
      // succeeded, so a sequence short-circuits where juxtaposition does not.
      const halted = evaluate(".f {.Fixed 1; .Fixed 2; 42}; f()");
      expect(halted.at(0).asArray().at(-1)?.toString())
        .toContain("$is-constant .Fixed");
    });

    it("declares the argument under a name instead of into it", () => {
      // A closure's write target is its own call frame, so naming the
      // argument binds it here rather than setting a key on the argument to
      // the argument itself. That was the source of the #337 self-cycle.
      const cases: Array<[string, string]> = [
        [".helper {.target _}; helper(1)", ".target 1"],
        ["{.target _}(1)", ".target 1"],
        [".helper {.target _}; helper([1])", ".target [1]"],
        ["{.target _}([1])", ".target [1]"],
        [".helper {.target _; target}; helper(1)", "1"],
        [".helper {.target [_]}; helper([1])", ".target [[1]]"],
      ];

      for (const [source, expected] of cases) {
        expect(evaluate(source).at(0).asArray().at(-1)?.toString())
          .toEqual(expected);
      }
    });

    it("binds a captured argument per call without cross-talk", () => {
      const source = ".mk {.v _; {v}}; [mk(1)(), mk(2)(), mk(1)()]";
      expect(evaluate(source).at(0).asArray().at(-1)?.toString())
        .toEqual("[1, 2, 1]");
    });

    it("reads a method's own aggregate through _^", () => {
      const result = evaluate(
        ".owner [.x 1; .read {_^.x}]; owner.read()",
      );

      expect(result.at(0).asArray().at(-1)?.toString()).toEqual("1");
    });

    describe("an argument is read-only (#419)", () => {
      const last = (source: string): string | undefined =>
        evaluate(source).at(0).asArray().at(-1)?.toString();

      it("collects onto a copy when a block applies its element", () => {
        expect(last(".xs [[1], [2]]; [xs & {_ 9}, xs, {_ 9} (xs .0)]"))
          .toEqual("[[[1, 9], [2, 9]], [[1], [2]], [1, 9]]");
        expect(last(".xs [[1], [2]]; xs & {_ 9}; xs")).toEqual("[[1], [2]]");
      });

      it("repeats a declared apply_ on a copy of its operand", () => {
        expect(last(
          ".Acc {[.n _; .apply_ {@n (_^.n + 1);}]}; .a (Acc 0); " +
            "[(3 a).n, a.n]",
        )).toEqual("[2, 0]");
      });
    });

    describe("_^ in a method is its receiver (v0.23.0)", () => {
      const last = (source: string): string | undefined =>
        evaluate(source).at(0).asArray().at(-1)?.toString();

      it("reads the descendant an inherited method was found on", () => {
        expect(last(
          ".Base [.x 1; .get {_^.x}]; .Kid [.^ Base; .x 2]; " +
            "[Base.get(), Kid.get()]",
        )).toEqual("[1, 2]");
      });

      it("reads a functional copy's own fields", () => {
        expect(last(
          ".Pt [.n 1; .read {_^.n}; .bump_ {@n (_^.n + 1);}]; " +
            ".p2 (Pt.bump_ ()); [p2.read(), (p2.bump_ ()).n, Pt.n]",
        )).toEqual("[2, 3, 1]");
      });

      it("still skips an argument that shadows a field", () => {
        expect(last(".Pt [.n 1; .peek {[n, _^.n]}]; Pt.peek [.n 7]"))
          .toEqual("[7, 1]");
      });

      it("keeps a non-mutating method from writing through it", () => {
        expect(last(
          ".C [.k 0; .bump_ {@k (k + 1);}; .sneak {(_^.bump_ ()).k}]; " +
            "[C.sneak(), C.k]",
        )).toEqual("[1, 0]");
      });

      it("writes only the copy behind an immutable handle", () => {
        expect(last(
          ".E [.k 0; .bump_ {@k (k + 1);}; " +
            ".twice_ {_^.bump_ (); _^.bump_ ();}]; [(E.twice_ ()).k, E.k]",
        )).toEqual("[2, 0]");
      });

      it("writes the receiver itself behind a mutable handle", () => {
        expect(last(
          ".D_ [.k 0; .bump_ {@k (k + 1);}; " +
            ".twice_ {_^.bump_ (); _^.bump_ ();}]; D_.twice_ (); D_.k",
        )).toEqual("2");
      });

      it("keeps every write of chained functional updates", () => {
        expect(last(
          ".Q [.items []; .push_ {@items (_^.items _);}]; " +
            "((Q.push_ 1).push_ 2).items",
        )).toEqual("[1, 2]");
      });

      it("reaches the receiver from a nested block one caret further out", () => {
        expect(last(
          ".Outer [.k 1; .ks {[1, 2] & {_^^.k}}]; " +
            ".Inner [.^ Outer; .k 5]; [Outer.ks(), Inner.ks()]",
        )).toEqual("[[1, 1], [5, 5]]");
      });

      it("binds a method read by dot from a value no name holds", () => {
        expect(last(
          '.Base [.x "base"; .get {_^.x}]; ' +
            ".Ticker {[.k _; .bump_ {@k (k + 1);}]}; " +
            '[[.^ Base; .x "kid"].get(), ' +
            "([1, 2] & {Ticker _}) & {(_.bump_ ()).k}]",
        )).toEqual("[“kid”, [2, 3]]");
      });

      it("names the receiver for a closure stored as a method", () => {
        expect(last(
          '.x "file"; .f {_^.x}; .obj [.x "obj"; .m f]; [f(), obj.m()]',
        )).toEqual("[“file”, “obj”]");
      });
    });

    it("implicitly accesses properties from the argument", () => {
      const result = evaluate("{x + y} (.x 3; .y 4;)");
      expect(result.toString()).toEqual("[7]");
      expect(result.meta.x).toBeUndefined();
      expect(result.meta.y).toBeUndefined();
    });

    it("matches implicit and explicit property access", () => {
      const implicit = evaluate("{(x * x) + (y * y)}").at(0);
      const explicit = evaluate("{(_.x * _.x) + (_.y * _.y)}").at(0);

      const arg = new frame.Frame();
      arg.set("x", new frame.FrameInt("3"));
      arg.set("y", new frame.FrameInt("4"));

      expect((implicit as frame.FrameLazy).call(arg).toString()).toEqual(
        "25",
      );
      expect((explicit as frame.FrameLazy).call(arg).toString()).toEqual(
        "25",
      );
    });

    it("uses the explicit host namespace alongside `_` arguments", () => {
      const context = make_context({ x: "100" });
      const result = evaluate("{ $$.x + _ } 5", context);
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

      const afterOuter = outer.call(new frame.FrameInt("10"));
      const result = (afterOuter as frame.Frame).call(
        new frame.FrameInt("5"),
      );

      expect(result.toString()).toEqual("15");
    });

    it("uses _^ to access the parent scope instead of the argument", () => {
      const expr = new frame.FrameExpr([
        frame.FrameParam.there(),
        frame.FrameSymbol.for("value"),
      ]);
      const parent = new frame.Frame();
      parent.set("value", new frame.FrameInt("5"));

      const closure = new frame.FrameLazy([expr], parent.meta);
      const bound = closure.in([parent]);

      const result = bound.call(new frame.FrameInt("1"));
      expect(result.toString()).toEqual("5");
    });

    it("parses _^ as source-level parent lookup", () => {
      const result = evaluate(
        ".print-parent {_^.var}; .var “parent”; " +
          "print-parent(.var “argument”)",
      );

      expect(result.at(0).toString()).toContain("“parent”");
      expect(result.meta.var.toString()).toEqual("“parent”");
    });

    it("never reads the argument through _^, even when called with one", () => {
      // The expression a stale format.hc fixture expected to yield 9. A
      // plain call supplies no parameter, and `_^` would not read one
      // anyway: it reaches past the argument to the lexical scope, which
      // here declares no `value`.
      const result = evaluate("{_^.value} (.value 9;)");

      expect(result.at(0).toString()).toContain("$!.name-missing");
    });

    it("reaches the enclosing scope through _^ inside an iterator block", () => {
      const result = evaluate(".k 7; [10] & { _^.k }");

      expect(result.at(0).asArray().at(-1)?.toString()).toEqual("[7]");
    });

    it("reaches the address a map withholds by projecting a tuple", () => {
      const result = evaluate("[10, 20, 30] && { _ .0 }");

      expect(result.at(0).toString()).toEqual("[.0, .1, .2]");
    });

    it("reaches a property key the same way, in declaration order", () => {
      const result = evaluate("(.a 1; .b 2;) && { _ .0 }");

      expect(result.at(0).toString()).toEqual("[.a, .b]");
    });

    it("supplies no dot parameter to an iterator block", () => {
      // The accumulator is the receiver and the address arrives in a tuple,
      // so iteration has no parameter slot left to fill.
      for (const source of ["[10, 20] & { . }", "[10, 20] && { . }"]) {
        expect(evaluate(source).at(0).toString()).toContain(
          "$!.name-missing",
        );
      }
    });

    it("reads exact enclosing parameter levels through repeated dots", () => {
      // Iteration no longer fills the parameter slot, so an explicit call
      // parameter is what drives the ladder.
      const own = new frame.FrameLazy([new frame.FrameName("")]);
      const enclosing = new frame.FrameLazy([
        new frame.FrameExpr([
          new frame.FrameLazy([new frame.FrameName(".")]),
          new frame.FrameGroup([]),
        ]),
      ]);
      const exactMiss = new frame.FrameLazy([
        new frame.FrameExpr([
          new frame.FrameLazy([new frame.FrameName("")]),
          new frame.FrameGroup([]),
        ]),
      ]);
      const parameter = frame.FrameInt.for("7");

      expect(own.in([]).call(frame.Frame.nil, parameter).toString())
        .toEqual("7");
      expect(enclosing.in([]).call(frame.Frame.nil, parameter).toString())
        .toEqual("7");
      expect(exactMiss.in([]).call(frame.Frame.nil, parameter).toString())
        .toContain("$!.name-missing");
    });

    it("reports missing dot reads instead of a setter or `this`", () => {
      for (
        const source of [
          "{ . } ()",
          "{ . + 1 } (5)",
          "[.value 9; .read {.};].read()",
        ]
      ) {
        const result = evaluate(source);
        expect(result.at(0).toString()).toContain("$!.name-missing");
        expect(result.meta[""]).toBeUndefined();
      }
    });

    it("reads the live enclosing scope through an empty argument", () => {
      const result = evaluate(
        ".x 42; .y 3; .mag {(x * x) + (y * y)}; " +
          ".x 3; .y 4; mag []",
      );

      expect(result.at(0).asArray().at(-1)?.toString()).toEqual("25");
    });

    it("keeps explicit argument shadowing ahead of the live parent", () => {
      const result = evaluate(
        ".x 3; .read-x {x}; read-x(.x 9;)",
      );

      expect(result.at(0).asArray().at(-1)?.toString()).toEqual("9");
      expect(result.meta.x.toString()).toEqual("3");
    });

    it("does not leak arguments between repeated calls", () => {
      const result = evaluate(
        ".x 3; .read-x {x}; read-x(.x 9;); read-x []",
      );

      expect(result.at(0).asArray().at(-1)?.toString()).toEqual("3");
    });
  });

  describe("the argument layer (spec 7, layer 2)", () => {
    it("reads the argument's own and inherited properties", () => {
      const answer = (source: string): string | undefined =>
        evaluate(source).at(0).asArray().at(-1)?.toString();

      expect(answer(".f {v}; f [.v 1]")).toEqual("1");
      expect(answer(".base [.v 2]; .f {v}; f [.^ base]")).toEqual("2");
    });

    it("never reads through the scope that built the argument", () => {
      // `a` is built where `f` is 5, and `g` is written where `f` is 9. The
      // argument contributes only its own `v`, so `g` reads its own `f`.
      const result = evaluate(
        ".f 5; .a [.v 1]; .outer {.f 9; .g {f}; g a}; outer()",
      );

      expect(result.at(0).asArray().at(-1)?.toString()).toEqual("9");
    });

    it("keeps a method's locals ahead of a caller's bindings in its blocks", () => {
      const result = evaluate(
        ".P {[.m {.y _; [0] & {y}}]}; .p (P []); .y 99; p.m 7",
      );

      expect(result.at(0).asArray().at(-1)?.toString()).toEqual("[7]");
    });
  });
});
