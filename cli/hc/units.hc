#!/usr/bin/env hc
```
Units of measure (#362)

These examples are the executable acceptance corpus for the units MVP. An
alphabetic property on an exact decimal builds an inert typed number: it renders
as written, compares structurally, and refuses every arithmetic operation.

Syntax
```
; 9.8.m
# 9.8.m
; 0.10.USD
# 0.10.USD
; 9.8.metres
# 9.8.metres
; 9.8.M
# 9.8.M
```
A unit segment may carry an integer exponent, and further segments compose
```
; 9.8.m2
# 9.8.m2
; 9.8.m.s-1
# 9.8.m.s-1
; 9.8.kg.m.s-2
# 9.8.kg.m.s-2
; 9.8.m.s
# 9.8.m.s
```
Equality planes
```
; 9.8.m = 9.8.m
# <>
; 9.80.m = 9.8.m
# <>
; 9.8.m == 9.8.m
# <>
; 9.80.m == 9.8.m
# ()
; 9.8.m = 9.8.kg
# ()
; 9.8.m = 9.8
# ()
```
The metadata plane is unchanged, and still answers every frame without metadata
alike (#358). Locked so it reads as deliberate rather than as a units ruling
```
; 9.8.m === 9.8.kg
# <>
```
Equality is spelling, not dimension: no segment is reordered, no exponent folded
```
; 9.8.m.s-1 = 9.8.m.s-1
# <>
; 9.8.m.s-1 = 9.8.s-1.m
# ()
; 9.8.m2 = 9.8.m.m
# ()
```
Composition refuses, including same-unit
```
; 9.8.m + 1.2.m
# $!.numeric-domain + FrameTypedNumber FrameTypedNumber
; 9.8.m - 1.2.m
# $!.numeric-domain - FrameTypedNumber FrameTypedNumber
; 9.8.m.s-1 + 1.0.m.s-1
# $!.numeric-domain + FrameTypedNumber FrameTypedNumber
; 9.8.m + 1
# $!.numeric-domain + FrameTypedNumber FrameInt
; 1 + 9.8.m
# $!.numeric-domain + FrameInt FrameTypedNumber
; 9.8.m 2
# $!.numeric-domain * FrameTypedNumber FrameInt
; 9.8.m / 2
# $!.numeric-domain / FrameTypedNumber FrameInt
; 9.8.m %% 2
# $!.numeric-domain %% FrameTypedNumber FrameInt
; 9.8.m ** 2
# $!.numeric-domain ** FrameTypedNumber FrameInt
; 9.8.m.< 10.2.m
# $!.numeric-domain < FrameTypedNumber FrameTypedNumber
; 9.8.m“Hi”
# $!.repetition-domain FrameTypedNumber
; -(9.8.m)
# $!.numeric-domain unary- FrameTypedNumber
```
Boundaries that do not move
```
; 9.8.5
# 9.8.5
; 100.kg
# $!.name-missing “$:FrameInt...
; (1 / 3).m
# $!.name-missing “$:FrameRational...
; (1 / 2.0).m
# $!.name-missing “$:FrameNumber...
; 1.408.055.m
# $!.name-missing “$:FrameSequence...
; 9.8.m.5
# $!.name-missing “$:FrameTypedNumber...
; 9.8.m.2s
# $!.name-missing “$:FrameTypedNumber...
; 9.8.m.s_1
# $!.name-missing “$:FrameTypedNumber...
; -9.8.m
# $!.numeric-domain property FrameDecimal
