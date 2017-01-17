import { expect } from "chai";
import { execFileSync } from "child_process";
import * as _ from "lodash";

describe.only("script", () => {
  const hc_bin = "lib/hc.js";
  let title: string;

  beforeEach(function () {
    title = this.currentTest.title;
  });

  describe.only("command", () => {
    it("“Hello, Homoiconicity!”", () => {
      const result = execFileSync(hc_bin, ["-c", title]);
      const output = _.trim(result.toString());
      expect(output).to.equal(title);
    });
  });

  describe("file", () => {
    const sample_script = "hc/sample.hc";
    it(sample_script, () => {
      const result = execFileSync(hc_bin, [title]);
      expect(result).to.equal("“Hello, Homoiconicity!”");
    });
  });
});
