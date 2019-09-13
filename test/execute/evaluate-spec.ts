
import { expect } from "chai";
import { } from "mocha";
import { evaluate } from "../../src/execute/evaluate";
import * as frame from "../../src/frames";

describe("evaluate", () => {
  it("is exported", () => {
    expect(evaluate).to.be.ok;
  });

  it("returns empty array for empty string", () => {
    const result = evaluate.call("");
    expect(result).to.be.instanceof(frame.FrameArray)
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
  });

  describe("numbers", () => {
    it("returns numbers", () => {
      const input = "123";
      const result = evaluate(input);
      expect(result).to.be.instanceof(frame.FrameNumber);
      expect(result.toString()).to.equal(input);

      const digit = "9";
      const result2 = evaluate(digit);
      expect(result2).to.be.instanceof(frame.FrameNumber);
      expect(result2.toString()).to.equal(digit);
    });

    it("joins blobs", () => {
      const bithex = evaluate("0b1 0x5");
      expect(bithex).to.be.instanceof(frame.FrameBlob);
      expect(bithex.toString()).to.equal("0b10101");

      const dual0 = evaluate("0b00 0b00");
      expect(dual0.toString()).to.equal("0b0000");

      const right0 = evaluate("0b01 0b00");
      expect(right0.toString()).to.equal("0b0100");

      const left0 = evaluate("0b00 0b01");
      expect(left0.toString()).to.equal("0b0001");
    });
  });

  describe("grouping", () => {
    it("returns FrameArray for empty []", () => {
      const result = evaluate("[]");
      expect(result).to.be.instanceof(frame.FrameArray);
    });

    it("returns closure for empty {}", () => {
      const result = evaluate("{}");
      expect(result).to.be.instanceof(frame.FrameLazy);
    });
  });
});
