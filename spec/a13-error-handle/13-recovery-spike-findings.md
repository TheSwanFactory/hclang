# Recovery Spike Findings

**Status:** Measured findings from a research spike. Nothing is implemented in
the runtime or decided.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Baseline:** v0.39.0 interpreter (`05b4f25`), unmodified. The spike is
`experiments/a13-recovery-spike/`; `deno test experiments/a13-recovery-spike`
passes 13 tests.\
**Prior:** [11](11-recovery-semantics.md), [12](12-recovery-review.md),
[12a](12a-recovery-review-reply.md), [12b](12b-error-identity.md),
[12c](12c-measured-answers.md), and [06](06-applying-a-failure.md) for the
receiver-side protocol.

12c §5 left two questions for a code spike:

1. **The observation protocol.** How does a handler reach its observation, the
   original error, and the error's reason?
2. **Receiver dispatch or a recovery boundary.** Can recovery be an ordinary
   receiver, or does expression reduction need a narrow boundary?

The spike answers both. It ran the conformance matrix of 12 §9 as amended by
12a, 12b and 12c against two implementations, and every row passes in both.

## 1. What was built

All three pieces are in `spike.ts`, with placeholder spellings.

- **Observation.** A plain `Frame` subclass holding the original error. It is
  not an error and nothing propagates from it. It exposes three properties:
  - `.error` is the original error frame. Reading it propagates, which is how a
    handler declines (12a §2).
  - `.reason` is the reason as text, read after any failure label (12c §2).
  - `.text` is the original's full rendering, subject included.

  It spells itself `$!.<reason>`, so `obs ~ <$!.reason>` matches through the
  existing enumeration matcher, which compares spellings (§3.3).
- **Variant A: a receiver over a block.** `$$.recover {E} H` is a host-bound
  frame that overrides `call`. It receives the block `{E}` unevaluated, runs it,
  and calls `H` with an observation when the result is an error.
- **Variant B: an infix boundary.** `E catch H₁ catch H₂` replaces
  `FrameExpr.evaluateTerms` at runtime. It splits one expression's terms at each
  bare `catch`, reduces the guarded part with the original rule, and evaluates
  each handler part only while the result so far is an error. That is 23 lines
  of code.
- **Variant C: the control.** `$$.catcher E` is an eager receiver that counts
  whether it is ever reached.

## 2. Receiver dispatch or a recovery boundary

**An eager use-site form needs a boundary in expression reduction.**
`$$.catcher (1 / 0)` answers `$!.division-by-zero /` and the catcher is reached
zero times. The per-term check in `evaluateTerms`
(`if (value.is.error === true) return value`) returns the failing term before
`sum.call(value)` can dispatch it. The accumulator check
(`if (sum.isError()) return sum`) does the same when the failure is on the left,
so `1 / 0 catch {0}` without the boundary answers the division error. Spec 06
§3a measured the same: a failure reaches `Frame.error.called_by` only once the
per-term check is removed.

**A receiver over a block needs no boundary at all.** Variant A passes the full
matrix with no change to the interpreter, because the guarded expression is a
closure value until the receiver runs it. That is the receiver-side protocol of
spec 06, with the failure produced inside the receiver rather than handed to it.

**The boundary is small and stays local.** Variant B changes behavior only for
expressions that contain the operator. A differential test runs eleven spec 10
§5 expressions (conditionals, comparisons, sequences, aggregates, a map) with
and without the boundary installed, and the results are identical once
run-specific object ids are masked. No `hc/*.hc` file uses the word `catch`.
Because the handler part is not evaluated on success, `7 catch ($$.tick ())`
answers `7` without calling `tick`, so even an eager handler expression is lazy
for free.

**Ergonomics decide between them.**

| Concern                       | A: `$$.recover {E} H`               | B: `E catch H`                                           |
| ----------------------------- | ----------------------------------- | -------------------------------------------------------- |
| Interpreter change            | None                                | A boundary in expression reduction (23 lines here)       |
| Guarded expression            | Must be written as a block          | Any expression                                           |
| Chaining `H₁` then `H₂`       | `$$.recover {$$.recover {E} H₁} H₂` | `E catch H₁ catch H₂`                                    |
| After a conditional (11 §2.1) | `$$.recover {(c ? {a} : {b})} H`    | `(c ? {a} : {b}) catch H`                                |
| Precedence                    | Explicit, from the braces           | Loosest in its expression: guards everything to its left |

B is the form 11 §3 describes. A is the fallback if a change to expression
reduction is unacceptable. It also shows that the semantics do not depend on
which one is chosen: both pass the same matrix.

## 3. The observation protocol

### 3.1 Decline is answering `.error`, and identity holds

A handler `{($$.seen _) .error}` records its observation and answers the
original. The boundary's result is the same frame as `observation.original`
(`toBe`, not equality). The original is still flagged as an error after it has
been observed, and the observation itself is not. This confirms 12a §2 and 12b
R1 for errors made by operators. 12c §3's caveat still applies to literal
errors, which share one frame per source site; the spike did not change that.

### 3.2 The rest of the matrix

Every row below passes in both variants.

| Row                 | Source (variant B spelling)                                 | Result                                  |
| ------------------- | ----------------------------------------------------------- | --------------------------------------- |
| Success             | `7 catch {$$.tick ()}`                                      | `7`; tick not called                    |
| Recover             | `1 / 0 catch {0}`                                           | `0`                                     |
| Recover to nil      | `1 / 0 catch {()}`                                          | nil                                     |
| After a conditional | `((1 / 0) ? {1} : {2}) catch {0}`                           | `0`                                     |
| Handler failure     | `1 / 0 catch {[].nope}`                                     | `$!.name-missing …`                     |
| Chain after decline | `1 / 0 catch {_ .error} catch {_ .reason}`                  | `“division-by-zero”`                    |
| Chain after failure | `1 / 0 catch {[].nope} catch {_ .reason}`                   | `“name-missing”`                        |
| Chain after success | `1 / 0 catch {1} catch {$$.tick ()}`                        | `1`; tick not called                    |
| Sequence            | `{$$.before (); 1 / 0; $$.after ()} () catch {“recovered”}` | `“recovered”`; before once, after never |
| Collected failure   | `[(1 / 0), 7] catch {$$.tick ()}`                           | the array; tick not called              |
| Extracted failure   | `([(1 / 0)] .0) catch {1}`                                  | `1`                                     |
| Nested boundaries   | `(1 / 0 catch {[].nope}) catch {_ .reason}`                 | `“name-missing”`                        |
| Anchors             | `$`, `$$.tick ()`                                           | unchanged                               |

### 3.3 Kind matching by reason

`obs ~ <$!.reason>` matches by reason with no change to the matcher, across
labels, subjects and unions:

| Guarded          | Schema                                    | Match |
| ---------------- | ----------------------------------------- | ----- |
| `1 / 0`          | `<$!.division-by-zero>`                   | yes   |
| `1 / 0`          | `<$!.name-missing>`                       | no    |
| `[].nope`        | `<$!.name-missing>`                       | yes   |
| `[1] .5`         | `<$!.bounds-exceeded>`                    | yes   |
| `2 ** (2 ** 40)` | `<$!.division-by-zero, $!.numeric-range>` | yes   |

This works only because the observation spells itself as its reason literal and
the enumeration matcher compares spellings (`EnumerationSchemaMatcher` calls
`isEqualTo`, which compares `toString()`). That is a coincidence of the spike,
not a design. It also makes an observation print exactly like an error while not
being one. A real implementation should give observations their own match rule,
as 12c §2 proposes, and print them distinctly.

### 3.4 Typed handlers

Both shapes from 12c §1 work, and the trap they avoid is real:

```
1 / 0   catch {((_ ~ <$!.division-by-zero>) .!) ? {__ .error} : {()}}     => nil
[].nope catch {((_ ~ <$!.division-by-zero>) .!) ? {__ .error} : {()}}     => $!.name-missing …
1 / 0   catch {((_ ~ <$!.division-by-zero>) ? {[0]} : {[__ .error]}) .0}  => 0
1 / 0   catch {(_ ~ <$!.division-by-zero>) ? {()} : {__ .error}}          => $!.division-by-zero /   the trap
```

Inside a branch the observation is `__`, not `_`, because a branch is an
invocation (a13 D6's underscore ladder). This is the friction a13 D6 recorded,
and the spike does not remove it. Binding the observation to a name at the top
of the handler avoids it, as D6 recommends.

## 4. Findings

1. **The semantics of 11, 12, 12a, 12b and 12c are implementable as written.**
   Every row of the amended matrix passes in two independent implementations.
2. **An eager use-site operator needs a boundary in expression reduction; a
   block receiver needs none.** The boundary is small, changes nothing for
   expressions without the operator, and makes handlers lazy.
3. **The observation protocol can be three properties on an ordinary frame:**
   `.error`, `.reason` and `.text`. Decline is `.error`, and identity holds.
4. **Kind matching works with the existing `~` and schemas**, but only through a
   spelling coincidence. Matching needs its own rule before it ships, and
   observations need their own spelling.
5. **The underscore ladder remains the main ergonomic cost** of typed handlers.

One testing note: a host binding passed to `evaluate` is copied when it is
installed, so a counter must keep its count in an object the copies share (as
`lib/execute/error-policy.test.ts` does). The spike's first sequence test passed
vacuously until that was fixed.

## 5. What this leaves

- **Spelling** (11 §8): the operator, the observation's property names, and how
  an observation prints. The spike used `catch` and `$$.recover`.
- **Form:** infix boundary (B) or block receiver (A). This spec recommends B, as
  11 §3 assumed.
- **A matching rule for observations** that does not depend on spelling.
- **Literal error identity** (12c §3), if provenance is wanted.

Once the spelling is chosen, the next step is to move variant B and the
observation into `lib/`, with `spike.test.ts` ported as the regression suite.
