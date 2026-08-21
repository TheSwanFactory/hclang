# Homoiconic C Grammar Reference

This document describes the grammar rules for Homoiconic C (HC) syntax
highlighting and parsing.

## Overview

HC has no traditional grammar, keywords, or reserved words. Everything is
expressed through:

- Three types of aggregate frames
- Primitive types
- Identifiers with semantic prefixes/suffixes

## Aggregate Frames

### Frame Types

- **FrameLazy** (closures/functions): `{ ... }`
- **FrameArray** (tuples/lists): `[ ... ]`
- **FrameExpr** (groups/precedence): `( ... )`

### Separators

- **Non-enumerable** (dictionary-like): `;` (semicolon)
- **Enumerable** (array-like): `,` (comma)

### Whitespace

- Spaces: allowed for indentation
- Tabs: **forbidden** (fatal error)
- Newlines: act like commas (terminators, influence binding)

## Primitives

### Strings

- **Smart quotes**: `“string content”` (canonical; nests without escapes)
- **ASCII quotes**: `"string content"` (input spelling of the same value; run
  length selects nesting depth, so `""` is empty and `"""…"""` allows interior
  `"` runs)
- **Resource identifiers**: `'scheme:path?query#fragment'` (inert URI reference
  naming something outside the program)
- **Documents**: `` `GFM prose` `` (odd backtick run opens, an equal run closes)
- **Comments** (also strings):
  - Inline: `#Comment text#`
  - End-of-line: `#Comment to end of line`

### Numeric Types

#### Integers

- **Decimal**: `123`
- **Binary**: `0b11` (prefix: `0b`)
- **Octal**: `0o1337` (prefix: `0o`)
- **Hexadecimal**: `0xDEADBEEF` (prefix: `0x`)

#### Non-Integers

- **Rational**: `1/3`
- **Float**: `123.456`
- **Scientific**: `123.456.E.-10`
- **Semver**: `123.456.p123`

#### Time Types

- **Date**: `%date%`
- **Time**: `%time%`
- **DateTime**: `%datetime%`

### BLOBs (Binary Large Objects)

- **Raw bytes**: `\5\Bytes` (backslash prefix)
- **Base64**: `0sBASE64` (prefix: `0s`)

## Identifiers

### Identifier Types by Prefix

- **Names** (setters): `.property` (leading dot)
- **Values**: `variable` (no prefix)
- **Controls**: `@control` (leading `@`)
- **References**: `$reference` (leading `$`)

### Effect Typing (by case/suffix)

- **CONST**: `UPPERCASE` (begins with uppercase letter)
- **variable**: `lowercase` (does not begin with uppercase)
- **mutable**: `mutable_` (trailing underscore)
- **immutable**: `immutable` (default, no trailing underscore)
- **mutating method**: `method_` (trailing underscore)

One marker spells the whole effect axis: a trailing underscore touches identity,
whether it names a mutable handle or declares a method that may write its
receiver. The colon is therefore only the if-else operator, and a name is
complete at a colon with or without intervening space.

### Access Modifiers (by leading underscores)

- **public**: `public` (default, no leading underscore)
- **protected**: `_protected` (single leading underscore)
- **private**: `__private` (double leading underscore)

### Special Identifiers

- **Anonymous argument**: `_` (single underscore; `__` reaches the enclosing
  call's argument, and so on per underscore)
- **Parent declaration**: `.^` (declares the parent; `.^ base`)
- **Enclosing scope**: `_^` (`_^.var`). Each caret is exactly one enclosing
  lexical scope: `_^^` is two scopes out. The count depends only on where the
  closure was written, never on how it was invoked. `_`/`__` and `_^`/`_^^` are
  two unrelated ladders — one walks argument scopes, the other lexical scopes —
  so `_^` is not "`_` plus one" and never skips a level to compensate for how it
  was called.
- **Iterator parameter**: `.` (dot by itself). Inside a block called by `|`,
  `&&`, or `&`, the bare name denotes what the iterator supplies alongside the
  value: the element index, the property key, or the running accumulator, as in
  `[1, 2, 3] & { . + _ }`. It is the only spelling for that role; `_^` never
  reads it.

A method reads its own and its inherited properties by plain name, so there is
no reader spelled `^`: `^.property` is not a super reference.

## Predefined Operators

### Mathematical Operators

All mathematical operators can use optional `.` prefix:

- Addition: `+` or `.+`
- Subtraction: `-` or `.-`
- Multiplication: `*` or `.*`
- Division: `/` or `./`

### Comparison Operators

- **Equality**: `=` (comparison only, never assignment)
- **Greater than**: `>`
- **Less than**: `<`
- **Member of**: `~` (predicate/membership test)

### Logical Operators

- **Not**: `!`
- **Conditional (if)**: `?` (evaluates argument if truthy)
- **Else**: `:` (evaluates argument if falsy)

### Functional Operators

- **Map**: `|` (pipeline/map operation)
- **Reduce**: `&` (fold/reduce operation)

### Type Operators

- **Type specification**: `<` and `>` (used for static typing)

## Special Values

### Nil (False)

- **Empty expression**: `()`
- Used as boolean false
- Nothing is a member of nil

### All (True)

- **Universal set**: `<>`
- Used as boolean true
- Everything is a member of all
- Negation of nil: `!()`

## Expression Structure

### Binary Expressions

```grammar
identifier operator identifier
2 + 2
mean - deviation
```

### Property Access

```grammar
object .property
numbers .min
```

### Function Application

```grammar
closure argument
square 3
mag (.x 1; .y 2;)
```

A closure body evaluates semicolon-separated statements in source order and
returns the value of its last statement. For example, `{1; 2}` returns `2`.
Declarations made by an earlier statement remain available to later statements
in the same call, so `{.k {7}; k()}` returns `7`. A body containing only one
statement retains its existing value and representation. A statement that fails
ends the sequence, so the statements after it do not run.

### Declaration Scope in a Call

A closure declares into a frame belonging to the call, not into the argument it
was given. The argument is read-only for the duration of the call:

```hc
.f {.x _; x}
f 3
# 3 — `x` names the argument here; the argument itself is unchanged
```

Those declarations live only for that call. They are visible to later statements
in the same body, and they are gone once the call returns, because the body's
value is its last statement rather than the frame it declared into:

```hc
.broken {.a 1; .b 2;}
.o broken()
# `o` is the last statement, so `o.a` is missing
```

To return something with reachable properties, construct and return an
aggregate. This is the idiom for object factories and classes:

```hc
.Point {[.X _; .getX {X}]}
.first (Point 3)
first.getX()
# 3
```

### Method Calls

```grammar
object.mutating_method_ argument
parent_.helper_ 10
```

## Context and Scope

### Scope Inheritance

- Everything inherits its current scope (closure-like)
- Lazy expressions inherit scope when evaluated
- Used as object factories by returning an aggregate, as in `{[.X _;]}`

### Context References

- **Argument context**: `_` (applied context)
- **Enclosing context**: `_^` (defined context; one lexical scope per caret,
  regardless of how the closure was invoked)
- **Declared parent**: `.^ base` (inheritance, read by plain name)
- **Iterator parameter**: `.` (the index, key, or accumulator supplied by `|`,
  `&&`, or `&` alongside the value)

## Syntax Highlighting Categories

### Brackets/Delimiters

- `{`, `}` - Lazy frame (closures)
- `[`, `]` - Array frame (lists)
- `(`, `)` - Expression frame (groups)

### Separaters

- `;` - Statement separator (non-enumerable)
- `,` - Expression separator (enumerable)

### String Literals

- `“...”` - String content (canonical)
- `"..."` - String content (ASCII alias, printed with smart quotes)
- `'...'` - Resource identifier (inert URI reference)
- `` `...` `` - Document content (GFM prose)
- `#...#` - Inline comment
- `#...` - End-of-line comment

### Number Literals

- Integers: `123`, `0b11`, `0o1337`, `0xDEADBEEF`
- Floats: `123.456`, `123.456.E.-10`, `123.456.p123`
- Rationals: `1/3`

### Time Literals

- `%...%` - Date/time/datetime

### Binary Literals

- `\...\` - Raw bytes
- `0s...` - Base64 data

### Operators

- Math: `+`, `-`, `*`, `/`
- Comparison: `=`, `>`, `<`, `~`
- Logic: `!`, `?`, `:`
- Functional: `|`, `&`

### Identifiers by Category

- Names (setters): `\.\w+[:_]?`
- Controls: `@\w+`
- References: `\$\w+`
- Values: `\w+[:_]?`

### Special Constants

- Nil: `()`
- All: `<>`
- Anonymous: `_`
- Enclosing scope: `_^`
- Iterator parameter: `.`

## Example Patterns

```hc
# Dictionary with properties
[.x 1; .y 2;]

# Array with elements
[1, 2, 3]

# Composite (dictionary + array)
[.name "weights"; 85, 110, 165]

# Closure with anonymous argument
.square {_ * _}

# Closure with named arguments
.mag {(x * x) + (y * y)}

# Conditional expression
(1 > 5) ? 100 : 10

# Map operation
[1, 2, 3] | {_ + 1}

# Reduce operation
[1, 2, 3] & {. + _}

# Class definition: a closure returning a fresh aggregate
.my-class {
  [._property _;
   .getProperty {property}
   .setProperty_ {@property _;}]
}

# Inheritance, declaring the parent
.my-subclass {
  [.^ my-class;
   .describe {property}]
}

# Method call with mutating method
my-instance.setProperty_ 42
```

## Notes for Syntax Highlighters

1. **Comments are strings**: The `#` syntax creates string objects, not ignored
   text
2. **Quote runs matter**: `"` and `` ` `` are classified by maximal run length,
   so a highlighter cannot treat either as a single-character delimiter
3. **Apostrophes are not quotes**: `'` opens a resource identifier, which may
   not contain whitespace
4. **No keywords**: There are no reserved words; everything is an identifier or
   operator
5. **Context matters**: The same character can mean different things:
   - `.` alone = this
   - `.name` = property setter
   - `2.+` = method call on number
6. **Operators are properties**: Math operators are just syntactic sugar for
   property access
7. **Whitespace is significant**: Newlines act as separators and affect
   precedence
