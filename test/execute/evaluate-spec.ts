import { expect } from "chai";
import * as frame from "../../src/frames";
import * as lex from "../../src/execute/lex-pipe";
import * as parse from "../../src/execute/parse-pipe";

import { evaluate } from "../../src/execute/evaluate";

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
});
