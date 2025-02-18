import { expect } from "npm:chai";
import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { runfile } from "./runfile.ts";

describe("runfile", () => {
  let hc_eval: { call: (line: string) => void };

  beforeEach(() => {
    hc_eval = { call: (_line: string) => {} };
  });

  it("is exported", () => {
    expect(runfile).to.be.ok;
  });

  it("calls hc_eval.call for each line in the file", async () => {
    const file = "test/cli/testfile.txt";
    await Deno.writeTextFile(file, "1 + 1\n2 + 2");

    let callCount = 0;
    hc_eval.call = (_line: string) => {
      callCount++;
    };

    await runfile(hc_eval, file);

    expect(callCount).to.be.greaterThan(0);
    await Deno.remove(file);
  });

  it("handles empty files", async () => {
    const emptyFile = "test/cli/emptyfile.txt";
    await Deno.writeTextFile(emptyFile, "");

    let callCount = 0;
    hc_eval.call = (_line: string) => {
      callCount++;
    };
    await runfile(hc_eval, emptyFile);
    expect(callCount).to.equal(0);
    await Deno.remove(emptyFile);
  });

  it("handles files with a single line", async () => {
    const singleLineFile = "test/cli/singlelinefile.txt";
    await Deno.writeTextFile(singleLineFile, "1 + 1");

    let callCount = 0;
    hc_eval.call = (_line: string) => {
      callCount++;
    };
    await runfile(hc_eval, singleLineFile);
    expect(callCount).to.equal(1);
    await Deno.remove(singleLineFile);
  });
  it("handles files with multiple lines", async () => {
    const multiLineFile = "test/cli/multilinefile.txt";
    await Deno.writeTextFile(multiLineFile, "1 + 1\n2 + 2");

    let callCount = 0;
    hc_eval.call = (_line: string) => {
      callCount++;
    };
    await runfile(hc_eval, multiLineFile);
    expect(callCount).to.equal(2);
    await Deno.remove(multiLineFile);
  });
  it("handles files with a trailing newline", async () => {
    const trailingNewlineFile = "test/cli/trailingnewlinefile.txt";
    await Deno.writeTextFile(trailingNewlineFile, "1 + 1\n");

    let callCount = 0;
    hc_eval.call = (_line: string) => {
      callCount++;
    };
    await runfile(hc_eval, trailingNewlineFile);
    expect(callCount).to.equal(1);
    await Deno.remove(trailingNewlineFile);
  });
});
