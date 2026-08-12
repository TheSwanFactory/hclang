import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { HCEval, make_context } from "./hc-eval.ts";
import * as frame from "../frames.ts";

describe("HCEval", () => {
  let out: frame.FrameArray;
  let hc_eval: HCEval;

  beforeEach(() => {
    out = new frame.FrameArray([]);
    hc_eval = new HCEval(out);
  });

  it("is exported", () => {
    expect(HCEval).toBeTruthy();
    expect(hc_eval).toBeTruthy();
  });

  it("calls out with result when called with a string", () => {
    expect(out.length()).toEqual(0);
    hc_eval.call("123");
    expect(out.length()).toEqual(1);
    const result = out.at(0);
    expect(result.toString()).toEqual("123");
  });

  it("parses multi-line docStrings", () => {
    hc_eval.call("`");
    expect(out.length()).toEqual(0);
    hc_eval.call("*docString*");
    expect(out.length()).toEqual(0);
    hc_eval.call("`");
    expect(out.length()).toEqual(1);

    const result = out.at(0);
    expect(result.toString()).toEqual("`\n*docString*\n`");
  });

  it("retains document state and incomplete backticks across calls", () => {
    hc_eval.call("```");
    hc_eval.call("one `");
    hc_eval.call("two ``");
    hc_eval.call("three");
    hc_eval.call("```");

    expect(out.length()).toEqual(1);
    expect(out.at(0).toString()).toEqual(
      "```\none `\ntwo ``\nthree\n```",
    );
  });

  it("does not evaluate doctest markers inside fenced documents", () => {
    hc_eval.call("```\n; missing-name\n# expectation\n```");

    expect(out.length()).toEqual(1);
    expect(out.at(0)).toBeInstanceOf(frame.FrameDoc);
  });

  it("isolates unfinished document state between evaluators", () => {
    hc_eval.call("```leaked");
    const otherOut = new frame.FrameArray([]);
    const other = new HCEval(otherOut);

    other.call("```clean```");

    expect(otherOut.length()).toEqual(1);
    expect(otherOut.at(0).toString()).toEqual("```clean```");
  });

  it("recognizes delimiters split across non-line-ending calls", () => {
    hc_eval.call("``", false);
    hc_eval.call("`content``", false);
    hc_eval.call("`", true);

    expect(out.length()).toEqual(1);
    expect(out.at(0).toString()).toEqual("```content```");
    expect(hc_eval.finish()).toEqual(true);
  });

  it("reports an unfinished document at EOF", () => {
    hc_eval.call("```unfinished ``");

    expect(hc_eval.finish()).toEqual(false);
  });

  it("can be reused cleanly after an unfinished document", () => {
    hc_eval.call("```stale");
    expect(hc_eval.finish()).toEqual(false);

    hc_eval.call("```clean```");

    expect(out.length()).toEqual(1);
    expect(out.at(0).toString()).toEqual("```clean```");
    expect(hc_eval.finish()).toEqual(true);
  });

  for (const fenceLength of [1, 3, 5, 7]) {
    it(`closes an odd fence of length ${fenceLength} at EOF`, () => {
      const fence = "`".repeat(fenceLength);
      hc_eval.call(`${fence}body${fence}`, false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.length()).toEqual(1);
      expect(out.at(0).toString()).toEqual(`${fence}body${fence}`);
    });
  }

  for (const fenceLength of [2, 4, 6, 8]) {
    it(`classifies an even run of length ${fenceLength} at EOF`, () => {
      const fence = "`".repeat(fenceLength);
      hc_eval.call(fence, false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.length()).toEqual(1);
      expect(out.at(0).toString()).toEqual(fence);
    });
  }

  it("preserves shorter runs inside a five-backtick document", () => {
    const fence = "`".repeat(5);
    const body = "one ` two `` three ``` four ```` end";
    hc_eval.call(`${fence}${body}${fence}`, false);

    expect(hc_eval.finish()).toEqual(true);
    expect(out.at(0).toString()).toEqual(`${fence}${body}${fence}`);
  });

  it("rejects a run longer than the active fence", () => {
    hc_eval.call("```body````", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual(
      "document fence run exceeds the opening fence",
    );
    expect(out.length()).toEqual(0);
  });

  it("does not close a greater run by an equal prefix", () => {
    hc_eval.call("```body````outside", true);

    expect(hc_eval.finish()).toEqual(false);
    expect(out.length()).toEqual(0);
  });

  it("rejects a longer interior run in a one-backtick document", () => {
    hc_eval.call("`body``", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual(
      "document fence run exceeds the opening fence",
    );
  });

  it("treats a shorter final run as content before reporting EOF", () => {
    hc_eval.call("```body``", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("unterminated document string");
    expect(out.length()).toEqual(0);
  });

  it("keeps an opening run pending across arbitrary chunks", () => {
    hc_eval.call("``", false);
    hc_eval.call("```body", false);
    hc_eval.call("``", false);
    hc_eval.call("```", false);

    expect(hc_eval.finish()).toEqual(true);
    expect(out.at(0).toString()).toEqual("`````body`````");
  });

  it("keeps a closing run pending across arbitrary chunks", () => {
    hc_eval.call("`````body``", false);
    hc_eval.call("```", false);

    expect(hc_eval.finish()).toEqual(true);
    expect(out.at(0).toString()).toEqual("`````body`````");
  });

  it("is invariant across every two-chunk split", () => {
    const source = "`````one ` two `` three ``` four ```` end`````";

    for (let split = 1; split < source.length; split++) {
      const splitOut = new frame.FrameArray([]);
      const splitEval = new HCEval(splitOut);
      splitEval.call(source.slice(0, split), false);
      splitEval.call(source.slice(split), false);

      expect(splitEval.finish()).toEqual(true);
      expect(splitOut.length()).toEqual(1);
      expect(splitOut.at(0).toString()).toEqual(source);
    }
  });

  it("classifies even runs identically across every two-chunk split", () => {
    const source = "`".repeat(8);

    for (let split = 1; split < source.length; split++) {
      const splitOut = new frame.FrameArray([]);
      const splitEval = new HCEval(splitOut);
      splitEval.call(source.slice(0, split), false);
      splitEval.call(source.slice(split), false);

      expect(splitEval.finish()).toEqual(true);
      expect(splitOut.length()).toEqual(1);
      expect(splitOut.at(0).toString()).toEqual(source);
    }
  });

  it("rejects greater runs across every two-chunk split", () => {
    const source = "```body````";

    for (let split = 1; split < source.length; split++) {
      const splitOut = new frame.FrameArray([]);
      const splitEval = new HCEval(splitOut);
      splitEval.call(source.slice(0, split), false);
      splitEval.call(source.slice(split), false);

      expect(splitEval.finish()).toEqual(false);
      expect(splitEval.error()).toEqual(
        "document fence run exceeds the opening fence",
      );
      expect(splitOut.length()).toEqual(0);
    }
  });

  it("treats a logical newline, but not a chunk boundary, as the end of a run", () => {
    hc_eval.call("```body``", true);
    hc_eval.call("`", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("unterminated document string");
  });

  it("reports an odd opening run at EOF as unterminated", () => {
    hc_eval.call("`````", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("unterminated document string");
  });

  describe("symbols", () => {
    const key = "key";
    const value = "value";
    const frame_value = new frame.FrameString(value);
    const setting = `.${key} ${frame_value}`;

    it("evaluates names to symbols", () => {
      hc_eval.call(`.${key}`);
      expect(out.length()).toEqual(1);
      const output = out.at(0);
      expect(output).toBeInstanceOf(frame.FrameSymbol);
    });

    it("set symbols in result", () => {
      hc_eval.call(setting);
      const extracted = out.get(key);
      expect(extracted.toString()).toEqual(frame_value.toString());
    });

    it("evaluates created symbols", () => {
      const input = `${setting};\n${key}`;
      hc_eval.call(input);

      expect(out.length()).toEqual(2);
      const output = out.at(1);
      expect(output.toString()).toEqual(frame_value.toString());
    });
  });
});

describe("make_context", () => {
  it("returns a context from StringMap", () => {
    const entries = { key: "value" };
    const context = make_context(entries);
    // check type
    expect(context).toBeTruthy();
    expect(context).toBeInstanceOf(Object);
    expect("key" in context).toBe(true);
    expect(context.key).toBeInstanceOf(frame.FrameString);
    expect(context.key.toString()).toEqual("“value”");
  });
  it("return a context with FrameNumber for numeric values", () => {
    const entries = { "key": "2" };
    const context = make_context(entries);
    expect(context).toBeTruthy();
    expect("key" in context).toBe(true);
    expect(context.key).toBeInstanceOf(frame.FrameNumber);
    expect(context.key.toString()).toEqual("2");
  });
  it("correctly identifies isInteger", () => {
    expect(frame.Frame.isInteger("1")).toBe(true);
    expect(frame.Frame.isInteger("1234567890")).toBe(true);
    expect(frame.Frame.isInteger("12345.6789")).toBe(false);
    expect(frame.Frame.isInteger("123.456.789")).toBe(false);
    expect(frame.Frame.isInteger("E")).toBe(false);
    expect(frame.Frame.isInteger("$")).toBe(false);
    expect(frame.Frame.isInteger(".")).toBe(false);
    expect(frame.Frame.isInteger("Ⰰ")).toBe(false);
  });
});
