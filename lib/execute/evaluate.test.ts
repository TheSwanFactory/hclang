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
