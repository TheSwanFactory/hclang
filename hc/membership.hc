#!/usr/bin/env hc
```
Immediate membership follows the equality ladder: ~ uses =, ~~ uses ==,
and ~~~ uses ===. The host is on the right. No descendant search or metadata.
```
; [] ~ [[]]
# <>
; [] ~~ [[]]
# <>
; [] ~~~ [[]]
# ()
; 2 ~ [5 - 3]
# <>
; 2 ~~ [5 - 3]
# ()
; [] ~ [[[]]]
# ()
; 1 ~ [.property 1;]
# ()
```
Fano incidence uses shared point objects. Equal form alone is not incidence.
```
.point [];
.other [];
.line [point];
; point ~~~ line
# <>
; other ~~~ line
# ()
```
Runtime types use .<>; declared binding schemas use .<^>.
Schema matching with ~ retains its nested contract.
```
; “Q” ~ “”.<>
# <>
; “Q” ~ 1.<>
# ()
; “”.<> “Q”
# “Q”
; {.f {missing}; “x” ~ f.<>} ()
# ()
; {.x <1, 2> 1; x.<^>} ()
# <1, 2>
; 0b101 ~ <3@Bit>
# <>
