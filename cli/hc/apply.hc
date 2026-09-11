#!/usr/bin/env hc
```
Apply and iterate: the decisions, and the corpus that holds them (#368)

`apply-tutorial.md` states the model. This file states the decisions behind it
and pins each one to an expectation, so a claim cannot quietly rot into prose.
The tutorial explains behavior and carries no argument; the argument lives here.

The model is implemented, so almost every expectation below is now an executable
assertion rather than a promise. The file that recorded v0.14.0's reversed
operator roles example by example was this one, and it has been replaced rather
than kept beside its own correction; git history holds it.

How to read. An expectation prefixed with `$!.unimplemented` is a promise:
HCTest reports it without failing the suite, and fails deliberately if the
behavior arrives while the marker remains. An expectation without that prefix is
an invariant these decisions must not break. This file runs in
`deno task test:doc`.

This file owns apply and iteration only. The wider property model — visibility,
schemas, handles, equality planes, and what a declaration does beyond writing a
property — was worked out in the a11.1 to a11.4 notes, which have been removed
now that their conclusions live here and in `spec/a11`. Those parts of the model
that iteration does not touch are therefore unspecified rather than settled, and
the notes are in git history.

Five decisions below were taken after those notes and reverse them. They are
collected at the end under what diverges, so a reader who remembers the earlier
design is corrected rather than left to notice.

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
# [2, 4, 6]
; [1, 2, 3] & “n=”
# [“n=1”, “n=2”, “n=3”]
```
A reduce threads instead of collecting, so the family it starts from supplies
the combining rule and no rule has to be specified
```
; [1, 2, 3] | []
# [1, 2, 3]
; [1, 2, 3] | “”
# “123”
; [1, 2, 4] | 1
# 8
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
not settled here. It is #375, reducible closures.

Nothing has to refuse a closure in the operator slot. It threads like any other
receiver and is merely useless, which is why no `$!.needs-a-value` refusal
appears anywhere in this design.

## An empty reduce is nil; an empty map is empty

**Decision.** An empty source reduces to nil whatever it started from, and maps
to an empty array.

A reduce with nothing to work with has no result to report, and v0.14.0 already
answered nil for every empty reduce regardless of what sat in the operator slot,
so this keeps behavior rather than inventing it. A map answers a collection of
answers, and no answers is an empty collection rather than the absence of one
```
; [] | “seed”
# ()
; [] | []
# ()
; [] & {_}
# []
; [] && {_}
# []
```
The cost is accepted rather than denied. A collect is not type-stable across an
empty source, so `xs | []` answers an array or nil depending on `xs`, and an
empty resource read answers nil rather than empty text. The alternative — an
explicit start value survives an empty source as its identity — is what the
earlier notes argued and what this file said before. It buys type stability and
pays by making the operator detect emptiness and answer with a value that never
took part.

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
# [2, 3]
; [.a 1] & {_}
# []
```
**Decision.** Canonical rendering puts the properties first, then the elements.
This reverses the spelling this file carried before. It makes print order agree
with the order the doubled operators iterate, and it leaves canonical output
re-readable as input, which elements-first rendering did not.

A declaration prints once, from the property plane it wrote, rather than also as
the data-plane echo an evaluated aggregate retains. Printing both put one value in
two places, and re-reading it declared the same name twice. The echo does print
when this value does not hold the property, because a declaration into an
enclosing scope leaves its echo here and its property there
```
; [.a 1; a, 2]
# [.a 1; 1, 2]
```
Whether a property written twice keeps the last write is a separate subject, and
is parked rather than answered here.

## Tuples restore the index a map withholds

`&` exposes only the element, so there is no address in the parameter slot. The
doubled operators widen the stream to the properties a caller can see, in
declaration order, then the elements by index, each synthesized as a
`[key, value]` tuple. The tuple is what `&&` forces, since a map hands its
receiver one argument, and it is an iteration argument only: no pair is stored

**Decision.** The key half of a tuple is the symbol that addresses the member,
not a spelling of it: `.meta` and `.0`, never `“meta”` and `0`
```
; [10, 20] && {_}
# [[.0, 10], [.1, 20]]
; [.meta 9; 10, 20] && {_}
# [[.meta, 9], [.0, 10], [.1, 20]]
; [10, 20, 30] && {_ .0}
# [.0, .1, .2]
```
A symbol is an address a caller can use, and the evaluator already resolves one
against both planes. Given `.pair [.meta, 9];` then `[.meta 1; 2, 3] (pair .0)`
answers `1`, and given `.ipair [.1, 20];` then `[10, 20] (ipair .0)` answers
`20`. Text is only a description of an address, and no legitimate operation turns
it back into one.

The cost is named rather than denied. A symbol argument addresses rather than
contributing its spelling, so `“n=” (pair .0)` answers `$!.name-missing` today,
and the position arrives as `.0` rather than `0`. Neither the spelling nor the
number is reachable from a tuple key. Both are additive later, and
recoverability runs only this way: an accessor can expose what a symbol spells,
while nothing short of evaluation promotes text to an address.

Canonical rendering therefore has to print the dot. `[meta, 9]` re-read is a
name lookup rather than a symbol, so dropping it costs the re-readability that
properties-first rendering was chosen for. v0.14.0 printed every symbol without
its dot, and the fix is narrower than reversing that: a symbol *in value
position* prints the dot, while one still awaiting lookup prints as written,
because `a` is exactly how a lookup is spelled
```
; .meta
# .meta
; {a + b}
# { a + b }
```

`||` reduces that same stream, threading the answer exactly as `|` does, so it
needs no calling convention of its own
```
; [.meta 9; 10, 20] || []
# [[.meta, 9], [.0, 10], [.1, 20]]
```
**Decision.** The vocabulary of this design is map and reduce, values and
tuples, properties and elements; `fold` and `entry` are retired, including
inside refusal names.

The complete view has no inverse. Folding tuples back does not rebuild the
value, because applying a pair to a frame does not merge it. Reconstruction is a
job for parsed syntax, not for iteration.

## The one refusal the surface depends on

`.0` already addresses the first element, so a `.0` property would be a second
meaning for an address that is taken, and would put two members under one key in
a doubled stream. Refusing it is what makes one key slot well-formed, whether or
not the index exists yet
```
; .0 9
# $!.numeric-key .0
```
A literal is answered by that refusal rather than holding it as a failed
statement, because the key collides with the addresses the aggregate itself
assigns: the value cannot be well-formed at all, so there is nothing to hand back.

That is narrow on purpose. A refused *write* — a schema mismatch, a constant, a
visibility grade — leaves a well-formed value with one write undone, and a caller
can still inspect it. Only an ill-formed key is promoted
```
; [.0 9; 1, 2]
# $!.numeric-key .0
; [.A 1; .A 2; 3]
# [.A 1; ($error{$is-constant .A}); 3]
```
## Resources are character reduces

Writing is application and answers the characters written. Reading supplies
characters, so what the read starts from is what shapes them
```
; './out.txt' | “”
# “hello”
; './out.txt' | []
# [“h”, “e”, “l”, “l”, “o”]
; './out.txt' & {_}
# [“h”, “e”, “l”, “l”, “o”]
```
A resource publishes its RFC 3986 components as readable properties, but they
describe the reference the value is rather than contents it holds, so they are
not part of the stream. A doubled read is indexed characters, and identity
metadata never leaks into content
```
; './out.txt' .path
# “./out.txt”
; './out.txt' && {_}
# [[.0, “h”], [.1, “e”], [.2, “l”], [.3, “l”], [.4, “o”]]
```
**Decision.** A refusal reaching a receiver mid-stream is collected by an
aggregate and consumed by nothing else. An operation on an error is an error, so
a refusal poisons a join or a multiply and answers itself; collecting is not such
an operation, and an aggregate that dropped the refusal would answer as though
the read had succeeded. This is what a10 relies on, and it is the same thing an
aggregate already did with a missing-name note
```
; './missing.txt' | []
# [$!.resource-absent './missing.txt']
; './missing.txt' | “”
# $!.resource-absent './missing.txt'
```
Only a resource read is a character source. A string is one element and does not
enumerate its characters, and neither does anything else that is not an
aggregate
```
; “abc” & {_}
# [“abc”]
; 1 & {_}
# [1]
```
## Where this reverses the earlier design

The removed notes specified each of these the other way. Listed so that a reader
who learned the earlier design gets corrected, and so a later reconciliation has
a list rather than a diff:

- **There is no closure form of reduce.** The notes gave a single fold
  first-element seeding with the accumulator in the parameter slot, and refused
  a block form of the doubled fold. Both rules go: `|` and `||` thread, and
  nothing refuses.
- **An empty reduce is nil**, whatever it started from. The notes gave an
  explicit seed to an empty fold as its identity.
- **Canonical rendering puts properties first.** Both the notes' spellings and
  this file's earlier ones rendered elements first.
- **A tuple key is a symbol**, not a spelling. The notes paired a value with a
  key or an index, which put `“meta”` and `0` in that slot.
- **`&` carries no address.** The notes left this open. Position is reachable
  only as `.0` by tuple projection under `&&`.

## What this file does not decide

- whether an aggregate in a map refuses. The notes refused it, on the ground
  that one accumulator cannot serve one answer per input. But `[1, 2, 3] & []`
  is ordinary application — each element collects into the array, which answers
  itself, so the map answers three references to one array. That is useless
  rather than incoherent, and refusing it is the same paternalism the closure
  form was retired for. It needs an argument beyond "you probably meant `|`";
- what a named accumulator does, which is #375 with the rest of the effect-axis
  question. An earlier draft of this file pinned an answer here by extrapolating
  copy-on-write from mutating methods, which no rule covers, and which the notes
  contradicted by making a named seed mutated and uninsulated;
- whether a string should enumerate characters, closing a11's asymmetry;
- what a receiver answering nil mid-reduce does to the accumulator;
- what a class must do to serve as an accumulator, which is #375;
- whether a stream's receiver contributes named entries;
- whether `()` becomes an ordered set, which is #374;
- what a property written twice does, which is parked above.
```
