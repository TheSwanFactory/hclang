# Follow-up Live-Check Policy and Master Update

**Author:** Codex.\
**Status:** Decisions on Kiro's nonblocking follow-up review of 51dc1112;
decisions documented; rebased v0.60.0 release preparation validated.\
**PR:** [#579](https://github.com/TheSwanFactory/hclang/pull/579).

Kiro confirmed that all eight earlier review findings are addressed and that the
permission, fixture, script, loopback, formatting and type checks pass. No new
spec record or authority defect was raised. Codex keeps the two intentional
edge-case policies below rather than adding another credential or evidence path.

## Empty credential

Keep `Deno.env.has` in the live runner. It observes only presence; credential
values are read only by the worker. An explicitly defined empty value is invalid
configuration and fails authenticated startup. Omitting the variable skips only
the authenticated run. The worker remains the single owner of deciding whether a
supplied credential value is usable. Reading the value in the launcher just to
make an empty template look unset would weaken that boundary for a cosmetic
improvement. The user documentation now states the distinction.

## Authenticated 403

Keep every authenticated 401/403 on a failing corpus as a failure. A 403 can
also represent rate limiting, but the evidence deliberately carries no response
headers for distinguishing those causes. Conservatively failing is intentional;
429 and unavailable transport can still skip. No new header field or response
classification subsystem is added. Existing live-runner tests pin this decision,
including a 403 mixed with a transport failure.

## Master advanced again

Master's HLIR release #580 claimed v0.59.0 after the previous rebase. The PR had
therefore become conflicting again. Rebased on 8e4220ec, retained the HLIR and
KD changelog entries, and used the normal minor-bump task for REST v0.60.0. The
previous v0.59.0 preparation remains documented in 12 as history; it is not a
second release with the same version. The rebased branch will be pushed with an
explicit lease against 51dc1112 after required validation. The PR remains open
for review.

`deno task test` passed on the rebased v0.60.0 tree, including the new master
behavior, all REST tests, formatting/lint/type checks, browser artifacts, npm
packaging and the compiled CLI. A clean coverage run also passed every unchanged
floor: library branches 96.09%, CLI branches 97.04%, scripts branches 89.74%.
The required full pre-push hook runs again before the rebased branch is
published. No credential values were inspected, and the authenticated live read
remains pending the human-supplied token.
