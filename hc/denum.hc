#!/usr/bin/env hc
```
Denum and its derived CD view (occurrence/figure 007.31, 007.32, 007.32b, 007.35,
007.35b, 007.36)

There is one public constructor of retained state, `Denum [Count, loads]`, over
a Count and a nonempty ordered list of nonnegative integer loads, one per
channel, of any positive arity. It stores no rank and no schema, and it is not a
conventional number. The signed Cayley–Dickson algebra is a *view* of a Denum,
requested by `d.cd ()`:

    d = Denum [7, [3, 2, 1, 4]]    the only retained state
    e = x.#2                       a ranked observation: a Denum, never a view
    c = d.cd ()                    an explicit Cayley–Dickson view of d
    t = (Denum [7, [3, 2, 1]]).cd ()   refused: $!.denum-unsupported-arity

**One constructor, one retained Figure.** There is no `CD [Count, loads]`
constructor, no `Denum.cd [Count, loads]` and no conversion constructor. The
view holds the state of the Denum it was derived from and reads its `count` and
`loads` from that state; it has no Count, loads, rank or schema of its own that
could disagree. Every view operation answers a view of a newly derived Denum
state, and `v.denum ()` recovers that state as a Denum. The algebra is supplied
by the request, not inferred from the arity: a Denum with four, eight or
thirty-two loads is generic until `.cd ()` is asked, and the arity alone never
selects the multiplication law. The only algebra published here is the binary
Cayley–Dickson ladder, CD[0] to CD[5]: there is no Fano primitive and no
algebraic reconstruction claim.

Both are ordinary HC classes, like `Demi`. The view arithmetic is the
Cayley–Dickson recurrence `(a,b)(c,d) = (ac − d̄b, da + bc̄)`, computed by the one
pure native seam `denum-engine` (`lib/ops/denum.ts`, over the typed reference in
`lib/frames/denum.ts`), so no multiplication table is written in HC or in
TypeScript. The engine's CD operations accept only native view frames, which
only the `view` operation makes, and only from a native Denum state, so a raw
`[count, loads]` payload, a lookalike aggregate or a bare `2ⁿ`-load array has no
CD capability. Everything else either type does is in this file.

**The generic Denum.** `Denum [count, loads]` accepts every positive arity
(1, 2, 3, 4, 5, 6, 8, 33, 64, ...). Its observers are `d.count`, `d.loads`,
`d.#` (the Count), `d.##` (the total load), `d.rank ()` (`⌊log₂ A⌋` of the arity
`A = d.loads.#`, by integer arithmetic and never from the Count), `d.schema ()`
(always `Arity[A]`, even at A = 1, 2, 4, 8, 16, 32) and text
`Denum(Arity[A], C=.., W=[..])`. Its one operation is `+` with another Denum of
the same arity: Counts add, loads add componentwise, nothing cancels and the
result is a fresh Denum. A different arity is `$!.denum-arity-mismatch`; nothing
is padded, truncated or aligned. Everything that needs a signature law (`-`,
`*`, `opp`, `conj`, `promote`, `coordinates`, `observe`, `signatures`, `d.###`)
answers the named refusal `$!.denum-not-cd`, whatever the arity: a generic Denum
has no residual, opposite or product. These methods are defined, to refuse,
rather than absent. A Denum of zero loads is present, not nil.

**The view.** `d.cd ()` is a unary, pure observation. It needs one of the
shipped channel arities 1, 2, 4, 8, 16, 32; any other arity is
`$!.denum-unsupported-arity`. Any argument but nil is `$!!.unary-observation`.
The source is neither changed nor reordered, and asking twice answers equal
views. The rank `v.rank ()` is again derived, `v.schema ()` is `CD[n]` with text
`CD[n](C=.., W=[..])`. View identity is the class, not the arity: a `+`, `-` or
`*` operand must equal the view that `.cd ()` derives from its own `count` and
`loads`, so a lookalike aggregate with the same fields is `$!!.invalid-denum`,
and a Denum with the same fields is not a view. A view is not a source for the
ranked hash, and a Denum is not an operand of a view operation.

**Ranks and channels of a view.** On rank n the schema is `CD[n]`, the rung of
the step ladder. Rank 0 has one unsigned channel, `e_ε`. Rank n of 1 or more has
2ⁿ channels, `±e_b` for every direction `b` of n−1 bits, positives first and
then negatives, each in direction order:

    CD[0]  e_ε
    CD[1]  e_ε, -e_ε
    CD[2]  e_0, e_1, -e_0, -e_1
    CD[3]  e_00, e_01, e_10, e_11, -e_00, -e_01, -e_10, -e_11
    CD[4]  ±e_b for b in {0,1}³        16 channels
    CD[5]  ±e_b for b in {0,1}⁴        32 channels

A minus names a *signature*, never a negative load: every load is a Count.
`v.signatures ()` lists the native names in channel order. Opposite channels stay
separately counted after every operation, so `X + Opp X` is a present, nonempty
view that merely observes as zero. The conventional algebraic value is an
observation, `v.coordinates ()`.

**State.** `d.count` (the full application Count, kept apart from the loads)
and `d.loads` (one Count per channel) are the whole retained state. The
observers `d.rank ()` and `d.schema ()` are computed from the loads on each call,
so there is no stored rank to drift; the v0.46.0 data spelling `d.rank` and
`d.schema` is replaced by these calls. Anything that is not a Count and a
nonempty list of Counts, including the old three-field `[rank, count, loads]`,
is refused with `$!!.invalid-denum`. `Denum [0, [0]]`, an explicit zero-load
state, is present: it is neither the missing host that `[].#0` leaves nil nor a
nonempty value that observes as zero.

**View arithmetic.** `+`, `-` and `*` take another view, and only a view.
Operands of different rank are both promoted to the larger rank first
(`promote`), and the result is a view of a fresh Denum of that rank:

- `a + b` adds corresponding loads and keeps opposite channels separate.
- `a * b` is the ordered Cartesian product of weighted signatures: loads
  multiply, the signed destination is the recurrence's, and only identical full
  signatures aggregate. Operand order and parentheses are kept, and from
  rank 4 the product is not associative.
- `a - b` is `a + b.opp ()`: subtraction is addition of the opposite, observed,
  never erased.
- `v.opp ()` swaps the loads of `+e_b` and `-e_b`; a D0 is promoted to D1 first.
- `v.conj ()` keeps the scalar signatures and swaps every other pair.
- `v.promote k` embeds into rank k by the old-summand map, `±e_b ↦ ±e_(0b)`,
  keeping Count and loads and starting new channels at zero. A lower k is
  `$!.denum-demotion`.
- `v.coordinates ()` is the algebraic observation: the signed coordinate of each
  direction, positive load minus negative load, `S_b = W₊,b − W₋,b`.
  `v.coordinates <>` is the directional observation: the unsigned coordinate,
  positive load plus negative load, `U_b = W₊,b + W₋,b`, which forgets the
  signature and keeps all load. Each is an ordered list of integers, width 1 at
  rank 0 and 2ⁿ⁻¹ at rank n, and not the view; neither changes the view or
  returns its Count. At rank 0 both are `[W_ε]`. The only arguments are nil
  `()` and true `<>`; any other argument (a Count, text, a list) is
  `$!!.unary-observation`, never coerced by truthiness.
- `v.observe ()` is the deprecated v0.45.0 spelling of `v.coordinates ()`,
  kept only as a compatibility alias with exactly the signed result. It takes
  no unsigned argument; use `v.coordinates`.

**Mixed operands.** A generic Denum and a view never combine, in either order, at
equal arity or equal rank: `Denum + view` and `view + Denum` answer
`$!.denum-mixed`, as do a view `-` or `*` with a Denum operand. A generic `-` or
`*` is already the CD-only refusal `$!.denum-not-cd`. Nothing is reinterpreted
and nothing is coerced.

**Count.** The candidate laws of 007.32 section 6 hold for these new operations
only: `C(a+b) = C(a)+C(b)` (generic and view), `C(a*b) = C(a)·C(b)` and
`C(Opp a) = C(a)` for views, and promotion and conjugation keep Count. Count is
carried, never derived from the loads, and it is not the application phase
`C mod arity`. `Demi` and its `+`, `-`, `*` and `./` are unchanged. This is a
software construction of a supplied recurrence, not a derivation of it from bare
counting.

**Observers.** Both types declare their own Count (`d.#`) and Size (`d.##`, the
total load). A view also declares its residual (`v.###`, positive minus negative
total, 0 at rank 0), so its `.####` is the ordinary derived Demi of those three,
which is binary and forgets the directions. A generic Denum has no residual
(`d.###` is `$!.denum-not-cd`).

**The ranked hash.** `x.#n` is an explicit rung operation, n from 0 to 5, and
there is no `#n=`. It answers a generic Denum, never a view. For any Frame x that
is not a Denum or a view, `x.#n` answers the Denum of rank n, `nil` when x has no
Count or Count zero, as `x.####` does. For an ordinary or binary host `x.#1` has
the Count and the left and right loads of `x.####`. A `RotorRouter` of more than
two channels is the exception: `.####` answers its channel Demi, and `.#n` does
not special-case it, so it is the two-channel projection of the router's Count,
Size and residual. Bare `x.#` is still the Count. The host is built from the
three observers it answers, Count C, Size s and residual r: rank 0 keeps the load
s, and rank n ≥ 1 puts (s+r)/2 on the first channel and (s−r)/2 on the first
channel of the second half, the two the fourth hash reads as left and right,
with every other channel zero. A host's applications carry no higher signature,
so none is routed to them. That is construction, and it is not promotion. A Denum
of a shipped binary arity (1, 2, 4, 8, 16, 32) answers `x.#n` by the structural
load-preserving embedding at rung n, keeping Count and loads, and
`$!.denum-demotion` below its own rank. The embedding does not invoke the view,
so the answer is a Denum; it is the same map `v.promote` applies, with no CD
operation attached. A Denum of another arity has no embedding and answers
`$!.denum-unsupported-arity`: nothing is truncated, padded or read as `2^rank`.
A view is not a source: `x.#n` answers `$!.denum-view-source` for it (ask the
Denum it views, `v.denum ()`). A forged lookalike is not recognized as either.
A rank above 5 is `$!.denum-rank`.

The classes are evaluated from the compiled-in bundle the first time a ranked
hash needs them, in a namespace of its own (`lib/execute/denum-prologue.ts`), so
this file must not import.
```
.denum-state {.s _; .c (s .0); .l (s .1); [
    .state s;
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
    .cd {.u ((_ = ()) ? {1} : {0}); .me _^; .f (_^^ .finish-cd);
      (u = 1) ? {(f (denum-engine [14, (me .state)]))} : {$!!.unary-observation}};
    .toText {“Denum(” (_^ .schema ()) “, C=” (_^ .count) “, W=” (_^ .loads) “)”}
  ]};
.cd-state {.s _; .c (s .0); .l (s .1); [
    .state s;
    .rank {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [11, (me .count), (me .loads)]} : {$!!.unary-observation}};
    .schema {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [9, (me .state)]} : {$!!.unary-observation}};
    .count c;
    .loads l;
    .# {_^.count};
    .## {(_^ .loads).##};
    .### {denum-engine [10, (_^ .state)]};
    .+ {.o (_^^ .operand-cd _); .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [1, (me .state), (o .state)]))};
    .- {.o (_^^ .operand-cd _); .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [2, (me .state), (o .state)]))};
    .* {.o (_^^ .operand-cd _); .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [3, (me .state), (o .state)]))};
    .promote {.k _; .me _^; .f (_^^ .finish-cd);
      (f (denum-engine [6, (me .state), k]))};
    .opp {.u ((_ = ()) ? {1} : {0}); .me _^; .f (_^^ .finish-cd);
      (u = 1) ? {(f (denum-engine [4, (me .state)]))} : {$!!.unary-observation}};
    .conj {.u ((_ = ()) ? {1} : {0}); .me _^; .f (_^^ .finish-cd);
      (u = 1) ? {(f (denum-engine [5, (me .state)]))} : {$!!.unary-observation}};
    .coordinates {.s ((_ = ()) ? {1} : {0}); .t ((_ = <>) ? {1} : {0}); .me _^;
      ((s + t) = 1) ? {denum-engine [7, (me .state), t]} : {$!!.unary-observation}};
    .observe {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [7, (me .state), 0]} : {$!!.unary-observation}};
    .signatures {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [8, (me .state)]} : {$!!.unary-observation}};
    .denum {.u ((_ = ()) ? {1} : {0}); .me _^; .d (_^^ .Denum);
      (u = 1) ? {(d [(me .count), (me .loads)])} : {$!!.unary-observation}};
    .toText {(_^ .schema ()) “(C=” (_^ .count) “, W=” (_^ .loads) “)”}
  ]};
.view-of {.d _; (d .cd ())};
.operand-denum {.o _; .r (Denum [(o .count), (o .loads)]);
  (o = r) ? {o} : {(refuse-operand o)}};
.viewable {.g _; ((g ~ ([].<>)) ? {(denum-engine [17, (g .state)])} : {0})};
.operand-cd {.o _; .g (Denum [(o .count), (o .loads)]);
  ((viewable g) = 1) ? {.r (view-of g); (o = r) ? {o} : {(refuse-operand o)}} : {(refuse-operand o)}};
.refuse-operand {.o _; .g (Denum [(o .count), (o .loads)]);
  .ig (((g ~ ([].<>)) ? {(o = g)}) ? {1} : {0});
  .ic (((viewable g) = 1) ? {.c (view-of g); (o = c) ? {1} : {0}} : {0});
  ((ig + ic) = 1) ? {denum-engine [16]} : {$!!.invalid-denum}};
.finish-denum {.s _; ((s ~ ([].<>)) ? {denum-state s} : {s})};
.finish-cd {.s _; ((s ~ ([].<>)) ? {cd-state s} : {s})};
.Denum {.a _; ((a ~ ([].<>)) ? {(a .#) = 2}) ? {.s (denum-engine [0, (a .0), (a .1)]);
  (s ~ ([].<>)) ? {denum-state s} : {$!!.invalid-denum}} : {$!!.invalid-denum}}
```
## Construction

There is one public constructor of retained state, `Denum [count, loads]`, and
the explicit Cayley–Dickson interpretation is a request on the result, `d.cd ()`.
Both views and Denums hold only the Count and one load per channel; the rank
and schema are observed from the loads, never stored. In this file `V [count,
loads]` is shorthand for `(Denum [count, loads]).cd ()`, defined once for the
examples. It is not a constructor of the bundled classes: there is no `CD` name
in them, and `V` exists only in these examples
```
; .V {.d (Denum _); (d .cd ())};
; .z (V [0, [0]]);
; [z.rank (), z.schema (), z.count, z.loads, z.#, z.##, z.###, “” z]
# [0, “CD[0]”, 0, [0], 0, 0, 0, “CD[0](C=0, W=[0])”]
```
A Denum of zero loads is equally present: it is not nil and not a view
```
; .gz (Denum [0, [0, 0, 0, 0]]);
; [“” gz, gz.rank (), gz.schema (), gz.count, gz.loads, gz.##, gz = ()]
# [“Denum(Arity[4], C=0, W=[0, 0, 0, 0])”, 2, “Arity[4]”, 0, [0, 0, 0, 0], 0, ()]
```
The loads are Counts, one per channel, and the Count is kept apart from them: a
state may hold loads at Count zero, or a Count over zero loads. A negative Count
or load, a fractional load, an empty load list, the legacy three-field
`[rank, count, loads]` constructor and a non-list (a bare Count or text for the
loads included) are refused by `Denum`, and so by every view request, because no
view exists without a Denum
```
; [“” (V [7, [3, 2, 0, 1]]), “” (V [0, [4, 0]]), “” (V [5, [0, 0]])]
# [“CD[2](C=7, W=[3, 2, 0, 1])”, “CD[1](C=0, W=[4, 0])”, “CD[1](C=5, W=[0, 0])”]
; [Denum [(0 - 1), [0, 0]], Denum [0, [0, (0 - 1)]], Denum [0, [0, 1.5]], Denum [0, []], Denum 5, Denum [0], Denum [1, 0, [0, 0]], Denum [2, 7, [3, 2, 0, 1]], Denum [0, [0, 0], 9], Denum [0, 5], Denum [0, “x”]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
```
## One constructor, a derived view

`Denum [7, [3, 2, 1, 4]]` is generic. It has the arity 4, the rank 2, the Count 7
and the Size 10, but the channel count does not select the algebra: only the
request `.cd ()` does, and it answers a different type. The Denum schema is
`Arity[4]`, the view's `CD[2]`, the texts differ, and the two are not equal. The
view reads its Count and loads from the Denum it was derived from, and the Denum
is unchanged
```
; .gd (Denum [7, [3, 2, 1, 4]]); .dc (gd.cd ());
; [gd.#, dc.#, gd.##, dc.##, gd.rank (), dc.rank (), gd.schema (), dc.schema ()]
# [7, 7, 10, 10, 2, 2, “Arity[4]”, “CD[2]”]
; [“” gd, “” dc, gd = dc, dc = gd, gd.loads = dc.loads, gd.count = dc.count]
# [“Denum(Arity[4], C=7, W=[3, 2, 1, 4])”, “CD[2](C=7, W=[3, 2, 1, 4])”, (), (), <>, <>]
```
Deriving the view again is deterministic, and the source is untouched: still
generic, still equal to its own reconstruction. The Denum behind a view is
recovered with `v.denum ()`, equal to the original
```
; [gd.cd () = dc, dc.denum () = gd, “” (dc.denum ()), gd.loads, gd.count, gd = (Denum [7, [3, 2, 1, 4]])]
# [<>, <>, “Denum(Arity[4], C=7, W=[3, 2, 1, 4])”, [3, 2, 1, 4], 7, <>]
```
Only the view has the signed and unsigned coordinates and the signatures. The
Denum has no CD interpretation: every CD-only operation on it answers the named
refusal `$!.denum-not-cd`, whatever its arity, and its loads are untouched
```
; [dc.coordinates (), dc.coordinates <>, dc.signatures (), dc.###]
# [[2, -2], [4, 6], [“e_0”, “e_1”, “-e_0”, “-e_1”], 0]
; [gd.coordinates (), gd.coordinates <>, gd.observe (), gd.signatures (), gd.###]
# [$!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd]
; [gd.opp (), gd.conj (), gd.promote 3, gd * gd, gd - gd, gd.loads, gd.count]
# [$!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, [3, 2, 1, 4], 7]
```
The request is unary. Any argument but nil is refused by name, and the Denum is
unchanged. A view has no `.cd`, and none of the old constructor spellings exist
```
; [gd.cd 1, gd.cd <>, gd.cd “x”, gd.cd [1]]
# [$!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation]
; [dc.denum 1, dc.denum <>, gd.loads]
# [$!!.unary-observation, $!!.unary-observation, [3, 2, 1, 4]]
```
## Derived rank and arbitrary arity

The rank is `⌊log₂ A⌋` of the arity `A = d.loads.#`, by integer arithmetic. It is
never the Count `d.#`, and there is no rank field: `d.rank ()` computes it from
the loads alone each time it is asked. This is an explicit call, so the v0.46.0
data spelling `d.rank` is gone, and any argument but `()` is
`$!!.unary-observation`. Any positive number of loads is a Denum, so
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
same holds for the view observer
```
; .z4 [0, 0, 0, 0]; .z8 [0, 0, 0, 0, 0, 0, 0, 0];
; [(Denum [0, [0]]).rank (), (Denum [0, [0, 0]]).rank (), three.rank (), (Denum [0, z4]).rank (), (Denum [0, [1, 2, 3, 4, 5]]).rank (), (Denum [0, [1, 2, 3, 4, 5, 6]]).rank (), (Denum [0, [1, 2, 3, 4, 5, 6, 7]]).rank (), (Denum [0, z8]).rank ()]
# [0, 1, 1, 2, 2, 2, 2, 3]
; [(V [0, [0]]).rank (), (V [0, [0, 0]]).rank (), (V [0, z4]).rank (), (V [0, z8]).rank ()]
# [0, 1, 2, 3]
```
Identical loads at different Counts have the same rank, and the Count never
enters it
```
; [(Denum [0, [3, 2, 1]]).rank (), (Denum [99, [3, 2, 1]]).rank (), (Denum [1000, [0]]).rank (), (Denum [1000, [0, 0]]).rank ()]
# [1, 1, 0, 1]
```
A Denum accepts every positive arity, including 5, 6, 33 and 64, whose rank 6 is
above the shipped CD rung 5. Its schema text is `Arity[A]`
```
; .t6 (Denum [1, [1, 2, 3, 4, 5, 6]]);
; .t33 (Denum [1, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .t64 (Denum [2, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
; [t6.schema (), t6.rank (), t33.schema (), t33.rank (), t64.schema (), t64.rank (), t64.loads.#, t64.##, (Denum [0, [0, 0, 0, 0, 0]]).schema ()]
# [“Arity[6]”, 2, “Arity[33]”, 5, “Arity[64]”, 6, 64, 0, “Arity[5]”]
```
## Generic addition

Two Denums of the same arity add componentwise: Counts add, loads add, nothing
cancels, and the result is a fresh Denum of that arity. This is true at an odd
arity and at a power of two alike, and the Count is independent of the Size
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
## View eligibility

`d.cd ()` needs one of the shipped channel arities 1, 2, 4, 8, 16 or 32. Any
other arity is the named refusal `$!.denum-unsupported-arity`; no channel is
padded, truncated or dropped, and the Denum is unchanged
```
; [“” ((Denum [7, [3, 2, 1, 4]]).cd ()), “” ((Denum [0, [0]]).cd ())]
# [“CD[2](C=7, W=[3, 2, 1, 4])”, “CD[0](C=0, W=[0])”]
; .zeros33 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
; [(Denum [7, [3, 2, 1]]).cd (), (Denum [7, [3, 2, 1, 4, 5]]).cd (), (Denum [1, [1, 2, 3, 4, 5, 6]]).cd (), (Denum [0, zeros33]).cd (), t64.cd ()]
# [$!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity]
```
There is no way to ask for a view without a Denum. A view of a Denum is not a
new constructor of state: its Count and loads are the Denum's, and the Denum
behind it is recovered, equal, with `v.denum ()`. A fresh Denum built from the
same fields is the same Denum, and so derives the same view
```
; .src (Denum [7, [3, 2, 1, 4]]); .made ((Denum [(src.count), (src.loads)]).cd ());
; [“” made, made = src, made = (src.cd ()), src.schema (), made.schema (), src.loads]
# [“CD[2](C=7, W=[3, 2, 1, 4])”, (), <>, “Arity[4]”, “CD[2]”, [3, 2, 1, 4]]
```
## Mixed operands

A Denum and a view never combine, in either order and at any arity or rank. The
Denum is not reinterpreted as a view at a matching arity, and a view is not read
as a Denum either. `+` answers `$!.denum-mixed`; a generic `-` or `*` is the
CD-only refusal `$!.denum-not-cd` on its own, and a view `-` or `*` with a Denum
operand is `$!.denum-mixed`
```
; [gd + dc, dc + gd, dc - gd, dc * gd, gd - dc, gd * dc]
# [$!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-not-cd, $!.denum-not-cd]
; .dc1 (V [1, [1, 0]]); .gd1 (Denum [1, [1, 0]]); .gd2 (Denum [1, [1]]); .dc0 (V [1, [1]]);
; [dc1 + gd1, gd1 + dc1, dc1 * gd1, dc0 + gd2, gd2 + dc0, dc + (Denum [1, [1, 2, 3]]), (Denum [1, [1, 2, 3]]) + dc]
# [$!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed, $!.denum-mixed]
```
Neither identity is forged by copying `count` and `loads`: a plain aggregate with
the same fields is neither a Denum nor a view, whatever the operation or the
order
```
; .fake [.count 7; .loads [3, 2, 1, 4]];
; [gd + fake, dc + fake, dc - fake, dc * fake, gd + [.count 7; .loads [3, 2, 1]], dc + [.count 7; .loads [3, 2, 1]]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; .lookalike [.count 7; .loads [3, 2, 1, 4]; .rank {2}; .schema {“CD[2]”}];
; [dc + lookalike, gd + lookalike, dc * lookalike, fake = dc, fake = gd]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, (), ()]
```
## Native capability

The engine's CD operations do not take payloads. They take native view frames,
which only the `view` operation makes, and only from a native Denum state. An
arbitrary `[count, loads]` payload, a state built by hand, a lookalike with a
`state` field and a bare `2ⁿ`-load array all lack that capability. The raw
spelling of the old operations is refused by name, and so is a view request on a
payload (`$!!.invalid-denum`)
```
; [denum-engine [3, 1, [0, 1, 0, 0], 1, [0, 1, 0, 0]], denum-engine [1, 7, [3, 2, 1, 4], 1, [0, 1, 0, 0]], denum-engine [7, 7, [3, 2, 1, 4]], denum-engine [14, 7, [3, 2, 1, 4]]]
# [$!.denum-not-view, $!.denum-not-view, $!.denum-not-view, $!!.invalid-denum]
; .forged [.count 7; .loads [3, 2, 1, 4]; .state [7, [3, 2, 1, 4]]];
; [denum-engine [14, (forged .state)], denum-engine [7, (forged .state), 0], denum-engine [14, [7, [3, 2, 1, 4]]], denum-engine [9, [7, [3, 2, 1, 4]]], denum-engine [10, gd]]
# [$!!.invalid-denum, $!.denum-not-view, $!!.invalid-denum, $!.denum-not-view, $!.denum-not-view]
```
A real view derived by `.cd ()` carries the capability, and a Denum state does not
turn into a view without the request: the `view` operation on a view, or on the
state of a view, is the same refusal
```
; [denum-engine [9, (dc .state)], denum-engine [9, (gd .state)], denum-engine [14, (dc .state)], denum-engine [9, (denum-engine [14, (gd .state)])]]
# [“CD[2]”, $!.denum-not-view, $!!.invalid-denum, “CD[2]”]
```
## Signatures

The native spelling has no sign bit: the direction is a bitstring of rank − 1
bits, and a minus names the opposite signature. Rank 0 has only `e_ε`
```
; [(V [0, [0]]).signatures (), (V [0, [0, 0]]).signatures (), (V [0, [0, 0, 0, 0]]).signatures ()]
# [[“e_ε”], [“e_ε”, “-e_ε”], [“e_0”, “e_1”, “-e_0”, “-e_1”]]
; (V [0, [0, 0, 0, 0, 0, 0, 0, 0]]).signatures ()
# [“e_00”, “e_01”, “e_10”, “e_11”, “-e_00”, “-e_01”, “-e_10”, “-e_11”]
; (V [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]).signatures () .# 
# 16
; ((V [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]).signatures ()) .# 
# 32
```
## Rank 0 and rank 1: Size and signed integers

D0 adds and multiplies unsigned Size, and Counts add and multiply with it. D1
has the two signatures `e_ε` and `-e_ε`, and the product of two minus signatures
is the plus signature, `(-e_ε)(-e_ε) = e_ε`, while every load stays a Count
```
; .a (V [2, [3]]); .b (V [5, [4]]);
; [(a + b).loads, (a + b).count, (a * b).loads, (a * b).count]
# [[7], 7, [12], 10]
; .p (V [1, [1, 0]]); .m (V [1, [0, 1]]);
; [(m * m).loads, (m * p).loads, (p * m).loads, (p * p).loads]
# [[1, 0], [0, 1], [0, 1], [1, 0]]
; [((V [1, [0, 2]]) * (V [1, [0, 3]])).loads, ((V [1, [0, 2]]) * (V [1, [0, 3]])).coordinates ()]
# [[6, 0], [6]]
```
Opposite swaps the two channels and subtraction adds the opposite. The balanced
result observes as zero yet is a present, nonempty Denum with both loads
```
; .x (V [1, [5, 2]]); .y (V [1, [3, 0]]);
; [x.coordinates (), (x.opp ()).loads, (x - y).loads, (x - y).coordinates (), (x - y).count]
# [[3], [2, 5], [5, 5], [0], 2]
; .s (V [1, [4, 4]]);
; [s.coordinates (), s.loads, s.#, s.##, s.###]
# [[0], [4, 4], 1, 8, 0]
```
A D0 has no negative signature, so its opposite is promoted to D1 first
```
; ((V [3, [4]]).opp ()).loads
# [0, 4]
; ((V [3, [4]]).opp ()).schema ()
# “CD[1]”
```
## Operands are views only

A view's `+`, `-` and `*` refuse a right operand that is not a view, even when
it carries the same `count` and `loads` fields, as `x.#n` refuses a forged source.
A Denum with those fields is `$!.denum-mixed`, shown above
```
; .dp (V [1, [1, 0]]); .lookalike [.count 1; .loads [1, 0]];
; [dp + lookalike, dp - lookalike, dp * lookalike, dp + [1, 1, [1, 0]], dp * 2]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; [(dp + dp).loads, (dp * (dp + dp)).loads, (dp + (dp.opp ())).loads, “” (dp + dp)]
# [[2, 0], [2, 0], [1, 1], “CD[1](C=2, W=[2, 0])”]
```
## Rank 2: J² = −1 and the four-step cycle

`e_1` is the direction bit of J. Its square is the opposite scalar `-e_0`, and
the fourth power is back at `e_0`, observed
```
; .j (V [1, [0, 1, 0, 0]]);
; [(j * j).loads, (j * j).coordinates (), ((j * j) * (j * j)).loads, ((j * j) * (j * j)).coordinates ()]
# [[0, 0, 1, 0], [-1, 0], [1, 0, 0, 0], [1, 0]]
```
## Rank 3: order matters

With J = `e_01`, I = `e_10` and K = `e_11`, J·I = K and I·J = −K
```
; .J (V [1, [0, 1, 0, 0, 0, 0, 0, 0]]); .I (V [1, [0, 0, 1, 0, 0, 0, 0, 0]]);
; [(J * I).loads, (I * J).loads]
# [[0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1]]
```
## Rank 4: the octonion associator

`(e_001 e_010) e_100` is `+e_111` and `e_001 (e_010 e_100)` is `-e_111`. The
view keeps the parentheses, so the two groupings differ
```
; .o1 (V [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .o2 (V [1, [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .o4 (V [1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
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
The product is not an empty view: it holds four loads, in cancelling pairs
```
; .u (V [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .v (V [1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]]);
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
; .t (V [4, [6]]);
; [(t.promote 1).loads, (t.promote 2).loads, ((t.promote 1).promote 2).loads = (t.promote 2).loads, (t.promote 3).count]
# [[6, 0], [6, 0, 0, 0], <>, 4]
; .k (V [3, [2, 5]]);
; [(k.promote 2).loads, (k.promote 3).loads, ((k.promote 2).promote 3).loads = (k.promote 3).loads, k.loads, k.rank ()]
# [[2, 0, 5, 0], [2, 0, 0, 0, 5, 0, 0, 0], <>, [2, 5], 1]
; [((V [1, [0, 1, 0, 0]]).promote 3).loads, ((V [1, [0, 0, 0, 1]]).promote 3).loads]
# [[0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0]]
```
A lower rank is refused, and so is a rank above 5 or something that is not a
Count. The source is never changed
```
; [(V [1, [0, 0, 0, 0, 0, 0, 0, 0]]).promote 2, k.promote 6, k.promote (0 - 1), k.promote “x”]
# [$!.denum-demotion, $!.denum-rank, $!.denum-rank, $!.denum-rank]
```
Mixed ranks promote to the larger one before the operation, and the product keeps
its operand order. A rank 2 and a rank 3 view multiply as two rank 3 views
```
; .c2 (V [2, [0, 1, 0, 0]]); .c3 (V [3, [0, 0, 1, 0, 0, 0, 0, 0]]);
; [(c2 * c3).schema (), (c2 * c3).loads, (c3 * c2).loads, (c2 * c3).loads = ((c2.promote 3) * c3).loads, (c2 + c3).schema (), (c2 + c3).count]
# [“CD[3]”, [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1], <>, “CD[3]”, 5]
; [((c3.promote 5) * (V [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])).loads = ((c3 * (V [1, [0, 1, 0, 0, 0, 0, 0, 0]])).promote 5).loads]
# [<>]
```
## Conjugation

Conjugation fixes the scalar signatures and swaps the two channels of every
other direction. It keeps the Count and the loads. A product conjugates in
reverse order, observed
```
; .g (V [4, [1, 2, 3, 4]]);
; [(g.conj ()).loads, (g.conj ()).count, (g.conj ()).coordinates (), g.coordinates ()]
# [[1, 4, 3, 2], 4, [-2, 2], [-2, -2]]
; [(((J * I).conj ()).coordinates ()) = (((I.conj ()) * (J.conj ())).coordinates ()), ((V [1, [4]]).conj ()).loads]
# [<>, [4]]
```
## Count

Count is carried and never derived from the loads. For these view operations
it adds under `+`, multiplies under `*`, and survives the opposite, conjugation
and promotion. A Count of zero may hold nonzero loads
```
; .e (V [3, [1, 0, 0, 2]]); .f (V [4, [0, 5, 1, 0]]);
; [(e + f).count, (e * f).count, (e.opp ()).count, (e.conj ()).count, (e.promote 4).count, (e - f).count]
# [7, 12, 3, 3, 3, 7]
; .odd (V [0, [3, 0, 0, 0]]);
; [odd.count, odd.##, (odd * f).count, (odd * f).loads, (odd + f).count]
# [0, 3, 0, [0, 15, 3, 0], 4]
```
## Coordinates: signed and unsigned

One method reads the preserved view two ways. `d.coordinates ()` is the signed
coordinate `S_b = W₊,b − W₋,b` and `d.coordinates <>` is the unsigned
coordinate `U_b = W₊,b + W₋,b`, one integer per direction in the order of the
channels. They are observations: they never change the view, and the Count is
neither used nor returned. `U` is not `|S|`: opposing loads 3 and 1 give
`S = 2` and `U = 4`, and the Count 1 below is not a coordinate
```
; .q (V [1, [3, 2, 1, 4]]);
; [q.coordinates (), q.coordinates <>, q.observe (), q.count, q.loads]
# [[2, -2], [4, 6], [2, -2], 1, [3, 2, 1, 4]]
```
The Count is independent: the same loads at another Count, even zero, give the
same coordinates, and a positive Count over zero loads gives zero coordinates
```
; .q9 (V [9, [3, 2, 1, 4]]); .q0 (V [0, [3, 2, 1, 4]]); .qz (V [5, [0, 0, 0, 0]]);
; [q9.coordinates (), q9.coordinates <>, q0.coordinates <>, qz.coordinates (), qz.coordinates <>, qz.count]
# [[2, -2], [4, 6], [4, 6], [0, 0], [0, 0], 5]
```
Rank 0 has one unsigned channel, so both readings are its one load. Higher ranks
have width 2ⁿ⁻¹
```
; .r0 (V [2, [3]]); .r1 (V [2, [4, 2]]); .r3 (V [0, [1, 2, 3, 4, 0, 0, 0, 0]]);
; [r0.coordinates (), r0.coordinates <>, r1.coordinates (), r1.coordinates <>, r3.coordinates (), r3.coordinates <>]
# [[3], [3], [2], [6], [1, 2, 3, 4], [1, 2, 3, 4]]
```
Balanced opposing loads observe as zero in `S` and not in `U`, and the present
view is still distinct from the missing host
```
; .bal (V [1, [4, 4]]);
; [bal.coordinates (), bal.coordinates <>, (V [0, [0]]).coordinates <>, [].#0]
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
; .q4 (V [0, [1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 40, 50, 60, 70, 80]]);
; [q4.coordinates (), q4.coordinates <>]
# [[-9, -18, -27, -36, -45, -54, -63, -72], [11, 22, 33, 44, 55, 66, 77, 88]]
; .q5 (V [0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]]);
; [q5.coordinates () .#, q5.coordinates <> .#, (q5.coordinates <>).0, (q5.coordinates <>).15, (q5.coordinates ()).15]
# [16, 16, 11, 176, -144]
```
The seven nonzero directions of rank 4 are the prospective Fano points, and a
line is the unsigned direction of the product of two of them. Nothing here is a
table: each direction below is read from the shipped product. The signs of
`e_001 e_010` and `e_010 e_001` differ and the direction `011` does not
```
; .p1 (V [1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .p2 (V [1, [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .p4 (V [1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
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
; .c0 (V [4, [3]]); .c1 (V [0, [4, 1]]); .c2 (V [1, [3, 2, 1, 4]]);
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
; .n2 (V [0, [0, 1, 5, 3]]); .e2 (V [7, [0, 0, 0, 0]]); .b3 (V [2, [2, 0, 5, 0, 2, 0, 5, 0]]);
; .n4 (V [0, [1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 40, 50, 60, 70, 80]]);
; .n5 (V [3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]]);
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
; .z0 (V [0, [0]]); .p0 (V [0, [9]]);
; [z0.coordinates (), z0.coordinates <>, z0.##, z0.###, p0.coordinates (), p0.coordinates <>, p0.##, p0.###]
# [[0], [0], 0, 0, [9], [9], 9, 0]
```

`x.#n` is the Denum of rung n for n from 0 to 5, and bare `x.#` is still the
Count. It never answers a view. A host answers its Count C, Size s and residual
r, so `[1, 2, 3]` has C = 3, s = 6 and r = 2. Rank 0 keeps the one load s, rank 1
puts (s+r)/2 on the first channel and (s−r)/2 on the second, which are the Demi's
left and right loads, and a higher rank puts the same two on the first channel of
each half. The answer has no CD multiplication: it is an ordinary Denum, and
`.cd ()` is the only request for the interpretation
```
; .xs [1, 2, 3];
; [xs.#, xs.##, xs.###, “” (xs.####)]
# [3, 6, 2, “Demi(3,4,2)”]
; [“” (xs.#0), “” (xs.#1), “” (xs.#2)]
# [“Denum(Arity[1], C=3, W=[6])”, “Denum(Arity[2], C=3, W=[4, 2])”, “Denum(Arity[4], C=3, W=[4, 0, 2, 0])”]
; [(xs.#3).loads, (xs.#4).##, (xs.#5).schema (), (xs.#5).loads .#, (xs.#5).rank ()]
# [[4, 0, 0, 0, 2, 0, 0, 0], 6, “Arity[32]”, 32, 5]
; [xs.#1.loads = xs.####.loads, xs.#1.count = xs.####.count]
# [<>, <>]
```
The answer is a Denum with no CD capability. It has no coordinates or product,
and a view is the explicit, separate request on it
```
; [xs.#2.coordinates (), xs.#2 * xs.#2, xs.#2.opp (), xs.#2.signatures ()]
# [$!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd, $!.denum-not-cd]
; [“” (xs.#2.cd ()), (xs.#2.cd ()).coordinates (), (xs.#2 + xs.#2).loads, ((xs.#2).cd ()) = ((xs.#2).cd ())]
# [“CD[2](C=3, W=[4, 0, 2, 0])”, [2, 0], [8, 0, 4, 0], <>]
```
A router of more than two channels keeps its channel Demi under `.####`, and
`.#1` is the binary projection of the same three observers, which is what the
fourth hash derives for a binary router. Both answers are pinned
```
; Routers <- './hc/rotor-router.hc';
; .RotorRouter Routers.RotorRouter;
; .r3 (RotorRouter [[5, 8], [6], [7]]); .r2 (RotorRouter [[5], [6]]);
; [r3.#, r3.##, r3.###, “” r3.####, “” r3.#1, “” r3.#2, (r3.#1).count = r3.####.count]
# [4, 26, 14, “Demi(4,[13, 6, 7])”, “Denum(Arity[2], C=4, W=[20, 6])”, “Denum(Arity[4], C=4, W=[20, 0, 6, 0])”, <>]
; [“” r2.####, “” r2.#1, (r2.#1).loads = [(r2.####).left, (r2.####).right]]
# [“Demi(2,5,6)”, “Denum(Arity[2], C=2, W=[5, 6])”, <>]
```
It is construction, not promotion. Promotion of an existing Demi-shaped host
adds nothing, because a host's applications carry no higher signature. Each
observer is read once, and a Frame without a Count has no Denum, as it has no
Demi. An empty host, zero Count and nil answer nil at every rank
```
; [[].#0, [].#1, [].#5, ().#2, 0.#3]
# [(), (), (), (), ()]
; [“”.#1, “” (“a”.#0), ({5 + 3}.#1).loads = ({5 + 3}.####).loads, ({5 + 3}.#1).count]
# [(), “Denum(Arity[1], C=1, W=[1])”, <>, 3]
```
Application to a zero Size still counts, so a Denum of zero loads can have a
positive Count, and it is present. It is not the missing host
```
; .zs [0, 0];
; [“” (zs.#0), “” (zs.#1), zs.#0 = (), (Denum [0, [0]]) = ()]
# [“Denum(Arity[1], C=2, W=[0])”, “Denum(Arity[2], C=2, W=[0, 0])”, (), ()]
```
A Denum of a shipped binary arity answers the ranked hash by the structural
embedding of its own state, at every Count including zero, and
`$!.denum-demotion` below its rank. It keeps Count and loads, starts the new
channels at zero and answers a Denum. This is the embedding that `v.promote`
applies, without the CD interpretation. Nothing the source declares can steer
it: a lookalike aggregate with the same fields is an ordinary host and is
measured like any other
```
; .dn (Denum [0, [3, 1]]);
; [“” (dn.#1), “” (dn.#3), (dn.#2).loads, (dn.#5).count, dn.#0]
# [“Denum(Arity[2], C=0, W=[3, 1])”, “Denum(Arity[8], C=0, W=[3, 0, 0, 0, 1, 0, 0, 0])”, [3, 0, 1, 0], 0, $!.denum-demotion]
; .fake [.count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}];
; [“” (fake.#1), “” (fake.#0), fake.#]
# [“Denum(Arity[2], C=99, W=[99, 0])”, “Denum(Arity[1], C=99, W=[99])”, 99]
; [xs.#6, xs.#7, xs.#99]
# [$!.denum-rank, $!.denum-rank, $!.denum-rank]
```
The promotion is the same at A = 1, 2, 4, 8, 16 and 32, and equal to the
embedding the view applies. It is a Denum at every rung, never a view
```
; .gh (Denum [7, [3, 2, 1, 4]]); .gh1 (Denum [4, [5]]);
; [“” (gh.#2), “” (gh.#3), (gh.#5).schema (), (gh.#5).loads.#, gh.#1, “” (gh1.#0), (gh1.#1).loads, (gh1.#2).schema ()]
# [“Denum(Arity[4], C=7, W=[3, 2, 1, 4])”, “Denum(Arity[8], C=7, W=[3, 2, 0, 0, 1, 4, 0, 0])”, “Arity[32]”, 32, $!.denum-demotion, “Denum(Arity[1], C=4, W=[5])”, [5, 0], “Arity[4]”]
; [(gh.#3).loads = ((gh.cd ()).promote 3).loads, (gh.#3).cd () = ((gh.cd ()).promote 3), gh.#3 = ((gh.cd ()).promote 3)]
# [<>, <>, ()]
```
A Denum of another arity has no ranked embedding. It is not padded, truncated or
read as `2^rank`, and it is not measured as a host from its Count and Size. The
answer is `$!.denum-unsupported-arity` at every rung, and the Denum is unchanged.
The rank check comes first, so a rank above 5 is `$!.denum-rank`
```
; .gh3 (Denum [2, [1, 2, 3]]); .gh5 (Denum [1, [1, 2, 3, 4, 5]]);
; [gh3.#0, gh3.#1, gh3.#2, gh3.#5, gh5.#3, t64.#2, t33.#4]
# [$!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity, $!.denum-unsupported-arity]
; [gh3.#6, gh.#6, gh3.count, gh3.loads, gh3.schema (), gh3.rank ()]
# [$!.denum-rank, $!.denum-rank, 2, [1, 2, 3], “Arity[3]”, 1]
```
A view is never a source of the ranked hash. It is not promoted, not measured as
a host from its Count and Size, and not rebuilt into a Denum behind the caller's
back. The answer is the named refusal `$!.denum-view-source`, at every rung, and
the view is unchanged. Ask the Denum it views, `v.denum ()`, for the embedding
```
; .vh (gh.cd ());
; [vh.#0, vh.#2, vh.#5, vh.#6, (vh.denum ()).#3 .loads, vh.count, vh.loads, vh.schema ()]
# [$!.denum-view-source, $!.denum-view-source, $!.denum-view-source, $!.denum-rank, [3, 2, 0, 0, 1, 4, 0, 0], 7, [3, 2, 1, 4], “CD[2]”]
```
The derived hash of a view is the ordinary derived Demi of its three
observers, which is binary and forgets directions. `x.#n` is the Denum, and the
algebraic value is an observation of a view, never the return of `#n`
```
; [dn.####, “” ((V [5, [1, 2, 3, 4]]).####)]
# [(), “Demi(5,3,7)”]
```
`Demi` keeps its own contracts. Its `+`, `-`, `*` and `./` are not Denum or view
arithmetic, and a view is not a Demi
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
