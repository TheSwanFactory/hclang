# Units of Measure: Design Considerations

**Status:** Analysis only — no design, no recommendation\
**Inputs:** [01-uom-survey.md](01-uom-survey.md),
[#362](https://github.com/TheSwanFactory/hclang/issues/362),
[a08](../a08-rationalizing-numbers.md)

## What this document is

The survey records what other systems do. This one records which of those facts
bear on a decision HC would have to make, and what each prior-art choice cost
the system that made it.

It selects and frames; it does not answer. No mechanism, spelling, frame, or
operator is proposed, and no option is preferred. Where an HC fact is cited it
is cited as a constraint the decision runs into, not as an argument for a
direction.

## L1 — The algebra is settled; the representation of it is not

Every system surveyed agrees that units form a free abelian group over base
units, and that dimension exponents may be rational rather than integral. So the
open question is never "what is the algebra" but "where do the exponents live
and what may they be."

Two consequences follow for any HC discussion:

- The exponent domain is a decision, not a detail. Integer-only exponents forbid
  `m^(1/2)`; rational exponents admit it and require exact rational storage.
- Systems that put units in types need the exponent of an exponentiation to be
  statically known, because the result's dimension depends on it. HC decides
  everything during evaluation, so that particular restriction does not arise —
  which means the question `x ** n` raises in HC is not "is this checkable" but
  "what dimension does the result have when `n` is `1/2`, or inexact."

## L2 — Where the unit lives decides which prior art transfers

The survey's Axis 1 split is not one option among eight; it decides the rest.
Systems that put units in types solved the literal-spelling problem by not
having one — the unit is an annotation on a type, not a token beside a number.
Systems that put units in values had to put units into the lexer (Frink) or into
an explicit construction call (pint).

HC has no separate type-checking phase. That does not make either family
inapplicable, but it does mean the type-based examples' answers to spelling,
error reporting, and erasure were reached under an assumption HC does not share.
Borrowing their conclusions without their premise is the specific mistake
available here.

## L3 — Normalization and spelling preservation are in direct conflict

`uom` converts to a base unit on construction, after which the unit the caller
wrote is no longer part of the value. That is the mainstream choice among typed
libraries, and it is cheap for them because the type still records the
dimension.

a08 §3 is built on the opposite principle: the source spelling is retained,
which is why `0123` and `123` are one value with two spellings, and why `==` is
the spelling plane. The two principles pull in opposite directions on the same
values, so a units discussion has to say which one gives way and where.

The prior art shows the two ends rather than a synthesis: normalize on
construction and lose the spelling, or reify the unit and carry both the number
and the way it was written.

## L4 — Dimension is not the same as kind, and the gap is expensive

mp-units' central claim is that dimensional analysis alone does not catch
confusing frequency with radioactive activity, absorbed dose with dose
equivalent, or plane angle with solid angle. Torque and energy are the classical
example: identical dimensions, different quantities.

Two things follow. First, a scheme keyed on dimensions alone is not merely
incomplete, it is silently incomplete in exactly the cases users report. Second,
closing the gap has cost the C++ committee multiple revisions of its
mathematical model — this is not a small addition on top of dimensional
checking.

## L5 — Affine units are a separate case everywhere

No surveyed system treats °C or °F as an ordinary unit. Boost.Units wraps them,
pint classifies them as non-multiplicative, provides separate `delta_` units for
differences, and raises on ambiguous arithmetic rather than guessing.

So "units are factors" is a simplification that fails at temperature, and the
failure is not exotic: subtracting two temperatures and scaling a temperature
difference are ordinary operations with different meanings.

## L6 — The vocabulary already exists as data, which makes it a scoping question

UCUM and QUDT are maintained outside any language; pint's registry and Frink's
units file are editable data. So the question is not whether HC would have to
invent unit names, factors, and dimensions — it would not.

What that leaves is a question HC has already had to answer for other things: if
the unit table is an HC value, then `$` and `$$` (#349) determine which table is
in scope, and two files can define the same symbol differently. If it is not an
HC value, the table is privileged in a way HC's congram argument resists. Both
directions have precedent in the survey.

## L7 — Equality is one question in the prior art and three in HC

Typed systems answer unit equality at the type level: two quantities either have
the same type or do not. Runtime systems answer it at conversion time. Neither
faces HC's situation, where `=`, `==`, and `===` are three separate planes and
a08's ND-008 has already overridden `=` for numerics to compare value across
rungs.

The consideration is therefore not "should dimensioned values be comparable" but
"what does each of three existing operators mean when a unit is present," with
the added constraint that #358 is already open against the plane semantics.

## L8 — Error semantics precede unit semantics

Static systems report a mismatch by refusing to compile. Runtime systems raise —
pint's `OffsetUnitCalculusError` is a deliberate refusal to guess. In both cases
the report is unambiguous and terminal.

HC's numeric operators do not have that property uniformly today: a
`FrameSequence` operand produces `$!.numeric-domain …`, while a non-numeric
operand still produces nil (#361), and what an error frame means in conditional
position is unsettled (#360). A dimensional mismatch is the same kind of event
as those, so any units work would be reporting into a mechanism that is still
being defined.

## L9 — This is a large feature by every available measure

The record in the survey is worth reading as a scope estimate rather than as
history. JSR-275 was rejected at ballot. Its successor took two more JSRs to
ship as an API. The C++ effort has been in committee since 2019, is targeting
C++29, and is on its third mathematical model. F# shipped, on the strength of a
decade of prior theory and a compiler team.

None of that argues for or against doing it. It argues against estimating it as
an operator addition.

## L10 — What checking buys is bounded

Even a sound dimensional system catches only dimensional inconsistency. It does
not catch a wrong constant, a wrong formula with the right dimensions, or a
quantity of the right dimension and wrong kind (L4). Heuristic tools report
true-positive rates rather than guarantees.

The relevant framing is therefore how much of the error class is closed and at
what cost in surface, not whether unit errors become impossible.

## Questions any direction has to answer

Collected from the above, in no order, and deliberately unanswered.

1. Does a unit live in the value, in a separate annotation, in a type-like
   frame, or outside the program?
2. What is the source spelling, and does it round-trip through rendering?
3. Are exponents integral or rational, and what happens under a fractional or
   inexact exponent?
4. Is the unit dimension only, or dimension plus kind?
5. What does each of `=`, `==`, and `===` mean when a unit is present?
6. Is `1 km` equal to `1000 m`, and if so, is either value rewritten?
7. How are affine units distinguished from multiplicative ones, and are
   differences a separate concept?
8. What is the dimensional rule for each operator, including `%%`, `**`, and
   juxtaposition?
9. Where does the unit vocabulary come from, and what scope resolves it?
10. What happens at the host and file boundary, where values arrive as text or
    integers?
11. How is a mismatch reported, and how does that report behave in conditional
    position?
