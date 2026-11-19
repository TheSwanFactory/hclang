/**
 * Decide whether CI should push `deno fmt` or fail `deno fmt --check`.
 *
 * Same-repo pull requests can take a format commit on the head branch. Every
 * other run — the default branch, a fork, a manual dispatch — cannot, and a
 * head that is already the bot's format commit must not be formatted again or
 * a token that retriggers workflows would loop.
 *
 * @module
 */

/** Commit subject the format job uses, and the loop guard matches. */
export const FORMAT_COMMIT_SUBJECT = "style: deno fmt";

/** Author name of a format commit. Matches `%an` on the bot's commits. */
export const FORMAT_BOT_NAME = "github-actions[bot]";

/** Author email GitHub links to the Actions bot. */
export const FORMAT_BOT_EMAIL =
  "41898282+github-actions[bot]@users.noreply.github.com";

/** `check` fails the job via `deno fmt --check`. `format-and-push` commits. */
export type FormatPlan = "check" | "format-and-push";

/** The facts the workflow knows about the event that started the run. */
export interface FormatEvent {
  eventName: string;
  repository: string;
  /** `pull_request.head.repo.full_name`. Absent outside a pull request. */
  headRepository?: string;
  /** Head branch name. Absent outside a pull request. */
  headRef?: string;
  defaultBranch: string;
  /** `git log -1 --format=%an` of the checkout. */
  headAuthor?: string;
  /** Subject of that commit. */
  headSubject?: string;
}

const USAGE = "Usage: ci-format.ts --plan | --message | --bot | --email";

/** A blank environment value is an absent one. Actions passes `""`. */
const present = (value: string | undefined): string | undefined => {
  if (value === undefined || value === "") return undefined;
  return value;
};

/**
 * Reads the event from the environment the workflow exports.
 *
 * `GITHUB_EVENT_NAME` and `GITHUB_REPOSITORY` are set by Actions. The `HEAD_*`
 * and `DEFAULT_BRANCH` variables are set by the format job, because the head
 * repository is not a default Actions variable.
 *
 * @param env The process environment, or a fixture of it.
 * @returns The event the plan is decided from.
 */
export const formatEventFromEnv = (
  env: Readonly<Record<string, string | undefined>>,
): FormatEvent => ({
  eventName: env.GITHUB_EVENT_NAME ?? "",
  repository: env.GITHUB_REPOSITORY ?? "",
  headRepository: present(env.HEAD_REPOSITORY),
  headRef: present(env.HEAD_REF),
  defaultBranch: env.DEFAULT_BRANCH ?? "",
  headAuthor: present(env.HEAD_AUTHOR),
  headSubject: present(env.HEAD_SUBJECT),
});

/**
 * Whether this run may push formatting.
 *
 * Pushing is limited to a pull request whose head is a non-default branch of
 * this repository, and whose tip is not already the bot format commit.
 *
 * @param event The triggering event.
 * @returns `format-and-push` when a push is allowed, otherwise `check`.
 */
export const formatPlan = (event: FormatEvent): FormatPlan => {
  if (event.eventName !== "pull_request") return "check";
  if (event.repository === "") return "check";
  if (event.headRepository !== event.repository) return "check";
  if (event.defaultBranch === "") return "check";
  if (event.headRef === undefined || event.headRef === event.defaultBranch) {
    return "check";
  }
  if (
    event.headAuthor === FORMAT_BOT_NAME &&
    event.headSubject === FORMAT_COMMIT_SUBJECT
  ) {
    return "check";
  }
  return "format-and-push";
};

const printFlag = (flag: string | undefined): string => {
  switch (flag) {
    case "--message":
      return FORMAT_COMMIT_SUBJECT;
    case "--bot":
      return FORMAT_BOT_NAME;
    case "--email":
      return FORMAT_BOT_EMAIL;
    case "--plan":
      return formatPlan(formatEventFromEnv(Deno.env.toObject()));
    default:
      throw new Error(
        flag === undefined ? USAGE : `Unsupported argument: ${flag}\n${USAGE}`,
      );
  }
};

if (import.meta.main) {
  const [flag, ...rest] = Deno.args;
  if (rest.length !== 0) {
    throw new Error(`Unsupported argument: ${rest.join(" ")}\n${USAGE}`);
  }
  console.log(printFlag(flag));
}
