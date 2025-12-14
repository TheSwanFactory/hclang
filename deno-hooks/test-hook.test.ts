/**
 * Tests for deno-hooks
 */

import { expect } from "@std/expect";
import { loadConfig } from "./config.ts";
import { filterFiles, getStagedFiles } from "./files.ts";

Deno.test("loadConfig - parses YAML configuration", async () => {
  // Use parent directory where deno-hooks.yml is located
  const rootDir = new URL("..", import.meta.url).pathname;
  const config = await loadConfig(rootDir);
  expect(config).toBeDefined();
  expect(config.hooks).toBeDefined();
  expect(config.hooks["pre-commit"]).toBeDefined();
});

Deno.test("filterFiles - matches glob patterns", () => {
  const files = [
    "foo.ts",
    "bar.js",
    "baz.json",
    "test.md",
  ];

  const tsFiles = filterFiles(files, "*.ts");
  expect(tsFiles).toEqual(["foo.ts"]);

  const codeFiles = filterFiles(files, "*.{ts,js}");
  expect(codeFiles.sort()).toEqual(["bar.js", "foo.ts"]);
});

Deno.test("getStagedFiles - returns array", async () => {
  const files = await getStagedFiles();
  expect(Array.isArray(files)).toBe(true);
});
