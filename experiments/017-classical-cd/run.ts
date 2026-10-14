/**
 * Driver for the 017.11 classical Cayley–Dickson lane.
 *
 * Composes each HC variant (`cd-core.hc` + one variant file), refuses to run
 * from a dirty runtime or experiment tree, runs HC under `/usr/bin/time -l`,
 * guards the composed sources against embedded reference counts, and hands
 * the outputs to `compare.ts`. It computes no lane value itself.
 *
 * ```sh
 * deno run --allow-read --allow-write --allow-run experiments/017-classical-cd/run.ts \
 *   --variant all --out <dir>
 * ```
 *
 * Options: `--variant main|controls|alt-seed|closure-probe|all`, `--out <dir>`,
 * `--src-dir <dir>` (HC sources; default this directory), `--heap <MB>`
 * (V8 old-space limit for HC; default 32768), `--budget-min <minutes>`
 * (per-variant wall budget; default 45), `--allow-dirty` (only for scratch
 * self-tests; recorded in runtime.json).
 *
 * Exit status: 0 when every gated comparison passes, 2 when any mismatches or
 * a variant failed, 1 on a usage or environment error.
 *
 * @module
 */

import { parseArgs } from "jsr:@std/cli@^1.0.13/parse-args";
import { compareVariant, type Comparison, observations } from "./compare.ts";
import { errorLines, parseRecords } from "./parse.ts";

const HERE = new URL(".", import.meta.url).pathname;
const REPO = new URL("../../", import.meta.url).pathname;
const VARIANTS = ["main", "controls", "alt-seed", "closure-probe"];
/** Reference counts that must never appear in executed HC code. */
export const GUARDED = ["168", "84", "42", "336", "3168"];

/** SHA-256 of bytes, hex. */
export async function sha256(bytes: Uint8Array): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(h)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/** Strips a leading shebang line. */
export function body(text: string): string {
  return text.startsWith("#!") ? text.slice(text.indexOf("\n") + 1) : text;
}

/** Code lines of an HC source: outside ``` prose blocks. */
export function codeLines(text: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  let prose = false;
  text.split("\n").forEach((l, i) => {
    if (l.trim().startsWith("```")) {
      prose = !prose;
      return;
    }
    if (!prose) out.push({ line: i + 1, text: l });
  });
  return out;
}

/** Any guarded integer token in code lines. */
export function guardHits(text: string): { line: number; token: string }[] {
  const hits: { line: number; token: string }[] = [];
  for (const { line, text: l } of codeLines(text)) {
    for (const m of l.matchAll(/\d+/g)) {
      if (GUARDED.includes(m[0])) hits.push({ line, token: m[0] });
    }
  }
  return hits;
}

/** Replaces the checkout path and home directory in anything written out. */
export function scrub(s: string): string {
  let home: string | undefined;
  try {
    home = Deno.env.get("HOME");
  } catch {
    home = REPO.match(/^\/Users\/[^/]+|^\/home\/[^/]+/)?.[0];
  }
  let t = s.split(REPO).join("<hclang>/");
  if (home) t = t.split(home).join("~");
  return t;
}

async function sh(cmd: string[], cwd = REPO): Promise<string> {
  const out = await new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: "piped",
    stderr: "piped",
  })
    .output();
  return new TextDecoder().decode(out.stdout).trim();
}

/** Parses the macOS `/usr/bin/time -l` block. */
export function parseTime(stderr: string): Record<string, number> {
  const out: Record<string, number> = {};
  const real = stderr.match(/([\d.]+) real\s+([\d.]+) user\s+([\d.]+) sys/);
  if (real) {
    out.realSeconds = Number(real[1]);
    out.userSeconds = Number(real[2]);
    out.sysSeconds = Number(real[3]);
  }
  const rss = stderr.match(/(\d+)\s+maximum resident set size/);
  if (rss) out.maxRssBytes = Number(rss[1]);
  const peak = stderr.match(/(\d+)\s+peak memory footprint/);
  if (peak) out.peakFootprintBytes = Number(peak[1]);
  return out;
}

async function main(): Promise<number> {
  const args = parseArgs(Deno.args, {
    string: ["variant", "out", "src-dir", "heap", "budget-min"],
    boolean: ["allow-dirty"],
    default: { variant: "all", heap: "32768", "budget-min": "45" },
  });
  if (!args.out) {
    console.error("--out <dir> is required");
    return 1;
  }
  const abs = (p: string) =>
    (p.startsWith("/") ? p : `${Deno.cwd()}/${p}`).replace(/\/?$/, "/");
  const out = abs(args.out);
  const src = args["src-dir"] ? abs(args["src-dir"]) : HERE;
  const variants = args.variant === "all" ? VARIANTS : [args.variant];
  for (const v of variants) {
    if (!VARIANTS.includes(v)) {
      console.error(`unknown variant ${v}`);
      return 1;
    }
  }
  const porcelain = await sh([
    "git",
    "status",
    "--porcelain",
    "--",
    "lib",
    "cli",
    "experiments/017-classical-cd",
  ]);
  if (porcelain && !args["allow-dirty"]) {
    console.error(
      `refusing to run: runtime or experiment tree is dirty\n${porcelain}`,
    );
    return 1;
  }
  await Deno.mkdir(out + "build", { recursive: true });
  const log: string[] = [];
  const say = (s: string) => {
    const t = scrub(s);
    log.push(t);
    console.log(t);
  };
  const runtime: Record<string, unknown> = {
    head: await sh(["git", "rev-parse", "HEAD"]),
    branch: await sh(["git", "rev-parse", "--abbrev-ref", "HEAD"]),
    porcelain,
    allowDirty: !!args["allow-dirty"],
    deno: Deno.version,
    libVersion: (await Deno.readTextFile(REPO + "lib/version.ts")).trim(),
    os: `${Deno.build.os} ${Deno.build.arch}`,
    srcDir: src === HERE
      ? "experiments/017-classical-cd/"
      : "(scratch) " + src.replace(REPO, ""),
    heapMB: Number(args.heap),
    startedAt: new Date().toISOString(),
    sources: {} as Record<string, string>,
    variants: {} as Record<string, unknown>,
  };
  const core = await Deno.readFile(src + "cd-core.hc");
  (runtime.sources as Record<string, string>)["cd-core.hc"] = await sha256(
    core,
  );
  const comparisons: Comparison[] = [];
  const outputs: Record<string, string> = {};
  let failed = false;
  for (const v of variants) {
    const file = await Deno.readFile(src + `${v}.hc`);
    (runtime.sources as Record<string, string>)[`${v}.hc`] = await sha256(file);
    const dec = new TextDecoder();
    const composed = "#!/usr/bin/env hc\n" + body(dec.decode(core)) +
      body(dec.decode(file));
    const path = out + `build/${v}.hc`;
    await Deno.writeTextFile(path, composed);
    const hits = guardHits(composed);
    const cmd = [
      "/usr/bin/time",
      "-l",
      "deno",
      "run",
      `--v8-flags=--max-old-space-size=${args.heap}`,
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--deny-run",
      "--deny-ffi",
      "./hc.ts",
      path,
    ];
    say(`## ${v}`);
    say(
      `guard: ${hits.length === 0 ? "pass" : "FAIL " + JSON.stringify(hits)}`,
    );
    say(`cwd: cli/`);
    say(`command: ${cmd.join(" ")}`);
    say(`load before: ${await sh(["uptime"])}`);
    const t0 = Date.now();
    const child = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      cwd: REPO + "cli",
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    const budgetMs = Number(args["budget-min"]) * 60_000;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, budgetMs);
    const res = await child.output();
    clearTimeout(timer);
    const wall = (Date.now() - t0) / 1000;
    const stdout = new TextDecoder().decode(res.stdout);
    const stderr = new TextDecoder().decode(res.stderr);
    await Deno.writeTextFile(out + `${v}-output.txt`, stdout);
    await Deno.writeTextFile(out + `${v}-stderr.txt`, stderr);
    const errs = [...errorLines(stdout), ...errorLines(stderr)];
    const time = parseTime(stderr);
    const records = parseRecords(stdout).length;
    say(`exit: ${res.code}${timedOut ? " (killed: budget exceeded)" : ""}`);
    say(`wall seconds: ${wall.toFixed(1)}; time -l: ${JSON.stringify(time)}`);
    say(`records: ${records}; runtime error lines: ${errs.length}`);
    for (const e of errs.slice(0, 5)) say(`  error: ${e.slice(0, 300)}`);
    say(`load after: ${await sh(["uptime"])}`);
    const ok = res.code === 0 && !timedOut && errs.length === 0 &&
      hits.length === 0;
    if (!ok) failed = true;
    outputs[v] = stdout;
    const cmp = compareVariant(v, stdout);
    comparisons.push(...cmp);
    const bad = cmp.filter((c) => !c.pass).length;
    say(
      `comparisons: ${cmp.length}; disagreements: ${bad}${
        v === "closure-probe" ? " (observation, not a gate)" : ""
      }`,
    );
    (runtime.variants as Record<string, unknown>)[v] = {
      composedSha256: await sha256(new TextEncoder().encode(composed)),
      command: scrub(cmd.join(" ")),
      cwd: "cli/",
      exitCode: res.code,
      timedOut,
      wallSeconds: wall,
      time,
      records,
      errorLines: errs.length,
      guardHits: hits,
      outputSha256: await sha256(res.stdout),
    };
  }
  runtime.finishedAt = new Date().toISOString();
  const gated = comparisons.filter((c) => c.gate);
  const mismatches = gated.filter((c) => !c.pass);
  const report = {
    summary: {
      variants,
      comparisons: comparisons.length,
      gatedComparisons: gated.length,
      mismatches: mismatches.length,
      closureProbeDisagreements:
        comparisons.filter((c) => !c.gate && !c.pass).length,
      variantFailed: failed,
    },
    mismatches,
    comparisons,
  };
  await Deno.writeTextFile(
    out + "validation-report.json",
    JSON.stringify(report, null, 1) + "\n",
  );
  const obs = {
    note:
      "HC entries are values the HC program computed and printed; host-oracle entries are the " +
      "independent dense-arithmetic recomputation in oracle.ts. Neither reads the other.",
    runtimeHead: runtime.head,
    ...observations(outputs),
  };
  await Deno.writeTextFile(
    out + "observations.json",
    JSON.stringify(obs, null, 1) + "\n",
  );
  await Deno.writeTextFile(
    out + "runtime.json",
    JSON.stringify(runtime, null, 1) + "\n",
  );
  await Deno.writeTextFile(out + "run-log.txt", log.join("\n") + "\n");
  say(`summary: ${JSON.stringify(report.summary)}`);
  return mismatches.length > 0 || failed ? 2 : 0;
}

if (import.meta.main) Deno.exit(await main());
