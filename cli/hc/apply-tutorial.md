# Applying and iterating: a tutorial

HC has one verb. You write two values next to each other, and the left one — the
receiver — decides what that means (with help from double dispatch). Joining
text, calling a function, collecting into a list, and writing a file are all the
same move, which is why there is no assignment statement, no `for` loop, and no
method-call syntax to learn.

Every `;` line below is input you can type into the REPL, and every `#` line is
the answer it prints back. Input that itself ends in `;` is a statement, so it
answers nothing and no `#` line follows it.

> NOTE: This tutorial defines the model; the implementation is still catching up
> to it. Where the two disagree today, the tutorial is right and the interpreter
> is behind.

## Applying a value

### Text

Text joins, and a non-text argument contributes its spelling

```css
; “a” “b”
# “ab”
; “n=” 42
# “n=42”
```

### Numbers

A number multiplies another number, and repeats text

```css
; 2 3
# 6
; 2 “a”
# “aa”
```

### Arrays

An array collects, so applying is how you push

```css
; [] 1
# [1]
; [1, 2] 3
# [1, 2, 3]
```

### Nil

Nil, written `()`, is never collected, which is what makes a filter safe

```css
; [1] ()
# [1]
```

### Closures

A closure is called, with the argument in the underscore

```css
; {_ + 1} 2
# 3
; {“hi ” _} “bob”
# “hi bob”
```

### Resources

A resource writes, and answers the number of characters written

```css
; './out.txt' “hello”
# 5
```

### Properties and elements

An HC object holds two kinds of contents, and telling them apart is the one
thing to learn before the operators. The typical object has keyed
**properties**, each written with a terminating `;`, and enumerated
**elements**, separated by `,` where the last separator is optional. Read a
property by name and an element by index.

```css
; [.meta 1; 2, 3] .meta
# 1
; [.meta 1; 2, 3] .0
# 2
```

A value prints its properties first and its elements second, which is also the
order the doubled operators iterate them. So when you want one value to be both
a property and an element, read it back explicitly. That read is the value at
that moment, not a live alias

```css
; [.a 1; a, 2]
# [.a 1; 1, 2]
```

## Iterating

Iteration adds no verb either. Both operators apply each element to the value on
their right, and they differ only in what becomes of each answer. `|` keeps the
answer as the receiver for the next element, so it hands you one value in total.
`&` keeps the answers apart, so it hands you one per element.

Doubling either operator changes what gets applied rather than what happens to
the answer. `|` and `&` stream the elements and apply each value on its own,
while `||` and `&&` stream everything the value can be asked for — every
property you can see, then every indexed element — and apply a
`[key-or-index, value]` tuple, so a step knows which address it is looking at.

- `|` reduces values, `||` reduces tuples
- `&` maps values, `&&` maps tuples

## `|` reduces elements

`|` applies each element to the accumulator and keeps the answer as the
accumulator for the next one. You choose what to start from, and its family is
the combining rule, because the rule is only ever what applying to that family
does: an array answers itself and so collects, text answers new text and so
joins, a number answers a new number and so multiplies. What you start from is
also what an empty source answers

```css
; [1, 2, 3] | []
# [1, 2, 3]
; [1, 2, 3] | “”
# “123”
; [1, 2, 4] | 1
# 8
; [] | “seed”
# “seed”
```

A closure is the same move with the rule written out instead of inherited. The
element is in the underscore and the accumulator is in the dot parameter, which
is the receiver the other families thread for you. Starting from a closure
leaves no accumulator, so the first element becomes one: a one-element reduce is
that element, and an empty one is nil

```css
; [1, 2, 4] | {_ + .}
# 7
; [7] | {_ + .}
# 7
; [] | {_ + .}
# ()
```

Write a closure when no family performs the rule you want. Addition is the plain
example: nothing applies as a sum, so the source a closure adds to 7 is the one
a number multiplies to 8. A closure also covers the rules with no value to start
from, like a maximum.

## `&` maps elements

`&` applies each element the same way, and keeps the answers apart instead of
threading them. A closure is the usual receiver, though nothing here is special
to closures

```css
; [1, 2, 3] & {_ * 2}
# [2, 4, 6]
; [“a”, “b”] & {“<” _ “>”}
# [“<a>”, “<b>”]
; [1, 2, 3] & “n=”
# [“n=1”, “n=2”, “n=3”]
```

The element is in the underscore, and there is no index; use `&&` when you need
one. A named closure works the same way and usually reads better

```css
; .double {_ * 2};
; [1, 2, 3] & double
# [2, 4, 6]
```

Only elements are streamed, so properties stay behind, and a value with no
elements answers an empty array

```css
; [.meta 1; 2, 3] & {_}
# [2, 3]
; [.a 1] & {_}
# []
; [] & {_}
# []
```

## Doubling takes tuples

`||` and `&&` widen the stream to the properties you can see, in declaration
order, then the elements by index, each arriving as a `[key-or-index, value]`
tuple. Mapping the tuples is the shortest way to see the whole stream

```css
; [10, 20] && {_}
# [[0, 10], [1, 20]]
; [.meta 9; 10, 20] && {_}
# [[“meta”, 9], [0, 10], [1, 20]]
; [] && {_}
# []
```

Project by tuple position. This is where the index that `&` withholds comes back

```css
; [10, 20, 30] && {_ .0}
# [0, 1, 2]
; [10, 20] && {_ .1 * 2}
# [20, 40]
```

Keys and indices share one slot, so a numeric key is refused rather than quietly
becoming an index

```css
; [.0 9; 1, 2]
# $!.numeric-key .0
```

`||` reduces that same stream, and it always needs a value to start from.
Starting from a closure has no coherent answer, because the first item is
already a pair

```css
; [.meta 9; 10, 20] || []
# [[“meta”, 9], [0, 10], [1, 20]]
; [10, 20] || {_}
# $!.tuple-reduce-needs-seed
```

Reducing tuples does not rebuild the value they came from, because applying a
pair to an object does not merge it. The tuple stream is a way to read a value,
not a way to copy one.

## Reading a resource

Writing is application. Reading is a reduce over characters, so what you start
from is what shapes them

```css
; './out.txt' | “”
# “hello”
; './out.txt' | []
# [“h”, “e”, “l”, “l”, “o”]
; './out.txt' & {_}
# [“h”, “e”, “l”, “l”, “o”]
```

A resource also publishes its URI parts by name, and reading one performs no
access. Those parts describe the reference, not the content, so they never
appear in a stream: a doubled read gives you indexed characters

```css
; './out.txt' .path
# “./out.txt”
; './out.txt' && {_}
# [[0, “h”], [1, “e”], [2, “l”], [3, “l”], [4, “o”]]
```

A missing file answers a refusal, which iteration collects like any other value
rather than raising

```css
; './missing.txt' | []
# [$!.resource-absent './missing.txt']
```

## Pitfalls

An array answers itself, so mapping over one would collect the same array once
per element. It is refused rather than half-working. An array belongs on the
right of `|`, where threading one answer forward is the whole point

```css
; [1, 2, 3] & []
# $!.aggregate-in-map
```

A value you start from is usually a literal, and a literal is transient: it is
fresh at every evaluation and nothing else can see it, so two reduces into `[]`
cannot collide and you never have to ask whether the reduce wrote to it. Ask
that question of a *named* accumulator, where the name's effect type answers it.
An ordinary name is immutable, so the reduce copies on write: you get the
accumulated value back and the name still holds what it held

```css
; .acc [];
; [1, 2] | acc
# [1, 2]
; acc
# []
```

A trailing underscore names a mutable handle, and reducing into that fills the
array you named

```css
; .acc_ [];
; [1, 2] | acc_
# [1, 2]
; acc_
# [1, 2]
```

Anything that is not an aggregate iterates as a single element, so text does not
enumerate its characters. Read a resource when you want characters

```css
; “abc” & {_}
# [“abc”]
; 1 & {_}
# [1]
```

## Where the current release differs

Version 0.14.1 assigns the single operators the other way around: `|` maps and
`&` reduces, seeded from the first element. Its `&&` maps the properties alone,
with the value in the underscore and the key in the dot parameter rather than a
tuple, and `||` is unbound. `apply.hc` records that behavior example by example,
so reach for it when you are working against the release rather than against
this tutorial.
