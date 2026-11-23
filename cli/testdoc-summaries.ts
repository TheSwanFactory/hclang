/**
 * The recorded test summary of every HC testdoc, kept in
 * `testdoc-summaries.json` beside this module.
 *
 * The table covers every discovered testdoc plus `white-paper-core.hc`, the
 * legacy example that `cli/hc.test.ts` runs directly. After a testdoc's claims
 * change, regenerate the table with `cd cli && deno task testdoc:summaries`
 * and commit the result.
 *
 * @module
 */
import { fromFileUrl } from "jsr:@std/path@1.1.6";
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

if (import.meta.main) {
  const table: Record<string, TestdocSummary> = {};
  for (const file of await recordedFiles()) {
    const { status, last } = await runTestdoc(file);
    const match = SUMMARY_PATTERN.exec(last);
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
  await Deno.writeTextFile(
    SUMMARIES_URL,
    JSON.stringify(table, null, 2) + "\n",
  );
  console.log(`testdoc:summaries: wrote ${Object.keys(table).length} entries`);
}
