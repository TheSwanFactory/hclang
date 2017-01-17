import { expect } from "chai";
import { execFileSync } from "child_process";
import * as _ from "lodash";

describe.only("script", () => {
  const hc_bin = "lib/hc.js";
  let title: string;

  beforeEach(function () {
    title = this.currentTest.title;
  });

  const script = (args: string[]) => {
    const result = execFileSync(hc_bin, args);
    return _.trim(result.toString());
  };

  describe.only("command", () => {
    it("“Hello, Quine!”", () => {
      const result = script(["-c", title]);
      expect(result).to.equal(title);
    });
  });

  describe("file", () => {
    const sample_script = "hc/sample.hc";
    it(sample_script, () => {
      const result = script([title]);
      expect(result).to.equal("“Hello, Homoiconicity!”");
    });
  });
});
