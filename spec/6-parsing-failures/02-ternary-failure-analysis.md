# Ternary Failure Analysis

**Status:** Resolved in v0.8.5\
**Issue:**
[#293 — Parsing and literal recognition gaps](https://github.com/TheSwanFactory/hclang/issues/293)\
**Related architecture:** #292

**Resolution:** Comparisons that collide with type/schema delimiters use
explicit dot-led property names such as `.>` and `.<`. Binary `?` and `:` call
their selected right operand with nil, and chains compose those call results
through ordinary left-to-right evaluation.

## Executive Summary

The original white-paper comparison spelling

```hc
1 > 5 ? (2 * 50) : 10
```

failed for two independent reasons. HC expressions reduce left to right, and `?`
and `:` remain ordinary curried binary operators.

The example exposes two independent incompatibilities:

1. The single `>` is parsed as the closing delimiter of `FrameSchema`, not as a
   comparison operator. At top level it attempts to pop a schema that was never
   opened, reports `LexPipe.perform.pop.failed: already at top level`, drops the
   character, and ultimately produces no evaluated result.
2. A nil accumulator could not dispatch the following ordinary operator, so the
   binary definitions of `?` and `:` did not reliably compose left to right.

Issue #293 resolved both gaps. The maintained spelling uses `.>`, raw `>`
remains structural, and every non-leading operator dispatches generically even
when the accumulated value is nil. No ternary parser state is introduced.

## Pre-fix Reproduction

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

## Pre-fix Conditional Composition Cause

The evaluator does not build an abstract syntax tree with a ternary node.
`FrameExpr.in` reduces every expression from left to right by repeatedly calling
the accumulated frame with the next evaluated frame.

Before v0.8.5, the conditional operations were independently defined as follows:

- `?` calls its right operand with nil when the left operand is non-nil;
  otherwise it returns nil.
- `:` calls its right operand with nil when the left operand is nil; otherwise
  it returns nil.

Each operator worked in isolation for its documented binary role, but a nil
accumulator could not reliably dispatch the following operator.

For a truthy condition, left-to-right reduction behaves conceptually as:

```text
condition ? then-branch  => then-value
then-value : else-branch => nil
```

Thus `1 ? {100} : {10}` reduces to nil by the binary rules: `?` first calls the
then operand and returns `100`, then `:` sees a truthy left operand and returns
nil. This is the intended left-to-right result, not C-style branch preservation.

For a false condition, `?` returned nil, which could not reliably dispatch the
following `:` operator. Focused reproductions returned unresolved operator
frames or no output.

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

Responsible for allowing ordinary operators to dispatch when the accumulated
value is nil and for applying the documented binary call rules consistently.

### Documentation

Responsible for selecting the explicit dotted comparison spelling that does not
conflict with schema syntax.

## Implementation Decision

Issue #293 makes the white-paper conditional behavior executable with these
rules:

1. Raw `<` and `>` remain schema delimiters; numeric comparisons use `.<`, `.>`,
   `.<=`, and `.>=`.
2. For a truthy left frame, binary `?` returns `right.call(Frame.nil)`; for nil
   it returns `Frame.nil` without calling the right operand.
3. For a truthy left frame, binary `:` returns `Frame.nil` without calling the
   right operand; for nil it returns `right.call(Frame.nil)`.
4. Raw `()` and false comparison results are `Frame.nil`; true comparison
   results are `Frame.all`.
5. Chains use ordinary left-to-right composition. A false predicate reduces
   `nil ? A : B` to `B()`. A true predicate reduces to `A() : B`; a truthy `A()`
   result yields nil, while a nil `A()` result proceeds to `B()`.
6. `FrameOperator` retains operator identity, and every non-leading operator is
   dispatched through `called_by` even when the accumulated value is nil. This
   is generic operator evaluation, not conditional-specific parsing, and it
   preserves leading unary operators such as `+`.
7. A lazy callable is invoked only when its binary rule selects it. Ordinary
   grouped operands retain HC's normal eager left-to-right evaluation.

The maintained testdoc covers the complete binary truth table with callables,
callables returning nil, raw `()`, true and false dotted comparisons, and all
three chained outcomes. Focused TypeScript tests prove invocation with
`Frame.nil` and prove that a non-selected lazy callable is not invoked. The
original false white-paper chain and its binary-composition true counterpart are
both executable doctests.
