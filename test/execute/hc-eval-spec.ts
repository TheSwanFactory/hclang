
import { expect } from "chai";
import { } from "mocha";
import { HCEval } from "../../src/execute/hc-eval";
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
});
