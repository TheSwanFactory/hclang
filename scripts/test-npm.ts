const ROOT_MANIFEST = "deno.json";
const PACKAGE_DIR = "dist/npm";
const ARTIFACT_DIR = "dist";
const decoder = new TextDecoder();
const encoder = new TextEncoder();

interface CommandResult {
  stdout: string;
  stderr: string;
}

const run = async (
  command: string,
  args: string[],
  options: { cwd?: string; input?: string } = {},
): Promise<CommandResult> => {
  const child = new Deno.Command(command, {
    args,
    cwd: options.cwd,
    env: { ...Deno.env.toObject(), NO_COLOR: "1" },
    stdin: options.input === undefined ? "null" : "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  if (options.input !== undefined) {
    const writer = child.stdin.getWriter();
    await writer.write(encoder.encode(options.input));
    await writer.close();
  }

  const output = await child.output();
  const result = {
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
  if (!output.success) {
    throw new Error(
      `${command} ${
        args.join(" ")
      } failed (${output.code})\n${result.stdout}${result.stderr}`,
    );
  }
  return result;
};

const rootManifest = JSON.parse(await Deno.readTextFile(ROOT_MANIFEST));
const packageManifest = JSON.parse(
  await Deno.readTextFile(`${PACKAGE_DIR}/package.json`),
);
if (packageManifest.name !== "hclang") {
  throw new Error(`unexpected npm package name: ${packageManifest.name}`);
}
if (packageManifest.version !== rootManifest.version) {
  throw new Error(
    `npm version ${packageManifest.version} does not match root version ${rootManifest.version}`,
  );
}
if (typeof packageManifest.bin?.hc !== "string") {
  throw new Error("generated npm package does not expose the hc binary");
}

const expectedFilename = `hclang-${rootManifest.version}.tgz`;
const archive = `${ARTIFACT_DIR}/${expectedFilename}`;
for await (const entry of Deno.readDir(ARTIFACT_DIR)) {
  if (entry.isFile && /^hclang-\d+\.\d+\.\d+\.tgz$/.test(entry.name)) {
    await Deno.remove(`${ARTIFACT_DIR}/${entry.name}`);
  }
}

const packed = await run(
  "npm",
  ["pack", "--json", "--pack-destination", ".."],
  { cwd: PACKAGE_DIR },
);
const [{ filename, files }] = JSON.parse(packed.stdout);
if (filename !== expectedFilename) {
  throw new Error(`unexpected npm archive name: ${filename}`);
}

// The npm CLI reads its standard modules beside `esm/cli`, so the package has to
// carry the maintained bytes themselves, and the archive has to ship them.
const maintainedFigures = await Deno.readFile("lib/modules/figures.hc");
const packagedFigures = await Deno.readFile(
  `${PACKAGE_DIR}/esm/lib/modules/figures.hc`,
);
if (
  maintainedFigures.length !== packagedFigures.length ||
  !maintainedFigures.every((byte, index) => byte === packagedFigures[index])
) {
  throw new Error(
    "npm package does not carry the maintained lib/modules/figures.hc bytes",
  );
}
if (
  !files.some((file: { path: string }) =>
    file.path === "esm/lib/modules/figures.hc"
  )
) {
  throw new Error("npm archive does not include esm/lib/modules/figures.hc");
}

const npx = async (args: string[], input?: string): Promise<CommandResult> =>
  await run("npx", ["--yes", `./${archive}`, ...args], { input });

const repl = await npx([], "-1\n");
if (!repl.stdout.includes(`.hc ${rootManifest.version};`)) {
  throw new Error(`npm REPL reported the wrong version\n${repl.stdout}`);
}
if (!repl.stdout.includes("; # -1")) {
  throw new Error(`npm REPL did not evaluate unary minus\n${repl.stdout}`);
}

const workDirectory = await Deno.makeTempDir({ prefix: "hclang-npm-" });
try {
  const sourceFile = `${workDirectory}/unary-minus.hc`;
  await Deno.writeTextFile(sourceFile, "-1\n");
  const file = await npx([sourceFile]);
  if (file.stdout.trim() !== "-1") {
    throw new Error(
      `npm file runner returned unexpected output\n${file.stdout}`,
    );
  }
} finally {
  await Deno.remove(workDirectory, { recursive: true });
}

const numerics = await npx(["cli/hc/numerics.hc", "--testdoc"]);
const expected = '“{"total":43,"pass":43,"fail":0,"unimplemented":0}”';
if (!numerics.stdout.includes(expected)) {
  throw new Error(
    `npm testdoc did not report the numeric baseline\n${numerics.stdout}`,
  );
}

// Match the summary line, because every pass line carries a running total.
const modules = await npx(["cli/hc/modules.hc", "--testdoc"]);
const modulesSummary = modules.stdout.split("\n").find((line) =>
  line.includes("$=.test-summary")
);
const modulesExpected = '“{"total":18,"pass":18,"fail":0,"unimplemented":0}”';
if (!modulesSummary?.includes(modulesExpected)) {
  throw new Error(
    `npm testdoc did not import the Figures standard module\n${modules.stdout}`,
  );
}

console.log(
  `Verified ${packageManifest.name}@${packageManifest.version} via npx (${archive})`,
);
