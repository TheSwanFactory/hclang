import { expect } from "@std/expect";
import { readSummaries, recordedFiles } from "./testdoc-summaries.ts";

Deno.test("records a summary for every testdoc", async () => {
  // A new testdoc needs an entry: `cd cli && deno task testdoc:summaries`.
  expect(Object.keys(await readSummaries())).toEqual(await recordedFiles());
});
