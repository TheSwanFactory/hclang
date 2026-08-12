# Parsing and Literal Recognition Triage

**Status:** Proposed\
**Issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Parent:** #197\
**Derived from:** #287 and the post-#291 white-paper inventory\
**Related architecture:** #292

## Summary

Issue #293 tracks two distinct gaps exposed by the white-paper doctest:

1. Phone-number literals such as `+1.408.555.1212` are split into operators and
   numeric fragments instead of being preserved as one value. This leaves four
   HCSV/HCSON assertions marked `$!.unimplemented`.
2. The documented conditional expression `1 > 5 ? (2 * 50) : 10` is currently
   parser-unsafe and must be classified as supported syntax, stale syntax, or
   intentionally unsupported syntax.

PR #291 established the authoritative full-document baseline of 57 total
assertions, 31 passing assertions, no failures, and 26 unimplemented assertions.
Work on these gaps must preserve the original examples rather than rewriting
them into different syntax merely to make the doctest pass.

## Current State

`FrameNumber` accepts digits only and stores its source as an integer. It cannot
represent a phone-number literal containing a leading plus sign and embedded
periods.

The generic lexer ends an atom according to the atom's
`canInclude(char): boolean` result and redispatches terminal characters through
the syntax pipeline. Consequently, `+1.408.555.1212` is currently interpreted as
a sequence of operators and numeric fragments rather than one literal.

The language documentation describes `?` and `:` as two binary conditional
operators. The white paper retains the C-style chained example verbatim, but it
is not executable in the current full-document doctest because parsing it is
unsafe.

Issue #292 separately tracks whether the one-character `canInclude` contract
needs a richer lexical-boundary abstraction. Issue #293 remains independently
closable unless implementation demonstrates that lookahead, boundary redispatch,
incomplete state, or lexical-error signaling is required.

## Scope

- Phone-number literal recognition and preservation.
- Parsing of the documented `?` and `:` conditional chain.
- Focused identification of lexer versus parser responsibility.
- Focused unit and white-paper doctests.
- Preservation of single-character syntax dispatch and the monadic pipeline.

## Non-goals

- Rewriting white-paper examples into syntax already accepted by the parser.
- Broad redesign of atom dispatch without evidence that #293 requires it.
- Changing conditional evaluation semantics unrelated to parsing the example.
- Treating phone numbers as arithmetic values.
- Resolving unrelated white-paper `$!.unimplemented` assertions.

## Investigation Plan

### 1. Establish lexical boundaries for phone literals

Add focused lexer tests for `+1.408.555.1212` before selecting a representation
or changing dispatch. The tests must show the current token sequence and define
the required result: one value retaining the exact source spelling.

Test boundary cases should include a phone literal:

- as a standalone value;
- after a comma in HCSV;
- after a name/value pair in HCSON;
- followed by whitespace, a comma, a closing delimiter, and EOF; and
- adjacent to syntax that still requires `+` or `.` to dispatch normally.

### 2. Define the phone-literal value

Select or introduce a runtime frame whose semantics match a phone number.
`FrameNumber` is not suitable in its current form because it accepts only digits
and converts its source with `parseInt`.

The selected value must:

- preserve `+1.408.555.1212` as one literal;
- render without losing punctuation or the leading plus sign;
- avoid silently acquiring arithmetic semantics; and
- coexist with existing number, name, and operator recognition.

### 3. Isolate conditional parsing from evaluation

Add focused parser tests for `1 > 5 ? (2 * 50) : 10` before changing runtime
conditional behavior. Determine whether failure arises from lexical dispatch,
operator association or precedence, aggregate parsing, or evaluation order.

The investigation must classify the documented expression as exactly one of:

- supported syntax requiring a parser fix;
- stale syntax requiring an explicit documentation decision; or
- intentionally unsupported syntax with the reason recorded.

If the syntax is supported, add focused lexer/parser tests and restore the exact
white-paper example as an executable doctest.

### 4. Determine whether #292 is required

Keep changes within the existing atom contract when that can express the
required boundaries without syntax-specific branching in the generic lexer.

If correct recognition requires lookahead, multi-character boundary decisions,
redispatch beyond the existing contract, incomplete-token state, or explicit
lexical errors, record that dependency and delegate the abstraction work to
#292. Do not embed phone-specific rules directly in the generic lexer as a
substitute for the required abstraction.

### 5. Promote the white-paper assertions

After focused tests pass, remove `$!.unimplemented` from the four original
HCSV/HCSON assertions. Preserve their source and expected values exactly.

Update the authoritative full-document totals to reflect only assertions that
have actually moved from unimplemented to passing.

## Acceptance Criteria

- [ ] `+1.408.555.1212` parses as one value and preserves its exact spelling.
- [ ] All four original HCSV/HCSON phone assertions pass without
      `$!.unimplemented`.
- [ ] Existing arithmetic and name/operator syntax continues to dispatch
      correctly.
- [ ] The ternary example is classified as supported, stale, or intentionally
      unsupported.
- [ ] Supported conditional syntax has focused lexer/parser tests and a
      white-paper doctest using the original expression.
- [ ] Lexer and parser responsibilities are documented by the focused tests and
      resulting implementation.
- [ ] Any required lexical-boundary abstraction is resolved in, or explicitly
      delegated to, #292.
- [ ] No white-paper example is rewritten into different syntax merely to make
      it pass.
- [ ] The full-document doctest reports deterministic totals with zero failures.

## Expected Implementation Order

1. Reproduce phone tokenization in focused lexer tests.
2. Define the phone-literal frame and its lexical contract.
3. Implement phone recognition without regressing existing dispatch.
4. Promote and run the four HCSV/HCSON doctests.
5. Reproduce the conditional-chain failure in a focused parser test.
6. Classify the syntax and implement tests or document the decision.
7. Resolve or delegate any dependency on #292.
8. Run focused tests and the complete white-paper doctest, then record the new
   authoritative totals.
