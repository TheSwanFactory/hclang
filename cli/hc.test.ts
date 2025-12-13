import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { getOptions, main } from "./hc.ts";

describe("getOptions", () => {
  it("is exported", () => {
    expect(getOptions).toBeTruthy();
  });

  it("defaults to false", () => {
    const args: string[] = [];
    const options = getOptions(args);
    expect(options.help).toEqual(false);
    expect(options.interactive).toEqual(false);
    expect(options.testdoc).toEqual(false);
    expect(options.verbose).toEqual(false);
    expect(options.version).toEqual(false);
  });

  it("parses short boolean correctly", () => {
    const args = ["-h", "-i", "-t", "-v", "-V"];
    const options = getOptions(args);
    expect(options.help).toEqual(true);
    expect(options.interactive).toEqual(true);
    expect(options.testdoc).toEqual(true);
    expect(options.verbose).toEqual(true);
    expect(options.version).toEqual(true);
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
    expect(options.help).toEqual(true);
    expect(options.interactive).toEqual(true);
    expect(options.testdoc).toEqual(true);
    expect(options.verbose).toEqual(true);
    expect(options.version).toEqual(true);
  });

  it("parses string correctly", () => {
    const args = ["--evaluate", "1+1"];
    const options = getOptions(args);
    expect(options.evaluate).toEqual("1+1");
  });

  it("parses multiple files", () => {
    const args = ["file1", "file2"];
    const options = getOptions(args);
    expect(options._).toEqual(["file1", "file2"]);
  });
});

describe("main", () => {
  it("is exported", () => {
    expect(main).toBeTruthy();
  });
});
