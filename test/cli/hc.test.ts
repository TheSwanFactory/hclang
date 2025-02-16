import { expect } from "npm:chai";
import { describe, it } from "jsr:@std/testing/bdd";
import { getOptions, main } from "../../src/cli/hc.ts";

describe("getOptions", () => {
  it("is exported", () => {
    expect(getOptions).to.be.ok;
  });

  it("defaults to false", () => {
    const args: string[] = [];
    const options = getOptions(args);
    expect(options.help).to.equal(false);
    expect(options.interactive).to.equal(false);
    expect(options.testdoc).to.equal(false);
    expect(options.verbose).to.equal(false);
    expect(options.version).to.equal(false);
  });

  it("parses short boolean correctly", () => {
    const args = ["-h", "-i", "-t", "-v", "-V"];
    const options = getOptions(args);
    expect(options.help).to.equal(true);
    expect(options.interactive).to.equal(true);
    expect(options.testdoc).to.equal(true);
    expect(options.verbose).to.equal(true);
    expect(options.version).to.equal(true);
  });

  it("parses boolean correctly", () => {
    const args = [
      "--help",
      "--interactive",
      "--testdoc",
      "--verbose",
      "--version",
    ];
    const options = getOptions(args);
    expect(options.help).to.equal(true);
    expect(options.interactive).to.equal(true);
    expect(options.testdoc).to.equal(true);
    expect(options.verbose).to.equal(true);
    expect(options.version).to.equal(true);
  });

  it("parses string correctly", () => {
    const args = ["--evaluate", "1+1"];
    const options = getOptions(args);
    expect(options.evaluate).to.equal("1+1");
  });

  it("parses multiple files", () => {
    const args = ["file1", "file2"];
    const options = getOptions(args);
    expect(options._).to.deep.equal(["file1", "file2"]);
  });
});

describe("main", () => {
  it("is exported", () => {
    expect(main).to.be.ok;
  });
});
