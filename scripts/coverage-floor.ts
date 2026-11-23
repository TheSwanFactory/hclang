/**
 * Check each package's line coverage against its floor.
 *
 * For every row of {@link PACKAGES}, run the package's own tests with
 * `DENO_COVERAGE_DIR` set to a fresh directory, report that directory with
 * `deno coverage --lcov` filtered to the package, and compare the lines hit
 * with the row's floor. A row fails when its tests fail, when `deno coverage`
 * fails, when its report is empty, or when it is below its floor. Every row is
 * measured and printed before the check exits, so one failing row does not
 * hide the others. `deno task coverage:check` runs it, and so does CI's build
 * job; `deno task test` does not, because collecting coverage roughly doubles
 * the time of the tests it re-runs.
 *
 * The filters follow the audit's coverage findings (spec/a19-code-quality,
 * 1.1 and 1.2): an `--include` per package, an exclude of `\.test\.` with the
 * dot (so `lib/execute/hc-test.ts` counts), the generated bundle left out,
 * and web's coverage collected without `test:consumer`, whose vite build
 * hides web's sources from the report.
 *
 * @module
 */
import { fromFileUrl, toFileUrl } from "@std/path";

/** One command a row runs, from a directory relative to the repository root. */
export interface Step {
  readonly cwd: string;
  readonly args: readonly string[];
}

/** A package, the tests that cover it, and the floor its lines must reach. */
export interface Package {
  readonly name: string;
  /** Directory under the repository root, with a trailing slash. */
  readonly prefix: string;
  readonly steps: readonly Step[];
  /** Extra `--exclude` patterns, matched against file URLs. */
  readonly excludes: readonly string[];
  /** Whole-percent minimum for line coverage. */
  readonly floor: number;
}

/** The lines of one package's report, or why it has none. */
export interface Result {
  readonly name: string;
  readonly hit: number;
  readonly found: number;
  /** Set when the row's tests or `deno coverage` failed. */
  readonly error?: string;
}

const task = (name: string, cwd = "."): Step => ({
  cwd,
  args: ["task", name],
});

/**
 * The packages of the audit's coverage table, each with its own tests. Each
 * floor is the line coverage measured when the floor was set, rounded down to
 * a whole percent. A row measured at 99% or more instead gets the coverage it
 * would have with one more uncovered line, `hit / (found + 1)`, rounded down,
 * so that one new uncovered line in a small, almost fully covered package does
 * not fail CI while two do: lib/maml 57/58 gives 98, web 113/115 gives 98.
 */
export const PACKAGES: readonly Package[] = [
  {
    name: "lib",
    prefix: "lib/",
    steps: [task("test:lib")],
    excludes: ["/lib/bundle/hc-sources\\.ts$"],
    floor: 94,
  },
  {
    name: "cli",
    prefix: "cli/",
    steps: [task("test:cli")],
    excludes: [],
    floor: 78,
  },
  {
    name: "lib/maml",
    prefix: "lib/maml/",
    steps: [task("test:maml")],
    excludes: [],
    floor: 98,
  },
  {
    name: "scripts",
    prefix: "scripts/",
    steps: [task("test:scripts")],
    excludes: [],
    floor: 42,
  },
  {
    name: "web",
    prefix: "web/",
    steps: [
      task("build:web"),
      task("test:components", "web"),
      task("test:artifact", "web"),
    ],
    excludes: ["/web/(tests|dist)/"],
    floor: 98,
  },
  {
    name: "experiments/007-observer-algebras",
    prefix: "experiments/007-observer-algebras/",
    steps: [task("test:observer-algebras")],
    excludes: [],
    floor: 97,
  },
];

/** Test files, with the dot, so a module named `hc-test.ts` still counts. */
const TEST_FILES = "\\.test\\.(js|mjs|ts|jsx|tsx)$";

/** Sums the `LH:` and `LF:` records of an lcov report. */
export const lineTotals = (lcov: string): { hit: number; found: number } => {
  let hit = 0;
  let found = 0;
  for (const line of lcov.split("\n")) {
    if (line.startsWith("LH:")) hit += Number(line.slice(3));
    if (line.startsWith("LF:")) found += Number(line.slice(3));
  }
  return { hit, found };
};

/** Lines hit as a percentage of lines found; 0 for an empty report. */
export const percent = (hit: number, found: number): number =>
  found === 0 ? 0 : (hit / found) * 100;

/**
 * One message per row whose tests or coverage failed, that reported no lines,
 * or that is below its floor.
 */
export const failures = (
  results: readonly Result[],
  rows: readonly Package[],
): string[] =>
  rows.flatMap((row) => {
    const result = results.find((each) => each.name === row.name);
    if (result?.error !== undefined) return [`${row.name}: ${result.error}`];
    if (result === undefined || result.found === 0) {
      return [`${row.name}: the coverage report is empty`];
    }
    const measured = percent(result.hit, result.found);
    return measured < row.floor
      ? [
        `${row.name}: ${measured.toFixed(2)}% is below its ${row.floor}% floor`,
      ]
      : [];
  });

/** Escapes a path for use as a literal inside a regular expression. */
const literal = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The errors `deno coverage` exits 1 with when it has nothing to report: no
 * coverage files in the directory, or none of them under the row's filters.
 */
const NOTHING_TO_REPORT =
  /^error: (No coverage files found|No covered files included in the report)/m;

/**
 * ANSI color codes. `measure` runs `deno coverage` with `NO_COLOR`, so its
 * stderr is plain text; stripping them is a fallback for a forced-color run.
 */
// deno-lint-ignore no-control-regex -- the escape byte is what it matches.
const ANSI = /\x1b\[[0-9;]*m/g;

/** Whether `deno coverage`'s stderr says it had nothing to report. */
export const nothingToReport = (stderr: string): boolean =>
  NOTHING_TO_REPORT.test(stderr.replace(ANSI, ""));

/**
 * Runs deno quietly. On failure it prints deno's output, unless `benign`
 * accepts the failure's stderr, as for a report with nothing to show.
 */
const deno = async (
  args: readonly string[],
  cwd: string,
  env: Record<string, string>,
  benign: (stderr: string) => boolean = () => false,
): Promise<{ code: number; stderr: string }> => {
  const { code, stdout, stderr } = await new Deno.Command("deno", {
    args: [...args],
    cwd,
    env,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const text = new TextDecoder().decode(stderr);
  if (code !== 0 && !benign(text)) {
    await Deno.stdout.write(stdout);
    await Deno.stderr.write(stderr);
    console.error(`deno ${args.join(" ")} exited with ${code} in ${cwd}`);
  }
  return { code, stderr: text };
};

/**
 * Runs a row's tests under coverage and totals the lines of its report. A
 * failure of the tests or of `deno coverage` becomes the result's `error`.
 *
 * @param root The repository root, resolved, without a trailing slash.
 * @param row The package to measure.
 */
export const measure = async (root: string, row: Package): Promise<Result> => {
  const dir = await Deno.makeTempDir({ prefix: "hc-coverage-" });
  try {
    const env = { DENO_COVERAGE_DIR: dir, NO_COLOR: "1" };
    for (const step of row.steps) {
      const { code } = await deno(step.args, `${root}/${step.cwd}`, env);
      if (code !== 0) {
        return {
          name: row.name,
          hit: 0,
          found: 0,
          error: `its tests failed (deno ${step.args.join(" ")}, exit ${code})`,
        };
      }
    }
    const lcov = `${dir}/report.lcov`;
    const rootUrl = toFileUrl(root).href;
    const { code, stderr } = await deno(
      [
        "coverage",
        dir,
        `--include=^${literal(`${rootUrl}/${row.prefix}`)}`,
        `--exclude=${TEST_FILES}`,
        ...row.excludes.map((pattern) => `--exclude=${pattern}`),
        "--lcov",
        `--output=${lcov}`,
      ],
      root,
      { NO_COLOR: "1" },
      nothingToReport,
    );
    if (code !== 0 && !nothingToReport(stderr)) {
      return {
        name: row.name,
        hit: 0,
        found: 0,
        error: `deno coverage failed (exit ${code})`,
      };
    }
    const report = code === 0 ? await Deno.readTextFile(lcov) : "";
    return { name: row.name, ...lineTotals(report) };
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
};

const main = async (): Promise<void> => {
  // Reports name resolved paths (on macOS, /tmp is /private/tmp), so an
  // unresolved root would match no file.
  const root = Deno.realPathSync(fromFileUrl(new URL("..", import.meta.url)))
    .replace(/\/$/, "");
  const results: Result[] = [];
  for (const row of PACKAGES) {
    const started = performance.now();
    const result = await measure(root, row);
    results.push(result);
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(
      result.error === undefined
        ? `${row.name}: ${result.hit}/${result.found} lines, ` +
          `${percent(result.hit, result.found).toFixed(2)}%, ` +
          `floor ${row.floor}% (${seconds} s)`
        : `${row.name}: ${result.error}, floor ${row.floor}% (${seconds} s)`,
    );
  }
  const failed = failures(results, PACKAGES);
  for (const message of failed) console.error(message);
  if (failed.length > 0) Deno.exit(1);
};

if (import.meta.main) {
  await main();
}
