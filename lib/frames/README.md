# HCLang Frame Class Hierarchy

This document describes the class hierarchy and relationships between the
various Frame classes in the HCLang system.

_Last updated: March 2, 2025_

## Table of Contents

- [Core Architecture](#core-architecture)
- [Frame Types](#frame-types)
  - [Container Frames](#container-frames)
  - [Symbol Frames](#symbol-frames)
  - [Value Frames](#value-frames)
  - [Documentation Frames](#documentation-frames)
- [Class Hierarchy Diagram](#class-hierarchy-diagram)
- [Detailed Class Descriptions](#detailed-class-descriptions)
- [Context and Related Types](#context-and-related-types)
- [Usage Examples](#usage-examples)

## Core Architecture

The HCLang frame system is built on a hierarchical class structure with three
foundational classes:

### MetaFrame (`meta-frame.ts`)

The base class that provides metadata handling capabilities:

```typescript
export class MetaFrame {
  public up: Frame;
  public id: string;

  constructor(public meta: Context = NilContext, _isNil = false) {
    // Initialize with unique ID
  }

  // Methods for metadata management
  public get_here(key: string): Frame {/* ... */}
  public get(key: string): Frame {/* ... */}
  public set(key: string, value: Frame): MetaFrame {/* ... */}
  // ...
}
```

### Frame (`frame.ts`)

The core class that all frame types extend, providing the foundation for the
entire system:

```typescript
export class Frame extends MetaFrame {
  public static readonly nil: Frame;
  public static readonly all: Frame;
  public static readonly missing: Frame;
  public is: Flags;

  constructor(meta = NilContext, isNil = false, isMissing = false) {
    super(meta);
    // Initialize flags
  }

  // Core methods for frame operations
  public in(contexts = [Frame.nil]): Frame {/* ... */}
  public apply(argument: Frame, parameter: Frame): Frame {/* ... */}
  public call(argument: Frame, parameter = Frame.nil): Frame {/* ... */}
  // ...
}
```

### FrameAtom (`frame-atom.ts`)

The base class for all atomic (non-composite) frame types:

```typescript
export class FrameAtom extends Frame {
  constructor(meta = NilContext) {
    super(meta);
  }

  // Methods for atomic frame operations
  public string_prefix(): string {/* ... */}
  public string_suffix(): string {/* ... */}
  public canInclude(char: string): boolean {/* ... */}
  // ...
}
```

## Frame Types

### Container Frames

Frames that contain other frames, providing structure and organization:

| Class         | File              | Description                    | Notation |
| ------------- | ----------------- | ------------------------------ | -------- |
| `FrameList`   | `frame-list.ts`   | Base class for all collections | `(...)`  |
| `FrameArray`  | `frame-array.ts`  | Array-like collections         | `[...]`  |
| `FrameExpr`   | `frame-expr.ts`   | Expressions for evaluation     | `(...)`  |
| `FrameLazy`   | `frame-lazy.ts`   | Lazy-evaluated expressions     | `{...}`  |
| `FrameSchema` | `frame-schema.ts` | Schema definitions             | `<...>`  |

### Symbol Frames

Frames that represent identifiers, references, and operations:

| Class           | File              | Description          | Notation       |
| --------------- | ----------------- | -------------------- | -------------- |
| `FrameSymbol`   | `frame-symbol.ts` | Symbolic identifiers | `symbol`       |
| `FrameOperator` | `frame-symbol.ts` | Operator symbols     | `+`, `-`, etc. |
| `FrameArg`      | `frame-arg.ts`    | Function arguments   | `_`            |
| `FrameParam`    | `frame-arg.ts`    | Function parameters  | `^`            |
| `FrameAlias`    | `frame-alias.ts`  | Symbol aliases       | `@symbol`      |
| `FrameName`     | `frame-name.ts`   | Named properties     | `.property`    |

### Value Frames

Frames that represent literal values:

| Class         | File              | Description      | Notation               |
| ------------- | ----------------- | ---------------- | ---------------------- |
| `FrameString` | `frame-string.ts` | String literals  | `"..."`                |
| `FrameNumber` | `frame-number.ts` | Numeric literals | `123`                  |
| `FrameBlob`   | `frame-blob.ts`   | Binary data      | `0x...`, `0b...`, etc. |
| `FrameBytes`  | `frame-bytes.ts`  | Byte arrays      | `\...\`                |

### Documentation Frames

Frames that represent documentation and annotations:

| Class          | File               | Description            | Notation    |
| -------------- | ------------------ | ---------------------- | ----------- |
| `FrameDoc`     | `frame-doc.ts`     | Documentation          | `` `...` `` |
| `FrameComment` | `frame-comment.ts` | Comments               | `#...#`     |
| `FrameNote`    | `frame-note.ts`    | Notes and test results | `$...;`     |

## Class Hierarchy Diagram

```
MetaFrame
└── Frame
    ├── FrameAtom
    │   ├── FrameSymbol
    │   │   ├── FrameOperator
    │   │   ├── FrameArg
    │   │   └── FrameParam
    │   ├── FrameAlias
    │   ├── FrameName
    │   ├── FrameNumber
    │   ├── FrameBlob
    │   ├── FrameQuote
    │   │   ├── FrameString
    │   │   │   └── FrameDoc
    │   │   ├── FrameBytes
    │   │   └── FrameNote
    │   └── FrameComment
    └── FrameList
        ├── FrameArray
        ├── FrameExpr
        │   └── FrameLazy
        └── FrameSchema
```

## Detailed Class Descriptions

### Container Frames

#### FrameList (`frame-list.ts`)

Base class for all frame collections, providing array-based storage and
operations:

```typescript
export class FrameList extends Frame {
  constructor(protected data: Array<Frame>, meta: Context = NilContext) {
    super(meta);
  }

  public toStringArray(): string[] {/* ... */}
  public isEmpty(): boolean {/* ... */}
  public size(): number {/* ... */}
  // ...
}
```

#### FrameArray (`frame-array.ts`)

Represents array-like collections with square bracket notation:

```typescript
export class FrameArray extends FrameList {
  public static readonly BEGIN_ARRAY = "[";
  public static readonly END_ARRAY = "]";

  // Array-specific operations
  public override at(index: number): Frame {/* ... */}
  public length(): number {/* ... */}
  public reset(): void {/* ... */}
  // ...
}
```

#### FrameExpr (`frame-expr.ts`)

Represents expressions with parentheses notation, providing evaluation
capabilities:

```typescript
export class FrameExpr extends FrameList {
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
    data.forEach((item) => {
      item.up = this;
    });
  }

  public override in(contexts = [Frame.nil]): Frame {/* ... */}
  // ...
}
```

#### FrameLazy (`frame-lazy.ts`)

Represents lazy-evaluated expressions with curly brace notation:

```typescript
export class FrameLazy extends FrameExpr {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  public override in(contexts: Array<Frame> = [Frame.nil]): Frame {/* ... */}
  // ...
}
```

#### FrameSchema (`frame-schema.ts`)

Represents schema definitions with angle bracket notation:

```typescript
export class FrameSchema extends FrameList {
  public static readonly BEGIN_SCHEMA = "<";
  public static readonly END_SCHEMA = ">";

  public override in(contexts = [Frame.nil]): Frame {/* ... */}
  // ...
}
```

### Symbol Frames

#### FrameSymbol (`frame-symbol.ts`)

Represents symbolic identifiers, using a flyweight pattern for efficiency:

```typescript
export class FrameSymbol extends FrameAtom {
  public static readonly SYMBOL_BEGIN = /[a-zA-Z]/;
  public static readonly SYMBOL_CHAR = /[-\w]/;

  public static for(symbol: string): FrameSymbol {/* ... */}

  public override in(contexts: Frame[] = [Frame.nil]): Frame {/* ... */}
  // ...
}
```

#### FrameOperator (`frame-symbol.ts`)

Represents operator symbols like `+`, `-`, etc.:

```typescript
export class FrameOperator extends FrameSymbol {
  public static readonly OPERATOR_CHARS = /[&|?:+\-/*%=<>!]/;

  public static Accepts(char: string): boolean {/* ... */}
  // ...
}
```

#### FrameArg (`frame-arg.ts`)

Represents function arguments with underscore notation:

```typescript
export class FrameArg extends FrameSymbol {
  public static readonly ARG_CHAR = "_";

  public static here(): FrameArg {/* ... */}
  public static level(count = 1): FrameArg {/* ... */}
  // ...
}
```

#### FrameParam (`frame-arg.ts`)

Represents function parameters with caret notation:

```typescript
export class FrameParam extends FrameSymbol {
  public static readonly ARG_CHAR = "^";

  public static there(): FrameParam {/* ... */}
  public static level(count = 1): FrameParam {/* ... */}
  // ...
}
```

### Value Frames

#### FrameString (`frame-string.ts`)

Represents string literals with double quote notation:

```typescript
export class FrameString extends FrameQuote {
  public static readonly STRING_BEGIN = """;
  public static readonly STRING_END = """;
  
  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }
  
  public reduce(starter: Frame): Frame { /* ... */ }
  // ...
}
```

#### FrameNumber (`frame-number.ts`)

Represents numeric literals, with mathematical operations:

```typescript
export class FrameNumber extends FrameAtom {
  public static readonly NUMBER_BEGIN = /[1-9]/;
  public static readonly NUMBER_CHAR = /\d/;

  protected data: number;

  // Mathematical operations
  public add(right: FrameNumber): FrameNumber {/* ... */}
  public subtract(right: FrameNumber): FrameNumber {/* ... */}
  public multiply(right: FrameNumber): FrameNumber {/* ... */}
  // ...
}
```

#### FrameBlob (`frame-blob.ts`)

Represents binary data with various encodings:

```typescript
export class FrameBlob extends FrameAtom {
  public static readonly BLOB_START = "0";
  public static readonly BLOB_DIGITS: IRegexpMap = {
    2: /[01]/,
    8: /[0-7]/,
    16: /[0-9a-fA-F]/,
    32: /[0-9a-hj-np-z]/,
    64: /[0-9a-zA-Z+/=]/,
  };

  protected data: bigint;
  protected base: number;
  protected n_bits: bigint;
  // ...
}
```

### Documentation Frames

#### FrameDoc (`frame-doc.ts`)

Represents documentation with backtick notation:

```typescript
export class FrameDoc extends FrameString {
  public static readonly DOC_BEGIN = "`";
  public static readonly DOC_END = "`";
  // ...
}
```

#### FrameComment (`frame-comment.ts`)

Represents comments with hash notation:

```typescript
export class FrameComment extends FrameAtom {
  public static readonly COMMENT_BEGIN = "#";
  public static readonly COMMENT_END = "#";

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
    this.is.void = true;
  }
  // ...
}
```

#### FrameNote (`frame-note.ts`)

Represents notes and test results with dollar sign notation:

```typescript
export class FrameNote extends FrameQuote {
  public static readonly NOTE_BEGIN = "$";
  public static readonly NOTE_END = ";";

  public static test(data: string, source: string, sum: string): FrameNote {
    /* ... */
  }
  public static key(source: string, where: Frame): FrameNote {/* ... */}
  public static pass(source: string, sum: string): FrameNote {/* ... */}
  public static fail(source: string, sum: string): FrameNote {/* ... */}
  // ...
}
```

## Context and Related Types

### Context (`context.ts`)

A type representing a mapping of string keys to Frame values:

```typescript
export type Context = { [key: string]: Frame };
export const NilContext: Context = {};
```

### Other Types

- `StringMap`: A mapping of string keys to string values
  ```typescript
  export type StringMap = { [key: string]: string };
  ```

- `IKeyValuePair`: A tuple of a string key and a Frame value
  ```typescript
  export interface IKeyValuePair extends ReadonlyArray<string | Frame> {
    0: string;
    1: Frame;
  }
  ```

- `Flags`: A mapping of string keys to boolean values
  ```typescript
  export type Flags = { [key: string]: boolean };
  ```

## Usage Examples

### Creating and Evaluating an Expression

```typescript
// Create a simple addition expression: (+ 1 2)
const expr = new FrameExpr([
  FrameSymbol.for("+"),
  new FrameNumber("1"),
  new FrameNumber("2"),
]);

// Evaluate the expression in a context
const result = expr.in([globalContext]);
console.log(result.toString()); // "3"
```

### Working with Strings and Symbols

```typescript
// Create a string
const str = new FrameString("Hello, world!");

// Create a symbol
const sym = FrameSymbol.for("greeting");

// Bind the string to the symbol in a context
context.set("greeting", str);

// Look up the symbol in the context
const value = sym.in([context]);
console.log(value.toString()); // ""Hello, world!""
```

### Creating a Function

```typescript
// Create a function that adds its argument to itself
const doubleFunc = new FrameLazy([
  FrameSymbol.for("+"),
  FrameArg.here(), // Current argument
  FrameArg.here(), // Current argument again
]);

// Apply the function to a number
const result = doubleFunc.call(new FrameNumber("5"));
console.log(result.toString()); // "10"
```
