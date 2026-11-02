# Draft Spec 12b: Error Identity, Kind Matching, and Nil Recovery

Proposed file: `spec/a13-error-handle/12b-recovery-review-reply.md`

This follows
[12a](https://github.com/TheSwanFactory/hclang/blob/recovery-semantics-360/spec/a13-error-handle/12a-recovery-review-reply.md?utm_source=chatgpt.com)
as a review reply, rather than replacing it. The intent is to close three
semantic gaps without introducing new syntax or expanding the implementation
scope.

# Reply to 12a: Identity, Matching, and Nil Recovery

**Status:** Proposal for review, replying to 12a. Nothing here is implemented or
decided.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Baseline:** v0.39.0, `05b4f25`. No new runtime probes were performed for this
reply.\
**Prior:** 10, 11, 12, and 12a.

## 1. What this reply accepts

12a resolves the largest unnecessary complication introduced by 12: a separate
decline-control outcome.

This reply accepts 12a's proposals:

- **Decline is returning the original error.** No fourth result category or
  special decline operation is needed.
- **Nil is a valid recovery result.** A handler answering `()` has recovered
  successfully.
- **A handler's new failure wins.** If recovery itself fails, the new failure
  propagates.
- **The handler receives an observation.** The original error remains unchanged
  and accessible.
- **Error-kind matching is explicit.** Recovery does not require general
  closure-signature enforcement.
- **Existing schemas are candidate kind descriptors.** `<$!.reason>` may be
  sufficient without new grammar.

Three details need sharper rulings before these proposals can become executable
tests: error identity, matching semantics, and recovery to nil through
conditional handlers.

## 2. Decline requires identity, not equality

12a §2 defines decline as answering the original error A.

That must mean the **same error frame**, not an equivalent error value.

Two independent failures may have identical reasons and render identically:

```
$!.division-by-zero
$!.division-by-zero
```

Their source spellings are identical, but their evaluations may produce distinct
error frames.

A handler that constructs a new `$!.division-by-zero` has not returned the
original failure, even though the two errors have the same reason.

### 2.1 Proposed rule

Let A be the original error and R the handler's result.

```
R is not an error        => Recovered(R)
R is the same frame as A => Declined(A)
R is another error       => Failed(R)
```

Here, _same frame_ means runtime object identity, not HC's `=` comparison or
structural equivalence.

This classification does not require a source-level identity operator.

### 2.2 Observable behavior

Both declining and producing a new error propagate an error result. The
distinction is useful for explaining the semantics, but does not require a
separate runtime outcome tag.

```
eval(E) = Error(A)
invoke(H, observe(A)) = Error(A)
--------------------------------
eval(E ⟨recover⟩ H) = Error(A)
```

If H instead constructs B, even with the same reason:

```
eval(E) = Error(A)
invoke(H, observe(A)) = Error(B)
A and B are distinct frames
--------------------------------
eval(E ⟨recover⟩ H) = Error(B)
```

An outer handler receives the actual resulting frame in either case.

### 2.3 Identity must survive observation

The observation must expose the original frame, not a reconstructed copy.

If the handler reads the original error from its observation, that read may
propagate the error under spec 10. The recovery boundary then receives precisely
A.

The observation itself remains an ordinary non-propagating value.

This gives the observation two distinct capabilities:

1. Inspect the failure without propagating it.
2. Return the original failure when recovery is declined.

The mechanism for exposing the original remains an open spelling and protocol
question.

## 3. Error-kind matching should use the reason

12a §3 proposes using an existing schema containing a named error literal:

```
<$!.division-by-zero>
```

This reply supports that proposal, with one additional rule.

**An error observation matches an error-literal schema by the error's named
reason, not by its full rendered diagnostic.**

### 3.1 Why rendering is insufficient

Spec 10 distinguishes named error literals from diagnostic renderings that may
include subjects or other context.

For example, a missing-name failure may render with information about the name
that was requested.

That contextual information should not create a different error kind.

Conceptually:

```
observe($!.name-missing with subject X)
    ~ <$!.name-missing>
    => true
```

The exact HC source representation of the observation remains undecided.

### 3.2 Proposed matching rule

Let O be an observation of error A, and let K be a schema containing named error
literals.

```
O ~ K
```

answers truthy if K contains an error literal whose reason equals A's named
reason.

Otherwise it answers nil.

The comparison is between reasons, not frame identities.

### 3.3 Multiple error kinds

If existing schema semantics support a union of literals, matching should extend
naturally:

```
obs ~ <$!.division-by-zero, $!.numeric-range>
```

This should succeed when the observed error has either named reason.

No additional syntax for typed catch clauses is required.

### 3.4 Errors without a named reason

Spec 10 does not promise that every host-created diagnostic has a structured
named reason.

This reply does not invent one.

For errors without a reliably identifiable named reason, matching against a
named-error schema should answer nil rather than infer a kind from arbitrary
diagnostic text.

A future structured diagnostic protocol may extend matching without changing the
basic recovery rules.

### 3.5 Matching must not propagate

The left operand is the observation, not the original error.

Therefore:

```
obs ~ <$!.division-by-zero>
```

must be an ordinary operation that answers a truthy value or nil.

The error literal inside the schema is used as a descriptor, not evaluated as an
error-producing term.

The original error remains unchanged.

## 4. Typed recovery to nil must not fall through

12a §4 identifies an important interaction with HC's conditional semantics.

In HC, `:` operates on the result of the preceding expression, not on the
original condition.

Thus:

```
<> ? {()} : {“fell through”}
```

answers `“fell through”`, not nil.

A handler written as:

```
(obs ~ K) ? {()} : {original}
```

would decline even when K matches.

That contradicts the decision that nil is a valid recovery result.

### 4.1 The issue is conditional composition

This is not a defect in the recovery operator.

It follows from HC's existing meaning of `?` and `:`.

The recovery design should not change those operators merely to imitate
conventional ternary syntax.

Instead, the handler must use a composition that preserves a successful nil
result.

### 4.2 Required behavior

For a handler that recognizes kind K:

```
A has kind K     => recover to nil
A lacks kind K   => return original A
```

The matching branch must not be followed by an operation that interprets the
recovered nil as a reason to execute a fallback.

### 4.3 Possible implementation strategies

Several strategies remain available:

- A handler can use an existing control or closure composition that preserves
  nil as a final answer.
- A future matching receiver may select one of two lazy branches without testing
  the selected branch's result.
- The handler may arrange the unmatched case separately so that no `:` follows
  the successful nil result.

This reply does not select new conditional syntax.

The first implementation must demonstrate at least one valid HC expression that
satisfies the required behavior.

If no existing composition can express it, that is a concrete language-design
dependency to resolve before claiming typed recovery is complete.

## 5. Conformance additions

These tests amend 12 §9 and 12a §4.

The notation is conceptual until the observation protocol and recovery operator
have source spellings.

| Case                       | Handler behavior                          | Required result     |
| -------------------------- | ----------------------------------------- | ------------------- |
| Same-frame decline         | Returns original A                        | Original A          |
| Same-reason new failure    | Constructs distinct B with A's reason     | B                   |
| Observation identity       | Extracts original A                       | Same runtime frame  |
| Named kind match           | Observes A of kind K                      | Truthy              |
| Named kind mismatch        | Observes A of another kind                | Nil                 |
| Subject-bearing diagnostic | A has kind K and subject metadata         | Matches K           |
| Multiple kinds             | K contains two named reasons              | Matches either      |
| Unnamed diagnostic         | No reliable named reason                  | No named-kind match |
| Typed recovery to nil      | Kind matches and handler answers nil      | Nil                 |
| Typed mismatch             | Kind does not match and handler returns A | Original A          |

### 5.1 Required regression properties

The implementation must also verify that:

- Observing an error never clears its error flag.
- Matching an observation never raises the observed error.
- Matching does not depend on diagnostic rendering.
- Returning the original error preserves frame identity.
- Constructing a same-reason error does not reuse the original frame
  accidentally.
- A nil recovery does not trigger an unmatched fallback branch.
- Chained recovery receives the exact error returned by the preceding handler.

## 6. What this reply does not add

This reply introduces no new HC source syntax.

It does not require:

- A dedicated decline result.
- A source-level identity operator.
- Global signature enforcement.
- A new error-kind descriptor grammar.
- Structured stack traces or causal metadata.
- Changes to `?` or `:`.
- Scope-declared handlers.
- `finally` semantics.

The recovery boundary still needs a concrete implementation, and the observation
still needs a source-level protocol.

Those are implementation questions rather than reasons to add another control
outcome.

## 7. Proposed rulings

This reply proposes three additions to 12a.

**R1 — Decline identity.** A handler declines by returning the exact original
error frame. Equality of error reasons or renderings is insufficient.

**R2 — Kind matching.** An error observation matches a schema containing named
error literals by reason. Diagnostic subjects do not affect the match.

**R3 — Nil recovery.** Typed recovery must be able to answer nil successfully
without triggering an unmatched fallback branch. Existing conditional semantics
remain unchanged.

These rulings preserve 12a's central simplification: handlers answer ordinary
values or errors, and recovery does not require a fourth result category.

## 8. Remaining questions

Three questions remain immediately relevant to implementation:

1. **Observation protocol:** What existing HC operation, or minimal extension,
   exposes the original error frame and its reason without propagating during
   inspection?
2. **Receiver dispatch:** Can the recovery receiver accept an error through the
   existing frame protocol, or must the evaluator recognize a narrowly defined
   recovery boundary?
3. **Nil-safe handler composition:** What concrete HC expression implements
   kind-specific recovery to nil while preserving the original error on
   mismatch?

Operator spelling remains deferred until these semantics have executable
examples.

The next useful step is a small runtime spike that answers these questions
against the existing interpreter, rather than another abstract recovery
mechanism.

## B. Review Note

I would keep R1 and R2 as proposed rulings, but treat R3 as a conformance
requirement rather than a mandate for a new language feature.

There is also one subtle distinction worth preserving: classifying a newly
constructed same-reason error as failed is a semantic description, not
necessarily a runtime branch the interpreter must execute. The recovery operator
only needs to propagate the handler's actual result. Identity becomes important
when explaining and testing whether the original error was preserved.
