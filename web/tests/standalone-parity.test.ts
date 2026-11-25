import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { dirname, fromFileUrl, join, toFileUrl } from "@std/path";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
// The playground ships a minified bundle, which renames classes. A check that
// recognizes a class by its name then never matches there, so the playground
// answers differently from the CLI (#513). Each case runs through the built
// artifact in a browser and through the CLI, and the answers must agree.
const webDir = dirname(dirname(fromFileUrl(import.meta.url)));
const rootDir = dirname(webDir);
const artifactUrl = toFileUrl(join(webDir, "dist/hcweb.html")).href;
/** HC whose answer depends on recognizing a class, with what it exercises. */
const CASES: readonly (readonly [string, string])[] = [
  ["a $! handler runs", "$!!.zero $! 7"],
  ["a handler reads its observation", "$!!.zero $! {_ .#}"],
  ["nothing counts", "<>.#"],
  ["nothing counts leaves", "<>.##"],
  ["() negates", "().!"],
  ["<> negates", "<>.!"],
  [
    "a class declares an operator",
    ".Vec [.n 3; .+ {.a (_^ .n); .b (_ .n); [.n (a + b)]}]; (Vec + [.n 4]).n",
  ],
  ["a grouped schema declares a schema", ".v (<.x>); v [.x 1]"],
  [
    "a dispatch reads each event's footprint",
    ".x_ [.n 5; .set_ {@n _;}]; .y_ [.n 10; .set_ {@n _;}]; " +
    ".incr-x {.a x_.n; x_.set_ (a + 1); x_.n}; " +
    ".incr-y {.a y_.n; y_.set_ (a + 1); y_.n}; " +
    "$$.dispatch.footprint [incr-x, incr-y]",
  ],
];
/** What `hc -e` prints for `source`, without its final newline. */
async function cliAnswer(source: string): Promise<string> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--deny-run",
      "--deny-ffi",
      "cli/hc.ts",
      "-e",
      source,
    ],
    cwd: rootDir,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const stderr = new TextDecoder().decode(output.stderr).trim();
  if (stderr) throw new Error(`hc -e ${source}: ${stderr}`);
  return new TextDecoder().decode(output.stdout).replace(/\n$/, "");
}
let browser: Browser;
let page: Page;
beforeAll(async () => {
  browser = await chromium.launch();
  const context = await browser.newContext({ offline: true });
  page = await context.newPage();
  await page.goto(artifactUrl);
  await page.getByRole("heading", { name: "HC Playground" }).waitFor();
});
afterAll(async () => {
  await browser?.close();
});
/** What the playground answers for `source` in a fresh interpreter. */
async function playgroundAnswer(source: string): Promise<string> {
  await page.getByRole("button", { name: "Reset interpreter" }).click();
  await page.getByText("No evaluations yet.").waitFor();
  await page.getByLabel("HC source").fill(source);
  await page.getByRole("button", { name: "Submit" }).click();
  const row = page.locator(".history tbody tr").first();
  await page.waitForFunction(
    (input) =>
      document.querySelector(".history tbody tr td")?.textContent === input,
    source,
  );
  return await row.locator("td").nth(1).textContent() ?? "";
}
describe("standalone artifact answers as the CLI does", () => {
  for (const [name, source] of CASES) {
    it(`${name}: ${source}`, async () => {
      expect(await playgroundAnswer(source)).toBe(await cliAnswer(source));
    });
  }
});
