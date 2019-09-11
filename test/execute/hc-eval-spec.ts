
import { expect } from "chai";
import { } from "mocha";
import { HCEval } from "../../src/execute/hc-eval";
import * as frame from "../../src/frames";

describe.only("HCEval", () => {
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
    hc_eval.call(".abc");
    expect(out.length()).to.equal(1);
  });
});
