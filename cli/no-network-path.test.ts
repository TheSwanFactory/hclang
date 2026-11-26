/**
 * The structural half of the REST invariant: no network path but one.
 *
 * No source under `lib/`, and no source under `cli/` except the live REST
 * worker (`cli/rest-worker.ts`), may mention a network or worker primitive.
 * `lib/` stays permissionless and browser-safe, and the transport stays
 * reachable only from `RestHandler`'s `exchange`, after the policy check.
 * Tests are not shipped source, so they are not scanned.
 */
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { fromFileUrl, relative } from "@std/path";
const REPO = fromFileUrl(new URL("../", import.meta.url));
const SCANNED = ["lib", "cli"];
const ALLOWED = new Set(["cli/rest-worker.ts"]);
const PRIMITIVES = [
  "fetch(",
  "Deno.connect",
  "WebSocket",
  "XMLHttpRequest",
  "EventSource",
  "new Worker",
];
/** Every non-test TypeScript source below `directory`, repo-relative. */
const sources = (directory: string): string[] => {
  const found: string[] = [];
  for (const entry of Deno.readDirSync(`${REPO}${directory}`)) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory) found.push(...sources(path));
    else if (
      entry.isFile && /\.(ts|js)$/.test(entry.name) &&
      !/\.test\.(ts|js)$/.test(entry.name)
    ) {
      found.push(path);
    }
  }
  return found;
};
describe("network paths", () => {
  it("exist only in the live REST worker", () => {
    const files = SCANNED.flatMap(sources);
    expect(files.length).toBeGreaterThan(100);
    const offenders = files.flatMap((file) => {
      if (ALLOWED.has(file)) return [];
      const text = Deno.readTextFileSync(`${REPO}${file}`);
      return PRIMITIVES.filter((primitive) => text.includes(primitive)).map(
        (primitive) => `${relative(REPO, `${REPO}${file}`)}: ${primitive}`,
      );
    });
    expect(offenders).toEqual([]);
  });
  it("include the worker, so the scan would see one", () => {
    const worker = Deno.readTextFileSync(`${REPO}cli/rest-worker.ts`);
    expect(worker).toContain("fetch(");
    expect(worker).toContain("new Worker");
  });
});
