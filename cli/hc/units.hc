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
Composition refuses, including same-unit
```
; 9.8.m + 1.2.m
# $!.numeric-domain + FrameTypedNumber FrameTypedNumber
; 9.8.m - 1.2.m
# $!.numeric-domain - FrameTypedNumber FrameTypedNumber
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
; 1.408.055.m
# $!.name-missing “$:FrameSequence...
; 9.8.m2
# $!.name-missing “$:FrameDecimal...
; 9.8.m.s
# $!.name-missing “$:FrameTypedNumber...
; -9.8.m
# $!.numeric-domain property FrameDecimal
