# Frames Package - Core Data Structures

## Overview

The `frames` package implements the fundamental data structures for Homoiconic
C. In HC, code and data share the same representation (homoiconicity), and
"frames" are the universal building blocks for both.

## Core Concept

A **Frame** is the basic unit of representation in HC. Every value, expression,
and program is composed of frames. This unified representation enables:

- Code as data, data as code
- Uniform manipulation of programs and values
- Meta-programming capabilities
- Simplified language semantics

## Key Frame Types

### Basic Types

- [frame-number.ts](frame-number.ts) - Numeric values (integers, floats)
- [frame-string.ts](frame-string.ts) - String literals
- [frame-bytes.ts](frame-bytes.ts) - Raw byte data
- [frame-symbol.ts](frame-symbol.ts) - Identifiers and symbols
- [frame-comment.ts](frame-comment.ts) - Comments (preserved in AST)

### Structural Types

- [frame-array.ts](frame-array.ts) - Ordered collections of frames
- [frame-list.ts](frame-list.ts) - Linked list implementation
- [frame-group.ts](frame-group.ts) - Grouped expressions `(...)`
- [frame-blob.ts](frame-blob.ts) - Dictionary/map structures `{...}`

### Expression Types

- [frame-expr.ts](frame-expr.ts) - Executable expressions
- [frame-lazy.ts](frame-lazy.ts) - Lazy evaluation wrappers
- [frame-arg.ts](frame-arg.ts) - Function arguments
- [frame-name.ts](frame-name.ts) - Named bindings

### Advanced Types

- [frame-alias.ts](frame-alias.ts) - Aliases and references
- [frame-schema.ts](frame-schema.ts) - Type schemas
- [frame-note.ts](frame-note.ts) - Annotations and metadata
- [frame-doc.ts](frame-doc.ts) - Documentation frames

### Meta Types

- [frame.ts](frame.ts) - Base Frame class and core protocol
- [frame-atom.ts](frame-atom.ts) - Atomic (primitive) frame base class
- [meta-frame.ts](meta-frame.ts) - Meta-programming support
- [context.ts](context.ts) - Evaluation context (variable bindings)

## Architecture

### Frame Protocol

All frames implement the core protocol defined in [frame.ts](frame.ts):

```typescript
interface IFrame {
  at(key: Frame): Frame; // Property access
  call(context: Frame): Frame; // Evaluation
  toString(): string; // String representation
  toStringArray(): string[]; // Array representation
  // ... other methods
}
```

### Type Hierarchy

```
Frame (base)
├── FrameAtom (primitives)
│   ├── FrameNumber
│   ├── FrameString
│   ├── FrameBytes
│   └── FrameSymbol
├── FrameArray (collections)
│   ├── FrameList
│   ├── FrameGroup
│   └── FrameBlob
├── FrameExpr (execution)
│   ├── FrameLazy
│   └── FrameArg
└── MetaFrame (meta-programming)
```

## Usage Examples

### Creating Frames

```typescript
import { FrameNumber } from "./frame-number.ts";
import { FrameString } from "./frame-string.ts";
import { FrameBlob } from "./frame-blob.ts";

const num = new FrameNumber(42);
const str = new FrameString("hello");
const dict = new FrameBlob({ key: str });
```

### Working with Context

```typescript
import { make_context } from "./context.ts";

const ctx = make_context({
  x: "10",
  y: "20",
});

// Access values
console.log(ctx.x.toString()); // "10"
```

### Frame Operations

```typescript
// Property access
const value = frame.at(key);

// Evaluation
const result = expr.call(context);

// String conversion
const str = frame.toString();
const arr = frame.toStringArray();
```

## Development Guidelines

### Adding New Frame Types

1. Extend appropriate base class ([frame.ts](frame.ts),
   [frame-atom.ts](frame-atom.ts), etc.)
2. Implement required protocol methods
3. Add constructor and initialization
4. Implement `toString()` and `toStringArray()`
5. Add tests in corresponding `.test.ts` file

### Testing

- Each frame type has comprehensive tests
- Test creation, operations, and conversions
- Test edge cases and error conditions
- Run with: `deno test lib/frames`

### Frame Design Principles

- **Immutability**: Frames should be immutable when possible
- **Lazy Evaluation**: Use [frame-lazy.ts](frame-lazy.ts) for deferred
  computation
- **Protocol First**: Implement core protocol methods consistently
- **Type Safety**: Use TypeScript types to enforce frame contracts

## Important Concepts

### Context

The [context.ts](context.ts) module manages variable bindings during evaluation.
Context is itself a Frame (FrameBlob), making the environment first-class.

### Meta-Programming

[meta-frame.ts](meta-frame.ts) provides reflection and meta-programming
capabilities:

- Inspect frame structure
- Manipulate frames as data
- Generate code programmatically

### Homoiconicity

Frames represent both:

- **Data**: Values like numbers, strings, collections
- **Code**: Expressions, functions, operators

This duality enables powerful meta-programming without special syntax.

## Common Patterns

### Frame Construction

```typescript
// From literals
const num = new FrameNumber(42);
const str = new FrameString("text");

// From collections
const arr = new FrameArray([num, str]);
const blob = new FrameBlob({ key: num });
```

### Frame Traversal

```typescript
// Access elements
const first = array.at(new FrameNumber(0));
const value = blob.at(new FrameString("key"));

// Iteration
for (const frame of frameArray.frames) {
  console.log(frame.toString());
}
```

### Evaluation

```typescript
// Evaluate expression in context
const result = expr.call(context);

// Lazy evaluation
const lazy = new FrameLazy(() => expr.call(context));
const value = lazy.call(context); // Evaluates when called
```

## Performance Considerations

- Frames are relatively lightweight objects
- String conversion is cached where possible
- Lazy frames defer expensive computations
- Context lookup uses hash maps for efficiency

## Important Notes

- All frames must implement the core protocol
- Frames should be immutable or copy-on-write
- Use [frame-lazy.ts](frame-lazy.ts) for expensive operations
- Context threading is essential for proper evaluation
- Meta-frames enable reflection without special syntax
