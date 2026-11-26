/**
 * `deno task test:rest-live`: runs `hc/rest.hc` unchanged against the live,
 * public GitHub REST API.
 *
 * The testdoc runs in a child CLI with net permission for `api.github.com`
 * only, under the live grants in `cli/rest/github-live.json`, so it exercises
 * the origin, path, method, header and budget claims against the real server.
 * It is opt-in and not part of `test:all` or CI: GitHub allows 60
 * unauthenticated requests an hour per IP, and the run needs the network.
 *
 * When the run fails and the new evidence shows the network was unavailable
 * (`resource-transport`) or GitHub rate-limited the run (403 or 429), the task
 * reports a skip and exits 0 instead.
 *
 * @module
 */
const repo = new URL("../", import.meta.url);
const evidence = new URL("cli/rest/evidence/live.jsonl", repo);
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
    "--allow-env",
    "--allow-net=api.github.com",
    "--deny-run",
    "--deny-ffi",
    "cli/hc.ts",
    "--rest",
    "cli/rest/github-live.json",
    "hc/rest.hc",
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
  console.log("test:rest-live: hc/rest.hc passed against the live grants");
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
console.error("test:rest-live: hc/rest.hc failed against the live grants");
Deno.exit(1);
