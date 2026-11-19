import { expect } from "@std/expect";
import { discoverTestdocs, isTestdoc } from "./test-docs.ts";

Deno.test("testdoc discovery requires a shebang and executable expectations", () => {
  expect(isTestdoc("#!/usr/bin/env hc\n; 1\n# 1\n")).toBe(true);
  expect(isTestdoc("#!/usr/bin/env hc #\n; 2\n# 2\n")).toBe(true);
  expect(isTestdoc("#!/usr/bin/env hc\n; 1\n")).toBe(false);
  expect(isTestdoc("#!/usr/bin/env hc\n# expected without source\n")).toBe(false);
  expect(isTestdoc("; 1\n# 1\n")).toBe(false);
  expect(isTestdoc(".hc 0.6.0\n; 1\n# 1\n")).toBe(false);
});

Deno.test("discovers testdocs automatically, sorted, without a filename list", async () => {
  const dir = await Deno.makeTempDir();
  const directory = new URL(`file://${dir}/`);
  try {
    await Deno.writeTextFile(new URL("z-new.hc", directory), "#!/usr/bin/env hc\n; 1\n# 1\n");
    await Deno.writeTextFile(new URL("a-other.hc", directory), "#!/usr/bin/env hc\n; 2\n# 2\n");
    await Deno.writeTextFile(new URL("module.hc", directory), ".hc 0.6.0\n");
    await Deno.writeTextFile(new URL("notes.md", directory), "# text\n");
    expect(await discoverTestdocs(directory)).toEqual(["a-other.hc", "z-new.hc"]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
