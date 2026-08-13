# Candidate Composition Decision

**Status:** Not required for the known parsing failures\
**Issue:**
[#292 — Generalize the FrameAtom lexical-boundary contract beyond canInclude()](https://github.com/TheSwanFactory/hclang/issues/292)\
**Feature issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Builds on:** [09-sigilizer-spec.md](./09-sigilizer-spec.md)\
**Implementation sequence:**
[10-sigilizer-checklist.md](./10-sigilizer-checklist.md)

## Decision

Do not implement candidate composition for the known `<`/`>` collision.

Raw `<` and `>` remain type/schema Sigils. Less-than and greater-than use
explicit dot-led property syntax:

```hc
; 1.< 3
# <>
; 1.> 3
# ()
```

The dot commits the source to `FrameName` before `<` or `>` arrives. There is no
competition between a structural participant and an operator participant, no
lookahead, and no set of candidates to preserve.

This decision also removes phone-shaped values from candidate composition.
`+1.408.555.1212` already decomposes into ordinary operator, number, and numeric
property forms. Its missing behavior belongs to evaluation in #293.

Candidate composition remains a possible future mechanism if HC later introduces
two genuinely overlapping, undotted Sigils. There is no demonstrated need to
design or implement it now.

## Does Dotted Comparison Require Lexer Support?

Yes, but only selected-token support already required by the
`FrameName.scan(Symbol)` migration in 09 and 10.

Current behavior is:

1. `.` selects `FrameName` unambiguously.
2. `FrameName.canInclude()` says that `<` and `>` are valid operator characters.
3. Generic `Lex` nevertheless sees that they are raw structural terminals and
   ends the name.
4. It redispatches the character as a schema push or pop.
5. `.<` and `.>` therefore fail before evaluation.

The required behavior is:

1. `.` selects `FrameName` unambiguously.
2. `FrameName.scan(Symbol)` owns every subsequent continuation decision.
3. `<` or `>` is consumed as the body of the selected name.
4. A following boundary completes `FrameName(.<)` or `FrameName(.>)` and is
   redispatched exactly once.
5. Evaluation resolves the underlying property key `<` or `>` on the preceding
   value and applies the next value as its argument.

This is lexical support, but it is not a new Sigil, prefix arbitration, or
lookahead feature. It is the back half of replacing `canInclude(): boolean` and
generic terminal overrides with syntax-owned `scan(Symbol)` transitions.

## Lexical Ownership

### `FrameSchema`

`FrameSchema` exclusively advertises raw `<` and `>` through static
`SIGIL_STARTS` metadata. Those forms commit immediately as structural actions
because no other raw Sigil in this scope competes for them.

The Sigilizer does not need to delay the Parse push or pop to inspect a future
Symbol.

### `FrameName`

`FrameName` advertises `.`. Once selected, its `scan(Symbol)` MUST accept the
operator-character names used by dotted properties, including:

- `.<`;
- `.>`;
- `.<=` and `.>=` if those comparisons are retained; and
- existing forms such as `.+`.

The leading dot is the disambiguating Sigil. The operator characters are the
selected name body; they are not redispatched through raw terminal discovery.

`FrameName.scan(Symbol)` MUST still preserve the existing distinctions among
identifier hyphens, operator-starting names, operator runs, and unconsumed token
boundaries.

### `FrameOperator`

`FrameOperator` need not advertise raw `<` or `>` as initial Sigils. Existing
undotted operators whose first characters are not structural delimiters remain
unchanged.

If the operation registry stores comparison implementations under `<`, `>`,
`<=`, and `>=`, dotted `FrameName` evaluation reaches those keys in the same way
that `2.+` reaches `+`. The dot selects property syntax but is not part of the
operation key.

Migrating operation-registry keys and comparison evaluation belongs to #293, not
the Sigilizer implementation.

## Consequence for `<<` and `>>`

`<<` and `>>` are not required comparison spellings under this decision. Raw
runs remain sequences of structural delimiters and are validated by Parse.

If HC retains equals-suffixed comparisons, their explicit spellings are `.<=`
and `.>=`. If HC later wants shift or comparison operators whose names contain
several `<` or `>` characters, the explicit property spellings would likewise be
dot-led unless a separate language decision introduces another Sigil.

This avoids a maximal-munch rule that would make adjacent nested type delimiters
unstable or dependent on parser context.

## Comparison Flow

For `1.< 3`, the intended phase flow is:

```text
source:  1      .<       3
         │      │        │
Lex:     number name     number
         │      │        │
Parse:   1      .<       3
         │      │        │
Eval:    1.get("<")      apply(3)
         └──────────────► Frame.all / <>
```

For `1.> 3`, the same flow resolves the `>` property and returns `Frame.nil` /
`()`. Raw `<...>` never enters this flow because it lacks the leading dot and is
structural from its first Symbol.

## Phone-Shaped Property Composition

The source `+1.408.555.1212` also demonstrates explicit property composition,
not candidate composition:

```text
FrameOperator:+
FrameNumber:1
FrameName:.408
FrameName:.555
FrameName:.1212
```

Current evaluation reports numeric properties such as `.408` missing, and
leading `+` does not supply the intended unary composition. Issue #293 now owns:

- promotion or composition of a number plus a numeric property into a decimal
  value;
- promotion or composition of further numeric properties into a phone-shaped
  value;
- exact source preservation;
- invalid numeric-property behavior; and
- leading unary-plus semantics.

No phone-specific Sigil, Lex mode, Frame scanning method, or candidate set is
required.

## Candidate Composition Boundary

Candidate composition would become justified only if all of the following were
true:

1. two syntax participants intentionally advertise the same undotted prefix;
2. neither participant can commit from the prefix alone;
3. explicit spelling cannot or should not distinguish them;
4. both interpretations must remain viable across later Symbols; and
5. registration order is not an acceptable language rule.

If that future case occurs, a separate specification must define inert
speculation, accepted fallbacks, consumption, redispatch, EOF, and ambiguity.
The registration and scan contracts in 09 can carry such a returned Frame state,
but the current implementation MUST NOT pre-build that machinery without a
concrete case.

## Functional Requirements

- **CD-001:** Raw `<` and `>` MUST remain exclusively structural Sigils.
- **CD-002:** Less-than MUST use the explicit property spelling `.<`.
- **CD-003:** Greater-than MUST use the explicit property spelling `.>`.
- **CD-004:** Any retained less-than-or-equal and greater-than-or-equal forms
  MUST use explicit dot-led property spellings.
- **CD-005:** `.` MUST select `FrameName` before its operator-character body is
  scanned.
- **CD-006:** A selected `FrameName` MUST be able to consume `<` and `>` despite
  their raw terminal registrations.
- **CD-007:** A boundary following a dotted comparison name MUST be consumed or
  redispatched exactly once according to `FrameName.scan(Symbol)`.
- **CD-008:** Sigilizer MUST NOT preserve or arbitrate schema-versus-comparison
  candidates for these forms.
- **CD-009:** `FrameOperator` MUST NOT require raw `<` or `>` start
  registrations for dotted comparisons.
- **CD-010:** Comparison property lookup and operation-registry changes belong
  to #293 rather than the Sigilizer phase.
- **CD-011:** Phone-shaped values MUST retain their existing ordinary lexical
  decomposition.
- **CD-012:** No candidate-composition implementation may be added without a
  concrete overlapping-Sigil requirement and a new specification.

## Acceptance Scenarios

### Dotted less-than

Given `1.< 3`, Lex produces a number, the single name `.<`, and a number. Raw
schema push does not occur. Evaluation returns `<>`.

### Dotted greater-than

Given `1.> 3`, Lex produces a number, the single name `.>`, and a number. Raw
schema pop does not occur. Evaluation returns `()` without a top-level-pop
diagnostic.

### Raw type delimiters

Existing `<...>` schema/type fixtures retain their current structural token and
Parse behavior. Dot-led comparison support does not alter their spelling or
nesting.

### Equals-suffixed comparisons

If retained, `.<=` and `.>=` each form one `FrameName` and evaluate through the
corresponding property key. Raw `<=` and `>=` do not become comparison Sigils.

### Chunk invariance

Splitting input after `.`, after the operator character, or at any other
physical chunk boundary does not change the resulting Frames or evaluation.

### Phone-shaped value

`+1.408.555.1212` retains its current five-form lexical decomposition. Its
separate #293 evaluation work introduces no phone-specific lexical behavior.

## Success Criteria

1. Focused Lex tests produce one `FrameName(.<)` for `.<` and one
   `FrameName(.>)` for `.>`.
2. The same results occur at every two-chunk split.
3. `1.< 3` evaluates to `<>` and `1.> 3` evaluates to `()` after #293's
   comparison registry work.
4. Dotted comparison tests execute zero schema push/pop actions.
5. Existing raw schema/type tests remain green without fixture changes.
6. Sigilizer contains zero candidate collection, priority, or lookahead state.
7. `FrameName.scan(Symbol)` is the only new lexical affordance required for the
   dotted forms.
8. The phone-shaped examples add zero syntax-family checks to Sigilizer or Lex.

## Implementation Result

No non-trivial candidate-composition design input is required for the current
implementation. The explicit-dot language decision removes the ambiguity.

Version 0.8.4 implements the Frame-level migrations without candidate
composition. Dotted comparison lexing is part of the `FrameName.scan(Symbol)`
slice; comparison evaluation and numeric-property composition remain in #293.
