#!/usr/bin/env hc
```
Denum and CD (occurrence/figure 007.31, 007.32, 007.32b, 007.35, 007.35b)

There are two public constructors over the same retained data, a Count and a
nonempty ordered list of nonnegative integer loads, one per channel. Neither
stores a rank or a schema, and neither is a conventional number.

    Denum [7, [3, 2, 1]]       generic weighted construction, any positive arity
    Denum [7, [3, 2, 1, 4]]    STILL generic, though the arity is 4
    CD    [7, [3, 2, 1, 4]]    explicitly CD[2], four signed channels
    CD    [7, [3, 2, 1]]       refused: $!.denum-unsupported-arity

**The algebra is supplied by the CD constructor, not inferred from the arity.**
The signed Cayley–Dickson operations below are an interpretation the `CD`
constructor imposes on its loads. They are not a theorem about channel counts, so
a generic Denum with four, eight or thirty-two loads has no CD interpretation. The
only algebra published here is the binary Cayley–Dickson ladder, CD[0] to CD[5]:
there is no Fano primitive and no algebraic reconstruction claim. There is no
conversion either: no `Denum.cd`, `asCD` or `fromDenum`, and no operation takes a
Denum and answers a CD. A program that passes `d.count` and `d.loads` to `CD` is
making a fresh explicit construction, nothing more. A conversion would need its
own contract and proofs.

Both are ordinary HC classes, like `Demi`. The CD arithmetic is the
Cayley–Dickson recurrence `(a,b)(c,d) = (ac − d̄b, da + bc̄)`, computed by the one
pure native seam `denum-engine` (`lib/ops/denum.ts`, over the typed reference in
`lib/frames/denum.ts`), so no multiplication table is written in HC or in
TypeScript. Everything else either type does is in this file.

**The generic Denum.** `Denum [count, loads]` accepts every positive arity
(1, 2, 3, 4, 5, 6, 8, 33, 64, ...). Its observers are `d.count`, `d.loads`,
`d.#` (the Count), `d.##` (the total load), `d.rank ()` (`⌊log₂ A⌋` of the arity
`A = d.loads.#`, by integer arithmetic and never from the Count), `d.schema ()`
(always `Arity[A]`, even at A = 1, 2, 4, 8, 16, 32) and text
`Denum(Arity[A], C=.., W=[..])`. Its one operation is `+` with another generic
Denum of the same arity: Counts add, loads add componentwise, nothing cancels and
the result is a fresh generic Denum. A different arity is
`$!.denum-arity-mismatch`; nothing is padded, truncated or aligned. Everything
that needs a signature law (`-`, `*`, `opp`, `conj`, `promote`, `coordinates`,
`observe`, `signatures`, `d.###`) answers the named refusal `$!.denum-not-cd`,
whatever the arity: a generic Denum has no residual, opposite or product. These
methods are defined, to refuse, rather than absent. A Denum of zero loads is
present, not nil and not a CD. `x.#n` never takes a generic Denum as a source
(see "The ranked hash").

**The CD.** `CD [count, loads]` validates the same Count and loads, and needs one
of the shipped channel arities 1, 2, 4, 8, 16, 32; any other arity is
`$!.denum-unsupported-arity`, and 0 loads is `$!!.invalid-denum`. A CD is a
distinct type, not a generic Denum that happens to have `2ⁿ` channels. The rank
`d.rank ()` is again derived, and `d.schema ()` is `CD[n]` with text
`CD[n](C=.., W=[..])`. CD identity is the class, not the arity: a `+`, `-` or
`*` operand must equal the CD that the shipped `CD` constructor builds from its
`count` and `loads` (the test `x.#n` applies to a source), so a lookalike
aggregate with the same fields is `$!!.invalid-denum`, and a generic Denum with
the same fields is not a CD.

**Ranks and channels of a CD.** On rank n the schema is `CD[n]`, the rung of the
step ladder. Rank 0 has one unsigned channel, `e_ε`. Rank n of 1 or more has 2ⁿ
channels, `±e_b` for every direction `b` of n−1 bits, positives first and then
negatives, each in direction order:

    CD[0]  e_ε
    CD[1]  e_ε, -e_ε
    CD[2]  e_0, e_1, -e_0, -e_1
    CD[3]  e_00, e_01, e_10, e_11, -e_00, -e_01, -e_10, -e_11
    CD[4]  ±e_b for b in {0,1}³        16 channels
    CD[5]  ±e_b for b in {0,1}⁴        32 channels

A minus names a *signature*, never a negative load: every load is a Count.
`d.signatures ()` lists the native names in channel order. Opposite channels stay
separately counted after every operation, so `X + Opp X` is a present, nonempty
CD that merely observes as zero. The conventional algebraic value is an
observation, `d.coordinates ()`.

**State.** `d.count` (the full application Count, kept apart from the loads)
and `d.loads` (one Count per channel) are the whole retained state of either
type. The observers `d.rank ()` and `d.schema ()` are computed from the loads on
each call, so there is no stored rank to drift; the v0.46.0 data spelling
`d.rank` and `d.schema` is replaced by these calls. Anything that is not a Count
and a nonempty list of Counts, including the old three-field
`[rank, count, loads]`, is refused with `$!!.invalid-denum` by both constructors.
`Denum [0, [0]]` and `CD [0, [0]]`, explicit zero-load states, are present: they
are neither the missing host that `[].#0` leaves nil nor a nonempty value that
observes as zero.

**CD arithmetic.** `+`, `-` and `*` take another CD, and only a CD. Operands of
different rank are both promoted to the larger rank first (`promote`), and the
result is a fresh CD of that rank:

- `a + b` adds corresponding loads and keeps opposite channels separate.
- `a * b` is the ordered Cartesian product of weighted signatures: loads
  multiply, the signed destination is the recurrence's, and only identical full
  signatures aggregate. Operand order and parentheses are kept, and from
  rank 4 the product is not associative.
- `a - b` is `a + b.opp ()`: subtraction is addition of the opposite, observed,
  never erased.
- `d.opp ()` swaps the loads of `+e_b` and `-e_b`; a D0 is promoted to D1 first.
- `d.conj ()` keeps the scalar signatures and swaps every other pair.
- `d.promote k` embeds into rank k by the old-summand map, `±e_b ↦ ±e_(0b)`,
  keeping Count and loads and starting new channels at zero. A lower k is
  `$!.denum-demotion`.
- `d.coordinates ()` is the algebraic observation: the signed coordinate of each
  direction, positive load minus negative load, `S_b = W₊,b − W₋,b`.
  `d.coordinates <>` is the directional observation: the unsigned coordinate,
  positive load plus negative load, `U_b = W₊,b + W₋,b`, which forgets the
  signature and keeps all load. Each is an ordered list of integers, width 1 at
  rank 0 and 2ⁿ⁻¹ at rank n, and not the CD; neither changes the CD or
  returns its Count. At rank 0 both are `[W_ε]`. The only arguments are nil
  `()` and true `<>`; any other argument (a Count, text, a list) is
  `$!!.unary-observation`, never coerced by truthiness.
- `d.observe ()` is the deprecated v0.45.0 spelling of `d.coordinates ()`,
  kept only as a compatibility alias with exactly the signed result. It takes
  no unsigned argument; use `d.coordinates`.

**Mixed operands.** A generic Denum and a CD never combine, in either order, at
equal arity or equal rank: `Denum + CD` and `CD + Denum` answer
`$!.denum-mixed`, as do a CD `-` or `*` with a Denum operand. A generic `-` or
`*` is already the CD-only refusal `$!.denum-not-cd`. Nothing is reinterpreted.

**Count.** The candidate laws of 007.32 section 6 hold for these new operations
only: `C(a+b) = C(a)+C(b)` (generic and CD), `C(a*b) = C(a)·C(b)` and
`C(Opp a) = C(a)` for CD, and promotion and conjugation keep Count. Count is
carried, never derived from the loads, and it is not the application phase
`C mod arity`. `Demi` and its `+`, `-`, `*` and `./` are unchanged. This is a
software construction of a supplied recurrence, not a derivation of it from bare
counting.

**Observers.** Both types declare their own Count (`d.#`) and Size (`d.##`, the
total load). A CD also declares its residual (`d.###`, positive minus negative
total, 0 at rank 0), so its `.####` is the ordinary derived Demi of those three,
which is binary and forgets the directions. A generic Denum has no residual
(`d.###` is `$!.denum-not-cd`). `d.#n` is the CD.

**The ranked hash.** `x.#n` is an explicit CD-rung operation, n from 0 to 5, and
there is no `#n=`. For any Frame x that is not a Denum or a CD, `x.#n` answers
the CD of rank n, `nil` when x has no Count or Count zero, as `x.####` does.
For an ordinary or binary host `x.#1` has the Count and the left and right
loads of `x.####`. A `RotorRouter` of more than two channels is the exception:
`.####` answers its channel Demi, and `.#n` does not special-case it, so it is
the two-channel projection of the router's Count, Size and residual.
Bare `x.#` is still the Count. The host is built from the three observers it
answers, Count C, Size s and residual r: rank 0 keeps the load s, and rank
n ≥ 1 puts (s+r)/2 on `e_0…0` and (s−r)/2 on `-e_0…0`, the two channels the
fourth hash reads as left and right, with every other channel zero. A host's
applications carry no higher signature, so none is routed to them. That is
construction, and it is not promotion. A CD instance answers `x.#n` by
promotion to rank n (and `$!.denum-demotion` below its own rank), keeping Count
and loads, and a forged lookalike is not recognized. A generic Denum instance,
whatever its arity, is not a CD source: `x.#n` answers `$!.denum-not-cd`, does
not promote or reinterpret its loads, and does not measure its Count and Size as
a host. A rank above 5 is `$!.denum-rank`.

The classes are evaluated from the compiled-in bundle the first time a ranked
hash needs them, in a namespace of its own (`lib/execute/denum-prologue.ts`), so
this file must not import.
```
.denum-state {.c (_ .0); .l (_ .1); [
    .rank {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [11, (me .count), (me .loads)]} : {$!!.unary-observation}};
    .schema {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [13, (me .count), (me .loads)]} : {$!!.unary-observation}};
    .count c;
    .loads l;
    .# {_^.count};
    .## {(_^ .loads).##};
    .### {denum-engine [15]};
    .+ {.o (_^^ .operand-denum _); .me _^; .f (_^^ .finish-denum);
      (f (denum-engine [12, (me .count), (me .loads), (o .count), (o .loads)]))};
    .- {denum-engine [15]};
    .* {denum-engine [15]};
    .promote {denum-engine [15]};
    .opp {denum-engine [15]};
    .conj {denum-engine [15]};
    .coordinates {denum-engine [15]};
    .observe {denum-engine [15]};
    .signatures {denum-engine [15]};
    .toText {“Denum(” (_^ .schema ()) “, C=” (_^ .count) “, W=” (_^ .loads) “)”}
  ]};
.cd-state {.c (_ .0); .l (_ .1); [
    .rank {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [11, (me .count), (me .loads)]} : {$!!.unary-observation}};
    .schema {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [9, (me .count), (me .loads)]} : {$!!.unary-observation}};
    .count c;
    .loads l;
    .# {_^.count};
    .## {(_^ .loads).##};
    .### {denum-engine [10, (_^ .count), (_^ .loads)]};
    .+ {.o (_^^ .operand-cd _); .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [1, (me .count), (me .loads), (o .count), (o .loads)]))};
    .- {.o (_^^ .operand-cd _); .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [2, (me .count), (me .loads), (o .count), (o .loads)]))};
    .* {.o (_^^ .operand-cd _); .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [3, (me .count), (me .loads), (o .count), (o .loads)]))};
    .promote {.k _; .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [6, (me .count), (me .loads), k]))};
    .opp {.u ((_ = ()) ? {1} : {0}); .me _^; .f (_^^ .finish-cd);
      (u = 1) ? {(f (denum-engine [4, (me .count), (me .loads)]))} : {$!!.unary-observation}};
    .conj {.u ((_ = ()) ? {1} : {0}); .me _^; .f (_^^ .finish-cd);
      (u = 1) ? {(f (denum-engine [5, (me .count), (me .loads)]))} : {$!!.unary-observation}};
    .coordinates {.s ((_ = ()) ? {1} : {0}); .t ((_ = <>) ? {1} : {0}); .me _^;
      ((s + t) = 1) ? {denum-engine [7, (me .count), (me .loads), t]} : {$!!.unary-observation}};
    .observe {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [7, (me .count), (me .loads), 0]} : {$!!.unary-observation}};
    .signatures {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [8, (me .count), (me .loads)]} : {$!!.unary-observation}};
    .toText {(_^ .schema ()) “(C=” (_^ .count) “, W=” (_^ .loads) “)”}
  ]};
.operand-denum {.o _; .r (Denum [(o .count), (o .loads)]);
  (o = r) ? {o} : {(refuse-operand o)}};
.operand-cd {.o _; .k (denum-engine [17, (o .count), (o .loads)]);
  (k = 1) ? {.r (CD [(o .count), (o .loads)]); (o = r) ? {o} : {(refuse-operand o)}} : {(refuse-operand o)}};
.refuse-operand {.o _; .g (Denum [(o .count), (o .loads)]); .k (denum-engine [17, (o .count), (o .loads)]);
  .ig (((g ~ ([].<>)) ? {(o = g)}) ? {1} : {0});
  .ic ((k = 1) ? {.c (CD [(o .count), (o .loads)]); (((c ~ ([].<>)) ? {(o = c)}) ? {1} : {0})} : {0});
  ((ig + ic) = 1) ? {denum-engine [16]} : {$!!.invalid-denum}};
.finish-denum {.s _; ((s ~ ([].<>)) ? {denum-state s} : {s})};
.finish-cd {.s _; ((s ~ ([].<>)) ? {cd-state s} : {s})};
.Denum {.a _; ((a ~ ([].<>)) ? {(a .#) = 2}) ? {.s (denum-engine [0, (a .0), (a .1)]);
  (s ~ ([].<>)) ? {denum-state s} : {$!!.invalid-denum}} : {$!!.invalid-denum}};
.CD {.a _; ((a ~ ([].<>)) ? {(a .#) = 2}) ? {.s (denum-engine [14, (a .0), (a .1)]);
  (s ~ ([].<>)) ? {cd-state s} : {s}} : {$!!.invalid-denum}}
```
## Construction

There are two public constructors, and they are different types. `Denum [count,
loads]` builds the generic retained state; `CD [count, loads]` is the explicit
construction of the shipped Cayley–Dickson algebra. Both hold only the Count and
one load per channel; the rank and schema are observed from the loads, never
stored. The rank-0 seed of CD has one unsigned channel, and an explicit
zero-load D0 is present
```
; .z (CD [0, [0]]);
; [z.rank (), z.schema (), z.count, z.loads, z.#, z.##, z.###, “” z]
# [0, “CD[0]”, 0, [0], 0, 0, 0, “CD[0](C=0, W=[0])”]
```
A generic Denum of zero loads is equally present: it is not nil, not a CD and not
an absent construction
```
; .gz (Denum [0, [0, 0, 0, 0]]);
; [“” gz, gz.rank (), gz.schema (), gz.count, gz.loads, gz.##, gz = ()]
# [“Denum(Arity[4], C=0, W=[0, 0, 0, 0])”, 2, “Arity[4]”, 0, [0, 0, 0, 0], 0, ()]
```
The loads are Counts, one per channel, and the Count is kept apart from them: a
state may hold loads at Count zero, or a Count over zero loads. A negative Count
or load, a fractional load, an empty load list, the legacy three-field
`[rank, count, loads]` constructor and a non-list (a bare Count or text for the
loads included) are refused by both constructors alike
```
; [“” (CD [7, [3, 2, 0, 1]]), “” (CD [0, [4, 0]]), “” (CD [5, [0, 0]])]
# [“CD[2](C=7, W=[3, 2, 0, 1])”, “CD[1](C=0, W=[4, 0])”, “CD[1](C=5, W=[0, 0])”]
; [Denum [(0 - 1), [0, 0]], Denum [0, [0, (0 - 1)]], Denum [0, [0, 1.5]], Denum [0, []], Denum 5, Denum [0], Denum [1, 0, [0, 0]], Denum [2, 7, [3, 2, 0, 1]], Denum [0, [0, 0], 9], Denum [0, 5], Denum [0, “x”]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; [CD [(0 - 1), [0, 0]], CD [0, [0, (0 - 1)]], CD [0, [0, 1.5]], CD [0, []], CD 5, CD [0], CD [1, 0, [0, 0]], CD [2, 7, [3, 2, 0, 1]], CD [0, [0, 0], 9], CD [0, 5], CD [0, “x”]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
```
## Equal shape, different constructors

`Denum [7, [3, 2, 1, 4]]` and `CD [7, [3, 2, 1, 4]]` have the same arity 4, the
same rank 2, the same Count 7 and the same Size 10, but they are not the same
type. The channel count does not select the algebra: only the `CD` constructor
does. The generic schema is `Arity[4]`, the CD schema `CD[2]`, the text differs,
and the two are not equal
```
; .gd (Denum [7, [3, 2, 1, 4]]); .dc (CD [7, [3, 2, 1, 4]]);
; [gd.#, dc.#, gd.##, dc.##, gd.rank (), dc.rank (), gd.schema (), dc.schema ()]
# [7, 7, 10, 10, 2, 2, “Arity[4]”, “CD[2]”]
; [“” gd, “” dc, gd = dc, dc = gd, gd.loads = dc.loads, gd.count = dc.count]
# [“Denum(Arity[4], C=7, W=[3, 2, 1, 4])”, “CD[2](C=7, W=[3, 2, 1, 4])”, (), (), <>, <>]
```
Only the CD has the signed and unsigned coordinates and the signatures. The
generic Denum has no CD interpretation: every CD-only operation on it answers
the named refusal `$!.denum-not-cd`, whatever its arity, and its loads are
untouched
```
; [dc.coordinates (), dc.coordinates <>, dc.signatures (), dc.###]
# [[2, -2], [4, 6], [“e_0”, “e_1”, “-e_0”, “-e_1”], 0]
; [gd.coordinates (), gd.coordinates <>, gd.observe (), gd.signatures (), gd.###]
# [$!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd]
; [gd.opp (), gd.conj (), gd.promote 3, gd * gd, gd - gd, gd.loads, gd.count]
# [$!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, [3, 2, 1, 4], 7]
```
## Derived rank and arbitrary arity

The rank is `⌊log₂ A⌋` of the arity `A = d.loads.#`, by integer arithmetic. It is
never the Count `d.#`, and there is no rank field: `d.rank ()` computes it from
the loads alone each time it is asked. This is an explicit call, so the v0.46.0
data spelling `d.rank` is gone, and any argument but `()` is
`$!!.unary-observation`. Any positive number of loads is a generic Denum, so
`Denum [7, [3, 2, 1]]` has Count 7, three loads, Size 6 and rank 1, and no
channel is dropped or added
```
; .three (Denum [7, [3, 2, 1]]);
; [three.#, three.loads, three.loads.#, three.##, three.rank (), three.schema ()]
# [7, [3, 2, 1], 3, 6, 1, “Arity[3]”]
; [three.rank 1, three.rank <>, “” three]
# [$!!.unary-observation, $!!.unary-observation, “Denum(Arity[3], C=7, W=[3, 2, 1])”]
```
The rank steps at every power of two, whatever the loads or the Count, and the
same holds for the generic and the CD observer
```
; .z4 [0, 0, 0, 0]; .z8 [0, 0, 0, 0, 0, 0, 0, 0];
; [(Denum [0, [0]]).rank (), (Denum [0, [0, 0]]).rank (), three.rank (), (Denum [0, z4]).rank (), (Denum [0, [1, 2, 3, 4, 5]]).rank (), (Denum [0, [1, 2, 3, 4, 5, 6]]).rank (), (Denum [0, [1, 2, 3, 4, 5, 6, 7]]).rank (), (Denum [0, z8]).rank ()]
# [0, 1, 1, 2, 2, 2, 2, 3]
; [(CD [0, [0]]).rank (), (CD [0, [0, 0]]).rank (), (CD [0, z4]).rank (), (CD [0, z8]).rank ()]
# [0, 1, 2, 3]
```
Identical loads at different Counts have the same rank, and the Count never
enters it
```
; [(Denum [0, [3, 2, 1]]).rank (), (Denum [99, [3, 2, 1]]).rank (), (Denum [1000, [0]]).rank (), (Denum [1000, [0, 0]]).rank ()]
# [1, 1, 0, 1]
```
The generic Denum accepts every positive arity, including 5, 6, 33 and 64,
whose rank 6 is above the shipped CD rung 5. Its schema text is `Arity[A]`
```
; .t6 (Denum [1, [1, 2, 3, 4, 5, 6]]);
; .t33 (Denum [1, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .t64 (Denum [2, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
; [t6.schema (), t6.rank (), t33.schema (), t33.rank (), t64.schema (), t64.rank (), t64.loads.#, t64.##, (Denum [0, [0, 0, 0, 0, 0]]).schema ()]
# [“Arity[6]”, 2, “Arity[33]”, 5, “Arity[64]”, 6, 64, 0, “Arity[5]”]
```
## Generic addition

Two generic Denums of the same arity add componentwise: Counts add, loads add,
nothing cancels, and the result is a fresh generic Denum of that arity. This is
true at an odd arity and at a power of two alike, and the Count is independent
of the Size
```
; .p3 (Denum [7, [3, 2, 1]]); .q3 (Denum [2, [4, 0, 0]]); .r3 (p3 + q3);
; [r3.count, r3.loads, r3.##, r3.rank (), r3.schema (), “” r3, p3.loads, q3.loads]
# [9, [7, 2, 1], 10, 1, “Arity[3]”, “Denum(Arity[3], C=9, W=[7, 2, 1])”, [3, 2, 1], [4, 0, 0]]
; .p4 (Denum [7, [3, 2, 1, 4]]); .q4 (Denum [2, [4, 0, 0, 5]]); .r4 (p4 + q4);
; [r4.count, r4.loads, r4.##, r4.rank (), r4.schema (), “” r4]
# [9, [7, 2, 1, 9], 19, 2, “Arity[4]”, “Denum(Arity[4], C=9, W=[7, 2, 1, 9])”]
```
Opposite-looking channels are only loads here. They add, with no sign and no
cancellation, and a sum is a new value, not an operand. Chaining stays generic
```
; .o4 (Denum [1, [2, 0, 1, 0]]); .u4 (Denum [1, [0, 3, 0, 2]]);
; [(o4 + u4).loads, (o4 + u4).count, (o4 + u4) = o4, (o4 + u4) = (o4 + u4), ((o4 + u4) + o4).loads, “” ((o4 + u4) + o4)]
# [[2, 3, 1, 2], 2, (), <>, [4, 3, 2, 2], “Denum(Arity[4], C=3, W=[4, 3, 2, 2])”]
; [((Denum [1, [2]]) + (Denum [2, [5]])).loads, ((Denum [1, [2]]) + (Denum [2, [5]])).count, ((Denum [0, [1, 2, 3, 4, 5]]) + (Denum [0, [5, 4, 3, 2, 1]])).loads]
# [[7], 3, [6, 6, 6, 6, 6]]
```
Different arities are refused by name (`$!.denum-arity-mismatch`); nothing is
padded, truncated or aligned
```
; [p3 + p4, p4 + p3, p3 + (Denum [1, [1]]), (Denum [1, [1, 2]]) + p3]
# [$!.denum-arity-mismatch, $!.denum-arity-mismatch, $!.denum-arity-mismatch, $!.denum-arity-mismatch]
```
## CD eligibility

`CD [count, loads]` validates the same Count and loads, and additionally needs
one of the shipped channel arities 1, 2, 4, 8, 16 or 32. Any other arity is the
named refusal `$!.denum-unsupported-arity`; no channel is padded, truncated or
dropped, and a malformed state is still `$!!.invalid-denum`
```
; [“” (CD [7, [3, 2, 1, 4]]), “” (CD [0, [0]])]
# [“CD[2](C=7, W=[3, 2, 1, 4])”, “CD[0](C=0, W=[0])”]
; [CD [7, [3, 2, 1]], CD [7, [3, 2, 1, 4, 5]], CD [1, [1, 2, 3, 4, 5, 6]], CD [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], CD [2, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]], CD [0, []]]
# [$!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!!.invalid-denum]
```
There is no conversion between the two. The only way from a generic Denum to a
CD is to construct a fresh CD from a Count and loads the program supplies, which
is a new explicit construction. The CD never aliases the source
```
; .src (Denum [7, [3, 2, 1, 4]]); .made (CD [(src.count), (src.loads)]);
; [“” made, made = src, src.schema (), made.schema (), src.loads]
# [“CD[2](C=7, W=[3, 2, 1, 4])”, (), “Arity[4]”, “CD[2]”, [3, 2, 1, 4]]
```
## Mixed operands

A generic Denum and a CD never combine, in either order and at any arity or rank.
The generic state is not reinterpreted as a CD at a matching arity, and a CD is
not read as a generic state either. `+` answers `$!.denum-mixed`; a generic `-`
or `*` is the CD-only refusal `$!.denum-not-cd` on its own, and a CD `-` or `*`
with a generic operand is `$!.denum-mixed`
```
; [gd + dc, dc + gd, dc - gd, dc * gd, gd - dc, gd * dc]
# [$!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-not-cd, $!.denum-not-cd]
; .dc1 (CD [1, [1, 0]]); .gd1 (Denum [1, [1, 0]]); .gd2 (Denum [1, [1]]); .dc0 (CD [1, [1]]);
; [dc1 + gd1, gd1 + dc1, dc1 * gd1, dc0 + gd2, gd2 + dc0, dc + (Denum [1, [1, 2, 3]]), (Denum [1, [1, 2, 3]]) + dc]
# [$!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed]
```
Neither identity is forged by copying `count` and `loads`: a plain aggregate with
the same fields is neither a Denum nor a CD, whatever the operation or the order
```
; .fake [.count 7; .loads [3, 2, 1, 4]];
; [gd + fake, dc + fake, dc - fake, dc * fake, gd + [.count 7; .loads [3, 2, 1]], dc + [.count 7; .loads [3, 2, 1]]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; .lookalike [.count 7; .loads [3, 2, 1, 4]; .rank {2}; .schema {“CD[2]”}];
; [dc + lookalike, gd + lookalike, dc * lookalike, fake = dc, fake = gd]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, (), ()]
```
## Signatures

The native spelling has no sign bit: the direction is a bitstring of rank − 1
bits, and a minus names the opposite signature. Rank 0 has only `e_ε`
```
; [(CD [0, [0]]).signatures (), (CD [0, [0, 0]]).signatures (), (CD [0, [0, 0, 0, 0]]).signatures ()]
# [[“e_ε”], [“e_ε”, “-e_ε”], [“e_0”, “e_1”, “-e_0”, “-e_1”]]
; (CD [0, [0, 0, 0, 0, 0, 0, 0, 0]]).signatures ()
# [“e_00”, “e_01”, “e_10”, “e_11”, “-e_00”, “-e_01”, “-e_10”, “-e_11”]
; (CD [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]).signatures () .# 
# 16
; ((CD [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]).signatures ()) .# 
# 32
```
## Rank 0 and rank 1: Size and signed integers

D0 adds and multiplies unsigned Size, and Counts add and multiply with it. D1
has the two signatures `e_ε` and `-e_ε`, and the product of two minus signatures
is the plus signature, `(-e_ε)(-e_ε) = e_ε`, while every load stays a Count
```
; .a (CD [2, [3]]); .b (CD [5, [4]]);
; [(a + b).loads, (a + b).count, (a * b).loads, (a * b).count]
# [[7], 7, [12], 10]
; .p (CD [1, [1, 0]]); .m (CD [1, [0, 1]]);
; [(m * m).loads, (m * p).loads, (p * m).loads, (p * p).loads]
# [[1, 0], [0, 1], [0, 1], [1, 0]]
; [((CD [1, [0, 2]]) * (CD [1, [0, 3]])).loads, ((CD [1, [0, 2]]) * (CD [1, [0, 3]])).coordinates ()]
# [[6, 0], [6]]
```
Opposite swaps the two channels and subtraction adds the opposite. The balanced
result observes as zero yet is a present, nonempty Denum with both loads
```
; .x (CD [1, [5, 2]]); .y (CD [1, [3, 0]]);
; [x.coordinates (), (x.opp ()).loads, (x - y).loads, (x - y).coordinates (), (x - y).count]
# [[3], [2, 5], [5, 5], [0], 2]
; .s (CD [1, [4, 4]]);
; [s.coordinates (), s.loads, s.#, s.##, s.###]
# [[0], [4, 4], 1, 8, 0]
```
A D0 has no negative signature, so its opposite is promoted to D1 first
```
; ((CD [3, [4]]).opp ()).loads
# [0, 4]
; ((CD [3, [4]]).opp ()).schema ()
# “CD[1]”
```
## Operands are CDs only

A CD's `+`, `-` and `*` refuse a right operand that is not a CD, even when it
carries the same `count` and `loads` fields, as `x.#n` refuses a forged source.
A generic Denum with those fields is `$!.denum-mixed`, shown above
```
; .dp (CD [1, [1, 0]]); .lookalike [.count 1; .loads [1, 0]];
; [dp + lookalike, dp - lookalike, dp * lookalike, dp + [1, 1, [1, 0]], dp * 2]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; [(dp + dp).loads, (dp * (dp + dp)).loads, (dp + (dp.opp ())).loads, “” (dp + dp)]
# [[2, 0], [2, 0], [1, 1], “CD[1](C=2, W=[2, 0])”]
```
## Rank 2: J² = −1 and the four-step cycle

`e_1` is the direction bit of J. Its square is the opposite scalar `-e_0`, and
the fourth power is back at `e_0`, observed
```
; .j (CD [1, [0, 1, 0, 0]]);
; [(j * j).loads, (j * j).coordinates (), ((j * j) * (j * j)).loads, ((j * j) * (j * j)).coordinates ()]
# [[0, 0, 1, 0], [-1, 0], [1, 0, 0, 0], [1, 0]]
```
## Rank 3: order matters

With J = `e_01`, I = `e_10` and K = `e_11`, J·I = K and I·J = −K
```
; .J (CD [1, [0, 1, 0, 0, 0, 0, 0, 0]]); .I (CD [1, [0, 0, 1, 0, 0, 0, 0, 0]]);
; [(J * I).loads, (I * J).loads]
# [[0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1]]
```
## Rank 4: the octonion associator

`(e_001 e_010) e_100` is `+e_111` and `e_001 (e_010 e_100)` is `-e_111`. The
CD keeps the parentheses, so the two groupings differ
```
; .o1 (CD [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .o2 (CD [1, [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .o4 (CD [1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
; [((o1 * o2) * o4).loads, (o1 * (o2 * o4)).loads]
# [[0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]]
; [((o1 * o2) * o4).coordinates () = (o1 * (o2 * o4)).coordinates ()]
# [()]
```
Through rank 3 the product is associative, so the same three directions in the
quaternions agree
```
; [(J * I) * J = (J * (I * J)), ((J * I) * J).coordinates ()]
# [<>, [0, 0, 1, 0]]
```
## Rank 5: sedenion zero divisors

`(e_0001 + e_1010)(e_0100 − e_1111)` observes as zero though neither factor does.
The product is not an empty CD: it holds four loads, in cancelling pairs
```
; .u (CD [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .v (CD [1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]]);
; [u.coordinates (), v.coordinates ()]
# [[0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1]]
; .w (u * v);
; [w.coordinates (), w.count, w.##, w.###, w.loads]
# [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 1, 4, 0, [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]]
```
## Promotion across the ladder

Promotion embeds a lower rung into a higher one as the old summand,
`±e_b ↦ ±e_(0b)`, keeping the Count and every load and starting the new channels
at zero. D0 goes to the positive scalar, so the new minus channel is empty, and
the map is path independent
```
; .t (CD [4, [6]]);
; [(t.promote 1).loads, (t.promote 2).loads, ((t.promote 1).promote 2).loads = (t.promote 2).loads, (t.promote 3).count]
# [[6, 0], [6, 0, 0, 0], <>, 4]
; .k (CD [3, [2, 5]]);
; [(k.promote 2).loads, (k.promote 3).loads, ((k.promote 2).promote 3).loads = (k.promote 3).loads, k.loads, k.rank ()]
# [[2, 0, 5, 0], [2, 0, 0, 0, 5, 0, 0, 0], <>, [2, 5], 1]
; [((CD [1, [0, 1, 0, 0]]).promote 3).loads, ((CD [1, [0, 0, 0, 1]]).promote 3).loads]
# [[0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0]]
```
A lower rank is refused, and so is a rank above 5 or something that is not a
Count. The source is never changed
```
; [(CD [1, [0, 0, 0, 0, 0, 0, 0, 0]]).promote 2, k.promote 6, k.promote (0 - 1), k.promote “x”]
# [$!.denum-demotion, $!.denum-rank, $!.denum-rank, $!.denum-rank]
```
Mixed ranks promote to the larger one before the operation, and the product keeps
its operand order. A rank 2 and a rank 3 CD multiply as two rank 3 CDs
```
; .c2 (CD [2, [0, 1, 0, 0]]); .c3 (CD [3, [0, 0, 1, 0, 0, 0, 0, 0]]);
; [(c2 * c3).schema (), (c2 * c3).loads, (c3 * c2).loads, (c2 * c3).loads = ((c2.promote 3) * c3).loads, (c2 + c3).schema (), (c2 + c3).count]
# [“CD[3]”, [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1], <>, “CD[3]”, 5]
; [((c3.promote 5) * (CD [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])).loads = ((c3 * (CD [1, [0, 1, 0, 0, 0, 0, 0, 0]])).promote 5).loads]
# [<>]
```
## Conjugation

Conjugation fixes the scalar signatures and swaps the two channels of every
other direction. It keeps the Count and the loads. A product conjugates in
reverse order, observed
```
; .g (CD [4, [1, 2, 3, 4]]);
; [(g.conj ()).loads, (g.conj ()).count, (g.conj ()).coordinates (), g.coordinates ()]
# [[1, 4, 3, 2], 4, [-2, 2], [-2, -2]]
; [(((J * I).conj ()).coordinates ()) = (((I.conj ()) * (J.conj ())).coordinates ()), ((CD [1, [4]]).conj ()).loads]
# [<>, [4]]
```
## Count

Count is carried and never derived from the loads. For these CD operations
it adds under `+`, multiplies under `*`, and survives the opposite, conjugation
and promotion. A Count of zero may hold nonzero loads
```
; .e (CD [3, [1, 0, 0, 2]]); .f (CD [4, [0, 5, 1, 0]]);
; [(e + f).count, (e * f).count, (e.opp ()).count, (e.conj ()).count, (e.promote 4).count, (e - f).count]
# [7, 12, 3, 3, 3, 7]
; .odd (CD [0, [3, 0, 0, 0]]);
; [odd.count, odd.##, (odd * f).count, (odd * f).loads, (odd + f).count]
# [0, 3, 0, [0, 15, 3, 0], 4]
```
## Coordinates: signed and unsigned

One method reads the preserved CD two ways. `d.coordinates ()` is the signed
coordinate `S_b = W₊,b − W₋,b` and `d.coordinates <>` is the unsigned
coordinate `U_b = W₊,b + W₋,b`, one integer per direction in the order of the
channels. They are observations: they never change the CD, and the Count is
neither used nor returned. `U` is not `|S|`: opposing loads 3 and 1 give
`S = 2` and `U = 4`, and the Count 1 below is not a coordinate
```
; .q (CD [1, [3, 2, 1, 4]]);
; [q.coordinates (), q.coordinates <>, q.observe (), q.count, q.loads]
# [[2, -2], [4, 6], [2, -2], 1, [3, 2, 1, 4]]
```
The Count is independent: the same loads at another Count, even zero, give the
same coordinates, and a positive Count over zero loads gives zero coordinates
```
; .q9 (CD [9, [3, 2, 1, 4]]); .q0 (CD [0, [3, 2, 1, 4]]); .qz (CD [5, [0, 0, 0, 0]]);
; [q9.coordinates (), q9.coordinates <>, q0.coordinates <>, qz.coordinates (), qz.coordinates <>, qz.count]
# [[2, -2], [4, 6], [4, 6], [0, 0], [0, 0], 5]
```
Rank 0 has one unsigned channel, so both readings are its one load. Higher ranks
have width 2ⁿ⁻¹
```
; .r0 (CD [2, [3]]); .r1 (CD [2, [4, 2]]); .r3 (CD [0, [1, 2, 3, 4, 0, 0, 0, 0]]);
; [r0.coordinates (), r0.coordinates <>, r1.coordinates (), r1.coordinates <>, r3.coordinates (), r3.coordinates <>]
# [[3], [3], [2], [6], [1, 2, 3, 4], [1, 2, 3, 4]]
```
Balanced opposing loads observe as zero in `S` and not in `U`, and the present
CD is still distinct from the missing host
```
; .bal (CD [1, [4, 4]]);
; [bal.coordinates (), bal.coordinates <>, (CD [0, [0]]).coordinates <>, [].#0]
# [[0], [8], [0], ()]
```
Only nil and true are arguments. A Count, text, a list, a block or a truthy
Frame is refused by name, not coerced, and `observe` accepts only nil
```
; [q.coordinates 1, q.coordinates 0, q.coordinates “x”, q.coordinates [1], q.coordinates [], q.coordinates {1}, q.observe <>, q.observe 1]
# [$!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation]
```
Rank 4 has eight directions and rank 5 sixteen, each in channel order. Here
positive loads 1 to 8 (or 1 to 16) sit over negative loads 10 times as large
```
; .q4 (CD [0, [1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 40, 50, 60, 70, 80]]);
; [q4.coordinates (), q4.coordinates <>]
# [[-9, -18, -27, -36, -45, -54, -63, -72], [11, 22, 33, 44, 55, 66, 77, 88]]
; .q5 (CD [0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]]);
; [q5.coordinates () .#, q5.coordinates <> .#, (q5.coordinates <>).0, (q5.coordinates <>).15, (q5.coordinates ()).15]
# [16, 16, 11, 176, -144]
```
The seven nonzero directions of rank 4 are the prospective Fano points, and a
line is the unsigned direction of the product of two of them. Nothing here is a
table: each direction below is read from the shipped product. The signs of
`e_001 e_010` and `e_010 e_001` differ and the direction `011` does not
```
; .p1 (CD [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .p2 (CD [1, [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .p4 (CD [1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
; [(p1 * p2).coordinates <>, (p2 * p1).coordinates <>, (p1 * p2).coordinates (), (p2 * p1).coordinates ()]
# [[0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, -1, 0, 0, 0, 0]]
; [(p1 * p4).coordinates <>, (p2 * p4).coordinates <>]
# [[0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0]]
```
Through the same projection the unsigned coordinate of a product is the XOR
convolution of the unsigned coordinates, and the signed associator at rank 4
collapses to one direction (`111`) under `<>`
```
; [(((o1 * o2) * o4).coordinates <>) = ((o1 * (o2 * o4)).coordinates <>), (((o1 * o2) * o4).coordinates ()) = ((o1 * (o2 * o4)).coordinates ()), ((o1 * o2) * o4).coordinates <>]
# [<>, (), [0, 0, 0, 0, 0, 0, 0, 1]]
```
## Coordinates and the native observers

The two coordinate readings are projections of the same loads that `d.##` and
`d.###` already report, so the observers cannot drift apart. For every rank the
unsigned coordinates total the Size, `Σ U_b = d.## = Σ W`. For rank 1 and above
the signed coordinates total the residual, `Σ S_b = d.###`. At rank 0 the one
coordinate is `W_ε` in both readings, but the declared residual is 0 by design,
so `Σ S = W_ε` and `d.### = 0` differ there. The Count is none of these
```
; .c0 (CD [4, [3]]); .c1 (CD [0, [4, 1]]); .c2 (CD [1, [3, 2, 1, 4]]);
; .c0s (c0.coordinates ()); .c1s (c1.coordinates ()); .c2s (c2.coordinates ());
; .tc0 (c0s.0); .tc1 (c1s.0); .tc2 ((c2s.0) + (c2s.1));
; [(c0.coordinates <>).##, c0.##, tc0, c0.###, c0.#]
# [3, 3, 3, 0, 4]
; [(c1.coordinates <>).##, c1.##, tc1, c1.###, c1.#]
# [5, 5, 3, 3, 0]
; [(c2.coordinates <>).##, c2.##, tc2, c2.###, c2.#]
# [10, 10, 0, 0, 1]
```
The same holds when the residual is negative, when loads are empty or balanced,
and at every higher rank, whatever the Count. Each row is the unsigned total, the
Size, the signed total, the residual and the Count
```
; .n2 (CD [0, [0, 1, 5, 3]]); .e2 (CD [7, [0, 0, 0, 0]]); .b3 (CD [2, [2, 0, 5, 0, 2, 0, 5, 0]]);
; .n4 (CD [0, [1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 40, 50, 60, 70, 80]]);
; .n5 (CD [3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]]);
; .n2s (n2.coordinates ()); .tn2 ((n2s.0) + (n2s.1));
; .n4s (n4.coordinates ()); .tn4 ((n4s.0) + (n4s.1) + (n4s.2) + (n4s.3) + (n4s.4) + (n4s.5) + (n4s.6) + (n4s.7));
; .n5s (n5.coordinates ()); .tn5 ((n5s.0) + (n5s.1) + (n5s.2) + (n5s.3) + (n5s.4) + (n5s.5) + (n5s.6) + (n5s.7) + (n5s.8) + (n5s.9) + (n5s.10) + (n5s.11) + (n5s.12) + (n5s.13) + (n5s.14) + (n5s.15));
; [(n2.coordinates <>).##, n2.##, tn2, n2.###, n2.#]
# [9, 9, -7, -7, 0]
; [(e2.coordinates <>).##, e2.##, (e2.coordinates ()).###, e2.###, e2.#]
# [0, 0, 0, 0, 7]
; [(b3.coordinates <>).##, b3.##, (b3.coordinates ()).###, b3.###, b3.#]
# [14, 14, 0, 0, 2]
; [(n4.coordinates <>).##, n4.##, tn4, n4.###, n4.#]
# [396, 396, -324, -324, 0]
; [(n5.coordinates <>).##, n5.##, tn5, n5.###, n5.#]
# [1496, 1496, -1224, -1224, 3]
```
D0 is the only exception, and it is by design. Its residual is 0 though its one
coordinate is the load, so no rank-0 row may be fixed by changing the residual
```
; .z0 (CD [0, [0]]); .p0 (CD [0, [9]]);
; [z0.coordinates (), z0.coordinates <>, z0.##, z0.###, p0.coordinates (), p0.coordinates <>, p0.##, p0.###]
# [[0], [0], 0, 0, [9], [9], 9, 0]
```

`x.#n` is the CD of rung n for n from 0 to 5, and bare `x.#` is still the
Count. A host answers its Count C, Size s and residual r, so `[1, 2, 3]` has
C = 3, s = 6 and r = 2. Rank 0 keeps the one load s, rank 1 puts (s+r)/2 on
`e_ε` and (s−r)/2 on `-e_ε`, which are the Demi's left and right loads, and a
higher rank puts the same two on `e_0…0` and `-e_0…0`
```
; .xs [1, 2, 3];
; [xs.#, xs.##, xs.###, “” (xs.####)]
# [3, 6, 2, “Demi(3,4,2)”]
; [“” (xs.#0), “” (xs.#1), “” (xs.#2)]
# [“CD[0](C=3, W=[6])”, “CD[1](C=3, W=[4, 2])”, “CD[2](C=3, W=[4, 0, 2, 0])”]
; [(xs.#3).loads, (xs.#4).##, (xs.#5).schema (), (xs.#5).loads .#, (xs.#5).coordinates ()]
# [[4, 0, 0, 0, 2, 0, 0, 0], 6, “CD[5]”, 32, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
; [xs.#1.loads = xs.####.loads, xs.#1.count = xs.####.count]
# [<>, <>]
```
A router of more than two channels keeps its channel Demi under `.####`, and
`.#1` is the binary projection of the same three observers, which is what the
fourth hash derives for a binary router. Both answers are pinned
```
; Routers <- './hc/rotor-router.hc';
; .RotorRouter Routers.RotorRouter;
; .r3 (RotorRouter [[5, 8], [6], [7]]); .r2 (RotorRouter [[5], [6]]);
; [r3.#, r3.##, r3.###, “” r3.####, “” r3.#1, “” r3.#2, (r3.#1).count = r3.####.count]
# [4, 26, 14, “Demi(4,[13, 6, 7])”, “CD[1](C=4, W=[20, 6])”, “CD[2](C=4, W=[20, 0, 6, 0])”, <>]
; [“” r2.####, “” r2.#1, (r2.#1).loads = [(r2.####).left, (r2.####).right]]
# [“Demi(2,5,6)”, “CD[1](C=2, W=[5, 6])”, <>]
```
It is construction, not promotion. Promotion of an existing Demi-shaped host
adds nothing, because a host's applications carry no higher signature. Each
observer is read once, and a Frame without a Count has no CD, as it has no
Demi. An empty host, zero Count and nil answer nil at every rank
```
; [[].#0, [].#1, [].#5, ().#2, 0.#3]
# [(), (), (), (), ()]
; [“”.#1, “” (“a”.#0), ({5 + 3}.#1).loads = ({5 + 3}.####).loads, ({5 + 3}.#1).count]
# [(), “CD[0](C=1, W=[1])”, <>, 3]
```
Application to a zero Size still counts, so a CD of zero loads can have a
positive Count, and it is present. It is not the missing host
```
; .zs [0, 0];
; [“” (zs.#0), “” (zs.#1), zs.#0 = (), (CD [0, [0]]) = ()]
# [“CD[0](C=2, W=[0])”, “CD[1](C=2, W=[0, 0])”, (), ()]
```
A CD answers the ranked hash by promotion of its own state, at every Count
including zero, and `$!.denum-demotion` below its rank. Nothing the source
declares can steer it: a lookalike aggregate with the same fields is an
ordinary host and is measured like any other
```
; .dn (CD [0, [3, 1]]);
; [“” (dn.#1), “” (dn.#3), (dn.#2).loads, (dn.#5).count, dn.#0]
# [“CD[1](C=0, W=[3, 1])”, “CD[3](C=0, W=[3, 0, 0, 0, 1, 0, 0, 0])”, [3, 0, 1, 0], 0, $!.denum-demotion]
; .fake [.count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}];
; [“” (fake.#1), “” (fake.#0), fake.#]
# [“CD[1](C=99, W=[99, 0])”, “CD[0](C=99, W=[99])”, 99]
; [xs.#6, xs.#7, xs.#99]
# [$!.denum-rank, $!.denum-rank, $!.denum-rank]
```
A generic Denum is never a source for the ranked hash, even when its arity is a
power of two. Its loads are not signed channels, so `#n` neither promotes nor
interprets them, and it does not fall back to measuring the Denum's Count and
Size as an ordinary host and quietly building a CD. The answer is the named
refusal `$!.denum-not-cd`, at every rung, and the Denum is unchanged
```
; .gh (Denum [7, [3, 2, 1, 4]]); .gh1 (Denum [4, [5]]); .gh2 (Denum [0, [3, 1]]); .gh3 (Denum [2, [1, 2, 3]]);
; [gh.#0, gh.#1, gh.#2, gh.#3, gh.#5, gh1.#0, gh1.#1, gh2.#1, gh2.#5, gh3.#2]
# [$!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd]
; [gh.#6, gh.count, gh.loads, gh.schema (), gh.rank ()]
# [$!.denum-rank, 7, [3, 2, 1, 4], “Arity[4]”, 2]
```
The derived hash of a CD is the ordinary derived Demi of its three
observers, which is binary and forgets directions. `d.#n` is the CD, and its
algebraic value is an observation, never the return of `#n`
```
; [dn.####, “” ((CD [5, [1, 2, 3, 4]]).####)]
# [(), “Demi(5,3,7)”]
```
`Demi` keeps its own contracts. Its `+`, `-`, `*` and `./` are not CD
arithmetic, and a CD is not a Demi
```
; .d (xs.####);
; [“” (d + 5), “” (d * 2), “” (d ./ 3), xs.#1 + 5]
# [“Demi(3,4,7)”, “Demi(3,8,4)”, “Demi(3,[2, 2, 2])”, $!!.invalid-denum]
```
## Syntax boundaries

The ranked hash is `.#` followed directly by decimal digits. A space ends it,
and `.##` and `.###` are unchanged. A plain `#` still starts a comment, and the
lexer cases are pinned in `lib/frames/frame-name.test.ts`
```
; [xs.# 2, xs.##, xs.###, xs.##]
# [6, 6, 2, 6]
