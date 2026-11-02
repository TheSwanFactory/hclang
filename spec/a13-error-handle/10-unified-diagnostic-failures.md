# Unified Diagnostic Failures and Named Error Literals

**Status:** Implemented for v0.39.0 (issue #467). Baseline measurements below
refer to v0.38.0.\
**Issue:** [#467](https://github.com/TheSwanFactory/hclang/issues/467),
including its five answer comments.\
**Baseline:** `57e49dbbb850bdfa68df73188b5d4bf91fd2ff29`, v0.38.0, master after
[#466](https://github.com/TheSwanFactory/hclang/pull/466). Source inspection and
the baseline probes below were performed on 2026-11-01.\
**Prior:** [a13 design record](../a13-error-handle.md), especially D5, D9 and
D11; [06](06-applying-a-failure.md), especially §§3, 5 and 7; and
[09](09-combination-step-guard.md). This is the next specification entry, not
the `10-combination-guard-findings.md` spike report requested by 09. That spike
has not been performed here.

## 1. Scope and relationship to the earlier design

An HC failure must not turn into nil, a successful binding, or a truthy
condition merely because its runtime representation is a diagnostic note. Unify
failure classification first, then give source code a named error literal that
does not depend on an undeclared variable.

This implements the five decisions proposed in #467:

1. Diagnostic failure notes carry `is.error` from construction.
2. Unrecovered failures propagate through `?` and `:` without running a branch.
3. Arithmetic, ordering and equality preserve either operand's failure.
4. Diagnostic failures participate in existing statement and import failure
   handling exactly as flagged errors do.
5. `$!.reason` is a named error literal, with an optional following statement
   terminator, and replaces deliberate missing-name refusals in bundled code.

The requirements below define the implementation of #467. The historical
measurements in §2 remain unchanged for comparison.

The historical a13 record was written against v0.16.0 and explicitly remains
unimplemented. Its parent-scope recovery mechanism, handler naming, masking,
failure inspection, and receiver-side alternative remain outside this change.
This specification updates its assumptions about diagnostic failures and source
syntax. It preserves D11's propagation before conditional dispatch. The
implemented [a14 conditional rule](../a14-bfg/03-total-conditional.md),
including the nil-then edge, remains the conditional contract.

Nothing here resolves 09's broader questions about relocating evaluator checks,
changing effect ordering, capability delegation, or allowing a receiver to
recover from a failure. In particular, this change does not require a universal
guard in `FrameCurry.call` or removal of either evaluator check.

## 2. Current implementation and reproduced failures

The baseline has three related predicates with different purposes:

| Predicate                | Current implementation and purpose                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Frame.isError()`        | Tests `is.error`; `FrameNote` additionally recognizes diagnostic failures. It classifies an error value itself.                                   |
| `Frame.isFailedResult()` | Tests `is.error` on the result and its immediate structural elements. It is deliberately shallow and does not enumerate a resource.               |
| `observationError()`     | Preserves errors during quantity observation. It also handles observation-specific failures such as cycles; it is not the control-flow predicate. |

`FrameNote.isDiagnosticFailure()` recognizes `!`, `<>`, `>` and `-`, but the
constructor sets only `is.note`. For each of those four labels, direct probes
gave `isError() === true`, `isFailedResult() === false`, and
`observationError() === note`. An array immediately holding the note also
reported `isFailedResult() === false`. The progress labels `+`, `~` and `=`
reported false for both error predicates.

The evaluator's `FrameExpr.evaluateTerms` checks the accumulator with
`isFailedResult()` and the evaluated term with `value.is.error === true`.
`evaluateBody` uses `isFailedResult()` between semicolon-separated statements.
Neither therefore recognizes an unflagged diagnostic failure. #466 added
explicit `isError()` handling to arithmetic and to a bound method's result,
which fixes those two paths but leaves the classification split.

The following results were reproduced with `execute` at the baseline. `E` stands
for the original missing-name note, whose displayed subject includes a runtime
frame ID. Nil is shown as `()`; `execute` renders standalone nil as no output.

| Source                            | Baseline answer                                          |
| --------------------------------- | -------------------------------------------------------- |
| `([].nope) + 1`, `1 + ([].nope)`  | `E`                                                      |
| `([].nope) .> 1`                  | `E` with `.++ [.>, 1]` appended                          |
| `1 .> ([].nope)`, `1 = ([].nope)` | `()`                                                     |
| `([].nope) = ([].nope)`           | `()`                                                     |
| `(1 .> ([].nope)) ? {1} : {2}`    | `2`                                                      |
| `(1 + ([].nope)) ? {1} : {2}`     | `1`                                                      |
| `(1 / 0) ? {1} : {2}`             | `$!.division-by-zero /`                                  |
| `{([].nope); 42} ()`              | `42`                                                     |
| `.t [.a ([].nope); .b 2]`         | `a` holds the note; `b` is `2`                           |
| `.t [.a (1 / 0); .b 2]`           | No `a` binding; the failed statement is held; `b` is `2` |
| `$!.zero;`                        | `($!.zero.! “!.zero”;);`                                 |

The issue's closure example, `.f {(_ = 0) ? {$!.zero;} : {__}}; f 1`, also
reproduces the damaged parse: the body contains `$!.zero.! “!.zero”`, and the
final result contains nil instead of the requested `1`.

A separate in-memory named-import probe used `FrameImport`,
`evaluateResourceSource`, a `MemoryStore`, and an existing lowercase `module`
binding. Importing `.x ([].nope); .y 2` succeeded, returned `.y 2`, and replaced
the prior binding. Importing `.x (1 / 0); .y 2` returned the division error and
preserved the prior binding. These are current-code measurements, not results of
the proposed implementation.

## 3. Failure classification

### 3.1 Constructor invariant

Every `FrameNote` whose `isDiagnosticFailure()` is true MUST have
`is.error === true` before it is returned to a caller. This applies to direct
construction and the `key`, `type`, `index` and `fail` factories. Retain
`is.note`, the note label, subject, origin, metadata and diagnostic rendering.

| Note label | Meaning            | Error flag      |
| ---------- | ------------------ | --------------- |
| `!`        | Missing name       | true            |
| `<>`       | Type mismatch      | true            |
| `>`        | Bounds exceeded    | true            |
| `-`        | Failed test        | true            |
| `+`        | Passed test        | absent or false |
| `~`        | Unimplemented test | absent or false |
| `=`        | Test summary       | absent or false |

Unknown note labels MUST NOT become errors merely because they are notes. The
named literal in §6 explicitly constructs an error regardless of the note label
vocabulary.

`FrameNote.isError()` MUST agree with the flag; its special-case fallback is
then redundant and may be removed. No live-object migration is required. Copies
and reference projections must preserve failure classification; checks that
already unwrap with `referent()` must continue to do so.

### 3.2 Distinct predicates remain distinct

Do not replace `isFailedResult()` with `isError()`, or the reverse. An aggregate
immediately holding an error is a failed result without becoming an error
itself. Keep the existing one-level structural check; do not recursively search
metadata or nested aggregates, enumerate resources, or perform observations to
decide control flow.

For a diagnostic failure `E`, all three applicable queries must now recognize
it: `E.isError()`, `E.isFailedResult()`, and `E.observationError() === E`.
Observation-only failures do not thereby become globally flagged errors.

## 4. Propagation and evaluation order

### 4.1 Expressions, operators and conditionals

A failed evaluated term ends its expression before combination. A failed
accumulator prevents subsequent terms from being evaluated. Preserve the
original failure and its diagnostic information; do not substitute nil, an
operator domain error, or a receiver. Later expression terms must not be
absorbed into a note's `.++` extras.

For `+`, `-`, `*`, `/`, `%%`, `**`, `.<`, `.>`, `.<=`, `.>=`, `=`, `==` and
`===`, including the registered ordering aliases `.<<` and `.>>`, an error
operand on either side MUST answer that error. The public operation functions
must preserve this rule when invoked directly as well as through HC evaluation,
using the same referent-aware error classification as the arithmetic helper.
Check the left operand first when both direct API operands are errors. In source
evaluation, the first encountered failure stops evaluation, so a later operand
may never be evaluated.

This does not change successful equality, numeric coercion, the equality ladder,
or the domain behavior of ordinary non-error operands. It does not define a
recursive comparison policy for errors nested in otherwise successful values.

An unrecovered error in `E ? {then} : {else}` answers `E`; neither branch runs.
`E : {fallback}` also answers `E`. Nil continues to select the fallback, while
ordinary non-nil values retain the existing a14 behavior. `:` is not an error
recovery operator. The evaluator supplies this guarantee; the standalone
`IfThen` and `IfElse` helpers need no new recovery semantics.

### 4.2 Statements and aggregates

Semicolon-separated closure execution stops at the first failed statement. Its
later statements and their effects do not run. A failed declaration does not
install its intended value, and its statement wrapper reports failure.

Aggregate construction retains its existing collecting behavior. For example,
`[.a E; .b 2]` must behave like the baseline flagged-error counterpart: no `a`
binding is installed, the failed statement is held, and `b` may still be
constructed. Do not turn aggregate construction into a fail-fast closure
sequence. Its result is then failed under the existing shallow predicate.

Likewise, a literal aggregate can retain an error element. Expression reduction
stops only on a term that is itself an error, not on an aggregate holding one,
so the aggregate stays readable: `[.a E; .b 2].b` is `2`, `[E, 7] .1` is `7`,
`[E, 7] .#` is `2`, and `[(1 / 0)] .0` answers the division error. At the
baseline `[(1 / 0)] .0` answered the failed aggregate itself, and once #467
flagged diagnostic notes that also made every aggregate holding a missing-name
note unreadable (PR #472 review). Statement sequences, imports and the other
control boundaries keep the shallow `isFailedResult()` test. Making dynamic
application `[] E` equivalent to literal collection still belongs to the
receiver-side design raised in 06 and 09.

The existing low-level `FrameNote.call`, extras and end-of-output protocol need
not be redesigned. Runtime propagation must prevent ordinary expression
continuation from reaching that protocol after a failure. Test reporting must
still be able to emit a failed-test note as a report.

### 4.3 Imports and mutating methods

Apply
[resource-import requirement 4](../../.kiro/specs/resource-import/requirements.md#requirement-4-incremental-evaluation-and-failure)
to diagnostic failures without adding a second import-specific classification:

- Return the first failed result and process no later imported source forms.
- A local import retains changes completed before failure; it is not rolled
  back.
- A named import preserves its prior target binding, or its absence, and does
  not expose the partial imported namespace.
- Prior external effects remain; no new transaction or rollback is implied.

A mutating method that answers a diagnostic failure must continue to return that
failure instead of its receiver, preserving #466's correction. This does not
roll back mutations already performed before the failure. Receiver capability
and copy-on-write rules remain in force.

## 5. Required answers after classification is unified

In the following examples `E` denotes an actual diagnostic failure produced at
the shown site, not a new HC identifier.

| Source                                               | Required answer or behavior                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `([].nope) .> 1`, `1 .> ([].nope)`                   | Original missing-name failure                                     |
| `1 = ([].nope)`, `1 == ([].nope)`, `1 === ([].nope)` | Original missing-name failure                                     |
| `([].nope) = ([].nope)`                              | First failure; do not evaluate the second lookup                  |
| `(1 .> ([].nope)) ? {1} : {2}`                       | Failure; neither branch runs                                      |
| `(1 + ([].nope)) ? {1} : {2}`                        | Failure; neither branch runs                                      |
| `([].nope) : {2}`                                    | Failure                                                           |
| `{([].nope); 42} ()`                                 | Failure; do not evaluate `42`                                     |
| Named import of `.x ([].nope); .y 2`                 | Fails; target unchanged; `.y 2` is not processed                  |
| `[.a ([].nope); .b 2]`                               | Same collection and binding behavior as a flagged-error statement |

Check values, flags, identity where the API exposes it, and effects. Do not
assert unstable runtime frame IDs or confuse a renderer's empty output with a
successful computation.

## 6. Named error literals

### 6.1 Source contract

Reserve the exact prefix `$!.` for a named error literal:

```text
error-literal := "$!." reason
reason        := [A-Za-z_][A-Za-z0-9_-]*
```

The ASCII reason grammar is a decision of this specification. It makes the
existing refusal names, including `division-by-zero`, `unsupported-figure`,
`invalid-demi` and `invalid-scale`, directly writable. A literal constructs a
flagged error without looking up its reason in any scope. Declaring a word with
the same spelling cannot disable it.

Examples:

```hc
$!.zero
$!.zero;
{ $!.zero } ()
.f {(_ = 0) ? {$!.zero;} : {__}}; f 1
# The final call answers 1; f 0 answers the error $!.zero.
```

The success branch uses `__` to read the enclosing function argument; `_` would
read the branch's nil argument even without an error literal.

The literal's canonical rendering is `$!.` followed by its reason, with no
terminating semicolon included in the value. A following `;` belongs to the
ordinary statement grammar and is redispatched exactly once. Surrounding
statement wrappers may therefore still print a terminator.

The reason is a maximal identifier run. A boundary, including whitespace, comma,
semicolon, a closing bracket or brace, or an operator character outside the
reason alphabet, completes the literal and is redispatched. Physical EOF also
completes a nonempty valid reason. Hyphen is part of a reason, so use a boundary
when the following character is intended as subtraction.

`$!.`, `$!.;` and `$!.1bad` are lexical errors, not empty-reason error values
and not scope-anchor lookups. A literal at EOF, a final `;`, and every two-chunk
split of a literal must have the same meaning as unsplit input. The lexer must
not swallow a surrounding `}`, `]`, `)`, or later declaration.

### 6.2 Representation and compatibility

Use an existing flagged-error construction path, such as
`Frame.error("$!." + reason)`. A new public `FrameError` class, structured
payload grammar, error inspection API, and matching protocol are not required.
The name lives in the literal's source/rendering contract; this does not promise
that every existing host-created error string becomes a structured value.

Keep `$` and `$$` as scope anchors. Preserve the other legacy note prefixes and
their semicolon-delimited lexical behavior, including `$!missing;`, `$+pass;`,
`$-fail;`, `$~todo;`, `$=summary;`, `$>bounds;` and `$<>type;`. Classification
of a resulting note follows §3. Only the exact `$!.` prefix selects the new
literal path; its old malformed interpretation is intentionally replaced.

Existing rendered diagnostic notes can include subjects and metadata after
`$!.name-missing`. This specification does not define that entire rendered
string as a round-trippable structured error literal. The new source value is
the named atom; arbitrary following source is ordinary expression syntax.

This applies to every `$!.label` prefix, including the notes the interpreter
itself prints; no label is reserved for the old note syntax. Read back as
source, `$!.name-missing “x”;` is the literal `$!.name-missing` applied to
`“x”`, which answers that same error, then a statement terminator. The reason
round-trips and the subject does not (PR #472 review). `$!word;` with no dot,
`$<>…;`, `$>…;` and the test labels keep the semicolon-delimited note syntax.

### 6.3 Ownership in the current lexer

The `$` family is registered by `FrameScopeAnchor.SYNTAX`, not `FrameNote`.
Today `recognizeDollar` consumes a note body until `;`, `finishDollar` rejects
an unterminated note, and `fromSource` builds `new FrameNote(source)`. That
explains why `$!.zero;` currently becomes a note with the whole body as its
label.

Implement exact-prefix selection and reason completion in that syntax-owned
family, or a descriptor it explicitly delegates to. Use the existing
`ScanResult` completion/error protocol. Do not add a second competing `$`
registration, widen every property name to fix this one form, or add a global
text-replacement preprocessing pass. End-of-input and boundary completion must
construct the same flagged value.

A well-formed literal is a successfully parsed source atom, not a lexical
failure. Parsing an uncalled closure that contains one must succeed; only
evaluating the literal makes its enclosing computation fail. Keep this separate
from `ScanDisposition.Error`, which is reserved for malformed source.

## 7. Bundled-code migration and compatibility audit

After §6 works, replace deliberately unbound refusals in actual bundled code:

| File                 | Existing refusal                          | Replacement             |
| -------------------- | ----------------------------------------- | ----------------------- |
| `hc/figures.hc`      | `unsupported-figure` in refusing branches | `$!.unsupported-figure` |
| `hc/demi.hc`         | `invalid-demi`                            | `$!.invalid-demi`       |
| `hc/demi.hc`         | `invalid-scale`                           | `$!.invalid-scale`      |
| `hc/rotor-router.hc` | `invalid-router` (added in v0.38.1)       | `$!.invalid-router`     |

Audit every `hc/*.hc` code body for other deliberate missing-name refusals; do
not blindly replace words inside prose or examples. Imports filter testdoc
example lines beginning semicolon followed by a space, so expected-error
examples are distinct from module initialization. Ordinary closure bodies remain
lazy: a refusal in an untaken branch must not fail definition or import.

The audit must also cover prose written in code position. `hc/testdoc.hc` wrote
its section headings as `## heading` lines outside any document. `##` is an
empty comment, so each heading's words were evaluated as code and answered a
missing-name note. Master's import continued past those notes, so the file
imported; under constructor flagging the import stopped at the first heading (PR
#472 review). The headings are now one-line documents, `` ```## heading``` ``,
which keeps them as text in both the testdoc run and an import. `hc/gerbil.hc`,
`hc/white-paper.hc` and `hc/led_blink.hc` already failed to import at the
baseline, for unrelated reasons, and are unchanged.

Update affected testdoc expectations and prose to name the intentional error
rather than a missing variable, then regenerate `lib/bundle/hc-sources.ts` with
`deno task bundle:embed`. Keep the embedded Demi prologue and ordinary imports
in agreement. Verify that a same-named binding cannot turn a refusal into
success.

Constructor flagging is an intentional compatibility change: code that relied on
continuing past a diagnostic failure will now fail at the existing control
boundary. Review changed corpus answers individually. Do not mass-update
expectations to make the suite green or weaken propagation to preserve a
previously silent failure. Progress and summary notes must still report
normally, and failed-test notes must remain visible to the testdoc harness.

## 8. Implementation order and acceptance

### Phase A: classification and existing boundaries

1. Establish the constructor invariant in `frame-note.ts`; retain the shallow
   result and observation contracts in `frame.ts`.
2. Re-run the baseline matrix and inspect `frame-expr.ts`, declaration setters,
   `resource-import.ts`, and `bound-method.ts`. Prefer fixing the common
   classification over adding independent lists of note labels at each site.
3. Extend error preservation to direct ordering and equality functions in
   `lib/ops/math.ts`. Retain arithmetic and method regressions from #466.
4. Audit testdocs and report compatibility changes before proceeding.

Phase A is independently useful and must not depend on recovery machinery or the
literal parser. Do not remove evaluator checks to make it work.

### Phase B: literals and bundled refusals

1. Implement and test the syntax contract in §6.
2. Migrate bundled refusing branches, examples and prose; regenerate the embed.
3. Verify the CLI/library paths and both implicit Demi loading and explicit
   bundled imports against the same behavior.

### Required regression coverage

- Constructor/factory coverage for all seven known note labels, unknown labels,
  shallow aggregate failure and nested-aggregate non-recursion.
- Every listed arithmetic, ordering and equality operator, an error on each
  side, and both errors. Include direct operation calls and source evaluation,
  reference-wrapped failures, and original-failure preservation.
- Both conditional branches and the standalone fallback, with counters proving
  that failed conditions run neither branch. Keep nil and successful-value
  controls, including a14's accepted nil-then edge.
- A later expression term and a later closure statement with observable effects;
  prove they do not execute after failure. Test actual counters or recorded
  writes rather than only the final rendering.
- Aggregate collection, failed declarations, and a successful sibling binding,
  distinguishing this from fail-fast closure sequencing.
- Local and named imports with a failure in a declaration value, successful
  prior work, later forms containing recorded effects, and prior/absent named
  targets. Retain resource streaming and stop-before-later-parse checks.
- Mutating method failure results, including prior mutations and capability
  controls, so returning the failure does not accidentally imply rollback.
- Literals at EOF and each delimiter boundary, nested in closures and
  aggregates, across every two-chunk split, with and without a terminator;
  malformed names; unaffected anchors and legacy notes; an untaken literal
  branch.
- The exact `f 1`/`f 0` example in §6 and the migrated Figure/Demi refusal
  paths, including a colliding ordinary binding and bundled-source parity.
- Testdoc reporting of failed, passed, unimplemented and summary notes.

### Validation commands for implementation

Use focused tests first, then the repository checks:

```sh
deno test lib/frames/frame-note.test.ts lib/frames/bound-method.test.ts
deno test lib/ops/conditionals.test.ts lib/frames/frame-number.test.ts
deno test lib/execute/lex.test.ts lib/execute/parse.test.ts
deno test lib/execute/resource-import.test.ts
deno check lib/frames.ts lib/mod.ts
deno task bundle:check
deno task test
```

Add focused cases to the relevant evaluator, syntax and arithmetic suites as
needed. Those commands are acceptance work for the implementation, not tests
claimed to have passed by this specification. A change is complete when the new
behavior, effect ordering, corpus compatibility decisions, source/embedded
parity, formatting and type diagnostics have all been verified.

## 9. Implementation notes for v0.39.0

The release is a minor bump because formerly truthy diagnostic failures now stop
existing control flow. Constructor flagging supplies the common policy; ordering
and equality also check error referents when invoked directly. The syntax
remains owned by `FrameScopeAnchor.SYNTAX`. No recovery mechanism or
evaluator-check relocation was added.

The constructors in `hc/demi.hc` and `hc/rotor-router.hc` check that the
argument is an array of exactly three elements, `(_ ~ ([].<>)) ? {(__ .#) = 3}`,
before reading its fields. A short array, a group, text, nil or a Count
therefore returns the deliberate `$!.invalid-demi` or `$!.invalid-router`
refusal instead of failing incidentally at an index read; before this change
those reads produced notes that execution silently continued past. The units
corpus now documents that `3.m` is a failed Count property lookup, unlike the
decimal literal `3.0.m`. The wrong-depth Demi and RotorRouter examples now show
the method answering the failure and, through a mutable name, leaving both
fields unchanged. RotorRouter's example that routed a missing-name note now
shows that the note, like a flagged error, is never routed. One import test
previously queried index zero of an empty successful result; it now checks the
result itself instead of classifying that out-of-bounds note.

A closure cannot bind a schema or nil argument, so no source input currently
reaches the refusing branches of Figures' `gap` and `spin`. Their literals are
checked in place rather than through a constructed unsupported host.

The conditional example uses `__` in its success branch to read its enclosing
function's argument. The original issue's `_` names the branch argument and
returns nil even when the error literal is replaced with an ordinary value. This
is an example correction, not a change to argument lookup.
