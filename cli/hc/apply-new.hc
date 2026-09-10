#!/usr/bin/env hc
```
Properties, enumerables, and folds — one coherent model (#368)

This is the aspirational companion to `apply.hc`. `apply.hc` records 0.14.1;
this tutorial records the minimax design in `spec/a11.3-key-properties.md` and
the map/fold spelling under consideration in a11.1:

- a key creates a property, never an element;
- an element is positional only when the source says it as a value;
- `&` maps and `|` folds;
- a single operator exposes enumerable scalar elements;
- a doubled operator exposes every public addressable entry as
  `[key-or-index, value]`;
- a resource read is a character fold.

The four operators answer two independent questions:

|                     | map results | fold into one result |
| ------------------- | ----------- | -------------------- |
| enumerable elements | `&`         | `|`                  |
| complete entries    | `&&`        | `||`                 |

The distinction answers the question raised by the first row immediately: **if
I want a property, I choose the doubled form.** Properties are not positional
elements, so the single forms do not mix them into the scalar stream. They are
addressable entries, so the doubled forms include them, followed by the indexed
positional elements. The tuple is synthesized for iteration; it is not the
stored representation of either kind of entry
```
; [.meta 1; 2, 3] & {_}
# $!.unimplemented [2, 3]
; [.meta 1; 2, 3] && {_}
# $!.unimplemented [[“meta”, 1], [0, 2], [1, 3]]
; [.meta 1; 2, 3] | []
# $!.unimplemented [2, 3]
; [.meta 1; 2, 3] || []
# $!.unimplemented [[“meta”, 1], [0, 2], [1, 3]]
```
An expectation prefixed with `$!.unimplemented` is the desired result. HCTest
reports it without failing the suite, and deliberately fails when the behavior
arrives before the marker is removed. Expectations without that prefix are
invariants the redesign must preserve.

## Application is still the one verb

Nothing below introduces assignment or iteration special forms. Text joins by
application, and an array collects by application. A value-seeded fold works
because it repeatedly performs exactly this operation
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
property remains available by name, while ordinary iteration sees only `2` and
`3`
```
; [.meta 1; 2, 3].meta
# 1
; [.meta 1; 2, 3] & {_}
# $!.unimplemented [2, 3]
```
The evaluated value prints canonically: positional data first, then public
properties. It does not pretend to reconstruct the source
```
; [.meta 1; 2, 3]
# $!.unimplemented [2, 3, .meta 1;]
```
A comma does not create implicit dual membership. Both declarations below write
the same property, so the later valid write wins and neither write creates an
element
```
; [.a 1, .a 2].a
# 2
; [.a 1, .a 2]
# $!.unimplemented [.a 2;]
; (.a 1, .a 2)
# $!.unimplemented (.a 2;)
```
If the value should also be positional, read it explicitly. This one extra read
is the minimax price for not carrying a permanent key-to-index map on every
aggregate
```
; [.a 1; a, 2]
# $!.unimplemented [1, 2, .a 1;]
```
The read is a value at that moment, not a live alias. A later property write does
not silently rewrite an earlier element
```
; [.a 1; a, .a 2]
# $!.unimplemented [1, .a 2;]
```
Duplicate unkeyed values stay duplicate. Property override and set
deduplication are different ideas; issue #374 owns whether multi-value `()`
becomes an ordered set
```
; [.a 1; a, a, 2]
# $!.unimplemented [1, 1, 2, .a 1;]
```
## Parentheses unbox only a property-free value

The useful distinction remains: parentheses group and unbox one ordinary value,
while square brackets preserve the box
```
; (1)
# 1
; [1]
# [1]
```
A group that owns properties is itself an object and cannot disappear when its
declaration receipt leaves the data plane. A property-only group is not nil,
and a property-bearing singleton stays grouped rather than mutating or copying
properties onto a possibly shared atom
```
; (.a 1)
# $!.unimplemented (.a 1;)
; (.meta 1; 2)
# $!.unimplemented (2, .meta 1;)
```
This is conservative. A future identity-safe scalar-decoration operation could
relax the second result without changing which values are enumerable.

## Statements execute; declarations configure

A semicolon still means execution order. A closure executes each statement and
answers its last successful result
```
; {1; 2; 3}()
# 3
; {.x 1; @x 2; x}()
# 2
```
Declaration remains setter application. The construction performs the write,
but consumes the successful declaration evidence instead of storing it as an
element. A failed declaration is never consumed: constants and schemas still
stop execution with their ordinary errors
```
; {.A 1; .A 2; 3}()
# $error{$is-constant .A}
; {.x <1,2> 1; @x 3; 4}()
# $!.type-error .x <1, 2> 3
```
This proposal does not settle whether *every* plain statement should be
non-enumerable. Existing statement wrappers remain visible for now; removing
declaration receipts does not require changing them
```
; [1; 2;]
# [(1); (2);]
```
## `&` maps scalar elements

A map applies its block once per enumerable element and returns the results.
Properties remain available by name, but are not silently mixed into that
stream
```
; [1, 2, 3] & {_ * 2}
# $!.unimplemented [2, 4, 6]
; [] & {_}
# $!.unimplemented []
; [.meta 9; 1, 2] & {_}
# $!.unimplemented [1, 2]
```
The single operator exposes only the scalar element. To map properties as well,
choose `&&`, the complete-entry form.

## `&&` maps complete entries

The complete addressable view contains visible public properties first, then
indexed positional elements. `&&` maps each one as a synthesized
`[key-or-index, value]` tuple
```
; [10, 20] && {_}
# $!.unimplemented [[0, 10], [1, 20]]
; [10, 20] && {_.1 * 2}
# $!.unimplemented [20, 40]
; [.meta 9; 10, 20] && {_}
# $!.unimplemented [[“meta”, 9], [0, 10], [1, 20]]
```
Properties do not enter `&` because they are not elements; they do enter `&&`
because they are addressable entries. “Public” is important: schema companions,
private keys, structural links, and interpreter bookkeeping do not become
iterable merely because the host stores them alongside properties.

## `|` folds scalar elements

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
A value can be the seed instead of a block. The fold applies every element to the
value accumulated so far. An array collects and text concatenates
```
; [1, 2, 3] | []
# $!.unimplemented [1, 2, 3]
; [1, 2, 3] | “”
# $!.unimplemented “123”
```
Unlike a first-element-seeded block, an explicit value seed gives an empty fold
an identity
```
; [] | “seed”
# $!.unimplemented “seed”
```
An aggregate seed belongs to fold, not map. A map wraps one answer per input;
using a stateful aggregate there would repeat aliases to the same accumulator and
should be refused rather than half-work.

## `||` folds complete entries

The doubled fold receives each complete-view `[key-or-index, value]` tuple in the
underscore and keeps the accumulator in the dot parameter. A value seed can
collect the complete entry stream without stealing the accumulator slot for the
key or index
```
; [10, 20] || []
# $!.unimplemented [[0, 10], [1, 20]]
; [.meta 9; 10, 20] || []
# $!.unimplemented [[“meta”, 9], [0, 10], [1, 20]]
```
That is why doubling packages key and value together. The old convention put
index, property key, and accumulator in the same dot parameter; a complete-entry
fold cannot do all three.

## Resources are character folds

Writing remains resource application and answers the count of characters
written
```
; './out.txt' “hello”
# 5
```
Reading supplies characters. Mapping answers one result per character; folding
into text rebuilds the whole content; folding into an array preserves the
characters
```
; './out.txt' & {_}
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
; './out.txt' | “”
# $!.unimplemented “hello”
; './out.txt' | []
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
; './out.txt' && {_}
# $!.unimplemented [[0, “h”], [1, “e”], [2, “l”], [3, “l”], [4, “o”]]
```
This tutorial assumes one-character strings as the character value. Choosing a
symbol instead would change only the rendered leaves, not the receiver or entry
protocol.

## Edge rules, all from one separation

The rules above imply the difficult cases without another representation:

- a rebind changes one property and no hidden element;
- two property names may point to the same value without merging;
- an integer key on a list refuses rather than hiding behind an index;
- a structural parent declaration changes ancestry, not membership;
- a declaration inside a nested aggregate belongs to the innermost construction;
- failures remain values and cannot masquerade as omitted configuration;
- evaluated rendering is canonical value rendering, not source recovery;
- exact source and manifest analysis use the parsed frame graph.

The payoff is a base value with two honest storage planes but two deliberately
chosen iteration views: positional elements alone, or every public addressable
entry. No third keyed-slot map is needed to make every declaration both at once.
```
