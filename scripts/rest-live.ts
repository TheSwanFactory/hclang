/** Opt-in authenticated GitHub read through an installed child grant. @module */
import { CLI_ENVIRONMENT } from "../cli/env-permissions.ts";
if (!Deno.env.has("HC_GITHUB_TOKEN")) {
  console.log(
    "test:rest-live: skipped, HC_GITHUB_TOKEN is unset; use --grants for setup instructions",
  );
  Deno.exit(0);
}
const repo = new URL("../", import.meta.url);
const evidence = new URL("cli/rest/evidence/auth-live.jsonl", repo);
const lines = (): string[] => {
  try {
    return Deno.readTextFileSync(evidence).split("\n").filter(Boolean);
  } catch {
    return [];
  }
};
const before = lines().length;
const run = await new Deno.Command(Deno.execPath(), {
  args: [
    "run",
    "--allow-read",
    "--allow-write",
    `--allow-env=${[...CLI_ENVIRONMENT, "HC_GITHUB_TOKEN"].join(",")}`,
    "--unstable-worker-options",
    "--allow-net=api.github.com",
    "--deny-run",
    "--deny-ffi",
    "cli/hc.ts",
    "--rest",
    "cli/rest/github-auth.json",
    "hc/rest-auth.hc",
    "-t",
  ],
  cwd: repo,
  stdout: "piped",
  stderr: "inherit",
}).output();
const output = new TextDecoder().decode(run.stdout);
const summary = output.split("\n").filter((line) =>
  /test-fail|test-summary/.test(line)
);
console.log(summary.join("\n"));
if (run.code === 0) {
  console.log("test:rest-live: hc/rest-auth.hc passed against the live grants");
  Deno.exit(0);
}
const fresh = lines().slice(before).map((line) => JSON.parse(line));
const unavailable = fresh.some((record) =>
  typeof record.refusal === "string" &&
  record.refusal.startsWith("resource-transport")
);
const limited = fresh.some((record) =>
  record.status === 403 || record.status === 429
);
if (unavailable || limited) {
  console.log(
    `test:rest-live: skipped, ${
      unavailable ? "the network is unavailable" : "GitHub rate-limited the run"
    }`,
  );
  Deno.exit(0);
}
console.error("test:rest-live: hc/rest-auth.hc failed against the live grants");
Deno.exit(1);
