# Fix Closures - Summary and Next Steps

**Status**: Ready for Implementation
**Date**: 2025-12-14
**Branch**: `fix-closures`

## Summary

This spec series documents the investigation and proposed fixes for test failures introduced by closure improvements in v0.7.5.

## Completed Investigation

### ✅ What Works

1. **FrameLazy spacing** - Fixed `{1}` to output `{ 1 }` with interior spaces
   - File: [lib/frames/frame-lazy.ts:50](../../lib/frames/frame-lazy.ts#L50)
   - Status: Implemented and tested

2. **FrameExpr separator** - Need to decide: keep or revert
   - File: [lib/frames/frame-expr.ts:32-36](../../lib/frames/frame-expr.ts#L32-L36)
   - Currently reverted to original (with separator)
   - Status: Works both ways, design decision needed

### ⚠️ What's Broken

1. **MAML tests** - 2 tests failing
   - Root cause: `FrameParam.there()` (`^`) semantics changed
   - Not caused by separator changes
   - Broke in commit b02b34e (FrameArg/FrameLazy fixes)

## Key Insights

### 1. Separator Changes Are Independent

The FrameExpr separator change is **orthogonal** to MAML issues:
- Removing separator from FrameExpr.toStringDataArray() fixes double-semicolon
- But MAML still fails even with original separator logic
- We can decide on separators independently of MAML

### 2. MAML Should Adapt to HC

**Design Principle**: HCLang core semantics are primary, MAML is secondary.

Rather than changing HC parameter semantics to match legacy MAML expectations, we should update MAML to use correct HC argument semantics.

### 3. Simple Fix Available

MAML can be fixed with a **one-line change**: replace `^` with `__`

```typescript
// lib/maml.ts:23-27
const HeadBlock = new FrameLazy([
  new FrameSymbol("tag"),
  FrameArg.level(2),   // __ instead of FrameParam.there() (^)
  FrameArg.here(),     // _
]);
```

## Specification Documents

1. **[01-closure-parsing.md](01-closure-parsing.md)** - Closure parsing spec
2. **[02-underbar-reqs.md](02-underbar-reqs.md)** - Anonymous parameter requirements
3. **[03-closure-eval-diagnosis.md](03-closure-eval-diagnosis.md)** - Initial diagnosis and resolution
4. **[06-test-failures-analysis.md](06-test-failures-analysis.md)** - Test failure analysis
5. **[07-metadata-first-implementation.md](07-metadata-first-implementation.md)** - Investigation results
6. **[08-maml-redesign.md](08-maml-redesign.md)** - MAML fix proposal

## Next Steps

### Option A: Minimal Fix (Recommended)

Fix MAML to use correct HC semantics, keep current stringification:

1. ✅ Keep FrameLazy spacing fix (already done)
2. ✅ Keep FrameExpr with separator (currently reverted)
3. ✅ Fix MAML: replace `^` with `__` in HeadBlock
4. ✅ Run all tests
5. ✅ Commit and push

**Effort**: 5 minutes
**Risk**: Very low (single line change in MAML)

### Option B: Separator Cleanup + MAML Fix

Implement metadata-first separator design + fix MAML:

1. ✅ Keep FrameLazy spacing fix
2. 🔄 Remove separator from FrameExpr.toStringDataArray()
3. 🔄 Update affected tests (if any)
4. ✅ Fix MAML: replace `^` with `__`
5. ✅ Run all tests
6. ✅ Commit and push

**Effort**: 15-30 minutes
**Risk**: Low (separator tests currently pass either way)

### Option C: Analysis Only

Just document findings, don't implement:

1. ✅ Specs are complete
2. ❌ Tests still failing
3. ❌ Branch cannot merge

**Effort**: 0 minutes (already done)
**Risk**: N/A (no changes)

## Recommendation

**Choose Option A** - Minimal Fix

**Rationale**:

1. **Separator decision can wait** - Both approaches pass tests, no urgency
2. **MAML fix is clear** - One line change with obvious correctness
3. **Ship the value** - Closure improvements are valuable, unblock the branch
4. **Iterate later** - Can revisit separator design in future PR

The metadata-first design is well-specified but not critical. The important work is:
- ✅ Closures work correctly
- ✅ MAML adapts to HC semantics
- ✅ All tests pass

## Implementation Checklist

For Option A:

- [x] FrameLazy spacing fix
- [x] FrameExpr separator (kept original)
- [ ] Update lib/maml.ts HeadBlock
- [ ] Run `deno test -A maml/maml.test.ts`
- [ ] Run `deno test -A`
- [ ] Update CHANGELOG
- [ ] Commit and push

## Success Criteria

✅ All tests pass:
- `deno test -A lib/execute/evaluate.test.ts` - closure tests
- `deno test -A lib/execute/parse.test.ts` - separator tests
- `deno test -A maml/maml.test.ts` - MAML tests
- `deno test -A` - no regressions

✅ Design documented:
- Specs explain rationale
- Future developers understand decisions

✅ Branch mergeable:
- All tests green
- CI passes
- Ready for PR

## References

- **Specs**: [spec/1-fix-closures/](./README.md)
- **Tests**: [lib/execute/evaluate.test.ts](../../lib/execute/evaluate.test.ts)
- **MAML**: [lib/maml.ts](../../lib/maml.ts)
- **Commit**: b02b34e (where MAML broke)
