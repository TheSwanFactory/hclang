import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "./evaluate.ts";
import * as frame from "../frames.ts";

describe("evaluate: grouping", () => {
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

  it("returns nil for empty ()", () => {
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

  it("returns a parse failure for mismatched brackets", () => {
    const output = evaluate("[}").at(0);
    expect(output.isFailedResult()).toBe(true);
    expect(output.toString()).toContain("$!.parse-mismatched-structure");
  });

  it("returns a parse failure for an unopened close bracket", () => {
    const output = evaluate("}").at(0);
    expect(output.isFailedResult()).toBe(true);
    expect(output.toString()).toContain("$!.parse-unmatched-structure");
  });
});
