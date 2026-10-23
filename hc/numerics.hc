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
Numeric equality is exact. `=` asks for the same value, `==` also asks for the
same rung, and `===` asks for the same frame, which for a number is `==`
```
; 3 = 3.0
# <>
; 3 == 3.0
# ()
; 0123 = 123
# <>
; 0123 == 123
# <>
; 3 === 3.0
# ()
; 3 === 3
# <>
; 1.408.055.1212 = 1.408.055.1212
# <>
```
Integer-only repetition remains available
```
; 3“Hello”
# “HelloHelloHello”

```
Repeating an aggregate concatenates its elements (v0.22.0). The answer is a
fresh aggregate of the same kind holding the receiver's properties once and its
elements n times, shared rather than copied, so the receiver is never answered
or written and no element holds its own aggregate
```
; 3 [1, 2]
# [1, 2, 1, 2, 1, 2]
; 0 [1, 2]
# []
; 2 [.k 1; 4, 5]
# [.k 1; 4, 5, 4, 5]
; 2 (1, 2)
# (1, 2, 1, 2)
; .xs [1, 2];
; [3 xs, xs]
# [[1, 2, 1, 2, 1, 2], [1, 2]]
; [(1 xs) = xs, (1 xs) === xs, ((3 [xs]) .2) === xs, (2 [[1, 2]]).##]
# [<>, (), <>, 4]
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
# $!.numeric-domain %% FrameDecimal FrameCount
```
Zero and unsupported domains return stable errors
```
; 1 / (1 - 1)
# $!.division-by-zero /
; 1 %% (1 - 1)
# $!.modulo-by-zero %%
; 1.408.555 + 1
# $!.numeric-domain + FrameSequence FrameCount
; 1.408.555.< 2
# $!.numeric-domain < FrameSequence FrameCount
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
# $!.numeric-range ** FrameCount
```
An aggregate's repetition applies nothing, so the application bound leaves it
alone. Its answer is bounded instead, at 1,000,000 elements, and refused with
the error repeated text uses. A negative or fractional count fails as it does
for text
```
; (65537 [1]).#
# 65537
; 1000001 [1]
# $!.repetition-size 1000000
; (0 - 1) [1]
# $!.repetition-count -1
; 3.14 [1]
# $!.repetition-domain FrameDecimal
```
Counts (#407). Every nonnegative integer literal is a `FrameCount`, the root of
the ladder, and prints as the same integer does. A sequence's refusal names the
class of its other operand, which is how these examples observe the rung
```
; 1.408.555 + 0
# $!.numeric-domain + FrameSequence FrameCount
; 1.408.555 + 1234567890
# $!.numeric-domain + FrameSequence FrameCount
; 1.408.555 + -1
# $!.numeric-domain + FrameSequence FrameInt
```
Counts are closed under `+`, `*`, `%%`, and a nonnegative integral `**`
```
; 1.408.555 + (2 + 3)
# $!.numeric-domain + FrameSequence FrameCount
; 1.408.555 + (2 3)
# $!.numeric-domain + FrameSequence FrameCount
; 1.408.555 + (7 %% 3)
# $!.numeric-domain + FrameSequence FrameCount
; 1.408.555 + (2 ** 3)
# $!.numeric-domain + FrameSequence FrameCount
```
Negation and subtraction answer `FrameInt` whatever the sign of the result, and
division answers a ratio, which collapses to `FrameInt` when it is whole
```
; 5 - 3
# 2
; 1.408.555 + (5 - 3)
# $!.numeric-domain + FrameSequence FrameInt
; 1.408.555 + -0
# $!.numeric-domain + FrameSequence FrameInt
; 1.408.555 + (6 / 3)
# $!.numeric-domain + FrameSequence FrameInt
; 7 / 2
# 7/2
```
Mixed operands follow the ladder
```
; 1.408.555 + (2 + (0 - 3))
# $!.numeric-domain + FrameSequence FrameInt
; 1.408.555 + (2 * 1.5)
# $!.numeric-domain + FrameSequence FrameDecimal
; 7 %% (0 - 3)
# -2
```
Comparison and `=` compare values across rungs, so a count and a FrameInt of the
same value are `=`. `==`, `===` and `~~` compare exact types, so the two are
not `==`, just as `2` and `2.0` are not
```
; 2 = (5 - 3)
# <>
; (5 - 3) = 2
# <>
; 2 == (5 - 3)
# ()
; (5 - 3) == 2
# ()
; 2 === (5 - 3)
# ()
; 2 == 2.0
# ()
; ~~2 (5 - 3)
# $!.type-error ~~2 2
; ~~(5 - 3) 2
# $!.type-error ~~2 2
; (0 - 1).< 0
# <>
; 2.<= (5 - 3)
# <>
; 2.< 2.5
# <>
```
Within one rung, `==` and `~~` hold as they always have
```
; 2 == (1 + 1)
# <>
; (5 - 3) == (4 - 2)
# <>
; ~~2 3
# 3
; ~~(0 - 1) (0 - 5)
# -5
