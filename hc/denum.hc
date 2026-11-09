#!/usr/bin/env hc
```
Denum (occurrence/figure 011.20, 007.25c)

A Denum is a closed state of k ordered channels, k ≥ 1: a Count and k loads.
Applying a Denum to a Frame deposits that Frame's Size into load `C mod k` and
adds one to the Count, so a Denum follows round-robin construction one
observation at a time and remembers how many it has seen. Every arity is the
same class, with the same fields, methods and text; two loads are not a special
case. It is what the fourth hash answers: `x.####` is the Denum of x's Count,
Size and residual, with Count x.# and the two loads (Size + residual)/2 and
(Size − residual)/2.

`Denum` is an ordinary HC class: a constructor closure answering a fresh
aggregate whose fields are its state and whose methods are the class. Nothing
about it is native. The fourth hash keeps only its derivation and builds its
answer with this constructor, which the evaluator reads from this file, compiled
in, the first time `.####` needs one. So this file is both the definition every
evaluator uses and its specification, and it works without a resource root.
Import it to construct Denums directly: `Denums <- './hc/denum.hc'`, then
`Denums.Denum [0, [0, 0]]`.

**State (007.25c, 007.40).** A Denum stores exactly two fields: `count`, the
Count `C`, and `loads`, its ordered loads. Nothing else is stored, so nothing
can disagree with them. `d.count` and `d.#` are `C`, and `d.loads` is the list.
`C` is the full application Count the state has recorded, not its parity, so
`Denum [2, [5, 1]]` and `Denum [4, [5, 1]]` are different states with the same
loads. Two Denums are `=` exactly when their Count and loads are.

**Constructor forms.** `Denum [C, loads]` takes a Count and a nonempty list of
Counts, any of them zero. `Denum [loads]`, a single list, is the default-Count
form with `C = 1` (007.40): `Denum [[2, 5]]` is `Denum [1, [2, 5]]`. It is a
constructor convention, not a claim that the state was reached by one
application, and an explicit Count always wins, so `Denum [0, [2, 5]]` keeps
Count zero. There is no other form: the three-argument `Denum [C, L, R]` of
earlier versions is refused too. Anything else is refused with
`$!!.invalid-denum`, a named error, as Figures refuses an unsupported host. A host declaration such as
`(.# C;)` is not a constructor option. `Denum [0, [0]]` is the neutral start of
arity one, `Denum [0, [0, 0]]` of arity two.

**Observers.** A Denum declares its own Count, Size and residual (011.20): its
Count `C`, the sum of its loads and their alternating sum `e0 − e1 + e2 − …`,
the list residual, which for two loads is `L − R`. An aggregate
otherwise observes its elements, and a Denum has none, so without these it
would observe as 0, 1, 0. Its fourth hash is not declared: no class can
declare `.####`. The derivation from the three observers cannot tell an empty
host from a Denum of Count zero, because both read 0, 0, 0, and it answers nil
for either. A Denum of Count zero is a present state, so the fourth hash
recognizes an instance of this class intrinsically (007.25e,
`lib/frames/fourth-hash.ts`): a Frame whose stored `count` is a Count and whose
stored `loads` is a nonempty list of Counts, and which is `==` to the Denum this
constructor builds from them, answers that fresh reconstruction, an equal instance for every `C`. Nothing of
the source runs, so a foreign aggregate that forges `#`, `##`, `###` or a
`.####` method gets only the ordinary derived fourth hash. `[].####` and
`0.####` stay nil: those are hosts with no children, and a host with no
children has no Denum.

**Application**, `d x`: observe x's Size once, deposit it into load
`C mod k` and add one to the Count. A Size of zero still counts. If x has no Size, its
failure is the answer rather than a deposit. It is a mutating method, `apply_`,
so through a name, `d x` is a functional update: it answers a new Denum and
leaves d unchanged.

**Scaling**, `d.scale_ k`: multiply every load by a Count k, keeping the
Count. It is the numerical shadow of Star: `(x * y).####` is
`x.####.scale_ (y.##)` for a nonempty host x, Count included. `scale_` stays,
as the name the fourth hash and Star correspondence use; `d * k` answers the
same Denum through the operator below.

**Arithmetic**, `d + x`, `d - x` and `d * x` (015.11). A class answers an
operator by declaring a method under its name, found on the operand and its
declared parents, the chain its other methods come from, so an operator in a
method body keeps its global meaning rather than recurring into the class that
is running. All three **construct a fresh Denum state** from the one Size
observation `x.##` of their operand, keeping Figure 008's distinction between
construction and observation. They are **fixed-channel load transformations**
on the loads, consistent with the channel loads of a `RotorRouter`
(`hc/rotor-router.hc`): `+` and `-` add `x.##` to one fixed channel's load the
way a route adds a Frame's Size to the channel it lands in, and `*` is the Star
shadow `scale_`. These are correspondences, not a claim that the Router
declares named `+`, `-` or `*` methods. None of the three is application: **all
keep `C`**, and each answers a fresh value and leaves `d` as it
was. Because they change loads without an application, they can reach a state
no run of applications reaches, such as `C = 0` with a nonzero load.

- `d + x` is the **tally** operator: it deposits `x.##` on load 1, the first
  load the residual subtracts. A sizeless host's failure is the answer, as it is
  for application. It is `d.deposit_ [1, x.##]`, a load-only functional
  update. With one load there is no load 1, and `+` is `$!!.invalid-arity`.
- `d - x` is the **alternator** operator: it deposits on load 0, the first load
  the residual adds, as `d.deposit_ [0, x.##]`. It is not subtraction: a
  deposit only ever adds, so a load never goes negative and stays a whole Count.
  `+` lowers the residual and `-` raises it, the reverse of ordinary
  signed-scalar `+` and `-`.
- `d * x` is the **inlay** operator: it scales every load by the operand's Size
  `x.##`, keeping `C`. It reads the operand
  through the one Size observer, as `+` and `-` do, so any sized Frame scales a
  Denum, not only a bare Count. It is literally `d.scale_ (x.##)`.

None of the three names the `Denum` constructor inside its method. A bare name
in a method is looked up on the argument first (spec 7), and a decimal is
unit-taggable, so inside `d + 2.5` the name `Denum` read `2.5.Denum`, a tagged
number, and applying that to `[C, loads]` was `$!.repetition-domain` (007.25e,
PR #480 review). Each operator now hands the one Size it observed to a
load-only functional update on the receiver, `deposit_` or `scale_`, so
`D + 2.5`, `D - 2.5` and `D * 2.5` all read `(2.5).## = 2`.

**Deposit**, `d.deposit_ [i, k]`: add the Count k to load i and keep the Count,
a load-only functional update for any index of any arity. A k that is not a
Count, or an argument that is not a pair, is `$!!.invalid-denum`, since a
negative deposit is no Denum; an index that is not a load of this Denum is
`$!!.invalid-arity`.

**Rational readings (007.25).** Because `C` is kept, two exact ratios are read
from the state. They are unary observations of the stored state, not `/` and
not `%%`, and they take no divisor. HC runs a method only when it is applied to
something, so they are applied to nil, `d.size-ratio ()`; any other operand is
`$!!.unary-observation`, so `d.size-ratio 4` is refused rather than read as a
division by 4.

- `d.size-ratio ()` is `S / C` for `S = d.##`, exact and nonnegative.
- `d.residual-ratio ()` is `Δ / C` for `Δ = d.###`, exact and signed.

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

**Text.** A Denum prints as what it is, an aggregate of fields and methods. As
text it reads `Denum(C,[e0, e1, …])`, the Count and its loads, for every arity.

`d ./ n`, also spelled `d / n`, redistributes the Size: it keeps C and the
total S and deals S Size units round-robin into n channels, so the first
S mod n hold ⌈S/n⌉ and the rest ⌊S/n⌋. It is idempotent, `(d ./ n) ./ m` is
`d ./ m`, and equal Count and Size give equal results, so `Denum(3,[5,2])` and
`Denum(3,[4,3])` divide into the same `Denum(3,[3,2,2])`. It is not scalar
division and not the ratios: no number is answered. The divisor is a positive
Count, refused as a list refuses it (`$!.division-by-zero /`,
`$!.division-domain /`), never read as a Size. `hc/division.hc` is its
specification, with the list and RotorRouter divisions beside it.

**Methods read their own state through `_^`.** A bare name inside a method is
looked up on the argument first (spec 7), and a Denum is applied to arbitrary
Frames, so a bare `loads` could read the argument's field. `_^` is the receiver
from a method's body, and `_^^` from a block one level in, because carets
count lexically (spec a06). What a branch needs is bound as a local at method
level, where nested blocks read it; a deposit builds its own small cursor
there, which adds a Size at one load index when the loads are reduced through
it, so a Denum printed and read back still applies. The file's own names, the
constructor `Denum` and the helper `redistribution` (the round-robin loads of S
units in n channels), are read the same way, through the scope a caret ladder
reaches, `(_^^^ .Denum)` from a branch, so an argument's fields never stand in
for them.
```
.redistribution {.s (_ .0); .ways (_ .1); .r (s %% ways); .q (((s - r) / ways).##);
  ((ways - r) [q]) | (r [(q + 1)])};
.denum-instance {.c (_ .0); .e (_ .1); [
    .count c;
    .loads e;
    .# {_^.count};
    .## {(_^ .loads).##};
    .### {(_^ .loads).###};
    .apply_ {.s (_ .##); .c (_^ .count); .e (_^ .loads);
      .at (c %% (e.#)); .cursor [.index 0; .target at; .amount s; .out []; .apply_ {.v _; .i (_^ .index); .t (_^ .target); .a (_^ .amount); .o (_^ .out); @out (o ((i = t) ? {v + a} : {v})); @index (i + 1);}];
      (s ~ (0.<>)) ? {@loads ((e | cursor) .out); @count (c + 1); _^^} : {s}};
    .scale_ {.k _; .e (_^ .loads);
      (k ~ (0.<>)) ? {@loads (e & {_ * k}); _^^} : {$!!.invalid-scale}};
    .deposit_ {.a _; .e (_^ .loads);
      .ok (((a ~ ([].<>)) ? {((a.#) = 2) ? {(a .1) ~ (0.<>)}}) ? {1} : {0});
      .at ((ok = 1) ? {a .0} : {0}); .k ((ok = 1) ? {a .1} : {0});
      .ix (((ok = 1) ? {(at ~ (0.<>)) ? {(e.#) .> at}}) ? {1} : {0});
      .cursor [.index 0; .target at; .amount k; .out []; .apply_ {.v _; .i (_^ .index); .t (_^ .target); .a (_^ .amount); .o (_^ .out); @out (o ((i = t) ? {v + a} : {v})); @index (i + 1);}];
      (ix = 1) ? {@loads ((e | cursor) .out); _^^} : {(ok = 1) ? {$!!.invalid-arity} : {$!!.invalid-denum}}};
    .+ {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .deposit_ [1, s])} : {s}};
    .- {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .deposit_ [0, s])} : {s}};
    .* {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .scale_ s)} : {s}};
    ./ {.ways _; .c (_^ .count); .s (_^ .##); .v ([] / ways);
      (v ~ ([].<>)) ? {(_^^^ .Denum) [c, ((_^^^ .redistribution) [s, ways])]} : {v}};
    .size-ratio {.c (_^ .count); .s (_^ .##); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {s / c} : {$!!.unary-observation}}};
    .residual-ratio {.c (_^ .count); .d (_^ .###); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {d / c} : {$!!.unary-observation}}};
    .toText {“Denum(” (_^ .count) “,” (_^ .loads) “)”}
  ]};
.Denum {((_ ~ ([].<>)) ? {(__ .#) ~ <1, 2>}) ? {.a __; .n (a.#);
  .c ((n = 1) ? {1} : {a .0});
  .boxed ((n = 2) ? {[a .1]} : {[a .0]});
  ((c ~ (0.<>)) ? {(boxed .0) ~ ([].<>)}) ? {.e (boxed .0); .k (e.#);
  ((k .> 0) ? {(e &| {.x _; (x ~ (0.<>)) ? {[]} : {[x]}}).# = 0}) ? {
    denum-instance [c, (e | [])]
  } : {$!!.invalid-denum}} : {$!!.invalid-denum}} : {$!!.invalid-denum}};
```
## Construction

A Denum holds its Count and its loads. Each instance is its own: two built
from the same constructor share nothing. The neutral start `Denum [0, [0, 0]]`
is present, with Count zero
```
; .d (Denum [0, [0, 0]]);
; [d.count, d.# %% 2, d.loads .0, d.loads .1, d.loads, d.#, d.##, d.###, “” d]
# [0, 0, 0, 0, [0, 0], 0, 0, 0, “Denum(0,[0, 0])”]
; .a (Denum [2, [5, 3]]); .b (Denum [1, [7, 0]]);
; [“” a, “” b, a.loads .0, b.loads .0, a.# %% 2, b.# %% 2]
# [“Denum(2,[5, 3])”, “Denum(1,[7, 0])”, 5, 7, 0, 1]
```
Any Counts are a state. With two loads the next load is the Count's parity,
`C %% 2`: 0 when even, zero included, and 1 when odd
```
; [0, 1, 2, 3, 4, 5, 100, 101] & {(Denum [_, [5, 3]]).# %% 2}
# [0, 1, 0, 1, 0, 1, 0, 1]
; [(Denum [2, [5, 3]]).#, (Denum [4, [5, 3]]).#, (Denum [100, [5, 3]]).count, (Denum [100, [5, 3]]).# %% 2, (Denum [3, [5, 3]]).# %% 2]
# [2, 4, 100, 0, 1]
```
A positive Count over empty loads and nonzero loads over a zero Count are both
states. Anything that is not three Counts is refused
```
; [“” (Denum [3, [0, 0]]), “” (Denum [0, [3, 0]]), “” (Denum [0, [0, 4]])]
# [“Denum(3,[0, 0])”, “Denum(0,[3, 0])”, “Denum(0,[0, 4])”]
; [Denum [2, [(0 - 1), 0]], Denum [(0 - 1), [1, 1]], Denum [(5 - 3), [(5 - 7), 0]], Denum [2, 1], Denum 5, Denum [2, [1.5, 0]], Denum [2, 1, 0, 0]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
```
## Constructor forms

`Denum [loads]` is the default-Count form: the Count is 1. It is a constructor
convention. An explicit Count, zero included, is kept as given. `[C, loads]` is
the explicit form, and any arity of one or more loads is a Denum. The
three-argument form of earlier versions is refused
```
; [“” (Denum [[2, 5]]), “” (Denum [0, [2, 5]]), “” (Denum [[7]]), “” (Denum [[2, 5, 3]])]
# [“Denum(1,[2, 5])”, “Denum(0,[2, 5])”, “Denum(1,[7])”, “Denum(1,[2, 5, 3])”]
; [Denum [2, 5, 3], Denum [0, 0, 0], Denum [3, 12, 3]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; [“” (Denum [3, [2, 5, 3, 7, 4]]), “” (Denum [0, [1]]), “” (Denum [2, [2, 5]]), “” (Denum [3, [4]])]
# [“Denum(3,[2, 5, 3, 7, 4])”, “Denum(0,[1])”, “Denum(2,[2, 5])”, “Denum(3,[4])”]
; [(Denum [[2, 5]]).#, (Denum [[2, 5]]).##, (Denum [[2, 5]]) = (Denum [1, [2, 5]]), (Denum [[2, 5]]) = (Denum [1, [2, 5]])]
# [1, 7, <>, <>]
; (Denum [[123456789012345678901234567890, 5, 3]]).##
# 123456789012345678901234567898
```
A default form is refused like an explicit one when its loads are not whole,
and the one-argument form takes a list of loads, never a bare number
```
; [Denum [[]], Denum [[1, (0 - 1)]], Denum [[1.5, 2]], Denum [[“a”]], Denum [5], Denum [(0 - 1)], Denum [[[1]]], Denum [[2, 5], [1]], Denum []]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
; [Denum [1.5, [2, 5]], Denum [(0 - 1), [2, 5]], Denum [“a”, [2, 5]], Denum [2, [2, (0 - 1)]], Denum [2, []], Denum [2, 5], Denum [2, 1, 2, 3]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum]
```
Routing follows the Count alone: application deposits into load
`C mod arity`, here `C mod 2`, so two Denums with the same loads and Counts of
different parity route to different loads
```
; [(Denum [2, [0, 0]]) 5, (Denum [3, [0, 0]]) 5] & {“” _}
# [“Denum(3,[5, 0])”, “Denum(4,[0, 5])”]
```
A Denum stores its Count and loads and nothing else, whatever its arity. Along
any run of applications, deposits and scalings its Size is the sum of its loads
and its fourth hash is the state itself
```
; .walk {.s _; [s, (s 5), ((s 5) - 2), (((s 5) - 2) + 3), ((((s 5) - 2) + 3) * 2), (((((s 5) - 2) + 3) * 2) 0)]};
; .agree {.k _; (k.## = (k.loads).##) ? {k.#### = k}};
; [(walk (Denum [0, [0, 0]])) & agree, (walk (Denum [1, [4, 1]])) & agree, (walk (Denum [2, [1, 2, 3]])) & agree]
# [[<>, <>, <>, <>, <>, <>], [<>, <>, <>, <>, <>, <>], [<>, <>, <>, <>, <>, <>]]
```
## Application

Each application deposits the argument's Size into load `C mod k` and adds one
to the Count. The receiver is left as it was
```
; “” (d [5, 3])
# “Denum(1,[8, 0])”
; “” d
# “Denum(0,[0, 0])”
; “” (((d 5) 3) 7)
# “Denum(3,[12, 3])”
```
A Size of zero deposits nothing and still counts, in both parities
```
; [(d 0).count, ((d 0) 0).count, (d 0).# %% 2, ((d 0) 0).# %% 2, (d 0).loads .0, ((d 0) 0).loads .1]
# [1, 2, 1, 0, 0, 0]
```
Any Frame is applied by its Size, measured without running it: text, the
empty aggregate and all (Size 1 each), nested aggregates, a closure (one per
word, so `{5 + 3}` is 9), empty text, and loads too large for a machine integer
```
; “” ((((((d “hello”) []) <>) [[1, 2], [3]]) {5 + 3}) “”)
# “Denum(6,[15, 7])”
; “” ((d 123456789012345678901234567890) 987654321098765432109876543210)
# “Denum(2,[123456789012345678901234567890, 987654321098765432109876543210])”
```
A Frame without a Size is not deposited: its failure is the answer
```
; d ([].nope)
# $!.name-missing “...
; “” d
# “Denum(0,[0, 0])”
```
Deposit reads the receiver through `_^`, so an argument that holds fields of
the same names deposits by its Size and nothing else
```
; “” (d [.count 50; .left 99; .phase 1; .s 100; 4])
# “Denum(1,[4, 0])”
; “” ((Denum [2, [5, 3]]) [.count 50; .left 99; .right 7; 4])
# “Denum(3,[9, 3])”
```
A Denum captured by a closure, mapped, or reduced is applied the same way, and
the captured one stays as it was
```
; .start (Denum [0, [0, 0]]); .step {start _};
; [“” (step 5), “” (step 3), “” start]
# [“Denum(1,[5, 0])”, “Denum(1,[3, 0])”, “Denum(0,[0, 0])”]
; [d, a] & {“” (_ 5)}
# [“Denum(1,[5, 0])”, “Denum(3,[10, 3])”]
; “” ([5, 3, 7] | (Denum [0, [0, 0]]))
# “Denum(3,[12, 3])”
```
Through a mutable name, application writes the Denum in place
```
; .m_ (Denum [0, [0, 0]]);
; m_ 5;
; m_ 3;
; [“” m_, m_.count, m_.# %% 2]
# [“Denum(2,[5, 3])”, 2, 0]
```
## Application counts

Starting at Count 0 or at Count 1, applying 5, 3, 7 and 2 in turn grows the
Count by exactly one each time and alternates the load. The Size and residual
are the alternating route's, from load 0 or from load 1
```
; .chain {.s _; [s, (s 5), ((s 5) 3), (((s 5) 3) 7), ((((s 5) 3) 7) 2)]};
; .c0 (chain (Denum [0, [0, 0]])); .c1 (chain (Denum [1, [0, 0]]));
; [c0 & {_.count}, c0 & {_.# %% 2}, c0 & {_.##}, c0 & {_.###}]
# [[0, 1, 2, 3, 4], [0, 1, 0, 1, 0], [0, 5, 8, 15, 17], [0, 5, 2, 9, 7]]
; [c1 & {_.count}, c1 & {_.# %% 2}, c1 & {_.##}, c1 & {_.###}]
# [[1, 2, 3, 4, 5], [1, 0, 1, 0, 1], [0, 5, 8, 15, 17], [0, -5, -2, -9, -7]]
```
The Count and the loads together are the state, and the fourth hash of each step
is that step, Count included
```
; [(c0 & {_.####}) = c0, (c1 & {_.####}) = c1]
# [<>, <>]
```
## Observers

A Denum's Count is its stored Count, its Size the total load and its residual the
signed difference, including a present zero-load Denum in either parity
```
; .e (Denum [3, [12, 3]]);
; [e.#, e.##, e.###, e.# %% 2]
# [3, 15, 9, 1]
; [d.#, d.##, d.###, (Denum [1, [0, 0]]).#, (Denum [1, [0, 0]]).# %% 2]
# [0, 0, 0, 1, 1]
```
Count is `.#`, not its parity. The same parity and loads with a different Count are
different states with the same Size and residual
```
; .f2 (Denum [2, [5, 1]]); .f4 (Denum [4, [5, 1]]);
; [(f2.# %% 2) = (f4.# %% 2), f2.## = f4.##, f2.### = f4.###, f2.# = f4.#, f2 = f4, f2 = (Denum [2, [5, 1]])]
# [<>, <>, <>, (), (), <>]
; [f2.#, f4.#, f2.##, f2.###, f2.# %% 2, f4.# %% 2]
# [2, 4, 6, 4, 0, 0]
```
A Denum inside an aggregate contributes its declared Size
```
; [[e, e].##, [e, d].###, [e].#### = (Denum [1, [15, 0]])]
# [30, 15, <>]
```
## The fourth hash

`.####` of a Denum is that Denum, however often it is taken. It is equal, not
identical: each observation builds a new instance. Its Count is kept for every
Count, including zero
```
; [e.#### = e, e.#### === e, e.#### == e, ((e.####).####).#### = e, (e.####).# = e.#]
# [<>, (), <>, <>, <>]
; [d.#### = d, (Denum [1, [0, 0]]).#### = (Denum [1, [0, 0]]), (Denum [100, [5, 3]]).####.count, (Denum [0, [3, 0]]).#### = (Denum [0, [3, 0]])]
# [<>, <>, 100, <>]
; [f2.####.# , f4.####.#, f2.#### = f4.####, f2.#### = f2]
# [2, 4, (), <>]
```
`.####` of a host answers an instance of this class, built from the same source,
so it compares equal to one built here. The host's whole Count is kept: it is
not reduced to its parity
```
; [[5, 3].#### = (Denum [2, [5, 3]]), “hello”.#### = (Denum [5, [3, 2]]), [0].#### = (Denum [1, [0, 0]])]
# [<>, <>, <>]
; [[5, 3].####.#, “hello”.####.#, “hello”.#### .# %% 2, [5, 3, 7].####.#, [5, 3, 7].#### .# %% 2]
# [2, 5, 1, 3, 1]
; “” [5, 3, 7].####
# “Denum(3,[12, 3])”
```
Hosts whose Counts differ by an even number do not share a fourth hash, though
they share parity and, here, loads
```
; [[5, 3].#### = [5, 3, 0, 0].####, ([5, 3].#### .# %% 2) = ([5, 3, 0, 0].#### .# %% 2), [5, 3].####.## = [5, 3, 0, 0].####.##]
# [(), <>, <>]
```
It is nil where there is no Denum: an empty host, Count zero, no Count, or no
residual. A host with no children is not a Denum of Count zero. Properties are
not elements, sharing counts each occurrence, and a group observes as its
elements
```
; [[].####, 0.####, ().####, <2,3,5>.####, “”.####]
# [(), (), (), (), ()]
; .shared [1, 2];
; [[.a 100; 5, 3].#### = [5, 3].####, [shared, shared].#### = (Denum [2, [3, 3]]), (5, 3).#### = (Denum [2, [5, 3]])]
# [<>, <>, <>]
```
The two zero-Count cases are different. A constructed `Denum [0, [0, 0]]` is a
present value, while the empty host and the Count 0 have none. They agree on
Count, Size and residual, so the difference is not read from the observers: the
fourth hash recognizes an instance of this class (007.25e)
```
; [[].# = d.#, [].## = d.##, 0.## = d.##, 0.### = d.###]
# [<>, (), <>, <>]
; [[].#### = (), 0.#### = (), d.#### = d, ((Denum [0, [0, 0]]).####).count]
# [<>, <>, <>, 0]
```
Zero-Count Denums reached without an application are present too, and so is
each functional update of one
```
; [“” ((Denum [0, [3, 0]]).####), “” ((d + 4).####), “” ((d - 2.5).####), “” ((d * 7).####)]
# [“Denum(0,[3, 0])”, “Denum(0,[0, 4])”, “Denum(0,[2, 0])”, “Denum(0,[0, 0])”]
```
## Only a Denum is a Denum

No class declares its own `.####`. An aggregate that declares a method under
that name keeps it as an ordinary property, which the fourth hash never runs:
its fourth hash is derived from its observers like any other Frame's. So a
method answering a foreign aggregate, an error, nil, itself, or a write
changes nothing, and nothing in it runs
```
; .noted_ [.n 0; .bump_ {@n (_^.n + 1);}];
; .Liar [.#### {[.# {0}; .## {0}; .### {0}]}];
; .Loud [.#### {noted_.bump_ (); Denum [0, [0, 0]]}];
; .Selfish [.#### {_^.####}];
; .Broken [.#### {[].nope}];
; [Liar.####, Loud.####, Selfish.####, Broken.####, noted_.n]
# [(), (), (), (), 0]
; [“” ([.#### {Denum [9, [9, 9]]}; 5, 3].####), [.#### {Denum [9, [9, 9]]}; 5, 3].#### = [5, 3].####]
# [“Denum(2,[5, 3])”, <>]
```
Forged observers do not make a Denum. An aggregate declaring Count, Size and
residual 0, 0, 0 reads exactly as `Denum [0, [0, 0]]` does, and still has no Denum,
because it is not one; with a nonzero Count it gets the derived Denum of those
observers, a fresh instance of this class, never the aggregate itself
```
; .Zero [.# {0}; .## {0}; .### {0}];
; .Three [.# {3}; .## {5}; .### {1}];
; [[Zero.#, Zero.##, Zero.###] = [d.#, d.##, d.###], Zero.####, “” Three.####, Three.#### = Three]
# [<>, (), “Denum(3,[3, 2])”, ()]
```
Fields named like a Denum's are not enough either. Recognition compares the
whole instance, fields and methods, by typed equality `==` with the Denum the
constructor builds from the stored `count` and `loads`. So a bare record
of those fields, a record in the old shape with a stored phase, one whose Count is a
decimal, and one that adds a field are foreign, and with Count zero they have
no Denum
```
; .Rec [.count 0; .phase 2; .left 0; .right 0];
; .Fake [.count 0; .phase 1; .left 0; .right 0; .# {_^ .count}; .## {_^ .left + _^ .right}; .### {_^ .left - _^ .right}];
; .Dec [.count 0.0; .phase 2; .left 0; .right 0; .# {0}; .## {0}; .### {0}];
; [Rec.####, Fake.####, Dec.####, [.extra 1; .count 0; .left 0; .right 0].####]
# [(), (), (), ()]
```
A Denum with a Count is recognized as one, and what it answers is a fresh
reconstruction from its stored state, equal to it and not it
```
; [(Denum [3, [5, 1]]).#### == (Denum [3, [5, 1]]), (Denum [3, [5, 1]]).#### === (Denum [3, [5, 1]]), “” (Denum [3, [5, 1]]).####]
# [<>, (), “Denum(3,[5, 1])”]
```
## Observing commutes with applying

For a nonempty host X, observing X Y is applying X's Denum to Y, and both equal
the observation of the array X Y constructs, with Count one greater
```
; .X [5, “ab”, [1, 2]];
; [(X 7).#### = (X.#### 7), (X 7).#### = [5, “ab”, [1, 2], 7].####, (X {5 + 3}).#### = (X.#### {5 + 3}), (X 7).####.# = (X.####.# + 1)]
# [<>, <>, <>, <>]
```
The empty host is the boundary. `[].####` is nil, a choice of convention
(011.15g) rather than a theorem, and applying nil answers the argument, so
the equation as written fails there. Lifting the empty host to the Denum of
Count zero restores it: that is the initialized-router reading, and it is also
what a reduce starts from
```
; [([] 7).#### = ([].#### 7), ([] 7).#### = ((Denum [0, [0, 0]]) 7), ([] 7).#### = ([7] | (Denum [0, [0, 0]]))]
# [(), <>, <>]
; [] | (Denum [0, [0, 0]]) = (Denum [0, [0, 0]])
# <>
```
## Scaling and Star

Scaling multiplies every load and keeps the Count: zero annihilates,
one is the identity, and scaling composes
```
; [“” (e.scale_ 2), “” (e.scale_ 0), (e.scale_ 1) = e, ((e.scale_ 2).scale_ 3) = (e.scale_ 6), (e.scale_ 2).#]
# [“Denum(3,[24, 6])”, “Denum(3,[0, 0])”, <>, <>, 3]
; e.scale_ (0 - 2)
# $!!.invalid-scale
```
It is the shadow of Star on a nonempty host, Count included
```
; [([5, 3] * 3).#### = ([5, 3].####.scale_ 3), ([[[]], []] * [[], []]).#### = ([[[]], []].####.scale_ ([[], []].##)), ([5, 3] * 3).####.# = [5, 3].####.#]
# [<>, <>, <>]
```
## Arithmetic

Three operators act on a Denum's state, each reading its operand through the one
Size observer `x.##`. They are fixed-channel load transformations consistent
with a `RotorRouter`'s channel loads (`hc/rotor-router.hc`), not named Router
methods. `+`, `-` and `*` **construct a fresh Denum** from observations of their
operands: `+` is tally, depositing `x.##` on load 1; `-` is alternator,
depositing on load 0; and `*` is inlay, scaling every load by `x.##` through
`scale_`, the Star shadow. Each keeps the Count, answers a
fresh value and leaves its operand as it was, so they compose by nesting
```
; .D (Denum [2, [5, 3]]);
; [“” (D + 4), “” (D - 4), “” (D * 3)]
# [“Denum(2,[5, 7])”, “Denum(2,[9, 3])”, “Denum(2,[15, 9])”]
; [“” ((D + 4) - 2), “” ((D - 2) + 4), “” ((D + 4) * 3)]
# [“Denum(2,[7, 7])”, “Denum(2,[7, 7])”, “Denum(2,[15, 21])”]
; “” D
# “Denum(2,[5, 3])”
```
A deposit keeps the Count, including an odd one, where application would
change its parity, and a zero Size deposits nothing while still answering a Denum. The
operand is measured by its Size, so any sized Frame deposits
```
; [(D + 4).#, (D - 4).#, (D * 3).#, (D + 4).count, (D + 4).# %% 2]
# [2, 2, 2, 2, 0]
; .P (Denum [1, [5, 3]]);
; [“” (P + 4), (P + 4).#, (P + 4).# %% 2, “” (P - 4)]
# [“Denum(1,[5, 7])”, 1, 1, “Denum(1,[9, 3])”]
; [“” (D + 0), “” (D - 0), “” (D [3, 4])]
# [“Denum(2,[5, 3])”, “Denum(2,[5, 3])”, “Denum(3,[12, 3])”]
```
Deposit is not application and deposit is not subtraction. `D x` adds one to the
Count and changes its parity, and `D + x` does not, so they reach different
states; `D - x` adds to load 0 and never takes from load 1, so a load
stays a whole Count and the signed residual only rises
```
; [(D + 4).###, (D - 4).###, D.###]
# [-2, 6, 2]
; [((D 4).# = (D + 4).#), (D 4).###, (D + 4).###, (D 4).#, (D 4).# %% 2]
# [(), 6, -2, 3, 1]
```
Order of a load-1 then a load-0 deposit does not matter, and scaling after a
balanced deposit is the Star shadow of scaling first
```
; [((D + 4) - 2) = ((D - 2) + 4), ((D + 4) * 3) = ((D * 3) + 12)]
# [<>, <>]
```
A sizeless host refuses on all three operators, its failure the answer, as
application refuses it. `*` reads its operand's Size rather than demanding a
bare Count, so a Denum, an aggregate or a decimal works through its `.##`, while
`D * 0` still annihilates
```
; [D + ([].nope), D - ([].nope), D * ([].nope)]
# [$!.name-missing “..., $!.name-missing “..., $!.name-missing “...]
```
## Deposits by Size

`+` and `-` read their operand through the one Size observer as `*` does, so
any sized Frame deposits its Size: a decimal its truncated magnitude, text its
characters, an aggregate its element count, a Denum `L + R`, and a closure one
per word. These are the review's own examples, from `Denum [0, [0, 0]]`
```
; [(2.5).##, (1.5).##, (0 - 1.5).##]
# [2, 1, 1]
; [“” ((Denum [0, [0, 0]]) + 2), “” ((Denum [0, [0, 0]]) + 2.5), “” ((Denum [0, [0, 0]]) - 1.5), “” ((Denum [1, [2, 2]]) * 2.5)]
# [“Denum(0,[0, 2])”, “Denum(0,[0, 2])”, “Denum(0,[1, 0])”, “Denum(1,[4, 4])”]
; [“” (D + 2.5), “” (D - 2.5), “” (P + 0.5), “” (P - (0 - 3.5))]
# [“Denum(2,[5, 5])”, “Denum(2,[7, 3])”, “Denum(1,[5, 3])”, “Denum(1,[8, 3])”]
; [“” (D + “abc”), “” (D - [[], []]), “” (D + (Denum [1, [2, 4]])), “” (D - {5 + 3}), “” (D + <>), “” (D - [])]
# [“Denum(2,[5, 6])”, “Denum(2,[7, 3])”, “Denum(2,[5, 9])”, “Denum(2,[14, 3])”, “Denum(2,[5, 4])”, “Denum(2,[6, 3])”]
```
Each keeps the full Count, in both parities; leaves the
receiver as it was, even through a mutable name; and refuses a sizeless operand
with its failure
```
; [(D + 2.5).#, (D + 2.5).# %% 2, (P - 1.5).#, (P - 1.5).# %% 2, “” D, “” P]
# [2, 0, 1, 1, “Denum(2,[5, 3])”, “Denum(1,[5, 3])”]
; .q_ (Denum [2, [5, 3]]);
; [“” (q_ + 2.5), “” (q_ - 2.5), “” (q_ * 2.5), “” q_]
# [“Denum(2,[5, 5])”, “Denum(2,[7, 3])”, “Denum(2,[10, 6])”, “Denum(2,[5, 3])”]
; [D + ([2.5].nope), D - ([2.5].nope), (Denum [0, [0, 0]]) + ([].nope)]
# [$!.name-missing “..., $!.name-missing “..., $!.name-missing “...]
```
The argument cannot reach the receiver's names. A decimal is unit-taggable,
`2.5.Denum` is a tagged number, and an aggregate can hold fields named like the
receiver's or its locals; none of them changes which state is updated, and
such an aggregate deposits only its elements' Size, here 4
```
; (2.5).Denum
# 2.5.Denum
; [“” (D + [.Denum 9; .right 99; .left 99; .count 7; .k 50; 4]), “” (D - [.Denum 9; .left 99; .l 99; .s 50; 4])]
# [“Denum(2,[5, 7])”, “Denum(2,[9, 3])”]
```
The deposit behind them takes a load index and a Count, for any arity, so a
negative or fractional deposit is not a Denum and an index past the loads is
refused
```
; [“” (D.deposit_ [1, 2]), “” (D.deposit_ [0, 2]), “” ((Denum [0, [1, 2, 3]]).deposit_ [2, 4]), “” D]
# [“Denum(2,[5, 5])”, “Denum(2,[7, 3])”, “Denum(0,[1, 2, 7])”, “Denum(2,[5, 3])”]
; [D.deposit_ [1, (0 - 1)], D.deposit_ [0, 2.5], D.deposit_ 2, D.deposit_ [1, 2, 3], D.deposit_ [2, 1], D.deposit_ [(0 - 1), 1], D.deposit_ [“a”, 1]]
# [$!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-denum, $!!.invalid-arity, $!!.invalid-arity, $!!.invalid-arity]
```
`*` scales by the operand's Size, so its domain is every sized Frame: a Denum
contributes `L + R`, an aggregate its element count, a decimal its truncated
magnitude, and a zero Size annihilates both loads. `D * 3` is unchanged, since
`3.## = 3`, and the result keeps the Count in either parity
```
; [“” (D * (Denum [1, [2, 4]])), “” (D * [[], []]), “” (D * 2.5), “” (D * 0)]
# [“Denum(2,[30, 18])”, “Denum(2,[10, 6])”, “Denum(2,[10, 6])”, “Denum(2,[0, 0])”]
; [“” (D * 1), (D * 3).#, (P * 3).#, “” (P * 3)]
# [“Denum(2,[5, 3])”, 2, 1, “Denum(1,[15, 9])”]
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
; .Y ((Denum [0, [0, 0]]) + 4);
; [“” Y, “” ((Denum [0, [0, 0]]) - 4), Y.count, Y.# %% 2, Y.##, Y.###]
# [“Denum(0,[0, 4])”, “Denum(0,[4, 0])”, 0, 0, 4, -4]
; [“” (D * 3), (D.scale_ 2).#, ((D + 4) 1).#, ((D + 4) 1).# %% 2]
# [“Denum(2,[15, 9])”, 2, 3, 1]
```
## Rational readings

For `C > 0` the Size reading is `S / C` and the residual reading `Δ / C`, two
different observables. With `C = 2`, `L = 5`, `R = 1` they are 3 and 2. With the
loads swapped the Size reading is unchanged and the residual reading changes
sign. With `L = 5`, `R = 0` they are the improper 5/2, neither 2 nor 3
```
; .A (Denum [2, [5, 1]]); .B (Denum [2, [1, 5]]); .D5 (Denum [2, [5, 0]]);
; [[A.##, A.###, A.size-ratio (), A.residual-ratio ()], [B.##, B.###, B.size-ratio (), B.residual-ratio ()], [D5.##, D5.###, D5.size-ratio (), D5.residual-ratio ()]]
# [[6, 4, 3, 2], [6, -4, 3, -2], [5, 5, 5/2, 5/2]]
```
They differ when the loads do. Non-divisible ratios stay exact and the runtime
reduces them: 6/4 reads 3/2, 8/6 reads 4/3. At `C = 1` they are the Size and the
residual, and an odd Count works as an even one does
```
; [(Denum [2, [3, 2]]).size-ratio (), (Denum [2, [3, 2]]).residual-ratio ()]
# [5/2, 1/2]
; [(Denum [4, [6, 0]]).size-ratio (), (Denum [4, [6, 0]]).residual-ratio (), (Denum [4, [5, 1]]).size-ratio (), (Denum [4, [5, 1]]).residual-ratio ()]
# [3/2, 3/2, 3/2, 1]
; [(Denum [6, [10, 2]]).size-ratio (), (Denum [6, [10, 2]]).residual-ratio (), (Denum [3, [5, 1]]).size-ratio (), (Denum [3, [5, 1]]).residual-ratio ()]
# [2, 4/3, 2, 4/3]
; [(Denum [1, [7, 2]]).size-ratio (), (Denum [1, [7, 2]]).residual-ratio (), (Denum [1, [2, 7]]).size-ratio (), (Denum [1, [2, 7]]).residual-ratio ()]
# [9, 5, 9, -5]
```
Two Counts with the same parity and loads give different ratios, as they are
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
; [(Denum [3, [1, 0]]).size-ratio (), (Denum [3, [0, 1]]).residual-ratio (), ((Denum [3, [1, 0]]).size-ratio ()) * 3]
# [1/3, -1/3, 1]
; [(A.size-ratio ()) * A.count = A.##, (A.residual-ratio ()) * A.count = A.###, (B.residual-ratio ()) * B.count = B.###, (D5.size-ratio ()) * D5.count = D5.##]
# [<>, <>, <>, <>]
; [A.size-ratio () ~ ((0 - 1).<>), D5.size-ratio () ~ ((1 / 2).<>), D5.size-ratio () ~ ((0 - 1).<>), B.residual-ratio () ~ ((0 - 1).<>), A.size-ratio () ~ (0.<>)]
# [<>, <>, (), <>, ()]
```
An empty state, a balanced nonempty one and a positive Count over empty loads all
read zero, in either parity
```
; [(Denum [2, [0, 0]]).size-ratio (), (Denum [1, [0, 0]]).size-ratio (), (Denum [3, [0, 0]]).residual-ratio ()]
# [0, 0, 0]
; [(Denum [2, [3, 3]]).size-ratio (), (Denum [2, [3, 3]]).residual-ratio (), (Denum [1, [3, 3]]).size-ratio (), (Denum [1, [3, 3]]).residual-ratio ()]
# [3, 0, 6, 0]
```
Loads too large for a machine integer give the same exact readings
```
; .G (Denum [1000000007, [123456789012345678901234567890, 987654321098765432109876543210]]);
; [(G.size-ratio ()) * G.count = G.##, (G.residual-ratio ()) * G.count = G.###, G.###]
# [<>, <>, -864197532086419753208641975320]
```
## Zero Count

At `C = 0` neither ratio is defined, so each is nil. The state is still present,
and its Size and residual still read, including after loads were added without
any application. This is absence, not a zero, a division error or an infinity
```
; .Z0 (Denum [0, [3, 0]]); .Z1 (Denum [0, [0, 0]]); .Z2 ((Denum [0, [0, 0]]) + 4);
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
many channels and keeps the Count (007.27, below), so `A / 4` is a Denum of four
loads and no number
```
; [A.size-ratio 4, A.residual-ratio [], A.size-ratio 0, A.residual-ratio “abc”]
# [$!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation]
; [“” (A / 4), A %% 4]
# [“Denum(2,[2, 2, 1, 1])”, ()]
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
; .statesP (ccs &| {.c _; ls &| {.l _; ls & {Denum [c, [l, _]]}}});
; .lawP {.k _; .c (k.count); [(((k.size-ratio ()) * c) = k.##), (((k.residual-ratio ()) * c) = k.###)]};
; .checksP (statesP &| lawP);
; [statesP.#, checksP.#, checksP = (checksP & {<>})]
# [125, 250, <>]
; .statesZ (ls &| {.l _; ls & {Denum [0, [l, _]]}});
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
state shares its Count, Size and residual with the Denum that applied the same
two Sizes, and so does its fourth hash. This is a comparison of readings, not
an identity: the router keeps the Frames and a Denum forgets them
```
; Routers <- './hc/rotor-router.hc';
; .rr (((Routers.RotorRouter [[], []]) 5) 1);
; .kk (((Denum [0, [0, 0]]) 5) 1);
; [rr.#, rr.##, rr.###, kk.count, kk.#, kk.##, kk.###, ((rr.channels .0).# + (rr.channels .1).#), rr.#### = kk.####, (rr.# %% 2) = (kk.# %% 2)]
# [2, 6, 4, 2, 2, 6, 4, 2, <>, <>]
; .r4 (((rr 7) 2)); .k4 (((kk 7) 2));
; [r4.#, k4.count, (r4.# %% 2), k4.# %% 2, r4.#### = k4.####, (k4.size-ratio ()), (k4.residual-ratio ())]
# [4, 4, 0, 0, <>, 15/4, 9/4]
```
## Count binding, `.#%`

`d.#%` binds a Denum to its own Count (occurrence/figure 007.39a). For
`d = (C; [a0, …, a(A−1)])` with `C > 0` it answers a new Denum of Count C and
exactly C loads, where load j is the sum of every source load whose index is
congruent to j mod C. With fewer loads than C the loads are copied and the rest
are zero; with exactly C they are kept; with more, each further load folds onto
the load its index names mod C. Nothing is cycled, replicated or cancelled. It
is not the redistribution `./ n`, which deals Size units and ignores the
order of the loads, and it is not a rank: it answers a Denum, never a number
```
; [“” ((Denum [3, [2, 5]]).#%), “” ((Denum [3, [2, 5, 3]]).#%), “” ((Denum [3, [2, 5, 3, 7]]).#%), “” ((Denum [3, [2, 5, 3, 7, 4]]).#%)]
# [“Denum(3,[2, 5, 0])”, “Denum(3,[2, 5, 3])”, “Denum(3,[9, 5, 3])”, “Denum(3,[9, 9, 3])”]
; [“” ((Denum [[2, 5, 3, 7, 4]]).#%), “” ((Denum [4, [6]]).#%), “” ((Denum [2, [4]]).#%), “” ((Denum [3, [0, 0, 0, 0, 0]]).#%), “” ((Denum [2, [5, 3]]).#%)]
# [“Denum(1,[21])”, “Denum(4,[6, 0, 0, 0])”, “Denum(2,[4, 0])”, “Denum(3,[0, 0, 0])”, “Denum(2,[5, 3])”]
```
It keeps the Count, the total Size and nonnegative loads, its arity is the
Count, it is idempotent, and its answer is an instance of this same class, so
its fourth hash is itself. The receiver is left as it was
```
; .Bd (Denum [3, [2, 5, 3, 7, 4]]); .Bn (Bd.#%);
; [Bn.#, Bn.##, Bd.##, Bn.loads.#, (Bn.#%) = Bn, Bn.#### = Bn, “” Bd]
# [3, 21, 21, 3, <>, <>, “Denum(3,[2, 5, 3, 7, 4])”]
; .lawB {.k _; .n (k.#%); [n.# = k.#, n.## = k.##, n.loads.# = k.#, (n.#%) = n]};
; [Denum [1, [4, 4]], Denum [2, [1, 2, 3]], Denum [5, [9]], Denum [4, [1, 2, 3, 4, 5, 6, 7, 8, 9]], Denum [3, [123456789012345678901234567890, 1]]] &| lawB
# [<>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>, <>]
```
Order matters. The same loads in another order can bind differently, so
binding is neither permutation-invariant nor invertible
```
; [“” ((Denum [2, [1, 2, 3]]).#%), “” ((Denum [2, [3, 2, 1]]).#%), “” ((Denum [2, [2, 1, 3]]).#%), (Denum [2, [3, 1]]).#% = (Denum [2, [1, 3]]).#%]
# [“Denum(2,[4, 2])”, “Denum(2,[4, 2])”, “Denum(2,[5, 1])”, ()]
```
Binding follows application: a Denum whose Count has grown past its arity binds
into as many loads as it has seen
```
; .G3 ((((Denum [0, [0, 0]]) 2) 5) 3);
; [“” G3, “” (G3.#%)]
# [“Denum(3,[5, 5])”, “Denum(3,[5, 5, 0])”]
```
A Denum of Count zero is present, under `.####` too, but has no channel to bind
into, so `.#%` refuses it with a stable named failure rather than nil, an empty
Denum or a division by zero. Anything that is not a Denum is refused too, the
way `.####` recognizes one: hosts, numbers, nil, forged records and aggregates
that declare a `#%` of their own. A Count too large to materialize is refused
separately, and nothing is allocated. The limit is 65536 loads: a Count of
exactly 65536 binds into 65536 loads, and 65537 is refused
```
; .Z (Denum [0, [2, 5]]);
; [Z.#### = Z, Z.#%, (Z.####).#%, [].####]
# [<>, $!.denum-binding-zero-count, $!.denum-binding-zero-count, ()]
; [[5, 3].#%, 3.#%, ().#%, “ab”.#%, {1}.#%, [.count 3; .loads [1, 2]].#%, [.#% {Denum [1, [1]]}].#%]
# [$!.denum-binding-receiver, $!.denum-binding-receiver, $!.denum-binding-receiver, $!.denum-binding-receiver, $!.denum-binding-receiver, $!.denum-binding-receiver, $!.denum-binding-receiver]
; [(Denum [70000, [1]]).#%, (Denum [123456789012345678901234567890, [1]]).#%, ([].nope).#%]
# [$!.denum-binding-capacity, $!.denum-binding-capacity, $!.name-missing “...]
; .Edge ((Denum [65536, [1, 2]]).#%);
; [Edge.#, (Edge.loads).#, Edge.##, (Edge.loads) .0, (Edge.loads) .1, (Edge.loads) .65535, (Denum [65537, [1, 2]]).#%]
# [65536, 65536, 3, 1, 2, 0, $!.denum-binding-capacity]
```
`.#%` is one token. `.#`, `%%` and a comment are read as before, and `.#%%`,
which could be either, is refused by the lexer: write `.# %%`
```
; [[5, 3, 1].# %% 2, (Denum [3, [1]]).# %% 2, (Denum [3, [1]]).#% .#] # a comment after
# [1, 1, 3]
```
## Geometric observers, `.##%` … `.###%%%` (experimental)
Six observers read a Denum through a geometry (occurrence/figure 007.41b,
007.41c). Each first binds the Denum with `.#%`, so all of them read the same
C loads `B = [b0, …, b(C−1)]`, and every refusal of `.#%` is theirs too. The
`##` spelling answers a squared magnitude, exact and nonnegative: a Count when
whole and a rational otherwise. The `###` spelling answers a fresh list of
signed coordinates, never a Denum and never a single number. They are
observations only: no load, native observer or operator changes, and no
algebra product is installed

The centered simplex, `%`, places the C loads on the vertices of a regular
simplex centred at zero. `.##%` is `(C·Σbi² − S²)/(C−1)` with `S = Σbi`, and
`.###%` is the centred coefficients `bi − S/C`, which sum to zero; their
numerators over C are `C·bi − S`. Adding the same amount to every load
changes neither, and Count 1 is the degenerate simplex, of magnitude 0
```
; .Sd (Denum [3, [2, 5, 3, 7, 4]]);
; [Sd.##%, Sd.###%, (Sd.#%).##% = Sd.##%, “” Sd]
# [36, [2, 2, -4], <>, “Denum(3,[2, 5, 3, 7, 4])”]
; [(Denum [2, [3, 1]]).##%, (Denum [4, [2, 4, 2, 4]]).##%, (Denum [3, [1]]).###%, (Denum [3, [4, 4, 4]]).##%, (Denum [1, [5, 3]]).###%]
# [4, 16/3, [2/3, -1/3, -1/3], 0, [0]]
```
The Cayley–Dickson observers, `%%`, need a Count that is a power of two, the
dimension of a Cayley–Dickson algebra; any other Count is
`$!.denum-cd-count`. They map the simplex coordinates isometrically onto the
C−1 imaginary units with the fixed-sign Helmert basis of the 007.41
experiment: `.###%%` is `[0, x1, …, x(C−1)]` with
`xk = √(C/(C−1))·(b0 + … + b(k−1) − k·bk)/√(k(k+1))`, and `.##%%` is
`Σ xk²`. Each `xk²` is rational, so `.##%%` is exact and equals `.##%`. A
coordinate is exact when it is rational and a double where it has a radical.
Equal magnitudes do not make the products agree: at C = 2, `B = [3, 1]` maps to
`x = [0, 2]`, whose Cayley–Dickson square is −4, while the simplex magnitude is
+4
```
; [(Denum [2, [3, 1]]).###%%, (Denum [2, [3, 1]]).##%%, (Denum [4, [2, 4, 2, 7]]).##%% = (Denum [4, [2, 4, 2, 7]]).##%, ((Denum [4, [2, 4, 2, 7]]).###%%) .3]
# [[0, 2], 4, <>, -13/3]
; [(Denum [3, [1]]).##%%, (Denum [6, [1]]).###%%, (Denum [1, [5]]).###%%]
# [$!.denum-cd-count, $!.denum-cd-count, [0]]
```
The cross-polytope observers, `%%%`, place one load on each vertex of a
cross-polytope, `C = 2n` vertices `+e0 … +e(n−1), −e0 … −e(n−1)`, so `bi` and
`b(i+n)` are opposite. `.###%%%` is the antipodal residual `ri = bi − b(i+n)`
and `.##%%%` is `Σ ri²`, zero exactly when every opposite pair matches. An odd
Count has no such pairing and is `$!.denum-cross-count`; that refuses only this
one-load-per-vertex binding, since a cross-polytope exists in every dimension n
```
; [(Denum [4, [2, 4, 2, 4]]).###%%%, (Denum [4, [2, 4, 2, 4]]).##%%%, (Denum [6, [5, 2, 3, 5, 1, 3]]).###%%%, (Denum [6, [5, 2, 3, 5, 1, 3]]).##%%%, (Denum [2, [3, 1]]).###%%%]
# [[0, 0], 0, [0, 1, 0], 1, [2]]
; [(Denum [3, [1]]).##%%%, (Denum [1, [1]]).###%%%]
# [$!.denum-cross-count, $!.denum-cross-count]
```
Only a Denum is observed, as `.#%` binds only a Denum, and no class can declare
an observer of its own
```
; [[5, 3].##%, 3.###%%, (Denum [0, [1]]).##%%%, (Denum [70000, [1]]).###%, [.##% {7}].##%]
# [$!.denum-binding-receiver, $!.denum-binding-receiver, $!.denum-binding-zero-count, $!.denum-binding-capacity, $!.denum-binding-receiver]
```
Each observer is one token, and the longest spelling is taken. A `%` after
three cannot be split back into an observer and `%%`, so the lexer refuses it.
**Breaking:** `.##%%` and `.###%%` written without a space used to read as
`.##` or `.###` before `%%`; write `.## %%` for the modulo
```
; [[5, 3, 1].## %% 2, [5, 3, 1].### %% 2, (Denum [2, [3, 1]]).##%.#]
# [1, 1, 4]
```
## Importing

Imported, the file binds the same class. The import is an example line, so
the evaluator, which reads this file without a root, never runs it
```
; Denums <- './hc/denum.hc';
; [(Denums.Denum [2, [5, 3]]) = [5, 3].####, “” ((Denums.Denum [0, [0, 0]]) 4)]
# [<>, “Denum(1,[4, 0])”]
