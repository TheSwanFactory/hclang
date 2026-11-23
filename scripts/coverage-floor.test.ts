import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  failures,
  lineTotals,
  measure,
  nothingToReport,
  type Package,
  PACKAGES,
  percent,
  type Step,
} from "./coverage-floor.ts";

const row = (name: string, floor: number): Package => ({
  name,
  prefix: `${name}/`,
  steps: [],
  excludes: [],
  floor,
});

describe("lineTotals", () => {
  it("sums the LH and LF records of every file", () => {
    const lcov = [
      "SF:/repo/lib/a.ts",
      "FNF:2",
      "FNH:1",
      "DA:1,1",
      "BRF:4",
      "BRH:3",
      "LH:7",
      "LF:10",
      "end_of_record",
      "SF:/repo/lib/b.ts",
      "LH:3",
      "LF:5",
      "end_of_record",
      "",
    ].join("\n");
    expect(lineTotals(lcov)).toEqual({ hit: 10, found: 15 });
  });

  it("reports nothing for an empty report", () => {
    expect(lineTotals("")).toEqual({ hit: 0, found: 0 });
  });
});

describe("percent", () => {
  it("divides lines hit by lines found", () => {
    expect(percent(9869, 10428)).toBeCloseTo(94.64, 2);
    expect(percent(5, 5)).toEqual(100);
  });

  it("is 0 when no line was found", () => {
    expect(percent(0, 0)).toEqual(0);
  });
});

describe("failures", () => {
  const rows = [row("lib", 94), row("cli", 78)];

  it("passes rows at or above their floor", () => {
    const results = [
      { name: "lib", hit: 94, found: 100 },
      { name: "cli", hit: 99, found: 100 },
    ];
    expect(failures(results, rows)).toEqual([]);
  });

  it("fails a row below its floor", () => {
    const results = [
      { name: "lib", hit: 9399, found: 10000 },
      { name: "cli", hit: 78, found: 100 },
    ];
    expect(failures(results, rows)).toEqual([
      "lib: 93.99% is below its 94% floor",
    ]);
  });

  it("fails a row whose report is empty or missing", () => {
    const results = [{ name: "lib", hit: 0, found: 0 }];
    expect(failures(results, rows)).toEqual([
      "lib: the coverage report is empty",
      "cli: the coverage report is empty",
    ]);
  });
  it("reports a row's error and still checks every other row", () => {
    const results = [
      { name: "lib", hit: 0, found: 0, error: "deno coverage failed (exit 1)" },
      { name: "cli", hit: 77, found: 100 },
    ];
    expect(failures(results, rows)).toEqual([
      "lib: deno coverage failed (exit 1)",
      "cli: 77.00% is below its 78% floor",
    ]);
  });
});
describe("nothingToReport", () => {
  it("recognizes deno coverage's two empty-report errors", () => {
    expect(nothingToReport("error: No coverage files found\n")).toBe(true);
    expect(
      nothingToReport("error: No covered files included in the report\n"),
    ).toBe(true);
  });
  it("does not mistake another error for an empty report", () => {
    const stderr = "error: Failed reading '/tmp/x/bad.json'\n\n" +
      "Caused by:\n    EOF while parsing a value at line 1 column 0\n";
    expect(nothingToReport(stderr)).toBe(false);
  });
});
describe("measure", () => {
  // A tiny package in a temporary root: one module that its step runs.
  const run: Step = { cwd: ".", args: ["run", "--no-lock", "m.ts"] };
  const at = (prefix: string, steps: Step[]): Package => ({
    name: "fixture",
    prefix,
    steps,
    excludes: [],
    floor: 50,
  });
  const inFixture = async (
    test: (root: string) => Promise<void>,
  ): Promise<void> => {
    const root = Deno.realPathSync(await Deno.makeTempDir());
    try {
      await Deno.writeTextFile(`${root}/m.ts`, "export const one = 1;\n");
      await test(root);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  };
  it("totals the lines its steps cover", () =>
    inFixture(async (root) => {
      const result = await measure(root, at("", [run]));
      expect(result.error).toBeUndefined();
      expect(result.found).toBeGreaterThan(0);
      expect(result.hit).toEqual(result.found);
    }));
  it("records failing tests as the row's error instead of throwing", () =>
    inFixture(async (root) => {
      const failing = { cwd: ".", args: ["eval", "Deno.exit(3)"] };
      const result = await measure(root, at("", [failing, run]));
      expect(result).toEqual({
        name: "fixture",
        hit: 0,
        found: 0,
        error: "its tests failed (deno eval Deno.exit(3), exit 3)",
      });
    }));
  it("reports an empty report with no error", () =>
    inFixture(async (root) => {
      const result = await measure(root, at("elsewhere/", [run]));
      expect(result).toEqual({ name: "fixture", hit: 0, found: 0 });
    }));
  it("reports a failure of deno coverage as an error", () =>
    inFixture(async (root) => {
      // An empty V8 coverage file makes `deno coverage` fail to read it.
      const corrupt = {
        cwd: ".",
        args: [
          "eval",
          "Deno.writeTextFileSync(" +
          "Deno.env.get('DENO_COVERAGE_DIR') + '/bad.json', '')",
        ],
      };
      const result = await measure(root, at("", [corrupt]));
      expect(result.error).toEqual("deno coverage failed (exit 1)");
    }));
});

describe("PACKAGES", () => {
  it("has one row per package, each with its own directory and tests", () => {
    expect(PACKAGES.map((each) => each.name)).toEqual([
      "lib",
      "cli",
      "maml",
      "scripts",
      "web",
      "experiments/007-observer-algebras",
    ]);
    for (const each of PACKAGES) {
      expect(each.prefix).toEqual(`${each.name}/`);
      expect(each.steps.length).toBeGreaterThan(0);
      expect(Number.isInteger(each.floor)).toBe(true);
    }
  });

  it("never collects web through test:consumer", () => {
    const web = PACKAGES.find((each) => each.name === "web");
    const tasks = web?.steps.map((step) => step.args.join(" "));
    expect(tasks).not.toContain("task test:consumer");
  });
});
