
import { expect } from "chai";
import { } from "mocha";
import { HCEval } from "../../src/execute/hc-eval";
import { HCTest } from "../../src/execute/hc-test";
import * as frame from "../../src/frames";

  describe("HCTest", () => {
    let out: frame.FrameArray;
    let test: HCTest;
    let hc_eval: HCEval;
    beforeEach(() => {
      out = new frame.FrameArray([]);
      test = new HCTest(out);
      hc_eval = new HCEval(test);
    });

    it("sets source on out when called with input string", () => {
      hc_eval.call("; .abc");
      const result = test.get(HCEval.SOURCE);
      expect(result.toString()).to.equal("“.abc”");
    });
});
