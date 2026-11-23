import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  failures,
  lineTotals,
  type Package,
  PACKAGES,
  percent,
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
