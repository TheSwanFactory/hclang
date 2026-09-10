#!/usr/bin/env hc
```
Application and iteration, as desired (#368)

The companion to `apply.hc`, which records what the runtime does today. This
records what it would do under two changes, so the difference is executable
rather than argued:

1. `|` folds and `&` maps, the reverse of today.
2. A fold threads its accumulator as the receiver, so an accumulator value can
   be the second operand and applying each element to it is the fold.

Expectations that differ from today are marked `$!.unimplemented` with the
desired value, so this file reports rather than breaks, and reports again if the
behavior arrives while a marker is still here. Expectations with no marker are
invariants the change must not disturb.

The naming argument, first. Today `&` reduces while `&&` maps the metadata
plane, which is two unrelated meanings for one glyph. Under the swap `&` maps the
data plane and `&&` maps the metadata plane, so the doubled operator is the same
verb on the other plane. That consistency is the whole case for the rename, and
it is independent of anything about resources
```
; (.a 1, .b 2) && {_}
# [1, 2]
```
The application behavior a fold stands on does not change. Text joins and
answers a new value; an aggregate collects and answers itself. These are why an
accumulator value works at all
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
`&` maps. This is exactly what `|` does today, under the other glyph: the element
in the underscore, the zero-based index in the dot parameter
```
; [1, 2] & {_}
# $!.unimplemented [1, 2]
; [1, 2, 3] & {. }
# $!.unimplemented [0, 1, 2]
; [] & {_}
# $!.unimplemented []
```
Granularity is unchanged by the swap. A map over a non-aggregate is still one
element
```
; “abc” & {_}
# $!.unimplemented [“abc”]
; 1 & {_}
# $!.unimplemented [1]
```
`|` folds with a block exactly as `&` does today: the element in the underscore,
the accumulator in the dot parameter, seeded from the first element, so one
element folds to itself and an empty source answers nil
```
; [1, 2, 3] | {_ + .}
# $!.unimplemented 6
; [1] | {_}
# $!.unimplemented 1
; [] | {_}
# $!.unimplemented ()
```
Now the second change. When the second operand is a value rather than a block,
it is the accumulator, and the fold applies each element to it. An aggregate
therefore collects the elements
```
; [1, 2, 3] | []
# $!.unimplemented [1, 2, 3]
```
and text therefore joins them, because text application concatenates
```
; [1, 2, 3] | “”
# $!.unimplemented “123”
```
An empty source answers the seed untouched, which is the identity a block seed
cannot express
```
; [] | “seed”
# $!.unimplemented “seed”
```
That case already answers correctly for an aggregate, by coincidence rather than
by design: mapping nothing and folding nothing into an empty aggregate are both
the empty aggregate
```
; [] | []
# []
```
The two threadings are different enough to be worth stating plainly. A block is a
combiner: it is stateless, so the fold has to carry the accumulator beside it and
hand it over in the dot parameter. A value is an accumulator: it holds the state
itself, so the fold has nothing to carry. Both are folds and neither subsumes the
other, which means `|` reads its second operand two ways and that seam is the
part of this design still open.

Where the desire does not help. The aggregate-in-a-map trap does not disappear
under the swap, it relocates: the pushes land, the map wraps every answer, and
the result is the same array once per element. It was `| []` yesterday and it is
`& []` here
```
; [1, 2, 3] & []
# $!.unimplemented [[1, 2, 3], [1, 2, 3], [1, 2, 3]]
```
So an aggregate in a map slot is worth refusing on its own merits, whichever
glyph maps. The swap is a naming argument, not a fix for that.

What all of it is for. A write already answers the characters written, and under
a11 a read is a character fold, so the whole-content read is a fold into text and
the characters are a fold into an aggregate. These depend on the character read
as well as on the operators, so they are further out than everything above
```
; './out.txt' “hello”
# 5
; './out.txt' | “”
# $!.unimplemented “hello”
; './out.txt' | []
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
; './out.txt' & {_}
# $!.unimplemented [“h”, “e”, “l”, “l”, “o”]
```
Two things those four do not settle. Whether a character element is a string or a
symbol is open, and this file assumes strings. Whether a string enumerates its
own characters is also open: if it does, `“abc” & {_}` answers three elements
rather than one, and the expectation above is wrong in the other direction.
```
