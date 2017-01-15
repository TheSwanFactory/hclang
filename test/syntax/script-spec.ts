import { expect } from "chai";
import { execFileSync } from "child_process";

describe.only("script", () => {
  const hc_bin = "lib/hc.js";
  const sample_script = "hc/sample.hc";
  let script_name: string;

  beforeEach(function () {
    script_name = this.currentTest.title;
  });

  it(sample_script, () => {
    const result = execFileSync(hc_bin, [script_name]).toString();
    expect(result).to.equal("“Hello, Homoiconicity!”");
  });
});
