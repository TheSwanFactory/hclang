import { dirname, fromFileUrl, join, toFileUrl } from "jsr:@std/path@1.1.6";

const rootDir = dirname(dirname(fromFileUrl(import.meta.url)));
const webDir = join(rootDir, "web");
const distDir = join(webDir, "dist");
const templatePath = join(webDir, "index.html");
const entryMarker = "<!-- HCWEB_BUNDLE -->";

const jsrFlag = Deno.args.indexOf("--jsr-version");
const releaseVersion = jsrFlag >= 0 ? Deno.args[jsrFlag + 1] : undefined;
if (jsrFlag >= 0 && !releaseVersion) {
  throw new Error("--jsr-version requires an exact version");
}
if (releaseVersion && !/^\d+\.\d+\.\d+$/.test(releaseVersion)) {
  throw new Error(`Invalid JSR version: ${releaseVersion}`);
}

async function readManifestVersion(path: string): Promise<string> {
  const manifest = JSON.parse(await Deno.readTextFile(path));
  if (typeof manifest.version !== "string") {
    throw new Error(`Missing version in ${path}`);
  }
  return manifest.version;
}

async function command(
  executable: string,
  args: string[],
  options: { reject?: boolean } = {},
): Promise<Deno.CommandOutput> {
  const output = await new Deno.Command(executable, {
    args,
    cwd: rootDir,
    stdout: "piped",
    stderr: "piped",
  }).output();
  if ((options.reject ?? true) && !output.success) {
    const detail = new TextDecoder().decode(output.stderr).trim();
    throw new Error(`${executable} ${args.join(" ")} failed: ${detail}`);
  }
  return output;
}

/** Reads git metadata, tolerating hosts that build without a git checkout. */
async function gitText(args: string[]): Promise<string | undefined> {
  const output = await command("git", args, { reject: false }).catch(() =>
    undefined
  );
  if (!output?.success) return undefined;
  return new TextDecoder().decode(output.stdout).trim();
}

function replaceRequired(
  source: string,
  token: string,
  value: string,
): string {
  if (!source.includes(token)) {
    throw new Error(`Missing template token ${token}`);
  }
  return source.replaceAll(token, () => value);
}

async function verifyVersions(): Promise<string> {
  const versions = await Promise.all([
    readManifestVersion(join(rootDir, "deno.json")),
    readManifestVersion(join(rootDir, "lib/deno.json")),
    readManifestVersion(join(rootDir, "web/deno.json")),
  ]);
  const versionSource = await Deno.readTextFile(
    join(rootDir, "lib/version.ts"),
  );
  const sourceVersion = versionSource.match(/VERSION = "([^"]+)"/)?.[1];
  const expected = releaseVersion ?? versions[0];

  for (const version of [...versions, sourceVersion]) {
    if (version !== expected) {
      throw new Error(
        `Version mismatch: expected ${expected}, found ${String(version)}`,
      );
    }
  }
  return expected;
}

const RELEASE_PACKAGES = ["@swanfactory/hcweb", "@swanfactory/hclang"];
const RELEASE_ATTEMPTS = 6;
const RELEASE_RETRY_MS = 10_000;

const escapePattern = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/**
 * Names the first release package the graph does not pin to `version`.
 *
 * Published packages declare each other by range, so a graph that resolves an
 * older patch is evidence of registry propagation rather than of a bad graph.
 * The version must end where it is written, so `0.9.30` does not satisfy a
 * `0.9.3` release.
 */
export function missingPackagePin(
  graph: string,
  version: string,
): string | undefined {
  for (const name of RELEASE_PACKAGES) {
    const pinned = new RegExp(
      `${escapePattern(name)}[@/]${escapePattern(version)}(?![\\w.-])`,
    );
    if (!pinned.test(graph)) {
      return `${name}@${version}`;
    }
  }
  return undefined;
}

/**
 * Resolves the published graph, tolerating bounded registry propagation.
 *
 * Publishing and building are one release step apart, so `deno info` can
 * succeed while JSR still advertises the previous version. An unresolvable
 * graph and a graph pinned to an older version are therefore the same
 * recoverable condition, and each retry discards the lock and the cached
 * version index so a stale answer cannot simply be re-resolved. Workspace
 * source is never substituted, and a leaked workspace path fails immediately
 * because no amount of waiting can fix it.
 */
async function releaseGraph(
  entryPath: string,
  lockPath: string,
  version: string,
): Promise<string> {
  const rootUrl = toFileUrl(`${rootDir}/`).href;
  let failure = `unable to resolve hcweb ${version} from JSR`;

  for (let attempt = 1; attempt <= RELEASE_ATTEMPTS; attempt += 1) {
    // A lock written from a stale index would pin the older version again.
    await Deno.remove(lockPath).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
    const args = ["info", "--json", "--no-config", "--lock", lockPath];
    if (attempt > 1) {
      const specifiers = RELEASE_PACKAGES.map((name) => `jsr:${name}`);
      args.push(`--reload=${specifiers.join(",")}`);
    }
    args.push(entryPath);

    const output = await command(Deno.execPath(), args, { reject: false });
    if (!output.success) {
      const detail = new TextDecoder().decode(output.stderr).trim();
      failure = `unable to resolve hcweb ${version} from JSR: ${detail}`;
    } else {
      const graph = new TextDecoder().decode(output.stdout);
      if (graph.includes(rootUrl)) {
        throw new Error("Release graph resolved repository workspace source");
      }
      const missing = missingPackagePin(graph, version);
      if (missing === undefined) {
        return graph;
      }
      failure = `release graph is missing exact dependency ${missing}`;
    }

    if (attempt < RELEASE_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, RELEASE_RETRY_MS));
    }
  }

  throw new Error(`${failure} after ${RELEASE_ATTEMPTS} attempts`);
}

async function build(): Promise<void> {
  const version = await verifyVersions();
  const commit = await gitText(["rev-parse", "HEAD"]) ??
    Deno.env.get("GITHUB_SHA") ?? "unknown";
  // Commit time keeps release builds byte-reproducible. Hosted mirrors that
  // build without a git checkout fall back to the current time.
  const commitEpoch = Number(
    await gitText(["show", "-s", "--format=%ct", "HEAD"]),
  );
  const buildDate = Number.isFinite(commitEpoch)
    ? new Date(commitEpoch * 1000).toISOString()
    : new Date().toISOString();
  const temporaryDir = await Deno.makeTempDir({ prefix: "hcweb-build-" });

  try {
    const entryPath = join(temporaryDir, "entry.ts");
    const bundlePath = join(temporaryDir, "bundle.js");
    const temporaryLock = join(temporaryDir, "deno.lock");
    const importSpecifier = releaseVersion
      ? `jsr:@swanfactory/hcweb@${version}/mount`
      : toFileUrl(join(webDir, "mount.ts")).href;
    const entry = [
      `import { mountHcweb } from ${JSON.stringify(importSpecifier)};`,
      'const root = document.getElementById("hcweb-root");',
      'if (!(root instanceof HTMLElement)) throw new Error("Missing hcweb root");',
      "mountHcweb(root);",
      "",
    ].join("\n");
    await Deno.writeTextFile(entryPath, entry);

    if (releaseVersion) {
      await releaseGraph(entryPath, temporaryLock, version);
    }

    const bundleArgs = ["bundle"];
    if (releaseVersion) {
      bundleArgs.push("--no-config", "--lock", temporaryLock);
    } else {
      bundleArgs.push(
        "--config",
        join(webDir, "deno.json"),
        "--lock",
        join(rootDir, "deno.lock"),
        "--frozen",
      );
    }
    bundleArgs.push(
      "--platform=browser",
      "--format=iife",
      "--minify",
      entryPath,
      "--output",
      bundlePath,
    );
    await command(Deno.execPath(), bundleArgs);

    const template = await Deno.readTextFile(templatePath);
    if (template.split(entryMarker).length !== 2) {
      throw new Error("Template must contain exactly one hcweb entry marker");
    }
    const bundle = (await Deno.readTextFile(bundlePath)).replaceAll(
      /<\/script/gi,
      "<\\/script",
    );
    // Function replacers avoid `$$`/`$&` expansion in bundled source.
    let html = template.replace(
      entryMarker,
      () => `<script data-hcweb-bundle>\n${bundle}\n</script>`,
    );

    const packageSource = releaseVersion
      ? `jsr:@swanfactory/hcweb@${version}`
      : "workspace";
    html = replaceRequired(html, "__HCWEB_VERSION__", version);
    html = replaceRequired(html, "__HCLANG_VERSION__", version);
    html = replaceRequired(html, "__SOURCE_COMMIT__", commit);
    html = replaceRequired(html, "__BUILD_DATE__", buildDate);
    html = replaceRequired(html, "__PACKAGE_SOURCE__", packageSource);

    await Deno.remove(distDir, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
    await Deno.mkdir(distDir, { recursive: true });
    const outputPath = join(distDir, "hcweb.html");
    const bytes = new TextEncoder().encode(html);
    for (const name of ["hcweb.html", "index.html"]) {
      // `index.html` is the same bytes, so a static host can serve `/`.
      const target = join(distDir, name);
      await Deno.writeFile(`${target}.pending`, bytes);
      await Deno.rename(`${target}.pending`, target);
    }

    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const checksum = Array.from(
      digest,
      (byte) => byte.toString(16).padStart(2, "0"),
    )
      .join("");
    await Deno.writeTextFile(
      join(distDir, "hcweb.html.sha256"),
      `${checksum}  hcweb.html\n`,
    );
    console.log(
      `Built ${outputPath} from ${packageSource} (${bytes.length} bytes)`,
    );
  } finally {
    await Deno.remove(temporaryDir, { recursive: true });
  }
}

if (import.meta.main) {
  await build();
}
