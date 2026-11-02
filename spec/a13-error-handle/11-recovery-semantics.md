# Recovery Semantics: What a Program Can Do With a Failure

**Status:** Proposal for review. Nothing here is implemented or decided; §9
lists the questions reviewers are asked to answer.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360),
especially
[the 2026-11-02 comment](https://github.com/TheSwanFactory/hclang/issues/360#issuecomment-6570926133).\
**Baseline:** v0.39.0, `05b4f25` (master after
[#472](https://github.com/TheSwanFactory/hclang/pull/472)). Every probe below
was run there with `deno task hc -e '<source>'`.\
**Prior:** the [a13 design record](../a13-error-handle.md) (D1–D13 and its Open
list), [06](06-applying-a-failure.md) (the receiver-side question),
[08](08-handler-spelling.md) (handler spelling), and
[10](10-unified-diagnostic-failures.md) (v0.39.0's propagation rules).

## 1. Where things stand

v0.39.0 made failures propagate consistently. Every diagnostic failure is an
error value, and an expression stops at the first term that is one:

```
(1 / 0) ? {1} : {2}             => $!.division-by-zero /
((1 / 0) ? {1} : {2}) : {3}     => $!.division-by-zero /
{1 / 0; 42} ()                  => $!.division-by-zero /
[(1 / 0), 7] .1                 => 7
[(1 / 0)] ? {1} : {2}           => 1
```

An aggregate that collected a failure is an ordinary present value, and only the
failure itself propagates.

The #360 comment proposed two things:

1. `?` and `:` given an error answer that error. **Done in v0.39.0** (spec 10
   §4.1).
2. A `$` operator that catches any error and can handle it. The follow-up
   direction was that the handler block is **called with the actual error**,
   that `$` replaces a13's `.on-fail` handler, and that `$$` replaces its
   `.$recover` alternative.

Nothing can recover today. A handler written as an ordinary closure never runs,
because the error ends the expression before the closure is applied:

```
{“caught”} (1 / 0)              => $!.division-by-zero /
.h {“caught”}; h (1 / 0)        => … $!.division-by-zero /
[.on-fail {0}; 1 / 0]           => [.on-fail { 0 }; $!.division-by-zero /]
```

The last line shows that a13's declared handler is unimplemented: `.on-fail` is
just a property.

## 2. Two behaviors, two attachment sites

The candidates discussed so far were an "otherwise" block used with
conditionals, a "finally" block, and default handlers that are usually typed by
argument. They reduce to two behaviors, each of which could be attached in two
places:

| Behavior    | What it does to the result                                     | When it runs    |
| ----------- | -------------------------------------------------------------- | --------------- |
| **Recover** | Replaces the error with the handler's answer, or declines (§4) | Only on failure |
| **Finally** | Leaves the result unchanged, whether it is a value or an error | Always          |

| Attachment              | Spelled                                    | Found by                    |
| ----------------------- | ------------------------------------------ | --------------------------- |
| **Use site**            | After the expression it guards: `E ⟨op⟩ H` | Position; it runs once      |
| **Declared on a scope** | A property any failure underneath finds    | Outward lookup (a13 D1, D2) |

`⟨op⟩` is a placeholder; spelling is §8.

"Otherwise" and "default handler" are the same behavior, recover, at the two
attachment sites. A typed handler is recover with a handler that declines
arguments outside its type (§5), at either site. Finally is the only different
behavior: it never decides the result.

### 2.1 The conditional "otherwise" needs no special form

Since v0.39.0 a conditional answers an error operand unchanged, so a use-site
recover written after it handles the failure with no change to `?` or `:`:

```
((1 / 0) ? {1} : {2}) ⟨op⟩ {0}  => 0      proposed
```

The same operator works after any expression. a13 D11 already ruled out a third
leg on the ternary, and nothing here needs one.

## 3. Recover at the use site (proposed first)

`E ⟨op⟩ H`, where `H` is a closure:

- **E is not an error.** The answer is `E`. `H` is not evaluated.
- **E is an error.** `H` is called with the error (what it receives is §6). Its
  answer replaces `E`, unless it declines (§4).
- **Sequences.** `{a; b; c} () ⟨op⟩ H` recovers from the first failing
  statement. The statements before it have run, and their effects stay; the
  statements after it never run.
- **Aggregates.** `[E, 7] ⟨op⟩ H` answers the aggregate. It is not an error, so
  `H` does not run. This matches a13 D9 (collecting opts out of recovery).
- **Chaining.** `E ⟨op⟩ H1 ⟨op⟩ H2` tries `H1`, and `H2` sees whatever `H1`
  leaves. If declining leaves the original error, chaining gives ordered,
  catch-clause-style handlers with no extra syntax.
- **Nesting.** If `H` itself fails, that failure is the result of `E ⟨op⟩ H` and
  an outer recover can see it. Whether the handler's failure or the original one
  wins is question Q3.

A use-site recover avoids most of a13's machinery:

- **No repeated offers.** It runs once, where it is written, so a13 D7's
  re-offer cost (which grew as 4ⁿ with n nested handlers) does not arise.
- **No masking.** A failure inside `H` is not caught by the same `H`, because
  `H` guards only `E`. a13 D8's parse-site masking does not arise.
- **No hijacking.** Only code the author wrapped is guarded, so a frame in the
  lookup chain cannot install recovery for code it did not write (a13 Open,
  "whether the key must be reserved").
- **Receiver-side shape.** The operator is a receiver that accepts an error as
  its argument, which is the protocol spec 06 §2 says already exists in
  `Frame.error.called_by` and `collects()`. It needs one more receiver to opt
  in, not an evaluator-global handler search.

## 4. Declining

a13 D5 lets a handler decline by answering nil, an error, or a note, or by
failing; all four leave the original failure. Carrying that over gives typed
handlers and chaining (§3, §5) for free. Its cost, which D5 states, is that a
program cannot recover to nil.

The alternative is that every answer, nil included, replaces the error. Recovery
to nil becomes possible, and partial handlers need an explicit re-raise (§6).

## 5. Typed handlers

A handler typed by its argument would decline whenever the error does not match.
With declining (§4) and chaining (§3), that gives catch clauses:

```
E ⟨op⟩ ((.e <$!.division-by-zero>) ^ {0}) ⟨op⟩ ((.e <$!.name-missing>) ^ {“?”})
```

(proposed)

Two pieces of this do not work today.

**Signatures do not check types.** A closure signature binds its fields but does
not refuse an argument outside the declared schema:

```
.f (.e <1, 2>) ^ {e}; f (.e 5)            => … 5
```

So "decline on mismatch" needs signatures to check, at least for handlers.

**A schema can name an error, but nothing can be matched against it.** The
schema builds, and an ordinary value is matched against it, but an error on the
left propagates before the match runs. Errors cannot be compared either:

```
<$!.division-by-zero>                     => <$!.division-by-zero>
5 ~ <$!.division-by-zero>                 => ()
(1 / 0) ~ <$!.division-by-zero>           => $!.division-by-zero /
$!.division-by-zero = $!.division-by-zero => $!.division-by-zero
```

So typed handlers depend on §6: the handler's argument must be something a match
can read without propagating.

## 6. What the handler receives

The direction is that `H` is called with the actual error. a13 D6 explains why
that does not work unchanged. Inside `H`, reading its argument `_` produces an
error, the per-term check ends `H`'s own expression, and `H` can only return the
error or ignore it. a13 therefore passed the reason as text. Three options:

1. **A defused error.** `H` receives the same error value with its error flag
   off. It prints like the error and can be compared and matched, but it does
   not propagate. Answering it is a success, so declining needs nil (§4) or an
   explicit re-raise, which is `$!.reason` or an operation still to be named.
2. **Non-propagating reads.** The argument stays an error, but a small set of
   observations on it answer instead of propagating, for example `.reason` as
   text and a schema match. Everything else still propagates. This adds an
   exception to spec 10's rule that an expression stops at the first error term.
3. **The reason as text** (a13 D6). It is simple and needs no carve-out, but the
   handler never sees the error, which is what was asked for.

## 7. Declared default handlers and finally

**Declared default handlers** are a13's design: a property such as `.on-fail`
that any failure underneath finds by lookup. The direction "`$` replaces
`.on-fail`, `$$` replaces `.$recover`" names this site. Everything a13 D7, D8
and its Open list worry about belongs to it: repeated offers, masking a handler
from its own failures, frames in the lookup chain installing handlers, and
whether the key must be reserved. Use-site recover (§3) covers the same cases
when the author can wrap the code. Defaults remain useful when they cannot, for
example a module that wants one policy for every failure in it.

**Finally** would run after its block whether the block succeeded or failed, and
answer the block's result unchanged. HC has no non-local exits: the only thing a
failure skips is the rest of a sequence, as in `{open; use; close}` stopping at
`use`. Finally would exist to run `close` anyway. This spec has no example
program that needs that; a reviewer who has one should add it here.

Proposal: defer both until a program needs them, and build use-site recover
first. Both can be added later without changing §3.

## 8. Spelling

The proposed `$` and `$$` are already the scope anchors (`doc/GRAMMAR.md`,
"Scope anchors"). `$` is the current file or module namespace and `$.x` reads a
top-level property; `$$` is the host namespace and `$$.x` reads a host binding.
The test suite uses `$$` throughout (for example `$$.tick ()`). After an
operand, a bare `$` is already the argument of an application:

```
$                               => $
5 $                             => $
(1 / 0) $ {0}                   => $!.division-by-zero /
```

Options:

1. **Position.** `$` after an operand is the recover operator; leading `$`,
   `$.x` and `$$.x` stay namespaces. Small, but `x $` (applying a value to the
   file namespace) stops meaning that.
2. **Move the namespaces** to another spelling, freeing bare `$` and `$$`.
   Clean, but breaking across tests and docs.
3. **Another operator spelling** for recover. 08 and 07 §1 price the candidates
   for the declared-handler key; an operator is a different lexical class and
   would need its own survey.

The spelling is the last thing to choose. Questions Q1–Q6 do not depend on it.

## 9. Questions for reviewers

- **Q1. Shape.** Does "two behaviors × two attachment sites" (§2) cover the
  space, or is there a third behavior folded away here?
- **Q2. First version.** Use-site recover only (§3), with declared defaults and
  finally deferred (§7)?
- **Q3. Handler failure.** When `H` fails, does its failure or the original one
  become the result? a13 D5 keeps the original.
- **Q4. Declining.** Does nil decline (a13 D5), at the cost of never recovering
  to nil (§4)?
- **Q5. The argument.** Defused error, non-propagating reads, or text (§6)?
- **Q6. Error types.** Should handler signatures check their schemas, and is
  `<$!.reason>` the way to name an error kind (§5)?
- **Q7. Spelling.** Which option in §8, once Q1–Q6 are settled?

## 10. Not in scope

M-3 (#361), which turns numeric fallbacks into errors, is sequenced by a13 D13
and not changed here. Neither are effect ordering, capability delegation, or the
combination-step guard brief in 09, beyond noting in §3 that a use-site operator
needs no evaluator-global search.
