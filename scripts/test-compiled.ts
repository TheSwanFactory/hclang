/**
 * Smoke-tests the compiled CLI that `deno task build:cli` writes to `scripts/hc`.
 *
 * The binary runs from an empty temporary working directory, so the Figures
 * module can only come from the program itself, and its only input is
 * the `--evaluate` argument, so it can never wait on a REPL prompt.
 *
 * Usage: `deno task test:compiled` (builds the binary first)
 *
 * @module
 */
const BINARY = new URL(
  Deno.build.os === "windows" ? "./hc.exe" : "./hc",
  import.meta.url,
);
const SOURCE =
  "Figures <- './hc/figures.hc'; (Figures.size Figures.B) = (Figures.Figure [Figures.B])";
const EXPECTED = "((<>); <>)";

const workDirectory = await Deno.makeTempDir({ prefix: "hclang-compiled-" });
try {
  const output = await new Deno.Command(BINARY, {
    args: ["--evaluate", SOURCE],
    cwd: workDirectory,
    env: { ...Deno.env.toObject(), NO_COLOR: "1" },
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).output();
  const decoder = new TextDecoder();
  const stdout = decoder.decode(output.stdout).trim();
  const stderr = decoder.decode(output.stderr).trim();
  if (!output.success || stdout !== EXPECTED || stderr !== "") {
    throw new Error(
      `compiled CLI did not import the bundled Figures module (exit ${output.code})\nstdout: ${stdout}\nstderr: ${stderr}`,
    );
  }
  console.log(`Verified compiled CLI ${BINARY.pathname}: ${stdout}`);
} finally {
  await Deno.remove(workDirectory, { recursive: true });
}
