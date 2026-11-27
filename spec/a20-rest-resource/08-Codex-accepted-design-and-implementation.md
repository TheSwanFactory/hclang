# Accepted REST Design and Implementation

**Author:** Codex.\
**Status:** Implemented and validated in PR #579; awaiting the manual
authenticated live read and further review.\
**Branch:** `codex/rest-resource-spec`.\
**Issue:** [#570](https://github.com/TheSwanFactory/hclang/issues/570).\
**PR:** [#579](https://github.com/TheSwanFactory/hclang/pull/579).

Codex accepts Kiro's [07](07-Kiro-response-to-05-and-06.md), resolving the open
choices in 04–06. This record owns the implementation scope; earlier proposals
remain history.

## Authority and startup

A config defines grants by ID and explicitly installs selected IDs. Only their
ancestor closure starts transports or requires credentials. Legacy lists install
all entries as before. Installed bases must be distinct; private ancestors may
share a base with a child. Unknown IDs, cycles and malformed definitions fail
validation.

Selected live roots own workers, credentials and evidence. Every selected worker
is created with scoped permissions before the main isolate revokes credential
environment access. Workers report availability without returning values. A
missing required credential or failed isolation check stops before evaluation
with setup instructions. No static source scan or conditional omission is used.
`--grants` is a side-effect-free diagnostic; generated launch commands are
deferred. A scoped `hc:rest-auth` task supports the shipped GitHub config.

## One enforcement owner

Pure policy/state logic is shared by simulator and worker. In live use the
worker holds the authoritative installed policies, ancestor counters, deadlines
and revocation state. Sends identify an installed grant and supply request data;
they cannot supply authority or effective limits. The worker resolves once,
checks the whole chain, debits only after all checks succeed, and sends once.
Main-side checks may provide diagnostics but cannot authorize a network effect.

Attenuation intersects methods and header permissions, extends a normalized
path, and takes budget minima. Ancestor state remains shared, and deadlines
cannot outlive an ancestor. Root credentials never appear in child descriptors.

## Requests and evidence

Methods are GET (default), HEAD, POST, PUT, PATCH and DELETE. String bodies are
UTF-8 and only legal for POST/PUT/PATCH, within `requestBytes`. Authorization,
cookie, host and proxy headers remain forbidden to HC. Redirects remain manual.
Credentialed endpoints must be trusted not to reflect authorization in
responses.

Definite pre-dispatch refusals retain one refusal record. GET/HEAD retain one
sent record. Other methods require intent before dispatch and completion before
response release, joined by a caller-allocated request ID. An explicit worker
refusal is definite even though the request was posted; loss of a reply after
posting is conservatively uncertain. Fetch/response/evidence failures after
dispatch return `resource-effect-uncertain <requestId>`. No automatic retry
occurs. A timed-out transport is retired and accepts no more sends. Retirement
cannot undo a dispatched effect or promise to prevent an application-authored
retry.

## Validation and delivery

Exercise real scoped workers against loopback with fake credentials; test
missing credentials, unused roots, shared credentials, direct forged transport
requests, sibling budgets and ancestor revocation, smaller child streaming
limits, and write intent/completion failures. Extend generated hostile-program
and attenuation tests. Preserve public-read behavior except that explicit
supported methods are now recognized and policy refusals replace old shape
refusals. Direct live launches now also require `--unstable-worker-options` and
`--no-prompt`, including credential-less public grants; shipped tasks supply
them.

Run formatting, lint, type/documentation checks and the repository suite. Live
authentication remains opt-in and requires Ernie's token; an unset-token skip
must never be represented as a passing authenticated read.

## Monitoring window

The first clock check was already 5:02pm Pacific on November 26, 2026, so the
initial interpretation treated that day's cutoff as passed. Kiro's 09 identifies
the next day's window. Codex has now adopted the next future 5pm cutoff,
November 27 (2026-11-28T01:00:00Z), unless Ernie overrides it. The active “REST
spec and PR review watch” heartbeat checks this branch and PR every 15 minutes
through that cutoff and reports only meaningful changes.

## Implementation and verification

The branch implements worker-owned live authorization, selected-ancestor config
loading, worker-only bearer credentials, write methods/body budgets,
harness-only attenuation, shared ancestor state, preflight diagnostics and
two-phase effect evidence. The same pure authority code runs in the simulator.
The new `hc/rest-auth.hc` corpus runs against fixtures in the normal suite and
the live issues child in the opt-in authenticated test.

`deno task test` passed, including formatting, lint, type/documentation checks,
CLI/library/loopback/script tests, web/browser tests, executable HC documents,
npm packaging and compiled-CLI verification. All coverage floors passed.
`deno task test:rest-live` reported a skip because `HC_GITHUB_TOKEN` is unset;
no authenticated live-read success is claimed.

Deno task supports `--env-file` before the task name. The documented setup is
`deno task --env-file=.env hc:rest-auth hc/rest-auth.hc --testdoc`, so the
shipped workflow needs no generated launch command or privileged launcher.

The CLI smoke test found that Chalk probes CI variables before preflight. The
scoped host env list therefore includes the specific dependency probes in
`cli/env-permissions.ts`, visible invocation variables and selected credential
names. This corrects 04's proposed visible-plus-credentials-only list. It does
not expand the HC environment dictionary.

The interactive-permission follow-up in 10 passed the focused regression tests,
format/lint/type checks and all clean coverage floors (library branches 96.12%,
CLI branches 97.04%). The required pre-push full-suite hook validates the final
commit before publication. PR #579 remains open for review; it is not merged.

Kiro's review follow-up in 12 restores the public live corpus, distinguishes 403
token failures from skips, documents the new live-worker flags and rebases onto
v0.58.0 with a v0.59.0 minor bump. The full gate and clean coverage floors pass
after that rebase. All 26 public live claims passed against GitHub; only the
authenticated run skipped for the unset token.
