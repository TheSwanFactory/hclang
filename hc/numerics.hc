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
; (1 / 2.0) ** 2
# 0.25
```
An exponent that is not whole, rational or host number, answers a host number
```
; 2 ** (1 / 2)
# 1.4142135623730951
; 2 ** (1 / 2.0)
# 1.4142135623730951
```
Unary `+` and `-` keep the operand's rung. `+` writes the sign into an unsigned
spelling and leaves a signed one alone, and a sequence keeps its spelling too
```
; + 1.5
# +1.5
; + (0 - 3)
# -3
; + (1 / 3)
# +1/3
; + (2 ** 1.5)
# +2.8284271247461903
; + 1.408.555
# +1.408.555
; - 1.5
# -1.5
; - (1 / 3)
# -1/3
; - (2 ** 1.5)
# -2.8284271247461903
```
A quotient with a host-number side is computed from the exact operands when an
operand is too large for a host number, and a quotient still too large for one
is `Infinity`
```
; (10 ** 400) / 3.0
# Infinity
; ((10 ** 400) / 3) / 2.0
# Infinity
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
# [<>, (), <>, 6]
```
Cross-rung promotion and modulo on every exact rung (#536)
```
; 1 + 2.5
# 3.5
; 1.5 + (1 / 3)
# 11/6
; 3.%%2
# 1
; 3.0 %% 2
# 1.0
; [3.14 %% 1, (0 - 3.14) %% 1, (7 / 2) %% 1, (0 - 7) %% 2, 7 %% (0 - 2), 3.5 %% (1 / 3)]
# [0.14, 0.86, 1/2, 1, -1, 1/6]
; [3.14 - (3.14 %% 1), (7 / 2) - ((7 / 2) %% 1)]
# [3.00, 3]
; (1 / 3.0) %% 1
# $!.numeric-domain %% FrameNumber FrameCount
; 3.14 %% (1 / 3.0)
# $!.numeric-domain %% FrameDecimal FrameNumber
; 1.5 %% (1 - 1)
# $!.modulo-by-zero %%
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
Operators with only a numeric meaning refuse any other operand (#361). `%%`,
`**` and the ordering operators answer `$!.numeric-domain` naming the operator
and both operand classes, where they answered nil. For ordering, nil already
means false, so the refusal keeps a comparison that could not run apart from one
that ran and does not hold. Ordering is written dotted, `1.< 3`, since bare `<`
and `>` delimit schemas
```
; [2 %% “a”, “a” %% 2, [1, 2] %% 2]
# [$!.numeric-domain %% FrameCount FrameString, $!.numeric-domain %% FrameString FrameCount, $!.numeric-domain %% FrameArray FrameCount]
; [2 ** “a”, “a” ** 2, [1, 2] ** 2]
# [$!.numeric-domain ** FrameCount FrameString, $!.numeric-domain ** FrameString FrameCount, $!.numeric-domain ** FrameArray FrameCount]
; [1.< “a”, “a”.< 1, [1].< 2]
# [$!.numeric-domain < FrameCount FrameString, $!.numeric-domain < FrameString FrameCount, $!.numeric-domain < FrameArray FrameCount]
; [1.<= “a”, “a”.<= 1]
# [$!.numeric-domain <= FrameCount FrameString, $!.numeric-domain <= FrameString FrameCount]
; [1.> “a”, “a”.> 1]
# [$!.numeric-domain > FrameCount FrameString, $!.numeric-domain > FrameString FrameCount]
; [1.>= “a”, “a”.>= 1]
# [$!.numeric-domain >= FrameCount FrameString, $!.numeric-domain >= FrameString FrameCount]
```
Scalar division refuses the same pairs as `$!.division-domain /`, the error a
list's bad divisor answers. An operand that is already an error is answered
first, left before right
```
; [1 / “text”, “text” / 1, “a” / “b”]
# [$!.division-domain /, $!.division-domain /, $!.division-domain /]
; [(1 / 0) %% “a”, “a”.< (1 / 0), (1 / 0) ** (2 %% “a”)]
# [$!.division-by-zero /, $!.division-by-zero /, $!.division-by-zero /]
```
A program that used `:` as a fallback for one of these cases changes: the
refusal is an error, so neither branch runs and the error is the answer. The
catch operator `$!` recovers instead
```
; (2 %% “a”) : {“else”}
# $!.numeric-domain %% FrameCount FrameString
; (2 %% “a”) ? {“then”}
# $!.numeric-domain %% FrameCount FrameString
; (1.< “a”) ? {“then”} : {“else”}
# $!.numeric-domain < FrameCount FrameString
; (2 %% “a”) $! {“else”}
# “else”
```
Two strings order by Unicode code point, character by character, and a proper
prefix comes first (#568). This is not UTF-16 code-unit order: a character
outside the Basic Multilingual Plane, such as `😀` (U+1F600), follows `｡`
(U+FF61), though its first code unit is smaller. Locale-aware collation is not
provided. Text against any other operand is refused as above
```
; [“a”.< “b”, “b”.< “a”, “a”.<= “a”, “a”.< “a”, “a”.>= “a”, “a”.> “a”]
# [<>, (), <>, (), <>, ()]
; [“ab”.< “abc”, “abc”.> “ab”, “abc”.< “ab”, “abc”.<= “abd”]
# [<>, <>, (), <>]
; [“”.< “a”, “”.<= “”, “a”.> “”, “”.> “”]
# [<>, <>, <>, ()]
; [“b”.> “abc”, “é”.> “z”, “B”.< “a”]
# [<>, <>, <>]
; [“｡”.< “😀”, “😀”.> “｡”, “a😀”.< “a｡”]
# [<>, <>, ()]
; [“1”.< 2, 1.>= “2”]
# [$!.numeric-domain < FrameString FrameCount, $!.numeric-domain >= FrameCount FrameString]
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
same value are `=`. `==` and `===` compare exact types, so the two are not `==`,
just as `2` and `2.0` are not. A runtime type from `.<>` refuses a value from a
higher rung, whatever its value, but admits a lower one (below)
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
; (2).<> (5 - 3)
# $!.type-error (2).<> 2
; (5 - 3).<> 2
# 2
; (0 - 1).< 0
# <>
; 2.<= (5 - 3)
# <>
; 2.< 2.5
# <>
```
Within one rung, `==` and type application hold as they always have
```
; 2 == (1 + 1)
# <>
; (5 - 3) == (4 - 2)
# <>
; (2).<> 3
# 3
; (0 - 1).<> (0 - 5)
# -5
```
A numeric type admits a value from its own rung or any lower rung, on the ladder
count, int, decimal, rational, number. `~` and a schema ask the same question,
and the schema binds the value unchanged, so the declared type is a ceiling and
arithmetic follows the value (#410)
```
; .IntType <(0 - 1).<>>;
; .DecType <1.5.<>>;
; .NumType <(1 / 3.0).<>>;
; .CountType <2.<>>;
; 5 ~ (0 - 1).<>
# <>
; .int-of-count <IntType> 5
# .int-of-count 5
; (0 - 5) ~ (0 - 1).<>
# <>
; .int-of-int <IntType> (0 - 5)
# .int-of-int -5
; 2 ~ 1.5.<>
# <>
; .dec-of-count <DecType> 2
# .dec-of-count 2
; 2 ~ (1 / 3.0).<>
# <>
; .num-of-count <NumType> 2
# .num-of-count 2
; (1 / 2) ~ 1.5.<>
# ()
; .dec-of-rational <DecType> (1 / 2)
# $!.type-error .dec-of-rational <<(1.5).<>>> 1/2
; (5 - 3) ~ 2.<>
# ()
; .count-of-int <CountType> (5 - 3)
# $!.type-error .count-of-int <<(2).<>>> 2
; (0 - 5) ~ 2.<>
# ()
; .count-of-negative <CountType> (0 - 5)
# $!.type-error .count-of-negative <<(2).<>>> -5
; 4.0 ~ (0 - 1).<>
# ()
; 5 == (0 - 1)
# ()
```
A union of the count and int types still works, and now admits exactly what the
int type alone admits
```
; [5 ~ <1.<>, (0 - 1).<>>, (0 - 5) ~ <1.<>, (0 - 1).<>>, 1.5 ~ <1.<>, (0 - 1).<>>]
# [<>, <>, ()]
; [5 ~ <(0 - 1).<>>, (0 - 5) ~ <(0 - 1).<>>, 1.5 ~ <(0 - 1).<>>]
# [<>, <>, ()]
; .union-of-count <1.<>, (0 - 1).<>> 5
# .union-of-count 5
; .union-of-decimal <1.<>, (0 - 1).<>> 1.5
# $!.type-error .union-of-decimal <(1).<>, (-1).<>> 1.5
```
The bound value keeps its own class: a Count bound by an Int type is still
admitted by the Count type, and a Count bound by a Decimal type divides exactly
```
; int-of-count ~ 2.<>
# <>
; .third <1.5.<>> 3;
; 1 / third
# 1/3
