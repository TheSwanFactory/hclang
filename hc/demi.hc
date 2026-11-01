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
is refused with `invalid-demi`, a missing name, as Figures refuses an
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
`x.####.scale_ (y.##)` for a nonempty host x. Scaling is a method because a
class cannot declare an operator, so `d * k` is ordinary Star, which refuses
an aggregate with properties.

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
.Demi {.p (_ .0); .l (_ .1); .r (_ .2);
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
      (k ~ (0.<>)) ? {@left (l * k); @right (r * k); _^^} : {invalid-scale}};
    .toText {“Demi(” (((_^ .phase) = 2) ? {“<>”} : {“()”}) “,” (_^ .left) “,” (_^ .right) “)”}
  ]} : {invalid-demi}};
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
# $!.name-missing “$:Frame.0.invalid-demi”;
; [Demi [2, (0 - 1), 0], Demi [2, (5 - 3), 0], Demi [2, 0], Demi 5, Demi [(5 - 3), 0, 0]]
# [$!.name-missing “$:Frame.0.invalid-demi”;, $!.name-missing “$:Frame.0.invalid-demi”;, $!.name-missing “$:Frame.0.invalid-demi”;, $!.name-missing “$:Frame.0.invalid-demi”;, $!.name-missing “$:Frame.0.invalid-demi”;]
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
# $!.name-missing “$:Frame.0.invalid-scale”;
```
It is the shadow of Star on a nonempty host
```
; [([5, 3] * 3).#### = ([5, 3].####.scale_ 3), ([[[]], []] * [[], []]).#### = ([[[]], []].####.scale_ ([[], []].##))]
# [<>, <>]
```
No operator is overloaded: `+` is ordinary addition, which a Demi is not a
number for, and `*` is ordinary Star, which refuses an aggregate with fields
```
; [e + 3, e * 3]
# [(), $!.star-metadata *]
```
## A precise regression: a load read at the wrong depth

Carets count lexically, so inside a branch `_^` is the method's own scope, not
the receiver. Reading a load there fails, `$!.name-missing`. Before 011.20,
`+` turned that failure into nil, and writing nil leaves a field as it was, so
the deposit silently did nothing while the phase still flipped. Now the
failure reaches the field, where it shows
```
; .Wrong {[.phase 2; .left 0; .apply_ {.s (_ .##); (_^.phase = 2) ? {@left (_^.left + s); @phase 1;};}]};
; .w ((Wrong ()) 5);
; [w.phase, w.left]
# [1, $!.name-missing “...
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
