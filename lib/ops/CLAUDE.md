# Ops Package - Built-in Operations and Operators

## Overview

The `ops` package implements built-in operations, operators, and functions for
Homoiconic C. These are the core primitives that give HC its computational
power.

## Key Components

### Mathematical Operations

- [math.ts](math.ts) - Arithmetic and mathematical functions
  - Basic arithmetic: `+`, `-`, `*`, `/`, `%`
  - Comparison: `<`, `>`, `<=`, `>=`, `==`, `!=`
  - Mathematical functions: `abs`, `min`, `max`, `pow`, etc.

### Control Flow

- [conditionals.ts](conditionals.ts) - Conditional operations
  - `if-then-else` logic
  - Boolean operations: `and`, `or`, `not`
  - Conditional evaluation

### Iteration and Collections

- [iterators.ts](iterators.ts) - Collection operations
  - `map` - Transform elements
  - `filter` - Select elements
  - `reduce` - Aggregate elements
  - `each` - Iterate over elements

### Functional Programming

- [frame-curry.ts](frame-curry.ts) - Function currying and partial application
  - Create partially applied functions
  - Support for functional composition

### Frame Operations

- [frame-ops.ts](frame-ops.ts) - Generic frame operations
  - Frame manipulation primitives
  - Type conversions
  - Property access helpers

## Architecture

Operations in HC are themselves frames, maintaining homoiconicity:

- Operations are first-class values
- Can be passed as arguments
- Can be returned from functions
- Can be stored in data structures

## Usage Examples

### Mathematical Operations

```typescript
import { execute } from "../execute/execute.ts";

// Arithmetic
execute("1 + 2"); // "3"
execute("10 - 5"); // "5"
execute("3 * 4"); // "12"
execute("15 / 3"); // "5"

// Comparison
execute("5 > 3"); // "true"
execute("5 == 5"); // "true"
```

### Conditionals

```typescript
// If-then-else
execute("if true then 1 else 2"); // "1"
execute("if false then 1 else 2"); // "2"

// Boolean logic
execute("true and false"); // "false"
execute("true or false"); // "true"
execute("not true"); // "false"
```

### Iteration

```typescript
// Map
execute("[1 2 3] map {x => x * 2}"); // "[2 4 6]"

// Filter
execute("[1 2 3 4] filter {x => x > 2}"); // "[3 4]"

// Reduce
execute("[1 2 3] reduce 0 {acc x => acc + x}"); // "6"
```

### Currying

```typescript
// Partial application
execute("add = {x y => x + y}");
execute("add5 = add 5");
execute("add5 10"); // "15"
```

## Development Guidelines

### Adding New Operations

1. **Choose the Right Module**
   - Math operations → [math.ts](math.ts)
   - Control flow → [conditionals.ts](conditionals.ts)
   - Collection operations → [iterators.ts](iterators.ts)
   - Generic operations → [frame-ops.ts](frame-ops.ts)

2. **Implement as a Frame**
   ```typescript
   export class FrameMyOp extends Frame {
     call(context: Frame): Frame {
       // Implementation
     }
   }
   ```

3. **Register in Language** Add to the appropriate module's exports and ensure
   it's registered in `hc-lang.ts`

4. **Add Tests** Create or update corresponding `.test.ts` file

### Testing

- Each module has corresponding `.test.ts` files
- Test edge cases and error conditions
- Test interaction with other operations
- Run with: `deno test lib/ops`

### Operation Design Principles

- **Pure Functions**: Operations should be side-effect free when possible
- **Type Flexibility**: Accept multiple frame types where reasonable
- **Error Handling**: Provide clear error messages
- **Composability**: Operations should compose well with each other

## Operation Categories

### Pure Operations

Operations that always return the same output for the same input:

- Mathematical operations
- String operations
- Collection transformations

### Control Flow Operations

Operations that affect execution flow:

- Conditionals (`if-then-else`)
- Short-circuit evaluation (`and`, `or`)
- Exception handling

### Higher-Order Operations

Operations that take or return functions:

- `map`, `filter`, `reduce`
- Currying and partial application
- Function composition

## Important Concepts

### Lazy Evaluation

Some operations use lazy evaluation to avoid unnecessary computation:

```typescript
// Only evaluates the chosen branch
if condition then expensive1 else expensive2
```

### Short-Circuit Evaluation

Boolean operations short-circuit:

```typescript
false and expensive  // expensive never evaluated
true or expensive    // expensive never evaluated
```

### Currying

Functions can be partially applied:

```typescript
add = {x y => x + y}
add5 = add 5       // Partially applied
result = add5 10   // Completes the application
```

## Common Patterns

### Operation Chaining

```typescript
[1 2 3 4 5]
  .filter {x => x > 2}
  .map {x => x * 2}
  .reduce 0 {acc x => acc + x}
```

### Custom Operations

```typescript
// Define custom operation
square = {x => x * x}

// Use in higher-order functions
[1 2 3] map square  // [1 4 9]
```

### Composition

```typescript
// Compose operations
double = {x => x * 2}
increment = {x => x + 1}
doubleAndIncrement = {x => increment (double x)}
```

## Performance Considerations

- Operations are typically very lightweight
- Lazy evaluation helps avoid unnecessary work
- Iterator operations can be chained efficiently
- Currying has minimal overhead

## Important Notes

- All operations are frames (homoiconic)
- Operations can be stored in variables and data structures
- Operations support lazy evaluation where appropriate
- Error messages should be clear and actionable
- Operations should be composable and orthogonal
- Type checking happens at runtime during evaluation
