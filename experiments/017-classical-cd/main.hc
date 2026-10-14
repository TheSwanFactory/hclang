#!/usr/bin/env hc
```
017.11 main.hc: the classical lane from w(0) = 0 to the sedenion floor

Composed after cd-core.hc by run.ts. Every line that starts with the string
“record” is one observation for compare.ts; prose prints too and is ignored.
Nothing here reads host output. The lane is the literal Dickson/Schafer
doubling (tag “DS”) applied four times to the real seed w(0) = 0.
```
; .clk0 (('clock:now' | []) .0);
; .clk {(('clock:now' | []) .0) - clk0};
; .V0 [[]];
; .V1 (ext V0);
; .V2 (ext V1);
; .V3 (ext V2);
; .V4 (ext V3);
; [“record”, “enum”, 4, join (V4 & {ptstr _})]
```
The elevator. Each floor is built by the doubling from the floor below it, and
each is checked for 𝒲 membership. Each step compares the doubling with the
closed form Lift(w) ⊕ Pν on every pair, checks every doubling product is one
signed basis element at label A + C, and compares K(CD w) with S(K w) on
every triple of the new floor
```
; .T0 0;
; .T1 (succ [T0, 0, “DS”]);
; .T2 (succ [T1, 1, “DS”]);
; .T3 (succ [T2, 2, “DS”]);
; .T4 (succ [T3, 3, “DS”]);
; [“record”, “clock”, “tables-built”, clk 0]
; floorrec [“DS”, 0, T0, V0]
; floorrec [“DS”, 1, T1, V1]
; floorrec [“DS”, 2, T2, V2]
; floorrec [“DS”, 3, T3, V3]
; floorrec [“DS”, 4, T4, V4]
; steprec [“DS”, 0, T0, T1, V1, “DS”]
; steprec [“DS”, 1, T1, T2, V2, “DS”]
; steprec [“DS”, 2, T2, T3, V3, “DS”]
; steprec [“DS”, 3, T3, T4, V4, “DS”]
; [“record”, “clock”, “steps-checked”, clk 0]
; ktabrec [“DS”, 1, T1, V1]
; ktabrec [“DS”, 2, T2, V2]
; ktabrec [“DS”, 3, T3, V3]
; ktabrec [“DS”, 4, T4, V4]
```
Matched squares on every floor. Positive means K = 0. At 2, 4 and 8 the census
should find none; at 16 every positive square is printed with its four signs
and T02's lower-half data (s′, a, c) and HC's own rank of that triple
```
; sqrec0 [“DS”, 1, T1, V1]
; sqrec0 [“DS”, 2, T2, V2]
; sqrec0 [“DS”, 3, T3, V3]
; .Q4 (allsq V4);
; .P4 (possq [T4, Q4]);
; .U4 (unord P4);
; sqcount [“DS”, 4, T4, Q4, P4]
; P4 & {sqrec [T4, “DS”, _]}
; ldrec [“DS”, T4, Q4, P4, V3]
; [“record”, “clock”, “squares”, clk 0]
```
Two-term search. Every element e_p ± e_q (p < q, e_0 = 1 included) is
multiplied by every other with the floor's own table. At 2, 4 and 8 nothing
should annihilate
```
; ttall [“DS”, 1, T1, V1]
; ttall [“DS”, 2, T2, V2]
; ttall [“DS”, 3, T3, V3]
; [“record”, “clock”, “twoterm-low”, clk 0]
; .X4 (twos V4);
; .AP4 (annpairs [T4, X4]);
; [“record”, “clock”, “annpairs-16”, clk 0]
; .E4 (mkedges AP4);
; .Z4 (zverts [X4, E4]);
; .S4 (supps Z4);
; .SE4 (suppedges [S4, E4]);
; .C4 (comps [S4, SE4]);
; [“record”, “clock”, “graph-16”, clk 0]
; ttrec [“DS”, 4, T4, X4, AP4, E4, Z4, S4, SE4, C4]
```
The sedenion incidence, all computed above: annihilating ordered pairs with
displacement and forced-sign checks, unordered edges, vertex degrees,
supports, support edges, components, edges per unordered positive square, and
three products recomputed term by term
```
; AP4 & {edgerec [T4, “DS”, _]}
; E4 & {[“record”, “edge”, “DS”, xstr (_ .0), xstr (_ .1)]}
; Z4 & {[“record”, “zd-vertex”, “DS”, xstr _, degree [_, E4]]}
; S4 & {[“record”, “support”, “DS”, ptstr (_ .0), ptstr (_ .1), ptstr (disp _)]}
; SE4 & {[“record”, “support-edge”, “DS”, (ptstr (_ .0 .0)) (“:” (ptstr (_ .0 .1))), (ptstr (_ .1 .0)) (“:” (ptstr (_ .1 .1)))]}
; C4 & {comprec [“DS”, _, SE4, V3]}
; U4 & {[“record”, “sq-edges”, “DS”, ptstr (_ .0), ptstr (_ .1), ptstr (_ .2), onsq [_, E4]]}
; [“record”, “edges-off-squares”, “DS”, offsq [E4, U4]]
; witness [T4, “DS”, AP4 .0]
; witness [T4, “DS”, AP4 .1]
; witness [T4, “DS”, AP4 .2]
; [“record”, “clock”, “end”, clk 0]
