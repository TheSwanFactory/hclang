# BFG: `:` Answers Its Left Operand When It Is Not Nil

**Status:** Implemented in v0.17.0\
**Issue:** [#382](https://github.com/TheSwanFactory/hclang/issues/382), item 4
(005.18a H4). Must be reconciled with
[#360 — extending `?:` for errors](https://github.com/TheSwanFactory/hclang/issues/360)\
**Scope:** `IfElse` in `lib/ops/conditionals.ts`, and the corpus and prose that
pin its current answer\
**Verified against:** `41b032a` (v0.16.0)

## The defect

`?` and `:` are independent binary operators composed left to right
(`FrameExpr.evaluateTerms`, `frame-expr.ts:81-95`), so `c ? t : e` is
`(c ? t) : e`. Today `:` answers **nil** whenever its left operand is not nil
(`conditionals.ts:15-24`). The then-value is therefore discarded:

```hc
(<> ? {“then”} : {“else”})     # ()      should be “then”
(() ? {“then”} : {“else”})     # “else”  correct
```

So `c ? t : e` can never answer `t`. Every Figure is truthy, so 005.30c had to
write each branching observer in a boxed form that evaluates `c` twice:

```hc
([c ? {[yes]}, c : {[no]}] | []) .0 .0
```

## The ruling

**`x : e` answers `x` when `x` is not nil, and calls `e` when it is.**

`:` becomes "or else": the left value if there is one, otherwise the fallback.
`?` is unchanged. With both rules, the conventional reading holds:

| Expression                 | `?` answers | `:` answers |
| -------------------------- | ----------- | ----------- |
| `<> ? {“then”} : {“else”}` | `“then”`    | `“then”`    |
| `() ? {“then”} : {“else”}` | nil         | `“else”`    |
| `“value” : {“else”}`       | n/a         | `“value”`   |
| `() : {“else”}`            | n/a         | `“else”`    |

`?` and `:` stay plain binary operators with no new grammar, no wrapper frame,
and no special form. The white paper's claim, "these are not special forms",
still holds.

### The remaining edge, accepted

When the condition holds but the then-branch itself answers nil, `:` sees nil
and runs the else branch:

```hc
(<> ? {()} : {“else”})         # “else”
```

This is the documented price of composing two binary operators, the same
trade-off as `a && b || c` in C-family languages and Elvis `?:`. It is accepted
rather than fixed, because fixing it needs a ternary production or a marker
frame, and the ruling asks for neither. A then-branch that can answer nil should
box its answer: `c ? {[t]} : {[e]}`, then `.0`.

## Implementation

`lib/ops/conditionals.ts`:

```ts
export const IfElse = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
): Frame => {
  if (source === Frame.nil) {
    return block.call(Frame.nil, Frame.nil, receiverState);
  }
  return source;
};
```

The else block still runs only on nil, and receiver state is still forwarded
only to a block that runs. Errors are unaffected, because `evaluateTerms`
short-circuits a failed term before `:` is reached (#360).

## Corpus and prose changes

| File                | Line | Expression              | Today | Proposed |
| ------------------- | ---- | ----------------------- | ----- | -------- |
| `hc/testdoc.hc`     | 131  | `1 : {2 + 2}`           | `()`  | `1`      |
| `hc/testdoc.hc`     | 149  | `5.> 1 : {10}`          | `()`  | `<>`     |
| `hc/testdoc.hc`     | 154  | `5.> 1 ? (2 * 50) : 10` | `()`  | `100`    |
| `hc/white-paper.hc` | 748  | `1 : {2 + 2}`           | `()`  | `1`      |
| `hc/white-paper.hc` | 761  | `5.> 1 ? (2 * 50) : 10` | `()`  | `100`    |

These keep their current answers and stay as regression anchors: `testdoc.hc`
lines 135, 140, 145, 152 and 156 (the accepted edge), and `BitScheme.hc:172`.

Prose:

- `white-paper.hc:737`: the table row for `:` "On Frame" changes from "Return
  `()`" to "Return the frame".
- `white-paper.hc:756`: the chaining paragraph says `c ? t : e` answers `t` or
  `e`, and names the nil-then edge.
- `testdoc.hc:151`: the heading becomes "Chained conditionals answer the taken
  branch".
- `lib/ops/CLAUDE.md`, _Conditionals_: its examples (`if true then 1 else 2`)
  are not HC syntax. Replace them with the four rows of the ruling table.

## Tests

- `lib/ops/conditionals.test.ts:45`: `IfElse(Frame.all, skipped, …)` now expects
  `Frame.all`, still with `skipped.calls` equal to 0.
- New unit test: a non-nil source of each family (number, string, array,
  closure) is answered unchanged, and is the same frame, not a copy.
- Doctest: the 005.30c observers (`many`, `sameform`, `withness`) rewritten with
  plain `c ? {yes} : {no}`, asserting the same answers as the boxed form.
- Doctest: the nil-then edge, asserted so that it reads as deliberate.

## Interactions

- **#360.** If #360 adds a third, error-handling form, it composes after `:` the
  same way. Nothing here closes off that option.
- **[01](01-equality-ladder.md).** `(c ? {X} : {Y}) === X` holds when `c` is
  truthy, because neither operator copies its answer.
- **The old boxed idiom still works.** `c : {[no]}` now answers `c` instead of
  nil when `c` is truthy, but the `.0 .0` unboxing still picks `[yes]` first.
  Corpus code should migrate to the plain form anyway.
