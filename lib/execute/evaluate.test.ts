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
  // A name or a closure argument reaches its object through a handle, whose
  // own keyed lookup is empty; the doubled stream read `()` for each value.
  it("streams property values through a name or an argument", () => {
    const last = (source: string) =>
      evaluate(source).asArray().at(-1)?.asArray().at(-1)?.toString();
    expect(last(".n [.a 4; .b 2;]; n && {_}")).toEqual(
      "[[.a, 4], [.b, 2]]",
    );
    expect(last(".m [.meta 9; 10, 20]; m || []")).toEqual(
      "[[.meta, 9], [.0, 10], [.1, 20]]",
    );
    expect(last(".n [.a 4; .b 2;]; n && {_.1}")).toEqual("[4, 2]");
    expect(evaluate("{_ && {_}} [.a 4; .b 2;]").toString()).toEqual(
      "[[[.a, 4], [.b, 2]]]",
    );
  });
});
