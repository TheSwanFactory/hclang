#!/usr/bin/env hc
“Hello, Homoiconicity!”
`docString 1`
```docString 2```
```
docString 3
```
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
Test types
```
; Empty schema accepts any value
; .x <> 42
# 42
; Number enumerations
; .option <1,2,3> 2
# .option 2
; @option 3
# .option 3
; @option 4
# $!.type-error .option <1,2,3> 4
; Single value schema (constant)
; .const <42> 42
# .const 42
; @const 43
# $!.type-error .const <42> 43
; Multiple valid assignments
; .x <1,2> 1
# .x 1
; @x 2
# .x 2
; @x 1
# .x 1
; Original tests
; <> 1
# <>
; <> ()
# <>
; .one <1> 1
# .one 1
; @one 2
# $!.type-error .one <1> 2
```
Future: String schemas (not yet implemented)
```
; .color <"red","green","blue"> "red"  # Would validate string enums
; .status <"ok"> "ok"                   # Would validate string literals
```
HLIR advanced types (aspirational)
```
; .x <i32> 42                           # Primitive types
; .mat <tensor<2x3xf32>> [[1,2,3]]      # Tensor types
; .f <(.x <i32>) -> <i32>> {x + 1}      # Function signatures
