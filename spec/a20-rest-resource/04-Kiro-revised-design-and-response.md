# Revised Credentialed REST Design and Review Response

**Author:** Kiro (design attribution supplied for this record).\
**Status:** Proposed extension; not implemented by this documentation change.\
**Source:** [#570](https://github.com/TheSwanFactory/hclang/issues/570), issue
body captured at repository baseline `49089964fa7b419cb02013253b570346d288a700`.

The issue body and response below are preserved as captured. Their original
“decided” wording records that proposal's status at the time; unresolved
follow-up reviews are in [05](05-Codex-second-review.md), and a simpler
alternative is in [06](06-Codex-simplification.md).

## What

Extend the REST resource from #277, which reads only public resources, to
credentialed and attenuated access. This completes #277's DTRB proof: an HC
program given a set of installed grants cannot obtain a credential, reach a
grant it was not given, widen any grant's authority, or produce an effect no
installed grant allows.

This builds on #277's handler, grant, policy, worker transport, simulator and
evidence (`spec/a20-rest-resource.md`). Where it changes them, the section says
so.

**Size: heavy.** It adds a secret to the worker transport, write methods to the
policy, attenuation to the grant model, and a two-phase evidence record for
effects.

Design revised on 2026-11-27 after the four review comments below. The decisions
comment lists what changed.

## Decided design

### 1. Grant definitions are separate from installed grants

The `--rest` file has two parts:

```json
{
  "grants": [
    { "id": "repo", "base": "https://api.github.com/repos/TheSwanFactory/hclang/", "methods": ["GET", "POST"], "credential": { … }, … },
    { "id": "issues-read", "attenuates": "repo", "path": "issues/", "methods": ["GET"], "requests": 10 }
  ],
  "install": ["issues-read"]
}
```

- **`grants` defines; `install` exports.** Only grants named in `install` enter
  the HC handler table. Every other definition, including every ancestor of an
  installed grant, stays private to the harness. So a program given only
  `issues-read` that writes the parent's URI gets `$!.resource-unbound`.
- **Ids, not bases, name definitions.** A child that narrows only methods or
  budgets keeps its parent's base URI, so a base cannot identify a definition.
  Two installed grants with the same base are refused at startup, as today.
- **A same-base child is valid.** `{ "attenuates": "repo", "methods": ["GET"] }`
  installs at the parent's base with GET only, and the parent stays private.
- The #277 file format, a bare list of grants, still loads, with every grant
  installed and each grant's id derived from its base.

### 2. Credentials: declared by the grant, supplied by Deno, held only by the worker

HC code never names, reads or selects a credential. A program writes the same
literal it writes for a public grant. Whether a token goes along is decided by
the grant the harness installed (a07 §7: a program requests no authority).

**Declared by a root grant:**

```json
"credential": {
  "env": "HC_GITHUB_TOKEN",
  "scheme": "bearer",
  "create": "https://github.com/settings/personal-access-tokens/new?name=hclang+REST&description=HC+REST+grant+for+TheSwanFactory%2Fhclang&target_name=TheSwanFactory&expires_in=30&issues=read",
  "permissions": "Repository access: only TheSwanFactory/hclang (select it by hand; the link cannot). Metadata: read. Issues: read."
}
```

- `env` must match `^HC_[A-Z0-9_]+$` and must not be in `VISIBLE_ENVIRONMENT`
  (`lib/execute/env-visibility.ts`, #366), so it can never reach `$$`. `scheme`
  is `bearer` only. Children have no `credential`.
- **`create` pre-fills the token form.** GitHub supports `name`, `description`,
  `target_name`, `expires_in` and one parameter per permission
  ([GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#pre-filling-fine-grained-personal-access-token-details-using-url-parameters)).
  Repository selection has no parameter, so `permissions` says to pick the
  repository by hand.

**Supplied by Deno.** The value comes from the process environment, exported or
loaded by Deno's `--env-file=<file>`
([Deno docs](https://docs.deno.com/runtime/reference/env_variables/)).
`.gitignore` gains `.env`.

**Held only by the worker.** Each step below was checked in a spike on Deno
2.9.7:

1. Env access is an explicit list, not a bare `--allow-env`:
   `VISIBLE_ENVIRONMENT` plus each installed root's `credential.env`. Revoking
   one variable is ignored under a bare `--allow-env`.
2. The CLI constructs **every** root's transport worker, with
   `deno: { permissions: { env: [<its credential var>], net: [<its host>], read: false, write: [<its evidence file>] } }`.
   This needs `--unstable-worker-options`, and a worker's permissions are
   bounded by the parent's
   ([Deno docs](https://docs.deno.com/api/web/workers/)).
3. Only after all workers exist does the main isolate call
   `Deno.permissions.revokeSync({ name: "env", variable })` for each credential
   variable. Two roots that share a variable both get it this way.
4. Each worker answers a startup handshake with one boolean, whether its
   variable is set. The main isolate never reads a credential value.
5. The CLI refuses to evaluate if
   `Deno.permissions.querySync({ name: "env", variable })` is still `"granted"`
   in the main isolate, or if any handshake answered false.

**Risk.** `Worker.deno.permissions` is unstable. If Deno removes it, keeping the
token out of the evaluator's isolate needs a subprocess, which `--deny-run`
forbids. Step 5 makes a regression fail closed.

### 3. Telling users what to set

Deno permissions are fixed before the CLI reads `--rest`, so a task cannot add
the variables a custom file names.

- **For the shipped config,** a scoped task `hc:rest-auth` runs
  `cli/rest/github-auth.json`. Its flags are written out in full:
  `--unstable-worker-options`,
  `--allow-env=<VISIBLE_ENVIRONMENT>,HC_GITHUB_TOKEN`,
  `--allow-net=api.github.com`, the existing read, write and deny flags, and
  `--env-file=.env` only if the user adds it. A test asserts the task's env list
  equals `VISIBLE_ENVIRONMENT` plus that file's credential variables.
- **For any config, `hc --rest <file> --grants` is a preflight.** It parses and
  validates the definitions, and checks each credential variable with
  `Deno.env.has`. It starts no worker, needs no network permission, creates no
  evidence directory, and evaluates no HC. For each installed grant it prints:
  - its base, methods and budgets, and its ancestry by id;
  - for a credential: the variable; whether it is set, unset, or **not permitted
    to inspect** (a denied read proves nothing about absence); the `create` link
    and `permissions` text;
  - the complete command to run it, as
    `deno run <every flag> cli/hc.ts --rest <file> <program>`, with
    `--unstable-worker-options` and `--env-file=.env` placed before the script
    path. Appending them to a task's arguments would put them after `cli/hc.ts`,
    where Deno does not read them.
  - two ways to supply the token: a new token from the `create` link, or
    `HC_GITHUB_TOKEN=$(gh auth token)`, labelled as **reusing an existing
    credential whose scope the grant's instructions do not establish**.
- **Read phase.** Before running a program, the CLI collects its literal
  `'https://…'` identifiers (a07 §5). If one names an installed grant whose
  handshake answered false, the CLI prints that grant's preflight block to
  stderr and exits non-zero without evaluating.
- **Run phase.** A grant whose credential is unset is not installed, so a
  computed literal that escapes the static check answers `$!.resource-unbound`
  (a07 §7: impossible, not denied). The reason, with the variable name, goes to
  stderr and the evidence file.
- `doc/` and `hc/rest.hc` document the file format, `--grants`, `hc:rest-auth`
  and both ways to supply a token.

### 4. Write methods and request bodies

- The request record gains `.method` (default `“GET”`) and `.body` (a string
  sent as UTF-8, allowed only for `POST`, `PUT` and `PATCH`).
- A grant lists its `methods`, a subset of `GET`, `HEAD`, `POST`, `PUT`, `PATCH`
  and `DELETE`. Any other method answers `$!.resource-method-forbidden`.
- A new budget, `requestBytes`, limits the body. Exhaustion answers
  `$!.resource-budget request-size`.
- `content-type` and `if-match` join the request-header allowlist.
- The transport sets `authorization` itself, after the policy passes. HC still
  cannot set `authorization`, `cookie`, `host` or `proxy-*`, and no grant may
  add them.

### 5. Attenuation: one canonical request, checked against every ancestor, sent once

Attenuation is a harness operation (a07 §7: a program narrows nothing).

- **Each field narrows.** Methods intersect. The path extends the parent's base
  through `normalizeReferencePath`. Each budget is the minimum of the parent's
  and the child's. Header additions intersect.
- **The root owns the transport and the credential.** A child holds only its own
  policy and references to its ancestors' **shared live state**: request
  counters, deadline and revocation.
- **One application is one pipeline.** It does not call a parent's public
  `exchange`, which would re-resolve the request against the parent's base, lose
  the child's limits, and record evidence more than once
  (`lib/frames/rest-handler.ts`, `RestGrant.exchange`).
  1. Resolve the request **once**, against the installed grant's base.
  2. Check that same canonical outgoing request against the installed grant's
     policy and live state, then each ancestor's in turn, up to the root.
  3. Only if every check passes, debit every counter on the chain.
  4. Send exactly once through the root's transport.
  5. Record one application naming the installed grant, with the ancestor ids as
     metadata.
- **Shared state is shared.** Installed siblings spend the same ancestor budget.
  Constructing another child never replenishes it, and revoking an ancestor
  refuses every descendant.
- **Transport limits are the effective minimum, enforced while fetching.** The
  worker receives the chain's minimum `timeoutMs` and `responseBytes` with each
  request, and enforces them during the fetch and while streaming the body. It
  does not substitute the root's values or check the limits only after the
  response arrives.
- **Lifetime is an absolute deadline.** A grant's `expiresAt` is
  `min(parent.expiresAt, constructedAt + lifetimeMs)`, and step 2 checks every
  ancestor's deadline as well.

### 6. Evidence for effects is two-phase

`GET` and `HEAD` keep #277's single record. Every other method is an effect the
server may commit even when the client sees a failure, so its evidence has two
records joined by a `requestId`:

1. **`intent`**, appended before dispatch. If the append fails, the request is
   not sent, and the application answers `$!.resource-evidence`.
2. **`completion`**, appended after the response or the failure, with the status
   or the transport error.

- **A failure after dispatch is uncertain, never retried.** That covers a
  timeout, a response-size overflow, a dropped connection, or a failed
  completion append. The application answers
  `$!.resource-effect-uncertain <requestId>`, and the evidence holds an intent
  with no completion, or a completion with an error. Nothing is ever retried
  automatically.
- **"Fails closed" means two things:** nothing is sent without an intent record,
  and no response is released without a completion record. It does not undo a
  write the server committed. `spec/a20` records this audit gap.

### 7. Trust premise: grants name non-reflecting endpoints

The worker keeps the token out of every HC-visible value it constructs. An
authorized endpoint that echoes its received `Authorization` header into the
response body would still hand the token to HC, which may read bodies. So a
credentialed grant assumes its base names a trusted, non-reflecting API.
`spec/a20` and the `credential` docs state this premise. No response-redaction
subsystem is added.

## Tests

- **Credential path, in `test:all`:** the real worker transport against a
  loopback server the test starts, with a fake token and net limited to
  `127.0.0.1`. The server asserts the header arrives, and the tests assert the
  token never reaches the main isolate.
- **Printed commands are smoke-tested.** The CLI test runs the exact
  `deno run …` line `--grants` prints for a loopback config, including two roots
  that share one credential variable.
- **Installation:**
  - Install only a child: naming the known parent URI answers
    `$!.resource-unbound`.
  - A same-base, methods-only child installs and refuses `POST`.
  - Installed siblings share the parent's request budget, a newly constructed
    child does not replenish it, and revoking the parent refuses both.
- **Attenuation property test:** for generated chains and requests, every
  request a child authorizes, its parent authorizes too. Authorization is
  compared on equal state snapshots, so a child spending the parent's last
  request does not fail the subset check for the wrong reason.
- **Effects, against the loopback server:**
  - The server commits an increment and then drops or delays its response: the
    server records exactly one effect, nothing is retried, the answer is
    `$!.resource-effect-uncertain`, and the evidence holds the intent and an
    error completion.
  - The completion append fails after dispatch: one effect, no retry, the same
    answer.
  - The intent append fails: the server sees no request.
- **Transport limits:** a child with a smaller `responseBytes` or `timeoutMs`
  than its root is cut off during streaming at the child's limit.
- **#277's hostile-program property test** gains credentialed grants, write
  methods and installed children.
- **Live, opt-in (`test:rest-live`):** a fine-grained token reads the same
  GitHub resource as #277 through an installed, path-narrowed child. It skips,
  and says so, when the token is unset.

## Adversarial tests

Given the installed grants and unrestricted ordinary HC computation, each of
these must fail closed while authorized applications keep working:

- [ ] inject, replace, or disclose the authorization header;
- [ ] extract the credential through output, errors, metadata, serialization,
      evidence, or quining;
- [ ] recover a raw host client or callback that holds the credential;
- [ ] invoke a method the grant does not allow, or send a body with `GET`,
      `HEAD` or `DELETE`;
- [ ] exceed the request-size budget, or a child's smaller response-size or time
      limit;
- [ ] reach an ancestor that is not installed, by writing its URI;
- [ ] use a child to reach a path, method or budget its parent allows but the
      child does not;
- [ ] replenish a budget, or outlive an ancestor's deadline, through a child;
      and
- [ ] amplify authority through nested scope, closure capture, aliasing,
      mutation, or repeated application of a credentialed or attenuated
      resource.

## Manual step for Ernie

The live test needs a token that only Ernie can create.
`hc --rest cli/rest/github-auth.json --grants` prints these steps from the grant
itself:

1. Open the grant's pre-filled `create` link, select only
   `TheSwanFactory/hclang` under repository access, and generate the token
   (read-only Metadata and Issues, 30-day expiry).
2. Supply it as `HC_GITHUB_TOKEN`, either exported or in a gitignored `.env`
   read with `--env-file=.env`, and run `deno task test:rest-live` in the
   implementing worktree.

## Acceptance

- [ ] `spec/a20-rest-resource.md` gains sections on installation, credentials,
      write methods, attenuation, two-phase evidence and the trust premise
- [ ] The `{grants, install}` file format loads, the #277 list format still
      loads, and only installed grants enter the handler table
- [ ] The token is read only in the worker: every worker exists before the main
      isolate revokes the credential variables, the handshake reports
      availability as a boolean, and startup refuses if a variable is still
      granted to the main isolate or appears in `VISIBLE_ENVIRONMENT`
- [ ] `--grants` is a preflight with no side effects, distinguishes set, unset
      and not-permitted, and prints a complete, smoke-tested `deno run` command
- [ ] `hc:rest-auth` exists, and its env list is checked against the config
- [ ] Write methods, request bodies and `requestBytes` are enforced
- [ ] Attenuation follows §5's single pipeline, with shared ancestor state,
      effective transport limits and absolute deadlines
- [ ] Effects use two-phase evidence, and an uncertain outcome is reported and
      never retried
- [ ] Every test and adversarial case above passes, and the live credentialed
      read passes under the manual step
- [ ] CHANGELOG entry

## Non-goals

- Every REST authentication scheme. One bearer token is enough for the proof.
- Token refresh or OAuth flows
- Live writes against GitHub. Writes are tested only against the simulator and
  the loopback server.
- Redacting credentials from response bodies (§7)
- A privileged launcher that builds Deno flags from a custom config

---

## Response to the first review

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206168715).

Design revised to take all four review comments above. The issue body is
updated; here is what changed and where.

1. **Grant definitions vs. installed grants: accepted, as an `install` list
   (§1).** The file is now `{grants, install}`. Only installed grants enter the
   handler table, so ancestors stay harness-private and writing a parent's URI
   answers `$!.resource-unbound`. Definitions are named by `id`, because a
   methods-only child keeps its parent's base. All three suggested tests are in
   the Tests section, and "reach an ancestor that is not installed" is a new
   adversarial case. The #277 list format still loads, with every grant
   installed.

2. **One canonical request, one send: accepted (§5).** Resolve once against the
   installed grant's base, check that one request against every ancestor's
   policy and live state, debit every counter only after all checks pass, send
   once through the root's transport, and record one application naming the
   installed grant. Children hold policy plus references to shared ancestor
   state. Both details are now rules:
   - the worker enforces the chain's minimum `timeoutMs` and `responseBytes`
     during the fetch and while streaming;
   - lifetime is the absolute deadline
     `min(parent.expiresAt, constructedAt + lifetimeMs)`, and every ancestor's
     deadline is checked too.

   The property test compares authorization on equal state snapshots.

3. **Credential setup: accepted (§2, §3).**
   - A scoped `hc:rest-auth` task covers the shipped GitHub config, with its env
     list checked against the config by a test. For any other config, `--grants`
     prints a complete `deno run` command with the runtime flags before
     `cli/hc.ts`, and that command is smoke-tested.
   - `--grants` is a side-effect-free preflight that reports set, unset, and not
     permitted to inspect separately.
   - In run mode, each worker reports availability through a boolean handshake.
   - Every worker is constructed before the main isolate revokes, which covers
     two roots sharing a variable. That case is a smoke test.
   - The `create` link now pre-fills name, description, owner, expiry and
     `issues=read`. GitHub has no parameter for repository selection, so the
     instructions say to pick it by hand.
   - `gh auth token` is labelled as reusing an existing credential of
     unestablished scope.

4. **Writes: accepted, as two-phase evidence (§6).** For methods other than
   `GET` and `HEAD`:
   - an `intent` record is appended before dispatch, and the request is not sent
     if that append fails;
   - a `completion` record joined by `requestId` follows;
   - any failure after dispatch answers
     `$!.resource-effect-uncertain <requestId>` and is never retried.

   "Fails closed" is narrowed to "nothing sent without an intent, nothing
   released without a completion", and the spec records that a committed write
   cannot be undone. All three loopback cases you suggested are in Tests. The
   non-reflection premise is §7: a credentialed grant assumes its base names a
   trusted API that doesn't echo `Authorization`, and no redaction subsystem is
   added.
