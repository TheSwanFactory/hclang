#!/usr/bin/env hc
```
Denum (occurrence/figure 007.31, 007.32, 007.32b)

A Denum is a constructed state of the binary Cayley–Dickson step ladder: a
schema `CD[n]`, a retained application Count, and a nonnegative integer load on
every signature channel. It is not a conventional number. Its conventional
algebraic value is an observation, `d.coordinates ()`, and opposite channels stay
separately counted after every operation, so `X + Opp X` is a present, nonempty
Denum that merely observes as zero.

`x.#n` answers a Denum of rank n for n from 0 to 5, and there is no `#n=`
(see "The ranked hash" below). `Denum [rank, count, loads]` builds one directly.
`Denum` is an ordinary HC class, like `Demi`; its arithmetic is the Cayley–Dickson
recurrence `(a,b)(c,d) = (ac − d̄b, da + bc̄)`, computed by the one pure native
seam `denum-engine` (`lib/ops/denum.ts`, over the typed reference in
`lib/frames/denum.ts`), so no multiplication table is written in HC or in
TypeScript. Everything else a Denum does is in this file.

**Ranks and channels.** Rank n is the schema `CD[n]`, the rung of the step
ladder, not the arity. Rank 0 has one unsigned channel, `e_ε`. Rank n of 1 or
more has 2ⁿ channels, `±e_b` for every direction `b` of n−1 bits, positives
first and then negatives, each in direction order:

    CD[0]  e_ε
    CD[1]  e_ε, -e_ε
    CD[2]  e_0, e_1, -e_0, -e_1
    CD[3]  e_00, e_01, e_10, e_11, -e_00, -e_01, -e_10, -e_11
    CD[4]  ±e_b for b in {0,1}³        16 channels
    CD[5]  ±e_b for b in {0,1}⁴        32 channels

A minus names a *signature*, never a negative load: every load is a Count.
`d.signatures ()` lists the native names in channel order.

**State.** `d.rank`, `d.schema` (the text `CD[n]`), `d.count` (the full
application Count, kept apart from the loads) and `d.loads` (one Count per
channel). Anything that is not a rank from 0 to 5, a Count, and exactly the
rank's number of Counts is refused with `$!!.invalid-denum`. `Denum [0, 0, [0]]`,
an explicit zero-load D0, is present: it is neither the missing host that
`[].#0` leaves nil nor a nonempty Denum that observes as zero.

**Arithmetic.** `+`, `-` and `*` take another Denum, and only a Denum: the
right operand is reconstructed from its `rank`, `count` and `loads` through the
shipped constructor and must be `=` to that reconstruction, the same test `x.#n`
applies to a source. A lookalike aggregate with the same fields, a Count, text
or a list is `$!!.invalid-denum`. Operands of different
rank are both promoted to the larger rank first (`promote`), and the result is a
fresh Denum of that rank:

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
  rank 0 and 2ⁿ⁻¹ at rank n, and not the Denum; neither changes the Denum or
  returns its Count. At rank 0 both are `[W_ε]`. The only arguments are nil
  `()` and true `<>`; any other argument (a Count, text, a list) is
  `$!!.unary-observation`, never coerced by truthiness.
- `d.observe ()` is the deprecated v0.45.0 spelling of `d.coordinates ()`,
  kept only as a compatibility alias with exactly the signed result. It takes
  no unsigned argument; use `d.coordinates`.

**Count.** The candidate laws of 007.32 section 6 hold for these new operations
only: `C(a+b) = C(a)+C(b)`, `C(a*b) = C(a)·C(b)` and `C(Opp a) = C(a)`, and
promotion and conjugation keep Count. Count is carried, never derived from the
loads, and it is not the application phase `C mod arity`. `Demi` and its `+`,
`-`, `*` and `./` are unchanged. This is a software construction of a supplied
recurrence, not a derivation of it from bare counting.

**Observers.** A Denum declares its own Count (`d.#`), Size (`d.##`, the total
load) and residual (`d.###`, positive minus negative total, 0 at rank 0). Its
`.####` is therefore the ordinary derived Demi of those three, which is binary
and forgets the directions; `d.#n` is the Denum.

**The ranked hash.** For any Frame x, `x.#n` for n from 0 to 5 answers the
Denum of rank n, `nil` when x has no Count or Count zero, as `x.####` does.
For an ordinary or binary host `x.#1` has the Count and the left and right
loads of `x.####`. A `RotorRouter` of more than two channels is the exception:
`.####` answers its channel Demi, and `.#n` does not special-case it, so it is
the two-channel projection of the router's Count, Size and residual.
Bare `x.#` is still the Count. The host is built from the three observers it
answers, Count C, Size s and residual r: rank 0 keeps the load s, and rank
n ≥ 1 puts (s+r)/2 on `e_0…0` and (s−r)/2 on `-e_0…0`, the two channels the
fourth hash reads as left and right, with every other channel zero. A host's
applications carry no higher signature, so none is routed to them. That is
construction, and it is not promotion. A Denum instance answers `x.#n` by
promotion to rank n (and `$!.denum-demotion` below its own rank), keeping Count
and loads, and a forged lookalike is not recognized. A rank above 5 is
`$!.denum-rank`.

The class is evaluated from the compiled-in bundle the first time a ranked hash
needs it, in a namespace of its own (`lib/execute/denum-prologue.ts`), so this
file must not import.
```
.denum-state {.r (_ .0); .c (_ .1); .l (_ .2); .s (denum-engine [9, r, c, l]); [
    .rank r;
    .schema s;
    .count c;
    .loads l;
    .# {_^.count};
    .## {(_^ .loads).##};
    .### {denum-engine [10, (_^ .rank), (_^ .count), (_^ .loads)]};
    .+ {.o (_^^ .operand _); .me _^; .f (_^^ .finish);
      (f (denum-engine [1, (me .rank), (me .count), (me .loads), (o .rank), (o .count), (o .loads)]))};
    .- {.o (_^^ .operand _); .me _^; .f (_^^ .finish);
      (f (denum-engine [2, (me .rank), (me .count), (me .loads), (o .rank), (o .count), (o .loads)]))};
    .* {.o (_^^ .operand _); .me _^; .f (_^^ .finish);
      (f (denum-engine [3, (me .rank), (me .count), (me .loads), (o .rank), (o .count), (o .loads)]))};
    .promote {.k _; .me _^; .f (_^^ .finish);
      (f (denum-engine [6, (me .rank), (me .count), (me .loads), k]))};
    .opp {.u ((_ = ()) ? {1} : {0}); .me _^; .f (_^^ .finish);
      (u = 1) ? {(f (denum-engine [4, (me .rank), (me .count), (me .loads)]))} : {$!!.unary-observation}};
    .conj {.u ((_ = ()) ? {1} : {0}); .me _^; .f (_^^ .finish);
      (u = 1) ? {(f (denum-engine [5, (me .rank), (me .count), (me .loads)]))} : {$!!.unary-observation}};
    .coordinates {.s ((_ = ()) ? {1} : {0}); .t ((_ = <>) ? {1} : {0}); .me _^;
      ((s + t) = 1) ? {denum-engine [7, (me .rank), (me .count), (me .loads), t]} : {$!!.unary-observation}};
    .observe {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [7, (me .rank), (me .count), (me .loads), 0]} : {$!!.unary-observation}};
    .signatures {.u ((_ = ()) ? {1} : {0}); .me _^;
      (u = 1) ? {denum-engine [8, (me .rank), (me .count), (me .loads)]} : {$!!.unary-observation}};
    .toText {“Denum(” (_^ .schema) “, C=” (_^ .count) “, W=” (_^ .loads) “)”}
  ]};
.operand {.o _; .r (Denum [(o .rank), (o .count), (o .loads)]); (o = r) ? {o} : {$!!.invalid-denum}};
.finish {.s _; ((s ~ ([].<>)) ? {denum-state s} : {s})};
.Denum {.a _; ((a ~ ([].<>)) ? {(a .#) = 3}) ? {.s (denum-engine [0, (a .0), (a .1), (a .2)]);
  (s ~ ([].<>)) ? {denum-state s} : {$!!.invalid-denum}} : {$!!.invalid-denum}};
```
## Construction

A Denum holds its schema, its Count and one load per channel. The rank-0 seed
has one unsigned channel, and an explicit zero-load D0 is present
```
; .z (Denum [0, 0, [0]]);
; [z.rank, z.schema, z.count, z.loads, z.#, z.##, z.###, “” z]
# [0, “CD[0]”, 0, [0], 0, 0, 0, “Denum(CD[0], C=0, W=[0])”]
```
The loads are Counts, one per channel, and the Count is kept apart from them: a
Denum may hold loads at Count zero, or a Count over zero loads. A rank beyond 5,
a negative Count or load, a fractional load, the wrong number of loads and a
non-list (a bare Count or text for the loads included) are all refused
```
; [“” (Denum [2, 7, [3, 2, 0, 1]]), “” (Denum [1, 0, [4, 0]]), “” (Denum [1, 5, [0, 0]])]
# [“Denum(CD[2], C=7, W=[3, 2, 0, 1])”, “Denum(CD[1], C=0, W=[4, 0])”, “Denum(CD[1], C=5, W=[0, 0])”]
; [Denum [6, 0, [0]], Denum [1, (0 - 1), [0, 0]], Denum [1, 0, [0, (0 - 1)]], Denum [1, 0, [0, 1.5]], Denum [2, 0, [0, 0, 0]], Denum [0, 0, [0, 0]], Denum 5, Denum [1, 0], Denum [1, 0, [0, 0], 9], Denum [0, 0, 5], Denum [1, 0, 5], Denum [0, 0, “x”]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
```
## Signatures

The native spelling has no sign bit: the direction is a bitstring of rank − 1
bits, and a minus names the opposite signature. Rank 0 has only `e_ε`
```
; [(Denum [0, 0, [0]]).signatures (), (Denum [1, 0, [0, 0]]).signatures (), (Denum [2, 0, [0, 0, 0, 0]]).signatures ()]
# [[“e_ε”], [“e_ε”, “-e_ε”], [“e_0”, “e_1”, “-e_0”, “-e_1”]]
; (Denum [3, 0, [0, 0, 0, 0, 0, 0, 0, 0]]).signatures ()
# [“e_00”, “e_01”, “e_10”, “e_11”, “-e_00”, “-e_01”, “-e_10”, “-e_11”]
; (Denum [4, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]).signatures () .# 
# 16
; ((Denum [5, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]).signatures ()) .# 
# 32
```
## Rank 0 and rank 1: Size and signed integers

D0 adds and multiplies unsigned Size, and Counts add and multiply with it. D1
has the two signatures `e_ε` and `-e_ε`, and the product of two minus signatures
is the plus signature, `(-e_ε)(-e_ε) = e_ε`, while every load stays a Count
```
; .a (Denum [0, 2, [3]]); .b (Denum [0, 5, [4]]);
; [(a + b).loads, (a + b).count, (a * b).loads, (a * b).count]
# [[7], 7, [12], 10]
; .p (Denum [1, 1, [1, 0]]); .m (Denum [1, 1, [0, 1]]);
; [(m * m).loads, (m * p).loads, (p * m).loads, (p * p).loads]
# [[1, 0], [0, 1], [0, 1], [1, 0]]
; [((Denum [1, 1, [0, 2]]) * (Denum [1, 1, [0, 3]])).loads, ((Denum [1, 1, [0, 2]]) * (Denum [1, 1, [0, 3]])).coordinates ()]
# [[6, 0], [6]]
```
Opposite swaps the two channels and subtraction adds the opposite. The balanced
result observes as zero yet is a present, nonempty Denum with both loads
```
; .x (Denum [1, 1, [5, 2]]); .y (Denum [1, 1, [3, 0]]);
; [x.coordinates (), (x.opp ()).loads, (x - y).loads, (x - y).coordinates (), (x - y).count]
# [[3], [2, 5], [5, 5], [0], 2]
; .s (Denum [1, 1, [4, 4]]);
; [s.coordinates (), s.loads, s.#, s.##, s.###]
# [[0], [4, 4], 1, 8, 0]
```
A D0 has no negative signature, so its opposite is promoted to D1 first
```
; ((Denum [0, 3, [4]]).opp ()).loads
# [0, 4]
; ((Denum [0, 3, [4]]).opp ()).schema
# “CD[1]”
```
## Operands are Denums only

`+`, `-` and `*` refuse a right operand that is not a Denum, even when it carries
the same `rank`, `count` and `loads` fields, as `x.#n` refuses a forged source
```
; .dp (Denum [1, 1, [1, 0]]); .lookalike [.rank 1; .count 1; .loads [1, 0]];
; [dp + lookalike, dp - lookalike, dp * lookalike, dp + [1, 1, [1, 0]], dp * 2]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; [(dp + dp).loads, (dp * (dp + dp)).loads, (dp + (dp.opp ())).loads]
# [[2, 0], [2, 0], [1, 1]]
```
## Rank 2: J² = −1 and the four-step cycle

`e_1` is the direction bit of J. Its square is the opposite scalar `-e_0`, and
the fourth power is back at `e_0`, observed
```
; .j (Denum [2, 1, [0, 1, 0, 0]]);
; [(j * j).loads, (j * j).coordinates (), ((j * j) * (j * j)).loads, ((j * j) * (j * j)).coordinates ()]
# [[0, 0, 1, 0], [-1, 0], [1, 0, 0, 0], [1, 0]]
```
## Rank 3: order matters

With J = `e_01`, I = `e_10` and K = `e_11`, J·I = K and I·J = −K
```
; .J (Denum [3, 1, [0, 1, 0, 0, 0, 0, 0, 0]]); .I (Denum [3, 1, [0, 0, 1, 0, 0, 0, 0, 0]]);
; [(J * I).loads, (I * J).loads]
# [[0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1]]
```
## Rank 4: the octonion associator

`(e_001 e_010) e_100` is `+e_111` and `e_001 (e_010 e_100)` is `-e_111`. The
Denum keeps the parentheses, so the two groupings differ
```
; .o1 (Denum [4, 1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .o2 (Denum [4, 1, [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .o4 (Denum [4, 1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
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
The product is not an empty Denum: it holds four loads, in cancelling pairs
```
; .u (Denum [5, 1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .v (Denum [5, 1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]]);
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
; .t (Denum [0, 4, [6]]);
; [(t.promote 1).loads, (t.promote 2).loads, ((t.promote 1).promote 2).loads = (t.promote 2).loads, (t.promote 3).count]
# [[6, 0], [6, 0, 0, 0], <>, 4]
; .k (Denum [1, 3, [2, 5]]);
; [(k.promote 2).loads, (k.promote 3).loads, ((k.promote 2).promote 3).loads = (k.promote 3).loads, k.loads, k.rank]
# [[2, 0, 5, 0], [2, 0, 0, 0, 5, 0, 0, 0], <>, [2, 5], 1]
; [((Denum [2, 1, [0, 1, 0, 0]]).promote 3).loads, ((Denum [2, 1, [0, 0, 0, 1]]).promote 3).loads]
# [[0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0]]
```
A lower rank is refused, and so is a rank above 5 or something that is not a
Count. The source is never changed
```
; [(Denum [3, 1, [0, 0, 0, 0, 0, 0, 0, 0]]).promote 2, k.promote 6, k.promote (0 - 1), k.promote “x”]
# [$!.denum-demotion, $!.denum-rank, $!.denum-rank, $!.denum-rank]
```
Mixed ranks promote to the larger one before the operation, and the product keeps
its operand order. A rank 2 and a rank 3 Denum multiply as two rank 3 Denums
```
; .c2 (Denum [2, 2, [0, 1, 0, 0]]); .c3 (Denum [3, 3, [0, 0, 1, 0, 0, 0, 0, 0]]);
; [(c2 * c3).schema, (c2 * c3).loads, (c3 * c2).loads, (c2 * c3).loads = ((c2.promote 3) * c3).loads, (c2 + c3).schema, (c2 + c3).count]
# [“CD[3]”, [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1], <>, “CD[3]”, 5]
; [((c3.promote 5) * (Denum [5, 1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])).loads = ((c3 * (Denum [3, 1, [0, 1, 0, 0, 0, 0, 0, 0]])).promote 5).loads]
# [<>]
```
## Conjugation

Conjugation fixes the scalar signatures and swaps the two channels of every
other direction. It keeps the Count and the loads. A product conjugates in
reverse order, observed
```
; .g (Denum [2, 4, [1, 2, 3, 4]]);
; [(g.conj ()).loads, (g.conj ()).count, (g.conj ()).coordinates (), g.coordinates ()]
# [[1, 4, 3, 2], 4, [-2, 2], [-2, -2]]
; [(((J * I).conj ()).coordinates ()) = (((I.conj ()) * (J.conj ())).coordinates ()), ((Denum [0, 1, [4]]).conj ()).loads]
# [<>, [4]]
```
## Count

Count is carried and never derived from the loads. For these Denum operations
it adds under `+`, multiplies under `*`, and survives the opposite, conjugation
and promotion. A Count of zero may hold nonzero loads
```
; .e (Denum [2, 3, [1, 0, 0, 2]]); .f (Denum [2, 4, [0, 5, 1, 0]]);
; [(e + f).count, (e * f).count, (e.opp ()).count, (e.conj ()).count, (e.promote 4).count, (e - f).count]
# [7, 12, 3, 3, 3, 7]
; .odd (Denum [2, 0, [3, 0, 0, 0]]);
; [odd.count, odd.##, (odd * f).count, (odd * f).loads, (odd + f).count]
# [0, 3, 0, [0, 15, 3, 0], 4]
```
## Coordinates: signed and unsigned

One method reads the preserved Denum two ways. `d.coordinates ()` is the signed
coordinate `S_b = W₊,b − W₋,b` and `d.coordinates <>` is the unsigned
coordinate `U_b = W₊,b + W₋,b`, one integer per direction in the order of the
channels. They are observations: they never change the Denum, and the Count is
neither used nor returned. `U` is not `|S|`: opposing loads 3 and 1 give
`S = 2` and `U = 4`, and the Count 1 below is not a coordinate
```
; .q (Denum [2, 1, [3, 2, 1, 4]]);
; [q.coordinates (), q.coordinates <>, q.observe (), q.count, q.loads]
# [[2, -2], [4, 6], [2, -2], 1, [3, 2, 1, 4]]
```
The Count is independent: the same loads at another Count, even zero, give the
same coordinates, and a positive Count over zero loads gives zero coordinates
```
; .q9 (Denum [2, 9, [3, 2, 1, 4]]); .q0 (Denum [2, 0, [3, 2, 1, 4]]); .qz (Denum [2, 5, [0, 0, 0, 0]]);
; [q9.coordinates (), q9.coordinates <>, q0.coordinates <>, qz.coordinates (), qz.coordinates <>, qz.count]
# [[2, -2], [4, 6], [4, 6], [0, 0], [0, 0], 5]
```
Rank 0 has one unsigned channel, so both readings are its one load. Higher ranks
have width 2ⁿ⁻¹
```
; .r0 (Denum [0, 2, [3]]); .r1 (Denum [1, 2, [4, 2]]); .r3 (Denum [3, 0, [1, 2, 3, 4, 0, 0, 0, 0]]);
; [r0.coordinates (), r0.coordinates <>, r1.coordinates (), r1.coordinates <>, r3.coordinates (), r3.coordinates <>]
# [[3], [3], [2], [6], [1, 2, 3, 4], [1, 2, 3, 4]]
```
Balanced opposing loads observe as zero in `S` and not in `U`, and the present
Denum is still distinct from the missing host
```
; .bal (Denum [1, 1, [4, 4]]);
; [bal.coordinates (), bal.coordinates <>, (Denum [0, 0, [0]]).coordinates <>, [].#0]
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
; .q4 (Denum [4, 0, [1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 40, 50, 60, 70, 80]]);
; [q4.coordinates (), q4.coordinates <>]
# [[-9, -18, -27, -36, -45, -54, -63, -72], [11, 22, 33, 44, 55, 66, 77, 88]]
; .q5 (Denum [5, 0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]]);
; [q5.coordinates () .#, q5.coordinates <> .#, (q5.coordinates <>).0, (q5.coordinates <>).15, (q5.coordinates ()).15]
# [16, 16, 11, 176, -144]
```
The seven nonzero directions of rank 4 are the prospective Fano points, and a
line is the unsigned direction of the product of two of them. Nothing here is a
table: each direction below is read from the shipped product. The signs of
`e_001 e_010` and `e_010 e_001` differ and the direction `011` does not
```
; .p1 (Denum [4, 1, [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .p2 (Denum [4, 1, [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]); .p4 (Denum [4, 1, [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);
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
## The ranked hash

`x.#n` is the Denum of rung n for n from 0 to 5, and bare `x.#` is still the
Count. A host answers its Count C, Size s and residual r, so `[1, 2, 3]` has
C = 3, s = 6 and r = 2. Rank 0 keeps the one load s, rank 1 puts (s+r)/2 on
`e_ε` and (s−r)/2 on `-e_ε`, which are the Demi's left and right loads, and a
higher rank puts the same two on `e_0…0` and `-e_0…0`
```
; .xs [1, 2, 3];
; [xs.#, xs.##, xs.###, “” (xs.####)]
# [3, 6, 2, “Demi(3,4,2)”]
; [“” (xs.#0), “” (xs.#1), “” (xs.#2)]
# [“Denum(CD[0], C=3, W=[6])”, “Denum(CD[1], C=3, W=[4, 2])”, “Denum(CD[2], C=3, W=[4, 0, 2, 0])”]
; [(xs.#3).loads, (xs.#4).##, (xs.#5).schema, (xs.#5).loads .#, (xs.#5).coordinates ()]
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
# [4, 26, 14, “Demi(4,[13, 6, 7])”, “Denum(CD[1], C=4, W=[20, 6])”, “Denum(CD[2], C=4, W=[20, 0, 6, 0])”, <>]
; [“” r2.####, “” r2.#1, (r2.#1).loads = [(r2.####).left, (r2.####).right]]
# [“Demi(2,5,6)”, “Denum(CD[1], C=2, W=[5, 6])”, <>]
```
It is construction, not promotion. Promotion of an existing Demi-shaped host
adds nothing, because a host's applications carry no higher signature. Each
observer is read once, and a Frame without a Count has no Denum, as it has no
Demi. An empty host, zero Count and nil answer nil at every rank
```
; [[].#0, [].#1, [].#5, ().#2, 0.#3]
# [(), (), (), (), ()]
; [“”.#1, “” (“a”.#0), ({5 + 3}.#1).loads = ({5 + 3}.####).loads, ({5 + 3}.#1).count]
# [(), “Denum(CD[0], C=1, W=[1])”, <>, 3]
```
Application to a zero Size still counts, so a Denum of zero loads can have a
positive Count, and it is present. It is not the missing host
```
; .zs [0, 0];
; [“” (zs.#0), “” (zs.#1), zs.#0 = (), (Denum [0, 0, [0]]) = ()]
# [“Denum(CD[0], C=2, W=[0])”, “Denum(CD[1], C=2, W=[0, 0])”, (), ()]
```
A Denum answers the ranked hash by promotion of its own state, at every Count
including zero, and `$!.denum-demotion` below its rank. Nothing the source
declares can steer it: a lookalike aggregate with the same fields is an
ordinary host and is measured like any other
```
; .dn (Denum [1, 0, [3, 1]]);
; [“” (dn.#1), “” (dn.#3), (dn.#2).loads, (dn.#5).count, dn.#0]
# [“Denum(CD[1], C=0, W=[3, 1])”, “Denum(CD[3], C=0, W=[3, 0, 0, 0, 1, 0, 0, 0])”, [3, 0, 1, 0], 0, $!.denum-demotion]
; .fake [.rank 1; .count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}];
; [“” (fake.#1), “” (fake.#0), fake.#]
# [“Denum(CD[1], C=99, W=[99, 0])”, “Denum(CD[0], C=99, W=[99])”, 99]
; [xs.#6, xs.#7, xs.#99]
# [$!.denum-rank, $!.denum-rank, $!.denum-rank]
```
The derived hash of a Denum is the ordinary derived Demi of its three
observers, which is binary and forgets directions. `d.#n` is the Denum, and its
algebraic value is an observation, never the return of `#n`
```
; [dn.####, “” ((Denum [2, 5, [1, 2, 3, 4]]).####)]
# [(), “Demi(5,3,7)”]
```
`Demi` keeps its own contracts. Its `+`, `-`, `*` and `./` are not Denum
arithmetic, and a Denum is not a Demi
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
