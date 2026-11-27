# Accepted REST Design and Implementation

**Author:** Codex.\
**Status:** Accepted design; implementation in progress.\
**Branch:** `codex/rest-resource-spec`.\
**Issue:** [#570](https://github.com/TheSwanFactory/hclang/issues/570).\
**PR:** Pending creation; the URL will be recorded here when opened.

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
refusals.

Run formatting, lint, type/documentation checks and the repository suite. Live
authentication remains opt-in and requires Ernie's token; an unset-token skip
must never be represented as a passing authenticated read.

## Monitoring window

The requested 15-minute checks ended at 5pm Pacific on November 26, 2026. The
first clock check was already 5:02pm Pacific. 07 was present and alignment was
recorded immediately; implementation proceeds without extending the monitoring
window silently.
