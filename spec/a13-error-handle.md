# Error Handling: Parent-Scope Recovery

**Status:** Design settled. Every ruling below survived two adversarial spikes
and a review, and is stated in its corrected form. Nothing in the grammar blocks
implementation; what remains open is listed at the end, and the one item that
must be answered before code is what the guard at D3's site tests.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360). Blocks
[#361](https://github.com/TheSwanFactory/hclang/issues/361) (M-3) — but see D13,
which argues the dependency runs the other way.\
**Record:** [`a13-error-handle/`](a13-error-handle/) holds the working
documents: [`01`](a13-error-handle/01-error-handling.md) is the long-form
design, [`03`](a13-error-handle/03-recovery-spike-findings.md) and
[`05`](a13-error-handle/05-masking-bound-findings.md) are measured findings that
corrected it, [`06`](a13-error-handle/06-applying-a-failure.md) asks a larger
question this design does not answer, and
[`07`](a13-error-handle/07-what-blocks-implementation.md) reviews this record
against the interpreter and dissolves the blocker it used to name,
[`08`](a13-error-handle/08-handler-spelling.md) litigates the spelling, and
[`09`](a13-error-handle/09-combination-step-guard.md) is the brief for the one
open item that stops implementation.

## The problem

A failure is a permanent property of a value, not a transient state. One flag on
the frame marks it, and the left-to-right reduce every expression goes through
stops on it — before evaluating a term if the accumulator has already failed,
and after evaluating a term whose value is an error. Nothing distinguishes _a
term that just failed_ from _a value that happens to be a failure_, so a program
cannot ask "did this fail?" without that question itself being a term the rule
applies to. Failure is therefore terminal, and unrecoverable in-language.

Two pressures make that unaffordable rather than merely austere. M-3 turns ten
numeric fallbacks into error frames, which silently breaks every program using
`:` as a fallback-on-failed-computation idiom, because an error is not nil and
never reaches the operator. And the resource track already ships refusals —
unbound scheme, path outside root, exhausted budget — that no program can
respond to.

## D1. Recovery is a declared property, not new evaluation machinery

A handler is an ordinary named property set on a frame, declaring that frame's
scope as one a failing term below it may recover through. No new leg is added to
the ternary, `?` and `:` are untouched, and no new lookup mechanism exists.

The alternatives were each rejected for a reason: bare `$` and `$$` are already
the scope anchors; `::` as a third leg lexes freely but does not fix
reachability, since the condition operand is still swallowed before any operator
is dispatched; and making the conditional's operand lazy cuts deeper into the
evaluation model than the problem warrants.

**One rejection is withdrawn.** An earlier draft also rejected removing the
reduce's short-circuit on the ground that it "inverts one auditable invariant
into a convention every operator must reimplement." That is false as measured
([`07`](a13-error-handle/07-what-blocks-implementation.md) §3): every built-in
binary operator meets its second operand at one method, the curry's own `call`,
so the invariant relocates from one method to another rather than distributing.
What survives is narrower: terms after a failure would evaluate where a receiver
answers, which is a ruling nothing but nil sets a precedent for, and the framing
is a protocol, a frame type, and a vocabulary where this is a lookup and a
guard. Both are reasons to sequence this design first. Neither is a reason to
call the alternative rejected, so it is held open below instead.

## D2. Lookup is ordinary, outward, and nearest-wins

The search runs from the failing term's own scope outward through declared
parents and lexical `up`, exactly as any other property read does. Nothing new
is traversed and no field is added. An undeclared handler answers a note rather
than an error, so a program that declares none is bit-for-bit unchanged.

**A frame may recover its own terms.** An earlier draft required the search to
start in the parent scope, so an expression could not manufacture its own escape
hatch. Ordinary lookup does not behave that way — an array literal declaring a
handler recovers its own elements — and the restriction is withdrawn rather than
enforced, because excluding the current scope would need a rule of its own.

## D3. The recovery site is the combination step

Failures are _made_ where a curried operator meets its second operand, and
nothing inspects the result of that step. This is why the site matters more than
it looks: wired only at the per-term check, recovery misses every arithmetic
failure and every resource read — 14 of 36 corpus examples. Wired at the
combination step, all 38 pass.

The per-term check keeps a lookup as well, because a value that is already a
failure can arrive as a term with no combination at all. No example is known
that one catches and the other misses; both stay wired until one is shown dead.

## D4. A handler's answer replaces the accumulator

Recovery is substitute-and-continue: the handler's ordinary answer becomes what
the expression has computed so far, and the reduce carries on. Not the term's
value — at the combination step the term is already combined, so there is
nothing left to substitute for.

## D5. Four ways to decline, one way to succeed

A handler succeeds by answering an ordinary value. It declines by answering nil,
an error, a note, or by failing outright. All four leave the original failure
standing and none can make things worse.

- **Nil declines**, which matters because HC's conditionals do not compose as
  C's ternary: `:` tests the then-branch's result, not the original condition,
  so a partial handler written with `?` alone answers nil whenever its test
  misses. Nil-declines makes that natural spelling the working one. The price is
  that recovery **to** nil is unspellable, which is consistent with M-3's
  purpose.
- **A note declines**, and this was a hole. A missing name is neither nil nor an
  error, so it counted as a successful answer and replaced the real refusal with
  a note about the broken recovery code — precisely the outcome the rule exists
  to prevent.
- **The original failure survives**, never the handler's own. Broken diagnostic
  machinery must not overwrite the only information the program had.

**M-3 puts that last part at risk, and a guard at D3's site is what protects
it.** Once the numeric gate answers an error instead of nil, an operator handed
a failing operand replaces the original failure with its own domain error —
which renders the offending operand's class as empty, because a failure has no
class name ([`07`](a13-error-handle/07-what-blocks-implementation.md) §3b). Two
lines at the combination step answer it, so this is a sequencing constraint on
#361, not a defect in D5.

## D6. The handler receives the reason as text, and discrimination is positional

Handing the handler the failure itself cannot work: reading that argument is a
term that evaluates to a failure, so the handler's own reduce ends there. A
handler given the failure can return it or ignore it entirely. There is no third
move, and the obvious workaround of stashing it in an array fails for the same
reason.

So the argument is the refusal **name** as ordinary text, in the existing `$!.…`
vocabulary without the sigil. Text is not an error, so comparison, message
building, and matching all work with no carve-out in the propagation rule.

The concession is real and is argued as one: the handler gets a _description_ of
the failure because there is no failure frame to get. Simple handlers never
mention it.

**The reason is fragile to reach, and that is what makes the positional shape
mandatory rather than idiomatic.** One underscore names one enclosing
invocation, and a conditional branch is an invocation, so the spelling depends
on how many invocations deep the reader sits: `__` inside one branch, `___`
inside two or inside an iterator callback, and **no spelling at all** reaches it
inside a helper the handler calls. Every wrong count fails silently — answering
nil, or the iterator's element, or the whole file scope as the reason.

Two consequences are settled by that:

- **Bind the reason to a name at the top of the handler body**, or pass it to a
  helper as an ordinary argument. Both need nothing from this design.
- **A multi-reason handler body is silently wrong, not merely awkward.** Fanning
  out over two reasons declines on both inputs: on the hit, `?` answers and the
  trailing `:` sees a truthy source and nils it. Fixing the underscore count
  repairs the miss; nothing repairs the hit, because that half is the
  composition rule. Several declarations at the scopes that care are the answer,
  and where recovery is declared carries the discrimination a predicate cannot.

## D7. A failure is offered to each handler instance once

Recovery is not attempted once. An unrecovered failure is re-offered at every
enclosing reduce it passes through, re-running the handler body each time — four
times for a parenthesized division by zero. Handler bodies may write resources,
so the repetition is semantically visible.

Worse, it compounds: without this ruling a chain of _n_ handlers costs (4ⁿ⁺¹ −
4)/3 handler invocations for a single failure, which is 87,380 bodies at n = 8.
This is load-bearing, not an ergonomic nicety.

**Identity here is the bound closure instance**, which is finer than D8's. The
two rulings were originally claimed to share one notion of handler identity;
that claim is withdrawn. Sharing the coarse one silently discards a live
recovery when two instances come from one literal. Measured both ways: split
identities terminate every attack, keep the chained cost linear, and preserve
the recovery that the shared reading loses.

## D8. Mask the running handler, by parse site, not the key

A handler is ordinary code. If its own body fails and it resolves the same
binding that declared it, it recurses into itself forever — unmasked, it
exhausts the stack. So while a handler runs, that binding must not be available
to catch a failure raised during its own execution.

**Mask the handler, not the key.** The safer-sounding rule is the worse one:
masking every visible declaration makes any recovery declared inside a handler
body — or inside any helper it calls, whose author cannot see it coming — into
dead code, and that is the common shape.

**The bound is the number of closure literals in the parsed source**, and the
stated reason has to say so. "The number of distinct handler templates" is false
under the natural reading of template as the closure value: one source literal
minted 181 of them before the stack ran out. What actually bounds it is that
identity resolves to an object created when the source was parsed, and HC cannot
parse at runtime. Three things follow:

- Identity is the **parse site**, not the closure, not "that exact handler
  value", and not the shared body.
- The guarantee is currently an accident of an implementation detail — nothing
  documents that a closure's body terms are never rebuilt, and nothing but this
  would fail if some change rebuilt them. An explicit template identity should
  be stamped at parse time and carried through copy, so the bound is written
  down rather than inferred.
- **In-language eval, import, or macro expansion reopens this**, which makes
  [#301](https://github.com/TheSwanFactory/hclang/issues/301) a recorded
  dependency of this ruling.

Masking needs interpreter-global state. Only the lookup is free: a handler's
body runs in a scope derived from its own capture, which the failing term's
scope is not part of, so nothing set there is visible inside the handler.

## D9. Collecting opts out of recovery

A reduce into an aggregate never reaches this path — the refusal is held as an
ordinary element, the expression's value is a well-formed array, and no handler
is consulted. Both spikes attacked this and it held.

That asymmetry is correct: collecting is already declared not to be an operation
on the value, and a program that collected chose to inspect the results itself.
A handler firing there would overrule a decision the author already made. Worth
stating because two spellings differing by one seed land in different regimes.

## D10. A handler is ordinary visible data

It prints in an aggregate's rendering, appears in visible keys, and is not an
element. Hiding it was considered and rejected on a stronger ground than
consistency: recovery is found by ordinary name lookup, so hiding it would make
the lookup that finds it and the iteration that reports it disagree about
whether the value has that member. A program wanting recovery that is not part
of the value declares it in a scope that is not the value, which is D6's idiom
anyway.

One inherited consequence: a declaration inside a literal shifts positional
addresses, so the recovered value is no longer at `.0`. Any declaration already
does this; recovery does not cause it.

## D11. What does not change

The conditional operators are untouched, and never learn anything about errors —
a recovered term is ordinary by the time an operator sees it, and an unrecovered
one still ends the reduce, so the question of what they would do with a failure
stays moot rather than answered. The error frame's own behavior is untouched. No
third leg is added to the ternary and `?:` gains no new arity.

## D12. Cost

The success path is unchanged, because the lookup sits behind the error branch:
a program that never fails never pays, and the existing suite cannot see the
difference above run-to-run noise. A failing program pays a fruitless scope walk
of a few microseconds per failure — the order of magnitude, not the digits.

Under D7 the residual cost is one handler body per handler _instance_ per
failure, so a recursive function that declares a handler and declines at ten
levels runs ten bodies. Linear in call depth, side-effect-visible, and the price
of not silently dropping the tenth level's recovery.

## D13. Migration, and the sequencing question

This does not preserve the `(1 + "text") : {"else"}` idiom when M-3 ships. That
idiom relied on the result being nil, which `:` already tests for. The
equivalent under this design is an explicit declaration: the old behavior was
implicit and free, the new one is opt-in and needs a source change.

The dependency recorded on #360 and #361 may be backwards.
[`06`](a13-error-handle/06-applying-a-failure.md) measures that the numeric gate
swallows a failure into nil the moment the evaluator stops intervening, and it
already does that to a missing name and to text today. That makes #361 a
prerequisite of the receiver-side framing rather than a consumer of it. If the
inversion is right, #361 is unblocked and should be re-sequenced.

## Open

- **Which identifier the handler is spelled with.** This is a naming decision,
  not a blocker: spellings satisfying every ruling above lex today with no
  grammar change ([`07`](a13-error-handle/07-what-blocks-implementation.md) §1).
  Two candidates are ruled out rather than left open. **`.$:` is not available
  at a price worth paying** — the obstacle is not the dollar family but the
  family that owns every property name in the language, which admits neither `$`
  nor a mix of character kinds, so `.$:` needs both a leading-`$` rule and a
  kind-mixing exception; `$:` is also not vacant, since it already resolves as a
  member read on the file anchor. **`.:` shadows the if-else operator** on any
  frame that declares it, which is the one ruling
  [`a05c`](a05c-unified-effect-marker.md) most recently bought. Other
  operator-class keys such as `.::` shadow nothing, but a missing dot silently
  invokes them where an identifier raises a note, and none of them can be
  written as a bare name. What remains is the class: an ordinary identifier such
  as `.on-fail`, which costs nothing, against a reserved `.$…` namespace, which
  costs one guarded line plus an amendment to a spelling `doc/GRAMMAR.md` pins
  as legal and makes the handler unspellable in value position.
  [`08`](a13-error-handle/08-handler-spelling.md) enumerates the space and
  recommends; the choice turns on the next item rather than on taste.
- **Whether the key must be reserved.** D1 makes the handler an ordinary
  property and D2 finds it by ordinary outward lookup, so any frame in the
  lookup chain can declare one — deliberately or by collision — and thereby
  substitute values for failures in code it did not write. A reserved namespace
  is the answer if that is a hazard, and the reason to decide it here rather
  than as a naming question is that a07's threat model is the place that knows
  whether it is one.
- **Whether the refusal vocabulary can be matched against at all.** D6 makes
  refusal names a program-visible discrimination channel, which is the question
  a07 §7 left open and [`a12`](a12-resource-frames.md) records as unresolved:
  whether an ungranted resource may say _why_ it refused. Whatever a program can
  read is exactly what it can branch on, so the two must be answered together.
  The vocabulary is also not one family — around seventy call sites spell it
  three ways, and reading a name back took three patterns and an unwrap — so
  either it is regularized or D6 admits the name is computed rather than read
  off.
- **What the guard at the combination step tests, which does block code.** D3
  puts recovery there and D5 now needs a guard there to survive M-3, and nobody
  has decided whether it tests the error flag alone or the aggregate-shallow
  predicate, what it does to receiver state, or what `?` and `:` answer to a
  failing source. [`09`](a13-error-handle/09-combination-step-guard.md) is the
  brief.
- **Whether the whole framing should be receiver-side instead.** D1's
  architectural objection to this is withdrawn, so what is left is cost and
  sequencing rather than principle.
  [`06`](a13-error-handle/06-applying-a-failure.md) argues that every mechanism
  above — masking, two identity notions, per-failure bookkeeping, a synthesized
  text argument, the underscore ladder — exists because the evaluator locates
  and invokes the handler, and that the receiver-side protocol already exists in
  the frames, documented and one line from reachable. It proposes no mechanism
  and does not show this design wrong; both spikes ran it end to end and it
  works. The case for weighing it now is that these rulings are proposals. The
  case against is that it is a protocol, a frame type, and a vocabulary, where
  this is a lookup and a guard.
