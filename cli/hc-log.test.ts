import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

/**
 * Runs `hc --evaluate=<source>` in a child process under the `hc` task's flags.
 * The child inherits `DENO_COVERAGE_DIR`, so a coverage run counts it.
 */
const evaluate = async (
  source: string,
  env: Record<string, string> = {},
): Promise<{ code: number; stdout: string; stderr: string }> => {
  const { code, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--deny-run",
      "--deny-ffi",
      "hc.ts",
      `--evaluate=${source}`,
    ],
    cwd: new URL(".", import.meta.url),
    env: { NO_COLOR: "1", ...env },
    stdin: "null",
  }).output();
  const decoder = new TextDecoder();
  return {
    code,
    stdout: decoder.decode(stdout),
    stderr: decoder.decode(stderr),
  };
};

describe("HCLog", () => {
  it("prints a result that is not a `$` outcome as it is", async () => {
    expect(await evaluate("1 + 2")).toEqual({
      code: 0,
      stdout: "3\n",
      stderr: "",
    });
  });

  it("also logs each frame it is handed when DEBUG is bound", async () => {
    const { code, stdout, stderr } = await evaluate("1 + 2", { DEBUG: "1" });
    expect({ code, stderr }).toEqual({ code: 0, stderr: "" });
    const lines = stdout.trimEnd().split("\n");
    expect(lines[0]).toMatch(/^\$:FrameCount\.\d+ FrameCount \{$/);
    expect(lines.at(-1)).toEqual("3");
  });
});
