import { expect } from "chai";
import { execFileSync } from "child_process";

describe.only("script", () => {
  const hc_bin = "lib/hc.js";
  let title: string;

  beforeEach(function () {
    title = this.currentTest.title;
  });

  describe.only("commands", () => {
    it("“Hello, Homoiconicity!”", () => {
      const result = execFileSync(hc_bin, ["-c", title]).toString();
      expect(result).to.equal(title);
    });
  });

  describe("files", () => {
    const sample_script = "hc/sample.hc";
    it(sample_script, () => {
      const result = execFileSync(hc_bin, [title]).toString();
      expect(result).to.equal("“Hello, Homoiconicity!”");
    });
  });
});
