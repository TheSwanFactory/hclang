import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { HCEval } from "../lib/execute/hc-eval.ts";
import { FrameArray } from "../lib/frames.ts";
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

  it("returns a non-zero status for a failed testdoc assertion", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    try {
      await Deno.writeTextFile(file, "; 1\n# 2\n");
      const hcEval = new HCEval(new FrameArray([]));
      const status = await main(hcEval, getOptions(["--testdoc", file]));
      expect(status).toEqual(1);
    } finally {
      await Deno.remove(file);
    }
  });

  it("returns a non-zero status for an unterminated document", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    const originalError = console.error;
    const diagnostics: string[] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args.join(" "));
    try {
      await Deno.writeTextFile(file, "```unfinished ``");
      const hcEval = new HCEval(new FrameArray([]));
      const status = await main(hcEval, getOptions([file]));

      expect(status).toEqual(1);
      expect(diagnostics).toEqual([
        "HCEval.finish.failed: unterminated document string",
      ]);
    } finally {
      console.error = originalError;
      await Deno.remove(file);
    }
  });

  it("does not emit a successful test summary after lexical failure", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    const out = new FrameArray([]);
    const originalError = console.error;
    console.error = () => {};
    try {
      await Deno.writeTextFile(file, "```unfinished");
      const status = await main(
        new HCEval(out),
        getOptions(["--testdoc", file]),
      );

      expect(status).toEqual(1);
      expect(
        out.asArray().some((item) =>
          item.toString().includes("$=.test-summary")
        ),
      ).toEqual(false);
    } finally {
      console.error = originalError;
      await Deno.remove(file);
    }
  });

  it("returns a non-zero status for a greater interior run", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    const originalError = console.error;
    const diagnostics: string[] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args.join(" "));
    try {
      await Deno.writeTextFile(file, "```body````");
      const hcEval = new HCEval(new FrameArray([]));
      const status = await main(hcEval, getOptions([file]));

      expect(status).toEqual(1);
      expect(diagnostics).toEqual([
        "HCEval.finish.failed: document fence run exceeds the opening fence",
      ]);
    } finally {
      console.error = originalError;
      await Deno.remove(file);
    }
  });

  it("returns a non-zero status for an unterminated quoted string", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    const originalError = console.error;
    const diagnostics: string[] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args.join(" "));
    try {
      await Deno.writeTextFile(file, '"""body""');
      const hcEval = new HCEval(new FrameArray([]));
      const status = await main(hcEval, getOptions([file]));

      expect(status).toEqual(1);
      expect(diagnostics).toEqual([
        "HCEval.finish.failed: unterminated quoted string",
      ]);
    } finally {
      console.error = originalError;
      await Deno.remove(file);
    }
  });

  it("returns a non-zero status for a non-URI resource identifier", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    const originalError = console.error;
    const diagnostics: string[] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args.join(" "));
    try {
      await Deno.writeTextFile(file, "don't stop\n");
      const hcEval = new HCEval(new FrameArray([]));
      const status = await main(hcEval, getOptions([file]));

      expect(status).toEqual(1);
      expect(diagnostics).toEqual([
        "HCEval.finish.failed: unterminated resource identifier: 't",
      ]);
    } finally {
      console.error = originalError;
      await Deno.remove(file);
    }
  });

  it("keeps the maintained testdoc fixture green with authoritative totals", async () => {
    const out = new FrameArray([]);
    const file = new URL("./hc/testdoc.hc", import.meta.url).pathname;
    const status = await main(
      new HCEval(out),
      getOptions(["--testdoc", file]),
    );

    expect(status).toEqual(0);
    expect(out.at(-1).toString()).toContain(
      '“{"total":72,"pass":69,"fail":0,"unimplemented":3}”',
    );
  });

  it("traverses the BitScheme tutorial with authoritative totals", async () => {
    const out = new FrameArray([]);
    const file = new URL("./hc/BitScheme.hc", import.meta.url).pathname;
    const originalError = console.error;
    const diagnostics: unknown[][] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args);
    try {
      const status = await main(
        new HCEval(out),
        getOptions(["--testdoc", file]),
      );
      const summaries = out.asArray().filter((item) =>
        item.toString().includes("$=.test-summary")
      );

      expect(status).toEqual(0);
      expect(diagnostics).toEqual([]);
      expect(summaries.length).toEqual(1);
      expect(summaries[0].toString()).toContain(
        '“{"total":40,"pass":32,"fail":0,"unimplemented":8}”',
      );
    } finally {
      console.error = originalError;
    }
  });

  it("passes the white-paper core examples independently", async () => {
    const out = new FrameArray([]);
    const file = new URL("./hc/white-paper-core.hc", import.meta.url).pathname;
    const status = await main(
      new HCEval(out),
      getOptions(["--testdoc", file]),
    );

    expect(status).toEqual(0);
    expect(out.at(-1).toString()).toContain(
      '“{"total":16,"pass":16,"fail":0,"unimplemented":0}”',
    );
  });

  it("passes the annotated class-support examples independently", async () => {
    const out = new FrameArray([]);
    const file = new URL("./hc/class-support.hc", import.meta.url).pathname;
    const status = await main(
      new HCEval(out),
      getOptions(["--testdoc", file]),
    );

    expect(status).toEqual(0);
    expect(out.at(-1).toString()).toContain(
      '“{"total":31,"pass":31,"fail":0,"unimplemented":0}”',
    );
  });

  it("traverses the complete white paper with authoritative totals", async () => {
    const out = new FrameArray([]);
    const file = new URL("./hc/white-paper.hc", import.meta.url).pathname;
    const originalError = console.error;
    const diagnostics: unknown[][] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args);
    try {
      const status = await main(
        new HCEval(out),
        getOptions(["--testdoc", file]),
      );
      const summaries = out.asArray().filter((item) =>
        item.toString().includes("$=.test-summary")
      );

      expect(status).toEqual(0);
      expect(diagnostics).toEqual([]);
      expect(summaries.length).toEqual(1);
      expect(summaries[0].toString()).toContain(
        '“{"total":82,"pass":82,"fail":0,"unimplemented":0}”',
      );
    } finally {
      console.error = originalError;
    }
  });
});
