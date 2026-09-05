# Rationalizing Numbers

**Status:** Design consensus, with three open tensions recorded in §6. Nothing
here is implemented; this document records the reasoning so the ticket can be
tuned against it rather than rediscovered.\
**Issues:** [#355](https://github.com/TheSwanFactory/hclang/issues/355),
[#354](https://github.com/TheSwanFactory/hclang/issues/354),
[#293](https://github.com/TheSwanFactory/hclang/issues/293)

## 1. HC has no float literal

`3.14` is not a lexeme. `FrameNumber.NUMBER_BEGIN` is `/[1-9]/` and `recognize`
consumes only `/\d/`, so the `.` never enters the number. Composition happens at
evaluation, in `lookup_here`, which builds the next value from the accumulated
spelling when the key is all digits:

```ts
new FrameNumber(`${this.spelling}.${key}`);
```

`lib/execute/lex.test.ts:328` fixes this: `+1.408.555.1212` lexes to five atoms
— `+`, `1`, `.408`, `.555`, `.1212`. `11-candidate-composition-spec.md` makes it
binding (**CD-011** requires the ordinary decomposition, **CD-012** forbids
adding candidate composition).

The consequence for #355 is that exact arithmetic needs **no new surface
syntax**. The decimal point is already the property operator, and the parser is
already variable lookup. What the issue frames as "choose and document native
construction syntax" is instead a question about which frame each lookup rung
produces.

## 2. Two independent axes

The confusion in #355 comes from collapsing two things that vary separately.

| Axis                 | Driven by                 | Progression                |
| -------------------- | ------------------------- | -------------------------- |
| **Syntactic ladder** | arity of the lookup chain | `Int → Decimal → Sequence` |
| **Semantic tower**   | closure under arithmetic  | `Int ⊂ Decimal ⊂ Rational` |

`FrameRational` sits only on the second axis: it has no spelling that produces
it and is reachable only through arithmetic. `FrameNumber` sits on neither — it
becomes a lossy projection you request, never a rung you land on.

## 3. The five frames

| Frame           | Holds                            | Produced by                        |
| --------------- | -------------------------------- | ---------------------------------- |
| `FrameInt`      | `bigint`                         | bare digits — `3`                  |
| `FrameDecimal`  | `bigint` numerator + `scale`     | one numeric lookup — `3 .14`       |
| `FrameSequence` | ordered segments, spelling only  | two or more lookups — `1 .408 .55` |
| `FrameRational` | `bigint` numerator + denominator | division only                      |
| `FrameNumber`   | `number`                         | explicit projection; `**`          |

`FrameDecimal` stores `314` with scale `2`, recoverable from the spelling by
dropping the `.` and counting following digits. Rendering stays total: insert a
`.` scale digits from the right. A general rational cannot do that (`1/3` has no
decimal spelling), which is why the decimal rung is a scaled integer rather than
a ratio.

`FrameSequence` and `FrameRational` are new classes; the names are unused across
`lib`, `cli`, `web`, `maml`, `spec`, and `doc`.

### The source string already exists

`FrameNumber` already stores `spelling = source` alongside
`data =
Number(source)`, and `toData()` returns `spelling`. Because
`FrameAtom.toString()` → `toStringData()` → `toData()` (`frame-atom.ts:21-39`),
**rendering already runs off the source text and never touches the numeric
field**. That is why `1.408.055.1212` round-trips today even though its `data`
is `NaN`.

So `data` is not storage, it is a cache — read only by `valueOf()`, the six
arithmetic methods, the five comparisons, and `range()`. Replacing it is a
narrow change.

## 4. Decisions

- **ND-001** — The syntactic ladder is forward-only and arity-driven:
  `FrameInt.lookup_here` → `FrameDecimal`, `FrameDecimal.lookup_here` →
  `FrameSequence`, `FrameSequence.lookup_here` → `FrameSequence`. Sequence is
  absorbing. No demotion, no lookahead, no lexer change beyond `FrameInt`
  inheriting the `[1-9]` sigil.
- **ND-002** — Integers are `bigint` by default. Exactness is the default, not
  an opt-in.
- **ND-003** — `FrameDecimal` is exact (scaled `bigint`), not a float. `number`
  is a projection through `valueOf()`.
- **ND-004** — `Int ÷ Int` yields `FrameRational`, reduced, sign-normalized.
- **ND-005** — `FrameRational` collapses **only** to `FrameInt`, when the
  denominator reduces to 1. It never auto-collapses to `FrameDecimal`, so `1/2`
  renders as a ratio rather than `0.5`, keeping rendering predictable.
- **ND-006** — Modulo is defined **only** on `FrameInt`. Every other operand
  combination returns an error frame.
- **ND-007** — `**` returns `FrameNumber` in the general case. Exponentiation is
  the one operator with no exact story (see §5.3).
- **ND-008** — Equality compares exact values across `Int`/`Decimal`/`Rational`,
  so `3`, `3 .0`, and `6/2` are equal while each keeps its own spelling.
- **ND-009** — `FrameSequence` is not numeric. Arithmetic on it returns an error
  frame; equality is structural over segments.
- **ND-010** — Division and modulo by zero return stable error frames.
- **ND-011** — Repetition (`3“Hello”`) is restricted to `FrameInt` with a bound
  guard, returning an error frame otherwise.

## 5. Truth tables

Rows are the left operand, columns the right. `err` is an HC error frame.

### 5.1 Addition, subtraction, multiplication

Join on the tower. Nothing escapes; `Int` embeds as scale 0.

|         | Int | Dec | Rat | Num | Seq |
| ------- | --- | --- | --- | --- | --- |
| **Int** | Int | Dec | Rat | Num | err |
| **Dec** | Dec | Dec | Rat | Num | err |
| **Rat** | Rat | Rat | Rat | Num | err |
| **Num** | Num | Num | Num | Num | err |
| **Seq** | err | err | err | err | err |

This is what removes the visible artifact: `1 .1 + 2 .2` becomes
`11/10 +
22/10`, rendering `3.3` rather than the `3.3000000000000003` that
`(1.1 + 2.2).toString()` produces today.

### 5.2 Division

`↓` means reduce, normalize sign, and collapse to `Int` per **ND-005**. The
`Dec` row is unresolved — see **T-1**.

|         | Int   | Dec   | Rat  | Num | Seq |
| ------- | ----- | ----- | ---- | --- | --- |
| **Int** | Rat↓  | Rat↓  | Rat↓ | Num | err |
| **Dec** | _T-1_ | _T-1_ | Rat↓ | Num | err |
| **Rat** | Rat↓  | Rat↓  | Rat↓ | Num | err |
| **Num** | Num   | Num   | Num  | Num | err |
| **Seq** | err   | err   | err  | err | err |

### 5.3 Exponentiation

`**` is already live — `lib/ops.ts:39` maps it to `Power` in `math.ts:38`, gated
on both operands being `FrameNumber`.

Per **ND-007** the general result is `FrameNumber`. The reasoning is that `^` is
the only operator that can escape the rationals entirely: `2 ** (1 .5)` is
irrational, so no exact frame can hold it. Two host facts constrain any
alternative:

- `2n ** -1n` throws `RangeError: Exponent must be positive`. A negative
  exponent must be intercepted regardless of the result type.
- `Number(12345678901234567890n)` is `12345678901234567000`, so routing through
  `number` is lossy above the safe-integer range. This is the substance of
  **T-2**.

### 5.4 Modulo

Per **ND-006**, `Int % Int → Int` and every other combination is `err`. Modulo
is not a closure problem — it is definable on decimals and rationals via
truncated division — but the sign and truncation conventions diverge across
languages, and restricting the domain avoids specifying them. Note this narrows
today's behavior, where `%` accepts floats (**T-3**).

### 5.5 Comparison and equality

Exact and total across `Int`/`Dec`/`Rat` by cross-multiplication, returning
`Frame.all` or `Frame.nil`. `Seq` against `Seq` compares structurally; `Seq`
against a numeric returns nil rather than an error, since asking is reasonable
even where arithmetic is not.

Comparison is non-total only where `FrameNumber` participates, inherited from
`NaN`. That is a further argument for never _producing_ a `FrameNumber` from
arithmetic.

This fixes a live defect. `FrameNumber.equals` compares
`this.data === right.data`, and `Number("1.408.055.1212")` is `NaN`, so two
identical phone-shaped values currently compare unequal and all four orderings
return nil.

## 6. Open tensions

### T-1 — `Decimal ÷ Int → Decimal` is not closed

The intuition is that dividing a measured quantity by a count should stay a
measured quantity, and for exact cases it works: `10.50 / 2` is `5.25` in host
floats and exactly `1050/100 ÷ 2 = 525/100` in scaled form.

But the rule cannot be satisfied in general. `(1 .0) / 3` is one third, which
has no decimal representation at any scale. Honoring `Decimal ÷ Int → Decimal`
therefore requires choosing a precision and rounding, which reintroduces
inexactness behind a class that claims to be exact — the precise failure #355
exists to eliminate.

`Decimal ÷ Decimal → Number` is representable but loses cases that visibly
should be exact. Verified in the host: `0.3 / 0.1` is `2.9999999999999996` and
`0.7 / 0.1` is `6.999999999999999`. Under that rule `(0 .3) / (0 .1)` renders
`2.9999999999999996` instead of `3`.

There is also an asymmetry: every decimal _is_ a rational, so `Dec` and `Int`
have identical closure behavior. Splitting them means `1 / 3` is exact while
`1 .0 / 3 .0` is not, and the more precise-looking spelling yields the less
precise answer.

Three coherent resolutions:

1. **Uniform** — exact ÷ exact → `Rat↓`. Simplest, never lossy, but
   `(10 .50) /
   2` becomes a ratio rather than `5 .25`.
2. **Collapse one rung further** — compute in `Rat`, then collapse to `Dec` when
   the denominator is of the form `2^a·5^b`, else stay `Rat`. This satisfies the
   `(10 .50) / 2 → 5 .25` intuition _and_ stays exact, but contradicts
   **ND-005**.
3. **As stated** — `Dec ÷ Int → Dec` with documented rounding. Exactness is
   lost, and the loss is hidden inside a nominally exact frame.

Recommendation: (2) if the `5 .25` result matters, otherwise (1). (3) is not
recommended.

### T-2 — `**` returning `FrameNumber` contradicts #355's own acceptance

The issue requires that "arithmetic remains exact beyond
`Number.MAX_SAFE_INTEGER`." `2 ** 64` through `number` yields
`18446744073709552000`, which is not exact, so **ND-007** as written violates
that criterion for integer powers.

`bigint` supports non-negative integer exponents natively and exactly, at no
implementation cost. A narrower rule keeps both properties: `Int **` a
non-negative `Int` → `Int`; a negative integer exponent → `Rat↓`; a genuinely
fractional exponent → `Num`. That preserves the instinct behind **ND-007** for
the case that actually has no exact answer.

### T-3 — Restricting modulo is a behavioral regression

`%` currently accepts any two `FrameNumber`, so float modulo works today.
**ND-006** narrows that to integers. If any existing program or test relies on
decimal modulo it will start returning an error frame, and #355's requirement
that "existing whole-number programs either retain behavior or have an explicit,
tested migration rule" makes this a documented migration rather than a silent
change.

## 7. Affected code points

Verified by reading. `FrameNumber` appears in eight non-test files across
thirteen `instanceof FrameNumber` gates.

| Location                                 | Change                                                         |
| ---------------------------------------- | -------------------------------------------------------------- |
| `lib/frames/frame-number.ts`             | splits into the tower; `NUMBER_BEGIN` moves to `FrameInt`      |
| `lib/ops/math.ts`                        | 13 uniform `instanceof` gates → shared numeric base            |
| `lib/ops.ts:39`                          | `**` → `Power`; per **T-2**                                    |
| `lib/ops/iterators.ts:11`                | `FrameNumber.for(i.toString())` loop indices → `FrameInt`      |
| `lib/frames/frame-bytes.ts:38,42`        | `instanceof` + `Number(valueOf())` byte count → exact accessor |
| `lib/frames/schema-bit-matcher.ts:31,34` | same, for bit width                                            |
| `lib/execute/hc-eval.ts:45`              | `new FrameNumber(value)` host bridge needs int/decimal routing |
| `lib/frames.ts`                          | exports for the new frames                                     |
| `lib/execute/syntax.ts`                  | sigil registry entry                                           |

`NUMBER_BEGIN` and `NUMBER_CHAR` have no references outside `frame-number.ts`,
so the sigil change is contained.

Because bit widths and byte counts must be exact, the two `valueOf()` consumers
should take an exact-integer accessor that errors on non-integral or
out-of-range values rather than passing through the float projection.

### Behavior that must survive

| Test                               | Requirement                                      |
| ---------------------------------- | ------------------------------------------------ |
| `lex.test.ts:328`                  | five-atom decomposition of `+1.408.555.1212`     |
| `evaluate.test.ts` numeric props   | `1.408`, `1.408.055.1212`, `1.408, 2` boundaries |
| `evaluate.test.ts` dotted compares | `1.< 3`, `1.> 3`, `1.<= 1`, `3.>= 4` on integers |
| `evaluate.test.ts` unary plus      | `+1` and `+1.408.055.1212` spelling preservation |
| `evaluate.test.ts` misses          | `1.invalid` → `name-missing`                     |
| `evaluate.test.ts` apply           | `3 2 → 6`, `3“Hello”` repetition                 |

Non-digit keys must therefore fall through to `super.lookup_here` at every rung,
and unary `+` handling belongs on the shared base so all rungs inherit it.

`(3 .14)“Hello”` currently throws a host `RangeError: Invalid array length` from
`[...Array(this.data).keys()]` rather than returning an HC error frame.
**ND-011** makes that an error frame, which is a strict improvement.

## 8. Out of scope

- Transcendental functions and arbitrary-precision floating point.
- JSON serialization; HCSON remains the native representation.
- Resource and filesystem effects
  ([#348](https://github.com/TheSwanFactory/hclang/issues/348)).
- Porting the sedenion experiment itself
  ([#354](https://github.com/TheSwanFactory/hclang/issues/354)); this document
  only supplies the substrate that would make it faithful.
- Candidate composition and lookahead, excluded by **CD-012**.
