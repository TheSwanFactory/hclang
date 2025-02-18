import { parseArgs } from "jsr:@std/cli/parse-args";
const flags = parseArgs(Deno.args, {
    boolean: ["minor"],
    default: { minor: false },
});

// Read current version from lib/version.ts
const versionTs = await Deno.readTextFile("lib/version.ts");
const currentVersionMatch = versionTs.match(/VERSION = "(\d+\.\d+\.\d+)"/);
if (!currentVersionMatch) {
    throw new Error("Current version not found in lib/version.ts");
}
const [major, minor, patch] = currentVersionMatch[1].split(".").map(Number);

// Bump version
const newVersion = flags.minor
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;

// Update deno.json in root, lib, cli, and maml directories
const paths = ["deno.json", "lib/deno.json", "cli/deno.json", "maml/deno.json"];
for (const path of paths) {
    const denoJson = JSON.parse(await Deno.readTextFile(path));
    denoJson.version = newVersion;
    await Deno.writeTextFile(path, JSON.stringify(denoJson, null, 2) + "\n");
}

// Update version.ts
await Deno.writeTextFile(
    "lib/version.ts",
    `export const VERSION = "${newVersion}";\n`,
);

console.log(`Bumped version to ${newVersion}`);
