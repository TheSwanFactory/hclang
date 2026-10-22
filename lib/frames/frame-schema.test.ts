import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameExpr,
  FrameNumber,
  FrameSchema,
  FrameString,
  FrameSymbol,
  FrameType,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

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

  it("does not mutate its caller's context stack while evaluating", () => {
    const scoped = new FrameString("scoped");
    const scope = new Frame({ scoped });
    const contexts = [scope];
    const schema = new FrameSchema([FrameSymbol.for("scoped")]);

    const result = schema.in(contexts);
    const projected = result.at(0);

    expect(projected).not.toBe(scoped);
    expect(projected.toString()).toEqual(scoped.toString());
    expect(projected.up).toBe(scope);
    expect(scoped.up).toBe(Frame.missing);
    expect(contexts).toHaveLength(1);
    expect(contexts[0]).toBe(scope);
  });

  describe("size operators (#411)", () => {
    /** The answer of the last statement in a source sequence. */
    const last = (source: string): Frame =>
      evaluate(source).at(-1).asArray().at(-1)!;

    it("counts a schema's members, as an aggregate's elements", () => {
      expect(last("<1, 2>.#").className()).toEqual("FrameCount");
      expect(last("<1, 2>.#").toString()).toEqual("2");
      expect(last("<1, [2, 3]>.##").toString()).toEqual("3");
      expect(last(".T <1, 2>; T.#").toString()).toEqual("2");
    });

    it("counts the source terms a compiled schema keeps", () => {
      // A structural or bit-layout schema holds the terms it was written as,
      // unevaluated, so those are what it counts.
      expect(last("<.a, .b>.#").toString()).toEqual("2");
      expect(last("<8 @Bit>.#").toString()).toEqual("1");
      expect(last("<8 @Bit>.##").toString()).toEqual("2");
    });

    it("leaves `<>` the total type, which answers itself", () => {
      expect(last("<>.#")).toBe(Frame.all);
      expect(last("<>.##")).toBe(Frame.all);
    });
  });

  describe("integer repetition (v0.22.0)", () => {
    /** The answer of the last line; earlier lines are setup statements. */
    const answer = (...lines: string[]): Frame =>
      evaluate(lines.join("\n")).at(-1);
    const text = (...lines: string[]): string => answer(...lines).toString();

    it("concatenates an enumeration, which matches what it did", () => {
      expect(text("3 <1, 2>")).toEqual("<1, 2, 1, 2, 1, 2>");
      expect(answer("3 <1, 2>")).toBeInstanceOf(FrameSchema);
      expect(text("(2 <1, 2>) 2")).toEqual("2");
      expect(answer("(2 <1, 2>) 3").is.error).toBe(true);
    });

    it("rebuilds a compiled matcher as the repeated literal's", () => {
      expect(text("2 <.x, .y>")).toEqual(text("<.x, .y, .x, .y>"));
      expect(text("(2 <.x, .y>) [.x 1; .y 2;]")).toEqual("[1, 2, 1, 2]");
      // Two Bit terms match as the literal holding both does. The two print
      // differently, so only the match is compared.
      expect(text("(2 <8@Bit>) 0xff")).toEqual(text("<8@Bit, 8@Bit> 0xff"));
      expect(text("(2 <8@Bit>) 0xff")).toEqual("$!.unsupported-schema-match");
    });

    it("repeats every term, so both spellings of a type repeat alike", () => {
      expect(answer("2 <.x; .y;>")).toBeInstanceOf(FrameSchema);
      expect(text("2 <.x; .y;>")).toEqual("<.x, .y, .x, .y>");
      expect(text("(2 <.x; .y;>) [.x 1; .y 2;]")).toEqual("[1, 2, 1, 2]");
      expect(answer("0 <.x; .y;>")).toBe(Frame.all);
    });

    it("answers the total type for no terms, as `<>` is", () => {
      expect(answer("0 <1, 2>")).toBe(Frame.all);
      expect(answer("0 <.x, .y>")).toBe(Frame.all);
      expect(text("[(0 <1, 2>) === <>]")).toEqual("[<>]");
    });
  });
});
