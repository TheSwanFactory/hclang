# Code Quality Refactor: Steps 9–13

**Covers:** steps 9–13 of the [plan](README.md): delete dead code, split
oversized modules, merge accidental duplicates, fix boundary findings, and
restructure tests.\
**Status:** Done.\
**Base:** `ad37fd9` (v0.55.2). The branch begins with `90749a0`, the #511 fix,
which the audit's Approval asked for first.\
**Head:** the commit that completes this document. The commits after `3851b50`
change only this document, the version (`e7b1e65`, 0.55.3) and the CHANGELOG
(`ef6b508`).

Each entry uses the ID of its finding in the [audit](01-audit.md) and acts on
the disposition its Approval settled. An entry gives what was done, the files
and the commit, or why something was not done. Commits are on the
`code-quality-refactor` branch. Line numbers name the code at `90749a0`.

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

**3.10** `lib/frames.ts` re-exported 165 names. This commit left 99 and 3.11
left 98; the head has 99, with 4.2's `isShippedInstance`. The 66 removed are the
audit's 73 less the 7 of `partition-check`, whose statement stays whole because
it is the module's only loader and 3.5 is an issue. The seven statements that
lost every name became bare imports in the same place, so the barrel's
evaluation order is unchanged: `frame-match`, `effect-registry`,
`reference-tracking`, `access-footprint`, `event-dispatch`, `bound-method` and
`frame-handle`. `lib/ops.ts` imports `ops/frame-curry.ts` instead of
re-exporting `FrameCurry`. `test:load-order` passes. Of the eight types that
3.10 names for 5.17, only `FrameList` is exported, from its own module, in
step 12. Commit `7dd5c7c`.

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
`FrameSequence`, `FrameTypedNumber` and `FrameNumber` then repeated the
default's `null`. They were live (3.14) and not among the 45, so this commit
kept them; 4.14 deleted them in `d3c33cc`. Commit `5e49f31`.

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

## Step 10: Size and complexity

**2.3** Moved the declared protocol, the statics and private helpers that find
and run the methods an aggregate declares (#375, 015.02), from
`lib/frames/frame-array.ts` to the new `lib/frames/declared-protocol.ts` (241
lines). `frame-array.ts` went from 502 lines to 335; 5.17's tags and 5.18's
comments bring it to 377 at the head. The module exports the five functions
`frame-array.ts` calls: `applicationDeclaredBy`, `operatorDeclaredBy`,
`textDeclaredBy`, `observationDeclaredBy` and `applyDeclared`.
`methodDeclaredBy` stays module-private, a departure from the plan's list: only
its own module calls it, and an export used only at home is what 3.8 removed.
`FrameArray`'s overrides and `declaredOperator` stay as one-line delegators. The
module value-imports nothing that reaches `frame-array.ts`, so it closes no
cycle. Commit `dc442af`.

**2.4** Moved `FrameSymbol.in`'s read projection into the private
`projectRead(value, context, origin, scope)` in `lib/frames/frame-symbol.ts`,
dedented and otherwise unchanged. `in` went from 92 lines to 22. Commit
`d247018`.

**2.5** Moved the civil calendar (`lib/frames/frame-time.ts:65-205`) to the new
`lib/frames/civil-calendar.ts` (151 lines), which imports nothing.
`frame-time.ts` went from 634 lines to 519 and imports all 11 of the new
module's exports. `renderYear` stays module-private, a departure from the plan's
list: only `renderInstant` calls it, and an export used only at home is what 3.8
removed (`7e5cedb`). Each moved declaration that had no JSDoc got a line.
Commits `6da95d5` and `7e5cedb`.

**2.7** `walkPath` (`lib/frames/access-footprint.ts`) now hands each term kind
to its own `step*` helper, eight in all, over a `PathCursor`. It went from 100
lines to 41. Its `continue` chain became an `if`/`else` chain in the same order.
The name step takes the name's source string, so `access-footprint.ts` needs no
`FrameName` import. Commit `93ad2f9`.

**2.8** Lifted `dispatch`'s `infer`, `refresh` and `mayStart` closures and its
outcome mapper, now `outcomeOf`, to module functions in
`lib/frames/event-dispatch.ts`, which went from 388 lines to 403. One
`events.map` arrow stays inline; it captures no local of `dispatch`. Commit
`38075fe`.

**2.9** Split `scripts/build-hcweb.ts`'s `build` into `bundleEntry`,
`renderHtml` and `writeArtifacts`. `renderHtml` takes a new module-private
`HtmlFields`, and `build` computes the package source because its "Built" line
prints it. The file went from 329 lines to 375. Commit `d1b77f8`.

## Step 11: Duplication

**4.1** Added `lib/execute/class-prologue.ts`, which loads a bundled HC class
once (`classOnce`), keeping a failure and refusing reentry. The Denum and
RotorRouter prologues each describe their class in one `ClassPrologue` record,
which replaced `DENUM_CLASS`, `ROUTER_SOURCE`, `ROUTER_CLASS` and
`ROUTER_BUILDER`; `DENUM_SOURCE` stays exported. Every `$!.denum-prologue-*` and
`$!.router-prologue-*` spelling is unchanged, and the `$!.router-unavailable`
check stays although no path reaches it now. Commit `e6b6dd1`.

**4.2** Added `isShippedInstance(host, rebuilt)` to `lib/frames/fourth-hash.ts`:
the 007.25e rule that `recognizeDenum` and the router's `channelRouterChannels`
each spelled out. Each caller still reads its own fields. `router-prologue.ts`
first imported it from `fourth-hash.ts` directly, because `lib/frames.ts` was
outside lane C's files. After the lanes merged, the barrel's `fourth-hash`
statement re-exports it, and `router-prologue.ts` imports it from the barrel,
like every other `lib/execute` module (`d4561e2`). That statement already loaded
`fourth-hash.ts`, so load order is unchanged. Commits `7c38032` and `d4561e2`.

**4.3** `MetaFrame`'s two lookup traversals are one: the private
`MetaFrame.traverse` and `walk` take a step object, `VALUE_STEP` for `get` and
`lookup_graph_on` or `BINDING_STEP` for `resolve` and `resolve_graph_on`, typed
by the module-private `LookupStep<T>`. The local lookup, the depth-first walk of
`lookup_links()` under a `seen` guard, and the one read of the globals are
written once. The timing against `ba6c00b` kept the change (see
[Measurements](#measurements)). Commit `f11c783`.

**4.4** Added the generator `declaredChain(start)` to `lib/frames/frame.ts`: a
frame and its declared parents, nearest first, never a frame twice. The seven
walks use it: `isAncestorOf` and `getOwn` in `frame.ts`, the declared-method
lookup that 2.3 moved, `isReceiverPathValue` in `frame-symbol.ts`, and
`isOnReceiverPath`, `memberOf` and `patternAnswers` in `access-footprint.ts`.
Four walks tested `!current.is.missing` in their loop; each now tests the start
once, before it. `wouldCreateParentCycle` is unchanged. Commit `71aaf30`.

**4.5** Added `beforeCommit` and `afterCommit` to
`lib/frames/effect-registry.ts`, and the eight commit sites call them in their
existing order. The notify choices are unchanged: `set` and
`Frame.replaceMember` notify, and the other six stay silent (4.21 is an issue).
Nothing else in `lib/` now calls `noteWrite` or `guardAccess(..., "write")`
directly. Commit `e71446f`.

**4.6** Added `lib/execute/host-namespace.ts`. Its `hostNamespace` takes the
context and the store, the one part that differed, and builds the host namespace
for both the CLI and `HCLang`. `cli/hc.ts`'s `getHost` and `getHandlers` stay as
thin wrappers, which `cli/hc.test.ts` uses. Commit `f7918d1`.

**4.7** Added `evaluateInto` (`lib/execute/evaluate.ts`), which evaluates one
source unit into an array for `evaluate` and `HCLang.call`, and
`HCEval.incompleteReason`, the one home of the "incomplete lexical input"
fallback, which `cli/hc.ts` also reads. `HCLang.call` keeps its `try` and its
history. Commit `e31c7fb`.

**4.8** Added the leaf module `lib/execute/testdoc-markers.ts`, whose
`SOURCE_PREFIX` and `EXPECT_PREFIX` replace the markers defined in `hc-eval.ts`,
`resource-import.ts` and `cli/test-docs.ts`. Commit `e53ac67`.

**4.9** Added the private `scanSource` to `lib/execute/resource-import.ts`, the
loop that `evaluateElements` and `quoteResourceSource` both ran. Commit
`178ea2b`.

**4.10** Added the private `EvaluationScope.derive(changes)`
(`lib/frames/evaluation-scope.ts`), which carries the private fields and applies
only the changed options. `withLayers`, `withWriteTarget` and `resumedIn` call
it, and `argumentAt` and `parameterAt` call the existing `outward`. The file
went from 644 lines to 626, and 5.17's tag brings it to 628 at the head. Commit
`0ff65bc`.

**4.11** Added `walkStatements` to `lib/frames/frame-expr.ts`, the punctuation
loop `atomsOf` and `sizeAtomsOf` shared, with hooks for what each does inside.
The inner walks stay apart, so `sizeAtomsOf` still records nothing and still
refuses a cycle. Commit `497c1f7`.

**4.12** Added the public `FrameSymbol.sizeOperatorKey()` and deleted
`Frame.quantityOperator`, so the six sites test for a size operator in one
place. This departs from the audit's "one module function in `frame.ts`":
`frame-expr.ts` may gain no import and `Frame` no public member, and
`FrameSymbol` is outside the public API. `quantityOperator`'s missing JSDoc
(5.18) went with it. Commit `d32e02b`.

Under Deno the three class checks agreed, except for an addressed subclass of
`FrameSymbol`, which nothing creates, so `hc` and the library answer as before.
In the bundled hcweb playground, `hcweb.html`, they did not agree.
`quantityOperator` tested `className() === "FrameSymbol"`, and `className()`
answers the constructor's name, which `deno bundle` renames: a bundle built with
`hcweb.html`'s `--minify` named the class `r`, and one without it
`_FrameSymbol`. In a bundle the test never matched, so the two sites that asked
it, `Frame.all`'s `call` and the void branch of `Frame.call`, missed the size
operator, and `<>.#` and `<>.##` answered `<>`. They now answer `0` and `1`, as
under Deno and as `lib/frames/frame-schema.test.ts` asserts. The commit
message's "The answers do not change" holds only under Deno. The new answers are
a fix, but not one of the changes the Approval allowed, so
[Defects found](#defects-found) and [Public API](#public-api) record them too.

**4.13** `FrameSymbol`'s `apply` and `defineSchema` commit a declaration through
the private `declarationSlot` and `priorValue` helpers and the module-private
`DeclarationSlot` type. The schema check stays in `apply`. Commit `1e33f62`.

**4.14** Added protected static helpers to `FrameNumeric`: `plusSpelling` and
`minusSpelling` for the sign spelling in `unaryPlus` and `unaryMinus`,
`rangeChecked` for the range refusal in `exactInt`, and `wholeQuotient`, the
exact whole quotient or null, for the `integralValue` of `FrameDecimal` and
`FrameRational`. The private `FrameDecimal.aligned` does the scale alignment.
The changes span `frame-int`, `-decimal`, `-rational`, `-number`, `-sequence`,
`-count` and `-typed-number` in `lib/frames`. `FrameCount` calls the helpers
through its own class, to keep `frame-numeric.ts` a type-only import. Its
`unaryPlus` now also reads a leading `-` as a sign, which a count never has. The
`ratioParts` overrides of `FrameSequence`, `FrameTypedNumber` and `FrameNumber`,
which 3.13 kept, answered the default's `null`, so this commit deleted them, as
the audit's 3.13 planned for step 11. Commit `d3c33cc`.

**4.15** Added `arithmeticOr` beside `arithmetic` in `lib/ops/math.ts`; `Add`,
`Subtract` and `Multiply` call it. The fallback still receives the operands as
written. Commit `5ad7b28`.

**4.16** Added `unquote` (`lib/execute/hc-test.ts`), `sourcePipes`
(`lib/execute/hc-eval.ts`) and `sizeLoad` (`lib/frames/fourth-hash.ts`) for the
three repeats step 11 owns. `sizeLoad`'s caller treats any answer that is not a
`FrameCount` as the failure, which differs from before only for a `FrameCount`
that is itself an error, which no path produces. The two repeats the audit keeps
(`schema-bit-matcher.ts`, `lex-run.ts`) stay. Commit `495f70d`.

## Step 12: Boundaries

**5.1** Moved `lib/maml.ts` to `maml/maml.ts`, into the package that uses it,
and pointed `maml/maml.test.ts` and `maml/tag.test.ts` at it. Commit `f504e57`.

**5.3** Moved the logger from `lib/execute/hc-log.ts` to `cli/hc-log.ts`, with
its chalk import and output unchanged. `test:load-order` no longer needs
`--allow-env`, because no `lib/` module reads the environment while it loads, so
the task dropped it. The comments in `lib/load-order.test.ts` and
`lib/execute/env-visibility.ts` say so. Commit `3adabba`.

**5.5** Moved the `DEBUG_ENV` print from `make_context`
(`lib/execute/hc-eval.ts`) to the CLI's `getEval` (`cli/hc.ts`), which
`cli/test-docs.ts` also goes through, so both CLI paths print as before.
`HCLang` and other embedders of `make_context` no longer print it (approved).
`make_context`'s JSDoc dropped its `DEBUG_ENV` paragraph and describes only the
conversion: an all-digit value becomes a `FrameCount`, and any other value a
`FrameString`. [Public API](#public-api) lists the change for the CHANGELOG.
Commit `74d149e`.

**5.6** Removed the two `console.error` calls in `lib/execute/lex-pipe.ts` and
`parse-pipe.ts`, keeping what their paths return. Commit `36c2563`.

**5.7** `LexPipe.perform`'s `end` action now throws
`Expected Frame for end action, but received: '<value>'` instead of printing.
Commit `36c2563`.

**5.10** `frame-symbol.ts` and `frame-lazy.ts` test with the `isSchema()` and
`isSymbol()` guards, so they import `FrameSchema` and `FrameSymbol` type-only.
Those were the two value imports the audit found on 18 of the 24 value-import
cycles. Commit `f9d1fbb`.

**5.13** `lib/frames/frame.ts` imports `ICurryFunction` and `IArrayConstructor`
from their defining modules instead of the `lib/ops.ts` and `lib/frames.ts`
barrels. Commit `3a75918`.

**5.14** Moved the Sigilizer from `lib/execute/sigilizer.ts` to
`lib/sigilizer.ts`, beside the scan protocol, with its test (approved). The six
modules that import it changed only their import line. Commit `177b0c8`.

**5.17** (narrowed by the Approval) `evaluate` and `execute` are function
declarations, so the lint checks their signatures (`9b7efb4`). `lib/mod.ts`
exports `FrameArray`, `FrameList` and `EvaluationInput` type-only, and each
member of an exported class that names an interpreter-internal type has an
`@ignore` tag, which keeps it out of `deno doc`. The lists are under
[Public API](#public-api). The planner's probe predicted the 17 member tags
exactly. Once the `EvaluationScope` class is tagged, the lint alone no longer
flags `Frame.atSite`, which names it; `atSite` keeps its tag under the
Approval's rule. Commit `b304858`.

**5.18** `NO_COLOR=1 deno doc --lint lib/mod.ts` exits 0. `HCLang`'s history and
constructor got JSDoc in `d7be32d`, and `quantityOperator`'s gap went with 4.12.
`43385c0` documents the 26 declarations of `FrameArray` and `FrameList` that
5.17's exports brought into the lint, the private `FrameArray.sameMembers` among
them, plus `MetaFrame.authorize`, `Frame.in` and `VERSION`. `Frame.in`'s comment
had drifted above `evaluationRoots`, where it documented nothing; it is back on
`in`. `scripts/bump-version.ts` writes `VERSION`'s comment, so the next bump
keeps it, and `VERSION_PATTERN` still matches. Commit `43385c0`.

**8.10** Fenced the JSDoc examples: `evaluate.ts`, `execute.ts` and
`lib/frames/context.ts` in `9b7efb4`, each with its import line, and
`make_context`'s in `74d149e`. The README fragment is step 14's, and the CI
choice step 16's.

## Step 13: Tests

**2.10** Split `lib/execute/evaluate.test.ts` (2,654 lines) by suite into nine
files:
`evaluate.{strings,grouping,numbers,schemas,boolean-types,effect-boundaries,closures,contexts,access}.test.ts`.
`evaluate.test.ts` keeps its five top-level cases, and the schemas file keeps
the four `describe.skip` suites, the 4 ignored tests. Each file imports only
what it uses. The largest is now `evaluate.access.test.ts`, at 819 lines. Commit
`c32b728`.

**2.11** Split `lib/execute/resource-import.test.ts` (1,587 lines) into its
source, scope, authority and property files, with the shared fixtures in
`resource-import.fixtures.test.ts`; #443's case stays in
`resource-import.test.ts`. A fixture that one file uses stays in that file. The
properties' top-level `describe` is "resource import: properties". The split
moved 14 top-level declarations, which got JSDoc in `3851b50`: the eight shared
fixtures, the five of the property harness, and `evaluateOuterImport` in the
source file. Commits `49e8cc3` and `3851b50`.

**3.20** Deleted `lib/execute/denum-observers.test.ts` and moved its three
distinct tests to `foist-19a.test.ts`, names and assertions unchanged. Four
assertions were copies, and each is still asserted once, in `foist-19a.test.ts`:
from `denum-observers.test.ts`, the `Frame.SIZE_OPERATORS` list and the loop
over the seven removed suffix observers; from `denum-prologue.test.ts`, the same
loop and `5 %% 2`. That `denum-prologue.test.ts` test is renamed for what it
still checks, "FOIST 19a: a genuine Denum's state is its construction Count and
loads". `lex.test.ts`'s suite is now "the retired spelling `.#%` lexes as one
unbound name", with its cases unchanged (`177b0c8`). Commit `9d4a291`.

**4.17** Added `lib/test-helpers.test.ts` for the helpers that two or more test
files copied: `Counter`, `CountingExpression`, `readName`, `dispatchEvent`,
`countOf`, `denumOf`, and the `evaluate` wrappers `lastTermOfLast`,
`answerOfLast`, `lastText`, `firstEntryLastText`, `lastResultText` and
`lastResult`. A file keeps a one-line wrapper where its helper closes over local
state or its suites use one name for two helpers. Helpers that one file uses
stay local. `access-footprint.test.ts` kept its copy of `readName` in lane B,
which did not own the file, and calls the shared helper since the lanes merged
(`383db05`). The plan also listed `innermostAnswer`, the unwrap loop in
`catch.test.ts` and `error-policy.test.ts`, but the two copies differ. The copy
in `error-policy.test.ts` throws on an empty evaluation, where the one in
`catch.test.ts` answers `Frame.nil`, and only catch's takes a context. `57e0e22`
merged them anyway, which let one `error-policy.test.ts` assertion, that the
closure literal `{ $!!.zero }` is not an error, pass on an evaluation that
answers nothing. Under the plan's rule against merging shapes that differ,
`0b78a59` gives each file back its own helper, as at `90749a0`. Commits
`57e0e22`, `383db05` and `0b78a59`.

**6.8** `test:lib` runs `deno test --parallel` (see
[Measurements](#measurements)). Commit `4965bc1`.

**6.9** `web/tests/standalone.test.ts` compares the mirror's bytes directly,
still byte for byte. Commit `21855a7`.

**6.11** Renamed the second "binds expressions with interior spaces", the
`1 .+ 2` case, to "binds a dotted operator with interior spaces". Commit
`c32b728`.

**6.12** Added `cli/testdoc-summaries.json`, written by
`cd cli && deno task testdoc:summaries` (`cli/testdoc-summaries.ts`), with 22
entries: the 21 discovered testdocs and `white-paper-core.hc`. The 16 pins in
`cli/hc.test.ts` read their totals from it, and the six testdocs nothing pinned
got cases (approved option). `cli/testdoc-summaries.test.ts` checks that the
table lists every discovered testdoc. The table matched all 16 former literals.
The inline totals stay. `ffe2777` adds the JSDoc that the generator's
`SUMMARY_PATTERN` lacked. `SUMMARIES_URL` stays module-private, a departure from
the plan's list, because only its own module reads it (`7e5cedb`). Commits
`a395a84`, `ffe2777` and `7e5cedb`.

**6.13** `scripts/test-npm.ts` reads the last `$=.test-summary` line of the npm
package's run and checks it against the table (approved). Commit `f29f00e`.

## Cross-references

- **5.2** is resolved by 3.1 and 5.3: 3.1 deleted the `jsr:@std/expect` import
  with `script-spec.ts`, and 5.3 moved the chalk import to `cli/` with the
  logger. No non-test `lib/` module imports a remote package.
- The step 9 parts of 6.1 and 6.3 are 3.2 and 3.1.

## Public API

**Removed**, for the CHANGELOG's **Breaking** label: `contextEqual` (3.11),
`MetaFrame.isAlphabetic` (3.12) and `Frame.signed` (3.17).

**Types exported** (5.17), all type-only: `FrameArray`, `FrameList` and
`EvaluationInput`. `lib/mod.ts` gained no value export, and
`RECEIVER_WRITE_AUTHORIZED` is exported from nowhere.

**Members tagged out of `deno doc`** with `@ignore` (5.17):

- `MetaFrame.receiverState`, `MetaFrame.resolve_here`, `MetaFrame.resolve` and
  `MetaFrame.resolve_graph_on`.
- `Frame.call`, `Frame.scan`, `Frame.finishInput`, `Frame.atSite`,
  `Frame.isName`, `Frame.isSymbol`, `Frame.isSchema`, `Frame.isClosure`,
  `Frame.applicationMethod`, `Frame.reduce` and the static `Frame.reduceInto`.
- `FrameArray.applicationMethod` and `FrameArray.declaredOperator`.
- The `EvaluationScope` class, which `EvaluationInput` names.

The tag only hides them from the docs. The published types still declare them,
and code that calls them still compiles.

**Other user-visible changes:**

- `make_context` and `HCLang` no longer print the context when it holds
  `DEBUG_ENV`. The `hc` CLI and its testdoc runner still do (5.5).
- In the hcweb playground (`hcweb.html`), `<>.#` and `<>.##` answer `0` and `1`,
  as `hc` and the library always did, instead of `<>` (4.12, #513). `$!`
  handlers still never run there; #513 tracks that and the other `className()`
  checks the bundle defeats.
- `deno doc` now documents `FrameArray`, `FrameList`, `Frame.in` and `VERSION`
  (5.18).
- No non-test `lib/` module imports a remote package: chalk left with the logger
  (5.3), and `jsr:@std/expect` with `script-spec.ts` (3.1). `lib/mod.ts`'s
  module graph reached neither before, so the dependency list JSR shows, empty
  for 0.55.2, stays empty. `lib/`'s test files, which JSR still publishes until
  5.20 (step 16), import `jsr:@std/expect` and `jsr:@std/testing`.
- The #511 fix (`90749a0`): `scripts/ci-format.integration.test.ts` clears git's
  repository variables, so the pre-push hook no longer sets `core.bare=true`
  when it runs from a linked worktree. Only contributors see it.

## Test counts

Deno's counts, from `NO_COLOR=1 deno task test`: a top-level `Deno.test` or
`describe` is a test, and a nested `it` or `describe` is a step.

| Run                      | `90749a0`                          | Head                               |
| ------------------------ | ---------------------------------- | ---------------------------------- |
| `test:cli`               | 10 passed (74 steps)               | 11 passed (77 steps)               |
| `test:lib`               | 201 passed (1553 steps), 4 ignored | 215 passed (1543 steps), 4 ignored |
| `test:load-order`        | 1 passed (1 step)                  | 1 passed (1 step)                  |
| `test:maml`              | 3 passed (18 steps)                | 3 passed (18 steps)                |
| `test:scripts`           | 17 passed (118 steps)              | 17 passed (118 steps)              |
| `test:observer-algebras` | 33 passed                          | 33 passed                          |
| web `test:components`    | 1 passed (4 steps)                 | 1 passed (4 steps)                 |
| web `test:artifact`      | 2 passed (16 steps)                | 2 passed (16 steps)                |
| `test:doc`               | 21 testdocs executed, 0 failed     | 21 testdocs executed, 0 failed     |

- `test:cli`: `cli/flatten.test.ts`'s 1 test and 7 steps went with 3.3. 6.12
  adds 1 test, `cli/testdoc-summaries.test.ts`, and 6 steps, the cases for the
  six testdocs nothing pinned. The outside review adds 1 test and 4 steps, the
  generator's guards in `cli/testdoc-summaries.test.ts`.
- `test:lib`: `describe("contextEqual")` and its 2 cases, 3 steps, went with
  3.11. 2.10 adds 9 tests and removes 9 steps, because each of the nine
  `evaluate` suites is now a file's top-level `describe`. 2.11 does the same for
  resource-import's source, scope and authority suites, 3 tests for 3 steps; the
  seven properties stay steps under "resource import: properties". 3.20 removes
  1 test: `denum-observers.test.ts` had 4, and 3 moved to `foist-19a.test.ts`.
  `script-spec.ts`'s cases never ran (3.1), so its deletion changes no count.
  The outside review adds 3 tests and 5 steps: `describe("ranked rungs")` in
  `frame-numeric.test.ts`, with a step per rung, and the 2 tests of
  `lib/execute/class-prologue.test.ts`.
- No other count changed. `test:load-order` dropped `--allow-env` (5.3) and
  `test:lib` added `--parallel` (6.8), and neither changes a count.

## Measurements

**4.3, lookup traversal.**
`NO_COLOR=1 deno test --ignore=lib/load-order.test.ts lib`, timed in an archive
of `ba6c00b` and in lane A at `3a75918`, which holds 4.3, 4.4, 4.5 and 5.13.
After one untimed warm-up in each tree, five alternating rounds on a 14-core Mac
with Deno 2.9.7:

| Tree      | Runs (s)                               | Median (s) |
| --------- | -------------------------------------- | ---------- |
| `ba6c00b` | 12.836, 13.561, 13.489, 12.762, 13.673 | 13.489     |
| `3a75918` | 12.822, 13.710, 12.901, 13.444, 13.933 | 13.444     |

The candidate's median is not above the base's slowest run, 13.673 s, so 4.3
stayed. Lanes B and C ran tests at the same time, and the two trees do not run
the same tests: `ba6c00b` has 1553 steps and `3a75918` 1550.

**6.8, `--parallel`, local.** The same command, with and without `--parallel`,
on the same machine with no other test running. After one untimed serial
warm-up, three rounds alternating serial and parallel:

| Mode     | Runs (s)               | Median (s) |
| -------- | ---------------------- | ---------- |
| serial   | 12.959, 13.013, 13.173 | 13.013     |
| parallel | 5.498, 6.085, 5.900    | 5.900      |

Every run printed `ok | 212 passed (1538 steps) | 0 failed | 4 ignored`. The
parallel median is below the serial minimum, the plan's condition, so `test:lib`
adopted `--parallel`. The median run is 7.1 s shorter.

**6.8, CI.** Before: master's latest Deno CI run,
[45069034886](https://github.com/TheSwanFactory/hclang/actions/runs/45069034886)
at `ad37fd9`, printed
`ok | 201 passed (1553 steps) | 0 failed | 4 ignored (27s)` for the serial
`test:lib`, on a GitHub-hosted `ubuntu-26.04` runner with Deno 2.9.5. Its
`Task test:lib` line and that summary are 30.2 s apart. After: this PR's Deno CI
run
[45097701512](https://github.com/TheSwanFactory/hclang/actions/runs/45097701512)
at `ef6b508`, on the same image and Deno version, printed
`ok | 212 passed (1538 steps) | 0 failed | 4 ignored (22s)` for the parallel
`test:lib`, 25.2 s after its `Task test:lib` line. Its run at `e7b1e65`,
[45097327222](https://github.com/TheSwanFactory/hclang/actions/runs/45097327222),
printed the same 22 s, 25.3 s apart. On CI the parallel `test:lib` is 5 s
shorter by either measure. The runner's core count bounds the gain, and the log
does not print it.

## Defects found

- **6.13:** the npm check asserted a stale literal, `{"total":43,...}`, although
  `hc/numerics.hc` now totals 84. It passed only because `stdout.includes`
  matched the intermediate `$+.test-pass` line for claim 43. The check now reads
  the final `$=.test-summary` line.
- `jsr:@std/expect@0.219.1`, `cli/`'s pin, ignores `expect`'s message argument
  without an error. 6.12's one custom message uses `jsr:@std/expect@1.0.17`,
  already in `deno.lock` through `web/`. For step 16's dependency updates.
- **4.12, the playground's class-name checks (#513):** an exact `className()`
  comparison never matches in the bundled hcweb playground, because
  `deno bundle` renames classes. `Frame.quantityOperator`'s
  `className() === "FrameSymbol"` made `<>.#` and `<>.##` answer `<>` there
  instead of `0` and `1`. 4.12 replaced it with `isSymbol()`, which fixed those
  answers (see 4.12). The comparisons this phase left in place fail the same
  way, and #513 tracks them: `Frame.isBooleanNegation` (`lib/frames/frame.ts`),
  `isCatch` (`frame-expr.ts`), the `spelling` helper (`frame-observation.ts`),
  `methodDeclaredBy` (`declared-protocol.ts`), and `isState` and `walkPath`
  (`access-footprint.ts`). Because of `isCatch`, a `$!` handler never runs in
  the playground: `$!!.zero $! 7` answers `7` under Deno and `$!!.zero` in the
  bundle, before and after this phase.

That bundle defect is the only one this phase found in product code.

## Outside review

The Slacker review of #514, reviews 6015833297 (at `ef6b508`) and 6015916393 (at
`c00d910`), left seven threads. Each fix keeps every HC answer: the testdoc
summary table and `test:doc` are unchanged, and the counts above change only by
the tests listed here.

- **4661196475, the patch bump.** The version stays 0.55.3 under decision 5. The
  CHANGELOG's Breaking bullet now says so, and that callers on a `^0.55` range
  receive the removals without opting in (`9f1705c`).
- **4661196484 and 4661196487, `FrameNumeric`'s hook defaults.** 3.13 gave every
  hook but `unaryPlus` and `unaryMinus` a base default, and 4.14 then deleted
  the `ratioParts` overrides that repeated it. A default is now kept only where
  it is a refusal, an error a rung that forgets the override answers visibly:
  `inexactResult` and the `*Same` and `powerIntegral` arithmetic hooks.
  `isZero`, `promoteOne`, `ratioParts`, `integralValue` and `compareSame` answer
  facts about the value (`equals` reads a null comparison as unequal), so they
  are abstract again, and a comment in `frame-numeric.ts` states the rule, which
  also covers the unary signs. The rungs and peers that relied on those five
  defaults regain explicit overrides answering what the defaults answered:
  `FrameNumber` (`promoteOne`, `ratioParts`), `FrameTime` (`promoteOne`,
  `ratioParts`, `integralValue`), `FrameTypedNumber` (those three and
  `compareSame`) and `FrameSequence` (those four and `isZero`). A "ranked rungs"
  test enumerates `NUMERIC_RANK` and asserts each rung overrides the refusing
  hooks its dispatch reaches (`466365c`).
- **4661196491, the generated summary table.** `testdoc:summaries` prints each
  file's old and new counts before writing, and refuses a table in which a
  file's `total` or `pass` drops, its `fail` rises or the file disappears,
  unless the script is given `--allow-regression`. Recording only exit-0 runs is
  intended: a testdoc with a failing claim exits 1 and already fails `test:doc`.
  The generator's module doc says so (`85b480f`).
- **4661196493, `classOnce`'s cache.** Behavior is unchanged. The docs now say
  that an error the load answers is kept, and that a throw keeps nothing and
  propagates, so the next call evaluates again. `classOnce` takes an optional
  source reader so a test can inject a throwing source (`907fd76`).
- **4661196495, `--parallel` and the disk.** All 95 `lib/` test files were
  checked for fixed on-disk paths and shared temp-dir names. None writes to
  disk: `test:lib` grants no permissions, so a write would fail rather than
  race. The only file-system call is `Deno.readDir` in `lib/load-order.test.ts`,
  which `test:load-order` runs on its own, outside `--parallel`. The `/tmp/...`
  strings in `frame-resource.test.ts` and `resource-reference.test.ts` are roots
  of in-memory stores and path fixtures. Nothing needed fixing.
- **4661266551, run links.** The 6.8 CI paragraph links its three Actions runs.

## Left for cleanup

- **Step 14:** `lib/frames/CLAUDE.md` still says "`MetaFrame.get` owns the
  traversal and its cycle guard"; since 4.3 the private `MetaFrame.traverse`
  does. `doc/ARCHITECTURE.md:516` cites `declaredMethod`, which 2.3 made
  `methodDeclaredBy` in `lib/frames/declared-protocol.ts`, and the audit's step
  7 note on `ARCHITECTURE.md:512-528` cites `OBSERVATION_KEYS` at
  `frame-array.ts:304-307`, which moved there too. `doc/ARCHITECTURE.md:184`
  names `HCLang.makeHost`, which 4.6 replaced with `hostNamespace` in
  `lib/execute/host-namespace.ts`. `FrameScoped.call`'s JSDoc
  (`lib/frames/frame-expr.ts`) lists `.#`, `.##` and `.###`, but the method also
  sizes `.####`, as it did before this phase.
- **Step 15:** `experiments/017-classical-cd/run.ts` records the whole text of
  `lib/version.ts` as `libVersion`, so its next run also records `VERSION`'s new
  comment line. Four records in `spec/1-fix-closures/` (07 to 10) link to
  `lib/maml.ts`, which 5.1 moved to `maml/maml.ts`, so those links no longer
  resolve. In prose, `spec/a06-outward-reference-resolution.md` and
  `spec/a16-concrete-semantics-graph.md` name `lib/maml.ts`, and
  `spec/a07-hc-security-architecture.md` names `cli/flatten.ts` (3.3).
- **4.21 (an issue):** `lib/frames/effect-registry.ts`'s module comment still
  names `set` and `replaceMember` as the commit points.
