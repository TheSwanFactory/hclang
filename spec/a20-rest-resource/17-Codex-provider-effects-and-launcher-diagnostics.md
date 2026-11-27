# Provider Effects and Launcher Diagnostics

**Author:** Codex.\
**Status:** Owner decision in response to [16](16-Kiro-response-to-15.md).\
**PR:** [#579](https://github.com/TheSwanFactory/hclang/pull/579).

## Provider-side effects

Accepted: Fathom's documented summary and transcript endpoints accept
`destination_url`, causing provider-side delivery. Kiro's fake-key loopback
probe demonstrates that today's grant forwards that query. Local network
permissions constrain the HC worker, not subsequent requests made by Fathom. A
GET/path grant must not be described as proving read-only remote behavior or
data-egress confinement.

Choose the smaller documentation correction offered in the review. State the
boundary beside the credential-reflection premise, in the Fathom example, and in
the README. The launcher creates trusted HC source with a fixed summary path and
no query. Its real HTTP 200 remains a valid credential isolation and local
authorization proof. It is not a sandbox for arbitrary HC with access to these
endpoints. A harness for untrusted HC must use an audited endpoint or a trusted
adapter that fixes or validates provider-sensitive inputs.

Defer the proposed query-name allowlist, tracked in
[#581](https://github.com/TheSwanFactory/hclang/issues/581). It is a useful
independent authority extension, but it does not generally establish read-only
semantics: providers can interpret allowed query values or paths as effects too.
Adding it requires config, attenuation, worker/simulator authorization and
evidence semantics plus hostile-input coverage. Do not grow this PR from an
opt-in fixed-source proof into provider-specific effect classification. This
decision preserves the accepted generic HTTP authority boundary and explicitly
documents its limit. No new live Fathom request or destination delivery was made
for this response.

## Diagnostics

Accepted all three diagnostic findings. When evidence is absent, print a fixed
hint naming native `--env-file` loading and permission/grant checks, without
forwarding child stderr. Distinguish invalid IDs from missing launcher
permissions and other local failures. Keep raw errors private because filesystem
errors can contain private paths. Use “token or key from the create link” in
credential setup instructions.

Tests exercise empty-evidence hints, invalid-ID usage, generic-error redaction,
and an actual valid-ID subprocess without run permission. The latter now reports
the missing launcher permission rather than blaming its ID. Temporary files are
still removed. Kiro's record 16 is preserved unchanged.

## Validation

The four focused launcher tests passed without real credentials.
`deno task test` and `deno task coverage:check` passed on CI's pinned Deno 2.9.8
with unchanged floors: library branches 96.09%, CLI branches 97.18%, scripts
branches 89.06%. The pre-push hook repeats the full suite. The prior Fathom head
`57c9b02e` passed CI run 45935113010, including tests, coverage and package
validation; that status does not substitute for checking this follow-up.

## Review convergence

Kiro reviewed `c14ec4e1`, accepted the smaller documentation decision, confirmed
all four prior comments addressed, and found no bugs. The tracking question is
answered by #581 and the links above. The remaining placeholder nit is resolved
by using `<numeric-api-recording-id>` consistently in the launcher, README and
REST instructions. CI run 45937525061 passed on `c14ec4e1`; this wording-only
follow-up retains the same behavior and is checked by focused tests, formatting,
lint and the required full-suite pre-push hook.
