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
Test types
```
; <> 1
# <>
; <> ()
# <>
; .one <1> 1
# .one 1
; @one 2
#  $!.type-error .one <1> 2
; @enum123 <1,2,3>; # Enumerated list of valid values
