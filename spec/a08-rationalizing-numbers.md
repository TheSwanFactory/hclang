# Rationalizing Numbers

**Status:** **Implemented except M-3.** The five frames, the rank-based dispatch
of §5.0, both truth matrices, and ND-002 through ND-013 are built and covered by
exhaustive per-rung matrix tests. All four tensions (§6) and all six
representation questions (§9) are settled. **M-3 — type mismatch returning an
error frame instead of `nil` — is deliberately not shipped**, because its
prerequisite (how error frames behave in conditional position) is still
undefined; see T-4 and §11.1. Seven smaller divergences between this design and
the code are recorded in §11.\
**Issues:** [#355](https://github.com/TheSwanFactory/hclang/issues/355) (this
design), [#356](https://github.com/TheSwanFactory/hclang/issues/356) and
[#357](https://github.com/TheSwanFactory/hclang/issues/357) (dependencies, both
**landed** — see §8),
[#358](https://github.com/TheSwanFactory/hclang/issues/358) (deferred equality
semantics), [#354](https://github.com/TheSwanFactory/hclang/issues/354)
(consumer, out of scope).\
**Background:** [#293](https://github.com/TheSwanFactory/hclang/issues/293) is
**closed**; it delivered the numeric-property composition that §1 describes, so
it is the origin of the behavior this design extends, not a live dependency.\
**Revised:** Five design passes (§10), then an implementation pass (§11).
Because the design and the implementation share one branch, some sections were
edited to match what was built; §11 marks every such case so the reader can tell
a decision from a description.

**Reading note.** Sections 1 through 10 are the design. §11 is the delta against
the code as built, and it is the authoritative list of what is still open.

**Open, blocking:** error frames in conditional position need defining before
**M-3** can be implemented — filed as
[#360](https://github.com/TheSwanFactory/hclang/issues/360) (T-4, §11.1).
Nothing else in this document is blocked.

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

### Notation

Examples here are written `2.2`, without a space. Although the `.` is a property
operator, the unspaced form is the one that groups correctly, because spacing
participates in associativity. Verified:

| Source            | Result               |
| ----------------- | -------------------- |
| `1.1 + 2.2`       | `3.3000000000000003` |
| `(1 .1) + (2 .2)` | `3.3000000000000003` |
| `1 .1 + 2 .2`     | `3.1.2` — **wrong**  |

In the spaced form without parentheses, `+ 2` binds before the trailing `.2`, so
`1 .1 + 2` evaluates to `3.1` and the `.2` then composes onto that. The spaced
form is only safe inside explicit grouping, so this document uses the unspaced
spelling throughout.

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

| Frame           | Holds                            | Produced by                      |
| --------------- | -------------------------------- | -------------------------------- |
| `FrameInt`      | `bigint`                         | bare digits — `3`                |
| `FrameDecimal`  | `bigint` numerator + `scale`     | one numeric lookup — `3.14`      |
| `FrameSequence` | ordered segments, spelling only  | two or more lookups — `1.408.55` |
| `FrameRational` | `bigint` numerator + denominator | division only                    |
| `FrameNumber`   | `number`                         | projection; fractional `**`      |

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
narrow change **on the lex path**.

### Computed values have no source text

The paragraph above holds only for values that were lexed. `1.1 + 2.2` has no
source string, so every arithmetic result must **synthesize** a spelling rather
than retain one. Today `add()` sidesteps this by doing
`new FrameNumber(value.toString())` and letting the host format the number,
which is exactly the path that leaks `3.3000000000000003`.

Each rung therefore owes a total synthesis rule:

| Rung            | Synthesis                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------- |
| `FrameInt`      | the `bigint`'s decimal digits, `-` prefixed when negative                                   |
| `FrameDecimal`  | insert `.` exactly `scale` digits from the right, left-padding the numerator with `0` first |
| `FrameRational` | `numerator/denominator`, reduced, sign on the numerator (**Q1**)                            |
| `FrameNumber`   | host `Number.prototype.toString`, inexact by construction                                   |
| `FrameSequence` | never synthesized; sequences are only ever lexed (ND-009 bars arithmetic)                   |

The decimal rule needs the pad step to be stated, or `1/100` as scale-2 would
render `.1` instead of `0.01`: the numerator `1` is shorter than the scale. Note
that the padded form begins with `0`, so **every sub-one decimal depends on
#356** to be re-lexable.

**No negative literal exists.** A leading `-` does not lex as a number; `-1`
evaluates to the module frame, while `1 - 2` correctly yields `-1`. So a
synthesized `-` prefix is a rendering that cannot be read back, and negative
values are reachable only by subtraction. Round-tripping is therefore
one-directional across the entire negative range, for every rung. Filed as
[#357](https://github.com/TheSwanFactory/hclang/issues/357); it constrains
**Q1** but does not affect the correctness of the values themselves.

Two consequences worth stating plainly. Spelling stops being "the source text"
and becomes "the canonical rendering," of which source text is one source. And a
synthesized spelling is only equal to a lexed one up to canonical form, so
`3.10` and a computed `3.1` agree in value but not in spelling — which is what
makes **Q3** a real question rather than a detail.

## 4. Decisions

- **ND-001** — The syntactic ladder is forward-only and arity-driven:
  `FrameInt.lookup_here` → `FrameDecimal`, `FrameDecimal.lookup_here` →
  `FrameSequence`, `FrameSequence.lookup_here` → `FrameSequence`. Sequence is
  absorbing. There is no demotion or lookahead. `FrameInt` inherits the `[1-9]`
  sigil, while `FrameBlob` keeps the `0` sigil but routes all-decimal zero-led
  lexemes to `FrameInt`. Explicit `0b`, `0o`, and `0x` forms remain blobs, and
  zero is available as a numeric literal. This resolves #356 and makes ND-010
  directly testable.\
  _Consequence, unresolved:_ zero-led integers keep their spelling, so `0123`
  renders `0123` and `00` renders `00`, while `0123 = 123` and `00 = 0` are both
  true and `0123 + 1` canonicalizes to `124`. Two spellings denote one value at
  the `Int` rung. Equality is unaffected (it is exact per ND-008) but `==` is
  spelling-based, so this is visible there; see §11.2.
- **ND-002** — Integers are `bigint` by default. Exactness is the default, not
  an opt-in.
- **ND-003** — `FrameDecimal` is exact (scaled `bigint`), not a float. `number`
  is a projection through `valueOf()`.
- **ND-004** — **Division by a decimal yields `FrameNumber`.** Every other exact
  pairing yields `FrameRational`, reduced and sign-normalized. The test is on
  the **divisor alone**, so `1 / 3.0` and `1.0 / 3.0` are equally inexact, while
  `10.50 / 2` stays exact because its divisor is a count. Resolves **T-1** and
  **Q6**.\
  _This is a policy, not a representability limit._ Every decimal **is** a
  rational — `numerator / 10^scale` — so `Dec ÷ Dec` is always exactly
  computable: `1.5 / 2.5` is precisely `3/5`, with no rounding and no precision
  choice. The rule declines that result rather than being unable to reach it.
  The policy: **dividing by a decimal is taken as a signal that you are doing
  non-trivial math, so we hand you a number; divide by an integer or a ratio and
  you stay exact.** Division is the only operator where `Dec` is not closed —
  `+`, `-`, and `*` all stay decimal as scales align or add — so it is the only
  place the signal can fire, which is why ND-004 does not make `Dec + Dec`
  inexact too.
- **ND-005** — `FrameRational` collapses **only** to `FrameInt`, when the
  denominator reduces to 1. It never auto-collapses to `FrameDecimal`, so `1/2`
  renders as a ratio rather than `0.5`, keeping rendering predictable.
- **ND-006** — Modulo (spelled `%%`, per `lib/ops.ts:38`) is defined **only** on
  `FrameInt`. Every other operand combination returns an error frame.\
  _Sign convention: **floored**._ The restriction to `Int` was chosen so that
  sign and truncation conventions would not need specifying; #357 made negatives
  reachable, so the convention became observable and had to be picked. HC has no
  truncating integer division — ND-004 makes `7 / 3` an exact rational — so the
  identity that normally motivates truncated modulo does not exist here.
  `a %% n` therefore takes the sign of `n` and is always a proper residue:
  `-7 %% 3` is `2` and `7 %% -3` is `-2`. The code currently returns the host's
  truncated `-1` and `1`; see §11.5 and §11.8.
- **ND-007** — `**` stays exact where an exact answer exists: a non-negative
  integer exponent yields the base's own rung, a negative integer exponent
  yields `Rat↓`, and a genuinely fractional exponent yields `FrameNumber`.
  Exponentiation is the only operator that can leave the rationals, but only in
  the fractional case (see §5.3).\
  _Revised and accepted._ This originally read "`**` returns `FrameNumber` in
  the general case," which **T-2** showed to violate an acceptance criterion
  #355 itself states. The narrow rule is confirmed.
- **ND-008** — `=` compares exact values across `Int`/`Decimal`/`Rational`, so
  `3`, `3.0`, and `6/2` are equal while each keeps its own spelling. `==` and
  `===` are **not** touched; they inherit their current semantics and diverge
  from `=` as a consequence. See **Q3** and
  [#358](https://github.com/TheSwanFactory/hclang/issues/358).
- **ND-009** — `FrameSequence` is not numeric. Its full surface:
  - arithmetic (`+ - * / %% **`) → error frame;
  - ordering → error frame; equality → structural over segments, `nil` against a
    numeric (§5.5);
  - `valueOf()` → **not implemented**; a sequence has no scalar value, and
    returning `NaN` is what causes today's defect. Callers must use the exact
    accessor (§7) and handle its failure. _Met as of `407afc8`_ by an override
    returning `$!.numeric-domain projection FrameSequence` — explicit rather
    than the inherited `Object.prototype.valueOf`, which returned `this` and
    left `Number(...)` silently `NaN`; see §11.6;
  - `apply` → error frame in both branches, so `1.408.555“Hi”` neither repeats
    nor throws;
  - `range()` → not implemented, since it exists only to serve repetition;
  - `%%` → the same error frame as other arithmetic, not a distinct one. The
    operand type is what is wrong, and ND-006's integer restriction is a
    separate matter.
- **ND-010** — Division and modulo by zero return stable error frames. Because
  zero has no literal spelling (ND-001), this is reachable only through computed
  values, so the guard belongs in the operators rather than at construction.
- **ND-011** — Repetition (`3“Hello”`) is restricted to `FrameInt`, returning an
  error frame for every other rung. This covers only the `else` branch of
  `FrameNumber.apply`. The count is bounded twice over:
  - `range(): Array<number>` (`frame-number.ts:69`) is ill-defined once the
    count is a `bigint`, so it takes the exact accessor (§7) and returns an
    error frame rather than an array when the value will not convert;
  - the ceiling is a **repetition** limit, not a representation limit, so
    `Number.MAX_SAFE_INTEGER` is far too permissive — it would allocate.
    Proposed ceiling **65536**, low enough to fail fast and high enough for any
    plausible literal repetition. See **Q5**; the exact figure is the only open
    part.
- **ND-012** — The other branch of `FrameNumber.apply` — juxtaposed
  multiplication, `3 2 → 6` — routes through the same tower as §5.1. Its current
  form is `this.data * argument.data` (`frame-number.ts:52`), so it inherits
  exactly the float artifact §5.1 exists to remove and cannot be left on the
  numeric cache.
- **ND-013** — **A negative decimal does not climb to `FrameSequence`.** ND-001
  makes `Decimal.lookup_here` → `Sequence` unconditional, but a sequence is
  spelling-only and its grammar has no sign slot, so `-1.408 .555` has nothing
  to become. That rung transition returns an error frame instead. This is the
  one place the syntactic ladder is not total, and it exists because #357 added
  negation after ND-001 was written. _The error currently reads
  `$!.numeric-domain property FrameDecimal`, naming the lookup. Negating an
  existing sequence is a different rejection and keeps
  `$!.numeric-domain unary- FrameSequence`; see §11.7._

## 5. Truth tables

Rows are the left operand, columns the right. `err` is an HC error frame
(`Frame.error`, `frame.ts:110`).

### 5.0 Cross-rung dispatch

The tables below are mostly not code. They fall out of one mechanism, which this
section specifies because it is the central implementation question and the rest
of the document assumes it.

Today every arithmetic method is same-class by signature —
`add(right: FrameNumber): FrameNumber` — and `math.ts` gates both operands with
`instanceof FrameNumber` before calling `source.add(block)`. Five rungs would
make that 25 pairings per operator if each pair were handled directly.

They are not, because **the tower is a chain rather than a lattice**:

| Rung       | Rank |
| ---------- | ---- |
| `Int`      | 0    |
| `Decimal`  | 1    |
| `Rational` | 2    |
| `Number`   | 3    |
| `Sequence` | none |

Every binary numeric operator runs the same four steps:

1. **Reject.** If either operand has no rank — a `FrameSequence`, or any
   non-numeric frame — return an error frame naming the operator and both rungs.
   This is the single place the type check lives, so the 20 `instanceof`
   expressions in `math.ts` collapse to one gate on the shared numeric base, and
   it is where ND-009's and M-3's error frames come from.
2. **Promote.** Take `max(rank(left), rank(right))` and lift both operands to
   it. Because the ranks form a chain, each rung only needs a promotion to its
   immediate successor; longer lifts compose.
3. **Operate.** Dispatch to the same-rung implementation. Each rung implements
   the operators for its own type only — four implementations per operator,
   not 25.
4. **Canonicalize.** Collapse per ND-005 (`Rational` with denominator 1 → `Int`)
   and synthesize the spelling per §3.

So §5.1's table is a description of step 2, not a thing to be coded. Addition,
subtraction, and multiplication need no per-cell logic whatsoever.

Promotion is exact at every step but the last:

| Promotion   | Rule                                   | Exact? |
| ----------- | -------------------------------------- | ------ |
| `Int → Dec` | same digits, `scale` 0                 | yes    |
| `Dec → Rat` | numerator over `10^scale`              | yes    |
| `Rat → Num` | numerator ÷ denominator in host floats | **no** |

`Rat → Num` is the only lossy promotion and the only one that can fail outright.
Converting each `bigint` separately and then dividing rounds above the
safe-integer range and can reach `Infinity` on either side, so a rational that
is perfectly representable as a float can project to `Infinity / Infinity` —
`NaN`.

The rule is therefore **convert first, and scale the ratio down only as a
fallback**: divide in host floats when both projections are finite and the
divisor is nonzero, and otherwise project the `bigint` ratio directly. Ordering
it the other way round — always scaling down first — would be more accurate, and
is deliberately **not** what the design asks for, because §5.2's contract
depends on the float path: `0.3 / 0.1` must render `2.9999999999999996`, whereas
the exact ratio 3/10 ÷ 1/10 gives exactly `3`. ND-004 hands the user a
`FrameNumber` precisely so the imprecision is visible in the result type;
recovering exactness inside that projection would defeat the policy while still
labelling the result inexact.

So the fallback is a totality guard against `NaN`, not an accuracy improvement.
It is what makes a rational at 10^400 projectable at all.

Promotion produces new frames and never mutates its operands, consistent with
the immutability discussion in §7.

Four operators depart from the plain join. These exceptions are the only
per-operator logic in the system:

| Operator    | Departure                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `+ - *`     | none — pure join                                                                                           |
| `/`         | **ND-004**: the divisor's rank alone decides. Divisor `Dec` or `Num` → `Num`; otherwise `Rat`, then step 4 |
| `**`        | **ND-007**: the exponent's _value_ selects the rule, not its rank                                          |
| `%%`        | **ND-006**: both operands must be rank 0; no promotion is attempted                                        |
| `< <= > >=` | join, then compare at that rank — "cross-multiplication" is what comparing at rank 2 means                 |

Two mechanisms were considered and rejected. **Double dispatch** would need 25
cases per operator and would re-encode the join implicitly in each one. A
**static join table** is equivalent to `max` for `+ - *`, but cannot express
`**`'s dependence on the exponent's value or the divisor rule, so it would need
the same exceptions while adding a table to maintain. Ranks give the table for
free, and adding a rung later costs one promotion rather than a new row and
column.

The four-step pipeline belongs on the shared numeric base as a template method.
Each of the ten exported operators in `math.ts` becomes a call into it.

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

This is what removes the visible artifact: `1.1 + 2.2` becomes `11/10 +
22/10`,
rendering `3.3` rather than the `3.3000000000000003` that
`(1.1 + 2.2).toString()` produces today.

### 5.2 Division

`↓` means reduce, normalize sign, and collapse to `Int` per **ND-005**. Per
**ND-004** the **divisor's rung alone** decides exactness, so read this table by
column.

|         | Int  | Dec     | Rat  | Num | Seq |
| ------- | ---- | ------- | ---- | --- | --- |
| **Int** | Rat↓ | **Num** | Rat↓ | Num | err |
| **Dec** | Rat↓ | **Num** | Rat↓ | Num | err |
| **Rat** | Rat↓ | **Num** | Rat↓ | Num | err |
| **Num** | Num  | **Num** | Num  | Num | err |
| **Seq** | err  | err     | err  | err | err |

The entire `Dec` column is inexact **by policy** (ND-004), not because an exact
answer is out of reach — `1.5 / 2.5` is exactly `3/5`. Dividing by a decimal is
read as a signal that the program has left exact bookkeeping, so the result is
honestly a `FrameNumber` rather than a ratio that implies more precision than
the divisor's spelling claims. The dividend does not enter into it: `1 / 3.0` is
as inexact as `1.0 / 3.0`.

Division **by** an `Int` or a `Rat` stays exact whatever the dividend, so
`10.50 / 2` is exact — its divisor is a count, not a measurement. That is also
the escape hatch: see **Q2** for both directions.

Division is the only one of the four operators whose result depends on which
operand is which, which is fitting, since it is also the only non-commutative
one.

Two consequences to accept knowingly:

- **Exactness is lost where it was arithmetically available.** `0.3 / 0.1`
  yields `2.9999999999999996` rather than `3`.
- **`Decimal ÷ Int` does not stay decimal-shaped.** `10.50 / 2` gives the ratio
  `21/4`, not `5.25`. Exact, but not a decimal.

The compensation is that this makes `FrameNumber` reachable from ordinary
source, which resolves **Q2**.

### 5.3 Exponentiation

`**` is already live — `lib/ops.ts:39` maps it to `Power` in `math.ts:38`, gated
on both operands being `FrameNumber`.

Note the spelling: exponentiation is `**`. Bare `^` is **not** exponentiation in
HC — `lib/ops.ts:50` binds it to `BindType`.

Per **ND-007** the result stays exact except for a fractional exponent, because
`**` is the only operator that can escape the rationals entirely: `2 ** 1.5` is
irrational, so no exact frame can hold it. Two host facts constrain any
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

Ordering and equality differ in their `Seq` handling, so they need separate
grids. `exact` means cross-multiplied and total; `float` means host comparison,
non-total because `NaN` fails all four orderings; `struct` means segment-wise.

Ordering — `<`, `<=`, `>`, `>=`:

|         | Int   | Dec   | Rat   | Num   | Seq |
| ------- | ----- | ----- | ----- | ----- | --- |
| **Int** | exact | exact | exact | float | err |
| **Dec** | exact | exact | exact | float | err |
| **Rat** | exact | exact | exact | float | err |
| **Num** | float | float | float | float | err |
| **Seq** | err   | err   | err   | err   | err |

Equality — `=` (see **Q3** for how `==` and `===` differ):

|         | Int   | Dec   | Rat   | Num   | Seq    |
| ------- | ----- | ----- | ----- | ----- | ------ |
| **Int** | exact | exact | exact | float | nil    |
| **Dec** | exact | exact | exact | float | nil    |
| **Rat** | exact | exact | exact | float | nil    |
| **Num** | float | float | float | float | nil    |
| **Seq** | nil   | nil   | nil   | nil   | struct |

Sequences have no ordering, so `err` there is a genuine absence rather than a
type mismatch. They do have an identity, so equality answers `nil` instead.

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

## 6. Tensions and resolutions

All four are settled. T-3 and T-4 are accepted migrations rather than pure
resolutions, and T-4 carries a prerequisite.

### T-1 — Resolved: the divisor decides

_Closed on the divisor's rung, recorded in **ND-004**. Rationale retained._

This section was revised twice. It first closed T-1 as fully uniform, which
over-generalized a decision taken only for `Decimal ÷ Int`. It then split the
single `Decimal ÷ Decimal` cell. The final rule is simpler than either: **the
divisor decides**, so the whole `Dec` column is inexact and `Int ÷ Dec` goes
with it. That also dissolves **Q6**, which existed only because the two-operand
formulation left `Int ÷ Dec` on the exact side by accident.

The intuition is that dividing a measured quantity by a count should stay a
measured quantity, and for exact cases it works: `10.50 / 2` is `5.25` in host
floats and exactly `1050/100 ÷ 2 = 525/100` in scaled form.

But the rule cannot be satisfied in general. `1.0 / 3` is one third, which has
no decimal representation at any scale. Honoring `Decimal ÷ Int → Decimal`
therefore requires choosing a precision and rounding, which reintroduces
inexactness behind a class that claims to be exact — the precise failure #355
exists to eliminate.

`Decimal ÷ Decimal → Number` is representable but loses cases that visibly
should be exact. Verified: `0.3 / 0.1` yields `2.9999999999999996` rather than
`3`, and `0.7 / 0.1` yields `6.999999999999999` rather than `7`.

There is also an asymmetry: every decimal _is_ a rational, so `Dec` and `Int`
have identical closure behavior. Splitting them means `1 / 3` is exact while
`1.0 / 3.0` is not, and the more precise-looking spelling yields the less
precise answer.

Three coherent resolutions:

1. **Uniform** — exact ÷ exact → `Rat↓`. Simplest, never lossy, but dividing
   `10.50` by `2` gives a ratio rather than `5.25`.
2. **Collapse one rung further** — compute in `Rat`, then collapse to `Dec` when
   the denominator is of the form `2^a·5^b`, else stay `Rat`. This satisfies the
   `5.25` intuition _and_ stays exact.
3. **As stated** — `Dec ÷ Int → Dec` with documented rounding. Exactness is
   lost, and the loss is hidden inside a nominally exact frame.

**Resolved on the divisor's rung — a fourth option none of the three named:**

- Divisor is a `Dec` → `FrameNumber`, whatever the dividend.
- Divisor is an `Int` or a `Rat` → `Rat↓`, whatever the dividend.

This keeps option (1)'s exactness wherever exactness is meaningful, and takes
option (3)'s inexact result only where the divisor is a measurement — but with
the imprecision **explicit in the result type** rather than concealed inside a
nominally exact frame. That concealment was the real objection to (3); a
`FrameNumber` makes no claim to exactness, so the objection does not apply.

The `0.3 / 0.1` imprecision noted above is still real. It now surfaces in the
result type, so no frame misrepresents its own precision.

Framing it on the divisor rather than on the operand pair is what removes the
arbitrariness. A two-operand rule had to answer why `1 / 3.0` should differ from
`1.0 / 3.0` when both divide by the same measured quantity; the one-operand rule
never raises the question.

ND-005 stands unmodified: `Rat` collapses only to `Int`, never to `Dec`. Option
(2) stays available later as a strict refinement rather than a reversal — the
`2^a·5^b` test is exactly the condition under which `Rat → Dec` collapse is
total and lossless — but it is not adopted now, and `1/3` renders as a ratio
either way.

Note that the `0.3 / 0.1` and `1.0 / 3` spellings used above are not yet
lexable; see #356.

### T-2 — Resolved into ND-007, accepted

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

This reversed a previously-taken decision and has been confirmed.

### T-3 — Accepted: restricting modulo is a behavioral regression

`%%` currently accepts any two `FrameNumber`, so decimal modulo works today.
**ND-006** narrows that to integers. If any existing program or test relies on
decimal modulo it will start returning an error frame, and #355's requirement
that "existing whole-number programs either retain behavior or have an explicit,
tested migration rule" makes this a documented migration rather than a silent
change.

Note the operator is `%%`; searching for affected programs by grepping `%` will
find nothing, since bare `%` is unbound.

### T-4 — Resolved: `err`, pending a definition of errors in conditionals

_Closed in favor of error frames. One prerequisite remains._

Every `err` cell in §5 changes existing behavior. All ten gated operators in
`lib/ops/math.ts` end with `return Frame.nil`, so a type mismatch is currently
silently empty. The truth tables replace that with an error frame across ten
operators at once.

**Resolved as `err`.** Silent `nil` on `1 + “text”` hides real mistakes, and
#355 already asks for descriptive error frames on unsupported numeric
combinations. ND-009 follows from this rather than needing a separate decision,
and §5.5's comparison exception is retained.

The prerequisite that blocked the other direction still has to be discharged:
`nil` is HC's normal absence value, so code that tests an arithmetic result for
falsiness will now see an error frame propagate instead. **How error frames
behave in conditional position must be defined before this is implemented.**
That is a language-level question wider than numerics, and it is the gating item
for the whole migration, not a detail of it.

Because this lands on #355's "retain behavior or provide an explicit, tested
migration rule," the migration needs its own tests: one per operator confirming
the mismatch path, plus coverage of the conditional behavior once defined.

Zero interacts here too. With #356 landed, tests can write `1 / 0` directly as
well as reach zero through computed operands, and both paths exercise ND-010's
stable error frames.

### Migration rules

#355 requires that existing programs "either retain behavior or have an
explicit, tested migration rule." Three behaviors change. The rules, so the
ticket does not have to reinvent them:

**M-1 — Division renders differently.** The largest user-visible change, and
previously unrecorded here. Verified today:

| Source  | Today | Under ND-004     |
| ------- | ----- | ---------------- |
| `1 / 2` | `0.5` | a ratio (**Q1**) |
| `3 / 2` | `1.5` | a ratio (**Q1**) |
| `4 / 2` | `2`   | `2`, unchanged   |

Exact division collapsing to `Int` is unaffected, so only non-integral results
move. Rule: every existing test asserting a decimal result from `/` is rewritten
to the ratio rendering, and each gains a companion asserting exactness that the
float form could not express.

Programs wanting the old output spell the **divisor** as a decimal — `1 / 2.0`
yields `0.5` per ND-004 — so the escape hatch needs no new syntax (**Q2**).

**M-2 — Modulo narrows to integers** (T-3). Rule: `%%` on any non-`Int` operand
returns an error frame. Migration is mechanical because the operator is rare;
`%%` — not `%` — is the string to search for.

**M-3 — Type mismatch returns an error instead of `nil`** (T-4). Rule: the ten
`return Frame.nil` fallbacks in `math.ts` become error frames naming the
operator and both operand rungs. Tests: one per operator asserting the mismatch
path, plus the conditional-position behavior once defined. This is the migration
blocked on the language-level prerequisite above, so it lands last of the three.

M-1 and M-2 can ship with the tower. M-3 cannot.

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
| `lib/ops/math.ts`                        | 10 gated operators, 20 expressions → one gate, per §5.0         |
| shared numeric base (new)                | the §5.0 four-step pipeline, ranks, and promotions              |
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

**The accessor is a new interface point, not an override.** `valueOf` is
declared only on `FrameNumber:85` — not on `Frame`, `MetaFrame`, or `FrameAtom`
— so nothing today obliges a frame to yield a scalar. The proposal:

```ts
/** The exact integer this frame denotes, or an error frame explaining why not. */
exactInt(max?: bigint): bigint | Frame;
```

- Declared on the shared numeric base, so `Int`, `Decimal`, and `Rational` all
  answer it and `FrameSequence` inherits the failing default (ND-009).
- Returns a `bigint`, never a `number`, so no conversion precedes the check.
- Returns an error frame — not `NaN`, not `null` — when the value is not an
  integer (`Decimal` with nonzero scale, `Rational` with denominator ≠ 1) or
  exceeds `max`.
- Callers narrow on the return type. `frame-bytes.ts` and
  `schema-bit-matcher.ts` each pass their own `max` and surface the error rather
  than re-deriving it.
- **Sign is the caller's business.** An earlier draft had `exactInt` reject
  values "negative where the caller forbids it," but the signature carries no
  way to say so, and the two callers disagree on the boundary anyway —
  `frame-bytes.ts` admits `0`, `schema-bit-matcher.ts` requires `> 0`. They each
  check the sign themselves after narrowing, which is correct; the accessor's
  contract is integrality and range only.

`valueOf()` stays as the lossy float projection for hosts that want one, which
is a different job and should not be the path a bit width travels.

### Interning is safe; two narrower hazards are not

`FrameNumber.for` memoizes instances in `protected static numbers`, keyed by
digit string (`frame-number.ts:26-31`).

**Sharing interned atoms is already sound**, and this document previously
overstated the risk. The copy-on-write architecture settled in #341 covers it:
`Frame.instanceCopy()` returns `this` because "atoms are immutable and closures
are shared bodies, so for them sharing is unobservable" (`frame.ts:398-407`),
and every successful symbol read takes its own projection through `value.copy()`
before re-parenting (`frame-symbol.ts:99-108`). A shared `3` cannot be
re-parented or annotated in place by one reader. `FrameAlias` and `BoundMethod`
return `$!.copy-on-write-boundary` where that would be violated.

Two narrower hazards do need attention, and neither is about mutability:

1. **A single static table on a shared base collides across rungs.** JavaScript
   statics are inherited, not per-subclass, so one `for()` on a shared numeric
   base gives `FrameInt` and `FrameDecimal` the same table. The key is a bare
   digit string with no class discriminator, so `Int 3` and a `Decimal` spelling
   of `3` would alias.\
   **Resolved by dropping the cache, not by partitioning it.** `FrameInt.for`
   allocates a fresh frame per call, so no table exists to collide; only
   `FrameNumber` keeps one. Integer interning is therefore gone from a path
   `iterators.ts` hits once per element. That is the right trade while the
   collision is the live risk, but it is a deliberate loss of sharing rather
   than the partitioning this section originally proposed.
2. **`copy()` is shallow, which `FrameSequence` breaks.** `Frame.copy()` is
   `Object.assign(clone, this)` plus fresh `meta`, `is`, and `id`
   (`frame.ts:388-396`). Primitive payloads — `bigint` numerator, `scale`,
   numerator/denominator pairs — are safe. An **array** of segments is not: the
   clone would share the array, while `instanceCopy()` returns `this` on the
   grounds that the frame is an immutable atom. `FrameSequence` must therefore
   store its segments as immutable spelling rather than a mutable array, or
   override `copy()`. Storing spelling is the better answer, since spelling is
   already the render path (§3).

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

`3.14“Hello”` currently throws a host `RangeError: Invalid array length` from
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
- Defining how error frames behave in conditional position. Required by **T-4**,
  but a language-level question wider than numerics. Filed as
  [#360](https://github.com/TheSwanFactory/hclang/issues/360). **This is the one
  item that still gates work in this document** — M-3 cannot ship until it is
  settled.

### Scope taken in, after the fact

Two items were written here as out-of-scope dependencies and then implemented
alongside the tower, because each is a hard prerequisite that no amount of
sequencing avoids:

- **Zero as a literal**
  ([#356](https://github.com/TheSwanFactory/hclang/issues/356)). Without it
  `0.5` cannot reach `FrameDecimal` and ND-010 cannot be tested from source.
  ND-001 now carries the rule.
- **Unary minus** ([#357](https://github.com/TheSwanFactory/hclang/issues/357)).
  Without it no negative value can be spelled, so **Q1**'s rendering could not
  round-trip and negative arithmetic could not be exercised directly.

Both landed without their own design pass, which is where **ND-013** (negative
decimals cannot climb to `Sequence`) and ND-006's now-observable sign convention
come from. Recorded so the sequence is not mistaken for scope creep, and so the
two consequences are not mistaken for defects in the tower.

## 9. Representation decisions

All six are settled. Q2 and Q6 were closed by consequences of other decisions
rather than answered directly, and Q3 is settled by deferral — this design
overrides `=` and inherits the rest from
[#358](https://github.com/TheSwanFactory/hclang/issues/358).

### Q1 — `FrameRational` renders with `/`

**Decided.** A rational renders as `numerator/denominator`, reusing the division
spelling.

- The sign is carried on the **numerator**; the denominator is always positive,
  which is what ND-004's "sign-normalized" means concretely.
- A denominator of 1 is never rendered, because ND-005 collapses that case to
  `FrameInt` before rendering is reached.
- Already-reduced, so `2/4` renders `1/2`.

The property that justifies reusing the operator: re-lexing `1/2` performs the
division again and lands on the same rational, so the rendering round-trips
semantically even though it is not a literal. The cost is that the rendering is
an expression rather than a literal, so it is not a self-evident atom.

**Negative rationals do not round-trip today.** `-1/2` cannot be read back, and
neither can `1/-2`, because unary minus does not exist — a leading `-` evaluates
to the module frame. Filed as
[#357](https://github.com/TheSwanFactory/hclang/issues/357). Until that lands,
`/` rendering round-trips for non-negative rationals only. This does not affect
the correctness of the values, only whether their rendering can be re-read.

### Q2 — Resolved by ND-004; no projection spelling needed

**Closed as a side effect.** `Dec ÷ Dec → FrameNumber` gives the inexact domain
an entry point from ordinary source, so `FrameNumber` is no longer nearly
unreachable and the `Num` rows in §5.1, §5.2, and §5.5 are live.

That also supplies **M-1**'s escape hatch without new syntax. A program that
wants `0.5` rather than `1/2` writes `1.0 / 2.0`.

#### Both escape hatches, and neither needs new syntax

Because ND-004 reads the divisor alone, the divisor's spelling is the control,
and it works in both directions:

| Want           | Spell the divisor as | Example       | Result |
| -------------- | -------------------- | ------------- | ------ |
| a float        | a decimal            | `1 / 2.0`     | `0.5`  |
| an exact ratio | an integer           | `1.5 / 3`     | `1/2`  |
| an exact ratio | a ratio              | `1.5 / (5/2)` | `3/5`  |

The second and third rows are the answer to "how do I get exactness out of
decimal operands," which ND-004's policy otherwise appears to foreclose. Since
every decimal is a rational, re-spelling a decimal divisor as a ratio loses
nothing: `2.5` and `5/2` denote the same value, and the latter keeps division
exact.

**Residual gap: divisors you do not spell.** The hatch is a spelling, so it is
only available where the divisor is written literally. A divisor that arrives as
a bound name or as a computed `Dec` — `x` holding `2.5` from data, then `y / x`
— cannot be re-spelled, and no expression converts it, so it is locked to `Num`.
Closing that would take one named `Dec → Rat` promotion, which is the identity
embedding §2's tower already asserts rather than new arithmetic. **Not adopted
now**, on the assumption that divisors are usually literal; recorded so it is
not re-litigated as an oversight.

A dedicated `.float` property is therefore **not** adopted. `valueOf()` remains
the host-facing projection and is not an HC-level operator; the HC-level path
into `FrameNumber` is decimal ÷ decimal, plus fractional `**` (ND-007) and the
host bridge (Q4).

### Q3 — `=` is exact; `==` and `===` are deferred to #358

**Decided: override `=` only. Inherit `==` and `===` untouched.**

`=` → `Equals`, `==` → `DataEquals`, `===` → `MetadataEquals` (`ops.ts:40-42`).
The three decompose the value: `=` compares `toString()`, which covers data and
metadata; `==` compares `dataString()`, the data plane; `===` compares the
metadata plane alone, ignoring data.

ND-008 overrides `=` to compare exact numeric values, because #355's acceptance
criteria require trustworthy exact equality. Nothing else changes:

| Expression  | After #355 | Source                        |
| ----------- | ---------- | ----------------------------- |
| `3 = 3.0`   | all        | ND-008, new                   |
| `3 == 3.0`  | nil        | inherited — spellings differ  |
| `3 === 3.0` | all        | inherited — both un-annotated |

The last two rows are **inherited, not intended.** An earlier draft of this
section gave `===` a rung check so `3 === 3.0` would be nil. That is withdrawn:
`metadataEquals` (`frame.ts:292-307`) ignores data entirely, so adding a rung
check would make it partly data-sensitive and change the operator's character on
the way past — a language-level decision that does not belong inside numeric
work.

The wider problem is real but separable, and is filed as
[#358](https://github.com/TheSwanFactory/hclang/issues/358): `===` is true for
**any** two frames without metadata, so `3 === 4`, `3 === “hello”`, and
`“a” === “b”` are all `all` today (verified). Whether that is the right
semantic, whether `===` deserves that spelling, and whether a "same value and
same type" predicate should exist are all settled there rather than here.

### Q4 — The host bridge preserves decimal integers

**Decided.** `make_context` routes Unicode decimal-digit strings
(`/^\p{Nd}+$/u`) to `FrameInt` while preserving their spelling. **Everything
else stays `FrameString`**, including `"1.5"` and numeric characters outside
`\p{Nd}` such as `Ⅻ`, `½`, and `²`.

This keeps the bridge from silently minting decimals, rationals, or approximate
values from environment input. A host string becomes numeric only where it is
unambiguously an exact integer.

An intermediate implementation routed `\p{N}`-but-not-`\p{Nd}` strings to
`FrameNumber` for compatibility, which produced `NaN`-backed numeric frames from
host input — the exact defect §5.5 says this design fixes. Corrected in
`407afc8`; see §11.3. Parsing such numerals into values (`½` really is a
rational) was considered and rejected as scope nobody asked for.

Note also that `FrameInt` normalizes non-ASCII digits on arithmetic and lookup
while retaining the original spelling, so `١٢٣` renders `١٢٣` but `١٢٣.5`
renders `123.5`. Recorded, not resolved.

### Q5 — Repetition and exact-power ceilings bound work, not range

**Decided.** Three limits, all bounding work and allocation rather than what a
value may represent. Exceeding any returns a stable error frame before the
result is constructed.

| Limit                     | Value          | Guards                             |
| ------------------------- | -------------- | ---------------------------------- |
| `REPETITION_LIMIT`        | 65536          | applications performed by `apply`  |
| `REPETITION_TEXT_LIMIT`   | 1000000 UTF-16 | size of a repetition's text result |
| `EXACT_POWER_BIT_LIMIT`   | 1000000 bits   | estimated width of an exact `**`   |
| `EXACT_POWER_SCALE_LIMIT` | 301029 digits  | scale growth of an exact `Dec **`  |

The third **narrows ND-007**: `2 ** 1000000` returns
`$!.numeric-range ** FrameInt` rather than an exact `bigint`, so "`**` stays
exact where an exact answer exists" holds only within the bit budget. #355's
criterion that arithmetic stay exact beyond `Number.MAX_SAFE_INTEGER` is
satisfied — the budget is far above that — but it is a bound on an
acceptance-criterion path and belongs on the record.

The fourth guards unbounded scale growth in `FrameDecimal.powerIntegral`. Its
value is the bit budget expressed in decimal digits (`10^6 × log10 2`), so the
two `**` bounds are the same budget in two units rather than two budgets. An
intermediate implementation compared the scale against the bit constant
directly, leaving the decimal bound about 3.3× looser; corrected in `407afc8`,
see §11.4.

### Q6 — Dissolved: `Int ÷ Dec` is inexact like the rest of the column

Raised here rather than in review. The two-operand formulation of ND-004
("except decimal ÷ decimal") left `Int ÷ Dec` on the exact side by accident,
making `1 / 3.0` exact while `1.0 / 3.0` was not — an asymmetry with no
justification behind it.

**Resolved by restating ND-004 on the divisor alone.** Division by a decimal is
inexact regardless of the dividend, so the whole `Dec` column is `Num` and the
question does not arise. The rule got shorter in the process, which is the usual
sign it was the right cut.

## 10. Revisions

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
| Zero's old blob routing conflicted with numeric zero                      | ND-001, ND-010    |
| T-1 option (2) refines ND-005 rather than contradicting it                | T-1               |
| T-2 should supersede ND-007 rather than sit in tension with it            | ND-007, T-2       |
| Overreaching claim that arithmetic never produces `FrameNumber`           | §5.5              |

Corrections not adopted: none. One correction was narrowed — `Frame.error` is
defined at `frame.ts:110`; `frame-scope-anchor.ts:172` is a call site.

### Second pass — tensions resolved

| Item      | Resolution                                                          |
| --------- | ------------------------------------------------------------------- |
| **T-1**   | Option (1), uniform — _superseded by the fourth pass below._        |
| **T-2**   | ND-007's narrow rule accepted.                                      |
| **T-4**   | `err` accepted; blocked on defining errors in conditional position. |
| Interning | Overstated. #341's copy-on-write already makes shared atoms sound.  |
| Zero      | Filed as #356 after testing found three host crashes.               |

The interning correction came from asking whether immutability and copy-on-write
had already settled the question. They had. Re-checking turned up the two real
hazards — inherited statics and `copy()`'s shallow `Object.assign` — which are
mechanical rather than architectural.

### Third pass — representation

| Gap                                              | Resolution                       |
| ------------------------------------------------ | -------------------------------- |
| Computed values have no source text              | §3 synthesis rules; **Q1** open  |
| `FrameRational` rendering undefined              | **Q1**                           |
| `FrameNumber` unreachable as a frame             | **Q2**                           |
| `=` and `==` will silently disagree              | **Q3**                           |
| §5.5 had no grid                                 | two grids, ordering vs equality  |
| ND-011's bound had no bound                      | 65536 proposed; **Q5**           |
| Exact accessor unnamed, and not on `Frame`       | `exactInt(max?)` specified in §7 |
| T-3/T-4 migrations unwritten                     | M-1, M-2, M-3 in §6              |
| `FrameSequence` non-arithmetic surface undefined | ND-009 expanded                  |
| `hc-eval.ts` routing undecided                   | **Q4**                           |
| #293 listed as if live                           | it is closed; relabeled          |

Two gaps surfaced from testing rather than from review. `1 / 2` renders `0.5`
today, making ND-004 a user-visible migration that had gone unrecorded — now
**M-1**. And `-1` does not lex, so no negative literal exists and synthesized
negative spellings cannot be read back, which constrains **Q1** before any
rendering is chosen.

### Fourth pass — questions answered

| Question | Answer                                                            |
| -------- | ----------------------------------------------------------------- |
| **Q1**   | `numerator/denominator`, reusing `/`. Sign on the numerator.      |
| **Q2**   | Closed by ND-004; no `.float` needed, so no new syntax.           |
| **Q3**   | `===` gains a rung check — _withdrawn in the fifth pass._         |
| **Q4**   | Unicode decimal strings become exact `FrameInt` values.           |
| **Q5**   | 65536 operations, 1000000 UTF-16 units, 1000000 exact-power bits. |
| **Q6**   | New. `Int ÷ Dec` exact — _dissolved in the fifth pass._           |

**A correction to the third pass.** T-1 had been closed as fully uniform
division. That over-generalized: the decision taken covered `Decimal ÷ Int`, and
`Decimal ÷ Decimal` was settled separately as `FrameNumber`. ND-004, §5.2, and
T-1 now carry the split rule.

That correction had a useful side effect. Giving `Dec ÷ Dec` an inexact result
made `FrameNumber` reachable from ordinary source, which closed **Q2** without a
projection spelling and gave **M-1** an escape hatch for free. The two questions
turned out to be one.

Testing `-1 / 2` for **Q1** found that unary minus is missing entirely — a
leading `-` evaluates to the module frame rather than negating or erroring —
which became #357.

### Fifth pass — simplification

Two changes, both of which removed material rather than adding it.

**ND-004 now tests the divisor alone.** "Exact except decimal ÷ decimal" became
"division by a decimal is inexact." The whole `Dec` column of §5.2 is `Num`,
which dissolves **Q6** — the asymmetry it recorded existed only because a
two-operand rule had to place `Int ÷ Dec` somewhere, and it landed on the exact
side by accident. The one-operand rule never raises the question, and it reads
better: dividing by a decimal signals non-trivial math, whatever the dividend.

**Equality is deferred entirely to
[#358](https://github.com/TheSwanFactory/hclang/issues/358).** The `===` rung
check from the fourth pass is withdrawn. This design now overrides `=` and
inherits `==` and `===` untouched, so no operator changes character as a side
effect of numeric work. Testing for the issue confirmed the semantics are
shakier than described: `3 === 4`, `3 === “hello”`, and `“a” === “b”` are all
`all`, because `===` compares only the metadata plane and two un-annotated
frames match trivially.

Both changes reduce this design's surface. Nothing in it is now a best guess.

### Sixth pass — dispatch and notation

**§5.0 added.** Cross-rung dispatch was never specified, which left the central
implementation mechanism to the reader: today's signatures are same-class
(`add(right: FrameNumber)`) while §5.1 requires `Int + Dec → Dec` across five
classes. Specified as rank-based promotion — reject, promote to `max(rank)`,
operate at that rank, canonicalize — with double dispatch and a static join
table considered and rejected. The consequence worth noting is that §5.1's table
stops being a specification of code and becomes a description of the promotion
step; `+ - *` need no per-cell logic at all.

Writing it out surfaced one hazard not previously recorded: `Rat → Num` is the
only lossy promotion, and converting each `bigint` separately before dividing
can reach `Infinity` on both sides, so a rational well within float range can
project to `NaN`. The ratio has to be scaled before conversion.

**Notation corrected throughout.** Examples had been written `(2 .2)`, which is
only safe inside explicit grouping — `1 .1 + 2 .2` evaluates to `3.1.2`, because
`+ 2` binds before the trailing `.2`. Every example now uses the unspaced `2.2`
form, which groups correctly, and §1 records the discrepancy.

Testing zero rather than reasoning about it changed its priority from cleanup to
dependency: `00`, `01`, and `0123` raise host `RangeError`s, `0` renders as
`0x0`, `1 + 0` is silently nil, and `0.5` reports `name-missing`, so no decimal
below one can be written at all.

## 11. Implementation delta

The tower was built on branch `355-rationalizing-numbers`. Sections 1–10 are the
design; this section is what differs, verified against the code rather than
inferred from it. The design held: the five frames, §5.0's rank dispatch, both
matrices of §5.1 and §5.2, ND-002 through ND-012, Q1 through Q6, and M-1 and M-2
are all implemented as specified, with 4×4 matrix coverage per operator.

Because design and implementation share one branch, five sections — ND-001,
ND-010, T-4's zero paragraph, Q4, and Q5 — were **edited after the fact to
describe what had been built**. They read as decisions but were descriptions.
Each is flagged in place, and the substantive consequences are below.

### 11.1 M-3 is not shipped; it is #361, blocked by #360

`lib/ops/math.ts` still ends its single numeric gate with `: Frame.nil`, so
`1 + “text”` evaluates to nil rather than an error frame naming the operator and
rungs. A test locks this in
(`preserves nil for arbitrary nonnumeric operator
mismatches`).

**The code is correct against this design.** T-4 says M-3 lands last and cannot
ship with the tower. Two things follow that are not code problems:

- #355's acceptance criterion "return descriptive HC error frames for …
  unsupported numeric combinations" is **half met**: a `FrameSequence` operand
  errors (`$!.numeric-domain + FrameSequence FrameInt`), a non-numeric operand
  still returns nil. Recorded in #359's own description as a carve-out.
- T-4's prerequisite — how error frames behave in conditional position — is
  filed as [#360](https://github.com/TheSwanFactory/hclang/issues/360), reframed
  there as the single question "could `?:` be extended for error detection and
  recovery?" It is the only thing gating M-3.
- **M-3 itself is filed as
  [#361](https://github.com/TheSwanFactory/hclang/issues/361)**, blocked by
  #360. It also records the narrower framing this section arrived at: the gap is
  not that mismatch is untyped, but that a non-`FrameNumeric` operand returns
  nil where a `FrameSequence` operand already errors through
  `FrameNumeric.operationError`. Reusing that vocabulary — so `1 + “text”` gives
  `$!.numeric-domain + FrameInt FrameString` — needs no new message design.

Investigating for #360 found that **the semantics largely already exist**, in a
form T-4 did not anticipate. Error frames never reach `?` or `:`, because
`FrameExpr` short-circuits expression reduction on a failed term
(`lib/frames/frame-expr.ts:83-89`). An error in the left position becomes the
result of the whole expression, and no branch runs in either direction:

```
(1 / 0) ? {“then”}              => $!.division-by-zero /
(1 / 0) : {“else”}              => $!.division-by-zero /
(1 / 0) ? {“then”} : {“else”}   => $!.division-by-zero /
```

That is probably the right rule — an error is not a truth value — but it is
emergent from `isFailedResult()` rather than written down, and `IfThen` tests
only `source !== Frame.nil` (`lib/ops/conditionals.ts`), which would make an
error frame **truthy** if the short-circuit ever stopped firing first. Two
mechanisms, opposite answers.

It also relocates M-3's risk. The regression is in the `nil` path M-3 replaces,
not the error path: `(1 + “text”) : {“else”}` runs its branch today because the
result is nil, and after M-3 it would not. Programs using `:` as a fallback for
a failed computation are the ones that change behavior, and they are what M-3's
migration tests need to cover.

### 11.2 Zero-led integers have two spellings for one value

Follows from #356's routing (ND-001). `0123` renders `0123`, `00` renders `00`,
while `0123 = 123` and `00 = 0` hold and `0123 + 1` canonicalizes to `124`. Also
`01b` now resolves to `$!.name-missing` where it was previously a blob.

Exactness is unaffected — ND-008 compares values — but `==` is spelling-based,
so the two spellings are distinguishable there.

**Ruled in `325fdf4`: preserved deliberately, and asserted in the acceptance
testdoc** (`cli/hc/numerics.hc`) as `0123 = 123` → `<>` and `0123 == 123` →
`()`. Reasoning in §11.8. Putting it in the testdoc rather than a unit test is
the right home, since it is a statement about the language's surface rather than
about a class.

### 11.3 The host bridge minted `NaN`-backed numeric frames — fixed

**Fixed in `407afc8`.** The middle branch is gone: `make_context` now routes
`/^\p{Nd}+$/u` to `FrameInt` and everything else to `FrameString`, so `Ⅻ`, `½`,
and `²` arrive as strings. Q4's text is updated accordingly. The original
finding follows, for the record.

`make_context` splits `Frame.isInteger` into three branches: `/^\p{Nd}+$/u` →
`FrameInt`, `\p{N}`-but-not-`\p{Nd}` → `FrameNumber.fromHost`, everything else →
`FrameString`. The middle branch is the problem:

| Entry | Frame         | Renders | `Number(valueOf())` |
| ----- | ------------- | ------- | ------------------- |
| `123` | `FrameInt`    | `123`   | 123                 |
| `Ⅻ`   | `FrameNumber` | `Ⅻ`     | **NaN**             |
| `½`   | `FrameNumber` | `½`     | **NaN**             |
| `²`   | `FrameNumber` | `²`     | **NaN**             |

So `$$.roman + 1` is `NaN` and `$$.roman = $$.roman` is nil — the precise defect
§5.5 says this design fixes, reachable from environment input. A change here was
unavoidable, since `FrameInt` throws on non-`Nd` numerals, but `FrameString` was
the available fallback and is what Q4's rationale argues for: the bridge should
not mint numeric values it cannot compute with.

Separately, `FrameInt` retains non-ASCII spelling but normalizes on lookup, so
`١٢٣` renders `١٢٣` while `١٢٣.5` renders `123.5`.

### 11.4 `EXACT_POWER_BIT_LIMIT` compared digits to bits — fixed

**Fixed in `407afc8`.** `FrameDecimal.powerIntegral` now tests
`scale × exponent` against `EXACT_POWER_SCALE_LIMIT = 301_029`, the bit budget
converted into decimal digits (`10^6 × log10 2`) rather than reused as one. That
closes the ~3.3× discrepancy exactly rather than approximately, and the constant
now names what it measures.

### 11.5 `%%` inherited host truncated results — fixed

**Fixed in `325fdf4`.** `FrameInt.moduloSame` adds the divisor when the
remainder is nonzero and its sign differs from the divisor's, so `%%` is now
floored:

| Expression | Was | Now |
| ---------- | --- | --- |
| `7 %% 3`   | 1   | 1   |
| `-7 %% 3`  | -1  | 2   |
| `7 %% -3`  | 1   | -2  |
| `-7 %% -3` | -1  | -1  |

Reasoning in §11.8. All four sign combinations are tested, plus the
exact-division cases `-6 %% 3` and `6 %% -3`, which the nonzero guard exists to
hold at `0` rather than shifting to `3` and `-3`.

### 11.6 `FrameSequence.valueOf()` was inherited, so failure was silent — fixed

**Fixed in `407afc8`**, and the resolution is better than the ruling asked for.
The override returns `$!.numeric-domain projection FrameSequence` rather than
throwing, which keeps the failure explicit and inspectable without making host
code crash on a value that merely has no scalar form.

One residual, worth knowing rather than fixing: `valueOf` is contractually
host-facing, so a host that ignores the return and calls `Number(...)` on it
still gets `NaN` — now from an error frame instead of from a sequence. The fix
delivers explicitness, not prevention. That is the right trade, because every
HC-level path reaches `exactInt` instead, which returns
`$!.exact-integer-required
FrameSequence`.

### 11.7 ND-013's error text named the wrong operation — fixed

**Fixed in `407afc8`**, and it drew a distinction the finding missed.
`Decimal.lookup_here` on a negative receiver now returns
`$!.numeric-domain property FrameDecimal`, naming the lookup. Negating an
existing sequence keeps `$!.numeric-domain unary- FrameSequence`, which is a
genuinely different rejection. So `-1.2.3` and `-(1.2.3)` now report distinct
causes rather than sharing one misleading message.

### 11.8 Rulings

Every open item above is decided. Four are code changes, listed with the section
that describes them; the rest are rulings that need a line of documentation and
a test rather than a fix.

| Item                       | Ruling                                                      |
| -------------------------- | ----------------------------------------------------------- |
| Error propagation (§11.1)  | **Ratified.** Errors are terminal and never reach `?` / `:` |
| Error detection (§11.1)    | **Deferred to #360**, reframed as one question              |
| M-3 (§11.1)                | **Filed as #361**, blocked by #360                          |
| Host bridge (§11.3)        | Route non-`\p{Nd}` to `FrameString` — **done**, `407afc8`   |
| Scale limit (§11.4)        | Separate scale constant — **done**, `407afc8`               |
| Error text (§11.7)         | Name the lookup, not `unary-` — **done**, `407afc8`         |
| `Sequence.valueOf` (§11.6) | Error frame rather than a throw — **done**, `407afc8`       |
| Modulo sign (§11.5)        | Adopt floored, not host truncated — **done**, `325fdf4`     |
| Zero-led spelling (§11.2)  | Preserved deliberately, tested — **done**, `325fdf4`        |

**Nothing in this section is open.** Every item is either fixed or filed: #360
for error detection, #361 for M-3 behind it.

Three of these need their reasoning on the record.

**Error detection and the conditional operators are one question.** An earlier
draft of this section treated "can a failure be tested" and "`conditionals.ts`
encodes the opposite answer" as two items. They are not. `IfThen` tests
`source !== Frame.nil`, so an error frame is **truthy** under it — the reverse
of what the short-circuit produces. Any change that lets a program detect a
failure is a change to what the conditional operators distinguish, and any
reconciliation of `conditionals.ts` has to say what an error means there. #360
asks the single question: **could `?:` be extended for error detection and
recovery?** Until it is answered, errors stay terminal, which is the status quo
and is safe.

**Modulo adopts the floored convention**, changing `-7 %% 3` from `-1` to `2`
and `7 %% -3` from `1` to `-2`. The usual argument for truncated modulo is that
it satisfies `a = (a / n) × n + (a %% n)` alongside truncating integer division
— but **HC has no truncating integer division.** ND-004 makes `7 / 3` an exact
rational, so the identity that motivates truncated semantics does not exist in
this language, and the reason to inherit the host's convention goes with it.
Floored leaves `a %% n` always signed like `n` and always a proper residue,
which is what wrapping, indexing, and clock arithmetic want. The migration cost
is approximately zero: `%%` is a new surface with no negative-operand users,
which is precisely why the moment to choose is now rather than after it has any.

**Zero-led spelling is preserved, not normalized.** `0123` and `123` denote one
value with two spellings, distinguishable through `==`. That is the same fact as
`3 == 3.0` being nil, which ND-008 and Q3 already accept: `=` is exact, `==` is
the data plane, and the data plane is spelling. Normalizing integer spelling
would buy consistency in `==` at the cost of the spelling-preservation principle
§3 is built on, and would still leave `3` and `3.0` distinct. Not worth it.
Asserted in the acceptance testdoc so the asymmetry is intentional rather than
incidental.

### 11.9 Not from this PR

`0sQUJD` throws `Cannot convert 0sQUJD to a BigInt` from `frame-blob.ts` on
`master` as well, while `GRAMMAR.md` still documents `0s…` base64. Pre-existing;
noted so it is not attributed to the tower.
