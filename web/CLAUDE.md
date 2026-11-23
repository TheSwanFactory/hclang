# Web Package - HC Web Interface

Architecture, commands and hosting are in [the web README](README.md).

## Dependency boundary

Web source imports `@swanfactory/hclang` by its bare workspace name. Deno
resolves the local package during development and rewrites it to a JSR
dependency on publish. Never add an HTTPS, CDN, or member-level mapping.

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
