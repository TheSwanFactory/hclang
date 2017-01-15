import { expect } from "chai";
import { execFile } from "child_process";

describe("script", () => {
  const hc_bin = "lib/hc.js"
  const sample_script = "hc/sample.hc"

  it(sample_script, () => {
    console.log("title: ", this.title)
    execFile(hc_bin, [this.title], (error, stdout, stderr) => {
      expect(error).to.be.null;
    });
  });
});
