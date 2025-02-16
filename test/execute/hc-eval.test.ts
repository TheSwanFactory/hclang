import { expect } from "npm:chai";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";

import { HCEval } from "../../src/execute/hc-eval.ts";
import * as frame from "../../src/frames.ts";

describe("HCEval", () => {
  let out: frame.FrameArray;
  let hc_eval: HCEval;

  beforeEach(() => {
    out = new frame.FrameArray([]);
    hc_eval = new HCEval(out);
  });

  it("is exported", () => {
    expect(HCEval).to.be.ok;
    expect(hc_eval).to.be.ok;
  });

  it("calls out with result when called with a string", () => {
    expect(out.length()).to.equal(0);
    hc_eval.call("123");
    expect(out.length()).to.equal(1);
    const result = out.at(0);
    expect(result.toString()).to.equal("123");
  });

  it("parses multi-line docStrings", () => {
    hc_eval.call("`");
    expect(out.length()).to.equal(0);
    hc_eval.call("*docString*");
    expect(out.length()).to.equal(0);
    hc_eval.call("`");
    expect(out.length()).to.equal(1);

    const result = out.at(0);
    expect(result.toString()).to.equal("`\n*docString*\n`");
  });

  describe("symbols", () => {
    const key = "key";
    const value = "value";
    const frame_value = new frame.FrameString(value);
    const setting = `.${key} ${frame_value}`;

    it("evaluates names to symbols", () => {
      hc_eval.call(`.${key}`);
      expect(out.length()).to.equal(1);
      const output = out.at(0);
      expect(output).to.be.instanceof(frame.FrameSymbol);
    });

    it("set symbols in result", () => {
      hc_eval.call(setting);
      const extracted = out.get(key);
      expect(extracted.toString()).to.equal(frame_value.toString());
    });

    it("evaluates created symbols", () => {
      const input = `${setting};\n${key}`;
      hc_eval.call(input);

      expect(out.length()).to.equal(2);
      const output = out.at(1);
      expect(output.toString()).to.equal(frame_value.toString());
    });
  });

  describe("make_context", () => {
    it("returns a context from StringMap", () => {
      const entries = { key: "value" };
      const context = HCEval.make_context(entries);
      // check type
      expect(context).to.be.ok;
      expect(context).to.be.instanceof(Object);
      expect(context).to.have.property("key");
      expect(context.key).to.be.instanceof(frame.FrameString);
      expect(context.key.toString()).to.equal("“value”");
    });
    it("return a context with FrameNumber for numeric values", () => {
      const entries = { "key": "2" };
      const context = HCEval.make_context(entries);
      expect(context).to.be.ok;
      expect(context).to.have.property("key");
      expect(context.key).to.be.instanceof(frame.FrameNumber);
      expect(context.key.toString()).to.equal("2");
    });
    it("treats letters as isAlphabetic", () => {
      expect(HCEval.isAlphabetic("a")).to.be.true;
      expect(HCEval.isAlphabetic("A")).to.be.true;
      expect(HCEval.isAlphabetic("1")).to.be.false;
      expect(HCEval.isAlphabetic("$")).to.be.false;
      expect(HCEval.isAlphabetic("é")).to.be.true;
      expect(HCEval.isAlphabetic("Ⰰ")).to.be.true;
      expect(HCEval.isAlphabetic("𐍈")).to.be.true;
    });
    it("treats numbers as isNumeric", () => {
      expect(HCEval.isNumeric("1")).to.be.true;
      expect(HCEval.isNumeric("2")).to.be.true;
      expect(HCEval.isNumeric("E")).to.be.false;
      expect(HCEval.isNumeric("$")).to.be.false;
      expect(HCEval.isNumeric(".")).to.be.false;
      expect(HCEval.isNumeric("Ⰰ")).to.be.false;
    });
  });
});
