# Reply to 12b: Measured Answers

**Status:** Proposal for review, replying to [12b](12b-error-identity.md).
Nothing here is implemented or decided.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Baseline:** v0.39.0, `05b4f25`. Unlike 12b, every claim about current behavior
here was probed, with `deno task hc -e '<source>'` or, for frame identity, a
TypeScript check against `lib/execute/evaluate.ts`.\
**Prior:** [11](11-recovery-semantics.md), [12](12-recovery-review.md),
[12a](12a-recovery-review-reply.md), [12b](12b-error-identity.md).

12b asks for a runtime spike before more abstract design (12b §8). This reply
runs the parts of that spike that need no new code, and answers what they can.

## 1. R3 has an answer today: put nil last

12b §4 asks for at least one HC expression that recovers to nil on a kind match
and answers the original error otherwise, without changing `?` or `:`. Two
exist. In these probes `<>` and `()` stand in for a match and a mismatch, and
`(1 / 0)` stands in for answering the original:

```
<> ? {()} : {(1 / 0)}               => $!.division-by-zero /   the trap
(<>.!) ? {(1 / 0)} : {()}           => ()                       negate, nil last
(().!) ? {(1 / 0)} : {()}           => $!.division-by-zero /
(<> ? {[()]} : {[(1 / 0)]}) .0      => ()                       box, then unbox
(() ? {[()]} : {[(1 / 0)]}) .0      => $!.division-by-zero /
```

(The CLI prints nothing for a nil answer; `()` above is that empty output.)

**Negate and put nil last.** `:` tests the then-branch's result, so a nil
recovery is safe in the else branch, where nothing tests it afterwards. A typed
handler that recovers to nil reads:

```
((obs ~ K) .!) ? {original} : {()}
```

**Box and unbox.** `hc/testdoc.hc` already documents this idiom ("Box a branch
that answers nil, so it does not fall through"). It works for any recovery
value, so it is the general shape:

```
((obs ~ K) ? {[recovered]} : {[original]}) .0
```

Boxing the original is safe since v0.39.0: an aggregate holding an error is an
ordinary value, and `.0` answers the error itself.

So R3 is a conformance requirement that current HC can meet, as 12b's note B
suggested. Neither shape needs new conditional syntax. Documenting one of them
as the idiom for typed handlers is enough.

## 2. R2 needs a reason that does not depend on the note label

12b §3 proposes that an observation match a schema of error literals by reason.
Here is where reasons live in the errors the interpreter makes today:

```
1 / 0                       => $!.division-by-zero /
[].nope                     => $!.name-missing “$:FrameArray.84.nope”;
2 ** (2 ** 40)              => $!.numeric-range ** FrameCount
.x <1, 2> 5; @x 3           => … $!.type-error .x <1, 2> 5 …
[1] .5                      => $>.bounds-exceeded “[0..1].5”;
1 + “a”                     => ()
```

Three findings:

1. **Every reason sits right after the label, in the literal's identifier
   grammar.** Spec 10 §6.1 defines that grammar, and §6.2 makes every `$!.`
   prefix the literal. Reading the reason as that prefix is therefore not
   "inferring a kind from arbitrary text" (12b §3.4); it is the same rule the
   lexer uses. Errors made by `Frame.error` carry only a string, so in practice
   this is how a reason is found.
2. **Not every failure label is `$!`.** The bounds failure is
   `$>.bounds-exceeded`, and type notes use `$<>`. No literal spells those, so
   `<$!.bounds-exceeded>` cannot match a bounds error by prefix. Either matching
   compares the reason after any failure label, so `<$!.bounds-exceeded>`
   matches `$>.bounds-exceeded`, or spec 10's literal grammar grows to cover the
   other labels. This reply proposes the first: the kind is the reason, and the
   label is rendering.
3. **Some failures are not errors at all.** `1 + “a”` still answers nil, because
   M-3 (#361) has not turned the numeric type-mismatch fallbacks into errors.
   Recovery never sees these. That is a known sequencing point (a13 D13), not a
   defect in recovery, but the conformance matrix should not include a
   type-mismatch row until M-3 lands.

**Proposed R2, sharpened:** an observation of error A matches a schema of named
error literals when one literal's reason equals A's reason. A's reason is the
identifier that follows its failure label (`$!`, `$>`, `$<>`, `$-`) and a dot,
read with spec 10's reason grammar. An error with no such identifier has no
reason and matches no named kind (12b §3.4).

## 3. R1: literal errors share one frame per source site

12b R1 says a handler declines by answering the exact original frame, and its
regression list requires that "constructing a same-reason error does not reuse
the original frame accidentally". A check of frame identity shows that a literal
does exactly that:

```
.f {$!.zero}; [f (), f ()]      two calls, same frame:    true
.g {1 / 0};   [g (), g ()]      two calls, same frame:    false
[$!.zero, $!.zero]              two literal sites, same:  false
```

The lexer builds a literal's error frame once, when it scans the source
(`namedError` in `lib/frames/frame-scope-anchor.ts`), and every evaluation of
that site answers it. An operator such as `/` makes a fresh error each time.

So if `E` fails by calling a helper that raises `$!.zero`, and the handler calls
the same helper and it fails again, the handler's result is the same frame as
the original. Under R1 that counts as a decline, although it is a second
failure.

This does not change any observable result. Under 12a and 12b the boundary
answers the handler's result in every case, and here that result is the same
frame either way. It matters only for the identity tests in 12b §5 and for any
later provenance feature. Two options:

1. **Mint a fresh frame per evaluation** of a literal, as operators already do.
   Identity then means one failure event, which is what R1 assumes. The cost is
   one allocation per raised literal, only on the failure path.
2. **State R1 as description only**, as 12b's note B already leans: the boundary
   passes the handler's result through, and "declined" versus "failed" is how
   the spec explains outcomes, not something the interpreter or the tests can
   tell apart. The same-site regression is then dropped.

This reply recommends option 2 for the first version, because nothing in it uses
identity, and option 1 only when provenance is designed.

## 4. Conformance changes

These amend 12 §9, 12a §4 and 12b §5:

| Case                       | Required result                                                            |
| -------------------------- | -------------------------------------------------------------------------- |
| Typed recovery to nil      | Written as `((obs ~ K) .!) ? {original} : {()}`; answers nil on match      |
| Typed recovery, boxed      | `((obs ~ K) ? {[v]} : {[original]}) .0`; answers `v` on match, A otherwise |
| Kind match across labels   | `$>.bounds-exceeded` matches `<$!.bounds-exceeded>`                        |
| Subject-bearing diagnostic | `$!.name-missing “…”;` matches `<$!.name-missing>`                         |
| Type-mismatch row          | Omitted until M-3 (#361)                                                   |
| Same-reason new failure    | Dropped under §3 option 2; kept as "B is a distinct frame" under option 1  |

## 5. What is left

Of 12b's remaining questions (§8):

- **Nil-safe composition** is answered by §1.
- **The observation protocol** is still open: how a handler reaches its
  observation, the original error, and its reason. §2 fixes what the reason is,
  not how it is read.
- **Receiver dispatch versus a recovery boundary** is still open, and it is the
  question a code spike has to answer. Spec 06 §3a measured that removing the
  per-term check lets a failing term reach `Frame.error.called_by`, and that is
  the hook a recover receiver would use.

So the next step is that code spike, scoped to those two questions. It would
build a recover receiver with a placeholder spelling and run the matrix in §4
against it, and it would not need to settle the spelling first.
