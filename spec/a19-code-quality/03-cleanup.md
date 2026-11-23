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

## Step 15: Records and experiments

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
