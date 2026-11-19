/**
 * Discovers HC testdocs from executable source/expectation pairs and runs
 * each with a fresh HC evaluation session. No maintained testdoc file list.
 *
 * A testdoc has the HC shebang and at least one adjacent
 * `; source` / `# expected` pair. Historical HC source files without
 * executable expectations are not treated as testdocs.
 *
 * @module
 */
import { visibleEnvironment } from "../lib/execute/env-visibility.ts";
import { getEval, getOptions, main } from "./hc.ts";

export const HC_DOC_DIR: URL = new URL("../hc/", import.meta.url);

/** Whether an HC source file contains executable HCTest expectations. */
export function isTestdoc(source: string): boolean {
  const lines = source.split(/\r?\n/);
  if (!/^#!\/usr\/bin\/env hc(?:\s|$)/.test(lines[0] ?? "")) {
    return false;
  }
  return lines.some((line, i) =>
    line.startsWith("; ") && (lines[i + 1] ?? "").startsWith("# ")
  );
}

/** Discover assertion-bearing HC documents in stable filename order. */
export async function discoverTestdocs(directory: URL = HC_DOC_DIR): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    if (!entry.isFile || !entry.name.endsWith(".hc")) continue;
    const source = await Deno.readTextFile(new URL(entry.name, directory));
    if (isTestdoc(source)) files.push(entry.name);
  }
  return files.sort();
}

/** Execute every discovered testdoc independently; any failure fails the suite. */
export async function runTestdocs(directory: URL = HC_DOC_DIR): Promise<number> {
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
        getOptions(["--testdoc", new URL(file, directory).pathname]),
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
  Deno.exitCode = await runTestdocs();
}
