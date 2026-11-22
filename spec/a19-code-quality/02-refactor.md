# Code Quality Refactor: Steps 9–13

**Covers:** steps 9–13 of the [plan](README.md): delete dead code, split
oversized modules, merge accidental duplicates, fix boundary findings, and
restructure tests.\
**Status:** In progress: step 9 done; steps 10-13 follow.\
**Base:** `ad37fd9` (v0.55.2). The branch begins with `90749a0`, the #511 fix,
which the audit's Approval asked for first.\
**Head:** recorded when step 13 finishes.

Each entry uses the ID of its finding in the [audit](01-audit.md) and acts on
the disposition its Approval settled. An entry gives what was done, the files
and the commit, or why something was not done. Commits are on the
`code-quality-refactor` branch.

## Step 9: Dead code

**3.1** Deleted `lib/execute/script-spec.ts`. Its two `Deno.test` cases never
ran, and they spawned `lib/cli/hc.ts`, a path no commit has held. Commit
`b390951`.

**3.2** Deleted `lib/index.ts`, the barrel nothing imported and `lib/deno.json`
does not export. Commit `b390951`.

**3.3** Deleted `cli/flatten.ts` and `cli/flatten.test.ts` (approved).
`test:cli` loses that file's 1 test and 7 steps. Commit `b390951`.

**3.7** Deleted `isTracking` and `noteReleased`
(`lib/frames/reference-tracking.ts`) and the unused `type Counts` in
`lib/execute/hc-log.ts`. Commit `7dd5c7c`.

**3.8** Dropped `export` from the 25 values and the type that only their own
module uses:

- `lib/execute/router-prologue.ts`: `ROUTER_SOURCE`, `ROUTER_CLASS`,
  `ROUTER_BUILDER`, `loadRouterClass`, `routerClass`, `constructRouter`,
  `channelRouterChannels` and `dealtRouter`.
- `lib/execute`: `DENUM_CLASS` (`denum-prologue.ts`), `quoteResourceSource`
  (`resource-import.ts`) and the type `ScanHost` (`sigilizer.ts`).
- `lib/frames`: `sizeAtomsOf` (`frame-expr.ts`, which gains no import),
  `EXACT_POWER_BIT_LIMIT` (`frame-numeric.ts`), `FrameCatch` and
  `FrameObservationAnchor` (`frame-scope-anchor.ts`), `NANOS_PER_MILLISECOND`
  (`frame-time.ts`), `nameOf` (`frame-word.ts`), `Visibility` and `inspectFlags`
  (`frame.ts`), `KD_MAX_SLOTS` and `KD_MAX_PRODUCT_TERMS` (`kd-signed-xor.ts`)
  and `keyGrantsMutation` (`reference-tracking.ts`).
- `cartInputs` (`lib/ops/pairings.ts`), `HC_DOC_DIR` (`cli/test-docs.ts`), and
  `HC_DIR` and `EMBED_PATH` (`scripts/embed-hc.ts`).

`Visibility` also left `lib/frames/meta-frame.ts`'s re-export, and the barrel
lines went with 3.10. The 31 types that exported signatures name stay exported,
as the audit keeps them. Commit `7dd5c7c`.

**3.10** `lib/frames.ts` re-exported 165 names; it now re-exports 99, and 98
after 3.11. The 66 removed are the audit's 73 less the 7 of `partition-check`,
whose statement stays whole because it is the module's only loader and 3.5 is an
issue. The seven statements that lost every name became bare imports in the same
place, so the barrel's evaluation order is unchanged: `frame-match`,
`effect-registry`, `reference-tracking`, `access-footprint`, `event-dispatch`,
`bound-method` and `frame-handle`. `lib/ops.ts` imports `ops/frame-curry.ts`
instead of re-exporting `FrameCurry`. `test:load-order` passes. Of the eight
types that 3.10 names for 5.17, only `FrameList` is to be exported, from its own
module, in step 12. Commit `7dd5c7c`.

**3.11** Removed `contextEqual` from `lib/mod.ts`, `lib/frames.ts` and
`lib/frames/context.ts` (Breaking; approved). Its `describe` in
`lib/frames/context.test.ts` went with it: 2 cases with 4 expectations, 3 steps
of `test:lib`. `evaluate.test.ts`'s "updates file context on assignment" now
checks that the result's context has the keys of `{x: 3}` and that each value
`isEqualTo` its counterpart, so it still asserts that the context equals
`{x: 3}`. Commit `5873043`.

**3.12** Deleted all 22 functions with no caller, with their JSDoc:

- `lib/execute`: `HCEval.make_pipe`, `HCTest.performTest`, `LexPipe.lex_string`
  and `lex`, `LexHost.call` and `Terminal.toData`. `LexHost.call` only overrode
  `Frame.call`, and the full suite passes without it.
- `lib/frames`: the `string_start` family (the `FrameAtom` base and the
  `FrameArg`, `FrameBlob`, `FrameInt`, `FrameSymbol` and `FrameOperator`
  overrides), `FrameLazy.returnSchema`, `FrameNumber.fromHost`,
  `FrameSchema.length`, `FrameOperator.operator_chars` with its commented-out
  variant, and `MetaFrame.isAlphabetic` (Breaking; approved).
- The `Frame.signed` hook (3.17), in the same commit.
- `isTracking` and `noteReleased` (3.7), in `7dd5c7c`, and `script-spec.ts`'s
  `script` (3.1) and `Flatten.toJson` (3.3), in `b390951`.

The imports the deletions left unused went too. The design records in
`.kiro/specs/resource-import/` still name `HCEval.make_pipe`; they record a past
design and stay as written. Commit `bb31462`.

**3.13** `FrameNumeric` (`lib/frames/frame-numeric.ts`) now gives its hooks
default bodies, each with JSDoc; `unaryPlus` and `unaryMinus` stay abstract. The
defaults answer the refusals the deleted overrides answered, error text
included, and the rank-aware `divideSame` and `powerSame` keep
`$!.numeric-internal` for a ranked rung. `FrameSequence` and `FrameTypedNumber`
spelled their class name in those texts; the defaults read it from
`className()`, which gives the same text. 43 of the audit's 45 overrides are
deleted:

- `FrameSequence`, 12: `isZero`, `promoteOne`, `inexactResult`, `integralValue`,
  the six `*Same`, `powerIntegral` and `compareSame`.
- `FrameTime`, 11: `promoteOne`, `ratioParts`, `inexactResult`, `integralValue`,
  the six `*Same` and `powerIntegral`.
- `FrameTypedNumber`, 11: `promoteOne`, `inexactResult`, `integralValue`, the
  six `*Same`, `powerIntegral` and `compareSame`.
- `FrameInt`: `divideSame` and `powerSame`. `FrameDecimal`: `divideSame`,
  `moduloSame` and `powerSame`. `FrameRational`: `moduloSame` and `powerSame`.
  `FrameNumber`: `promoteOne` and `moduloSame`.

Two stay, because a default would change their answer. `FrameTime.isZero`
answers `nanos === 0n`, and `FrameNumber.inexactResult` answers a `FrameNumber`,
which `frame-numeric.ts` cannot import. The `ratioParts` overrides of
`FrameSequence`, `FrameTypedNumber` and `FrameNumber` now repeat the default's
`null`; they are live (3.14), not among the 45, and stay. Commit `5e49f31`.

**3.17** Deleted the `Frame.signed` hook (`lib/frames/frame.ts`) and its
installer (`lib/frames/frame-int.ts`) (Breaking; approved). Commit `bb31462`.

**3.18** Rewrote the comments that described the observers #506 retired, in nine
files: `denum-prologue.ts` and `hc-eval.ts` in `lib/execute`, and
`fourth-hash.ts`, `frame-array.ts`, `frame-count.ts`, `frame-lazy.ts`,
`frame-list.ts`, `frame-name.ts` and `cayley-dickson.ts` in `lib/frames`. They
now say that `.###` is the raw Denum, built from the Count and each child's
Size, that `.####` reads KD coordinates from it, that no residual remains, and
that nothing binds `.#%`. Commit `5e92a58`.

**5.4** Went with 3.11: the two `console.log` lines were in `contextEqual`.
Commit `5873043`.

**5.8** Deleted the commented-out `console.error` call in
`lib/execute/terminals.ts`. Commit `bb31462`.

**8.7** Its two `lib/` files, `lib/index.ts` and `lib/execute/script-spec.ts`,
are gone with 3.1 and 3.2. Commit `b390951`.

Cross-references with no action of their own: 3.1 removed one of 5.2's two
remote imports (`jsr:@std/expect`), and the other goes with 5.3. The step 9
parts of 6.1 and 6.3 are 3.2 and 3.1.

## Step 10: Size and complexity

**2.3** Pending.\
**2.4** Pending.\
**2.5** Pending.\
**2.7** Pending.\
**2.8** Pending.\
**2.9** Pending.

## Step 11: Duplication

**4.1** Pending.\
**4.2** Pending.\
**4.3** Pending.\
**4.4** Pending.\
**4.5** Pending.\
**4.6** Pending.\
**4.7** Pending.\
**4.8** Pending.\
**4.9** Pending.\
**4.10** Pending.\
**4.11** Pending.\
**4.12** Pending.\
**4.13** Pending.\
**4.14** Pending.\
**4.15** Pending.\
**4.16** Pending.

## Step 12: Boundaries

**5.1** Pending.\
**5.3** Pending.\
**5.5** Pending.\
**5.6** Pending.\
**5.7** Pending.\
**5.10** Pending.\
**5.13** Pending.\
**5.14** Pending.\
**5.17** Pending.\
**5.18** Pending.\
**8.10** Pending.

## Step 13: Tests

**2.10** Pending.\
**2.11** Pending.\
**3.20** Pending.\
**4.17** Pending.\
**6.8** Pending.\
**6.9** Pending.\
**6.11** Pending.\
**6.12** Pending.\
**6.13** Pending.

## Public API

**Removed**, for the CHANGELOG's **Breaking** label: `contextEqual` (3.11),
`MetaFrame.isAlphabetic` (3.12) and `Frame.signed` (3.17).

**Dependencies:** since 3.1, no non-test `lib/` module imports
`jsr:@std/expect`. Chalk goes with 5.3.

**Types exported**, **members tagged out of `deno doc`** and the 5.5 printout:
pending (step 12).

## Test counts

Deno's counts, from `NO_COLOR=1 deno task test`: a top-level `Deno.test` or
`describe` is a test, and a nested `it` or `describe` is a step.

| Run                      | `90749a0`                          | Step 9                             |
| ------------------------ | ---------------------------------- | ---------------------------------- |
| `test:cli`               | 10 passed (74 steps)               | 9 passed (67 steps)                |
| `test:lib`               | 201 passed (1553 steps), 4 ignored | 201 passed (1550 steps), 4 ignored |
| `test:load-order`        | 1 passed (1 step)                  | 1 passed (1 step)                  |
| `test:maml`              | 3 passed (18 steps)                | 3 passed (18 steps)                |
| `test:scripts`           | 17 passed (118 steps)              | 17 passed (118 steps)              |
| `test:observer-algebras` | 33 passed                          | 33 passed                          |
| web `test:components`    | 1 passed (4 steps)                 | 1 passed (4 steps)                 |
| web `test:artifact`      | 2 passed (16 steps)                | 2 passed (16 steps)                |
| `test:doc`               | 21 testdocs executed, 0 failed     | 21 testdocs executed, 0 failed     |

- `test:cli` loses `cli/flatten.test.ts`'s 1 test and 7 steps (3.3).
- `test:lib` loses `describe("contextEqual")` and its 2 cases, 3 steps (3.11).
  `script-spec.ts`'s cases never ran (3.1), so its deletion changes no count.

The final head's counts are recorded when step 13 finishes.

## Measurements

The 4.3 lookup timing and 6.8's local and CI numbers: pending (steps 11 and 13).

## Defects found

None in step 9.
