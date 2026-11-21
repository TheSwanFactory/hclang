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
// The barrel import comes first so the frame classes finish initializing.
import "../lib/mod.ts";

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
    // FOIST 19a replaces the six geometric hash suffixes with raw
    // Denumeration and lazily observed KD coordinates in every distribution.
    what: "evaluate FOIST 19a KD observers and Denum multiplication",
    source:
      "[[3, 1].####, [3, 1, 5].####, ([0, 1].### &|& [0, 1].###).####]",
    expected: "[[2], [-2, 1], [1]]",
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
