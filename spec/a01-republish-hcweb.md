# Re-publish hcweb on Fresh 2

**Status:** Superseded in part by
[a02 — Single-file hcweb deployment](a02-hcweb-deployment.md), which replaces
the Fresh 2 application and server deployment with one offline `hcweb.html`
release artifact. The package boundary, single-owner REPL, and removal of the
static fallback below remain in force; the Fresh 2 application requirements do
not.\
**Issue:**
[#263 — Re-publish hcweb](https://github.com/TheSwanFactory/hclang/issues/263)\
**Related:** #252, #254, #257, #259, #260, #262, #276

## Overview of the Current Web Implementation

The implementation on this branch uses Fresh 2.3.3 with its Vite plugin. The
application serves `/` from `web/routes/index.tsx`, which renders the same
`web/islands/Main.tsx` exported by `@swanfactory/hcweb`. `Main` owns the
`HCLang` instance, latest result, error, and history revision. `Executor`,
`Historian`, and `Reset` provide the accessible input, history, and reset
controls. The public island embeds scoped styles from `web/styles.ts`, so a
consumer imports only hcweb and does not need a separate CSS module.

hcweb imports `@swanfactory/hclang` by its bare workspace package name. Local
builds resolve it through the Deno workspace, and publication converts that
workspace dependency to the matching JSR dependency. The application imports its
page-shell CSS through `web/client.ts`; the package does not export CSS or
application routes. `web/static/` now contains documentation assets only.

Before this branch, the executable UI was a Fresh 1.7.3 application using
`dev.ts`, `fresh.gen.ts`, `fresh.config.ts`, `$fresh/` URL imports, and Twind.
It imported hclang 0.7.2 through `esm.sh`, while the workspace was at 0.9.1. A
second file, `web/static/hclang.html`, resembled the REPL but had no script and
could not execute HC. The old test called only the interpreter and did not
exercise rendered component behavior or a production consumer build.

## Historical Workaround

The pre-migration split was the residue of a deployment workaround rather than
an intentional two-client design. #252 restored a Fresh interface. During #254,
Deno Deploy failed to resolve `$fresh/server.ts`; the project then added a
standalone CDN application using Preact, HTM, and a duplicate HC state/history
implementation, while retaining Fresh on a separate local route. #257 later
removed `/local` and renamed the standalone page to `hclang.html`. Subsequent
cleanup reduced that page to the nonfunctional mock removed by this branch.
Issue #263 summarizes the reason to revisit publication as “Now supports JSX
(and TSX?).” Fresh 2 now provides the missing supported path: its Vite plugin
configures JSX for Preact, discovers and bundles islands, separates client and
server code, and can register islands from third-party packages through
`islandSpecifiers`. Fresh 2 also generates a production server bundle during an
explicit build. These capabilities remove the reasons to maintain a CDN/HTM
fallback or checked-in generated Fresh manifests.

This historical account is evidence-based, but “workaround” should not be read
as criticism of the original implementation. The fallback was a practical
response to the deployment and package-resolution behavior available at the
time.

## Summary

Migrate hcweb from Fresh 1 to Fresh 2, establish the TSX components as the only
authoritative REPL implementation, publish those components to JSR again, and
restore deployment of the application. The package and deployed site MUST be
built from the same source components and MUST use the current workspace HC
interpreter.

The nonfunctional static REPL MUST be removed. Static documentation MAY remain,
but static assets MUST NOT present controls that appear executable when they are
not.

## Goals

1. Make the Fresh 2 TSX application the single implementation of the HC REPL.
2. Publish an importable `@swanfactory/hcweb` package whose public components
   can be rendered and hydrated by a consuming Fresh 2 application.
3. Restore a reproducible production build and deployment for the HC website.
4. Align hcweb with the workspace version of `@swanfactory/hclang` and eliminate
   the stale CDN dependency.
5. Correct the web documentation and enforce the web build in CI.
6. Preserve the current user-facing REPL behavior while making failures visible
   and recoverable.

## Non-goals

- Redesigning HC syntax, evaluation, history semantics, or the interpreter API.
- Creating a framework-neutral web-component library.
- Maintaining the old Fresh 1, HTM, or standalone-CDN implementation.
- Redesigning the documentation content in `BitScheme.html` or `hc-paper.html`.
- Requiring server-side persistence, accounts, telemetry, or collaborative
  sessions.
- Coupling package publication to a visual redesign.

## Terminology

- **hcweb package:** the JSR package named `@swanfactory/hcweb`.
- **application:** the deployable Fresh site rooted at `web/`.
- **consumer:** another Fresh 2 application importing hcweb from JSR.
- **authoritative REPL:** the sole implementation of execution and history
  behavior, composed from the TSX source under `web/`.

## Required Architecture

### Fresh 2 application

The application MUST migrate to the current Fresh 2 Vite architecture described
by the [Fresh migration guide](https://fresh.deno.dev/docs/migration-guide) and
[Vite plugin documentation](https://fresh.deno.dev/docs/advanced/vite):

- `vite.config.ts` MUST replace Fresh 1 development configuration.
- `main.ts` MUST export the Fresh `App`, enable static files, and register
  filesystem routes.
- `client.ts` MUST place browser CSS and other client assets in Vite's module
  graph.
- Development and build tasks MUST use Vite.
- Production MUST run the generated `_fresh/server.js`.
- `dev.ts`, `fresh.config.ts`, and `fresh.gen.ts` MUST be removed after
  migration.
- The Fresh 1 Twind plugin MUST be removed. Styling MAY use plain CSS or a
  Vite-compatible styling plugin, but the choice MUST be represented by direct,
  pinned dependencies and one documented asset pipeline.

Generated `_fresh/` output MUST be treated as build output, not reviewed source.
It MUST be reproducible from the lockfile and MUST NOT be the source of package
exports.

### One REPL implementation

The `/` route MUST render the same source components exported by hcweb. The
execution and history state MUST have exactly one owner. `Main` MAY remain that
owner or delegate to a dedicated hook/model, but the application MUST NOT copy
that behavior into route code, static HTML, or a deployment-only entry point.

`web/static/hclang.html` MUST be deleted. Links that target it MUST be removed
or redirected to `/`. Documentation-only static HTML MAY remain directly
addressable.

### Package boundary

`web/mod.ts` MUST remain the package entry point and MUST expose an intentional,
documented public API. At minimum, it MUST export the top-level interactive
interface. Lower-level components and their props MAY remain public when they
are useful independently; exports that rely on an undocumented parent context
MUST be made internal.

hcweb MUST import hclang only by its bare workspace package name:

```ts
import { HCLang } from "@swanfactory/hclang";
```

`web/deno.json` MUST NOT override that name with an HTTPS, `esm.sh`, or direct
JSR mapping. During local development, Deno MUST resolve the named
`@swanfactory/hclang` member through the root workspace. When hcweb is
published, Deno MUST convert that workspace reference to the corresponding JSR
dependency. The hclang version referenced by that release MUST already exist on
JSR, so the release workflow MUST publish hclang before hcweb when both versions
change.

This is a transitive runtime dependency, not a peer dependency. A consumer MUST
be able to import only `jsr:@swanfactory/hcweb` and receive hclang
automatically. The consumer MUST NOT need to install hclang separately, add an
import-map entry, configure a CDN, or pass an interpreter constructor into
hcweb. Fresh/Vite MUST resolve hclang while building the island and include it
in browser assets; the browser MUST NOT be expected to interpret or fetch a
`jsr:` specifier directly.

hcweb and hclang versions need not always be numerically identical, but the
release process MUST verify that the registry dependency generated for hcweb is
the same hclang version tested from the workspace. Before publication, an
isolated, unnamed Fresh fixture MUST map hcweb's public island but MUST NOT map,
install, or configure hclang; workspace resolution and the package dry run prove
the pre-release dependency boundary. After publication, a non-workspace fixture
MUST repeat the build against the registry package to verify the immutable
artifact.

A Fresh 2 consumer MUST be able to register the published interactive entry as a
third-party island using the Fresh Vite plugin's `islandSpecifiers` option. The
package documentation MUST show the required hcweb import and registration, but
MUST NOT require hclang configuration. Public TSX modules MUST not import
application-only routes, deployment configuration, or generated `_fresh/` files.

All new dependency versions MUST be explicit and reproducibly locked. Browser
code MUST NOT depend on runtime CDN imports.

## Observable Behavior

The deployed application and the package example MUST support the following:

1. The root page renders an HC input control, submit control, output region,
   history region, and reset control.
2. Submitting nonempty source evaluates it with the active `HCLang` instance.
3. The latest result is displayed and the interpreter's input/output history is
   rendered in execution order.
4. Reset clears interpreter state, visible output, and visible history.
5. Evaluation failure is presented in the interface without unmounting the
   island or losing the ability to reset and submit again.
6. Repeated submission MUST NOT trigger a full-page navigation.
7. Controls MUST have accessible labels, keyboard operation, and visible focus.
8. Documentation and repository links MUST resolve to real destinations; no
   placeholder `#` links may remain in the primary shell.

Exact layout, wording, and colors are not normative. The migration SHOULD avoid
unrelated visual changes so functional regressions remain easy to identify.

## Publication

`@swanfactory/hcweb` MUST be publishable with `deno publish`. Before release:

- formatting, linting, type checking, web tests, and the Fresh production build
  MUST pass;
- `deno publish --dry-run` from `web/` MUST pass;
- a clean consumer fixture MUST import every documented public export;
- the fixture MUST build after registering the remote island; and
- package files MUST exclude generated server output, caches, and unrelated
  static documentation unless explicitly included in the package contract.

The release workflow MUST publish hcweb only when its package version changes.
It MUST use the repository's existing trusted JSR publication mechanism or an
equivalent least-privilege mechanism. A failed web build or consumer check MUST
block publication. Re-running a workflow for an already published immutable
version MUST not produce a misleading successful release.

The first release satisfying this specification MUST use the next available
hcweb version; an already published version MUST NOT be overwritten.

## Deployment

The application MUST deploy from a successful Fresh production build. For Deno
Deploy, the repository/application SHOULD use the Fresh preset documented in the
[Fresh Deno Deploy guide](https://fresh.deno.dev/docs/deployment/deno-deploy),
with `web/` as the application root, `deno task build` as the build step, and
`_fresh/server.js` as the production entry point.

Deployment MUST occur only after the same commit passes CI. Pull requests SHOULD
receive preview deployments when supported. Production deployment MUST retain
the existing public hostname if project ownership and DNS are still available;
otherwise the replacement hostname MUST be documented before old links are
changed.

A post-deployment smoke check MUST verify:

- `/` returns a successful HTML response;
- the Fresh client asset for the REPL is reachable;
- one evaluation succeeds through a real browser session; and
- retained documentation assets return successful responses.

Secrets and project identifiers MUST be stored in deployment settings or GitHub
environments, not committed. Deployment permissions MUST be limited to the web
application.

## Documentation and Cleanup

`web/README.md` MUST document the supported development, build, production,
package-consumer, publish-dry-run, and deployment workflows. Every documented
path and command MUST exist. Instructions MUST not background a development
server or rely on shell job control.

The migration MUST remove:

- references to `static/index.html` and `/local`;
- the static REPL mock and any stale links to it;
- Fresh 1 configuration, generated manifests, imports, and tasks;
- the direct `esm.sh` wrapper around `@swanfactory/hclang`;
- obsolete checked-in `_fresh/` artifacts; and
- duplicate or contradictory component documentation.

The migration MUST preserve useful static documentation or explicitly record why
an asset was retired.

## Verification

The completed implementation MUST provide non-watch commands equivalent to:

```sh
deno task test:web
cd web && deno task build
cd web && deno publish --dry-run
deno task test:all
```

CI MUST run the web production build in addition to tests. Web verification MUST
cover component behavior rather than only calling the interpreter directly. At
minimum it MUST exercise successful submission, visible history, reset, error
recovery, and a production build of a consumer that registers the published or
packed island.

A manual pre-release smoke test MUST run the generated production server and
verify the root route in a browser. Long-running development and preview servers
are intentionally excluded from the one-shot command list.

## Acceptance Criteria

This specification is complete when all of the following are true:

- [x] `web/` uses Fresh 2 and has no Fresh 1 runtime or build imports.
- [x] The Fresh Vite build generates `_fresh/server.js` from a clean checkout.
- [x] `/` provides a hydrated, functional HC REPL with submit, output, history,
      reset, and recoverable error behavior.
- [x] There is exactly one implementation of REPL execution/history state.
- [x] `web/static/hclang.html` and all stale references to it are gone.
- [x] hcweb resolves the intended workspace/current JSR hclang package without
      an `esm.sh` wrapper.
- [x] The documented hcweb public API imports from an isolated consumer fixture.
- [x] A Fresh 2 consumer can register and build the hcweb island without hclang
      configuration; registry-backed verification remains a post-publish check.
- [x] `deno publish --dry-run` succeeds for `web/`.
- [x] CI tests and builds hcweb before allowing publication or deployment.
- [ ] Version 0.9.2 of hcweb is published to JSR and can be imported by version.
- [ ] The production website is deployed from the same revision and passes its
      smoke check.
- [x] `web/README.md` contains only valid routes and reproducible commands.
- [ ] Issue #263 is closed with links to the JSR release and deployed site.

## References

- [Fresh 2 migration guide](https://fresh.deno.dev/docs/migration-guide)
- [Fresh Vite plugin and third-party island configuration](https://fresh.deno.dev/docs/advanced/vite)
- [Fresh deployment on Deno Deploy](https://fresh.deno.dev/docs/deployment/deno-deploy)
- [Issue #263](https://github.com/TheSwanFactory/hclang/issues/263)
