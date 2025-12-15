# MAML Deeper Investigation

**Status**: Investigation **Date**: 2025-12-14 **Related**:
[08-maml-redesign.md](08-maml-redesign.md)

## Problem

Changed MAML from `FrameParam.there()` (`^`) to `FrameArg.level(2)` (`__`), but
tests still fail with `.tag` not found.

## Evidence

### Iterator Implementation

From [lib/ops/iterators.ts:13-19](../../lib/ops/iterators.ts#L13-L19):

```typescript
export const MapProperties = (source: Frame, block: Frame): FrameArray => {
  const array: Frame[] = source.meta_pairs().map(([key, value]): Frame => {
    const fkey = new FrameString(key);
    return block.call(value, fkey); // ← value as arg, key as param
  });
  return new FrameArray(array);
};
```

So `&&` (which uses `MapProperties`) calls `block.call(value, fkey)`:

- First argument: `value` (the metadata value)
- Second argument (parameter): `fkey` (the metadata key)

### MAML HeadBlock (After Fix)

```typescript
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameArg.level(2), // __ should get second argument = key
  FrameArg.here(), // _ should get first argument = value
]);
```

### Still Failing

```bash
"<!DOCTYPE html><html><head>[$!.name-missing "$:FrameString.32.tag"; .++ ...
```

The `.tag` property is still not found!

## Root Cause Analysis

The problem isn't about `^` vs `__`. The problem is about where `.tag` is looked
up.

### What MAML Expects

From [lib/maml.ts:39-42](../../lib/maml.ts#L39-L42):

```typescript
export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  MakeTag("html", new FrameExpr([head, body])),
], { tag }); // ← tag is in maml's metadata
```

The `tag` function is in `maml.meta`. When `HeadBlock` executes:

```typescript
new FrameSymbol("tag"); // ← This needs to resolve to maml.meta.tag
```

### The Real Issue

`FrameSymbol("tag")` is trying to look up `.tag` in the evaluation context. But
when the `HeadBlock` closure is called during `&&` iteration:

1. The closure is called with `(value, key)` as arguments
2. The closure's context is set up with those arguments
3. But the closure needs access to `maml.meta.tag` from its definition site

**This is a closure capture issue!**

## The Fix That Might Work

The `HeadBlock` needs to be defined in a context where `tag` is accessible.
Currently:

```typescript
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"), // Looks for 'tag' in evaluation context
  FrameArg.level(2),
  FrameArg.here(),
]);
```

But `tag` is in `maml.meta`, not in HeadBlock's context. We need to either:

### Option 1: Pass tag to HeadBlock explicitly

```typescript
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameArg.level(2),
  FrameArg.here(),
], { tag }); // ← Add tag to HeadBlock's metadata
```

### Option 2: Get tag from maml's context

Instead of `FrameSymbol("tag")`, use a reference that will look up in maml's
metadata.

### Option 3: Use tag directly (not via symbol lookup)

```typescript
const HeadBlock = new FrameLazy([
  tag, // ← Direct reference, not symbol lookup
  FrameArg.level(2),
  FrameArg.here(),
]);
```

## Next Test

Try Option 3 first - use `tag` directly instead of `FrameSymbol("tag")`:

```typescript
import { tag } from "../maml/tag.ts";

const HeadBlock = new FrameLazy([
  tag, // Direct reference
  FrameArg.level(2),
  FrameArg.here(),
]);
```

This should work because `tag` is already imported at the top of the file!

## References

- [lib/maml.ts](../../lib/maml.ts)
- [lib/ops/iterators.ts](../../lib/ops/iterators.ts)
- [maml/tag.ts](../../maml/tag.ts)
