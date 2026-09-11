#!/usr/bin/env hc
```
Properties, elements, and folds — the proposed model (#368)

This is the aspirational companion to `apply.hc`. `apply.hc` records v0.14.1;
this file is the target spelling for the minimax design in
`spec/a11.3-key-properties.md`, reviewed by `spec/a11.4-apply-new-review.md`.

**The operator roles are reversed from v0.14.1.** Today `|` maps and `&`
reduces, which is what `apply.hc` records and what `spec/a11-resource-iteration.md`
and `hc/resources.hc` still argue and read in. This proposal makes `&` map and
`|` fold. `&&` changes too: today it maps the metadata plane with the value in the
underscore and the key in the dot parameter, and here it maps one
`[key-or-index, value]` tuple per entry over properties *and* elements. A reader
who knows the current spelling will otherwise misread every operator example
below, self-consistently and without correction.

How to read this file. An expectation prefixed with `$!.unimplemented` is a
promise: HCTest reports it without failing the suite, and fails deliberately if
the behavior arrives while the marker remains. An expectation without that
prefix is an invariant the redesign must not break. A large unimplemented count
is the point; a failure is not. This file is not in `deno task test:doc`, because
it is transient: run it with `hc cli/hc/apply-new.hc -t`.

Two independent choices — map or fold, and positional elements or complete
entries:

  map, one answer per item:  `&` positional elements   `&&` complete entries
  fold, one answer in total: `|` positional elements   `||` complete entries

Only two nouns matter. A **positional element** is a member of the value's
ordered data. A **complete entry** is one item of the value's whole addressable
surface: every declared property the caller can see, then every indexed element,
each presented as `[key-or-index, value]`.

That answers the question the first column raises immediately — *what if I want
a property?* Properties are not positional elements, so the single operators do
not mix them into the data stream. They are addressable entries, so the doubled
operators include them, ahead of the indexed elements
```
; [.meta 1; 2, 3] & {_}
# $!.unimplemented [2, 3]
; [.meta 1; 2, 3] && {_}
# $!.unimplemented [[“meta”, 1], [0, 2], [1, 3]]
```
The fold spellings `|` and `||` take the same two streams; they need the
accumulator conventions below before their examples read sensibly.

## Application is still the one verb

Nothing here introduces an assignment or iteration special form. Text joins by
application and answers a new value; an array collects by application and
answers itself. That difference is why a value-seeded fold works at all, and it
is the whole mechanism behind `| “”` and `| []`
```
; “” “h”
# “h”
; “a” 1
# “a1”
; [] 1
# [1]
; [1] 2
# [1, 2]
```
## Properties are not elements

The dominant HC object is a list with configuration in its property plane. The
property stays available by name, while the data is just the data
```
; [.meta 1; 2, 3].meta
# 1
; [.meta 1; 2, 3] & {_}
# $!.unimplemented [2, 3]
```
The evaluated value prints canonically — elements in order, then public
properties. It does not reconstruct its source
```
; [.meta 1; 2, 3]
# $!.unimplemented [2, 3, .meta 1;]
```
A comma does not create implicit dual membership. Both declarations below write
one property, so the later valid write wins and neither write leaves an element
```
; [.a 1, .a 2].a
# 2
; [.a 1, .a 2]
# $!.unimplemented [.a 2;]
; (.a 1, .a 2)
# $!.unimplemented (.a 2;)
```
This is the case that decided the design. Making a comma declaration both keyed
and positional would need a permanent key-to-index map on every aggregate,
maintained through rebinding, copying, and aliasing forever. The property plane
holds the last valid write; the unkeyed `9` is the only element
```
; [.a 1, 9, .a 2]
# $!.unimplemented [9, .a 2;]
```
If a value should also be positional, read it explicitly. One extra read is the
price of not carrying that map
```
; [.a 1; a, 2]
# $!.unimplemented [1, 2, .a 1;]
```
The read is a value at that moment, not a live alias, so a later property write
does not silently rewrite an earlier element
```
; [.a 1; a, .a 2]
# $!.unimplemented [1, .a 2;]
```
Duplicate unkeyed values stay duplicate. Property override and set
deduplication are different ideas; #374 owns whether multi-value `()` becomes an
ordered set
```
; [.a 1; a, a, 2]
# $!.unimplemented [1, 1, 2, .a 1;]
```
Two names may denote one value without merging, and a declaration belongs to the
innermost aggregate being constructed rather than leaking outward
```
; [.a 1; .b a; a]
# $!.unimplemented [1, .a 1; .b 1;]
; [[.a 1;], 2]
# $!.unimplemented [[.a 1;], 2]
```
## Parentheses unbox only a property-free value

Parentheses group and unbox one ordinary value; square brackets keep the box
```
; (1)
# 1
; [1]
# [1]
```
A group that owns properties is itself an object, so it cannot vanish once
successful declaration evidence stops being an element. A property-only group is
not nil, and a property-bearing singleton stays grouped rather than copying
properties onto a possibly shared or interned atom
```
; (.a 1)
# $!.unimplemented (.a 1;)
; (.meta 1; 2)
# $!.unimplemented (2, .meta 1;)
```
This is deliberately conservative. A future identity-safe way to decorate a
scalar could relax the second result, and #374 could change what `()` collects,
without disturbing which values are elements.

## Statements execute; declarations configure

A semicolon still means execution order. A closure executes its statements and
answers its last result; a failure aborts execution and propagates instead
```
; {1; 2; 3}()
# 3
; {.x 1; @x 2; x}()
# 2
```
Declaration remains setter application. The construction performs the write and
consumes the successful declaration evidence rather than storing it as an
element. A failure is never consumed: constants and schemas stop execution with
their ordinary errors, in a closure and in an aggregate alike
```
; {.A 1; .A 2; 3}()
# $error{$is-constant .A}
; {.x <1,2> 1; @x 3; 4}()
# $!.type-error .x <1, 2> 3
; [.A 1; .A 2;]
# $!.unimplemented [($error{$is-constant .A}); .A 1;]
```
Consuming that evidence must not cost `^` its lvalue, which is the one consumer
the evidence exists for. A signature binding still resolves
```
; .join-name (.first “Jane”, .last) ^ {last “, ” first};
; join-name (.first “John”, .last “Doe”)
# “Doe, John”
```
This proposal does not settle whether *every* plain statement should be
non-enumerable. Existing statement wrappers stay visible; removing declaration
evidence does not require changing them
```
; [1; 2;]
# [(1); (2);]
```
## `&` maps positional elements

A map applies its block once per element and answers one result per element
```
; [1, 2, 3] & {_ * 2}
# $!.unimplemented [2, 4, 6]
; [] & {_}
# $!.unimplemented []
```
A single operator exposes only the element, in the underscore. The parameter slot
carries no index: v0.14.1's indexed map, `[1, 2, 3] | {. }` answering
`[0, 1, 2]`, moves to the doubled form below. That is a real ergonomic cost, and
it is what keeps the two axes independent instead of making `&&` redundant for
ordinary lists.

A property-only aggregate is where the two views diverge maximally, because it
has no elements at all
```
; [.a 1] & {_}
# $!.unimplemented []
```
A stateful aggregate belongs to a fold, not a map, in either map form. A map
wraps one answer per input, so an aggregate seed would hand every input an alias
of the same accumulator and answer a list of repeated aliases. Under the new
roles this mistake is spelled exactly like the current fold, so it is the
likeliest thing a reader of `apply.hc` will type, and it must refuse rather than
half-work
```
; [1, 2, 3] & []
# $!.unimplemented $!.aggregate-in-map
```
A string is one element and does not enumerate its characters. Only a resource
read is a character fold; a11 tracks that asymmetry as an open question, and
this file changes nothing about it
```
; “abc” & {_}
# $!.unimplemented [“abc”]
```
## `|` folds positional elements

A block fold keeps the element in the underscore and the accumulator in the dot
parameter. The first element seeds the accumulator, so a one-element fold is
itself and an empty block fold is nil
```
; [1, 2, 3] | {_ + .}
# $!.unimplemented 6
; [7] | {_ + .}
# $!.unimplemented 7
; [] | {_ + .}
# $!.unimplemented ()
```
A value can seed the fold instead of a block. Each element is applied to the
value accumulated so far, so an array collects and text concatenates. Unlike
first-element seeding, an explicit seed gives an empty fold an identity
```
; [1, 2, 3] | []
# $!.unimplemented [1, 2, 3]
; [1, 2, 3] | “”
# $!.unimplemented “123”
; [] | “seed”
# $!.unimplemented “seed”
```
The seed is threaded as the receiver, so `apply.hc`'s central distinction is
load-bearing here: an aggregate seed answers itself and is therefore mutated,
while a text seed answers a new value and leaves the original alone. A literal
seed is fresh per evaluation, which is why every example above is safe; a named
seed is not insulated
```
; .acc [];
; [1, 2] | acc;
; acc
# $!.unimplemented [1, 2]
```
An aggregate accumulator does not collect nil, which is the existing invariant
`[] ()` answering `[]`. What a block fold should do when it answers nil
mid-fold — skip, or let nil become the accumulator — is not settled here.

## `&&` and `||` take complete entries

Doubling does not select a second storage plane. It presents one stream over the
value's whole addressable surface: declared properties in canonical property
order, then positional elements in index order, each synthesized as
`[key-or-index, value]`. The tuple is what `&&` forces — a map hands its block one
argument, so the address and the value have to travel together — and it is an
iteration argument only; no pair is stored
```
; [10, 20] && {_}
# $!.unimplemented [[0, 10], [1, 20]]
; [.meta 9; 10, 20] && {_}
# $!.unimplemented [[“meta”, 9], [0, 10], [1, 20]]
; [] && {_}
# []
```
This is the repair of the defect a11.2 diagnosed. A value holding a dictionary
and a write log could answer with only one of them, and this expression picked
wrong
```
; (.a 1, .b 2) && {_}
# $!.unimplemented [[“a”, 1], [“b”, 2]]
```
Key and index share one slot, and a block can tell them apart by type, so the
risk is not dispatch — it is one address meaning two things. That is what a11.3's
numeric-key refusal buys, and why it refuses on a list whether or not the index
happens to exist yet
```
; [.0 9; 1, 2]
# $!.unimplemented $!.numeric-key .0
```
Projection is by tuple position, so the index the single map dropped is here
```
; [10, 20, 30] && {_.0}
# $!.unimplemented [0, 1, 2]
; [10, 20] && {_.1 * 2}
# $!.unimplemented [20, 40]
```
"Declared" is the load-bearing word, and visibility is a filter applied on top of
it. Schema companions, structural parent links, setter targets, and interpreter
bookkeeping are not entries merely because the host stores them in the same
object; private and protected keys are entries, but only where a caller could
have read them by name. The stream below is what a caller at top level sees
```
; [.__secret 1; .open 2; 3] && {_}
# $!.unimplemented [[“open”, 2], [0, 3]]
```
The doubled fold takes the same stream and applies each entry to the value
accumulated so far, so an array seed collects the whole stream
```
; [10, 20] || []
# $!.unimplemented [[0, 10], [1, 20]]
; [.meta 9; 10, 20] || []
# $!.unimplemented [[“meta”, 9], [0, 10], [1, 20]]
; [] || []
# $!.unimplemented []
```
`||` requires a value seed, and that is the whole of its calling convention: no
legal `||` binds a parameter slot. First-entry seeding would make the initial
accumulator a `[key, value]` tuple while every later accumulator is whatever the
step answered, so a block form has no coherent shape and refuses
```
; [10, 20] || {_}
# $!.unimplemented $!.entry-fold-needs-seed
```
The complete view has no inverse. `&&` answers real nested arrays, but folding
entries back does not rebuild the value: per a11.2, applying a pair to a frame
does not merge, and `(.z 9) (.a 1)` loses `.z`. Reconstruction is a job for
parsed syntax, not for entry iteration.

## Equality keeps the two planes explicit

Each equality answers one question, so none of them has to guess which plane is
the value and none needs a rendered-declaration heuristic
```
; [.meta 1; 2, 3] == [2, 3]
# $!.unimplemented <>
; [.meta 1; 2, 3] === [.meta 1;]
# <>
; [.meta 1; 2, 3] = [2, 3]
# ()
```
## Resources are character folds

Writing remains resource application and answers the count of characters written
```
; './out.txt' “hello”
# 5
```
Reading supplies characters. A map answers one result per character, a text seed
rebuilds the content, and an array seed keeps the characters
```
; './out.txt' & {_}
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
; './out.txt' | “”
# $!.unimplemented “hello”
; './out.txt' | []
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
```
A resource decomposes into RFC 3986 components that a10 keeps inert, and it
publishes them as readable properties. They are still not entries: they are
derived from the reference the value is, not properties a declaration wrote into
contents the value holds. So a doubled read is indexed characters, and identity
metadata never leaks into a content stream. The component below is the written
reference decomposed, before the normalization a write applies
```
; './out.txt'.path
# “./out.txt”
; './out.txt' && {_}
# $!.unimplemented [[0, “h”], [1, “e”], [2, “l”], [3, “l”], [4, “o”]]
```
This assumes one-character strings as the character value; choosing a symbol
would change the rendered leaves and nothing about the entry protocol. What the
named half of a stream should be — whether a chunker supplies keys for the
elements it emits — belongs to a11 and a11.1 with the rest of the receiver
question.

## What this file deliberately leaves open

Named so that silence is not mistaken for an answer:

- whether every plain statement becomes non-enumerable, beyond declarations;
- what a block fold does with a nil answer mid-fold;
- whether a string should enumerate characters, closing a11's asymmetry;
- whether a stream's receiver contributes named entries;
- whether `()` becomes an ordered set, which is #374.

Everything else above is either an invariant this redesign must preserve or a
promise it must keep. The normative statements behind the promises — rendering,
visibility, failure preservation, structural parenthood, and the equality
planes — are a11.3's to make; this file only has to show them working.
```
