
import { expect } from "chai";
import {} from "mocha";
import { evaluate } from "../../src/execute/evaluate";
import * as frame from "../../src/frames";

describe("evaluate", () => {
  it("is exported", () => {
    expect(evaluate).to.be.ok;
  });

  it("returns empty array for empty string", () => {
    const result = evaluate.call("");
    expect(result.toString()).to.equal("[]");
  });

  it("ignores comments", () => {
    const input = "#Goodbye";
    const result = evaluate(input);
    expect(result.toString()).to.equal(`[]`);
  });

  it("ignores spaces", () => {
    const input = "  ";
    const result = evaluate(input);
    expect(result.toString()).to.equal(`[]`);
  });

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
    expect(result.toString()).to.equal(`[“Hello, HC!”]`);
  });

  it("joins around inner space", () => {
    const input = "“Hello” “, HC!”";
    const result = evaluate(input);
    expect(result.toString()).to.equal(`[“Hello, HC!”]`);
  });

  it("joins multi-line doc-strings into strings", () => {
    const input = "```\nDoc String\n```";
    const result = evaluate(input);
    expect(result.toString()).to.equal(`[“\nDoc String\n”]`);
  });

  describe("symbols", () => {
    const key = "key";
    const value = "value";
    const frame_value = new frame.FrameString("value");
    const setting = `.${key} ${frame_value}`;

    it("evaluates in context", () => {
      const context: frame.Context = {key: frame_value};
      const result = evaluate(key, context) as frame.FrameArray;
      expect(result.size()).to.equal(1);
      const output = result.at(0);
      expect(output.toString()).to.equal(frame_value.toString());
    });

    it("evaluates names to symbols", () => {
      const result = evaluate(`.${key}`) as frame.FrameArray;
      expect(result.size()).to.equal(1);
      const output = result.at(0);
      expect(output).to.be.instanceof(frame.FrameSymbol);
    });

    it("set symbols in result", () => {
      const result = evaluate(setting) as frame.FrameArray;
      const extracted = result.get(key);
      expect(extracted.toString()).to.equal(frame_value.toString());
    });

    it("evaluates created symbols", () => {
      const input = `${setting}\n${key}`;
      const result = evaluate(input) as frame.FrameArray;
      // console.error(`result:`);
      // console.error(result);

      expect(result.size()).to.equal(2);
      const output = result.at(1);
      expect(output.toString()).to.equal(frame_value.toString());
    });
  });
});
