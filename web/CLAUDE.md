# Web Package - HC Web Interface

## Architecture

`web/` produces two things from one source: the `@swanfactory/hcweb` JSR package
and `web/dist/hcweb.html`, a single offline file distributed as a GitHub release
asset. `web/dist/index.html` is a byte-identical copy so the same output can be
served as a static site.

`Main` is the sole owner of the `HCLang` interpreter, latest output, error, and
history state. `mount.ts` is the public entry that renders it into an element.
`index.html` is the only page template; the release builder replaces its
`<!-- HCWEB_BUNDLE -->` marker with the inlined bundle.

There is no server, no SSR, and no Fresh runtime in the production path. Fresh
appears only in `tests/consumer/`, which proves the package still works as a
third-party Fresh island.

## Dependency boundary

Web source imports `@swanfactory/hclang` by its bare workspace name. Deno
resolves the local package during development and rewrites it to a JSR
dependency on publish. Never add an HTTPS, CDN, or member-level mapping.

## Commands

Run from `web/`:

```sh
deno task build     # dist/hcweb.html + checksum
deno task dev       # build, then serve dist/
deno task check
deno task test      # build + components + consumer + artifact
deno publish --dry-run
```

## Public API

- `@swanfactory/hcweb/mount` — `mountHcweb(element)`, the simplest entry
- `@swanfactory/hcweb/islands/Main` — island entry for Fresh `islandSpecifiers`
- `@swanfactory/hcweb` — components and prop types
- `@swanfactory/hcweb/styles` — the scoped style string

## Artifact invariants

The generated file must stay one HTML file with one inline script, no external
resource, and no automatic network request. It must run from `file://` offline.
Two rules are easy to break:

- Inject with a **function** replacer. String replacements expand `$$` and `$&`,
  which once corrupted HC's `$$` sentinel into `$` and broke sigil registration.
- Keep build metadata derived from the commit, not wall-clock time, so builds
  stay reproducible.

## Changes

Keep REPL state in one owner, preserve labels/keyboard/focus behavior, and when
public exports or commands change, update `README.md` and the artifact tests.
