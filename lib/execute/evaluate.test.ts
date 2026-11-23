import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { evaluate } from "./evaluate.ts";
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
});
