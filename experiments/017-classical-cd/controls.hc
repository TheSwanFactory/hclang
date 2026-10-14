#!/usr/bin/env hc
```
017.11 controls.hc: counterexample, convention, mutation, causal and seed
controls (C1–C5)

Composed after cd-core.hc by run.ts. The classical tables are rebuilt here
from w(0) = 0 so that this file depends on nothing printed by main.hc.
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
; .T3 (succ [T2, 2, “DS”]);
; .T4 (succ [T3, 3, “DS”]);
```
C1, off 𝒲. The zero cochain r = 0 on F2^2 is not in 𝒲(2), since its diagonal
misses ν. Double it literally and compare K(CD r) with S(K r), and the
doubling with the closed form
```
; .Z1 [[0, 0], [0, 0]];
; .Z2 [[Z1, Z1], [Z1, Z1]];
; .R3 (succ [Z2, 2, “DS”]);
; floorrec [“C1-r0”, 2, Z2, V2]
; floorrec [“C1-r0”, 3, R3, V3]
; steprec [“C1-r0”, 2, Z2, R3, V3, “DS”]
; [“record”, “clock”, “C1”, clk 0]
```
C2, the Baez/opposite law, a positive control: its tables should be the
Dickson/Schafer transposes, lawful, with the same curvature
```
; .B1 (succ [0, 0, “B”]);
; .B2 (succ [B1, 1, “B”]);
; .B3 (succ [B2, 2, “B”]);
; .B4 (succ [B3, 3, “B”]);
; floorrec [“B”, 1, B1, V1]
; floorrec [“B”, 2, B2, V2]
; floorrec [“B”, 3, B3, V3]
; floorrec [“B”, 4, B4, V4]
; steprec [“B”, 0, 0, B1, V1, “B”]
; steprec [“B”, 1, B1, B2, V2, “B”]
; steprec [“B”, 2, B2, B3, V3, “B”]
; steprec [“B”, 3, B3, B4, V4, “B”]
; [“record”, “baez-vs-ds”, 1, transdis [B1, T1, V1], kdiff [B1, T1, V1]]
; [“record”, “baez-vs-ds”, 2, transdis [B2, T2, V2], kdiff [B2, T2, V2]]
; [“record”, “baez-vs-ds”, 3, transdis [B3, T3, V3], kdiff [B3, T3, V3]]
; [“record”, “baez-vs-ds”, 4, transdis [B4, T4, V4], kdiff [B4, T4, V4]]
; sqrec0 [“B”, 4, B4, V4]
; [“record”, “clock”, “C2”, clk 0]
```
C3, sign-error mutants of the doubling, applied at every step from w(0) = 0:
“Ma” drops the minus in xz - conj(w) y, “Mb” drops both conjugations
```
; .Ma1 (succ [0, 0, “Ma”]);
; .Ma2 (succ [Ma1, 1, “Ma”]);
; .Ma3 (succ [Ma2, 2, “Ma”]);
; .Ma4 (succ [Ma3, 3, “Ma”]);
; floorrec [“Ma”, 1, Ma1, V1]
; floorrec [“Ma”, 2, Ma2, V2]
; floorrec [“Ma”, 3, Ma3, V3]
; floorrec [“Ma”, 4, Ma4, V4]
; steprec [“Ma”, 0, 0, Ma1, V1, “Ma”]
; steprec [“Ma”, 1, Ma1, Ma2, V2, “Ma”]
; steprec [“Ma”, 2, Ma2, Ma3, V3, “Ma”]
; steprec [“Ma”, 3, Ma3, Ma4, V4, “Ma”]
; .Mb1 (succ [0, 0, “Mb”]);
; .Mb2 (succ [Mb1, 1, “Mb”]);
; .Mb3 (succ [Mb2, 2, “Mb”]);
; .Mb4 (succ [Mb3, 3, “Mb”]);
; floorrec [“Mb”, 1, Mb1, V1]
; floorrec [“Mb”, 2, Mb2, V2]
; floorrec [“Mb”, 3, Mb3, V3]
; floorrec [“Mb”, 4, Mb4, V4]
; steprec [“Mb”, 0, 0, Mb1, V1, “Mb”]
; steprec [“Mb”, 1, Mb1, Mb2, V2, “Mb”]
; steprec [“Mb”, 2, Mb2, Mb3, V3, “Mb”]
; steprec [“Mb”, 3, Mb3, Mb4, V4, “Mb”]
; [“record”, “clock”, “C3”, clk 0]
```
C4, causal poke. Flip w(3) at the one pair (a, c) = (011, 101), which leaves
𝒲(3), and double it with the unchanged successor. Every changed floor-4 entry
is listed
```
; .Pa (pick [V3, “011”]);
; .Pc (pick [V3, “101”]);
; .X3 (poke [T3, 3, Pa, Pc]);
; .X4 (succ [X3, 3, “DS”]);
; floorrec [“C4-poke”, 3, X3, V3]
; floorrec [“C4-poke”, 4, X4, V4]
; .XD (tabdiff [T4, X4, V4]);
; [“record”, “poke-diff”, “C4-poke”, cnt (XD & {1}), join XD]
; [“record”, “clock”, “C4”, clk 0]
```
C5, a second lawful seed. w(2)′ = w(2) ⊕ f, where f is 1 exactly on the pairs
(01, 10) and (10, 01): symmetric with zero diagonal, so w(2)′ stays in 𝒲(2).
Double it twice and run the same checks and searches as the classical lane
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
; ttall [“C5-alt”, 4, A4, V4]
; [“record”, “clock”, “end”, clk 0]
