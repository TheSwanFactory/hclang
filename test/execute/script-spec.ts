import { expect } from "chai";
import { execFileSync } from "child_process";
import { } from "mocha";

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

  it("=", () => {
    const result = script(["-e", title]);
    expect(result[0]).to.include(title);
    // Frame is a language with no equal
  });

  it("123", () => {
    const result = script(["-e", title]);
    expect(result[0]).to.equal(title);
  });

  it("“Hello, Quine!”", () => {
    const result = script(["-e", title]);
    expect(result[0]).to.equal(title);
  });
});
