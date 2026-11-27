# Original Credentialed REST Proposal

**Author:** Kiro.\
**Status:** Historical proposal, superseded by later records.\
**Source:** Original #570 body saved before revision in
`.agents/tasks/design-triage/issue-rest-auth-body.md` in the main checkout. The
text below is preserved verbatim apart from Markdown formatting. This is the
issue as created, before the credential-block revision reviewed in 03.

---

## What

Extend the REST resource from #277, which reads only public resources, to
credentialed and attenuated access. This completes #277's DTRB proof: an HC
program holding a credentialed resource cannot obtain the credential, widen the
authority, or produce an effect the grant does not allow.

This builds on #277's handler, grant, policy, worker transport, simulator and
evidence. It changes none of them, only adds to them.

**Size: heavy.** It adds a secret to the worker transport, adds write methods to
the policy, and adds attenuation to the grant.

## Decided design

### 1. The worker holds the credential, and only the worker

- A root grant names `credentialEnv`, the environment variable holding its
  token. The worker reads that variable itself, so the main isolate, where HC
  runs, never holds the token.
- The harness refuses to start if `credentialEnv` appears in HC's env dictionary
  (#366).
- The transport sets `authorization` itself, after the HC request has passed the
  policy. HC still cannot set `authorization`, `cookie`, `host` or `proxy-*`,
  and no grant may add them to the request-header allowlist.
- Evidence records never contain the credential or any request header value.

### 2. Write methods and request bodies

- The request record gains `.method` (default `“GET”`) and `.body` (a string,
  sent as UTF-8, allowed only for `POST`, `PUT` and `PATCH`).
- A grant lists its `methods`, a subset of `GET`, `HEAD`, `POST`, `PUT`, `PATCH`
  and `DELETE`. Any other method answers `$!.resource-method-forbidden`.
- A new budget, `requestBytes`, limits the body. Exhaustion answers
  `$!.resource-budget request-size`.
- `content-type` and `if-match` join the request-header allowlist.
- Evidence records gain `requestBytes`.

### 3. Attenuation is a harness operation

a07 §7 rules that a program narrows nothing, so HC gets no attenuation spelling.
The harness attenuates in TypeScript:

```ts
const child = parent.attenuate({
  path: "issues/",
  methods: ["GET"],
  requests: 10,
});
// child.base === "https://api.github.com/repos/TheSwanFactory/hclang/issues/"
```

- **Each field narrows.** Methods intersect. The path extends the base through
  `normalizeReferencePath`. Each budget is the minimum of the parent's and the
  child's. Header additions intersect.
- **A child delegates to its parent.** It runs its own checks, then the
  parent's, and spends the parent's budgets as well as its own. So
  `authority(child) ⊆ authority(parent)` holds by construction: every request
  the child sends has passed the parent's check.
- **A child never holds the credential.** It holds a reference to its parent's
  checked send.
- **The child is a separate resource** with its own base URI, so a program names
  it with its own literal.
- In the `--rest` config, a child names `attenuates` (the parent's base) and its
  narrowing.

### 4. Tests

- **Credential path, in `test:all`.** The real worker transport runs against a
  loopback server that the test starts, with a fake token and net permission
  limited to `127.0.0.1`. The server asserts that the header arrives, and the
  tests below assert that the token never reaches HC.
- **Write methods and attenuation, in `test:all`,** against the simulator: a
  parent granting `GET` and `POST`, and a child narrowed to `GET` and `issues/`.
- **Attenuation property test:** for generated attenuation chains and requests,
  every request a child authorizes, its parent authorizes too.
- **#277's hostile-program property test** is extended with credentialed grants,
  write methods and attenuated children.
- **Live, opt-in (`test:rest-live`).** A fine-grained token reads the same
  GitHub resource as #277 through a path-narrowed child. The test skips, and
  says so, when the token is unset.

## Adversarial tests

Given a credentialed resource and unrestricted ordinary HC computation, each of
these attempts must fail closed while authorized applications keep working:

- [ ] inject, replace, or disclose the authorization header;
- [ ] extract the credential through output, errors, metadata, serialization,
      evidence, or quining;
- [ ] recover a raw host client or callback that holds the credential;
- [ ] invoke a method the grant does not allow, or send a body with `GET`,
      `HEAD` or `DELETE`;
- [ ] exceed the request-size budget;
- [ ] use a child to reach a path, method or budget its parent's grant allows
      but the child's does not;
- [ ] obtain the parent from a child, or any resource broader than the child;
      and
- [ ] amplify authority through nested scope, closure capture, aliasing,
      mutation, or repeated application of a credentialed or attenuated
      resource.

## Manual step for Ernie

The live test needs a token that only Ernie can create:

1. Create a fine-grained personal access token at
   https://github.com/settings/personal-access-tokens/new, limited to
   `TheSwanFactory/hclang`, with read-only **Metadata** and **Issues**
   permissions and a short expiry.
2. Export it as `HC_GITHUB_TOKEN`, and run `deno task test:rest-live` in the
   implementing worktree.

## Acceptance

- [ ] `spec/a20-rest-resource.md` gains the credential, write-method and
      attenuation sections
- [ ] The token is read only in the worker, and the startup check refuses a
      `credentialEnv` that HC's env dictionary exposes
- [ ] Write methods, request bodies and `requestBytes` are enforced
- [ ] `attenuate` narrows every field, and the attenuation property test passes
- [ ] The loopback credential test passes in `test:all`
- [ ] Every adversarial test above passes
- [ ] The live credentialed read passes under the manual step
- [ ] CHANGELOG entry

## Non-goals

- Every REST authentication scheme. One bearer token is enough for the proof.
- Token refresh or OAuth flows
- Live writes against GitHub. Writes are tested only against the simulator and
  the loopback server.
