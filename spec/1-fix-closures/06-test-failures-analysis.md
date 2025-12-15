# Test Failures Analysis - Closure Branch

**Status**: Analysis and Fix Design **Date**: 2025-12-14 **Component**: Test
failures introduced by closure changes

## Overview

The closure improvements in v0.7.5 introduced 8 test failures that were not
caught locally before pushing. This document analyzes the failures and designs
fixes.

## Why Tests Were Not Caught Locally

### Root Cause

The pre-push hook was not installed. While `.pre-commit-config.yaml` defines a
test hook for the `pre-push` stage:

```yaml
- id: test
  name: test
  entry: bash -c "deno test -A"
  stages: [pre-push]
  language: system
  pass_filenames: false
```

The hook was never installed because:

1. `pre-commit install` only installs pre-commit hooks by default
2. Pre-push hooks require `pre-commit install --hook-type pre-push`
3. The pre-commit tool wasn't properly available in the Python environment

### Prevention

- Always run `deno task test` manually before pushing
- Install pre-push hooks: `pre-commit install --hook-type pre-push`
- Ensure pre-commit is available in the active Python environment

## Test Failures

### 1. ParsePipe Semicolon Test (FIXED - FrameArg)

**Test**: `Parse ... ParsePipe ... semicolons Grouped strings on next(true)`

**Expected**: `(("content"); ("content"))` **Actual**:
`(("content";); ("content"))`

**Issue**: Extra semicolon before closing paren - `("content";)` instead of
`("content")`

**Analysis**:

- `FrameExpr.toStringDataArray()` adds semicolon: `["content";"]`
- `FrameExpr.toString()` wraps it: `("content";)`
- `FrameList.toStringDataArray()` adds another semicolon based on `is.statement`
- Result: `("content";);` - double semicolon

**Root Cause**: Separator responsibility is unclear between FrameExpr and
FrameList

- FrameExpr includes separator in toStringDataArray (for trailing comma before
  metadata)
- FrameList also adds separators when joining nested expressions
- This creates duplication for statement separators

### 2. FrameLazy Stringification (FIXED)

**Tests**:

- `FrameLazy ... stringifies to {expr} without metadata`
- `FrameLazy ... captures context but stays lazy until called`

**Expected**: `{speed gap _}` **Actual**: `{ speed gap _ }` (extra spaces)

**Issue**: [frame-lazy.ts:49](../../lib/frames/frame-lazy.ts#L49)

```typescript
const display = body.length > 0 ? ` ${body} ` : body;
```

**Fix**: Remove extra spaces

```typescript
const display = body.length > 0 ? body : body;
```

**Status**: ✅ FIXED

### 3. FrameArg Level Evaluation (FIXED)

**Tests**:

- `FrameArg ... level ... evaluates to a lower level`
- `FrameArg ... FrameParam ... evaluates to the parameter`
- `FrameArg ... FrameParam ... evaluates to higher-level parameters`

**Expected**: Return lower-level FrameArg or parameter from contexts **Actual**:
Returns FrameNote error with "name-missing" = "___"

**Issue**: New closure-aware implementation requires FrameLazy in contexts, but
tests pass plain contexts

**Analysis**: [frame-arg.ts:54-73](../../lib/frames/frame-arg.ts#L54-L73)

The new `FrameArg.in()` implementation:

1. If level <= 1: returns `contexts[0]` ✓
2. If level > 1: searches for FrameLazy in contexts
3. If no FrameLazy: returns error ✗

But tests like `level_3.in([context])` don't provide a FrameLazy, so they fail.

**Fix**: When no closure, decrement the level instead of erroring

```typescript
if (!closure) {
  // When no closure, decrement the level
  return FrameArg.level(level - 1);
}
```

**Fix for FrameParam**: Access parameters from contexts array

```typescript
// Parameters are stored in the contexts array
// contexts[0] is the argument, contexts[1] is the parameter
const paramIndex = level;
if (paramIndex < contexts.length) {
  return contexts[paramIndex];
}
```

**Status**: ✅ FIXED

### 4. Iterator Tests with Closures (FIXED)

**Tests**:

- `iterators ... && iterate over metas ... calls block with key as second parameter`
- `iterators ... && iterate over metas ... is called as a name with a lazy block`

**Expected**: `"[ key: author| value: An Author ]"` **Actual**: Returns full
base array instead of key

**Issue**: FrameParam was looking in closure chain instead of contexts array

**Analysis**: When FrameLazy.call() is invoked, it creates contexts:

```typescript
expr.in([argument, _parameter, this]);
```

So `contexts[1]` contains the parameter, not `closure.up`.

**Fix**: FrameParam should check contexts array first before walking closure
chain

```typescript
// Parameters are stored in the contexts array first
const paramIndex = level;
if (paramIndex < contexts.length) {
  return contexts[paramIndex];
}
// Then try closure chain...
```

**Status**: ✅ FIXED

### 5. Separator/Stringification Issues (NEEDS SPEC)

**Tests**:

- `evaluate ... grouping ... returns unevaluated closure for {1}`
- `evaluate ... grouping ... returns unevaluated closure for {_}`
- `evaluate ... grouping ... returns unevaluated closure for { _ + 1 }`
- `FrameExpr ... stringifies with parentheses`
- `FrameLazy ... Codify ... converts Array to unevaluated Expr when called`

**Issue**: Complex interaction between:

- FrameExpr.toStringDataArray() adding separators
- FrameList.toStringDataArray() adding separators
- Nested expressions getting double separators
- Standalone expressions needing separators for metadata

**Status**: ⚠️ NEEDS PROPER SPEC BEFORE FIXING

## Design Questions for Separator Fix

### Question 1: Separator Responsibility

**Who should add separators between elements?**

Options: A. Each Frame adds its own trailing separator in toStringDataArray() B.
The parent FrameList adds separators when joining children C. Hybrid: Frame adds
internal separator, parent adds external separator

**Current Behavior**: Hybrid (causing conflicts)

- FrameExpr adds separator in toStringDataArray() (for metadata trailing comma)
- FrameList adds separator when joining (for sibling separation)

### Question 2: Nested Expression Handling

**How should nested expressions be separated?**

Example: `FrameGroup([expr1, expr2])` where expr1 is a statement

Current output: `(("content";); ("content"))` Expected output:
`(("content"); ("content"))`

The semicolon should be:

- Outside the inner expr's parens: `("content")`
- Between the two exprs at group level: `); (`

### Question 3: Metadata Separator

**How should data and metadata be separated?**

Example: `FrameExpr([frame, string], {context})`

Expected: `(() "Hello", .context (...))`

- Data elements space-separated: `() "Hello"`
- Trailing comma after data: `,`
- Metadata follows: `.context (...)`

## Proposed Solution

### Key Design Decision: Metadata-First Ordering

**DECISION**: Write metadata FIRST if present, followed by data elements.

**Rationale**:

- Metadata always ends with semicolon (from nested expressions)
- This makes the separator after metadata unambiguous
- Internal references in data become much clearer
- Eliminates the need for complex separator detection logic

### New Format

**With metadata**:

```hc
(metadata; data data data)
```

Example: `(.context ("context", .key "Hello";); () "Hello")`

**Without metadata** (unchanged):

```hc
(data, data, data)
```

### Changes Needed

1. **FrameList.toStringArray()**
   - If metadata present: `[meta_string(), ...dataArray]`
   - If no metadata: `stripLastComma(dataArray)` as before

2. **FrameExpr.toStringDataArray()**
   - Remove trailing separator (no longer needed with metadata-first)
   - Just return data body: `[body]`

3. **FrameList.toStringDataArray()**
   - Keep current behavior: add separators between children
   - But now no conflict since FrameExpr doesn't add its own

### Implementation Strategy

1. Update FrameList.toStringArray() to reorder metadata-first
2. Remove separator from FrameExpr.toStringDataArray()
3. Update all tests to expect new metadata-first format
4. Verify no regressions

## Next Steps

1. ✅ Document test failures (this file)
2. ⚠️ Write detailed separator specification
3. ⚠️ Implement fixes following spec
4. ⚠️ Verify all tests pass
5. ⚠️ Update CHANGELOG

## References

- [frame-expr.ts](../../lib/frames/frame-expr.ts)
- [frame-list.ts](../../lib/frames/frame-list.ts)
- [frame-lazy.ts](../../lib/frames/frame-lazy.ts)
- [frame-arg.ts](../../lib/frames/frame-arg.ts)
- [parse-pipe.ts](../../lib/execute/parse-pipe.ts)
