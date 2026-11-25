import { expect } from "@std/expect";
import { join, toFileUrl } from "@std/path";
import {
  discoverTestdocs,
  hasExpectations,
  isTestdoc,
  runTestdocs,
} from "./test-docs.ts";

function directoryUrl(path: string): URL {
  return new URL(".", toFileUrl(join(path, "marker.hc")));
}

Deno.test("testdoc recognition requires shebang and executable expectations", () => {
  expect(isTestdoc("#!/usr/bin/env hc\n; 1\n# 1\n")).toBe(true);
  expect(isTestdoc("#!/usr/bin/env hc #\n; 2\n# 2\n")).toBe(true);
  expect(isTestdoc("#!/usr/bin/env hc\n; 1\n")).toBe(false);
  expect(isTestdoc("#!/usr/bin/env hc\n# expected without source\n")).toBe(
    false,
  );
  expect(isTestdoc("; 1\n# 1\n")).toBe(false);
  expect(isTestdoc(".hc 0.6.0\n; 1\n# 1\n")).toBe(false);
  expect(hasExpectations("; 1\n# 1\n")).toBe(true);
});

Deno.test("discovers testdocs automatically, sorted, without a filename list", async () => {
  const dir = await Deno.makeTempDir();
  const directory = directoryUrl(dir);
  try {
    await Deno.writeTextFile(
      new URL("z-new.hc", directory),
      "#!/usr/bin/env hc\n; 1\n# 1\n",
    );
    await Deno.writeTextFile(
      new URL("a-other.hc", directory),
      "#!/usr/bin/env hc\n; 2\n# 2\n",
    );
    await Deno.writeTextFile(new URL("module.hc", directory), ".hc 0.6.0\n");
    await Deno.writeTextFile(new URL("notes.md", directory), "# text\n");
    expect(await discoverTestdocs(directory)).toEqual([
      "a-other.hc",
      "z-new.hc",
    ]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("rejects silently skipped assertions, but exempts known legacy examples", async () => {
  const dir = await Deno.makeTempDir();
  const directory = directoryUrl(dir);
  try {
    await Deno.writeTextFile(
      new URL("white-paper-core.hc", directory),
      "; 1\n# 1\n",
    );
    await Deno.writeTextFile(
      new URL("cqml.hc", directory),
      ".hc 0.6.0\n; 1\n# 1\n",
    );
    expect(await discoverTestdocs(directory)).toEqual([]);
    await Deno.writeTextFile(
      new URL("forgot-shebang.hc", directory),
      "; 1\n# 1\n",
    );
    let error = "";
    try {
      await discoverTestdocs(directory);
    } catch (caught) {
      error = String(caught);
    }
    expect(error).toContain("forgot-shebang.hc");
    expect(error).toContain("shebang");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("runs testdocs from paths with spaces and reports failures", async () => {
  const dir = await Deno.makeTempDir({ prefix: "hc testdocs with spaces " });
  const directory = directoryUrl(dir);
  try {
    expect(await runTestdocs(directory)).toBe(1);
    const file = new URL("fresh.hc", directory);
    await Deno.writeTextFile(file, "#!/usr/bin/env hc\n; 1\n# 1\n");
    expect(await runTestdocs(directory)).toBe(0);
    await Deno.writeTextFile(file, "#!/usr/bin/env hc\n; 1\n# 2\n");
    expect(await runTestdocs(directory)).toBe(1);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("a source line at the end of a file has no expectation", () => {
  expect(hasExpectations("; 1")).toBe(false);
  expect(isTestdoc("#!/usr/bin/env hc\n# 1\n; 1")).toBe(false);
});

Deno.test("counts a testdoc whose run throws as failed and runs the rest", async () => {
  const dir = await Deno.makeTempDir();
  const directory = directoryUrl(dir);
  const open = Deno.open;
  const originalError = console.error;
  const originalLog = console.log;
  const diagnostics: string[] = [];
  const logs: string[] = [];
  try {
    await Deno.writeTextFile(
      new URL("a-throws.hc", directory),
      "#!/usr/bin/env hc\n; 1\n# 1\n",
    );
    await Deno.writeTextFile(
      new URL("b-passes.hc", directory),
      "#!/usr/bin/env hc\n; 2\n# 2\n",
    );
    // The file is discovered, then cannot be opened for its run.
    Deno.open = ((path: string | URL, options?: Deno.OpenOptions) =>
      String(path).endsWith("a-throws.hc")
        ? Promise.reject(new Error("vanished"))
        : open(path, options)) as typeof Deno.open;
    console.error = (...args: unknown[]) =>
      diagnostics.push(args.join(" "));
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    expect(await runTestdocs(directory)).toBe(1);
    expect(diagnostics).toEqual([
      "HC testdoc threw: a-throws.hc Error: vanished",
    ]);
    expect(logs.at(-1)).toEqual("HC testdocs: 2 executed; 1 failed");
  } finally {
    Deno.open = open;
    console.error = originalError;
    console.log = originalLog;
    await Deno.remove(dir, { recursive: true });
  }
});
