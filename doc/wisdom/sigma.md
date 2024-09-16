# TSM-3: Sigma Calculus and the PEACE Monad

The Sigma Calculus is a formal system for deterministic stateful computation, both a generalization and simplification of the Lambda Calculus.

A system of Monads and Symbols for a computational system that is closed under left to right evaluation.
Using 'M' for monads and 'S' for symbols:

```sh
; M M
# M
; M .S
# M
; .S M
# M
; .S .S
# 
```

## PEACE Monads

The Sigma Calculus uses PEACE monads, a universal atomic unit of computation.  They can all have:

- named Properties like a dictionary
- finite Enumerables like an array
- an Action when applied to an argument, like closures/functions/methods
- hierarchical Context, like modules and classes
- Effect typing like in BitC

### Effect Typing

[The Fractor Model](https://ihack.us/2024/09/14/the-fractor-model-precise-shared-mutable-state-management-for-systems-programming/) uses syntactic conventions on the handle to indicate the type of effect:

- `lowercase` - immutable variable
- `UPPERCASE` - immutable constant
- `lowercase!` - mutable variable
- `UPPERCASE!` - mutable constant
- `lowercase:` - reassignable mutating method
- `UPPERCASE:` - unassignable mutating method

All mutating methods must return self.  In particular, applying a mutating method to a mutable reference will return the modified object, but applying it to an immutable reference will return a new copy.

### Primitive Monads

All grouping constructors and whole numbers are monads:

```sh
; [] 1 2 # Array constructor
# [1, 2]
; () 1 # Nil (false) - the empty expression (returns its argument)
# 1
; <> 1 # All (true) - the total type (returns true except for nil)
# <>
; <> ()
# ()
; {} 1 # No-Op - the void closure (always returns nil)
# ()
```

## Symbols

- Properties: letter + alphanumeric, eg `.a`, `.a1`, `.a1b`
- Whole Numbers: 0-9 + alphanumeric [non-negative], e.g. `42`, `0b01`, `0xdeadbeef`
- Operators: non-alphanumeric, e.g. `?`, `&&`, `|`, `<<`

When parsing, a leading `.` indicates on a symbol indicates is a `name` (which evaluates to a symbol) versus a `value` (which evaluates in the current or a parent context to a Monad)

### Nested Symbols

Symbols can be nested, with the dot indicating a property:

```sh
; .a [.b 4; 1, 2, 3]
# [.b 4; 1, 2, 3]
; a.b
# 4
;.a.b 6
# [.b 6; 1, 2, 3]
```

### Pre-Defined Operators

Operators are always binary: they return a closure when applied to a monad, which is then applied to the second argument. As such, the initial dot may be omitted.  

There are only a few primitive operations, which give rise to several built-in operators:

#### FOLD

The primitive iterator, used for:

- reduce ’|’  (directly)
- map ’&’ (indirectly)

#### NAND

The primitive logical operation used to implement the Boolean operators:

- AND &&
- OR ||
- THEN ?
- ELSE :

#### EQUAL

Used to test for equality.

- `==` equal value
- `===` identical object

The `=` operator is reserved, as traditional programmers equate it with assignment.

## Examples

```sh
; .array [.a 5; 1, 2, 3]
#  [.a 5; 1, 2, 3]
; array.a
# 5
; array.0
# 1
```
