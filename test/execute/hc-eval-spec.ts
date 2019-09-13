
import { expect } from "chai";
import { } from "mocha";
import { HCEval, IProcessEnv } from "../../src/execute/hc-eval";
import * as frame from "../../src/frames";

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
    expect(result.toString()).to.include("docString");
  });

  describe("symbols", () => {
    const key = "key";
    const value = "value";
    const frame_value = new frame.FrameString(value);
    const setting = `.${key} ${frame_value}`;

    it("evaluates in env", () => {
      const env: IProcessEnv = {key: value};
      const context = HCEval.make_context(env);
      const out2 = new frame.FrameArray([], context);
      const hc_eval2 = new HCEval(out2);
      hc_eval2.call(key);
      expect(out2.length()).to.equal(1);
      const output = out2.at(0);
      expect(output.toString()).to.equal(frame_value.toString());
    });

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
      const input = `${setting}\n${key}`;
      hc_eval.call(input);

      expect(out.length()).to.equal(2);
      const output = out.at(0);
      expect(output.toString()).to.equal(frame_value.toString());
    });
  });

});
