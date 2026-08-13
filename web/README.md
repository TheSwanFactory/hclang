# Homoiconic C Web Interface

`@swanfactory/hcweb` provides the interactive Preact island used by the
[Homoiconic C](https://github.com/TheSwanFactory/hclang) playground. The same
source powers the Fresh application in this directory and the package published
to JSR.

The island loads `@swanfactory/hclang` as a normal transitive JSR dependency.
Consumers do not install hclang separately and do not need an hclang import-map
entry or CDN loader.

## Use hcweb in Fresh 2

Install the package:

```sh
deno add jsr:@swanfactory/hcweb
```

Register its public island in `vite.config.ts`:

```ts
import { fresh } from "@fresh/plugin-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    fresh({
      islandSpecifiers: ["@swanfactory/hcweb/islands/Main"],
    }),
  ],
});
```

Render the island from a route. Its scoped styles and hclang runtime are
included automatically:

```tsx
import Main from "@swanfactory/hcweb/islands/Main";

export default function Playground() {
  return <Main />;
}
```

## Develop the application

From `web/`:

```sh
deno install
deno task dev
```

Open the URL printed by Vite. `deno task dev` is long-running; stop it with
Ctrl-C.

One-shot checks:

```sh
deno task check
deno task test
deno task build
deno publish --dry-run
```

`deno task test` runs browser-component behavior tests and builds a clean Fresh
consumer fixture. The fixture deliberately maps hcweb but not hclang, proving
that consumers need no hclang configuration.

Preview the production build with:

```sh
deno task start
```

`deno task start` is also long-running and serves `_fresh/server.js`.

## Publish

The root release workflow publishes `@swanfactory/hclang` first and then hcweb
when the workspace version changes. Deno converts hcweb's bare workspace import
of `@swanfactory/hclang` into the matching JSR dependency. Do not replace it
with an `esm.sh`, HTTPS, or explicit member-level JSR mapping.

Before merging a release, run the package dry run above. JSR versions are
immutable, so the workspace must use the next available version.

## Deploy

The application is compatible with Deno Deploy's Fresh preset:

- application root: `web/`
- build command: `deno task build`
- production entry point: `_fresh/server.js`

The `static/` directory contains the BitScheme tutorial and HC white paper.
There is no standalone REPL; `/` is the only supported interactive interface.
