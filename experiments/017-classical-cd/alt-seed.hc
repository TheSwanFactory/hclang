#!/usr/bin/env hc
```
017.11 alt-seed.hc: the anti-hard-coding control C5, a second lawful seed

Composed after cd-core.hc by run.ts. The classical w(2) is rebuilt here
from w(0) = 0 so that this file depends on nothing printed by main.hc. C5
runs in its own process: inside controls.hc its sedenion two-term search
exhausted a 30 GB V8 heap, so here the floor-16 search stops before the
support graph (ttpart).
```
; .clk0 (('clock:now' | []) .0);
; .clk {(('clock:now' | []) .0) - clk0};
; .V0 [[]];
; .V1 (ext V0);
; .V2 (ext V1);
; .V3 (ext V2);
; .V4 (ext V3);
; .T1 (succ [0, 0, “DS”]);
; .T2 (succ [T1, 1, “DS”]);
```
C5, a second lawful seed. w(2)′ = w(2) ⊕ f, where f is 1 exactly on the pairs
(01, 10) and (10, 01): symmetric with zero diagonal, so w(2)′ stays in 𝒲(2).
Double it twice and run the classical lane's checks and searches; at 16 the
two-term search stops before the support graph
```
; .Q1 (pick [V2, “01”]);
; .Q2 (pick [V2, “10”]);
; .A2 (poke [(poke [T2, 2, Q1, Q2]), 2, Q2, Q1]);
; .A3 (succ [A2, 2, “DS”]);
; .A4 (succ [A3, 3, “DS”]);
; floorrec [“C5-alt”, 2, A2, V2]
; floorrec [“C5-alt”, 3, A3, V3]
; floorrec [“C5-alt”, 4, A4, V4]
; steprec [“C5-alt”, 2, A2, A3, V3, “DS”]
; steprec [“C5-alt”, 3, A3, A4, V4, “DS”]
; sqrec0 [“C5-alt”, 3, A3, V3]
; sqrec0 [“C5-alt”, 4, A4, V4]
; ttall [“C5-alt”, 3, A3, V3]
; [“record”, “clock”, “C5-low”, clk 0]
; ttpart [“C5-alt”, 4, A4, V4]
; [“record”, “clock”, “end”, clk 0]
