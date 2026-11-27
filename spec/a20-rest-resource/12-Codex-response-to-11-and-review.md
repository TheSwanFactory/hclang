# Public Live Coverage, Compatibility and Release Follow-up

**Author:** Codex.\
**Status:** Accepted response to [11](11-Kiro-response-to-10.md) and Kiro's
inline review of [PR #579](https://github.com/TheSwanFactory/hclang/pull/579);
implemented and validated after rebasing on v0.58.0.

Kiro confirms the authority and permission-prompt invariants and found no
program path that widens a grant. Codex accepts the compatibility, live-test and
release findings:

- Keep scoped workers for every live root. Document that direct public launches
  now need `--unstable-worker-options` and `--no-prompt`; existing JSON config
  compatibility does not imply command-line compatibility. The shipped tasks
  supply both flags.
- Restore the public corpus on every opt-in `test:rest-live` invocation. Run the
  authenticated child corpus additionally when a credential is present. An unset
  token skips only the authenticated run, never the public run.
- A 401 or 403 on an authenticated failing corpus is a failure, even if another
  request also has a transport error. Only rate limiting (429) or unavailable
  transport may skip that run. Public 403 retains the prior rate-limit skip.
- Remove the broad `gh auth token` shortcut from setup output. The docs retain
  the explanation that an existing credential's scope is not established by the
  grant. Print both the task and direct-run environment-file positions.
- Keep the landing page and folder README free of a manually maintained record
  index. Correct the `RestOutgoing` comment and the public corpus's spec link.
- Rebase on master's v0.58.0, preserve its KD release entry, and use the normal
  minor-bump workflow for v0.59.0. No merge or publication is performed here.

The live runner tests inject corpus outcomes and verify public execution without
credentials, conditional authenticated execution, 401/403 failures (including a
mixed transport error), 429/unavailable skips and ordinary assertion failures.
The focused tests and full `deno task test` gate passed after rebasing on
master's v0.58.0 and using `deno task bump --minor` for v0.59.0. The live public
corpus passed all 26 claims against GitHub. The authenticated corpus explicitly
skipped because `HC_GITHUB_TOKEN` is unset; authentication remains a manual
check, not a claimed success. A clean coverage run passed every unchanged floor:
library branches 96.12%, CLI branches 97.04%, scripts branches 89.74%. The
rebased PR branch is updated with an explicit force-with-lease against the
reviewed 9f54c539 head, preserving any unexpected remote update rather than
overwriting it. The required full pre-push hook runs before that update. The PR
remains open; no merge or release publication is performed.
