# Units of Measure: The `nn.nn.aa` Segment

**Status:** Conjecture under test — not adopted, proposed, or preferred\
**Inputs:** [03-uom-conjectures.md](03-uom-conjectures.md),
[#362](https://github.com/TheSwanFactory/hclang/issues/362),
[a08](../a08-rationalizing-numbers.md)\
**Verified against:** `v0.12.0`, by evaluating the expressions shown and reading
`lib/frames/frame-decimal.ts` and `lib/frames/frame-rational.ts`

## The conjecture

A third dotted segment that is alphabetic promotes to a new frame, as a third
segment that is numeric already promotes to `FrameSequence`:

```
1.408.055    numeric third segment    => FrameSequence
9.8.m        alphabetic third segment => FrameTypedNumber
```

This document records what the conjecture clears, what it gets without asking,
and what it leaves to be decided. It selects nothing.

## Why the premise matters

[03](03-uom-conjectures.md) tested attaching units to a single rung and found
the rungs leak in two directions. Measured at `v0.12.0`:

| Rung  | Escapes downward                          | Escapes upward                                                       |
| ----- | ----------------------------------------- | -------------------------------------------------------------------- |
| `Int` | —                                         | any non-`Int` operand promotes it                                    |
| `Dec` | no — `1.5 + 0.5` is `2.0`                 | `1.5 + (1 / 3)` → `11/6`; `10.50 / 2` → `21/4`; `1.5 ** 1.5` → `Num` |
| `Rat` | yes — `(3 / 2) + (1 / 2)` → `2`, an `Int` | `promoteOne` → `Num`                                                 |
| `Num` | no                                        | nothing above it                                                     |
| `Seq` | no arithmetic at all                      | no arithmetic at all                                                 |

That produced a crossing: the rung with a measurement-shaped source spelling
(`Dec`) leaks upward on ordinary arithmetic, while the only rung closed under
all arithmetic (`Num`) has no spelling at all.

**A wrapper is not subject to that crossing.** If the unit belongs to a frame
that holds a magnitude, the magnitude may climb the ladder inside it without the
unit moving. The exactness objection to Conjecture A and the collapse objection
to Conjecture B are both consequences of attaching a unit to a rank, and neither
applies to a frame that has none.

## The slot is unoccupied

An alphabetic property key on a numeric receiver resolves to nothing today, and
the surrounding cases confirm the boundary is character class rather than name.
Observed at `v0.12.0` (the numeric component of each `$:` path is positional and
varies):

| Expression | Result                                       | What it establishes                          |
| ---------- | -------------------------------------------- | -------------------------------------------- |
| `9.8.m`    | `$!.name-missing “$:FrameDecimal.…m”;`       | the alphabetic slot on a decimal is free     |
| `9.8.M`    | `$!.name-missing “$:FrameDecimal.…M”;`       | case is significant and equally free         |
| `100.kg`   | `$!.name-missing “$:FrameInt.…kg”;`          | `nn.aa` is free too, and is not `nn.nn.aa`   |
| `3.is`     | `$!.name-missing “$:FrameInt.…is”;`          | no alphabetic property exists on numerics    |
| `9.8.is`   | `$!.name-missing “$:FrameDecimal.…is”;`      | the same on the decimal rung                 |
| `3.>2`     | `<>`                                         | symbolic operator properties still resolve   |
| `9.8.<10`  | `<>`                                         | and do so on decimals                        |
| `1.5.%%2`  | `$!.numeric-domain %% FrameDecimal FrameInt` | lookup succeeded; only the operation refused |

Two further facts from the same run:

- **Scope is not consulted.** With `.m 5;` bound in file scope, `9.8.m` still
  reports `name-missing`. A numeric atom's property read does not fall back to
  the enclosing scope, so no user binding can shadow the segment and the segment
  cannot shadow a binding.
- **The occupied part of the slot is symbolic.** `.>`, `.<`, and `.%%` are
  operators read as properties. An alphabetic-only rule does not reach them.

## What the conjecture gets without asking

**No lexer change.** `9.8.m` already lexes as three segments, and
`FrameSequence` is already constructed inside `FrameDecimal.lookup_here` for
digit keys (`frame-decimal.ts:57-64`). The conjecture is a second branch at that
one site, producing a structural sibling of `Sequence`.

**An exact magnitude.** The wrapped value can be a `FrameDecimal`, so `0.10.USD`
is exact and does not inherit host floating point. This is the case that
defeated Conjecture A.

**`==` with no new rule.** The unit is part of the spelling, so the data plane
separates `9.8.m` from `9.8.kg` exactly as `3 == 3.0` is already nil. Of the
three planes, only `=` would need a ruling, and `===` stays unused.

**Round-trip rendering.** Spelling preservation (a08 §3) and **Q1**'s round-trip
requirement are satisfied by construction rather than by argument.

## What the conjecture forces

**Nothing validates the unit.** Because the lookup consults no table and no
scope, every alphabetic segment succeeds. `9.8.m`, `9.8.M`, `9.8.metres`, and
`9.8.frobnicate` are all well-formed and mutually distinct, so a misspelling
silently mints a new dimension instead of failing. Unit typos are inside the
error class units are meant to close, so this is a gap rather than a
simplification. Closing it requires a table, and a table reopens the scoping
question in [02](02-uom-lessons.md) §L6.

**Whole numbers need a fractional segment.** `100.kg` is `nn.aa` and is not
covered, so a count reads `100.0.kg`. Extending the rule to `nn.aa` collides
with nothing today, but would permanently close alphabetic property reads on
integers.

**Composite units have no spelling.** Products, quotients, and exponents —
`m/s`, `kg·m/s²` — do not fit one alphabetic segment, and `9.8.m.s` is ambiguous
between a product and a further segment applied to a typed number. Note that
[UCUM](https://ucum.org/ucum) already uses `.` as its multiplication operator
(`kg.m/s2`), which is either a convergence to exploit or a collision to avoid.

**The promotion defines no arithmetic.** Open regardless of spelling: whether
the new frame takes a rank, making a08 §5.0's per-operator tables 5×5, or sits
outside the ladder at rank `null` as `FrameSequence` does; what `9.8.m + 1` and
`9.8.m * 2` produce; and whether the unit is held as a string or as an exponent
vector. A string has nowhere to put the result of `m * m`; an exponent vector
needs a dimension mapping, which is the validation question again.

## Undecided at the edges

- **Negative receivers.** `-9.8.m` currently falls through to `name-missing`,
  while ND-013 blocks _digit_ keys on a negative decimal
  (`$!.numeric-domain property FrameDecimal`). So the alphabetic segment could
  work where the numeric one does not, which needs saying either way.
- **Sequence receivers.** `1.408.055.m` reports `name-missing` on
  `FrameSequence`. Whether a sequence accepts a unit segment is unspecified.
- **Which rungs accept it.** `Dec` is the motivating case; `Int`, `Rat`, and
  `Num` each have the same free slot.
- **The word "typed".** It implies participation in `~~`, `<>`, and `~`. Whether
  `m` is a type in that sense, and whether `9.8.m ~ ~~9.8.m` holds, is a
  separate question from whether the magnitude carries a unit.

## Untouched

As with every other candidate in this directory: dimension versus quantity kind,
affine units such as `degC`, and where the unit vocabulary comes from. A
spelling decides none of them.
