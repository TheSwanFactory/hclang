# Ternary Failure Analysis

**Status:** Analysis complete\
**Issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Related architecture:** #292

**Subsequent decision:** Comparisons that collide with type/schema delimiters
use explicit dot-led property names such as `.>` and `.<`. The raw-source
failure analyzed below remains accurate historical evidence, while #293 now owns
updating the doctest spelling and the still-separate conditional semantics.

## Executive Summary

The white-paper example

```hc
1 > 5 ? (2 * 50) : 10
```

does not fail because the parser lacks a C-style ternary grammar. HC has no
ternary grammar: expressions are reduced left to right, and `?` and `:` are
ordinary curried binary operators.

The example exposes two independent incompatibilities:

1. The single `>` is parsed as the closing delimiter of `FrameSchema`, not as a
   comparison operator. At top level it attempts to pop a schema that was never
   opened, reports `LexPipe.perform.pop.failed: already at top level`, drops the
   character, and ultimately produces no evaluated result.
2. Even with the comparison replaced by a hypothetical working predicate, the
   current sequential definitions of `?` and `:` do not compose into a ternary
   chain. A successful `?` produces the selected value, after which `:` is
   applied to that value and returns nil. The branch decision is not retained
   for the following `:` operator.

The exact white-paper expression is therefore **stale syntax relative to the
current implementation**. Supporting it requires both a comparison-token
decision and a conditional-composition design; it is not a focused precedence or
parser-association repair.

## Reproduction

Evaluating the exact source produces no result and emits a parser-stack
diagnostic:

```text
LexPipe.perform.pop.failed: already at top level
1 > 5 ? (2 * 50) : 10 => []
```

Parsing without evaluation confirms that `>` is absent from the resulting
expression. The remaining values and operators are collected, but the comparison
operator has already been consumed as structural syntax.

The failure is reproducible with the smaller input:

```hc
1 > 5
```

It produces the same top-level pop diagnostic and no comparison result. The
ternary suffix is therefore not necessary to trigger the parser-unsafe behavior.

## Lexical and Structural Cause

`FrameSchema` defines `<` and `>` as its opening and closing delimiters.
`terminals.ts` registers those exact characters as immediate push and pop
actions. Terminal lookup takes precedence for an exact character, so a source
`>` invokes `pop(FrameSchema)` before a `FrameOperator` can be formed.

At top level, `LexPipe.level` is zero. Its `pop` action therefore emits the
diagnostic and continues without exporting an operator token. This explains all
directly observed symptoms:

- the diagnostic says the parser is already at top level;
- the parsed expression contains no `>` frame;
- the remaining source can still be collected; and
- evaluation yields no comparison value.

`FrameOperator` advertises `<` and `>` as accepted operator characters, and the
operation table defines comparisons using `<<`, `<=`, `>>`, and `>=`. Those
spellings are not sufficient to avoid the collision: dispatch occurs on the
first character, so `<` opens a schema and `>` closes one before the operator
lexer can accumulate a second character.

This is a syntax-dispatch conflict, not a conventional operator-precedence
failure. It is related to #292 because resolving it may require a boundary or
lookahead decision that cannot be represented by an atom's current
`canInclude(char): boolean` contract alone.

## Conditional Composition Cause

The current evaluator does not build an abstract syntax tree with a ternary
node. `FrameExpr.in` reduces every expression from left to right by repeatedly
calling the accumulated frame with the next evaluated frame.

The conditional operations are independently defined as follows:

- `?` calls its right operand with nil when the left operand is non-nil;
  otherwise it returns nil.
- `:` calls its right operand with nil when the left operand is nil; otherwise
  it returns nil.

Each operator works in isolation for its documented binary role. For example,
`1 ? {100}` produces `100`. They do not, however, preserve the original
condition across a `? ... : ...` sequence.

For a truthy condition, left-to-right reduction behaves conceptually as:

```text
condition ? then-branch  => then-value
then-value : else-branch => nil
```

Thus `1 ? {100} : {10}` currently produces no output rather than `100`.

For a false condition, `?` returns nil, which is the state needed by `:`.
However, current nil/curry behavior does not reliably turn the complete chain
into the else value; focused reproductions return unresolved operator frames or
no output. In neither branch does the implementation satisfy the white paper's
claim that the operator pair acts like C's ternary operator.

Parentheses do not solve this problem. `(2 * 50)` is a group value and works as
the right operand of an isolated `?`, but it does not make the later `:` aware
of the original predicate.

## Responsibility Classification

### Lexer and structural parser

Responsible for the immediate unsafe failure. The single `>` is unambiguously
claimed as a schema-closing terminal and cannot reach operator recognition.

### Expression parser

Not presently responsible for precedence because it implements no precedence or
ternary production. It faithfully aggregates frames and expressions around the
token stream it receives.

### Evaluator and operator model

Responsible for whether two ordinary binary operators can compose into the
documented ternary behavior. The current left-to-right reduction and stateless
`IfThen`/`IfElse` functions do not provide that composition.

### Documentation

Responsible for using a single-character comparison spelling that conflicts with
schema syntax and for claiming a chained behavior that the current runtime does
not implement.

## Classification Decision

For issue #293, classify the exact example as **stale syntax**.

This classification does not declare ternary-style conditionals permanently
unsupported. It records that the example cannot be promoted to an executable
doctest through a local parser fix while preserving current language rules.

Supporting the example verbatim would require explicit decisions about:

1. whether `>` remains a schema delimiter, becomes a comparison operator in some
   contexts, or participates in a lookahead-based disambiguation rule;
2. whether comparisons use the single-character white-paper spelling or the
   multi-character spellings present in the operation table;
3. whether `?` and `:` remain independent binary operators or create and consume
   an intermediate conditional state; and
4. whether right operands are ordinary evaluated groups, lazy blocks, or a
   separately defined branch form.

These are language-design choices rather than missing test coverage.

## Recommended Follow-up

1. Add a focused regression test documenting that an unmatched `>` is a schema
   close and produces a structured error rather than only a console diagnostic.
2. Delegate comparison-versus-schema dispatch to #292 if lookahead or contextual
   redispatch is desired.
3. Open or identify a separate conditional-semantics issue before implementing
   `condition ? then : else` composition.
4. Keep the exact white-paper listing non-executable until those language
   decisions are made.
5. Do not rewrite the listing to a different comparison or branch syntax merely
   to make it pass.

## Acceptance Impact for #293

The ternary-classification acceptance criterion is satisfied by this analysis:
the example is stale syntax, with the lexer/parser and evaluator
responsibilities identified separately. No white-paper assertion totals should
change as a result of this classification alone.

## v0.8.5 Resolution

Issue #293 implemented the selected dotted comparison spelling, so `1.> 5` now
reaches comparison evaluation without colliding with schema delimiters. The
remaining `? ... : ...` failure is still the independent conditional-state
problem described above: the two binary operators do not preserve the original
predicate as a chained ternary expression.

The white-paper chain therefore remains a non-executable source listing and is
classified as **stale syntax**. The independently supported `?` and `:` forms
remain executable white-paper doctests, and focused evaluation coverage now also
proves that an explicit false dotted comparison selects an independent else
branch. Supporting a chained ternary requires a separate language design; it is
not part of the numeric-property or dotted-comparison implementation.
