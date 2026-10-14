#!/usr/bin/env hc
```
017.11 closure-probe.hc (C6): the same doubling written as a closure factory

A runtime probe, not part of the lane. Mk captures the lower floor as a
function and answers the upper floor as a function. The four sheet blocks it
uses are the ones the doubling in cd-core.hc yields for Dickson/Schafer
(first factor sheet α, second factor sheet γ):
α = 0, γ = 0: w(a, c);  α = 0, γ = 1: w(c, a);
α = 1, γ = 0: w(a, c) ⊕ ν(c);  α = 1, γ = 1: 1 ⊕ ν(c) ⊕ w(c, a).
Each floor's table is printed in the same format as main.hc, so the comparator
can count disagreements with the data route. 017.09 found this pattern wrong
at its second level (pitfall P5); a disagreement here is an observation about
the runtime, not a failure of the lane.
```
; .V0 [[]];
; .V1 (ext V0);
; .V2 (ext V1);
; .V3 (ext V2);
; .V4 (ext V3);
; .Mk {.lower _; {.ck_A (_ .0); .ck_C (_ .1); .ck_a (ck_A .0); .ck_al (ck_A .1); .ck_c (ck_C .0); .ck_ga (ck_C .1); (ck_al = 0) ? {(ck_ga = 0) ? {lower [ck_a, ck_c]} : {lower [ck_c, ck_a]}} : {(ck_ga = 0) ? {xor [lower [ck_a, ck_c], nu ck_c]} : {xor3 [1, nu ck_c, lower [ck_c, ck_a]]}}}};
; .L0 {0};
; .L1 (Mk L0);
; .L2 (Mk L1);
; .L3 (Mk L2);
; .L4 (Mk L3);
; [“record”, “closure-table”, “Mk”, 1, (V1 & {.c1_a _; (V1 & {L1 [c1_a, _]}) | “”}) | “”]
; [“record”, “closure-table”, “Mk”, 2, (V2 & {.c2_a _; (V2 & {L2 [c2_a, _]}) | “”}) | “”]
; [“record”, “closure-table”, “Mk”, 3, (V3 & {.c3_a _; (V3 & {L3 [c3_a, _]}) | “”}) | “”]
; [“record”, “closure-table”, “Mk”, 4, (V4 & {.c4_a _; (V4 & {L4 [c4_a, _]}) | “”}) | “”]
```
MkN is the same factory, but the lower floor receives an argument frame bound
to a name in the closure's own scope (017.09 pitfall P6 resolves free names
through such a binding)
```
; .MkN {.lower _; {.cn_A (_ .0); .cn_C (_ .1); .cn_a (cn_A .0); .cn_al (cn_A .1); .cn_c (cn_C .0); .cn_ga (cn_C .1); .cn_ac [cn_a, cn_c]; .cn_ca [cn_c, cn_a]; (cn_al = 0) ? {(cn_ga = 0) ? {lower cn_ac} : {lower cn_ca}} : {(cn_ga = 0) ? {xor [lower cn_ac, nu cn_c]} : {xor3 [1, nu cn_c, lower cn_ca]}}}};
; .N0 {0};
; .N1 (MkN N0);
; .N2 (MkN N1);
; .N3 (MkN N2);
; .N4 (MkN N3);
; [“record”, “closure-table”, “MkN”, 1, (V1 & {.d1_a _; (V1 & {N1 [d1_a, _]}) | “”}) | “”]
; [“record”, “closure-table”, “MkN”, 2, (V2 & {.d2_a _; (V2 & {N2 [d2_a, _]}) | “”}) | “”]
; [“record”, “closure-table”, “MkN”, 3, (V3 & {.d3_a _; (V3 & {N3 [d3_a, _]}) | “”}) | “”]
; [“record”, “closure-table”, “MkN”, 4, (V4 & {.d4_a _; (V4 & {N4 [d4_a, _]}) | “”}) | “”]
```
The 017.09 P5 shape, verbatim apart from names: the inner closure passes its
own argument frame straight to the captured lower function. Depth counts the
nested “level” wrappers; a correct runtime answers 1, 2 and 3
```
; .Pk {.plow _; {[“level”, plow _]}};
; .P0 {“base”};
; .P1 (Pk P0);
; .P2 (Pk P1);
; .P3 (Pk P2);
; .pdepth {.pq_v _; (pq_v = “base”) ? {0} : {(pdepth (pq_v .1)) + 1}};
; [“record”, “p5-depth”, pdepth (P1 7), pdepth (P2 7), pdepth (P3 7)]
