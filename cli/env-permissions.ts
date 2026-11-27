/** Environment permissions needed by CLI dependencies, distinct from HC visibility. @module */
import { VISIBLE_ENVIRONMENT } from "../lib/execute/env-visibility.ts";
/**
 * Chalk probes these CI names during module initialization, even before --grants.
 * Permission to inspect them does not expose them to HC's curated $$ dictionary.
 */
export const CLI_ENVIRONMENT: readonly string[] = Object.freeze([
  ...VISIBLE_ENVIRONMENT,
  "TF_BUILD",
  "AGENT_NAME",
  "GITHUB_ACTIONS",
  "GITEA_ACTIONS",
  "TRAVIS",
  "CIRCLECI",
  "APPVEYOR",
  "GITLAB_CI",
  "BUILDKITE",
  "DRONE",
  "CI_NAME",
  "TEAMCITY_VERSION",
]);
