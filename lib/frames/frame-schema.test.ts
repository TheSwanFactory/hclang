import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame, FrameExpr, FrameSchema, FrameString } from "../frames.ts";

describe("FrameSchema", () => {
  const a_frame = new FrameString("a");
  const b_frame = new FrameString("b");
  const frame_schema = new FrameSchema([a_frame, b_frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_schema).toBeInstanceOf(FrameSchema);
  });

  it("stringifies with brackets", () => {
    expect(frame_schema.toString()).toEqual("<“a”, “b”>");
  });

  it("uses 'at' to access elements by index", () => {
    const first_element = frame_schema.at(0);
    expect(first_element).toBeTruthy();
    expect(first_element).toEqual(a_frame);
  });

  it("uses -1 to access last element", () => {
    const last_element = frame_schema.at(-1);
    expect(last_element).toBeTruthy();
    expect(last_element).toEqual(b_frame);
  });

  it("appends when called", () => {
    const array = new FrameSchema([]);
    array.call(a_frame);
    array.call(b_frame);
    expect(array.toString()).toEqual("<“a”, “b”>");
  });

  it("appends when non-nil", () => {
    const array = new FrameSchema([]);
    array.call(a_frame);
    array.call(Frame.nil);
    expect(array.toString()).toEqual("<“a”>");
  });

  it("evaluates its components into an array", () => {
    const string = new FrameString("string");
    const array_of_expr = new FrameSchema([
      Frame.nil,
      string,
      new FrameExpr([
        new FrameString("prefix-"),
        new FrameString("-suffix"),
      ]),
    ]);
    const result = array_of_expr.in();
    const expr_result = result.at(2);

    expect(result).toBeInstanceOf(FrameSchema);
    expect(result.at(0)).toEqual(Frame.nil);
    expect(result.at(1)).toEqual(string);
    expect(expr_result.toString()).toContain("prefix--suffix");
  });
});
