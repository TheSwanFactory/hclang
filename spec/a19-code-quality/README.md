# Code Quality: Audit, Refactor, Cleanup

**Status:** Audit (steps 1–8) measured and its dispositions approved. Refactor
and cleanup have not started.\
**Measured at:** `390ee31` (v0.55.1). Every number below is from that commit.\
**Scope:** The TypeScript in `lib/`, `cli/`, `web/`, `maml/` and `scripts/`, the
bundled `hc/` files, `experiments/`, and the docs that describe them. HC
semantics and open design proposals are out of scope.

## Rules

- **Behavior stays fixed.** HC semantics, test assertions and testdoc claims
  stay as they are. A refactor may move a test but not change what it asserts.
  An approved finding may remove a `lib/mod.ts` export (decision 1). A defect
  found along the way gets its own issue.
- **Every step lands green.** Each PR passes `deno task test`, which runs
  `deno fmt --check`, `deno lint` and `test:all`.
- **Results go in numbered documents.** Each result goes in the next numbered
  document in this folder, which names the steps it covers and states its
  status. This README does not list them.

## Audit

Measure and report. The audit changes no code.

1. **Baseline.** Record the wall time of each task `test:all` chains, the test
   and testdoc claim counts, and line coverage per package
   (`deno test --coverage`, then `deno coverage`). Step 17 repeats this.
2. **Size and complexity.** Rank modules and functions by length and nesting,
   and name classes with more than one responsibility. `lib/frames/frame.ts`
   (1,384 lines) and `lib/execute/evaluate.test.ts` (2,654) are the largest
   module and test file.
3. **Dead code.** Find exports nothing imports, modules no entry point reaches,
   branches the baseline run never covers, and anything the FOIST 19a migration
   (#506, #508) left behind.
4. **Duplication.** Find logic repeated across `lib/frames`, `lib/ops` and
   `lib/execute`, or between TypeScript and `hc/`. Mark deliberate copies as
   keep, such as the independent Cayley–Dickson oracles that differential tests
   compare against.
5. **Boundaries.** Confirm `lib/` imports nothing from `cli/` or `web/`, check
   whether the `console.*` calls in 9 `lib/` modules belong in a library, list
   the cycles in the `lib/` module graph (`deno info --json`), and run
   `deno doc --lint lib/mod.ts` on the public API.
6. **Tests.** List modules with no sibling `.test.ts` (36 in `lib/`; CLAUDE.md
   asks for one per file), the slowest tests, and numbers that content changes
   must update by hand, such as the 18 testdoc totals `cli/hc.test.ts` pins.
7. **Docs and records.** Check `doc/ARCHITECTURE.md`, `README.md` and the
   CLAUDE.md files against the code. List spec records with no status line,
   experiments no task runs (only `007-observer-algebras` has tasks), and open
   issues the code may already resolve, such as #481 (the bundle has been
   generated and gitignored since #499).
8. **Tooling.** Run `deno outdated`. List pre-release pins
   (`deno-hooks@0.2.1-dev…`), test tasks that rewrite files (`maml`'s `test`
   runs `deno fmt` and `deno lint --fix`), and files CI never type-checks (CI
   runs no `deno check`).

Each finding gets a location, a number where one applies, and a disposition: a
refactor step, a cleanup step, an issue, or keep, with the reason. Approve the
dispositions before step 9 starts.

## Refactor

Act only on approved findings.

9. **Delete dead code** from step 3.
10. **Split oversized modules** from step 2 along their responsibilities.
    `lib/load-order.test.ts` must stay green: every `lib/` module still loads
    when imported first.
11. **Merge accidental duplicates** from step 4 into one implementation.
12. **Fix boundary findings** from step 5, such as console output inside `lib/`
    and import cycles.
13. **Restructure tests.** Split the largest test files by feature, reduce the
    hand-updated numbers step 6 found, and speed up the slowest tests.

## Cleanup

Bring docs, records and tooling in line, then measure again.

14. **Docs.** Update `doc/ARCHITECTURE.md` and `README.md` for what moved, and
    remove facts the code states from the CLAUDE.md files.
15. **Records and experiments.** Add the missing status lines. Chain each
    experiment's tests from `test:all` if they pass and run quickly; otherwise
    mark its README archived at the commit it last ran at (decision 3).
16. **Tooling.** Apply dependency updates, stop test tasks from rewriting files,
    and add the checks step 8 found missing to CI, including the coverage floor
    (decision 2).
17. **Close out.** Repeat step 1 and record the before and after numbers. Close
    the issues the work resolved and file issues for deferred findings.

## Decisions

The owner answered the plan's four open questions before the audit began, and
set the release rule (5) during it.

1. **Exports.** Step 9 may remove `lib/mod.ts` exports. Removing one breaks its
   callers, so the refactor PR's CHANGELOG entry names each removed symbol under
   a **Breaking** label.
2. **Coverage.** Coverage becomes a floor that CI enforces, added in step 16.
3. **Experiments.** Every experiment stays in the repository. If its existing
   tests pass and run quickly, step 15 chains them from `test:all`; otherwise it
   marks the experiment's README archived, naming the commit it last ran at. The
   owner left this question to judgement. The audit reports each experiment's
   test result and time, which the rule depends on.
4. **PRs.** One PR per phase: the audit (steps 1–8), the refactor (9–13) and the
   cleanup (14–17).
5. **Releases.** Each phase PR is a patch release with a CHANGELOG entry,
   including the refactor's removals, so callers on a caret range such as
   `^0.55.1` get them without opting in. A PR merges only after a comment that
   neither the agent that wrote it nor that agent's sub-agents wrote, whichever
   account posts it.
