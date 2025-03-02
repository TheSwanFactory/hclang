import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

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

  it.skip("converts <> to Frame.all", () => {
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
