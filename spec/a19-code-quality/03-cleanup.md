# Code Quality Cleanup: Steps 14–17

**Covers:** steps 14–17 of the [plan](README.md): docs, records and experiments,
tooling, and the close-out.\
**Status:** In progress.\
**Base:** `c00d910`, the head of #514.\
**Head:** the commit that completes this document.

Each entry uses the ID of its finding in the [audit](01-audit.md) or names an
item from the [refactor](02-refactor.md)'s "Left for cleanup", and acts on the
disposition the audit's Approval settled. An entry gives what was done, the
files and the commit, or why something was not done. Commits are on the
`code-quality-cleanup` branch.

## Step 14: Docs

Lane A, branch `code-quality-cleanup-docs` off `c00d910`, merged in `b40d1fc`.

**7.2** Root `CLAUDE.md`: hosts lay the `hc/*.hc` files over the root and the
package ships every `hc/*.hc` file; two bundled classes load without a root, the
Denum that `.###` answers and the RotorRouter, through
`lib/execute/class-prologue.ts`; Code Organization keeps only "Keep lib/
independent of cli/ and web/"; evaluation goes in a Frame's `in` and `call` or
`lib/ops`; an operation is an `ICurryFunction` registered in the `Ops` table in
`lib/ops.ts`; a Frame type implements `toString()` plus `toStringData()` or
`toStringArray()`; the bump paragraph names "every manifest that carries the
version" instead of five `deno.json` files. The bundle regeneration lines are
true after 7.3 (step 16). Files: `CLAUDE.md`. Commit: `6bf4ea4`.

**6.2** The testing rule in `CLAUDE.md` now reads, as approved: "Each module
needs tests: a sibling `<name>.test.ts`, or a feature test that the coverage
report shows covering it." "Aim for high coverage" became "Keep each package at
or above its line-coverage floor, which CI checks with
`deno task coverage:check`". Files: `CLAUDE.md`. Commit: `6bf4ea4`.

**7.1** `lib/frames/CLAUDE.md`: `setParent` is the only path that attaches a
parent, and copies (`FrameArray.in`, `Frame.copy()`) carry the source's link;
`resource-reference.ts` decides every reference refusal and the stores decide
their own. Commit: `8a523c6`. `doc/ARCHITECTURE.md`: a paragraph in Operations
on the structural meaning of `+`, `-`, `*`, `/`, `|&|` and `&|&`, linking
`doc/FRAME-DENUM.md`, `doc/native-cart-zip.md` and `spec/foist-19a/README.md`;
the Figures `gap`/`spin` example dropped; the Resource Imports paragraph names
both prologues and `class-prologue.ts`, with `.###` constructing the Denum and
`.####` reading KD coordinates from it; "every reference refusal", with the two
stores named; the `setParent` wording as in `lib/frames/CLAUDE.md`; declared
observation is `#` or `##` only, every answer a Count, `.###` the raw Denum and
`.####` derived from it. Two more stale phrases in that paragraph were fixed
with it: "observes as 0, 1, 0" (the third value was the retired residual) became
"Count 0 and Size 1", and "a stored nonempty list of Counts" became "a stored
list" (`storedLoads` in `fourth-hash.ts` accepts the empty list). A grep for the
moved or deleted names (`lib/maml.ts`, `hc-log`, `execute/sigilizer`,
`contextEqual`, `isAlphabetic`, `Frame.signed`, `quantityOperator`, `flatten`,
`script-spec`, `lib/index.ts`, `DENUM_CLASS`, `ROUTER_SOURCE`) found none beyond
the cited lines. Files: `lib/frames/CLAUDE.md`, `doc/ARCHITECTURE.md`. Commit:
`bcd6645`. `lib/frames/frame.ts:95`, the `parent` field's comment, still says
"It is written only by setParent"; the file was outside lane A, so step 17 fixes
or files it.

**02, traversal** `lib/frames/CLAUDE.md` says the private `MetaFrame.traverse`,
with `walk`, owns the traversal and its cycle guard, and `get` and `resolve` go
through it. The specialization sentence stays. Files: `lib/frames/CLAUDE.md`.
Commit: `8a523c6`.

**7.4** `cli/CLAUDE.md`: the two exception names became "The legacy exceptions
are listed in `cli/test-docs.ts`", and "Only the clock is bound…" is gone; the
`getHandlers()` sentence stays. `web/CLAUDE.md`: the Architecture, Commands and
Hosting and monitoring sections are gone; the title, Dependency boundary,
Artifact invariants (with its `hc/` paragraph) and Changes stay, with one line
pointing to `web/README.md`. Files: `cli/CLAUDE.md`, `web/CLAUDE.md`. Commit:
`c0c5eda`.

**6.12** `cli/CLAUDE.md`'s testdoc section: after a change that adds, removes or
un-implements a claim in a bundled testdoc, run
`cd cli && deno task testdoc:summaries` and commit the regenerated
`cli/testdoc-summaries.json`, which `cli/hc.test.ts` reads. Files:
`cli/CLAUDE.md`. Commit: `c0c5eda`.

**02, ARCH** In `doc/ARCHITECTURE.md`, `declaredMethod` became
`methodDeclaredBy` in `lib/frames/declared-protocol.ts`, `OBSERVATION_KEYS` is
cited there, and `HCLang.makeHost` became `hostNamespace` in
`lib/execute/host-namespace.ts`, shared by the CLI and `HCLang`. Files:
`doc/ARCHITECTURE.md`. Commit: `bcd6645`.

**3.19** `doc/GRAMMAR.md` "Size and Denum": `.###` is the raw Denum (Count and
each child's Size as loads, `[]` and `<>` the empty Denum, `()` nil), `.####` KD
coordinates read from it, with the `[3, 1]` and `[3, 1, 5]` examples from
`doc/FRAME-DENUM.md`; an aggregate declares only `.#` and `.##`; the residual,
the `.#%` binding with its `$!.denum-binding-*` errors and the geometric
observers are gone, and the retired `#%` spellings are unbound names. The
tokenization rules stay. Each example value was checked with `cli/hc.ts -e`.
`doc/LANGUAGE.md`: the `Figures.gap` example lines are dropped (the import line
stays); the Figures, residual, `gap`/`spin` and Star passages (`:600-666`)
became one paragraph on `.###`, `.####`, Flop and Cart with links to
FRAME-DENUM, native-cart-zip and foist-19a, plus a line saying FOIST 19a
(v0.54.0) retired them; in `:667-737` the heading drops "and signed residual",
"residual is nil" is gone, and the `.###` residual paragraph became two
sentences on the raw Denum. The `pure` migration recipe (`x.### ? {<>} : {()}`)
went with it, because it relied on the residual. `hc/apply.hc:334-338`, prose
only: `.###` the raw Denum and `.####` KD coordinates. `deno task test:doc`
executed 21 testdocs with 0 failed, and `deno task test:cli` passed 10 (73
steps), so the summaries table still matches. Files: `doc/GRAMMAR.md`,
`doc/LANGUAGE.md`, `hc/apply.hc`. Commit: `76aded9`.

**7.7** `lib/README.md:79-82` drops "(`gap` and `spin`)"; the import sentence
stays. `hc/BitScheme.hc:256` now says "current HC uses `&` for map and `|` for
reduce" (`lib/ops.ts`: `"&": MapElements`, `"|": ReduceElements`). Prose only;
BitScheme's totals are unchanged. Files: `lib/README.md`, `hc/BitScheme.hc`.
Commit: `76aded9`.

**7.6** `README.md:24`: Web is "the offline `hcweb.html` playground and the
`@swanfactory/hcweb` component". The task table adds `test:all`, `test:scripts`,
`test:observer-algebras`, `test:classical-cd`, `test:compiled`,
`test:load-order`, `check` and `coverage:check`; after the merge each of these
tasks exists in the root `deno.json`, and `check` type-checks, checks the README
code blocks and runs `deno doc --lint`, as its row says. Setup step 3 describes
`deno task setup` and `deno-hooks.yml` (pre-commit fmt and lint on staged files,
pre-push `deno task test:all`) instead of Python pre-commit. The type-check
advice points at `deno task check`. Project Structure adds `hc/`, `scripts/`,
`spec/`, `experiments/` and `vscode-extension/`, names the four packages, and
describes `doc/` and `deno.json` as documentation and workspace configuration.
Files: `README.md`. Commit: `e4b20bf`.

**02, JSDoc** `FrameScoped.call`'s JSDoc in `lib/frames/frame-expr.ts` now says
it "Sizes as its term does, `.#`, `.##`, `.###` and `.####`; anything else is
applied." Comment only: `sizeOperatorKey` covers `Frame.SIZE_OPERATORS`, which
includes `kKD_COORDINATES`. Files: `lib/frames/frame-expr.ts`. Commit:
`ed1f4b5`.

**8.10, the README fragment** `web/README.md`'s Fresh fragment now starts with
`import { fresh } from "jsr:@fresh/plugin-vite@1.1.2";`. It landed in lane C,
because step 16's `check` type-checks the README blocks; see 8.10 under step 16.
Files: `web/README.md`. Commit: `004e08a`.

`vscode-extension/CHANGELOG.md:44` still mentions the `.###` signed residual; it
is a historical entry and stays. Lane A's `deno task test` at `ed1f4b5` exited 0
in 41 s.

## Step 15: Records and experiments

Lane B, branch `code-quality-cleanup-records` off `c00d910`, merged in
`6cfb43d`. The merge conflicted only on `deno.json`, where both sides changed
the lines around `test:all`; the result keeps lane B's `test:all` and
`test:classical-cd` lines and lane C's `@vscode/vsce@4.1.1` tasks.

**Exp. 017** The root `deno.json` gains
`"test:classical-cd": "deno test experiments/017-classical-cd && cd cli && deno task hc ../experiments/017-classical-cd/gate0.hc -t"`,
and `test:all` runs it right after `test:observer-algebras`.
`experiments/017-classical-cd/README.md:5-8` says its tests and `gate0.hc` run
in `deno task test:all` through `test:classical-cd`, and that the evidence run
`run.ts` stays manual (tens of minutes, about 20 GB). `cli/hc.ts:183` returns
the testdoc's exit code, so a failing claim fails the task. Measured at
`c00d910` with the other lanes running (load average 6.8 to 11.4), three runs
each: `deno test experiments/017-classical-cd` passed 3 tests (17 steps) in
3.12–3.31 s; `gate0.hc -t` passed 17 of 17 in 0.20–0.21 s warm (1.06 s cold);
`deno task test:classical-cd` took 2.99–3.04 s. The audit measured 2.85 s and
0.15 s. It still passes and runs quickly (decision 3), so it is chained. Files:
`deno.json`, `experiments/017-classical-cd/README.md`. Commit: `942d1ac`.

**8.7, 017's five files** `deno test experiments/017-classical-cd` type-checks
`compare.ts`, `oracle.ts`, `oracle.test.ts`, `parse.ts` and `parse.test.ts` on
every `test:all` run, through the 017 entry. `run.ts` is checked by step 16's
`check`. Commit: `942d1ac`.

**02, run.ts** `libVersion` in `experiments/017-classical-cd/run.ts` now records
only the line of `lib/version.ts` that starts with `export const VERSION`, as
runs did before the JSDoc line was added. `deno check` on the file exits 0; the
evidence run was not run. Files: `experiments/017-classical-cd/run.ts`. Commit:
`8c037a4`.

**Exp. a13** `experiments/a13-recovery-spike/README.md` gains "**Status:**
Archived. Its tests last ran, all 13 passing, at `05b4f25` (v0.39.0); 3 of 13
fail on later versions." It is not chained. At `c00d910`,
`deno test experiments/a13-recovery-spike` passes 10 and fails 3
(`spike.test.ts:95`, `:200`, `:216`); `05b4f25`'s tree with the folder from
`c00d910` copied in passes 13 of 13. Files:
`experiments/a13-recovery-spike/README.md`. Commit: `9b2cb2b`.

**7.9** Each of the 10 records gains a `**Status:**` line within its first 15
lines, stating only what the record and the code support:

| Record                                               | Status                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `spec/1-fix-closures/04-hcfmt-spec.md`               | Proposal. Not implemented: no code implements hcfmt                                                   |
| `spec/1-fix-closures/05-hcfmt-pretty-printing.md`    | As 04                                                                                                 |
| `spec/2-type-tests/03-bitscheme-failures.md`         | Historical: the December 2025 failure state                                                           |
| `spec/4-ai-security/README.md`                       | Architecture pinned, not enforced; next phase is implementation and falsification (2026-08-09)        |
| `spec/4-ai-security/01-ai-security-requirements.md`  | Requirements; no findings about the current implementation                                            |
| `spec/4-ai-security/02-hc-ai-security-triage.md`     | Triage; verdict of 2026-08-09: conceptually aligned, not close to security clearance                  |
| `spec/4-ai-security/04-risk-assessment.md`           | Assessment as of 2026-08-09 (#278), the four risk ratings                                             |
| `spec/6-parsing-failures/checklists/requirements.md` | Completed for v0.8.4; all 17 items checked                                                            |
| `spec/a13-error-handle/exception-tutorial.md`        | Not implemented: it teaches 01's parent-scope `.$:` design; v0.40.0 (#473) shipped 14's `$!` operator |
| `spec/foist-19a/README.md`                           | Implemented in v0.54.0 (#506); retirements in v0.55.0 (#508)                                          |

The audit's step 7 status scan prints nothing. Files: the 10 records. Commit:
`dec0f45`.

**7.10** Stale status lines, each checked against the code and the tags:

- `spec/a02-hcweb-deployment.md`: "Proposed" became implemented in v0.9.4
  (#315), which added `build:web:release`; the release job still builds and
  attaches `hcweb.html`.
- `spec/a13-error-handle/01-error-handling.md`: "Not implemented. v0.40.0 (#473)
  shipped use-site recovery, the `$!` catch operator of 14, instead; no code
  implements this parent-scope `.$:` property." The audit said 14 shipped 01's
  design; see Defects found.
- `spec/a13-error-handle/11`, `12`, `12a`, `12b`, `12c`: "Nothing here is
  implemented or decided" became a closed proposal, prior work of 14, which
  v0.40.0 (#473) implemented.
- `spec/2-type-tests/01-status.md`: "In Progress - Phase 1" became "Phase 1
  complete, as `02-findings.md` records".
- `doc/spec/2-deno-hooks/README.md`: "Specification Draft" became "Shipped as
  `jsr:@theswanfactory/deno-hooks`, which `deno task setup` installs".
- `spec/1-fix-closures/07`, `08`, `09`, `10` and `12`, all from #271 (v0.7.5).
  The MAML failures they chase were fixed in `8f59dac` (#461, v0.37.1), which
  replaced `HeadBlock` with a host `MetadataHead` class (now `maml/maml.ts`);
  `maml/maml.test.ts:44,48` hold the two tests 07 listed as failing. 07 is
  closed (#461 fixed the failures); 08 is not implemented (its `__` change did
  not fix the tests, and #461 replaced `HeadBlock`); 09 is closed (Option A's
  MAML step did not fix the tests; #461 did); 10 is closed (#461 removed
  `HeadBlock`); 12 is resolved (v0.7.5 shipped the closure fixes, and #461 fixed
  MAML and added `test:maml`).

`spec/1-fix-closures/11` and `spec/a13-error-handle/13` are outside the audit's
list and stay as written. Files: the 11 records above. Commit: `60dab80`.

**02, maml links** In `spec/1-fix-closures/07`, `08`, `09` and `10`, the 8 links
to `../../lib/maml.ts` now target `../../maml/maml.ts`; the two anchored ones
(`08:154`, `10:58`) lose their anchors, since the file moved and changed. Link
texts and prose mentions keep `lib/maml.ts`, as records of their time. `09:167`
linked a `README.md` that no commit ever added; it now targets `./`, the folder
its text names. Every relative link in the four files resolves. The prose in
`spec/a06-outward-reference-resolution.md:66`,
`spec/a16-concrete-semantics-graph.md:188` and
`spec/a07-hc-security-architecture.md:125` stays, following 02's `.kiro/specs/`
precedent; none of them is a link. Files: the four records. Commit: `5ddcdfe`.

Lane B's `deno task test` exited 0; the only new counts were
`test:classical-cd`'s, 3 passed (17 steps) and `gate0.hc` 17 of 17.

## Step 16: Tooling

`deno outdated --recursive` and `npm view`, rerun before the updates, gave the
audit's numbers. On JSR, `@std/cli` is at 1.0.32, which the lock already held.

**1.1, 1.2, 1.3 and decision 2, the coverage floor.** New
`scripts/coverage-floor.ts` and `deno task coverage:check`. For each package in
step 1's coverage table, it runs that package's own tests with
`DENO_COVERAGE_DIR` set to a fresh temporary directory, then reports that
directory with `deno coverage --lcov`, sums the `LH:` and `LF:` records, and
exits 1 when a package is below its floor or its report is empty. The filters
follow 1.1: an `--include` of the package's directory under the resolved root
URL (an unresolved path such as macOS's `/tmp` matches no file), an `--exclude`
of `\.test\.(js|mjs|ts|jsx|tsx)$` with the dot, so `lib/execute/hc-test.ts`
counts, and lib's generated bundle excluded. Web follows 1.2: it is collected
from `build:web`, `test:components` and `test:artifact`, never `test:consumer`,
with `web/tests/` and `web/dist/` excluded. `scripts/coverage-floor.test.ts`
tests the pure helpers and the table, and `test:scripts` runs it. Per 1.3, CI's
build job runs the check as its own step, "Check the coverage floor", after the
two upload steps; `deno task test` and the pre-push hook do not, because
collecting coverage re-runs the package tests at about twice their time. The
check takes 41.0 s locally, 25.9 s of it for lib. `deno coverage --threshold`
was not enough: it applies one percentage to the whole report, and to lines,
branches and functions together. Files: `scripts/coverage-floor.ts`,
`scripts/coverage-floor.test.ts`, `deno.json`, `.github/workflows/deno.js.yml`.
Commit: `bc0819a`.

Each floor is the package's line coverage measured on this branch at `bc0819a`,
rounded down to a whole percent:

| Package                             | Tests the floor runs                                     | Lines hit  | Line coverage | Floor |
| ----------------------------------- | -------------------------------------------------------- | ---------- | ------------- | ----: |
| `lib`                               | `test:lib`                                               | 9869/10428 | 94.64%        |    94 |
| `cli`                               | `test:cli`                                               | 326/416    | 78.37%        |    78 |
| `maml`                              | `test:maml`                                              | 57/57      | 100.00%       |   100 |
| `scripts`                           | `test:scripts`                                           | 270/634    | 42.59%        |    42 |
| `web`                               | `build:web`, web's `test:components` and `test:artifact` | 113/114    | 99.12%        |    99 |
| `experiments/007-observer-algebras` | `test:observer-algebras`                                 | 745/762    | 97.77%        |    97 |

Raising `cli`'s floor to 79 made the check exit 1 with "cli: 78.37% is below its
79% floor". `maml` has 57 lines where the audit counted 22, because 5.1 moved
`lib/maml.ts` into `maml/`. The `scripts` row counts `coverage-floor.ts` itself,
whose `main` its tests do not run.

**1.4** Kept, as the audit decided. The floor cannot see the files that no Deno
test loads: `web/mod.ts`, `web/mount.ts` (it runs only inside the built
`hcweb.html`), `experiments/007-observer-algebras/report.ts`, and the three
`scripts/` entry points that `test:scripts` does not load, `build-npm.ts`,
`test-compiled.ts` and `test-npm.ts`. The root `check` task type-checks all six
(8.7).

**5.19** The root `check` task ends with `deno doc --lint lib/mod.ts`, which
exits 0. `deno task test` and CI's build job run `check`. Files: `deno.json`.
Commit: `004e08a`.

**5.20** `lib/deno.json`'s `publish.exclude` is now `**/*.test.ts`,
`**/CLAUDE.md` and `!bundle/hc-sources.ts`.
`cd lib && deno publish --dry-run --allow-dirty` lists 104 files, with no
`.test.ts` and no `CLAUDE.md`, and still lists `bundle/hc-sources.ts`. Files:
`lib/deno.json`. Commit: `420a6ce`.

**7.3** `test:cli`, `test:lib`, `test:load-order`, `test:observer-algebras`,
`test:web`, `build:cli`, `build:npm` and `build:web` now start with
`deno task bundle:embed`; `test:compiled` and `test:npm` inherit it through
`build:cli` and `build:npm`. With the bundle deleted, `deno task test:lib`
regenerates it and passes. One `deno task test` now writes the bundle 9 times
instead of 2; the audit estimated 11. Files: `deno.json`. Commit: `eaa1180`.

**8.1** Declined in the audit's Approval: the `deno-hooks` pin stays, so no
change here. Step 17 files the yanked pin and the upstream deno-hooks issue.

**8.2** Every inline `jsr:` import specifier in the tracked `.ts` and `.tsx`
files is now a bare specifier that the root `deno.json` import map resolves:
`@std/expect` `^1.0.20` (was `^0.219.1` in 108 files and `1.0.17` in 5),
`@std/testing` `^1.0.21` (was `^1.0.10` in 91 files and `1.0.15` in 3),
`@std/path` `^1.1.6` (6 files), `@std/cli` `^1.0.13` and `@deno/dnt`.
`cli/deno.json` keeps only `@nothing628/chalk`, which `cli/hc-log.ts` now
imports bare. The edit touched the import lines of 120 files. In
`cli/hc.test.ts` the two `@std/expect` imports became one, and
`expectWithMessage(` became `expect(`: the same function with the same
arguments. The `jsr:@swanfactory/*` strings stay: they are test data, the
release builder's specifiers, and the JSDoc examples in
`lib/execute/evaluate.ts`, `lib/execute/execute.ts` and `lib/frames/context.ts`.
Those three examples are the only lines that the plan's check,
`git grep -nE 'from "jsr:' -- '*.ts' '*.tsx'`, still prints. The counts before
and after the swap match exactly (Measurements). That also settles 02's defect:
`@std/expect` 0.219.1 is no longer in the lock, so `expect`'s message argument
now prints, and no assertion failed when it did. Files: `deno.json`,
`cli/deno.json`, the import lines of 120 files. Commit: `07a9696`.

**8.3** Same-line updates: playwright 1.62.0 to 1.65.1 in `web/deno.json`, the
four browser installs in the workflows and `web/README.md`; `@preact/signals`
2.11.0 to 2.11.4 in web and the consumer fixture; `@testing-library/preact`
3.2.4 to 3.2.6; vite 7.3.6 to 7.3.8, staying on 7.x for
`@fresh/plugin-vite@1.1.2`; web's `serve` task's `@std/http` 1.1.3 to 1.1.4; and
CI's Deno v2.9.5 to v2.9.8, in the four `setup-deno` steps of `deno.js.yml` (and
the three step names that say the version) and in `demo-availability.yml`.
preact stays 10.29.8 (8.4 is an issue). `@std/testing` and web's `@std/expect`
reached 1.0.21 and 1.0.20 through 8.2. `@types/node` moved from 22.20.2 to
24.19.2 in `scripts/build-npm.ts`, to match `engines.node: ">=24"`. 24.x no
longer declares `Array.prototype.at`, which 22.x did, so dnt's default ES2021
lib failed TS2550 on `frame-expr.ts` and `frame-observation.ts`. `build-npm.ts`
now passes `compilerOptions: { lib: ["ES2022"] }`. The emitted `dist/npm/esm` is
byte-identical to the build with dnt 0.43.2 and `@types/node` 22.20.2; the
generated `package.json` differs only in those two versions. Cross-line updates,
each after its own check:

| Update                                      | Check                                       | Result                    |
| ------------------------------------------- | ------------------------------------------- | ------------------------- |
| jsdom 30.0.1 to 31.0.1                      | `cd web && deno task test:components`       | taken: 1 passed (4 steps) |
| `@vscode/vsce` 3.9.2 to 4.1.1 (three tasks) | `deno task vscode:package`, on Node 26.12.0 | taken: exit 0             |
| `@deno/dnt` 0.43.2 to 0.44.0                | `deno task test:npm`                        | taken: passes             |
| `actions/setup-node` v6 to v7 (three steps) | the PR's CI run                             | taken                     |
| `actions/download-artifact` v7 to v8        | none can run: only the release job uses it  | kept at v7                |

Local runs used Deno 2.9.7; the PR's CI run is the check for 2.9.8. Files:
`web/deno.json`, `web/tests/consumer/deno.json`, both workflows,
`web/README.md`, `deno.json`, `scripts/build-npm.ts`, `deno.lock`. Commit:
`dc195fa`.

**8.5** `maml/deno.json`'s `test` is now
`deno fmt --check && deno lint && deno test`, with no permission grants.
`cd maml && deno task test` exits 0 (3 passed, 18 steps) and leaves `git status`
clean. Files: `maml/deno.json`. Commit: `420a6ce`.

**8.6** The five tests at `cli/runfile.test.ts:18-81` now write to
`Deno.makeTempFile({ suffix: ".txt" })` and remove it in a `finally`, as the
file's later tests do. Their `it` names and `expect` lines are unchanged.
`deno task test:cli` gives the same 10 tests and 73 steps, and no `*.test.txt`
appears under `cli/`. Files: `cli/runfile.test.ts`. Commit: `2c8707c`.

**8.7, the eleven files** New root task `check`:
`deno task bundle:embed && deno check --frozen cli lib maml scripts web experiments/007-observer-algebras experiments/017-classical-cd && deno check --frozen --doc-only README.md lib/README.md web/README.md && deno doc --lint lib/mod.ts`.
It checks 265 modules, the eleven files among them: the three `scripts/` entry
points, the five consumer files and `web/tests/production.test.ts` (through
`web`), `experiments/017-classical-cd/run.ts` and
`experiments/007-observer-algebras/report.ts`. `experiments/a13-recovery-spike`
stays out (8.7's keep). `deno task test` runs `check` after `deno lint`, and
CI's build job runs it after its `deno lint` step. It exits 0 in 3.2 s. Files:
`deno.json`, `.github/workflows/deno.js.yml`. Commit: `004e08a`.

**8.8** The root `check` names `web`, so CI type-checks all of web's files.
web's own `check` task stays for developers. Commit: `004e08a`.

**8.9** The root `exclude` gains `dist/`, `check` names its directories, and it
runs after `bundle:embed`. After `deno task build`, a bare `deno check --frozen`
exits 0 and lists no `dist/` path. Files: `deno.json`. Commit: `004e08a`.

**8.10, the CI choice** `check` runs `deno check --doc-only` on `README.md`,
`lib/README.md` and `web/README.md`: six TypeScript blocks, all passing. Step
14's part, the import that `web/README.md`'s Fresh fragment lacked, landed here
because `check` needs it: the fragment now starts with
`import { fresh } from "jsr:@fresh/plugin-vite@1.1.2";`. Files: `deno.json`,
`web/README.md`. Commit: `004e08a`.

**8.11** Declined in the audit's Approval: CI keeps its separate build step, so
no change here.

**8.12** Regenerated the lock with `rm deno.lock && deno install`. It went from
111,727 bytes at `c00d910` to 63,938. Its `remote` section went from 210 entries
to none, and `@luca/esbuild-deno-loader@0.11.0`, `@fresh/init@2.3.3` and
`@std/encoding@1.0.10` are gone. It holds 34 jsr and 224 npm packages; the one
jsr package at two versions is `@deno/loader` (0.3.14 and 0.4.0), which 8.2
keeps. `deno task test` passes with the same counts and `deno install --frozen`
exits 0. Files: `deno.lock`. Commit: `18d5ef0`.

**8.13** The root `clean` task is now `rm deno.lock`. Files: `deno.json`.
Commit: `420a6ce`.

## Step 17: Close out

## Defects found

- Step 14 found no defect in product code. `lib/frames/frame.ts:95` still says
  the `parent` field is written only by `setParent`, the claim 7.1 corrected in
  the docs; step 17 fixes or files it.
- Step 15 found no defect in product code. The audit's 7.10 was wrong about
  `spec/a13-error-handle/01-error-handling.md`: v0.40.0 shipped 14's use-site
  `$!` operator, not 01's parent-scope `.$:` property
  (`git grep '\.\$:' -- lib hc cli` finds nothing), so 01 and the tutorial say
  "Not implemented".
- Step 16 found no new defect. 02's defect, that `@std/expect` 0.219.1 ignored
  `expect`'s message argument, is gone with 8.2.

## GitHub actions

## Measurements

**8.2, counts before and after the import swap.** `NO_COLOR=1 deno task test` on
`737f7aa` (`c00d910` plus this document's first commit) and on `07a9696`. The
runs after `dc195fa`, `18d5ef0`, `eaa1180` and `004e08a` printed the same lines.
From `bc0819a` on, `test:scripts` prints 21 passed (127 steps): the new
`scripts/coverage-floor.test.ts` adds 4 tests and 9 steps, and no other count
changes.

| Run                      | Before `07a9696`                   | After `07a9696`                    |
| ------------------------ | ---------------------------------- | ---------------------------------- |
| `test:cli`               | 10 passed (73 steps)               | 10 passed (73 steps)               |
| `test:lib`               | 212 passed (1538 steps), 4 ignored | 212 passed (1538 steps), 4 ignored |
| `test:load-order`        | 1 passed (1 step)                  | 1 passed (1 step)                  |
| `test:maml`              | 3 passed (18 steps)                | 3 passed (18 steps)                |
| `test:scripts`           | 17 passed (118 steps)              | 17 passed (118 steps)              |
| `test:observer-algebras` | 33 passed                          | 33 passed                          |
| web `test:components`    | 1 passed (4 steps)                 | 1 passed (4 steps)                 |
| web `test:artifact`      | 2 passed (16 steps)                | 2 passed (16 steps)                |
| `test:doc`               | 21 testdocs executed, 0 failed     | 21 testdocs executed, 0 failed     |

**Step 16, wall time.** One sample each, `NO_COLOR=1`, on a 14-core Mac with
Deno 2.9.7. `deno task test` took 45.7 s before 8.2 (the first run in this
worktree) and 35.1 s at `bc0819a`, which includes the new `check` task's 3.2 s.
`deno task coverage:check` took 41.1 s at `bc0819a`: lib 26.2 s, cli 7.2 s, maml
0.4 s, scripts 2.2 s, web 2.2 s and `experiments/007-observer-algebras` 2.8 s.
