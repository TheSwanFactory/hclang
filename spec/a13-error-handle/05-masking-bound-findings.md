# Masking Bound Findings

**Status:** Answers to [`a13c`](04-masking-bound-spike.md), taken at spike
branch commit
[`efcf7826d9e7b3b05e9bc6d10397e58f2d2e7206`](https://github.com/TheSwanFactory/hclang/commit/efcf7826d9e7b3b05e9bc6d10397e58f2d2e7206)
on `a13c-masking-bound`, which starts from
[`a4471f9`](https://github.com/TheSwanFactory/hclang/commit/a4471f9ef3cd8420531bafae52422068e8e7892f)
on `a13a-recovery-spike`. That SHA is the only link back to the code, which is
not merged and is not meant to be.\
**Design record:** [`a13`](01-error-handling.md) §9 and §6a, unedited.\
**Prior findings:** [`a13b`](03-recovery-spike-findings.md).\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).

**The short version.** a13 §9's bound holds, and its stated reason is wrong in a
way that matters. Depth is not bounded by "the number of distinct handler
templates", because the natural reading of "template" — the closure value — is
unbounded at runtime: one source literal minted 181 of them before the stack ran
out. What actually bounds it is that a13b's identity proxy resolves to an object
created when the source was **parsed**, and HC has no way to parse at runtime.
So the bound is a parse-time property of the program text, not a runtime
property of the interpreter, and §9 should claim that instead.

Two things that were not on a13c's list came out of it. §6a cannot share §9's
identity: A4 exhibits a recovery silently lost because it does. And §6a is not
an ergonomics nicety — without it, a chain of _n_ handlers costs (4ⁿ⁺¹ − 4)/3
handler invocations for a single failure, which is 87,380 handler bodies at n
= 8. It is load-bearing.

## How to reproduce

Four commands produce everything quoted below:

```
deno test lib/frames/masking-bound.test.ts --allow-env --allow-read --allow-write
deno run --allow-all lib/frames/masking-bound.cost.ts
deno run --allow-all lib/frames/split-identity.probe.ts
cd cli && deno task hc hc/masking-bound.hc -t
```

The test file passes 41 steps and the corpus's 16 examples pass:

```
ok | 1 passed (41 steps) | 0 failed (72ms)
$=.test-summary “HCTest”; .n “{"total":16,"pass":16,"fail":0,"unimplemented":0}”;
```

a13a's corpus is carried along as a regression check. All 38 of its examples
still pass under a13c's defaults — value masking, §6a on — and the single
example whose **answer** changes is the one a13b Q3 predicted would: value
masking lets a handler declared inside a handler body fire.

```
$+.test-pass ““{.recover {{.recover {“inner”}; 1 / 0} ()}; 1 / 0} ()” ?““inner”””
$=.test-summary “HCTest”; .n “{"total":38,"pass":38,"fail":0,"unimplemented":0}”;
```

Most tables below are the matrix probe, which runs one source unit under every
combination of masking rule (`value`/`key`/`none`), §6a setting
(`once`/`every`), and handler identity (`first-term`/`object`), because no
single default answers a question about which rule is doing the work.

## The counter went first, and it was never load-bearing

a13c §2 asks for the depth counter to be removed before anything else, on the
theory that it might be what actually stops the recursion. It is not, and this
did not need an experiment — it needed reading the line a13b Q2 was describing:

```ts
if (guard === "key" && keyMasked > 0) return undefined;
```

`keyMasked` was read there and nowhere else. It **was** key masking, expressed
as a depth counter because key masking asks "is any handler running at all".
Under value masking it was never consulted, so a13 §9's ruling has always rested
on the template set alone, and a13b Q2's "a set of running handler templates
plus a depth counter" describes the union of two alternative guards rather than
one guard with a belt and braces.

It is gone. Key masking now asks the same set whether it is non-empty, the set
is the only state, and every a13a assertion and corpus example still passes. So
the premise a13c §2 offered — "if the counter is what actually stops the
recursion, then the ruling's stated safety case is not the one the code relies
on" — is false, and the ruling's stated safety case is wrong for a different
reason, which is A1.

## A1

**The bound is false for "templates" meaning closure values, and true for
"templates" meaning parsed body terms. One source literal is enough to break the
first.**

The minting vector is not a factory or a handler that declares a handler. It is
simply a handler declaration inside a closure that is called more than once:
every call re-evaluates the literal, and `FrameLazy.bind` copies on the way
through, so each call produces a new closure value.

```
.f {.recover {(f ())}; (1 / 0)};
(f ())
```

```
value/once/first-term          $!.division-by-zero /                          calls=1 ids=1 depth=1
value/once/object              RANGEERROR: Maximum call stack size exceeded   calls=181 ids=181 depth=181
value/every/first-term         $!.division-by-zero /                          calls=4 ids=1 depth=1
value/every/object             RANGEERROR: Maximum call stack size exceeded   calls=200 ids=200 depth=200
key/once/first-term            $!.division-by-zero /                          calls=1 ids=1 depth=1
key/once/object                $!.division-by-zero /                          calls=1 ids=1 depth=1
none/once/first-term           RANGEERROR: Maximum call stack size exceeded   calls=200 ids=1 depth=200
none/once/object               RANGEERROR: Maximum call stack size exceeded   calls=200 ids=200 depth=200
```

`ids` is the number of distinct handler identities invoked. Under `object`
identity it equals the depth, all the way down: **181 distinct "templates" from
one literal.** Value masking does not terminate. The set a13 §9 relies on being
finite is not finite.

Under `first-term` — a13b Q3's proxy, the first term object of the closure body
— `ids=1`, and it terminates at depth 1. a13c asks whether that holds when the
literal is _re-evaluated_ rather than copied, and it does: `FrameList.copy`
gives the clone a new array of the same element objects
(`clone.data = [...this.data]`), and nothing in the evaluator ever rebuilds a
closure's own body terms.

**`instanceCopy` behaves the same as the plumbing copy here**, which a13c asks
about specifically. `FrameLazy` does not override `instanceCopy`, on the stated
grounds that "closures are shared bodies" (`frame.ts`), so a handler carried
through the object-semantic copy is the identical object, not merely one with
the identical first term:

```
leaves a handler alone through instanceCopy, not just through copy ... ok (1ms)
```

Two smaller results, both against claims in a13.

**A declared handler answers one object across reads.** a13 §9's caveat — and
a13b Q3's — say `FrameSymbol.in` hands out a fresh bound copy on every read, so
identity cannot be taken against the value. That is not what happens for a
handler: `FrameSymbol.in` calls `value.bind(…)` for a `FrameLazy`, and `bind`
answers `this` when the closure is already bound, which a declared handler
always is. Four reads of one declaration, one object:

```
answers one object for every read of one declaration ... ok (0ms)
```

```ts
withIdentity("object", () => {
  withoutOnce(() => {
    expect(last(".recover {()};", "(1 / 0)")).toEqual("$!.division-by-zero /");
    expect(recoveryCalls()).toEqual(4);
    expect(recoveryIdentityCount()).toEqual(1);
  });
});
```

So the reason value identity fails is not that reads copy. It is that
_declarations re-run_. That is a sharper statement and it points at the real fix
(A1's last paragraph below).

**The one place identity is genuinely unstable is unreachable as a hazard.** The
proxy falls back to the handler object when the body is empty, and an empty body
is a fresh object per level. It cannot loop, because `FrameLazy.call` with no
body codifies its argument, so an empty handler always answers:

```
; {.recover {}; 1 / 0} ()
# (“division-by-zero”)
```

**What was tried and failed to mint anything.** A factory answering a closure
(`.recover (mk ())`) mints values, not first terms, and the declaration runs
once so it never even mints those. A handler declared by a handler is A3.
Nothing in the language parses source at runtime: `lib/ops.ts` registers no
eval, and `doc/GRAMMAR.md` and `doc/LANGUAGE.md` contain no import, include or
require. The CLI parses once per process. That absence is the whole bound, and
it is worth naming as a dependency rather than an accident.

## A2

**Mutual recursion terminates, and the mask is released on return — early enough
that a handler is re-enterable while its own failure is still rising. §6a, not
the mask, is what stops that.**

H1 at file scope provokes H2 inside `g`; H2 provokes `h`, whose failure resolves
outward to H1:

```
.recover {(g ())};
.g {.recover {(h ())}; (1 / 0)};
.h {(1 / 0)};
(g ())
```

```
value/once/first-term          $!.division-by-zero /                          calls=4 ids=2 depth=2
value/once/object              $!.division-by-zero /                          calls=5 ids=4 depth=3
value/every/first-term         $!.division-by-zero /                          calls=36 ids=2 depth=2
value/every/object             $!.division-by-zero /                          calls=84 ids=18 depth=3
```

Depth is 2 — the number of literals — and the original failure survives, which
is what a13 §9 predicts. The interesting column is `calls`: with §6a off, two
handlers cost **36 invocations** for one failure.

a13c asks when the mask is released, and whether releasing on return rather than
on the whole call's completion lets a declining handler be re-entered while its
own failure is still rising. It does. The mask is a `try/finally` around
`handler.call`, so the moment a handler declines it is unmasked, and the failure
it declined then meets it again at every enclosing reduce — a13b Q1's four
calls, generalised. Nothing bad follows from it, because each re-offer happens
at a strictly outer reduce, so the re-entry count is bounded by expression
nesting rather than unbounded. But it does mean the mask is not what makes
recovery cost one call per handler; §6a is:

```
releases the mask on return, not when the failure stops rising ... ok (3ms)
```

```ts
withoutOnce(() => {
  expect(last(...MUTUAL, "(g ())")).toEqual("$!.division-by-zero /");
  expect(recoveryCalls()).toEqual(36);
});
resetRecovery();
expect(last(...MUTUAL, "(g ())")).toEqual("$!.division-by-zero /");
expect(recoveryCalls()).toEqual(4);
```

Under `object` identity this attack happens to terminate (depth 3), which is
only luck: `g` is entered twice, not unboundedly. A3 is the same shape with the
recursion closed, and it does not.

## A3

**The case §9's ruling exists to protect is also the case that breaks value
identity.** a13 §9 chooses value masking over key masking precisely so that
recovery inside a helper the handler calls keeps working. Make the helper the
recursion:

```
.help {.recover {(help ())}; (1 / 0)};
.recover {(help ())};
(1 / 0)
```

```
value/once/first-term          $!.division-by-zero /                          calls=2 ids=2 depth=2
value/once/object              RANGEERROR: Maximum call stack size exceeded   calls=183 ids=183 depth=183
value/every/first-term         $!.division-by-zero /                          calls=20 ids=2 depth=2
value/every/object             RANGEERROR: Maximum call stack size exceeded   calls=200 ids=200 depth=200
```

Two handlers, depth 2, terminates — under the parse-site identity. Under the
closure-value identity the helper's declaration re-runs on every call, so this
is A1 with the recursion routed through the exact construct §9 was written to
support. The ruling and its counterexample are the same program shape.

## A4

**§6a and §9 cannot share one notion of handler identity. Sharing it loses a
recovery, silently.** This is the result a13c did not predict and the one that
should change a13.

a13 §6a says identity is "the closure template, the same notion §9's masking
needs". The two rulings want different things from it. Masking needs an identity
coarse enough that a re-evaluated declaration is still "the same handler" —
otherwise A1. §6a needs one fine enough that two _instances_ of a literal, with
different captured scopes and therefore different answers, are different
handlers. Nothing is both.

One literal, reached at two nesting levels, capturing a different `k` each time.
The inner instance declines because its `k` does not match the reason; the outer
instance would answer:

```
.mk {.k _; .recover {_ = k ? {“answered by ” k}};
     k = “division-by-zero” ? {(mk “resource-absent”)}; (1 / 0)};
(mk “division-by-zero”)
```

```
value/once/first-term          $!.division-by-zero /                          calls=1 ids=1 depth=1
value/once/object              “answered by division-by-zero”                 calls=3 ids=2 depth=1
value/every/first-term         “answered by division-by-zero”                 calls=6 ids=1 depth=1
value/every/object             “answered by division-by-zero”                 calls=6 ids=2 depth=1
```

Read the first row against the other three. Under a13's rulings as written —
value masking, §6a on, one shared identity — the answer is the unrecovered
failure. Turn §6a off and it recovers. Give §6a its own finer identity and it
recovers. **§6a is what discarded the recovery**, and it discarded it while the
outer handler was not masked and was perfectly able to answer: the mask had been
released, the record had not.

This is the disagreement a13c A4 asks for, in its second form: a handler "used
up for a failure but not masked". The first form — masked but not recorded —
cannot arise, because the record is written before the call and never rolled
back.

No loop falls out of the disagreement, only the lost recovery. That is arguably
worse, because a loop announces itself.

## A5

**Terminates, for the same reason as A1, and diverges under the same identity.**
An aggregate is constructed fresh on every evaluation, so a13c is right that
this is a distinct minting surface from a closure call — but what is fresh is
the _array_, not the handler literal inside it.

```
.mk {[.recover {(mk ())}, 1 / 0]};
(mk ())
```

```
value/once/first-term          [.recover { ((mk ((())))) }; $!.division-by-zero /] calls=1 ids=1 depth=1
value/once/object              RANGEERROR: Maximum call stack size exceeded   calls=201 ids=201 depth=201
```

One handler call, which declines because its own body re-enters the masked
literal, and the array then holds the refusal as an ordinary element — the array
literal seam a13 §7 already documents, reached here from the other side. Worth
noting because a13 §5 now accepts self-recovery on the strength of
`[.$: {0}, 1 / 0]` answering `[.$: {0}; 0]`; the same shape with a _declining_
handler answers a half-failed array instead, which `isFailedResult` will stop
the next accumulator on.

## A6

**Under §6a the count is exactly one handler invocation per handler in scope, in
every shape built. Without §6a a chain of _n_ handlers costs (4ⁿ⁺¹ − 4)/3
invocations for a single failure.**

Four shapes, all with value masking and the parse-site identity: _n_ nested
scopes each declaring a declining handler; the same with handlers that fail on
their own rather than answering nil; three handlers with the failure buried in
_n_ redundant groups, to multiply the enclosing reduces; and _n_ handlers
chained through helpers so that handler _i_ runs inside handler _i−1_, which is
the shape value masking exists to allow.

With §6a on:

```
§6a ON, value masking:
1 nested declining handlers            calls=     1 ids=  1 depth=  1  $!.division-by-zero /
4 nested declining handlers            calls=     4 ids=  4 depth=  1  $!.division-by-zero /
10 nested declining handlers           calls=    10 ids= 10 depth=  1  $!.division-by-zero /
  handlers that fail on their own instead of answering nil:
6 nested failing handlers              calls=     6 ids=  6 depth=  1  $!.division-by-zero /
  three handlers, failure buried in N redundant groups:
3 handlers, group depth 1              calls=     3 ids=  3 depth=  1  $!.division-by-zero /
3 handlers, group depth 8              calls=     3 ids=  3 depth=  1  $!.division-by-zero /
  handlers chained through helpers, to maximise depth:
4 chained links                        calls=     4 ids=  4 depth=  4  $!.division-by-zero /
8 chained links                        calls=     8 ids=  8 depth=  8  $!.division-by-zero /
```

So a13's expectation that §6a makes this linear in the number of handlers is
confirmed, and group nesting — the thing that produced a13b Q1's four calls for
one handler — stops mattering entirely.

With §6a off, the same table, and the chained shape is the one to look at:

```
§6a OFF, value masking:
10 nested declining handlers           calls=    40 ids= 10 depth=  1  $!.division-by-zero /
3 handlers, group depth 8              calls=    19 ids=  3 depth=  1  $!.division-by-zero /
  handlers chained through helpers, to maximise depth:
1 chained links                        calls=     4 ids=  1 depth=  1  $!.division-by-zero /
2 chained links                        calls=    20 ids=  2 depth=  2  $!.division-by-zero /
3 chained links                        calls=    84 ids=  3 depth=  3  $!.division-by-zero /
4 chained links                        calls=   340 ids=  4 depth=  4  $!.division-by-zero /
5 chained links                        calls=  1364 ids=  5 depth=  5  $!.division-by-zero /
6 chained links                        calls=  5460 ids=  6 depth=  6  $!.division-by-zero /
7 chained links                        calls= 21844 ids=  7 depth=  7  $!.division-by-zero /
8 chained links                        calls= 87380 ids=  8 depth=  8  $!.division-by-zero /
```

4, 20, 84, 340, 1364, 5460, 21844, 87380 — exactly (4ⁿ⁺¹ − 4)/3, from the four
re-offers per enclosing reduce compounding at every link. Eight handlers, one
division by zero, 87,380 handler bodies run. Handler bodies are ordinary HC that
may write resources, so this is 87,380 _observable_ handler bodies.

**a13 §9's bound is a statement about depth, and depth was never the expensive
axis.** Depth is 8 in that run. The work is 87,380. §9's sentence is true and
almost irrelevant; §6a is what makes the design affordable, and a13 currently
files it under "how much repetition §6a's ruling actually removes" as a minor
open item.

**The worst-case invocation count** for one failure, under §6a plus value
masking, is one call per distinct handler literal that the failure passes
through, and the program shape that produces it is the chained one above: _n_
handlers, _n_ calls, depth _n_. The ceiling generalises to (handlers × failures)
rather than (handlers), because §6a's record is per-failure and every `1 / 0` is
a fresh failure object:

```
4 chained handlers, 1 independent failures: calls=4
4 chained handlers, 2 independent failures: calls=8
4 chained handlers, 3 independent failures: calls=12
```

That is the honest statement: linear in handlers for each failure, and the
number of failures is bounded by how much work the program does, not by anything
§9 or §6a controls.

## Where the bound comes from

Not the template set as a13 §9 means it, not the depth counter, and not any
property of `FrameLazy` identity in the sense a13 §9 describes. Precisely:

**The bound is the number of `{…}` closure literals in the parsed source, and it
holds because a13b's identity proxy resolves to an object created at parse time
and never re-created.** Three facts compose to give it:

1. `FrameList.copy` gives a clone a new array holding the same element objects,
   and no evaluator path rebuilds a closure's own body terms. So the first term
   of a closure body is fixed when the source is parsed, and is shared by every
   copy, every bound instance, and every read of that literal.
2. `FrameLazy` inherits the default `instanceCopy`, which answers `this`, so the
   object-semantic copy does not fork a handler either.
3. HC cannot parse at runtime. There is no eval, import or include, so the set
   of parsed literals is fixed for the life of a source unit.

Masking a running handler by that object therefore masks every future
re-evaluation of the same declaration, and recursion through a declaration
cannot outrun its own mask. Depth is bounded by the number of literals; A6
measures it reaching exactly that.

Three consequences a13 §9 should carry:

- **"The closure template" has to be spelled out as the parse site**, not as the
  closure, not as "that exact handler value", and not as the shared body. a13
  §9's existing caveat about `FrameSymbol.in` handing out fresh copies is both
  wrong (A1: reads answer one object) and aimed at the wrong risk (the risk is
  re-evaluated declarations, not re-read ones).
- **The bound is currently an accident of an implementation detail.** Nothing
  documents that a closure's body terms are never rebuilt, and nothing would
  fail if some future change rebuilt them — except this. An implementation
  should stamp an explicit template identity onto each `FrameLazy` when it is
  parsed and carry it through `copy`, so the guarantee is written down rather
  than inferred from `[...this.data]`.
- **Any future in-language eval, import, or macro expansion reopens this.** The
  set is finite because the source is finite. That should be recorded as a
  dependency of §9, not left implicit.

And the part a13 §6a has to give up: **§6a cannot use that identity.** A4 is a
recovery lost because it does. The two rulings need identities at different
grains, and a13's claim that they "deliberately share one notion of handler
identity" is the thing to withdraw.

## If the bound is false

It is not false, so the fallback question becomes narrower and more useful:
value masking is safe, but the version of it a13 and a13b describe is not the
version that works, and the §6a interaction has to be resolved either way.

**Recommendation: keep value masking, spell its identity as the parse site, and
give §6a a finer identity of its own — the bound closure instance.** Then §9's
mask stays coarse enough to bound the recursion and §6a's record stays fine
enough not to discard a live recovery. This was measured, not reasoned:

```
split: mask term, offer instance:
  A1 redeclared literal          $!.division-by-zero /           calls=  1 ids=  1 depth=  1
  A2 mutual recursion            $!.division-by-zero /           calls=  4 ids=  2 depth=  2
  A3 helper recursion            $!.division-by-zero /           calls=  2 ids=  2 depth=  2
  A4 two instances, one literal  “answered by division-by-zero”  calls=  3 ids=  1 depth=  1
  A5 aggregate rebuilt           [.recover { ((mk ((())))) }; $  calls=  1 ids=  1 depth=  1
  A6 eight chained handlers      $!.division-by-zero /           calls=  8 ids=  8 depth=  8
  nested recovery still works    “inner”                         calls=  2 ids=  2 depth=  2
```

Every attack terminates, A4's recovery is made, the chained cost stays linear
(measured to n=16), and the case value masking was chosen for — a handler
declared inside another handler's body — still fires.

**The trade-off, stated.** The split costs a second identity notion in the
implementation, and it weakens §6a's guarantee from "each handler body runs once
per failure" to "each handler _instance_ runs once per failure". A recursive
function that declares a handler and declines at ten levels will run ten handler
bodies for one failure instead of one. That is linear in call depth, it is
side-effect-visible, and it is the price of not silently dropping the tenth
level's recovery. The alternative reading — one identity, §6a's guarantee
intact, A4's recovery lost — trades a correctness property for a cost property,
which is the wrong direction.

The other two options a13c names are worse, for the record:

- **Key masking** is safe and needs no identity notion at all, and it is exactly
  what a13 §9 already rejected: A3's shape is the common one, and under key
  masking every recovery declared inside a handler or inside a helper a handler
  calls is dead code. a13b Q3 measured that; nothing here changes it.
- **A hard depth cap**, with or without value masking, buys nothing that the
  parse-site identity does not already give, and it would fire on legitimate
  programs at whatever number was picked. The spike carries a cap — a tripwire
  at a configurable invocation count — and it exists only so that a
  non-terminating attack reports instead of hanging. It is consulted after the
  guard, never before, and no terminating case in this document reaches it:

```
is never reached by any terminating case above ... ok (0ms)
```

## Checking the outward spelling

**a13 §7 and §11's correction is right at one level of invocation and wrong as a
general claim. `__` reaches the reason only when the handler body's innermost
invocation is exactly one call deep, and every wrong count fails silently.**

The claim a13 §7 makes, verified independently and confirmed:

```
; {.recover {_ = “division-by-zero” ? {“saw ” __}}; 1 / 0} ()
# “saw division-by-zero”
```

`_` names one enclosing invocation per underscore (`FrameArg.in` reads
`scope.argumentAt(this.data.length)`, and `EvaluationScope.argumentAt` walks
`enclosing` once per level). A conditional branch is one invocation, so `__`
reaches past exactly one of them. Two levels of branching need three:

```
; {.recover {_ = “division-by-zero” ? {(1 ? {“saw ” __})}}; 1 / 0} ()
# “saw ”
; {.recover {_ = “division-by-zero” ? {(1 ? {“saw ” ___})}}; 1 / 0} ()
# “saw division-by-zero”
```

An iterator callback is an invocation on the same terms, which makes the
under-counted spelling worse than empty — it answers the **element**, which
looks like a plausible reason:

```
; {.recover {[1] & {“saw ” __}}; 1 / 0} ()
# [“saw division-by-zero”]
; {.recover {[1] & {“saw ” _}}; 1 / 0} ()
# [“saw 1”]
; {.recover {[1] & {1 ? {“saw ” ___}}}; 1 / 0} ()
# [“saw division-by-zero”]
```

Over-counting fails silently too, and leaks: one level too far answers the file
scope, so the handler reports the whole program as the reason.

```
over-counting fails as silently as under-counting ... ok (0ms)
```

```ts
expect(last(".recover {([1] & {1 ? {“saw ” ____}})};", "(1 / 0)"))
  .toMatch(/^\[“saw \[\.recover/);
```

**Inside a helper the handler calls, no count reaches the reason at all.** This
is the case that matters most, because it is the case a13 §9 chose value masking
to protect. A helper's enclosing scope is where the helper's literal was
evaluated — the file scope — not the handler that called it, so the underscore
ladder does not run through the call at all. `__` there answers the file scope:

```
does not reach it inside a helper the handler calls, at any spelling ... ok (1ms)
```

```
$ deno run --allow-all lib/frames/masking-bound.probe.ts -a \
    '.show {“saw ” __};' '.recover {(show ())};' '(1 / 0)'
  .show { “saw ” __ }; .recover { ((show ((())))) }
  “saw [.show { “saw ” __ }; .recover { ((show ((())))) };]”
```

The spelling that works is to hand the reason over as an argument, which is
ordinary and needs nothing from this design:

```
; {.show {“saw ” _}; .recover {(show _)}; 1 / 0} ()
# “saw division-by-zero”
```

**So a13's discrimination story is worse than §7 and §11 now claim, and a13 §8
needs to say so.** The correction a13 made against a13b Q6 — "It is reachable;
the spelling is `__`" — is true of the one shape it was tested on and false as
written. What is actually true is narrower and less comfortable: the reason is
reachable from inside a handler body at a spelling that depends on how many
invocations deep the reader is, the author has to count them, a wrong count
answers nil or the wrong value or the file scope with no refusal raised, and no
count at all works across a helper call. That does not make
`lib/ops/conditionals.ts` in scope — nothing here asks a branch to receive its
argument differently — but it does mean §8's positional argument is carrying
more weight than §7 admits: a handler body that both tests the reason and
reports it is fragile in a way that only a named binding taken at the top of the
body avoids, which is the spelling a13b Q6 already found.
