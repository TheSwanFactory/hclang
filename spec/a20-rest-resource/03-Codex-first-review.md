# First REST Design Review

**Author:** Codex.\
**Status:** Historical review of [02](02-Kiro-initial-credentialed-design.md).

The following four comments are preserved from #570. They are review proposals,
not independent acceptance requirements.

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206121471).

### Attenuation: distinguish grant definitions from grants installed for HC

The current config loader installs **every** configured grant in the handler
table
([rest-config.ts](https://github.com/TheSwanFactory/hclang/blob/49089964fa7b419cb02013253b570346d288a700/cli/rest-config.ts#L233-L240)).
With a credentialed parent and an `issues/`, GET-only child in the same file, HC
can simply write the parent's URI and use its POST authority. No parent
reference needs to escape from the child. The adversarial criterion “obtain ...
any resource broader than the child” therefore needs the parent withheld from
that program.

A small, explicit fix: distinguish definitions from exports. An `install` list
could select which defined grants enter the HC handler table; ancestors remain
harness-private. An explicit visibility flag is another option.

There is also an identity corner case:
`parent.attenuate({ methods: ["GET"], requests: 10 })` preserves the base URI.
The existing handler rejects duplicate bases, so it cannot install both parent
and child. Installing only the selected child preserves URI identity without
introducing HC capability aliases.

Suggested acceptance tests:

- Install only a child; naming the known parent URI returns `resource-unbound`.
- Construct a same-base, methods-only child and install it successfully.
- Installed siblings share the parent's request budget; constructing another
  child does not replenish it; parent revocation affects both.

These establish the program's actual authority ceiling, beyond the per-request
subset property.

---

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206123345).

### Simpler attenuation implementation: one canonical request, one transport send

I would make the delegation boundary explicit before implementation. The current
`RestGrant.exchange` resolves a relative path against its own base and records
refusals
([implementation](https://github.com/TheSwanFactory/hclang/blob/49089964fa7b419cb02013253b570346d288a700/lib/frames/rest-handler.ts#L193-L226)).
Recursively calling that public method on a parent risks resolving the child
request against the wrong base, losing child limits, or producing multiple
evidence records.

A simpler internal model:

1. Resolve the request once against the installed child's base.
2. Check that same canonical outgoing request against every ancestor's policy
   and live state.
3. After every check passes, debit the relevant counters and send exactly once.
4. Record one application, identifying the installed child; retain ancestry as
   metadata if useful.

The root owns the transport and credential; child nodes contain policy plus
references to shared ancestor state. This preserves the proposed delegation
proof without recursively repeating parsing, URL construction and evidence
handling.

Two details need explicit rules:

- **Transport limits:** the current worker replaces outgoing
  timeout/response-size limits with its own root policy values. A child with a
  smaller timeout or response budget must have the effective minimum enforced
  _during fetch/streaming_, rather than only checked after the response arrives.
- **Lifetime:** use an absolute deadline,
  `min(parent.expiresAt, now + child.lifetimeMs)`. Taking the minimum duration
  and starting a new child clock is insufficient by itself; continued ancestor
  checks must still enforce the parent's original deadline.

For the property test, compare authorization against equivalent state snapshots.
Calling the stateful parent after a child has already consumed its last request
can otherwise make the subset test fail for the wrong reason.

---

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206124218).

### Credential setup: make --grants a usable preflight, and print an exact launch command

The grant-selected environment variable is a good fit. The remaining ergonomic
gap is that Deno permissions are fixed **before** `--rest` is read. The current
`hc:rest` task is a static command with bare `--allow-env`
([deno.json](https://github.com/TheSwanFactory/hclang/blob/49089964fa7b419cb02013253b570346d288a700/deno.json#L16));
it cannot automatically add arbitrary `credential.env` names from a custom JSON
file.

For this proof, the simplest supported path may be a scoped task for the shipped
GitHub config, plus `--grants` printing a complete `deno run` command for custom
configs. This avoids introducing a privileged launcher solely to construct
dynamic flags. Print the exact placement of `--env-file` and
`--unstable-worker-options`, before the script path; appending runtime flags to
task arguments does not place them before `cli/hc.ts`.

Keep preflight independent of installation: parse/validate definitions and
inspect credential availability, without starting workers, requiring network
permission, creating evidence directories, or evaluating HC. Report “not
permitted to inspect” separately from “unset”; a denied environment read cannot
establish absence. In run mode, let the worker report availability with a
boolean startup handshake, so the main isolate never needs to read the value.

Deno documents
[worker permission scoping](https://docs.deno.com/api/web/workers/) as unstable
and bounded by the parent's permissions, and
[environment-file invocation](https://docs.deno.com/runtime/reference/env_variables/).
Test the complete printed commands as CLI smoke tests, including two roots that
share a credential variable: both workers must be constructed before the main
isolate revokes it.

One useful GitHub-specific improvement: the token creation link can
[pre-fill owner, repository permissions and expiry](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#pre-filling-fine-grained-personal-access-token-details-using-url-parameters).
Also label `gh auth token` as reusing an existing credential, whose scope is not
established by the grant's human-readable permission instructions.

---

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206125088).

### Writes require an explicit “effect may have happened” outcome

The inherited evidence contract needs revisiting when adding
POST/PUT/PATCH/DELETE. The worker currently fetches first and appends evidence
afterward. If the server commits a POST but the evidence append fails, returning
`resource-evidence` discards the response; it cannot undo the write. Likewise, a
timeout or response-size overflow can happen after the server committed the
operation.

A bounded approach:

- Record an intent before dispatch and refuse to send if that append fails.
- Append completion afterward, using a request ID to connect the records.
- Document that missing completion / transport failure after dispatch means the
  effect is uncertain, and never automatically retry.
- If retaining exactly one evidence record is more important for this milestone,
  explicitly narrow “fail closed” to pre-dispatch authorization and response
  release, and document the audit gap after a committed write.

Add a loopback case that increments server state and then drops/delays the
response, plus an evidence failure after dispatch. Assert that one effect
occurred and no retry followed. This catches a consequential difference that
simulator-only success/refusal tests can miss.

Separately, qualify “the token never reaches HC”: the worker can prevent direct
exposure, but an authorized endpoint can echo its received Authorization header
into the response body, which HC is allowed to read. The grant therefore needs a
trusted-destination/non-reflection assumption; isolate permissions alone do not
prove non-disclosure through arbitrary server responses. State that premise
rather than adding a general response-redaction subsystem.
