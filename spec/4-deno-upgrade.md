# Deno Upgrade Implementation Summary

## Scope

Upgrade the locally observed Deno **2.6.0** runtime and floating GitHub Actions
**2.x** selectors to exact Deno **2.9.5**. The target was reverified as the
latest stable release on **2026-08-09** using the
[official Deno releases page](https://github.com/denoland/deno/releases/).

Implementation pinned both CI workflows, enabled frozen dependency installation,
regenerated the single root lockfile under the target runtime, and aligned
contributor guidance. The complete Task 6.3 command sequence passes under exact
Deno 2.9.5 after the behavior-preserving compatibility corrections: all ten
required commands exited 0, generated build output was removed, and no
unexplained lockfile or generated diff remains. The two HC executable-document
commands still report their internal diagnostic counters separately from their
successful process exit, as detailed in the final evidence.

## Runtime Target Verification

- **Verification date:** 2026-08-09
- **Authoritative source:**
  [Official Deno releases page](https://github.com/denoland/deno/releases/)
- **Reverified stable target:** Deno 2.9.5 (`v2.9.5`, marked **Latest**)
- **Observed local baseline:** Deno 2.6.0
- **Floating CI location 1:** `.github/workflows/deno.js.yml` uses
  `denoland/setup-deno@v2` without a `deno-version` input in the step named
  `Use Deno 2.x`.
- **Floating CI location 2:** `.github/workflows/deploy.yml` uses
  `denoland/setup-deno@v2` with `deno-version: v2.x`.
- **Target comparison:** The reverified stable release still matches the planned
  Deno 2.9.5 target, so no planned target references require replacement before
  downstream edits.

Content from the upstream release page is summarized and rephrased for licensing
compliance.

## Runtime-Sensitive Reference Inventory

Every required runtime-sensitive reference found in tracked repository files has
a recorded current state, disposition, compatibility rationale, and validation
method below. The inventory gate is therefore complete; no unrecordable entry
requires downstream work to halt. `Conditional` means retain the current state
unless validation under exact Deno 2.9.5 demonstrates an incompatibility.

### Workflows

| File                            | Current state                                                                                                                                                                  | Disposition | Rationale                                                                                                                                             | Validation method                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/deno.js.yml` | `setup-deno@v2` has no `deno-version`; the step is named `Use Deno 2.x`; `deno install` precedes `deno task build`, `deno task test:all`, and conditional `deno task publish`. | **Change**  | Pin `deno-version: v2.9.5` and replace mutable installation with `deno ci`; retain triggers, permissions, build, test, release, and publish behavior. | Inspect workflow syntax and exact selector; run `deno ci`, `deno task build`, and `deno task test:all`; validate publish configuration without publishing. |
| `.github/workflows/deploy.yml`  | `setup-deno@v2` uses floating `deno-version: v2.x`; `deno task build` runs without a frozen install before `deployctl`.                                                        | **Change**  | Pin `v2.9.5` and add `deno ci` before build; retain checkout, permissions, build, and deploy action behavior.                                         | Inspect workflow syntax and exact selector; run `deno ci` and the web build locally; hosted deployment remains a CI acceptance check.                      |

### Workspace Manifests and Task Commands

The repository has one root workspace configuration and exactly four member
manifests (`cli`, `lib`, `maml`, and `web`). No member-specific lockfiles are
present or planned.

| File/reference                      | Current state                                                                                                                                                                                                                                                                                                                                        | Disposition     | Rationale                                                                                                                                                                              | Validation method                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno.json` workspace/configuration | Workspace members are `cli`, `lib`, `maml`, and `web`; compiler libraries include `deno.ns`; formatter/linter rules and the root import map are shared. No runtime engine field exists.                                                                                                                                                              | **Retain**      | Deno supports the current workspace/configuration shape; do not invent an engine field. TypeScript 6, formatter, and linter compatibility still require target-runtime checks.         | `deno fmt --check`, `deno lint`, and `deno check cli/hc.ts lib/mod.ts maml/tag.ts web/main.ts`.                                             |
| `deno.json` tasks                   | Deno-facing tasks are `build`, `bump`, `hc`, `publish`, `setup`, `tag`, `test`, `test:cli`, `test:doc`, `test:lib`, `test:maml`, `test:web`, `test:bs`, and `test:all`; `clean` removes lockfiles and the three `vscode:*` tasks invoke Node tooling. `bump`, `tag`, `publish`, `clean`, and `vscode:*` are mutating or external-release operations. | **Retain**      | Existing task orchestration is part of repository behavior. Validate safe underlying commands without invoking commits, tags, publishing, deletion, or VS Code marketplace operations. | Run the explicit quality/build/test sequence below; run `deno check scripts/bump-version.ts`; statically inspect mutating/release commands. |
| `cli/deno.json` manifest            | Package metadata, CLI entry/bin, JSR import map, and no runtime engine field.                                                                                                                                                                                                                                                                        | **Retain**      | The manifest shape and versioned imports are supported; target validation determines compatibility without speculative edits.                                                          | `deno check cli/hc.ts` and CLI tests.                                                                                                       |
| `cli/deno.json` tasks               | `build` uses `deno compile` with read/write/env permissions and output `scripts/hc`; `hc` uses `deno run -A`; `test` uses explicit permissions; `test:bs` and `test:doc` call `deno task hc`.                                                                                                                                                        | **Retain**      | Permissions and task chaining express required CLI behavior; no unsupported option is presently identified.                                                                            | `deno task build`, `deno task test:cli`, `deno task test:bs`, and `deno task test:doc`.                                                     |
| `lib/deno.json`                     | Strict compiler mode, one JSR export (`./mod.ts`), package metadata, and no tasks or runtime engine field.                                                                                                                                                                                                                                           | **Retain**      | This is a runtime-neutral JSR library manifest and needs no planned structural change.                                                                                                 | `deno check lib/mod.ts` and `deno task test:lib`.                                                                                           |
| `maml/deno.json` manifest           | Strict compiler mode, one export (`./tag.ts`), package metadata, and no runtime engine field.                                                                                                                                                                                                                                                        | **Retain**      | The manifest shape is supported; MAML remains separately validated because root `test:all` omits it.                                                                                   | `deno check maml/tag.ts` and `deno task test:maml`.                                                                                         |
| `maml/deno.json` task               | `test` runs mutating `deno fmt`, `deno lint --fix`, then `deno test` with env/read/write permissions.                                                                                                                                                                                                                                                | **Retain**      | Preserve package task semantics; final quality evidence uses non-mutating root checks before the package test.                                                                         | `deno fmt --check`, `deno lint`, then `deno task test:maml`.                                                                                |
| `web/deno.json` manifest            | Fresh/Preact web package with JSX settings, exports, import map, and no runtime engine field.                                                                                                                                                                                                                                                        | **Retain**      | Current shape is supported; dependencies and unstable flags are gated separately below.                                                                                                | `deno check web/main.ts`, `deno task test:web`, and web build.                                                                              |
| `web/deno.json` tasks               | `cli`, `manifest`, `start`, `build`, `preview`, and `update` use Fresh and `deno run`; `cli`, `start`, and `preview` include `--unstable-kv`; `start` watches source; `update` is a mutating remote updater.                                                                                                                                         | **Conditional** | Preserve command behavior unless Deno 2.9.5 rejects an option or Fresh integration; do not run the updater merely to validate the runtime upgrade.                                     | Run web check/test/build and focused non-watch startup/CLI checks; statically inspect `update`; validate KV flags as recorded below.        |

### Lockfile, Dependencies, Flags, and APIs

| File/reference                                                                                                                                                                                                                                                                                                                                      | Current state                                                                                                                                                                                         | Disposition     | Rationale                                                                                                                                                                                     | Validation method                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `deno.lock`                                                                                                                                                                                                                                                                                                                                         | The sole root lockfile uses schema version `5` and records JSR specifiers/integrities plus deno.land and esm.sh remote metadata/redirects.                                                            | **Conditional** | Keep one lockfile. Regenerate only with exact Deno 2.9.5 after dependency decisions, and commit only deterministic target-generated changes; preserve the current file if regeneration fails. | Run `deno ci`; compare any target-generated diff; rerun `deno ci` with the committed result.                             |
| `deno.json` Fresh/JSR/esm.sh imports                                                                                                                                                                                                                                                                                                                | Fresh `1.7.3`; deno-hooks JSR dev pin; `@std/expect`; esm.sh hclang `0.7.2`, Preact `10.23.1`, signals, and Twind families; deno.land std `0.216.0`.                                                  | **Conditional** | Versions are already constrained and lockfile-backed. Retain unless a target-runtime failure proves a dependency change is required.                                                          | `deno ci`, aggregate type-check, `deno task test:all`, and web build.                                                    |
| `cli/deno.json` JSR imports                                                                                                                                                                                                                                                                                                                         | Chalk `^1.0.1`, `@std/cli` `^1.0.13`, and `@std/expect` `^0.219.1`.                                                                                                                                   | **Conditional** | Existing constraints resolve in the committed lockfile; avoid unrelated dependency modernization.                                                                                             | `deno ci`, `deno check cli/hc.ts`, and `deno task test:cli`.                                                             |
| `web/deno.json` Fresh/esm.sh imports                                                                                                                                                                                                                                                                                                                | Fresh `1.7.3`; esm.sh hclang `0.7.2`, Preact `10.23.1`, signals, and Twind families; deno.land std `0.216.0`.                                                                                         | **Conditional** | Preserve the established Fresh 1.x graph unless web validation demonstrates Deno 2.9.5 incompatibility.                                                                                       | `deno ci`, `deno check web/main.ts`, `deno task test:web`, and web build.                                                |
| `web/dev.ts` remote imports                                                                                                                                                                                                                                                                                                                         | Direct Fresh `1.7.3/dev.ts` and deno.land std `0.216.0` dotenv imports.                                                                                                                               | **Conditional** | They match the manifest-era dependency graph; change only on an observed Fresh/runtime failure.                                                                                               | `deno check web/dev.ts`, web build, and focused dev-entry startup check.                                                 |
| Direct JSR source imports in `scripts/bump-version.ts`, `cli/{flatten,hc,runfile}.test.ts`, `lib/execute/{eval-pipe,evaluate,execute,hc-env,hc-eval,hc-lang,hc-test,lex-pipe,parse}.test.ts`, `lib/execute/{hc-log,script-spec}.ts`, `lib/frames/*.test.ts`, `lib/ops/iterators.test.ts`, `maml/{maml,tag}.test.ts`, and `web/tests/hclang.test.ts` | Versioned `@std/expect`, `@std/testing`, `@std/cli`, and Chalk imports; API documentation examples also reference the published hclang JSR package.                                                   | **Conditional** | These imports are constrained and resolved by the root lockfile. Keep them unless target checks/tests expose a concrete incompatibility.                                                      | `deno ci`, aggregate type-check, `deno task test:all`, `deno task test:maml`, and `deno check scripts/bump-version.ts`.  |
| `web/deno.json` and `web/dev.ts` `--unstable-kv`                                                                                                                                                                                                                                                                                                    | The flag appears in web `cli`, `start`, and `preview` tasks and in the `web/dev.ts` shebang.                                                                                                          | **Conditional** | Preserve KV enablement while Fresh 1.7.3 requires it; remove or replace only if Deno 2.9.5 rejects it or stable KV behavior is verified equivalent.                                           | Check task parsing under Deno 2.9.5, run web tests/build, and perform a focused non-watch startup check.                 |
| `lib/execute/script-spec.ts` `Deno.Command`/`Deno.execPath`                                                                                                                                                                                                                                                                                         | Builds `['deno', 'run', '--allow-all', 'lib/cli/hc.ts', ...args]`, executes the current Deno binary, pipes output, and checks exit status. This is the only tracked implementation use of either API. | **Conditional** | Both APIs are stable in Deno 2; retain argument construction unless focused execution fails under the target.                                                                                 | `deno check lib/execute/script-spec.ts` and `deno test --allow-run --allow-read --allow-env lib/execute/script-spec.ts`. |

### Runtime Documentation

| File                              | Current state                                                                                                                                      | Disposition | Rationale                                                                                                                                 | Validation method                                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                       | Identifies Deno as the runtime, gives platform-neutral links plus example installation/task commands, but declares no conflicting runtime version. | **Retain**  | Generic contributor guidance remains compatible with Deno 2.9.5; avoid adding a manifest-like engine contract not required by the design. | Review commands against retained tasks and exact-version CI contract; `deno fmt --check README.md`.                                                            |
| `CLAUDE.md`                       | Developer guide uses Deno add/task/fmt/lint/build commands without a runtime selector.                                                             | **Retain**  | Commands remain valid and no stale version conflicts with the target.                                                                     | Review command names against manifests; `deno fmt --check CLAUDE.md`.                                                                                          |
| `doc/spec/2-deno-hooks/README.md` | Historical draft says Deno Hooks minimum is 1.40+ and recommended is 2.0+; examples use `Deno.Command` and Deno CLI commands.                      | **Retain**  | Deno 2.9.5 satisfies both stated compatibility bounds, and changing a historical subsystem specification is unnecessary.                  | Static compatibility review; `deno fmt --check doc/spec/2-deno-hooks/README.md`.                                                                               |
| `CHANGELOG.md`                    | Records prior broad Deno 2.x compatibility but not the 2.6.0-to-2.9.5 upgrade.                                                                     | **Change**  | Task 5.2 must add the observed baseline, exact target, compatibility outcome, and validation result after implementation.                 | Confirm the final entry names both versions and matches final validation evidence; `deno fmt --check CHANGELOG.md`.                                            |
| `spec/4-deno-upgrade.md`          | Records the target/baseline and planned checks; this inventory was previously absent.                                                              | **Change**  | This task adds complete planned dispositions; Task 5.2 later replaces planned outcomes with final changed-file and validation evidence.   | `deno fmt --check spec/4-deno-upgrade.md` plus an inventory completeness review against tracked workflows, manifests, imports, flags, APIs, and documentation. |

## Task 3.1 Target-Runtime Compatibility Review

The focused review used `npx --yes deno@2.9.5 ...`; the exact pinned npm package
supplied Deno 2.9.5, V8 15.0.245.2-rusty, and TypeScript 6.0.3 without replacing
the locally installed Deno 2.6.0 executable.

| Surface                                          | Final disposition and evidence                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root and four member manifests                   | **Retain.** All eight named task files passed focused `fmt --check`; root lint checked 101 files successfully. Workspace shape, compiler options, task syntax, permissions, and package metadata were accepted by Deno 2.9.5.                                                                                         |
| CLI compile command                              | **Retain.** `deno task build` compiled `cli/hc.ts` with the existing permission and output flags. No tracked generated artifact changed.                                                                                                                                                                              |
| Package commands                                 | **Retain.** CLI passed 4 tests/20 steps, library passed 30 tests/278 steps with 5 ignored, and web passed 1 test. MAML's two metadata-tag assertions failed identically on Deno 2.6.0 and 2.9.5, so they are a pre-existing behavior blocker rather than an upgrade incompatibility.                                  |
| Fresh/JSR/esm.sh dependencies                    | **Retain.** CLI, library, and web tests passed, and the Fresh 1.7 build generated all routes/islands successfully. No target failure required a constraint change.                                                                                                                                                    |
| `web/deno.json`/`web/dev.ts` options and imports | **Retain.** Deno 2.9.5 accepted `--unstable-kv`, and Fresh build execution accepted the current remote imports and dev entry. The aggregate check reaches `web/fresh.config.ts` but rejects its existing `static` property under both Deno 2.6.0 and 2.9.5; this is not target-induced.                               |
| `Deno.Command`/`Deno.execPath`                   | **Retain APIs.** Deno 2.9.5 type-checks both stable APIs. The direct `script-spec.ts` tests fail identically on 2.6.0 and 2.9.5 because the existing argv starts with an extra `deno` argument and names nonexistent `lib/cli/hc.ts`; this pre-existing test-helper defect is not evidence of an API incompatibility. |
| Repository-wide formatting                       | **No upgrade edit.** Deno 2.9.5 reports seven files while 2.6.0 already reports four. The three target-only files are `doc/out/madoko.css`, `doc/shannon/1-shannon.md`, and `doc/no_equal.md`; applying the proposed Markdown changes would rewrite HC examples and is outside this compatibility task.               |

No source, manifest, dependency, or lockfile change was required during the
focused Task 3.1 review. Task 6.1 subsequently corrected the baseline quality
blockers because its acceptance criteria require passing repository-wide checks:
ordinary specification Markdown was normalized, generated and HC-semantic
formatter inputs were excluded, and Fresh's supported `staticDir` field replaced
the invalid but behaviorally equivalent `static` object. The MAML and subprocess
helper failures remain attributed to later test-suite work. Property-based
testing remains not applicable because this spec defines no PBT task or
correctness property.

## Final Changed-File Dispositions

The implementation remains limited to the Deno upgrade and deterministic quality
surface. No application behavior, task definition, unstable flag, runtime API,
or dependency constraint was changed.

| File                                                | Final disposition                                                                                                                     | Evidence/rationale                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.github/workflows/deno.js.yml`                     | **Changed.** Pin `denoland/setup-deno@v2` to `v2.9.5`, rename the runtime step, and replace `deno install` with `deno ci`.            | Exact runtime and frozen-install configuration are present; existing triggers, permissions, build, test, release, and publish steps are retained.      |
| `.github/workflows/deploy.yml`                      | **Changed.** Replace `v2.x` with `v2.9.5` and add `deno ci` before build.                                                             | Existing checkout, permissions, build, and deploy configuration is retained. Hosted deployment remains outside local validation.                       |
| `deno.lock`                                         | **Changed.** Keep schema version 5 and the single root lockfile while accepting the deterministic graph regenerated under Deno 2.9.5. | No manifest constraint changed and no workspace lockfile was introduced; target-runtime `deno ci` accepts the committed result.                        |
| `deno.json`                                         | **Changed.** Exclude generated output, two HC-semantic Markdown documents, and the active Kiro task plan from repository formatting.  | Prevents Deno 2.9.5 formatting from rewriting generated CSS/HC examples or converting valid top-level task checkboxes into nested numbered-list items. |
| `web/fresh.config.ts`                               | **Changed.** Replace unsupported `static: { dir }` with Fresh 1.7.3's typed `staticDir` field.                                        | Preserves the same `./static` directory behavior and allows the aggregate entry-point check to pass.                                                   |
| `.kiro/specs/deno-upgrade/{requirements,design}.md` | **Changed.** Apply deterministic Deno 2.9.5 Markdown formatting.                                                                      | Resolves baseline formatting failures without semantic changes.                                                                                        |
| `.kiro/specs/deno-upgrade/tasks.md`                 | **Changed.** Restore the six top-level Kiro checklist items after Deno formatting had converted them to nested numbered-list items.   | Preserves every task's text and status while restoring syntactically valid task checkboxes; the exact file is now formatter-excluded.                  |
| `spec/2-type-tests/03-bitscheme-failures.md`        | **Changed.** Apply deterministic Deno 2.9.5 Markdown formatting.                                                                      | Resolves its baseline formatting failure without changing documented results.                                                                          |
| `README.md`                                         | **Changed.** Document Deno 2.9.5, `deno ci`, and the CI-equivalent build/test path using platform-neutral installation guidance.      | Guidance now matches the exact CI runtime contract.                                                                                                    |
| `CLAUDE.md`                                         | **Changed.** Add the exact development runtime and frozen install/build/test workflow.                                                | Contributor commands now match CI without changing product behavior.                                                                                   |
| `doc/spec/2-deno-hooks/README.md`                   | **Changed.** Replace broad historical Deno bounds with the repository-supported Deno 2.9.5 contract.                                  | Removes guidance that was weaker than the exact repository support decision.                                                                           |
| `CHANGELOG.md`                                      | **Changed.** Record the 2.6.0 baseline, 2.9.5 target, actual compatibility work, and current validation outcome.                      | Records the final Task 6.3 command pass and HC diagnostic caveat.                                                                                      |
| `spec/4-deno-upgrade.md`                            | **Changed.** Finalize implementation dispositions and evidence.                                                                       | Retains exact command outcomes and final artifact/diff state for Tasks 6.1–6.3.                                                                        |

The dependency constraints, package manifests, task definitions, `web`'s
`--unstable-kv` usage, and `Deno.Command`/`Deno.execPath` remain unchanged. Task
6.1 changed only root formatter scope and the behavior-equivalent Fresh
configuration field described above.

## Validation Evidence Available Before the Final Checkpoint

Evidence collected during Tasks 3.1–5.2 under the exact npm-distributed Deno
2.9.5 runtime includes:

- Runtime output identified Deno 2.9.5, V8 15.0.245.2-rusty, and TypeScript
  6.0.3.
- Frozen `deno ci` accepts the regenerated committed lockfile without changing
  dependency constraints.
- Focused `deno fmt --check` passed for the eight compatibility-review files,
  and root `deno lint` checked 101 files successfully.
- `deno task build` compiled the CLI without leaving a tracked generated
  artifact.
- CLI validation passed 4 tests/20 steps, library validation passed 30 tests/278
  steps with 5 ignored, web validation passed 1 test, and the Fresh production
  build generated all routes and islands.
- Deno 2.9.5 accepted the existing workspace/manifests, task syntax,
  `--unstable-kv`, remote imports, `Deno.Command`, and `Deno.execPath`; no
  source regression test was needed because source behavior did not change.

## Task 6.1 Deterministic Quality and Compatibility Evidence

Every required command was run from the repository root through the exact pinned
npm executable, `npx --yes deno@2.9.5`, because the machine-default executable
remains Deno 2.6.0.

| Command                                                   | Initial outcome                                                              | Corrected outcome                                                                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `deno --version`                                          | Passed: Deno 2.9.5, V8 15.0.245.2-rusty, TypeScript 6.0.3.                   | Passed with the same exact versions.                                                                                 |
| `deno ci`                                                 | Passed with the committed frozen lockfile.                                   | Passed after the compatibility edits.                                                                                |
| `deno fmt --check`                                        | Failed: 7 of 176 files were not formatted.                                   | Passed: checked 171 files after normalizing four ordinary Markdown files and excluding generated/HC-semantic inputs. |
| `deno lint`                                               | Passed: checked 101 files.                                                   | Passed: checked 101 files.                                                                                           |
| `deno check cli/hc.ts lib/mod.ts maml/tag.ts web/main.ts` | Failed with TS2353 on `web/fresh.config.ts`'s unsupported `static` property. | Passed after replacing it with Fresh 1.7.3's equivalent `staticDir: "./static"`.                                     |

Task 6.1 therefore passes Requirements 4.1 and 5.1–5.3, including retained
failure output and corrected reruns required by 5.5. No source behavior changed,
so no new regression test was required; the aggregate type-check directly
validates the corrected configuration. The complete Validation Suite is not yet
claimed because Tasks 6.2–6.3 still need to run build and all automated test
commands. The known baseline-identical MAML and subprocess-helper test failures
remain for that work and were not exercised by Task 6.1.

Property-based testing is not applicable: this feature spec defines no PBT task
or correctness property, and no PBT command or status update was required.

## Task 6.3 Clean Final Validation Pass

The complete validation sequence ran from the repository root through the exact
pinned npm executable, `npx --yes deno@2.9.5`. Timing is `/usr/bin/time -p` real
wall-clock time. Every required command exited 0.

| Sequence | Exact command                                                             | Result                                                                          | Runtime |
| -------: | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------: |
|        1 | `npx --yes deno@2.9.5 --version`                                          | Passed; Deno 2.9.5, V8 15.0.245.2-rusty, TypeScript 6.0.3                       |   1.12s |
|        2 | `npx --yes deno@2.9.5 ci`                                                 | Passed; frozen committed lockfile accepted                                      |   0.85s |
|        3 | `npx --yes deno@2.9.5 fmt --check`                                        | Passed; checked 170 files without mutation                                      |   0.80s |
|        4 | `npx --yes deno@2.9.5 lint`                                               | Passed; checked 101 files without mutation                                      |   0.71s |
|        5 | `npx --yes deno@2.9.5 check cli/hc.ts lib/mod.ts maml/tag.ts web/main.ts` | Passed                                                                          |   0.80s |
|        6 | `npx --yes deno@2.9.5 task build`                                         | Passed; compiled `scripts/hc`, which was removed after validation               |   1.34s |
|        7 | `npx --yes deno@2.9.5 task test:all`                                      | Passed; CLI 4/20 steps, library 30/278 steps with 5 tests ignored, web 1/1 step |   1.73s |
|        8 | `npx --yes deno@2.9.5 task test:maml`                                     | Passed; 2 tests/14 steps                                                        |   0.76s |
|        9 | `npx --yes deno@2.9.5 task test:bs`                                       | Passed at process level; HC diagnostics: 31 total, 14 pass, 17 fail             |   1.06s |
|       10 | `npx --yes deno@2.9.5 task test:doc`                                      | Passed at process level; HC diagnostics: 25 total, 24 pass, 1 fail              |   0.73s |

The ten-command wall-clock total was 9.90 seconds. The Deno unit/integration
runner reported no failures: CLI, library, web, and MAML contributed 37 passed
tests and 313 passed steps in total, with 5 library tests (4 steps) explicitly
ignored. The HC executable-document tasks do not propagate their internal
`test-fail` counters to the process status; their nonzero diagnostic counts are
recorded above rather than represented as zero-failure HC runs.

Post-suite cleanup removed the ignored `scripts/hc` build binary. Final
`git status --short` contains the same intended upgrade files plus this summary
and repaired Kiro spec, with no generated artifact and no new lockfile state;
`deno ci` did not alter the reviewed `deno.lock` diff. `git diff --check`
passes. The root task repair changed no task text or status. There are no
required-command blockers, and all Requirements 5.6, 6.3, and 6.4 command-level
acceptance checks are satisfied with the HC diagnostic caveat above.

## Kiro Artifacts

- Requirements:
  `/Users/ernest/GitHub/hclang/.kiro/specs/deno-upgrade/requirements.md`
- Design: `/Users/ernest/GitHub/hclang/.kiro/specs/deno-upgrade/design.md`
- DAG tasks: `/Users/ernest/GitHub/hclang/.kiro/specs/deno-upgrade/tasks.md`

Implementation sequencing and requirement traceability are authoritative in
`tasks.md`.
