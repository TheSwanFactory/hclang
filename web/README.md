# Homoiconic C Web Interface

Two products live here:

- **`hcweb.html`** — a single self-contained file that runs the HC playground
  offline. Download it from the
  [latest release](https://github.com/TheSwanFactory/hclang/releases/latest/download/hcweb.html),
  then open it in a browser. No install, no server, no network.
- **`@swanfactory/hcweb`** — the Preact components on JSR, for embedding the
  playground in your own site.

The package loads `@swanfactory/hclang` as a normal transitive JSR dependency.
Consumers never install or configure hclang.

## Use the package

```sh
deno add jsr:@swanfactory/hcweb
```

Mount it into any element:

```ts
import { mountHcweb } from "@swanfactory/hcweb/mount";

mountHcweb(document.getElementById("hcweb-root")!);
```

Fresh 2 consumers can register the island directly instead:

```ts
fresh({ islandSpecifiers: ["@swanfactory/hcweb/islands/Main"] });
```

Either way the component embeds its own scoped styles, so no stylesheet import
is required.

## Build and test locally

From `web/`:

```sh
deno task build    # writes ../dist/hcweb.html and its checksum
deno task dev      # build, then serve ../dist
deno task check    # format, lint, type check
deno task test     # build, component, consumer, and artifact tests
deno publish --dry-run
```

`deno task test` runs three layers: jsdom component behavior, a Fresh consumer
production build, and the generated artifact itself. The artifact tests open
`dist/hcweb.html` through a real `file://` URL in offline Chromium and fail on
any network request. They need a browser once:

```sh
deno run -A npm:playwright@1.62.0 install chromium
```

## How the release artifact is built

`scripts/build-hcweb.ts` bundles the playground into `web/index.html`:

1. Generate an entry that imports `mountHcweb`.
2. `deno bundle --platform=browser --format=iife --minify` it into one script.
3. Inline that script into the committed template and fill in version, commit,
   and build metadata.
4. Write `dist/hcweb.html`, a byte-identical `dist/index.html`, and
   `dist/hcweb.html.sha256`.

`dist/` is therefore also a complete static site. Deno Deploy is configured from
the root `deno.json` `deploy` key to build `deno task build:web` and serve
`dist/` statically, which mirrors the artifact at a URL without adding a server.
Only the app directory is set in the Deno Deploy dashboard, and it must be the
repository root.

For a release, CI publishes to JSR first, then rebuilds with
`--jsr-version <version>` so the entry imports the exact published
`jsr:@swanfactory/hcweb@<version>`. The builder resolves that graph in a
temporary directory outside the workspace and fails if any local source leaks
in. JSR is the build-time provenance; the artifact itself contacts nothing at
runtime.

Version numbers are locked across the workspace, so publish hclang before hcweb.
JSR versions are immutable, so a release needs the next version.

## Layout

- `index.html` — the one page template used by dev and release builds
- `mount.ts` — public mount entry
- `islands/` — `Main` owns interpreter, output, history, and reset state
- `styles.ts` — scoped component CSS embedded by `Main`
- `static/` — BitScheme tutorial and HC white paper
- `tests/` — component, consumer, and artifact suites
