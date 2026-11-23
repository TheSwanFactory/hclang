/**
 * Exercises `scripts/ci-format.sh` against a local bare repository.
 *
 * `deno task test:scripts` passes `--allow-run` so this can spawn git, bash,
 * and deno, and `--allow-env` so it can spawn them without the variables that
 * locate this repository. The policy tests in `ci-format.test.ts` need none of
 * that.
 *
 * @module
 */

import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  FORMAT_BOT_EMAIL,
  FORMAT_BOT_NAME,
  FORMAT_COMMIT_SUBJECT,
} from "./ci-format.ts";

const script = new URL("./ci-format.sh", import.meta.url).pathname;
const unformatted = "export const value:number=1\n";

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * This process's environment without the variables that tell git which
 * repository to use: `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` and the rest
 * that `git rev-parse --local-env-vars` lists.
 *
 * Git exports them to its hooks, and in a linked worktree `GIT_DIR` is an
 * absolute path. When the pre-push hook ran these tests from a worktree, the
 * fixture inherited them, so its git commands ran against the real repository
 * and left it with `core.bare=true` (#511).
 */
const isolatedEnv = async (): Promise<Record<string, string>> => {
  const listed = await new Deno.Command("git", {
    args: ["rev-parse", "--local-env-vars"],
  }).output();
  if (!listed.success) {
    throw new Error(
      `git rev-parse --local-env-vars failed (${listed.code})\n${
        new TextDecoder().decode(listed.stderr)
      }`,
    );
  }
  const env = Deno.env.toObject();
  for (const name of new TextDecoder().decode(listed.stdout).split("\n")) {
    delete env[name];
  }
  return env;
};

/** The environment every command in this file starts from. */
const baseEnv = await isolatedEnv();

const run = async (
  cwd: string,
  args: readonly string[],
  env?: Record<string, string>,
): Promise<RunResult> => {
  const command = new Deno.Command(args[0], {
    args: args.slice(1),
    cwd,
    // Without clearEnv, `env` only adds to this process's environment.
    clearEnv: true,
    env: { ...baseEnv, ...env },
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
};

const git = async (
  cwd: string,
  args: readonly string[],
): Promise<string> => {
  const result = await run(cwd, ["git", ...args]);
  if (result.code !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed (${result.code})\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
};

/** A bare remote and a clone whose `feature` branch has one unformatted commit. */
const fixture = async (): Promise<{ remote: string; work: string }> => {
  const root = await Deno.makeTempDir({ prefix: "hc-ci-format-" });
  const remote = `${root}/remote`;
  const work = `${root}/work`;
  await git(root, ["init", "--bare", "-b", "feature", remote]);
  await git(root, ["init", "-b", "feature", work]);
  await git(work, ["config", "user.name", "Ada"]);
  await git(work, ["config", "user.email", "ada@example.com"]);
  await git(work, ["config", "commit.gpgsign", "false"]);
  await git(work, ["remote", "add", "origin", remote]);
  // Bare `deno fmt` only runs inside a configured directory. CI has the
  // workspace deno.json; the fixture needs one of its own.
  await Deno.writeTextFile(`${work}/deno.json`, "{}");
  await Deno.writeTextFile(`${work}/sample.ts`, unformatted);
  await git(work, ["add", "sample.ts"]);
  await git(work, ["commit", "-m", "Add a feature"]);
  await git(work, ["push", "-u", "origin", "feature"]);
  return { remote, work };
};

const outputs = (text: string): Record<string, string> => {
  const values: Record<string, string> = {};
  for (const line of text.split("\n")) {
    if (line === "") continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    values[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return values;
};

const formatEnv = (
  output: string,
  overrides: Record<string, string> = {},
): Record<string, string> => ({
  GITHUB_OUTPUT: output,
  GITHUB_EVENT_NAME: "pull_request",
  GITHUB_REPOSITORY: "TheSwanFactory/hclang",
  HEAD_REPOSITORY: "TheSwanFactory/hclang",
  HEAD_REF: "feature",
  DEFAULT_BRANCH: "master",
  ...overrides,
});

describe("ci-format.sh", () => {
  it("pushes a format commit and reports its sha", async () => {
    const { work } = await fixture();
    const output = `${work}/output.txt`;
    await Deno.writeTextFile(output, "");
    const result = await run(work, ["bash", script], formatEnv(output));
    expect(result.code).toEqual(0);

    const recorded = outputs(await Deno.readTextFile(output));
    const head = await git(work, ["rev-parse", "HEAD"]);
    expect(recorded.pushed).toEqual("true");
    expect(recorded.sha).toEqual(head);
    expect(await git(work, ["log", "-1", "--format=%s"])).toEqual(
      FORMAT_COMMIT_SUBJECT,
    );
    expect(await git(work, ["log", "-1", "--format=%an"])).toEqual(
      FORMAT_BOT_NAME,
    );
    expect(await git(work, ["rev-parse", "origin/feature"])).toEqual(head);
    const formatted = await Deno.readTextFile(`${work}/sample.ts`);
    expect(formatted).not.toEqual(unformatted);
    expect(formatted).toContain("value: number = 1");

    // The commit this just pushed is the bot's. A second run is the retrigger
    // case: the tree is clean, so the check passes and nothing is pushed.
    await Deno.writeTextFile(output, "");
    const again = await run(work, ["bash", script], formatEnv(output));
    expect(again.code).toEqual(0);
    expect(outputs(await Deno.readTextFile(output)).pushed).toEqual("false");
    expect(await git(work, ["rev-parse", "HEAD"])).toEqual(head);
  });

  it("leaves a clean tree uncommitted", async () => {
    const { work } = await fixture();
    await Deno.writeTextFile(
      `${work}/sample.ts`,
      "export const value: number = 1;\n",
    );
    await git(work, ["add", "sample.ts"]);
    await git(work, ["commit", "-m", "Format the sample"]);
    await git(work, ["push"]);
    const before = await git(work, ["rev-parse", "HEAD"]);
    const output = `${work}/output.txt`;
    await Deno.writeTextFile(output, "");
    const result = await run(work, ["bash", script], formatEnv(output));
    expect(result.code).toEqual(0);
    expect(outputs(await Deno.readTextFile(output)).pushed).toEqual("false");
    expect(outputs(await Deno.readTextFile(output)).sha).toEqual(before);
    expect(await git(work, ["rev-parse", "HEAD"])).toEqual(before);
  });

  it("fails deno fmt --check on a fork and does not commit", async () => {
    const { work } = await fixture();
    const before = await git(work, ["rev-parse", "HEAD"]);
    const output = `${work}/output.txt`;
    await Deno.writeTextFile(output, "");
    const result = await run(
      work,
      ["bash", script],
      formatEnv(output, { HEAD_REPOSITORY: "someone/hclang" }),
    );
    expect(result.code).not.toEqual(0);
    expect(result.stderr).toContain("not formatted");
    expect(await Deno.readTextFile(output)).toEqual("");
    expect(await git(work, ["rev-parse", "HEAD"])).toEqual(before);
    expect(await Deno.readTextFile(`${work}/sample.ts`)).toEqual(unformatted);
  });

  it("fails deno fmt --check for a push to the default branch", async () => {
    const { work } = await fixture();
    const output = `${work}/output.txt`;
    await Deno.writeTextFile(output, "");
    const result = await run(
      work,
      ["bash", script],
      formatEnv(output, {
        GITHUB_EVENT_NAME: "push",
        HEAD_REPOSITORY: "",
        HEAD_REF: "",
      }),
    );
    expect(result.code).not.toEqual(0);
    expect(result.stderr).toContain("not formatted");
    expect(await git(work, ["log", "--format=%s"])).not.toContain(
      FORMAT_COMMIT_SUBJECT,
    );
  });

  it("does not push a second format commit when HEAD is already one", async () => {
    const { work } = await fixture();
    const output = `${work}/output.txt`;
    await Deno.writeTextFile(output, "");
    const first = await run(work, ["bash", script], formatEnv(output));
    expect(first.code).toEqual(0);
    // A later commit with the bot's name and subject, but with the drift put
    // back. Amending the format commit into its parent would be an empty
    // commit, so this is a new commit that the loop guard must refuse to push.
    await Deno.writeTextFile(`${work}/sample.ts`, unformatted);
    await git(work, ["add", "sample.ts"]);
    await git(work, [
      "-c",
      `user.name=${FORMAT_BOT_NAME}`,
      "-c",
      `user.email=${FORMAT_BOT_EMAIL}`,
      "commit",
      "-m",
      FORMAT_COMMIT_SUBJECT,
    ]);
    const head = await git(work, ["rev-parse", "HEAD"]);
    await Deno.writeTextFile(output, "");
    const result = await run(work, ["bash", script], formatEnv(output));
    expect(result.code).not.toEqual(0);
    expect(result.stderr).toContain("not formatted");
    expect(await git(work, ["rev-parse", "HEAD"])).toEqual(head);
    expect(await git(work, ["rev-parse", "origin/feature"])).not.toEqual(head);
  });

  it("fails deno fmt --check when the format push is rejected", async () => {
    const { remote, work } = await fixture();
    const other = `${work}-other`;
    await git(work, ["clone", remote, other]);
    await git(other, ["config", "user.name", "Ada"]);
    await git(other, ["config", "user.email", "ada@example.com"]);
    await git(other, ["config", "commit.gpgsign", "false"]);
    await Deno.writeTextFile(`${other}/sample.ts`, "export const other = 2;\n");
    await git(other, ["add", "sample.ts"]);
    await git(other, ["commit", "-m", "Move the branch"]);
    await git(other, ["push"]);
    const remoteHead = await git(work, [
      "ls-remote",
      "origin",
      "refs/heads/feature",
    ]);
    const output = `${work}/output.txt`;
    await Deno.writeTextFile(output, "");
    const before = await git(work, ["rev-parse", "HEAD"]);
    const result = await run(work, ["bash", script], formatEnv(output));
    expect(result.code).not.toEqual(0);
    expect(result.stderr).toContain("not formatted");
    expect(result.stderr).toContain("Could not push formatting");
    expect(await git(work, ["rev-parse", "HEAD"])).toEqual(before);
    expect(await Deno.readTextFile(`${work}/sample.ts`)).toEqual(unformatted);
    const after = await git(work, [
      "ls-remote",
      "origin",
      "refs/heads/feature",
    ]);
    expect(after).toEqual(remoteHead);
    expect(await Deno.readTextFile(output)).toEqual("");
  });
});
