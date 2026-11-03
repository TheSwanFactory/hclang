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

**Arithmetic**, `d + x`, `d - x`, `d * x` and `d / x` (015.02). A class answers
an operator by declaring a method under its name, found on the operand and its
declared parents, the chain its other methods come from, so an operator in a
method body keeps its global meaning rather than recurring into the class that
is running. `+`, `-` and `*` **construct a fresh Demi state** from Size and
Count observations of their operands, keeping Figure 008's distinction between
construction and observation; `/` is the one that answers a Spin observation, a
number rather than a Demi. None of the four is application: none flips the
phase, and each answers a fresh value and leaves `d` as it was.

- `d + x` deposits `x.##` on the **right**: `Demi [p, L, R + x.##]`. A sizeless
  host's failure is the answer, as it is for application.
- `d - x` deposits on the **left**: `Demi [p, L + x.##, R]`. It is not
  subtraction: a deposit only ever adds, so a load never goes negative and
  stays a whole Count. Right deposition lowers the signed residual `L − R` and
  left deposition raises it, the reverse of ordinary signed-scalar `+` and `-`.
- `d * x` scales both loads by the operand's Size `x.##`, `Demi [p, sL, sR]`
  for `s = x.##`, keeping the phase. It reads the operand through the one Size
  observer, as `+` and `-` do, so any sized Frame scales a Demi, not only a
  bare Count. A sizeless host's failure is the answer, as it is for application.
  Because `x.##` is always a nonnegative whole Count when present, the loads
  stay whole Counts and the result is a valid Demi. It is literally
  `d.scale_ (x.##)`: `*` reads the Size, then hands it to `scale_`, which is the
  Star shadow (`(x * y).####` is `x.####.scale_ (y.##)` for a nonempty host x)
  and already takes a Size. Delegating to `scale_` builds the fresh Demi by a
  load-only functional update, never naming the `Demi` constructor inside the
  method, so a unit-taggable operand such as a decimal cannot shadow the
  constructor through the argument scope; `D * 2.5` scales by `(2.5).## = 2`.
- `d / x` observes Spin, the signed residual over the operand's Size `x.##`,
  `(L − R) / s` for `s = x.##`. It reads the operand through the one Size
  observer, as `+`, `-` and `*` do, so any sized Frame is a divisor, not only a
  bare Count. It answers a number, not a Demi, and keeps Spin's meaning exactly:
  the ratio is signed and **unwrapped**, with no modulo or phase wrapping, so a
  negative residual stays negative. The only change is the divisor domain. A
  positive Size divides; a zero Size is `$!.division-by-zero`, since Spin needs
  a strictly positive period; and a sizeless operand's failure is the answer, as
  it is for application. Because `x.##` is a nonnegative whole Count when
  present, its sign is never the issue: `D / (0 - 4)` divides by the Size `4`,
  not by `-4`.

None of these is sequential application: `d x` deposits in the active channel
and flips the phase, while `+`, `-` and `*` choose a channel explicitly and
keep it. So `+` and `-` reach states a run cannot, a phase-2 Demi with a load
on the odd side, and `*` is the Star shadow, not a repeated deposit.

**Compatibility (015.09a).** All four operators now read their operand through
the one Size observer `x.##`, the symmetry `+` and `-` already had. Two domains
widen, and no currently-succeeding call changes result.

`*` once required a bare Count and refused any other operand with
`$!!.invalid-scale`; its operand domain is now **widened** to any sized Frame.
`D * 3` is unchanged, because `3.## = 3`; a formerly refused operand such as
another Demi, an aggregate, or a decimal now scales by its Size (`D * 2.5`
scales by `2`, since `(2.5).## = 2`); and a sizeless operand propagates its own
failure rather than refusing with `$!!.invalid-scale`. `scale_` is unchanged and
still takes a Count directly; `*` now equals `d.scale_ (x.##)` for every sized
`x`.

`/` once took a typed, strictly positive Count divisor directly, refusing a
non-Count or a negative with a type error; its operand domain is now **widened**
to any sized Frame, divided by its Size `x.##`. The **Spin meaning is unchanged**
— the ratio is still signed and unwrapped, with no modulo or new phase — only
the divisor domain changes. `D / 2`, `D / 4` and a negative-residual Spin are
all unchanged, because `2.## = 2` and `4.## = 4`; a formerly refused operand
divides by its Size (`D / 2.5` divides by `2`; `D / (0 - 4)` divides by `4`, so
it no longer refuses a negative numeric operand); and a zero Size is still
`$!.division-by-zero`, so `D / 0` fails as before. A sizeless operand propagates
its own failure, as the other three do.

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
    ./ {.s (_ .##); .signed (_^ .###);
      (s ~ (0.<>)) ? {(s .< 1) ? {signed / 0} : {signed / s}} : {s}};
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

Four operators act on a Demi's state, each reading its operand through the one
Size observer `x.##`. `+`, `-` and `*` **construct a fresh Demi** from
observations of their operands: `+` deposits `x.##` on the right and `-` on the
left, each keeping the phase, and `*` scales both loads by `x.##`. `/` is the
one observation among them: it observes Spin, the signed residual over the
operand's Size `x.##`, and answers a number, not a Demi. Each answers a fresh
value and leaves its operand as it was, so they compose by nesting
```
; .D (Demi [2, 5, 3]);
; [“” (D + 4), “” (D - 4), “” (D * 3)]
# [“Demi(<>,5,7)”, “Demi(<>,9,3)”, “Demi(<>,15,9)”]
; [(D / 2), ((D + 4) / 2)]
# [1, -1]
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
A sizeless host refuses on all four operators, its failure the answer, as
application refuses it. `*` and `/` now read their operand's Size rather than
demanding a bare Count, so a Demi, an aggregate or a decimal works through its
`.##`, while `D * 0` still annihilates and a zero Size still divides by zero
```
; [D + ([].nope), D - ([].nope), D * ([].nope), D / ([].nope)]
# [$!.name-missing “..., $!.name-missing “..., $!.name-missing “..., $!.name-missing “...]
; [D / 0, (Demi [2, 4, 4]) / 0]
# [$!.division-by-zero /, $!.division-by-zero /]
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
`/` divides the signed residual by the operand's Size, so its domain is every
sized Frame too, and the Spin stays signed and unwrapped. `D / 2` and `D / 4`
are unchanged, since `2.## = 2` and `4.## = 4`; a Demi divisor contributes
`L + R` (`E.## = 6`), an aggregate its element count, and a decimal its
truncated magnitude (`(2.5).## = 2`). A negative numeric divisor is no longer
refused: it divides by its Size, `(0 - 4).## = 4`
```
; .Dp (Demi [2, 3, 5]); .E (Demi [1, 2, 4]);
; [(D / E), (D / [[], []]), (D / 2.5), (Dp / E)]
# [1/3, 1, 1, -1/3]
; [(D / 2), (D / 4), (Dp / 2), (D / (0 - 4))]
# [1, 1/2, -1, 1/2]
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
## Importing

Imported, the file binds the same class. The import is an example line, so
the evaluator, which reads this file without a root, never runs it
```
; Demis <- './hc/demi.hc';
; [(Demis.Demi [2, 5, 3]) = [5, 3].####, “” ((Demis.Demi [2, 0, 0]) 4)]
# [<>, “Demi((),4,0)”]
