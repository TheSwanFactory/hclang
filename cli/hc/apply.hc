#!/usr/bin/env hc
```
Application and iteration (#368)

Every HC program is a left fold of frame applications, so `apply` is the one
verb. What a frame does when applied is the whole of its behavior, and the
answers differ by family: text joins, an aggregate collects, a numeric
multiplies, a closure calls, a resource writes.

This document records that behavior as it is, because #368 turns on it. If a
read is a character fold, then whatever the fold pushes characters into is
whichever of these families it happens to be, and the shape of the fold has to
be chosen knowing what each one already does.

Text joins, and answers a new value rather than the receiver
```
; “a” “b”
# “ab”
; “” “h”
# “h”
```
A non-text argument contributes its spelling, which is the rule
`concatenateText` uses everywhere
```
; “a” 1
# “a1”
; “n=” 42
# “n=42”
```
A document joins the same way, publishing characters without its fences
```
; `doc` “x”
# “docx”
```
An aggregate collects, and answers itself. This is the difference that decides
everything below: text answers a new value, an aggregate answers the same one
```
; [] 1
# [1]
; [1] 2
# [1, 2]
; [1, 2] 3
# [1, 2, 3]
```
A void argument is not collected, so applying nil does not make an element
```
; [] ()
# []
```
An aggregate literal is fresh at every evaluation, so two folds into `[]` would
not share one
```
; [] 9
# [9]
; [] 9
# [9]
```
A numeric multiplies another numeric, and repeats text
```
; 2 3
# 6
; 2 “a”
# “aa”
```
A closure is called, with the argument in the underscore
```
; {_} 5
# 5
; {_ + 1} 2
# 3
```
An empty closure codifies its argument rather than discarding it
```
; {} 5
# (5)
```
A symbol declares
```
; .a 1
# .a 1
```
A schema matches and answers the evidence
```
; <> 1
# <>
; ~~1 2
# 2
```
A resource writes, and answers the characters written rather than the receiver
```
; './out.txt' “hello”
# 5
```
`|` maps. The element is in the underscore and the zero-based index is in the
dot parameter
```
; [1, 2] | {_}
# [1, 2]
; [1, 2, 3] | {. }
# [0, 1, 2]
```
`&` reduces. The element is in the underscore and the accumulator is in the dot
parameter, seeded from the first element, so a single element folds to itself and
an empty source answers nil
```
; [1, 2, 3] & {_ + .}
# 6
; [1] & {_}
# 1
; [] & {_}
# ()
```
`&&` maps the metadata plane instead of the data plane
```
; (.a 1, .b 2) && {_}
# [1, 2]
```
Granularity is whatever `asArray` answers, and that is one element for anything
which is not an aggregate. A string does not enumerate its characters
```
; “abc” | {_}
# [“abc”]
; 1 | {_}
# [1]
; [] | {_}
# []
```
So a resource read is one element holding the whole content, which is the
provisional reading #368 replaces
```
; './out.txt' & {_}
# “hello”
; './out.txt' | {_}
# [“hello”]
```
Now the part #368 has to decide. An empty aggregate looks like it should serve as
the seed of a fold, since applying one accumulates. It does not, because `&`
holds the block as the receiver and threads the accumulator through the dot
parameter, which an aggregate ignores. So the seed element is dropped and the
answer holds only what the later elements pushed
```
; [1, 2, 3] & []
# [2, 3]
```
Text is worse, because text answers a new value every time: the accumulator is
discarded at every step, and only the last element survives
```
; [1, 2, 3] & “”
# “3”
```
Threading the accumulator as the receiver instead, by applying each element to
the value accumulated so far, is what would make `& “”` answer the whole content
and `& []` answer the elements. That is the change #368 weighs, and these two
expectations are what it would alter.

A map is the wrong home for an aggregate either way. The pushes do land, because
application accumulates, but `|` wraps every answer, so the result is the same
array once per element: the accumulation is right and the value is wrong
```
; [1, 2, 3] | []
# [[1, 2, 3], [1, 2, 3], [1, 2, 3]]
```
Text in a map does not accumulate at all, and answers one value per element,
which is at least honest
```
; [1, 2, 3] | “”
# [“1”, “2”, “3”]
