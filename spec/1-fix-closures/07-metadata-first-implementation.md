# Metadata-First Implementation Spec

**Status**: Implementation In Progress
**Date**: 2025-12-14
**Related**: [06-test-failures-analysis.md](06-test-failures-analysis.md)

## Overview

This document specifies the implementation of the metadata-first stringification design to resolve the remaining test failures.

## Current Status

### Completed Fixes ✅

1. **FrameLazy spacing** - Fixed `{1}` to stringify as `{ 1 }` with interior spaces
   - File: [lib/frames/frame-lazy.ts:50](../../lib/frames/frame-lazy.ts#L50)
   - Change: Added padding spaces when body has content: `const display = body.length > 0 ? ` ${body} ` : body;`
   - Result: Tests now pass for `{1}`, `{_}`, `{ _ + 1 }`

2. **FrameExpr separator** - Fixed double semicolon in nested expressions
   - File: [lib/frames/frame-expr.ts:32-36](../../lib/frames/frame-expr.ts#L32-L36)
   - Change: Removed separator from `toStringDataArray()`, returning just `[body]` instead of `[body + sep]`
   - Result: Test now passes for `(("content"); ("content"))` instead of `(("content";); ("content"))`

### Remaining Failures ⚠️

1. **MAML metadata stringification** - 2 tests failing
   - Test: `wraps title meta in title tag`
   - Test: `wraps all metas in their keyed tag`
   - Issue: Metadata `.tag` reference not being resolved, showing `$!.name-missing "$:FrameString.33.tag"`

## Problem Analysis

### What Broke and Why

The MAML tests were passing before but broke after removing the separator from `FrameExpr.toStringDataArray()`. However, the actual issue is NOT about separators - it's about metadata resolution.

**Hypothesis**: The change to `FrameExpr.toStringDataArray()` may have inadvertently affected how metadata is propagated or accessed during evaluation, not just during stringification.

### MAML Architecture

From [lib/maml.ts](../../lib/maml.ts):

```typescript
export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  MakeTag("html", new FrameExpr([head, body])),
], { tag });  // ← metadata includes 'tag' function
```

The `tag` function (from [maml/tag.ts](../../maml/tag.ts)) should be available in the metadata context when evaluating the MAML expression.

### Current Error

The output shows:
```
[$!.name-missing "$:FrameString.33.tag"; .++ ["author", "Ernest Prabhakar"];, ...]
```

This means:
1. The metadata keys (`author`, `title`) are being iterated correctly (via `&&`)
2. But when trying to access `.tag` on each metadata value, it returns `name-missing`
3. The `.tag` reference should resolve to the `tag` function from `maml.meta`

### Key Question

**Does the separator change affect evaluation, or only stringification?**

Looking at the code:
- `FrameExpr.toStringDataArray()` is only called during `toString()` operations
- It should NOT affect evaluation or metadata resolution
- The bug must be elsewhere, or was already present and only now surfacing

## Investigation Results

### Step 1: Check if MAML Tests Were Already Broken ✅

**Result**: MAML tests were **PASSING in v0.7.4** (commit 18713b4).

```bash
git checkout 18713b4 -- . && deno test -A maml/maml.test.ts
# Result: ok | 1 passed (8 steps) | 0 failed
```

**Conclusion**: Our closure changes broke MAML - it wasn't already broken.

### Step 2: Identify Which Commit Broke MAML ✅

**Result**: MAML broke in commit **b02b34e** (Fix FrameArg and FrameLazy test failures).

```bash
git checkout b02b34e -- . && deno test -A maml/maml.test.ts
# Result: FAILED | 0 passed (6 steps) | 1 failed (2 steps)
```

**Changes in that commit**:

1. FrameLazy stringification - removed extra spaces
2. FrameArg level evaluation - decrement level when no closure
3. **FrameParam evaluation** - check contexts array first

**Most likely culprit**: The FrameParam changes, specifically how parameters are looked up in the contexts array.

### Step 3: Isolate the Metadata Issue

Create a minimal test case:

```typescript
import { FrameExpr, FrameString } from "./lib/frames.ts";

const myFunc = new FrameExpr([/* some implementation */]);
const data = new FrameString("test", { myFunc });

// Try to access .myFunc from metadata
const result = data.get("myFunc");
console.log("Result:", result);
console.log("Is missing?", result.constructor.name);
```

**Question**: Is metadata access working at all, or is this specific to MAML?

### Step 3: Check Metadata Propagation in Iteration

The MAML code uses `&&` (iterate over metas) which should:
1. Get metadata from the argument
2. For each key-value pair, call the block with key and value
3. The block tries to call `.tag` on the value

**Question**: Is the block being evaluated in the correct context where `.tag` is available?

### Step 4: Review Recent Closure Changes

From [03-closure-eval-diagnosis.md](03-closure-eval-diagnosis.md), recent changes:
- `FrameLazy.in()` now just merges meta/up and returns itself
- `FrameLazy.call()` builds expr and evaluates with argument contexts
- `FrameArg` constructor normalizes empty source to `_`

**Question**: Did any of these changes affect how metadata context is inherited or accessed?

## Design Decision: Pause Implementation

### Why Stop Now?

1. **Root cause unclear** - We don't know if MAML was already broken or if our changes broke it
2. **Wrong layer** - The issue appears to be evaluation/context, not stringification
3. **Risk of cascade** - Fixing without understanding could break more things

### What We Need

Before continuing implementation:

1. **Historical context** - When did MAML tests last pass?
2. **Isolated reproduction** - Minimal test case for metadata access
3. **Architecture review** - How does metadata propagate through evaluation?
4. **Clear root cause** - Which specific change broke it, and why?

## Proposed Next Steps

### Option A: Revert FrameExpr Change

If MAML was working before, temporarily revert the separator change:

```typescript
public override toStringDataArray(): string[] {
  const body = this.data.map((obj: Frame) => obj.toString()).join(" ");
  const sep = this.is.statement ? ";" : ",";
  return [body + sep];  // ← Restore separator
}
```

Then check if MAML tests pass. If yes, we know the separator change broke something beyond stringification.

### Option B: Fix MAML First

If MAML was already broken, fix it separately:

1. Create a spec for MAML metadata resolution
2. Fix the metadata context issues
3. Then return to separator changes

### Option C: Skip MAML for Now

If MAML is a separate issue:

1. Commit the separator fixes (which do work correctly)
2. Create a new issue/spec for MAML
3. Handle MAML metadata as a separate workstream

## Root Cause Analysis

### The Separator Change is NOT the Problem

**Verified**: Reverting the FrameExpr separator change does not fix MAML. The separator issue is orthogonal to the MAML issue.

### The Real Problem: FrameParam Context Lookup

The MAML failure shows `.tag` is not being found. Looking at the MAML implementation:

1. `HeadBlock` is a `FrameLazy` containing `FrameParam.there()` (which is `^`)
2. When the block is called, `^` should access the parameter (the metadata key)
3. Then `.tag` should be looked up in the evaluation context

**The Bug**: The new FrameParam.in() implementation (from commit b02b34e) changed how parameters are looked up:

```typescript
// NEW CODE (b02b34e)
const paramIndex = level;
if (paramIndex < contexts.length) {
  return contexts[paramIndex];
}
```

This assumes parameters are at `contexts[paramIndex]`, but the actual parameter passing might work differently in the MAML case.

### Why MAML Broke

The MAML code uses `FrameParam.there()` which is `^` (one caret = level 1). The old code:

```typescript
// OLD CODE (v0.7.4)
const level = this.data.length - 1;
if (level <= contexts.length) {
  return contexts[level];
}
```

The difference is subtle but critical: the old code used `<=` while the new uses `<`, and the old computed `level - 1` from data length.

## Recommended Approach

**Recommendation**: Fix FrameParam context lookup for MAML use case

1. Understand the exact context structure when MAML calls the HeadBlock
2. Adjust FrameParam.in() to handle both the iterator case (which now works) and the MAML case
3. Keep the separator changes - they are correct and unrelated
4. Add tests for FrameParam in different context scenarios

## Success Criteria

Before marking this work complete:

1. ✅ All evaluate.test.ts closure tests pass (already done)
2. ✅ All parse.test.ts separator tests pass (already done)
3. ⚠️ All maml.test.ts tests pass (blocked - needs investigation)
4. ✅ No regressions in other tests (need to verify)

## References

- [06-test-failures-analysis.md](06-test-failures-analysis.md) - Original analysis
- [lib/frames/frame-expr.ts](../../lib/frames/frame-expr.ts) - Changed file
- [lib/frames/frame-lazy.ts](../../lib/frames/frame-lazy.ts) - Changed file
- [maml/maml.test.ts](../../maml/maml.test.ts) - Failing tests
- [lib/maml.ts](../../lib/maml.ts) - MAML implementation
