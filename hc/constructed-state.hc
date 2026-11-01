#!/usr/bin/env hc
```
Demi constructed physical state: VACT witness and scope (Explore 022.06)

Implements the corrected handoff in occurrence/explore 022.05a, pinned at
9d966bd95a783849c0363d82ee295586e0ffc6db581815b443140d746843eec8:
https://nightly.quilttest.com/b/protology/packages/occurrence/explore/tree/9d966bd95a783849c0363d82ee295586e0ffc6db581815b443140d746843eec8/issues/022-constructed-physical-state/022.05a-Hilary-VACT-correction-constructive-physical-state.md

Construction -> specified observation -> vacted fact -> interpretation.
Run from the repository root: `deno task hc hc/constructed-state.hc -t`.
The assertions below are the reproducible software witness. They do not report
an executed laboratory experiment. Importing this testdoc exports no new state
class or observer: it uses native arrays, application (one-child append), Star
(terminal Inlay), and the existing fourth hash.

Uniform construction and exact observation contract

Begin with the empty host E = []. For any already constructed finite hosts X
and Y, construct X Y by appending Y as one immediate child, or X * Y by
replacing each empty terminal of X with Y. Repetition of this recipe constructs
arbitrary finite nested arrays: build each child, then append each to []. Shared
children are permitted and contribute at every occurrence. There are no infinite
Frames here. Ordinary properties may decorate nonterminal nodes; this observer
ignores them. Inlay requires unadorned empty terminals: native Star refuses
a metadata-only empty host, as checked below. Append/observation can still
read such a host; it is outside the closed Inlay construction family. No declared hash methods, declared parents, cycles, or arbitrary
property-editing operations are in the uniform contract. This is a domain for
this construction/observation experiment, not a special ontology of pure Figures.
Other finite Frames can have Demi readings; their constructor laws require their
own domain checks. In particular, mixed-array append is illustrated below but
mixed-array Star is outside this contract.

For each host read Count n = X.#, Size S = X.##, and alternating residual
A = X.###. An empty terminal has Size 1. A nonempty host has Size equal to
the sum of its immediate child Sizes, and A alternates + and - across those
children, starting +. Properties do not enter these sums. D(X) = X.#### is
nil for the empty host; otherwise it has loads L = (S+A)/2, R = (S-A)/2 and
phase p = 2 for even n (left next), 1 for odd n (right next). Read these with
`.left`, `.right`, `.phase`. n is forgotten except for parity. Nesting,
identities, properties and the distribution within each load are forgotten.
```
; .E []; .X [[], [[], []], []];
; [E.#, E.##, E.###, E.####]
# [0, 1, 0, ()]
; [X.#, X.##, X.###, X.####.phase, X.####.left, X.####.right]
# [3, 4, 0, 1, 2, 2]
; .decorated [.label 99; [], [[], []], []];
; [decorated.#### = X.####, decorated.label, X.#### = X.####]
# [<>, 99, <>]
; [(decorated * [[], []]).#### = (X * [[], []]).####, [.label 99;] * [[]]]
# [<>, $!.star-metadata *]
; .shared [[], []];
; [shared, shared].#### = [[[], []], [[], []]].####
# <>
```
Generation and selective compression

No Demi is initialized when building X. The native reading derives from the
constructed host. Equal readings can hide different nesting and even different
Counts, while another construction gives a different reading.
```
; .A [[]]; .B [[[]]];
; [A = B, A.#### = B.####, A.#### === B.####]
# [(), <>, ()]
; .C [[[], []], [[], []]]; .F [[], [], [], []];
; [C.#, F.#, C = F, C.#### = F.####, A.#### = C.####]
# [2, 4, (), <>, ()]
; [“” A.####, “” C.####, “” [[], [[], []]].####]
# [“Demi((),1,0)”, “Demi(<>,2,2)”, “Demi(<>,1,2)”]
```
Uniform append and Inlay, including successive compositions

For any nonempty X in the contract, appending Y deposits Y.## into the active
load and flips phase. This is precisely how native append adds one term to
the Size sum and the alternating sum: (X Y).#### = (X.#### Y).
It works for either parity, independent of the shape or size of Y.
```
; .Y [[], [], []];
; [(A Y).#### = (A.#### Y), (C Y).#### = (C.#### Y), (X Y).#### = (X.#### Y)]
# [<>, <>, <>]
; [“” (A Y).####, “” (C Y).####, “” ((C Y) []).####]
# [“Demi(<>,1,3)”, “Demi((),5,2)”, “Demi(<>,5,3)”]
; ([5, “ab”] []).#### = ([5, “ab”].#### [])
# <>
```
Inlay replaces every terminal with Y. Each immediate child's Size is multiplied
by Y.##, so both alternating loads scale by that same quantity. A nonempty
host retains its immediate Count and phase. Thus for every such X and Y,
(X * Y).#### = X.####.scale_ (Y.##). For empty X, [] * Y is Y itself:
the empty case is substitution, not scaling a missing state.
These are uniform recipes for every finite input in the contract. Enumerating
tests cannot establish their scope: the shared child-Size traversal and the
specified append/substitution operations explain why the readings commute.
```
; [(A * Y).#### = (A.####.scale_ (Y.##)), (C * Y).#### = (C.####.scale_ (Y.##)), (X * Y).#### = (X.####.scale_ (Y.##))]
# [<>, <>, <>]
; [([] * Y) = Y, ([] * []).####, (X * []).#### = X.####]
# [<>, (), <>]
; (((C Y) * [[], []]) []).#### = (((C.#### Y).scale_ 2) [])
# <>
```
Origin and channel names

The empty host has no Demi, despite Size 1. Its first append generates a
present reading. Applying nil is not the append update; a zero-load phase-2
Demi is an explicit initialized-router convention, not a preconstruction state
secretly stored in []. A zero Size deposit still changes routing phase.
```
; [([] []).####.phase, ([] []).####.left, ([] []).####.right]
# [1, 1, 0]
; [([] Y).#### = ([].#### Y), ([] * Y).#### = Y.####]
# [(), <>]
; Demis <- './hc/demi.hc';
; ([] Y).#### = ((Demis.Demi [2, 0, 0]) Y)
# <>
; [“” [0].####, “” ([0].#### 0), [].#### = [0].####]
# [“Demi((),0,0)”, “Demi(<>,0,0)”, ()]
```
For a proposed relabeling, exchange the loads AND toggle which named channel
is next: J(p,L,R) = (3-p,R,L). Total load stays fixed and residual changes
sign. J commutes with deposit and scale; this is equivariance of a named
router representation, not invariance of its signed readout, not reversal of
the host, and not a new native constructor. The following closure only checks
that explicit relabeling using the existing Demi class.
```
; .swap {.d _; Demis.Demi [(d.phase = 2) ? {1} : {2}, d.right, d.left]};
; .q [[], [[], []]].####;
; [“” q, “” (swap q), (swap q).## = q.##, (swap q).### = (0 - q.###)]
# [“Demi(<>,1,2)”, “Demi((),2,1)”, <>, <>]
; [(swap (q Y)) = ((swap q) Y), (swap ((q Y) [])) = (((swap q) Y) []), (swap (q.scale_ 3)) = ((swap q).scale_ 3), (swap (swap q)) = q]
# [<>, <>, <>, <>]
```
Future sufficiency, at its earned scope

For equal nonempty D readings, equal loads imply equal total Size and equal
phase. The append recipe uses only those fields and the appended Size; the
Inlay recipe uses only those fields and the replacement Size. Consequently
any finite sequence of the SAME right-append and right-Inlay constructions
preserves D equality. If both starting hosts are empty, they are the same
empty construction and the empty rules apply. A nonempty host in the primary
domain has positive total load, so it cannot collide with the nil empty reading.
One may also use equivalent hosts as common right operands, since Size agrees;
the empty case must be treated separately (its Size is 1, not zero).
This is a uniform construction/observer relationship, not a claim that every
HC observer or arbitrary operation factors through D. Count already separates
C and F; inspecting stored metadata can separate decorated and undecorated X.
```
; [((A Y) * Y).#### = ((B Y) * Y).####, (((C []) * Y) A).#### = (((F []) * Y) A).####]
# [<>, <>]
; [C.#### = F.####, C.# = F.#, decorated.#### = X.####, decorated = X]
# [<>, (), <>, ()]
```
Physically realizable readout (proposed material apparatus)

Use a finite tray tree with one unit stick for each empty terminal. To read a
nonempty host, count the sticks in each immediate child tray, deposit that many
unit marks in alternating left and right bins, and toggle a two-position pointer
after EACH child. Start left. Read bin populations as L,R and the next-bin
pointer as phase 2 or 1. Read n by counting immediate trays, S by counting all
terminal sticks, and A by subtracting the bin populations. No separately
supplied state vector or stochastic routing law is needed. The empty host's
one terminal stick is not an immediate child deposit: report no Demi until
construction places a first child. A physical pointer's initial left choice
is part of this selected measurement convention.

Append is placing a child tray and routing its counted terminal sticks into
the next bin. Inlay is replacing EACH terminal stick with a copy of Y's tray
tree, preserving its immediate ancestor's bin assignment. Replace each old
bin mark with Y.## marks; retain the pointer. Do not route all replacement
sticks globally one at a time: that would implement a different phase rule.
For empty-host Inlay, replace the entire empty terminal and reread Y afresh.
This finite procedure realizes the same counts and compositions without
assuming the mathematical update equations as measurements. Recount the tray
leaves and compare with the bins after each act; the numerical examples above
supply a reproducible readout script (C starts 2,2,left; append Y gives
5,2,right; append [] gives 5,3,left).

Finite resources bound any performed run. Stick loss, misrouting, unequal
units, shared subtrees mistaken for single occurrences, and changing declared
observers are possible failures of the realization. The software models exact
counts and occurrence copies; it measures no material noise or physical law.

Five-criterion verdict and evidence scope

1. Derived: VACTED by execution for the examples; uniformly vacted under the
   construction/observer contract. Hosts are built before their Demi is read.
2. Compressive: VACTED by distinct equal-reading constructions. Representation
   has two unbounded Counts plus parity; fixed dimension is not bounded bits.
3. Forced update: VACTED by execution for the displayed compositions; uniformly
   vacted by the append and substitution recipes on the declared domain.
4. Origin: VACTED for no supplied host Demi and the first-construction boundary.
   Channel relabeling is CONDITIONALLY VACTED as the explicit router
   equivariance above. Full origin/gauge invariance is NOT YET VACTED.
5. Earned forgetting: uniformly vacted for the specified future constructor
   language and D observations, with executable witnesses. Sufficiency for all
   other HC observations is false, as the Count counterexample demonstrates.

Actual apparatus executed here: the HC interpreter and testdoc harness, using
native Frame construction and .####. The command's per-claim output and final
pass/fail totals are the run evidence; the PR records the runtime and results.
The material stick/bin apparatus is ONLY PROPOSED AS PHYSICALLY REALIZABLE;
performed laboratory execution is NOT YET VACTED. The existential physical
interpretation is CONDITIONALLY VACTED on that explicit realization. This
claims neither uniqueness nor the physics of our universe. Supplementary
update equations explain the observation; they are not a theorem-first gate.
```
[] = []
