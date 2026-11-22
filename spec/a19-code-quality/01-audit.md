# Code Quality Audit: Steps 1–8

**Covers:** steps 1–8 of the [plan](README.md): baseline, size and complexity,
dead code, duplication, boundaries, tests, docs and records, and tooling.\
**Status:** Measured. Every disposition below is a proposal, and all of them
await the owner's approval before step 9 starts.\
**Measured at:** `ba6c00b` (`ba6c00b29d532c052b2c7a75ae86db5781fda75c`), the
base of this branch. Its code is that of `390ee31` (v0.55.1), where the plan's
own numbers were taken; the plan's README is the only file that differs.
Registry versions in step 8 were read on 2026-11-22.\
**Environment:** Deno 2.9.7 (TypeScript 6.0.3) on an Apple M4 Pro (14 cores, 48
GB) running macOS 27.0.1 on AC power, with warm caches. CI pins Deno 2.9.5.
Other read-only analyses ran beside the timed runs, so the 1-minute load average
was between 2.6 and 5.9.

## Reading the findings

Each finding has an ID of the form `<step>.<n>`, a location, a number where one
applies, and a disposition:

- **Step 9 to 13:** the refactor step that acts on it.
- **Step 14 to 17:** the cleanup step that acts on it.
- **Issue:** recorded here and filed in step 17 once approved. This run filed,
  commented on and closed no issue.
- **Keep:** no change, for the reason given.

**Needs a decision** marks a disposition that changes something users or
developers would notice, or that goes beyond the plan's Rules. Approving the
disposition approves that change. [Dispositions](#dispositions) at the end
groups every finding by disposition and lists those decisions.

Paths are relative to the repository root, and line numbers are at `ba6c00b`. A
finding that several steps turned up appears once, under the step that owns it,
and the other steps point to it. In coverage figures a line is a line that
`deno coverage` instruments, not a line of the file: `lib/frames/frame.ts` has
686 instrumented lines among its 1,384.

## Step 1: Baseline

### Wall time

After one warm-up run of `test:all` (43.11 s), each of three rounds ran every
task that `test:all` chains, in chain order, and then the whole chain. Every run
exited 0.

| Task, in `test:all` order | Median s | Range s     | Share of sum |
| ------------------------- | -------: | ----------- | -----------: |
| `bundle:embed`            |     0.07 | 0.06–0.07   |         0.2% |
| `test:cli`                |     0.81 | 0.80–0.83   |         2.1% |
| `test:lib`                |    13.49 | 13.27–14.10 |        35.5% |
| `test:maml`               |     0.34 | 0.33–0.36   |         0.9% |
| `test:scripts`            |     2.07 | 1.95–2.18   |         5.5% |
| `test:observer-algebras`  |     1.54 | 1.51–1.57   |         4.1% |
| `test:web`                |     5.38 | 5.34–5.53   |        14.2% |
| `test:doc`                |     3.72 | 3.53–3.80   |         9.8% |
| `test:npm`                |     6.35 | 5.79–6.61   |        16.7% |
| `test:compiled`           |     4.18 | 3.74–4.42   |        11.0% |
| Sum of medians            |    37.95 |             |              |
| `test:all`, whole chain   |    37.85 | 36.39–38.39 |              |

Sub-step medians: `test:load-order` 0.61 s inside `test:lib`; web's `build` 0.12
s, `test:components` 0.92 s, `test:consumer` 3.08 s and `test:artifact` 1.26 s
inside `test:web`; `build:npm` 1.79 s inside `test:npm`; and `build:cli` 2.35 s
inside `test:compiled`. Beyond `test:all`, `deno task test` runs
`deno fmt --check` (0.03 s) and `deno lint` (0.02 s).

### Test and testdoc claim counts

The counts were identical in all five full runs: the warm-up, the three rounds
and the coverage run. They are Deno's counts: a top-level `Deno.test` or
`describe` is a test, and a nested `it` or `describe` is a step.

| Task                          | Test files |  Passed |     Steps | Ignored | Failed |
| ----------------------------- | ---------: | ------: | --------: | ------: | -----: |
| `test:cli`                    |          5 |      10 |        74 |       0 |      0 |
| `test:lib`, main run          |         79 |     201 |     1,553 |       4 |      0 |
| `test:lib`, `test:load-order` |          1 |       1 |         1 |       0 |      0 |
| `test:maml`                   |          2 |       3 |        18 |       0 |      0 |
| `test:scripts`                |          6 |      17 |       118 |       0 |      0 |
| `test:observer-algebras`      |          3 |      33 |         0 |       0 |      0 |
| `test:web`, `test:components` |          1 |       1 |         4 |       0 |      0 |
| `test:web`, `test:artifact`   |          2 |       2 |        16 |       0 |      0 |
| **Total**                     |     **99** | **268** | **1,784** |   **4** |  **0** |

Of the 103 tracked test files, `test:all` runs these 99. The other four are
`web/tests/production.test.ts`, which runs after merge, and the tests of
experiments 017 and a13. `test:doc`, `test:npm` and `test:compiled` are not
`deno test` runs: `test:npm` printed `Verified hclang@0.55.1 via npx`, and
`test:compiled` passed both of its cases.

`test:doc` executed 21 testdocs: **944 claims, of which 934 pass, 0 fail and 10
are unimplemented**. Each count is the testdoc's final `$=.test-summary` line.

| Testdoc                   | Claims | Unimplemented |
| ------------------------- | -----: | ------------: |
| `hc/BitScheme.hc`         |     40 |             8 |
| `hc/apply.hc`             |     76 |             0 |
| `hc/art-dispatch-vact.hc` |     95 |             0 |
| `hc/cart-zip.hc`          |     19 |             0 |
| `hc/cd-bit-kernel.hc`     |    117 |             0 |
| `hc/class-support.hc`     |     51 |             0 |
| `hc/constructed-state.hc` |     16 |             0 |
| `hc/denum.hc`             |     26 |             0 |
| `hc/division.hc`          |     36 |             0 |
| `hc/figures.hc`           |     12 |             0 |
| `hc/foist-19a.hc`         |     19 |             0 |
| `hc/format.hc`            |      7 |             0 |
| `hc/membership.hc`        |     16 |             0 |
| `hc/native-cart-zip.hc`   |     24 |             0 |
| `hc/numerics.hc`          |     84 |             0 |
| `hc/resources.hc`         |     34 |             0 |
| `hc/rotor-router.hc`      |     13 |             0 |
| `hc/testdoc.hc`           |     77 |             2 |
| `hc/time.hc`              |     47 |             0 |
| `hc/units.hc`             |     40 |             0 |
| `hc/white-paper.hc`       |     95 |             0 |

### Coverage

Setting `DENO_COVERAGE_DIR`, the environment form of `deno test --coverage`,
collected coverage for each package's own task and then for the whole chain.
`deno run` honors it too, so the scripts and testdocs that tasks run are
included. Reports exclude test files and the generated bundle (finding 1.1). A
file that no test loads is missing from a report (1.4).

| Package (own task)                             | Files | Lines, own task      | Lines, `test:all`     | Branches, `test:all` | Functions, `test:all` |
| ---------------------------------------------- | ----: | -------------------- | --------------------- | -------------------- | --------------------- |
| `lib` (`test:lib`)                             |   100 | 92.2% (9,878/10,719) | 92.9% (9,960/10,719)  | 93.2% (4,020/4,312)  | 91.2% (1,185/1,300)   |
| `cli` (`test:cli`)                             |     6 | 80.7% (321/398)      | 82.2% (327/398)       | 87.6% (127/145)      | 82.4% (28/34)         |
| `maml` (`test:maml`)                           |     1 | 100% (22/22)         | 100% (22/22)          | no branches          | 100% (1/1)            |
| `scripts` (`test:scripts`)                     |     7 | 40.6% (187/461)      | 82.5% (552/669)       | 82.5% (104/126)      | 88.5% (23/26)         |
| `web` (`test:web`)                             |     5 | 99.1% (113/114)      | 99.1% (113/114)       | 94.4% (17/18)        | 100% (8/8)            |
| `experiments/007-observer-algebras` (its task) |     7 | 97.8% (745/762)      | 97.8% (745/762)       | 88.9% (185/208)      | 98.7% (78/79)         |
| All six                                        |   126 |                      | 92.4% (11,719/12,684) | 92.6% (4,453/4,809)  | 91.4% (1,323/1,448)   |

The scripts package's own tests load 4 of its 7 modules. `test:npm` and
`test:compiled` run the other 3 as entry points, so only the whole chain reports
all 7.

### Experiments

Decision 3 needs each experiment's test result and time. Each command is the one
the experiment's README gives, run three times from the repository root.

| Experiment              | Command                                                              | Result at `ba6c00b`     | Wall s, median (range) | Disposition                         |
| ----------------------- | -------------------------------------------------------------------- | ----------------------- | ---------------------- | ----------------------------------- |
| `007-observer-algebras` | `deno task test:observer-algebras`                                   | pass: 33 tests          | 1.57 (1.56–1.60)       | keep: `test:all` already chains it  |
| `017-classical-cd`      | `deno test experiments/017-classical-cd`                             | pass: 3 tests, 17 steps | 2.85 (2.79–3.00)       | step 15: chain from `test:all`      |
| `017-classical-cd`      | `cd cli && deno task hc ../experiments/017-classical-cd/gate0.hc -t` | pass: 17 of 17 claims   | 0.15 (0.15–0.26)       | step 15: chain from `test:all`      |
| `a13-recovery-spike`    | `deno test experiments/a13-recovery-spike`                           | fail: 10 pass, 3 fail   | 0.34 (0.33–0.63)       | step 15: mark archived at `05b4f25` |

- **`007-observer-algebras`** already runs in `test:all`, so decision 3 changes
  nothing for it.
- **`017-classical-cd`.** Its two commands take 3.0 s together, which would add
  8% to the chain's 37.85 s; for comparison, `test:scripts` takes 2.07 s and
  `test:compiled` 4.18 s. Two cases in `oracle.test.ts` account for most of it,
  at 1 s each. `test:doc` discovers only `hc/*.hc`, so `gate0.hc` needs its own
  command. `run.ts`, the evidence run, was not run and stays manual: its README
  gives tens of minutes and about 20 GB of memory, which is the reason it gives
  for leaving the folder out of `test:all`. Step 15 rewrites that sentence
  (`experiments/017-classical-cd/README.md:5-7`). Wiring the tests also
  type-checks five of the folder's six TypeScript files (8.7).
- **`a13-recovery-spike`.** The three failures, at `spike.test.ts:95`, `:200`
  and `:216`, are the ones its README names: they rely on v0.39.0 spellings. The
  folder arrived in `a5dc811` (v0.40.0), where the same three fail, and has not
  changed since. Its README says to run the tests at `05b4f25` (v0.39.0), whose
  tree does not contain the folder. Copied into that tree, all 13 pass in 0.61
  s, so `05b4f25` is the commit its tests last ran at.
  `lib/execute/catch.test.ts` carries the cases that v0.40.0 ported.

### Findings

**1.1 Unfiltered `deno coverage` misstates lib.** Location: the generated
`lib/bundle/hc-sources.ts` and `lib/execute/hc-test.ts`. With no filters,
`deno coverage` reports lib at 95.0%. It counts the bundle's 5,894 instrumented
lines, all of them hit. Its default exclude, `test\.(js|mjs|ts|jsx|tsx)$`, also
drops `hc-test.ts` (199 lines, 92.5% hit), the one source module whose name ends
in `test.ts`. Filtered, lib is at 92.2%. **Disposition: step 16.** The CI floor
needs a per-package `--include`, an exclude of `\.test\.` with the dot, and an
exclude of the bundle; otherwise it mostly measures a generated file.

**1.2 Web coverage does not report after `test:consumer` runs.** Location:
`web/deno.json` tasks `test:components` and `test:consumer`, and
`web/tests/consumer/deno.json`. After `deno task test:web` with
`DENO_COVERAGE_DIR` set, `deno coverage` skipped all five web modules the tests
load ("Missing transpiled source code") and reported no file. Rerunning
`test:components` alone restored 113 of 114 lines. The consumer's vite build
runs under Deno with `"jsx": "precompile"`, where `web/deno.json` sets
`"react-jsx"`. The likely cause is that this build replaces the cached transpile
that `deno coverage` reads. **Disposition: step 16.** Collect web coverage from
`test:components` and `test:artifact` only, or report before `test:consumer`
runs.

**1.3 Collecting coverage doubles the chain's time.** Location: the `deno.json`
tasks `test:all` and `test:lib`, run with `DENO_COVERAGE_DIR` set. `test:all`
took 73.10 s that way against 37.85 s without it, and `test:lib` 38.42 s against
13.49 s, one sample each. **Disposition: step 16**, as input to where the floor
runs.

**1.4 Some files load in no Deno test, so reports leave them out.** `web/mod.ts`
(hcweb's JSR entry, 21 lines) never loads. `web/mount.ts` runs only inside the
built `hcweb.html` that the artifact tests open.
`experiments/007-observer-algebras/report.ts` runs only under
`deno task experiment:observer-algebras`. `scripts/build-npm.ts`,
`scripts/test-compiled.ts` and `scripts/test-npm.ts` are missing from the
scripts package's own report; the whole chain covers them at 100%, 100% and
95.3%. **Disposition: keep.** All are live entry points. Step 16 should know
that the floor cannot see them.

**1.5 Four suites are skipped.** Location: `lib/execute/evaluate.test.ts:724`,
`:751`, `:770` and `:829`, the `describe.skip` blocks "edge cases", "schema
storage", "HLIR advanced types" and "type conversion". They are the 4 ignored
tests in every run. **Disposition: issue.** Enabling or deleting them is a
decision about intended behavior.

**1.6 The compiled CLI embeds the workspace's `node_modules`.** Location: the
`cli/deno.json` task `build`, with `"nodeModulesDir": "manual"` in the root
`deno.json`. `deno task build:cli` writes a 186,020,242-byte `scripts/hc`. Of
its 111.96 MB of embedded files, `node_modules/` is 108.7 MB and
`dist/npm/node_modules/` 3.02 MB; the second is there only because `test:npm`
runs first. `deno info --json cli/hc.ts` lists no npm package. **Disposition:
issue.** The binary works, since `test:compiled` passes, but it carries about
112 MB it never reads.

The rest of what step 1 found belongs to later steps: the time `test:lib` spends
(6.6 to 6.8), the least covered modules (3.14), the stale total in
`scripts/test-npm.ts` (6.13) and maml's own `test` task (8.5). No run left a
tracked file changed.

For the coverage floor (decision 2), findings 1.1 to 1.4 set how step 16
measures, and the step 9 deletions raise lib's whole-chain line coverage to
about 95.1% (step 3's summary).

## Step 2: Size and complexity

The scope is the 243 tracked `.ts` and `.tsx` files under `lib/`, `cli/`,
`web/`, `maml/`, `scripts/` and `experiments/` (45,253 lines), and the 26
`hc/*.hc` files (5,740 lines). Product code is that scope without tests and
experiments: 121 modules. A Babel AST walk measured each function's length,
first line to last, comments included; its nesting depth, as ESLint's
`max-depth` counts it (default limit 4); its cyclomatic complexity (cc), as
ESLint's `complexity` counts it (default limit 20); and each class's LCOM4. The
responsibility calls below come from reading the code, not from LCOM4.

- The plan's figures hold: `lib/frames/frame.ts` (1,384 lines) is the largest
  module and `lib/execute/evaluate.test.ts` (2,654) the largest test file. Next
  come `lib/frames/access-footprint.ts` (798) and
  `lib/execute/resource-import.test.ts` (1,587).
- `lib/frames` holds 13,858 of the 17,611 non-test lines in `lib/` (79%).
- Product code has 1,439 functions: median 4 lines, 90th percentile 18, 16 over
  50 lines and 3 over 100. Six reach depth 4, one of them depth 5, and 3 exceed
  cc 20.

| Module                           | Lines | Functions | Longest function (lines)      | Max depth | Max cc |
| -------------------------------- | ----: | --------: | ----------------------------- | --------: | -----: |
| `lib/frames/frame.ts`            | 1,384 |       104 | `MetaFrame.resolve_here` (38) |         3 |     10 |
| `lib/frames/access-footprint.ts` |   798 |        39 | `walkPath` (100)              |         4 |     30 |
| `lib/frames/frame-expr.ts`       |   705 |        59 | `atomsOf` (83)                |         3 |     20 |
| `lib/frames/frame-time.ts`       |   680 |        68 | `parseInstant` (51)           |         2 |     17 |
| `lib/frames/evaluation-scope.ts` |   644 |        37 | `EvaluationScope.call` (50)   |         3 |     15 |
| `lib/frames/frame-symbol.ts`     |   586 |        37 | `FrameSymbol.in` (92)         |         3 |     30 |
| `lib/frames/frame-array.ts`      |   505 |        36 | `FrameArray.sameMembers` (37) |         3 |     12 |
| `lib/frames/frame-numeric.ts`    |   395 |        38 | `FrameNumeric.divide` (40)    |         2 |     16 |
| `lib/frames/event-dispatch.ts`   |   388 |        17 | `dispatch` (132)              |         4 |     17 |

Outside `lib/frames`, the largest modules are `scripts/build-hcweb.ts` (329),
`lib/execute/resource-import.ts` (280), `lib/execute/hc-test.ts` (252) and
`cli/hc.ts` (221).

These are the 18 product functions over 50 lines, at depth 4 or more, or above
cc 20:

| Function                     | Location                              | Lines | Depth | cc | Finding |
| ---------------------------- | ------------------------------------- | ----: | ----: | -: | ------- |
| `dispatch`                   | `lib/frames/event-dispatch.ts:225`    |   132 |     4 | 17 | 2.8     |
| `build`                      | `scripts/build-hcweb.ts:212`          |   114 |     2 | 10 | 2.9     |
| `walkPath`                   | `lib/frames/access-footprint.ts:346`  |   100 |     4 | 30 | 2.7     |
| `FrameSymbol.in`             | `lib/frames/frame-symbol.ts:143`      |    92 |     3 | 30 | 2.4     |
| `atomsOf`                    | `lib/frames/frame-expr.ts:383`        |    83 |     3 | 10 | 2.12    |
| `LexPipe.perform`            | `lib/execute/lex-pipe.ts:121`         |    71 |     4 | 15 | 2.12    |
| `main`                       | `cli/hc.ts:139`                       |    68 |     2 | 19 | 2.12    |
| `recognizeDollar`            | `lib/frames/frame-scope-anchor.ts:59` |    62 |     2 | 25 | 2.12    |
| `FrameSymbol.apply`          | `lib/frames/frame-symbol.ts:267`      |    60 |     2 | 16 | 2.12    |
| `FrameExpr.reduceTerms`      | `lib/frames/frame-expr.ts:187`        |    54 |     3 | 20 | 2.12    |
| `FrameAlias.in`              | `lib/frames/frame-alias.ts:46`        |    53 |     3 | 18 | 2.12    |
| `releaseGraph`               | `scripts/build-hcweb.ts:158`          |    53 |     3 |  9 | 2.12    |
| `Executor`                   | `web/islands/Executor.tsx:12`         |    53 |     0 |  4 | 2.12    |
| `ParsePipe.importExpression` | `lib/execute/parse-pipe.ts:175`       |    51 |     2 | 17 | 2.12    |
| `evaluateElements`           | `lib/execute/resource-import.ts:147`  |    51 |     4 | 14 | 2.12    |
| `parseInstant`               | `lib/frames/frame-time.ts:228`        |    51 |     1 | 14 | 2.12    |
| `quoteResourceSource`        | `lib/execute/resource-import.ts:222`  |    46 |     4 | 15 | 2.12    |
| `notifyEffect`               | `lib/frames/effect-registry.ts:149`   |    37 |     5 | 13 | 2.12    |

These are the 8 test files over 500 lines. Cases are static call sites of `it`
and `Deno.test`; step 1's runner counts are the authoritative totals.

| Test file                                | Lines | Cases | Largest top-level suite (lines) |
| ---------------------------------------- | ----: | ----: | ------------------------------- |
| `lib/execute/evaluate.test.ts`           | 2,654 |   263 | `evaluate` (2,647)              |
| `lib/execute/resource-import.test.ts`    | 1,587 |    54 | `resource import` (1,251)       |
| `lib/execute/hc-eval.test.ts`            |   872 |    76 | `HCEval` (812)                  |
| `lib/execute/lex.test.ts`                |   789 |    56 | `Lex` (667)                     |
| `lib/frames/event-dispatch.vact.test.ts` |   667 |    22 | 164                             |
| `cli/hc.test.ts`                         |   635 |    42 | `main` (513)                    |
| `lib/frames/frame-array.test.ts`         |   555 |    51 | `FrameArray` (540)              |
| `lib/frames/event-dispatch.test.ts`      |   503 |    34 | 92                              |

**2.1 `lib/frames/frame.ts` is broad, not complex.** 1,384 lines: 736 of code,
521 of comments and 127 blank. None of its 104 functions exceeds 38 lines, depth
3 or cc 10. It holds `MetaFrame` (lines 50–522) and `Frame` (579–1384).
**Disposition: keep.** The only seam that would shrink it much is `MetaFrame`
against `Frame`, and #464 (`8bcc3d6`, v0.37.3) merged the two into this file to
fix load order. Metadata lookup needs `Frame`'s sentinels while `Frame` extends
`MetaFrame`, so a `meta-frame.ts` that held the class and imported `frame.ts`
would, when imported first, run `class Frame extends MetaFrame` before
`MetaFrame` exists. `lib/frames/meta-frame.ts` is now an 11-line re-export that
records this. If the owner wants the split anyway, `MetaFrame` could move back
and reach `Frame.missing`, `Frame.globals`, `Frame.error` and `Frame.kOUT`
through a hook that `frame.ts` installs, the way `Frame.count` and `Frame.denum`
already work.

**2.2 `Frame` has several responsibilities.** Location: `frame.ts:579`, 806
lines, 54 instance methods and 23 static members. Its methods fall into nine
groups: evaluation dispatch, printing, the equality ladder, size observation
(#411), the aggregate and stream protocol, copying and member writes, references
and identity, type predicates, and singletons with late-bound installers. 68
classes descend from `Frame`, and they override 45 of its 54 instance methods.
**Disposition: issue**, "Group `Frame`'s protocol into smaller units." It
redesigns the contract 68 subclasses implement, which a module split in step 10
cannot do without touching every override. The issue should cover `MetaFrame`
too.

**2.3 `FrameArray` has two responsibilities.** Location: `frame-array.ts:23`,
483 lines. Besides the aggregate value itself, lines 214–433 hold the declared
protocol, about 220 lines: user classes that declare `apply` or `apply_` (#375),
`+ - * /` (015.02), `toText` (#398), or the `#` and `##` observations (011.20).
It has its own key tables, `declaredMethod`, `declaredObservation`,
`applyDeclared` and a recursion guard with its own static state. **Disposition:
step 10.** Move the declared protocol to its own module and leave thin overrides
on `FrameArray`. The new module needs only what `frame-array.ts` already imports
and no `FrameArray` value, so it adds no import cycle. The one call from outside
the class, `left.declaredOperator(...)` at `frame-symbol.ts:566`, keeps working
through the delegator.

**2.4 `FrameSymbol` has several responsibilities, and `in` holds most of its
complexity.** Location: `frame-symbol.ts:85`, a 394-line class with 16 instance
methods for interning, reading a name, declaration and address dispatch. Reading
a name is `in`, lines 143–234: 92 lines at cc 30, tied for the most complex
product function. **Disposition: step 10.** Extract the per-read projection in
`in` (lines 162–230), which chooses between binding, copying and wrapping in a
handle and builds the receiver method, into a named function in the same module.
Keep the module's three classes together: `FrameOperator` extends `FrameSymbol`,
and `FrameSymbol.called_by` constructs `FrameOperator`, the base and subclass
shape that #464 settled by sharing a module.

**2.5 `lib/frames/frame-time.ts` mixes three concerns.** 680 lines: civil
calendar arithmetic and ISO 8601 rendering that use no Frame (lines 66–206, less
the literal patterns at 76–84, about 130 lines), literal parsing (207–335), and
the time algebra with `FrameTime`, `FrameDateTime` and `FrameDuration`
(336–680). **Disposition: step 10.** Move the calendar block to its own module.
It is pure bigint code that imports nothing, so it cannot cause a load-order
problem; `dimensional-algebra.ts` is the model.

**2.6 `lib/frames/frame-expr.ts` holds three concerns that call each other.**
705 lines: expression reduction in `FrameExpr` (16–336), the #429 body walk
(337–574 and 681), and the a17 resumption (575–674). **Disposition: keep.**
`FrameExpr.elements`, `sizeElements` and `walked` call `atomsOf` and
`sizeAtomsOf` (138–148); `atomsOf` tests `instanceof FrameExpr` and builds
`FrameScoped`; and `FrameScoped.elements` calls `atomsOf`. Separate modules
would add import cycles that step 12 would then have to remove. If the owner
wants the split anyway, it can route through the late-bound
`FrameList.walkSource` and `sizeSource` hooks the module already installs
(677–678).

**2.7 `walkPath` is the most complex product function.** Location:
`access-footprint.ts:346–445`, 100 lines at cc 30 and depth 4, one branch per
term kind in a loop. The module has one responsibility: a closure's potential
footprint for the VACT certificate. **Disposition: step 10.** Give each term
kind its helper: operator, name, alias, symbol, closure, group, tight expression
and aggregate. The branches share only `current` and `refused`. The module's
static copy of lookup (lines 698–798) is issue 4.19.

**2.8 `dispatch` is the longest product function.** Location:
`event-dispatch.ts:225–356`, 132 lines at depth 4 and cc 17. Only 67 lines are
its own; the rest are the closures `mayStart` (257–278) and the outcome mapper
(333–354). **Disposition: step 10.** Lift both closures to module functions.
`dispatch` is exported, but the change is internal, and `event-dispatch.test.ts`
and `event-dispatch.vact.test.ts` (1,170 lines together) pin its behavior.

**2.9 `build` in `scripts/build-hcweb.ts` is the second longest.** Lines
212–325: 114 lines (109 its own) of one linear release script, at depth 2 and cc
10. **Disposition: step 10.** Split it into entry and bundle, HTML render, and
artifact-write functions. `build:web` and `test:web` run it end to end, while
`build-hcweb.test.ts` covers only its helpers.

**2.10 `lib/execute/evaluate.test.ts` is one 2,647-line suite.** Its 263 cases
sit in nine second-level suites: `strings` (lines 38–120, 11 cases), `grouping`
(122–185, 10), `numbers` (187–465, 39), `schemas` (467–845, 49, including the
four skipped suites of 1.5), `boolean and type operations` (847–935, 10),
`effect boundaries and relactional semantics (006.17)` (937–1106, 13),
`closures with arguments` (1108–1525, 46), `contexts` (1527–1835, 17) and
`access and effects` (1837–2653, 63). **Disposition: step 13.** Split the file
along those suites into files such as `evaluate.<feature>.test.ts`, following
the naming of `event-dispatch.vact.test.ts`. `access and effects` (817 lines)
would be the largest new file. The skipped suites move with `schemas` unchanged.

**2.11 `lib/execute/resource-import.test.ts` mixes examples with a property
harness.** 1,587 lines and 54 cases: a 240-line preamble of fixtures and a
seeded harness (`RecordingStore`, `RecordingHandler`, `SeededGenerator`,
`runProperty`, `randomChunks`, `PROPERTY_CASES = 100`), three nested suites
(242–471, 473–877 and 879–1089), seven property tests (1091–1491), and a second
top-level suite for #443 (1493–1587). **Disposition: step 13.** Move the
property tests and the harness to their own file, then give each nested suite a
file. The fixtures they share must live in a module, and a module whose name
does not end in `.test.ts` lands on `lib/load-order.test.ts`'s list and under
CLAUDE.md's one-test-per-file rule, so step 13 should name it deliberately.

**2.12 Keep the rest.** Each of these was measured and stays:

- `MetaFrame` (`frame.ts:50`, 473 lines, 22 instance methods, whose 16 stateful
  methods form one LCOM4 component). Every part serves the binding plane over
  `meta`, `parent` and `up`, and `lib/frames/CLAUDE.md` names `MetaFrame.get`
  the owner of lookup traversal.
- `notifyEffect` (`effect-registry.ts:149`), the only function at depth 5. Each
  level carries a documented rule: cleanup in `finally`, deferred delivery
  rounds, a snapshot per round and per-callback refusal.
- `recognizeDollar` (`frame-scope-anchor.ts:59`, cc 25 at depth 2). It is a flat
  table with one branch per `$` spelling; splitting it would scatter one lexical
  rule.
- The other 12 functions in the table above. `atomsOf` has 30 lines of its own,
  and its four nested helpers share the walk's state. `LexPipe.perform` has one
  `switch` case per parser action. `cli/hc.ts` `main` is a linear sequence of
  CLI modes, which 32 cases cover. `FrameSymbol.apply` is an ordered list of
  guards, `FrameExpr.reduceTerms` ordered reduction rules at cc 20, the limit,
  and `FrameAlias.in` three lookup phases. `releaseGraph` is one retry loop and
  `Executor` mostly markup. `ParsePipe.importExpression` checks the shape of one
  `<-` form, and `parseInstant` validates field by field. `evaluateElements` and
  `quoteResourceSource` reach depth 4 through one loop that both repeat (4.9).
- `EvaluationScope` (`evaluation-scope.ts:116`, 529 lines, LCOM4 1). It is
  cohesive. Its `Frame[]` adapter (`from`, lines 193–220) is live: every `in`
  override defaults its input to `[]`, `Frame.in`'s public signature names
  `EvaluationInput`, and `frame-symbol.ts:396` passes an array.
- `FrameLazy`, `FrameList`, `FrameNumeric`, `HCTest`, `FrameHandle`,
  `ParsePipe`, `LexPipe`, `HCEval` and `FrameResource`. Read method by method,
  each serves one concept, with stateful LCOM4 of 3 or less.
- The other test files. Each is 872 lines or less and holds one module's tests
  under one top-level `describe`. The 7 cases over 50 lines, the longest
  `resource-import.test.ts:1272` at 119 lines, move with 2.10 and 2.11; the
  Rules fix what they assert.
- `hc/white-paper.hc` (1,355 lines; no other `hc/` file passes 694). Programs
  import bundled files by path, so a split would change what users write, and HC
  content is out of scope.
- The experiments, which hold the longest function in scope
  (`017-classical-cd/run.ts` `main`, 189 lines) and the deepest
  (`findZeroDivisor` and `findNormCompositionFailure` in
  `007-observer-algebras/cayley-dickson.ts`, depth 7). Decision 3 keeps them as
  research records outside the published packages.
- `lib/frames.ts`, 208 lines of re-exports with no functions. It is a barrel;
  3.10 trims its names.

## Step 3: Dead code

One TypeScript 6.0.3 program over the 243 tracked files and the generated bundle
resolved every identifier, through import and re-export aliases, to its
declaration. `deno info --json` from each entry point gave module reachability,
and the two methods agree. Step 1's whole-chain coverage gave the functions and
branches the baseline never ran. A reference walk cannot see a call through a
structural type, so every "no caller" verdict was checked against coverage and
`git grep`, and each never-run function was reviewed by hand.

The entry points are `lib/mod.ts` (JSR `@swanfactory/hclang`); `web/mod.ts`,
`web/islands/Main.tsx`, `web/mount.ts` and `web/styles.ts` (JSR
`@swanfactory/hcweb`); `maml/tag.ts` (the unpublished maml workspace member);
`cli/hc.ts` (the `hc` binary and the npm bin); `cli/test-docs.ts` and the
`scripts/` modules that tasks and CI run; the vite fixture in
`web/tests/consumer/`; and the experiments' `report.ts` and `run.ts`.

- 7 of the 134 non-test sources are reached from no entry point. Two are reached
  by nothing (3.1, 3.2) and five only from tests: `lib/maml.ts`,
  `cli/flatten.ts`, `lib/frames/cayley-dickson.ts`,
  `experiments/007-observer-algebras/sample.ts` and
  `experiments/a13-recovery-spike/spike.ts`.
- Of 383 exports that product modules declare, 3 are used nowhere, 57 only
  inside their own module and 11 only by tests.
- The baseline calls 125 functions zero times. 22 have no caller, 45 cannot be
  reached through dispatch, 48 are live but untested, and 10 should stay.
- 356 branches are never taken, all inside functions that did run.
- Deleting the dead code in 3.1, 3.2, 3.12 and 3.13 removes 242 uncovered and 6
  covered lib lines. That lifts lib's whole-chain line coverage from 92.9%
  (9,960/10,719) to about 95.1% (9,954/10,471).

### Modules

**3.1 `lib/execute/script-spec.ts` is unreached and could not pass.** 35 lines,
2 of 29 instrumented lines hit, both by `lib/load-order.test.ts`'s import. Its
two `Deno.test` cases (lines 27 and 32) never run, because its name does not
match `deno test`'s file pattern, and they would fail if they did: they spawn
`lib/cli/hc.ts` (line 3), a path that no commit has ever held
(`git log -- lib/cli/hc.ts` is empty); the CLI has been `cli/hc.ts` since #245.
It is the only non-test `lib/` module that calls the Deno API, which
`lib/frames/CLAUDE.md:31` forbids, and the only one that imports
`jsr:@std/expect` (5.2). Its two `console` calls are 2 of the 11 in `lib/` (step
5). JSR publishes it. **Disposition: step 9.** Delete it.

**3.2 `lib/index.ts` is a barrel nothing imports.** 4 lines that re-export
`mod.ts`, `HCEval`, `frames.ts` and `maml.ts`, 173 names in all, left from the
2016 scaffold. `lib/deno.json` exports only `./mod.ts`, so a `jsr:` import
cannot name it; only the load-order Worker loads it. JSR publishes it, and there
it fails to load for the reason in 5.1. **Disposition: step 9.** Delete it.

**3.3 `cli/flatten.ts` is reached only by its test.** 120 lines. `Flatten` turns
Frames into tree nodes for react-accessible-treeview (#229, #235). Commit
`2660ccb`, "don't export flatten", removed its export three days after it
landed, and nothing in `web/` or elsewhere imports it; its `toJson` (line 112)
is not called even by the test. **Disposition: step 9.** Delete it with
`cli/flatten.test.ts` (91 lines), one of `test:cli`'s 5 test files. **Needs a
decision:** this deletes a test file, and step 17's counts will show it.

**3.4 MAML has no entry point.** `lib/maml.ts` (47 lines) exports `maml`, an
HTML document renderer, and `maml/tag.ts` exports `tag`. Only `lib/index.ts`
(3.2) and maml's two test files import `lib/maml.ts`, and `lib/maml.ts` is the
only product importer of `maml/tag.ts`. The `@swanfactory/maml` member has no
publish task, and `https://jsr.io/@swanfactory/maml/meta.json` answers 404. Yet
`README.md:20` lists MAML as a package, and #461 fixed its head rendering and
chained `test:maml` from `test:all`. **Disposition: issue.** Exposing MAML, from
`lib/mod.ts` or as a published package, or deleting it, changes what users get.
The move in 5.1 fits either answer.

**3.5 `lib/frames/partition-check.ts` has no product caller.** 131 lines and 7
exports, added in #475 as the smallest testable form of the 006.17 §6 partition
rule. Its users are its own test (138 lines) and the `lib/frames.ts` re-export,
through which nothing imports it. **Disposition: issue.** Whether the evaluator
should apply the rule, or the model belongs with the spec, is a design decision.
It stays until that is settled.

**3.6 `lib/frames/cayley-dickson.ts` is a test oracle inside `lib/`.** Only
`lib/frames/cayley-dickson.test.ts`, `lib/frames/kd-signed-xor.test.ts` and
`experiments/007-observer-algebras/cayley-dickson.test.ts` reach it, and all 45
of its instrumented lines run. **Disposition: keep.** It is the independent
Cayley–Dickson oracle that the plan's step 4 keeps (4.22). Its header is stale
(3.18).

### Exports

**3.7 Three exports are used nowhere.** `isTracking`
(`lib/frames/reference-tracking.ts:196`), re-exported by `lib/frames.ts` and
never called; `noteReleased` (`reference-tracking.ts:258`, 7 lines), uncalled
since #483 added it; and `type Counts` (`lib/execute/hc-log.ts:5`), unused, as
the `Counts` in use is `lib/execute/hc-test.ts:4`. **Disposition: step 9.**
Delete them.

**3.8 57 exports are used only inside their own module.** 32 are types and 25
are values.

- 31 of the types appear in an exported declaration of the same module:
  `EnvironmentReader` and `Counts` in `lib/execute`; `IIdentified`,
  `HoldingKind`, `Holding`, `AccessGuard`, `EffectInvoker`, `MatchSuccess`,
  `MatchFailure`, `MatchableFrame`, `WriteTargetRole`, `Finisher`, `IRegexpMap`,
  `IPrefixMap`, `SchemaFrame`, `LanguageBinding`, `DenumConstructor`,
  `RouterRecognizer`, `URIPartKey`, `Normalization`, `ScopeAnchorKind`,
  `ClockReading`, `DependencyKind`, `PartitionPlan`, `PartitionError` and
  `PartitionCheckResult` in `lib/frames`; `FuncDict` and `DivisionCarrier` in
  `lib/ops`; `LexicalMode` in `lib/scan.ts`; and `FormatPlan` and `HCSource` in
  `scripts/`. **Disposition: keep.** Unexporting them would leave exported
  signatures naming types that callers cannot import.
- The 32nd type, `ScanHost` (`lib/execute/sigilizer.ts:10`), and the 25 values
  are not part of any exported signature. The values are the 8 exports of
  `lib/execute/router-prologue.ts`; `DENUM_CLASS`, `quoteResourceSource`,
  `sizeAtomsOf` and `EXACT_POWER_BIT_LIMIT`; `FrameCatch` and
  `FrameObservationAnchor`; `NANOS_PER_MILLISECOND`, `nameOf` and `Visibility`;
  `inspectFlags`, `KD_MAX_SLOTS`, `KD_MAX_PRODUCT_TERMS`, `keyGrantsMutation`
  and `cartInputs`; `HC_DOC_DIR` (`cli/test-docs.ts`); and `HC_DIR` and
  `EMBED_PATH` (`scripts/embed-hc.ts`). **Disposition: step 9.** Drop their
  `export`, with the `lib/frames.ts` lines for `FrameCatch`,
  `FrameObservationAnchor`, `NANOS_PER_MILLISECOND`, `Visibility` and
  `keyGrantsMutation`. Once a declaration is unexported, `deno lint` reports it
  as soon as it falls out of use.

**3.9 11 exports have no use outside tests.** The harness clocks `FrozenClock`,
`ScriptedClock` and `BudgetClock` (`lib/frames/clock.ts:71`, `:89`, `:115`),
`StoreHandler` (`lib/frames/resource-handlers.ts:129`), `versionRead` and
`versionWritten` (`lib/frames/event-dispatch.ts:373`, `:381`) and
`mutableHoldersOf` (`reference-tracking.ts:335`) are test seams. **Disposition:
keep** those 7. `clock.ts` documents its clocks as installed by a harness, and
the three queries observe state that tests assert. No published entry exports
them, so only this repository's tests can use them. The other 4 follow their
modules: `cdBasis` stays with 3.6, `partitionPlan` and `checkPartitions` wait
for 3.5, and `maml` for 3.4. Another 51 test-only exports are also used inside
their own module and stay.

**3.10 `lib/frames.ts` re-exports 73 names that nothing imports through it.** It
re-exports 165 names, and 92 of them are imported through it. The 73 include
every name from 8 modules: `reference-tracking` (14), `event-dispatch` (9),
`partition-check` (7), `effect-registry` (6), `access-footprint` (5),
`frame-match` (5), `bound-method` (2) and `frame-handle` (1). The other 24 come
from 13 more modules: `resource-reference` (`Normalization`,
`normalizeReferencePath`, `ReferenceParts`, `URI_PART_KEYS`, `URIPartKey`),
`fourth-hash` (`DenumConstructor`, `observeDenum`, `RouterRecognizer`),
`frame-scope-anchor` (`FrameCatch`, `FrameObservationAnchor`,
`ScopeAnchorKind`), `scan` (`LexicalMode`, `ScanResponse`, `SigilStart`),
`resource-binding` (`isResourceBinding`, `ResourceBinding`), and one each from
`clock` (`ClockReading`), `dimensional-algebra` (`DimensionalOperator`),
`frame-list` (`FrameList`), `frame-numeric` (`NumericRank`), `frame-symbol`
(`FrameBinding`), `frame-text` (`CharacterContent`), `frame-time`
(`NANOS_PER_MILLISECOND`) and `frame` (`Visibility`). Each name is still
exported by its own module. In `lib/ops.ts`, nothing imports `FrameCurry`
through the barrel. **Disposition: step 9.** Remove those names. Where a whole
statement goes, keep a bare `import "./frames/…";` in its place, because the
barrel's import order decides the order modules evaluate in, and
`test:load-order` must stay green. The `partition-check` line waits for 3.5,
since that barrel line is the only thing that loads the module. Two of the
names, `ReceiverState` and `ScanResponse`, are types that 5.17 would add to
`lib/mod.ts`; if it does, step 12 exports them from their own modules.

**3.11 `contextEqual` is a public export with no use beyond tests.** Location:
`lib/frames/context.ts:35`, exported from `lib/mod.ts`. Of `lib/mod.ts`'s 15
exports, it is the only one that nothing in the repository uses outside tests,
no doc mentions and no public signature or other export needs. It prints two
`console.log` lines on every call (5.4). `lib/frames/context.test.ts` has 4
expectations about it, and the active case at `evaluate.test.ts:1833` uses it to
compare a result's context with `{x: 3}`. **Disposition: step 9.** Remove it
from `lib/mod.ts` and `lib/frames.ts` and delete it, as decision 1 allows; the
refactor PR then bumps the minor version. **Needs a decision:** JSR and npm
users lose the function, the 4 `context.test.ts` expectations go with it, and
`evaluate.test.ts:1833` needs another way to compare the context while still
asserting that it equals `{x: 3}`. If the export stays instead, step 12 removes
its logging (5.4).

### Functions the baseline never runs

Deno writes no branch record for a function that never ran, so the never-run
functions and the never-taken branches do not overlap.

| Class                               | Functions | Instrumented lines | Disposition      |
| ----------------------------------- | --------: | -----------------: | ---------------- |
| No caller anywhere (3.12)           |        22 |                 98 | step 9           |
| Unreachable through dispatch (3.13) |        45 |                144 | step 9           |
| Live but untested (3.14)            |        48 |                207 | 41 issue, 7 keep |
| Stay (3.15)                         |        10 |                 97 | keep             |

**3.12 22 functions have no caller.** Each was checked with `git grep -w` and
`git log -S` for when its last caller went away.

| Location                                                                                                                     | Function                                                     | Lines | Last caller                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----: | -------------------------------- |
| `lib/execute/hc-eval.ts:78`                                                                                                  | `HCEval.make_pipe`                                           |     9 | removed in `8bcc3d6` (#464)      |
| `lib/execute/hc-test.ts:83`                                                                                                  | `HCTest.performTest`                                         |     9 | none since `24fd89f` (#289)      |
| `lib/execute/lex-pipe.ts:38`, `:43`                                                                                          | `LexPipe.lex_string`, and `lex`, which only it calls         |     7 | none since `25349f9` (#322)      |
| `lib/execute/lex.ts:71`                                                                                                      | `LexHost.call`                                               |     3 | none; see below                  |
| `lib/execute/terminals.ts:53`                                                                                                | `Terminal.toData`, protected, overriding nothing             |     3 | none                             |
| `lib/frames/frame-atom.ts:28`, `frame-arg.ts:100`, `frame-blob.ts:117`, `frame-int.ts:113`, `frame-symbol.ts:437` and `:583` | the `string_start` family: a base method and 5 overrides     |    18 | none; no reference anywhere      |
| `lib/frames/frame-lazy.ts:73`                                                                                                | `FrameLazy.returnSchema`                                     |     3 | never called since #475 added it |
| `lib/frames/frame-number.ts:19`                                                                                              | `FrameNumber.fromHost`                                       |     3 | removed in `9962b1c` (#490)      |
| `lib/frames/frame-schema.ts:119`                                                                                             | `FrameSchema.length`                                         |     3 | none                             |
| `lib/frames/frame-symbol.ts:538`                                                                                             | `FrameOperator.operator_chars`, with a commented-out variant |     3 | none                             |
| `lib/frames/frame.ts:77`                                                                                                     | `MetaFrame.isAlphabetic`                                     |     3 | removed in `8bcc3d6` (#464)      |
| `lib/frames/frame-int.ts:246`, `frame.ts:952`                                                                                | the `Frame.signed` hook (3.17)                               |     0 | removed in #506                  |
| `lib/frames/reference-tracking.ts:196`, `:258`                                                                               | `isTracking`, `noteReleased` (3.7)                           |     7 | none                             |
| `lib/execute/script-spec.ts:5`                                                                                               | `script` (3.1)                                               |    19 | none                             |
| `cli/flatten.ts:112`                                                                                                         | `Flatten.toJson` (3.3)                                       |     8 | none                             |

`LexHost.call` needs the most care. `Lex` and `LexRun` both override `scan`, and
the Sigilizer drives lexers through `scan` and `consumeScan`, so nothing calls a
lexer. The method overrides `Frame.call`, so the full suite should confirm the
deletion. **Disposition: step 9.** Delete all 22.

**3.13 45 `FrameNumeric` hook overrides cannot be reached.**
`lib/frames/frame-numeric.ts:287-302` declares 15 abstract hooks. Three run
without a rank check: `unaryPlus` and `unaryMinus` from `called_by`, and
`ratioParts` through `exactRatio`. The base calls the other 12 only after both
operands pass a rank check (lines 156–226, 247–249 and 351–391), so they never
run for the null-ranked `FrameSequence`, `FrameTime` and `FrameTypedNumber`.
`divide` targets only the rational or number rung, `modulo` refuses anything
above int, and `powerSame` runs only on the number rung.

| Class (rank)              | Unreachable hooks                                                                                                                                                            | Lines |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: |
| `FrameSequence` (null)    | `isZero`, `promoteOne`, `inexactResult`, `integralValue`, `addSame`, `subtractSame`, `multiplySame`, `divideSame`, `moduloSame`, `powerSame`, `powerIntegral`, `compareSame` |    36 |
| `FrameTime` (null)        | the same 12 with `ratioParts` in place of `compareSame`, since `FrameTime.ordered` calls its own `compareSame`                                                               |    37 |
| `FrameTypedNumber` (null) | the same 12 less `isZero`, which a unit test calls directly                                                                                                                  |    34 |
| `FrameInt`                | `divideSame` (answers `$!.numeric-internal`), `powerSame`                                                                                                                    |     7 |
| `FrameDecimal`            | `divideSame` (`$!.numeric-internal`), `moduloSame`, `powerSame`                                                                                                              |    12 |
| `FrameRational`           | `moduloSame`, `powerSame`                                                                                                                                                    |     9 |
| `FrameNumber`             | `promoteOne` (top rung), `inexactResult`, `moduloSame`                                                                                                                       |     9 |

The three null-ranked classes also repeat their refusal bodies: 12 hooks behave
identically in all three, 112 lines that jscpd flags as clones
(`frame-sequence.ts:82-110`, `frame-typed-number.ts:110-139` and
`frame-time.ts:571-600`). Most are the unreachable overrides above, but
`exactRatio` reaches `ratioParts` in `FrameSequence` and `FrameTypedNumber`
(3.14).

**Disposition: step 9.** The overrides cannot go while the base declares the
hooks abstract, so one of two changes comes first. Either `FrameNumeric` gets
default bodies that answer the refusals today's overrides answer, naming the
class through `className()` so that each error text stays the same, or the 12
rank-gated hooks move to an abstract ranked base that only `FrameCount`,
`FrameInt`, `FrameDecimal`, `FrameRational` and `FrameNumber` extend. No caller
can observe either change, because no path reaches those hooks. Either change
also removes most of the repeated refusal bodies, and step 11 merges what
remains. "Unreachable" is a reading of today's rank checks, so the defaults must
keep today's refusals in case a later change makes the hooks reachable.

**3.14 48 functions are live, but no test runs them.** By group:

- The REPL: 6 functions, 36 lines, in `cli/prompt.ts` and `HCEval.level`
  (`lib/execute/hc-eval.ts:219`). `hc` with no script runs them, and no test
  drives stdin.
- Numeric paths: 19 functions, 88 lines, in the `lib/frames` modules
  `frame-decimal.ts`, `frame-int.ts`, `frame-number.ts`, `frame-rational.ts`,
  `frame-sequence.ts`, `frame-time.ts` and `frame-typed-number.ts`. They are
  unary `+` on all seven and unary `-` on decimal, number and rational;
  `inexactResult` on int and rational, for non-finite projections
  (`frame-numeric.ts:168-188`); non-integer exponents (`integralValue` on number
  and rational, `FrameNumber.powerIntegral`); `FrameDecimal.valueOf`;
  `FrameTime.lessThanOrEqual`; and the `ratioParts` of sequences and typed
  numbers, reached from `dimensionOf` (`frame-time.ts:338`).
- Rare values and paths: 16 functions, 56 lines, in `lib/frames`. They are `in`
  on a dispatch policy (`dispatch-host.ts:71`), an observation
  (`frame-observation.ts:79`) and `$!` (`frame-scope-anchor.ts:246`); printing
  an observation, a schema, a type or a note inside an aggregate
  (`frame-observation.ts:87`, `frame-schema.ts:103`, `frame-type.ts:47`,
  `frame-note.ts:101`); `FrameScoped`'s three delegations and
  `FrameExpr.elements` (`frame-expr.ts:627-639` and `:137`); `.#` on a closure
  (`frame-lazy.ts:223`); the `FrameList.walkSource` hook (`frame-expr.ts:677`);
  calling an error value (`frame.ts:673`); the `receiverFrame` fallback
  (`bound-method.ts:104`, used at `access-footprint.ts:238`); and `finishDollar`
  at the end of input (`frame-scope-anchor.ts:122`).
- One-line printing overrides: 7 functions, 27 lines. They are `Token.toData`
  and `Token.inspect` (`lib/execute/lex.ts:45`, `:49`), `Terminal.toString`
  (`lib/execute/terminals.ts:57`), `inspectFlags` (`lib/frames/frame.ts:547`),
  `dataString` on `Frame.all` and on error values (`frame.ts:632`, `:669`), and
  `FrameOps.toString` (`lib/ops/frame-ops.ts:34`).

**Disposition: issue** for the first three groups (41 functions, 180 lines), one
issue per group: add tests. Writing tests adds assertions, so it is new work
rather than a refactor. **Keep** the 7 printing one-liners, where a test buys
less than it costs. The issue also covers the live lines of 6.3's modules once
step 9 has deleted their dead ones. For step 1's least covered modules, that
gives this split:

| Module                             | Lines hit, whole chain | Result                                                                   |
| ---------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `lib/execute/script-spec.ts`       | 2/29                   | dead module (3.1)                                                        |
| `cli/prompt.ts`                    | 5/38                   | the REPL: issue                                                          |
| `scripts/bump-version.ts`          | 28/67                  | task entry point (3.15)                                                  |
| `lib/frames/frame-sequence.ts`     | 43/90                  | 12 unreachable hooks, 36 lines (3.13); `unaryPlus` and `ratioParts` live |
| `lib/frames/frame-typed-number.ts` | 65/105                 | 11 unreachable hooks, 34 lines (3.13); 2 live                            |
| `lib/frames/frame-number.ts`       | 55/85                  | `fromHost` dead (3.12), 3 unreachable (3.13), 4 live                     |

**3.15 10 never-run functions should stay.** **Disposition: keep.**

- Base defaults that every instantiated subclass overrides: `Frame.at`
  (`frame.ts:735`), `Frame.dataString` (`:1089`), `Frame.instanceCopy` (`:1334`)
  and `FrameAtom.toData` (`frame-atom.ts:52`).
- The `Frame.catchWith` placeholder (`frame.ts:1121`), which
  `frame-observation.ts:98` replaces at load.
- `ScriptedClock.describe` (`clock.ts:94`), part of a harness clock (3.9).
- Code that runs only outside tests: `releaseGraph`
  (`scripts/build-hcweb.ts:158`), run only by the release job, which needs a
  published JSR version; and `run` and `main` (`scripts/bump-version.ts:47`,
  `:59`), which are `deno task bump` and rewrite the manifests and commit. The
  pure parts of both are tested.
- `ratMul` (`experiments/007-observer-algebras/exact.ts:56`), which stays with
  its experiment (decision 3).

### Branches

**3.16 356 branches are never taken.** Sorted by what the untaken block does:

| Package                             | Refusal | Invariant | Fallback |   Other |   Total |
| ----------------------------------- | ------: | --------: | -------: | ------: | ------: |
| `lib/frames`                        |      76 |         2 |       28 |     118 |     224 |
| `lib/execute`                       |      31 |         0 |        4 |      26 |      61 |
| `experiments/007-observer-algebras` |      12 |         0 |        2 |       9 |      23 |
| `scripts`                           |       8 |         0 |        8 |       6 |      22 |
| `cli`                               |       7 |         0 |        7 |       4 |      18 |
| `lib/ops`                           |       3 |         0 |        2 |       2 |       7 |
| `web`                               |       0 |         0 |        1 |       0 |       1 |
| **All**                             | **137** |     **2** |   **52** | **165** | **356** |

The kinds are text heuristics. The files with the most are
`lib/frames/access-footprint.ts` (39, 14 of them refusals), `frame-symbol.ts`
(17), `fourth-hash.ts` (16, 15 of them refusals such as `$!.denum-unavailable`)
and `scripts/build-hcweb.ts` (15). Reading the FOIST and step 1 modules line by
line, and sampling the rest, found four branches that cannot be reached: the
negative-exponent guards in `FrameInt.powerIntegral` and
`FrameDecimal.powerIntegral` (`frame-int.ts:200`, `frame-decimal.ts:170`), which
`power` makes unreachable by promoting first; the `promoteTo` guard
(`frame-numeric.ts:354`); and the `default:` of `Frame.sizeFor`'s switch
(`frame.ts:1003`), after the filter on line 985. **Disposition: keep** the 4
guards, which guard invariants; `sizeFor`'s `default` also satisfies strict
mode's return check. **Issue** for the `lib` and `cli` branches: test the
refusal paths, starting with `access-footprint.ts`, `fourth-hash.ts`,
`router-prologue.ts` and `frame-symbol.ts`. **Keep** the `scripts` and `web`
branches, which are release modes, git failures and environment defaults in
build tooling, and the experiment's (decision 3).

### FOIST 19a leftovers

What the #506 review asked for is in place: `$!.denum-kd-capacity`, the typed
`KDProductBudgetError` and a current `kd-signed-xor.ts` header. No retired
symbol remains in product code; the tests that mention one check that it is
gone.

**3.17 `Frame.signed` is a hook with no reader.** Declared at
`lib/frames/frame.ts:951-952` and installed at `lib/frames/frame-int.ts:246`.
#506 removed its last reader, the `kRESIDUAL` branch. **Disposition: step 9.**
Delete it (3 lines).

**3.18 Comments in 9 code files describe the observers #506 retired.** They
describe `.###` as the alternating residual, `.####` as the Denum constructor
derived from `#`, `##` and `###`, `###` as an observation an aggregate may
declare, and the `.#%` binding with its geometric observers.

- `lib/execute/denum-prologue.ts:2-20`: "loaded from HC for the fourth hash",
  "`.####` answers a Denum", "reading `#`, `##` and `###`".
- `lib/execute/hc-eval.ts:9`: "Installs the Denum class that `.####`
  constructs".
- `lib/frames/fourth-hash.ts:80-84`: calls the intrinsic path the fourth hash's,
  though `observeDenum`, the third, uses it.
- `lib/frames/frame-array.ts:297-302`, `:323-331` and `:380`: `###` as a
  declarable residual with an exact-integer answer, although #506 removed it
  from `OBSERVATION_KEYS`.
- `lib/frames/frame-count.ts:57-59`: "Its residual, Count parity n mod 2".
- `lib/frames/frame-lazy.ts:198-200`: "Residual alternates…; Denum derives from
  those observations".
- `lib/frames/frame-list.ts:187`: "Size and residual share native child sizes".
- `lib/frames/frame-name.ts:17-20`: "the Count binding `.#%` and the geometric
  observers".
- `lib/frames/cayley-dickson.ts:2-3` and `:22-32`: "the KDSL observer family
  (`.##%%%`, `.###%%%`)", "the residual and its squared norm".

**Disposition: step 9.** Rewrite them with the deletions; they describe behavior
the code no longer has.

**3.19 Three docs outside step 7's list still describe the retired observers.**
None changed in #506 or #508.

- `doc/GRAMMAR.md:176-211`, the "Size and Denum" bullet: `.###` as the
  alternating sum, `.####` deriving two loads `(Size±residual)/2`, `.#%` as the
  Count binding with its `$!.denum-binding-*` errors, and `.##%` to `.###%%%` as
  geometric observers. The #508 review flagged it as stale after #506.
- `doc/LANGUAGE.md`: `:374-376` imports Figures and calls `Figures.gap`, which
  `hc/figures.hc` no longer defines; `:600-666` describes Star `x * y`, `.###`
  as the signed residual and the `gap` and `spin` module; and the residual parts
  of `:667-737`.
- `hc/apply.hc:334-338`, prose in a bundled testdoc: "`.###` alternates child
  Sizes…, `.####` derives a Denum…, nil residual".

The same drift in `doc/ARCHITECTURE.md`, `CLAUDE.md` and `lib/README.md` is 7.1,
7.2 and 7.7. **Disposition: step 14.** These are doc fixes; prose in
`hc/apply.hc` changes no claim.

**3.20 The migration left an orphaned test file and repeated one check.**
`lib/execute/denum-observers.test.ts` (60 lines) arrived with
`lib/frames/denum-observers.ts` in #492. #508 deleted the module, and the test
file now asserts its retirement. Its first test (line 16) loops over the 7
retired `%` spellings and asserts that `SIZE_OPERATORS` excludes each and that
`sizeFor` answers nil. `denum-prologue.test.ts:110-130` and
`foist-19a.test.ts:142-159` repeat that loop, and jscpd flags the copies.
`figures-native-size.test.ts:69-73` checks the same spellings through `HCLang`.
The `denum(count, loads)` helper is defined three times (in
`denum-observers.test.ts`, `denum-prologue.test.ts` and `foist-19a.test.ts`),
and `SIZE_OPERATORS` is pinned to `["#", "##", "###", "####"]` twice.
Separately, `lib/execute/lex.test.ts:343` names a suite "Count binding `.#%`
(007.40)", although it only checks that the retired spelling lexes as one
unbound name. **Disposition: step 13.** Fold the checks into
`foist-19a.test.ts`, keeping each distinct assertion once, share the helper,
move the file's other two tests (KD arity and gauge) beside the other `.####`
tests, and rename the `lex.test.ts` suite.

**3.21 Some FOIST-era material stays by design.** `hc/denum.hc`'s `scale_`,
`deposit_`, `size-ratio`, `residual-ratio` and `./` methods, which
`doc/FRAME-DENUM.md:22` says are retained and which have one claim each
(`hc/denum.hc:134-142`); the historical binder in
`experiments/007-observer-algebras` (#507's non-goals); the retired spellings in
`lex.test.ts:356-397` and `scripts/vscode-grammar.test.ts:349`, whose
tokenization still matters; `foist-19a.test.ts`'s guard that retired internals
are not installed; and the changelog. In the experiments generally, 007 has the
unused `ratMul` (3.15), 39 exports used only in their own module, the test-only
`sample.ts` and 23 untaken branches, and a13's `spike.ts` is reached only by its
test. **Disposition: keep.** HC semantics are out of scope, the tests guard
current behavior, and decision 3 keeps the experiments.

### Bundled `hc/` files

**3.22 Three bundled HC files are used by nothing, and two cannot run.**
`hc/gerbil.hc` (36 lines, 2020) fails with
`HCEval.finish.failed: $!.parse-unmatched-structure FrameSchema`.
`hc/led_blink.hc` (53 lines, 2019) imports `<>.hcdl.fpga` and fails with
`$!.resource-import-source-type <>`. `hc/hcsv.hc` (23 lines, 2021) runs. None is
a testdoc, nothing in the repository names them, and every build ships all three
in the bundle. `hc/cqml.hc` also fails, but `cli/CLAUDE.md:18` documents it as
an aspirational legacy exception. **Disposition: issue.** Deleting, fixing or
moving these examples to `doc/` is a content decision.

## Step 4: Duplication

jscpd 4.0.5 found token clones in a `git archive` snapshot of `ba6c00b`, which
keeps the generated bundle out. It runs in its default `mild` mode, which finds
copies exact up to whitespace, with `--max-lines 5000`, because by default it
skips files over 1,000 lines and would drop `frame.ts` and `evaluate.test.ts`.
jscpd has no HC tokenizer, so a script compared trimmed lines in the `.hc`
files. Token clones miss a rule restated in other words, so review read all of
`lib/ops`, the numeric family, the Denum and Cayley–Dickson modules, both
prologues, the lookup and commit paths, the host and testdoc drivers, the `hc/`
files that define code, and the experiments' oracles.

| Measurement                                                                                              | Result                                                                |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| jscpd, lib source, at least 50 tokens and 5 lines                                                        | 14 clones, 163 of 17,454 lines (0.93%)                                |
| The same at 30 tokens and 3 lines                                                                        | 61 clones, 464 lines (2.66%)                                          |
| Clones between `lib/frames`, `lib/ops` and `lib/execute`                                                 | 0; at 30 tokens and 3 lines, 1 clone of 6 lines (4.2)                 |
| jscpd, lib tests                                                                                         | 53 clones, 472 of 18,789 lines (2.51%)                                |
| jscpd, source of `lib`, `cli`, `web`, `maml`, `scripts` and `experiments`                                | 17 clones, 184 of 22,492 lines (0.82%); 0 between packages            |
| jscpd, tests, between packages                                                                           | 3 clones, 43 lines, all between the a13 spike and `lib/execute` tests |
| Identical runs of 5 or more lines in `hc/*.hc`, `hc/apply-tutorial.md` and 017's `.hc` files             | 93 lines in 16 runs                                                   |
| Testdoc pairs whose source (8+ characters) and expectation both appear as string literals in one TS test | 96 of 836 pairs, 72 with an expectation of 3+ characters (4.18)       |

Copy-paste duplication is low and stays inside packages. The duplication that
matters is the same rule written twice in different words. The largest copy, the
refusal overrides of the three null-ranked numeric classes, is dead code that
3.13 removes in step 9.

### Accidental duplicates

Each of these is **step 11**. High priority marks two copies of a rule that must
agree.

**4.1 Two loaders for bundled HC classes.**
`lib/execute/denum-prologue.ts:54-102` (`loadDenumClass`, `denumClass`,
`constructDenum`) and `lib/execute/router-prologue.ts:54-103` and `151-158`
(`loadRouterClass`, `routerClass`, `constructRouter`, `dealtRouter`): 34 and 44
lines, plus the same `loaded` and `loading` state in both. Each reads a file
from `HC_SOURCES`, evaluates it in a fresh namespace with no root, keeps the
outcome including a failure, refuses reentry, and calls the constructor;
`router-prologue.ts:11` says "As with the Denum class". Merge them into one
helper parameterized by file, class names and error prefix, so that
`$!.denum-prologue-*` and `$!.router-prologue-*` keep their spellings. Both
prologues install hooks at import time, so the helper must not change load
order.

**4.2 Two checks that recognize a shipped class by rebuilding it (high).**
`lib/frames/fourth-hash.ts:119-140` (`recognizeDenum`) and
`lib/execute/router-prologue.ts:117-136` (`channelRouterChannels`), 22 and 20
lines, which hold the one clone that crosses `lib`'s directories. Both apply the
007.25e rule: an instance is genuine only when rebuilding it through the shipped
constructor gives a value `==` to it. This check is what stops a forged `.###`
or `.####`. Make it one exported predicate in `lib/frames`, beside
`installRouterRecognizer`, with each caller still reading its own fields.

**4.3 Two lookup traversals in `MetaFrame` (high).**
`lib/frames/frame.ts:250-274` and `301-323` (`get` and `lookup`), and `222-240`
and `326-342` (`resolve` and `resolveBinding`): 48 and 36 lines with three jscpd
pairs. Each does a local lookup, then walks `lookup_links()` depth first under a
`seen` guard, then reads the globals once, although `lib/frames/CLAUDE.md` says
that "`MetaFrame.get` owns the traversal and its cycle guard". Write one
traversal that takes the per-frame step. `get` is the interpreter's hottest
path, so compare test times with step 1 before accepting the change.

**4.4 Seven walks up the declared parents.** `frame.ts:511-521` (`isAncestorOf`)
and `1034-1044` (`getOwn`), `frame-array.ts:405-415` (`declaredMethod`),
`frame-symbol.ts:237-251` (`isReceiverPathValue`), and
`access-footprint.ts:679-688`, `698-714` and `720-732`: loops of 6 to 10 lines
in 4 files, each with its own `seen` set. Replace them with one generator over a
frame and its declared parents, with each site keeping its own test.
`wouldCreateParentCycle` (`frame.ts:403-412`) is the eighth walk, the one that
detects the cycle the others guard against.

**4.5 Commit bookkeeping written out at eight sites (high).** `frame.ts:355-371`
(`set`), `383-400` (`setParent`), `464-482` (`match_here`) and `1343-1362`
(`replaceMember`); `frame-array.ts:183-195` (`replaceMember`), `467-478`
(`collect`) and `500-504` (`reset`); and `effect-registry.ts:101-114`
(`registerEffect`). Each spells out `guardAccess`, the write, `noteHolding` and
`noteWrite`, and `lib/frames/CLAUDE.md` requires every commit path to do so, or
dispatch certificates go unsound. Give them a before-and-after pair of helpers,
with each site keeping its order and choosing explicitly whether to notify. Only
2 of the 8 notify effect subscribers, which is 4.21.

**4.6 The host namespace is built twice.** `cli/hc.ts:93-122` (`getHost`,
`getHandlers`) and `lib/execute/hc-lang.ts:62-80` (`HCLang.makeHost`), 17 and 19
lines that differ only in the store, `DenoFileStore` against
`MemoryStore("session")`; `hc-lang.ts:76-77` calls it "the same bridge the CLI
installs". Make it one `lib/execute` function that takes the store, and keep
`getHost` and `getHandlers` as thin wrappers, since `cli/hc.test.ts` uses them.

**4.7 A source unit is evaluated into an array twice.**
`lib/execute/evaluate.ts:20-32` and `lib/execute/hc-lang.ts:95-107`, 7 lines
each; the fallback text "incomplete lexical input" appears a third time at
`cli/hc.ts:163`. Share one helper, with `HCLang.call` keeping its `try` and its
history.

**4.8 The testdoc markers `;` and `#` are defined three times.**
`lib/execute/hc-eval.ts:69` and `73` (`HCEval.SOURCE`, `EXPECT`),
`lib/execute/resource-import.ts:35-36` (`EXAMPLE`) and `cli/test-docs.ts:22-27`
(literals in `hasExpectations`). `resource-import.ts` keeps a copy because
`hc-eval.ts` imports it, and importing back would close a cycle. Move both
markers to a leaf module that all three import.

**4.9 `resource-import.ts` feeds source through the example filter twice.**
`evaluateElements` (lines 147–197) and `quoteResourceSource` (222–267) repeat
one loop, with jscpd pairs of 12 and 5 lines. Give the loop one private helper,
which also moves the depth-4 nesting of 2.12 into one place.

**4.10 `EvaluationScope` restates all its options to change a few.**
`evaluation-scope.ts:348-364`, `367-391` and `407-439` (`withLayers`,
`withWriteTarget`, `resumedIn`) each list all 13 fields to change 2 to 5 of
them, in jscpd pairs of up to 19 lines. `argumentAt` and `parameterAt`
(`469-477`, `491-499`) repeat the walk that the private `outward` (`523-525`)
implements. Add a private `derive(overrides)` and call `outward(level - 1)`.

**4.11 Two atom walks share their punctuation loop.** `frame-expr.ts:446-464`
(in `atomsOf`) and `491-508` (in `sizeAtomsOf`), jscpd pairs of 10 and 8 lines,
which spell the statement test differently (`!== true` against `!`). Share the
outer loop and keep the inner walks apart, since `sizeAtomsOf` must stay free of
side effects and guarded against cycles.

**4.12 The size-operator test is written at six sites.** `frame.ts:1364-1370`
(the private `quantityOperator`), `frame-expr.ts:216-218`, `225-228` and
`618-620`, `frame-lazy.ts:203-211` and `frame-symbol.ts:366-367` test for an
addressed symbol spelling one of `Frame.SIZE_OPERATORS` with three different
class checks: `className() === "FrameSymbol"`, `isSymbol()` and
`instanceof FrameSymbol`. They agree only because no subclass of `FrameSymbol`
can spell `#` through `####`. Replace them with one public static predicate on
`Frame`.

**4.13 `FrameSymbol` commits a declaration in two places.**
`frame-symbol.ts:295-325` (in `apply`) and `341-357` (`defineSchema`), about 10
lines in two jscpd pairs: resolve the binding, refuse an error, pick the key,
refuse a constant, write, answer the echo. Give both one private step, leaving
the schema check where it is.

**4.14 Small repeats in the ranked numerics.** 18 sites of 3 to 8 lines: keeping
a sign in `unaryPlus` (`frame-int.ts:145`, `frame-decimal.ts:113`,
`frame-rational.ts:96`, `frame-number.ts:67`, `frame-sequence.ts:74`, and a
variant at `frame-count.ts:80`); flipping it in `unaryMinus`
(`frame-int.ts:152`, `frame-decimal.ts:120`, `frame-rational.ts:108`); the range
refusal in `exactInt` (`frame-int.ts:84`, `frame-decimal.ts:73`,
`frame-rational.ts:57`); the whole-ratio test and the `powerSame` wrapper
(`frame-decimal.ts:106` and `162`, `frame-rational.ts:90` and `157`); and scale
alignment (`frame-decimal.ts:128`, `138` and `188`). Add protected helpers on
`FrameNumeric` for the sign spelling and the range refusal, and a private
alignment helper in `FrameDecimal`.

**4.15 `Add`, `Subtract` and `Multiply` repeat their opening.**
`lib/ops/math.ts:44-53`, `59-72` and `75-84`, three copies of 7 lines: answer an
error operand, try the numeric pair, else fall back to a structural operation
(Flop, Flop of the half-turn, or Cart). Add an
`arithmeticOr(source, block, operation, fallback)` beside the existing
`arithmetic`.

**4.16 Other local repeats.**

- `lib/execute/hc-test.ts:218-219`, `231-233` and `238-240`: curly-quote
  unwrapping, 3 copies. **Step 11.**
- `lib/execute/hc-eval.ts:83-86`, `101-105` and `194-202`: the same
  `makeSourcePipe(new EvalPipe(…), {…})`, 3 copies. **Step 11.**
- `lib/frames/fourth-hash.ts:175-179` and `221-225`: reading one load per child
  or channel, 2 copies. **Step 11.**
- `lib/frames/schema-bit-matcher.ts:65-69`, `96` and `113-117`: the
  `$!.bit-input-invalid` guard, 3 copies. **Keep:** a 3-line guard in each
  sibling matcher.
- `lib/execute/lex-run.ts:53-55`, `61-63`, `79-81` and `102-104`: emit, reset
  and rescan, 4 copies. **Keep:** each rescans a different symbol.

### Duplicated tests

**4.17 Test helpers are copied between files.** `Counter` is in
`lib/execute/catch.test.ts:13-21` and `lib/execute/error-policy.test.ts:19-27`,
both copied from `experiments/a13-recovery-spike/spike.test.ts:26-34`.
`CountingExpression` is in `lib/execute/resource-import.test.ts:92-103` and
`lib/frames/frame-import.test.ts:17-28`. The dispatch scaffolding (`read`,
`event`, `run`) is in `lib/frames/event-dispatch.test.ts:73-81` and
`lib/frames/event-dispatch.vact.test.ts:115-123`. And 34 helpers in 18 lib test
files wrap `evaluate` or `execute` to pick one result (`last`, `answer`,
`value`, `text` and others), 7 of them in `evaluate.test.ts`. **Disposition:
step 13.** Move them to one shared test-helper module. The copied FOIST check is
3.20.

**4.18 TypeScript tests re-assert testdoc claims.** 96 of 836 testdoc pairs
appear as string literals in a TypeScript test, 72 of them with an expectation
of 3 or more characters. The largest overlaps are `hc/time.hc` with
`lib/frames/frame-time.test.ts` (24 pairs), `hc/testdoc.hc` with
`lib/execute/evaluate.test.ts` (15) and `hc/foist-19a.hc` with
`lib/execute/foist-19a.test.ts` (7). A change to HC semantics then edits both
copies. The match is a heuristic, so each pair needs a look. **Disposition:
issue.** Removing a TypeScript copy changes what that test asserts, which the
Rules forbid in the refactor. A TypeScript copy should stay where it checks what
a testdoc cannot, such as a class or a host-side observer, or where `test:lib`
must cover the behavior without `test:doc`.

### Issues

**4.19 The footprint walk resolves names by a narrower rule than lookup.**
`lib/frames/access-footprint.ts:743-798` (`resolveName`, `resolveThrough`)
mirrors `frame.ts:250-323` (`get`, `lookup`) with 3 differences. It does not
follow a declared parent's lexical `up` (line 788); it uses fixed `parent` and
`up` links with `resolve_here`, so overrides of `lookup_here` and `lookup_links`
such as `FrameNumeric.lookup_links` (`frame-numeric.ts:344`) do not apply; and
it grades visibility with the target as origin (line 781), not the reading
scope. The mirror itself is deliberate, because it must record every frame it
consults as a read. `access-footprint.ts:54-66` says the event guard refuses
accesses the walk missed, so a divergence should appear as a spurious refusal
under `footprint` dispatch rather than an unsound admission. This was read, not
run. **Disposition: issue.** Decide whether the walk should reuse the traversal
of 4.3 through a visitor that records reads.

**4.20 `hc/cd-bit-kernel.hc` asserts three examples twice.** Lines 552–557 and
562–567 hold the same three error-contract examples under two introductions.
**Disposition: issue.** Removing one copy drops 3 testdoc claims, which the
Rules hold fixed.

**4.21 Only 2 of the 8 commit sites notify effect subscribers.**
`lib/frames/effect-registry.ts:19-24` says every committed mutation lands in
`MetaFrame.set` or `replaceMember`; the other 6 sites of 4.5 note a write
without notifying. A probe saw a callback fire on a property write through
`set_` (count 1). A mutable array handle applied with `xs_ 3` left `xs_` at
`[1, 2]` and fired nothing (count 0), because `FrameHandle.apply` collects onto
a copy (`frame-handle.ts:193-204`). The six sites appear to reach only frames
that cannot have subscribers yet, such as fresh copies, constructions and parser
state, and no observable gap was found. **Disposition: issue.** Either state
that invariant in `effect-registry.ts`, or have 4.5's helper notify on every
commit. The second could change behavior if a path the probe missed exists, so
it is the HC owner's decision.

### Deliberate copies

**4.22 Keep these copies.** Each is deliberate:

- **The Cayley–Dickson implementations.** `lib/frames/kd-signed-xor.ts` (199
  lines) is the production kernel behind `&|&`, which
  `lib/frames/kd-signed-xor.test.ts:110-176` compares with the bigint reference
  `lib/frames/cayley-dickson.ts` (100 lines).
  `experiments/007-observer-algebras/cayley-dickson.ts` (324) is a ring-generic
  algebra compared with the shipped `cdProduct` and `cdConjugate`.
  `experiments/017-classical-cd/oracle.ts` (429) and `cd-core.hc` (242) are
  017's host oracle and HC lane, which `compare.ts` compares.
  `hc/cd-bit-kernel.hc` (694) states the 023.02a sign rule that `kdCdSign`
  implements, checked by its own claims. An oracle is useful only while it is
  independent, and jscpd finds no clone among them. The same reason keeps `gcd`
  in `experiments/007-observer-algebras/exact.ts:29`, which repeats
  `greatestCommonDivisor` in `lib/frames/frame-rational.ts:14`.
- **Native Cart and Zip against the derived HC patterns.**
  `lib/ops/pairings.ts:35-69` and `hc/cart-zip.hc` compute the same pairings,
  and `hc/native-cart-zip.hc:55-67` asserts that they agree, so the pair is a
  differential test.
- **Round-robin dealing, native and in HC.** `lib/ops/math.ts:148-170` (`deal`)
  and `hc/rotor-router.hc:34-37` state the same rule. Dealing is native for
  speed (`lib/execute/router-prologue.ts:139-150`), and `hc/division.hc` (36
  claims) and `hc/rotor-router.hc` (13) pin the agreement.
- **Native observation of Denums and routers.**
  `lib/frames/fourth-hash.ts:55-78` re-checks what the HC `Denum` constructor
  validates (`hc/denum.hc:61-71`), and `fourth-hash.ts:158-183` computes what
  `.#` and `.##` compute in `hc/rotor-router.hc:38-39`. No observer, method or
  closure of the source runs, so a forged observer cannot steer the answer
  (`fourth-hash.ts:93-95`). The TypeScript reads the HC field names as literals
  (`"count"` and `"loads"` at `fourth-hash.ts:71` and `123`, `"channels"` at
  `router-prologue.ts:120`), so a rename in `hc/` would make recognition answer
  "not a Denum" rather than misread a value.
- **`closureFromAtoms` splits statements as the parser does.**
  `lib/frames/reread.ts:27-57` against `lib/execute/parse-pipe.ts:51-74`.
  `lib/frames` may not import the parser, and the function is the inverse of
  `atomsOf`.
- **A testdoc re-run from the host.** `lib/frames/event-dispatch.vact.test.ts`
  re-runs `hc/art-dispatch-vact.hc` and dispatches the same construction with
  finer observers, as the testdoc's header states.
- **The iteration tutorial and its corpus.** `hc/apply.hc` and
  `hc/apply-tutorial.md` share 9 example runs (40 lines), and `CLAUDE.md` names
  them as a pair.
- **Examples repeated between testdocs.** `hc/figures.hc`, `hc/foist-19a.hc` and
  `hc/constructed-state.hc` (runs of up to 6 lines), `hc/testdoc.hc` and
  `hc/white-paper.hc` (27 lines in 7 runs), and others. Each file is its own
  testdoc, and the Rules fix testdoc claims.
- **Copies inside the experiments.** 017's variant files repeat 5 to 9 setup
  lines so that each runs on its own, and `gate0.hc` copies definitions from
  `cd-core.hc`. `experiments/007-observer-algebras/bridge.ts:69-74` and `92-106`
  recompute the retired `.#%` binding and residual to keep the historical result
  reproducible. `lib/execute/catch.test.ts` carries cases ported from the a13
  spike, which must still run at `05b4f25`. Decision 3 keeps every experiment.
- **Wrapper delegation.** `FrameHandle` (`frame-handle.ts:94-100`) and
  `FrameScoped` (`frame-expr.ts:605-611`) both pass `sizeFor` and `nativeSize`
  to `referent()`: one-line delegations in wrappers with different contracts.
- **CLI line assembly.** `cli/runfile.ts:38-64` splits chunks into lines and
  strips a trailing `\r`, and `HCEval.call` (`lib/execute/hc-eval.ts:126-152`)
  also buffers lines. Moving the stripping into `HCEval` would change what
  `evaluate` and `HCLang` accept.
- **The deposit cursor in `hc/denum.hc`.** Lines 29 (in `apply_`) and 43 (in
  `deposit_`) write two 183-character objects that differ only in `.amount s`
  against `.amount k`, with a variant at `hc/rotor-router.hc:36`. Merging them
  would change the printed form and atom Size of both methods, which the Rules
  hold fixed. Each prologue also evaluates its file in a namespace of its own,
  so neither file can import the other.

## Step 5: Boundaries

`deno info --json` graphed all 101 non-test `lib/` modules (the 100 tracked ones
and the generated bundle) through one generated entry module that imports them
all, and the 80 tracked `lib/` test files through a second one. A value edge is
an import or re-export that `deno info` records under `code`, and a type-only
edge has only `type`. The 101 modules have 516 edges: 442 value edges and 74
type-only.

**`lib/` imports nothing from `cli/` or `web/`.** Both graphs have 0 such edges,
which confirms the plan's rule. The only `lib/` file that names a `cli/` path
outside a comment is `lib/execute/script-spec.ts`, which spawns it (3.1). One
import leaves `lib/` for another workspace package:

**5.1 `lib/` and `maml/` import each other.** `lib/maml.ts:8` imports
`../maml/tag.ts`, and `maml/tag.ts:7` imports `../lib/frames.ts`. JSR publishes
`lib/maml.ts` with the import unchanged, and it resolves to
`https://jsr.io/@swanfactory/hclang/maml/tag.ts`, which answers 404, so the
published module cannot load. Its only users are `maml/maml.test.ts`,
`maml/tag.test.ts` and `lib/index.ts`. **Disposition: step 12.** Move
`lib/maml.ts` into `maml/`, which owns `tag` and the only tests that use it.
`lib/` then depends on no other workspace package. Whether MAML gets an entry
point is 3.4.

**5.2 Two `lib/` modules import remote packages.**
`jsr:@nothing628/chalk@^1.0.1` at `lib/execute/hc-log.ts:1` and
`jsr:@std/expect@^0.219.1` at `lib/execute/script-spec.ts:1`; the `lib/mod.ts`
graph has neither. **Disposition: resolved by 5.3 and 3.1.** After them,
`lib/`'s non-test modules have no external dependency. The only other host
access there is `Date.now()` in `RealClock` (`lib/frames/clock.ts:61`), which
implements the `Clock` seam and stays.

### `console` calls

`console.` appears on 15 lines in 9 `lib/` modules, as the plan says, but only
11 are calls, in 6 modules; the other 4 are 3 JSDoc examples and 1 commented-out
call. Hit counts are from step 1's coverage. None of the 11 calls belongs in a
library. Two are in `script-spec.ts`, which step 9 deletes (3.1).

**5.3 `HCLog` prints the CLI's output from `lib/`.** `lib/execute/hc-log.ts:15`,
`:20` and `:23`, three `console.log` calls in `HCLog.apply`, hit 0, 0 and 969
times over the whole chain. `cli/hc.ts` is its only user. It colors output with
chalk, whose `supports-color` module reads `process.env` and `tty.isatty` while
it loads, which is why `test:load-order` needs `--allow-env`
(`lib/load-order.test.ts:7-9`, `deno.json:25`). **Disposition: step 12.** Move
`hc-log.ts` to `cli/`, with CLI output unchanged, then try dropping
`--allow-env` from `test:load-order` and update the comments that name the
logger (`lib/load-order.test.ts:8`, `env-visibility.ts:44-46`).

**5.4 `contextEqual` logs on every call.** `lib/frames/context.ts:40` and `:44`
print the key set and then each pair of values; the lines date from `eee9b3f`
(2025-02-16). **Disposition: step 9, with 3.11**, which deletes the function. If
3.11 is not approved, step 12 deletes the two lines, which leaves the return
value unchanged.

**5.5 `make_context` prints the whole context when asked.**
`lib/execute/hc-eval.ts:55`, a `console.debug` that runs when the input map has
a `DEBUG_ENV` key, hit 0 times. `make_context` is a `lib/mod.ts` export. The CLI
passes the `DEBUG_ENV` variable through (`env-visibility.ts:60`,
`cli/hc.ts:73`), and `HCLang` passes its constructor map (`hc-lang.ts:41`). The
JSDoc above it (lines 24–44) describes a branch that no longer exists and opens
a code fence it never closes (8.10). **Disposition: step 12.** Move the print to
`cli/hc.ts`, after `make_context(env)`, so the CLI prints the same thing, and
correct the JSDoc. **Needs a decision:** an embedder that passes `DEBUG_ENV` to
`make_context` or `HCLang` stops getting the printout.

**5.6 Two parser pipes print on a path only tests take.**
`lib/execute/lex-pipe.ts:171` and `lib/execute/parse-pipe.ts:101`, two
`console.error` calls, hit 0 times. They print only when `strictStructure` is
false. Every production pipe is strict, and all 15 non-strict constructions are
in tests, none of which reaches these lines. **Disposition: step 12.** Remove
the prints and keep what the path returns. No assertion depends on the output.

**5.7 `LexPipe` prints on a branch that cannot run.**
`lib/execute/lex-pipe.ts:147`, a `console.error` for an `end` action that
carries something other than a Frame. The only `end` action comes from
`addTerminal("\n", "end")` (`terminals.ts:94`), which always stores a Frame.
**Disposition: step 12.** Throw instead, as `ensure_factory`
(`lex-pipe.ts:17-23`) does when the same kind of invariant breaks. Nothing
observable changes.

**5.8 A commented-out call.** `lib/execute/terminals.ts:35`,
`// console.error("terminate", pipe);`. **Disposition: step 9.** Delete it.

**5.9 Three JSDoc examples print a result.** `lib/execute/evaluate.ts:18`,
`execute.ts:24` and `hc-eval.ts:43`. **Disposition: keep.** They show a caller
how to print a result; the library prints nothing there.

### Import cycles

**5.10 Two `instanceof` imports lie on 18 of the 24 value-import cycles.** Value
imports form 24 simple cycles in 2 components that cover 15 modules, all in
`lib/frames` except `lib/ops/frame-curry.ts`. No barrel and not `frame.ts` lies
on one. Component A has 12 modules, 26 internal edges and 23 of the cycles, and
`frame-symbol.ts` lies on 22 of them. Component B is the numeric ring
`frame-int` → `frame-decimal` → `frame-rational` → `frame-int`. Every module
still loads when imported first: all 57 uses of an imported value along the 29
edges inside the components sit inside a function or method body, and every
class on them extends a class outside them, except `FrameOperator`, which
extends `FrameSymbol` in the same file. `frame-symbol.ts:8` imports
`FrameSchema` as a value only to test `instanceof FrameSchema` (line 301), and
`frame-lazy.ts:10` imports `FrameSymbol` only to test `instanceof FrameSymbol`
(lines 205, 279 and 314). `Frame` already answers both with `isSchema()` and
`isSymbol()` (`frame.ts:917`), with the same answer for any Frame: only
`FrameSchema` overrides `isSchema()` and it has no subclass, and `FrameSymbol`'s
override covers its subclasses. `lib/` defines no `Proxy` and no
`Symbol.hasInstance`. **Disposition: step 12.** Call the guards and make both
imports type-only. That cuts the cycles from 24 to 6 and component A from 12
modules to 4.

**5.11 The 6 remaining cycles are constructor calls.** Five run among
`frame-array.ts`, `frame-note.ts`, `frame-string.ts` and `frame-symbol.ts`,
which construct one another's values, and the sixth is the numeric ring, where
each rung builds the next and `FrameRational.create` turns a whole result back
into a `FrameInt` (`frame-rational.ts:30`). **Disposition: keep.** Every edge is
a call inside a method, which loads safely. Breaking them would take late-bound
installs like `Frame.count`, which trade a visible import for a hidden
dependency on install order, and `lib/load-order.test.ts` already catches what a
cycle can break.

**5.12 Counting type-only imports, 70 of the 101 modules form one cyclic
component.** It has 423 internal edges and 18 mutually importing pairs. The
cause is that `Frame`'s signatures and type guards name its subclasses and
helpers (`frame.ts:13-21`). **Disposition: keep.** `import type` is how
TypeScript lets a base class name its subclasses, and the compiler erases it.

**5.13 `frame.ts` imports two types through the barrels.** `frame.ts:17-18`
import `ICurryFunction` and `IArrayConstructor` through `../ops.ts` and
`../frames.ts`, though they are defined in `lib/ops/frame-curry.ts:10` and
`lib/frames/frame-list.ts:37`. That pulls both barrels, and every module they
re-export, into the type-only component. **Disposition: step 12.** Import both
from their defining modules, which shrinks the component from 70 modules to 41
and has no run-time effect.

### Layering inside `lib/`

All 10 value edges from `lib/frames` to `lib/`'s root files go to `lib/scan.ts`
for the `ScanDisposition` enum, and `scan.ts` imports only the `Frame` type. No
module in `lib/ops` imports `lib/execute`.

**5.14 `lib/frames` imports from `lib/execute`.**
`lib/frames/frame-string.ts:11` imports the `sigilizer` instance from
`lib/execute/sigilizer.ts` and calls it at lines 23 and 144, since `6a30b64`
(#297). It is the only edge from `lib/frames` or `lib/ops` into `lib/execute`,
and it breaks the rule at `lib/execute/CLAUDE.md:15-16` that those directories
"cannot import this package". `sigilizer.ts` is 109 lines and imports only
`frames/frame.ts` and `scan.ts`, so it is not the parser that
`lib/frames/CLAUDE.md` rules out. **Disposition: step 12.** Move `sigilizer.ts`
and its test next to `lib/scan.ts`, the scan protocol both directories already
share; behavior does not change. **Needs a decision:** the owner may instead
amend the rule, if the Sigilizer counts as part of that protocol.

**5.15 `lib/frames` imports one class from `lib/ops`.**
`lib/frames/frame-symbol.ts:13` imports `FrameCurry` from
`lib/ops/frame-curry.ts` to test `instanceof FrameCurry` (lines 183 and 578). It
is the only edge in that direction, against 31 the other way, and after 5.10 it
lies on no cycle. **Disposition: keep.** No stated rule forbids it. Step 12 can
move `frame-curry.ts` into `lib/frames` if the owner wants `lib/frames`
independent of `lib/ops`.

**5.16 `env-visibility.ts` and `hc-test.ts` serve mainly the CLI.** `cli/hc.ts`,
`cli/test-docs.ts` and `cli/hc.test.ts` use `lib/execute/env-visibility.ts`;
`cli/hc.ts` and 3 `lib/` tests use `lib/execute/hc-test.ts`. Neither prints,
calls the Deno API or imports anything outside `lib/`. **Disposition: keep.**
Moving `HCTest` to `cli/` would make `lib/` tests import from `cli/`, the
direction the plan rules out, and `env-visibility.ts` is pure policy code.

### Public API

`deno doc --lint lib/mod.ts` exits 1 with 20 errors, in `lib/frames/frame.ts`
(17), `lib/execute/hc-lang.ts` (2) and `lib/version.ts` (1). 14 of the 15
exports have a JSDoc comment; counting public and protected members, `Frame`
documents 73 of 77, `MetaFrame` 30 of 30 and `HCLang` 4 of 6.

**5.17 Public signatures name 10 types the package does not export.** The 11
`private-type-ref` errors are members of `Frame` and `MetaFrame` that name
`ReceiverState` (`frame.ts:101`, `:797`), `BindingResolution` (`:173`),
`EvaluationInput` (`:756`), `ScanResponse` (`:816`), `EvaluationScope` (`:913`),
`FrameName` (`:918`), `FrameSymbol` (`:922`), `FrameSchema` (`:926`),
`FrameLazy` (`:930`) and `DeclaredApplication` (`:1210`). JSR users see them in
signatures but cannot import them. `lib/frames.ts` exports 8 of them; no barrel
exports `BindingResolution` or `DeclaredApplication`. **Disposition: step 12.**
Add type-only re-exports to `lib/mod.ts`, which adds no run-time export. **Needs
a decision:** this widens the public API, although it removes nothing. The
alternative, taking those members out of the public surface, would break users.

**5.18 Nine public declarations lack JSDoc.** The 9 `missing-jsdoc` errors are
`VERSION` (`version.ts:1`), `HCLang`'s constructor and `history`
(`hc-lang.ts:40`, `:38`), `Frame.in`, `isSymbol`, `isSchema` and `isClosure`
(`frame.ts:756`, `:922`, `:926`, `:930`), and two TypeScript-`private` members
that `deno doc` still lists, `MetaFrame.authorize` (`:484`) and
`Frame.quantityOperator` (`:1364`). `scripts/bump-version.ts:74-77` rewrites
`lib/version.ts` from a one-line template, so a comment added only to
`version.ts` would be lost at the next bump. **Disposition: step 12.** Add the
comments, and add the `VERSION` comment to the bump template.

**5.19 Nothing runs `deno doc --lint`.** No workflow, task or script calls
`deno doc`. **Disposition: step 16.** Add `deno doc --lint lib/mod.ts` to
`deno task test` or to CI once 5.17 and 5.18 pass.

**5.20 JSR publishes `lib/`'s tests and agent docs.** In the published 0.55.1,
the 80 `.test.ts` files are 671,719 of 1,528,937 bytes (43.9%) of 185 files, and
`lib/execute/CLAUDE.md` and `lib/frames/CLAUDE.md` ship too. The
`publish.exclude` list in `lib/deno.json` only re-includes
`bundle/hc-sources.ts`. **Disposition: step 16.** Exclude tests and CLAUDE.md
files from publishing.

## Step 6: Tests

### Modules with no sibling test

The plan's count holds: 36 of the 100 tracked non-test `lib/` modules have no
sibling `.test.ts`, which `CLAUDE.md:99` asks for. Coverage below is step 1's,
for `test:lib` alone and for the whole chain.

**6.1 Six are entry points, barrels, constants or types.** `lib/mod.ts` (the JSR
entry), `lib/frames.ts` (55 re-export statements, imported by 71 test files),
`lib/ops.ts` (re-exports and the `Ops` table), `lib/scan.ts` (8 exported types),
`lib/version.ts` and `lib/index.ts`, all at 100% of lines. **Disposition: keep**
the first five. They have no behavior of their own to assert,
`lib/load-order.test.ts` imports each first, and their importers' tests run
every line. `lib/index.ts` is deleted in step 9 (3.2).

**6.2 18 hold logic that tests in other files cover at 93.8% to 100%.**

| Module                                    | Lines, `test:lib` | Lines, `test:all` | Test files importing it |
| ----------------------------------------- | ----------------- | ----------------- | ----------------------: |
| `lib/execute/lex-run.ts`                  | 98/99             | 98/99             |                       0 |
| `lib/execute/parse-pipe.ts`               | 185/188           | 185/188           |                       6 |
| `lib/frames/atom-syntax.ts`               | 38/38             | 38/38             |                       2 |
| `lib/frames/dispatch-host.ts`             | 75/80             | 75/80             |                       1 |
| `lib/frames/error-kind.ts`                | 14/14             | 14/14             |                       1 |
| `lib/frames/evaluation-scope.ts`          | 394/402           | 394/402           |                       5 |
| `lib/frames/frame-list.ts`                | 191/196           | 191/196           |                       0 |
| `lib/frames/frame-match.ts`               | 9/9               | 9/9               |                       0 |
| `lib/frames/reread.ts`                    | 46/47             | 46/47             |                       0 |
| `lib/frames/resource-binding.ts`          | 5/5               | 5/5               |                       1 |
| `lib/frames/schema-bit-matcher.ts`        | 166/174           | 169/174           |                       0 |
| `lib/frames/schema-compiler.ts`           | 7/7               | 7/7               |                       0 |
| `lib/frames/schema-matcher.ts`            | 55/56             | 55/56             |                       0 |
| `lib/frames/schema-structural-matcher.ts` | 46/46             | 46/46             |                       0 |
| `lib/maml.ts`                             | 26/35             | 35/35             |              2, in maml |
| `lib/ops/math.ts`                         | 106/109           | 108/109           |                       3 |
| `lib/ops/membership.ts`                   | 22/22             | 22/22             |                       1 |
| `lib/ops/type-operations.ts`              | 44/46             | 44/46             |                       1 |

Tests that reach a module only through `evaluate()` count in coverage but not as
importers. **Disposition: keep** the tests where they are, and **step 14**
restates the rule at `CLAUDE.md:99` to match practice and so that step 16's
floor can check it. A possible wording: "Each module needs tests: a sibling
`<name>.test.ts`, or a feature test that the coverage report shows covering it."
**Needs a decision:** this changes a policy. Moving these tests into 18 sibling
files would add files without adding an assertion, and the feature files group
their cases on purpose (6.5). If the owner keeps the rule as written, step 13
moves the cases that target each module out of the feature files instead, which
means untangling them: `lib/execute/parse.test.ts` alone imports `lex.ts`,
`lex-pipe.ts` and `parse-pipe.ts`.

**6.3 11 are below 90%, with 216 lines uncovered.** The 90% cut is this audit's,
not a project rule.

| Module                            | Lines, `test:lib` | Lines, `test:all` | Uncovered |
| --------------------------------- | ----------------- | ----------------- | --------: |
| `lib/frames/frame-sequence.ts`    | 43/90             | 43/90             |        47 |
| `lib/frames/frame-rational.ts`    | 117/156           | 117/156           |        39 |
| `lib/execute/router-prologue.ts`  | 62/80             | 62/80             |        18 |
| `lib/frames/frame-decimal.ts`     | 132/164           | 132/164           |        32 |
| `lib/frames/frame-atom.ts`        | 34/42             | 34/42             |         8 |
| `lib/execute/terminals.ts`        | 57/67             | 57/67             |        10 |
| `lib/frames/frame-int.ts`         | 161/187           | 161/187           |        26 |
| `lib/execute/hc-log.ts`           | 5/39              | 34/39             |         5 |
| `lib/ops/frame-ops.ts`            | 22/25             | 22/25             |         3 |
| `lib/frames/fourth-hash.ts`       | 157/178           | 157/178           |        21 |
| `lib/frames/frame-observation.ts` | 53/60             | 53/60             |         7 |

**Disposition: issue**, the one in 3.14, for the lines that are live once step 9
deletes the dead ones (3.12, 3.13). If step 12 moves `hc-log.ts` out of `lib/`
(5.3), its entry moves with it.

**6.4 The other packages.** `cli/` has 1 module with no sibling test,
`cli/prompt.ts`, the untested REPL of 3.14. `web/` has 7 of 7, because its tests
live in `web/tests/`, as `web/deno.json`'s tasks name them. `scripts/` has 3 of
7, the entry points that `test:npm` and `test:compiled` run (1.4). `maml/` has
none, and `experiments/` has 7 of 13. **Disposition: keep**, apart from the
REPL.

**6.5 16 test files are named for a feature.** 16 of the 80 `lib/` test files
have no sibling module: `execute/{cart,catch,denum-observers,division,`
`error-policy,figures-native-size,foist-19a,hc-env,membership,parse,`
`rotor-router}.test.ts`, `frames/{denum-compatibility,event-dispatch.vact,`
`native-size,universal-denum}.test.ts` and `load-order.test.ts`. **Disposition:
keep.** They are the practice that 6.2's restated rule describes.

### Slowest tests

Durations are what the runner printed in step 1's three rounds. Deno prints 1 s
or more in whole seconds, truncated, so "4 s" means 4.000 to 4.999 s. Round 1
has 1,796 leaf cases, which print 12.44 s together: 2 print 1 s or more and
account for 48% of that, 14 print 100 ms or more (75%) and 1,189 print under 1
ms.

| Case                                                                | Location                                                       | Printed, three rounds |
| ------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------- |
| FOIST 19a: KD capacity and product budget use public named refusals | `lib/execute/foist-19a.test.ts:107`                            | 4 s, 4 s, 4 s         |
| routing a channel router grows linearly (PR #482 review)            | `lib/execute/division.test.ts:42`                              | 2 s, 2 s, 2 s         |
| the printed report equals the committed fixture                     | `experiments/007-observer-algebras/experiment.test.ts:235`     | 622, 603, 633 ms      |
| mirrors the artifact byte-for-byte as index.html                    | `web/tests/standalone.test.ts:72`                              | 427, 422, 460 ms      |
| the six `ci-format.sh` steps                                        | `scripts/ci-format.integration.test.ts:107` to `:223`          | 144 to 405 ms each    |
| C = 16 (sedenion-type)                                              | `experiments/007-observer-algebras/cayley-dickson.test.ts:107` | 196, 196, 201 ms      |
| historical Count binder routes agree                                | `experiments/007-observer-algebras/experiment.test.ts:65`      | 159, 148, 156 ms      |
| a router routes to channel C mod k (007.25e)                        | `lib/execute/rotor-router.test.ts:127`                         | 156, 158, 162 ms      |
| Property 1: named import parsing preserves target and source        | `lib/execute/resource-import.test.ts:1091`                     | 136, 139, 144 ms      |
| evaluates HC offline from a file:// URL                             | `web/tests/standalone-browser.test.ts:54`                      | 97, 84, 74 ms         |

The slowest files are `lib/execute/foist-19a.test.ts` (4.07 s) and
`lib/execute/division.test.ts` (2.02 s), together 6.09 s of the 8.69 s that the
main `test:lib` run's top-level tests print. The largest test file,
`evaluate.test.ts`, takes 110 ms, so splitting it (2.10) is for its structure,
not its speed.

**6.6 The slowest test builds one large Denum six times.** Location:
`lib/execute/foist-19a.test.ts:107-119`, and `recognizeDenum` in
`lib/frames/fourth-hash.ts:119-140`. Timed once outside the runner, its
statements take 4.38 s once the Denum class has loaded: building a 65,537-load
Denum takes 721 ms, `observeKDCoordinates` of it 1,427 ms, `Frame.negateDenum`
707 ms and `multiplyDenum` with a two-load Denum 1,483 ms. `recognizeDenum`
rebuilds its source through the shipped HC constructor and compares the two by
typed equality, which is the unforgeability check its doc comment describes.
`negateDenum` calls it once. `observeKDCoordinates` calls it twice, once inside
`observeDenum` and again on `observeDenum`'s answer, which is already a fresh
reconstruction, and `multiplyDenum` does the same for each operand. With the
first construction, the test builds the large Denum six times at about 0.7 s
each. **Disposition: issue**, "Recognize a Denum once per observation." If
`observeDenum` passed out the state that `recognizeDenum` has computed, 2 of the
6 builds would go, about 1.4 s, and every answer should stay the same. It
changes `lib/` code behind a deliberate check, so it is not a test restructure.
The test itself cannot shrink: a capacity refusal needs more than `KD_MAX_SLOTS`
(65,536) loads.

**6.7 The second slowest is a performance guard whose size is the point.**
Location: `lib/execute/division.test.ts:42-56`. It routes 8,000 Frames into
three channels, requires the counts `[2667, 2667, 2666]` and a run under 60 s,
and prints 2 s; its comment puts the old quadratic path at about 700 s.
**Disposition: keep.** A smaller input changes the asserted counts, which the
Rules fix.

**6.8 `test:lib` runs its 79 test files one at a time.** Location: the
`deno.json` task `test:lib`. It is the largest share of the chain, 13.49 s of
37.95 s (35.5%). Deno prints 12 s for the main run, which means at least 12.0 s,
while its top-level tests print 8.69 s, so at least 3.3 s of the run falls
outside any test body. The run is granted no permissions, so its files share
only CPU. **Disposition: step 13.** Try `deno test --parallel`, which runs files
concurrently and changes no assertion. The run cannot finish before
`foist-19a.test.ts` (4.07 s), and CI's runner core count sets the gain there, so
measure locally and on CI before changing the task. The one timing assertion,
6.7's 60 s bound against 2 s measured, leaves room for contention.

**6.9 One web assertion spends 0.43 s on `toEqual` over 375,672 bytes.**
Location: `web/tests/standalone.test.ts:75`, `expect(mirror).toEqual(artifact)`.
It prints 422 to 460 ms. Timed outside the runner on the baseline's `web/dist`
files, that `toEqual` takes 444 ms, and a length check with
`mirror.every((byte, i) => byte === artifact[i])` takes 1.9 ms. **Disposition:
step 13.** Compare the bytes directly. The test still asserts byte-for-byte
equality and loses only `toEqual`'s element-by-element diff, which for these
files is a diff of 375,672 numbers. It saves about 0.4 s of `test:web`.

**6.10 The other slow cases spend their time on what they test.** The six
`ci-format.sh` steps (1.61 s together) run the script against scratch git
repositories. `experiment.test.ts:235` runs the whole 007 experiment against its
fixture, `cayley-dickson.test.ts:107` checks sedenion laws,
`rotor-router.test.ts:127` routes through the HC class,
`resource-import.test.ts:1091` is a property test, and
`standalone-browser.test.ts:54` drives a browser through Playwright.
**Disposition: keep.** Each takes under 0.65 s, and making one faster means
testing less.

**6.11 Two steps in `evaluate.test.ts` share a name.** Location:
`lib/execute/evaluate.test.ts:447` and `:453`, both "binds expressions with
interior spaces" under `evaluate › numbers › binding`. It is the only repeated
name in the six `deno test` tasks. **Disposition: step 13.** Rename one, so a
failure report can say which failed. Both assertions stay.

### Numbers that content changes must update by hand

**6.12 `cli/hc.test.ts` pins 18 testdoc totals, 16 of them counts of `hc/`
content.** Location: `cli/hc.test.ts:326-634`.

| Line | Testdoc                                                       | Pinned total/pass/fail/unimplemented |
| ---: | ------------------------------------------------------------- | ------------------------------------ |
|  336 | `hc/testdoc.hc`                                               | 77/75/0/2                            |
|  350 | `hc/numerics.hc`                                              | 84/84/0/0                            |
|  364 | `hc/units.hc`                                                 | 40/40/0/0                            |
|  378 | `hc/figures.hc`                                               | 12/12/0/0                            |
|  392 | `hc/denum.hc`                                                 | 26/26/0/0                            |
|  407 | `hc/constructed-state.hc`                                     | 16/16/0/0                            |
|  421 | `hc/rotor-router.hc`                                          | 13/13/0/0                            |
|  435 | `hc/division.hc`                                              | 36/36/0/0                            |
|  465 | inline: 1 claim importing `figures.hc`                        | 1/1/0/0                              |
|  481 | inline: 3 overlay claims                                      | 3/3/0/0                              |
|  504 | `hc/BitScheme.hc`                                             | 40/32/0/8                            |
|  521 | `hc/white-paper-core.hc`, a legacy exception `test:doc` skips | 18/18/0/0                            |
|  535 | `hc/class-support.hc`                                         | 51/51/0/0                            |
|  549 | `hc/format.hc`                                                | 7/7/0/0                              |
|  565 | `hc/resources.hc`                                             | 34/34/0/0                            |
|  581 | `hc/time.hc`                                                  | 47/47/0/0                            |
|  597 | `hc/apply.hc`                                                 | 76/76/0/0                            |
|  629 | `hc/white-paper.hc`                                           | 95/95/0/0                            |

Each pin on a bundled file must change when that file gains, loses or
un-implements a claim. Of the 57 commits that changed `hc/*.hc` since the first
pin (#289, `24fd89f`), 42 also edited a pinned total; since v0.40.0 (`a5dc811`),
11 of 30 commits edited a pin, all of them alongside `hc/*.hc` changes. The pins
are also the only check that claims keep counting: `test:doc` fails a testdoc
only on a nonzero exit, which only a failed claim causes (`cli/test-docs.ts:75`,
`lib/execute/hc-test.ts:123-125`). Six of the 21 discovered testdocs, with 290
of the 944 claims, have no pin: `art-dispatch-vact.hc`, `cart-zip.hc`,
`cd-bit-kernel.hc`, `foist-19a.hc`, `membership.hc` and `native-cart-zip.hc`.
**Disposition: step 13.** Move the 16 expected summaries into one checked-in
table that a command regenerates, such as a `jsr:@std/testing/snapshot` file;
`cli/hc.test.ts:2` already imports `@std/testing`. Each test keeps asserting its
file's exact final summary, a content change needs one command instead of up to
16 edits, and reviewers still see the numbers change in the table's diff. **Step
14** adds the command to `cli/CLAUDE.md`'s testdoc section. **Keep** the 2
inline totals, which count claims written in the test itself. **Needs a
decision**, as an option: give the 6 unpinned testdocs entries too, or have
`test:doc` check every testdoc against the table. That adds assertions.

**6.13 `scripts/test-npm.ts` pins a numerics total that went stale at #383.**
Location: `scripts/test-npm.ts:127`, which requires the npx run of
`hc/numerics.hc --testdoc` to print
`“{"total":43,"pass":43,"fail":0,"unimplemented":0}”`. The file has 84 claims.
`629b883` (#377) set the pin when `cli/hc.test.ts` also pinned 43;
`cli/hc.test.ts` moved to 44 in `9651b75` (#383, v0.17.0), and `test-npm.ts`
never followed. It still passes because the testdoc prints a running tally after
every claim, and the tally after claim 43 matches. **Disposition: step 13.**
Drop the literal, since the run's exit status already fails on a failed claim,
or check the final summary from 6.12's table. **Needs a decision:** either way
the test asserts something other than it does today.

**6.14 Other numbers look pinned but need no hand update.**
`lib/frames/event-dispatch.vact.test.ts:256-258` requires at least 40 passing
claims of a testdoc that has 95, so added claims never break it.
`experiments/007-observer-algebras/experiment.test.ts:235-242` compares with a
committed fixture whose README names the command that writes it.
`lib/bundle/hc-bundle.test.ts:14` requires a nonempty bundle. The 2 legacy names
in `cli/test-docs.ts:19` and the 3 file names that
`web/tests/standalone.test.ts:62-70` expects in `web/dist` are contracts, and
the 65,537 loads at `foist-19a.test.ts:112` restate a public limit.
**Disposition: keep.**

## Step 7: Docs and records

Docs were read against the code at `ba6c00b` with `git`, `grep` and `perl`, and
open issues with read-only `gh issue list` and `gh issue view`. No HC program
ran for this step, so statements about behavior are read from source. Claims
about HC semantics were checked only for where the code lives.

### `doc/ARCHITECTURE.md`

It cites 165 code identifiers and file paths, and all 165 still exist. It has
not changed since `3ea256a` (#494, 2026-11-09), and 10 later commits changed
`lib/`, `cli/` or `web/`, among them FOIST 15 and 19a (#502, #506, #508). Its
class hierarchy, the late-bound installs, the `NUMERIC_RANK` order, the dispatch
policy names, the 16 error names it cites and every anchor the CLAUDE.md files
link into it are accurate.

**7.1 Five of its claims are contradicted by the code, and one topic is
missing.** Two of the claims recur in `lib/frames/CLAUDE.md`.

- `:175-182` (Resource Imports) says the Denum class is the one bundled file the
  evaluator reads without a root, and that `.####` constructs the Denum. Two
  bundled files load without a root: `hc/denum.hc` through
  `lib/execute/denum-prologue.ts` and, since #482, `hc/rotor-router.hc` through
  `lib/execute/router-prologue.ts`. Since #506, `.###` constructs the Denum
  (`lib/frames/frame.ts:597-598`) and `.####` answers KD coordinates read from
  it (`fourth-hash.ts:245`).
- `:158-159` (Resource Imports) gives Figures' `gap` and `spin` as names a
  module exports. Since #506, `hc/figures.hc` exports nothing; its only code
  line is `[] = []` (line 72).
- `:512-528` (Declared Application) says an aggregate may declare `#`, `##` or
  `###`, that `###` answers an exact integer and that `.####` derives from the
  three. `FrameArray.OBSERVATION_KEYS` is `#` and `##`
  (`lib/frames/frame-array.ts:304-307`), every declared answer must be a Count,
  `.###` is the raw Denum and `.####` derives from it.
- `:235-238` (Resources), and `lib/frames/CLAUDE.md:26-27`, say every refusal is
  decided in `resource-reference.ts`. It decides the 8 reference refusals; the
  stores decide 6 more, in `lib/frames/resource-store.ts:60` and `:147` and in
  `cli/resource-store.ts:41-87`.
- `:381` (Declared Parents), and `lib/frames/CLAUDE.md:21`, say `setParent` is
  the only writer of a declared parent. `FrameArray.in` (`frame-array.ts:60`)
  and `Frame.copy()` (`frame.ts:1314`, through `Object.assign`) also write it.
  Both copy an existing link onto a fresh frame, so the cycle invariant holds.
- `:99-115` (Operations) says each arithmetic operator defers to `FrameNumeric`,
  and omits what they do otherwise: for non-numeric operands `+` Flops, `-`
  Flops with a Denum half-turn, `*` is Cart and `/` deals into a `RotorRouter`
  (`lib/ops/math.ts:44-100`), while `|&|` is Zip and `&|&` the KD product
  (`lib/ops.ts:37-38`). Only `doc/FRAME-DENUM.md`, `doc/native-cart-zip.md` and
  `spec/foist-19a/README.md` describe these.

**Disposition: step 14.** Name both prologues and the `.###` and `.####` split,
replace or drop the Figures example, say "every reference refusal", say that
`setParent` is the only path that attaches a parent while copies carry the
source's link, and add a short section on the structural operators or link the
three documents. The same edits apply to `lib/frames/CLAUDE.md:21` and `:26-27`.

### CLAUDE.md files

They cite 74 identifiers and paths; the 68 that name a tracked file or a symbol
all exist, and the other 6 are globs, build outputs or the generated bundle.

**7.2 The root `CLAUDE.md` contradicts the code in five places, holds an index
its own rule forbids, and restates a count.** Its sixth inaccurate statement,
about the bundle, is 7.3.

- `:82-85` says that the one bundled file a bare `evaluate` reads is the Denum
  class that `.####` answers. As in 7.1, `.###` answers it, and
  `hc/rotor-router.hc` is a second such file.
- `:135-136` says to implement a built-in operation as a Frame subclass in
  `lib/ops/` and register it in the language context. An operation is an
  `ICurryFunction`, `(source, block) => Frame`, registered in the `Ops` table
  (`lib/ops.ts:33-64`), which becomes `Frame.globals` (`lib/frames.ts:208`).
- `:130` says to implement evaluation in `hc-eval.ts` or `hc-lang.ts`. Those are
  the line driver and the session API; evaluation lives in each Frame's `in` and
  `call` and in `lib/ops`. The line is unchanged since v0.7.5.
- `:144` says to implement `toString()` and `toStringArray()`. `toStringArray`
  exists only on `FrameList` and `FrameLazy`; atoms render through
  `toStringData()` (`frame-atom.ts:32`).
- `:72-76` says hosts lay the top-level `hc/` folder over the root and the
  package ships all of it. The embed takes `*.hc` only
  (`scripts/embed-hc.ts:40`, `:57`), 26 of the 27 tracked `hc/` files, so
  `hc/apply-tutorial.md`, which `:66-67` names, is not served.
- `:89-94`, Code Organization, is a directory index, which `:105-107` forbids,
  and it omits `maml/`, which `lib/` imports (5.1).
- `:156-158` says the bump task updates "the five `deno.json` files", which is
  accurate (`scripts/bump-version.ts:14-20`) but a count the code states.

**Disposition: step 14.** Correct the first five, keep only the "Keep lib/
independent" line of Code Organization, and drop the count. The testing rule at
`:99` is 6.2.

**7.3 Most tasks do not regenerate the bundle, as two docs say they do.**
`CLAUDE.md:77-79` and `README.md:189-193` say that build, test and publishing
tasks regenerate `lib/bundle/hc-sources.ts` automatically. Only `build`, `hc`,
`setup`, `test:doc`, `test:all` (so `test`), `publish:lib`, `publish:web` and
the cli package's `hc` (so `test:bs`) run `bundle:embed`. Four of the five
commands under the root CLAUDE.md's Running Tests (`test:cli`, `test:lib`,
`test:web`, `test:compiled`), and `test:load-order`, `test:npm`,
`test:observer-algebras`, `build:cli`, `build:npm` and `build:web`, import the
generated module without generating it. On a fresh clone they cannot resolve it,
and after an `hc/*.hc` edit they run against the previous copy. **Disposition:
step 16.** Chain `bundle:embed` into those tasks. If the owner prefers not to,
step 14 names the tasks that regenerate it instead.

**7.4 `cli/CLAUDE.md` and `web/CLAUDE.md` restate the code.** `cli/CLAUDE.md`
matches the code, but its exception names (`:18-19`) and "Only the clock is
bound" (`:50`) restate it. `web/CLAUDE.md` matches the code too, but its
Architecture (`:3-20`), Commands (`:27-39`) and Hosting (`:60-77`) sections
restate `web/deno.json`, the build script and the workflows, and `web/README.md`
already covers hosting. **Disposition: step 14**, as the plan says: trim
`cli/CLAUDE.md`'s two lines, and trim `web/CLAUDE.md` to the dependency boundary
and the artifact invariants.

**7.5 `lib/execute/CLAUDE.md:9-11` uses a Figures import as its example.** The
`HCLang` test it describes (`lib/execute/hc-lang.test.ts:60-72`) still exists,
but since #506 `hc/figures.hc` has one code line, so the import exercises no
exported definition. **Disposition: keep.** The statement is true. Its other
rule, at `:15-16`, is 5.14.

### README files and bundled prose

**7.6 `README.md` has four stale or incomplete passages.**

- `:163-173`, setup step 3, installs Python pre-commit. No
  `.pre-commit-config.yaml` has existed since #271. `deno task setup` installs
  deno-hooks (`deno-hooks.yml`), with a pre-commit hook for fmt and lint and a
  pre-push hook that runs `deno task test:all`, and the README mentions neither.
- `:98-114`, the task table, lists 13 of the 33 root tasks. It omits `test:all`
  and four tasks `test:all` chains: `test:scripts`, `test:observer-algebras`,
  `test:compiled` and, through `test:lib`, `test:load-order`.
- `:195-207`, Project Structure, lists `doc/` and `deno.json` as packages and
  omits `hc/`, `scripts/`, `spec/`, `experiments/` and `vscode-extension/`.
- `:24` describes Web as "Web components and Fresh framework integration". The
  product is the offline `hcweb.html` playground, and Fresh appears only in
  `web/tests/consumer/`.

**Disposition: step 14.**

**7.7 Two more prose lines describe retired or reversed behavior.**
`lib/README.md:79-82`, the JSR package page, says Figures imports `gap` and
`spin`, which #506 retired. `hc/BitScheme.hc:256` says "current HC uses `|` for
map and `&` for reduce", which v0.15.0 reversed (`lib/ops.ts:34`, `:41`); a
prose edit leaves the 40/32/0/8 totals that `cli/hc.test.ts:504` pins unchanged.
**Disposition: step 14.**

**7.8 The BitScheme tutorial exists three times.** `doc/BitScheme.adoc` (398
lines) is the source, which `web/index.html:141` links.
`web/static/BitScheme.html` is an Asciidoctor render of it last changed on
2025-02-22 (`3701615`); the two differ in one example line each, and
`web/deno.json` keeps `static/` out of both `dist/` and the JSR package, so
nothing serves it. `hc/BitScheme.hc` (350 lines) is the executable testdoc,
sharing 45 example lines with the adoc. **Disposition: step 17.** Add this to
the comment on #319, the open issue on migrating the 6 AsciiDoc files (7.13),
since regenerating or deleting the render belongs to that migration.

### Spec records

**7.9 10 of the 90 records under `spec/` have no status line.** A status line is
a `Status` field or line in a record's first 15 lines.

| Record                                               | Last commit          | Hint for step 15                                               |
| ---------------------------------------------------- | -------------------- | -------------------------------------------------------------- |
| `spec/1-fix-closures/04-hcfmt-spec.md`               | `6f62f3b` 2025-12-14 | Owner decides; no code mentions hcfmt                          |
| `spec/1-fix-closures/05-hcfmt-pretty-printing.md`    | `6f62f3b` 2025-12-14 | As above                                                       |
| `spec/2-type-tests/03-bitscheme-failures.md`         | `097824a` 2026-10-18 | "Historical", as its note at line 6 says                       |
| `spec/4-ai-security/01-ai-security-requirements.md`  | `f6feea0` 2026-08-09 | Owner decides                                                  |
| `spec/4-ai-security/02-hc-ai-security-triage.md`     | `097824a` 2026-10-18 | Owner decides                                                  |
| `spec/4-ai-security/04-risk-assessment.md`           | `f6feea0` 2026-08-09 | Owner decides                                                  |
| `spec/4-ai-security/README.md`                       | `f6feea0` 2026-08-09 | Lift the verdict of its "Current status" section (line 162)    |
| `spec/6-parsing-failures/checklists/requirements.md` | `9a6cf35` 2026-08-12 | "Completed for v0.8.4", as `10-sigilizer-checklist.md` has     |
| `spec/a13-error-handle/exception-tutorial.md`        | `01afcb4` 2026-10-25 | Owner decides                                                  |
| `spec/foist-19a/README.md`                           | `e307ba2` 2026-11-20 | "Implemented in v0.54.0 (#506); retirements in v0.55.0 (#508)" |

**Disposition: step 15.**

**7.10 Some status lines read as open although the work shipped.**
`spec/a02-hcweb-deployment.md:3` says "Proposed", but the release job builds
`hcweb.html` from the published JSR package and attaches it to the release
(`.github/workflows/deno.js.yml:307-320`).
`spec/a13-error-handle/01-error-handling.md:3` says "Proposed. Not implemented",
but a13/14 shipped the design in v0.40.0 (#473). `spec/a13-error-handle/11`,
`12`, `12a`, `12b` and `12c` say nothing in them is implemented or decided,
though `14-error-namespaces-and-catch.md` lists 11 to 13 as its prior work and
is implemented. `spec/2-type-tests/01-status.md:3` says "In Progress - Phase 1",
while its sibling `02-findings.md` of the same date says "Phase 1 Complete".
`doc/spec/2-deno-hooks/README.md`, a spec kept outside `spec/`, says
"Specification Draft" (version 0.1.0, 2025-12-14), though the tool it specifies
ships as `jsr:@theswanfactory/deno-hooks`. Five more records,
`spec/1-fix-closures/07`, `08`, `09`, `10` and `12`, all from 2025-12-14, read
as open but were not verified. **Disposition: step 15.** Update the verified
ones and check the five.

**7.11 Some records share a prefix.**
`spec/a12-reference-tracking-and-event-dispatch.md` and
`spec/a12-resource-frames.md` share `a12`, and `spec/a13-error-handle.md` sits
beside the folder `spec/a13-error-handle/`. **Disposition: keep.** Renaming them
would break the links that the changelog and other records hold.

### Experiments

Only `007-observer-algebras` has tasks, as the plan says; step 1 gives every
experiment's result, time and disposition. Outside `experiments/`, only those
two tasks and a comment at `lib/execute/catch.test.ts:9` refer to an experiment.
The root `deno fmt --check` and `deno lint` cover all three, but nothing
type-checks or runs 017 or a13 (8.7).

**7.12 Experiment 017 records an open closure pitfall.**
`experiments/017-classical-cd/README.md:106-111` records that the 017.09 pitfall
P5 still reproduces (`p5-depth` answers 1, 3, 5 instead of 1, 2, 3) and calls it
a name-resolution design question; no issue mentions it. **Disposition: keep.**
It is a question of HC semantics, which the plan puts out of scope, and the
README records it.

### Open issues

**7.13 Of the 15 open issues, the code resolves 3, 6 describe code that has
changed, and 6 still match it.**

| Issue                                                        | Against the code at `ba6c00b`                                                                                                                                                                                                                                                                              | Disposition                                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| #481 generated `hc-sources.ts` inflates every diff           | Resolved by #499, the issue's option 1: the file is gitignored, deleted from the tree, regenerated by the umbrella tasks and CI, and published through `"!bundle/hc-sources.ts"`. 7.3 is what remains.                                                                                                     | Step 17: close.                                                                               |
| #498 test HC design patterns for Cart and Zip                | Resolved in substance by #499 and #502: `hc/cart-zip.hc` asserts 9 of its 11 scenarios, and the native `\|&\|` answers the other 2 by truncating (`hc/native-cart-zip.hc`).                                                                                                                                | Step 17: close. **Needs a decision:** the owner confirms that `\|&\|` settles the Zip policy. |
| #452 recursive method ergonomics (Figure Graft)              | Resolved by #451's `.inlay`, then made obsolete: #456 deleted its tests, and #506 and #508 retired the helper.                                                                                                                                                                                             | Step 17: close.                                                                               |
| #361 numeric type mismatch returns nil                       | Partly superseded: `+`, `*` and `-` now Flop or Cart non-numeric pairs, and `/` deals arrays and groups; `%%`, `**`, `>`, `>=`, `<` and `<=` still answer nil. The test it cites was renamed.                                                                                                              | Keep open. Step 17: comment with the current state.                                           |
| #362 could numbers carry their units?                        | Partly answered: #365 shipped the MVP (`FrameTypedNumber`, `hc/units.hc`), and `spec/a09-units/05-uom-mvp.md` leaves tensions T3 to T7 open.                                                                                                                                                               | Keep open. Step 17: comment.                                                                  |
| #310, #311, #312 BitScheme constructors, framebuffer, RISC-V | Unresolved: 8 `$!.unimplemented` expectations remain in `hc/BitScheme.hc`. All three name `cli/hc/BitScheme.hc`, which moved to `hc/BitScheme.hc` in #405.                                                                                                                                                 | Keep open. Step 17: comment with the path.                                                    |
| #319 migrate the remaining AsciiDoc to GFM                   | Unresolved: all 6 `.adoc` files and the `.adoc` shim at `cli/runfile.ts:7-10` remain. It also names `cli/hc/BitScheme.hc`.                                                                                                                                                                                 | Keep open. Step 17: comment with the path and 7.8.                                            |
| #277, #374, #410, #428, #474, #485                           | Unresolved, and each description still matches the code: no REST handler; no set semantics for `()`; `FrameType.match` compares exact constructors; `unwrapSingleton` unwraps one-term closures and arrays; `FrameNote.LABELS` has only `en`; `FrameLazy.bindSignature` and `bindReturn` assign on `this`. | Keep open.                                                                                    |

## Step 8: Tooling

`deno test`, `deno check` and `deno info` ran with `--frozen` or
`--frozen-lockfile`, and `deno.lock` kept its hash throughout.

### `deno outdated`

`deno outdated --recursive` finds 8 of the 13 packages in the import maps behind
their latest release. `--compatible` finds nothing, because every declared
version is exact or already resolves to its newest match, so each update needs a
range edit. 5 of the 8 have a newer release on their current line (the same
major, or the same minor for 0.x).

| Package                          | Declared in                                           | Current              | Newest on its line | Latest          | Finding |
| -------------------------------- | ----------------------------------------------------- | -------------------- | ------------------ | --------------- | ------- |
| `jsr:@theswanfactory/deno-hooks` | `deno.json:79-80`                                     | 0.2.1-dev.1765778019 | none               | 0.3.0, breaking | 8.1     |
| `jsr:@std/expect`                | `cli/deno.json:19`                                    | 0.219.1              | 0.219.1            | 1.0.20          | 8.2     |
| `npm:playwright`                 | `web/deno.json:45`                                    | 1.62.0               | 1.65.1             | 1.65.1          | 8.3     |
| `npm:preact`                     | `web/deno.json:46`, `web/tests/consumer/deno.json:11` | 10.29.8              | 10.29.8            | 11.2.0          | 8.4     |
| `npm:@preact/signals`            | `web/deno.json:42`, `web/tests/consumer/deno.json:7`  | 2.11.0               | 2.11.4             | 2.11.4          | 8.3     |
| `npm:@testing-library/preact`    | `web/deno.json:43`                                    | 3.2.4                | 3.2.6              | 3.2.6           | 8.3     |
| `npm:jsdom`                      | `web/deno.json:44`                                    | 30.0.1               | 30.1.3             | 31.0.1          | 8.3     |
| `npm:vite`                       | `web/tests/consumer/deno.json:12`                     | 7.3.6                | 7.3.8              | 8.3.8           | 8.3     |

`@nothing628/chalk` 1.0.1, `@std/cli`, `@fresh/core` 2.3.3, `@fresh/plugin-vite`
1.1.2 and `@types/babel__core` 7.20.5 are current.

`deno outdated` reads only import maps, so it misses these pins:

| Pin                            | Where                                                              | Locked or pinned | Newest on its line | Latest |
| ------------------------------ | ------------------------------------------------------------------ | ---------------- | ------------------ | ------ |
| `jsr:@std/expect@^0.219.1`     | inline in 98 files                                                 | 0.219.1          | 0.219.1            | 1.0.20 |
| `jsr:@std/expect@1.0.17`       | inline in the 4 `web/tests/` test files                            | 1.0.17           | 1.0.20             | 1.0.20 |
| `jsr:@std/testing@^1.0.10`     | inline in 79 files                                                 | 1.0.16           | 1.0.21             | 1.0.21 |
| `jsr:@std/testing@1.0.15`      | inline in 3 `web/tests/` files                                     | 1.0.15           | 1.0.21             | 1.0.21 |
| `jsr:@std/path@1.1.6`          | inline in 5 files                                                  | 1.1.6            | 1.1.6              | 1.1.6  |
| `jsr:@deno/dnt@0.43.2`         | `scripts/build-npm.ts:1`                                           | 0.43.2           | 0.43.2             | 0.44.0 |
| Deno `v2.9.5`                  | `setup-deno` in `deno.js.yml` (4 jobs) and `demo-availability.yml` | 2.9.5            | 2.9.8              | 2.9.8  |
| `npm:playwright@1.62.0`        | browser installs in `deno.js.yml` (3) and `demo-availability.yml`  | 1.62.0           | 1.65.1             | 1.65.1 |
| `npm:@vscode/vsce@3.9.2`       | the three `vscode:*` tasks in `deno.json`                          | 3.9.2            | 3.9.2              | 4.1.1  |
| `jsr:@std/http@1.1.3`          | web's `serve` task                                                 | 1.1.3            | 1.1.4              | 1.1.4  |
| `@types/node` 22.20.2          | `scripts/build-npm.ts:59`, for the npm package                     | 22.20.2          | 22.20.5            | 26.6.6 |
| `actions/setup-node@v6`        | 3 steps in `deno.js.yml`                                           | `v6` tag         | `v6` tag           | v7.1.0 |
| `actions/download-artifact@v7` | `deno.js.yml:251`                                                  | `v7` tag         | `v7` tag           | v8.0.2 |

The 98 files that import `@std/expect@^0.219.1` are 97 tests and
`lib/execute/script-spec.ts` (3.1). The other GitHub actions are on their latest
major, and no Dependabot or Renovate configuration is tracked, so nothing
reports any of these.

### Findings

**8.1 The hook runner is pinned to a yanked pre-release.** Location:
`deno.json:79-80`, two aliases for
`jsr:@theswanfactory/deno-hooks@0.2.1-dev.1765778019`, which `setup` uses; the
config in `deno-hooks.yml`; and the hooks that `setup` writes into `.git/hooks`.
JSR marks this version yanked, along with 0.2.1. Nothing breaks today, because
JSR still serves a yanked version to an exact reference or a lock entry. The two
newest unyanked versions are 0.2.0, which predates the fix that 0.2.1's
changelog calls critical, and 0.3.0, which is breaking: it removes the built-in
`deno-fmt` and `deno-lint` hooks, `glob` matching, `pass_filenames` and the
`/run` entry, all of which `deno-hooks.yml` and the installed hooks use. Only
the `deno-hooks` alias is used. **Disposition: step 16.** Move to 0.3.0: rewrite
`deno-hooks.yml` as command lists, drop the unused alias and rerun
`deno task setup`. **Needs a decision:** 0.3.0 hooks run plain commands with no
file list, so pre-commit would run `deno fmt --check` and `deno lint` on the
whole working tree, unstaged edits included, instead of formatting the staged
files; at step 1's timings that takes 0.05 s. Separately, record an **issue**
for the deno-hooks repository: both versions install into
`$(git rev-parse --show-toplevel)/.git/hooks`, and in a worktree `.git` is a
file, so `setup` would fail there. This was read from the source, not run, and
the effect is small, because git reads hooks from the common directory, so the
main checkout's hooks already apply to every worktree.

**8.2 `deno outdated` cannot see most dependency uses.** Location: inline `jsr:`
specifiers in 109 tracked source files, covering 6 packages. It reports
`@std/expect` only through the `cli/deno.json:19` alias, which 2 files import,
while 102 import it inline, and it never mentions `@std/testing`, which 82 files
use, or `@deno/dnt`. Six jsr packages are locked at two versions each. Four of
the doubles come from the split pins (`@std/expect` and `@std/testing`, plus the
0.219.1 copies of `@std/assert` and `@std/fmt` that `@std/expect@0.219.1` pulls
in). `@std/encoding` 1.0.10 serves only an unused package (8.12), and
`@deno/loader` 0.3.14 sits beside 0.4.0 because `@fresh/core`'s esbuild plugin
and `@fresh/plugin-vite` want different ranges, which stays. **Disposition: step
16.** Move each inline jsr specifier into an import map, one version per
package, so that `deno outdated` reports it and `--update` can change it, then
update. That edits the import lines of 109 files, and `lib/` has no import map
yet. Moving 98 files from `@std/expect` 0.219 to 1.x changes the assertion
library under them, so step 16 must confirm that the counts still match step 1:
268 tests passed and 1,784 steps.

**8.3 Routine updates for test, build and CI pins.** These stay on their current
line: playwright 1.62.0 to 1.65.1, `@preact/signals` 2.11.0 to 2.11.4 (the only
hcweb runtime dependency among them), `@testing-library/preact` to 3.2.6, jsdom
to 30.1.3, vite to 7.3.8, `@std/testing` to 1.0.21, the web tests' `@std/expect`
to 1.0.20, `@std/http` to 1.1.4 and CI's Deno to 2.9.8. Playwright's version
sits in `web/deno.json:45` and in the four workflow lines that install its
browser, and each release needs its own browser build, so all five change
together. `@types/node` 22.20.2 describes Node 22, while the npm package's
`engines.node` is `>=24` and CI tests on Node 24; the newest 24.x is 24.19.2.
Six updates leave their line, so each can break something: jsdom 31 (tests
only), `@vscode/vsce` 4.1.1 (needs Node 22, which the publish step already sets
up), `@deno/dnt` 0.44.0, `actions/setup-node` v7, `actions/download-artifact`
v8, and vite 8, which is blocked: `@fresh/plugin-vite@1.1.2` depends on
`npm:vite@^7.1.4`, and the consumer fixture exists to mirror a Fresh 2 app.
**Disposition: step 16.** Apply the same-line updates, with `@types/node` on
24.x to match the engines floor. Take each cross-line update after its own
check: jsdom with `test:components`, vsce with `deno task vscode:package`, dnt
with `test:npm`, and the actions on a CI run. Keep vite on 7.x until a
`@fresh/plugin-vite` release accepts 8.

**8.4 preact 11 is a major update to a dependency hcweb publishes.** Location:
`web/deno.json:46` and `web/tests/consumer/deno.json:11`, `npm:preact@10.29.8`,
the newest 10.x; 11.2.0 is the latest. JSR turns hcweb's import map into its
dependencies, so its users get exactly that preact. `@fresh/core@2.3.3` depends
on `npm:preact@^10.28.2` and `^10.29.1`, so a Fresh 2 app that added hcweb on
preact 11 would resolve two copies. **Disposition: issue.** Moving hcweb off
Fresh 2's preact line is a product decision, not routine maintenance.

**8.5 maml's own `test` task rewrites sources.** Location: `maml/deno.json:8`,
`deno fmt && deno lint --fix && deno test --allow-env --allow-read --allow-write`.
It formats maml's 4 formattable files and lint-fixes its 3 lintable ones.
Neither `test:all` nor CI runs it: `test:all` runs the root `test:maml`, which
is `deno test maml`. Run once at `ba6c00b`, it exited 0 in 0.39 s and changed
nothing, and the root `test:maml` passes with no permissions, so the tests need
none of the three grants. **Disposition: step 16**, as the plan says. Make it
check-only, for example `deno fmt --check && deno lint && deno test`, and drop
the grants. A scan of all 50 tasks in the 6 tracked `deno.json` files found two
other tasks that rewrite files, both kept: the root `fix`, which `README.md`
names as the fixer, and `bundle:embed`, which formats only the file it
generates.

**8.6 `test:cli` writes scratch files into `cli/`.** Location:
`cli/runfile.test.ts:19`, `34`, `47`, `59` and `71`. Five tests write fixed
names such as `./testfile.test.txt` into the working directory, which `test:cli`
sets to `cli/`, and delete them outside a `finally` (lines 30, 43, 56, 68 and
80). A failing assertion therefore leaves a file behind, which no `.gitignore`
pattern matches. Step 1's runs left nothing behind, and the same file's later
tests already use `Deno.makeTempFile` with `finally`. Every other write in the
test suites goes to a temporary path. **Disposition: step 16.** Use
`Deno.makeTempFile` and `finally` in these five too; no assertion changes.

**8.7 20 tracked files are outside the pull-request type check.** CI runs no
`deno check`. Types are checked only as a side effect of `deno test` in the test
tasks, `deno compile` in `build:cli`, and `deno publish --dry-run` for lib and
web. `deno run`, which runs `bundle:embed`, `build:npm`, `test:doc`, `test:npm`,
`test:compiled` and the format job's script, does not type-check, nor does
`deno bundle` in `scripts/build-hcweb.ts`, and vite strips types without
checking them. The union of those commands' module graphs, from 105 roots, holds
223 of the 243 tracked files. All 20 others pass `deno check` today, so the risk
is future drift.

| Files                                                                                                 | What runs them                                       | Disposition                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/build-npm.ts`, `scripts/test-compiled.ts`, `scripts/test-npm.ts`                             | `deno run`, on every CI build                        | step 16: add to the CI check (8.9)                                                                                              |
| `web/tests/consumer/client.ts`, `main.ts`, `routes/_app.tsx`, `routes/index.tsx`, `vite.config.ts`    | vite, in `test:consumer`                             | step 16: web's `check` task covers them (8.8)                                                                                   |
| `web/tests/production.test.ts`                                                                        | `test:production`, after merge only                  | step 16, as the row above                                                                                                       |
| `lib/index.ts`, `lib/execute/script-spec.ts`                                                          | `lib/load-order.test.ts`, which loads them unchecked | step 9 deletes them (3.1, 3.2)                                                                                                  |
| `experiments/017-classical-cd/compare.ts`, `oracle.ts`, `oracle.test.ts`, `parse.ts`, `parse.test.ts` | nothing                                              | step 15: chaining 017's tests from `test:all` checks all five                                                                   |
| `experiments/017-classical-cd/run.ts`                                                                 | nothing; it is the evidence run                      | step 16: add to the CI check                                                                                                    |
| `experiments/007-observer-algebras/report.ts`                                                         | `experiment:observer-algebras`                       | step 16: add to the CI check                                                                                                    |
| `experiments/a13-recovery-spike/spike.ts`, `spike.test.ts`                                            | nothing; 3 of its 13 tests fail                      | keep unchecked: step 15 archives it, and its graph holds 89 lib modules, so checking it would tie archived code to the refactor |

**Disposition:** per row. Checking the whole tracked tree takes 1 to 3 s.

**8.8 web's `check` task never runs in CI.** Location: `web/deno.json:12`,
`deno fmt --check . && deno lint . && deno check`, which `web/README.md:48` and
`web/CLAUDE.md:34` document. At `ba6c00b` it exits 0 in 1.16 s and type-checks
all 17 web files, the five consumer files and `production.test.ts` among them.
**Disposition: step 16.** Run it in the build job, or let the root check of 8.9
cover `web/`.

**8.9 A bare `deno check` at the root fails after a build.** Location: the root
`exclude` (`deno.json:61-63`), which lists `web/dist/` and `**/_fresh/` but not
`dist/`. Once `test:npm` has filled the gitignored `dist/npm/`, a bare
`deno check` walks 435 files, 208 of them in `dist/npm/`, and exits 1 with
"Could not find a matching package for 'npm:@types/node'". `deno lint` skips
gitignored files and `deno check` does not. CI's build job runs `build:npm`
before the tests, so a bare check added after it would fail the same way.
`deno check --frozen cli lib maml scripts experiments web` checks the 243
tracked files and the bundle and exits 0 in 1.02 s. **Disposition: step 16.**
Add `dist/` to the root `exclude` or name the directories, run the check after
`bundle:embed`, and leave out `experiments/a13-recovery-spike` (8.7).

**8.10 Code blocks in docs are never type-checked.** Location:
`web/README.md:34-37`, and the JSDoc `@example` blocks at
`lib/execute/evaluate.ts:14`, `lib/execute/execute.ts:21`,
`lib/execute/hc-eval.ts:35` and `lib/frames/context.ts:17`. Run on `README.md`,
`lib/README.md` and `web/README.md`, `deno check --doc-only` checks 6 TypeScript
blocks, and one fails with TS2304 "Cannot find name 'fresh'", because the
`web/README.md` fragment omits its import. In the four JSDoc examples
`--doc-only` finds no block: three have no code fence, and `hc-eval.ts:36` opens
a `typescript` fence it never closes. **Disposition:** step 14 fixes the README
fragment, step 12 fixes the JSDoc fences with 5.5 and 5.18, and step 16 decides
whether CI runs `--doc-only` on the package READMEs.

**8.11 CI builds every artifact twice.** Location:
`.github/workflows/deno.js.yml:98` (`deno task build`) and `:100`
(`deno task test:all`). `test:all` rebuilds each output of `deno task build`
before its tests use it, and `bundle:embed` runs four times per build job. The
uploads at lines 101–112 take `test:all`'s outputs. At step 1's medians the
repeated work is 4.33 s per run: `build:cli` 2.35 s, `build:npm` 1.79 s, web's
`build` 0.12 s and `bundle:embed` 0.07 s. **Disposition: step 16.** Drop the
separate build step. **Needs a decision:** a build failure would then show up
inside the test step rather than as its own failed step, which the owner may
think worth the 4.33 s.

**8.12 The lockfile carries 213 entries that nothing uses.** Location:
`deno.lock`. Its `remote` section holds 210 `https:` entries, 26,957 of the
file's 111,727 bytes (24%): 137 from `deno.land/std@0.216.0`, 41 from
`deno.land/x/fresh@1.7.3`, which entered in #252, and 32 from
`deno.land/x/esbuild` and esm.sh. None is in the module graph of any of the 243
tracked files. Three jsr entries also serve nothing in use:
`@luca/esbuild-deno-loader@0.11.0`, `@fresh/init@2.3.3` and
`@std/encoding@1.0.10`. **Disposition: step 16**, with the dependency updates.
Regenerate the lock and commit it once `test:all` passes.

**8.13 `deno task clean` deletes the lock and then exits 1.** Location:
`deno.json:14`, `rm deno.lock */deno.lock`. The workspace has one lock, at the
root, and deno's task shell passes an unmatched glob through unchanged. Probed
on a scratch file, the command removed it and then exited 1 with "rm: cannot
remove '\*/deno.lock'". **Disposition: step 16.** Change it to `rm deno.lock`.

**8.14 Keep the other pre-release pin and the deliberate rewriters.**
`npm:gensync@1.0.0-beta.2`, the one pre-release in `deno.lock` besides
deno-hooks, is gensync's newest release, pulled in through `@babel/core` by the
consumer build test only. The gitignored outputs the test chain writes into the
tree (the bundle, `dist/npm/`, the npm tarball, `scripts/hc`, `web/dist/` and
`web/tests/consumer/_fresh/`) are the artifacts its tests check. The pre-commit
hook that formats staged files and the CI `format` job that pushes
`style: deno fmt` commits rewrite files by design. **Disposition: keep.**

## Dispositions

Where a finding splits, the part is named after its ID.

| Disposition | Findings                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 9      | 3.1, 3.2, 3.3, 3.7, 3.8 (the values and `ScanHost`), 3.10, 3.11, 3.12, 3.13, 3.17, 3.18, 5.4, 5.8, 8.7 (two files)                                                                                                                                                                                                                                   |
| Step 10     | 2.3, 2.4, 2.5, 2.7, 2.8, 2.9                                                                                                                                                                                                                                                                                                                         |
| Step 11     | 4.1 to 4.15, 4.16 (three repeats)                                                                                                                                                                                                                                                                                                                    |
| Step 12     | 5.1, 5.3, 5.5, 5.6, 5.7, 5.10, 5.13, 5.14, 5.17, 5.18, 8.10 (JSDoc fences)                                                                                                                                                                                                                                                                           |
| Step 13     | 2.10, 2.11, 3.20, 4.17, 6.8, 6.9, 6.11, 6.12, 6.13                                                                                                                                                                                                                                                                                                   |
| Step 14     | 3.19, 6.2 (the testing rule), 6.12 (the regenerate command), 7.1, 7.2, 7.4, 7.6, 7.7, 8.10 (README fragment)                                                                                                                                                                                                                                         |
| Step 15     | experiments 017 and a13 (step 1), 7.9, 7.10, 8.7 (017's five files)                                                                                                                                                                                                                                                                                  |
| Step 16     | 1.1, 1.2, 1.3, 5.19, 5.20, 7.3, 8.1, 8.2, 8.3, 8.5, 8.6, 8.7 (eleven files), 8.8, 8.9, 8.10 (the CI choice), 8.11, 8.12, 8.13                                                                                                                                                                                                                        |
| Step 17     | 7.8, 7.13 (close #481, #498 and #452; comment on #361, #362, #310, #311, #312 and #319)                                                                                                                                                                                                                                                              |
| Issue       | 1.5, 1.6, 2.2, 3.4, 3.5, 3.14 (three groups, with 6.3), 3.16 (`lib` and `cli` branches), 3.22, 4.18, 4.19, 4.20, 4.21, 6.6, 8.1 (upstream deno-hooks), 8.4                                                                                                                                                                                           |
| Keep        | 1.4, 2.1, 2.6, 2.12, 3.6, 3.8 (31 types), 3.9, 3.14 (printing one-liners), 3.15, 3.16 (guards, tooling and experiment branches), 3.21, 4.16 (two repeats), 4.22, 5.2 (`RealClock`), 5.9, 5.11, 5.12, 5.15, 5.16, 6.1, 6.4, 6.5, 6.7, 6.10, 6.12 (inline totals), 6.14, 7.5, 7.11, 7.12, 7.13 (six issues stay open), 8.7 (a13), 8.14, experiment 007 |

These dispositions need a decision as well as approval:

- 3.3 deletes `cli/flatten.test.ts` with the module it tests.
- 3.11 removes `contextEqual` from the public API, with a minor version bump,
  deletes its 4 expectations and changes how `evaluate.test.ts:1833` compares a
  context.
- 5.5 stops `make_context` and `HCLang` from printing the context for embedders
  that pass `DEBUG_ENV`.
- 5.14 moves the Sigilizer, or instead amends the `lib/execute/CLAUDE.md` rule.
- 5.17 adds type-only exports to `lib/mod.ts`.
- 6.2 restates the testing rule at `CLAUDE.md:99`.
- 6.12 offers pinning the 6 unpinned testdocs, which adds assertions.
- 6.13 changes what `scripts/test-npm.ts` asserts about the numerics run.
- 7.13 closes #498 only if the owner confirms that the native `|&|` settles its
  Zip policy.
- 8.1 makes pre-commit check the whole working tree instead of formatting the
  staged files.
- 8.11 drops CI's separate build step, so a build failure shows up inside the
  test step.

## Reproduce

Run from the repository root with `NO_COLOR=1`. Step 17 repeats the step 1
commands.

```sh
# Step 1, wall time: three rounds of every task test:all chains, then the chain,
# after a warm-up `deno task test:all`. Web's sub-steps run as
# `cd web && deno task <name>`.
zmodload zsh/datetime
for t in bundle:embed test:cli test:lib test:maml test:scripts \
    test:observer-algebras test:web test:doc test:npm test:compiled test:all; do
  s=$EPOCHREALTIME
  deno task $t > "/tmp/$t.log" 2>&1
  printf '%s exit %d %.2f s\n' $t $? $(( EPOCHREALTIME - s ))
done
# Test counts are the `ok | N passed (M steps)` lines of those logs. Testdoc
# claims are the {"total":…} on each file's `$=.test-summary` line in the
# test:doc log.

# Step 1, coverage, here for lib. Repeat for cli, maml, scripts, web (with
# --exclude='/web/(tests|dist)/', collected as 1.2 says) and
# experiments/007-observer-algebras, each with its own task and --include. For
# the whole chain, collect `deno task test:all` once and report it with each
# package's filters. Totals are the sums of the lcov's LH/LF, BRH/BRF and
# FNH/FNF records.
DENO_COVERAGE_DIR=/tmp/cov/lib deno task test:lib
deno coverage /tmp/cov/lib --include="^file://$PWD/lib/" \
  --exclude='\.test\.(js|mjs|ts|jsx|tsx)$' \
  --exclude='/lib/bundle/hc-sources\.ts$' --lcov --output=/tmp/cov/lib.lcov

# Step 1, experiments
deno test --allow-read experiments/007-observer-algebras
deno test experiments/017-classical-cd
(cd cli && deno task hc ../experiments/017-classical-cd/gate0.hc -t)
deno test experiments/a13-recovery-spike
D=$(mktemp -d)   # a13 in the tree of the commit its tests last ran at
git archive 05b4f25 | tar -x -C "$D"
git archive ba6c00b experiments/a13-recovery-spike | tar -x -C "$D"
(cd "$D" && deno test experiments/a13-recovery-spike)

# Step 2, line counts
git ls-files -- 'lib/*.ts' 'cli/*.ts' 'web/*.ts' 'web/*.tsx' 'maml/*.ts' \
  'scripts/*.ts' 'experiments/*.ts' | xargs wc -l | sort -rn | head -20

# Step 4, clones in lib's source, run in a `git archive` snapshot
npx --yes jscpd@4.0.5 --max-lines 5000 --max-size 500kb --min-tokens 50 \
  --min-lines 5 --format typescript --pattern '**/*.ts' --ignore '**/*.test.ts' \
  lib/frames lib/ops lib/execute lib/frames.ts lib/ops.ts lib/scan.ts lib/maml.ts

# Step 5
git grep -n 'console\.' -- 'lib/*.ts' ':!*.test.ts'
deno doc --lint lib/mod.ts

# Step 6, lib modules with no sibling test, and pinned testdoc totals
git ls-files 'lib/*.ts' | grep -v '\.test\.ts$' | while read f; do
  git ls-files --error-unmatch "${f%.ts}.test.ts" > /dev/null 2>&1 || echo "$f"
done
git grep -n -E '"total":[0-9]+' -- '*.ts'

# Step 7, spec records with no status line in their first 15 lines
pat='(\*\*|__)status(\*\*|__)?\s*:|(\*\*|__)status:(\*\*|__)|^\s*status\s*:|^#{1,6}\s+status\b'
for f in $(git ls-files 'spec/*.md'); do
  head -15 "$f" | grep -q -i -E "$pat" || echo "$f"
done

# Step 8
deno outdated --recursive
deno check --frozen cli lib maml scripts experiments web
```
