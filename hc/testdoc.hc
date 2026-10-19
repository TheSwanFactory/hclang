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
## A document publishes its characters without its fences
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
## Empty schema accepts any value
; .x <> 42
# 42
## Number enumerations
; .option <1,2,3> 2
# .option 2
; @option 3
# 3
; @option 4
# $!.type-error .option <1, 2, 3> 4
## Single value schema (constant)
; .const <42> 42
# .const 42
; @const 43
# $!.type-error .const <42> 43
## Multiple valid assignments
; .x <1,2> 1
# 1
; @x 2
# 2
; @x 1
# 1
## Original tests
; <> 1
# <>
; <> ()
# <>
; .one <1> 1
# .one 1
; @one 2
# $!.type-error .one <1> 2
## Boolean and first-class type operations
; ().!
# <>
; <>.!
# ()
; 1 ~ <>
# <>
; 2 ~ ()
# ()
; “Q” ~ ~~“”
# <>
; “Q” ~ ~~1
# ()
## Closure signatures apply defaults, require bare fields, and allow extras
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
## Binary truth table for ordinary frames and raw nil: `:` answers a frame itself
; 1 ? {2 + 2}
# 4
; 1 : {2 + 2}
# 1
; () ? {2 + 2}
# ()
; () : {2 + 2}
# 4
## The selected callable may itself return nil
; 1 ? {()}
# ()
; () : {()}
# ()
## Dotted comparisons produce Frame.all or Frame.nil predicates
; 1.> 5 ? {100}
# ()
; 1.> 5 : {10}
# 10
; 5.> 1 ? {100}
# 100
; 5.> 1 : {10}
# <>
## Chained conditionals answer the taken branch
; 1.> 5 ? (2 * 50) : 10
# 10
; 5.> 1 ? (2 * 50) : 10
# 100
## A taken branch that answers nil falls through to the else branch
; 5.> 1 ? {()} : {10}
# 10
```
Figures: construct with optional children, observe with Figure answers
```
; .A []; .B [A]; .E [A, B]; .B2 [A];
## Reuse and resemblance are different rungs of the equality ladder
; [B = B2, B == B2, B === B2]
# [<>, <>, ()]
; (E .0) === A
# <>
## A plain conditional answers a Figure from either branch
; .same {((_ .0) === (_ .1)) ? {B} : {A}};
; same [B, B]
# [[]]
; same [B, B2]
# []
## Box a branch that answers nil, so it does not fall through
; .rest {((_ && {(((_ .0) = .0) ? {[()]} : {[[__ .1]]}) .0}) | []) & {_ .0}};
; rest E
# [[[]]]
## Observing a Figure through a plain name does not write onto it
; E & {.o _; o};
; E
# [[], [[]]]
```
Quote delimiters
```
## Curly quotes nest without an escape character
; “a “b” c”
# “a “b” c”
## The ASCII quote is an input spelling of the same value
; "ascii"
# “ascii”
; ""
# “”
## An odd ASCII run selects nesting depth, so shorter runs are content
; """x "" y"""
# “x "" y”
## Single quotes name a resource without authorizing it
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
HLIR advanced types (aspirational)
```
; .x <i32> 42                           # Primitive types
# $!.unimplemented .x 42
; .mat <tensor<2x3xf32>> [[1,2,3]]      # Tensor types
# $!.unimplemented .mat...
; .f <(.x <i32>) -> <i32>> {x + 1}      # Function signatures
# $!.unimplemented .f...
