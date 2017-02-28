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

  it("joins multipe strings", () => {
    const input = "“Hello”“, HC!”";
    const result = evaluate(input);
    expect(result.toString()).to.equal(`[“Hello, HC!”]`);
  });
});
