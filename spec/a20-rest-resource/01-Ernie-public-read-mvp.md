# REST Resource: Reading Public Resources

**Status:** Implemented in v0.57.0 (MVP: public `GET`s only).\
**Issue:** [#277](https://github.com/TheSwanFactory/hclang/issues/277).
Credentials, write methods, request bodies and attenuation are
[#570](https://github.com/TheSwanFactory/hclang/issues/570), which builds on
this.\
**Builds on:** [`a07`](../a07-hc-security-architecture.md) §4-§7,
[`a10`](../a10-resource-primitive.md), [`a11`](../a11-resource-iteration.md) and
[`a12`](../a12-resource-frames.md) §2 and §6. This adds no parallel mechanism: a
REST resource is a handler table entry like the clock.

The MVP is the confinement half of DTRB. Every HC program given this resource,
present or future, can read exactly the public URLs its construction embodies
and reach nothing else, however it composes requests. `hc/rest.hc` is the
executable corpus, and it runs byte for byte against simulated and live grants.

## 1. The resource is a handler entry, named by its URI

`RestHandler` (`lib/frames/rest-handler.ts`) is a `SchemeHandler` bound to
`https` in the harness's `ResourceHandlers` table. It holds one or more grants
(`RestGrant`), each with a base URI. A program reaches one with an ordinary
resource literal:

```hc
.api 'https://api.github.com/repos/TheSwanFactory/hclang/'
```

- **Identity is the URI, spelled exactly.** The literal as written must equal a
  grant's canonical base, trailing slash included (`namesGrant`). A spelling
  that only normalizes to the base, such as
  `'https://API.github.com:443/…/hclang/'` or `'…/hclang/x/../'`, names no
  grant, so a grep for the base finds every use of it (decided in review of
  #572; #277 had said "after normalization", which admitted those aliases with
  the same authority). A literal naming no grant, whether another origin, a
  parent or a sub-path of a grant, or one carrying userinfo, a query or a
  fragment, answers `$!.resource-unbound`. An empty `?` or `#` is not a
  component in the RFC 3986 decomposition the handler receives, so
  `'…/hclang/?'` names the grant; it still contains the base, so the grep still
  finds it. Writing the same literal twice yields the same grant twice, not new
  authority.
- **The resource is a leaf** (a12 §2). The relative path travels in the request.
- **The program is the manifest** (a07 §5): its external surface is the set of
  `'https://…'` literals it writes.

A grant's base must be canonical (`new URL(base).href === base`), end with a
slash, and hold no userinfo, query or fragment. It must be `https`, except that
plain `http` is allowed on loopback hosts, which is what lets the live transport
be tested in `test:all` without leaving the machine. An `http:` literal reaches
the `http` entry only when the harness installs an `http` grant; the CLI does so
only for loopback bases.

## 2. Application is one GET

Applying the resource to a request record performs one `GET` and answers a
response record:

```hc
api [.path “issues/277”, .query [.state “open”], .headers [.accept “application/vnd.github+json”]]
```

**Request record.** Every key is optional. Any other key, including `.method`
and `.body`, answers `$!.resource-request-shape`, and so does a value that is
not a record, a record holding elements, or a key whose value has the wrong
shape.

| Key        | Value             | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.path`    | string            | A relative reference, normalized by `normalizeReference`, so a path naming a scheme, an authority, a query or a fragment is refused, and every root-plane refusal (`$!.resource-parent-escape`, `$!.resource-encoded-separator`, …) applies unchanged. A path that resolves to a trailing slash keeps it (a final `/`, or a final `.` segment per RFC 3986 §5.2.4), since some servers tell `/x/` from `/x`; absent or empty requests the base without its trailing slash. |
| `.query`   | record of strings | Encoded with `URLSearchParams`. There is no raw query string.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `.headers` | record of strings | Names are case-folded and checked against the request allowlist (§4).                                                                                                                                                                                                                                                                                                                                                                                                      |

**Response record.** `.status` is a Count, `.headers` holds only allowlisted
response headers, and `.body` is the response decoded as UTF-8 with invalid
bytes replaced. Any status, 3xx, 4xx and 5xx included, is data rather than a
refusal. Nothing in the record carries authority: it is aggregates, strings and
a Count.

**Other verbs.** A read (`api | “”`) is a `GET` of the base, answered as
characters (a11). There a 404 is `$!.resource-absent` and any other status
outside 2xx is `$!.resource-status <code>`. Applying a string is not a write.

**Handler protocol.** `SchemeHandler` gains an optional
`exchange(reference, request): HandlerExchange`, answering
`{ ok: true, response: Frame }` or a refusal. `FrameResource.apply` calls it
when the handler has one and keeps `write` for store-backed handlers. The REST
handler's `write` answers `resource-request-shape`.

## 3. The URL is built, then re-verified

`requestUrl` (`lib/frames/rest-policy.ts`) normalizes the path, re-encodes each
decoded segment on its own (so a decoded `?` or `#` stays a path character),
appends it to the base, and adds the encoded query. `withinBase` then requires
the base's origin, no userinfo or fragment, no encoded `/`, `\` or `.`, and a
pathname that is the base's or below it. Otherwise the answer is
`$!.resource-escaped-root`. Each transport runs `withinBase` again against its
own copy of the base before sending, so a defect in the main isolate cannot
widen what is sent.

## 4. Headers are allowlists in both directions

- **Request:** `accept`, `accept-language`, `if-none-match`,
  `if-modified-since`, plus names a grant adds. Anything else is
  `$!.resource-header-forbidden`, and so is a name written twice (so the answer
  never depends on key order) and a value `fetch` cannot send: a control
  character, or a character above U+00FF, which is not a ByteString. Refusing
  these up front keeps the simulator and the live transport in agreement and
  spends no request on one that cannot be sent. `authorization`, `cookie`,
  `host` and `proxy-*` are refused for every grant, and a grant that tries to
  allow one fails at startup, so a program cannot supply a credential.
- **Response:** `content-type`, `content-length`, `etag`, `last-modified`,
  `link`, `location`, `retry-after`, plus names a grant adds. The rest,
  `set-cookie` included, are dropped.

## 5. Redirects are never followed

The live transport fetches with `redirect: "manual"`, and a 3xx comes back with
its `location`. Following it takes a new application whose `.path` must again be
relative and in scope, so an absolute `location` passed back is
`$!.resource-scheme-unbound`.

## 6. Budgets belong to the grant

| Budget                                 | Grant field     | Exhaustion                         | Enforced by   |
| -------------------------------------- | --------------- | ---------------------------------- | ------------- |
| Request count                          | `requests`      | `$!.resource-budget requests`      | `RestGrant`   |
| Response body bytes, counted streaming | `responseBytes` | `$!.resource-budget response-size` | the transport |
| Per-request timeout                    | `timeoutMs`     | `$!.resource-transport timeout`    | the transport |
| Lifetime from grant construction       | `lifetimeMs`    | `$!.resource-budget lifetime`      | `RestGrant`   |

There are no retries, so the retry budget is zero by construction. A network
failure is `$!.resource-transport` and still spends a request. `revoke()` is a
harness operation, after which every application is `$!.resource-revoked`. These
are the harness's limits on the adapter, separate from HC-visible time budgets
(a12 §6).

## 7. Live transport: a worker behind a synchronous wait

`cli/rest-worker.ts` holds both halves. `LiveTransport`, in the main isolate,
posts each request to a worker and blocks in `Atomics.wait` on a
`SharedArrayBuffer` until the worker writes the answer and notifies; evaluation
stays synchronous. The worker holds its own copy of the grant, re-verifies URL
and headers, fetches, counts bytes while streaming, aborts past the timeout, and
appends evidence before releasing the response. One worker runs per live grant.

- **Net permission is exactly the grant hosts.** `deno task hc:rest` adds
  `--allow-net=api.github.com` to the CLI's flags. At startup `--rest` refuses a
  live grant unless `Deno.permissions.querySync` reports `net` granted for every
  live grant host and not granted for `example.invalid`. Other tasks keep no
  network permission.
- **No other network path.** `cli/no-network-path.test.ts` checks that no
  non-test source under `lib/`, and none under `cli/` except the worker,
  mentions `fetch(`, `Deno.connect`, `WebSocket`, `XMLHttpRequest`,
  `EventSource` or `new Worker`.
- **The browser harness is simulated only**, because a browser's main thread
  cannot `Atomics.wait`.

## 8. Evidence is written below the program

Every application of a REST resource, sent or refused, produces exactly one
evidence record, a JSON line:

```json
{
  "grant": "https://api.github.com/repos/TheSwanFactory/hclang/",
  "at": "2026-11-25T17:00:00.000Z",
  "method": "GET",
  "url": "https://api.github.com/repos/TheSwanFactory/hclang/issues/277",
  "outcome": "sent",
  "status": 200,
  "responseBytes": 5123,
  "refusal": null
}
```

- `outcome` is `sent` once a transport was called and `refused` before. A sent
  request that then hit a budget has `outcome: "sent"` and its `refusal`.
- `grant` is null for `resource-unbound`, which reached no grant; its record
  goes through the first grant's channel.
- `url` is null when the refusal came before a URL existed.
- No request header value is recorded.
- A live grant's worker appends synchronously before releasing the response. A
  failed append answers `$!.resource-evidence` and discards the response, so the
  system fails closed. Refusals decided in the main isolate go through the same
  worker channel.
- The evidence path must lie outside `$$.root`; the CLI refuses to start
  otherwise. The simulator records with the identical schema, in memory or to a
  file.

## 9. Simulated and live share everything but the transport

The policy is `lib/frames/rest-policy.ts`, pure functions over plain data, used
unchanged by both transports. `RestSimulator` (`lib/frames/rest-simulator.ts`)
answers from fixtures keyed by the decoded path below its base and answers 404
otherwise; it enforces the same size and timeout budgets and records every call
it receives. `LiveTransport` lives in `cli/`.

## 10. Harness configuration

`--rest <file>` (`cli/rest-config.ts`) installs grants from a JSON list. Each
names `base`, `transport` (`"live"` or a fixtures file), `requests`,
`responseBytes`, `timeoutMs`, `lifetimeMs`, `evidence`, and optionally
`requestHeaders` and `responseHeaders`. Relative paths resolve against the
file's directory. An unknown key, a bad grant, a repeated base, evidence inside
the root, or wrong net permission refuses startup before any worker starts. HC
still has no spelling that installs, replaces or enumerates an entry.

`cli/rest/github-simulated.json` and `cli/rest/github-live.json` are the same
four grants with different transports: the repository root, an `issues/` grant
with a 16-byte response budget, a `pulls/` grant with a zero request budget, and
a repository that does not exist.

## 11. The live target

The public GitHub REST API for this repository, unauthenticated:
`https://api.github.com/repos/TheSwanFactory/hclang/`. GitHub allows 60
unauthenticated requests an hour per IP, so the live run is opt-in.

## Security invariant

For an arbitrary HC program `program` evaluated with context `context`:

```text
effects(program, context)
    subset-of union(authority(frame)
                    for frame in reachable(context)
                    if frame is a constructed resource)
```

A grant's authority is the set of `GET`s to URLs under its base, within its
budgets. External authority enters HC only through grants in a table HC cannot
write; Frame application cannot create or widen authority; an HC program is a
left fold of applications; so HC execution cannot create or widen authority.

`lib/frames/rest-hostile.property.test.ts` tests it over 150 seeded hostile
programs that compose granted and ungranted literals with random request
records, aliases, mutable boxes, closures, nested scopes and repetition. It
asserts that every call a recording simulator receives is a `GET` under that
grant's base with no forbidden header, and that every application reaching the
handler produced exactly one evidence record.

## Tests

- `lib/frames/rest-policy.test.ts`: grant checks, literal identity, URL building
  and re-verification, header allowlists.
- `lib/frames/rest-handler.test.ts`: the protocol through HC, and the
  adversarial list against the simulator.
- `lib/frames/rest-hostile.property.test.ts`: the invariant.
- `cli/rest-config.test.ts`: startup refusals and the CLI install.
- `cli/rest-loopback.test.ts` (`deno task test:rest-loopback`, in `test:all` and
  in the cli row of `scripts/coverage-floor.ts`): the live worker transport
  against a loopback server, with net permission for `127.0.0.1` only.
- `cli/no-network-path.test.ts`: the static check.
- `hc/rest.hc` under `test:doc` (simulated), and `deno task test:rest-live`
  (live, opt-in, skipped when the network is unavailable or rate-limited).

## Not in the MVP

Credentials, write methods, request bodies and attenuation (#570); federation;
following redirects; binary bodies; live REST in the browser. Refusal names stay
nameable, following a12's open note rather than resolving it.
