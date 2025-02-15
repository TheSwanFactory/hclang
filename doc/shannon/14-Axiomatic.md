# HC as an Axiomatic System

HC is a self-bootstrapping constructivist theory of computation, intended to be a potential foundation for math (rather than vice versa), at least for physics. It is inspired by Quine's New Foundations, starting with two primitives:

- universal set: `<>` (all, the total type)
- empty set: `()` (nil, the empty expression)

## Binary Strings

We can label these as `1` and `0`, and use the sequence operator to generate binary strings:

```
; [] <binary> <> () <>
# 0b101
```

We can then impose an ordering (e.g., least-significant-bit first) on a binary string to create whole numbers:

```
; <lsb> 0b101
# 5
```

We call these Quine numbers, in contrast to the unary Peano numbers.  

### Quine Levels

All the binary strings of length `n` form a Quine Level, denoted `Q_n`, with cardinality `2^n`. 

When ordered, each level naively forms a modular Presburger arithmetic. However, in practice we assign `<>` as infinity (overflow) to avoid wraparound. 

```
U(3); 5 + 1
# 6
U(3); 5 + 3
# <>
```

## Appendix: Homiconic C Syntax

### Identifiers 

- `.name`
- `@alias`
- `$error`
- `value`
- `.` (self)
 
#### Effect

- `variable`
- `CONSTANT`
- `_protected`
- `__private`
- `mutable_`
- `mutating:` 

### Grouping:

-`()` expression (nil)
- `<>` type (all)
- `[]` sequence (cell)
- `{}` closure (loll)

## Terminals

- `,` expression
- `;` statement (_input prompt_)
- `#` comment (_output prompt_)
- `backquote` string

### Operators

### Primitive

- `?`, `:` if-then-else 
- `&`, `|` map-reduce
- `^` bind (_arguments to closures_)
- `<-` import 
- `->` yield

### Standard

- 0-9 whole numbers
- math, comparison
