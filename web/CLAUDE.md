# Web Package - HC Web Interface

## Architecture

`web/` is both a Fresh 2 application and the source of the `@swanfactory/hcweb`
JSR package. `routes/index.tsx` renders the public `Main` island. `Main` alone
owns the `HCLang` interpreter and coordinates `Executor`, `Historian`, and
`Reset`.

There is no standalone or CDN implementation. Static HTML is documentation only.
Fresh uses Vite, with application CSS imported from `client.ts`. `_fresh/` is
generated output and must not be committed.

## Dependency boundary

Web source imports `@swanfactory/hclang` by its bare workspace name. Deno
resolves the local workspace package during development and rewrites it to JSR
metadata when hcweb is published. Do not add an HTTPS, CDN, or member-level JSR
mapping for hclang.

## Commands

Run these from `web/`:

```sh
deno task dev       # Vite development server (long-running)
deno task test      # component tests and consumer production build
deno task build     # production build
deno task start     # serve the production build (long-running)
deno publish --dry-run
```

## Public API

- `@swanfactory/hcweb` exports the documented components and prop types.
- `@swanfactory/hcweb/islands/Main` is the default interactive island entry and
  embeds its scoped styles.
- `@swanfactory/hcweb/styles` exports the style string for advanced consumers.

A Fresh consumer must register the island entry with `islandSpecifiers`. It must
not configure hclang separately.

## Changes

Keep REPL state in one owner, preserve keyboard and label accessibility, test
submit/history/reset/error recovery, and update `README.md` when changing public
exports or commands.
