#!/usr/bin/env hc
```
017.11 Gate 0: the HC behaviors the classical lane relies on, as a testdoc

Run with `cd cli && deno task hc ../experiments/017-classical-cd/gate0.hc -t`.
Each `# expected` line is an assertion about the language, not about the
Cayley–Dickson lane. The definitions are copied from cd-core.hc.

Parity is a form comparison, and the zero test and rank three follow
```
; .xor {.x_u _; ((x_u .0) = (x_u .1)) ? {0} : {1}};
; [xor [0, 0], xor [0, 1], xor [1, 0], xor [1, 1]]
# [0, 1, 1, 0]
; .vxor {.v_u _; ((v_u .0) = []) ? {[]} : {[vxor [(v_u .0 .0), (v_u .1 .0)], xor [(v_u .0 .1), (v_u .1 .1)]]}};
; .isz {.z_v _; (z_v = []) ? {1} : {((z_v .1) = 0) ? {isz (z_v .0)} : {0}}};
; .rk {.r_a (_ .0); .r_c (_ .1); .r_s (_ .2); .r_ac (vxor [r_a, r_c]); ((isz r_a) = 1) ? {0} : {((isz r_c) = 1) ? {0} : {(r_a = r_c) ? {0} : {((isz r_s) = 1) ? {0} : {(r_s = r_a) ? {0} : {(r_s = r_c) ? {0} : {(r_s = r_ac) ? {0} : {1}}}}}}}};
; vxor [[[[], 1], 0], [[[], 1], 1]]
# [[[], 0], 1]
; [isz [[[], 0], 0], isz [[[], 0], 1]]
# [1, 0]
; [rk [[[[], 1], 0], [[[], 0], 1], [[[], 1], 1]], rk [[[[[], 1], 0], 0], [[[[], 0], 1], 0], [[[[], 0], 0], 1]]]
# [0, 1]
```
Nested pairs compare as forms, and the empty point equals itself
```
; [[[[], 1], 0] = [[[], 1], 0], [[[], 1], 0] = [[[], 0], 1], [] = []]
# [<>, (), <>]
```
Counting adds `+ 0` to the accumulator read, and flattening splices one level
```
; .Tl [.t 0; .apply_ {@t (t + _);}];
; .cnt {((_ | Tl) .t) + 0};
; .Flat [.row []; .apply_ {@row (_ | row);}];
; .flat {((_ | Flat) .row) | []};
; cnt [1, 0 - 1, 1, 1]
# 2
; flat [[[1, 0]], [], [[2, 0], [3, 1]]]
# [[1, 0], [2, 0], [3, 1]]
```
ext puts the new bit most significant, so V lists labels in order, and ptstr
spells a point newest bit first
```
; .ext {.e_vs _; flat [(e_vs & {[_, 0]}), (e_vs & {[_, 1]})]};
; .ptstr {.p_p _; (p_p = []) ? {“”} : {(“” (p_p .1)) (ptstr (p_p .0))}};
; (ext (ext [[]])) & {ptstr _}
# [“00”, “01”, “10”, “11”]
; cnt ((ext (ext (ext (ext [[]])))) & {1})
# 16
; ptstr (((ext (ext (ext [[]])))) .6)
# “110”
```
Lookup walks the tree by the newest bits first. In this hand-written depth-2
tree the leaf for (A, C) is 1 exactly at (01, 11), (10, 00) and (11, 11)
```
; .sel {.q_T (_ .0); .q_b (_ .1); (q_b = 0) ? {q_T .0} : {q_T .1}};
; .wget {.g_T (_ .0); .g_A (_ .1); .g_C (_ .2); (g_A = []) ? {g_T} : {wget [sel [(sel [g_T, (g_A .1)]), (g_C .1)], (g_A .0), (g_C .0)]}};
; .Hand [[[[0, 0], [0, 0]], [[0, 0], [0, 1]]], [[[1, 0], [0, 0]], [[0, 0], [0, 1]]]];
; .Vh (ext (ext [[]]));
; (Vh & {.h_a _; (Vh & {wget [Hand, h_a, _]}) | “”}) | “”
# “0000000110000001”
```
Integer coefficients: negation, products and sums
```
; [0 - 1, (0 - 1) * (0 - 1), 1 + (0 - 1)]
# [-1, 1, 0]
```
Conditionals: a taken branch that answers nil falls through, and `_` is nil
inside a branch, so the lane binds every argument to a name first
```
; <> ? {()} : {“else”}
# “else”
; {(_ = 7) ? {[_, __]}} 7
# [(), 7]
; {.g_v _; (g_v = 7) ? {[g_v]}} 7
# [7]
```
Strings concatenate by juxtaposition, and a joined list keeps a trailing
separator
```
; (“a:” “b”) (“” 1)
# “a:b1”
; ([“x”, “y”] & {_ “/”}) | “”
# “x/y/”
