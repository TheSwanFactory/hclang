import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  FORMAT_BOT_EMAIL,
  FORMAT_BOT_NAME,
  FORMAT_COMMIT_SUBJECT,
  type FormatEvent,
  formatEventFromEnv,
  formatPlan,
} from "./ci-format.ts";

/** A same-repo pull request that may receive a format commit. */
const pullRequest = (
  overrides: Partial<FormatEvent> = {},
): FormatEvent => ({
  eventName: "pull_request",
  repository: "TheSwanFactory/hclang",
  headRepository: "TheSwanFactory/hclang",
  headRef: "feature",
  defaultBranch: "master",
  headAuthor: "Ada",
  headSubject: "Add a feature",
  ...overrides,
});

describe("formatPlan", () => {
  it("pushes formatting on a same-repo pull request", () => {
    expect(formatPlan(pullRequest())).toEqual("format-and-push");
  });

  it("checks a fork, because the workflow token cannot push there", () => {
    expect(formatPlan(pullRequest({
      headRepository: "someone/hclang",
    }))).toEqual("check");
  });

  it("checks when the head repository is missing", () => {
    expect(formatPlan(pullRequest({ headRepository: undefined }))).toEqual(
      "check",
    );
  });

  it("checks the default branch instead of pushing onto it", () => {
    expect(formatPlan(pullRequest({ headRef: "master" }))).toEqual("check");
    expect(formatPlan(pullRequest({
      eventName: "push",
      headRef: undefined,
      headRepository: undefined,
    }))).toEqual("check");
  });

  it("checks a manual dispatch", () => {
    expect(formatPlan(pullRequest({
      eventName: "workflow_dispatch",
      headRef: undefined,
      headRepository: undefined,
    }))).toEqual("check");
  });

  it("checks pull_request_target so a fork cannot be given a write token", () => {
    expect(formatPlan(pullRequest({ eventName: "pull_request_target" })))
      .toEqual("check");
  });

  it("checks a format commit that is already HEAD, so a retrigger cannot loop", () => {
    expect(formatPlan(pullRequest({
      headAuthor: FORMAT_BOT_NAME,
      headSubject: FORMAT_COMMIT_SUBJECT,
    }))).toEqual("check");
  });

  it("still pushes when only the author or only the subject matches the bot", () => {
    expect(formatPlan(pullRequest({ headAuthor: FORMAT_BOT_NAME }))).toEqual(
      "format-and-push",
    );
    expect(formatPlan(pullRequest({ headSubject: FORMAT_COMMIT_SUBJECT })))
      .toEqual("format-and-push");
  });

  it("checks when it does not know which branch is the default", () => {
    expect(formatPlan(pullRequest({ defaultBranch: "" }))).toEqual("check");
  });

  it("checks when the repository name is missing", () => {
    expect(formatPlan(pullRequest({ repository: "", headRepository: "" })))
      .toEqual("check");
  });

  it("uses the commit subject the job is documented to push", () => {
    expect(FORMAT_COMMIT_SUBJECT).toEqual("style: deno fmt");
    expect(FORMAT_BOT_NAME).toEqual("github-actions[bot]");
    expect(FORMAT_BOT_EMAIL).toContain("github-actions[bot]");
  });
});

describe("formatEventFromEnv", () => {
  it("treats a blank Actions variable as absent", () => {
    expect(formatEventFromEnv({
      GITHUB_EVENT_NAME: "push",
      GITHUB_REPOSITORY: "TheSwanFactory/hclang",
      HEAD_REPOSITORY: "",
      HEAD_REF: "",
      DEFAULT_BRANCH: "master",
      HEAD_AUTHOR: "",
      HEAD_SUBJECT: "",
    })).toEqual({
      eventName: "push",
      repository: "TheSwanFactory/hclang",
      headRepository: undefined,
      headRef: undefined,
      defaultBranch: "master",
      headAuthor: undefined,
      headSubject: undefined,
    });
  });

  it("keeps a same-repo pull request intact", () => {
    const event = formatEventFromEnv({
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_REPOSITORY: "TheSwanFactory/hclang",
      HEAD_REPOSITORY: "TheSwanFactory/hclang",
      HEAD_REF: "feature",
      DEFAULT_BRANCH: "master",
      HEAD_AUTHOR: "Ada",
      HEAD_SUBJECT: "Add a feature",
    });
    expect(formatPlan(event)).toEqual("format-and-push");
  });
});
