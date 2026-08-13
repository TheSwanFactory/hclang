# Single-file hcweb deployment

**Status:** Proposed\
**Scope:** Production distribution of the hcweb playground\
**Related:** [a01 — Re-publish hcweb on Fresh 2](a01-republish-hcweb.md),
[#263 — Re-publish hcweb](https://github.com/TheSwanFactory/hclang/issues/263)

## Decision

Distribute hcweb as one self-contained `hcweb.html` GitHub release asset. A
recipient MUST be able to save or receive that file, double-click it, and use
the HC playground in a current browser without installing Deno, running a
server, or connecting to the internet.

The release workflow MUST build the file _after_ publishing hcweb to JSR. The
build entry MUST import the exact released version of `jsr:@swanfactory/hcweb`,
and Deno MUST bundle hcweb, its transitive hclang runtime, Preact, signals, and
all styles into the file. "Built from JSR" is a build-time provenance rule; an
offline artifact cannot pull from JSR at runtime.

Use Deno's built-in browser bundler plus a small repository-owned injection
script. Do not make Fresh, server-side rendering, Vite, a CDN, or a third-party
single-file plugin part of the production artifact pipeline.

The same committed HTML template MUST be used for local development and release
output. Development tooling MAY replace or serve the template's marked entry
script, but it MUST NOT maintain a second page implementation.

## Current state and CI finding

The current branch builds a Fresh server bundle and deploys it, even though the
playground has no request handlers, server state, or server-only APIs. Its HC
evaluation is entirely browser-side. Fresh is therefore not required by the
production behavior.

The repository has one workflow, `.github/workflows/deno.js.yml`. On a version
bump it publishes JSR packages and invokes `ncipollo/release-action`, but it
does not pass any artifact paths. The `v0.9.1` and `v0.9.0` GitHub releases both
have empty asset lists as of 2026-08-13. CI does **not** currently create or
retain a downloadable web application.

## Product contract

The normative artifact is a regular HTML file, not a directory, archive,
installer, hosted application, or source checkout. It MUST:

1. Open from a `file://` URL in current Chrome, Firefox, and Safari.
2. Render the HC source editor, submit action, output, history, and reset
   action.
3. Evaluate HC and recover from diagnostics without a network connection.
4. Contain all executable JavaScript and required CSS inline.
5. Make no automatic HTTP, JSR, npm, CDN, font, image, telemetry, or API
   request.
6. Contain no external module import, dynamic import, worker, service worker,
   source map, stylesheet link, or script `src`.
7. Identify the hcweb version, hclang version, source commit, and build date in
   visible or machine-readable metadata.
8. Remain useful when documentation links cannot be reached; links MAY open
   online documentation only after an explicit user action.

"Email the file" means sending it as an attachment that the recipient saves and
opens in a browser. Rendering inside an email client is not supported: mail
clients commonly disable active HTML, and some gateways may block `.html`
attachments. The release download link is the preferred fallback, and an
optional ZIP containing the same single file MAY be provided for restrictive
mail systems.

## Recommended architecture

### One HTML template

Add a framework-neutral template, for example
`web/standalone/hcweb.template.html`, containing:

- semantic page structure and the mount element;
- page-shell CSS in one inline `<style>` element;
- release metadata placeholders;
- ordinary documentation and project links; and
- one uniquely marked development entry script.

The template MUST NOT contain HC execution logic. The release builder replaces
the marked entry script with the bundled release script and fills metadata. It
MUST fail if the marker is missing or occurs more than once.

The existing `Main` component remains the one owner of interpreter, output,
error, and history state. Its embedded `HCWEB_STYLES` remains the component
style source. The template supplies only page-shell styling.

### A trivial package mount API

Add a public package export such as `@swanfactory/hcweb/mount`:

```ts
export function mountHcweb(element: HTMLElement): void;
```

That module owns the Preact `render()` call and renders `Main`. The standalone
entry then has one dependency and does not need to coordinate Preact versions,
JSX configuration, constructors, CSS, or hclang imports. The package continues
to expose `Main` for framework consumers.

### Isolated release entry

The release builder MUST create its entry and lock in a temporary directory
outside the repository workspace. Its only application import MUST be the exact
published package version, conceptually:

```ts
import { mountHcweb } from "jsr:@swanfactory/hcweb@0.9.2/mount";

const root = document.getElementById("hcweb-root");
if (!(root instanceof HTMLElement)) throw new Error("Missing hcweb root");
mountHcweb(root);
```

The version is generated from the validated release version; it is not hardcoded
independently. Building outside the workspace and with `--no-config` prevents
Deno from silently substituting local `web/` or `lib/` sources. The builder MUST
inspect `deno info --json` for the generated entry and reject local-file
resolutions for hcweb or hclang.

hcweb's published metadata MUST reference the exact hclang release tested by the
repository. hclang remains a transitive dependency: the release entry MUST NOT
import, map, or configure hclang separately.

### Bundle and inject

Use the Deno version pinned by CI to produce one browser IIFE:

```sh
deno bundle --no-config --platform=browser --format=iife --minify \
  --lock=<temporary-lock> <release-entry> --output <temporary-bundle>
```

A small first-party Deno script then:

1. reads the committed template and generated JavaScript;
2. escapes any literal `</script` sequence in the bundle;
3. replaces the one marked development script with one inline classic script;
4. inserts version, commit, and build metadata;
5. writes `dist/hcweb.html` atomically; and
6. computes `dist/hcweb.html.sha256`.

The build MUST emit no source map or secondary runtime file. The generated lock
and temporary JavaScript are provenance inputs, not runtime deliverables. They
MAY be retained as workflow artifacts for diagnosis, but the HTML file remains
the complete application.

Deno's bundler is preferred because it resolves JSR directly, targets browsers,
bundles package dependencies, and emits one JavaScript file. The repository
already pins Deno in CI, so this adds no production framework and no new
third-party build plugin.

### Local development from the same template

A development entry MAY import `mountHcweb` from local package source, and a
lightweight development server MAY transform TypeScript and refresh changes. The
browser MUST still receive `web/standalone/hcweb.template.html`; there MUST not
be a separate dev-only DOM shell. Development convenience is non-normative.

## Release workflow

Keep package publication and artifact production in one ordered release job:

1. Install from the committed root lock and run formatting, lint, type checks,
   package tests, and component tests.
2. Build a candidate standalone file from workspace source using the production
   template and injection path. This catches template and bundling failures on
   pull requests before a version exists on JSR.
3. On a `master` version bump, publish `@swanfactory/hclang` and then
   `@swanfactory/hcweb`.
4. Confirm the exact hcweb version is readable from JSR. Retry only bounded
   registry-propagation failures; never substitute workspace source.
5. In an isolated temporary directory, build `dist/hcweb.html` from the exact
   JSR hcweb version.
6. Run all structural and real-browser artifact checks with networking disabled.
7. Create the GitHub release and attach `hcweb.html` and `hcweb.html.sha256`.
   Artifact read or upload errors MUST fail the release.

The existing `ncipollo/release-action` supports release assets through its
`artifacts` input, so a second upload action is unnecessary. The action SHOULD
be pinned to a reviewed commit rather than only a moving major tag.

The asset filename SHOULD remain `hcweb.html` on every release. The containing
release and embedded metadata provide the version. This enables both:

- immutable version link:
  `https://github.com/TheSwanFactory/hclang/releases/download/vX.Y.Z/hcweb.html`;
- moving latest link:
  `https://github.com/TheSwanFactory/hclang/releases/latest/download/hcweb.html`.

GitHub Actions run artifacts are not the primary distribution channel: they are
workflow-scoped and retention-limited. GitHub release assets are public,
versioned distribution objects and are already part of this repository's release
model.

A hosted copy is optional. If GitHub Pages or another static host is later
wanted, it MUST publish the exact verified `hcweb.html` bytes as `index.html`
after release. It MUST not rebuild from source or become the authoritative
artifact.

## Verification

### Structural checks

CI MUST parse the completed HTML and assert:

- `dist/` contains exactly `hcweb.html` plus the optional checksum sidecar;
- the file contains exactly one executable inline script;
- no executable script has `src` and no stylesheet has external `href`;
- no `import` statement or dynamic `import()` remains in emitted JavaScript;
- no `http:`, `https:`, `jsr:`, or `npm:` URL is used by an automatically loaded
  resource;
- no output refers to `_fresh`, Fresh runtime, Vite runtime, localhost, or a
  workspace filesystem path;
- release metadata matches the tag, package versions, and commit; and
- a second build from the same inputs is byte-identical, excluding no fields.

Use a deterministic UTC build timestamp derived from the commit or release
metadata so reproducibility is not defeated by wall-clock time.

### Browser checks

A real headless browser MUST open the artifact through a `file://` URL while the
browser context is offline. The test MUST verify:

1. the page mounts without console errors or failed requests;
2. `2 + 2` produces `4` and a visible history row;
3. an invalid HC expression produces a visible diagnostic;
4. a valid expression succeeds after that diagnostic;
5. reset clears output and history; and
6. keyboard submission, labels, focus indicators, and live result/error regions
   remain usable.

Run the test in Chromium on every pull request and release. Before declaring the
first release complete, manually smoke-test the downloaded release asset in
current Chrome, Firefox, and Safari on macOS. Cross-browser automation MAY be
added later, but the `file://` contract is not satisfied by testing through an
HTTP server.

The release test SHOULD intercept all network attempts and fail on any request,
rather than merely running with the network unavailable. This detects accidental
telemetry, fonts, CDN imports, or lazy chunks.

## Security and privacy

The artifact executes code when opened and MUST be treated as software, not as a
passive document. It MUST:

- contain no telemetry, persistence, cookies, remote storage, or automatic
  update mechanism;
- perform no network access unless a user explicitly follows an ordinary link;
- avoid reading arbitrary local files;
- display its version and source/release URL;
- publish a SHA-256 checksum beside the asset; and
- retain the repository license and attribution in metadata or an About section.

A generated Content Security Policy MAY further forbid network connections. It
must be generated from the final inline script and tested under `file://`; a
handwritten policy that blocks Preact's embedded style element is not
acceptable.

## Documentation

The root README and `web/README.md` SHOULD lead with two production actions:

1. download `hcweb.html` from the latest release; and
2. open it directly in a browser.

They MUST distinguish package installation from application distribution:

- JSR is the source and provenance of the code bundled at release time;
- the GitHub release asset is the runnable offline application; and
- no registry, CDN, Deno process, or web server is contacted at runtime.

The release notes SHOULD include the immutable asset URL, latest-download URL,
checksum, hcweb version, hclang version, and source commit.

## Acceptance criteria

- [ ] One committed static HTML template defines both development and release
      page structure.
- [ ] hcweb exports a trivial mount entry that owns Preact mounting and hclang
      remains transitive.
- [ ] Pull requests build and test a workspace-source candidate artifact.
- [ ] Release builds occur only after hcweb and hclang publication succeeds.
- [ ] The release entry resolves exact JSR hcweb and no local workspace package.
- [ ] `hcweb.html` is the only required runtime file.
- [ ] The downloaded file runs through `file://` with networking disabled.
- [ ] Submit, output, history, diagnostics, recovery, and reset pass in a real
      browser.
- [ ] The artifact contains no server, Fresh runtime, CDN import, external
      asset, lazy chunk, or automatic network request.
- [ ] GitHub releases attach `hcweb.html` and its SHA-256 checksum.
- [ ] Immutable and latest-download links are documented.
- [ ] A downloaded release asset passes manual Chrome, Firefox, and Safari smoke
      tests.

## Appendix A: viable alternatives not selected

### Fresh server deployment

Fresh already works on the current branch and provides routing, SSR, islands,
error pages, previews, and Deno Deploy integration. It is the right choice when
the application needs server handlers, per-request rendering, sessions, private
configuration, or multiple dynamic routes.

It is not selected because hcweb needs none of those capabilities. A recipient
cannot email or double-click `_fresh/server.js`; production requires a Deno
process and host. The server also obscures whether the released JSR artifact
actually works because the workspace build resolves local package source.

### Fresh static generation

A prerendered Fresh page could remove the runtime server while retaining Fresh's
component conventions. It remains useful for a multi-page documentation site
that wants islands and route generation.

It is not selected because Fresh's normal production model emits a server and
client asset graph, while third-party prerendering still leaves a multi-file
site unless followed by another inlining step. For one offline file, it adds an
intermediate framework without solving the distribution requirement.

### Ordinary Vite static build

Plain Vite with Preact is a sound choice for a hosted static site. It offers a
fast development server, JSX transformation, tree shaking, cache-friendly hashed
assets, and broad plugin support.

It is not the production recommendation because its normal output is an HTML
file plus module and CSS assets. Those module fetches are problematic under
`file://`, and emailing the HTML alone would be incomplete. Vite MAY still serve
the shared template during development.

### Vite plus `vite-plugin-singlefile`

The maintained plugin can inline Vite's JavaScript and CSS into one HTML file
and is explicitly designed for single-entry applications. It is a credible
fallback if Deno's built-in bundler cannot process a future hcweb dependency.

It is not selected now because Deno already resolves JSR and emits a browser
bundle directly. A repository-owned template injector is small, auditable, and
avoids another plugin whose asset and multi-entry limitations must be tracked.
If adopted later, pin the plugin exactly and retain every structural and
`file://` browser test in this specification.

### Runtime CDN or `esm.sh` imports

A tiny HTML file can import Preact and hcweb through a browser-compatible CDN.
That is attractive for demos that are always online and must always load a named
remote version.

It is not selected because the requested file must work offline. Browsers do not
resolve `jsr:` directly, local module loading has `file://` security
constraints, and a CDN introduces availability, version-drift, privacy, and
supply-chain behavior at every page open. The repository's former CDN page also
demonstrated how easily the web UI can remain pinned to an obsolete hclang
release.

### Import JSR directly in the browser

JSR is a package registry for runtimes and bundlers, not a browser
URL/import-map scheme. The package is TypeScript/ESM and has transitive package
specifiers that must be resolved before an offline browser can execute it.

It is not viable as a runtime deployment. This specification still uses JSR as
the authoritative release input, but resolves and bundles it in CI.

### GitHub Pages or Deno Deploy as the only distribution

Either can provide a convenient clickable URL, and Pages is especially suitable
for static content. A hosted mirror of the verified artifact is compatible with
this design.

Hosting alone is not selected as the authoritative product because it does not
produce an emailable offline file and can change independently of a recipient's
copy. If a mirror is added, it must deploy the release asset bytes rather than
perform another build.

### GitHub Actions workflow artifact

`actions/upload-artifact` is useful for pull-request previews, debugging, and
retaining candidate output. It can carry the candidate HTML before a release.

It is not selected for production distribution because workflow artifacts have
retention and access semantics tied to Actions runs. A GitHub release asset has
the stable versioned and latest-download URLs needed here.

### Installable PWA

A PWA could cache an online application for later offline use and support an app
icon and updates. It is appropriate when installation and managed updates are
more important than file portability.

It is not selected because initial installation requires a secure hosted origin,
service workers do not provide the desired `file://` behavior, and the result is
not one attachment.

### Rewrite as vanilla DOM code or a custom element

Removing Preact could reduce framework bytes and a custom element could offer a
framework-neutral embedding API. Both are technically viable.

They are not selected because Preact is already the package's tested rendering
model, the resulting bundle is small, and framework removal would create a new
UI implementation without improving the one-file contract. Reconsider only if
measured artifact size or embedding requirements justify the migration.

### Manually maintained executable HTML

Hand-writing all JavaScript into the HTML would create one file with no build
step.

It is not selected because it would duplicate the package implementation, evade
JSR provenance and type checking, and recreate the maintenance failure this work
is intended to remove. The HTML is a generated release artifact; the template
and package remain reviewed source.

## References

- [Deno bundling](https://docs.deno.com/runtime/reference/bundling/)
- [GitHub release download links](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases)
- [`ncipollo/release-action`](https://github.com/ncipollo/release-action)
- [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)
- [MDN JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)

External documentation was summarized and rephrased for compliance with
licensing restrictions.
