/**
 * Builds the compiled CLI with `deno task build:cli`, which writes `scripts/hc`,
 * then checks what it embeds and smoke-tests it.
 *
 * The build must not embed any `node_modules` directory (#517): the CLI imports
 * no npm package, and the workspace `node_modules/` alone adds about 100 MB.
 * The check reads the "Embedded Files" listing that `deno compile` prints, so
 * it does not depend on the size of the Deno runtime on each platform.
 *
 * The binary runs from an empty temporary working directory, so the Figures
 * module can only come from the program itself, and its only input is
 * each `--evaluate` argument, so it can never wait on a REPL prompt.
 *
 * Usage: `deno task test:compiled`
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
    source: "[[3, 1].####, [3, 1, 5].####, ([0, 1].### &|& [0, 1].###).####]",
    expected: "[[2], [-2, 1], [1]]",
  },
];
const decoder = new TextDecoder();
const build = await new Deno.Command(Deno.execPath(), {
  args: ["task", "build:cli"],
  cwd: new URL("..", import.meta.url),
  env: { ...Deno.env.toObject(), NO_COLOR: "1" },
  stdin: "null",
  stdout: "piped",
  stderr: "piped",
}).output();
const buildLog = decoder.decode(build.stdout) + decoder.decode(build.stderr);
console.log(buildLog.trimEnd());
if (!build.success) {
  throw new Error(`deno task build:cli failed (exit ${build.code})`);
}
const lines = buildLog.split("\n");
const start = lines.findIndex((line) => line.trim() === "Embedded Files");
const end = lines.findIndex((line, i) =>
  i > start && line.startsWith("Files:")
);
if (start < 0 || end < 0) {
  throw new Error(
    "deno compile printed no Embedded Files listing, so the node_modules check cannot run",
  );
}
const embeddedNodeModules = lines.slice(start, end).filter((line) =>
  line.includes("node_modules")
);
if (embeddedNodeModules.length > 0) {
  throw new Error(
    `compiled CLI embeds node_modules (#517):\n${
      embeddedNodeModules.join("\n")
    }`,
  );
}
console.log(`Verified compiled CLI embeds no node_modules (${lines[end]})`);

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
