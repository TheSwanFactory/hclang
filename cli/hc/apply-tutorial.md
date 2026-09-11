# Applying and iterating: a tutorial

HC has one verb. You write two values next to each other, and the left one — the
receiver — decides what that means (with help from double-dispatch).
Joining text, calling a function, collecting
into a list, and writing a file are all the same move, which is why there is no
assignment statement, no `for` loop, and no method-call syntax to learn.

Every `;` line is input you can type into the REPL. Run the file with `hc
cli/hc/apply-tutorial.hc`, or add `-t` to check the answers.

> NOTE: This file is currently ahead of the implemetnation

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

Nil is never collected, which is what makes a filter safe

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

### Properties vs elements

The tpyical HC object has keyed **properties** (ending in ';') and enumerable **elements** (ending in ',', which can be omitted at the end).
Read a property by name, and an element by index.

```css
; [.meta 1; 2, 3].meta
# 1
; [.meta 1; 2, 3].0
# 2
```

## Iterating

Iteration asks two questions, and they are independent. First how many answers
you want back, then what each step gets to see.

**Map or reduce.** A map answers one value per item, so its answer is as long as
what you iterated; reach for it to transform. A reduce answers one value in
total, carrying an accumulator from item to item; reach for it to sum, join, or
collect. `&` maps and `|` reduces.

**Values or tuples.** A single operator streams the value's ordered data and
hands your closure each value on its own. Doubling widens the stream to
everything the value can be asked for — every property you can see, then every
indexed element — and hands you a `[key-or-index, value]` tuple instead, so a
step knows which address it is looking at. `&&` maps tuples and `||` reduces
them.

The two choices combine freely, and that is the whole operator surface

- map, one answer per item:     `&` values,   `&&` tuples
- reduce, one answer in total:  `|` values,   `||` tuples

One term for the rest of the file: the enuemrated data is the value's **elements**.
The keyed data is the **properties**.
A property is not an element, so the second choice is what decides whether you
ever see one.

## Properties are not elements

The tpyical HC object has keyed properties (ending in ';') and enumerable elements (ending in ',', which can be omitted at the end).
Read a property by name, and an element by index.

```css
; [.meta 1; 2, 3].meta
# 1
; [.meta 1; 2, 3].0
# 2
; [.meta 1; 2, 3] & {_}
# [2, 3]
```

So a property-only value has nothing to iterate with the single operators

```css
; [.a 1] & {_}
# []
```

Use the doubled operators when you want the properties too. They come first, then
the indexed elements

```css
; [.meta 1; 2, 3] && {_}
# [[“meta”, 1], [0, 2], [1, 3]]
```

A comma does not make a declaration positional. The property plane keeps the last
write, and only the unkeyed value is an element

```css
; [.a 1, 9, .a 2].a
# 2
; [.a 1, 9, .a 2]
# [9, .a 2;]
```

When you want a value to be both, read it back explicitly. That read is the value
at that moment, not a live alias

```css
; [.a 1; a, 2]
# [1, 2, .a 1;]
```

## `&` maps elements

Put a closure on the right of `&` to get one answer per element

```css
; [1, 2, 3] & {_ * 2}
# [2, 4, 6]
; [“a”, “b”] & {“<” _ “>”}
# [“<a>”, “<b>”]
```

The element arrives in the underscore. The single form carries no index; if you
need one, use `&&` below. An empty source answers an empty array

```css
; [] & {_}
# []
```

A named closure works the same way and usually reads better

```css
; .double {_ * 2};
; [1, 2, 3] & double
# [2, 4, 6]
```

## `|` reduces elements

`|` answers a single value. With a closure, the element is in the underscore and
the running accumulator is in the dot parameter. The first element seeds it, so a
one-element reduce is itself and an empty one is nil

```css
; [1, 2, 3] | {_ + .}
# 6
; [7] | {_ + .}
# 7
; [] | {_ + .}
# ()
```

You can seed with a value instead of a closure. Each element is applied to what
you have accumulated so far, so an array collects and text concatenates —
exactly what applying those receivers already does. A seed also gives an empty
source an identity to answer with

```css
; [1, 2, 3] | []
# [1, 2, 3]
; [1, 2, 3] | “”
# “123”
; [] | “seed”
# “seed”
```

## `&&` and `||` take tuples

Doubling widens what you iterate rather than switching to some other plane. You
get the properties you can see, in declaration order, then the elements by index,
each as a `[key-or-index, value]` tuple

```css
; [10, 20] && {_}
# [[0, 10], [1, 20]]
; [.meta 9; 10, 20] && {_}
# [[“meta”, 9], [0, 10], [1, 20]]
; [] && {_}
# []
```

Project by position, which is where the index the single map dropped comes back

```css
; [10, 20, 30] && {_.0}
# [0, 1, 2]
; [10, 20] && {_.1 * 2}
# [20, 40]
```

Keys and indices share one slot, so a numeric key is refused rather than quietly
becoming an index

```css
; [.0 9; 1, 2]
# $!.numeric-key .0
```

`||` reduces that same stream, and it always needs a value seed. There is no
closure form: the first item is already a pair, which makes a useless accumulator

```css
; [.meta 9; 10, 20] || []
# [[“meta”, 9], [0, 10], [1, 20]]
; [10, 20] || {_}
# $!.entry-fold-needs-seed
```

Reducing tuples does not rebuild the value they came from. Applying a pair to an
object does not merge it, so treat the tuple stream as a way to read a value, not
as a way to copy one.

## Reading a resource

Writing is application. Reading is a reduce, and what it supplies is characters,
so pick the seed that shapes them the way you want

```css
; './out.txt' | “”
# “hello”
; './out.txt' | []
# [“h”, “e”, “l”, “l”, “o”]
; './out.txt' & {_}
# [“h”, “e”, “l”, “l”, “o”]
```

A resource also publishes its URI parts by name, and reading one performs no
access. Those parts describe the reference, not the content, so they never appear
in a stream: a doubled read gives you indexed characters

```css
; './out.txt'.path
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

## Three things to watch for

An aggregate belongs in a reduce, not a map. A map wraps one answer per input, so
an array in a map would hand every element the same accumulator; it is refused
instead. This is the shape a habit from the current release will produce

```css
; [1, 2, 3] & []
# $!.aggregate-in-map
```

A literal seed is transient: it is fresh at every evaluation and nothing else can
see it, so two reduces into `[]` cannot collide and you never have to ask whether
the reduce wrote to it. Ask that question of a *named* seed, where the name's
effect type answers it. An ordinary name is immutable, so the reduce copies on
write: you get the accumulated value back and the name still holds what it held

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

## Where to look next

`apply.hc` records what the shipped interpreter does today, including the `|` and
`&` roles this tutorial reverses. `apply-new.hc` is the full proposal, with the
cases that motivate each rule and the questions still open.

```css
