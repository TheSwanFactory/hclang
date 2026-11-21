#!/usr/bin/env hc
```
Denum — FOIST 19a constructive state and arithmetic

A Denum is a nonnegative counting state (C, loads), with Count separate from
the ordered raw loads and their KD rank. The third hash returns this raw Denum;
the fourth hash reads power-of-two-completed antipodal signed coordinates.
The empty start is Denum(0,[]). A zero-arity Apply initializes one load.

A Denum's native application deposits the applied Frame's Size at
C modulo arity and advances C. Other public operators now follow FOIST 19a:
+ is Flop, * is Cart, &|& is KD multiplication, and unary - is half-rotation.
Scalar numeric arithmetic inside these methods remains native.
```

```
The class lives entirely in HC and is embedded by the native evaluator
through the Denum prologue. These definitions remain user-visible and
the following testdoc witnesses replace the superseded v0.53.1 examples.
```
.redistribution {.s (_ .0); .ways (_ .1); .r (s %% ways); .q (((s - r) / ways).##);
  ((ways - r) [q]) | (r [(q + 1)])};
.denum-instance {.c (_ .0); .e (_ .1); [
    .count c;
    .loads e;
    .# {_^.count};
    .## {(_^ .loads).##};
    .apply_ {.s (_ .##); .c (_^ .count); .e (_^ .loads);
      .at (((e.#) = 0) ? {0} : {c %% (e.#)}); .cursor [.index 0; .target at; .amount s; .out []; .apply_ {.v _; .i (_^ .index); .t (_^ .target); .a (_^ .amount); .o (_^ .out); @out (o ((i = t) ? {v + a} : {v})); @index (i + 1);}];
      (s ~ (0.<>)) ? {
        ((e.#) = 0) ? {
          @loads [s]; @count (c + 1); _^^
        } : {
          @loads ((e | cursor) .out); @count (c + 1); _^^
        }
      } : {s}};
    .scale_ {.k _; .e (_^ .loads);
      (k ~ (0.<>)) ? {@loads (e & {_ * k}); _^^} : {$!!.invalid-scale}};
    .deposit_ {.a _; .e (_^ .loads);
      .ok (((a ~ ([].<>)) ? {((a.#) = 2) ? {(a .1) ~ (0.<>)}}) ? {1} : {0});
      .at ((ok = 1) ? {a .0} : {0}); .k ((ok = 1) ? {a .1} : {0});
      .ix (((ok = 1) ? {(at ~ (0.<>)) ? {(e.#) .> at}}) ? {1} : {0});
      .cursor [.index 0; .target at; .amount k; .out []; .apply_ {.v _; .i (_^ .index); .t (_^ .target); .a (_^ .amount); .o (_^ .out); @out (o ((i = t) ? {v + a} : {v})); @index (i + 1);}];
      (ix = 1) ? {@loads ((e | cursor) .out); _^^} : {(ok = 1) ? {$!!.invalid-arity} : {$!!.invalid-denum}}};
    ./ {.ways _; .c (_^ .count); .s (_^ .##); .v ([] / ways);
      (v ~ ([].<>)) ? {(_^^^ .Denum) [c, ((_^^^ .redistribution) [s, ways])]} : {v}};
    .size-ratio {.c (_^ .count); .s (_^ .##); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {(u = 1) ? {s / c} : {$!!.unary-observation}}};
    .residual-ratio {.c (_^ .count); .e (_^ .loads); .u ((_ = ()) ? {1} : {0});
      (c .> 0) ? {
        (u = 1) ? {
          .cursor [.sum 0; .parity 0; .apply_ {.v _; .s (_^ .sum); .p (_^ .parity);
            @sum ((p = 0) ? {s + v} : {s - v});
            @parity (1 - p); _^^}];
          .r ((e | cursor) .sum);
          r / c
        } : {$!!.unary-observation}
      }};
    .toText {“Denum(” (_^ .count) “,” (_^ .loads) “)”}
  ]};
.Denum {((_ ~ ([].<>)) ? {(__ .#) ~ <1, 2>}) ? {.a __; .n (a.#);
  .c ((n = 1) ? {1} : {a .0});
  .boxed ((n = 2) ? {[a .1]} : {[a .0]});
  ((c ~ (0.<>)) ? {(boxed .0) ~ ([].<>)}) ? {.e (boxed .0); .k (e.#);
  ((k = 0) ? {
    (c = 0) ? {denum-instance [c, (e | [])]} : {$!!.invalid-denum}
  } : {
    ((e &| {.x _; (x ~ (0.<>)) ? {[]} : {[x]}}).# = 0) ? {
      denum-instance [c, (e | [])]
    } : {$!!.invalid-denum}
  })} : {$!!.invalid-denum}} : {$!!.invalid-denum}};
```

## Construction and zero-arity Apply

```
; “” (Denum [0, []])
# “Denum(0,[])”
; “” ((Denum [0, []]) 5)
# “Denum(1,[5])”
; “” (Denum [2, [3, 1]])
# “Denum(2,[3, 1])”
; “” (Denum [0, [3, 1]])
# “Denum(0,[3, 1])”
; “” ((Denum [2, [3, 1]]) 5)
# “Denum(3,[8, 1])”
; “” ((Denum [3, [3, 1]]) 5)
# “Denum(4,[3, 6])”
; (Denum [2, [3, 1]]).#
# 2
; (Denum [2, [3, 1]]).##
# 4
; (Denum [2, []])
# $!!.invalid-denum
```

## Raw Denumeration and KD coordinate observation

```
; “” ((Denum [2, [3, 1]]).###)
# “Denum(2,[3, 1])”
; (Denum [2, [3, 1]]).####
# [2]
; (Denum [3, [3, 1, 5]]).####
# [-2, 1]
; (Denum [1, [3]]).####
# [3]
; (Denum [0, []]).####
# []
```

## Flop, Cart, subtraction, negation and KD product

```
; “” ((Denum [2, [3, 1]]) + (Denum [2, [1, 2]]))
# “Denum(4,[4, 3])”
; (Denum [2, [3, 1]]) * (Denum [2, [1, 2]])
# [[3, 1], [3, 2], [1, 1], [1, 2]]
; “” (- (Denum [2, [3, 1]]))
# “Denum(2,[1, 3])”
; “” (- (Denum [3, [3, 1, 5]]))
# “Denum(3,[5, 0, 3, 1])”
; “” ((Denum [2, [3, 1]]) - (Denum [2, [1, 2]]))
# “Denum(4,[5, 2])”
; “” ((Denum [2, [0, 1]]) &|& (Denum [2, [0, 1]]))
# “Denum(4,[1, 0])”
; ((Denum [2, [0, 1]]) &|& (Denum [2, [0, 1]])).####
# [1]
```

## Retained load transforms and ratio observations

```
; “” ((Denum [2, [3, 1]]).deposit_ [0, 5])
# “Denum(2,[8, 1])”
; “” ((Denum [2, [3, 1]]).scale_ 2)
# “Denum(2,[6, 2])”
; (Denum [2, [5, 3]]).size-ratio ()
# 4
; (Denum [2, [5, 3]]).residual-ratio ()
# 1
; “” ((Denum [2, [5, 3]]) / 3)
# “Denum(2,[3, 3, 2])”
