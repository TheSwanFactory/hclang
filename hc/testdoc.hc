#!/usr/bin/env hc
“Hello, Homoiconicity!”
`docString 1`
```docString 2```
`````docString 5 with ``` shorter backticks`````
```
docString 3
one `backtick` span
two ``backtick`` span
```
; `one-backtick document`
# `one-backtick document`
; ```three-backtick document with `one` and ``two`` spans```
# ```three-backtick document with `one` and ``two`` spans```
; `````five-backtick document with `one` ``two`` ```three``` and ````four```` spans`````
# `````five-backtick document with `one` ``two`` ```three``` and ````four```` spans`````
; ``
# ``
; ````
# ````
; ``````
# ``````
```## A document publishes its characters without its fences```
; `one-backtick document`.body
# “one-backtick document”
; ```body with `one` and ``two`` spans```.body
# “body with `one` and ``two`` spans”
; 123
# 123
; 1234 # trailing comment
# 1234
; #  inline comment before # 4321
# 4321
; 5678 #  inline comment after #
# 5678
```
docString 4
```
; 789
# 789
; 0xabc
# 0xabc
```
Test closures
```
; {}
# {}
; {1}
# { 1 }
; {_}
# { _ }
; { _ }
# { _ }
; { _ + 1 }
# { _ + 1 }
; { _ + 1 } 2
# 3
```
Test identifiers
```
; .a-b 3
# .a-b 3
; a-b
# 3
```
Test array literal properties
```
; [.a 1; .b 2;].a
# 1
```
Test types
```
```## Empty schema accepts any value```
; .x <> 42
# 42
```## Number enumerations```
; .option <1,2,3> 2
# .option 2
; @option 3
# 3
; @option 4
# $!.type-error .option <1, 2, 3> 4
```## Single value schema (constant)```
; .const <42> 42
# .const 42
; @const 43
# $!.type-error .const <42> 43
```## Multiple valid assignments```
; .x <1,2> 1
# 1
; @x 2
# 2
; @x 1
# 1
```## Original tests```
; <> 1
# <>
; <> ()
# <>
; .one <1> 1
# .one 1
; @one 2
# $!.type-error .one <1> 2
```## Boolean and first-class type operations```
; ().!
# <>
; <>.!
# ()
; 1 ~ <>
# <>
; 2 ~ ()
# ()
; “Q” ~ (“”).<>
# <>
; “Q” ~ (1).<>
# ()
```## Closure signatures apply defaults, require bare fields, and allow extras```
; .join-name (.first “Jane”, .last) ^ {last “, ” first};
; join-name (.first “John”, .last “Doe”)
# “Doe, John”
; join-name (.middle “Q”, .last “Doe”)
# “Doe, Jane”
; join-name (.middle “Q”)
# $!invalid-argument-list (.middle “Q”, $!missing-required-argument .last;)
```
Conditionals
```
```## Binary truth table for ordinary frames and raw nil: `:` answers a frame itself```
; 1 ? {2 + 2}
# 4
; 1 : {2 + 2}
# 1
; () ? {2 + 2}
# ()
; () : {2 + 2}
# 4
```## The selected callable may itself return nil```
; 1 ? {()}
# ()
; () : {()}
# ()
```## Dotted comparisons produce Frame.all or Frame.nil predicates```
; 1.> 5 ? {100}
# ()
; 1.> 5 : {10}
# 10
; 5.> 1 ? {100}
# 100
; 5.> 1 : {10}
# <>
```## Chained conditionals answer the taken branch```
; 1.> 5 ? (2 * 50) : 10
# 10
; 5.> 1 ? (2 * 50) : 10
# 100
```## A taken branch that answers nil falls through to the else branch```
; 5.> 1 ? {()} : {10}
# 10
```
Figures: construct with optional children, observe with Figure answers
```
; .A []; .B [A]; .E [A, B]; .B2 [A];
```## Reuse and resemblance are different rungs of the equality ladder```
; [B = B2, B == B2, B === B2]
# [<>, <>, ()]
; (E .0) === A
# <>
```## A plain conditional answers a Figure from either branch```
; .same {((_ .0) === (_ .1)) ? {B} : {A}};
; same [B, B]
# [[]]
; same [B, B2]
# []
```## Box a branch that answers nil, so it does not fall through```
; .rest {((_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) | []) & {_ .0}};
; rest E
# [[[]]]
```## Observing a Figure through a plain name does not write onto it```
; E & {.o _; o};
; E
# [[], [[]]]
```
Quote delimiters
```
```## Curly quotes nest without an escape character```
; “a “b” c”
# “a “b” c”
```## The ASCII quote is an input spelling of the same value```
; "ascii"
# “ascii”
; ""
# “”
```## An odd ASCII run selects nesting depth, so shorter runs are content```
; """x "" y"""
# “x "" y”
```## Single quotes name a resource without authorizing it```
; 'jsr:@swanfactory/hclang'
# 'jsr:@swanfactory/hclang'
; 'jsr:@swanfactory/hclang'.scheme
# “jsr”
; 'docs/hc.md'.path
# “docs/hc.md”
```
String schemas
```
; .color <"red","green","blue"> "red"
# .color “red”
; @color "blue"
# “blue”
; @color "purple"
# $!.type-error .color <“red”, “green”, “blue”> “purple”
; .status <"ok"> "ok"
# .status “ok”
```
Predicate schema candidates
```
; [5 ~ <{_.< 10}>, 50 ~ <{_.< 10}>]
# [<>, ()]
; [0 ~ <0, {_.> 100}>, 101 ~ <0, {_.> 100}>, 50 ~ <0, {_.> 100}>]
# [<>, <>, ()]
; .small-count <{_.< 10}> 5
# .small-count 5
; @small-count 50
# $!.type-error .small-count <{ _ .< 10 }> 50
; “a” ~ <{_.< 10}>
# ()
; <{$!!.too-big}> 5
# $!!.too-big
; .third <{_ ~ 1.5.<>}> 3;
; 1 / third
# 1/3
; .tally 0;
; .bump {@tally (tally + 1); <>};
; <bump>
# $!.schema-predicate-effect
```
HLIR primitive types from hc/hlir.hc (#536)
```
; HLIR <- './hc/hlir.hc';
; .i8 HLIR.i8;
; .i16 HLIR.i16;
; .i32 HLIR.i32;
; .i64 HLIR.i64;
; .u8 HLIR.u8;
; .u16 HLIR.u16;
; .u32 HLIR.u32;
; .u64 HLIR.u64;
; .index HLIR.index;
; .f64 HLIR.f64;
; .int HLIR.int;
; .uint HLIR.uint;
; .floor HLIR.floor;
; .trunc HLIR.trunc;
; .round HLIR.round;
; .record HLIR.record;
; .tensor HLIR.tensor;
; .x <i32> 42
# 42
; .mat <tensor [[2, 3], f64]> [[1, 2, 3], [4, 5, 6]]
# .mat [[1, 2, 3], [4, 5, 6]]
; .slice <tensor [[1, 2], f64]> [[1, 2]]
# .slice [[1, 2]]
; .idx <index> 0
# .idx 0
; .ratio <f64> 3.14
# .ratio 3.14
; .whole <i32> ratio
# $!.type-error .whole <...
; ratio ~ <i32>
# ()
; .truncated <i32> (trunc ratio)
# .truncated 3
; .small <i32> 42
# .small 42
; .wide <f64> small
# .wide 42
```
Function signatures use `^` for the arguments and `^^` for the result
contract. Argument schemas are not checked yet, and checking a closure
value against a function type is a follow-up.
```
; .f (.x <i32>, .y <f64>) ^ {x + y} ^^ <i32>;
; f (.x 1, .y 2)
# 3
; f (.x 1, .y 2.5)
# $!.type-error <...
```
HLIR widths admit both boundaries and refuse one past each
```
; [127 ~ <i8>, 128 ~ <i8>, (0 - 128) ~ <i8>, (0 - 129) ~ <i8>]
# [<>, (), <>, ()]
; [32767 ~ <i16>, 32768 ~ <i16>, (0 - 32768) ~ <i16>, (0 - 32769) ~ <i16>]
# [<>, (), <>, ()]
; [2147483647 ~ <i32>, 2147483648 ~ <i32>, (0 - 2147483648) ~ <i32>, (0 - 2147483649) ~ <i32>]
# [<>, (), <>, ()]
; [9223372036854775807 ~ <i64>, 9223372036854775808 ~ <i64>, (0 - 9223372036854775808) ~ <i64>, (0 - 9223372036854775809) ~ <i64>]
# [<>, (), <>, ()]
; [255 ~ <u8>, 256 ~ <u8>, 0 ~ <u8>, (0 - 1) ~ <u8>]
# [<>, (), <>, ()]
; [65535 ~ <u16>, 65536 ~ <u16>, 0 ~ <u16>, (0 - 1) ~ <u16>]
# [<>, (), <>, ()]
; [4294967295 ~ <u32>, 4294967296 ~ <u32>, 0 ~ <u32>, (0 - 1) ~ <u32>]
# [<>, (), <>, ()]
; [18446744073709551615 ~ <u64>, 18446744073709551616 ~ <u64>, 0 ~ <u64>, (0 - 1) ~ <u64>]
# [<>, (), <>, ()]
; .top <i32> 2147483647
# .top 2147483647
; .over <i32> 2147483648
# $!.type-error .over <...
; [2047 ~ <int 12>, 2048 ~ <int 12>, 4095 ~ <uint 12>, 4096 ~ <uint 12>]
# [<>, (), <>, ()]
```
HLIR widths refuse text
```
; [“42” ~ <i32>, “42” ~ <u8>, “42” ~ <index>, “42” ~ <f64>]
# [(), (), (), ()]
; .label <i32> “42”
# $!.type-error .label <...
```
HLIR integer widths refuse non-integers; f64 admits them
```
; [3.14 ~ <i32>, (7 / 2) ~ <i64>, 3.14 ~ <u8>, 4.0 ~ <i32>, 3.14 ~ <index>]
# [(), (), (), (), ()]
; [(0 - 1) ~ <u8>, (5 - 3) ~ <u8>, 3.14 ~ <f64>, (7 / 2) ~ <f64>]
# [(), (), <>, <>]
```
HLIR conversions answer the Int rung
```
; [floor 3.7, floor (0 - 3.7), trunc 3.7, trunc (0 - 3.7), round 2.5, round (0 - 2.5), round 2.4, round (7 / 2)]
# [3, -4, 3, -3, 3, -3, 2, 4]
```
HLIR records admit exactly their properties
```
; .complex (record [.re f64; .im f64]);
; .z <complex> [.re 1.5; .im 2;]
# .z [.re 1.5; .im 2;]
; [.re 1.5;] ~ <complex>
# ()
; [.re 1.5; .im 2; .k 0;] ~ <complex>
# ()
; [.re 1.5; .im “two”;] ~ <complex>
# ()
; [.re 1.5; .im 2; 7] ~ <complex>
# ()
; 1.5 ~ <complex>
# ()
; .pixel (record [.x i32; .y u8]);
; [[.x (0 - 5); .y 255;] ~ <pixel>, [.x 1; .y 256;] ~ <pixel>]
# [<>, ()]
```
HLIR tensors check shape and leaf
```
; .m23 (tensor [[2, 3], f64]);
; [[1, 2, 3], [4, 5, 6]] ~ <m23>
# <>
; [[1, 2, 3]] ~ <m23>
# ()
; [[1, 2], [3, 4]] ~ <m23>
# ()
; [[1, 2, 3], [4, 5, “x”]] ~ <m23>
# ()
; 7 ~ <m23>
# ()
; [[[1, 2, 3], [4, 5, 6]] ~ <tensor [[2, 3], i32]>, [[1.5, 2, 3], [4, 5, 6]] ~ <tensor [[2, 3], i32]>]
# [<>, ()]
