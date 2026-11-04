#!/usr/bin/env hc
```
Demi (occurrence/figure 011.20, 007.25c)

A Demi is a closed two-channel state: a Count and two loads, left and right.
Applying a Demi to a Frame deposits that Frame's Size into the channel the
Count's parity selects and adds one to the Count, so a Demi follows alternating
construction one observation at a time and remembers how many it has seen. It
is what the fourth hash answers: `x.####` is the Demi of x's Count, Size and
residual, with Count x.#, left load (Size + residual)/2 and right load
(Size − residual)/2.

`Demi` is an ordinary HC class: a constructor closure answering a fresh
aggregate whose fields are its state and whose methods are the class. Nothing
about it is native. The fourth hash keeps only its derivation and builds its
answer with this constructor, which the evaluator reads from this file, compiled
in, the first time `.####` needs one. So this file is both the definition every
evaluator uses and its specification, and it works without a resource root.
Import it to construct Demis directly: `Demis <- './hc/demi.hc'`, then
`Demis.Demi [0, 0, 0]`.

**State (007.25c).** `Demi [C, L, R]` takes three Counts, any of them zero
(`Demi [C, loads]` takes a Count and a list of loads; see "Channels and
division" below). `C`
is the full application Count the state has recorded, not its parity, so
`Demi [2, 5, 1]` and `Demi [4, 5, 1]` are different states that agree in phase
and in both loads. Anything else is refused with `$!!.invalid-demi`, a named
error, as Figures refuses an unsupported host. This replaces the phase-only
`Demi [phase, L, R]` of earlier versions, where `phase` was 1 or 2 and the
number of applications was forgotten: `Demi [2, 5, 3]` used to mean "an even
number of applications, left next", and it now means exactly two. Nothing converts an old state to a new one, because the old one never recorded
its Count. `Demi [0, 0, 0]` is the neutral start.

**Count and phase.** `d.count` and `d.#` are the stored `C`. The phase is a
derived field, `d.phase`, a two-state reading of the Count's parity and never
the integer `C %% 2`: 2 when `C` is even, `C = 0` included, left next, and 1
when it is odd, right next. It is a Count rather than all or nil because a
field cannot hold nil, and a Count keeps the odd phase present. It is derived,
not independent state: it is written only together with `C`, so the fields are
the whole state and two Demis are `=` exactly when their Count and loads are.
States with the same phase and loads but different Counts stay distinguishable.

**Observers.** A Demi declares its own Count, Size and residual (011.20): its
Count `C`, its total load `L+R` and the signed difference `L−R`. An aggregate
otherwise observes its elements, and a Demi has none, so without these it
would observe as 0, 1, 0. Its fourth hash is not declared: no class can
declare `.####`. The derivation from the three observers cannot tell an empty
host from a Demi of Count zero, because both read 0, 0, 0, and it answers nil
for either. A Demi of Count zero is a present state, so the fourth hash
recognizes an instance of this class intrinsically (007.25e,
`lib/frames/fourth-hash.ts`): a Frame whose stored `count`, `left` and `right`
are Counts and which is `==` to the Demi this constructor builds from them
answers that fresh reconstruction, an equal instance for every `C`. Nothing of
the source runs, so a foreign aggregate that forges `#`, `##`, `###` or a
`.####` method gets only the ordinary derived fourth hash. `[].####` and
`0.####` stay nil: those are hosts with no children, and a host with no
children has no Demi.

**Application**, `d x`: observe x's Size once, deposit it into the channel the
phase selects (left in phase 2, right in phase 1) and add one to the Count,
which flips the phase. A Size of zero still counts. If x has no Size, its
failure is the answer rather than a deposit. It is a mutating method, `apply_`,
so through a name, `d x` is a functional update: it answers a new Demi and
leaves d unchanged.

**Scaling**, `d.scale_ k`: multiply both loads by a Count k, keeping the
Count. It is the numerical shadow of Star: `(x * y).####` is
`x.####.scale_ (y.##)` for a nonempty host x, Count included. `scale_` stays,
as the name the fourth hash and Star correspondence use; `d * k` answers the
same Demi through the operator below.

**Arithmetic**, `d + x`, `d - x` and `d * x` (015.11). A class answers an
operator by declaring a method under its name, found on the operand and its
declared parents, the chain its other methods come from, so an operator in a
method body keeps its global meaning rather than recurring into the class that
is running. All three **construct a fresh Demi state** from the one Size
observation `x.##` of their operand, keeping Figure 008's distinction between
construction and observation. They are **fixed-channel load transformations**
on the two-load shadow, consistent with the channel loads of a `RotorRouter`
(`hc/rotor-router.hc`): `+` and `-` add `x.##` to one fixed channel's load the
way a route adds a Frame's Size to the channel it lands in, and `*` is the Star
shadow `scale_`. These are correspondences, not a claim that the Router
declares named `+`, `-` or `*` methods. None of the three is application: **all
keep `C`** and so the phase, and each answers a fresh value and leaves `d` as it
was. Because they change loads without an application, they can reach a state
no run of applications reaches, such as `C = 0` with a nonzero load.

- `d + x` is the **tally** operator: it deposits `x.##` on the **right**,
  `Demi [C, L, R + x.##]`. A sizeless host's failure is the answer, as it is for
  application. It is `d.deposit-right_ (x.##)`, a load-only functional update.
- `d - x` is the **alternator** operator: it deposits on the **left**,
  `Demi [C, L + x.##, R]`, as `d.deposit-left_ (x.##)`. It is not subtraction: a deposit only ever adds, so
  a load never goes negative and stays a whole Count. Right deposition lowers
  the signed residual `L − R` and left deposition raises it, the reverse of
  ordinary signed-scalar `+` and `-`.
- `d * x` is the **inlay** operator: it scales both loads by the operand's Size
  `x.##`, `Demi [C, sL, sR]` for `s = x.##`, keeping `C`. It reads the operand
  through the one Size observer, as `+` and `-` do, so any sized Frame scales a
  Demi, not only a bare Count. It is literally `d.scale_ (x.##)`.

None of the three names the `Demi` constructor inside its method. A bare name
in a method is looked up on the argument first (spec 7), and a decimal is
unit-taggable, so inside `d + 2.5` the name `Demi` read `2.5.Demi`, a tagged
number, and applying that to `[C, L, R]` was `$!.repetition-domain` (007.25e,
PR #480 review). Each operator now hands the one Size it observed to a
load-only functional update on the receiver, `deposit-right_`, `deposit-left_`
or `scale_`, so `D + 2.5`, `D - 2.5` and `D * 2.5` all read `(2.5).## = 2`.
`deposit-right_ k` and `deposit-left_ k` take a Count and refuse anything else
with `$!!.invalid-demi`, since a negative deposit is no Demi.

**Rational readings (007.25).** Because `C` is kept, two exact ratios are read
from the state. They are unary observations of the stored state, not `/` and
not `%%`, and they take no divisor. HC runs a method only when it is applied to
something, so they are applied to nil, `d.size-ratio ()`; any other operand is
`$!!.unary-observation`, so `d.size-ratio 4` is refused rather than read as a
division by 4.

- `d.size-ratio ()` is `S / C` for `S = L + R`, exact and nonnegative.
- `d.residual-ratio ()` is `Δ / C` for `Δ = L − R`, exact and signed.

Both are **nil when `C = 0`**, whatever the loads: the state exists and its Size
and residual still read, but the ratio is absent, so there is no `0/0`, infinity
or invented zero. They are different observables and neither replaces Size or
residual; `C`, `S / C` and `Δ / C` together give back `S` and `Δ`. The answer is
the language's exact `/`: a FrameRational when not whole, such as `5/2`, which
the runtime keeps in lowest terms (the improper `6/4` reads `3/2`), and a
FrameInt when whole, since the runtime collapses a whole rational. It is never a
float or an integer quotient and remainder. The Count is a number the state
stores or an application adds to; it is not a Frame-native witness of history,
and `S / C` and `Δ / C` are arithmetic readings of it, not a construction of
rational geometry.

**Text.** A Demi prints as what it is, an aggregate of fields and methods. As
text it reads `Demi(C,L,R)`, with the Count and both loads.

**Channels and division (007.27).** The two loads are the arity-two case of an
ordered list of channel loads. `Demi [C, loads]` takes a Count and a nonempty
list of Counts: two loads are this binary Demi, the same instance
`Demi [C, L, R]` builds, and any other number is a channel Demi. Every Demi
stores `count` and `loads`; only the binary one also has `left`, `right` and
`phase`, which it writes together with `loads`. A channel Demi of arity k
deposits into channel `C mod k`, which for k = 2 is the phase's channel. Its
Size is the sum of its loads and its residual their alternating sum
`e0 − e1 + e2 − …`, the list residual, which for two loads is `L − R`. Its
fourth hash is intrinsic too: a fresh equal Demi of the same arity. Its `*`,
`scale_` and ratios are as here; `+` and `-` deposit on a right or a left it
does not have, so they are `$!!.invalid-arity`. Text reads `Demi(C,[e0, e1,
…])`.

`d ./ n`, also spelled `d / n`, redistributes the Size: it keeps C and the
total S and deals S Size units round-robin into n channels, so the first
S mod n hold ⌈S/n⌉ and the rest ⌊S/n⌋. It is idempotent, `(d ./ n) ./ m` is
`d ./ m`, and equal Count and Size give equal results, so `Demi(3,[5,2])` and
`Demi(3,[4,3])` divide into the same `Demi(3,[3,2,2])`. It is not scalar
division and not the ratios: no number is answered. The divisor is a positive
Count, refused as a list refuses it (`$!.division-by-zero /`,
`$!.division-domain /`), never read as a Size. `hc/division.hc` is its
specification, with the list and RotorRouter divisions beside it.

**Methods read their own state through `_^`.** A bare name inside a method is
looked up on the argument first (spec 7), and a Demi is applied to arbitrary
Frames, so a bare `left` could read the argument's field. `_^` is the receiver
from a method's body, and `_^^` from a block one level in, because carets
count lexically (spec a06). What a branch needs is bound as a local at method
level, where nested blocks read it. The file's own names, the constructor
`Demi` and the helpers `deposit-at` (a cursor that adds a Size at one channel
index, applied by reduce) and `redistribution` (the round-robin loads of S
units in n channels), are read the same way, through the scope a caret ladder
reaches, `(_^^^ .Demi)` from a branch, so an argument's fields never stand in
for them.
```
.deposit-at {.at (_ .0); .by (_ .1); [.index 0; .target at; .amount by; .out [];
  .apply_ {.v _; .i (_^ .index); .t (_^ .target); .a (_^ .amount); .o (_^ .out);
    @out (o ((i = t) ? {v + a} : {v})); @index (i + 1);}]};
.redistribution {.s (_ .0); .ways (_ .1); .r (s %% ways); .q (((s - r) / ways).##);
  ((ways - r) [q]) | (r [(q + 1)])};
.binary-demi {.c (_ .0); .l (_ .1); .r (_ .2); .p (((c %% 2) = 0) ? {2} : {1}); [
    .count c;
    .phase p;
    .left l;
    .right r;
    .loads [l, r];
    .# {_^.count};
    .## {_^.left + _^.right};
    .### {_^.left - _^.right};
    .apply_ {.s (_ .##); .c (_^ .count); .l (_^ .left); .r (_^ .right); .p (_^ .phase);
      (s ~ (0.<>)) ? {(p = 2) ? {@left (l + s); @loads [(l + s), r]; @phase 1;} : {@right (r + s); @loads [l, (r + s)]; @phase 2;}; @count (c + 1); _^^} : {s}};
    .scale_ {.k _; .l (_^ .left); .r (_^ .right);
      (k ~ (0.<>)) ? {@left (l * k); @right (r * k); @loads [(l * k), (r * k)]; _^^} : {$!!.invalid-scale}};
    .deposit-right_ {.k _; .l (_^ .left); .r (_^ .right);
      (k ~ (0.<>)) ? {@right (r + k); @loads [l, (r + k)]; _^^} : {$!!.invalid-demi}};
    .deposit-left_ {.k _; .l (_^ .left); .r (_^ .right);
      (k ~ (0.<>)) ? {@left (l + k); @loads [(l + k), r]; _^^} : {$!!.invalid-demi}};
    .+ {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .deposit-right_ s)} : {s}};
    .- {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .deposit-left_ s)} : {s}};
    .* {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .scale_ s)} : {s}};
    ./ {.ways _; .c (_^ .count); .s (_^ .##); .v ([] / ways);
      (v ~ ([].<>)) ? {(_^^^ .Demi) [c, ((_^^^ .redistribution) [s, ways])]} : {v}};
    .size-ratio {.c (_^ .count); .s (_^ .##); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {s / c} : {$!!.unary-observation}}};
    .residual-ratio {.c (_^ .count); .d (_^ .###); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {d / c} : {$!!.unary-observation}}};
    .toText {“Demi(” (_^ .count) “,” (_^ .left) “,” (_^ .right) “)”}
  ]};
.channel-demi {.c (_ .0); .e (_ .1); [
    .count c;
    .loads e;
    .# {_^.count};
    .## {(_^ .loads).##};
    .### {(_^ .loads).###};
    .apply_ {.s (_ .##); .c (_^ .count); .e (_^ .loads);
      (s ~ (0.<>)) ? {@loads ((e | ((_^^^ .deposit-at) [(c %% (e.#)), s])) .out); @count (c + 1); _^^} : {s}};
    .scale_ {.k _; .e (_^ .loads);
      (k ~ (0.<>)) ? {@loads (e & {_ * k}); _^^} : {$!!.invalid-scale}};
    .+ {$!!.invalid-arity};
    .- {$!!.invalid-arity};
    .* {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .scale_ s)} : {s}};
    ./ {.ways _; .c (_^ .count); .s (_^ .##); .v ([] / ways);
      (v ~ ([].<>)) ? {(_^^^ .Demi) [c, ((_^^^ .redistribution) [s, ways])]} : {v}};
    .size-ratio {.c (_^ .count); .s (_^ .##); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {s / c} : {$!!.unary-observation}}};
    .residual-ratio {.c (_^ .count); .d (_^ .###); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {d / c} : {$!!.unary-observation}}};
    .toText {“Demi(” (_^ .count) “,” (_^ .loads) “)”}
  ]};
.Demi {((_ ~ ([].<>)) ? {(__ .#) ~ <2, 3>}) ? {.a __; .c (a .0);
  .boxed (((a.#) = 3) ? {[[a .1, a .2]]} : {[a .1]});
  ((c ~ (0.<>)) ? {(boxed .0) ~ ([].<>)}) ? {.e (boxed .0); .k (e.#);
  ((k .> 0) ? {(e &| {.x _; (x ~ (0.<>)) ? {[]} : {[x]}}).# = 0}) ? {
    (k = 2) ? {binary-demi [c, (e .0), (e .1)]} : {channel-demi [c, (e | [])]}
  } : {$!!.invalid-demi}} : {$!!.invalid-demi}} : {$!!.invalid-demi}};
```
## Construction

A Demi holds its Count and its two loads, and the phase that Count fixes. Each
instance is its own: two built from the same constructor share nothing. The
neutral start `Demi [0, 0, 0]` is present, in phase 2
```
; .d (Demi [0, 0, 0]);
; [d.count, d.phase, d.left, d.right, d.#, d.##, d.###, “” d]
# [0, 2, 0, 0, 0, 0, 0, “Demi(0,0,0)”]
; .a (Demi [2, 5, 3]); .b (Demi [1, 7, 0]);
; [“” a, “” b, a.left, b.left, a.phase, b.phase]
# [“Demi(2,5,3)”, “Demi(1,7,0)”, 5, 7, 2, 1]
```
Any Counts are a state. The phase is read from the parity of the Count, never
from the Count itself: even is phase 2, zero included, and odd is phase 1
```
; [0, 1, 2, 3, 4, 5, 100, 101] & {(Demi [_, 5, 3]).phase}
# [2, 1, 2, 1, 2, 1, 2, 1]
; [(Demi [2, 5, 3]).#, (Demi [4, 5, 3]).#, (Demi [100, 5, 3]).count, (Demi [100, 5, 3]).phase, (Demi [3, 5, 3]).phase]
# [2, 4, 100, 2, 1]
```
A positive Count over empty loads and nonzero loads over a zero Count are both
states. Anything that is not three Counts is refused
```
; [“” (Demi [3, 0, 0]), “” (Demi [0, 3, 0]), “” (Demi [0, 0, 4])]
# [“Demi(3,0,0)”, “Demi(0,3,0)”, “Demi(0,0,4)”]
; [Demi [2, (0 - 1), 0], Demi [(0 - 1), 1, 1], Demi [(5 - 3), (5 - 7), 0], Demi [2, 1], Demi 5, Demi [2, 1.5, 0], Demi [2, 1, 0, 0]]
# [$!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi]
```
## Application

Each application deposits the argument's Size into the channel the phase
selects and adds one to the Count, which flips the phase. The receiver is left
as it was
```
; “” (d [5, 3])
# “Demi(1,8,0)”
; “” d
# “Demi(0,0,0)”
; “” (((d 5) 3) 7)
# “Demi(3,12,3)”
```
A Size of zero deposits nothing and still counts, in both phases
```
; [(d 0).count, ((d 0) 0).count, (d 0).phase, ((d 0) 0).phase, (d 0).left, ((d 0) 0).right]
# [1, 2, 1, 2, 0, 0]
```
Any Frame is applied by its Size, measured without running it: text, the
empty aggregate and all (Size 1 each), nested aggregates, a closure (one per
word, so `{5 + 3}` is 9), empty text, and loads too large for a machine integer
```
; “” ((((((d “hello”) []) <>) [[1, 2], [3]]) {5 + 3}) “”)
# “Demi(6,15,7)”
; “” ((d 123456789012345678901234567890) 987654321098765432109876543210)
# “Demi(2,123456789012345678901234567890,987654321098765432109876543210)”
```
A Frame without a Size is not deposited: its failure is the answer
```
; d ([].nope)
# $!.name-missing “...
; “” d
# “Demi(0,0,0)”
```
Deposit reads the receiver through `_^`, so an argument that holds fields of
the same names deposits by its Size and nothing else
```
; “” (d [.count 50; .left 99; .phase 1; .s 100; 4])
# “Demi(1,4,0)”
; “” ((Demi [2, 5, 3]) [.count 50; .left 99; .right 7; 4])
# “Demi(3,9,3)”
```
A Demi captured by a closure, mapped, or reduced is applied the same way, and
the captured one stays as it was
```
; .start (Demi [0, 0, 0]); .step {start _};
; [“” (step 5), “” (step 3), “” start]
# [“Demi(1,5,0)”, “Demi(1,3,0)”, “Demi(0,0,0)”]
; [d, a] & {“” (_ 5)}
# [“Demi(1,5,0)”, “Demi(3,10,3)”]
; “” ([5, 3, 7] | (Demi [0, 0, 0]))
# “Demi(3,12,3)”
```
Through a mutable name, application writes the Demi in place
```
; .m_ (Demi [0, 0, 0]);
; m_ 5;
; m_ 3;
; [“” m_, m_.count, m_.phase]
# [“Demi(2,5,3)”, 2, 2]
```
## Application counts

Starting at Count 0 in phase 2, or at Count 1 in phase 1, applying 5, 3, 7 and 2
in turn grows the Count by exactly one each time and alternates the phase. The
Size and residual are the alternating route's, from the left or from the right
```
; .chain {.s _; [s, (s 5), ((s 5) 3), (((s 5) 3) 7), ((((s 5) 3) 7) 2)]};
; .c0 (chain (Demi [0, 0, 0])); .c1 (chain (Demi [1, 0, 0]));
; [c0 & {_.count}, c0 & {_.phase}, c0 & {_.##}, c0 & {_.###}]
# [[0, 1, 2, 3, 4], [2, 1, 2, 1, 2], [0, 5, 8, 15, 17], [0, 5, 2, 9, 7]]
; [c1 & {_.count}, c1 & {_.phase}, c1 & {_.##}, c1 & {_.###}]
# [[1, 2, 3, 4, 5], [1, 2, 1, 2, 1], [0, 5, 8, 15, 17], [0, -5, -2, -9, -7]]
```
The Count and the loads together are the state, and the fourth hash of each step
is that step, Count included
```
; [(c0 & {_.####}) = c0, (c1 & {_.####}) = c1]
# [<>, <>]
```
## Observers

A Demi's Count is its stored Count, its Size the total load and its residual the
signed difference, including a present zero-load Demi in either phase
```
; .e (Demi [3, 12, 3]);
; [e.#, e.##, e.###, e.phase]
# [3, 15, 9, 1]
; [d.#, d.##, d.###, (Demi [1, 0, 0]).#, (Demi [1, 0, 0]).phase]
# [0, 0, 0, 1, 1]
```
Count is `.#`, not phase. The same phase and loads with a different Count are
different states with the same Size and residual
```
; .f2 (Demi [2, 5, 1]); .f4 (Demi [4, 5, 1]);
; [f2.phase = f4.phase, f2.## = f4.##, f2.### = f4.###, f2.# = f4.#, f2 = f4, f2 = (Demi [2, 5, 1])]
# [<>, <>, <>, (), (), <>]
; [f2.#, f4.#, f2.##, f2.###, f2.phase, f4.phase]
# [2, 4, 6, 4, 2, 2]
```
A Demi inside an aggregate contributes its declared Size
```
; [[e, e].##, [e, d].###, [e].#### = (Demi [1, 15, 0])]
# [30, 15, <>]
```
## The fourth hash

`.####` of a Demi is that Demi, however often it is taken. It is equal, not
identical: each observation builds a new instance. Its Count is kept for every
Count, including zero
```
; [e.#### = e, e.#### === e, e.#### == e, ((e.####).####).#### = e, (e.####).# = e.#]
# [<>, (), <>, <>, <>]
; [d.#### = d, (Demi [1, 0, 0]).#### = (Demi [1, 0, 0]), (Demi [100, 5, 3]).####.count, (Demi [0, 3, 0]).#### = (Demi [0, 3, 0])]
# [<>, <>, 100, <>]
; [f2.####.# , f4.####.#, f2.#### = f4.####, f2.#### = f2]
# [2, 4, (), <>]
```
`.####` of a host answers an instance of this class, built from the same source,
so it compares equal to one built here. The host's whole Count is kept: it is
not reduced to its parity
```
; [[5, 3].#### = (Demi [2, 5, 3]), “hello”.#### = (Demi [5, 3, 2]), [0].#### = (Demi [1, 0, 0])]
# [<>, <>, <>]
; [[5, 3].####.#, “hello”.####.#, “hello”.####.phase, [5, 3, 7].####.#, [5, 3, 7].####.phase]
# [2, 5, 1, 3, 1]
; “” [5, 3, 7].####
# “Demi(3,12,3)”
```
Hosts whose Counts differ by an even number do not share a fourth hash, though
they share phase and, here, loads
```
; [[5, 3].#### = [5, 3, 0, 0].####, [5, 3].####.phase = [5, 3, 0, 0].####.phase, [5, 3].####.## = [5, 3, 0, 0].####.##]
# [(), <>, <>]
```
It is nil where there is no Demi: an empty host, Count zero, no Count, or no
residual. A host with no children is not a Demi of Count zero. Properties are
not elements, sharing counts each occurrence, and a group observes as its
elements
```
; [[].####, 0.####, ().####, <2,3,5>.####, “”.####]
# [(), (), (), (), ()]
; .shared [1, 2];
; [[.a 100; 5, 3].#### = [5, 3].####, [shared, shared].#### = (Demi [2, 3, 3]), (5, 3).#### = (Demi [2, 5, 3])]
# [<>, <>, <>]
```
The two zero-Count cases are different. A constructed `Demi [0, 0, 0]` is a
present value, while the empty host and the Count 0 have none. They agree on
Count, Size and residual, so the difference is not read from the observers: the
fourth hash recognizes an instance of this class (007.25e)
```
; [[].# = d.#, [].## = d.##, 0.## = d.##, 0.### = d.###]
# [<>, (), <>, <>]
; [[].#### = (), 0.#### = (), d.#### = d, ((Demi [0, 0, 0]).####).count]
# [<>, <>, <>, 0]
```
Zero-Count Demis reached without an application are present too, and so is
each functional update of one
```
; [“” ((Demi [0, 3, 0]).####), “” ((d + 4).####), “” ((d - 2.5).####), “” ((d * 7).####)]
# [“Demi(0,3,0)”, “Demi(0,0,4)”, “Demi(0,2,0)”, “Demi(0,0,0)”]
```
## Only a Demi is a Demi

No class declares its own `.####`. An aggregate that declares a method under
that name keeps it as an ordinary property, which the fourth hash never runs:
its fourth hash is derived from its observers like any other Frame's. So a
method answering a foreign aggregate, an error, nil, itself, or a write
changes nothing, and nothing in it runs
```
; .noted_ [.n 0; .bump_ {@n (_^.n + 1);}];
; .Liar [.#### {[.# {0}; .## {0}; .### {0}]}];
; .Loud [.#### {noted_.bump_ (); Demi [0, 0, 0]}];
; .Selfish [.#### {_^.####}];
; .Broken [.#### {[].nope}];
; [Liar.####, Loud.####, Selfish.####, Broken.####, noted_.n]
# [(), (), (), (), 0]
; [“” ([.#### {Demi [9, 9, 9]}; 5, 3].####), [.#### {Demi [9, 9, 9]}; 5, 3].#### = [5, 3].####]
# [“Demi(2,5,3)”, <>]
```
Forged observers do not make a Demi. An aggregate declaring Count, Size and
residual 0, 0, 0 reads exactly as `Demi [0, 0, 0]` does, and still has no Demi,
because it is not one; with a nonzero Count it gets the derived Demi of those
observers, a fresh instance of this class, never the aggregate itself
```
; .Zero [.# {0}; .## {0}; .### {0}];
; .Three [.# {3}; .## {5}; .### {1}];
; [[Zero.#, Zero.##, Zero.###] = [d.#, d.##, d.###], Zero.####, “” Three.####, Three.#### = Three]
# [<>, (), “Demi(3,3,2)”, ()]
```
Fields named like a Demi's are not enough either. Recognition compares the
whole instance, fields and methods, by typed equality `==` with the Demi the
constructor builds from the stored `count`, `left` and `right`. So a bare record
of those fields, one whose phase disagrees with its Count, one whose Count is a
decimal, and one that adds a field are foreign, and with Count zero they have
no Demi
```
; .Rec [.count 0; .phase 2; .left 0; .right 0];
; .Fake [.count 0; .phase 1; .left 0; .right 0; .# {_^ .count}; .## {_^ .left + _^ .right}; .### {_^ .left - _^ .right}];
; .Dec [.count 0.0; .phase 2; .left 0; .right 0; .# {0}; .## {0}; .### {0}];
; [Rec.####, Fake.####, Dec.####, [.extra 1; .count 0; .left 0; .right 0].####]
# [(), (), (), ()]
```
A Demi with a Count is recognized as one, and what it answers is a fresh
reconstruction from its stored state, equal to it and not it
```
; [(Demi [3, 5, 1]).#### == (Demi [3, 5, 1]), (Demi [3, 5, 1]).#### === (Demi [3, 5, 1]), “” (Demi [3, 5, 1]).####]
# [<>, (), “Demi(3,5,1)”]
```
## Observing commutes with applying

For a nonempty host X, observing X Y is applying X's Demi to Y, and both equal
the observation of the array X Y constructs, with Count one greater
```
; .X [5, “ab”, [1, 2]];
; [(X 7).#### = (X.#### 7), (X 7).#### = [5, “ab”, [1, 2], 7].####, (X {5 + 3}).#### = (X.#### {5 + 3}), (X 7).####.# = (X.####.# + 1)]
# [<>, <>, <>, <>]
```
The empty host is the boundary. `[].####` is nil, a choice of convention
(011.15g) rather than a theorem, and applying nil answers the argument, so
the equation as written fails there. Lifting the empty host to the Demi of
Count zero restores it: that is the initialized-router reading, and it is also
what a reduce starts from
```
; [([] 7).#### = ([].#### 7), ([] 7).#### = ((Demi [0, 0, 0]) 7), ([] 7).#### = ([7] | (Demi [0, 0, 0]))]
# [(), <>, <>]
; [] | (Demi [0, 0, 0]) = (Demi [0, 0, 0])
# <>
```
## Scaling and Star

Scaling multiplies both loads and keeps the Count and phase: zero annihilates,
one is the identity, and scaling composes
```
; [“” (e.scale_ 2), “” (e.scale_ 0), (e.scale_ 1) = e, ((e.scale_ 2).scale_ 3) = (e.scale_ 6), (e.scale_ 2).#]
# [“Demi(3,24,6)”, “Demi(3,0,0)”, <>, <>, 3]
; e.scale_ (0 - 2)
# $!!.invalid-scale
```
It is the shadow of Star on a nonempty host, Count included
```
; [([5, 3] * 3).#### = ([5, 3].####.scale_ 3), ([[[]], []] * [[], []]).#### = ([[[]], []].####.scale_ ([[], []].##)), ([5, 3] * 3).####.# = [5, 3].####.#]
# [<>, <>, <>]
```
## Arithmetic

Three operators act on a Demi's state, each reading its operand through the one
Size observer `x.##`. They are fixed-channel load transformations consistent
with a `RotorRouter`'s channel loads (`hc/rotor-router.hc`), not named Router
methods. `+`, `-` and `*` **construct a fresh Demi** from observations of their
operands: `+` is tally, depositing `x.##` on the right; `-` is alternator,
depositing on the left; and `*` is inlay, scaling both loads by `x.##` through
`scale_`, the Star shadow. Each keeps the Count, and so the phase, answers a
fresh value and leaves its operand as it was, so they compose by nesting
```
; .D (Demi [2, 5, 3]);
; [“” (D + 4), “” (D - 4), “” (D * 3)]
# [“Demi(2,5,7)”, “Demi(2,9,3)”, “Demi(2,15,9)”]
; [“” ((D + 4) - 2), “” ((D - 2) + 4), “” ((D + 4) * 3)]
# [“Demi(2,7,7)”, “Demi(2,7,7)”, “Demi(2,15,21)”]
; “” D
# “Demi(2,5,3)”
```
A deposit keeps the Count and phase, including phase 1, where application would
flip it, and a zero Size deposits nothing while still answering a Demi. The
operand is measured by its Size, so any sized Frame deposits
```
; [(D + 4).#, (D - 4).#, (D * 3).#, (D + 4).count, (D + 4).phase]
# [2, 2, 2, 2, 2]
; .P (Demi [1, 5, 3]);
; [“” (P + 4), (P + 4).#, (P + 4).phase, “” (P - 4)]
# [“Demi(1,5,7)”, 1, 1, “Demi(1,9,3)”]
; [“” (D + 0), “” (D - 0), “” (D [3, 4])]
# [“Demi(2,5,3)”, “Demi(2,5,3)”, “Demi(3,12,3)”]
```
Deposit is not application and deposit is not subtraction. `D x` adds one to the
Count and flips the phase, and `D + x` does not, so they reach different
states; `D - x` adds to the left load and never takes from the right, so a load
stays a whole Count and the signed residual only rises
```
; [(D + 4).###, (D - 4).###, D.###]
# [-2, 6, 2]
; [((D 4).# = (D + 4).#), (D 4).###, (D + 4).###, (D 4).#, (D 4).phase]
# [(), 6, -2, 3, 1]
```
Order of a right then a left deposit does not matter, and scaling after a
balanced deposit is the Star shadow of scaling first
```
; [((D + 4) - 2) = ((D - 2) + 4), ((D + 4) * 3) = ((D * 3) + 12)]
# [<>, <>]
```
A sizeless host refuses on all three operators, its failure the answer, as
application refuses it. `*` reads its operand's Size rather than demanding a
bare Count, so a Demi, an aggregate or a decimal works through its `.##`, while
`D * 0` still annihilates
```
; [D + ([].nope), D - ([].nope), D * ([].nope)]
# [$!.name-missing “..., $!.name-missing “..., $!.name-missing “...]
```
## Deposits by Size

`+` and `-` read their operand through the one Size observer as `*` does, so
any sized Frame deposits its Size: a decimal its truncated magnitude, text its
characters, an aggregate its element count, a Demi `L + R`, and a closure one
per word. These are the review's own examples, from `Demi [0, 0, 0]`
```
; [(2.5).##, (1.5).##, (0 - 1.5).##]
# [2, 1, 1]
; [“” ((Demi [0, 0, 0]) + 2), “” ((Demi [0, 0, 0]) + 2.5), “” ((Demi [0, 0, 0]) - 1.5), “” ((Demi [1, 2, 2]) * 2.5)]
# [“Demi(0,0,2)”, “Demi(0,0,2)”, “Demi(0,1,0)”, “Demi(1,4,4)”]
; [“” (D + 2.5), “” (D - 2.5), “” (P + 0.5), “” (P - (0 - 3.5))]
# [“Demi(2,5,5)”, “Demi(2,7,3)”, “Demi(1,5,3)”, “Demi(1,8,3)”]
; [“” (D + “abc”), “” (D - [[], []]), “” (D + (Demi [1, 2, 4])), “” (D - {5 + 3}), “” (D + <>), “” (D - [])]
# [“Demi(2,5,6)”, “Demi(2,7,3)”, “Demi(2,5,9)”, “Demi(2,14,3)”, “Demi(2,5,4)”, “Demi(2,6,3)”]
```
Each keeps the full Count, and with it the phase, in both parities; leaves the
receiver as it was, even through a mutable name; and refuses a sizeless operand
with its failure
```
; [(D + 2.5).#, (D + 2.5).phase, (P - 1.5).#, (P - 1.5).phase, “” D, “” P]
# [2, 2, 1, 1, “Demi(2,5,3)”, “Demi(1,5,3)”]
; .q_ (Demi [2, 5, 3]);
; [“” (q_ + 2.5), “” (q_ - 2.5), “” (q_ * 2.5), “” q_]
# [“Demi(2,5,5)”, “Demi(2,7,3)”, “Demi(2,10,6)”, “Demi(2,5,3)”]
; [D + ([2.5].nope), D - ([2.5].nope), (Demi [0, 0, 0]) + ([].nope)]
# [$!.name-missing “..., $!.name-missing “..., $!.name-missing “...]
```
The argument cannot reach the receiver's names. A decimal is unit-taggable,
`2.5.Demi` is a tagged number, and an aggregate can hold fields named like the
receiver's or its locals; none of them changes which state is updated, and
such an aggregate deposits only its elements' Size, here 4
```
; (2.5).Demi
# 2.5.Demi
; [“” (D + [.Demi 9; .right 99; .left 99; .count 7; .k 50; 4]), “” (D - [.Demi 9; .left 99; .l 99; .s 50; 4])]
# [“Demi(2,5,7)”, “Demi(2,9,3)”]
```
The functional updates behind them take a Count, so a negative or fractional
deposit is not a Demi
```
; [D.deposit-right_ (0 - 1), D.deposit-left_ 2.5, “” (D.deposit-right_ 2), “” (D.deposit-left_ 2), “” D]
# [$!!.invalid-demi, $!!.invalid-demi, “Demi(2,5,5)”, “Demi(2,7,3)”, “Demi(2,5,3)”]
```
`*` scales by the operand's Size, so its domain is every sized Frame: a Demi
contributes `L + R`, an aggregate its element count, a decimal its truncated
magnitude, and a zero Size annihilates both loads. `D * 3` is unchanged, since
`3.## = 3`, and the result keeps the Count in either parity
```
; [“” (D * (Demi [1, 2, 4])), “” (D * [[], []]), “” (D * 2.5), “” (D * 0)]
# [“Demi(2,30,18)”, “Demi(2,10,6)”, “Demi(2,10,6)”, “Demi(2,0,0)”]
; [“” (D * 1), (D * 3).#, (P * 3).#, “” (P * 3)]
# [“Demi(2,5,3)”, 2, 1, “Demi(1,15,9)”]
```
The signed-scalar reading misleads: `+` lowers the residual and `-` raises it,
so `D + 4` is not “larger” than `D`, and `D - 4` is not `D` made smaller
```
; [(D + 4).### .< D.###, (D - 4).### .> D.###]
# [<>, <>]
```
Fixed-channel operators change loads without an application, so they keep the
Count and can leave a zero Count over nonzero loads. That state is present, and
its Size and residual read
```
; .Y ((Demi [0, 0, 0]) + 4);
; [“” Y, “” ((Demi [0, 0, 0]) - 4), Y.count, Y.phase, Y.##, Y.###]
# [“Demi(0,0,4)”, “Demi(0,4,0)”, 0, 2, 4, -4]
; [“” (D * 3), (D.scale_ 2).#, ((D + 4) 1).#, ((D + 4) 1).phase]
# [“Demi(2,15,9)”, 2, 3, 1]
```
## Rational readings

For `C > 0` the Size reading is `S / C` and the residual reading `Δ / C`, two
different observables. With `C = 2`, `L = 5`, `R = 1` they are 3 and 2. With the
loads swapped the Size reading is unchanged and the residual reading changes
sign. With `L = 5`, `R = 0` they are the improper 5/2, neither 2 nor 3
```
; .A (Demi [2, 5, 1]); .B (Demi [2, 1, 5]); .D5 (Demi [2, 5, 0]);
; [[A.##, A.###, A.size-ratio (), A.residual-ratio ()], [B.##, B.###, B.size-ratio (), B.residual-ratio ()], [D5.##, D5.###, D5.size-ratio (), D5.residual-ratio ()]]
# [[6, 4, 3, 2], [6, -4, 3, -2], [5, 5, 5/2, 5/2]]
```
They differ when the loads do. Non-divisible ratios stay exact and the runtime
reduces them: 6/4 reads 3/2, 8/6 reads 4/3. At `C = 1` they are the Size and the
residual, and an odd Count works as an even one does
```
; [(Demi [2, 3, 2]).size-ratio (), (Demi [2, 3, 2]).residual-ratio ()]
# [5/2, 1/2]
; [(Demi [4, 6, 0]).size-ratio (), (Demi [4, 6, 0]).residual-ratio (), (Demi [4, 5, 1]).size-ratio (), (Demi [4, 5, 1]).residual-ratio ()]
# [3/2, 3/2, 3/2, 1]
; [(Demi [6, 10, 2]).size-ratio (), (Demi [6, 10, 2]).residual-ratio (), (Demi [3, 5, 1]).size-ratio (), (Demi [3, 5, 1]).residual-ratio ()]
# [2, 4/3, 2, 4/3]
; [(Demi [1, 7, 2]).size-ratio (), (Demi [1, 7, 2]).residual-ratio (), (Demi [1, 2, 7]).size-ratio (), (Demi [1, 2, 7]).residual-ratio ()]
# [9, 5, 9, -5]
```
Two Counts with the same phase and loads give different ratios, as they are
different states: the ratio is what distinguishes `[2, 5, 1]` from `[4, 5, 1]`
beyond their identity
```
; [f2.size-ratio (), f4.size-ratio (), f2.residual-ratio (), f4.residual-ratio ()]
# [3, 3/2, 2, 1]
```
The readings are exact: a third stays a third and multiplying back by the Count
returns the Size and the residual, with no float or truncation. A whole reading
is a FrameInt, a non-whole one a FrameRational, and the residual reading is
signed
```
; [(Demi [3, 1, 0]).size-ratio (), (Demi [3, 0, 1]).residual-ratio (), ((Demi [3, 1, 0]).size-ratio ()) * 3]
# [1/3, -1/3, 1]
; [(A.size-ratio ()) * A.count = A.##, (A.residual-ratio ()) * A.count = A.###, (B.residual-ratio ()) * B.count = B.###, (D5.size-ratio ()) * D5.count = D5.##]
# [<>, <>, <>, <>]
; [A.size-ratio () ~ ((0 - 1).<>), D5.size-ratio () ~ ((1 / 2).<>), D5.size-ratio () ~ ((0 - 1).<>), B.residual-ratio () ~ ((0 - 1).<>), A.size-ratio () ~ (0.<>)]
# [<>, <>, (), <>, ()]
```
An empty state, a balanced nonempty one and a positive Count over empty loads all
read zero, in either phase
```
; [(Demi [2, 0, 0]).size-ratio (), (Demi [1, 0, 0]).size-ratio (), (Demi [3, 0, 0]).residual-ratio ()]
# [0, 0, 0]
; [(Demi [2, 3, 3]).size-ratio (), (Demi [2, 3, 3]).residual-ratio (), (Demi [1, 3, 3]).size-ratio (), (Demi [1, 3, 3]).residual-ratio ()]
# [3, 0, 6, 0]
```
Loads too large for a machine integer give the same exact readings
```
; .G (Demi [1000000007, 123456789012345678901234567890, 987654321098765432109876543210]);
; [(G.size-ratio ()) * G.count = G.##, (G.residual-ratio ()) * G.count = G.###, G.###]
# [<>, <>, -864197532086419753208641975320]
```
## Zero Count

At `C = 0` neither ratio is defined, so each is nil. The state is still present,
and its Size and residual still read, including after loads were added without
any application. This is absence, not a zero, a division error or an infinity
```
; .Z0 (Demi [0, 3, 0]); .Z1 (Demi [0, 0, 0]); .Z2 ((Demi [0, 0, 0]) + 4);
; [[Z0.##, Z0.###, Z0.size-ratio (), Z0.residual-ratio ()], [Z1.##, Z1.###, Z1.size-ratio (), Z1.residual-ratio ()], [Z2.##, Z2.###, Z2.size-ratio (), Z2.residual-ratio ()]]
# [[3, 3, (), ()], [0, 0, (), ()], [4, -4, (), ()]]
```
One application gives the first ratio: from the zero-Count state the Count is 1
and the readings are the Size and the residual
```
; [(Z1 7).count, (Z1 7).size-ratio (), (Z1 7).residual-ratio (), (Z2 3).count, (Z2 3).size-ratio (), (Z2 3).residual-ratio ()]
# [1, 7, 7, 1, 7, -1]
```
## Unary observations

A reading takes no divisor. It is applied to nil, and an operand is refused
rather than read as the divisor, so it is neither `/` nor `%%`. The class
declares no `%%`, which answers nil as for any aggregate without one. Its `/`,
also spelled `./`, is not a ratio either: it redistributes the Size into that
many channels and keeps the Count (007.27, below), so `A / 4` is a Demi of four
loads and no number
```
; [A.size-ratio 4, A.residual-ratio [], A.size-ratio 0, A.residual-ratio “abc”]
# [$!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation]
; [“” (A / 4), A %% 4]
# [“Demi(2,[2, 2, 1, 1])”, ()]
```
A reading at the wrong depth fails safe. Inside a branch `_^` is not the
receiver, so a reading written that way answers `$!.name-missing` and no ratio
```
; .Shallow [.count 2; .left 5; .right 1; .size-ratio {.c (_^ .count); (c .> 0) ? {(_^ .left) / c}}];
; Shallow.size-ratio ()
# $!.name-missing “...
```
## Law check

For every Count `1..5` and every pair of loads `0..4` (125 states), multiplying
each reading by the Count gives back the Size and the residual; and for Count 0,
the 25 states have both readings absent
```
; .ccs [1, 2, 3, 4, 5]; .ls [0, 1, 2, 3, 4];
; .statesP (ccs &| {.c _; ls &| {.l _; ls & {Demi [c, l, _]}}});
; .lawP {.k _; .c (k.count); [(((k.size-ratio ()) * c) = k.##), (((k.residual-ratio ()) * c) = k.###)]};
; .checksP (statesP &| lawP);
; [statesP.#, checksP.#, checksP = (checksP & {<>})]
# [125, 250, <>]
; .statesZ (ls &| {.l _; ls & {Demi [0, l, _]}});
; .lawZ {.k _; [(k.size-ratio () = ()), (k.residual-ratio () = ())]};
; .checksZ (statesZ &| lawZ);
; [statesZ.#, checksZ.#, checksZ = (checksZ & {<>})]
# [25, 50, <>]
```
## A precise regression: a load read at the wrong depth

Carets count lexically, so inside a branch `_^` is the method's own scope, not
the receiver. Reading a load there fails, `$!.name-missing`. Before 011.20,
`+` turned that failure into nil, and writing nil leaves a field as it was, so
the deposit silently did nothing while the phase still flipped. Since #467 the
failure is the method's answer and ends it at the failed write, so even through
a mutable name neither field changes
```
; .Wrong {[.phase 2; .left 0; .apply_ {.s (_ .##); (_^.phase = 2) ? {@left (_^.left + s); @phase 1;};}]};
; .w_ (Wrong ());
; w_ 5
# $!.name-missing “...
; [w_.phase, w_.left]
# [2, 0]
; .Right {[.phase 2; .left 0; .apply_ {.s (_ .##); (_^.phase = 2) ? {@left (_^^.left + s); @phase 1;};}]};
; .r ((Right ()) 5);
; [r.phase, r.left]
# [1, 5]
```
## Against a Router

A `RotorRouter` (`hc/rotor-router.hc`) declares its Count as the number of
children it has routed, `left.# + right.#`, and its Size and residual from the
Sizes of those children. That is a structural count of the stored channels, not
a counter and not its phase. A router that routed two children from the empty
state shares its Count, Size and residual with the Demi that applied the same
two Sizes, and so does its fourth hash. This is a comparison of readings, not
an identity: the router keeps the Frames and a Demi forgets them
```
; Routers <- './hc/rotor-router.hc';
; .rr (((Routers.RotorRouter [[], []]) 5) 1);
; .kk (((Demi [0, 0, 0]) 5) 1);
; [rr.#, rr.##, rr.###, kk.count, kk.#, kk.##, kk.###, (rr.left.# + rr.right.#), rr.#### = kk.####, rr.phase = kk.phase]
# [2, 6, 4, 2, 2, 6, 4, 2, <>, <>]
; .r4 (((rr 7) 2)); .k4 (((kk 7) 2));
; [r4.#, k4.count, r4.phase, k4.phase, r4.#### = k4.####, (k4.size-ratio ()), (k4.residual-ratio ())]
# [4, 4, 2, 2, <>, 15/4, 9/4]
```
## Importing

Imported, the file binds the same class. The import is an example line, so
the evaluator, which reads this file without a root, never runs it
```
; Demis <- './hc/demi.hc';
; [(Demis.Demi [2, 5, 3]) = [5, 3].####, “” ((Demis.Demi [0, 0, 0]) 4)]
# [<>, “Demi(1,4,0)”]
