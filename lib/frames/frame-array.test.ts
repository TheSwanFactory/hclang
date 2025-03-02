import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import { Frame, FrameArray, FrameExpr, FrameString } from "../frames.ts";

describe("FrameArray", () => {
  const a_frame = new FrameString("a");
  const b_frame = new FrameString("b");
  const frame_array = new FrameArray([a_frame, b_frame]);

  it("is constructed from an array of frames", () => {
    expect(frame_array).toBeInstanceOf(FrameArray);
  });

  it("stringifies with brackets", () => {
    expect(frame_array.toString()).toEqual("[“a”, “b”]");
  });

  it("uses 'at' to access elements by index", () => {
    const first_element = frame_array.at(0);
    expect(first_element).toBeTruthy();
    expect(first_element).toEqual(a_frame);
  });

  it("uses -1 to access last element", () => {
    const last_element = frame_array.at(-1);
    expect(last_element).toBeTruthy();
    expect(last_element).toEqual(b_frame);
  });

  it("appends when called", () => {
    const array = new FrameArray([]);
    array.call(a_frame);
    array.call(b_frame);
    expect(array.toString()).toEqual("[“a”, “b”]");
  });

  it("appends when non-nil", () => {
    const array = new FrameArray([]);
    array.call(a_frame);
    array.call(Frame.nil);
    expect(array.toString()).toEqual("[“a”]");
  });

  it("evaluates its components into an array", () => {
    const string = new FrameString("string");
    const array_of_expr = new FrameArray([
      Frame.nil,
      string,
      new FrameExpr([
        new FrameString("prefix-"),
        new FrameString("-suffix"),
      ]),
    ]);
    const result = array_of_expr.in();
    const expr_result = result.at(2);

    expect(result).toBeInstanceOf(FrameArray);
    expect(result.at(0)).toEqual(Frame.nil);
    expect(result.at(1)).toEqual(string);
    expect(expr_result.toString()).toContain("prefix--suffix");
  });
});
