/**
 * Smoke-tests the compiled CLI that `deno task build:cli` writes to `scripts/hc`.
 *
 * The binary runs from an empty temporary working directory, so the Figures
 * module can only come from the program itself, and its only input is
 * each `--evaluate` argument, so it can never wait on a REPL prompt.
 *
 * Usage: `deno task test:compiled` (builds the binary first)
 *
 * @module
 */
const BINARY = new URL(
  Deno.build.os === "windows" ? "./hc.exe" : "./hc",
  import.meta.url,
);
/** Each `--evaluate` source and the exact text the binary must print. */
const CASES: readonly { source: string; expected: string; what: string }[] = [
  {
    what: "import the bundled Figures module",
    source: "Figures <- './hc/figures.hc'; ([] * []) = []",
    expected: "((<>); <>)",
  },
  {
    // The six geometric observers of a Count-bound Denum (007.41b), reached
    // through `.####` with no import.
    what: "answer the geometric observers",
    source: `[${
      ["##%", "###%", "##%%", "###%%", "##%%%", "###%%%"]
        .map((key) => `([5, 3, 7, 1].####).${key}`).join(", ")
    }]`,
    expected:
      "[128, [8, 0, -4, -4], 128, [0, 6.531972647421807, 7.542472332656507, 16/3], 160, [12, 4]]",
  },
];
const workDirectory = await Deno.makeTempDir({ prefix: "hclang-compiled-" });
try {
  for (const { source, expected, what } of CASES) {
    const output = await new Deno.Command(BINARY, {
      args: ["--evaluate", source],
      cwd: workDirectory,
      env: { ...Deno.env.toObject(), NO_COLOR: "1" },
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    }).output();
    const decoder = new TextDecoder();
    const stdout = decoder.decode(output.stdout).trim();
    const stderr = decoder.decode(output.stderr).trim();
    if (!output.success || stdout !== expected || stderr !== "") {
      throw new Error(
        `compiled CLI did not ${what} (exit ${output.code})\nstdout: ${stdout}\nstderr: ${stderr}`,
      );
    }
    console.log(`Verified compiled CLI ${BINARY.pathname}: ${stdout}`);
  }
} finally {
  await Deno.remove(workDirectory, { recursive: true });
}
