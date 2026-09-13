# Recovery Spike Findings

**Status:** Answers to [`a13a`](a13a-recovery-spike.md) §4, taken at spike
branch commit
[`a4471f9ef3cd8420531bafae52422068e8e7892f`](https://github.com/TheSwanFactory/hclang/commit/a4471f9ef3cd8420531bafae52422068e8e7892f)
on `a13a-recovery-spike`. That commit is the only link back to the code, which
is not merged and is not meant to be.\
**Design record:** [`a13`](a13-error-handling.md), unedited. Every contradiction
is listed under [`## Contradicts a13`](#contradicts-a13).\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).

## How to reproduce

The handler is spelled `.recover`, not `.$:` (a13a §3, a13 §10). Three commands
produce everything quoted below:

```
deno test lib/frames/recovery.test.ts --allow-env --allow-read --allow-write
cd cli && deno task hc hc/recovery-spike.hc -t
deno run --allow-all lib/frames/recovery.cost.ts
```

The corpus is unregistered, as a13a §5 requires. Its 38 examples pass:

```
$=.test-summary “HCTest”; .n “{"total":38,"pass":38,"fail":0,"unimplemented":0}”;
```

The test file passes 41 steps:

```
ok | 1 passed (41 steps) | 0 failed (31ms)
```

Two switches exist only so the questions can be answered from a run rather than
from reading the reduce: `setRecoverySites` selects which boundaries attempt
recovery, and `setRecoveryGuard` selects the masking rule. Production code would
carry one of each and delete both.

## Q1

**One site, and it is not one of the three a13a lists.**

a13a enumerates three boundaries and says a13 addresses the first. The first
boundary is not where failures come from. `evaluateTerms` checks a term's
_value_ for `is.error`, but a term only _evaluates_ to a failure when it is a
parenthesized subexpression or a name already bound to one. The most basic
failing expression in the language, `1 / 0`, fails one line lower — at
`sum.call(value)`, where the curried divide meets its second operand — and
nothing looks at the result of that step at all. Wiring a13 §6's site alone
therefore recovers `(1 / 0)` and not `1 / 0`:

```
recovers a parenthesized failure at a13 §6's site alone ... ok (2ms)
does not recover a bare `1 / 0` at a13 §6's site alone ... ok (0ms)
recovers it once the combination step is wired too ... ok (0ms)
```

```ts
withSites(["term"], () => {
  expect(last(".recover {0};", "(1 / 0)")).toEqual("0");
});
withSites(["term"], () => {
  expect(last(".recover {0};", "1 / 0")).toEqual("$!.division-by-zero /");
  expect(recoveryCalls()).toEqual(0);
});
withSites(["term", "apply"], () => {
  expect(last(".recover {0};", "1 / 0")).toEqual("0");
});
```

The comparison that settles it is the whole corpus run under each site in
isolation, by editing the default in `recovery.ts` and re-running
`hc/recovery-spike.hc -t`. The combination step alone passes everything; a13's
site alone fails 14 examples of the 36 it manages to reach:

```
const sites = new Set<RecoverySite>(["apply"]);
{"total":38,"pass":38,"fail":0,"unimplemented":0}

const sites = new Set<RecoverySite>(["term"]);
{"total":36,"pass":22,"fail":14,"unimplemented":0}

const sites = new Set<RecoverySite>(["term", "apply"]);
{"total":38,"pass":38,"fail":0,"unimplemented":0}
```

The 14, verbatim, because the list is the shape of what a13's site misses —
every arithmetic failure, every resource read, every signature refusal, and
every handler body that needed to be reached at all:

```
$-.test-fail ““{.recover {0}; 1 / 0} ()” ?“0” !“$!.division-by-zero /””
$-.test-fail ““{.recover {_}; 1 / 0} ()” ?““division-by-zero”” !“$!.division-by-zero /””
$-.test-fail ““{.recover {_}; './missing.txt' | “”} ()” ?““resource-absent”” !“$!.resource-absent './missing.txt'””
$-.test-fail ““{.recover {“(defaults)”}; './missing.txt' | “”} ()” ?““(defaults)”” !“$!.resource-absent './missing.txt'””
$-.test-fail ““{.recover {_ = “resource-absent” ? {“(defaults)”}}; './missing.txt' | “”} ()” ?““(defaults)”” !“$!.resource-absent './missing.txt'””
$-.test-fail ““{.recover {“recovered from ” _}; 1 / 0} ()” ?““recovered from division-by-zero”” !“$!.division-by-zero /””
$-.test-fail ““{.recover {_ = “division-by-zero” ? {“saw ” _}}; 1 / 0} ()” ?““saw ”” !“$!.division-by-zero /””
$-.test-fail ““{.recover {.r _; r = “division-by-zero” ? {“saw ” r}}; 1 / 0} ()” ?““saw division-by-zero”” !“$!.division-by-zero /””
$-.test-fail ““{.recover {'./backup.txt' | “”}; './primary.txt' | “”} ()” ?““from backup”” !“$!.resource-absent './primary.txt'””
$-.test-fail ““{.recover {“outer”}; {.recover {“inner”}; 1 / 0} ()} ()” ?““inner”” !“$!.division-by-zero /””
$-.test-fail ““{.recover {“outer”}; {.x 1; 1 / 0} ()} ()” ?““outer”” !“$!.division-by-zero /””
$-.test-fail ““[.recover {0}, 1 / 0]” ?“[.recover { 0 }; 0]” !“[.recover { 0 }; $!.division-by-zero /]””
$-.test-fail ““{.recover {7}; './missing.txt' | “”} ()” ?“7” !“$!.resource-absent './missing.txt'””
$-.test-fail ““{.recover {_}; join-name (.middle “Q”)} ()” ?““invalid-argument-list”” !“$!invalid-argument-list (.middle “Q”, $!missing-required-argument .last;)””
```

The spike keeps both sites wired, because the per-term check is cheap and does
catch a term whose value is already a failure — a visibility refusal, for
instance, is returned by `FrameSymbol.in` rather than produced by an
application. But **no example was found that the combination step misses and the
per-term check catches.** That is a search that came up empty, not a proof: a
name bound to a failure would be such a case, and with recovery live it is hard
to construct one, because the binding recovers first.

With the combination step wired, the other two boundaries a13a names have
nothing left to do.

`evaluateBody` (`:62`) is unnecessary, because a statement that would have
failed no longer does:

```
needs no statement-sequence site: the statement no longer fails ... ok (0ms)
```

```ts
withSites(["term", "apply"], () => {
  expect(last(".f {.recover {0}; 1 / 0; “next”};", "f ()")).toEqual("“next”");
  expect(recoveryCalls()).toEqual(1);
});
```

Wiring it instead of the others recovers a closure body's statement sequence and
nothing else — file-scope statements are an aggregate reduce rather than an
`evaluateBody` sequence, so `.recover {0}` followed by `1 / 0` at file scope is
not recovered by the body site at all:

```
[body]           "$!.division-by-zero /" calls 0
[term]           "$!.division-by-zero /" calls 0
[apply]          "0" calls 1
[term+apply]     "0" calls 1
---
[body]           "“next”" calls 1
[term]           "$!.division-by-zero /" calls 0
[apply]          "“next”" calls 1
[term+apply]     "“next”" calls 1
```

(First block: `.recover {0}` then `1 / 0` at file scope. Second: the same inside
a closure body.) So the body site is both coarser — it can only substitute for a
whole statement — and narrower. It is not an alternative.

`bound-method.ts:100` is unnecessary for the same reason, and additionally has
no scope to look up from: `BoundMethod.call` holds a receiver, an argument, and
a `FrameLazy`, and the closure's captured scope lives in a module-private
`WeakMap`. There is no enclosing `EvaluationScope` at that site to walk. It
never needs one, because a method body's own reduce recovers first:

```
leaves nothing for the bound-method boundary to recover ... ok (2ms)
```

```
$+.test-pass ““[constant_.change_ 2]” ?“[($error{$is-constant .Value});]””
$+.test-pass ““{.recover {“handled”}; constant_.change_ 2} ()” ?““handled”””
```

**Recovery is not attempted once.** a13 §6 says it is. It is attempted once per
enclosing reduce that an unrecovered failure passes through, and each attempt
re-runs the handler body:

```
re-runs a declining handler once per enclosing reduce ... ok (1ms)
and once more for each further level of nesting ... ok (0ms)
```

```ts
expect(last(".recover {()};", "(1 / 0)")).toEqual("$!.division-by-zero /");
expect(recoveryCalls()).toEqual(4);

expect(last(".recover {()};", "((1 / 0) + 5)")).toEqual(
  "$!.division-by-zero /",
);
expect(recoveryCalls()).toEqual(5);
```

Four calls for `(1 / 0)`: the group's own reduce, then the group as a term of
the statement, then the statement, then the file-scope reduce. A handler that
answers is consulted once, because the failure stops existing. A handler that
declines is consulted at every level, and handler bodies are ordinary HC that
may write resources, so this is observable and not merely wasteful.

## Q2

**The lookup neither recurses nor fails, and a13a's premise for the question is
false.**

a13a says "a missing name answers `$!.name-missing`, so resolving the key when
no handler exists produces an error value — inside the code path that reacts to
error values". It does not. `FrameSymbol.in` answers `FrameNote.key(…)`, and
`FrameNote` sets `is.note`; it sets `is.missing` only when the sigil has no
label in `FrameNote.LABELS`, and `!` has one. So a name-missing note carries
neither `is.error` nor `is.missing`, and `isFailedResult()` is false for it:

```
answers a note, not an error, when no handler is declared ... ok (0ms)
```

```ts
const answer = FrameSymbol.for(RECOVERY_KEY).in(
  EvaluationScope.root(new Frame()),
);
expect(answer.is.note).toEqual(true);
expect(answer.is.error).toBeUndefined();
expect(answer.isFailedResult()).toEqual(false);
```

There is no re-entry to guard against on this path, and no guard was needed for
it. A program with no handler declared is unchanged — the whole existing suite
and every registered corpus pass with no edits, and a failure with nothing in
scope answers exactly what it answered before:

```
leaves an undeclared failure exactly as it was ... ok (0ms)
```

The same fact has a second consequence, which is not about the lookup: a bare
missing name is not a failure, so no handler is ever consulted for one.

```
$+.test-pass ““{.recover {0}; nope-name} ()” ?“$!.name-missing “$:Frame.0.nope-name”;””
```

A guard _is_ needed, for the reason in Q3, and it cannot be a field on
`EvaluationScope`. The handler's body runs in a scope built by
`EvaluationScope.call` from the closure's own captured scope; the failing term's
scope is not in that chain and nothing set on it is visible inside the handler.
The spike uses interpreter-global state — a set of running handler templates
plus a depth counter — which is a sentinel, not a scope field and not a
per-scope flag.

## Q3

**Masking is required, both candidate rules terminate, and they differ
observably.**

Without masking, a13 §9's predicted recursion is exactly what happens:

```
recurses without bound when nothing masks the handler ... ok (9ms)
```

```ts
withGuard("none", () => {
  expect(() => lines(".recover {1 / 0};", "(1 / 0)")).toThrow(RangeError);
});
```

The thrown value, caught and printed rather than asserted, is

```
RangeError: Maximum call stack size exceeded
```

Both rules a13 §9 leaves open stop it, and both leave the original failure
standing:

```
terminates under value masking, and the original survives ... ok (1ms)
terminates under key masking too, and re-consults per enclosing reduce ... ok (0ms)
```

Identity masking needs one implementation note that a13 does not anticipate:
`FrameSymbol.in` hands out a fresh bound copy on every read, so "that exact
handler value" is never the same object twice. The spike compares the shared
closure template — `FrameList.copy` reuses the term objects, so the first term
of the body is stable across copies. Masking "by exact handler value" is
therefore implementable only against the template, not against the value the
scope answered.

The two rules differ on one case, which is the case a13a Q6 asked for as its
fifth handler body — a handler nested inside another handler's scope:

```
value masking lets a handler's body be recovered by a different handler ... ok (0ms)
key masking refuses that, so the original failure survives ... ok (0ms)
```

```ts
// value masking
expect(
  last(".recover {.g {.recover {“inner”}; (1 / 0)}; (g ())};", "(1 / 0)"),
).toEqual("“inner”");
// key masking
expect(
  last(".recover {.g {.recover {“inner”}; (1 / 0)}; (g ())};", "(1 / 0)"),
).toEqual("$!.division-by-zero /");
```

Key masking makes any recovery declared inside a handler body dead code —
including recovery inside a helper the handler merely calls, which the author of
that helper cannot see coming. Value masking keeps it working, and the argument
that it still terminates is that depth is bounded by the number of distinct
handler templates, since each is masked while it runs; the spike measured one
such case rather than proving the bound. **Value masking is the rule with the
better behavior; key masking is the rule with the surprising consequence.** The
spike defaults to key masking only because it is the smaller change, and that
default is a convenience, not a recommendation.

Neither rule is engaged by ordinary shadowing, which is worth stating because it
is easy to mistake for the same case. The nearest declaration wins by ordinary
name lookup, with no masking involved:

```
nearest-wins needs no masking at all: neither guard is engaged ... ok (1ms)
```

```
$+.test-pass ““{.recover {“outer”}; {.recover {“inner”}; 1 / 0} ()} ()” ?““inner”””
$+.test-pass ““{.recover {“outer”}; {.x 1; 1 / 0} ()} ()” ?““outer”””
```

A handler whose body reads the binding that declared it terminates and answers
the closure, because the read is a read and not a call:

```
terminates when the handler reads the binding that declared it ... ok (0ms)
```

**One case escapes masking entirely, and it is a hole in a13 §9's ruling.** §9
names "a missing name" as an example of a handler failing on its own, whose
failure is to be discarded so the original survives. A missing name is not a
failure (Q2), so the ruling does not reach it: the note is neither nil nor an
error, so it counts as an answer and is substituted for the real refusal.

```
treats a missing name in the handler body as a successful answer ... ok (0ms)
```

```
$ deno task hc -e '{.recover {nope-name}; 1 / 0} ()'
$!.name-missing “$:FrameString.154.nope-name”;
```

The `division-by-zero` is gone, replaced by a note about the recovery code — the
precise outcome §9 was written to prevent. (The note's id varies per run, so the
test pins its shape.)

## Q4

**Yes, entirely. The unmodified behavior is that a handler is ordinary data in
every respect.** None of it is changed by the spike; `visibleKeys` and the
iterators were not touched.

```
prints in an aggregate's rendering, as a13's tutorial shows ... ok (0ms)
appears in visibleKeys, so a doubled stream carries it ... ok (0ms)
is not an element, so a single stream leaves it out ... ok (1ms)
is not hidden from a doubled stream either ... ok (0ms)
```

Directly, on an evaluated aggregate:

```
visibleKeys() -> ["recover"]
elements()    -> ["1"]
toString()    -> [.recover { 0 }; 1]
```

and through the language:

```
$+.test-pass ““[.recover {0}, 1]” ?“[.recover { 0 }; 1]””
$+.test-pass ““[.recover {0}, 1] && {_ .0}” ?“[.recover, .0]””
$+.test-pass ““[.recover {0}, 1] & {_}” ?“[1]””
```

So a13's tutorial rendering (`[.$: {0}; 0]`) is accurate: declaring recovery
changes what the value prints as and what a doubled stream yields. It does not
change `elements()`, because a declaration is a property and not an element.

**Should it be hidden? No, and the spike found a reason stronger than
consistency.** Recovery is reached by ordinary name lookup, and a handler in
scope is a handler because it is a visible property. Hiding it from
`visibleKeys` would mean the lookup that finds it and the iteration that reports
it disagree about whether the value has that member, which is the sort of split
the doubled operators exist to avoid. If a program wants recovery that is not
part of the value, the answer is to declare it in a scope that is not the value
— which is a13 §8's idiom anyway.

There is one consequence a13 does not mention, though it is not specific to
recovery: an aggregate holds its declaration echo in the data plane, so
declaring a handler shifts positional addresses.

```
$+.test-pass ““[.recover {0}, 1] .0” ?“.recover { 0 }””
$+.test-pass ““[.recover {0}, 1] .1” ?“1””
```

`[.z {0}, 1] .0` behaves the same way, so this is what any declaration inside a
literal already does, and recovery inherits it rather than causing it. It is
worth recording anyway, because a13's tutorial shape `[.$: {0}; 0]` is exactly
the shape where the recovered value is no longer at `.0`.

## Q5

**Yes. a13 §6 is describing reality.** Both spellings behave as reasoned, and
the handler is not merely ignored in the collecting case — it is never
consulted:

```
holds the refusal when the seed collects, handler or not ... ok (0ms)
recovers when the seed joins ... ok (0ms)
```

```ts
expect(last(".recover {7};", "('./nope.txt' | [])")).toEqual(
  "[$!.resource-absent './nope.txt']",
);
expect(recoveryCalls()).toEqual(0);

expect(last(".recover {7};", "('./nope.txt' | “”)")).toEqual("7");
expect(recoveryCalls()).toEqual(1);
```

```
$+.test-pass ““{.recover {7}; './missing.txt' | []} ()” ?“[$!.resource-absent './missing.txt']””
$+.test-pass ““{.recover {7}; './missing.txt' | “”} ()” ?“7””
```

The call count is the part worth keeping: `Frame.reduceInto` reaches the error's
own `called_by` and `collects()` branch without any error check, so the reduce's
value is a well-formed array and no per-term check ever fires. The opt-out is
structural, not a rule anyone has to maintain.

## Q6

**A text handler is pleasant for the simple cases and actively misleading for
the interesting one.** Five bodies, as asked, plus the two that expose the
problem.

A constant fallback, which never mentions `_`:

```
$+.test-pass ““{.recover {“(defaults)”}; './missing.txt' | “”} ()” ?““(defaults)”””
```

The partial handler a13 §7a proposes, which works exactly as a13 says:

```
$+.test-pass ““{.recover {_ = “resource-absent” ? {“(defaults)”}}; './missing.txt' | “”} ()” ?““(defaults)”””
$+.test-pass ““{.recover {_ = “resource-absent” ? {“(defaults)”}}; 1 / 0} ()” ?“$!.division-by-zero /””
```

A message built from `_`:

```
$+.test-pass ““{.recover {“recovered from ” _}; 1 / 0} ()” ?““recovered from division-by-zero”””
```

Recovery by reading a different resource, which needs nothing new, and the same
handler when its own read fails — a13 §9's ruling in action:

```
$+.test-pass ““{.recover {'./backup.txt' | “”}; './primary.txt' | “”} ()” ?““from backup”””
$+.test-pass ““{.recover {'./nowhere.txt' | “”}; './primary.txt' | “”} ()” ?“$!.resource-absent './primary.txt'””
```

A handler nested inside another handler's scope, which under the spike's default
masking cannot fire at all (Q3):

```
$+.test-pass ““{.recover {{.recover {“inner”}; 1 / 0} ()}; 1 / 0} ()” ?“$!.division-by-zero /””
```

**The friction, honestly.** Three problems, in increasing severity.

First, the refusal vocabulary is not one family. a13 §7 says `_` is "the `$!.…`
vocabulary without the sigil". Two of the trusted base's `Frame.error` spellings
are outside it: `$error{$is-constant …}` from `frame-symbol.ts`, and
`$!invalid-argument-list …` from `frame-lazy.ts`, which is in the family but
carries no dot. On top of that the value reaching the recovery point can be a
statement wrapper rather than the error frame, so the name has to be read
through `answeredValue` first. Naming a refusal took three patterns, an unwrap,
and a fallthrough, not a slice:

```
needs more than one pattern, because the vocabulary is not one family ... ok (1ms)
```

```
$+.test-pass ““{.recover {_}; constant_.change_ 2} ()” ?““is-constant”””
$+.test-pass ““{.recover {_}; join-name (.middle “Q”)} ()” ?““invalid-argument-list”””
```

Second, and much worse: **`_` is not visible inside the conditional that
discriminated on it.** `IfThen` and `IfElse` call the branch with `Frame.nil`,
so `_` inside a branch is that branch's own empty argument. Discriminating on
`_` and mentioning `_` in the answer cannot be combined, and the failure is
silent:

```
$+.test-pass ““{.recover {_ = “division-by-zero” ? {“saw ” _}}; 1 / 0} ()” ?““saw ”””
```

The reason is simply gone, no refusal is raised, and the handler reports
success. The spelling that works needs a binding first, because a branch closure
captures its enclosing scope even though it is handed nil:

```
$+.test-pass ““{.recover {.r _; r = “division-by-zero” ? {“saw ” r}}; 1 / 0} ()” ?““saw division-by-zero”””
```

a13 §7a's proposed handler dodges this only because its branch is a constant.
Any handler that both tests the reason and reports it needs the extra binding,
and nothing tells an author who omits it.

Third, fanning out over two reasons in one body does not fight the language, as
a13 §8 puts it — it **declines on every input**:

```
declines on both inputs when one body fans out over two reasons ... ok (1ms)
```

```
$+.test-pass ““{.recover {_ = “resource-absent” ? {“(defaults)”} : {_ = “division-by-zero” ? {0}}}; './missing.txt' | “”} ()” ?“$!.resource-absent './missing.txt'””
$+.test-pass ““{.recover {_ = “resource-absent” ? {“(defaults)”} : {_ = “division-by-zero” ? {0}}}; 1 / 0} ()” ?“$!.division-by-zero /””
```

Both legs fail, for two different reasons. On the hit, `?` answers text and `:`
sees a truthy source, so `:` answers nil. On the miss, the `:` branch does run,
but it is handed nil, so its own test on `_` misses too. This is a13 §7a's
pinned composition plus the `_`-in-a-branch problem compounding, and the result
is that a two-reason handler is not merely awkward — it is silently wrong.

**Verdict on a13 §7.** The text is worth its homoiconicity concession for
messages and for single-reason tests, and it does keep §2 true with no
carve-out. But the argument in a13 §7 for text over the failure was that text
lets "every ordinary operation work on it: comparison, message building,
matching", and that is true only at the top level of a handler body. Inside the
conditional that any real discrimination needs, `_` is nil whether it holds text
or a failure, so the concession buys less than a13 claims. Before ratifying §7,
#360's option 4 deserves re-examination — not because the value would be better
than the text, but because neither is reachable where a handler needs it, and
the branch-argument problem has to be solved either way.

## Q7

**No measurable effect on the existing suite. A few microseconds per failure in
isolation, and nothing at all on the success path.**

The existing suite is dominated by startup and never notices. `deno test lib`,
five runs each, seconds, with the spike's own test file excluded so the
comparison is like-for-like:

```
baseline:    2.61 2.56 2.24 2.26 2.17
with-spike:  2.33 2.22 2.22 2.20 2.18
```

The six `test:doc` corpora, three runs each, seconds:

```
baseline:    0.35 0.34 0.36
with-spike:  0.39 0.36 0.37
```

Both differences are inside run-to-run noise, and the with-spike median is
sometimes the lower of the two. To see the branch at all it has to be isolated —
the same source unit with the sites off, then on:

```
2000 failures, spike disabled      median 48.3ms handler calls 0
2000 successes, spike disabled     median 44.6ms handler calls 0
2000 failures, no handler          median 52.7ms handler calls 0
2000 failures, handler answers     median 52.9ms handler calls 2000
2000 failures, handler declines    median 57.5ms handler calls 8000
2000 successes, no handler         median 45.5ms handler calls 0
2000 successes, handler declared   median 48.3ms handler calls 0
```

The success path is unchanged, which matters most: the lookup is behind the
error branch and a program that never fails never pays. A failing program pays
4–8ms per 2000 failures for a fruitless scope walk — 2–4µs each across runs, so
treat the order of magnitude and not the digits — and the walk is fruitless in
exactly the common case where no handler is declared.

The number that should worry a reviewer is not the milliseconds but the
`handler calls` column: 8000 calls for 2000 failures, because a declining
handler is re-run once per enclosing reduce (Q1). Cost is not the objection to
that; repeated side effects are.

## Contradicts a13

Seven places, each naming the section it breaks. The list is not empty, and two
of the entries make the design look worse rather than merely incomplete.

1. **§6, and §2's account of the reduce — the lookup is at the wrong site.** §2
   says the reduce "asks that question twice per term" and §6 puts recovery at
   the second of those. Both checks inspect values that already exist; neither
   sees the step where failures are _produced_. `sum.call(value)` is where
   `1 / 0` fails, and it is checked by nothing. a13's site alone fails 14 of the
   36 corpus examples it reaches, including every arithmetic failure and every
   resource read; the combination step alone passes all 38. §6 also describes
   the substitution in terms that do not hold at that step: an apply-step
   substitute replaces the accumulator, not one term's value, so "resume the
   reduce's ordinary per-term logic from there … as if the term had produced it"
   is not what happens.

2. **§6 — "Recovery is attempted exactly once" is false.** A declining handler
   is re-run once per enclosing reduce the failure passes through: four times
   for `(1 / 0)`, five for `((1 / 0) + 5)`. Because handler bodies are ordinary
   HC that may perform resource writes, this is semantically visible and not an
   optimization detail.

3. **§9 — the masking ruling has a hole, and the hole loses the original
   failure.** §9 lists "a missing name" as a handler failing on its own, to be
   discarded so the original survives. A missing name is not a failure: it is a
   `FrameNote` with `is.note` and no `is.error`. So it is treated as an answer
   and substituted, and `{.recover {nope-name}; 1 / 0} ()` answers
   `$!.name-missing …` — the real refusal replaced by a note about the recovery
   code, which is precisely the outcome §9 forbids.

4. **§9 — the two candidate masking rules are not equivalent, and the one that
   reads as safer is the worse one.** Masking by key makes every recovery
   declared inside a handler body, or inside any helper a handler calls, dead
   code. Masking by the handler value keeps those working and still terminates,
   because depth is bounded by the number of distinct templates. §9 leaves the
   choice open as if it were a detail; it is a language-visible rule. §9 also
   understates the implementation: "that exact handler value" cannot be
   compared, because `FrameSymbol.in` returns a fresh bound copy per read, so
   masking has to compare the shared closure template instead.

5. **§5 — "No new field on `EvaluationScope` and no new traversal are needed" is
   right about the lookup and wrong about the mechanism.** The lookup is
   ordinary and needs nothing. The masking §9 requires cannot live on a scope at
   all: the handler body runs in a scope derived from the closure's own capture,
   which the failing term's scope is not part of, so nothing set there is
   visible inside the handler. It has to be interpreter-global state.

6. **§5 — "not the failing expression manufacturing its own escape hatch" is
   exactly what happens.** With lookup from the failing term's scope, an array
   literal recovers a term of itself: `[.recover {0}, 1 / 0]` answers
   `[.recover { 0 }; 0]`. If §5's exclusion is meant literally, the search has
   to start somewhere other than the current scope, and a13 does not say where.

7. **§7 and §8 — a text `_` is not reachable where discrimination happens.**
   §7's case for text is that "every ordinary operation works on it: comparison,
   message building, matching". True at the top level of a handler body only.
   `IfThen`/`IfElse` call their branch with `Frame.nil`, so `_` inside the
   conditional that discriminated on the reason is nil, and
   `{_ = “division-by-zero” ? {“saw ” _}}` answers `“saw ”` — silently, with no
   refusal. §8's claim that a multi-reason body "fights the language" is too
   kind: `{_ = “a” ? {x} : {_ = “b” ? {y}}}` declines on **both** inputs, so it
   is silently wrong rather than merely awkward. §7's text is still the cheaper
   shape, but the concession buys less than §7 argues, and the branch-argument
   problem is unsolved for the failure-value alternative too.

Two things a13 gets right that the spike tried and failed to break. **§6's
collecting opt-out is real**: a handler is not consulted at all for
`'./missing.txt' | []`, and the reason is structural rather than a rule — the
reduce's value is a well-formed array, so no per-term check fires. And **§12's
claim that the old nil-fallback idiom is untouched holds today**:
`(“a” + 1) : {“else”}` still answers `“else”` with a handler in scope, because a
nil computation is not a failure and no handler sees it. That is a statement
about today, not about the day M-3 ships.

What was tried against §3 and §11 and did not break them: nothing in the spike
reaches `lib/ops/conditionals.ts`, and `IfThen`/`IfElse` were never handed an
error, because a recovered term is an ordinary value by the time an operator
sees it and an unrecovered one still ends the reduce. §3's reframing survives
untouched. The `_`-in-a-branch problem in item 7 is a fact about how
conditionals pass arguments, not about how they treat errors, so it is not a
counterexample to §3 — but it does mean a13's discrimination story depends on
`lib/ops/conditionals.ts` after all, which §3 and §11 were written to avoid.
