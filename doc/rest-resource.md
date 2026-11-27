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
requires Deno's `--unstable-worker-options`; a bare `--allow-env` cannot be used
for credentialed evaluation. The shipped `hc:rest-auth` task has the exact env
and network flags for `cli/rest/github-auth.json`.

Use an exported `HC_GITHUB_TOKEN`, or a `.env` file containing
`HC_GITHUB_TOKEN=...`, then run:

```bash
deno task --env-file=.env hc:rest-auth hc/rest-auth.hc --testdoc
```

Deno task itself loads the environment file before running the scoped command.
For a custom config, supply `deno run` with an explicit env list containing the
visible invocation variables, CLI color-detection variables and required
credential names, scoped net hosts, read/write access for config/evidence,
`--unstable-worker-options`, `--deny-run` and `--deny-ffi`, all before
`cli/hc.ts --rest <file> <program>`.

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
