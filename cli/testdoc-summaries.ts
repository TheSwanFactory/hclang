/**
 * The recorded test summary of every HC testdoc, kept in
 * `testdoc-summaries.json` beside this module.
 *
 * The table covers every discovered testdoc plus `white-paper-core.hc`, the
 * legacy example that `cli/hc.test.ts` runs directly. After a testdoc's claims
 * change, regenerate the table with `cd cli && deno task testdoc:summaries`
 * and commit the result.
 *
 * Because the table is produced by the code the tests guard, the generator
 * guards it against recording a regression. Before writing, it prints each
 * file's recorded counts and new counts. It refuses to write a table in which
 * a file's `total` or `pass` drops, its `fail` or `unimplemented` rises, or the
 * file disappears, unless `--allow-regression` is given:
 * `cd cli && deno task testdoc:summaries --allow-regression`.
 *
 * Only a run that exits 0 is recorded, by intent. A testdoc exits non-zero when
 * any claim fails, and such a testdoc already fails `test:doc`, so its counts
 * are never a state to keep: fix the claim or the code, then regenerate.
 *
 * @module
 */
import { fromFileUrl } from "@std/path";
import { FrameArray } from "../lib/frames.ts";
import { getEval, getOptions, main } from "./hc.ts";
import { discoverTestdocs } from "./test-docs.ts";

/** The counts a testdoc's `$=.test-summary` reports. */
export type TestdocSummary = {
  total: number;
  pass: number;
  fail: number;
  unimplemented: number;
};

/** Where the recorded table lives. */
const SUMMARIES_URL: URL = new URL(
  "./testdoc-summaries.json",
  import.meta.url,
);

/** The files the table records, in sorted order. */
export async function recordedFiles(): Promise<string[]> {
  return [...await discoverTestdocs(), "white-paper-core.hc"].sort();
}

/** Reads the recorded table. */
export async function readSummaries(): Promise<
  Record<string, TestdocSummary>
> {
  return JSON.parse(await Deno.readTextFile(SUMMARIES_URL));
}

/** The quoted summary text a testdoc run prints for `s`. */
export function summaryText(s: TestdocSummary): string {
  return `“${JSON.stringify(s)}”`;
}

/** Runs `file` under `hc/` as a testdoc with the CLI's real harness. */
export async function runTestdoc(
  file: string,
): Promise<{ status: number; last: string }> {
  const out = new FrameArray([]);
  const status = await main(
    getEval({}, out),
    getOptions([
      "--testdoc",
      fromFileUrl(new URL(`../hc/${file}`, import.meta.url)),
    ]),
  );
  return { status, last: out.at(-1).toString() };
}

/** The quoted summary JSON in a run's last line, captured without quotes. */
const SUMMARY_PATTERN = /“(\{"total":[^”]*\})”/;

/** The flag that lets the generator record a regression. */
export const ALLOW_REGRESSION = "--allow-regression";

/** Counts as the report prints them, or `none` for a file not in the table. */
function countsText(s: TestdocSummary | undefined): string {
  return s === undefined
    ? "none"
    : `total ${s.total}, pass ${s.pass}, fail ${s.fail}, ` +
      `unimplemented ${s.unimplemented}`;
}

/**
 * Whether `next` records less than `previous`: a file lost, a smaller total or
 * pass count, or more failed or unimplemented claims. Counts cannot catch every
 * swap, but a claim that slips to unimplemented while another is added keeps
 * the total and pass count level, so the unimplemented count is checked too.
 */
function regressed(
  previous: TestdocSummary,
  next: TestdocSummary | undefined,
): boolean {
  return next === undefined || next.total < previous.total ||
    next.pass < previous.pass || next.fail > previous.fail ||
    next.unimplemented > previous.unimplemented;
}

/**
 * Compares a new table with the recorded one.
 *
 * @param previous The recorded table.
 * @param next The table the runs produced.
 * @param args The generator's arguments, which may hold `--allow-regression`.
 * @returns One `file: old → new` line per file in either table, and, when a
 *   file regressed and the flag is absent, the reason nothing may be written.
 */
export function reviewTable(
  previous: Record<string, TestdocSummary>,
  next: Record<string, TestdocSummary>,
  args: readonly string[],
): { report: string[]; refusal: string | undefined } {
  const files = [...new Set([...Object.keys(previous), ...Object.keys(next)])]
    .sort();
  const report = files.map((file) =>
    `${file}: ${countsText(previous[file])} → ${countsText(next[file])}`
  );
  const worse = files.filter((file) =>
    previous[file] !== undefined && regressed(previous[file], next[file])
  );
  const refusal = worse.length === 0 || args.includes(ALLOW_REGRESSION)
    ? undefined
    : `${worse.join(", ")} regressed; nothing written. If the change is ` +
      `intended, run again with ${ALLOW_REGRESSION}`;
  return { report, refusal };
}

if (import.meta.main) {
  const table: Record<string, TestdocSummary> = {};
  for (const file of await recordedFiles()) {
    const { status, last } = await runTestdoc(file);
    const match = SUMMARY_PATTERN.exec(last);
    // Only an exit-0 run is recorded; a failing claim already fails test:doc.
    if (status !== 0 || match === null) {
      console.error(
        `testdoc:summaries: ${file} exited ${status} with ${last}; ` +
          "nothing written",
      );
      Deno.exit(1);
    }
    const { total, pass, fail, unimplemented } = JSON.parse(match[1]);
    table[file] = { total, pass, fail, unimplemented };
  }
  const { report, refusal } = reviewTable(
    await readSummaries(),
    table,
    Deno.args,
  );
  for (const line of report) console.log(line);
  if (refusal !== undefined) {
    console.error(`testdoc:summaries: ${refusal}`);
    Deno.exit(1);
  }
  await Deno.writeTextFile(
    SUMMARIES_URL,
    JSON.stringify(table, null, 2) + "\n",
  );
  console.log(`testdoc:summaries: wrote ${Object.keys(table).length} entries`);
}
