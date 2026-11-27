/** Opt-in status-only live credential proof for one caller-selected Fathom recording. @module */
import { CLI_ENVIRONMENT } from "../cli/env-permissions.ts";

/** The process seam lets tests verify the real launcher without live credentials. */
export type FathomRunner = (
  args: string[],
  cwd: URL,
) => Promise<{ success: boolean }>;
/** Runs the real HC CLI; the launcher never reads the key or meeting content. */
export async function fathomLive(
  recordingId: string,
  run: FathomRunner = runCli,
  report: (line: string) => void = console.log,
): Promise<number> {
  if (!/^\d+$/.test(recordingId)) {
    throw new Error("Usage: deno task test:rest-fathom <numeric recording id>");
  }
  const repo = new URL("../", import.meta.url);
  const temporary = Deno.makeTempDirSync({ prefix: "hc-rest-fathom-" });
  const base = "https://api.fathom.ai/external/v1/";
  const childBase = `${base}recordings/${recordingId}/`;
  const evidence = `${temporary}/evidence.jsonl`;
  try {
    const config = `${temporary}/grants.json`;
    Deno.writeTextFileSync(
      config,
      JSON.stringify({
        grants: [{
          id: "fathom",
          base,
          methods: ["GET"],
          requests: 2,
          requestBytes: 0,
          responseBytes: 1_000_000,
          timeoutMs: 15_000,
          lifetimeMs: 60_000,
          transport: "live",
          evidence,
          credential: {
            env: "FATHOM_API_KEY",
            scheme: "x-api-key",
            create: "https://developers.fathom.ai/quickstart",
            permissions:
              "Existing user API key; install read access only to the selected recording.",
          },
        }, {
          id: "recording",
          attenuates: "fathom",
          path: `recordings/${recordingId}/`,
          methods: ["GET"],
          requests: 1,
        }],
        install: ["recording"],
      }),
    );
    const source = `${temporary}/proof.hc`;
    Deno.writeTextFileSync(
      source,
      `#!/usr/bin/env hc
; ('${childBase}' [.path “summary”]).status
# 200
; '${base}' []
# $!.resource-unbound '${base}'
; '${childBase}' [.path “summary”, .headers [.x-api-key “replace”]]
# $!.resource-header-forbidden '${childBase}'
; '${childBase}' [.path “summary”, .method “POST”, .body “{}”]
# $!.resource-method-forbidden '${childBase}'
`,
    );
    const result = await run([
      "run",
      "--no-prompt",
      "--unstable-worker-options",
      "--allow-read",
      "--allow-write",
      `--allow-env=${[...CLI_ENVIRONMENT, "FATHOM_API_KEY"].join(",")}`,
      "--allow-net=api.fathom.ai",
      "--deny-run",
      "--deny-ffi",
      "cli/hc.ts",
      "--rest",
      config,
      source,
      "--testdoc",
    ], repo);
    // Evidence carries status and counts only; never print the HC body or raw logs.
    let records: { outcome: string; status: number | null }[] = [];
    try {
      records = Deno.readTextFileSync(evidence).trim().split("\n").filter(
        Boolean,
      ).map((line) => JSON.parse(line));
    } catch { /* Startup may fail before evidence exists. */ }
    const sent = records.filter((record) => record.outcome === "sent");
    const status = sent[0]?.status;
    const passed = result.success && sent.length === 1 && status === 200;
    report(
      `test:rest-fathom: ${
        passed ? "passed 4 checks" : "failed"
      }; authenticated summary HTTP ${
        status ?? "not dispatched"
      }; one recording grant; content withheld`,
    );
    return passed ? 0 : 1;
  } finally {
    Deno.removeSync(temporary, { recursive: true });
  }
}
/** Runs the child without forwarding its private output. */
async function runCli(args: string[], cwd: URL): Promise<{ success: boolean }> {
  const result = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();
  return { success: result.success };
}
if (import.meta.main) {
  try {
    Deno.exit(await fathomLive(Deno.args[0] ?? ""));
  } catch {
    console.error(
      "test:rest-fathom: supply a numeric recording id; the key must be loaded from the environment",
    );
    Deno.exit(1);
  }
}
