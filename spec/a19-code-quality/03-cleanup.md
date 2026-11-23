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

**8.12** Regenerated the lock with `rm deno.lock && deno install`. It went from
111,727 bytes at `c00d910` to 63,938. Its `remote` section went from 210 entries
to none, and `@luca/esbuild-deno-loader@0.11.0`, `@fresh/init@2.3.3` and
`@std/encoding@1.0.10` are gone. It holds 34 jsr and 224 npm packages; the one
jsr package at two versions is `@deno/loader` (0.3.14 and 0.4.0), which 8.2
keeps. `deno task test` passes with the same counts and `deno install --frozen`
exits 0. Files: `deno.lock`. Commit: `18d5ef0`.

## Step 17: Close out

## Defects found

## GitHub actions

## Measurements

**8.2, counts before and after the import swap.** `NO_COLOR=1 deno task test` on
`737f7aa` (`c00d910` plus this document's first commit) and on `07a9696`. The
runs after `dc195fa` and `18d5ef0` printed the same lines.

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
