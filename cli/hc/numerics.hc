#!/usr/bin/env hc
```
Rationalizing numbers (#355)

These examples are the executable acceptance corpus for spec a08. Integers,
decimals, and rationals are numeric; dotted sequences preserve spelling but are
not numeric.

Syntactic ladder
```
; 3
# 3
; 3.14
# 3.14
; 1.408.055.1212
# 1.408.055.1212
; 0
# 0
; 0.5
# 0.5
```
Exact arithmetic
```
; 12345678901234567890 + 1
# 12345678901234567891
; 1.1 + 2.2
# 3.3
; (1 / 3) + (1 / 3) + (1 / 3)
# 1
; 3 2
# 6
```
Division follows the divisor's rung
```
; 1 / 2
# 1/2
; 3 / 2
# 3/2
; 4 / 2
# 2
; 10.50 / 2
# 21/4
; 1 / 2.0
# 0.5
; 1.5 / 3
# 1/2
; 1.5 / (5 / 2)
# 3/5
; 0.3 / 0.1
# 2.9999999999999996
```
Signs and common factors canonicalize
```
; (1 - 2) / 4
# -1/4
; 2 / (1 - 5)
# -1/2
```
Exponentiation stays exact when its exponent is integral
```
; 2 ** 64
# 18446744073709551616
; 2 ** (1 - 2)
# 1/2
; 2 ** 1.5
# 2.8284271247461903
```
Numeric equality is exact; data and metadata equality remain unchanged
```
; 3 = 3.0
# <>
; 3 == 3.0
# ()
; 0123 = 123
# <>
; 0123 == 123
# ()
; 3 === 3.0
# <>
; 1.408.055.1212 = 1.408.055.1212
# <>
```
Integer-only repetition remains available
```
; 3“Hello”
# “HelloHelloHello”

```
Cross-rung promotion and integer-only modulo
```
; 1 + 2.5
# 3.5
; 1.5 + (1 / 3)
# 11/6
; 3.%%2
# 1
; 3.0 %% 2
# $!.numeric-domain %% FrameDecimal FrameInt
```
Zero and unsupported domains return stable errors
```
; 1 / (1 - 1)
# $!.division-by-zero /
; 1 %% (1 - 1)
# $!.modulo-by-zero %%
; 1.408.555 + 1
# $!.numeric-domain + FrameSequence FrameInt
; 1.408.555.< 2
# $!.numeric-domain < FrameSequence FrameInt
; 1.408.555 = 1
# ()
; -1.408.555
# $!.numeric-domain property FrameDecimal
```
Repetition and exact powers fail before unsafe allocation
```
; 3.14“Hello”
# $!.repetition-domain FrameDecimal
; 1.408.555“Hi”
# $!.repetition-domain FrameSequence
; 65537“x”
# $!.repetition-limit 65536
; 2 ** 1000000
# $!.numeric-range ** FrameInt
