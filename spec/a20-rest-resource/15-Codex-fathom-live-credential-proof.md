# Fathom as the Live Credential Proof

**Author:** Codex.\
**Status:** User-authorized extension; live read and local regression gates
passed.\
**PR:** [#579](https://github.com/TheSwanFactory/hclang/pull/579).

Ernie requested using the existing `FATHOM_API_KEY` in `~/.env` instead of
creating a GitHub token, and supplied a Fathom web-call example. Fathom's
primary docs require `X-Api-Key`, not bearer authentication:
[quickstart](https://developers.fathom.ai/quickstart) and
[recording summary](https://developers.fathom.ai/api-reference/recordings/get-summary).

## Minimal extension

Add one fixed `x-api-key` credential scheme alongside bearer. The worker alone
reads the value and chooses the fixed header. Both authorization and x-api-key
are unconditionally forbidden to HC and cannot be grant-added request headers.
No arbitrary secret-header templates, refresh or OAuth machinery is introduced.

Accept existing environment identifiers rather than requiring the `HC_` naming
convention. Reject CLI-inspected and HC-visible names case-insensitively. The
security boundary remains explicit worker env permissions, main-isolate
revocation, no interactive prompts, and the curated HC environment dictionary.

## Live result and privacy

The web-call ID is not Fathom's API recording ID. The first direct summary read
returned 404. A bounded, user-authorized metadata lookup (summaries,
transcripts, action items, CRM matches and highlights disabled) resolved the API
ID. No meeting titles, content or credential values were displayed or saved in
the repo. The real ID appears only in private, temporary live-test inputs.

The actual HC program then passed four checks:

1. One authenticated GET of the selected recording's summary returned HTTP 200.
2. The broader, uninstalled API ancestor remained resource-unbound.
3. HC could not inject or replace X-Api-Key.
4. POST was refused before dispatch.

This satisfies the live credentialed-read acceptance condition using the
provider Ernie authorized. The GitHub-specific authenticated corpus remains
optional and explicitly skips without its own token; its bearer transport path
is covered by the existing real loopback tests.

`test:rest-fathom <api-recording-id>` uses Deno task's native `--env-file`
support. The launcher never reads the key value or prints the child's private
output. Its config, HC source and metadata-only evidence are created outside the
repo and removed after the run. Real IDs and meeting bodies are not checked in.

## Verification

Fake-key loopback tests verify X-Api-Key arrival, absence of Authorization,
main-isolate revocation, replacement refusals and credential-free evidence.
Config tests reject host-probed names and credential-header allowlist additions.
Launcher tests reject ID injection, require successful HC assertions plus
exactly one HTTP 200, and verify cleanup on success and process failure. The
live run and `deno task test` passed. `deno task coverage:check` passed on CI's
pinned Deno 2.9.8 with unchanged floors: library branches 96.09%, CLI branches
97.18%, scripts branches 89.44%. GitHub CI will validate the pushed head.
