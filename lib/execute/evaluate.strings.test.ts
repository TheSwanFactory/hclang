import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "./evaluate.ts";
import * as frame from "../frames.ts";

describe("evaluate: strings", () => {
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

  it("joins multi-line document strings into strings", () => {
    const input = "```\nDoc String\n```";
    const result = evaluate(input);
    expect(result.toString()).toEqual(`[${input}]`);
  });

  it("preserves shorter backtick runs inside document strings", () => {
    const input = "```one ` and two `` backticks```";
    const result = evaluate(input);

    expect(result.toString()).toEqual(`[${input}]`);
    expect(result.at(0)).toBeInstanceOf(frame.FrameDoc);
  });

  it("keeps two top-level backticks as one empty document", () => {
    const result = evaluate("``");

    expect(result.at(0)).toBeInstanceOf(frame.FrameDoc);
    expect(result.at(0).toString()).toEqual("``");
  });

  for (const fenceLength of [1, 3, 5, 7]) {
    it(`recognizes an odd document fence of length ${fenceLength}`, () => {
      const fence = "`".repeat(fenceLength);
      const input = `${fence}body${fence}`;
      const result = evaluate(input);

      expect(result.length()).toEqual(1);
      expect(result.at(0)).toBeInstanceOf(frame.FrameDoc);
      expect(result.at(0).toString()).toEqual(input);
    });
  }

  for (const fenceLength of [2, 4, 6, 8]) {
    it(`recognizes one empty document from an even run of length ${fenceLength}`, () => {
      const fence = "`".repeat(fenceLength);
      const result = evaluate(fence);

      expect(result.length()).toEqual(1);
      expect(result.at(0)).toBeInstanceOf(frame.FrameDoc);
      expect(result.at(0).toString()).toEqual(fence);
    });
  }

  it("joins around comments", () => {
    const input = "“Hello”#ignore me#“, HC!”";
    const result = evaluate(input);
    expect(result.toString()).toEqual("[“Hello, HC!”]");
  });
});
