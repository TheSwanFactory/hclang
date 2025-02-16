import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";

import { evaluate } from "../../src/execute/evaluate.ts";
import * as frame from "../../src/frames.ts";

describe("evaluate", () => {
  it("is exported", () => {
    expect(evaluate).to.be.ok;
  });

  it("returns empty array for empty string", () => {
    const result = evaluate.call("", "");
    expect(result).to.be.instanceof(frame.FrameArray);
    expect(result.toString()).to.equal("[]");
  });

  it("ignores comments", () => {
    const input = "#Goodbye";
    const result = evaluate(input);
    expect(result.toString()).to.equal("[]");
  });

  it("ignores spaces", () => {
    const input = "  ";
    const result = evaluate(input);
    expect(result.toString()).to.equal("[]");
  });

  describe("strings", () => {
    it("quines string literal", () => {
      const input = "“Hello, HC!”";
      const result = evaluate(input);
      expect(result.toString()).to.equal(`[${input}]`);
    });

    it("quines string before spaces", () => {
      const input = "“Hello, HC!”";
      const suffix = `${input}  `;
      const result = evaluate(suffix);
      expect(result.toString()).to.equal(`[${input}]`);
    });

    it("quines string after spaces", () => {
      const input = "“Hello, HC!”";
      const prefix = `  ${input}`;
      const result = evaluate(prefix);
      expect(result.toString()).to.equal(`[${input}]`);
    });

    it("joins multiple strings", () => {
      const input = "“Hello”“, HC!”";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[“Hello, HC!”]");
    });

    it("joins around inner space", () => {
      const input = "“Hello” “, HC!”";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[“Hello, HC!”]");
    });

    it("joins multi-line doc-strings into strings", () => {
      const input = "```\nDoc String\n```";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[“\nDoc String\n”]");
    });

    it("joins around comments", () => {
      const input = "“Hello”#ignore me#“, HC!”";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[“Hello, HC!”]");
    });
  });

  describe("grouping", () => {
    it("returns FrameArray for empty []", () => {
      const result = evaluate("[]");
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameArray);
    });

    it("returns closure for empty {}", () => {
      const result = evaluate("{}");
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameLazy);
    });

    it("returns FrameNote for empty ()", () => {
      const result = evaluate("()");
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameNote);
    });

    it("returns FrameArray for empty [] with spaces", () => {
      const result = evaluate("  [  ]  ");
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameArray);
    });

    it("returns FrameArray for empty [] with comments", () => {
      const result = evaluate("[#comment#]");
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameArray);
    });

    it("returns FrameNote for mis-matched brackets", () => {
      const result = evaluate("[}");
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameNote);
    });

    it("returns FrameNote for un-opened close bracket", () => {
      const result = evaluate("}");
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameNote);
    });
  });

  describe("numbers", () => {
    it("repeats strings when applied", () => {
      const input = "3“Hello”";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[“HelloHelloHello”]");
    });

    it("multiplies numbers when applied", () => {
      const input = "3 2";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[6]");
    });

    it("uses .+ for addition", () => {
      const input = "3.+2";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[5]");
    });

    it("uses non-dot + for addition", () => {
      const input = "3+2";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[5]");
    });

    it("uses .%% for modulo", () => {
      const input = "3.%%2";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[1]");
    });

    it("uses .** for power", () => {
      const input = "3.**2";
      const result = evaluate(input);
      expect(result.toString()).to.equal("[9]");
    });

    describe("binding", () => {
      it("accesses array items by index", () => {
        const input = "[9,8].0";
        const result = evaluate(input);
        expect(result.toString()).to.equal("[9]");
      });

      it("groups properties explicitly", () => {
        const input = "([9,8].0)+([7,6].1)";
        const result = evaluate(input);
        expect(result.toString()).to.equal("[15]");
      });

      it("binds expressions with initial spaces", () => {
        const input = " [9,8].0";
        const result = evaluate(input);
        expect(result.toString()).to.equal("[9]");
      });

      it("binds expressions with interior spaces", () => {
        const input = "[9,8] .0";
        const result = evaluate(input);
        expect(result.toString()).to.equal("[9]");
      });

      it("binds expressions with interior spaces", () => {
        const input = "1 .+ 2";
        const result = evaluate(input);
        expect(result.toString()).to.equal("[3]");
      });

      it("groups properties using spaces", () => {
        const input = "[9,8].0 + [7,6].1";
        const result = evaluate(input);
        expect(result.toString()).to.equal("[15]");
      });
    });
  });
  describe("contexts", () => {
    it("evaluates in context", () => {
      const context: frame.Context = {
        "x": new frame.FrameNumber("2"),
      };
      expect(context.x.toString()).to.equal("2");
      const input = "1 + x";
      const result = evaluate(input, context);
      expect(result.toString()).to.equal("[3, .x 2;]");
      expect(result.meta).to.equal(context);
      const first = result.at(0);
      expect(first.toString()).to.equal("3");
    });
    it("updates context on assignment", () => {
      const output: frame.Context = {
        "x": new frame.FrameNumber("3"),
      };
      const input = ".x 3;";
      const result = evaluate(input);
      expect(frame.contextString(result.meta)).to.equal(
        frame.contextString(output),
      );
    });
  });
});
