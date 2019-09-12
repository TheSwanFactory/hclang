import { expect } from "chai";
import { execFileSync } from "child_process";
import {} from "mocha";

describe("script", () => {
  const hc_bin = "lib/cli/hc.js";
  let title: string;

  beforeEach(function() {
    title = this.currentTest.title;
  });

  const script = (args: string[]) => {
    const result = execFileSync(hc_bin, args);
    return result.toString().split("\n");
  };

  describe("expression", () => {
    const hello_string = "“Hello, Quine!”";
    const inline_comment = "#Inline#";
    const endline_comment = "#End-of-line\n";

    it(hello_string, () => {
      const result = script(["-e", title]);
      expect(result[0]).to.equal(title);
    });
  });
});
