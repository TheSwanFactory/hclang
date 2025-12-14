# Anonymous Parameter `_` Requirements

## Overview

This document specifies the expected behavior of the anonymous parameter `_` in
HC closures, based on documentation, existing code, and inferred semantics. This
is suitable for writing comprehensive tests.

**Status**: Requirements Definition **Date**: 2025-12-13 **Component**:
`lib/frames/frame-arg.ts` and closure evaluation

## Background

In HC, `_` is the **anonymous argument** - a special identifier that represents
the argument passed to a closure when it's called. It's implemented as
`FrameArg` and is distinct from named variables.

### Related Identifiers

- `_` - Anonymous argument (current level)
- `__` - Anonymous argument at level 2
- `_^` - Parameter (parent context)
- `_^^` - Parameter at level 2 (grandparent context)

## Core Requirements

### REQ-1: Basic Anonymous Argument

**Description**: `_` should evaluate to the argument passed when calling a
closure.

**Examples**:

```hc
; .identity {_}
; identity 42
# 42

; .double {_ * 2}
; double 5
# 10
```

**Implementation**: [frame-arg.ts:28-35](lib/frames/frame-arg.ts#L28-L35)

```typescript
public override in(contexts = [Frame.nil]): Frame {
  const level = this.data.length;
  if (level <= 1) {
    return contexts[0];  // Return first context (the argument)
  }
  // ...
}
```

**Test Cases**:

1. Identity closure returns argument unchanged
2. Closure using `_` in expression evaluates with argument value
3. Multiple uses of `_` in same closure use same value

### REQ-2: Multiple References to `_`

**Description**: `_` can be used multiple times in the same closure, always
referring to the same argument.

**Example from [doc/LANGUAGE.md:362](doc/LANGUAGE.md#L362)**:

```hc
; .square {_ * _}
; square 3
# 9
```

**Example from
[vscode-extension/README.md:53](vscode-extension/README.md#L53)**:

```hc
.square {_ * _}
square 5  # Returns 25
```

**Test Cases**:

1. `{_ * _}` with argument 3 returns 9
2. `{_ + _}` with argument 5 returns 10
3. `{_ * _ * _}` with argument 2 returns 8

### REQ-3: String Operations with `_`

**Description**: `_` works with string concatenation and repetition.

**Example from [cli/hc/white-paper.hc:476](cli/hc/white-paper.hc#L476)**:

```hc
; .triplicate {3 _}
; triplicate "Baby"
# "BabyBabyBaby"
```

**Test Cases**:

1. Numeric multiplier with string argument repeats the string
2. String concatenation with `_` works correctly
3. `{_ + _}` with string "Hello" returns "HelloHello"

### REQ-4: Implicit Argument Access

**Description**: When a closure is called with an argument, properties of that
argument can be accessed directly without explicitly referencing `_`.

**Example from [doc/LANGUAGE.md:371](doc/LANGUAGE.md#L371)**:

```hc
; .mag {(x * x) + (y * y)}
; mag (.x 1; .y 2;)
# 5
```

**Explanation**: The argument `(.x 1; .y 2;)` is inserted into the scope
hierarchy, so `x` and `y` can be accessed directly.

**Alternative explicit form**:

```hc
; .mag {(_.x * _.x) + (_.y * _.y)}  # Explicit access
```

**Test Cases**:

1. Closure accessing named properties from argument without `_`
2. Nested property access from argument
3. Both implicit and explicit forms produce same result

### REQ-5: Argument vs Context Distinction

**Description**: `_` specifically refers to the **argument** passed to the
closure, not the defining context.

**Example**:

```hc
; .x 100           # Define x in outer scope
; .add_x {x + _}   # x comes from outer scope, _ is argument
; add_x 5
# 105
```

**Comparison**:

```hc
; .use_arg {_ + _}     # Uses argument twice
; .use_scope {x + x}   # Uses scope variable twice
```

**Test Cases**:

1. Closure with both scope variables and `_` argument
2. `_` shadows outer scope variables with same name
3. Explicit `_` vs implicit property access behave consistently

### REQ-6: Empty Argument Handling

**Description**: Calling a closure with `nil` or empty `()` should pass
`Frame.nil` as `_`.

**Example**:

```hc
; .check_nil {_}
; check_nil ()
# ()
```

**Test Cases**:

1. Closure called with `()` receives `Frame.nil`
2. Closure called with no argument defaults to `Frame.nil`
3. Can test for nil argument: `{_ == ()}`

### REQ-7: Array and List Arguments

**Description**: `_` can refer to array or list arguments.

**Example**:

```hc
; .first {_.0}      # Access first element
; first [1, 2, 3]
# 1

; .length {_.size}  # Access array method
```

**Test Cases**:

1. Accessing array elements via `_`
2. Array methods called on `_`
3. Passing array as single argument vs multiple arguments

### REQ-8: Nested Closures and `_` Scoping

**Description**: In nested closures, `_` refers to the **immediate** closure's
argument. Use `__` for outer closure's argument.

**Example**:

```hc
; .outer {
    .inner {_ + __}  # _ is inner arg, __ is outer arg
  }
; outer 10 inner 5
# 15
```

**Test Cases**:

1. Nested closures with different `_` values
2. Inner `_` shadows outer `_`
3. `__` accesses outer closure's argument
4. Multiple levels: `_`, `__`, `___`

### REQ-9: Parameter Access `_^`

**Description**: `_^` (also called `super`) accesses the **parent context**,
skipping over the current argument.

**Example from [cli/hc/white-paper.hc:493](cli/hc/white-paper.hc#L493)**:

```hc
; .print-arg {var}        # Accesses var from argument
; .print-parent {_^.var}  # Accesses var from parent scope
; .var "parent"

; print-arg (.var "child";)
# "child"

; print-parent (.var "child";)
# "parent"
```

**Implementation**: [frame-arg.ts:62-69](lib/frames/frame-arg.ts#L62-L69)

```typescript
public override in(contexts = [Frame.nil]): Frame {
  const level = this.data.length - 1;  // -1 because of leading _
  if (level <= contexts.length) {
    return contexts[level];  // Return context at level
  }
  return FrameNote.key(this.data, this);
}
```

**Test Cases**:

1. `_^` accesses parent scope instead of argument
2. `_^^` accesses grandparent scope
3. Combination of `_` and `_^` in same closure

### REQ-10: MAML Template Usage

**Description**: `_` is used in template patterns like HTML tag generation.

**Example from [maml/tag.test.ts:12](maml/tag.test.ts#L12)**:

```hc
({} [("<" _ ">"), __, ("</" _ ">")])
```

This creates a template where:

- First `_` is the tag name in opening tag
- `__` is the content between tags
- Second `_` is the tag name in closing tag

**Application**:

```hc
; tag "p"  # Creates ("<p>" _ "</p>") template
; # Then call with content:
; tag_p "Hello"
# "<p>Hello</p>"
```

**Test Cases**:

1. Template with `_` in multiple positions
2. Nested template expansion
3. `__` for content vs `_` for parameters

### REQ-11: Type Preservation

**Description**: `_` preserves the type of the argument passed.

**Examples**:

```hc
; .type_check {_}
; type_check 42        # Returns FrameNumber
; type_check "hello"   # Returns FrameString
; type_check [1,2,3]   # Returns FrameArray
```

**Test Cases**:

1. Number argument preserves FrameNumber type
2. String argument preserves FrameString type
3. Array argument preserves FrameArray type
4. Closure argument preserves FrameLazy type

### REQ-12: Method Chaining

**Description**: Methods can be called on `_` using dot notation.

**Examples**:

```hc
; .upper {_.toUpperCase}
; upper "hello"
# "HELLO"

; .double_first {_.0 * 2}
; double_first [5, 10]
# 10
```

**Test Cases**:

1. Calling methods on `_`
2. Property access on `_`
3. Chained operations: `_.prop.method`

### REQ-13: Operator Application

**Description**: `_` works with all operators.

**Examples**:

```hc
; .increment {_ + 1}
; .negate {-_}
; .not {!_}
; .compare {_ > 10}
```

**Test Cases**:

1. Arithmetic operators: `+`, `-`, `*`, `/`, `%%`, `**`
2. Comparison operators: `>`, `<`, `>=`, `<=`, `==`, `!=`
3. Logical operators: `!`, `&&`, `||`
4. Unary operators: `-_`, `!_`

## Parsing Requirements

### REQ-P1: Lexing `_` as FrameArg

**Description**: The lexer must recognize `_` as a special token and create a
`FrameArg` instance.

**Location**: [frame-arg.ts:6](lib/frames/frame-arg.ts#L6)

```typescript
public static readonly ARG_CHAR = "_";
```

**Test Cases**:

1. Standalone `_` parses to FrameArg
2. `__` parses to FrameArg with level 2
3. `_^` parses to FrameParam
4. `_` in identifiers like `my_var` doesn't trigger FrameArg

### REQ-P2: Level Counting

**Description**: Number of underscores determines nesting level.

**Implementation**: [frame-arg.ts:12-14](lib/frames/frame-arg.ts#L12-L14)

```typescript
public static level(count = 1): FrameArg {
  const symbol = Array(count + 1).join(FrameArg.ARG_CHAR);
  return FrameArg._for(symbol);
}
```

**Test Cases**:

1. `_` has level 1
2. `__` has level 2
3. `___` has level 3
4. Level matches nesting depth in contexts

### REQ-P3: Singleton Pattern

**Description**: `FrameArg` instances are cached for reuse.

**Implementation**: [frame-arg.ts:17-22](lib/frames/frame-arg.ts#L17-L22)

```typescript
protected static args: { [key: string]: FrameArg } = {};

protected static _for(symbol: string): FrameArg {
  const exists = FrameArg.args[symbol];
  return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
}
```

**Test Cases**:

1. Multiple `_` in same expression share same instance
2. `FrameArg.here()` returns cached instance
3. Level-based lookup works correctly

## Edge Cases and Error Conditions

### EDGE-1: `_` Outside Closure

**Description**: Using `_` outside a closure context should result in an error
or return `Frame.nil`.

**Example**:

```hc
; _          # What should this do?
# ??? - Likely error or nil
```

**Test Cases**:

1. Top-level `_` evaluation
2. `_` in non-closure expression
3. Error message clarity

### EDGE-2: Empty Closure with `_`

**Description**: Empty closure `{}` doesn't evaluate, but what about `{_}`?

**Example**:

```hc
; .id {_}
; id 42
# 42 (should work)
```

**Test Cases**:

1. `{_}` as identity function
2. Empty closure `{}` vs `{_}` behavior
3. Codify pattern: `{}.call(x)` vs `{_}.call(x)`

### EDGE-3: Argument Type Mismatch

**Description**: What happens when closure expects certain argument properties?

**Example**:

```hc
; .get_x {x}
; get_x 42    # 42 doesn't have property x
# ??? - Missing property
```

**Test Cases**:

1. Accessing missing properties on argument
2. Type-specific operations on wrong types
3. Frame.missing vs Frame.nil handling

### EDGE-4: Multiple Argument Syntax

**Description**: HC closures take single argument. Multiple arguments need
special handling.

**Example**:

```hc
; .add {x + y}
; add (.x 5; .y 3;)  # Pass object with properties
# 8
```

**Alternative**:

```hc
; .add [x, y] {x + y}  # Destructuring syntax?
```

**Test Cases**:

1. Single argument with multiple properties
2. Array destructuring (if supported)
3. Multiple closures vs single closure with object

## Semantic Clarifications

### SEM-1: Argument Insertion in Scope Chain

**Description**: When closure is called, argument is inserted into the context
hierarchy **above** the closure but **below** the defining scope.

**Scope Chain**:

```
Global Scope
  ↓
Defining Scope (where closure created)
  ↓
Argument Context (inserted when called)
  ↓
Closure Body (being evaluated)
```

**This allows**:

- Implicit property access: `{x + y}` finds `x` and `y` in argument
- Explicit access: `{_ + 1}` uses argument directly
- Parent access: `{_^.x}` skips argument to reach defining scope

### SEM-2: `_` vs Implicit Access

**Documentation states** ([doc/LANGUAGE.md:368](doc/LANGUAGE.md#L368)):

> "When you apply something to a closure, it actually inserts that value above
> it in the hierarchy before it is evaluated."

This means:

```hc
; .mag {(x * x) + (y * y)}  # Implicit: finds x, y in argument
; # Equivalent to:
; .mag {(_.x * _.x) + (_.y * _.y)}  # Explicit via _
```

**Both are valid**, but implicit is preferred for readability.

### SEM-3: Evaluation Order

**Description**: `_` is evaluated when the closure is **called**, not when it's
**defined**.

```hc
; .x 5
; .f {_ + x}    # f defined with x=5
; .x 10         # x changed to 10
; f 2           # _ is 2, x is 10 (current value)
# 12
```

## Implementation Notes

### Current Implementation

From [frame-arg.ts](lib/frames/frame-arg.ts):

- `FrameArg` extends `FrameSymbol`
- Singleton pattern for caching instances
- Level-based access to context stack
- Simple implementation: returns `contexts[0]` for `_`

### Potential Issues

1. **Empty context handling**: What if `contexts` array is empty?
2. **Type checking**: No validation that argument has expected properties
3. **Error messages**: Missing context returns `Frame.missing` silently
4. **Documentation**: Implicit vs explicit access not clearly distinguished in
   error cases

## Test Strategy

### Test Categories

1. **Unit Tests** (frame-arg.test.ts)
   - FrameArg construction and singleton behavior
   - Level counting and context access
   - Stringification

2. **Integration Tests** (evaluate.test.ts, hc-lang.test.ts)
   - Closures with `_` in various expressions
   - Multiple uses of `_`
   - Nested closures with `_` and `__`
   - Parameter access with `_^`

3. **End-to-End Tests**
   - REPL examples from documentation
   - Real-world use cases (MAML templates, etc.)
   - Error handling and edge cases

### Example Test Suite Structure

```typescript
describe("Anonymous Parameter _", () => {
  describe("Basic Usage", () => {
    it("returns argument when used alone");
    it("works in arithmetic expressions");
    it("can be used multiple times");
  });

  describe("Type Handling", () => {
    it("preserves number types");
    it("preserves string types");
    it("preserves array types");
  });

  describe("Nesting", () => {
    it("inner _ shadows outer _");
    it("__ accesses outer closure argument");
    it("_^ accesses parent scope");
  });

  describe("Edge Cases", () => {
    it("handles nil arguments");
    it("handles missing properties");
    it("works in empty closures");
  });
});
```

## Summary

The anonymous parameter `_` is a core feature of HC closures with well-defined
semantics:

1. Represents the argument passed when calling a closure
2. Can be used multiple times in same closure
3. Supports implicit property access via scope insertion
4. Has level-based variants (`__`, `___`) for nested closures
5. Related to parent access via `_^` (FrameParam)
6. Preserves argument type and supports method chaining
7. Works with all operators and expressions

The implementation is straightforward but requires careful handling of context
stacks and scope chains to ensure correct evaluation.

## References

### Documentation

- [doc/LANGUAGE.md:358-380](doc/LANGUAGE.md#L358-L380) - Anonymous argument
  specification
- [cli/hc/white-paper.hc:471-497](cli/hc/white-paper.hc#L471-L497) - Detailed
  examples
- [doc/GRAMMAR.md:261](doc/GRAMMAR.md#L261) - Grammar examples

### Implementation

- [lib/frames/frame-arg.ts](lib/frames/frame-arg.ts) - FrameArg and FrameParam
  implementation
- [lib/frames/frame-lazy.ts:21-35](lib/frames/frame-lazy.ts#L21-L35) - Closure
  context merging
- [lib/frames/frame-expr.ts:13-30](lib/frames/frame-expr.ts#L13-L30) -
  Expression evaluation with contexts

### Tests

- [lib/frames/frame-arg.test.ts](lib/frames/frame-arg.test.ts) - Unit tests for
  FrameArg
- [lib/frames/frame-lazy.test.ts:28-36](lib/frames/frame-lazy.test.ts#L28-L36) -
  Closure with context tests
- [maml/tag.test.ts:12-34](maml/tag.test.ts#L12-L34) - Real-world MAML usage
