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

- **Double quotes**: `"string content"`
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
- **mutating method**: `method:` (trailing colon)

### Access Modifiers (by leading underscores)

- **public**: `public` (default, no leading underscore)
- **protected**: `_protected` (single leading underscore)
- **private**: `__private` (double leading underscore)

### Special Identifiers

- **Anonymous argument**: `_` (single underscore)
- **Parent/super**: `^` (caret)
- **This**: `.` (dot by itself)

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

### Method Calls

```grammar
object.mutating_method: argument
parent_.helper: 10
```

## Context and Scope

### Scope Inheritance

- Everything inherits its current scope (closure-like)
- Lazy expressions inherit scope when evaluated
- Can be used as object factories

### Context References

- **Argument context**: `_` (applied context)
- **Parent context**: `^` (defined context)
- **This context**: `.` (current object)

## Syntax Highlighting Categories

### Brackets/Delimiters

- `{`, `}` - Lazy frame (closures)
- `[`, `]` - Array frame (lists)
- `(`, `)` - Expression frame (groups)

### Separaters

- `;` - Statement separator (non-enumerable)
- `,` - Expression separator (enumerable)

### String Literals

- `"..."` - String content
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
- Parent: `^`

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

# Class definition
.my-class {
  ._property _;
  .getProperty {^._property}
  .setProperty: {.^._property _}
}

# Method call with mutating method
my-instance.setProperty: 42
```

## Notes for Syntax Highlighters

1. **Comments are strings**: The `#` syntax creates string objects, not ignored
   text
2. **No keywords**: There are no reserved words; everything is an identifier or
   operator
3. **Context matters**: The same character can mean different things:
   - `.` alone = this
   - `.name` = property setter
   - `2.+` = method call on number
4. **Operators are properties**: Math operators are just syntactic sugar for
   property access
5. **Whitespace is significant**: Newlines act as separators and affect
   precedence
