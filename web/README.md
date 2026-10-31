# Homoiconic C Web Interface

Try the [online HC playground](https://theswanfactory.github.io/hclang/) on
GitHub Pages, or download the same application for offline use.

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
deno task build    # writes dist/hcweb.html and its checksum
deno task dev      # build, then serve dist/
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

`web/dist/` is therefore also a complete static site. The release workflow
uploads this exact directory to GitHub Pages after the released artifact passes
its tests. The online playground is at
[theswanfactory.github.io/hclang](https://theswanfactory.github.io/hclang/).
Deno Deploy is no longer used.

In the repository's **Settings → Pages → Build and deployment**, select **GitHub
Actions** as the source before merging the first Pages release. The
`github-pages` environment must allow deployments from `master`. Disconnect the
old Deno Deploy GitHub integration; removing source configuration does not
remove its connection or stop it from reporting deployment statuses on PRs.

Each patch/minor release deploys the same bytes as the GitHub release download.
The deployment job then opens the production URL in Chromium, checks its version
and source commit, and evaluates `2 + 2`. A separate **Demo availability**
workflow runs the same browser check daily and on manual dispatch, so DNS, HTTP,
and application failures surface as failed Actions runs even without a new
release. Enable GitHub Actions failure notifications to receive alerts. These
production checks run separately from the local/offline test gate: a successful
artifact build does not establish that the public hostname or site works.

Merges without a version bump do not redeploy the site. To retry a failed
release, rerun the failed workflow jobs, or dispatch **Deno CI** from `master`
with the **release** input enabled. To check availability without publishing,
dispatch **Demo availability**.

To run the production check locally:

```sh
deno task test:production
# Or check a local static server / specific deployment:
HCWEB_URL=http://localhost:8080/ deno task test:production
```

`HCWEB_EXPECTED_VERSION` and `HCWEB_EXPECTED_COMMIT` optionally require an exact
release. The check retries navigation and metadata verification for up to six
attempts to allow Pages propagation, then fails if production is still stale.

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
- `static/` — BitScheme tutorial, kept out of both `dist/` and the JSR package
- `tests/` — component, consumer, and artifact suites
