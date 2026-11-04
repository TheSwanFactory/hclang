#!/usr/bin/env hc
```
Demi (occurrence/figure 011.20)

A Demi is a closed two-channel state: a phase and two loads, left and right.
Applying a Demi to a Frame deposits that Frame's Size into the active load and
flips the phase, so a Demi follows alternating construction one observation at
a time. It is what the fourth hash answers: `x.####` is the Demi of x's Count,
Size and residual, with left load (Size + residual)/2 and right load
(Size − residual)/2.

`Demi` is an ordinary HC class: a constructor closure answering a fresh
aggregate whose fields are its state and whose methods are the class. Nothing
about it is native. The fourth hash keeps only its derivation and builds its
answer with this constructor, which the evaluator reads from this file, compiled
in, the first time `.####` needs one. So this file is both the definition every
evaluator uses and its specification, and it works without a resource root.
Import it to construct Demis directly: `Demis <- './hc/demi.hc'`, then
`Demis.Demi [2, 0, 0]`.

**State.** `Demi [phase, left, right]` takes three Counts. The phase is the
least positive Count of its parity (011.18g): 2 when even, left next, and 1
when odd, right next. It is a Count rather than all or nil because a field
cannot hold nil, and a Count keeps the odd phase present: a Demi in phase 1 is
a value, unlike the nil `.####` answers for a Frame with no Demi. Anything else
is refused with `$!!.invalid-demi`, a named error, as Figures refuses an
unsupported host. The fields are the whole state, so two Demis are `=` exactly
when their fields are.

**Observers.** A Demi declares its own Count, Size and residual (011.20): its
phase, its total load L+R, and the signed difference L−R. An aggregate
otherwise observes its elements, and a Demi has none, so without these it
would observe as 0, 1, 0. Its fourth hash derives from them like any Frame's,
so `d.####` rebuilds the same Demi.

**Application**, `d x`: observe x's Size once, deposit it into the active load,
flip the phase. A Size of zero still flips. If x has no Size, its failure is
the answer rather than a deposit. It is a mutating method, `apply_`, so
through a name, `d x` is a functional update: it answers a new Demi and leaves
d unchanged, holding exactly the same three fields.

**Scaling**, `d.scale_ k`: multiply both loads by a Count k, keeping the
phase. It is the numerical shadow of Star: `(x * y).####` is
`x.####.scale_ (y.##)` for a nonempty host x. `scale_` stays, as the name the
fourth hash and Star correspondence use; `d * k` now answers the same Demi
through the operator below.

**Arithmetic**, `d + x`, `d - x` and `d * x` (015.11). A class answers an
operator by declaring a method under its name, found on the operand and its
declared parents, the chain its other methods come from, so an operator in a
method body keeps its global meaning rather than recurring into the class that
is running. All three **construct a fresh Demi state** from the one Size
observation `x.##` of their operand, keeping Figure 008's distinction between
construction and observation. They are **fixed-channel load transformations**
on the two-load shadow, consistent with what a `RotorRouter`
(`hc/rotor-router.hc`) does to its channel loads: `+` and `-` add `x.##` to one
fixed channel's load the way a route adds a Frame's Size to the channel it lands
in, and `*` is the Star shadow `scale_`. These are correspondences, not a claim
that the Router declares named `+`, `-` or `*` methods: the Router declares only
`apply_` (alternating route-and-flip), `.#`, `.##` and `.###` (its phase, total
load and signed residual). None of the three Demi operators is application: none
flips the phase, and each answers a fresh value and leaves `d` as it was.

- `d + x` is the **tally** operator: it deposits `x.##` on the **right**,
  `Demi [p, L, R + x.##]`. This is the transformation a route into the router's
  right channel induces on the loads — that channel's load grows by the routed
  Frame's Size — but it targets a fixed channel without flipping the phase,
  rather than invoking the Router's alternating `apply_`. A sizeless host's
  failure is the answer, as it is for application.
- `d - x` is the **alternator** operator: it deposits on the **left**,
  `Demi [p, L + x.##, R]`, the load transformation a route into the left channel
  induces. It is not subtraction: a deposit only ever adds, so a load never goes
  negative and stays a whole Count. Right deposition lowers the signed residual
  `L − R` and left deposition raises it, the reverse of ordinary signed-scalar
  `+` and `-`.
- `d * x` is the **inlay** operator: it scales both loads by the operand's Size
  `x.##`, `Demi [p, sL, sR]` for `s = x.##`, keeping the phase. It reads the
  operand through the one Size observer, as `+` and `-` do, so any sized Frame
  scales a Demi, not only a bare Count. A sizeless host's failure is the answer,
  as it is for application. Because `x.##` is always a nonnegative whole Count
  when present, the loads stay whole Counts and the result is a valid Demi. It
  is literally `d.scale_ (x.##)`: `*` reads the Size, then hands it to `scale_`,
  which is the Star shadow (`(x * y).####` is `x.####.scale_ (y.##)` for a
  nonempty host x) and already takes a Size. Delegating to `scale_` builds the
  fresh Demi by a load-only functional update, never naming the `Demi`
  constructor inside the method, so a unit-taggable operand such as a decimal
  cannot shadow the constructor through the argument scope; `D * 2.5` scales by
  `(2.5).## = 2`.

None of these is sequential application: `d x` deposits in the active channel
and flips the phase, while `+`, `-` and `*` choose a channel explicitly and
keep it. So `+` and `-` reach states a run cannot, a phase-2 Demi with a load
on the odd side, and `*` is the Star shadow, not a repeated deposit.

**Counted state (007.25a).** `Demi` keeps the parity of its applications and
nothing more. `CountedDemi [count, left, right]`, below, is a separate class that
keeps the whole Count beside the loads and reads exact rational ratios from it,
leaving `Demi` and the fourth hash exactly as they are.

**Text.** A Demi prints as what it is, an aggregate of fields and methods, and
that reads back as the same Demi. As text it reads `Demi(<>,12,3)`, with the
phase spelled as the orientation it stands for.

**Methods read their own state through `_^`.** A bare name inside a method is
looked up on the argument first (spec 7), and a Demi is applied to arbitrary
Frames, so a bare `left` could read the argument's field. `_^` is the receiver
from a method's body, and `_^^` from a block one level in, because carets
count lexically (spec a06). What a branch needs is bound as a local at method
level, where nested blocks read it.
```
.Demi {((_ ~ ([].<>)) ? {(__ .#) = 3}) ? {.p (__ .0); .l (__ .1); .r (__ .2);
  ((((p = 2) : {p = 1}) ? {p ~ (0.<>)}) ? {(l ~ (0.<>)) ? {r ~ (0.<>)}}) ? {[
    .phase p;
    .left l;
    .right r;
    .# {_^.phase};
    .## {_^.left + _^.right};
    .### {_^.left - _^.right};
    .apply_ {.s (_ .##); .l (_^ .left); .r (_^ .right);
      (s ~ (0.<>)) ? {((_^^ .phase) = 2) ? {@left (l + s); @phase 1;} : {@right (r + s); @phase 2;}; _^^} : {s}};
    .scale_ {.k _; .l (_^ .left); .r (_^ .right);
      (k ~ (0.<>)) ? {@left (l * k); @right (r * k); _^^} : {$!!.invalid-scale}};
    .+ {.s (_ .##); .p (_^ .phase); .l (_^ .left); .r (_^ .right);
      (s ~ (0.<>)) ? {Demi [p, l, (r + s)]} : {s}};
    .- {.s (_ .##); .p (_^ .phase); .l (_^ .left); .r (_^ .right);
      (s ~ (0.<>)) ? {Demi [p, (l + s), r]} : {s}};
    .* {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .scale_ s)} : {s}};
    .toText {“Demi(” (((_^ .phase) = 2) ? {“<>”} : {“()”}) “,” (_^ .left) “,” (_^ .right) “)”}
  ]} : {$!!.invalid-demi}} : {$!!.invalid-demi}};
```
## Construction

A Demi holds exactly its three fields. Each instance is its own: two built
from the same constructor share nothing
```
; .d (Demi [2, 0, 0]);
; [d.phase, d.left, d.right]
# [2, 0, 0]
; .a (Demi [2, 5, 3]); .b (Demi [1, 7, 0]);
; [“” a, “” b, a.left, b.left]
# [“Demi(<>,5,3)”, “Demi((),7,0)”, 5, 7]
```
Anything but three Counts with phase 1 or 2 is refused
```
; Demi [3, 0, 0]
# $!!.invalid-demi
; [Demi [2, (0 - 1), 0], Demi [2, (5 - 3), 0], Demi [2, 0], Demi 5, Demi [(5 - 3), 0, 0]]
# [$!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi, $!!.invalid-demi]
```
## Application

Each application deposits the argument's Size into the active load and flips
the phase. The receiver is left as it was
```
; “” (d [5, 3])
# “Demi((),8,0)”
; “” d
# “Demi(<>,0,0)”
; “” (((d 5) 3) 7)
# “Demi((),12,3)”
```
A Size of zero deposits nothing and still flips, in both phases
```
; [(d 0).phase, ((d 0) 0).phase, (d 0).left, ((d 0) 0).right]
# [1, 2, 0, 0]
```
Any Frame is applied by its Size, measured without running it: text, the
empty aggregate and all (Size 1 each), nested aggregates, a closure (one per
word, so `{5 + 3}` is 9), empty text, and loads too large for a machine integer
```
; “” ((((((d “hello”) []) <>) [[1, 2], [3]]) {5 + 3}) “”)
# “Demi(<>,15,7)”
; “” ((d 123456789012345678901234567890) 987654321098765432109876543210)
# “Demi(<>,123456789012345678901234567890,987654321098765432109876543210)”
```
A Frame without a Size is not deposited: its failure is the answer
```
; d ([].nope)
# $!.name-missing “...
; “” d
# “Demi(<>,0,0)”
```
Deposit reads the receiver through `_^`, so an argument that holds fields of
the same names deposits by its Size and nothing else
```
; “” (d [.left 50; .phase 1; .s 100; 4])
# “Demi((),4,0)”
```
A Demi captured by a closure, mapped, or reduced is applied the same way, and
the captured one stays as it was
```
; .start (Demi [2, 0, 0]); .step {start _};
; [“” (step 5), “” (step 3), “” start]
# [“Demi((),5,0)”, “Demi((),3,0)”, “Demi(<>,0,0)”]
; [d, a] & {“” (_ 5)}
# [“Demi((),5,0)”, “Demi((),10,3)”]
; “” ([5, 3, 7] | (Demi [2, 0, 0]))
# “Demi((),12,3)”
```
Through a mutable name, application writes the Demi in place
```
; .m_ (Demi [2, 0, 0]);
; m_ 5;
; “” m_
# “Demi((),5,0)”
```
## Observers

A Demi's Count is its phase, its Size the total load and its residual the
signed difference, including a present zero-load Demi in either phase
```
; .e (Demi [1, 12, 3]);
; [e.#, e.##, e.###]
# [1, 15, 9]
; [d.#, d.##, d.###, (Demi [1, 0, 0]).#]
# [2, 0, 0, 1]
```
So its fourth hash is the same Demi, however often it is taken. It is equal,
not identical: each observation builds a new instance
```
; [e.#### = e, e.#### === e, e.#### == e, ((e.####).####).#### = e]
# [<>, (), <>, <>]
; [d.#### = d, (Demi [1, 0, 0]).#### = (Demi [1, 0, 0])]
# [<>, <>]
```
A Demi inside an aggregate contributes its declared Size
```
; [[e, e].##, [e, d].###, [e].#### = (Demi [1, 15, 0])]
# [30, 15, <>]
```
## The fourth hash

`.####` answers an instance of this class, built from the same source, so it
compares equal to one built here
```
; [[5, 3].#### = (Demi [2, 5, 3]), “hello”.#### = (Demi [1, 3, 2]), [0].#### = (Demi [1, 0, 0])]
# [<>, <>, <>]
; “” [5, 3, 7].####
# “Demi((),12,3)”
```
It is nil where there is no Demi: an empty host, Count zero, no Count, or no
residual. Properties are not elements, sharing counts each occurrence, and a
group observes as its elements
```
; [[].####, 0.####, ().####, <2,3,5>.####]
# [(), (), (), ()]
; .shared [1, 2];
; [[.a 100; 5, 3].#### = [5, 3].####, [shared, shared].#### = (Demi [2, 3, 3]), (5, 3).#### = (Demi [2, 5, 3])]
# [<>, <>, <>]
```
## Observing commutes with applying

For a nonempty host X, observing X Y is applying X's Demi to Y, and both equal
the observation of the array X Y constructs
```
; .X [5, “ab”, [1, 2]];
; [(X 7).#### = (X.#### 7), (X 7).#### = [5, “ab”, [1, 2], 7].####, (X {5 + 3}).#### = (X.#### {5 + 3})]
# [<>, <>, <>]
```
The empty host is the boundary. `[].####` is nil, a choice of convention
(011.15g) rather than a theorem, and applying nil answers the argument, so
the equation as written fails there. Lifting the empty host to the zero-load
Demi in phase 2 restores it: that is the initialized-router reading, and it is
also what a reduce starts from
```
; [([] 7).#### = ([].#### 7), ([] 7).#### = ((Demi [2, 0, 0]) 7), ([] 7).#### = ([7] | (Demi [2, 0, 0]))]
# [(), <>, <>]
; [] | (Demi [2, 0, 0]) = (Demi [2, 0, 0])
# <>
```
## Scaling and Star

Scaling multiplies both loads and keeps the phase: zero annihilates, one is
the identity, and scaling composes
```
; [“” (e.scale_ 2), “” (e.scale_ 0), (e.scale_ 1) = e, ((e.scale_ 2).scale_ 3) = (e.scale_ 6)]
# [“Demi((),24,6)”, “Demi((),0,0)”, <>, <>]
; e.scale_ (0 - 2)
# $!!.invalid-scale
```
It is the shadow of Star on a nonempty host
```
; [([5, 3] * 3).#### = ([5, 3].####.scale_ 3), ([[[]], []] * [[], []]).#### = ([[[]], []].####.scale_ ([[], []].##))]
# [<>, <>]
```
## Arithmetic

Three operators act on a Demi's state, each reading its operand through the one
Size observer `x.##`. They are fixed-channel load transformations consistent
with a `RotorRouter`'s channel loads (`hc/rotor-router.hc`), not named Router
methods: the Router declares only `apply_`, `.#`, `.##` and `.###`. `+`, `-`
and `*` **construct a fresh Demi** from observations of their operands: `+` is
tally, depositing `x.##` on the right; `-` is alternator, depositing on the
left; and `*` is inlay, scaling both loads by `x.##` through `scale_`, the Star
shadow. Each keeps the phase, answers a fresh value and leaves its operand as it
was, so they compose by nesting
```
; .D (Demi [2, 5, 3]);
; [“” (D + 4), “” (D - 4), “” (D * 3)]
# [“Demi(<>,5,7)”, “Demi(<>,9,3)”, “Demi(<>,15,9)”]
; [“” ((D + 4) - 2), “” ((D - 2) + 4), “” ((D + 4) * 3)]
# [“Demi(<>,7,7)”, “Demi(<>,7,7)”, “Demi(<>,15,21)”]
; “” D
# “Demi(<>,5,3)”
```
A deposit keeps the phase, including phase 1, where application would flip it,
and a zero Size deposits nothing while still answering a Demi. The operand is
measured by its Size, so any sized Frame deposits
```
; [(D + 4).#, (D - 4).#, (D * 3).#]
# [2, 2, 2]
; .P (Demi [1, 5, 3]);
; [“” (P + 4), (P + 4).#, “” (P - 4)]
# [“Demi((),5,7)”, 1, “Demi((),9,3)”]
; [“” (D + 0), “” (D - 0), “” (D [3, 4])]
# [“Demi(<>,5,3)”, “Demi(<>,5,3)”, “Demi((),12,3)”]
```
Deposit is not application and deposit is not subtraction. `D x` flips the
phase and `D + x` does not, so they reach different states; `D - x` adds to the
left load and never takes from the right, so a load stays a whole Count and the
signed residual only rises
```
; [(D + 4).###, (D - 4).###, D.###]
# [-2, 6, 2]
; [((D 4).# = (D + 4).#), (D 4).###, (D + 4).###]
# [(), 6, -2]
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
`*` scales by the operand's Size, so its domain is every sized Frame: a Demi
contributes `L + R`, an aggregate its element count, a decimal its truncated
magnitude, and a zero Size annihilates both loads. `D * 3` is unchanged, since
`3.## = 3`, and the result keeps the phase in either parity
```
; [“” (D * (Demi [1, 2, 4])), “” (D * [[], []]), “” (D * 2.5), “” (D * 0)]
# [“Demi(<>,30,18)”, “Demi(<>,10,6)”, “Demi(<>,10,6)”, “Demi(<>,0,0)”]
; [“” (D * 1), (D * 3).#, (P * 3).#, “” (P * 3)]
# [“Demi(<>,5,3)”, 2, 1, “Demi((),15,9)”]
```
The signed-scalar reading misleads: `+` lowers the residual and `-` raises it,
so `D + 4` is not “larger” than `D`, and `D - 4` is not `D` made smaller
```
; [(D + 4).### .< D.###, (D - 4).### .> D.###]
# [<>, <>]
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
## Counted Demi (007.25a)

`Demi` keeps only the parity of how many times it was applied, so it cannot
answer a rational reading. `CountedDemi [count, left, right]` keeps that Count
beside the two loads, and derives the phase and two rational readings from it.
It is a **separate class that leaves `Demi` as it was**, for a reason that was
checked rather than assumed: `Demi` equality is fieldwise, and the fourth hash,
`x.####`, rebuilds a Demi from the phase alone. A stored Count inside `Demi`
would make `[5, 3].#### = (Demi [2, 5, 3])`, `(X 7).#### = (X.#### 7)` and the
reduce-from-`Demi [2, 0, 0]` equations unequal, because those states agree in
parity and differ in history. Rather than change those contracts, the counted
state lives beside `Demi` and projects onto it through `.####`.

**State.** `CountedDemi [C, L, R]` takes three Counts, any of them zero. `C` is
the number of applications the state has recorded. Anything else is refused with
`$!!.invalid-counted-demi`. There is **no conversion from a `Demi`**:
`Demi [2, 5, 3]` records only that the count was even, so a `CountedDemi` made
from it would invent history. The caller supplies `C`, and `CountedDemi [0, 0, 0]`
is the honest start.

**Count and phase.** `d.count` is the stored `C`. The phase is the two-state
reading `Demi` has, never the integer `C %% 2`: `2` when `C` is even, `C = 0`
included, and `1` when it is odd. `d.#` is that phase, as for `Demi`, so
`d.####` is the Demi `[phase, L, R]` and the Count is forgotten there. `.#` is
**not** the Count: use `d.count`.

**Application**, `d x`, observes `x.##` once, deposits it into the load the phase
selects (left in phase 2, right in phase 1) and adds one to `C`, so a zero Size
still counts. A sizeless operand answers its own failure. It is a mutating
method, as for `Demi`.

**`+`, `-`, `*` and `scale_`** transform the loads as `Demi`'s do and **keep `C`
unchanged**: they are not applications. They can therefore reach `C = 0` with a
nonzero load, such as `(CountedDemi [0, 0, 0]) + 4`. That is a valid state with
no rational reading.

**Rational readings** are unary observations of the stored state. They take no
divisor and are neither `/` nor `%%`. Because HC runs a method only when it is
applied to something, they are applied to nil, `d.size-ratio ()`; any other
operand is `$!!.unary-observation`, so `d.size-ratio 4` is refused rather than
read as a division by 4.

- `d.size-ratio ()` is `S / C` for `S = L + R`, exact and nonnegative.
- `d.residual-ratio ()` is `Δ / C` for `Δ = L − R`, exact and signed.

Both are nil when `C = 0`, whatever the loads: the state exists and its Size and
residual still read, but the ratio is absent, so there is no `0/0`, infinity or
invented zero. They are different observables and neither replaces Size or
residual; `C`, `S / C` and `Δ / C` together give back `S` and `Δ`. The answer is
the language's exact `/`: a FrameRational when not whole, such as `5/2`, which
the runtime keeps in lowest terms (the improper `6/4` reads `3/2`), and a
FrameInt when whole, since the runtime collapses a whole rational. It is never a
float or an integer quotient and remainder.

**Provenance (007.25).** The Count is a number the caller or the applications
supplied, not a Frame-native witness. That `S / C` and `Δ / C` are useful
readings is arithmetic; it is not a construction of rational geometry.
```
.CountedDemi {((_ ~ ([].<>)) ? {(__ .#) = 3}) ? {.c (__ .0); .l (__ .1); .r (__ .2);
  (((c ~ (0.<>)) ? {l ~ (0.<>)}) ? {r ~ (0.<>)}) ? {[
    .count c;
    .left l;
    .right r;
    .# {.c (_^ .count); ((c %% 2) = 0) ? {2} : {1}};
    .## {_^.left + _^.right};
    .### {_^.left - _^.right};
    .apply_ {.s (_ .##); .c (_^ .count); .l (_^ .left); .r (_^ .right); .p (_^ .#);
      (s ~ (0.<>)) ? {(p = 2) ? {@left (l + s);} : {@right (r + s);}; @count (c + 1); _^^} : {s}};
    .scale_ {.k _; .l (_^ .left); .r (_^ .right);
      (k ~ (0.<>)) ? {@left (l * k); @right (r * k); _^^} : {$!!.invalid-scale}};
    .+ {.s (_ .##); .c (_^ .count); .l (_^ .left); .r (_^ .right);
      (s ~ (0.<>)) ? {CountedDemi [c, l, (r + s)]} : {s}};
    .- {.s (_ .##); .c (_^ .count); .l (_^ .left); .r (_^ .right);
      (s ~ (0.<>)) ? {CountedDemi [c, (l + s), r]} : {s}};
    .* {.s (_ .##);
      (s ~ (0.<>)) ? {(_^^ .scale_ s)} : {s}};
    .size-ratio {.c (_^ .count); .s (_^ .##); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {s / c} : {$!!.unary-observation}}};
    .residual-ratio {.c (_^ .count); .d (_^ .###); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {d / c} : {$!!.unary-observation}}};
    .toText {“CountedDemi(” (_^ .count) “,” (_^ .left) “,” (_^ .right) “)”}
  ]} : {$!!.invalid-counted-demi}} : {$!!.invalid-counted-demi}};
```
## Counted construction

A counted state holds exactly its Count and its two loads, and the empty one is
present in phase 2. Any Counts are a state, a positive Count over empty loads
and nonzero loads over a zero Count included. Anything else is refused
```
; .k0 (CountedDemi [0, 0, 0]);
; [k0.count, k0.left, k0.right, k0.#, k0.##, k0.###, “” k0]
# [0, 0, 0, 2, 0, 0, “CountedDemi(0,0,0)”]
; [“” (CountedDemi [2, 5, 1]), “” (CountedDemi [0, 3, 0]), “” (CountedDemi [3, 0, 0])]
# [“CountedDemi(2,5,1)”, “CountedDemi(0,3,0)”, “CountedDemi(3,0,0)”]
; [CountedDemi [2, (0 - 1), 0], CountedDemi [(0 - 1), 1, 1], CountedDemi [2, 1], CountedDemi 5, CountedDemi [2, 1.5, 0]]
# [$!!.invalid-counted-demi, $!!.invalid-counted-demi, $!!.invalid-counted-demi, $!!.invalid-counted-demi, $!!.invalid-counted-demi]
```
## Count, phase and the fourth hash

The phase is the existing two-state reading of the Count, 2 for even and 1 for
odd, and zero is even. It is not the integer parity. `d.#` is the phase while
`d.count` is the Count
```
; [0, 1, 2, 3, 4, 5] & {(CountedDemi [_, 5, 3]).#}
# [2, 1, 2, 1, 2, 1]
; [(CountedDemi [4, 5, 3]).count, (CountedDemi [4, 5, 3]).#, (CountedDemi [3, 5, 3]).count, (CountedDemi [3, 5, 3]).#]
# [4, 2, 3, 1]
```
The fourth hash is the Demi of the phase and the loads, so the Count is the one
thing it forgets. States that differ only by an even number of applications
share it, though they are not equal as counted states
```
; [(CountedDemi [3, 5, 1]).#### = (Demi [1, 5, 1]), (CountedDemi [4, 5, 1]).#### = (Demi [2, 5, 1]), (CountedDemi [0, 5, 1]).#### = (Demi [2, 5, 1])]
# [<>, <>, <>]
; [(CountedDemi [2, 5, 1]).#### = (CountedDemi [4, 5, 1]).####, (CountedDemi [2, 5, 1]) = (CountedDemi [4, 5, 1]), (CountedDemi [2, 5, 1]) = (CountedDemi [2, 5, 1])]
# [<>, (), <>]
```
## Application counts

Application follows `Demi`. Starting at count 0 in phase 2, or at count 1 in
phase 1, five steps give the same phases, Sizes and residuals as a `Demi`, the
fourth hash of each step is the Demi's, and the Count grows by exactly one per
application
```
; .chain {.s _; [s, (s 5), ((s 5) 3), (((s 5) 3) 7), ((((s 5) 3) 7) 2)]};
; .dc2 (chain (Demi [2, 0, 0])); .kc2 (chain (CountedDemi [0, 0, 0]));
; .dc1 (chain (Demi [1, 0, 0])); .kc1 (chain (CountedDemi [1, 0, 0]));
; [kc2 & {_.count}, kc2 & {_.#}, dc2 & {_.#}, kc2 & {_.##}, kc2 & {_.###}]
# [[0, 1, 2, 3, 4], [2, 1, 2, 1, 2], [2, 1, 2, 1, 2], [0, 5, 8, 15, 17], [0, 5, 2, 9, 7]]
; [kc1 & {_.count}, kc1 & {_.#}, dc1 & {_.#}, kc1 & {_.##}, kc1 & {_.###}]
# [[1, 2, 3, 4, 5], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [0, 5, 8, 15, 17], [0, -5, -2, -9, -7]]
; [(kc2 & {_.####}) = (dc2 & {_.####}), (kc1 & {_.####}) = (dc1 & {_.####}), (dc2 & {_.###}) = (kc2 & {_.###}), (dc1 & {_.###}) = (kc1 & {_.###})]
# [<>, <>, <>, <>]
```
The receiver is left as it was, a Size of zero still counts, and through a
mutable name application writes in place. A sizeless operand is not deposited,
and its failure is the answer
```
; .p0 (CountedDemi [0, 0, 0]);
; [“” (p0 5), “” p0, “” (p0 0), “” ((p0 0) 0), (p0 0).#]
# [“CountedDemi(1,5,0)”, “CountedDemi(0,0,0)”, “CountedDemi(1,0,0)”, “CountedDemi(2,0,0)”, 1]
; p0 ([].nope)
# $!.name-missing “...
; .mm_ (CountedDemi [0, 0, 0]);
; mm_ 5;
; mm_ 3;
; “” mm_
# “CountedDemi(2,5,3)”
```
Deposit reads the receiver through `_^`, so an operand holding fields named
like the state deposits by its Size and nothing else
```
; “” ((CountedDemi [2, 5, 3]) [.count 50; .left 99; .right 7; 4])
# “CountedDemi(3,9,3)”
```
## Loads change without applications

`+`, `-`, `*` and `scale_` keep the Count, as they keep a Demi's phase. They are
not applications, so they may leave a zero Count over nonzero loads
```
; .Q (CountedDemi [2, 5, 3]);
; [“” (Q + 4), “” (Q - 4), “” (Q * 3), “” (Q * 0), “” (Q.scale_ 2), “” Q]
# [“CountedDemi(2,5,7)”, “CountedDemi(2,9,3)”, “CountedDemi(2,15,9)”, “CountedDemi(2,0,0)”, “CountedDemi(2,10,6)”, “CountedDemi(2,5,3)”]
; [(Q + 4).count, (Q - 4).count, (Q * 3).count, (Q + 4).#, (Q 4).count]
# [2, 2, 2, 2, 3]
; [Q + ([].nope), Q - ([].nope), Q * ([].nope), Q.scale_ (0 - 2)]
# [$!.name-missing “..., $!.name-missing “..., $!.name-missing “..., $!!.invalid-scale]
; .Y ((CountedDemi [0, 0, 0]) + 4);
; [“” Y, “” ((CountedDemi [0, 0, 0]) - 4), Y.count, Y.#, Y.##, Y.###]
# [“CountedDemi(0,0,4)”, “CountedDemi(0,4,0)”, 0, 2, 4, -4]
```
## Rational readings

For `C > 0` the Size reading is `S / C` and the residual reading `Δ / C`, two
different observables. With `C = 2`, `L = 5`, `R = 1` they are 3 and 2. With the
loads swapped the Size reading is unchanged and the residual reading changes
sign. With `L = 5`, `R = 0` they are the improper 5/2, neither 2 nor 3
```
; .A (CountedDemi [2, 5, 1]); .B (CountedDemi [2, 1, 5]); .D5 (CountedDemi [2, 5, 0]);
; [[A.##, A.###, A.size-ratio (), A.residual-ratio ()], [B.##, B.###, B.size-ratio (), B.residual-ratio ()], [D5.##, D5.###, D5.size-ratio (), D5.residual-ratio ()]]
# [[6, 4, 3, 2], [6, -4, 3, -2], [5, 5, 5/2, 5/2]]
```
They differ when the loads do. Non-divisible ratios stay exact and the runtime
reduces them: 6/4 reads 3/2, 8/6 reads 4/3. At `C = 1` they are the Size and the
residual, and an odd Count works as an even one does
```
; [(CountedDemi [2, 3, 2]).size-ratio (), (CountedDemi [2, 3, 2]).residual-ratio ()]
# [5/2, 1/2]
; [(CountedDemi [4, 6, 0]).size-ratio (), (CountedDemi [4, 6, 0]).residual-ratio (), (CountedDemi [4, 5, 1]).size-ratio (), (CountedDemi [4, 5, 1]).residual-ratio ()]
# [3/2, 3/2, 3/2, 1]
; [(CountedDemi [6, 10, 2]).size-ratio (), (CountedDemi [6, 10, 2]).residual-ratio (), (CountedDemi [3, 5, 1]).size-ratio (), (CountedDemi [3, 5, 1]).residual-ratio ()]
# [2, 4/3, 2, 4/3]
; [(CountedDemi [1, 7, 2]).size-ratio (), (CountedDemi [1, 7, 2]).residual-ratio (), (CountedDemi [1, 2, 7]).size-ratio (), (CountedDemi [1, 2, 7]).residual-ratio ()]
# [9, 5, 9, -5]
```
The readings are exact: a third stays a third and multiplying back by the Count
returns the Size and the residual, with no float or truncation. A whole reading
is a FrameInt, a non-whole one a FrameRational, and the residual reading is
signed
```
; [(CountedDemi [3, 1, 0]).size-ratio (), (CountedDemi [3, 0, 1]).residual-ratio (), ((CountedDemi [3, 1, 0]).size-ratio ()) * 3]
# [1/3, -1/3, 1]
; [(A.size-ratio ()) * A.count = A.##, (A.residual-ratio ()) * A.count = A.###, (B.residual-ratio ()) * B.count = B.###, (D5.size-ratio ()) * D5.count = D5.##]
# [<>, <>, <>, <>]
; [A.size-ratio () ~ ((0 - 1).<>), D5.size-ratio () ~ ((1 / 2).<>), D5.size-ratio () ~ ((0 - 1).<>), B.residual-ratio () ~ ((0 - 1).<>), A.size-ratio () ~ (0.<>)]
# [<>, <>, (), <>, ()]
```
An empty state, a balanced nonempty one and a positive Count over empty loads all
read zero, in either phase
```
; [(CountedDemi [2, 0, 0]).size-ratio (), (CountedDemi [1, 0, 0]).size-ratio (), (CountedDemi [3, 0, 0]).residual-ratio ()]
# [0, 0, 0]
; [(CountedDemi [2, 3, 3]).size-ratio (), (CountedDemi [2, 3, 3]).residual-ratio (), (CountedDemi [1, 3, 3]).size-ratio (), (CountedDemi [1, 3, 3]).residual-ratio ()]
# [3, 0, 6, 0]
```
Loads too large for a machine integer give the same exact readings
```
; .G (CountedDemi [1000000007, 123456789012345678901234567890, 987654321098765432109876543210]);
; [(G.size-ratio ()) * G.count = G.##, (G.residual-ratio ()) * G.count = G.###, G.###]
# [<>, <>, -864197532086419753208641975320]
```
## Zero Count

At `C = 0` neither ratio is defined, so each is nil. The state is still present,
and its Size and residual still read, including after loads were added without
any application. This is absence, not a zero, a division error or an infinity
```
; .Z0 (CountedDemi [0, 3, 0]); .Z1 (CountedDemi [0, 0, 0]); .Z2 ((CountedDemi [0, 0, 0]) + 4);
; [[Z0.##, Z0.###, Z0.size-ratio (), Z0.residual-ratio ()], [Z1.##, Z1.###, Z1.size-ratio (), Z1.residual-ratio ()], [Z2.##, Z2.###, Z2.size-ratio (), Z2.residual-ratio ()]]
# [[3, 3, (), ()], [0, 0, (), ()], [4, -4, (), ()]]
```
One application gives the first ratio: from the empty state the Count is 1 and
the readings are the Size and the residual
```
; [(Z1 7).count, (Z1 7).size-ratio (), (Z1 7).residual-ratio (), (Z2 3).count, (Z2 3).size-ratio (), (Z2 3).residual-ratio ()]
# [1, 7, 7, 1, 7, -1]
```
## Unary observations

A reading takes no divisor. It is applied to nil, and an operand is refused
rather than read as the divisor, so it is neither `/` nor `%%`. The class
declares neither operator, so they answer nil as for any aggregate without one
```
; [A.size-ratio 4, A.residual-ratio [], A.size-ratio 0, A.residual-ratio “abc”]
# [$!!.unary-observation, $!!.unary-observation, $!!.unary-observation, $!!.unary-observation]
; [A / 4, A %% 4]
# [(), ()]
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
; .statesP (ccs &| {.c _; ls &| {.l _; ls & {CountedDemi [c, l, _]}}});
; .lawP {.k _; .c (k.count); [(((k.size-ratio ()) * c) = k.##), (((k.residual-ratio ()) * c) = k.###)]};
; .checksP (statesP &| lawP);
; [statesP.#, checksP.#, checksP = (checksP & {<>})]
# [125, 250, <>]
; .statesZ (ls &| {.l _; ls & {CountedDemi [0, l, _]}});
; .lawZ {.k _; [(k.size-ratio () = ()), (k.residual-ratio () = ())]};
; .checksZ (statesZ &| lawZ);
; [statesZ.#, checksZ.#, checksZ = (checksZ & {<>})]
# [25, 50, <>]
```
## Against a Router

A `RotorRouter` (`hc/rotor-router.hc`) that routes two children from the empty
state shares its Size and residual with the counted state that applies the same
two Sizes, and its two channels hold two children, the Count. This is a
comparison of readings, not an identity: the router's `.#` is its phase, and a
router that routed four children still answers `.#` 2 while the counted Count is
4
```
; Routers <- './hc/rotor-router.hc';
; .rr (((Routers.RotorRouter [2, [], []]) 5) 1);
; .kk (((CountedDemi [0, 0, 0]) 5) 1);
; [rr.#, rr.##, rr.###, kk.count, kk.#, kk.##, kk.###, (rr.left.# + rr.right.#), rr.#### = kk.####]
# [2, 6, 4, 2, 2, 6, 4, 2, <>]
; .r4 (((rr 7) 2)); .k4 (((kk 7) 2));
; [r4.#, (r4.left.# + r4.right.#), k4.count, k4.#, (k4.size-ratio ()), (k4.residual-ratio ())]
# [2, 4, 4, 2, 15/4, 9/4]
```
## Importing

Imported, the file binds the same class. The import is an example line, so
the evaluator, which reads this file without a root, never runs it
```
; Demis <- './hc/demi.hc';
; [(Demis.Demi [2, 5, 3]) = [5, 3].####, “” ((Demis.Demi [2, 0, 0]) 4)]
# [<>, “Demi((),4,0)”]
