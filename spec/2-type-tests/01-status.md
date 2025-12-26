# Type Tests Implementation - Status Report

**Date**: 2025-12-21 **Branch**: tag-tests **Status**: In Progress - Phase 1
(Test Failures)

## Objective

Add comprehensive type/schema tests to HC's test suite, expanding from 2 tests
to ~38 tests covering:

- Basic schema validation (empty schemas, enumerations, single-value schemas)
- Edge cases (nil values, context preservation, error messages)
- Schema storage and retrieval
- HLIR advanced types (aspirational, marked with `.skip()`)
- Type conversion (aspirational)

## Current Progress

### Completed ✓

1. **Exploration Phase**:
   - Analyzed existing type system implementation
   - Found FrameSchema class in `lib/frames/frame-schema.ts`
   - Identified schema validation in `lib/frames/frame-symbol.ts` (lines 52-107)
   - Reviewed examples in `testdoc.hc` and HLIR docs

2. **Planning Phase**:
   - Created comprehensive plan in `.claude/plans/mutable-soaring-walrus.md`
   - Got user approval for: Schema validation focus, expand evaluate.test.ts,
     include HLIR as documentation

3. **Phase 1 Implementation** (Partial):
   - Added 11 new tests to `lib/execute/evaluate.test.ts` (lines 238-298)
   - Tests added:
     - 2 empty schema tests
     - 4 enumerated type tests (string and number)
     - 3 single-value schema tests
     - 2 reassignment tests

### Current Issues ⚠️

**6 tests failing** out of 13 total schema tests:

1. **"accepts any value with empty schema"** - Format mismatch
   - Expected: `[.x 42, .x.<> <>; .x 42;]`
   - Actual: `[42, .x <>;]`
   - Issue: Schema binding doesn't work as expected for empty schemas

2. **"allows reassignment with empty schema"** - No output
   - Expected to contain: `.x "hello"`
   - Actual: Empty/no match
   - Issue: Empty schema may not accept string values or assignment fails

3. **"accepts values from string enumeration"** - No match
   - Expected to contain: `.color "red"`
   - Issue: String enumeration not working as expected

4. **"rejects values not in string enumeration"** - No type error
   - Expected to contain: `$!.type-error`
   - Issue: String enumeration validation not implemented

5. **"enforces string literal type"** - No match
   - Expected to contain: `.status "ok"`
   - Issue: String literal schema not working

6. **"maintains schema across assignments"** - Wrong count
   - Expected: 3 occurrences of `.x 1`
   - Actual: 2 occurrences
   - Issue: Assignment tracking or schema validation issue

**7 tests passing** ✓:

- "binds value with schema and reports assignment" (original)
- "rejects values that do not match the schema" (original)
- "validates number enumerations"
- "rejects numbers not in enumeration"
- "enforces single value schema"
- "rejects different value for single value schema"
- "allows multiple valid assignments"

## Root Cause Analysis

### Issue 1: Empty Schema Behavior

The empty schema `<>` appears to work differently than expected:

- Number schemas work: `.one <1> 1` → stores both value and schema
- Empty schema doesn't: `.x <> 42` → only stores value, not full binding

**Hypothesis**: Empty schema (`Frame.all`) has special handling that bypasses
normal schema storage.

### Issue 2: String Schema Support

String-based schemas don't appear to work at all:

- `.color <"red","green","blue"> "red"` doesn't produce expected output
- String literal schemas like `<"ok">` don't work

**Hypothesis**: Current implementation only supports numeric schema validation.
String matching in `matchesSchema()` may not handle FrameString comparisons.

### Issue 3: Assignment Counting

The test counting assignments may be flawed:

```typescript
const assignments = result.toStringArray();
expect(assignments.filter((s) => s.includes(".x 1"))).toHaveLength(3);
```

**Hypothesis**: `toStringArray()` may not return individual assignments, or the
format doesn't match our filter.

## Next Steps

### Option A: Fix Implementation (Time-intensive)

1. Investigate schema storage for empty schemas
2. Add string schema support to `matchesSchema()`
3. Fix or understand assignment output format

**Pros**: Tests would document actual behavior **Cons**: May require significant
implementation changes

### Option B: Adjust Tests to Current Behavior (Pragmatic)

1. Update test expectations to match actual output
2. Use `.skip()` for unimplemented features (string schemas)
3. Document current limitations

**Pros**: Fast, documents actual state **Cons**: May accept bugs as features

### Option C: Mixed Approach (Recommended)

1. **Debug actual output**: Run each failing test manually to see exact output
2. **Fix obvious test bugs**: Adjust assertions that are wrong
3. **Skip unimplemented features**: Mark string schema tests with `.skip()` if
   not implemented
4. **Continue with passing tests**: Move to Phase 2 (edge cases) and Phase 3
   (HLIR aspirational)
5. **Document limitations**: Note what works vs. what doesn't

## Investigation Needed

Before proceeding, need to:

1. **Check actual output format**:
   ```bash
   deno run -A cli/hc.ts -e '.x <> 42' # What does this actually return?
   ```

2. **Check string schema support**:
   ```typescript
   // In lib/frames/frame-symbol.ts, does matchesSchema handle strings?
   ```

3. **Understand toStringArray()**:
   ```typescript
   // What format does evaluate().toStringArray() return?
   ```

## Files Modified

- `lib/execute/evaluate.test.ts`: Added 11 tests (lines 238-298)

## Files To Modify (Pending)

- `lib/execute/evaluate.test.ts`: Fix failing tests, add Phase 2-3 tests
- `cli/hc/testdoc.hc`: Add examples (lines 50+)

## Test Statistics

- **Total schema tests**: 13 (was 2)
- **Passing**: 7 (54%)
- **Failing**: 6 (46%)
- **Skipped**: 0
- **Remaining to add**: ~25 more tests (edge cases, storage, HLIR, conversion)

## Recommendation

**Proceed with Option C (Mixed Approach)**:

1. Investigate actual behavior with manual testing
2. Fix test assertions to match reality
3. Mark unimplemented features with `.skip()` and clear comments
4. Continue adding remaining test categories
5. Document current schema capabilities and limitations

This approach balances practicality with thoroughness and provides value even if
some features aren't fully implemented.
