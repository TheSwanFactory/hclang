import { expect } from "jsr:@std/expect";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";

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
    expect(context).to.have.property("key");
    expect(context.key).toBeInstanceOf(frame.FrameString);
    expect(context.key.toString()).toEqual("“value”");
  });
  it("return a context with FrameNumber for numeric values", () => {
    const entries = { "key": "2" };
    const context = make_context(entries);
    expect(context).toBeTruthy();
    expect(context).to.have.property("key");
    expect(context.key).toBeInstanceOf(frame.FrameNumber);
    expect(context.key.toString()).toEqual("2");
  });
  it("correctly identifies isInteger", () => {
    expect(frame.Frame.isInteger("1")).to.be.true;
    expect(frame.Frame.isInteger("1234567890")).to.be.true;
    expect(frame.Frame.isInteger("12345.6789")).to.be.false;
    expect(frame.Frame.isInteger("123.456.789")).to.be.false;
    expect(frame.Frame.isInteger("E")).to.be.false;
    expect(frame.Frame.isInteger("$")).to.be.false;
    expect(frame.Frame.isInteger(".")).to.be.false;
    expect(frame.Frame.isInteger("Ⰰ")).to.be.false;
  });
});
