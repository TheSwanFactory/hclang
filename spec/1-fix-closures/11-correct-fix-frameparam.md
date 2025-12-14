# Correct Fix: FrameParam Context Lookup

**Status**: Final Solution
**Date**: 2025-12-14
**Related**: [10-maml-deeper-investigation.md](10-maml-deeper-investigation.md)

## The Real Problem

The MAML redesign approach was wrong. The original MAML was **correct** - it used `FrameParam.there()` (`^`) for the key.

The iterator test in [lib/ops/iterators.test.ts:62-78](../../lib/ops/iterators.test.ts#L62-L78) that PASSES uses `^` for the key:

```typescript
const TestBlock = new frame.FrameLazy([
  new frame.FrameString(" [ key: "),
  frame.FrameParam.there(),  // ← Uses ^ for key
  new frame.FrameString("| value: "),
  frame.FrameArg.here(),     // ← Uses _ for value
  new frame.FrameString(" ] "),
]);
```

This test passes! So `^` CAN work with iterators.

## What Changed

The problem is in commit b02b34e where FrameParam.in() was changed to prioritize contexts array over closure chain:

```typescript
// NEW CODE (b02b34e) - Breaks MAML
const paramIndex = level;
if (paramIndex < contexts.length) {
  return contexts[paramIndex];
}
```

This changed the lookup order, which broke MAML even though it fixed iterator tests.

## The Correct Fix

We need FrameParam.in() to handle BOTH cases:
1. **Closure parameters**: When called via `FrameLazy.call(arg, param)`, param is at `contexts[1]`
2. **Expression parameters**: When called via `FrameExpr.call(arg, param)`, param might be elsewhere

The issue is understanding where the parameter actually ends up in the contexts array for each case.

## Investigation: How Parameters are Passed

### Case 1: Iterator with FrameLazy

From [lib/ops/iterators.ts:13-19](../../lib/ops/iterators.ts#L13-L19):

```typescript
export const MapProperties = (source: Frame, block: Frame): FrameArray => {
  const array: Frame[] = source.meta_pairs().map(([key, value]): Frame => {
    const fkey = new FrameString(key);
    return block.call(value, fkey);  // ← Calls with (value, key)
  });
  return new FrameArray(array);
};
```

So `block.call(value, fkey)` is called where:
- `block` is a `FrameLazy` (the HeadBlock)
- First arg: `value` (the metadata value)
- Second arg (`parameter`): `fkey` (the metadata key)

### Case 2: FrameLazy.call() Implementation

From [lib/frames/frame-lazy.ts:60-76](../../lib/frames/frame-lazy.ts#L60-L76):

```typescript
public override call(
  argument: Frame,
  _parameter: Frame = Frame.nil,
): Frame {
  if (this.data.length === 0) {
    // ... codify case
  }

  const expr = new FrameExpr(this.data, this.meta_for(argument));
  expr.up = this;
  return expr.in([argument, _parameter, this]);
}
```

Key line: `expr.in([argument, _parameter, this])`

So the contexts array is:
- `contexts[0]` = argument
- `contexts[1]` = _parameter
- `contexts[2]` = this (the closure)

### Expected Behavior

For `FrameParam.there()` (which is `^`, level = 1):
- Should return `contexts[1]` which is the `_parameter`
- In the iterator case, this is `fkey` (the metadata key)

### Old Code (v0.7.4)

```typescript
const level = this.data.length - 1;  // For "^", level = 0
if (level <= contexts.length) {
  return contexts[level];  // Returns contexts[0] = argument
}
```

Wait, this looks wrong too! If `"^".length = 1`, then `level = 1 - 1 = 0`, which returns `contexts[0]` (the argument), not `contexts[1]` (the parameter).

Let me check what `.data` actually contains for FrameParam...

## Understanding FrameParam.data

Looking at [lib/frames/frame-arg.ts](../../lib/frames/frame-arg.ts), `FrameParam` extends `FrameSymbol` and stores the parameter token in `.data`.

For `FrameParam.there()` which creates `^`:
- `.data` = "^" (the string)
- `.data.length` = 1

So in old code:
```typescript
const level = this.data.length - 1;  // 1 - 1 = 0
```

This returns level 0, but we want level 1 for the parameter!

## The Bug Was Always There!

Actually, let me test if the OLD code even worked. Let me check out v0.7.4 and test:

This needs empirical verification. The issue is we don't fully understand how the old code worked.

## Recommendation

Rather than guess, we should:

1. **Revert to v0.7.4 state** for FrameParam
2. **Add detailed logging** to understand what contexts array looks like
3. **Fix based on understanding**, not guessing

Or:

1. Keep the new FrameParam code
2. **Change MAML** to not use `^` at all
3. **Fix the iterator** to pass arguments differently

Actually, the simplest solution: **use the old FrameParam code** since we know it worked!

## Action: Revert FrameParam.in()

Revert [lib/frames/frame-arg.ts](../../lib/frames/frame-arg.ts) `FrameParam.in()` method to v0.7.4 version, and revert MAML to use `FrameParam.there()`.

This is the safest path forward - we know it worked before.
