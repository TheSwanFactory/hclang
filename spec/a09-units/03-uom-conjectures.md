# Units of Measure: Two Rung Restrictions Under Test

**Status:** Conjectures under test — neither is adopted, proposed, or preferred\
**Inputs:** [02-uom-lessons.md](02-uom-lessons.md),
[#362](https://github.com/TheSwanFactory/hclang/issues/362),
[a08](../a08-rationalizing-numbers.md)\
**Verified against:** `v0.12.0`, by evaluating the expressions shown and reading
the cited sources

## What this document is

Two proposals arrived as questions: what if only one rung of the numeric tower
could carry a unit? This records what each restriction would dissolve, what it
would break, and what it would newly require.

Both are examined, neither is endorsed. Where a consequence looks fatal it is
reported as a consequence, not as grounds for rejecting the conjecture — the
purpose is to know the shape of the trade before anything is decided.

Every behavioural claim below was run rather than reasoned. Expression outputs
are as observed at `v0.12.0`.

## Facts both conjectures rest on

Established by reading `lib/frames/` and confirmed by evaluation:

- **Neither candidate rung has a source spelling.** a08 makes rationals and
  inexact numbers computed values rather than literal families. In production
  code `FrameNumber` is constructed only from `inexactResult` and `promoteOne`;
  its one spelling-preserving entry point, `FrameNumber.fromHost`, has no
  remaining production caller after a08 §11.3 routed host values to `FrameInt`
  or `FrameString`. `FrameRational` is reachable only through division and
  negative exponentiation.
- **`%%` and repetition are already closed to both**, so two rows of any
  per-operator dimensional table never arise under either restriction:

  ```
  (1 / 2)“Hi”        => $!.repetition-domain FrameRational
  (1 / 2.0)“Hi”      => $!.repetition-domain FrameNumber
  (1 / 2) %% 2       => $!.numeric-domain %% FrameRational FrameInt
  (1 / 2.0) %% 2     => $!.numeric-domain %% FrameNumber FrameInt
  ```
- **The inexact door is one-way, and nothing reopens it.** Searching `lib/` for
  `exactify`, `rationalize`, `toRational`, and `fromNumber` finds nothing.
  `promoteOne` moves upward only, which ND-004 and T-1 made a principle rather
  than an omission.
- **`=` compares value across rungs; `==` compares spelling.** `(1 / 2) = 0.5`
  is `<>` and `(1 / 2) == 0.5` is `()`.

## Conjecture A — units only on `FrameNumber`

The inexact rung, rank 3, top of a forward-only ladder.

### What it dissolves

**The normalization-versus-spelling conflict (L3), completely.** `FrameNumber`
carries a synthesized spelling (`this.data.toString()`) rather than a user's
source text, so normalizing a dimensioned value to a base unit — the `uom`
choice that collides with a08 §3 everywhere else — costs nothing the spelling
principle protects.

**Most of the rank-times-dimension matrix.** Rank 3 sits at the top of the
ladder, so every mixed operation promotes into it. Instead of dimension crossed
with four rungs there are two cases: dimensioned against dimensioned, and
dimensioned against a scalar that promotes.

**Migration risk against the shipped tower, entirely.** Every example in
`cli/hc/numerics.hc` lives on rungs that would never carry a unit.

### What it does not dissolve

Spelling still needs an answer, but the question narrows: with no literal family
on the rung, there is no dimensioned literal to design, only a constructor. The
three equality planes still need a meaning each, and comparison on this rung is
already non-total — `compareSame` returns `null` when either operand is `NaN`.
Mismatch reporting is still required, though `FrameNumeric.operationError` is in
reach.

### What it creates

**Dimensioned arithmetic becomes inexact by construction.** No dimensioned
quantity could ever be exact. Currency is the counterexample: `0.10 USD` plus
`0.20 USD` would be host floating point, failing in the way `1/3 + 1/3 + 1/3`
failed before #355. Physical measurement is indifferent; money, byte counts, and
piece counts are not.

**It inverts a08 §5.5**, which argues against producing a `FrameNumber` from
exact operands. Attaching a unit to `3` does exactly that, so the restriction
needs an explicit ruling that declaring a measurement is itself the entry into
inexactness. That framing is continuous with T-1's language, where a decimal
divisor is inexact because it is "a measurement, not a count" — but it is a
ruling, not a consequence.

**One implementation hazard.** `FrameNumber.for` interns by numeric value alone.
It is dormant in production today, but the cache would return one instance for a
kilogram and a metre if units rode on instances.

## Conjecture B — units only on `FrameRational`, with inexactness unsafe

The exact ratio rung, rank 2, with the stated intent that `FrameNumber` is
unsafe and must be converted in and out.

### The structural obstacle

`FrameRational.create` returns a `FrameInt` when the reduced denominator is 1,
and every rational operator routes through it. Observed:

```
(3 / 2) + (1 / 2)   => 2
(1 / 3) 3           => 1
(1 / 2) 2           => 1
(4 / 2) == 2        => <>
```

So the rung is not closed under its own arithmetic. Two consequences:

- A dimensioned value loses its rung — and so its unit — exactly when a
  computation comes out even.
- No dimensioned value can have an integral magnitude. `1 m`, `100 kg`, and
  `3 USD` all reduce to denominator 1, so they are `FrameInt` and cannot be
  dimensioned at all.

The available repair is to let a unit-bearing rational retain denominator 1.
That gives up the canonical-rung invariant `create` currently enforces, and
recreates a08 §11.2's situation on a new axis: `2/1` and `2` become two
spellings of one value, separated by `==`.

### Rendering

Decimal is the notation measurements are written in, and `FrameDecimal` is
excluded by hypothesis. Reaching the rational rung requires division, and the
result presents as a ratio:

```
98 / 10   => 49/5
```

So an acceleration would present as `49/5` rather than `9.8`. Conjecture A
renders in decimal notation, since `FrameNumber` renders its host value.

Selection is also worth noting: if the motivating principle is that units belong
where arithmetic is exact, the exact set is `Int`, `Dec`, and `Rat`. Choosing
`Rat` alone excludes an exact rung that has a source spelling while including
one that has none, so exactness is not what singles it out.

### What it does better than A

**Conversion factors are exact and stay exact:**

```
254 / 100        => 127/50
(127 / 50) 100   => 254
```

One inch is exactly `127/50` centimetres, and conversion arithmetic does not
drift. Under Conjecture A every conversion is host floating point.

**Comparison is exact and total.** `compareSame` cross-multiplies with no `NaN`
branch, so dimensioned ordering would be total — the defect a08 §5.5 attributes
specifically to `FrameNumber` participation.

**Rational dimension exponents have an exact home** in the same class, if
exponents are rational.

### What it newly requires

An inexact-to-exact re-entry primitive, which does not exist and was
deliberately not built. It also needs a precision policy — continued fractions,
decimal truncation, or a caller-supplied denominator — and the round trip is
lossy in one direction. That relocates the concealment §5.2 objected to from
inside an operator to an explicit call site; whether relocation is sufficient is
the open question this conjecture raises.

### Equality across the boundary

`(1 / 2) = 0.5` is `<>`, so a dimensioned rational would compare equal by value
to an undimensioned decimal. The asymmetry is new: the two operands are on
different rungs and only one of them is permitted to hold a unit.

## Side by side

| Property                           | A — `FrameNumber` | B — `FrameRational`                  |
| ---------------------------------- | ----------------- | ------------------------------------ |
| Rung closed under its arithmetic   | Yes               | No — collapses to `FrameInt`         |
| Integral magnitudes representable  | Yes               | No, unless the collapse is abandoned |
| Dimensioned arithmetic exact       | No                | Yes                                  |
| Conversion factors exact           | No                | Yes                                  |
| Comparison total                   | No — `NaN`        | Yes                                  |
| Presentation of a measurement      | decimal-like      | ratio                                |
| New primitive required             | No                | Yes — inexact-to-exact re-entry      |
| Source spelling question           | Open              | Open                                 |
| Kind, affine, vocabulary, boundary | Untouched         | Untouched                            |

## What the pair establishes

Neither restriction touches the semantic axes of
[02-uom-lessons.md](02-uom-lessons.md): dimension versus kind, affine units, the
vocabulary and its scoping, or the host boundary. Both leave the spelling
question open, because both put units on a rung with no literal form, so a
constructor is required either way.

What differs is only which failure is accepted: dimensioned arithmetic that is
never exact, or dimensioned values that vanish when a result comes out even.
Nothing here selects between them, and neither exhausts the space — the exact
rungs as a set, and mechanisms outside the tower entirely, remain unexamined.
