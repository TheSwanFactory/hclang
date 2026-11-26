#!/usr/bin/env hc
```
A REST resource: reading public resources (#277)
This testdoc is the executable acceptance corpus for the REST resource MVP, and
`spec/a20-rest-resource.md` is its design record. The same file, byte for
byte, runs against two grant tables. `test:doc` installs simulated grants from
`cli/rest/github-simulated.json`, and `deno task test:rest-live` installs the
live grants in `cli/rest/github-live.json`, which read the public GitHub REST
API with no credential. Every claim below answers the same against both.
A REST resource is a handler table entry, reached by writing its base URI as
a resource literal. The harness holds grants, each with a base. A literal must
equal a grant's base exactly, trailing slash included, so the program is the
manifest: its external surface is the set of `'https://…'` literals it writes
```
; .api 'https://api.github.com/repos/TheSwanFactory/hclang/';
```
Application is one `GET`, and it answers a response record. Every request key
is optional:
- `.path`, a string: a relative reference, normalized by the same rule as a
  root-relative resource path. A trailing slash the path was written with is
  kept. An absent or empty path requests the base with its trailing slash
  removed.
- `.query`, a record of strings, encoded with `URLSearchParams`.
- `.headers`, a record of strings, whose names are case-folded and must be on
  the grant's allowlist: `accept`, `accept-language`, `if-none-match` and
  `if-modified-since` by default.
The response holds `.status`, a Count, `.headers`, a record of the allowlisted
response headers only (`content-type`, `content-length`, `etag`,
`last-modified`, `link`, `location`, `retry-after`), and `.body`, the response
decoded as UTF-8. Parsing the body is the receiver's job
```
; (api [.path “issues/277”]).status
# 200
; (api [.path “issues/277”, .headers [.accept “application/vnd.github+json”]]).headers.content-type
# “application/json; charset=utf-8”
```
Any status is ordinary data rather than a refusal, so a missing issue is a
response like any other, and so is a redirect, which is never followed
```
; (api [.path “issues/999999999”]).status
# 404
```
A read through the enumerable protocol is a `GET` of the base, answered as
characters. There, and only there, a 404 is `$!.resource-absent`, and any
other status outside 2xx is `$!.resource-status` with its code
```
; 'https://api.github.com/repos/TheSwanFactory/hclang-absent-277/' | “”
# $!.resource-absent 'https://api.github.com/repos/TheSwanFactory/hclang-absent-277/'
```
Identity is the URI. A literal that names no grant answers
`$!.resource-unbound`, whether it is another origin or a sub-path of a grant.
The relative path travels in the request, never in the literal, and writing
the same literal twice yields the same grant twice, not new authority
```
; 'https://example.com/' [.path “x”]
# $!.resource-unbound 'https://example.com/'
; 'https://api.github.com/repos/TheSwanFactory/hclang/issues/277/' [.path “”]
# $!.resource-unbound 'https://api.github.com/repos/TheSwanFactory/hclang/issues/277/'
; 'https://api.github.com/repos/TheSwanFactory/' | “”
# $!.resource-unbound 'https://api.github.com/repos/TheSwanFactory/'
```
The base is spelled exactly, so a grep for it finds every use. A spelling that
only normalizes to it names no grant
```
; 'https://API.github.com/repos/TheSwanFactory/hclang/' | “”
# $!.resource-unbound 'https://API.github.com/repos/TheSwanFactory/hclang/'
; 'https://api.github.com/repos/TheSwanFactory/hclang/x/../' | “”
# $!.resource-unbound 'https://api.github.com/repos/TheSwanFactory/hclang/x/../'
```
The path cannot leave the base. Every refusal of the root-relative path rule
applies unchanged, and a path that names a scheme, an authority, a query or a
fragment is refused, so an absolute `location` from a redirect cannot be
followed by passing it back
```
; api [.path “../hclang-other”]
# $!.resource-parent-escape 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.path “%2e%2e/hclang-other”]
# $!.resource-encoded-separator 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.path “issues%2F277”]
# $!.resource-encoded-separator 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.path “//example.com/x”]
# $!.resource-authority-unbound 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.path “https://example.com/x”]
# $!.resource-scheme-unbound 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.path “issues?state=open”]
# $!.resource-part-unsupported 'https://api.github.com/repos/TheSwanFactory/hclang/'
```
The MVP sends public `GET`s only. Any key outside `.path`, `.query` and
`.headers`, including `.method` and `.body`, answers
`$!.resource-request-shape`, and so does applying the resource to anything but
a record: unlike a store-backed resource, applying a string is not a write
```
; api [.method “DELETE”]
# $!.resource-request-shape 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.body “{}”]
# $!.resource-request-shape 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api “a string is not a request”
# $!.resource-request-shape 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.path 277]
# $!.resource-request-shape 'https://api.github.com/repos/TheSwanFactory/hclang/'
```
A program cannot supply a credential or redirect a request: a header outside
the allowlist answers `$!.resource-header-forbidden`, and `authorization`,
`cookie`, `host` and `proxy-*` are headers no grant may allow
```
; api [.headers [.authorization “token stolen”]]
# $!.resource-header-forbidden 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.headers [.cookie “session=1”]]
# $!.resource-header-forbidden 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.headers [.host “example.com”]]
# $!.resource-header-forbidden 'https://api.github.com/repos/TheSwanFactory/hclang/'
```
A header value must be one `fetch` can send, so a character above U+00FF is
refused before any request is spent, and so is a name written twice, so the
answer never depends on key order
```
; api [.headers [.accept “€”]]
# $!.resource-header-forbidden 'https://api.github.com/repos/TheSwanFactory/hclang/'
; api [.headers [.Accept “a”, .accept “b”]]
# $!.resource-header-forbidden 'https://api.github.com/repos/TheSwanFactory/hclang/'
```
Budgets belong to the grant, and the harness sets them. This grant allows no
requests at all, and the issues grant allows sixteen response bytes, which no
issue fits in
```
; 'https://api.github.com/repos/TheSwanFactory/hclang/pulls/' [.path “1”]
# $!.resource-budget requests 'https://api.github.com/repos/TheSwanFactory/hclang/pulls/'
; 'https://api.github.com/repos/TheSwanFactory/hclang/issues/' [.path “277”]
# $!.resource-budget response-size 'https://api.github.com/repos/TheSwanFactory/hclang/issues/'
```
Every application above, sent or refused, wrote exactly one evidence record
to its grant's `evidence` file, outside the program's root, where no HC value
can reach it
```
