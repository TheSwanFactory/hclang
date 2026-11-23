import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { visibleEnvironment } from "../lib/execute/env-visibility.ts";
import { HCEval } from "../lib/execute/hc-eval.ts";
import {
  CLOCK_SCHEME,
  FrameArray,
  type FrameResource,
  RESOURCE_ROOT_KEY,
} from "../lib/frames.ts";
import { getEval, getHandlers, getHost, getOptions, main } from "./hc.ts";
import {
  readSummaries,
  runTestdoc as runRecordedTestdoc,
  summaryText,
} from "./testdoc-summaries.ts";

// Malformed-input and no-authority tests intentionally bypass the CLI factory:
// they exercise HCEval itself or prove behavior without a host root binding.
const bareEval = (out = new FrameArray([])): HCEval => new HCEval(out);

/** Every testdoc's recorded summary, from `testdoc-summaries.json`. */
const table = await readSummaries();

/** Files that already have a case of their own in `describe("main")`. */
const dedicated = new Set<string>();

/** Registers `name`, which runs `file` and expects its recorded summary. */
const keepsRecordedSummary = (name: string, file: string): void => {
  dedicated.add(file);
  it(name, async () => {
    const { status, last } = await runRecordedTestdoc(file);

    expect(status).toEqual(0);
    expect(
      last,
      `${file} no longer prints its recorded summary; if the change is ` +
        "intended, run `cd cli && deno task testdoc:summaries`",
    ).toContain(summaryText(table[file]));
  });
};

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

describe("this harness's grant", () => {
  it("passes only the declared environment variables to a program", () => {
    const environment = visibleEnvironment(
      (name) => ({ HOME: "/home/x", SECRET_TOKEN: "leaked" })[name],
    );
    const evaluator = getEval(environment);

    expect(evaluator.hostNamespace.get_here("HOME").toString()).toEqual(
      "“/home/x”",
    );
    expect(evaluator.hostNamespace.get_here("SECRET_TOKEN").is.missing)
      .toBe(true);
  });

  it("binds the clock and leaves every other scheme an empty slot", () => {
    expect(getHandlers().schemes()).toEqual([CLOCK_SCHEME]);
    expect(getHandlers().handler("https")).toBeUndefined();
    expect(getHandlers().handler("file")).toBeUndefined();
  });

  it("installs that table on the root binding it grants", () => {
    const root = getHost().get_here(RESOURCE_ROOT_KEY) as FrameResource;

    expect(root.boundSchemes()).toEqual([CLOCK_SCHEME]);
  });

  it("derives its permission flags from what the harness needs", async () => {
    // The flags are a derived artifact of this one harness, never the security
    // model, so what is asserted is that they stay a floor: no `-A`, and
    // subprocess and FFI authority denied outright, since either one voids
    // every path scope the root binding enforces.
    const manifest = JSON.parse(
      await Deno.readTextFile(new URL("./deno.json", import.meta.url)),
    );
    const workspace = JSON.parse(
      await Deno.readTextFile(new URL("../deno.json", import.meta.url)),
    );
    const tasks = [
      manifest.tasks.hc,
      manifest.tasks.build,
      workspace.tasks.hc,
    ];

    for (const task of tasks) {
      expect(task).not.toContain("-A");
      expect(task).not.toContain("--allow-all");
      expect(task).toContain("--deny-run");
      expect(task).toContain("--deny-ffi");
    }
  });
});

describe("main", () => {
  it("is exported", () => {
    expect(main).toBeTruthy();
  });

  it("keeps host bindings outside the initial file scope", () => {
    const evaluator = getEval({ hostValue: "9" });

    expect(evaluator.fileScope.get_here("hostValue").is.missing).toBe(true);
    expect(evaluator.hostNamespace.get_here("hostValue").toString()).toEqual(
      "9",
    );
  });

  it("isolates file scopes while sharing the host namespace", async () => {
    const directory = await Deno.makeTempDir();
    const first = `${directory}/first.hc`;
    const second = `${directory}/second.hc`;
    try {
      await Deno.writeTextFile(first, ".x 7;\n$.x\n");
      await Deno.writeTextFile(second, "$.x\n$$.host\n");
      const out = new FrameArray([]);

      const status = await main(
        getEval({ host: "9" }, out),
        getOptions([first, second]),
      );
      const rendered = out.asArray().map(String);

      expect(status).toEqual(1);
      expect(rendered.some((value) => value.includes("$!.name-missing $.x")))
        .toBe(true);
      expect(rendered.at(-1)).toEqual("9");
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });

  for (const source of ["1 / 0", "missing_name", "1; 1 / 0; 2"]) {
    it(`returns failure for an unhandled runtime error: ${source}`, async () => {
      const out = new FrameArray([]);
      expect(await main(bareEval(out), getOptions(["-e", source]))).toBe(1);
      expect(out.toString()).toContain("$!.");
    });
  }

  for (const source of ["]", "[1)", "[1"]) {
    it(`reports structural failure for ${source}`, async () => {
      const originalError = console.error;
      const errors: string[] = [];
      console.error = (...args: unknown[]) => errors.push(args.join(" "));
      try {
        expect(await main(bareEval(), getOptions(["-e", source]))).toBe(1);
        expect(errors.join("\n")).toContain("$!.parse-");
      } finally {
        console.error = originalError;
      }
    });
  }

  it("retains runtime failure status when a later source file succeeds", async () => {
    const failing = await Deno.makeTempFile({ suffix: ".hc" });
    const succeeding = await Deno.makeTempFile({ suffix: ".hc" });
    try {
      await Deno.writeTextFile(failing, "1 / 0");
      await Deno.writeTextFile(succeeding, "7");
      const out = new FrameArray([]);
      expect(await main(bareEval(out), getOptions([failing, succeeding]))).toBe(
        1,
      );
      expect(out.toString()).toContain("7");
    } finally {
      await Deno.remove(failing);
      await Deno.remove(succeeding);
    }
  });

  it("accepts expected runtime errors in executable documentation", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    try {
      await Deno.writeTextFile(file, "; 1 / 0\n# $!.division-by-zero /\n");
      expect(await main(bareEval(), getOptions(["--testdoc", file]))).toBe(0);
    } finally {
      await Deno.remove(file);
    }
  });

  it("returns a non-zero status for a failed testdoc assertion", async () => {
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    try {
      await Deno.writeTextFile(file, "; 1\n# 2\n");
      const hcEval = bareEval();
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
      const hcEval = bareEval();
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
        bareEval(out),
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
      const hcEval = bareEval();
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
      const hcEval = bareEval();
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
      const hcEval = bareEval();
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

  keepsRecordedSummary(
    "keeps the maintained testdoc fixture green with authoritative totals",
    "testdoc.hc",
  );

  keepsRecordedSummary(
    "keeps the numeric acceptance testdoc green",
    "numerics.hc",
  );

  keepsRecordedSummary(
    "keeps the units acceptance testdoc green",
    "units.hc",
  );

  keepsRecordedSummary(
    "keeps the Figures testdoc green",
    "figures.hc",
  );

  keepsRecordedSummary(
    "keeps the Denum class testdoc green (011.20)",
    "denum.hc",
  );

  keepsRecordedSummary(
    "keeps the constructed-state VACT testdoc green (Explore 022.05a)",
    "constructed-state.hc",
  );

  keepsRecordedSummary(
    "keeps the RotorRouter class testdoc green (011.21)",
    "rotor-router.hc",
  );

  keepsRecordedSummary(
    "keeps the literal division testdoc green (007.27)",
    "division.hc",
  );

  /** Runs `source` as a temporary testdoc under the CLI's real harness. */
  const runTestdoc = async (source: string) => {
    const out = new FrameArray([]);
    const file = await Deno.makeTempFile({ suffix: ".hc" });
    try {
      await Deno.writeTextFile(file, source);
      const status = await main(
        getEval({}, out),
        getOptions(["--testdoc", file]),
      );
      return { status, summary: out.at(-1).toString() };
    } finally {
      await Deno.remove(file);
    }
  };

  it("imports a bundled testdoc and counts only the importer's claims", async () => {
    // figures.hc is itself a testdoc with dozens of claims. The import reads it
    // through the overlay the CLI installs and skips its examples, so the only
    // claim that counts is the one written here.
    const { status, summary } = await runTestdoc(
      "Figures <- './hc/figures.hc';\n; ([] * []) = []\n# <>\n",
    );

    expect(status).toEqual(0);
    expect(summary).toContain(
      '“{"total":1,"pass":1,"fail":0,"unimplemented":0}”',
    );
  });

  it("overlays the bundled files read-only on a fresh root", async () => {
    // The root is a fresh temporary directory, so the working directory's
    // deno.json is absent, as is a path under hc/ that ships no file.
    const { status, summary } = await runTestdoc(
      "; './hc/figures.hc' “overwrite”\n" +
        "# $!.resource-read-only './hc/figures.hc'\n" +
        "; './deno.json' | “”\n# $!.resource-absent './deno.json'\n" +
        "; './hc/other.hc' | “”\n# $!.resource-absent './hc/other.hc'\n",
    );

    expect(status).toEqual(0);
    expect(summary).toContain(
      '“{"total":3,"pass":3,"fail":0,"unimplemented":0}”',
    );
  });

  dedicated.add("BitScheme.hc");
  it("traverses the BitScheme tutorial with authoritative totals", async () => {
    const out = new FrameArray([]);
    const file = new URL("../hc/BitScheme.hc", import.meta.url).pathname;
    const originalError = console.error;
    const diagnostics: unknown[][] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args);
    try {
      const status = await main(
        getEval({}, out),
        getOptions(["--testdoc", file]),
      );
      const summaries = out.asArray().filter((item) =>
        item.toString().includes("$=.test-summary")
      );

      expect(status).toEqual(0);
      expect(diagnostics).toEqual([]);
      expect(summaries.length).toEqual(1);
      expect(summaries[0].toString()).toContain(
        summaryText(table["BitScheme.hc"]),
      );
    } finally {
      console.error = originalError;
    }
  });

  keepsRecordedSummary(
    "passes the white-paper core examples independently",
    "white-paper-core.hc",
  );

  keepsRecordedSummary(
    "passes the annotated class-support examples independently",
    "class-support.hc",
  );

  keepsRecordedSummary(
    "passes executable rendering coverage with authoritative totals",
    "format.hc",
  );

  // Run under the namespace the CLI actually installs: an empty one would
  // leave every identifier inert and assert nothing about the primitive.
  keepsRecordedSummary(
    "keeps the resource acceptance testdoc green under real authority",
    "resources.hc",
  );

  // The clock is a handler entry, so this asserts the corpus under the table
  // the CLI installs rather than under one arranged for the test.
  keepsRecordedSummary(
    "keeps the time acceptance testdoc green under the installed clock",
    "time.hc",
  );

  // A root binding, because the resource decisions are part of the model this
  // file pins. Every decision is executable, so nothing here is a promise.
  keepsRecordedSummary(
    "keeps the apply-and-iterate decisions green under real authority",
    "apply.hc",
  );

  it("leaves a resource identifier inert with no root binding installed", () => {
    const out = new FrameArray([]);
    const hcEval = bareEval(out);

    hcEval.call("'./out.txt' “hello”");
    expect(hcEval.finish()).toEqual(true);
    expect(out.at(0).toString()).toEqual("“hello”");
  });

  dedicated.add("white-paper.hc");
  it("traverses the complete white paper with authoritative totals", async () => {
    const out = new FrameArray([]);
    const file = new URL("../hc/white-paper.hc", import.meta.url).pathname;
    const originalError = console.error;
    const diagnostics: unknown[][] = [];
    console.error = (...args: unknown[]) => diagnostics.push(args);
    try {
      const status = await main(
        getEval({}, out),
        getOptions(["--testdoc", file]),
      );
      const summaries = out.asArray().filter((item) =>
        item.toString().includes("$=.test-summary")
      );

      expect(status).toEqual(0);
      expect(diagnostics).toEqual([]);
      expect(summaries.length).toEqual(1);
      expect(summaries[0].toString()).toContain(
        summaryText(table["white-paper.hc"]),
      );
    } finally {
      console.error = originalError;
    }
  });

  // Every recorded testdoc without a case above still keeps its summary.
  for (const file of Object.keys(table)) {
    if (dedicated.has(file)) continue;
    keepsRecordedSummary(`keeps ${file} at its recorded summary`, file);
  }
});
