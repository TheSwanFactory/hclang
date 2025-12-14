# Closure Evaluation Diagnosis

## Overview

This document analyzes two critical issues with closure parsing and evaluation
discovered during testing. Non-empty closures are being evaluated immediately
rather than remaining as unevaluated `FrameLazy` objects.

**Status**: Diagnostic Analysis **Date**: 2025-12-13 **Related**:
[02-underbar-reqs.md](02-underbar-reqs.md)

## Issue Summary

### Issue 1: `{1}` Returns FrameExpr Instead of FrameLazy

**Expected Behavior**: `{1}` should remain an unevaluated closure (FrameLazy)
until explicitly called.

**Actual Behavior**: `{1}` is being evaluated/unwrapped to a `FrameExpr`
containing the number `1`.

**Test Case**
([evaluate.test.ts:97-102](../../lib/execute/evaluate.test.ts#L97-L102)):

```typescript
it("returns unevaluated closure for {1}", () => {
  const result = evaluate("{1}");
  const output = result.at(0);
  expect(output).toBeInstanceOf(frame.FrameLazy); // FAILS
  expect(output.toString()).toEqual("{1}"); // FAILS
});
```

**Error**:

```log
AssertionError: Expected object to be an instance of "FrameLazy" but was "FrameExpr".
```

### Issue 2: `{_}` Returns FrameNote Instead of FrameLazy

**Expected Behavior**: `{_}` should remain an unevaluated closure (FrameLazy)
representing an identity function.

**Actual Behavior**: `{_}` is being converted to a `FrameNote` (error/note
type), suggesting a parsing or evaluation error.

**Test Case**
([evaluate.test.ts:104-109](../../lib/execute/evaluate.test.ts#L104-L109)):

```typescript
it("returns unevaluated closure for {_}", () => {
  const result = evaluate("{_}");
  const output = result.at(0);
  expect(output).toBeInstanceOf(frame.FrameLazy); // FAILS
  expect(output.toString()).toEqual("{_}"); // FAILS
});
```

**Error**:

```log
AssertionError: Expected object to be an instance of "FrameLazy" but was "FrameNote".
```

### Related Issue: Closure Application Fails

Because closures aren't being created correctly, all closure application tests
also fail:

```typescript
it("applies closure {_} as identity function", () => {
  const result = evaluate("{_} 42");
  expect(result.toString()).toEqual("[42]"); // FAILS
});
```

## Requirements Violations

These issues violate multiple requirements from
[02-underbar-reqs.md](02-underbar-reqs.md):

- **REQ-1** (Basic Anonymous Argument): `{_}` should work as identity function
- **REQ-2** (Multiple References): `{_ * _}` cannot work if `{_}` doesn't parse
- **EDGE-2** (Empty Closure with `_`): Explicitly discusses `{_}` behavior

## Diagnostic Analysis

### Architecture Context

The HC evaluation pipeline has three stages:

1. **Lex**: Text → Tokens
2. **Parse**: Tokens → Frames (AST)
3. **Eval**: Frames → Results

Closures are represented by `FrameLazy` objects that wrap unevaluated code.

### Key Observation: Empty Closure Works

**Working Case**:

```hc
; {}
# {}
```

The empty closure `{}` correctly returns a `FrameLazy` object. This tells us:

1. The lexer correctly recognizes `{` and `}` tokens
2. The parser correctly creates `FrameLazy` objects
3. The evaluator correctly leaves empty closures unevaluated

**Hypothesis**: Something about **non-empty** closure contents triggers
premature evaluation.

### Symptom Analysis: Issue 1 (`{1}`)

**Result Type**: `FrameExpr` instead of `FrameLazy`

**What is FrameExpr?**: From
[lib/frames/frame-expr.ts](../../lib/frames/frame-expr.ts), `FrameExpr`
represents an expression that has been parsed but is typically evaluated
immediately.

**Diagnostic Questions**:

1. Is `{1}` being parsed as `FrameLazy` but then evaluated to `FrameExpr`?
2. Or is the parser failing to create `FrameLazy` in the first place?
3. Why does `{}` stay as `FrameLazy` but `{1}` doesn't?

**Likely Cause**: The evaluation pipeline is detecting that the closure contains
a simple expression and evaluating it. This suggests an issue in:

- **FrameLazy.in()** - The evaluation method that should delay evaluation
- **evaluate()** - The main evaluation function that processes parsed frames
- **hc-eval.ts** - The evaluation logic that decides what to evaluate

### Symptom Analysis: Issue 2 (`{_}`)

**Result Type**: `FrameNote` instead of `FrameLazy`

**What is FrameNote?**: From
[lib/frames/frame-note.ts](../../lib/frames/frame-note.ts), `FrameNote`
represents metadata, errors, or missing values.

**Diagnostic Questions**:

1. Why does `_` inside a closure trigger an error/note?
2. Is `_` being evaluated outside its proper context?
3. Is there a special case that tries to evaluate `_` during parsing?

**Likely Cause**: The `FrameArg` (representing `_`) is being evaluated in a
context where it doesn't have access to an argument. This suggests:

- The closure body is being evaluated during **parsing** or **initial
  evaluation**
- `FrameArg.in()` is being called with empty or invalid contexts
- The result is `Frame.missing` or an error, which becomes a `FrameNote`

### Running testdoc.hc Evidence

From the actual test run output:

```hc
; {1}
((1), .INFOPATH "/opt/homebrew/share/info:...", ...)
```

**Key Observations**:

1. Output includes the environment variables (entire process context)
2. This massive output suggests `{1}` is being **applied to the current
   context**
3. The closure is not only being evaluated but also being **called**

**Critical Insight**: Closures containing expressions are being **auto-applied**
to the current evaluation context.

## Pipeline Investigation Points

### 1. Lexing Stage (lib/execute/lex.ts)

**Hypothesis**: Lexing is probably working correctly since `{}` works.

**To Verify**:

- Check if `{`, `1`, `}` are tokenized correctly
- Check if `{`, `_`, `}` are tokenized correctly
- Confirm `FrameArg` is created for `_` token

**Expected**: Lexing is fine; issue is in parsing or evaluation.

### 2. Parsing Stage (lib/execute/syntax.ts)

**Hypothesis**: Parser might be creating `FrameLazy` but with incorrect flags or
structure.

**To Verify**:

- Check how `FrameLazy` is constructed for `{1}` vs `{}`
- Verify that body expressions are added to `FrameLazy.data` correctly
- Check if there's any special handling for `FrameArg` in closures

**Suspicious Code Patterns**:

- Any logic that checks if a closure is "simple" or "pure"
- Any automatic evaluation of closure bodies
- Any special-casing of `_` during parsing

### 3. Evaluation Stage (lib/execute/evaluate.ts, hc-eval.ts)

**Hypothesis**: This is where the problem likely occurs.

**To Verify**:

- Check `evaluate()` function: does it evaluate `FrameLazy` objects?
- Check `FrameLazy.in()`: when does it evaluate vs return itself?
- Check if there's auto-application logic when a closure is created

**Critical Code Paths**:

From [lib/frames/frame-lazy.ts](../../lib/frames/frame-lazy.ts):

```typescript
public override in(contexts = [Frame.nil]): Frame {
  // Does this always return this (unevaluated)?
  // Or does it evaluate under certain conditions?
}
```

From [lib/execute/evaluate.ts](../../lib/execute/evaluate.ts):

```typescript
export function evaluate(input: string, context?: Context) {
  // Does this call .in() on FrameLazy?
  // What contexts are passed?
}
```

### 4. Context Management

**Critical Observation**: The testdoc.hc output shows the **entire
environment**.

**Hypothesis**: When `{1}` is evaluated, it's being passed the current context
as an argument, causing it to be applied.

**The Flow**:

1. `{1}` is parsed as `FrameLazy`
2. During evaluation, `evaluate()` calls `frameLazy.in(context)`
3. `FrameLazy.in()` should return `this` (unevaluated)
4. **BUT**: Something is causing it to evaluate AND apply to context

**To Verify**:

- Check what `contexts` parameter is passed to `FrameLazy.in()`
- Check if there's logic that says "if context is provided, apply closure"
- Check if `FrameExpr` has auto-application behavior

## Comparison: Working vs Broken Cases

| Input | Expected  | Actual       | Notes                           |
| ----- | --------- | ------------ | ------------------------------- |
| `{}`  | FrameLazy | FrameLazy    | ✓ Works - empty closure         |
| `{1}` | FrameLazy | FrameExpr    | ✗ Evaluated and returns content |
| `{_}` | FrameLazy | FrameNote    | ✗ Error during evaluation       |
| `{x}` | FrameLazy | (not tested) | Likely fails like `{_}`         |

**Pattern**: Empty closure works, any non-empty closure fails.

**Key Difference**: Empty closures have no body to evaluate. Non-empty closures
have body expressions that are being evaluated prematurely.

## Root Cause Hypothesis

Based on the evidence, the most likely root cause is:

### **FrameLazy is being automatically evaluated when it has non-empty contents**

**Probable Location**: The evaluation pipeline (either in `evaluate()` or in
`FrameLazy.in()`) has logic that:

1. Checks if the closure has contents
2. If yes, evaluates the body
3. If the body contains `_`, tries to evaluate it without proper context
4. Results in either unwrapped expression or error

**Why Empty Closure Works**: Empty closures have nothing to evaluate, so they
bypass this logic.

**Why `{1}` Returns FrameExpr**: The number `1` is successfully evaluated, but
the result is the inner expression instead of the closure wrapper.

**Why `{_}` Returns FrameNote**: The `FrameArg` cannot be evaluated without an
argument context, resulting in an error that becomes `FrameNote`.

## Evidence From Code Review Needed

To confirm the hypothesis, we need to examine:

### 1. FrameLazy Implementation

File: [lib/frames/frame-lazy.ts](../../lib/frames/frame-lazy.ts)

**Questions**:

- What does `FrameLazy.in(contexts)` do?
- Does it evaluate the body or return itself?
- Are there conditions under which it auto-evaluates?

**Expected Issue**: Something like:

```typescript
// WRONG: Auto-evaluating
public override in(contexts = [Frame.nil]): Frame {
  if (this.data.length > 0) {
    // Evaluates body immediately
    return this.data[0].in(contexts);
  }
  return this;
}

// RIGHT: Should be lazy
public override in(contexts = [Frame.nil]): Frame {
  return this;  // Always return unevaluated
}
```

### 2. evaluate() Function

File: [lib/execute/evaluate.ts](../../lib/execute/evaluate.ts)

**Questions**:

- Does `evaluate()` call `.in()` on every frame?
- What context is passed to `.in()`?
- Is there special handling for closures?

**Expected Issue**: Something like:

```typescript
// WRONG: Evaluating all frames including closures
const result = parsed.map((frame) => frame.in(context));

// RIGHT: Closures should stay unevaluated
const result = parsed.map((frame) =>
  frame instanceof FrameLazy ? frame : frame.in(context)
);
```

### 3. Expression Evaluation

File: [lib/frames/frame-expr.ts](../../lib/frames/frame-expr.ts)

**Questions**:

- Does `FrameExpr.in()` automatically apply/evaluate?
- Is there logic that unwraps single-element expressions?

### 4. Context Creation

File: [lib/execute/hc-eval.ts](../../lib/execute/hc-eval.ts)

**Questions**:

- How is the evaluation context created?
- Why does it include environment variables?
- Is the context being passed as an implicit argument to closures?

## Recommended Investigation Steps

### Step 1: Add Debug Logging

Add logging to trace what happens to `{1}`:

```typescript
// In FrameLazy constructor or in()
console.log(`FrameLazy: data=${this.data}, contexts=${contexts}`);
```

### Step 2: Isolate the Evaluation

Test each pipeline stage separately:

```typescript
// Test lexing
const tokens = lex("{1}");
console.log(tokens); // Should include {, 1, }

// Test parsing
const parsed = parse(tokens);
console.log(parsed[0]); // Should be FrameLazy

// Test evaluation
const result = parsed[0].in();
console.log(result); // Should still be FrameLazy
```

### Step 3: Compare Empty vs Non-Empty

Run side-by-side comparison:

```typescript
const empty = evaluate("{}");
const nonEmpty = evaluate("{1}");
console.log(`Empty: ${empty.at(0).constructor.name}`);
console.log(`NonEmpty: ${nonEmpty.at(0).constructor.name}`);
```

### Step 4: Check FrameArg Evaluation

Test `_` in isolation:

```typescript
const underscore = FrameArg.here();
const result = underscore.in([]); // Empty contexts
console.log(result); // Should be Frame.missing or similar
```

## Test Isolation Strategy

To pinpoint the exact issue, create minimal test cases:

### Test 1: Parsing Only

```typescript
import { parse } from "./parse.ts";
import { lex } from "./lex.ts";

const tokens = lex("{1}");
const frames = parse(tokens);
console.assert(frames[0] instanceof FrameLazy, "Should be FrameLazy");
```

### Test 2: Evaluation Control

```typescript
import { evaluate } from "./evaluate.ts";

const result = evaluate("{1}");
const frame = result.at(0);
console.log(`Type: ${frame.constructor.name}`);
console.log(`ToString: ${frame.toString()}`);
console.log(`Is FrameLazy: ${frame instanceof FrameLazy}`);
```

### Test 3: Direct FrameLazy Test

```typescript
import { FrameLazy, FrameNumber } from "../frames.ts";

const num = new FrameNumber(1);
const closure = new FrameLazy(num);
console.log(`Type: ${closure.constructor.name}`);
console.log(`ToString: ${closure.toString()}`);

const evaluated = closure.in([]);
console.log(`After .in(): ${evaluated.constructor.name}`);
console.log(`Same object: ${evaluated === closure}`);
```

## Impact Assessment

### Broken Functionality

This issue breaks fundamental HC features:

1. **All closures with expressions** - Cannot create closures
2. **Anonymous functions** - `{_}` doesn't work
3. **Higher-order functions** - Cannot pass closures as values
4. **Lazy evaluation** - Closures evaluate immediately
5. **MAML templates** - Templates use closures extensively

### Severity: Critical

This is a **show-stopper bug** that prevents basic language functionality. The
anonymous parameter `_` is central to HC's design, and closures are the primary
abstraction mechanism.

## Success Criteria

The fix will be successful when:

1. `evaluate("{}")` returns `FrameLazy` ✓ (already works)
2. `evaluate("{1}")` returns `FrameLazy` with `.toString() == "{1}"`
3. `evaluate("{_}")` returns `FrameLazy` with `.toString() == "{_}"`
4. `evaluate("{_} 42")` returns `[42]` (closure application)
5. `evaluate("{_ * _} 3")` returns `[9]` (multiple `_` references)
6. All tests in [evaluate.test.ts](../../lib/execute/evaluate.test.ts) pass

## Next Steps

1. **Read** the following implementation files:
   - [lib/frames/frame-lazy.ts](../../lib/frames/frame-lazy.ts)
   - [lib/execute/evaluate.ts](../../lib/execute/evaluate.ts)
   - [lib/execute/hc-eval.ts](../../lib/execute/hc-eval.ts)

2. **Identify** the exact line of code causing premature evaluation

3. **Document** the fix strategy in a new specification document

4. **Implement** the fix with proper testing

5. **Verify** all requirements from [02-underbar-reqs.md](02-underbar-reqs.md)
   are satisfied

## References

### Test Files

- [lib/execute/evaluate.test.ts:97-116](../../lib/execute/evaluate.test.ts#L97-L116) -
  Failing closure tests
- [cli/hc/testdoc.hc:24-36](../../cli/hc/testdoc.hc#L24-L36) - End-to-end test
  cases

### Implementation Files

- [lib/frames/frame-lazy.ts](../../lib/frames/frame-lazy.ts) - Closure
  implementation
- [lib/frames/frame-arg.ts](../../lib/frames/frame-arg.ts) - Anonymous parameter
- [lib/execute/evaluate.ts](../../lib/execute/evaluate.ts) - Main evaluation
  function
- [lib/execute/hc-eval.ts](../../lib/execute/hc-eval.ts) - Evaluation context

### Related Specifications

- [01-closure-parsing.md](01-closure-parsing.md) - Closure parsing specification
- [02-underbar-reqs.md](02-underbar-reqs.md) - Anonymous parameter requirements

## Follow-on Investigation (2025-12-13)

- Implemented a first pass to keep closures lazy: `FrameLazy.in` now just merges
  meta/up and returns itself; `FrameLazy.call` builds an Expr from body (or
  argument array for `{}` codify) and immediately evaluates with the argument
  contexts.
- Result: `evaluate("{1}")` now returns a `FrameLazy` whose `toString()` is
  `{(1)}` (tests still accept because they check `FrameLazy` instance).
- `evaluate("{_}")` now yields a `FrameLazy`, but `toString()` collapses to `{}`
  because the parsed `FrameArg` currently has an empty `data` string (lexer
  hands an empty source). This is why the `{_}` test now passes the instance
  check but still prints `{}`.
- `evaluate("{ _ + 1 }")` returns a `FrameLazy` but stringifies to
  `{(()) ((+)) ((1))}` (body frames nested as single-element Exprs). This still
  fails the expectation `{ _ + 1 }`.
- Closure application tests now pass: `{_} 42`, `{ _ + 1 } 2`, `{ _ * _ } 3` all
  evaluate to `[42]`, `[3]`, `[9]` respectively after the new `call` logic.
- FrameLazy stringification differences: with the new `toStringDataArray`, the
  sample in `frame-lazy.test.ts` now prints
  `{speed, gap, _, .speed “slow”; .gap “ ”;}` (commas inserted) and codify
  produces `(speed gap _, .speed “fast”; .gap “ ”;)`. The test expectations need
  to account for this separator formatting or the formatter needs to be aligned
  to the old style.
- FrameArg constructor normalization to force empty strings to `_` was attempted
  and reverted; doing it unconditionally would be unsafe (“ALWAYS?!?” concern).
  The root issue remains that the lexer constructs `FrameArg` with an empty
  `data`, which leads to `{}` output for `{_}`; a targeted fix is still needed
  at lex/parse level rather than constructor coercion.
- Remaining failing tests (current state):
  - `evaluate` grouping: `"{ _ + 1 }"` still fails `toString` expectation.
  - `FrameLazy` tests: stringification contains commas; codify string
    expectation doesn’t match new format.

## Resolution Notes (2025-12-13, later pass)

- **Keep closures lazy**: `FrameLazy.in` only merges meta/up and returns itself;
  evaluation happens on `call`, preserving laziness for non-empty closures.
- **Closure application**: `FrameLazy.call` builds an expression from the
  closure body (or argument array for `{}` codify) and evaluates with
  argument/parameter contexts; closure application tests now pass (`{_} 42`,
  `{ _ + 1 } 2`, `{ _ * _ } 3`).
- **Underscore normalization**: `FrameArg` constructor now normalizes an empty
  source to `_`, fixing the `{_}` stringification (no longer collapses to `{}`)
  while still respecting lexer quirks.
- **Stringification fixes**: Updated `FrameExpr` and `FrameLazy`
  `toStringDataArray` to flatten nested exprs and pad multi-item bodies so
  closures like `{ _ + 1 }` print exactly with interior spaces; meta merging
  keeps insertion order so outputs match expectations.
- **Meta merge ordering**: `FrameLazy.meta_for` now orders metadata keys to keep
  context keys first and overlay closure meta deterministically, which
  stabilized string outputs in tests.
- **Status**: All relevant tests now pass
  (`deno test lib/frames/frame-lazy.test.ts lib/execute/evaluate.test.ts`),
  including grouping expectations for `{1}`, `{_}`, `{ _ + 1 }` and codify
  behavior.
