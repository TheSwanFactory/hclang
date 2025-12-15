# MAML Redesign for HC Closure Semantics

**Status**: Design Proposal **Date**: 2025-12-14 **Related**:
[07-metadata-first-implementation.md](07-metadata-first-implementation.md)

## Overview

MAML (Markup as Metalanguage) is secondary to HCLang core semantics. Rather than
fixing HC to match legacy MAML behavior, we should redesign MAML to use proper
HC closure and parameter semantics.

## Current MAML Implementation

### What It Does

MAML converts HC data with metadata into HTML:

```hc
const body = new FrameString("Hello, MAML!", {
  author: new FrameString("Ernest Prabhakar"),
  title: new FrameString("First MAML Document ever"),
});
maml.call(body)
```

Expected output:

```html
<!DOCTYPE html>
<html>
  <head>
    <author>Ernest Prabhakar</author>
    <title>First MAML Document ever</title>
  </head>
  <body>Hello, MAML!</body>
</html>
```

### Current Architecture

From [lib/maml.ts](../../lib/maml.ts):

```typescript
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameParam.there(), // ← Uses ^ (parameter)
  FrameArg.here(), // ← Uses _ (argument)
]);

const head = MakeTag(
  "head",
  new FrameExpr([
    FrameArg.here(), // The body with metadata
    new FrameName("&&"), // Iterate over metadata
    HeadBlock, // Called for each key-value pair
  ]),
);
```

**Intent**:

1. `&&` iterates over metadata of the body
2. For each (key, value) pair, calls `HeadBlock`
3. `HeadBlock` calls `tag` with the key (`^`) and value (`_`)
4. `tag` wraps it in `<key>value</key>`

### The Problem

The `HeadBlock` uses `FrameParam.there()` which is `^`. The iterator `&&` is
expected to pass the metadata key as the parameter, but the new HC semantics
changed how parameters are looked up in contexts.

**Old behavior**: `^` looked at `contexts[0]` (worked by accident) **New
behavior**: `^` looks at `contexts[1]` (correct for closures) **Result**: MAML
can't find the key

## Design Question

**Should we fix HC parameter semantics to match MAML's expectations, or fix MAML
to use correct HC semantics?**

**Answer**: Fix MAML. HC is the foundation, MAML is an application.

## Proposed Solution: Redesign MAML

### Option 1: Use Simpler Closure Syntax

Instead of `FrameParam.there()`, use a two-argument closure:

```typescript
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameArg.level(2), // __ (second argument) = the key
  FrameArg.here(), // _ (first argument) = the value
]);
```

**Rationale**:

- `&&` iterator passes (value, key) as arguments
- Use `__` for key, `_` for value
- No need for parameter (`^`) semantics
- Cleaner and more explicit

### Option 2: Fix Iterator to Match Closure Semantics

Currently `&&` passes arguments in a way that requires `^`. Instead, make it
pass them as regular arguments:

```typescript
// In lib/ops/iterators.ts
// OLD: closure.call(value, key)
// NEW: closure.call(new FrameArray([value, key]))
```

Then MAML can use:

```typescript
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameArg.level(2), // __ = key
  FrameArg.here(), // _ = value
]);
```

### Option 3: Simplify with Direct Function Call

Skip closures entirely and use direct function application:

```typescript
const head = MakeTag(
  "head",
  new FrameExpr([
    FrameArg.here(),
    new FrameName("&&"),
    new FrameExpr([ // Not a closure, just an expression
      new FrameSymbol("tag"),
      FrameArg.level(2), // __ will be the key
      FrameArg.here(), // _ will be the value
    ]),
  ]),
);
```

## Recommended Approach: Option 1

**Use `__` instead of `^` in HeadBlock**

### Implementation

Change [lib/maml.ts:23-27](../../lib/maml.ts#L23-L27):

```typescript
// OLD
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameParam.there(), // ^
  FrameArg.here(), // _
]);

// NEW
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameArg.level(2), // __ (second argument = key)
  FrameArg.here(), // _ (first argument = value)
]);
```

### Why This Works

1. **Correct HC semantics**: Uses argument levels (`_`, `__`) not parameters
   (`^`)
2. **Iterator compatibility**: `&&` already passes (value, key) as two arguments
3. **Minimal change**: Only changes MAML, not HC core
4. **Clear intent**: `__` for second arg is more explicit than `^` for parameter

### Verification

After the change:

- `&&` iterates metadata
- Calls `HeadBlock` with (value, key)
- `_` accesses value, `__` accesses key
- `tag` function wraps them in HTML tags
- Tests should pass

## Confirmed: Iterator Argument Order

From [lib/ops/iterators.test.ts:40-50](../../lib/ops/iterators.test.ts#L40-L50),
`&&` passes arguments as:

- **First argument** (`_` / `FrameArg.here()`): the **value**
- **Second argument** (`^` / `FrameParam.there()`): the **key**

So the current MAML is correct in intent - it wants the key as the second
argument. The problem is just that `^` (parameter) semantics changed, so we need
to use `__` (second argument) instead.

## Impact Analysis

### Changes Required

1. **lib/maml.ts** - Update `HeadBlock` definition (1 line change)
2. **maml/maml.test.ts** - No changes needed (tests should just pass)
3. **Documentation** - Update MAML docs to show correct closure syntax

### Benefits

- MAML works with correct HC semantics
- No regression risk to HC core
- Sets precedent for HC-first design
- Clearer example of multi-argument closures

### Risks

- None (MAML is isolated from HC core)
- If behavior still wrong, easy to adjust

## Testing Strategy

After implementation:

1. Run `deno test -A maml/maml.test.ts`
2. Verify all 8 tests pass
3. Check output matches expected HTML
4. Test with different metadata keys

## Next Steps

1. Check `&&` iterator implementation to confirm argument order
2. Update `HeadBlock` in lib/maml.ts
3. Run tests
4. Update MAML documentation
5. Consider adding more MAML examples showing multi-arg closures

## References

- [lib/maml.ts](../../lib/maml.ts) - MAML implementation
- [maml/tag.ts](../../maml/tag.ts) - Tag wrapper function
- [lib/ops/iterators.ts](../../lib/ops/iterators.ts) - `&&` iterator
- [07-metadata-first-implementation.md](07-metadata-first-implementation.md) -
  Root cause analysis
