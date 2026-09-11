#!/usr/bin/env hc
```
Apply and iterate: the design record (#368)

`apply-tutorial.md` states the model. This file states the decisions behind it
and pins each one to an expectation, so a claim cannot quietly rot into prose.
The tutorial explains behavior and carries no argument; the argument lives here.

`apply.hc` records v0.14.1. The operator roles here are reversed from it: `&`
maps and `|` reduces. A reader who knows the release will otherwise misread
every example below, self-consistently and without correction.

How to read. An expectation prefixed with `$!.unimplemented` is a promise:
HCTest reports it without failing the suite, and fails deliberately if the
behavior arrives while the marker remains. An expectation without that prefix is
an invariant these decisions must not break. A large unimplemented count is the
point; a failure is not. This file is not in `deno task test:doc`, because it is
transient: run it with `hc cli/hc/apply-new.hc -t`.

`spec/a11.3` owns the property model — visibility, schemas, handles, equality
planes, and what a declaration does. This file owns apply and iteration only.
Four decisions below were taken after a11.3 was written and reverse it; they are
collected at the end under what diverges.

## Application is the one verb

What a family answers when applied is the whole of its behavior. Every decision
below rests on these
```
; “a” “b”
# “ab”
; “” “h”
# “h”
; 2 3
# 6
; 2 “a”
# “aa”
; [] 1
# [1]
; [1] 2
# [1, 2]
; [] ()
# []
; {_ + 1} 2
# 3
; './out.txt' “hello”
# 5
```
Two of those answers decide the shape of iteration. An array answers itself, so
applying to one accumulates in place. Text answers a new value, so applying to
it produces something to carry forward.

## Iteration is application, twice

A map applies each element to the value on its right and collects the answers. A
reduce applies each element and keeps the answer as the receiver for the next
one. That is the only difference, and neither adds a verb.

The direction never varies: the right operand is the receiver and the element is
the argument. A map with a text receiver is therefore as ordinary as a map with
a closure, which is worth pinning — a closure-only map would make the operator a
special form rather than an application
```
; [1, 2, 3] & {_ * 2}
# $!.unimplemented [2, 4, 6]
; [1, 2, 3] & “n=”
# $!.unimplemented [“n=1”, “n=2”, “n=3”]
```
A reduce threads instead of collecting, so the family it starts from supplies
the combining rule and no rule has to be specified
```
; [1, 2, 3] | []
# $!.unimplemented [1, 2, 3]
; [1, 2, 3] | “”
# $!.unimplemented “123”
; [1, 2, 4] | 1
# $!.unimplemented 8
```
## There is no closure form of reduce

**Decision.** `|` threads, always. It does not inspect what it was handed, and
there is no second calling convention in which a closure holds position while
the running value travels in the dot parameter.

An earlier draft had that convention, and it was a special form wearing an
operator's clothes. Threading means the answer of one step is the receiver of
the next, so a receiver only carries a rule across elements if it answers
something that still holds the rule. An array answers itself. Text answers new
text. A closure answers whatever its body answers, so it is spent after one
element and the rest of the source applies to that answer. Both outcomes are
ordinary application: either the answer accumulates, or the receiver has to
answer itself.

So the reduce rules are exactly the ones the families already provide — collect,
join, multiply — and a custom rule needs a receiver that answers itself while
carrying state in its own properties. Classes are implemented, so that receiver
is constructible today, but what a class must do to serve as an accumulator is
not settled here. It is tracked separately as reducible closures.

Nothing has to refuse a closure in the operator slot. It threads like any other
receiver and is merely useless, which is why no `$!.needs-a-value` refusal
appears anywhere in this design.

## An empty reduce is nil; an empty map is empty

**Decision.** An empty source reduces to nil whatever it started from, and maps
to an empty array.

A reduce with nothing to work with has no result to report, and 0.14.1 already
answers nil for every empty reduce regardless of what sits in the operator slot,
so this keeps behavior rather than inventing it. A map answers a collection of
answers, and no answers is an empty collection rather than the absence of one
```
; [] | “seed”
# $!.unimplemented ()
; [] | []
# $!.unimplemented ()
; [] & {_}
# $!.unimplemented []
; [] && {_}
# []
```
The cost is accepted rather than denied. A collect is not type-stable across an
empty source, so `xs | []` answers an array or nil depending on `xs`, and an
empty resource read answers nil rather than empty text. The alternative — an
explicit start value survives an empty source as its identity — is what a11.3
argues and what this file said before. It buys type stability and pays by making
the operator detect emptiness and answer with a value that never took part.

## Properties are not elements

The dominant HC object is a list with configuration in its property plane. The
single operators walk the elements only, so a property never reaches a receiver
and a value whose contents are all properties has nothing to iterate.

Reading a property or an index is application, and is spelled as application
```
; [.meta 1; 2, 3] .meta
# 1
; [.meta 1; 2, 3] .0
# 2
; [.meta 1; 2, 3] & {_}
# $!.unimplemented [2, 3]
; [.a 1] & {_}
# $!.unimplemented []
```
**Decision.** Canonical rendering puts the properties first, then the elements.
This reverses the spelling this file carried before. It makes print order agree
with the order the doubled operators iterate, and it leaves canonical output
re-readable as input, which elements-first rendering did not
```
; [.a 1; a, 2]
# $!.unimplemented [.a 1; 1, 2]
```
Whether a property written twice keeps the last write is a separate subject, and
is parked rather than answered here.

## Tuples restore the index a map withholds

`&` exposes only the element, so there is no index in the parameter slot. The
doubled operators widen the stream to the properties a caller can see, in
declaration order, then the elements by index, each synthesized as a
`[key-or-index, value]` tuple. The tuple is what `&&` forces, since a map hands
its receiver one argument, and it is an iteration argument only: no pair is
stored
```
; [10, 20] && {_}
# $!.unimplemented [[0, 10], [1, 20]]
; [.meta 9; 10, 20] && {_}
# $!.unimplemented [[“meta”, 9], [0, 10], [1, 20]]
; [10, 20, 30] && {_ .0}
# $!.unimplemented [0, 1, 2]
```
`||` reduces that same stream, threading the answer exactly as `|` does, so it
needs no calling convention of its own
```
; [.meta 9; 10, 20] || []
# $!.unimplemented [[“meta”, 9], [0, 10], [1, 20]]
```
**Decision.** The vocabulary of this design is map and reduce, values and
tuples, properties and elements; `fold` and `entry` are retired, including
inside refusal names.

The complete view has no inverse. Folding tuples back does not rebuild the
value, because applying a pair to a frame does not merge it. Reconstruction is a
job for parsed syntax, not for iteration.

## Two refusals the surface depends on

Keys and indices share one slot in a tuple, so a numeric key would make one
address mean two things. Refusing it is what makes the doubled stream
well-formed, whether or not the index exists yet
```
; [.0 9; 1, 2]
# $!.unimplemented $!.numeric-key .0
```
An array answers itself, so a map over one would collect the same array once per
element. It refuses rather than half-working, and this is the mistake a reader
of the release will make, because it is how 0.14.1 spells a reduce
```
; [1, 2, 3] & []
# $!.unimplemented $!.aggregate-in-map
```
## What a named accumulator does

A literal start value is fresh at every evaluation and nothing else can see it,
so reduces into `[]` cannot collide. A named one is reached through its effect
type: an ordinary name is immutable and copies on write, so the reduce answers
the accumulated value and the name still holds what it held
```
; .acc [];
; [1, 2] | acc
# [1, 2]
; acc
# []
```
A trailing underscore names a mutable handle, so the reduce fills the array
```
; .acc_ [];
; [1, 2] | acc_
# [1, 2]
; acc_
# $!.unimplemented [1, 2]
```
## Resources are character reduces

Writing is application and answers the characters written. Reading supplies
characters, so what the read starts from is what shapes them
```
; './out.txt' | “”
# $!.unimplemented “hello”
; './out.txt' | []
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
; './out.txt' & {_}
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
```
A resource publishes its RFC 3986 components as readable properties, but they
describe the reference the value is rather than contents it holds, so they are
not part of the stream. A doubled read is indexed characters, and identity
metadata never leaks into content
```
; './out.txt' .path
# “./out.txt”
; './out.txt' && {_}
# $!.unimplemented [[0, “h”], [1, “e”], [2, “l”], [3, “l”], [4, “o”]]
```
A refusal is a value the iteration collects like any other
```
; './missing.txt' | []
# [$!.resource-absent './missing.txt']
```
Only a resource read is a character source. A string is one element and does not
enumerate its characters, and neither does anything else that is not an
aggregate
```
; “abc” & {_}
# $!.unimplemented [“abc”]
; 1 & {_}
# $!.unimplemented [1]
```
## Where this diverges from a11.3

Named so that a later reconciliation has a list rather than a diff:

- **There is no closure form of reduce.** a11.3 gives a single fold
  first-element seeding with the accumulator in the parameter slot, and refuses
  a block form of the doubled fold. Both rules go: `|` and `||` thread, and
  nothing refuses.
- **An empty reduce is nil**, whatever it started from. a11.3 gives an explicit
  seed to an empty fold as its identity.
- **Canonical rendering puts properties first.** Both a11.3's companion
  spellings and this file's earlier ones rendered elements first.
- **`&` carries no index**, which a11.4 left as a question. The index is
  reachable only by tuple position under `&&`.

## What this file does not decide

- whether a string should enumerate characters, closing a11's asymmetry;
- what a receiver answering nil mid-reduce does to the accumulator;
- what a class must do to serve as an accumulator, which is reducible closures;
- whether a stream's receiver contributes named entries;
- whether `()` becomes an ordered set, which is #374;
- what a property written twice does, which is parked above.
```
