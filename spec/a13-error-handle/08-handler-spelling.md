# Choosing the Handler's Spelling

**Status:** Litigation of one open item, sequel to
[`07`](07-what-blocks-implementation.md). The candidate space is enumerated by
measurement rather than by taste, two of `07`'s claims are corrected, and one
route gains a cost nobody had priced. It recommends, and it names the ruling the
recommendation is contingent on — which is not a naming ruling.\
**Design record:** [`../a13-error-handle.md`](../a13-error-handle.md), the first
and second Open items.\
**Prior:** [`07`](07-what-blocks-implementation.md) §1–§2 established that the
spelling does not block implementation and recommended an identifier.
[`03`](03-recovery-spike-findings.md) Q4 is the visibility evidence D10 rests
on.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Measured at**
[`29f85cb`](https://github.com/TheSwanFactory/hclang/commit/29f85cb) with the
unmodified interpreter, except §5, which names one temporary one-line edit and
reverts it. Every result below is pasted REPL output; a nil answer prints no
line, so probes that could answer nil are wrapped in an aggregate to make the
answer unambiguous.

**The short version.** `07`'s recommendation survives, but not for the reason it
gave: the argument that `.::` adds an arity is wrong, and invocability does not
distinguish any candidate, because every closure-valued property is callable.
What distinguishes the classes is narrower and sharper. One operator-class
spelling, `.:`, **shadows the if-else operator on any frame that declares it** —
measured, and decisive. The remaining operator-class spellings shadow nothing
and cost only a silent missing dot. The reserved-sigil route costs more than
`07` priced: it changes the meaning of `.$`, which `doc/GRAMMAR.md` pins as
legal, and it makes the handler unspellable in value position. That last effect
is a feature for machinery and a problem for D2. The choice reduces to one
question that is not about names, and a07 owns it.

## 1. What the rulings require of a spelling

Six requirements, each traceable to a ruling rather than to preference.

- **R1. Declares.** `.X {…}` lexes as one property name.
- **R2. Reads back.** `.X` answers the handler, so the declaration round-trips.
- **R3. Visible, not an element.** D10: it appears in a doubled stream's keys
  and not in a single stream's elements.
- **R4. Resolvable the way D2 says.** D2 says lookup is "exactly as any other
  property read." [`03`](03-recovery-spike-findings.md)'s spike implemented that
  as a bare-name resolution, so a spelling that cannot be written as a bare name
  constrains the implementation to key-based lookup.
- **R5. Fails loudly when mistyped.** A spelling one character from something
  else must not silently mean the other thing.
- **R6. Costs no ruling the language already bought.**
  [`a05c`](../a05c-unified-effect-marker.md) removed the mutating colon and
  states the outcome as "the colon is only the if-else operator, at every
  position."

R1–R3 are satisfied by every surviving candidate and are not discriminating.
R4–R6 decide this.

## 2. Two corrections to 07

**`.::` does not add an arity, and the record should not say it does.** `07` §2
argues that `[.:: {0}, 1] :: 9` answering `0` is "the thing those rulings deny,
reachable by accident," and the record repeated it. It is an ordinary member
read followed by application. Nothing extends `?:`, and the grammar gains
nothing.

**Invocability distinguishes nothing.** Every closure-valued property is
callable from source, whatever its class:

```
[.on-fail {0}, 1] .on-fail 9   => 0
[.:: {0}, 1] .:: 9             => 0
[.zz {0}, 1] .zz 9             => 0
```

So "it makes the handler callable" is not an argument against any candidate.
What survives from `07` §2 is the **dotless** form, which is R5, and the a05c
argument, which is R6. Both are real and neither is about arity. This corrects
`07` §2's first bullet and the corresponding clause in the record.

## 3. Route A: an ordinary identifier

`.recover`, `.on-fail`, `.on-error` all satisfy R1–R4, and R5 in the strongest
form available: a missing dot produces a visible diagnostic rather than a
different meaning.

```
[.on-fail {0}, 1] on-fail 9    => [.on-fail { 0 }; 1, $!.name-missing …, 9]
{.on-fail {7}; {(on-fail ())} ()} ()  => 7
[.on-fail {0}, 1] && {_ .0}    => [.on-fail, .0]
[.on-fail {0}, 1] & {_}        => [1]
```

The bare-name read resolves through a nested closure, so R4 holds for either
implementation of the lookup. `doc/GRAMMAR.md` supports the class directly: "No
keywords: There are no reserved words; everything is an identifier or operator."

**The case against.** It is indistinguishable from the program's own data, which
is the whole of the second Open item: any frame in the lookup chain can declare
one, deliberately or by collision, and thereby answer for failures in code it
did not write. Route A does not mitigate that; it accepts it.

**On the word.** `.on-fail` is more distinctive than `.recover` and its hyphen
matches the vocabulary D6 hands the handler, so `.on-fail` receiving
`“division-by-zero”` reads as one idea. `.recover` is likelier to collide with a
program's own method. `.Recover` also lexes, but uppercase is the documented
CONST marker in the effect-typing axis, so it would assert something about
effects that is not meant. The word is the cheapest thing here to change later.

## 4. Route B: an operator-class key

`:`-bearing and other operator-character keys are property names today, so this
route needs no grammar change and reads as something other than program data.
There is precedent: `.^` declares a parent, so the language already spells a
structural declaration with an operator-class key, and `++` is the note-extras
key.

**One candidate is decisively out.** `.:` shadows the if-else operator on any
frame that declares it:

```
[([1] : {9})]                  => [()]     baseline: truthy source, else skips
[([.: {0}, 1] : {9})]          => [0]      the handler runs instead
[([.z {0}, 1] : {9})]          => [()]     an ordinary key does not interfere
```

That is not a legibility complaint. Declaring `.:` changes what `x : {…}` means,
which is R6 violated outright and exactly the property a05c bought.

**The rest shadow nothing**, because the operator table binds only `:` and `?`:

```
[([.:: {0}, 1] : {9})]         => [()]     if-else intact
[.:: {0}, 1] ? {5}             => 5        conditional intact
[.?: {0}] .?:                  => { 0 }
[.!: {0}] .!:                  => { 0 }
[.!: {0}, 1] && {_ .0}         => [.!:, .0]
```

`.!:` deserves a mention on vocabulary grounds: `!` is already the refusal
character in `$!.…`, so `.!:` reads as "on refusal, branch" in the family D6
draws its argument from.

**The case against all of them.** R4 fails — an operator-class key is not
resolvable as a bare name, so the handler cannot be referenced or invoked by a
program, and the implementation is constrained to key-based lookup:

```
{.?: {7}; (?: ())} ()          => ?:       resolves to itself, not the handler
{.~: {7}; (~: ())} ()          => ~:
```

R5 fails too — the dotless form silently invokes, where an identifier would
raise a note:

```
[.:: {0}, 1] :: 9              => 0
[.!: {0}, 1] !: 9              => 0
```

And R6 is strained even by the survivors: `.::` invites `a ? {…} :: {…}`, which
is the reading D1's rejection of `::`-as-a-third-leg exists to prevent, and any
colon in name position spends some of what a05c bought even where it shadows
nothing.

## 5. Route C: a reserved sigil namespace

`$` is documented as the language's own namespace, so `.$recover` marks the
handler as machinery in a family that already means that. `07` §1c prices it at
one guarded condition in the name recognizer and reports the suite green. That
reproduces — and two costs come with it that `07` did not report.

With that one edit in place, temporarily, then reverted:

```
[.$recover {0}] .$recover      => { 0 }    R1, R2 hold
[.$recover {0}, 1] && {_ .0}   => [.$recover, .0]   R3 holds
$                              => $        anchors intact
$$                             => $$
.set$                          => invalid dollar form: .set$   suffix still rejected
```

**Cost one: it changes a spelling `doc/GRAMMAR.md` pins as legal.** The grammar
states that `.$` "stays legal" as a boundary case, and it means `.` followed by
the anchor. Under the edit it becomes a property name:

```
.$ 1        => .$ 1        (baseline: $!.name-missing “.”;)
[.$ 9] .$   => 9
```

So the route is one line of code plus an amendment to a documented rule, not one
line of code.

**Cost two: the handler becomes unspellable in value position.** The dollar
family rejects the form outright, so R4 does not merely constrain the
implementation, it forbids the bare-name route:

```
[.$recover {0}, 1] $recover 9  => invalid dollar form: $r
```

Read one way this is the best property any candidate has: a program cannot name,
call, or shadow the handler, and R5 is satisfied loudly rather than quietly.
Read the other way it contradicts D2's "exactly as any other property read" and
D10's "ordinary visible data," which is the pair of rulings Route C would force
a revision to.

`.@recover` is the same route through the control family and does not currently
lex either — `@` is no more accepted in a name than `$` is — so it would need
the same change and buys nothing extra:

```
[.@recover {0}] .@recover      => [$!.name-missing “.”;]
```

**On the axiom.** "There are no reserved words" rules out a reserved _word_, not
a reserved _sigil family_; the note family `$!`, `$+`, `$-`, `$~`, `$=`, `$>`
already is one. So Route C is consistent with the axiom, and Route A is
consistent with it more cheaply.

## 6. Ruled out by measurement

The full enumeration, so nobody has to rediscover these:

```
.$: {0}; 1                     => ((()); 1)        needs leading-$ and kind-mixing
$: {0}                         => $!.name-missing $.:   not vacant: member read on the anchor
[.! {0}] .!                    => [<>, <>]         does not form the key
[.~recover {0}] .~recover      => [.~ $!.name-missing …]   kinds do not mix
[.-recover {0}] .-recover      => [.- $!.name-missing …]   kinds do not mix
[.^: {0}] .^:                  => $!.parent-not-declarable .^
```

`.$:` is the record's original spelling and is the worst of the candidates: it
needs Route C's change **and** a kind-mixing exception on top, and `$:` is not
even vacant. `^`-bearing keys are unavailable because a name completes at `^`
and `.^` is the parent declaration.

## 7. The matrix

| spelling                | R1 declares | R2 reads back | R4 bare name  | R5 mistype        | R6 costs a ruling | grammar change                    |
| ----------------------- | ----------- | ------------- | ------------- | ----------------- | ----------------- | --------------------------------- |
| `.on-fail` / `.recover` | yes         | yes           | yes           | visible note      | no                | none                              |
| `.Recover`              | yes         | yes           | yes           | visible note      | asserts CONST     | none                              |
| `.::`                   | yes         | yes           | **no**        | **silent invoke** | invites `? ::`    | none                              |
| `.?:` / `.!:`           | yes         | yes           | **no**        | **silent invoke** | colon in a name   | none                              |
| `.:`                    | yes         | yes           | **no**        | **silent invoke** | **shadows `:`**   | none                              |
| `.$recover`             | yes         | yes           | **forbidden** | lexical error     | amends GRAMMAR    | one guarded line                  |
| `.$:`                   | **no**      | —             | —             | —                 | —                 | two, one of them a kind exception |
| `.@recover`             | **no**      | —             | —             | —                 | —                 | one guarded line                  |

## 8. Recommendation

**Take Route A, spelled `.on-fail`, unless a07 rules that the handler key must
be unforgeable — in which case take Route C, spelled `.$recover`, and pay the
GRAMMAR.md amendment and a revision to D2 and D10 openly.**

Route B is not recommended in any form. Its one honest advantage is that it
reads as machinery for free, and it pays for that with R4 and R5 — the handler
cannot be named by a program, and a missing dot silently runs it. Route C buys
the same advantage more convincingly, for one line, and Route A does not need
it.

The recommendation is contingent because the contingency is real: if a frame
received as data can install a handler for failures in code it did not write,
then the spelling is a security control and Route C's unspellability stops being
an awkward side effect and becomes the point.
[`09`](09-combination-step-guard.md) Q7 is the measurement that settles whether
it can, and a07's threat model is what should read the answer.

## Noted, not resolved here

- **Whether the key must be unforgeable.** The record's second Open item, and
  the only input this document needs that it does not have.
- **Which word, if Route A wins.** `.on-fail`, `.on-error`, and `.recover` are
  mechanically identical. The recommendation rests on distinctiveness and on
  matching D6's hyphenated vocabulary, which is taste with a reason rather than
  a measurement.
- **Whether D2 and D10 survive Route C.** "Exactly as any other property read"
  and "ordinary visible data" are both stated of a key that Route C would make
  unspellable in value position. If Route C wins, both need rewording, and the
  rewording is not obviously bad — a handler that a program cannot name is
  arguably what D10's dissent wanted.
- **Whether `.!:` is worth reopening on vocabulary grounds.** It reads as "on
  refusal" in D6's own family. It is still Route B and still fails R4 and R5, so
  it would need an argument that those do not matter.
