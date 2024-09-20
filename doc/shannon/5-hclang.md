# TSM-5: Homoiconic C (HC) Syntax Cheat Sheet

## Introduction

Homoiconic C ("HC") is a minimalist and highly expressive alternative to traditional programming languages. It eschews traditional grammar, keywords, and reserved words, focusing instead on a single type of object called a Frame. HC's syntax is a thin veneer over its robust semantics, which are centered around ubiquitous scope, consistent evaluation, and homoiconicity (symmetry between code and data). This cheat sheet provides an overview of HC's key syntactical elements.

## 1. Frames

Everything in HC is a Frame, which combines aspects of dictionaries, arrays, and functions. There are three types of Aggregate Frames:

- **FrameLazy**: `{ closure }` - Functions
- **FrameArray**: `[ tuple ]` - Lists
- **FrameExpr**: `( group )` - Precedence

## 2. Separators

- **Statement Separator**: `;` (dictionary-like, non-enumerable)
- **Expression Separator**: `,` (array-like, enumerable)
- **Newline**: Acts as a comma for separating expressions.

## 3. Primitives

HC has three types of primitive Frames:

### 3.1 Strings

- Smart quotes: `"Strings"`
- Inline comments: `#Comments#` or `#End-of-line#`

### 3.2 Numeric

#### 3.2.1 Integer

- Decimal: `123`
- Binary: `0b11`
- Octal: `0o1337`
- Hexadecimal: `0xDEADBEEF`

#### 3.2.2 Non-Integer

- Rational: `1/3`
- Float: `123.456`
- Scientific: `123.456E-10`
- Semver: `123.456.p123`

#### 3.2.3 Times

- `%date%`
- `%time%`
- `%datetime%`

### 3.3 BLOBs (Binary Large Objects)

- Direct byte representation: `\5\Bytes`
- Base64 encoding: `0sBASE64`

## 4. Identifiers

Apart from aggregates and primitives, everything else is an identifier:

- `.Names` - Set a property
- `Values` - Access a value
- `@Controls` - Control flow
- `$References` - References to other objects

## 5. Expressions

A sequence of identifiers and primitives forms an expression.

### 5.1 Binary Operators

- Math operators: `+`, `-`, `*`, `/` (e.g., `2 + 2`)
- Comparisons: `=`, `>`, `<` (e.g., `1 = 5`)
- Nil (`false`): `()` is equivalent to nil or false.
- All (`true`): `<>` represents the universal set or true.

### 5.2 Closures

- Defined as lazy expressions: `{ expression }`
- Evaluate by applying an argument: `closure ()`

### 5.3 Arguments

- Anonymous argument: `_`
- Argument lists: Insert values into the closure's scope.

### 5.4 Inheritance and Scope

- Super: `^` refers to the parent context.
- This: `.` refers to the current object.

## 6. Examples

In Homoiconic C, classes, singletons, and inheritance
are just design patterns on top of the core syntax.

### 6.1 Classes

Classes are closures that can create instances:

    my-class {
      ._property _;
      .getProperty { ^._property }
      .setProperty: { .^._property _ }
    };

### 6.2 Singletons

Singletons are non-lazy constructors:

    my-singleton (
      ._property _;
      .getProperty { ^._property }
      .setProperty: { .^._property _ }
    );

### 6.3 Inheritance

Specify a parent for inheritance:

    my-subclass {
      .^ my-class
    };

## 7. Predefined Operators

### 7.1 Conditionals

- Ternary operator is broken into `?` and `:`:

    (1 > 5) ? 100 : 10

### 7.2 Iterators

- **Map**: `|` operator:

    [1, 2, 3] | { _ + 1 }

- **Reduce**: `&` operator:

    [1, 2, 3] & { . + _ }

