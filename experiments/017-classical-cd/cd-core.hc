#!/usr/bin/env hc
```
017.11 cd-core.hc: the classical Cayley–Dickson lane, definitions only

This file defines; it prints nothing but its prose. run.ts composes it with one
variant file (main.hc, controls.hc or closure-probe.hc) into the exact source
that executes, so every definition below is shared by every variant.

Convention (frozen, Dickson/Schafer). V(d) is F2^d. A point of V(d+1) is the
nested pair [a, α]: `.0` is the lower point a in V(d) and `.1` is the newest
sheet bit α, the most significant one, so [a, α] carries the label a + α·2^d.
V(0) holds the single point []. The basis law is e_a e_c = (-1)^w(a, c) e_(a+c),
and the doubling is (x + yℓ)(z + wℓ) = (xz - conj(w) y) + (w x + y conj(z)) ℓ
with conj(e_b) = (-1)^ν(b) e_b, ν(b) = [b ≠ 0].

Representation. A bit is the HC integer 0 or 1 and is compared only with `=`.
A sign table w(d) is a lookup tree: w(0) is the bit 0 and a floor-(d+1) tree is
[[B00, B01], [B10, B11]], where Bαγ is the floor-d tree of the block whose
first factor has sheet bit α and second factor sheet bit γ. Floors are data,
never closures. A signed monomial is [nz, sign, point]: nz is 1 for ±e_point
and 0 for the zero monomial; nz 9 marks a product that is not a single signed
basis element, which the checks count.

Integers + - * appear only in coefficient sums of two-term products and in
counting. No count this lane is expected to reach appears in any HC source.
```
```
F2 helpers. Parity is a form comparison. Over F2, a, c, s have rank three
exactly when all are nonzero, a and c differ, and s is none of a, c, a + c
```
; .xor {.x_u _; ((x_u .0) = (x_u .1)) ? {0} : {1}};
; .xor3 {.x3_u _; xor [xor [(x3_u .0), (x3_u .1)], (x3_u .2)]};
; .and {.an_u _; ((an_u .0) = 1) ? {an_u .1} : {0}};
; .b2i {_ ? {1} : {0}};
; .vxor {.v_u _; ((v_u .0) = []) ? {[]} : {[vxor [(v_u .0 .0), (v_u .1 .0)], xor [(v_u .0 .1), (v_u .1 .1)]]}};
; .isz {.z_v _; (z_v = []) ? {1} : {((z_v .1) = 0) ? {isz (z_v .0)} : {0}}};
; .nu {.nu_v _; xor [1, isz nu_v]};
; .dnu {.dn_u _; xor3 [nu (dn_u .0), nu (dn_u .1), nu (vxor [(dn_u .0), (dn_u .1)])]};
; .rk {.r_a (_ .0); .r_c (_ .1); .r_s (_ .2); .r_ac (vxor [r_a, r_c]); ((isz r_a) = 1) ? {0} : {((isz r_c) = 1) ? {0} : {(r_a = r_c) ? {0} : {((isz r_s) = 1) ? {0} : {(r_s = r_a) ? {0} : {(r_s = r_c) ? {0} : {(r_s = r_ac) ? {0} : {1}}}}}}}};
```
Label order. lt compares two points of one floor as labels, newest bit first,
answering 1 when the first label is smaller
```
; .lt {.lt_a (_ .0); .lt_c (_ .1); (lt_a = []) ? {0} : {((lt_a .1) = (lt_c .1)) ? {lt [(lt_a .0), (lt_c .0)]} : {((lt_a .1) = 0) ? {1} : {0}}}};
```
Counting, flattening and finite enumeration. `cnt` adds `+ 0` to the
accumulator read (017.09 pitfall P3). ext doubles a point list by one new most
significant bit, all old points with bit 0 first, so V(d) lists the labels
0, 1, …, 2^d - 1 in order. ptstr spells a point newest bit first, which is the
label in binary
```
; .Tl [.t 0; .apply_ {@t (t + _);}];
; .cnt {((_ | Tl) .t) + 0};
; .Flat [.row []; .apply_ {@row (_ | row);}];
; .flat {((_ | Flat) .row) | []};
; .ext {.e_vs _; flat [(e_vs & {[_, 0]}), (e_vs & {[_, 1]})]};
; .ptstr {.p_p _; (p_p = []) ? {“”} : {(“” (p_p .1)) (ptstr (p_p .0))}};
; .first {.fs_l (_ .0); .fs_d (_ .1); ((cnt (fs_l & {1})) = 0) ? {fs_d} : {fs_l .0}};
; .join {(_ & {_ “/”}) | “”};
```
Lookup. wget [T, A, C] walks the tree by the newest bits of A and C first
```
; .sel {.q_T (_ .0); .q_b (_ .1); (q_b = 0) ? {q_T .0} : {q_T .1}};
; .wget {.g_T (_ .0); .g_A (_ .1); .g_C (_ .2); (g_A = []) ? {g_T} : {wget [sel [(sel [g_T, (g_A .1)]), (g_C .1)], (g_A .0), (g_C .0)]}};
```
Signed monomials over a floor-d table T. mmul multiplies ±e_p by ±e_q with
T's sign; madd adds two monomials, at most one of which may be nonzero
```
; .mz [0, 0, []];
; .mono {[1, 0, _]};
; .negm {.ng_m _; [(ng_m .0), xor [(ng_m .1), 1], (ng_m .2)]};
; .conjm {.cj_m _; [(cj_m .0), xor [(cj_m .1), nu (cj_m .2)], (cj_m .2)]};
; .mmul {.mm_T (_ .0); .mm_x (_ .1); .mm_y (_ .2); ((mm_x .0) = 0) ? {mz} : {((mm_y .0) = 0) ? {mz} : {[1, xor3 [(mm_x .1), (mm_y .1), wget [mm_T, (mm_x .2), (mm_y .2)]], vxor [(mm_x .2), (mm_y .2)]]}}};
; .madd {.ma_x (_ .0); .ma_y (_ .1); ((ma_x .0) = 0) ? {ma_y} : {((ma_y .0) = 0) ? {ma_x} : {[9, 0, []]}}};
```
The doubling, on pairs (x, y) and (z, w) of floor-d monomials. split writes a
floor-(d+1) basis point [a, α] as x + yℓ. The tag selects the law:
“DS” Dickson/Schafer (xz - conj(w) y, w x + y conj(z));
“B” the Baez/opposite law (xz - w conj(y), conj(x) w + z y);
“Ma” the mutant that drops the minus (xz + conj(w) y, w x + y conj(z));
“Mb” the mutant that drops both conjugations (xz - w y, w x + y z)
```
; .split {.sp_P _; ((sp_P .1) = 0) ? {[(mono (sp_P .0)), mz]} : {[mz, (mono (sp_P .0))]}};
; .dbl {.db_T (_ .0); .db_x (_ .1 .0); .db_y (_ .1 .1); .db_z (_ .2 .0); .db_w (_ .2 .1); .db_g (_ .3); (db_g = “DS”) ? {[madd [mmul [db_T, db_x, db_z], negm (mmul [db_T, conjm db_w, db_y])], madd [mmul [db_T, db_w, db_x], mmul [db_T, db_y, conjm db_z]]]} : {(db_g = “B”) ? {[madd [mmul [db_T, db_x, db_z], negm (mmul [db_T, db_w, conjm db_y])], madd [mmul [db_T, conjm db_x, db_w], mmul [db_T, db_z, db_y]]]} : {(db_g = “Ma”) ? {[madd [mmul [db_T, db_x, db_z], mmul [db_T, conjm db_w, db_y]], madd [mmul [db_T, db_w, db_x], mmul [db_T, db_y, conjm db_z]]]} : {[madd [mmul [db_T, db_x, db_z], negm (mmul [db_T, db_w, db_y])], madd [mmul [db_T, db_w, db_x], mmul [db_T, db_y, db_z]]]}}}};
```
cdmono multiplies two floor-(d+1) basis elements through the doubling and
answers the product as one floor-(d+1) monomial, or nz 9 when it is not a
single signed basis element. cdok checks it is one and sits at label A + C.
cdsign is its sign bit, the new table entry
```
; .cdmono {.cm_r (dbl [(_ .0), split (_ .1), split (_ .2), (_ .3)]); .cm_f (cm_r .0); .cm_s (cm_r .1); ((cm_f .0) = 1) ? {((cm_s .0) = 0) ? {[1, (cm_f .1), [(cm_f .2), 0]]} : {[9, 0, []]}} : {((cm_s .0) = 1) ? {((cm_f .0) = 0) ? {[1, (cm_s .1), [(cm_s .2), 1]]} : {[9, 0, []]}} : {[9, 0, []]}}};
; .cdok {.ok_m (cdmono _); .ok_P (vxor [(_ .1), (_ .2)]); ((ok_m .0) = 1) ? {b2i ((ok_m .2) = ok_P)} : {0}};
; .cdsign {(cdmono _) .1};
```
The closed form Lift(w) ⊕ Pν of T01, evaluated from the lower table and kept
apart from the doubling so that the two routes can be compared:
Pν((a, α), (c, γ)) = γ·δν(a, c) ⊕ α·ν(c) ⊕ α·γ
```
; .closedsign {.cs_T (_ .0); .cs_a (_ .1 .0); .cs_al (_ .1 .1); .cs_c (_ .2 .0); .cs_ga (_ .2 .1); xor [wget [cs_T, cs_a, cs_c], xor3 [and [cs_ga, dnu [cs_a, cs_c]], and [cs_al, nu cs_c], and [cs_al, cs_ga]]]};
```
Tree builder. bld descends over the newest bits of both points, carrying the
chosen high bits as a nested pair; rev turns that into a point at the leaf.
A leaf is the doubling with tag k (succ), the closed form (“closed”), or the
lower entry with one pair flipped (“poke”, a causal probe outside 𝒲)
```
; .rev {.rv_h (_ .0); .rv_a (_ .1); (rv_h = []) ? {rv_a} : {rev [(rv_h .0), [rv_a, (rv_h .1)]]}};
; .leaf {.lf_T (_ .0); .lf_k (_ .1); .lf_A (_ .2); .lf_C (_ .3); .lf_x (_ .4); (lf_k = “closed”) ? {closedsign [lf_T, lf_A, lf_C]} : {(lf_k = “poke”) ? {xor [wget [lf_T, lf_A, lf_C], b2i ([lf_A, lf_C] = lf_x)]} : {cdsign [lf_T, lf_A, lf_C, lf_k]}}};
; .bld {.bd_T (_ .0); .bd_k (_ .1); .bd_n (_ .2); .bd_a (_ .3); .bd_c (_ .4); .bd_x (_ .5); .bd_m (bd_n - 1); (bd_n = 0) ? {leaf [bd_T, bd_k, rev [bd_a, []], rev [bd_c, []], bd_x]} : {[[bld [bd_T, bd_k, bd_m, [bd_a, 0], [bd_c, 0], bd_x], bld [bd_T, bd_k, bd_m, [bd_a, 0], [bd_c, 1], bd_x]], [bld [bd_T, bd_k, bd_m, [bd_a, 1], [bd_c, 0], bd_x], bld [bd_T, bd_k, bd_m, [bd_a, 1], [bd_c, 1], bd_x]]]}};
; .succ {bld [(_ .0), (_ .2), (_ .1) + 1, [], [], 0]};
; .closedtab {bld [(_ .0), “closed”, (_ .1) + 1, [], [], 0]};
; .poke {bld [(_ .0), “poke”, (_ .1), [], [], [(_ .2), (_ .3)]]};
; .pick {.pc_V (_ .0); .pc_s (_ .1); (flat (pc_V & {.pc_p _; ((ptstr pc_p) = pc_s) ? {[pc_p]} : {[]}})) .0};
```
Tables as text, row-major over the floor's label order. tabstr spells w(a, c);
kstr spells K(a, c; s) over (a, c, s)
```
; .tabstr {.tb_T (_ .0); .tb_V (_ .1); (tb_V & {.tb_a _; (tb_V & {wget [tb_T, tb_a, _]}) | “”}) | “”};
; .kstr {.kt_T (_ .0); .kt_V (_ .1); (kt_V & {.kt_a _; (kt_V & {.kt_c _; (kt_V & {curv [kt_T, kt_a, kt_c, _]}) | “”}) | “”}) | “”};
```
The lawful domain 𝒲(d) = {w : w(b, b) = ν(b), wᵀ = w ⊕ δν}. inW answers the
diagonal failures, the transpose failures and the first failing pair
```
; .diagf {.df_T (_ .0); .df_V (_ .1); cnt (df_V & {.df_b _; xor [wget [df_T, df_b, df_b], nu df_b]})};
; .transf {.tf_T (_ .0); .tf_V (_ .1); cnt (tf_V & {.tf_a _; cnt (tf_V & {.tf_c _; xor [wget [tf_T, tf_c, tf_a], xor [wget [tf_T, tf_a, tf_c], dnu [tf_a, tf_c]]]})})};
; .wfails {.wf_T (_ .0); .wf_V (_ .1); flat (wf_V & {.wf_a _; flat (wf_V & {.wf_c _; .wf_d (b2i (wf_a = wf_c)); .wf_x (xor [wget [wf_T, wf_c, wf_a], xor [wget [wf_T, wf_a, wf_c], dnu [wf_a, wf_c]]]); .wf_y (and [wf_d, xor [wget [wf_T, wf_a, wf_a], nu wf_a]]); .wf_n ((ptstr wf_a) (“:” (ptstr wf_c))); (wf_x = wf_y) ? {(wf_x = 0) ? {[]} : {[“both:” wf_n]}} : {(wf_x = 1) ? {[“transpose:” wf_n]} : {[“diagonal:” wf_n]}}})})};
; .inW {.iw_T (_ .0); .iw_V (_ .1); [diagf [iw_T, iw_V], transf [iw_T, iw_V], first [(wfails [iw_T, iw_V]), “none”]]};
```
Curvature. curv is the four-corner K(w)(a, c; s). scurv is the curvature
successor S(H) = Lift(H) ⊕ J_V evaluated on the lower table, with
J_V((a, α), (c, γ); (s, σ)) = σ·([s = 0] ⊕ [rank{a, c, s} = 3]). It never reads
the upper table
```
; .curv {.k_T (_ .0); .k_a (_ .1); .k_c (_ .2); .k_s (_ .3); .k_as (vxor [k_a, k_s]); .k_cs (vxor [k_c, k_s]); xor [xor [wget [k_T, k_a, k_c], wget [k_T, k_as, k_c]], xor [wget [k_T, k_a, k_cs], wget [k_T, k_as, k_cs]]]};
; .scurv {.sk_T (_ .0); .sk_a (_ .1 .0); .sk_c (_ .2 .0); .sk_s (_ .3 .0); .sk_sg (_ .3 .1); xor [curv [sk_T, sk_a, sk_c, sk_s], and [sk_sg, xor [isz sk_s, rk [sk_a, sk_c, sk_s]]]]};
; .kones {.ko_T (_ .0); .ko_V (_ .1); cnt (ko_V & {.ko_a _; cnt (ko_V & {.ko_c _; cnt (ko_V & {curv [ko_T, ko_a, ko_c, _]})})})};
```
Cross-floor checks for a step from floor d (table L, points V) to floor d + 1
(table U, points W). pairdis counts pairs where the doubling and the closed
form differ; prodbad counts doubling products that are not one signed basis
element at label A + C; kdis counts triples where K(U) differs from S(K(L)).
Each answers [disagreements, total, first witness]
```
; .pairdis {.pd_U (_ .0); .pd_L (_ .1); .pd_W (_ .2); .pd_x (flat (pd_W & {.pd_a _; flat (pd_W & {.pd_c _; ((wget [pd_U, pd_a, pd_c]) = (closedsign [pd_L, pd_a, pd_c])) ? {[]} : {[(ptstr pd_a) (“:” (ptstr pd_c))]}})})); [cnt (pd_x & {1}), cnt (pd_W & {cnt (pd_W & {1})}), first [pd_x, “none”]]};
; .prodbad {.pb_L (_ .0); .pb_W (_ .1); .pb_g (_ .2); .pb_x (flat (pb_W & {.pb_a _; flat (pb_W & {.pb_c _; ((cdok [pb_L, pb_a, pb_c, pb_g]) = 1) ? {[]} : {[(ptstr pb_a) (“:” (ptstr pb_c))]}})})); [cnt (pb_x & {1}), cnt (pb_W & {cnt (pb_W & {1})}), first [pb_x, “none”]]};
; .kdis {.kd_U (_ .0); .kd_L (_ .1); .kd_W (_ .2); .kd_x (flat (kd_W & {.kd_a _; flat (kd_W & {.kd_c _; flat (kd_W & {.kd_s _; ((curv [kd_U, kd_a, kd_c, kd_s]) = (scurv [kd_L, kd_a, kd_c, kd_s])) ? {[]} : {[((ptstr kd_a) (“:” (ptstr kd_c))) (“:” (ptstr kd_s))]}})})})); [cnt (kd_x & {1}), cnt (kd_W & {cnt (kd_W & {cnt (kd_W & {1})})}), first [kd_x, “none”]]};
; .tabdiff {.td_A (_ .0); .td_B (_ .1); .td_V (_ .2); flat (td_V & {.td_a _; flat (td_V & {.td_c _; ((wget [td_A, td_a, td_c]) = (wget [td_B, td_a, td_c])) ? {[]} : {[(ptstr td_a) (“:” (ptstr td_c))]}})})};
; .transdis {.tr_A (_ .0); .tr_B (_ .1); .tr_V (_ .2); cnt (tr_V & {.tr_a _; cnt (tr_V & {.tr_c _; xor [wget [tr_A, tr_a, tr_c], wget [tr_B, tr_c, tr_a]]})})};
; .kdiff {.kf_A (_ .0); .kf_B (_ .1); .kf_V (_ .2); cnt (kf_V & {.kf_a _; cnt (kf_V & {.kf_c _; cnt (kf_V & {xor [curv [kf_A, kf_a, kf_c, _], curv [kf_B, kf_a, kf_c, _]]})})})};
```
Matched squares. For a nonzero direction s, a coset {a, a + s} is named by its
smaller label. A square is an ordered pair of distinct s-cosets L, R, and it
is positive when its four-corner curvature is 0 (sign holonomy +1).
allsq lists every square [s, a, c]; possq keeps the positive ones
```
; .rep {b2i ((lt [(_ .0), vxor [(_ .0), (_ .1)]]) = 1)};
; .allsq {.aq_V _; flat (aq_V & {.aq_s _; ((isz aq_s) = 1) ? {[]} : {flat (aq_V & {.aq_a _; ((rep [aq_a, aq_s]) = 0) ? {[]} : {flat (aq_V & {.aq_c _; ((rep [aq_c, aq_s]) = 0) ? {[]} : {(aq_a = aq_c) ? {[]} : {[[aq_s, aq_a, aq_c]]}}})}})}})};
; .possq {.ps_T (_ .0); flat ((_ .1) & {.ps_q _; ((curv [ps_T, (ps_q .1), (ps_q .2), (ps_q .0)]) = 0) ? {[ps_q]} : {[]}})};
; .unord {flat (_ & {.uo_q _; ((lt [(uo_q .1), (uo_q .2)]) = 1) ? {[uo_q]} : {[]}})};
; .swapok {.sw_T (_ .0); cnt ((_ .1) & {.sw_q _; xor [1, curv [sw_T, (sw_q .2), (sw_q .1), (sw_q .0)]]})};
; .ldna [“na”, “na”, “na”, 0 - 1];
; .lowdata {.ld_q _; .ld_s (ld_q .0); .ld_a (ld_q .1); .ld_c (ld_q .2); ((ld_s .1) = 1) ? {((ld_a .1) = 0) ? {((ld_c .1) = 0) ? {[ptstr (ld_s .0), ptstr (ld_a .0), ptstr (ld_c .0), rk [(ld_s .0), (ld_a .0), (ld_c .0)]]} : {ldna}} : {ldna}} : {ldna}};
; .sqrec {.sr_T (_ .0); .sr_l (_ .1); .sr_q (_ .2); .sr_s (sr_q .0); .sr_a (sr_q .1); .sr_c (sr_q .2); .sr_as (vxor [sr_a, sr_s]); .sr_cs (vxor [sr_c, sr_s]); .sr_ld (lowdata sr_q); [“record”, “square”, sr_l, ptstr sr_s, ptstr sr_a, ptstr sr_as, ptstr sr_c, ptstr sr_cs, wget [sr_T, sr_a, sr_c], wget [sr_T, sr_as, sr_c], wget [sr_T, sr_a, sr_cs], wget [sr_T, sr_as, sr_cs], curv [sr_T, sr_a, sr_c, sr_s], sr_ld .0, sr_ld .1, sr_ld .2, sr_ld .3]};
```
Two-term elements. x = e_p + ε e_q with p < q and ε = (-1)^e is [p, q, e];
the first coefficient is +1, so x and -x are one projective element. tprod
expands xy into its four signed terms [label, sign bit]; tsum adds the
integer coefficients of the terms at one label; tzero is 1 when every label
sums to 0, that is when xy = 0
```
; .twos {.tw_V _; flat (tw_V & {.tw_p _; flat (tw_V & {.tw_q _; ((lt [tw_p, tw_q]) = 1) ? {[[tw_p, tw_q, 0], [tw_p, tw_q, 1]]} : {[]}})})};
; .tprod {.tq_T (_ .0); .tq_p (_ .1 .0); .tq_q (_ .1 .1); .tq_e (_ .1 .2); .tq_r (_ .2 .0); .tq_t (_ .2 .1); .tq_h (_ .2 .2); [[vxor [tq_p, tq_r], wget [tq_T, tq_p, tq_r]], [vxor [tq_p, tq_t], xor [tq_h, wget [tq_T, tq_p, tq_t]]], [vxor [tq_q, tq_r], xor [tq_e, wget [tq_T, tq_q, tq_r]]], [vxor [tq_q, tq_t], xor3 [tq_e, tq_h, wget [tq_T, tq_q, tq_t]]]]};
; .sgn {.sg_b _; (sg_b = 0) ? {1} : {0 - 1}};
; .tsum {.ts_m (_ .0); .ts_L (_ .1); cnt (ts_m & {.ts_u _; ((ts_u .0) = ts_L) ? {sgn (ts_u .1)} : {0}})};
; .tzsum {.tz_m (tprod _); b2i ((cnt (tz_m & {.tz_u _; ((tsum [tz_m, (tz_u .0)]) = 0) ? {0} : {1}})) = 0)};
```
tzero decides xy = 0 by pairing instead of summing: four ±1 terms sum to zero
at every label exactly when they split into two pairs, each at one label with
opposite signs. tzsum is the label-sum test itself; the main run evaluates both
on every pair it reports
```
; .canc {.cn_u (_ .0); .cn_v (_ .1); ((cn_u .0) = (cn_v .0)) ? {xor [(cn_u .1), (cn_v .1)]} : {0}};
; .tzero {.tp_m (tprod _); .tp_1 (tp_m .0); .tp_2 (tp_m .1); .tp_3 (tp_m .2); .tp_4 (tp_m .3); ((and [canc [tp_1, tp_2], canc [tp_3, tp_4]]) = 1) ? {1} : {((and [canc [tp_1, tp_3], canc [tp_2, tp_4]]) = 1) ? {1} : {and [canc [tp_1, tp_4], canc [tp_2, tp_3]]}}};
; .xstr {.xs_x _; ((ptstr (xs_x .0)) (((xs_x .2) = 0) ? {“+”} : {“-”})) (ptstr (xs_x .1))};
; .supp {[(_ .0), (_ .1)]};
; .ltel {.le_x (_ .0); .le_y (_ .1); ((le_x .0) = (le_y .0)) ? {((le_x .1) = (le_y .1)) ? {((le_x .2) = 0) ? {le_y .2} : {0}} : {lt [(le_x .1), (le_y .1)]}} : {lt [(le_x .0), (le_y .0)]}};
; .ltsp {.ls_u (_ .0); .ls_v (_ .1); ((ls_u .0) = (ls_v .0)) ? {lt [(ls_u .1), (ls_v .1)]} : {lt [(ls_u .0), (ls_v .0)]}};
; .member {.mb_x (_ .0); b2i ((cnt ((_ .1) & {.mb_y _; b2i (mb_y = mb_x)})) .> 0)};
```
The annihilation search. annpairs multiplies every ordered pair of two-term
elements with the table and keeps those with xy = 0. edges are the unordered
pairs {x, y} with xy = 0 or yx = 0, each written once with the smaller element
first. The support graph forgets the relative signs
```
; .annpairs {.ap_T (_ .0); .ap_X (_ .1); flat (ap_X & {.ap_x _; flat (ap_X & {.ap_y _; ((tzero [ap_T, ap_x, ap_y]) = 1) ? {[[ap_x, ap_y]]} : {[]}})})};
; .mkedges {.me_P _; flat (me_P & {.me_e _; .me_x (me_e .0); .me_y (me_e .1); ((ltel [me_x, me_y]) = 1) ? {[me_e]} : {((member [[me_y, me_x], me_P]) = 1) ? {[]} : {[[me_y, me_x]]}}})};
; .zverts {.zv_X (_ .0); .zv_E (_ .1); flat (zv_X & {.zv_x _; ((cnt (zv_E & {.zv_e _; b2i (((zv_e .0) = zv_x) ? {<>} : {(zv_e .1) = zv_x})})) .> 0) ? {[zv_x]} : {[]}})};
; .degree {.dg_x (_ .0); cnt ((_ .1) & {.dg_e _; b2i (((dg_e .0) = dg_x) ? {<>} : {(dg_e .1) = dg_x})})};
; .supps {.su_X _; flat (su_X & {.su_x _; ((su_x .2) = 0) ? {[supp su_x]} : {((member [[(su_x .0), (su_x .1), 0], su_X]) = 1) ? {[]} : {[supp su_x]}}})};
; .suppadj {.sa_u (_ .0); .sa_v (_ .1); b2i ((cnt ((_ .2) & {.sa_e _; .sa_p (supp (sa_e .0)); .sa_q (supp (sa_e .1)); b2i (((sa_p = sa_u) ? {sa_q = sa_v} : {()}) ? {<>} : {(sa_p = sa_v) ? {sa_q = sa_u} : {()}})})) .> 0)};
; .suppedges {.se_S (_ .0); .se_E (_ .1); flat (se_S & {.se_u _; flat (se_S & {.se_v _; ((ltsp [se_u, se_v]) = 1) ? {((suppadj [se_u, se_v, se_E]) = 1) ? {[[se_u, se_v]]} : {[]}} : {[]}})})};
```
Components of the support graph by fixed-point closure: a set grows by the
neighbours of its members until its size stops changing. Sets are filtered
from the support list, so each component has one canonical spelling
```
; .nbrs {.nb_u (_ .0); .nb_SE (_ .1); flat (nb_SE & {.nb_e _; ((nb_e .0) = nb_u) ? {[(nb_e .1)]} : {((nb_e .1) = nb_u) ? {[(nb_e .0)]} : {[]}}})};
; .grow {.gr_set (_ .0); .gr_S (_ .1); .gr_SE (_ .2); .gr_nx (flat (gr_S & {.gr_v _; ((member [gr_v, gr_set]) = 1) ? {[gr_v]} : {((cnt (gr_set & {.gr_m _; member [gr_v, nbrs [gr_m, gr_SE]]})) .> 0) ? {[gr_v]} : {[]}}})); ((cnt (gr_nx & {1})) = (cnt (gr_set & {1}))) ? {gr_set} : {grow [gr_nx, gr_S, gr_SE]}};
; .comps {.cp_S (_ .0); .cp_SE (_ .1); flat (cp_S & {.cp_u _; .cp_c (grow [[cp_u], cp_S, cp_SE]); ((cp_c .0) = cp_u) ? {[cp_c]} : {[]}})};
; .disp {vxor [(_ .0), (_ .1)]};
; .ptsof {.po_V (_ .0); .po_L (_ .1); flat (po_V & {.po_p _; ((member [po_p, po_L]) = 1) ? {[ptstr po_p]} : {[]}})};
; .bitsof {.bo_L _; flat ([0, 1] & {.bo_b _; ((member [bo_b, bo_L]) = 1) ? {[“” bo_b]} : {[]}})};
; .comprec {.cr_l (_ .0); .cr_c (_ .1); .cr_SE (_ .2); .cr_Vl (_ .3); .cr_ds (cr_c & {disp _}); [“record”, “component”, cr_l, cnt (cr_c & {1}), cnt (cr_SE & {.cr_e _; and [member [(cr_e .0), cr_c], member [(cr_e .1), cr_c]]}), join (ptsof [cr_Vl, (cr_ds & {_ .0})]), join (bitsof (cr_ds & {_ .1})), join (cr_c & {.cr_u _; (ptstr (cr_u .0)) (“:” (ptstr (cr_u .1)))})]};
```
Per-edge and per-square incidence. edgerec checks, for an ordered pair with
xy = 0, equal displacement on both supports and T03's forced relative sign
εη = -ω(a, c) ω(a + s, c + s), as bits e ⊕ h = 1 ⊕ w(p, r) ⊕ w(q, t)
```
; .edgerec {.er_T (_ .0); .er_l (_ .1); .er_x (_ .2 .0); .er_y (_ .2 .1); .er_dm (b2i ((disp er_x) = (disp er_y))); .er_eh (xor [(er_x .2), (er_y .2)]); .er_pr (xor3 [1, wget [er_T, (er_x .0), (er_y .0)], wget [er_T, (er_x .1), (er_y .1)]]); [“record”, “annpair”, er_l, xstr er_x, xstr er_y, ptstr (disp er_x), ptstr (disp er_y), er_dm, er_eh, er_pr, b2i (er_eh = er_pr), tzero [er_T, er_y, er_x]]};
; .onsq {.os_q (_ .0); .os_L [(os_q .1), vxor [(os_q .1), (os_q .0)]]; .os_R [(os_q .2), vxor [(os_q .2), (os_q .0)]]; cnt ((_ .1) & {.os_e _; .os_p (supp (os_e .0)); .os_r (supp (os_e .1)); b2i (((os_p = os_L) ? {os_r = os_R} : {()}) ? {<>} : {(os_p = os_R) ? {os_r = os_L} : {()}})})};
; .offsq {.of_U (_ .1); cnt ((_ .0) & {.of_e _; ((cnt (of_U & {.of_q _; onsq [of_q, [of_e]]})) = 0) ? {1} : {0}})};
; .sameld {.sl_P _; cnt (sl_P & {.sl_q _; .sl_l (lowdata sl_q); cnt (sl_P & {b2i ((lowdata _) = sl_l)})})};
; .nbases {.nb_V _; cnt (nb_V & {.nb_a _; cnt (nb_V & {.nb_c _; cnt (nb_V & {rk [_, nb_a, nb_c]})})})};
; .ldrec {.lr_l (_ .0); .lr_T (_ .1); .lr_Q (_ .2); .lr_P (_ .3); .lr_V (_ .4); .lr_B (flat (lr_Q & {.lr_q _; (((lowdata lr_q) .3) = 1) ? {[lr_q]} : {[]}})); [“record”, “sq-lowdata”, lr_l, cnt (lr_P & {.lr_p _; b2i (((lowdata lr_p) .3) = 1)}), cnt (lr_B & {1}), cnt (lr_B & {.lr_b _; curv [lr_T, (lr_b .1), (lr_b .2), (lr_b .0)]}), sameld lr_P, nbases lr_V]};
```
Record helpers shared by the variants. floorrec: one floor's size, table, 𝒲
membership and the number of K = 1 triples. steprec: one cross-floor step.
sqrec0: the square census of one floor. ttall: the whole two-term search of
one floor, summarized
```
; .floorrec {.fr_l (_ .0); .fr_d (_ .1); .fr_T (_ .2); .fr_V (_ .3); .fr_w (inW [fr_T, fr_V]); [“record”, “floor”, fr_l, fr_d, cnt (fr_V & {1}), tabstr [fr_T, fr_V], fr_w .0, fr_w .1, fr_w .2, kones [fr_T, fr_V]]};
; .steprec {.st_l (_ .0); .st_d (_ .1); .st_L (_ .2); .st_U (_ .3); .st_W (_ .4); .st_g (_ .5); .st_p (pairdis [st_U, st_L, st_W]); .st_b (prodbad [st_L, st_W, st_g]); .st_k (kdis [st_U, st_L, st_W]); [“record”, “step”, st_l, st_d, st_p .0, st_p .1, st_p .2, st_b .0, st_b .1, st_b .2, st_k .0, st_k .1, st_k .2]};
; .ktabrec {[“record”, “table-K”, (_ .0), (_ .1), kstr [(_ .2), (_ .3)]]};
; .sqcount {.sc_l (_ .0); .sc_d (_ .1); .sc_T (_ .2); .sc_Q (_ .3); .sc_P (_ .4); [“record”, “squares”, sc_l, sc_d, cnt (sc_Q & {1}), cnt (sc_P & {1}), cnt ((unord sc_P) & {1}), swapok [sc_T, sc_P]]};
; .sqrec0 {.s0_T (_ .2); .s0_Q (allsq (_ .3)); sqcount [(_ .0), (_ .1), s0_T, s0_Q, possq [s0_T, s0_Q]]};
; .ttrec {.tt_l (_ .0); .tt_d (_ .1); .tt_T (_ .2); .tt_X (_ .3); .tt_AP (_ .4); .tt_E (_ .5); .tt_Z (_ .6); .tt_S (_ .7); .tt_SE (_ .8); .tt_C (_ .9); [“record”, “twoterm-summary”, tt_l, tt_d, cnt (tt_X & {1}), cnt (tt_AP & {1}), cnt (tt_AP & {.ty_e _; tzero [tt_T, (ty_e .1), (ty_e .0)]}), cnt (tt_AP & {.tu_e _; tzsum [tt_T, (tu_e .0), (tu_e .1)]}), cnt (tt_E & {1}), cnt (tt_Z & {1}), cnt (tt_Z & {degree [_, tt_E]}), cnt (tt_S & {1}), cnt (tt_SE & {1}), cnt (tt_C & {1})]};
; .ttall {.ta_T (_ .2); .ta_X (twos (_ .3)); .ta_AP (annpairs [ta_T, ta_X]); .ta_E (mkedges ta_AP); .ta_Z (zverts [ta_X, ta_E]); .ta_S (supps ta_Z); .ta_SE (suppedges [ta_S, ta_E]); ttrec [(_ .0), (_ .1), ta_T, ta_X, ta_AP, ta_E, ta_Z, ta_S, ta_SE, comps [ta_S, ta_SE]]};
```
ttpart is ttall without the support graph and its components. The alternate
seed's sedenion floor uses it: the full search exhausted a 30 GB heap there
```
; .ttpart {.tp_l (_ .0); .tp_d (_ .1); .tp_T (_ .2); .tp_X (twos (_ .3)); .tp_AP (annpairs [tp_T, tp_X]); .tp_E (mkedges tp_AP); .tp_Z (zverts [tp_X, tp_E]); [“record”, “twoterm-partial”, tp_l, tp_d, cnt (tp_X & {1}), cnt (tp_AP & {1}), cnt (tp_AP & {.tv_e _; tzero [tp_T, (tv_e .1), (tv_e .0)]}), cnt (tp_AP & {.tx_e _; tzsum [tp_T, (tx_e .0), (tx_e .1)]}), cnt (tp_E & {1}), cnt (tp_Z & {1}), cnt (tp_Z & {degree [_, tp_E]}), cnt ((supps tp_Z) & {1})]};
; .witness {.wt_T (_ .0); .wt_l (_ .1); .wt_x (_ .2 .0); .wt_y (_ .2 .1); .wt_m (tprod [wt_T, wt_x, wt_y]); [“record”, “witness”, wt_l, xstr wt_x, xstr wt_y, join (wt_m & {.wt_u _; (ptstr (wt_u .0)) (“:” (sgn (wt_u .1)))}), join (wt_m & {.wt_v _; (ptstr (wt_v .0)) (“:” (tsum [wt_m, (wt_v .0)]))}), tzero [wt_T, wt_x, wt_y]]};
