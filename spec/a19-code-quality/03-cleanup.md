# Code Quality Cleanup: Steps 14–17

**Covers:** steps 14–17 of the [plan](README.md): docs, records and experiments,
tooling, and the close-out.\
**Status:** Done. Steps 14–17 are complete; the release is v0.55.4.\
**Base:** `9d0e7c7`, #514 squash-merged into master (v0.55.3). The work began on
`c00d910`, #514's head, and was rebased onto `9d0e7c7`; measurements that name
`c00d910` were taken before the rebase.\
**Head:** the commit that completes this document.

Each entry uses the ID of its finding in the [audit](01-audit.md) or names an
item from the [refactor](02-refactor.md)'s "Left for cleanup", and acts on the
disposition the audit's Approval settled. An entry gives what was done, the
files and the commit, or why something was not done. Commits are on the
`code-quality-cleanup` branch.

## Step 14: Docs

Lane A, branch `code-quality-cleanup-docs` off `c00d910`, merged into
`code-quality-cleanup` and then rebased with it onto `9d0e7c7`.

**7.2** Root `CLAUDE.md`: hosts lay the `hc/*.hc` files over the root and the
package ships every `hc/*.hc` file; two bundled classes load without a root, the
Denum that `.###` answers and the RotorRouter, through
`lib/execute/class-prologue.ts`; Code Organization keeps only "Keep lib/
independent of cli/ and web/"; evaluation goes in a Frame's `in` and `call` or
`lib/ops`; an operation is an `ICurryFunction` registered in the `Ops` table in
`lib/ops.ts`; a Frame type implements `toString()` plus `toStringData()` or
`toStringArray()`; the bump paragraph names "every manifest that carries the
version" instead of five `deno.json` files. The bundle regeneration lines are
true after 7.3 (step 16). Files: `CLAUDE.md`. Commit: `6c73c2f`.

**6.2** The testing rule in `CLAUDE.md` now reads, as approved: "Each module
needs tests: a sibling `<name>.test.ts`, or a feature test that the coverage
report shows covering it." "Aim for high coverage" became "Keep each package at
or above its line-coverage floor, which CI checks with
`deno task coverage:check`". Files: `CLAUDE.md`. Commit: `6c73c2f`.

**7.1** `lib/frames/CLAUDE.md`: `setParent` is the only path that attaches a
parent, and copies (`FrameArray.in`, `Frame.copy()`) carry the source's link;
`resource-reference.ts` decides every reference refusal and the stores decide
their own. Commit: `076a246`. `doc/ARCHITECTURE.md`: a paragraph in Operations
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
`1653a44`. `lib/frames/frame.ts:95`, the `parent` field's comment, still said
"It is written only by setParent"; the file was outside lane A, so step 17 fixed
it (Defects found, `0d16e51`).

**02, traversal** `lib/frames/CLAUDE.md` says the private `MetaFrame.traverse`,
with `walk`, owns the traversal and its cycle guard, and `get` and `resolve` go
through it. The specialization sentence stays. Files: `lib/frames/CLAUDE.md`.
Commit: `076a246`.

**7.4** `cli/CLAUDE.md`: the two exception names became "The legacy exceptions
are listed in `cli/test-docs.ts`", and "Only the clock is bound…" is gone; the
`getHandlers()` sentence stays. `web/CLAUDE.md`: the Architecture, Commands and
Hosting and monitoring sections are gone; the title, Dependency boundary,
Artifact invariants (with its `hc/` paragraph) and Changes stay, with one line
pointing to `web/README.md`. Files: `cli/CLAUDE.md`, `web/CLAUDE.md`. Commit:
`e7258fa`.

**6.12** `cli/CLAUDE.md`'s testdoc section: after a change that adds, removes or
un-implements a claim in a bundled testdoc, run
`cd cli && deno task testdoc:summaries` and commit the regenerated
`cli/testdoc-summaries.json`, which `cli/hc.test.ts` reads. Files:
`cli/CLAUDE.md`. Commit: `e7258fa`.

**02, ARCH** In `doc/ARCHITECTURE.md`, `declaredMethod` became
`methodDeclaredBy` in `lib/frames/declared-protocol.ts`, `OBSERVATION_KEYS` is
cited there, and `HCLang.makeHost` became `hostNamespace` in
`lib/execute/host-namespace.ts`, shared by the CLI and `HCLang`. Files:
`doc/ARCHITECTURE.md`. Commit: `1653a44`.

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
`doc/LANGUAGE.md`, `hc/apply.hc`. Commit: `ab6495d`.

**7.7** `lib/README.md:79-82` drops "(`gap` and `spin`)"; the import sentence
stays. `hc/BitScheme.hc:256` now says "current HC uses `&` for map and `|` for
reduce" (`lib/ops.ts`: `"&": MapElements`, `"|": ReduceElements`). Prose only;
BitScheme's totals are unchanged. Files: `lib/README.md`, `hc/BitScheme.hc`.
Commit: `ab6495d`.

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
Files: `README.md`. Commit: `775dff8`.

**02, JSDoc** `FrameScoped.call`'s JSDoc in `lib/frames/frame-expr.ts` now says
it "Sizes as its term does, `.#`, `.##`, `.###` and `.####`; anything else is
applied." Comment only: `sizeOperatorKey` covers `Frame.SIZE_OPERATORS`, which
includes `kKD_COORDINATES`. Files: `lib/frames/frame-expr.ts`. Commit:
`3672926`.

**8.10, the README fragment** `web/README.md`'s Fresh fragment now starts with
`import { fresh } from "jsr:@fresh/plugin-vite@1.1.2";`. It landed in lane C,
because step 16's `check` type-checks the README blocks; see 8.10 under step 16.
Files: `web/README.md`. Commit: `baf86a4`.

`vscode-extension/CHANGELOG.md:44` still mentions the `.###` signed residual; it
is a historical entry and stays. Lane A's `deno task test` at `3672926` exited 0
in 41 s.

## Step 15: Records and experiments

Lane B, branch `code-quality-cleanup-records` off `c00d910`, merged into
`code-quality-cleanup` and rebased with it. The merge (and the rebase)
conflicted only on `deno.json`, where both sides changed the lines around
`test:all`; the result keeps lane B's `test:all` and `test:classical-cd` lines
and lane C's `@vscode/vsce@4.1.1` tasks.

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
`deno.json`, `experiments/017-classical-cd/README.md`. Commit: `6ac1ad3`.

**8.7, 017's five files** `deno test experiments/017-classical-cd` type-checks
`compare.ts`, `oracle.ts`, `oracle.test.ts`, `parse.ts` and `parse.test.ts` on
every `test:all` run, through the 017 entry. `run.ts` is checked by step 16's
`check`. Commit: `6ac1ad3`.

**02, run.ts** `libVersion` in `experiments/017-classical-cd/run.ts` now records
only the line of `lib/version.ts` that starts with `export const VERSION`, as
runs did before the JSDoc line was added. `deno check` on the file exits 0; the
evidence run was not run. Files: `experiments/017-classical-cd/run.ts`. Commit:
`50a74be`.

**Exp. a13** `experiments/a13-recovery-spike/README.md` gains "**Status:**
Archived. Its tests last ran, all 13 passing, at `05b4f25` (v0.39.0); 3 of 13
fail on later versions." It is not chained. At `c00d910`,
`deno test experiments/a13-recovery-spike` passes 10 and fails 3
(`spike.test.ts:95`, `:200`, `:216`); `05b4f25`'s tree with the folder from
`c00d910` copied in passes 13 of 13. Files:
`experiments/a13-recovery-spike/README.md`. Commit: `1703372`.

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
`a239936`.

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
list and stay as written. Files: the 11 records above. Commit: `5f25da6`.

**02, maml links** In `spec/1-fix-closures/07`, `08`, `09` and `10`, the 8 links
to `../../lib/maml.ts` now target `../../maml/maml.ts`; the two anchored ones
(`08:154`, `10:58`) lose their anchors, since the file moved and changed. Link
texts and prose mentions keep `lib/maml.ts`, as records of their time. `09:167`
linked a `README.md` that no commit ever added; it now targets `./`, the folder
its text names. Every relative link in the four files resolves. The prose in
`spec/a06-outward-reference-resolution.md:66`,
`spec/a16-concrete-semantics-graph.md:188` and
`spec/a07-hc-security-architecture.md:125` stays, following 02's `.kiro/specs/`
precedent; none of them is a link. Files: the four records. Commit: `ed0d51e`.

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
Commit: `17f0ff4`.

Each floor is the package's line coverage measured on this branch at `17f0ff4`,
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
Commit: `baf86a4`.

**5.20** `lib/deno.json`'s `publish.exclude` is now `**/*.test.ts`,
`**/CLAUDE.md` and `!bundle/hc-sources.ts`.
`cd lib && deno publish --dry-run --allow-dirty` lists 104 files, with no
`.test.ts` and no `CLAUDE.md`, and still lists `bundle/hc-sources.ts`. Files:
`lib/deno.json`. Commit: `866f17c`.

**7.3** `test:cli`, `test:lib`, `test:load-order`, `test:observer-algebras`,
`test:web`, `build:cli`, `build:npm` and `build:web` now start with
`deno task bundle:embed`; `test:compiled` and `test:npm` inherit it through
`build:cli` and `build:npm`. With the bundle deleted, `deno task test:lib`
regenerates it and passes. One `deno task test` now writes the bundle 9 times
instead of 2; the audit estimated 11. Files: `deno.json`. Commit: `62c431d`.

**8.1** Declined in the audit's Approval: the `deno-hooks` pin stays, so no
change here. Step 17 filed the yanked pin as #515 and the worktree install as
deno-hooks#13.

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
The archived experiment is excluded: step 17 restored
`experiments/a13-recovery-spike/spike.test.ts:11` to its own
`jsr:@std/expect@^0.219.1` (`0d16e51`, Defects found), so 119 of the 120 files
keep the swap. That line and the three examples are the only lines that the
plan's check, `git grep -nE 'from "jsr:' -- '*.ts' '*.tsx'`, still prints. The
counts before and after the swap match exactly (Measurements). That also settles
02's defect: `@std/expect` 0.219.1 is no longer in the lock, so `expect`'s
message argument now prints, and no assertion failed when it did. Files:
`deno.json`, `cli/deno.json`, the import lines of 120 files. Commit: `94104e4`.
After the rebase onto `9d0e7c7`, master's new
`lib/execute/class-prologue.test.ts` imported `jsr:@std/expect@^0.219.1` inline,
which `deno install --frozen` refused against the regenerated lock; it now
imports the bare `@std/expect`. Commit: `1ac47df`.

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
`a4f532f`.

**8.5** `maml/deno.json`'s `test` is now
`deno fmt --check && deno lint && deno test`, with no permission grants.
`cd maml && deno task test` exits 0 (3 passed, 18 steps) and leaves `git status`
clean. Files: `maml/deno.json`. Commit: `866f17c`.

**8.6** The five tests at `cli/runfile.test.ts:18-81` now write to
`Deno.makeTempFile({ suffix: ".txt" })` and remove it in a `finally`, as the
file's later tests do. Their `it` names and `expect` lines are unchanged.
`deno task test:cli` gives the same 10 tests and 73 steps, and no `*.test.txt`
appears under `cli/`. Files: `cli/runfile.test.ts`. Commit: `4f8421a`.

**8.7, the eleven files** New root task `check`:
`deno task bundle:embed && deno check --frozen cli lib maml scripts web experiments/007-observer-algebras experiments/017-classical-cd && deno check --frozen --doc-only README.md lib/README.md web/README.md && deno doc --lint lib/mod.ts`.
It checks 265 modules, the eleven files among them: the three `scripts/` entry
points, the five consumer files and `web/tests/production.test.ts` (through
`web`), `experiments/017-classical-cd/run.ts` and
`experiments/007-observer-algebras/report.ts`. `experiments/a13-recovery-spike`
stays out (8.7's keep). `deno task test` runs `check` after `deno lint`, and
CI's build job runs it after its `deno lint` step. It exits 0 in 3.2 s. Files:
`deno.json`, `.github/workflows/deno.js.yml`. Commit: `baf86a4`.

**8.8** The root `check` names `web`, so CI type-checks all of web's files.
web's own `check` task stays for developers. Commit: `baf86a4`.

**8.9** The root `exclude` gains `dist/`, `check` names its directories, and it
runs after `bundle:embed`. After `deno task build`, a bare `deno check --frozen`
exits 0 and lists no `dist/` path. Files: `deno.json`. Commit: `baf86a4`.

**8.10, the CI choice** `check` runs `deno check --doc-only` on `README.md`,
`lib/README.md` and `web/README.md`: six TypeScript blocks, all passing. Step
14's part, the import that `web/README.md`'s Fresh fragment lacked, landed here
because `check` needs it: the fragment now starts with
`import { fresh } from "jsr:@fresh/plugin-vite@1.1.2";`. Files: `deno.json`,
`web/README.md`. Commit: `baf86a4`.

**8.11** Declined in the audit's Approval: CI keeps its separate build step, so
no change here.

**8.12** Regenerated the lock with `rm deno.lock && deno install`. It went from
111,727 bytes at `c00d910` to 63,938. Its `remote` section went from 210 entries
to none, and `@luca/esbuild-deno-loader@0.11.0`, `@fresh/init@2.3.3` and
`@std/encoding@1.0.10` are gone. It holds 34 jsr and 224 npm packages; the one
jsr package at two versions is `@deno/loader` (0.3.14 and 0.4.0), which 8.2
keeps. `deno task test` passes with the same counts and `deno install --frozen`
exits 0. Files: `deno.lock`. Commit: `e0d39d1`.

**8.13** The root `clean` task is now `rm deno.lock`. Files: `deno.json`.
Commit: `866f17c`.

## Step 17: Close out

The re-baseline, the duplicate check, the issues filed, and the issues closed
and commented on. Step 17 also fixed the two things the earlier steps left to it
(Defects found): a13's `@std/expect` pin and `Frame.parent`'s comment, both in
`0d16e51`.

### Re-baseline

The audit's step 1 method, at `ba6c00b` (a detached worktree with its bundle and
`deno install --frozen`) and at `1ac47df`, this branch after the rebase. Same
machine (Apple M4 Pro, 14 cores, 48 GB, macOS), Deno 2.9.7, `NO_COLOR=1`, AC
power, and no other `deno test`, `task`, `run` or `coverage` process at the
start of any round. Tests in the `ba6c00b` tree ran directly, never through a
hook, with git's repository variables unset. After every round `core.bare` was
`false` and the main checkout's `git status --short` was empty.

**Wall time.** One warm-up `deno task test:all` in each tree (`ba6c00b` 78.74 s,
`1ac47df` 36.83 s), then three rounds from 19:46 to 19:55, alternating the
trees. Each round ran every task its tree's `test:all` chains, in chain order,
then the chain, then `deno fmt --check` and `deno lint`. Every run exited 0.
Load averages at the start of the rounds were 29.8, 7.6, 4.9, 3.0, 3.3 and 2.5.
macOS's `XprotectService` scanned the freshly compiled `scripts/hc` binaries
during the warm-ups and round 1; it inflated round 1 at `ba6c00b` (`test:web`
15.99 s, `test:doc` 8.47 s, `test:npm` 20.42 s, `test:compiled` 18.44 s). Those
are the ranges' maxima and do not move the medians.

| Task, in `test:all` order | Audit, median s | `ba6c00b`, median (range) s | `1ac47df`, median (range) s |
| ------------------------- | --------------: | --------------------------- | --------------------------- |
| `bundle:embed`            |            0.07 | 0.07 (0.07–0.07)            | 0.06 (0.06–0.07)            |
| `test:cli`                |            0.81 | 0.79 (0.78–0.82)            | 4.18 (4.17–4.18)            |
| `test:lib`                |           13.49 | 13.28 (13.27–14.09)         | 6.86 (6.83–6.87)            |
| `test:maml`               |            0.34 | 0.34 (0.33–0.40)            | 0.35 (0.35–0.36)            |
| `test:scripts`            |            2.07 | 1.92 (1.92–2.41)            | 2.00 (1.98–2.01)            |
| `test:observer-algebras`  |            1.54 | 1.50 (1.48–1.58)            | 1.60 (1.58–1.60)            |
| `test:classical-cd`       |                 |                             | 2.90 (2.89–2.90)            |
| `test:web`                |            5.38 | 5.05 (5.03–15.99)           | 4.61 (4.53–4.61)            |
| `test:doc`                |            3.72 | 3.46 (3.44–8.47)            | 3.62 (3.61–3.66)            |
| `test:npm`                |            6.35 | 5.73 (5.61–20.42)           | 5.83 (5.47–6.01)            |
| `test:compiled`           |            4.18 | 3.58 (3.56–18.44)           | 3.45 (3.43–3.46)            |
| Sum of medians            |           37.95 | 35.72                       | 35.46                       |
| `test:all`, whole chain   |           37.85 | 35.99 (35.28–38.76)         | 35.12 (35.10–35.37)         |
| `deno fmt --check`        |            0.03 | 0.03 (0.03–0.03)            | 0.04 (0.03–0.04)            |
| `deno lint`               |            0.02 | 0.02 (0.02–0.02)            | 0.02 (0.02–0.02)            |

The chain is 0.87 s shorter at the head although it runs more: every task now
runs `bundle:embed` first (7.3), and `test:classical-cd` (step 15) adds 2.90 s.
`test:lib` is 6.42 s shorter, because it runs `--parallel` (6.8). `test:cli` is
3.39 s longer: 6.12's `cli/hc.test.ts` now pins every testdoc, and the
`hc/cd-bit-kernel.hc` step alone prints 3 s. At the head, `deno task check` took
1.41 s and `deno task coverage:check` 41.02 s, both exit 0, run once after the
rounds.

**Counts.** Identical in all three rounds and in each `test:all`. Deno counts a
top-level `Deno.test` or `describe` as a test and a nested one as a step.

| Task                          | Files, audit → head | Passed, audit → head | Steps, audit → head | Ignored |
| ----------------------------- | ------------------- | -------------------- | ------------------- | ------: |
| `test:cli`                    | 5 → 5               | 10 → 11              | 74 → 77             |       0 |
| `test:lib`, main run          | 79 → 94             | 201 → 215            | 1,553 → 1,544       |       4 |
| `test:lib`, `test:load-order` | 1 → 1               | 1 → 1                | 1 → 1               |       0 |
| `test:maml`                   | 2 → 2               | 3 → 3                | 18 → 18             |       0 |
| `test:scripts`                | 6 → 7               | 17 → 21              | 118 → 127           |       0 |
| `test:observer-algebras`      | 3 → 3               | 33 → 33              | 0 → 0               |       0 |
| `test:classical-cd`           | – → 2               | – → 3                | – → 17              |       0 |
| `test:web`, `test:components` | 1 → 1               | 1 → 1                | 4 → 4               |       0 |
| `test:web`, `test:artifact`   | 2 → 2               | 2 → 2                | 16 → 16             |       0 |
| **Total**                     | **99 → 117**        | **268 → 290**        | **1,784 → 1,804**   |   **4** |

Of 119 tracked test files (103 at `ba6c00b`), `test:all` runs 117; the other two
are `web/tests/production.test.ts` and a13's `spike.test.ts`. Each difference,
by finding (02's Test counts give the refactor's in detail):

- `test:cli`, +1 test, +3 steps: 3.3 deleted `cli/flatten.test.ts` (−1, −7);
  6.12 added `cli/testdoc-summaries.test.ts` and six pinned testdocs (+1, +6);
  #514's outside review added the generator's guards (+1, +4).
- `test:lib`, +14 tests, −9 steps, +15 files: 2.10 split `evaluate.test.ts` into
  nine `evaluate.<feature>.test.ts` files (+9 tests, −9 steps); 2.11 split
  `resource-import.test.ts` into five files (+3, −3); 3.11 removed
  `describe("contextEqual")` (−3 steps); 3.20 deleted `denum-observers.test.ts`
  and moved 3 of its 4 tests (−1 test); 4.17 added `lib/test-helpers.test.ts`;
  5.14 moved `sigilizer.test.ts` to `lib/`; the outside review added
  `class-prologue.test.ts` and the ranked-rungs suite (+3, +6).
- `test:scripts`, +4 tests, +9 steps, +1 file: `scripts/coverage-floor.test.ts`
  (step 16, 1.1).
- `test:classical-cd`, +3 tests, +17 steps, +2 files: experiment 017, chained
  from `test:all` in step 15.
- The 4 ignored tests are still 1.5's `describe.skip` suites, now in
  `lib/execute/evaluate.schemas.test.ts`.

`test:doc` executed 21 testdocs with **944 claims, 934 pass, 0 fail and 10
unimplemented**, each testdoc's final `$=.test-summary` equal to the audit's
table. `test:classical-cd` adds `gate0.hc`'s 17 of 17. `test:npm` printed
`Verified hclang@0.55.3 via npx` and `test:compiled` passed both its cases.

The slowest test is still `lib/execute/foist-19a.test.ts:132` (6.6), which
prints 5 s in each round under `--parallel` and 4 s at `ba6c00b`; the second is
`division.test.ts`'s routing guard (6.7), 3 s and 2 s. After each
`test:compiled`, `scripts/hc` was 181,462,930 bytes (186,020,242 at `ba6c00b`,
as the audit measured): 107.61 MB of embedded files, of which `node_modules/` is
104.38 MB and `dist/npm/node_modules/` 3.22 MB (1.6).

**Coverage.** The audit's commands at the head: each package's own task with
`DENO_COVERAGE_DIR`, then one `deno task test:all`, reported with each package's
`--include` (the `pwd -P` prefix), `--exclude='\.test\.(js|mjs|ts|jsx|tsx)$'`,
the bundle excluded for lib and `/web/(tests|dist)/` for web. Web is collected
from `build:web`, `test:components` and `test:artifact` (1.2): the whole chain's
report for web is still empty ("Missing transpiled source code" for all five
modules), so web's `test:all` columns repeat its own collection, as the audit's
did. Collecting took 29.95 s for `test:lib` and 67.83 s for `test:all`.

| Package                             | Files     | Lines, own task       | Lines, `test:all`                             | Branches, `test:all`                      | Functions, `test:all`                     |
| ----------------------------------- | --------- | --------------------- | --------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `lib`, audit                        | 100       | 92.2% (9,878/10,719)  | 92.9% (9,960/10,719)                          | 93.2% (4,020/4,312)                       | 91.2% (1,185/1,300)                       |
| `lib`, head                         | 101       | 94.4% (9,871/10,457)  | 94.8% (9,915/10,457)                          | 93.6% (3,904/4,170)                       | 94.6% (1,221/1,291)                       |
| `cli`, audit                        | 6         | 80.7% (321/398)       | 82.2% (327/398)                               | 87.6% (127/145)                           | 82.4% (28/34)                             |
| `cli`, head                         | 7         | 78.2% (356/455)       | 80.0% (364/455)                               | 86.6% (129/149)                           | 87.2% (34/39)                             |
| `maml`, audit                       | 1         | 100% (22/22)          | 100% (22/22)                                  | no branches                               | 100% (1/1)                                |
| `maml`, head                        | 2         | 100% (57/57)          | 100% (57/57)                                  | 100% (1/1)                                | 100% (3/3)                                |
| `scripts`, audit                    | 7         | 40.6% (187/461)       | 82.5% (552/669)                               | 82.5% (104/126)                           | 88.5% (23/26)                             |
| `scripts`, head                     | 8         | 42.6% (270/634)       | 78.2% (663/848)                               | 83.9% (120/143)                           | 81.1% (30/37)                             |
| `web`, audit                        | 5         | 99.1% (113/114)       | 99.1% (113/114)                               | 94.4% (17/18)                             | 100% (8/8)                                |
| `web`, head                         | 5         | 99.1% (113/114)       | 99.1% (113/114)                               | 94.4% (17/18)                             | 100% (8/8)                                |
| `experiments/007-observer-algebras` | 7 and 7   | 97.8% (745/762), both | 97.8% (745/762), both                         | 88.9% (185/208), both                     | 98.7% (78/79), both                       |
| All six, audit → head               | 126 → 130 |                       | 92.4% (11,719/12,684) → 93.4% (11,857/12,693) | 92.6% (4,453/4,809) → 92.9% (4,356/4,689) | 91.4% (1,323/1,448) → 94.3% (1,374/1,457) |

- `lib` lost 262 instrumented lines to the step 9 deletions (3.1, 3.12, 3.13),
  `hc-log.ts` (5.3) and `maml.ts` leaving it; its whole-chain line coverage is
  94.8%, against the audit's forecast of about 95.1%.
- `cli` gained `hc-log.ts` (5.3) and `testdoc-summaries.ts` (6.12) and lost
  `flatten.ts` (3.3). `maml` now holds `maml.ts` beside `tag.ts`.
- `scripts` gained `coverage-floor.ts` (step 16): 83 of its 150 lines run in
  `test:scripts`, and the rest only under `deno task coverage:check`, which
  `test:all` does not chain. The own task loads 5 of its 8 modules (1.4).

Untaken branches (BRF − BRH), whole chain, for 3.16: `lib/frames` 224 → 212,
`lib/execute` 61 → 44, `lib/ops` 7 → 7, `lib/` itself 0 → 3 (`sigilizer.ts`
moved there, 5.14), so `lib` 292 → 266; `cli` 18 → 20 (`hc-log.ts` brings 3);
`scripts` 22 → 23; `web` 1 → 1; `experiments/007-observer-algebras` 23 → 23; all
356 → 333. The files with the most are `lib/frames/access-footprint.ts` (39),
`frame-symbol.ts` (15), `frame-numeric.ts` (14), `fourth-hash.ts` (14) and
`frame-expr.ts` (13); `lib/execute/router-prologue.ts` has 8.

6.3's 11 modules and `cli/prompt.ts`, whole chain (own task where it differs):

| Module                               | Lines, audit `test:all` | Lines, head     | Uncovered | Branches, head        | Functions, head |
| ------------------------------------ | ----------------------- | --------------- | --------: | --------------------- | --------------- |
| `lib/frames/frame-sequence.ts`       | 43/90                   | 43/64 (67.2%)   |        21 | 15/16                 | 7/13            |
| `lib/frames/frame-rational.ts`       | 117/156                 | 114/139 (82.0%) |        25 | 23/27                 | 16/20           |
| `lib/execute/router-prologue.ts`     | 62/80                   | 44/53 (83.0%)   |         9 | 17/25 (own 16/24)     | 4/4             |
| `lib/frames/frame-decimal.ts`        | 132/164                 | 126/142 (88.7%) |        16 | 43/46                 | 19/22           |
| `lib/frames/frame-atom.ts`           | 34/42                   | 34/39 (87.2%)   |         5 | 7/9 (own 6/8)         | 7/8             |
| `lib/execute/terminals.ts`           | 57/67                   | 57/64 (89.1%)   |         7 | 7/9                   | 8/9             |
| `lib/frames/frame-int.ts`            | 161/187                 | 157/173 (90.8%) |        16 | 70/74                 | 25/27           |
| `cli/hc-log.ts` (was `lib/execute/`) | 34/39                   | 34/39 (87.2%)   |         5 | 9/12                  | 4/4             |
| `lib/ops/frame-ops.ts`               | 22/25                   | 22/25 (88.0%)   |         3 | 5/6                   | 5/6             |
| `lib/frames/fourth-hash.ts`          | 157/178                 | 163/180 (90.6%) |        17 | 111/125 (own 109/123) | 14/14           |
| `lib/frames/frame-observation.ts`    | 53/60                   | 53/60 (88.3%)   |         7 | 12/16                 | 10/12           |
| `cli/prompt.ts`                      | 5/38                    | 5/38 (13.2%)    |        33 | none                  | 0/5             |

The 11 modules leave 131 lines uncovered, against 216 at `ba6c00b`.

**Experiments.** The audit's "Step 1, experiments" commands at the head, three
times each from the repository root, 20:01 to 20:02:

| Experiment              | Command                                                              | Result at the head                                  | Wall s, median (range) | Audit at `ba6c00b`       |
| ----------------------- | -------------------------------------------------------------------- | --------------------------------------------------- | ---------------------- | ------------------------ |
| `007-observer-algebras` | `deno test --allow-read experiments/007-observer-algebras`           | pass: 33 tests                                      | 1.48 (1.47–1.48)       | pass, 1.57 (as its task) |
| `017-classical-cd`      | `deno test experiments/017-classical-cd`                             | pass: 3 tests, 17 steps                             | 2.70 (2.68–2.71)       | pass, 2.85               |
| `017-classical-cd`      | `cd cli && deno task hc ../experiments/017-classical-cd/gate0.hc -t` | pass: 17 of 17 claims                               | 0.15 (0.14–0.15)       | pass, 0.15               |
| `a13-recovery-spike`    | `deno test experiments/a13-recovery-spike`                           | fail: 10 pass, 3 fail (`:95`, `:200`, `:216`)       | 0.32 (0.32–0.56)       | fail, 10 and 3, 0.34     |
| `a13-recovery-spike`    | the head's folder in `05b4f25`'s tree                                | fail: TS2307, `"@std/expect"` not in the import map | 0.25 (0.25–0.45)       |                          |
| `a13-recovery-spike`    | `ba6c00b`'s folder in `05b4f25`'s tree                               | pass: 13 tests                                      | 0.30 (0.30–0.53)       | pass, 0.61               |

Both 017 commands now run in `test:classical-cd`. The a13 result in `05b4f25`'s
tree was a defect of 8.2, fixed in `0d16e51` (Defects found). After the fix, the
head's folder in a `git archive 05b4f25` tree passed 13 tests in each of three
runs, 0.49 s median (0.44–2.29 s, the first run cold).

### Duplicate check

Before any action, `gh issue list --state all --limit 200 --search` ran on
hclang for each issue's key words (worktree, deno-hooks, yanked,
evaluate.schemas, describe.skip, node_modules, compiled binary, Frame protocol,
MAML, partition, REPL, prompt.ts, unary, inexactResult, branches, refusal,
gerbil, led_blink, hcsv, testdoc claims, footprint, resolveName, cd-bit-kernel,
effect subscribers, beforeCommit, recognizeDenum, Denum, preact, a19), and every
deno-hooks issue was listed. No issue, open or closed, duplicated any of the 18.
hclang's open issues were the 17 the plan listed; deno-hooks had #2–#7 and #12
open and #8, #9 closed, none about worktrees or the hooks path. #511 and #513
were not refiled. Before each close or comment, the issue was checked for an
earlier a19 comment; none had one.

### Issues filed

One issue per finding whose disposition is **issue**, with 3.14 split into its
three groups and 8.1 into its two parts. Each body ends with a link to the
finding in the audit at `c00d910`. Locations are at `1ac47df` and the numbers
are the re-baseline's where it measured them; otherwise the body says the count
is the audit's at `ba6c00b`. Labels are the repositories' own.

| Finding                          | Issue                                                                   | Title                                                                        | Label        |
| -------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------ |
| 8.1, upstream                    | [deno-hooks#13](https://github.com/TheSwanFactory/deno-hooks/issues/13) | Hook install fails in a git worktree: it assumes `.git` is a directory       | bug          |
| 8.1, the pin                     | [#515](https://github.com/TheSwanFactory/hclang/issues/515)             | Hook runner is pinned to a yanked deno-hooks pre-release                     | dependencies |
| 1.5                              | [#516](https://github.com/TheSwanFactory/hclang/issues/516)             | Decide the four skipped schema suites in `evaluate.schemas.test.ts`          | question     |
| 1.6                              | [#517](https://github.com/TheSwanFactory/hclang/issues/517)             | The compiled `hc` binary embeds the workspace's `node_modules`               | enhancement  |
| 2.2                              | [#518](https://github.com/TheSwanFactory/hclang/issues/518)             | Group `Frame`'s protocol into smaller units                                  | enhancement  |
| 3.4                              | [#519](https://github.com/TheSwanFactory/hclang/issues/519)             | Decide MAML's future: expose, publish or delete                              | question     |
| 3.5                              | [#520](https://github.com/TheSwanFactory/hclang/issues/520)             | Decide whether the evaluator applies the 006.17 §6 partition rule            | question     |
| 3.14, the REPL; 6.3              | [#521](https://github.com/TheSwanFactory/hclang/issues/521)             | Test the REPL                                                                | enhancement  |
| 3.14, numeric paths; 6.3         | [#522](https://github.com/TheSwanFactory/hclang/issues/522)             | Test the untested numeric paths                                              | enhancement  |
| 3.14, rare values and paths; 6.3 | [#523](https://github.com/TheSwanFactory/hclang/issues/523)             | Test rare values and paths in `lib/frames`                                   | enhancement  |
| 3.16, `lib` and `cli`            | [#524](https://github.com/TheSwanFactory/hclang/issues/524)             | Test the untaken refusal branches in `lib` and `cli`                         | enhancement  |
| 3.22                             | [#525](https://github.com/TheSwanFactory/hclang/issues/525)             | Decide the unused bundled examples `gerbil.hc`, `led_blink.hc` and `hcsv.hc` | question     |
| 4.18                             | [#526](https://github.com/TheSwanFactory/hclang/issues/526)             | Review TypeScript tests that re-assert testdoc claims                        | enhancement  |
| 4.19                             | [#527](https://github.com/TheSwanFactory/hclang/issues/527)             | The footprint walk resolves names by a narrower rule than lookup             | question     |
| 4.20                             | [#528](https://github.com/TheSwanFactory/hclang/issues/528)             | `hc/cd-bit-kernel.hc` asserts three error-contract examples twice            | enhancement  |
| 4.21                             | [#529](https://github.com/TheSwanFactory/hclang/issues/529)             | Only two of eight commit sites notify effect subscribers                     | question     |
| 6.6                              | [#530](https://github.com/TheSwanFactory/hclang/issues/530)             | Recognize a Denum once per observation                                       | enhancement  |
| 8.4                              | [#531](https://github.com/TheSwanFactory/hclang/issues/531)             | Decide whether hcweb moves to preact 11                                      | dependencies |

Where a body differs from the plan's draft, because the head or a re-check
differed:

- **8.1, upstream.** The installer's source was read on JSR for both versions:
  0.2.1-dev.1765778019 takes the root from `--show-toplevel` (`src/files.ts:12`)
  and calls `ensureDir` on `` `${gitRoot}/.git/hooks` ``
  (`src/install.ts:89-90`); 0.3.0 does the same at `src/install.ts:48` and
  `:149-150`. JSR's metadata still marks 0.2.1 and the pinned pre-release
  yanked, with 0.3.0 the latest. #515 links deno-hooks#13.
- **1.5.** The four suites are at `lib/execute/evaluate.schemas.test.ts:263`,
  `:290`, `:309` and `:368`, after step 13's split (2.10).
- **1.6.** The body gives both sizes: 186,020,242 bytes at `ba6c00b` and
  181,462,930 at the head (107.61 MB embedded, `node_modules/` 104.38 MB).
  `deno info --json cli/hc.ts` still lists no npm package.
- **2.2.** Recounted at the head: `Frame` is `lib/frames/frame.ts:633-1454`, 822
  lines, with 54 instance methods and 21 static members (23 at `ba6c00b`; 3.17
  and 4.12 removed `Frame.signed` and `quantityOperator`). The 68 subclasses and
  45 overrides are the audit's counts.
- **3.14 and 6.3.** The whole-chain lcov at the head shows each of the audit's
  41 functions still unrun. The numeric issue adds that #514's review restored
  the `ratioParts` overrides of sequences and typed numbers, which 4.14 had
  deleted, and lists 9 other restored overrides no test runs (`promoteOne`,
  `isZero`, `integralValue` and `compareSame` on the null-ranked rungs). The
  REPL issue also takes `cli/hc-log.ts` from 6.3, because its unrun lines
  include the REPL's prompt branch (`:18`, set by `cli/hc.ts:170`); with it,
  each of 6.3's 11 modules and `cli/prompt.ts` is in exactly one issue.
- **3.16.** The body gives the audit's and the head's untaken branches per
  folder and the four starting files' counts.
- **3.22.** Re-run at the head: `gerbil.hc` and `led_blink.hc` exit 1 with the
  audit's errors, `hcsv.hc` exits 0. `hc/cqml.hc`'s exception is now cited at
  `cli/test-docs.ts:23`, since 7.4 replaced the `cli/CLAUDE.md` line.
- **4.18.** The counts are the audit's at `ba6c00b`, not re-measured;
  `evaluate.test.ts` is now the nine `evaluate.*.test.ts` files.
- **4.20.** Lines 552–557 and 562–567 are unchanged; the file has 117 claims.
- **4.21.** The body names the eight sites at the head and notes that 4.5's
  `CommitNotice` comment (`effect-registry.ts:117-119`) states the two notifying
  sites, while the module comment at `:19-24` still says every committed
  mutation lands in them.
- **6.6.** Locations at the head: `recognizeDenum` `fourth-hash.ts:150`,
  `observeDenum` `:216`, `observeKDCoordinates` `:269`, `multiplyDenum` `:307`;
  the test prints 5 s under `--parallel`.

### Issues closed and commented on

Each comment's facts were re-checked at the head before it was posted.

- **#481, closed** as completed: resolved by #499 (`.gitignore:55`, and
  `"!bundle/hc-sources.ts"` in `lib/deno.json`'s `publish.exclude`), with 7.3's
  remainder fixed on this branch (`62c431d`, shipping in v0.55.4). 7.13.
- **#452, closed** as completed: resolved by #451 (`3511dd7`, the issue's own
  adoption comment), then made obsolete by #456, which removed the Figure Inlay
  wrapper and renamed its test file, and by #506 and #508. No `graft` remains in
  `lib/` or `hc/`. 7.13.
- **#498, commented**, stays open: `hc/cart-zip.hc` (19 claims) asserts 9 of the
  11 scenarios, and the native `|&|` (#502, `hc/native-cart-zip.hc`, 24 claims)
  answers the other 2 by truncating. Whether that settles the Zip policy is the
  owner's call (Approval). 7.13.
- **#361, commented**: the issue's examples, run with `execute` from
  `lib/mod.ts`, each with its answer. Two facts differed from the plan's draft.
  `1 - “text”` answers `$!.flop-domain -`, an error rather than nil, because `-`
  needs a Denum on the right. The issue's migration example changed:
  `(1 + “text”) : {“else”}` answers `“text”` and `?` runs its branch. The cited
  test was renamed in #506 (`e307ba2`, found with `git log -S`) to "uses
  structural Flop for nonnumeric operator pairs",
  `lib/frames/frame-numeric.test.ts:205`. 7.13.
- **#362, commented**: #365's MVP, with `hc/units.hc` at 40 claims. The plan's
  draft said `05-uom-mvp.md` leaves T3 to T7 open; the spec names no tensions,
  so the comment cites the issue's own 2026-09-09 list and records the one
  change since: after #358, `9.8.m === 9.8.kg` answers nil, which settles T2's
  conflation. T3, T5, T6 and T7 remain open. 7.13.
- **#310, #311, #312, commented**: the move to `hc/BitScheme.hc` (#405), the
  file's 40 claims, 32 pass and 8 unimplemented, and each issue's section and
  count: #310 line 254, 3 (its implemented sections at 217 and 234); #311 line
  282, 2; #312 line 315, 3. 7.13.
- **#319, commented**: the 6 `.adoc` files, the `DOC_EXTENSIONS` shim
  (`cli/runfile.ts:10`), the path move, and 7.8's three copies of the BitScheme
  tutorial (`web/index.html:141`, `3701615`, `static/` excluded in
  `web/deno.json`). 7.8 and 7.13.

## Defects found

- Step 14 found no defect in product code. `lib/frames/frame.ts:95` said the
  `parent` field is written only by `setParent`, the claim 7.1 corrected in the
  docs; `FrameArray.in` (`frame-array.ts:85`) and `Frame.copy()` also write it.
  Step 17 fixed the comment to match `lib/frames/CLAUDE.md`: `setParent` is the
  only path that attaches it, and a copy carries the source's existing link.
  Comment only. Files: `lib/frames/frame.ts`. Commit: `0d16e51`.
- Step 15 found no defect in product code. The audit's 7.10 was wrong about
  `spec/a13-error-handle/01-error-handling.md`: v0.40.0 shipped 14's use-site
  `$!` operator, not 01's parent-scope `.$:` property
  (`git grep '\.\$:' -- lib hc cli` finds nothing), so 01 and the tutorial say
  "Not implemented".
- Step 16 found no new defect. 02's defect, that `@std/expect` 0.219.1 ignored
  `expect`'s message argument, is gone with 8.2.
- Step 17's re-baseline found that 8.2 (`94104e4`) broke a13's archive recipe.
  It changed `experiments/a13-recovery-spike/spike.test.ts:11` from
  `jsr:@std/expect@^0.219.1` to the bare `@std/expect`, which `05b4f25`'s import
  map lacks, so the head's folder copied into `05b4f25`'s tree fails to
  type-check (TS2307), while its README and step 15's entry say its tests pass
  there. `ba6c00b`'s folder still passes 13 of 13. Step 15 checked the recipe at
  `c00d910`, before 8.2 merged. Fixed: the line is again
  `jsr:@std/expect@^0.219.1`, as at `ba6c00b`, because an archived experiment
  keeps its own pins and the dependency sweep should not reach it. a13 is the
  only archived experiment, and 8.2 touched no other file in it. With the fix,
  the head's folder in a `git archive 05b4f25` tree passes 13 of 13 in three
  runs. At the head, `deno test experiments/a13-recovery-spike` still passes 10
  and fails 3, and now adds `@std/expect`, `@std/assert` and `@std/fmt` 0.219.1
  to `deno.lock`; `--no-lock` avoids that, and no task runs the folder. Files:
  `experiments/a13-recovery-spike/spike.test.ts`. Commit: `0d16e51`.
- One `deno task coverage:check` at the head, started at 19:42 by an earlier
  run's script under load, failed: `deno coverage` of lib stopped on an empty V8
  coverage file ("EOF while parsing a value at line 1 column 0") after a 61.9 s
  `test:lib`, and the floor reported lib's report as empty. The run at 19:54 and
  the merge step's passed, so it did not reproduce.

## GitHub actions

Every action of step 17, in the order taken. Nothing else was filed, closed or
commented on.

| Repository                  | Action                       | Number | URL                                                                         | Finding                |
| --------------------------- | ---------------------------- | ------ | --------------------------------------------------------------------------- | ---------------------- |
| `TheSwanFactory/deno-hooks` | filed                        | #13    | https://github.com/TheSwanFactory/deno-hooks/issues/13                      | 8.1, upstream          |
| `TheSwanFactory/hclang`     | filed                        | #515   | https://github.com/TheSwanFactory/hclang/issues/515                         | 8.1, the pin           |
| `TheSwanFactory/hclang`     | filed                        | #516   | https://github.com/TheSwanFactory/hclang/issues/516                         | 1.5                    |
| `TheSwanFactory/hclang`     | filed                        | #517   | https://github.com/TheSwanFactory/hclang/issues/517                         | 1.6                    |
| `TheSwanFactory/hclang`     | filed                        | #518   | https://github.com/TheSwanFactory/hclang/issues/518                         | 2.2                    |
| `TheSwanFactory/hclang`     | filed                        | #519   | https://github.com/TheSwanFactory/hclang/issues/519                         | 3.4                    |
| `TheSwanFactory/hclang`     | filed                        | #520   | https://github.com/TheSwanFactory/hclang/issues/520                         | 3.5                    |
| `TheSwanFactory/hclang`     | filed                        | #521   | https://github.com/TheSwanFactory/hclang/issues/521                         | 3.14 (REPL), 6.3       |
| `TheSwanFactory/hclang`     | filed                        | #522   | https://github.com/TheSwanFactory/hclang/issues/522                         | 3.14 (numeric), 6.3    |
| `TheSwanFactory/hclang`     | filed                        | #523   | https://github.com/TheSwanFactory/hclang/issues/523                         | 3.14 (rare paths), 6.3 |
| `TheSwanFactory/hclang`     | filed                        | #524   | https://github.com/TheSwanFactory/hclang/issues/524                         | 3.16                   |
| `TheSwanFactory/hclang`     | filed                        | #525   | https://github.com/TheSwanFactory/hclang/issues/525                         | 3.22                   |
| `TheSwanFactory/hclang`     | filed                        | #526   | https://github.com/TheSwanFactory/hclang/issues/526                         | 4.18                   |
| `TheSwanFactory/hclang`     | filed                        | #527   | https://github.com/TheSwanFactory/hclang/issues/527                         | 4.19                   |
| `TheSwanFactory/hclang`     | filed                        | #528   | https://github.com/TheSwanFactory/hclang/issues/528                         | 4.20                   |
| `TheSwanFactory/hclang`     | filed                        | #529   | https://github.com/TheSwanFactory/hclang/issues/529                         | 4.21                   |
| `TheSwanFactory/hclang`     | filed                        | #530   | https://github.com/TheSwanFactory/hclang/issues/530                         | 6.6                    |
| `TheSwanFactory/hclang`     | filed                        | #531   | https://github.com/TheSwanFactory/hclang/issues/531                         | 8.4                    |
| `TheSwanFactory/hclang`     | closed as completed, comment | #481   | https://github.com/TheSwanFactory/hclang/issues/481#issuecomment-7091456716 | 7.13                   |
| `TheSwanFactory/hclang`     | closed as completed, comment | #452   | https://github.com/TheSwanFactory/hclang/issues/452#issuecomment-7091457747 | 7.13                   |
| `TheSwanFactory/hclang`     | commented, stays open        | #498   | https://github.com/TheSwanFactory/hclang/issues/498#issuecomment-7091460254 | 7.13                   |
| `TheSwanFactory/hclang`     | commented, stays open        | #361   | https://github.com/TheSwanFactory/hclang/issues/361#issuecomment-7091460753 | 7.13                   |
| `TheSwanFactory/hclang`     | commented, stays open        | #362   | https://github.com/TheSwanFactory/hclang/issues/362#issuecomment-7091461331 | 7.13                   |
| `TheSwanFactory/hclang`     | commented, stays open        | #310   | https://github.com/TheSwanFactory/hclang/issues/310#issuecomment-7091461898 | 7.13                   |
| `TheSwanFactory/hclang`     | commented, stays open        | #311   | https://github.com/TheSwanFactory/hclang/issues/311#issuecomment-7091462382 | 7.13                   |
| `TheSwanFactory/hclang`     | commented, stays open        | #312   | https://github.com/TheSwanFactory/hclang/issues/312#issuecomment-7091462816 | 7.13                   |
| `TheSwanFactory/hclang`     | commented, stays open        | #319   | https://github.com/TheSwanFactory/hclang/issues/319#issuecomment-7091463262 | 7.8, 7.13              |

The other open issues the audit checked, #277, #374, #410, #428, #474 and #485,
stay open with no comment (7.13's keep).

## Measurements

**8.2, counts before and after the import swap.** `NO_COLOR=1 deno task test` on
`737f7aa` (`c00d910` plus this document's first commit, now `e4e3641`) and on
`94104e4`. The runs after `a4f532f`, `e0d39d1`, `62c431d` and `baf86a4` printed
the same lines. From `17f0ff4` on, `test:scripts` prints 21 passed (127 steps):
the new `scripts/coverage-floor.test.ts` adds 4 tests and 9 steps, and no other
count changes.

| Run                      | Before `94104e4`                   | After `94104e4`                    |
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
worktree) and 35.1 s at `17f0ff4`, which includes the new `check` task's 3.2 s.
`deno task coverage:check` took 41.1 s at `17f0ff4`: lib 26.2 s, cli 7.2 s, maml
0.4 s, scripts 2.2 s, web 2.2 s and `experiments/007-observer-algebras` 2.8 s.

**Step 17, before and after.** The re-baseline's tables (step 17) compare the
audit's numbers, `ba6c00b` and `1ac47df` under the same conditions. In short (an
empty cell was not re-measured; the re-run's counts were not recorded):

| Measure                                     | Audit, at `ba6c00b` | Re-run at `ba6c00b` | `1ac47df`                         |
| ------------------------------------------- | ------------------- | ------------------- | --------------------------------- |
| `test:all`, median wall s                   | 37.85               | 35.99               | 35.12                             |
| `test:lib`, median wall s                   | 13.49               | 13.28               | 6.86                              |
| Test files run by `test:all`                | 99                  |                     | 117                               |
| Tests passed, steps, ignored                | 268, 1,784, 4       |                     | 290, 1,804, 4                     |
| Testdoc claims: total, pass, fail, unimpl.  | 944, 934, 0, 10     |                     | 944, 934, 0, 10                   |
| Line coverage, all six packages, `test:all` | 92.4%               |                     | 93.4%                             |
| Untaken branches, all six, `test:all`       | 356                 |                     | 333                               |
| Uncovered lines in 6.3's 11 modules         | 216                 |                     | 131                               |
| `scripts/hc` bytes                          | 186,020,242         | 186,020,242         | 181,462,930                       |
| a13 in `05b4f25`'s tree                     | 13 passed           | 13 passed           | TS2307; 13 passed after `0d16e51` |

The commits after `1ac47df` change docs, one comment (`lib/frames/frame.ts`) and
the archived a13 test, which no task runs. On `0d16e51` plus this document's
final edits, `NO_COLOR=1 deno task test` exited 0 in 43.0 s with the
re-baseline's counts: `test:cli` 11 passed (77 steps), `test:lib` 215 passed
(1544 steps) and 4 ignored, `test:load-order` 1 (1 step), `test:maml` 3 (18
steps), `test:scripts` 21 (127 steps), `test:observer-algebras` 33,
`test:classical-cd` 3 (17 steps), web `test:components` 1 (4 steps) and
`test:artifact` 2 (16 steps), `test:doc` 21 testdocs executed with 0 failed, and
`test:npm` verified `hclang@0.55.3`. `core.bare` was `false` and the main
checkout's `git status --short` was empty.
