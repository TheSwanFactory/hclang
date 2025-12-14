# Closure Parsing Analysis

## Overview

This document analyzes the current implementation of closure parsing in HC
(Homoiconic C) to identify potential problems. It does NOT propose solutions,
only identifies issues.

**Status**: Analysis Phase **Date**: 2025-12-13 **Component**: `lib/execute/`
parsing pipeline

## Background: What are Closures in HC?

In HC, closures `{}` are **lazily evaluated expressions** implemented as
`FrameLazy` objects:

- Deferred execution until called with an argument
- Capture their defining scope (context inheritance)
- Can access parent variables using `^` prefix
- Support anonymous argument `_`

### Example Usage

```hc
; .square {_ * _}  # Define closure with anonymous arg
; square 3         # Evaluate → 9

; .x 3; .y 4;
; .mag {(x * x) + (y * y)}  # Captures x, y from scope
; mag []           # → 25
```

## The Parsing Pipeline

HC uses a three-stage pipeline where closures are handled:

```flow
Input String → Lex → Parse → Eval → Output
               ↓      ↓       ↓
            Tokens  Groups  Results
```

### Pipeline Components

1. **LexPipe** ([lex-pipe.ts:1](lib/execute/lex-pipe.ts#L1))
   - Character-by-character lexical analysis
   - Manages nesting level
   - Routes to appropriate lexers based on syntax

2. **ParsePipe** ([parse-pipe.ts:1](lib/execute/parse-pipe.ts#L1))
   - Converts tokens into frame groups
   - Handles push/pop for nested structures
   - Maintains collector array for expressions

3. **EvalPipe** ([eval-pipe.ts:1](lib/execute/eval-pipe.ts#L1))
   - Evaluates parsed frames
   - Applies expressions in context
   - Returns results

## Current Closure Implementation

### Terminal Registration

In [terminals.ts:76-82](lib/execute/terminals.ts#L76-L82), closures are
registered as a group type:

```typescript
function addGroup(Grouper: IArrayConstructor): void {
  const sample = new Grouper([], NilContext);
  const open = sample.string_open(); // "{"
  const close = sample.string_close(); // "}"
  terminals[open] = new Terminal(perform({ push: Grouper }));
  terminals[close] = new Terminal(perform({ pop: Grouper }));
}

addGroup(FrameLazy); // Line 91
```

### FrameLazy Structure

In [frame-lazy.ts:5-45](lib/frames/frame-lazy.ts#L5-L45):

```typescript
export class FrameLazy extends FrameExpr {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(data: Array<Frame>, meta: Context = NilContext) {
    super(data, meta);
  }

  // Converts lazy frame to expression when evaluated
  public override in(contexts: Array<Frame> = [Frame.nil]): Frame {
    if (this.data.length === 0) {
      return this; // Empty closure returns itself
    }
    const expr = new FrameExpr(this.data, this.meta_for(contexts[0]));
    expr.up = this;
    return expr;
  }

  // Called with argument
  public override call(
    argument: Frame,
    _parameter: Frame = Frame.nil,
  ): FrameExpr {
    return new FrameExpr(argument.asArray(), this.meta_for(argument));
  }
}
```

## Identified Parsing Problems

### Problem 1: Closure Context Capture During Parsing

**Location**: [parse-pipe.ts:88](lib/execute/parse-pipe.ts#L88)

When `ParsePipe.makeFrame()` creates a closure, it passes an empty context:

```typescript
protected makeFrame(): Frame {
  const group = new this.Factory(this.collector, {});  // ← Empty context!
  this.collector = [];
  return group;
}
```

**Issue**: Closures are created with `{}` as their metadata during parsing,
meaning they don't capture the defining scope at parse time.

**Expected Behavior**: Closures should capture the context where they are
defined, not where they are evaluated.

**Impact**:

- Scope capture happens during evaluation, not parsing
- May cause issues with nested scopes
- Context merging happens in `meta_for()` method, not at parse time

### Problem 2: Lexer Terminal Detection in Closures

**Location**: [lex.ts:41-44](lib/execute/lex.ts#L41-L44)

```typescript
public static isTerminal(char: string): boolean {
  const terms = Object.keys(terminals);
  return terms.includes(char);
}
```

**Issue**: The lexer treats `{` and `}` as terminals that end tokens, but the
logic for handling them inside quotes or other contexts may be inconsistent.

**Example from [lex.ts:76-78](lib/execute/lex.ts#L76-L78)**:

```typescript
if (terminal && not_quote && not_space) {
  return this.finish(argument, true); // Implicitly ends token
}
```

**Impact**:

- Braces always trigger terminal behavior unless quoted
- May cause unexpected token boundaries inside closures
- No special handling for closure-specific syntax

### Problem 3: Empty Closure Handling

**Location**: [frame-lazy.ts:21-24](lib/frames/frame-lazy.ts#L21-L24)

```typescript
public override in(contexts: Array<Frame> = [Frame.nil]): Frame {
  if (this.data.length === 0) {
    return this;  // Empty closure returns itself
  }
  // ...
}
```

**Issue**: Empty closures `{}` return themselves unchanged rather than creating
an expression.

**Test Case from
[evaluate.test.ts:91-95](lib/execute/evaluate.test.ts#L91-L95)**:

```typescript
it("returns closure for empty {}", () => {
  const result = evaluate("{}");
  const output = result.at(0);
  expect(output).toBeInstanceOf(frame.FrameLazy);
});
```

**Impact**:

- Empty closures behave differently from non-empty ones
- Special case that may not interact correctly with the rest of the system
- Codify pattern (empty closure as identity function) has distinct behavior

### Problem 4: Nested Closure Parsing

**Location**: [lex-pipe.ts:82-88](lib/execute/lex-pipe.ts#L82-L88)

When encountering nested closures `{ { } }`, the push/pop mechanism uses a level
counter:

```typescript
case "push": {
  const factory = ensure_factory(value);
  parser = parser.push(factory);
  this.set(Frame.kOUT, parser);
  this.level += 1;
  break;
}
```

**Issue**: Each `{` increments level, each `}` decrements. No tracking of which
closure type is being nested.

**Potential Impact**:

- Mismatched brackets like `[}` are detected at parse time
  ([evaluate.test.ts:115-119](lib/execute/evaluate.test.ts#L115-L119))
- But proper closure nesting may have edge cases
- The `canPop()` check in
  [parse-pipe.ts:62-70](lib/execute/parse-pipe.ts#L62-L70) verifies factory
  match

### Problem 5: Context Merging Order

**Location**: [frame-lazy.ts:37-44](lib/frames/frame-lazy.ts#L37-L44)

```typescript
protected meta_for(context: Frame): Context {
  const MetaNew = this.meta_copy();  // Copy closure's captured context
  const pairs: Array<IKeyValuePair> = context.meta_pairs();
  pairs.forEach(([key, value]) => {
    MetaNew[key] = value;  // Argument context overwrites closure context
  });
  return MetaNew;
}
```

**Issue**: When merging contexts, the argument's context overwrites the
closure's captured context.

**Impact**:

- Later bindings override earlier bindings
- May cause issues with shadowing semantics
- The order matters: `closure_meta <- argument_meta`

### Problem 6: Closure vs Expression Distinction

**Location**: Throughout the pipeline

**Analysis**: After investigating the Frame protocol, this is **DEFINITELY A
FEATURE**, not a bug.

#### The Frame Protocol

HC implements a sophisticated evaluation model based on two distinct operations:

1. **`in(contexts)`** - Evaluates a frame IN a context (scope-based evaluation)
2. **`call(argument)`** - Applies a frame WITH an argument (function
   application)

From [frame.ts:143-195](lib/frames/frame.ts#L143-L195):

```typescript
// Base Frame protocol
public in(_contexts = [Frame.nil]): Frame {
  return this;  // Default: return self
}

public call(argument: Frame, parameter = Frame.nil): Frame {
  if (this.is.void) {
    return argument;
  }
  return argument.called_by(this, parameter);  // Double dispatch
}
```

#### How FrameExpr Uses Both

From [frame-expr.ts:13-30](lib/frames/frame-expr.ts#L13-L30):

```typescript
export class FrameExpr extends FrameList {
  // Evaluate expression IN contexts (scope-based)
  public override in(contexts = [Frame.nil]): Frame {
    contexts.push(this);
    const result = this.data.reduce((sum: Frame, item: Frame): Frame => {
      const value = item.in(contexts); // ← Evaluate each item in context
      const next_sum = sum.call(value); // ← Apply results together
      return next_sum;
    }, Frame.nil);
    return result;
  }

  // Apply expression WITH argument (function application)
  public override call(argument: Frame, parameter = Frame.nil): Frame {
    return this.in([argument, parameter]); // ← Converts call to in!
  }
}
```

**Key insight**: `FrameExpr.call()` delegates to `in()`, treating the argument
as a context!

#### How FrameLazy Uses Both

From [frame-lazy.ts:21-35](lib/frames/frame-lazy.ts#L21-L35):

```typescript
export class FrameLazy extends FrameExpr {
  // Evaluate closure IN context (lazy → eager conversion)
  public override in(contexts: Array<Frame> = [Frame.nil]): Frame {
    if (this.data.length === 0) {
      return this; // Empty closure stays lazy
    }
    const expr = new FrameExpr(this.data, this.meta_for(contexts[0]));
    expr.up = this;
    return expr; // ← Returns UNEVALUATED expression with merged context
  }

  // Apply closure WITH argument (codify pattern)
  public override call(
    argument: Frame,
    _parameter: Frame = Frame.nil,
  ): FrameExpr {
    return new FrameExpr(argument.asArray(), this.meta_for(argument));
    // ← Wraps argument in expression with merged context
  }
}
```

#### The Two Distinct Semantics

**Path 1: `lazy.in(contexts)`** - Scope Evaluation

- Converts lazy frame to expression
- Merges closure's context with evaluation context
- Returns **unevaluated** expression (still needs to be reduced)
- Used when closure appears in an expression that's being evaluated

**Path 2: `lazy.call(argument)`** - Function Application

- Wraps argument in a new expression
- Merges closure's context with argument's context
- Returns **unevaluated** expression
- Used for "codify" pattern: `{}` as identity/wrapper function

#### Test Evidence

From [frame-lazy.test.ts:28-36](lib/frames/frame-lazy.test.ts#L28-L36):

```typescript
it("evalutes to an Expr with merged context", () => {
  const expr = lazy.in([context]);  // ← Scope evaluation
  expect(expr).toBeInstanceOf(frame.FrameExpr);
  expect(expr.call(turtle).toString()).toEqual(""slow turtle"");
});
```

From [frame-lazy.test.ts:50-62](lib/frames/frame-lazy.test.ts#L50-L62):

```typescript
it("converts Array to unevaluated Expr when called", () => {
  const codified = codify.call(array);  // ← Function application
  expect(codified).toBeInstanceOf(frame.FrameExpr);
  expect(codified.call(turtle).toString()).toEqual(""fast turtle"");
});
```

#### Semantic Difference

The difference matters:

```hc
; .f {x + 1}
; f.in([context])   # Returns (x + 1) expression in context
; f.call(5)         # Returns (5) wrapped as expression - NOT evaluated!
```

Both return `FrameExpr`, but with different contents and contexts!

#### Conclusion

**This is NOT a bug.** The dual paths implement two fundamental operations in
HC's evaluation model:

1. **Scope-based evaluation** (`in`) - For closures evaluated in their defining
   scope
2. **Function application** (`call`) - For closures as first-class values

The confusion stems from both returning `FrameExpr`, but they serve distinct
purposes in HC's homoiconic design. This is a sophisticated feature that
enables:

- Proper lexical scoping
- First-class functions
- The "codify" pattern (empty closure as identity)
- Meta-programming without special forms

## Summary of Parsing Issues

1. **Empty context at parse time** - Closures created with `{}` metadata
2. **Terminal detection** - Braces treated as terminals, affecting tokenization
3. **Empty closure special case** - Different behavior for `{}`
4. **Nested closure tracking** - Level-based, not type-aware
5. **Context merge order** - Argument overwrites closure scope
6. **Lazy-to-Expr conversion** - Two paths with unclear semantics

## Next Steps

This analysis identifies potential problems but does NOT propose solutions. The
next phase should:

1. Determine which of these are actual bugs vs intentional design
2. Create test cases that expose problematic behavior
3. Design fixes that maintain homoiconic principles
4. Implement changes with comprehensive testing

## References

### Key Files

- [lib/execute/lex.ts](lib/execute/lex.ts) - Lexical analysis
- [lib/execute/terminals.ts](lib/execute/terminals.ts) - Terminal definitions
- [lib/execute/parse-pipe.ts](lib/execute/parse-pipe.ts) - Parser pipeline
- [lib/execute/lex-pipe.ts](lib/execute/lex-pipe.ts) - Lexer pipeline
- [lib/frames/frame-lazy.ts](lib/frames/frame-lazy.ts) - Closure implementation
- [lib/execute/evaluate.test.ts](lib/execute/evaluate.test.ts) - Parsing tests

### Related Documentation

- [lib/execute/CLAUDE.md](lib/execute/CLAUDE.md) - Pipeline overview
- [lib/frames/CLAUDE.md](lib/frames/CLAUDE.md) - Frame protocol
- [doc/LANGUAGE.md](doc/LANGUAGE.md) - Language specification
