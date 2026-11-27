# REST Grants

HC reaches a REST grant by its exact base URI and applies a request record:

```hc
.api 'https://api.example.com/issues/'
api [.path “123”, .method “PATCH”, .headers [.content-type “application/json”, .if-match “etag”], .body “{}”]
```

The response contains `.status`, allowlisted `.headers`, and a UTF-8 `.body`.
HTTP error statuses are data. Redirects are never followed. An omitted method
means GET; string bodies are allowed only for POST, PUT and PATCH. The harness
bounds methods, body bytes, response bytes, request count, timeout and lifetime.

## Definitions and installation

The JSON config separates definitions from installed authority:

```json
{
  "grants": [
    {
      "id": "api",
      "base": "https://api.example.com/",
      "methods": ["GET", "POST"],
      "requestBytes": 4096,
      "requests": 20,
      "responseBytes": 100000,
      "timeoutMs": 10000,
      "lifetimeMs": 600000,
      "transport": "live",
      "evidence": "evidence/api.jsonl",
      "credential": {
        "env": "HC_API_TOKEN",
        "scheme": "bearer",
        "create": "https://api.example.com/token",
        "permissions": "Read issues only; choose a short expiry."
      }
    },
    {
      "id": "issues-read",
      "attenuates": "api",
      "path": "issues/",
      "methods": ["GET"],
      "requests": 5
    }
  ],
  "install": ["issues-read"]
}
```

Only `issues-read` is nameable by HC, at `https://api.example.com/issues/`. The
root is private. A same-base child may narrow methods or budgets without
changing URI. Installing two grants with the same base is refused. Legacy JSON
lists still install every entry. Unknown keys, IDs and cycles fail startup.

Paths extend the parent's normalized path; methods and added header permissions
intersect, and budgets take minima. Children share ancestor counters, deadlines
and revocation; making another child cannot replenish a budget. Relative
evidence and fixture paths resolve against the config directory. A fixture
filename in `transport` selects simulation instead of a live worker.

Root methods default to GET and requestBytes defaults to zero. Child fields
inherit when omitted. `requestHeaders` and `responseHeaders` add root header
names; children may retain only additions their ancestors allow. Authorization,
cookie, host and proxy headers can never be supplied by HC.

## Credential setup and permissions

`deno task hc --rest <file> --grants` explains installed authority, ancestry,
budgets and required credentials. It creates no evidence files or workers and
requires no network permission. Credential inspection reports set, unset or not
permitted to inspect; it never prints values.

Only root ancestors of installed live grants need workers, env/net permissions
and credentials. Missing required credentials stop startup. Worker permissions
are scoped before credential access is revoked in the evaluator isolate. This
requires Deno's `--unstable-worker-options` and `--no-prompt`; a bare
`--allow-env` cannot be used for credentialed evaluation. The shipped
`hc:rest-auth` task has the exact env and network flags for
`cli/rest/github-auth.json`.

Use an exported `HC_GITHUB_TOKEN`, or a `.env` file containing
`HC_GITHUB_TOKEN=...`, then run:

```bash
deno task --env-file=.env hc:rest-auth hc/rest-auth.hc --testdoc
```

Deno task itself loads the environment file before running the scoped command.
For a custom config, supply `deno run` with an explicit env list containing the
visible invocation variables, CLI color-detection variables and required
credential names, scoped net hosts, read/write access for config/evidence,
`--unstable-worker-options`, `--deny-run` and `--deny-ffi`, and `--no-prompt`,
all before `cli/hc.ts --rest <file> <program>`.

A credential declaration supplies instructions, not a proof of remote token
permissions. Reusing `gh auth token` reuses that token's existing scope. Grants
must name trusted APIs that do not reflect authorization into responses; worker
isolation cannot hide a token echoed by an authorized server.

## Write outcomes

GET and HEAD retain one evidence record. Other methods append intent before
sending and completion before releasing a response. Evidence includes the
method, URL, counts and outcome, never request headers or bodies. Definite
pre-dispatch refusals remain ordinary refusals. After dispatch, a failed
response, timeout, size overflow or completion append yields:

```text
$!.resource-effect-uncertain <requestId>
```

Losing the worker reply after posting also makes the outcome uncertain. The
request ID joins evidence phases. An uncertain result does not mean the write
failed: the server may already have committed. The runtime never retries;
application-authored retries can duplicate effects. A timed-out transport is
retired. Evidence append success is an application-level audit guarantee, not a
promise of disk durability across machine failure.

The
[accepted design](../spec/a20-rest-resource/08-Codex-accepted-design-and-implementation.md)
and [numbered discussion](../spec/a20-rest-resource/README.md) record rationale.

The host-only env list is declared in
[cli/env-permissions.ts](../cli/env-permissions.ts). Color detection probes CI
variables during module initialization, so those specific names are permitted
alongside visible invocation variables. They remain absent from HC's curated
environment dictionary.

REST launches use `--no-prompt` so a post-revocation read cannot regain env
access through an interactive permission prompt. Missing-token instructions use
the worker's boolean availability report, without inspecting the variable again.
Preflight queries permission first and never prompts for additional env access.

The live runner inspects credential presence, not its value. Omit
`HC_GITHUB_TOKEN` to skip the authenticated corpus. An explicitly set empty
value is invalid setup and fails that corpus when the worker checks it. An
authenticated 403 is conservatively a failure even if rate limiting caused it;
without discriminating evidence the runner does not treat it as a safe skip.

## Existing API keys and Fathom

Credentials support two fixed encodings: `bearer` sends
`Authorization: Bearer ...`; `x-api-key` sends `X-Api-Key: ...`. The worker
selects and injects that header after authorization. HC cannot supply either
header, even if a grant tries adding it to its request-header list. Arbitrary
credential header names, refresh and OAuth flows remain out of scope.

A credential environment name can be an existing environment identifier such as
`FATHOM_API_KEY`; an `HC_` prefix is not required. Names inspected by the CLI or
visible to HC are refused, case-insensitively, so standard invocation and
color-detection variables cannot become credentials. The explicit worker env
permission, main-isolate revocation and `--no-prompt` still enforce isolation.

Fathom's documented read endpoint is
`https://api.fathom.ai/external/v1/recordings/{recording_id}/summary`,
authenticated with `X-Api-Key`. Its API recording ID may differ from a
`fathom.video/calls/` web-call ID. The user-authorized live proof is:

```bash
deno task --env-file="$HOME/.env" test:rest-fathom <api-recording-id>
```

Deno loads the environment file as data; neither the launcher nor the evaluator
reads the key value. The launcher builds a private temporary config that
installs only the selected recording's GET grant. It checks summary HTTP 200,
private-parent inaccessibility, credential-header replacement refusal and POST
refusal. It reports status/check counts only, then removes the temporary config,
HC source and evidence. Keep real meeting IDs and content out of checked-in
examples and reports.
