# Rationalizing Numbers

**Status:** Design consensus, with four open tensions recorded in §6. Nothing
here is implemented; this document records the reasoning so the ticket can be
tuned against it rather than rediscovered.\
**Issues:** [#355](https://github.com/TheSwanFactory/hclang/issues/355),
[#354](https://github.com/TheSwanFactory/hclang/issues/354),
[#293](https://github.com/TheSwanFactory/hclang/issues/293)\
**Revised:** Review pass against the code corrected the modulo and
exponentiation operator spellings, the `instanceof` counts, and the claim about
`valueOf()` guards; added **T-4** and **ND-012**. See §9.

## 1. HC has no float literal

`3.14` is not a lexeme. `FrameNumber.NUMBER_BEGIN` is `/[1-9]/` and `recognize`
consumes only `/\d/`, so the `.` never enters the number. Composition happens at
evaluation, in `lookup_here`, which builds the next value from the accumulated
spelling when the key is all digits:

```ts
new FrameNumber(`${this.spelling}.${key}`);
```

`lib/execute/lex.test.ts:327-335` fixes this: `+1.408.555.1212` lexes to five
atoms — `+`, `1`, `.408`, `.555`, `.1212`. `11-candidate-composition-spec.md`
makes it binding (**CD-011** requires the ordinary decomposition, **CD-012**
forbids adding candidate composition).

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
| `FrameNumber`   | `number`                         | projection; fractional `**`        |

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
  inheriting the `[1-9]` sigil. That sigil deliberately excludes `0`, so **zero
  has no literal spelling** and `FrameBlob` keeps `0` as its own sigil start.
  Zero is reachable only as a computed value. This is preserved as-is rather
  than fixed here; see **T-4** for why it matters to ND-010.
- **ND-002** — Integers are `bigint` by default. Exactness is the default, not
  an opt-in.
- **ND-003** — `FrameDecimal` is exact (scaled `bigint`), not a float. `number`
  is a projection through `valueOf()`.
- **ND-004** — `Int ÷ Int` yields `FrameRational`, reduced, sign-normalized.
- **ND-005** — `FrameRational` collapses **only** to `FrameInt`, when the
  denominator reduces to 1. It never auto-collapses to `FrameDecimal`, so `1/2`
  renders as a ratio rather than `0.5`, keeping rendering predictable.
- **ND-006** — Modulo (spelled `%%`, per `lib/ops.ts:38`) is defined **only** on
  `FrameInt`. Every other operand combination returns an error frame.
- **ND-007** — `**` stays exact where an exact answer exists: a non-negative
  integer exponent yields the base's own rung, a negative integer exponent
  yields `Rat↓`, and a genuinely fractional exponent yields `FrameNumber`.
  Exponentiation is the only operator that can leave the rationals, but only in
  the fractional case (see §5.3).\
  _Revised._ This originally read "`**` returns `FrameNumber` in the general
  case," which **T-2** showed to violate an acceptance criterion #355 itself
  states. The narrow rule preserves the original insight and needs sign-off.
- **ND-008** — Equality compares exact values across `Int`/`Decimal`/`Rational`,
  so `3`, `3 .0`, and `6/2` are equal while each keeps its own spelling.
- **ND-009** — `FrameSequence` is not numeric. Arithmetic on it returns an error
  frame; equality is structural over segments.
- **ND-010** — Division and modulo by zero return stable error frames. Because
  zero has no literal spelling (ND-001), this is reachable only through computed
  values, so the guard belongs in the operators rather than at construction.
- **ND-011** — Repetition (`3“Hello”`) is restricted to `FrameInt` with a bound
  guard, returning an error frame otherwise. This covers only the `else` branch
  of `FrameNumber.apply`.
- **ND-012** — The other branch of `FrameNumber.apply` — juxtaposed
  multiplication, `3 2 → 6` — routes through the same tower as §5.1. Its current
  form is `this.data * argument.data` (`frame-number.ts:52`), so it inherits
  exactly the float artifact §5.1 exists to remove and cannot be left on the
  numeric cache.

## 5. Truth tables

Rows are the left operand, columns the right. `err` is an HC error frame
(`Frame.error`, `frame.ts:110`).

Every `err` cell below is a **behavior change**, not the status quo. All ten
gated operators in `lib/ops/math.ts` currently `return Frame.nil` when either
operand fails the `instanceof` test, so today a type mismatch is silently empty
rather than an error. See **T-4**.

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

Note the spelling: exponentiation is `**`. Bare `^` is **not** exponentiation in
HC — `lib/ops.ts:50` binds it to `BindType`.

Per **ND-007** the result stays exact except for a fractional exponent, because
`**` is the only operator that can escape the rationals entirely: `2 ** (1 .5)`
is irrational, so no exact frame can hold it. Two host facts constrain any
alternative:

- `2n ** -1n` throws `RangeError: Exponent must be positive`. A negative
  exponent must be intercepted regardless of the result type.
- `Number(12345678901234567890n)` is `12345678901234567000`, so routing through
  `number` is lossy above the safe-integer range. This is the substance of
  **T-2**.

### 5.4 Modulo

The operator is `%%`, not `%` (`lib/ops.ts:38`); bare `%` is unbound in HC, so
grepping for it will find nothing.

Per **ND-006**, `Int %% Int → Int` and every other combination is `err`. Modulo
is not a closure problem — it is definable on decimals and rationals via
truncated division — but the sign and truncation conventions diverge across
languages, and restricting the domain avoids specifying them. Note this narrows
today's behavior, where `%%` accepts any two `FrameNumber` (**T-3**).

### 5.5 Comparison and equality

Exact and total across `Int`/`Dec`/`Rat` by cross-multiplication, returning
`Frame.all` or `Frame.nil`. `Seq` against `Seq` compares structurally.

Comparison is the one place `nil` is deliberately retained over `err`: `Seq`
against a numeric returns `Frame.nil`, because asking whether two values are
equal is reasonable even where arithmetic is not. That is an exception to the
migration in **T-4**, not an inconsistency with it.

Comparison is non-total only where `FrameNumber` participates, inherited from
`NaN`. That is a further argument for never producing a `FrameNumber` _from
exact operands_. Once a `FrameNumber` is in hand it propagates through every
operator, as the `Num` rows and columns above show; the claim is about entry
into the inexact domain, not containment within it.

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

1. **Uniform** — exact ÷ exact → `Rat↓`. Simplest, never lossy, but dividing
   `10 .50` by `2` gives a ratio rather than `5 .25`.
2. **Collapse one rung further** — compute in `Rat`, then collapse to `Dec` when
   the denominator is of the form `2^a·5^b`, else stay `Rat`. This satisfies the
   `5 .25` intuition _and_ stays exact.
3. **As stated** — `Dec ÷ Int → Dec` with documented rounding. Exactness is
   lost, and the loss is hidden inside a nominally exact frame.

Recommendation: (2) if the `5 .25` result matters, otherwise (1). (3) is not
recommended.

Option (2) **refines ND-005 rather than contradicting it.** ND-005 forbids
`Rat → Dec` collapse in order to keep rendering predictable, and the `2^a·5^b`
test is precisely the condition under which that collapse is total and lossless.
Adopting (2) narrows ND-005's prohibition to the cases that motivated it — `1/3`
still renders as a ratio — rather than reversing it.

### T-2 — Resolved into ND-007, pending sign-off

_Closed, retained for rationale._

The issue requires that "arithmetic remains exact beyond
`Number.MAX_SAFE_INTEGER`." `2 ** 64` through `number` yields
`18446744073709552000`, which is not exact, so ND-007's original form — `**`
always returning `FrameNumber` — violated a criterion #355 itself states.

`bigint` supports non-negative integer exponents natively and exactly, at no
implementation cost, so there is no cost argument for the broad rule. ND-007 has
been rewritten to the narrow form: non-negative integer exponent → the base's
rung; negative integer exponent → `Rat↓`; fractional exponent → `Num`. That
retains the original insight — fractional exponents genuinely have no exact
answer — while satisfying the acceptance criterion.

This reverses a previously-taken decision, so it needs explicit confirmation
before the ticket is written.

### T-3 — Restricting modulo is a behavioral regression

`%%` currently accepts any two `FrameNumber`, so decimal modulo works today.
**ND-006** narrows that to integers. If any existing program or test relies on
decimal modulo it will start returning an error frame, and #355's requirement
that "existing whole-number programs either retain behavior or have an explicit,
tested migration rule" makes this a documented migration rather than a silent
change.

Note the operator is `%%`; searching for affected programs by grepping `%` will
find nothing, since bare `%` is unbound.

### T-4 — `nil` → `err` is an unlisted migration

Every `err` cell in §5 changes existing behavior. All ten gated operators in
`lib/ops/math.ts` end with `return Frame.nil`, so a type mismatch is currently
silently empty. The truth tables replace that with an error frame across ten
operators at once.

This lands on the same #355 requirement as T-3: it either retains behavior or
needs an explicit, tested migration rule. Two considerations pull in opposite
directions:

- **For `err`** — silent `nil` on `1 + “text”` hides real mistakes, and #355
  already asks for descriptive error frames on unsupported numeric combinations.
- **For `nil`** — `nil` is HC's normal absence value and may be load-bearing in
  conditionals, where an error frame would propagate instead of testing falsy.

ND-009's "arithmetic on a sequence returns an error frame" is a specific
instance of this and cannot be settled independently of it. §5.5 keeps
comparison on `nil` deliberately; that exception should survive whichever way
this resolves.

Zero interacts here too. Because zero has no literal spelling (ND-001), no test
can write `1 / 0` directly, so ND-010's error frames need computed operands to
exercise at all.

## 7. Affected code points

Verified by reading. Two counts that are easy to conflate:

- `FrameNumber` is **mentioned** in eight non-test files.
- It is **gated on** (`instanceof FrameNumber`) in only four of them, on 13
  lines: `math.ts` (10), `frame-number.ts:51`, `frame-bytes.ts:38`,
  `schema-bit-matcher.ts:31`. Because each `math.ts` line tests both operands,
  that is 20 gate expressions in `math.ts` and 23 repo-wide.

| Location                                 | Change                                                          |
| ---------------------------------------- | --------------------------------------------------------------- |
| `lib/frames/frame-number.ts`             | splits into the tower; `NUMBER_BEGIN` moves to `FrameInt`       |
| `lib/frames/frame-number.ts:26-31`       | `for()` interning cache — see below                             |
| `lib/frames/frame-number.ts:49-60`       | `apply`: repetition per ND-011, multiplication per **ND-012**   |
| `lib/ops/math.ts`                        | 10 gated operators, 20 expressions → shared numeric base        |
| `lib/ops/math.ts`                        | 10 `return Frame.nil` fallbacks → error frames, per **T-4**     |
| `lib/ops.ts:38-39`                       | `%%` → `Modulo`, `**` → `Power`; `^` is `BindType`, not a power |
| `lib/ops/iterators.ts:11`                | `FrameNumber.for(i.toString())` loop indices → `FrameInt`       |
| `lib/frames/frame-bytes.ts:38,41-44`     | `instanceof` + already-guarded byte count                       |
| `lib/frames/schema-bit-matcher.ts:31,34` | `instanceof` + already-guarded bit width                        |
| `lib/execute/hc-eval.ts:45`              | `new FrameNumber(value)` host bridge needs int/decimal routing  |
| `lib/frames.ts`                          | exports for the new frames                                      |
| `lib/execute/syntax.ts`                  | sigil registry entry                                            |

`NUMBER_BEGIN` and `NUMBER_CHAR` have no references outside `frame-number.ts`,
so the sigil change is contained.

### The `valueOf()` consumers are already guarded

Both sites already range-check, so routing them through an exact-integer
accessor is a **refactor of existing guards, not a new safety property**:

- `frame-bytes.ts:41-44` — rejects on
  `!Number.isSafeInteger(count) || count < 0`.
- `schema-bit-matcher.ts:35` — requires `Number.isInteger(bits) && bits > 0`,
  falling back to `UnsupportedSchemaMatcher`.

The remaining work is that both call `Number(value.valueOf())`. Once `valueOf()`
projects from a `bigint`, that conversion is lossy above the safe-integer range
(`Number(12345678901234567890n)` → `12345678901234567000`), so the guard must
move ahead of the conversion rather than after it. The existing checks would
still pass a value that had already been rounded.

### The interning cache needs a decision

`FrameNumber.for` memoizes instances in `protected static numbers`, keyed by
digit string (`frame-number.ts:26-31`). Splitting the class raises three
questions the ticket must answer: whether each rung keeps its own cache, whether
an `Int` key and a `Decimal` spelling can collide in one table, and whether
interned instances may be shared at all once metadata is attachable.
`iterators.ts:11` is a caller, not the issue; the shared mutable table is.

### Behavior that must survive

| Test                               | Requirement                                      |
| ---------------------------------- | ------------------------------------------------ |
| `lex.test.ts:327-335`              | five-atom decomposition of `+1.408.555.1212`     |
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
- Giving zero a literal spelling. ND-001 records the gap; changing the `[1-9]`
  sigil would collide with `FrameBlob` and belongs to its own ticket.

## 9. Revisions

A review pass re-verified every claim against the code. The design held; these
corrections did not.

| Correction                                                                | Sections          |
| ------------------------------------------------------------------------- | ----------------- |
| Modulo is `%%`, not `%`; bare `%` is unbound                              | ND-006, §5.4, T-3 |
| Exponentiation is `**`; `^` is `BindType` (`ops.ts:50`)                   | §5.3              |
| 13 `instanceof` lines span four files, not just `math.ts`, which holds 10 | §7                |
| Both `valueOf()` consumers already range-check; the fix is a refactor     | §7                |
| `err` replaces today's `Frame.nil`, an unlisted behavior change           | §5 preamble, T-4  |
| `apply`'s multiplication branch was uncovered by ND-011                   | ND-012, §7        |
| `FrameNumber.for`'s interning cache was unaddressed                       | §7                |
| Zero has no literal spelling, which ND-001 preserved silently             | ND-001, ND-010    |
| T-1 option (2) refines ND-005 rather than contradicting it                | T-1               |
| T-2 should supersede ND-007 rather than sit in tension with it            | ND-007, T-2       |
| Overreaching claim that arithmetic never produces `FrameNumber`           | §5.5              |

Corrections not adopted: none. One correction was narrowed — `Frame.error` is
defined at `frame.ts:110`; `frame-scope-anchor.ts:172` is a call site.
