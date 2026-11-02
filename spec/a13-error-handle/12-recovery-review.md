# Proposed Follow-on Specification for PR #473

This is the complete Markdown document I would add as
`spec/a13-error-handle/12-recovery-outcomes.md`.

It proposes concrete answers to Q3–Q6 from
[spec 11](https://github.com/TheSwanFactory/hclang/blob/recovery-semantics-360/spec/a13-error-handle/11-recovery-semantics.md?utm_source=chatgpt.com),
without presenting those answers as ratified decisions. It deliberately leaves
operator spelling open.

# Recovery Outcomes and Error Observation

**Status:** Proposal for review. This document proposes rulings for Q3–Q6 of 11.
None are implemented or ratified.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Baseline:** v0.39.0, `05b4f25`, following 10.\
**Prior:** a13, 06, 10, and 11.

## 1. The question

Spec 11 proposes use-site recovery:

```
E ⟨recover⟩ H
```

When `E` succeeds, its value passes through unchanged. When `E` fails, `H`
receives the failure and may recover it.

Four questions remain entangled:

1. How does a handler deliberately decline recovery?
2. What happens when the handler itself fails?
3. How can the handler inspect an error without propagating it?
4. How does the evaluator deliver an error to the handler without violating
   ordinary propagation?

This record separates these questions and proposes independently testable
answers.

The governing distinction is:

**A failure is a result. Recovery is a decision about that result. Observation
must not silently become recovery.**

## 2. Three recovery outcomes

A handler invocation has three semantic outcomes.

| Outcome   | Meaning                                   | Result of recovery |
| --------- | ----------------------------------------- | ------------------ |
| Recovered | Handler supplies a replacement value      | Replacement value  |
| Declined  | Handler deliberately refuses this failure | Original error     |
| Failed    | Handler encounters a new failure          | New error          |

These outcomes must remain distinguishable even when their rendered values
resemble one another.

### 2.1 Recovery to nil is valid

Nil is an ordinary HC value. A handler that answers nil has successfully
recovered.

```
E ⟨recover⟩ {()}
```

If `E` fails, the whole expression answers `()`.

Nil must not implicitly mean decline.

Otherwise, recovery cannot express a legitimate absence of value, and ordinary
HC values acquire context-dependent control-flow meanings.

### 2.2 Decline is explicit

A handler needs a way to refuse an error without replacing it.

This record calls that operation `decline` without assigning source spelling.

Its semantic result is not an ordinary nil value or a newly constructed error.
It is a recovery-control outcome interpreted by the recovery boundary.

```
decline(original) => Declined(original)
```

A decline is valid only in an active recovery invocation.

Whether HC exposes a dedicated operation, a distinguished result, or a receiver
protocol is deferred.

### 2.3 A handler failure supersedes the original

If `H` encounters a new failure, that failure becomes the result of the recovery
expression.

```
E fails with A
H(A) fails with B
-----------------
E ⟨recover⟩ H => B
```

The original error A is not automatically restored.

This follows ordinary expression semantics: executing a handler can fail just as
executing any other closure can fail.

An outer recovery boundary may subsequently handle B.

A deliberate decline, by contrast, preserves A.

### 2.4 Re-raising is not declining

A handler may deliberately propagate an error, including the original error.

That is distinct from declining.

- **Decline:** the handler does not accept responsibility for the original
  failure.
- **Re-raise:** the handler explicitly produces an error as its result.
- **Fail:** the handler encounters an error while executing.

Re-raising the original error and declining may produce the same visible result
at one boundary, but they express different intentions.

The first implementation need not expose this distinction to ordinary HC
programs beyond preserving the resulting error. The distinction matters for
future diagnostics and provenance.

## 3. Error identity and observation

Spec 10 establishes that diagnostic failures are flagged errors. Their
propagation behavior is currently tied to that representation.

A handler must inspect a failure without accidentally terminating its own
evaluation.

This record proposes separating two roles:

1. **The error:** the original failure, retaining its identity and propagation
   behavior.
2. **The observation:** a non-propagating representation through which a handler
   can inspect the error.

### 3.1 Observation does not mutate the error

The original error must remain an error throughout recovery.

Observation must not clear its failure flag, mutate its identity, or turn it
into an ordinary successful value.

This rules out defusing the original frame in place.

A distinct observation value or equivalent immutable view is permitted.

### 3.2 Minimum observable information

The first version needs only enough information to distinguish named error
kinds.

For a named error such as:

```
$!.division-by-zero
```

The handler must be able to determine that the error kind is `division-by-zero`.

The observation contract should preserve the distinction between:

- The error's kind or reason.
- The original error value.
- Any diagnostic context the implementation already carries.

This record does not require structured stack traces, source spans, causal
chains, or new diagnostic metadata.

### 3.3 Observation is not error reconstruction

The observation should retain a reference to, or otherwise faithfully identify,
the original error.

Reconstructing an error from its printed text is insufficient.

Spec 10 explicitly does not promise that all diagnostic renderings round-trip as
structured error literals.

Consequently, converting an error to text and rebuilding `$!.reason` cannot be
the general recovery protocol.

### 3.4 Proposed handler contract

Conceptually, the handler receives an inspectable error observation:

```
H(observe(A))
```

The observation allows the handler to inspect A without propagating it.

The recovery boundary retains A independently so that decline can return the
exact original error.

The source-level representation of `observe(A)` remains open.

This is a refinement of spec 11's requirement that the handler receive the
actual error: the handler receives access to the actual error, not merely a
reconstructed reason string.

## 4. Use-site recovery is an evaluation boundary

Ordinary HC expressions stop when a term produces an error.

A recovery operator must be able to receive that error rather than allowing it
to terminate the enclosing expression before recovery is attempted.

That requires an explicit evaluation rule.

### 4.1 Abstract semantics

Let `eval(E)` produce either a successful value or an error.

```
eval(E) = Value(V)
---------------------------
eval(E ⟨recover⟩ H) = Value(V)
```

The handler is not invoked when `E` succeeds.

When `E` fails with A, the recovery boundary invokes H with an observation of A.

```
eval(E) = Error(A)
invoke(H, observe(A)) = Value(V)
--------------------------------
eval(E ⟨recover⟩ H) = Value(V)
```

For a deliberate decline:

```
eval(E) = Error(A)
invoke(H, observe(A)) = Declined
--------------------------------
eval(E ⟨recover⟩ H) = Error(A)
```

For a handler failure:

```
eval(E) = Error(A)
invoke(H, observe(A)) = Error(B)
--------------------------------
eval(E ⟨recover⟩ H) = Error(B)
```

These rules describe observable behavior, not a required interpreter
implementation.

### 4.2 The guarded expression is evaluated once

`E` is evaluated exactly once.

Recovery must not retry E or duplicate effects performed before its failure.

If E is a sequence:

```
{first; second; third} () ⟨recover⟩ H
```

and `second` fails:

- `first` has already executed.
- `second` produces the failure.
- `third` does not execute.
- `H` receives the failure.
- Recovery does not resume the interrupted sequence.

Recovery replaces the result of the guarded expression, not the failed statement
within it.

### 4.3 The handler is evaluated only on failure

If E succeeds, H is not invoked.

Any expression or computation required to construct H must not introduce effects
on the success path unless those effects are explicitly outside the recovery
boundary.

The first implementation should require H to be a closure or another value with
equivalent lazy invocation semantics.

### 4.4 Receiver dispatch versus special form

Spec 06 identifies a receiver-side protocol through which a receiver can accept
a failure that ordinary application would reject.

A use-site recovery operator should reuse that protocol where possible.

However, the implementation must demonstrate that:

1. The failure reaches the recovery receiver.
2. The receiver can invoke H without propagating the original error.
3. The recovery boundary applies the three outcome rules.
4. Ordinary expressions continue to obey spec 10.

If ordinary dispatch cannot satisfy these requirements, a narrowly defined
recovery evaluation boundary is preferable to an implicit evaluator-global
handler search.

This record does not mandate either implementation.

## 5. Chaining and nesting

Recovery operators compose left to right.

```
E ⟨recover⟩ H1 ⟨recover⟩ H2
```

### 5.1 Successful recovery ends failure propagation

If H1 recovers A to V, H2 is not invoked.

This includes recovery to nil.

### 5.2 Decline preserves the original error

If H1 declines A, H2 receives A.

It does not receive a newly manufactured error representing the decline.

### 5.3 Handler failure introduces a new error

If H1 fails with B while handling A, H2 receives B.

This supports ordinary recovery from a failed fallback.

### 5.4 A handler does not catch its own failure

The recovery boundary protects E, not H.

A failure inside H is not offered again to that same handler.

An enclosing recovery operator may handle it.

This preserves spec 11's avoidance of a13's masking and repeated-offer
machinery.

## 6. Error-kind matching

Typed handlers are useful, but recovery must not require a global change to
closure signature semantics.

### 6.1 Explicit matching first

The first version should support an explicit test of an observed error's kind.

Conceptually:

```
matches(observe(A), division-by-zero)
```

The exact HC spelling remains open.

A handler may recover a recognized error and decline an unrecognized one.

### 6.2 No implicit signature enforcement

Spec 11 demonstrates that closure signatures currently bind fields without
enforcing schema membership.

Changing this behavior for all closures is outside the scope of recovery.

The initial implementation must not depend on general signature enforcement.

Typed handler dispatch may be added later if signature semantics receive a
separate ruling.

### 6.3 Named error kinds

`$!.reason` is already a named error literal.

This record proposes that its reason be usable as an error-kind discriminator,
without requiring evaluation of the literal as an ordinary expression that would
itself propagate.

The matching contract must distinguish an error-kind descriptor from a newly
raised error.

The grammar and representation of that descriptor remain open.

## 7. Aggregates and collected failures

An aggregate that contains an error is not itself an error.

For example:

```
[(1 / 0), 7]
```

is a successful aggregate containing a failure.

A recovery operator applied to the aggregate as a whole must not inspect its
elements automatically.

```
[(1 / 0), 7] ⟨recover⟩ H
```

answers the aggregate unchanged.

H is not invoked.

If a later operation extracts the failing element, that operation may propagate
the error, and a recovery boundary around that operation may handle it.

This preserves the distinction between collecting a result and consuming it.

## 8. Finally and competing failures

Spec 11 defers `finally`, and this record retains that decision.

However, its eventual semantics must address competing failures.

Suppose an operation fails with A and cleanup fails with B.

Possible policies include:

1. Preserve A and discard B.
2. Replace A with B.
3. Preserve both through a compound diagnostic.

No policy is selected here.

The future design must also decide whether cleanup executes after a deliberate
recovery decline and how it interacts with recovered values.

These questions do not block use-site recovery.

## 9. Conformance matrix

The following cases are requirements for a future implementation. They use
abstract notation because operator spelling and decline syntax remain undecided.

| Case                | Expression                                   | Expected result     |
| ------------------- | -------------------------------------------- | ------------------- |
| Success             | `7 ⟨recover⟩ H`                              | `7`; H not invoked  |
| Recover             | `Error(A) ⟨recover⟩ {0}`                     | `0`                 |
| Recover to nil      | `Error(A) ⟨recover⟩ {()}`                    | `()`                |
| Decline             | `Error(A) ⟨recover⟩ {decline}`               | Original A          |
| Handler failure     | `Error(A) ⟨recover⟩ {Error(B)}`              | B                   |
| Chain after decline | `Error(A) ⟨recover⟩ {decline} ⟨recover⟩ {1}` | `1`                 |
| Chain after failure | `Error(A) ⟨recover⟩ {Error(B)} ⟨recover⟩ H`  | H receives B        |
| Chain after success | `Error(A) ⟨recover⟩ {1} ⟨recover⟩ H`         | `1`; H not invoked  |
| Collected failure   | `[Error(A), 7] ⟨recover⟩ H`                  | Aggregate unchanged |
| Extracted failure   | `([Error(A)] .0) ⟨recover⟩ {1}`              | `1`                 |
| Typed mismatch      | Handler declines unmatched kind              | Original error      |
| Typed match         | Handler recovers matched kind                | Replacement value   |

Additional tests must verify:

- E is evaluated exactly once.
- Effects preceding failure are preserved.
- Statements after failure do not execute.
- The original error remains available after decline.
- Observing an error does not change its failure status.
- A handler cannot catch its own failure without an enclosing recovery boundary.
- Existing conditional propagation behavior remains unchanged.
- Existing namespace anchors `$` and `$$` remain unchanged until a separate
  spelling decision.

## 10. Proposed rulings

The following answers are proposed for spec 11's review questions.

**Q3 — Handler failure:** A new handler failure replaces the original error.
Deliberate decline preserves the original.

**Q4 — Nil:** Nil is a valid recovery result. Decline requires an explicit
control outcome.

**Q5 — Handler argument:** The handler receives an inspectable observation
retaining access to the original error. Observation does not mutate the original
error or require converting it to text.

**Q6 — Error types:** Support explicit error-kind matching first. Do not change
general closure-signature semantics as part of recovery.

Q1 and Q2 retain spec 11's proposed two-behavior taxonomy and use-site-first
implementation.

Q7, operator spelling, remains undecided.

## 11. Open questions

This proposal still requires decisions on:

1. What HC value or operation represents deliberate decline?
2. How does an observation expose the original error for explicit re-raising?
3. What is the smallest error-kind matching protocol compatible with existing
   frames?
4. Can the receiver-side protocol implement the evaluation boundary without a
   new special form?
5. Does error observation need identity preservation beyond a reference to the
   original frame?
6. Which spelling expresses recovery without breaking existing namespace
   anchors?

The first implementation should resolve only what is necessary to make the
conformance matrix executable.

## 12. Scope

This record does not implement recovery.

It does not introduce declared default handlers, `finally`, generalized
signature enforcement, structured stack traces, error serialization, or
evaluator-global handler lookup.

Its purpose is to make the smallest recovery primitive precise enough to
implement and test without recreating a13's earlier complexity.

## B. Proposed Index Update

In `spec/a13-error-handle.md`, I would extend the existing index after spec 11:

```
- proposes recovery semantics for review.
+ proposes recovery semantics for review, and
+ [`12`](a13-error-handle/12-recovery-outcomes.md)
+ proposes recovery outcomes, error observation,
+ and evaluation boundaries.
```

## C. One Design Tension Worth Resolving

My strongest recommendation is the three-outcome distinction. However, it
introduces a potential conflict with HC's philosophy of having one verb and
avoiding additional control machinery.

The next design question is whether decline genuinely needs a new control
outcome, or can be expressed using the existing frame protocol while retaining
nil as a valid recovery result.

That is the part I would challenge most aggressively before ratifying this
follow-on spec.
