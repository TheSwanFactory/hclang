# Parsing and Literal Recognition Triage

**Status:** Proposed\
**Issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Parent:** #197\
**Derived from:** #287 and the post-#291 white-paper inventory\
**Related architecture:** #292

## Summary

Issue #293 tracks two distinct gaps exposed by the white-paper doctest:

1. Phone-shaped values such as `+1.408.555.1212` already decompose into ordinary
   operator, number, and numeric-property forms, but those forms do not yet
   evaluate into the intended value. This leaves four HCSV/HCSON assertions
   marked `$!.unimplemented`.
2. The documented conditional expression uses raw `>` where the selected
   language spelling is the explicit comparison property `.>`. Its comparison
   and conditional evaluation must be updated and tested separately.

PR #291 established the authoritative full-document baseline of 57 total
assertions, 31 passing assertions, no failures, and 26 unimplemented assertions.
Work on these gaps must preserve the original phone-shaped examples. The
conditional example changes only to reflect the explicit-dot language decision,
not merely to make the doctest pass.

## Current State

Current lexing produces `FrameOperator(+)`, `FrameNumber(1)`, `FrameName(.408)`,
`FrameName(.555)`, and `FrameName(.1212)`. That decomposition is intentional
property syntax, not evidence that a phone token is missing.

Evaluation currently reports numeric properties such as `.408` missing. It also
lacks the leading unary-plus behavior required to complete the original source.

The language documentation describes `?` and `:` as two binary conditional
operators. The white paper retains the C-style chained example verbatim, but it
is not executable in the current full-document doctest because parsing it is
unsafe.

Issue #292 separately owns the richer Frame-level lexical-boundary abstraction.
It is required for dotted comparisons because generic Lex currently redispatches
`<` and `>` as raw structural terminals even after `.` has selected `FrameName`.
Phone-shaped numeric-property evaluation itself does not require that
abstraction.

## Scope

- Numeric-property composition into decimal and phone-shaped values.
- Leading unary-plus semantics for the original phone-shaped spelling.
- Lexing and evaluation of explicit comparison properties `.<` and `.>`.
- Evaluation of the documented `?` and `:` conditional chain using the selected
  comparison spelling.
- Focused identification of lexer versus parser responsibility.
- Focused unit and white-paper doctests.
- Preservation of single-character syntax dispatch and the monadic pipeline.

## Non-goals

- Rewriting white-paper examples into syntax already accepted by the parser.
- Broad redesign of atom dispatch without evidence that #293 requires it.
- Changing conditional evaluation semantics unrelated to parsing the example.
- Adding a phone-specific Sigil, Lex mode, or Frame scanning method.
- Resolving unrelated white-paper `$!.unimplemented` assertions.

## Investigation Plan

### 1. Protect the existing lexical decomposition

Add a focused lexer test proving that `+1.408.555.1212` produces `+`, `1`,
`.408`, `.555`, and `.1212`. Preserve that sequence across HCSV/HCSON
boundaries, EOF, and physical chunk splits.

### 2. Define numeric-property composition

Specify how a numeric value responds to a numeric property:

- the first numeric property can promote or compose an integer into a decimal;
- later numeric properties can promote or compose the value into the
  phone-shaped representation;
- exact segment spelling and leading zeroes are preserved where required;
- invalid segments fail explicitly; and
- leading unary `+` completes the intended international phone spelling without
  changing ordinary binary addition.

### 3. Establish explicit dotted comparisons

Add focused Lex tests for `.<`, `.>`, and any retained `.<=` or `.>=` forms.
They must produce one `FrameName` after `.` selects name syntax, while raw `<`
and `>` remain structural type/schema delimiters.

Then add focused evaluation tests:

```hc
; 1.< 3
# <>
; 1.> 3
# ()
```

The generic Frame/Lex affordance belongs to #292. Operation-registry and
evaluation changes belong to #293.

### 4. Isolate conditional parsing from evaluation

Update the focused conditional case to use the selected `.>` comparison property
before changing runtime conditional behavior. Determine whether any remaining
failure arises from operator association, state preservation, aggregate
evaluation, or branch semantics.

The investigation must classify the documented expression as exactly one of:

- supported syntax requiring a parser fix;
- stale syntax requiring an explicit documentation decision; or
- intentionally unsupported syntax with the reason recorded.

If the syntax is supported, add focused lexer/parser tests and update the
white-paper example to the selected comparison spelling before promoting it to
an executable doctest.

### 5. Keep the #292 boundary explicit

Delegate selected-name ownership of `<` and `>` to the `FrameName.scan(Symbol)`
work in #292. Do not add comparison- or phone-specific branches to generic Lex
or Sigilizer. Candidate composition is not required because the leading dot
disambiguates comparison properties.

### 6. Promote the white-paper assertions

After focused tests pass, remove `$!.unimplemented` from the four original
HCSV/HCSON assertions. Preserve their source and expected values exactly.

Update the authoritative full-document totals to reflect only assertions that
have actually moved from unimplemented to passing.

## Acceptance Criteria

- [ ] `+1.408.555.1212` retains its ordinary lexical decomposition and evaluates
      as one phone-shaped value preserving exact spelling.
- [ ] All four original HCSV/HCSON phone assertions pass without
      `$!.unimplemented`.
- [ ] Existing arithmetic and name/operator syntax continues to dispatch
      correctly.
- [ ] `1.< 3` evaluates to `<>` and `1.> 3` evaluates to `()`.
- [ ] Raw `<` and `>` remain structural type/schema delimiters.
- [ ] The ternary example is updated to the selected comparison spelling and
      classified as supported, stale, or intentionally unsupported.
- [ ] Supported conditional syntax has focused lexer/parser tests and a
      white-paper doctest using the selected explicit-dot comparison spelling.
- [ ] Lexer and parser responsibilities are documented by the focused tests and
      resulting implementation.
- [ ] Any required lexical-boundary abstraction is resolved in, or explicitly
      delegated to, #292.
- [ ] No white-paper example is rewritten into different syntax merely to make
      it pass.
- [ ] The full-document doctest reports deterministic totals with zero failures.

## Expected Implementation Order

1. Protect the existing phone-shaped lexical decomposition.
2. Define numeric-property and unary-plus evaluation semantics.
3. Implement dotted-name terminal ownership through #292.
4. Implement dotted comparison property lookup through #293.
5. Promote and run the four HCSV/HCSON doctests.
6. Reproduce the conditional-chain failure with the selected comparison syntax.
7. Classify conditional semantics and implement tests or document the decision.
8. Run focused tests and the complete white-paper doctest, then record the new
   authoritative totals.
