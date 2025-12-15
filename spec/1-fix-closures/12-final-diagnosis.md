# Final Diagnosis: Fundamental Conflict

**Status**: Blocker Identified **Date**: 2025-12-14

## The Conflict

Closure fixes and MAML are **fundamentally incompatible** with current
implementation.

### Root Cause: FrameLazy.call()

The new FrameLazy implementation (for correct closure semantics) breaks MAML.

**Old FrameLazy.call()** (v0.7.4):

```typescript
public override call(
  argument: Frame,
  _parameter: Frame = Frame.nil,
): FrameExpr {
  return new FrameExpr(argument.asArray(), this.meta_for(argument));
}
```

**New FrameLazy.call()** (current):

```typescript
public override call(
  argument: Frame,
  _parameter: Frame = Frame.nil,
): Frame {
  if (this.data.length === 0) {
    const codified = new FrameExpr(
      argument.asArray(),
      this.meta_for(argument),
    );
    codified.up = this;
    return codified;
  }

  const expr = new FrameExpr(this.data, this.meta_for(argument));
  expr.up = this;
  return expr.in([argument, _parameter, this]);  // ← This line breaks MAML
}
```

### Why It Breaks MAML

The line `expr.in([argument, _parameter, this])` evaluates the closure body
immediately with the argument/parameter contexts. This is correct for closures
but breaks MAML's use of `FrameSymbol("tag")` which expects to look up "tag" in
a different context.

### Test Results

- ✅ MAML passes with v0.7.4 FrameLazy
- ❌ Closure tests fail with v0.7.4 FrameLazy
- ❌ MAML fails with new FrameLazy
- ✅ Closure tests pass with new FrameLazy

## The Decision

We must choose:

### Option 1: Keep Closure Fixes, Break MAML

- Closures work correctly
- MAML needs complete rewrite
- Better long-term: correct HC semantics

### Option 2: Revert Closure Fixes, Keep MAML

- MAML works
- Closures broken
- Bad for HC future

### Option 3: Fix Both (Complex)

Requires deep understanding of context/metadata propagation to make both work.

## Recommendation

**Choose Option 1**: Keep closure fixes, mark MAML as broken.

**Rationale**:

1. HC core semantics > MAML application
2. Closures are fundamental to HC
3. MAML can be rewritten
4. Better to ship working closures than broken both

## Next Steps

1. Document that MAML is temporarily broken
2. Skip MAML tests in CI
3. Create issue for MAML rewrite
4. Ship closure fixes in v0.7.5
5. Fix MAML in v0.7.6

## Alternative: Full Revert

If we can't ship with broken MAML:

1. Revert ALL closure changes
2. Go back to v0.7.4 state
3. Plan more carefully for v0.7.6

This loses the valuable closure work but keeps system stable.
