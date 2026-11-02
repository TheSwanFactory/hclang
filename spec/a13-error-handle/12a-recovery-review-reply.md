# Reply to 12: Decline Without a New Outcome

**Status:** Proposal for review, replying to [12](12-recovery-review.md).
Nothing here is implemented or decided.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Baseline:** v0.39.0, `05b4f25`. Probes were run there with
`deno task hc -e '<source>'`.\
**Prior:** [11](11-recovery-semantics.md) and [12](12-recovery-review.md).

## 1. What this reply accepts from 12

These proposals from 12 replace the corresponding parts of 11:

- **Three outcomes** (12 §2). A handler recovers, declines, or fails, and the
  three stay distinguishable. This replaces 11 §4.
- **Nil is a valid recovery** (12 §2.1). a13 D5's "nil declines", and the cost
  11 §4 recorded with it (no recovery to nil), are withdrawn.
- **A handler's own failure wins** (12 §2.3, Q3). a13 D5 kept the original
  failure so that broken handler code could not overwrite it. That reason was
  for scope-declared handlers, which an author may never have seen. A use-site
  handler is code the author wrote around the expression, so its failure is a
  bug worth surfacing, and an outer recover can still catch it.
- **An observation, not a defused error** (12 §3, Q5). The handler receives a
  value that can be inspected without propagating, and it keeps a reference to
  the original error. The original is never mutated. This makes precise 11 §6
  option 1, which left open whether the error itself changes.
- **Explicit kind matching first** (12 §6, Q6). Recovery does not depend on
  closure signatures checking their schemas. Signature checking is a separate
  language change, if it happens at all.
- **The conformance matrix** (12 §9) is the test list for a first
  implementation, amended as §4 below.

## 2. Decline is answering the original error

12 introduces decline as a fourth kind of result, a recovery-control outcome
that is neither a value nor an error (12 §2.2), and its own §C names that as the
part to challenge. This reply proposes that no such outcome is needed.

The observation keeps a reference to the original error A (12 §3.3, §3.4). A
handler that reads A through it gets A, and reading an error ends the handler's
own expression with that error, as spec 10 already requires. So the handler's
result is `Error(A)`, and 12's handler-failure rule (§4.1) makes `Error(A)` the
result of the boundary:

```
eval(E) = Error(A)
invoke(H, observe(A)) = Error(A)      H answered the original
--------------------------------
eval(E ⟨recover⟩ H) = Error(A)
```

That is exactly 12's decline rule. Chaining gives the same answer too: by 12
§5.3 the next handler receives whatever error the previous one left, and here
that is A, which is what 12 §5.2 requires of a decline.

So decline is "answer the original error", re-raise is the same thing, and fail
is "answer some other error". The three outcomes remain distinct by what the
boundary receives:

| Handler answers  | Outcome   | Result     |
| ---------------- | --------- | ---------- |
| A value, nil too | Recovered | That value |
| The original A   | Declined  | A          |
| Another error B  | Failed    | B          |

This keeps HC's one verb. A handler is an ordinary closure whose answer is an
ordinary value or error, and the boundary needs no result type of its own.

**What it gives up.** 12 §2.4 distinguishes declining from deliberately
re-raising the original, "for future diagnostics and provenance". Under this
reply they are the same act. Nothing in 11, 12 or the corpus uses the
distinction, so it can be added later if a diagnostic needs it, as a property of
the observation rather than as a new outcome.

**What it requires.** The observation must expose A in a form that is the
original error, not a copy rebuilt from text (12 §3.3). Whether that is a
property read (`obs .error`), application, or something else is part of 12's
open question 2, and answering it also answers 12's open question 1.

## 3. The kind descriptor may already exist

12 §6.3 asks for an error-kind descriptor that names a reason without raising
it, and leaves its grammar open (open question 3). A schema holding a named
error literal already behaves that way:

```
<$!.division-by-zero>             => <$!.division-by-zero>
5 ~ <$!.division-by-zero>         => ()
(1 / 0) ~ <$!.division-by-zero>   => $!.division-by-zero /
```

The schema builds without propagating, and an ordinary value is matched against
it. Only an error on the left fails, because it propagates before `~` runs.

So kind matching could be `obs ~ <$!.division-by-zero>`, with one rule to add:
an observation matches a schema of error literals by its reason. That needs no
new grammar. It also extends to several kinds at once,
`obs ~ <$!.division-by-zero, $!.numeric-range>`, if schemas of literals keep
their ordinary union meaning.

Open: whether an error whose rendering carries a subject
(`$!.name-missing “…”;`) matches `<$!.name-missing>` by its reason alone. Spec
10 §6.2 makes every `$!.label` prefix the literal, so matching by reason is
consistent with it.

## 4. Amendments to 12's conformance matrix

With decline defined as answering the original, the rows read:

| Case                | Expression                                          | Expected result            |
| ------------------- | --------------------------------------------------- | -------------------------- |
| Decline             | `Error(A) ⟨recover⟩ {original}`                     | A                          |
| Chain after decline | `Error(A) ⟨recover⟩ {original} ⟨recover⟩ {1}`       | `1`                        |
| Typed mismatch      | `Error(A) ⟨recover⟩ {(obs ~ K) ? {0} : {original}}` | A, when A is not of kind K |
| Typed match         | `Error(A) ⟨recover⟩ {(obs ~ K) ? {0} : {original}}` | `0`, when A is of kind K   |

`original` and `obs` are placeholders for the handler's access to A and to its
observation. The other rows of 12 §9 are unchanged.

**A pitfall the typed rows expose.** In `c ? {t} : {f}`, `:` tests the result of
the then-branch, not `c` (the a14 nil-then edge). So a typed handler that
recovers to nil, `(obs ~ K) ? {()} : {original}`, falls through to `original`
and declines on a match:

```
<> ? {()} : {“fell through”}      => “fell through”
<> ? {0} : {“fell through”}       => 0
```

12 §2.1 makes recovery to nil valid, so this spelling silently does the opposite
of what it says. The fix is a handler shape that does not route a nil recovery
through `:`. Choosing one belongs with 12's matching protocol, and the matrix
should include a recover-to-nil-on-match row so that the choice is tested.

## 5. Questions this leaves

1. How does a handler reach the original error from its argument? (12 open
   question 2, which now answers question 1 as well.)
2. Does an observation match a schema of error literals by reason, including
   errors whose rendering carries a subject?
3. Is a decline/re-raise distinction needed for any diagnostic now? This reply
   assumes not.

12's remaining open questions, on the receiver-side protocol, identity beyond a
reference, and spelling, are unchanged.
