/** Opt-in public REST corpus plus the credentialed child corpus when configured. @module */
import { CLI_ENVIRONMENT } from "../cli/env-permissions.ts";
/** One live corpus and its separate evidence channel. */
export interface LiveCorpus {
  readonly name: "public" | "authenticated";
  readonly config: string;
  readonly source: string;
  readonly evidence: string;
}
/** Only the outcome metadata needed to distinguish failure from an unavailable run. */
export interface LiveRun {
  readonly code: number;
  readonly output: string;
  readonly records: readonly {
    readonly status: number | null;
    readonly refusal: string | null;
  }[];
}
const PUBLIC: LiveCorpus = {
  name: "public",
  config: "cli/rest/github-live.json",
  source: "hc/rest.hc",
  evidence: "cli/rest/evidence/live.jsonl",
};
const AUTHENTICATED: LiveCorpus = {
  name: "authenticated",
  config: "cli/rest/github-auth.json",
  source: "hc/rest-auth.hc",
  evidence: "cli/rest/evidence/auth-live.jsonl",
};
/** Runs both eligible corpora; missing credentials skip only the authenticated run. */
export async function runLiveChecks(
  hasCredential: boolean,
  run: (corpus: LiveCorpus) => Promise<LiveRun> = runCorpus,
  report: (line: string) => void = console.log,
): Promise<number> {
  let failed = false;
  for (const corpus of hasCredential ? [PUBLIC, AUTHENTICATED] : [PUBLIC]) {
    const result = await run(corpus);
    report(
      result.output.split("\n").filter((line) =>
        /test-fail|test-summary/.test(line)
      ).join("\n"),
    );
    if (result.code === 0) {
      report(
        `test:rest-live: ${corpus.name} ${corpus.source} passed against the live grants`,
      );
      continue;
    }
    // Authentication/authorization failures must not be hidden by another transport error.
    const tokenFailure = corpus.name === "authenticated" &&
      result.records.some((record) =>
        record.status === 401 || record.status === 403
      );
    const unavailable = result.records.some((record) =>
      record.refusal?.startsWith("resource-transport")
    );
    const limited = result.records.some((record) =>
      record.status === 429 ||
      (corpus.name === "public" && record.status === 403)
    );
    if (!tokenFailure && (unavailable || limited)) {
      report(
        `test:rest-live: ${corpus.name} skipped, ${
          unavailable
            ? "the network is unavailable"
            : "GitHub rate-limited the run"
        }`,
      );
    } else {
      failed = true;
      report(
        `test:rest-live: ${corpus.name} ${corpus.source} failed against the live grants`,
      );
    }
  }
  if (!hasCredential) {
    report(
      "test:rest-live: authenticated skipped, HC_GITHUB_TOKEN is unset; use --grants for setup instructions",
    );
  }
  return failed ? 1 : 0;
}
/** Reads evidence without granting the HC program access to it. */
function lines(evidence: URL): string[] {
  try {
    return Deno.readTextFileSync(evidence).split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
/** Executes the real CLI with narrowly scoped host permissions. */
async function runCorpus(corpus: LiveCorpus): Promise<LiveRun> {
  const repo = new URL("../", import.meta.url);
  const evidence = new URL(corpus.evidence, repo);
  const before = lines(evidence).length;
  const env = [
    ...CLI_ENVIRONMENT,
    ...(corpus.name === "authenticated" ? ["HC_GITHUB_TOKEN"] : []),
  ];
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-prompt",
      "--allow-read",
      "--allow-write",
      `--allow-env=${env.join(",")}`,
      "--unstable-worker-options",
      "--allow-net=api.github.com",
      "--deny-run",
      "--deny-ffi",
      "cli/hc.ts",
      "--rest",
      corpus.config,
      corpus.source,
      "-t",
    ],
    cwd: repo,
    stdout: "piped",
    stderr: "inherit",
  }).output();
  return {
    code: result.code,
    output: new TextDecoder().decode(result.stdout),
    records: lines(evidence).slice(before).map((line) => JSON.parse(line)),
  };
}
if (import.meta.main) {
  Deno.exit(await runLiveChecks(Deno.env.has("HC_GITHUB_TOKEN")));
}
