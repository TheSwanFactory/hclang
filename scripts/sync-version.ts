// Sync version from deno.json to src/version.ts
const denoJson = JSON.parse(await Deno.readTextFile("deno.json"));
const version = denoJson.version;
await Deno.writeTextFile(
  "src/version.ts",
  `export const VERSION = "${version}";\n`
);
