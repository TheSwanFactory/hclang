import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameExpr,
  FrameNumber,
  FrameSchema,
  FrameString,
  FrameType,
} from "../frames.ts";

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

  it("does not mutate when called", () => {
    const schema = new FrameSchema([a_frame, b_frame]);
    expect(schema.call(a_frame)).toEqual(a_frame);
    expect(schema.call(b_frame)).toEqual(b_frame);
    expect(schema.toString()).toEqual("<“a”, “b”>");
  });

  it("uses one match result for membership and application evidence", () => {
    const schema = new FrameSchema([a_frame]);
    const accepted = schema.match(a_frame);
    const rejected = schema.match(b_frame);

    expect(accepted.matched).toEqual(true);
    if (accepted.matched) expect(accepted.evidence).toEqual(a_frame);
    expect(rejected.matched).toEqual(false);
    expect(schema.matches(a_frame)).toEqual(true);
    expect(schema.matches(b_frame)).toEqual(false);
    expect(schema.call(a_frame)).toEqual(a_frame);
  });

  it("composes nested schemas and runtime types as candidates", () => {
    const strings = new FrameSchema([a_frame, b_frame]);
    const nested = new FrameSchema([strings]);
    const runtime = new FrameSchema([FrameType.of(a_frame)]);

    expect(nested.matches(a_frame)).toEqual(true);
    expect(nested.matches(new FrameNumber("1"))).toEqual(false);
    expect(runtime.matches(new FrameString("another"))).toEqual(true);
    expect(runtime.matches(new FrameNumber("1"))).toEqual(false);
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
