# Units of Measure: MVP Implementation Spec

**Status:** Implemented in
[#365](https://github.com/TheSwanFactory/hclang/pull/365), with the amendment
below adopted during the build\
**Scope:** The `nn.nn.aa` segment produces an inert `FrameTypedNumber`.
Composite spelling is included per the amendment; no arithmetic and no
vocabulary.\
**Inputs:** [04-uom-typed-number.md](04-uom-typed-number.md),
[#362](https://github.com/TheSwanFactory/hclang/issues/362),
[a08](../a08-rationalizing-numbers.md)\
**Verified against:** `v0.12.0`. Every behaviour below was either observed by
evaluation or read from the cited source line.

## What to build

An alphabetic property key on a `FrameDecimal` receiver constructs a
`FrameTypedNumber`: a frame holding an exact decimal magnitude and an opaque
unit spelling. It renders as written, compares structurally, and refuses every
arithmetic operation — including with another typed number of the same unit.

It is the direct analogue of `FrameSequence`, which a numeric key on the same
receiver already produces.

```
9.8.m       => 9.8.m                       new
9.8.5       => 9.8.5                       unchanged, FrameSequence
9.8.m + 1   => $!.numeric-domain + FrameTypedNumber FrameInt
```

## Decisions

| Question                  | Ruling                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Key pattern               | ~~`/^[A-Za-z]+$/` — letters only.~~ Superseded by the amendment.                                     |
| Receiving rungs           | `FrameDecimal` only. `Int`, `Rat`, and `Num` keep the slot unused, so a count is written `100.0.kg`. |
| Same-unit arithmetic      | **Errors.** No operator succeeds on a typed number in this MVP.                                      |
| `=`                       | Structural: same unit **and** equal magnitude by value. Everything else nil.                         |
| `==` / `===`              | Unchanged. `==` separates units for free because the unit is in the spelling.                        |
| Rank                      | `null`, as `FrameSequence`. It joins no promotion matrix.                                            |
| Further segments          | ~~`9.8.m.s` is `name-missing`.~~ Superseded by the amendment; `9.8.m.5` still is.                    |
| Sequence receivers        | `1.408.055.m` stays `name-missing`.                                                                  |
| Named methods on decimals | **Foreclosed, accepted.** See "The cost being accepted" below, and quantities too per the amendment. |
| `<>` / `~~` / `~`         | Out of scope. Verify nothing breaks; add no participation.                                           |

## The cost being accepted

This consumes the alphabetic property slot **on `FrameDecimal`**, so a decimal
can never carry a named method: `3.14.round` and `9.8.abs` become quantities
with units `round` and `abs`. Operators on numbers are spelled symbolically
(`.<`, `.%%`, `.>`), so the alphabetic space was the only room a named decimal
method could occupy. `Int`, `Rat`, and `Num` are unaffected and keep their slot.

This is a deliberate trade, recorded so it is not rediscovered as a defect.

## Behaviour that is free

Do not write code for any of these. `FrameNumeric` guards on `rank == null`
before any subclass dispatch (`lib/frames/frame-numeric.ts`):

| Path                        | Guard                                       | Result                                            |
| --------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `join` — `+`, `-`, `*`      | `this.rank == null \|\| right.rank == null` | `$!.numeric-domain <op> <left> <right>`           |
| `divide`, `power`           | same                                        | `$!.numeric-domain / …`, `$!.numeric-domain ** …` |
| `modulo`                    | `this.rank !== 0 \|\| right.rank !== 0`     | `$!.numeric-domain %% …`                          |
| `order` — `<` `<=` `>` `>=` | same null check                             | `$!.numeric-domain < …`                           |
| `repeat`                    | default implementation                      | `$!.repetition-domain FrameTypedNumber`           |

Only `equals` needs an override for the operator behaviour, because the base
returns `Frame.nil` whenever either rank is null. As built, two other overrides
were required for reasons this section did not anticipate: `lookup_here` for
segment chaining, and `FrameNumeric.lookup_links` for the receiver leak
described under "Files to change".

## Files to change

| File                                    | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/frames/frame-typed-number.ts`      | New. The class.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `lib/frames/frame-decimal.ts`           | New branch in `lookup_here` (currently lines 57-64).                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `lib/frames/frame-numeric.ts`           | **Not anticipated.** Override `lookup_links` to drop a numeric `up` link. Every successful read is a lexical projection whose `up` is the frame it was found on, so a dotted numeric value carries its receiver as a lookup link and an unhandled key re-enters it: `9.8.m.s` built `9.8.s`, and `1.408.055.m` built `1.408.m`. Globals stay reachable because the driver consults them after the links (`meta-frame.ts` `get`), so `9.8.m.< 10.2.m` still resolves. |
| `lib/frames.ts`                         | Export beside `FrameSequence` (line 44).                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `lib/frames/frame-typed-number.test.ts` | New. Unit tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `cli/hc/units.hc`                       | New. Acceptance corpus.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `cli/deno.json`                         | Add `units.hc` to `test:doc`.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `cli/hc.test.ts`                        | Assert the corpus totals, as `numerics.hc` is asserted.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `doc/GRAMMAR.md`, `doc/LANGUAGE.md`     | Document the segment.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cli/hc/white-paper.hc`                 | Correct the stale literal table. See "Doc corrections".                                                                                                                                                                                                                                                                                                                                                                                                              |
| `CHANGELOG.md`                          | One user-visible entry.                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## The construction site

`FrameDecimal.lookup_here` currently reads:

```ts
protected override lookup_here(key: string, origin: MetaFrame): Frame {
  if (/^\d+$/.test(key)) {
    return this.spelling.startsWith("-")
      ? Frame.error("$!.numeric-domain property FrameDecimal")
      : new FrameSequence(`${this.spelling}.${key}`);
  }
  return super.lookup_here(key, origin);
}
```

Add a second branch with the **same negative-receiver guard**, so the sign rule
stays in one place. As built, the key test lives on the new class so the widened
segment pattern has one definition:

```ts
if (FrameTypedNumber.isUnitSegment(key)) {
  return this.spelling.startsWith("-")
    ? Frame.error("$!.numeric-domain property FrameDecimal")
    : new FrameTypedNumber(this, key);
}
```

Two judgment calls in that branch, flagged for sign-off rather than buried:

1. **Negative receivers error.** `-9.8.m` becomes
   `$!.numeric-domain property FrameDecimal` where today it is `name-missing`.
   This keeps the sign question wholly inside
   [#363](https://github.com/TheSwanFactory/hclang/issues/363) instead of
   pre-empting it. Flip it only with #363.
2. **A leading `+` passes through**, because the guard tests `-` only. `+9.8.m`
   therefore constructs a typed number whose magnitude spelling is `+9.8`. Lock
   whatever this yields in a unit test rather than in the corpus, and leave the
   ruling to #363.

## The class

`lib/frames/frame-typed-number.ts`, modelled on `frame-sequence.ts`:

```ts
/** Inert exact magnitude carrying an opaque unit spelling. */
export class FrameTypedNumber extends FrameNumeric {
  public readonly rank: NumericRank | null = null;
  public readonly magnitude: FrameDecimal;
  public readonly unit: string;
  public readonly spelling: string;

  public constructor(magnitude: FrameDecimal, unit: string, meta = NilContext) {
    super(meta);
    const segments = unit.split(".");
    if (!segments.every(FrameTypedNumber.isUnitSegment)) {
      throw new TypeError(`invalid unit segment: ${unit}`);
    }
    this.magnitude = magnitude;
    this.unit = unit;
    this.segments = Object.freeze(segments);
    this.spelling = `${magnitude.spelling}.${unit}`;
  }
}
```

As built, the segment pattern `/^[A-Za-z]+(?:-?\d+)?$/` is exposed as the static
`FrameTypedNumber.isUnitSegment`, so `FrameDecimal` and the chaining branch
share one definition, and `segments` holds the frozen split of a composite unit.

Required members, with the exact behaviour:

| Member                                   | Behaviour                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lookup_here`                            | Absorb a further unit segment per the amendment; delegate to `super` otherwise.                                                                               |
| `equals(right)`                          | `Frame.all` when `right` is a `FrameTypedNumber`, units are string-equal, and `this.magnitude.equals(right.magnitude)` is `Frame.all`. Otherwise `Frame.nil`. |
| `toData()`                               | `this.spelling`.                                                                                                                                              |
| `valueOf()`                              | `Frame.error("$!.numeric-domain projection FrameTypedNumber")`, following a08 §11.6.                                                                          |
| `isZero()`                               | Delegate to `this.magnitude.isZero()`.                                                                                                                        |
| `promoteOne()`                           | `this`.                                                                                                                                                       |
| `ratioParts()`                           | `null`.                                                                                                                                                       |
| `integralValue()`                        | `null`.                                                                                                                                                       |
| `inexactResult(_)`                       | `Frame.error("$!.numeric-domain projection FrameTypedNumber")`.                                                                                               |
| `unaryPlus()`                            | `this`. No new spelling.                                                                                                                                      |
| `unaryMinus()`                           | `Frame.error("$!.numeric-domain unary- FrameTypedNumber")`.                                                                                                   |
| `addSame` … `powerSame`, `powerIntegral` | `this.operationError(<op>, right)`. Unreachable behind the rank guards, but the abstract contract requires them.                                              |
| `compareSame(_)`                         | `null`.                                                                                                                                                       |

`exactInt` is inherited and already returns
`$!.exact-integer-required FrameTypedNumber`.

## Acceptance corpus

`cli/hc/units.hc`, in the shape of `cli/hc/numerics.hc`, wired into
`deno task test:doc` with its totals asserted in `cli/hc.test.ts`. `...` is a
prefix match (`lib/execute/hc-test.ts:107-108`), which is required for
`name-missing` assertions because the frame id in `$:` paths is positional.

**The shipped file is authoritative**: 36 examples, grouped as syntax, composite
spelling, equality planes, spelling-not-dimension equality, refused composition,
and unmoved boundaries. The plan in this section was 27 examples; four things
changed during the build, and only these:

| Planned                    | Shipped                          | Why                                                                                                                   |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `9.8.m2` → `name-missing`  | `9.8.m2` → a quantity            | The amendment widened the segment pattern.                                                                            |
| `9.8.m.s` → `name-missing` | `9.8.m.s` → a composite quantity | The amendment absorbs further segments.                                                                               |
| `9.8.m < 10.2.m`           | `9.8.m.< 10.2.m`                 | Bare `<` is structural at the lexical level, so it is not a comparison. `numerics.hc` already spells `1.408.555.< 2`. |
| 27 examples                | 36 examples                      | Composite spelling, composite equality, and two malformed-segment boundaries were added.                              |

Two rejections the corpus still does not assert, though they hold: `(1 / 3).m`
and `(1 / 2.0).m` are both `name-missing`, so the "decimals only" ruling is
carried by `100.kg` alone.

## Unit tests

`lib/frames/frame-typed-number.test.ts`:

- Construction rejects a non-letter unit (`TypeError`).
- `spelling`, `toData`, and `toString` round-trip `9.8.m`.
- `equals` across the four cases: same unit and value; same unit, different
  value; different unit; non-typed operand.
- `valueOf` returns an error frame rather than throwing, and `Number(...)` of it
  is `NaN` — the residual a08 §11.6 documents for `FrameSequence`.
- `exactInt` returns `$!.exact-integer-required FrameTypedNumber`.
- `+9.8.m`, whatever it produces, is locked here rather than in the corpus.

As built, this file also covers composite segments, `dataEquals` on the data
plane, `isZero` delegation, and every arithmetic and ordering refusal.

**Still missing.** The `lookup_links` override is the one behaviour change
marked **Breaking** in the CHANGELOG, and it has no direct test — only the
indirect `9.8.m.5` corpus line. Two assertions belong in
`lib/frames/frame-numeric.test.ts` or `lib/execute/evaluate.test.ts`:

- A name bound in an enclosing scope is **not** reachable through a numeric
  receiver. On `v0.12.0`, `.foo 7; .x 9.8; x.5.foo` returned `7`; it must now
  report `$!.name-missing`, so a later refactor cannot silently restore the
  leak.
- A built-in operator **is** still reachable through the globals tier, which is
  what makes dropping the link safe: `9.8.m.< 10.2.m` resolves `<`. Only the
  corpus covers this today.

## Doc corrections

`cli/hc/white-paper.hc:224-225` still advertises two literals in this slot:

```
|123.456.E.-10| _scientific_ |
|123.456.p123| _version_ |
```

Neither works at `v0.12.0` — both are `name-missing` — and #355 already removed
them from `GRAMMAR.md` and `LANGUAGE.md`. Correct the table as part of this
change. Note the collision if they are ever revived: `E` is a valid unit segment
and `p123` is now one too, since the amendment admits a trailing integer.

As built, the same stale table was found in two further places and corrected:
`doc/onward2017/hc-paper-enp.mdk` and `doc/shannon/5-hclang.md`. The VS Code
grammar also carried `constant.numeric.scientific` and `constant.numeric.semver`
patterns, now replaced by quantity and sequence patterns.

`GRAMMAR.md` and `LANGUAGE.md` gain the segment beside the sequence rule: a
third alphabetic segment on a decimal is an inert quantity, distinct from a
third numeric segment, which is a sequence.

## Amendment: composite spelling is in scope after all

**Status:** Accepted during implementation. Supersedes the "Key pattern",
"Further segments", and first "Out of scope" bullets below.

This spec called for `/^[A-Za-z]+$/` and no chaining, which would have left
`9.8.m2` and `9.8.m.s-1` as `name-missing`. Two facts moved the decision:

1. The lexer already delivers `m2`, `s-1`, and `s-2` as single property keys, so
   composite spelling needed no lexical work — only a widened key pattern and a
   chaining branch on `FrameTypedNumber`, mirroring `FrameSequence`.
2. The objection to composites was that `9.8.m.s-1` and `9.8.s-1.m` denote the
   same quantity yet compare unequal, and that ordering them requires the
   dimension work this spec defers. But the language already holds
   `1000.0.m = 1.0.km` false for exactly the same reason. A unit is a spelling,
   not a dimension, and spelling-sensitive equality across composites is the
   same concession, not a new one.

The amended rulings:

| Question          | Ruling                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Segment pattern   | `/^[A-Za-z]+(?:-?\d+)?$/` — letters, then an optional integer exponent signed with a hyphen.         |
| Further segments  | **Absorbed.** `9.8.m.s-1` is one quantity with unit `m.s-1`. Chaining is unbounded, as for sequence. |
| Canonicalization  | **None.** No segment is reordered and no exponent is folded, so `m2`, `m.m`, and `s-1.m` all differ. |
| Division spelling | Still absent. `m/s` is written `m.s-1`; `9.8.m/s` divides by a missing name.                         |
| Numeric segment   | Unchanged. `9.8.m.5` is `name-missing`.                                                              |
| Malformed segment | `2s` and `s_1` stay `name-missing`, so a leading digit and the effect marker keep their meanings.    |
| Named methods     | **Also foreclosed on `FrameTypedNumber`**, so `9.8.m.abs` has unit `m.abs`. See below.               |

Two consequences to record rather than rediscover:

- `9.8.m2` was a planned `name-missing` corpus line and is now a quantity, so
  this amendment is the one place where a line in this spec's corpus moved by
  intent. No assertion inherited from `v0.12.0` moved.
- A quantity can carry no named method either, which forecloses `.unit` and
  `.magnitude` as accessors. Introspection will need a symbolic spelling or a
  free function, not an alphabetic property.

## Out of scope

Do not implement, and do not design around:

- A unit vocabulary, validation, or dimension mapping. `9.8.frobnicate` is a
  well-formed quantity in this MVP, and so is `9.8.m.frobnicate2`.
- Canonical ordering or exponent folding, which is what would make `m.s-1` equal
  `s-1.m`.
- Conversion between units, and any notion of equality across units.
- Quantity kind, affine units such as `degC`.
- Same-unit arithmetic. It is deliberately an error, so that adding it later is
  purely additive.
- The other rungs, and `<>` / `~~` / `~` participation.
- The sign rule, which is
  [#363](https://github.com/TheSwanFactory/hclang/issues/363).

## Verification

```
deno fmt --check
deno lint
deno task test:doc        # numerics.hc 43/43, units.hc 36/36
deno task test:all
deno task build
```

The change is additive by construction: every affected expression is
`name-missing` at `v0.12.0`, so no existing assertion should move. If one does,
stop and report it rather than adjusting the assertion.
