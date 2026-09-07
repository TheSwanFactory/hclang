# Units of Measure: A Survey of Existing Approaches

**Status:** Survey only — no design, no recommendation\
**Issue:**
[#362 — Could numbers carry their units?](https://github.com/TheSwanFactory/hclang/issues/362)\
**Scope:** Prior art in other languages, libraries, and data standards

## What this document is

A taxonomy of how existing systems attach units of measure to numeric values,
with links to the most developed example of each approach. It records what has
been tried and what those attempts report about their own difficulties.

It proposes nothing. No approach here is endorsed, adapted, or ruled out, and no
HC syntax, frame, or operator is discussed. Sources are cited so a later design
document can argue from primary material rather than from this summary.

Content from external sources is paraphrased for compliance with licensing
restrictions.

## The shared foundation

Approaches disagree about almost everything except the algebra. Units form a
free abelian group over a set of base units: exponents add under multiplication,
subtract under division, order is irrelevant, and every unit has an inverse.
Unification in an abelian group is decidable, which is what makes unit inference
tractable rather than heuristic.

The canonical treatment is Andrew Kennedy's, spanning fifteen years:

- [Relational Parametricity and Units of Measure](https://dl.acm.org/doi/10.1145/263699.263761)
  (POPL 1997) — quantifying over units yields a parametric polymorphism whose
  representation-independence result is that program behaviour does not change
  when units change. One consequence is that a function's type implies its
  scaling law.
- [Types for Units-of-Measure: Theory and Practice](http://typesatwork.imm.dtu.dk/material/TaW_Paper_TypesAtWork_Kennedy.pdf)
  (tutorial paper) — the practical survey. It opens with the Mars Climate
  Orbiter and notes that the disaster report made many recommendations but never
  suggested that programming languages could help. It also observes that C++ and
  Haskell type systems can be pressed into unit checking at a cost in usability.
- [Invited talk abstract on units-of-measure in F#](https://dl.acm.org/doi/abs/10.1145/1411304.1411305)
  (ML Workshop 2008) — the inference algorithm, and the claim that the feature
  is unobtrusive from the programmer's side. Principal types are obtained
  through abelian-group unification plus a change-of-basis step when
  generalizing let-bound variables, with inferred schemes presented in a normal
  form borrowed from linear algebra.

Recent work continues in the same algebra: a
[Lean formalization of dimensional analysis](https://arxiv.org/html/2509.13142v1)
(2025).

## Axis 1 — Where the unit lives

The primary division, from which most other differences follow.

### In the type

The unit is part of the static type of the expression, and mismatches are
compile-time errors.

- **[F# units of measure](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/units-of-measure)**
  — `[<Measure>]` declares a unit; floating-point and signed-integer values
  carry it. The only mainstream language with this in the type system.
- **[Ada / GNAT dimensionality](https://www.adacore.com/blog/gem-136-how-tall-is-a-kilogram)**
  — an aspect (`Dimension_System`) on a numeric type. AdaCore reports checking
  entirely at compile time, with facilities for fractional dimensions and for
  printing dimensioned quantities
  ([follow-up](https://www.adacore.com/blog/physical-units-pass-the-generic-test)).
- **[Fortress](https://khoury.northeastern.edu/home/samth/fortress-spec.pdf)** —
  Sun's HPC language designed dimensions and units into the type system. Kennedy
  cites it as the notable language-level attempt; the project ended.
- **[Boost.Units](https://www.boost.org/doc/libs/release/libs/units/)** (C++) —
  dimensional analysis framed as a compile-time metaprogramming problem, with no
  runtime cost under optimization.
- **[mp-units](https://github.com/mpusz/mp-units)** (C++20) — the most developed
  current system, built on ISO 80000, and the reference implementation behind
  C++ standardization.
- **[uom](https://github.com/iliekturtles/uom/blob/master/README.md)** (Rust) —
  zero-cost dimensional analysis over
  [type-level integers](https://github.com/paholg/typenum).
- **[units](https://dl.acm.org/doi/pdf/10.1145/2633357.2633362)** (Haskell,
  Haskell Symposium 2014) — separates the notion of dimension from that of unit
  and adds unit polymorphism intended to express physical laws; companion
  library [dimensional](https://github.com/bjornbm/dimensional).
- **[Unitful.jl](https://docs.sciml.ai/Unitful/stable/types/)** (Julia) —
  dimensions and units appear as type parameters of `Quantity{T,D,U}`, which
  moves unit computation toward compile time in a dynamically typed host.

### In the value

The unit is carried by the runtime value, and mismatches are runtime errors.

- **[Frink](https://frinklang.org/)** — a language built around unit tracking
  rather than retrofitted with it; every calculation carries units, and the
  implementation is
  [strict about SI conventions](https://www.futureboy.us/frinkdocs/faq.html).
  Presented at [LL4](http://futureboy.us/frinkdocs/LL4.html) as
  validation-and-bookkeeping automation.
- **[pint](https://pint.readthedocs.io/en/stable/getting/tutorial.html)**
  (Python) — a `UnitRegistry` holds definitions and relationships; quantities
  are value-plus-unit objects supporting arithmetic and conversion.
- **[JSR-385 / Units of Measurement API](https://jcp.org/en/jsr/detail?id=385)**
  (Java) — a specified API of `Quantity`, `Unit`, and `Dimension` interfaces
  rather than a language feature.

### Outside the program

The unit is a data-level annotation, exchanged between systems rather than
checked by a compiler.

- **[UCUM](https://ucum.org/ucum)** — a code system for units aimed at
  unambiguous electronic communication of quantities; used by HL7/FHIR, with an
  [RDF datatype encoding](https://2018.eswc-conferences.org/files/posters-demos/paper_293.pdf).
- **[QUDT](https://qudt.org/)** — an OWL ontology of quantities, units, quantity
  kinds, dimensions, and datatypes for RDF and JSON.

## Axis 2 — What survives to runtime

Where a unit exists in the type, something must decide whether it still exists
after compilation. The answers form a spectrum.

| Behaviour                | Example              | Consequence reported                                                                                                                                                                         |
| ------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full erasure             | F#                   | Units [cannot be reflected on or printed at runtime](https://stackoverflow.com/questions/4005474/reflection-for-f-units-of-measure), because the host runtime has no representation for them |
| Compile-time with output | Ada / GNAT           | Dimensioned quantities can be printed, and fractional dimensions managed, while checking still costs nothing at runtime                                                                      |
| Retained type parameters | Unitful.jl, uom      | Units are inspectable, but `uom` [stores the value in a normalized base unit, so the unit the caller wrote is no longer part of the value](https://lib.rs/crates/qubit-measure)              |
| Fully reified            | Frink, pint, JSR-385 | Units are ordinary runtime data: printable, convertible, and inspectable, at runtime cost                                                                                                    |

## Axis 3 — Checked, inferred, or retrofitted

- **Annotation-checked.** The programmer writes the unit; the system verifies
  consistency. Every library approach above.
- **Inferred, with principal types.** The system derives units for unannotated
  code via abelian-group unification
  ([Kennedy, ML 2008](https://dl.acm.org/doi/abs/10.1145/1411304.1411305)).
- **Retrofitted onto existing code.**
  [Osprey](http://www.mysmu.edu/faculty/lxjiang/papers/icse06uc.pdf) (ICSE 2006)
  presents a sound type system that checks unit errors in C programs, on the
  premise that standard type systems do not catch them and manual dimensional
  analysis does not scale
  ([full version](https://web.cs.ucdavis.edu/~su/unitfull.pdf)). A related line
  annotates C with assume/assert pairs that dedicated checkers interpret and
  ordinary compilers ignore
  ([measurement unit safety certification](https://www.researchgate.net/publication/220884005_Certifying_Measurement_Unit_Safety_Polic)).
- **Detected heuristically, without annotations.** A
  [study of 5.9M lines of robotics code](https://par.nsf.gov/servlets/purl/10059720)
  looks for probable dimensional inconsistencies in unannotated sources and in
  message definitions, quoting a true-positive rate for the PhrikyUnits tool
  rather than a soundness claim.
- **Checked at the equation level.** Simulation languages carry declared units
  on variables and validate the equations that connect them
  ([Modelica and gPROMS](http://www.es.mdu.se/pdf_publications/527.pdf)).

## Axis 4 — Dimension versus quantity kind

Whether a system distinguishes quantities that share a dimension but not a
meaning. mp-units treats this as its central claim, separating frequency from
radioactive activity, absorbed dose from dose equivalent, and plane angle from
solid angle, and states plainly that
[dimensional analysis alone does not catch these errors](https://github.com/mpusz/mp-units/blob/master/README.md).

The distinction has proved costly to model. C++ committee papers from 2026
report that the
[two-abstraction model of quantity and unit was insufficient for several common engineering patterns](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/p4185r0),
and separate work argues that a purely vector-based dimension representation
[cannot distinguish torque from work](http://www.scitepress.org/Papers/2026/151874/151874.pdf)
and proposes provenance tracking to recover the difference. QUDT models quantity
kinds as first-class alongside units.

## Axis 5 — Multiplicative versus affine units

No surveyed system treats °C or °F as an ordinary unit, because conversion needs
an offset as well as a factor, and because a temperature difference does not
convert like a temperature.

- **pint** classifies them as
  [non-multiplicative units with a reference point](https://pint.readthedocs.io/en/0.19/nonmult.html),
  provides `delta_` counterparts for differences, and raises
  `OffsetUnitCalculusError` on ambiguous arithmetic rather than choosing an
  interpretation.
- **Boost.Units** separates them into an `absolute<>` wrapper.

## Axis 6 — Exponent domain

- **Integer exponents**, encoded as type-level integers (`uom` via `typenum`).
- **Rational exponents**, required when dimensions appear under roots; the
  Haskell `units` line and GNAT's dimension system both support fractional
  dimensions.
- **Statically known exponents only.** Systems that place units in types need
  the exponent of an exponentiation to be known at compile time, since the
  result's dimension depends on it.

## Axis 7 — Where the vocabulary comes from

- **Language builtins.** F#'s `Measure` types and Ada's dimension systems are
  declared in source, with SI sets shipped as libraries.
- **A registry loaded as data.** pint's unit registry and Frink's
  [units data file](https://futureboy.us/frinkdata/units.txt) are editable text,
  the latter with an explicit bibliography of measurement references.
- **An external standard.** UCUM codes and QUDT vocabularies are maintained
  outside any language.
- **A specified API.** JSR-385 standardizes interfaces and leaves the unit set
  and implementation to providers.

## Axis 8 — Conversion and promotion policy

Systems that convert must decide what the result is expressed in.

- **Normalize to a base unit.** `uom` converts on construction, which is what
  discards the caller's spelling.
- **Convert on request, with dimension checked.** Unitful rejects a conversion
  whose target has a
  [different dimension than the value](https://docs.sciml.ai/Unitful/v0.1/conversion/).
- **Policy as a type.** Unitful provides three unit flavours — free, context,
  and fixed — precisely because "which unit should the result use" has more than
  one defensible answer.

## Standardization record

| Effort                                                                                   | Outcome                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [JSR-275](https://jcp.org/en/jsr/detail?id=275) (Java)                                   | Rejected — not approved by the SE/EE Executive Committee at the Public Draft Reconsideration ballot                                                                                                              |
| JSR-363 → [JSR-385](https://jcp.org/en/jsr/detail?id=385) (Java)                         | Shipped as an API, with a maintenance release and reference implementation                                                                                                                                       |
| [P1935 → P3045](https://open-std.org/jtc1/sc22/wg21/docs/papers/2024/p3045r0.html) (C++) | Under review since 2019; a [C++29 candidate](https://github.com/mpusz/mp-units), with the [SI definitions being catalogued separately](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/p4213r0) in 2026 |
| F#                                                                                       | Shipped as a language feature and still documented as current                                                                                                                                                    |
| Fortress                                                                                 | Designed, not shipped; project ended                                                                                                                                                                             |

The C++ effort's own motivation papers frame the work as a
[safety improvement for a widely used language](https://open-std.org/jtc1/sc22/wg21/docs/papers/2023/p2981r1.html)
rather than a numerics convenience.

## Incidents the literature cites

Every survey in this area motivates itself the same way, so the examples are
recorded here as part of the prior art rather than as argument.

- **Mars Climate Orbiter** (1999) — pound-force and newton confusion between two
  engineering teams; cited by Kennedy and by the
  [JSR-275 Executive Committee presentation](https://jcp.org/aboutJava/communityprocess/ec-public/materials/2010-01-1213/JSR-275_PR-EC-F2F.pdf).
- **Gimli Glider** (1983) — an aircraft fuelled in kilograms against manuals in
  pounds, loading a fraction of what the trip required; cited in
  [JSR-385 write-ups](https://belief-driven-design.com/java-measurement-jsr-385-210f2/).
- **Ariane 5** (1996) — a conversion overflow rather than a unit mismatch, but
  cited alongside the others in the JSR-275 material.

## Sources

Primary material, grouped by kind.

**Theory**

- [Relational Parametricity and Units of Measure](https://dl.acm.org/doi/10.1145/263699.263761),
  POPL 1997
- [Units-of-measure in F#, invited talk abstract](https://dl.acm.org/doi/abs/10.1145/1411304.1411305),
  ML Workshop 2008
- [Types for Units-of-Measure tutorial](http://typesatwork.imm.dtu.dk/material/TaW_Paper_TypesAtWork_Kennedy.pdf)
  (note: the host's TLS certificate does not match, so this link may need to be
  fetched over plain HTTP or from a mirror)
- [Units of measure in Haskell](https://dl.acm.org/doi/pdf/10.1145/2633357.2633362),
  Haskell Symposium 2014
- [Formalizing Dimensional Analysis Using the Lean Theorem Prover](https://arxiv.org/html/2509.13142v1)
- [Dimensional validation for simulation languages](http://www.es.mdu.se/pdf_publications/527.pdf)
- [Osprey](http://www.mysmu.edu/faculty/lxjiang/papers/icse06uc.pdf), ICSE 2006,
  and its [full version](https://web.cs.ucdavis.edu/~su/unitfull.pdf)
- [Dimensional Inconsistencies in Code and ROS Messages](https://par.nsf.gov/servlets/purl/10059720)
- [Pairwise dimension representation and provenance](http://www.scitepress.org/Papers/2026/151874/151874.pdf)

**Language and library documentation**

- [F# units of measure](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/units-of-measure)
- [GNAT dimensionality analysis](https://www.adacore.com/blog/gem-136-how-tall-is-a-kilogram)
  and
  [generics follow-up](https://www.adacore.com/blog/physical-units-pass-the-generic-test)
- [Fortress language specification](https://khoury.northeastern.edu/home/samth/fortress-spec.pdf)
- [Frink](https://frinklang.org/),
  [FAQ](https://www.futureboy.us/frinkdocs/faq.html),
  [LL4 talk](http://futureboy.us/frinkdocs/LL4.html)
- [Boost.Units](https://www.boost.org/doc/libs/release/libs/units/)
- [mp-units](https://github.com/mpusz/mp-units)
- [uom](https://github.com/iliekturtles/uom/blob/master/README.md),
  [typenum](https://github.com/paholg/typenum)
- [Unitful.jl types](https://docs.sciml.ai/Unitful/stable/types/) and
  [conversion](https://docs.sciml.ai/Unitful/v0.1/conversion/)
- [pint tutorial](https://pint.readthedocs.io/en/stable/getting/tutorial.html)
  and
  [non-multiplicative units](https://pint.readthedocs.io/en/0.19/nonmult.html)

**Standards and process**

- [JSR-275 status](https://jcp.org/en/jsr/detail?id=275),
  [Executive Committee presentation](https://jcp.org/aboutJava/communityprocess/ec-public/materials/2010-01-1213/JSR-275_PR-EC-F2F.pdf)
- [JSR-385](https://jcp.org/en/jsr/detail?id=385)
- [P2981 — safety motivation](https://open-std.org/jtc1/sc22/wg21/docs/papers/2023/p2981r1.html),
  [P3045 — the library](https://open-std.org/jtc1/sc22/wg21/docs/papers/2024/p3045r0.html),
  [P4185 — model revision](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/p4185r0),
  [P4213 — SI definitions](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2026/p4213r0)
- [UCUM](https://ucum.org/ucum), [QUDT](https://qudt.org/)

## Coverage gaps

Recorded so a later reader knows what was not examined rather than assuming it
was found absent.

- Swift `Measurement`, Scala Squants, and Wolfram `Quantity` were not verified
  and are therefore not characterized above.
- Spreadsheet and notebook environments were not surveyed.
- Papers were read through abstracts and search excerpts rather than in full;
  claims attributed to them are summaries of those excerpts.
- The Kennedy tutorial PDF could not be retrieved directly, since its host
  serves a certificate for a different domain.
- No performance data was gathered for the reified approaches.
