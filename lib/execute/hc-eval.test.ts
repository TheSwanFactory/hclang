import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { HCEval, make_context } from "./hc-eval.ts";
import { HCTest } from "./hc-test.ts";
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

  it("resolves an explicit host anchor across transport chunks", () => {
    const host = new frame.Frame(make_context({ key: "9" }));
    const source = "$$.key";

    for (let split = 1; split < source.length; split++) {
      const splitOut = new frame.FrameArray([]);
      const evaluator = new HCEval(splitOut, splitOut, host);
      evaluator.call(source.slice(0, split), false);
      evaluator.call(source.slice(split), false);

      expect(evaluator.finish()).toBe(true);
      expect(splitOut.at(0).toString()).toEqual("9");
    }
  });

  for (const source of ["$foo", "1 + $foo", "$$$", "$<", "$<<", "$$HOME"]) {
    it(`rejects unsupported dollar form ${source} without output`, () => {
      hc_eval.call(source);

      expect(hc_eval.finish()).toBe(false);
      expect(hc_eval.error()).toContain("invalid dollar form");
      expect(out.length()).toEqual(0);
    });
  }

  for (const source of ["$foo", "$$$", "$<", "$<<", "$$HOME"]) {
    it(`rejects ${source} across every two-chunk split`, () => {
      for (let split = 1; split < source.length; split++) {
        const splitOut = new frame.FrameArray([]);
        const evaluator = new HCEval(splitOut);
        evaluator.call(source.slice(0, split), false);
        evaluator.call(source.slice(split), false);

        expect(evaluator.finish()).toBe(false);
        expect(evaluator.error()).toContain("invalid dollar form");
        expect(splitOut.length()).toEqual(0);
      }
    });
  }

  it("can be reused after an invalid dollar form", () => {
    hc_eval.call("$foo");
    expect(hc_eval.finish()).toBe(false);

    hc_eval.call("7");

    expect(hc_eval.finish()).toBe(true);
    expect(out.at(0).toString()).toEqual("7");
  });

  it("retains a generic atom across arbitrary chunks", () => {
    hc_eval.call("12", false);
    hc_eval.call("3", false);

    expect(hc_eval.finish()).toEqual(true);
    expect(out.at(0).toString()).toEqual("123");
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

  it("detects doctest markers after document transitions within one call", () => {
    const notes = new frame.FrameArray([]);
    const test = new HCTest(notes);
    const evaluator = new HCEval(test);

    evaluator.call("```\nprose\n```\n; 1\n# 1");

    expect(evaluator.finish()).toEqual(true);
    test.finish();
    expect(test.n).toEqual({
      total: 1,
      pass: 1,
      fail: 0,
      unimplemented: 0,
    });
  });

  it("detects doctest markers split across transport chunks", () => {
    const notes = new frame.FrameArray([]);
    const test = new HCTest(notes);
    const evaluator = new HCEval(test);

    evaluator.call("```\nprose\n```\n;", false);
    evaluator.call(" 1\n#", false);
    evaluator.call(" 1", true);

    expect(evaluator.finish()).toEqual(true);
    test.finish();
    expect(test.n).toEqual({
      total: 1,
      pass: 1,
      fail: 0,
      unimplemented: 0,
    });
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

  it("reports an unterminated smart string at EOF", () => {
    hc_eval.call("“unfinished", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toContain("unterminated FrameString");
    expect(out.length()).toEqual(0);
  });

  it("retains a byte payload across arbitrary chunks", () => {
    hc_eval.call("\\3\\a", false);
    hc_eval.call("b", false);
    hc_eval.call("c", false);

    expect(hc_eval.finish()).toEqual(true);
    expect(out.length()).toEqual(1);
    expect(out.at(0)).toBeInstanceOf(frame.FrameBytes);
    expect(out.at(0).toString()).toEqual("\\3\\abc");
  });

  it("recognizes byte syntax identically across every two-chunk split", () => {
    const source = "\\3\\abc";

    for (let split = 1; split < source.length; split++) {
      const splitOut = new frame.FrameArray([]);
      const splitEval = new HCEval(splitOut);
      splitEval.call(source.slice(0, split), false);
      splitEval.call(source.slice(split), false);

      expect(splitEval.finish()).toEqual(true);
      expect(splitOut.at(0).toString()).toEqual(source);
    }
  });

  it("recognizes dynamic byte syntax across every two-chunk split", () => {
    const source = "\\size\\abc";

    for (let split = 1; split < source.length; split++) {
      const splitOut = new frame.FrameArray([]);
      splitOut.set("size", new frame.FrameNumber("3"));
      const splitEval = new HCEval(splitOut);
      splitEval.call(source.slice(0, split), false);
      splitEval.call(source.slice(split), false);

      expect(splitEval.finish()).toEqual(true);
      expect(splitOut.at(0).toString()).toEqual("\\3\\abc");
    }
  });

  it("reports a premature byte payload at EOF", () => {
    hc_eval.call("\\3\\ab", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("byte payload shorter than 3: ab");
    expect(out.length()).toEqual(0);
  });

  it("retains an invalid byte-length failure until EOF", () => {
    hc_eval.call("\\xignored", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("unterminated byte length: \\xignored");
    expect(out.length()).toEqual(0);
  });

  it("reports a missing dynamic byte length", () => {
    hc_eval.call("\\size\\abc", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("byte length not found: size");
    expect(out.length()).toEqual(0);
  });

  it("reports an invalid dynamic byte length value", () => {
    out.set("size", new frame.FrameString("three"));
    hc_eval.call("\\size\\abc", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual(
      "invalid byte length value for size: “three”",
    );
  });

  it("reports a premature dynamic byte payload at EOF", () => {
    out.set("size", new frame.FrameNumber("3"));
    hc_eval.call("\\size\\ab", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("byte payload shorter than 3: ab");
  });

  it("can be reused cleanly after a dynamic byte failure", () => {
    hc_eval.call("\\missing\\abc", false);
    expect(hc_eval.finish()).toEqual(false);

    hc_eval.call("7");

    expect(out.length()).toEqual(1);
    expect(out.at(0).toString()).toEqual("7");
    expect(hc_eval.finish()).toEqual(true);
  });

  it("can be reused cleanly after a byte failure", () => {
    hc_eval.call("\\3\\ab", false);
    expect(hc_eval.finish()).toEqual(false);

    hc_eval.call("7");

    expect(out.length()).toEqual(1);
    expect(out.at(0).toString()).toEqual("7");
    expect(hc_eval.finish()).toEqual(true);
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

  it("applies an empty logical-line boundary after a transport chunk", () => {
    hc_eval.call("123", false);
    hc_eval.call("", true);

    expect(out.length()).toEqual(1);
    expect(out.at(0).toString()).toEqual("123");
    expect(hc_eval.finish()).toEqual(true);
  });

  it("reports an odd opening run at EOF as unterminated", () => {
    hc_eval.call("`````", false);

    expect(hc_eval.finish()).toEqual(false);
    expect(hc_eval.error()).toEqual("unterminated document string");
  });

  describe("nested curly quotes", () => {
    it("keeps balanced interior quotes in one string", () => {
      hc_eval.call("“a “b” c”", false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.length()).toEqual(1);
      expect(out.at(0)).toBeInstanceOf(frame.FrameString);
      expect(out.at(0).toString()).toEqual("“a “b” c”");
    });

    it("does not truncate a string at an unmatched interior open", () => {
      hc_eval.call("“a “b c”", false);

      expect(hc_eval.finish()).toEqual(false);
      expect(hc_eval.error()).toContain("unterminated FrameString");
      expect(out.length()).toEqual(0);
    });

    it("nests identically across every two-chunk split", () => {
      const source = "“a “b” c”";

      for (let split = 1; split < source.length; split++) {
        const splitOut = new frame.FrameArray([]);
        const splitEval = new HCEval(splitOut);
        splitEval.call(source.slice(0, split), false);
        splitEval.call(source.slice(split), false);

        expect(splitEval.finish()).toEqual(true);
        expect(splitOut.at(0).toString()).toEqual(source);
      }
    });
  });

  describe("unmatched string terminators", () => {
    for (const source of ["”", "”a”", "“a ” b”", "1 ” 2"]) {
      it(`reports ${JSON.stringify(source)} instead of truncating`, () => {
        hc_eval.call(source, true);

        expect(hc_eval.finish()).toEqual(false);
        expect(hc_eval.error()).toEqual("unmatched string terminator: ”");
        expect(out.length()).toEqual(0);
      });
    }

    it("keeps terminators inert inside strings, comments, and documents", () => {
      hc_eval.call("“a ” b”");
      expect(hc_eval.error()).toEqual("unmatched string terminator: ”");

      const cleanOut = new frame.FrameArray([]);
      const clean = new HCEval(cleanOut);
      clean.call("#a ” b#");
      clean.call("`a ” b`");
      clean.call('"a ” b"');

      expect(clean.finish()).toEqual(true);
      expect(cleanOut.at(0).toString()).toEqual("`a ” b`");
      expect(cleanOut.at(1).toString()).toEqual("“a ” b”");
    });

    it("can be reused cleanly after an unmatched terminator", () => {
      hc_eval.call("”", true);
      expect(hc_eval.finish()).toEqual(false);

      hc_eval.call("“clean”");

      expect(out.length()).toEqual(1);
      expect(out.at(0).toString()).toEqual("“clean”");
      expect(hc_eval.finish()).toEqual(true);
    });
  });

  describe("multi-line strings", () => {
    it("preserves blank logical lines in both spellings", () => {
      hc_eval.call("“a", true);
      hc_eval.call("", true);
      hc_eval.call("b”", true);

      const aliasOut = new frame.FrameArray([]);
      const alias = new HCEval(aliasOut);
      alias.call('"""a', true);
      alias.call("", true);
      alias.call('b"""', true);

      expect(hc_eval.finish()).toEqual(true);
      expect(alias.finish()).toEqual(true);
      expect(out.at(0).toString()).toEqual("“a\n\nb”");
      expect(aliasOut.at(0).toString()).toEqual(out.at(0).toString());
    });
  });

  describe("ASCII quote alias", () => {
    it("canonicalizes an ASCII-quoted string", () => {
      hc_eval.call('"ascii"', false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.at(0)).toBeInstanceOf(frame.FrameString);
      expect(out.at(0).toString()).toEqual("“ascii”");
    });

    for (const runLength of [1, 3, 5]) {
      it(`opens depth ${runLength} with an odd ASCII run`, () => {
        const run = '"'.repeat(runLength);
        const interior = '"'.repeat(runLength - 1);
        const body = runLength === 1 ? "body" : `body ${interior} end`;
        hc_eval.call(`${run}${body}${run}`, false);

        expect(hc_eval.finish()).toEqual(true);
        expect(out.at(0).toString()).toEqual(`“${body}”`);
      });
    }

    for (const runLength of [2, 4, 6]) {
      it(`produces the empty string from an even run of ${runLength}`, () => {
        hc_eval.call('"'.repeat(runLength), false);

        expect(hc_eval.finish()).toEqual(true);
        expect(out.length()).toEqual(1);
        expect(out.at(0).toString()).toEqual("“”");
      });
    }

    it("keeps curly quotes as ordinary content", () => {
      hc_eval.call('"a“b”c"', false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.at(0).toString()).toEqual("“a“b”c”");
    });

    it("keeps ASCII quotes as content inside curly quotes", () => {
      hc_eval.call('“a "b" c”', false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.at(0).toString()).toEqual('“a "b" c”');
    });

    it("preserves a pending run across arbitrary chunks", () => {
      hc_eval.call('""', false);
      hc_eval.call('"body ""', false);
      hc_eval.call(' end"""', false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.at(0).toString()).toEqual('“body "" end”');
    });

    it("rejects a run longer than the active delimiter", () => {
      hc_eval.call('"""body""""', false);

      expect(hc_eval.finish()).toEqual(false);
      expect(hc_eval.error()).toEqual(
        "quoted fence run exceeds the opening fence",
      );
      expect(out.length()).toEqual(0);
    });

    it("reports an unterminated ASCII-quoted string", () => {
      hc_eval.call('"""body""', false);

      expect(hc_eval.finish()).toEqual(false);
      expect(hc_eval.error()).toEqual("unterminated quoted string");
      expect(out.length()).toEqual(0);
    });

    it("does not share pending run state between evaluators", () => {
      hc_eval.call('"""leaked', false);

      const otherOut = new frame.FrameArray([]);
      const other = new HCEval(otherOut);
      other.call('"clean"', false);

      expect(other.finish()).toEqual(true);
      expect(otherOut.length()).toEqual(1);
      expect(otherOut.at(0).toString()).toEqual("“clean”");
      expect(hc_eval.finish()).toEqual(false);
    });

    it("can be reused cleanly after an unterminated run", () => {
      hc_eval.call('"stale', false);
      expect(hc_eval.finish()).toEqual(false);

      hc_eval.call('"clean"');

      expect(out.length()).toEqual(1);
      expect(out.at(0).toString()).toEqual("“clean”");
      expect(hc_eval.finish()).toEqual(true);
    });
  });

  describe("resource identifiers", () => {
    it("evaluates one inert URI value", () => {
      hc_eval.call("'jsr:@swanfactory/hclang'", false);

      expect(hc_eval.finish()).toEqual(true);
      expect(out.at(0)).toBeInstanceOf(frame.FrameURI);
      expect(out.at(0).toString()).toEqual("'jsr:@swanfactory/hclang'");
    });

    it("reports an English apostrophe as a lexical error", () => {
      hc_eval.call("don't stop", true);

      expect(hc_eval.error()).toEqual(
        "unterminated resource identifier: 't",
      );
    });

    it("rejects an empty identifier", () => {
      hc_eval.call("''", false);

      expect(hc_eval.finish()).toEqual(false);
      expect(hc_eval.error()).toEqual("empty resource identifier: ''");
      expect(out.length()).toEqual(0);
    });

    it("lexes identically across every two-chunk split", () => {
      const source = "'https://example.com/hc?v=1'";

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

    it("does not share pending identifier state between evaluators", () => {
      hc_eval.call("'jsr:leaked", false);

      const otherOut = new frame.FrameArray([]);
      const other = new HCEval(otherOut);
      other.call("'jsr:clean'", false);

      expect(other.finish()).toEqual(true);
      expect(otherOut.length()).toEqual(1);
      expect(otherOut.at(0).toString()).toEqual("'jsr:clean'");
      expect(hc_eval.finish()).toEqual(false);
    });

    it("keeps apostrophes inert inside strings, comments, and documents", () => {
      hc_eval.call("“don't stop”");
      hc_eval.call("#don't stop#");
      hc_eval.call("`don't stop`");

      expect(hc_eval.finish()).toEqual(true);
      expect(out.at(0).toString()).toEqual("“don't stop”");
      expect(out.at(1).toString()).toEqual("`don't stop`");
    });
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
