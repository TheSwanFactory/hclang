/**
 * Bump the workspace version, then stage and commit the result.
 *
 * The whole sequence lives here rather than in a `&&` chain inside the task,
 * because `deno task` appends its extra arguments to the end of the command it
 * runs. In a chain those arguments reach the last command, so
 * `deno task bump --minor` used to hand `--minor` to `git commit` and bump the
 * patch in silence. One command means the flag can only arrive here.
 *
 * @module
 */

/** Every file that carries the workspace version. */
const VERSIONED_MANIFESTS = [
  "deno.json",
  "lib/deno.json",
  "cli/deno.json",
  "maml/deno.json",
  "web/deno.json",
] as const;

const VERSION_MODULE = "lib/version.ts";
const VERSION_PATTERN = /VERSION = "(\d+\.\d+\.\d+)"/;
const USAGE = "Usage: deno task bump [--minor]";

/** The next version, bumping the minor and resetting the patch when asked. */
export const nextVersion = (current: string, minor: boolean): string => {
  const parts = current.split(".").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    throw new Error(`Unrecognized version: ${current}`);
  }
  const [major, currentMinor, patch] = parts;
  return minor
    ? `${major}.${currentMinor + 1}.0`
    : `${major}.${currentMinor}.${patch + 1}`;
};

/** Rejects anything but the one supported flag, so no argument is ignored. */
export const wantsMinor = (args: readonly string[]): boolean => {
  const unsupported = args.filter((arg) => arg !== "--minor");
  if (unsupported.length > 0) {
    throw new Error(`Unsupported argument: ${unsupported.join(" ")}\n${USAGE}`);
  }
  return args.includes("--minor");
};

const run = async (command: string, ...args: string[]): Promise<void> => {
  const child = new Deno.Command(command, {
    args,
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  const { code } = await child.status;
  if (code !== 0) {
    throw new Error(`${[command, ...args].join(" ")} exited with ${code}`);
  }
};

const main = async (): Promise<void> => {
  const minor = wantsMinor(Deno.args);

  const versionModule = await Deno.readTextFile(VERSION_MODULE);
  const current = versionModule.match(VERSION_PATTERN)?.[1];
  if (!current) {
    throw new Error(`Current version not found in ${VERSION_MODULE}`);
  }
  const version = nextVersion(current, minor);

  for (const path of VERSIONED_MANIFESTS) {
    const manifest = JSON.parse(await Deno.readTextFile(path));
    manifest.version = version;
    await Deno.writeTextFile(path, JSON.stringify(manifest, null, 2) + "\n");
  }
  await Deno.writeTextFile(
    VERSION_MODULE,
    `export const VERSION = "${version}";\n`,
  );
  console.log(`Bumped version to ${version}`);

  // Every manifest and the version module are already rewritten by this point,
  // so a failure here leaves the tree bumped, uncommitted, and holding a stale
  // lockfile. `Deno.execPath()` is the interpreter already running this script,
  // which an absolute-path install or a pinned CI toolchain need not put on PATH.
  await run(Deno.execPath(), "install");
  await run("git", "add", "deno.lock", VERSION_MODULE, ...VERSIONED_MANIFESTS);
  await run("git", "commit", "-m", `Bump version to ${version}`);
};

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}
