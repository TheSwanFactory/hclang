/**
 * Discovers HC testdocs by executable source/expectation pairs and executes
 * each in an independent evaluator. No maintained testdoc filename list.
 *
 * A testdoc needs the HC shebang and an adjacent `; source` / `# expected`
 * pair. A new document with executable expectations but without the shebang
 * fails discovery rather than being silently omitted.
 *
 * @module
 */
import { fileURLToPath } from "node:url";
import { visibleEnvironment } from "../lib/execute/env-visibility.ts";
import { getEval, getOptions, main } from "./hc.ts";

export const HC_DOC_DIR: URL = new URL("../hc/", import.meta.url);

// Existing legacy examples without the executable HC testdoc shebang:
// CQML is aspirational; white-paper-core is exercised by cli/hc.test.ts.
const LEGACY_EXAMPLES = new Set(["cqml.hc", "white-paper-core.hc"]);

/** Whether this source contains an adjacent HC source/expected pair. */
export function hasExpectations(source: string): boolean {
  const lines = source.split(/\r?\n/);
  return lines.some((line, i) =>
    line.startsWith("; ") && (lines[i + 1] ?? "").startsWith("# ")
  );
}

/** Whether an HC source opts into the executable testdoc convention. */
export function isTestdoc(source: string): boolean {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  return /^#!\/usr\/bin\/env hc(?:\s|$)/.test(firstLine) &&
    hasExpectations(source);
}

/** Discover assertion-bearing HC documents in stable filename order. */
export async function discoverTestdocs(
  directory: URL = HC_DOC_DIR,
): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    if (!entry.isFile || !entry.name.endsWith(".hc")) continue;
    const source = await Deno.readTextFile(new URL(entry.name, directory));
    if (isTestdoc(source)) {
      files.push(entry.name);
    } else if (hasExpectations(source) && !LEGACY_EXAMPLES.has(entry.name)) {
      throw new Error(
        `HC assertions in ${entry.name} are not registered: add the ` +
          "`#!/usr/bin/env hc` shebang to enable the testdoc.",
      );
    }
  }
  return files.sort();
}

/** Execute every discovered testdoc independently; any failure fails the suite. */
export async function runTestdocs(
  directory: URL = HC_DOC_DIR,
): Promise<number> {
  const files = await discoverTestdocs(directory);
  if (files.length === 0) {
    console.error("No executable HC testdocs found");
    return 1;
  }

  let failed = 0;
  for (const file of files) {
    console.log(`\nHC testdoc: ${file}`);
    try {
      const environment = visibleEnvironment((name) => Deno.env.get(name));
      const status = await main(
        getEval(environment),
        getOptions(["--testdoc", fileURLToPath(new URL(file, directory))]),
      );
      if (status !== 0) {
        failed++;
        console.error(`HC testdoc failed: ${file}`);
      }
    } catch (error) {
      failed++;
      console.error(`HC testdoc threw: ${file}`, error);
    }
  }

  console.log(`HC testdocs: ${files.length} executed; ${failed} failed`);
  return failed === 0 ? 0 : 1;
}

if (import.meta.main) {
  Deno.exit(await runTestdocs());
}
