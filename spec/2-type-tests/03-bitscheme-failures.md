# BitScheme Test Failures - Type and Selector Issues

**Date**: 2025-12-21
**Source**: BitScheme test suite (`cli/hc/BitScheme.hc`)
**Test Command**: `deno task test:bs`
**Results**: 14 passed, 17 failed (31 total)

## Overview

The BitScheme test suite reveals significant issues with type/schema definitions and selector syntax. These failures represent missing or broken functionality in HC's advanced type system features.

## Category 1: Type/Schema Definitions (Tests 22-24)

### Test 22: Enum Variable Not Found
```hc
; enum123
# Expected: "2"
# Actual: "$!.name-missing "$:HCTest.132.enum123";"
```

**Status**: ❌ FAIL - Variable not found

**Context**: This test expects to retrieve a previously defined enumeration type. The enum should have been defined earlier in the test suite.

**Root Cause**: The variable `enum123` is not being stored or is not accessible in the current scope.

### Test 23: Enum Schema Retrieval
```hc
; enum123.<>
# Expected: "<1,2,3>"
# Actual: "$!.name-missing "$:HCTest.132.enum123"; .++ [, <>];"
```

**Status**: ❌ FAIL - Cannot retrieve schema from undefined variable

**Context**: Attempts to access the schema (type signature) of an enumeration using the `.<>` property syntax.

**Expected Behavior**: Should return the schema definition `<1,2,3>` that constrains which values can be bound to `enum123`.

**Actual Behavior**: Variable not found, so schema retrieval fails.

**Related Code**: [lib/frames/frame-symbol.ts:52-107](lib/frames/frame-symbol.ts#L52-L107) contains `matchesSchema()` logic.

### Test 24: Type-Tagged Value Creation
```hc
; @enum123 4
# Expected: "$@enum123<1,2,3> 4"
# Actual: "$!.name-missing "enum123"; .++ [4];"
```

**Status**: ❌ FAIL - Cannot create type-tagged value

**Context**: Attempts to create a type-tagged value using `@enum123 4` syntax, which should fail validation since `4` is not in the enum `<1,2,3>`.

**Expected Behavior**: Should return a type error showing the enum name, schema, and invalid value.

**Actual Behavior**: Cannot find the enum definition, so type checking cannot occur.

### Analysis: Enum Functionality

**What Should Work**:
1. Define an enum: `@enum123 <1,2,3>`
2. Bind a valid value: `@enum123 2` → stores `2`
3. Retrieve the value: `enum123` → returns `2`
4. Retrieve the schema: `enum123.<>` → returns `<1,2,3>`
5. Type error on invalid value: `@enum123 4` → returns type error

**Current Status**:
- ✓ Numeric schemas work in simple cases (from [spec/2-type-tests/02-findings.md](spec/2-type-tests/02-findings.md))
- ❌ Enum variable storage/retrieval broken in BitScheme context
- ❌ Schema retrieval via `.<>` not working
- ❌ Type-tagged error messages not generating correctly

**Possible Causes**:
1. **Scope Issue**: Enums defined in one part of the file are not accessible later
2. **Parser Issue**: The `@name <schema>` syntax may not be parsing correctly in this context
3. **Context Loss**: The evaluation context may be getting reset between tests
4. **Syntax Variation**: BitScheme may use different syntax than what's tested in `lib/execute/evaluate.test.ts`

**Related Passing Tests**:
From [spec/2-type-tests/02-findings.md](spec/2-type-tests/02-findings.md), we know these work:
```typescript
execute(`.one <1> 1`) // Returns: [1, .one.<> <1>; .one 1;]
execute(`.one <1> 2`) // Returns: $!.type-error
```

So basic numeric schema validation works, but enum persistence across statements appears broken.

## Category 2: Selector Syntax (Test 25)

### Test 25: Property Selector
```hc
; <.x, .z> [.x 1; .y 2; .z 3;] # Selector
# Expected: "[1, 3]"
# Actual: "<x, z, [(.x 1); (.y 2); (.z 3);]>"
```

**Status**: ❌ FAIL - Selector not extracting values

**Context**: Uses a schema `<.x, .z>` as a selector to extract specific properties from a dictionary/record.

**Expected Behavior**:
- Schema `<.x, .z>` should act as a "deconstructor" (see [cli/hc/BitScheme.hc:203-214](cli/hc/BitScheme.hc#L203-L214))
- When applied to `[.x 1; .y 2; .z 3;]`, it should extract only the values for `.x` and `.z`
- Result should be `[1, 3]`

**Actual Behavior**:
- Returns a schema-like structure containing the selector and the data
- No extraction/filtering occurs
- Output format: `<x, z, [(.x 1); (.y 2); (.z 3);]>`

**Documentation Reference**:
From [BitScheme.hc:203-214](cli/hc/BitScheme.hc#L203-L214):
```hc
=== Deconstructors

Schemas can also act directly to extract or bind values from compound sequences:

; <.x, .z> [.x 1; .y 2; .z 3;] # Selector
# [1, 3]
; .BitSplitter3 <[.head <3@Bit>; .tail <[@Bit]>;]>;
; BitSplitter3 0b10101100
# [.head 0b101; .tail 0b01100;]
```

### Analysis: Selector Functionality

**What Should Work**:
1. Define a selector schema: `<.x, .z>` (list of property names)
2. Apply to a record: `<.x, .z> [.x 1; .y 2; .z 3;]`
3. Extract matching values: `[1, 3]` (only x and z, in order)

**Current Status**:
- ❌ Selector extraction not implemented
- ❌ Schema application to records not working as documented
- ? May be a general issue with "schemas as deconstructors"

**Possible Causes**:
1. **Not Implemented**: Deconstructor functionality may not be implemented yet
2. **Parser Issue**: The pattern `<schema> data` may parse but not evaluate correctly
3. **Evaluation Order**: May need special handling to recognize schemas as operations
4. **Frame Application**: Schema frames may not have an `apply()` method for deconstruction

**Related Functionality**:
This is part of a broader "schemas as deconstructors" feature described in BitScheme:
- Property selection: `<.x, .z>` (this test)
- Bit splitting: `BitSplitter3 0b10101100` (test 26, also failing)
- NetString parsing: `NetString 0x548656c6c6f...` (test 29, also failing)

All deconstructor-related tests are failing, suggesting this is an unimplemented feature category.

## Category 3: Advanced BitScheme Features (Tests 26-31)

These tests build on the enum and selector functionality, so their failures may be cascading from the above issues.

### Test 26: BitSplitter Deconstructor
```hc
; BitSplitter3 0b10101100
# Expected: "[.head 0b101; .tail 0b01100;]"
# Actual: "$!.name-missing "$:HCTest.132.BitSplitter3"; .++ [0b10101100];"
```

**Issue**: Variable `BitSplitter3` not found (similar to enum123 issue)

### Tests 27-28: BitSplitter Sequences
```hc
; BS3_sequence
; BS3_sequence .| ()
```

**Issue**: Variable `BS3_sequence` not found (scope/persistence issue)

### Test 29: NetString Parsing
```hc
; NetString 0x548656c6c6f666666666 # 5:Hello + sixes
# Expected: "[.n 0x5; .string 0x48656c6c6f;] # Hello"
```

**Issue**: Variable `NetString` not found

### Test 30: Command Parser
```hc
; .op {
# Expected: "# .data 0xc"
```

**Issue**: Complex expression with multiple undefined variables

### Test 31: Framebuffer Parser
```hc
; fb-parse fb-bits
# Expected: "[0xf4m3b0ff3c, @width 0x0004, ...]"
```

**Issue**: Variables `fb-parse` and `fb-bits` not found

## Common Patterns Across Failures

### 1. Variable Persistence
**Pattern**: Variables defined earlier in the file are not available in later tests.

**Affected Tests**: 22, 23, 24, 26, 27, 28, 29, 30, 31

**Examples**:
- `enum123` (test 22)
- `BitSplitter3` (test 26)
- `BS3_sequence` (test 27)
- `NetString` (test 29)

**Hypothesis**: The test harness may be resetting the evaluation context between tests, or the BitScheme file has a scope issue.

### 2. Schema as Operator
**Pattern**: Schemas used as operations on data don't execute as expected.

**Affected Tests**: 25 (selector), 26 (BitSplitter)

**Example**: `<.x, .z> [.x 1; .y 2; .z 3;]`

**Hypothesis**: Applying a schema to data (schema as deconstructor) is not implemented.

### 3. Complex Type Definitions
**Pattern**: Advanced type features like enums, deconstructors, and deferred captures don't work.

**Affected Tests**: 22-31 (all advanced features)

**Hypothesis**: These features are documented in BitScheme spec but not yet implemented in HC.

## Implementation Status Summary

### ✅ What Works
From [spec/2-type-tests/02-findings.md](spec/2-type-tests/02-findings.md):
- Basic numeric schema validation: `.x <42> 42`
- Numeric enumerations: `.x <1,2,3> 2`
- Type error detection: `.x <1> 2` → `$!.type-error`
- Schema storage: `.x.<>` returns the schema

### ❌ What Doesn't Work
From BitScheme tests:
- Enum variable persistence across statements
- Schema retrieval via `.<>` in complex contexts
- Type-tagged error messages with schema details
- Selector syntax (schemas as deconstructors)
- BitSplitter and other advanced deconstructor patterns
- Deferred captures with `{<n@Byte>}` syntax
- Variable scoping in BitScheme test files

### 🚧 Partially Working
- Empty schemas `<>`: Work for assignment but have format issues
- String schemas: Not implemented (returns `[]`)

## Root Cause Hypotheses

### Hypothesis 1: Test Harness Context Isolation
**Theory**: Each test in `BitScheme.hc` may be running in a fresh context, losing variables.

**Evidence**:
- All "variable not found" errors happen when referencing earlier definitions
- Basic functionality works in `evaluate.test.ts` where each test is independent

**Fix**: Check how `hc/BitScheme.hc` is being executed. May need continuous context.

### Hypothesis 2: Deconstructor Feature Not Implemented
**Theory**: The "schemas as deconstructors" feature is documented but unimplemented.

**Evidence**:
- Selector test returns schema + data, not extracted values
- Documentation shows expected behavior but reality differs
- No obvious implementation in `lib/frames/frame-schema.ts`

**Fix**: Implement schema application logic for deconstruction patterns.

### Hypothesis 3: Advanced Syntax Parsing Issues
**Theory**: Complex schema syntax like `{<n@Byte>}` may not parse correctly.

**Evidence**:
- Deferred capture syntax is very advanced
- NetString and other complex examples all fail

**Fix**: Check lexer/parser for schema syntax edge cases.

## Recommended Investigations

### Priority 1: Variable Persistence in BitScheme Files
**Action**: Investigate how multi-line BitScheme files maintain context.

**Commands**:
```bash
# Run a simple multi-statement test
deno task hc -e '.x 42; x'

# Check if BitScheme.hc runs line-by-line or all-at-once
deno task hc cli/hc/BitScheme.hc
```

**Expected**: Should reveal if context is preserved between statements.

### Priority 2: Selector Implementation Status
**Action**: Search codebase for selector/deconstructor implementation.

**Commands**:
```bash
# Search for selector or deconstructor logic
grep -r "deconstruct" lib/
grep -r "selector" lib/
grep -r "extract.*schema" lib/
```

**Expected**: Find if this feature exists or needs to be implemented.

### Priority 3: Schema Application Logic
**Action**: Examine how schemas are applied to values.

**Files**:
- [lib/frames/frame-schema.ts](lib/frames/frame-schema.ts) - Schema frame class
- [lib/execute/hc-eval.ts](lib/execute/hc-eval.ts) - Evaluation logic
- [lib/frames/frame-symbol.ts:52-107](lib/frames/frame-symbol.ts#L52-L107) - Schema matching

**Expected**: Understand how schema application works and where to add deconstructor logic.

## Documentation Impact

### BitScheme Specification Accuracy
The [BitScheme.hc](cli/hc/BitScheme.hc) file serves as both tutorial and specification. Failing tests indicate:

1. **Documentation Ahead of Implementation**: Many documented features aren't implemented yet
2. **Aspirational Examples**: Examples show desired behavior, not current behavior
3. **Test Suite Value**: These tests effectively document the implementation gap

### Recommendations
1. **Mark Unimplemented Features**: Add comments to `BitScheme.hc` indicating which features work
2. **Create Implementation Roadmap**: Use failing tests to prioritize feature development
3. **Split Specification**: Consider separating "current HC" from "future BitScheme" docs

## Related Issues

### String Schema Support (from 02-findings.md)
String schemas also don't work in basic tests:
- `.color <"red","green","blue"> "red"` → `[]`
- `.status <"ok"> "ok"` → `[]`

**Connection**: If string schemas worked, some BitScheme tests (like NetString) might pass.

### Empty Schema Behavior (from 02-findings.md)
Empty schema output format differs from expected:
- Expected: `[.x 42, .x.<> <>; .x 42;]`
- Actual: `[42, .x <>;]`

**Connection**: Output format inconsistencies may affect BitScheme test assertions.

## Next Steps

### Immediate Actions
1. ✅ Document findings in this file
2. ⏭️ Run manual tests to verify variable persistence
3. ⏭️ Check if selector/deconstructor code exists
4. ⏭️ Update BitScheme.hc with implementation status markers

### Future Implementation (Separate PR)
1. Implement selector/deconstructor functionality
2. Add string schema support (prerequisite for many BitScheme features)
3. Fix variable scoping in BitScheme file execution
4. Add type-tagged error message formatting
5. Implement deferred capture syntax `{<n@Byte>}`

## Test Statistics

From BitScheme test run:
- **Total tests**: 31
- **Passing**: 14 (45%)
- **Failing**: 17 (55%)

**Breakdown by Category**:
- Basic literals: 3/3 ✓ (100%)
- String/byte strings: 1/2 (50%)
- Basic operations: 3/3 ✓ (100%)
- Grouping: 3/3 ✓ (100%)
- Properties: 1/1 ✓ (100%)
- Conditionals: 0/2 (0%) - needs investigation
- Higher-order ops: 0/2 (0%) - needs investigation
- Enums: 0/3 (0%) ❌
- Selectors: 0/1 (0%) ❌
- Advanced features: 0/8 (0%) ❌

**Clear Pattern**: Basic features work well, advanced type/schema features don't work at all.

## Conclusion

The BitScheme test failures reveal a significant implementation gap between:
1. **What's documented**: Advanced type system with enums, selectors, and deconstructors
2. **What's implemented**: Basic numeric schema validation

Key Issues:
- ❌ Variable persistence in multi-statement BitScheme files
- ❌ Selector/deconstructor functionality not implemented
- ❌ String schema support missing
- ❌ Advanced schema syntax (deferred captures) not working

These findings complement the earlier investigation in [02-findings.md](02-findings.md) and provide a comprehensive picture of HC's current type system capabilities and limitations.
