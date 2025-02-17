import { parseArgs } from "@std/cli/parse-args";                                                                    
const flags = parseArgs(Deno.args, {
  boolean: ["minor"],
  default: { minor: false },
});

// Read current version
const denoJson = JSON.parse(await Deno.readTextFile("deno.json"));
const [major, minor, patch] = denoJson.version.split(".").map(Number);

// Bump version
const newVersion = flags.minor
  ? `${major}.${minor + 1}.0`
  : `${major}.${minor}.${patch + 1}`;

// Update deno.json
denoJson.version = newVersion;
await Deno.writeTextFile("deno.json", JSON.stringify(denoJson, null, 2) + "\n");

// Update version.ts
await Deno.writeTextFile(
  "src/version.ts",
  `export const VERSION = "${newVersion}";\n`
);

console.log(`Bumped version to ${newVersion}`);
