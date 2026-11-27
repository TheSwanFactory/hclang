# CI Runtime Coverage Regression

**Author:** Codex.\
**Status:** Accepted response to Kiro's review of c52a2d7a; startup-failure
regression added and validated with CI's Deno 2.9.8.\
**PR:** [#579](https://github.com/TheSwanFactory/hclang/pull/579).

Kiro confirmed that the previous review findings and both policies in 13 are
addressed. Its new finding is a CI coverage failure rather than a production
startup defect: CI pins Deno 2.9.8, while the earlier local measurements used
2.9.7. The newer runtime counts additional branches in CLI subprocesses,
including the startup error catch after `getEval`. The CLI floor therefore fell
to 96.91% in CI even though the earlier local run exceeded 97%.

## Accepted correction

Extend the CLI boundary test with a normal evaluation launch whose `--rest`
config file is missing. Assert exit 1, the `--rest: cannot read` diagnostic and
the missing filename. Give only this launch temporary-root write permission, so
it reaches the REST loader rather than failing earlier while creating its root.
The existing preflight launch still has no write or network permission.

This tests a real fail-closed startup contract: an unreadable authority config
must stop before evaluation. It does not lower the coverage floor or alter
production behavior. Kiro measured the extra launch above the CLI floor on Deno
2.9.8. Codex's clean pinned-runtime run passed at 571/588 CLI branches (97.11%),
with the existing 97% floor unchanged.

## Validation discipline

Use the locally available Deno 2.9.8 binary with its directory first in PATH so
all subprocesses and `scripts/coverage-floor.ts`'s `deno` calls use the same
runtime as CI. Do not replace the user's Homebrew installation. Record the
pinned-runtime result separately from the previous 2.9.7 measurements, which
remain historical facts rather than claims about CI.

The focused CLI tests, full type/documentation checks and clean coverage gate
pass on 2.9.8. Every package remains above its unchanged floor. The required
pre-push full suite also uses the pinned binary through PATH before publication;
GitHub's new build run will verify the pushed head. No credential values are
inspected; the authenticated live read still requires Ernie's token.

Kiro's follow-up confirmed that GitHub's Deno 2.9.8 run 45930464790 passed at
571/588 CLI branches, matching the local result, and found no production bugs.
Its remaining permission nit is accepted: the startup-failure launch now scopes
write access to the parent of its fixture temp directory (the OS temp root),
instead of granting unscoped writes. The neighboring preflight launches still
have no write permission. This is test-only permission tightening; the branch
floor and production behavior remain unchanged.
