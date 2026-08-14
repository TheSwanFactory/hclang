import { dirname, fromFileUrl, join, toFileUrl } from "jsr:@std/path@1.1.6";

const rootDir = dirname(dirname(fromFileUrl(import.meta.url)));
const webDir = join(rootDir, "web");
const distDir = join(rootDir, "dist");
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

async function gitText(args: string[]): Promise<string> {
  const output = await command("git", args);
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

async function releaseGraph(
  entryPath: string,
  lockPath: string,
  version: string,
): Promise<string> {
  const args = [
    "info",
    "--json",
    "--no-config",
    "--lock",
    lockPath,
    entryPath,
  ];
  let output: Deno.CommandOutput | undefined;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    output = await command(Deno.execPath(), args, { reject: false });
    if (output.success) break;
    if (attempt < 6) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  if (!output?.success) {
    const detail = new TextDecoder().decode(output?.stderr).trim();
    throw new Error(`Unable to resolve hcweb ${version} from JSR: ${detail}`);
  }

  const graph = new TextDecoder().decode(output.stdout);
  const rootUrl = toFileUrl(`${rootDir}/`).href;
  if (graph.includes(rootUrl)) {
    throw new Error("Release graph resolved repository workspace source");
  }
  const packagePatterns = [
    [
      `@swanfactory/hcweb@${version}`,
      `@swanfactory/hcweb/${version}`,
    ],
    [
      `@swanfactory/hclang@${version}`,
      `@swanfactory/hclang/${version}`,
    ],
  ];
  for (const alternatives of packagePatterns) {
    if (!alternatives.some((pattern) => graph.includes(pattern))) {
      throw new Error(
        `Release graph is missing exact dependency ${alternatives[0]}`,
      );
    }
  }
  return graph;
}

async function build(): Promise<void> {
  const version = await verifyVersions();
  const commit = await gitText(["rev-parse", "HEAD"]);
  const commitEpoch = Number(
    await gitText(["show", "-s", "--format=%ct", "HEAD"]),
  );
  if (!Number.isFinite(commitEpoch)) {
    throw new Error("Invalid commit timestamp");
  }
  const buildDate = new Date(commitEpoch * 1000).toISOString();
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
    const pendingPath = `${outputPath}.pending`;
    const bytes = new TextEncoder().encode(html);
    await Deno.writeFile(pendingPath, bytes);
    await Deno.rename(pendingPath, outputPath);

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

await build();
