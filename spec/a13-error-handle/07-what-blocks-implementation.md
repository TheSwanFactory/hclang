# What Blocks Implementation

**Status:** Review of the settled record, with measurements. Three findings, all
against claims the record states as settled or as blocking. Two of them dissolve
blockers; one withdraws a rejection. Nothing here proposes a mechanism, and
nothing here says the design does not work — both spikes ran it and it does.\
**Design record:** [`../a13-error-handle.md`](../a13-error-handle.md), D1–D13
and its three Open items.\
**Prior:** [`01`](01-error-handling.md) is the long-form design,
[`03`](03-recovery-spike-findings.md) and [`05`](05-masking-bound-findings.md)
are the measured findings, [`06`](06-applying-a-failure.md) is the larger
question.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360),
[#361](https://github.com/TheSwanFactory/hclang/issues/361).\
**Measured at:**
[`0dd9555`](https://github.com/TheSwanFactory/hclang/commit/0dd9555), with the
unmodified interpreter except where a temporary edit is named, each reverted.
Every result quoted is pasted output.

**The short version.** The record names one Open item as blocking
implementation. It does not block, and the fix it proposes does not work. The
blocker is in a different family than the one named, `$:` is not vacant, and
spellings that satisfy every ruling in the record lex today with no grammar
change. The `$` the record wanted is also cheaper than it assumes: a reserved
`.$…` namespace is one guarded line and leaves the suite green. It is the colon
after the `$`, not the `$`, that is expensive. Separately, D1 rejects
[`06`](06-applying-a-failure.md)'s framing on the ground that it would become "a
convention every operator must reimplement" — every built-in binary operator is
one method, and two lines in it hold every invariant the record cares about,
including after M-3. That rejection should be withdrawn and restated on cost,
which is where it survives.

## 1. The spelling does not block implementation

The record's first Open item says `$:` "is not valid source today" and that
"making it atomic means whitelisting `:` in the family that owns the
diagnostic-note spellings." Three of its claims do not survive being run, and
the cost it assumes falls somewhere other than where it puts it.

### 1a. The proposed fix does not work

`:` added to `NOTE_PREFIXES` (`frame-scope-anchor.ts:17`), everything else
untouched:

```
$: {0}        => HCEval.finish.failed: unterminated FrameNote: $: {0}
.$: {0}; 1    => (($!.name-missing “.”;); 1)
```

Two failures rather than a fix. The dollar family's note path consumes every
character until `;` (`FrameNote.NOTE_END`), so `$:` becomes a note that swallows
the handler body. And the property spelling is **unchanged** — byte for byte the
same answer as before the edit.

### 1b. The blocker is the name family, not the dollar family

`.$:` does not fail because `$:` will not lex atomically. It fails because `.`
followed by `$` is not a property name at all, which is visible today with no
colon anywhere near it:

```
.$ 1          => $!.name-missing “.”;
```

`FrameName`'s continuation test (`frame-name.ts:18`) accepts
`FrameSymbol.SYMBOL_CHAR` or `FrameOperator.OPERATOR_CHARS`
(`frame-symbol.ts:56-57`):

```ts
public static readonly SYMBOL_CHAR = /[-\w]/;
public static readonly OPERATOR_CHARS = /[&|?:+\-/*%=<>!~^]/;
```

`$` is in neither, so the name completes as a bare `.` and redispatches. Making
`.$:` a property name therefore means widening the family that owns **every**
property name in the language, which is a different blast radius from a
whitelist entry in one sigil family.

### 1c. A reserved `$…` namespace is cheap. `$:` is the part that is not

The motivation for `$:` was that `$` reads as language machinery rather than as
the program's own data. That is available, and it costs one guarded condition in
the one family §1b names — accept `$` only at the head of a name:

```ts
if (!includes(char) && !(char === "$" && source === "")) {
```

Measured with that edit and nothing else:

```
[.$recover {0}, 1] .$recover  => { 0 }
[.$x 9] .$x                   => 9
.set$                         => HCEval.finish.failed: invalid dollar form: .set$
$                             => $
$$                            => $$

ok | 71 passed (1085 steps) | 0 failed | 4 ignored (4 steps)
```

The whole suite passes, the anchors are untouched, and the dollar **suffix**
rejections that `doc/GRAMMAR.md` pins deliberately — `.set$`, `.set$$`, `.-$` —
still fail, because the rule is leading-only. Admitting `$` at any position
instead breaks exactly those three and nothing else.

**But `.$:` still does not lex, even then:**

```
.$: {0}; 1                    => ((()); 1)
```

`$` is not an operator character and `:` is, so the name stops between them by
the `sameKind` rule in the same recognizer. Getting `$:` specifically would need
a kind-mixing exception on top of the leading-`$` rule.

So the cost is not what the record assumes, and it does not fall where the
record puts it. A reserved-looking sigil is one line and suite-green. The colon
after it is the expensive character. `.$recover` is available at a price worth
paying; `.$:` is not available at that price.

### 1d. `$:` is not vacant

```
$: {0}        => $!.name-missing $.:
```

`$` completes as the file-scope anchor and `:` is consumed as a member read on
it, so `$:` already denotes a lookup of the member `:` in file scope. The record
describes this as lexing to "a separate `:` operator token", which is not what
happens. Whatever is decided, the spelling is being taken from something rather
than found free.

### 1e. Spellings that satisfy every ruling lex today

`:` is an operator character, so colon-bearing keys are already property names,
and so are ordinary identifiers including hyphenated ones:

```
[.?: {7}] .?:              => { 7 }
[.~: 9] .~:                => 9
[.: 9] .:                  => 9
[.recover 9] .recover      => 9
[.on-fail {0}, 1] .on-fail => { 0 }
```

One constraint applies to the operator-class keys and not the identifier ones. A
bare-name resolution does not find them:

```
{.zz {7}; (zz ())} ()       => 7
{.~: {7}; (~: ())} ()       => ~:
{.: {7}; (: ())} ()         => :
```

That constrains the implementation of the lookup rather than the spelling, since
a program only ever writes the declaration and the evaluator resolves by key. It
is worth knowing because [`03`](03-recovery-spike-findings.md)'s spike resolved
the handler as a bare name, which an operator-class key would not support
unchanged.

**So the Open item is not a blocker.** Nothing in the grammar prevents building
this. What is open is a naming decision, and `:` specifically is the expensive
answer to it.

## 2. `::` is the wrong spelling, and not for a lexing reason

`::` is genuinely free — `lib/ops.ts` binds only `:` and `?`, and
`lex.test.ts:222-229` already pins a colon run as one symbol "that no operator
table binds." It declares, prints, reads back, and satisfies D10:

```
[.:: {0}, 1] .::           => { 0 }
[.:: {0}, 1] && {_ .0}     => [.::, .0]
[.:: {0}, 1] & {_}         => [1]
```

Three reasons not to take it anyway.

**It makes the handler callable from syntax that reads as an operator.** A colon
run after a value is a member read, so the handler runs and its answer replaces
the expression:

```
[.:: {0}, 1] :: 9          => 0
[.:: {“caught”}, 1] ::     => { “caught” }
```

An identifier-class key is inert in that position, collecting as ordinary terms
instead:

```
[.on-fail {0}, 1] on-fail 9  => [.on-fail { 0 }; 1, $!.name-missing …, 9]
```

D1 and D11 spend two rulings establishing that no leg is added to the ternary
and that `?:` gains no new arity. `x :: 9` invoking a recovery handler is the
thing those rulings deny, reachable by accident.

**It is the glyph the design already rejected.** D1's own list rejects `::` as a
third ternary leg. Spelling the property with it invites every reader to expect
`x ? {…} :: {…}`, which is precisely the reading D11 exists to prevent.

**It spends a ruling the language just made.**
[`a05c`](../a05c-unified-effect-marker.md) removed the mutating colon in
v0.11.0, and states the outcome as "a trailing underscore is the only mutating
marker; `:` denotes if-else alone," with "the colon is only the if-else
operator, at every position." `.::` puts a colon back into the name position.
The mechanical cost a05c paid, the `scanMutatingSuffix` special case, would not
recur, so this is not a repeat of that mistake. It is still spending something
recently and deliberately bought.

### 2a. Recommendation: an identifier, such as `.on-fail`

It satisfies every requirement the record states, with no grammar change:

| spelling    | lexes | nested bare-name lookup | visible key | grammar change           |
| ----------- | ----- | ----------------------- | ----------- | ------------------------ |
| `.$:`       | no    | n/a                     | n/a         | leading `$` + kind-mix   |
| `.$recover` | yes   | not tested              | yes         | leading `$`, suite-green |
| `.::`       | yes   | no                      | yes         | none                     |
| `.recover`  | yes   | yes                     | yes         | none                     |
| `.on-fail`  | yes   | yes                     | yes         | none                     |

```
{.on-fail {7}; {(on-fail ())} ()} ()  => 7
[.on-fail {0}, 1] && {_ .0}           => [.on-fail, .0]
[.on-fail {0}, 1] & {_}               => [1]
```

D2's outward lookup, D10's visible-but-not-an-element rule, and read-back are
all covered. The hyphen matches the vocabulary D6 hands the handler, so a
declaration spelled `.on-fail` receiving `“division-by-zero”` reads as one idea.
It is more distinctive than `.recover`, which matters because an accidental
declaration silently installs a handler.

Note that `.recover!` is not available — an identifier stops at the first
operator character, so it lexes as two atoms and the declaration comes apart.

**The class matters more than the word.** Everything the record says about the
handler argues for an identifier: it is a declaration about a scope, not an
operator, and D6 already rules that the discrimination lives in where it is
declared. There is one honest argument for a sigil, which is that D10 makes the
handler visible in printed output and in doubled streams, so a program walking
its own keys meets it and a sigil would mark it as machinery. That argument asks
for a reserved namespace rather than one glyph, and §1c prices it at one guarded
line. If that argument wins, `.$recover` is the spelling it wants, not `.$:` and
not `.::`.

## 3. D1's rejection of 06 does not survive measurement

D1 lists among its rejected alternatives that removing the reduce's
short-circuit "inverts one auditable invariant into a convention every operator
must reimplement." The premise is false, and the record accepts elsewhere the
measurement that makes it false.

### 3a. Every built-in binary operator is one method

An operator lookup builds a `FrameCurry` bound to its source, and
`FrameCurry.call` invokes the function directly (`frame-curry.ts:47`):

```ts
return this.Func(this.Source, argument, callbackReceiverState);
```

That is the single point where every built-in binary operator meets its second
operand, and it is why the operand never reaches `Frame.error.called_by`. The
convention is one method, not a distributed obligation.

Measured, with three temporary edits: M-3 simulated in `math.ts`'s shared gate,
the per-term error check removed from `evaluateTerms`, and two lines added at
the top of `FrameCurry.call` answering a failing source or argument unchanged.

```
1 + (1 / 0)        => $!.division-by-zero /
(1 / 0) + 1        => $!.division-by-zero /
1 + (1 / 0) + 5    => $!.division-by-zero /
1 + “text”         => $!.numeric-domain op FrameInt FrameString
[] (1 / 0)         => [$!.division-by-zero /]
[1] (1 / 0)        => [1, $!.division-by-zero /]
(1 / 0) ? {“t”}    => $!.division-by-zero /
```

The original failure survives, M-3's own error appears where M-3 wants it, and
the collect works. The suite:

```
FAILED | 70 passed (1084 steps) | 1 failed (1 step) | 4 ignored (4 steps)
  preserves nil for arbitrary nonnumeric operator mismatches ... FAILED
```

That single failure is the test #361's own acceptance list already schedules for
replacement. Against a baseline of 71 passed and 0 failed, nothing else moves.

The guard is an experiment, not a proposal. Whether it should test `is.error` or
`isFailedResult`, what it does to receiver state, and what the conditionals
should do are all real questions. What it establishes is narrow and sufficient:
the invariant relocates from one method to one other method. It does not
distribute.

### 3b. The real objection, which D1 does not make

Without that guard, M-3 makes an operator **replace** the original failure with
its own:

```
1 + (1 / 0)        => $!.numeric-domain op FrameInt
```

The division by zero is gone, substituted by a domain error about the operand's
class — and the class renders empty, because a failure has no class name, which
is [`06`](06-applying-a-failure.md) §7's point arriving from another direction.
That violates D5's "the original failure survives, never the handler's," which
both spikes treated as load-bearing.

This is the strongest argument for caution in the record's vicinity, and it is
not the argument D1 makes. It is also a sequencing argument rather than a
rejection, because two lines at one site answer it.

### 3c. The rejection is inconsistent with three other rulings

- **D3 chooses the same site.** The recovery site is the combination step, and
  `FrameCurry.call` is the combination step. Both designs hook one method. If
  D1's objection held, it would land on D3.
- **D9 already depends on the receiver-side protocol.** Collecting opts out
  because `Frame.error.called_by` asks `collects()`, whose own doc comment says
  it exists for exactly one argument, an error. D9 is the one ruling both spikes
  attacked and could not break. The record keeps the receiver-side rule where it
  works and rejects generalizing it, without saying what separates the two
  cases.
- **D13 already accepts 06's measurement.** It takes the sequencing inversion
  and agrees #361 may be a prerequisite. So the record adopts 06's evidence in
  D13 and rejects its framing in D1.

There is also a plain inconsistency of status: D1 rejects the receiver-side
framing as settled, and the third Open item holds it open and argues it fairly.
Both cannot be true of the same document.

### 3d. What survives

The costs [`06`](06-applying-a-failure.md) concedes are untouched by any of
this, and they are good reasons to sequence a13 first:

- **Effect ordering.** Terms after a failure would evaluate where a receiver
  answers. That is a ruling to make, and nil is the only precedent for making
  it.
- **Scope.** a13 is a lookup and a guard. The receiver-side framing is a
  protocol, a frame type, and a vocabulary.

Those are consistent with the language design. D1's architectural argument is
not, and it is the one stated as settled.

## 4. What this changes in the record

| Claim                                                       | Status                | Suggested change                                                              |
| ----------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| Open 1: the spelling blocks implementation                  | **False**             | Demote to a naming decision; nothing in the grammar blocks building this.     |
| Open 1: whitelist `:` in the dollar family                  | **Does not work**     | Replace with §1b–§1c: the blocker is `FrameName`; `.$recover` costs one line. |
| §10 / Open 1: `.$:` lexes as `.` then `$` then `:` operator | **Wrong in detail**   | The `:` is consumed as a member read on the anchor, so `$:` is not vacant.    |
| D1: removing the short-circuit distributes the invariant    | **False as measured** | Withdraw, and restate the rejection on effect ordering and scope (§3d).       |
| D1 rejects 06 / Open 3 holds it open                        | **Contradictory**     | Pick one. The evidence supports Open 3.                                       |
| D5: the original failure survives                           | **At risk under M-3** | Record §3b: without a guard at the combination step, an operator replaces it. |

## Noted, not resolved here

- **Which identifier.** `.on-fail` is a recommendation on the class, not a
  ruling on the word. `.on-error` and `.recover` are in the same class and have
  the same properties; `.recover` is likelier to collide.
- **Whether the key should be reserved at all.** D1 makes the handler an
  ordinary property, so any program can declare it deliberately or not, and a
  collision silently installs a handler. That hazard follows from D1 rather than
  from any spelling. A reserved namespace would answer it and is priced in §1c,
  where it turns out to be cheap.
- **What the guard at the combination step should actually test.** §3a's two
  lines are instrumentation. `is.error` against `isFailedResult`, receiver
  state, and what `?` and `:` should do with a failing source all need deciding
  before anyone writes it down.
- **Whether the bare-name lookup in the spike is the intended mechanism.** D2
  says lookup is "exactly as any other property read does," and the spike
  implemented a bare-name resolution. Those differ for operator-class keys
  (§1e). If the spelling stays an identifier the difference never shows.
