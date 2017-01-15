import { expect } from "chai";
import { execFile } from "child_process";

describe.only("script", () => {
  const hc_bin = "lib/hc.js";
  const sample_script = "hc/sample.hc";
  let script_name: string;

  beforeEach(function () {
    script_name = this.currentTest.title;
  });

  it(sample_script, () => {
    execFile(hc_bin, [script_name], (error, stdout, stderr) => {
      expect(error).to.be.null;
      expect(false).to.be.ok;
      expect(stdout).to.equal("“Hello, Homoiconicity!”");
    });
  });
});
