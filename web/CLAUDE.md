# Web Package - HC Web Interface

## Architecture

`web/` produces two things from one source: the `@swanfactory/hcweb` JSR package
and `web/dist/hcweb.html`, a single offline file distributed as a GitHub release
asset. `web/dist/index.html` is a byte-identical copy so the same output can be
served on [GitHub Pages](https://theswanfactory.github.io/hclang/). The release
workflow publishes the tested release output, without another build. Deno Deploy
is no longer configured.

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
deno task test      # build + components + consumer + offline artifact
deno task test:production # live GitHub Pages browser smoke test
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

The `hc/` files ship inside the bundle too: `HCLang` serves them from
compiled-in source, so `Figures <- './hc/figures.hc'` works offline, and
`tests/standalone-browser.test.ts` submits it through the UI.

## Changes

Keep REPL state in one owner, preserve labels/keyboard/focus behavior, and when
public exports or commands change, update `README.md` and the artifact tests.

## Hosting and monitoring

`.github/workflows/deno.js.yml` publishes the site only after a version-bump
release succeeds. Its `pages` job deploys `web/dist/` through the `github-pages`
environment, then runs `tests/production.test.ts` against the deployment URL.
The check requires the expected version and source commit, evaluates `2 + 2`,
and fails on HTTP or browser errors. Navigation and metadata checks retry for
Pages propagation.

`.github/workflows/demo-availability.yml` runs the same browser check daily and
on manual dispatch. It checks the public Pages URL without requiring the current
workspace version, since `master` can contain unreleased changes. Production
checks require network access and stay outside the local/offline test gate.

`HCWEB_URL` overrides the URL for local static-server checks;
`HCWEB_EXPECTED_VERSION` and `HCWEB_EXPECTED_COMMIT` optionally require an exact
release. See [the web README](README.md#how-the-release-artifact-is-built) for
Pages setup, removal of the old Deno integration, and failure notifications.
