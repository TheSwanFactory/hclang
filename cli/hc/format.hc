#!/usr/bin/env hc
Format coverage
```
# Closures: body padded with single spaces
; {1}
# { 1 }
; {_}
# { _ }
; { _ + 1 }
# { _ + 1 }

# Arrays: comma+space, no trailing comma
; [1,2,3]
# [1, 2, 3]

# Comments: preserved inline
; 42 # trailing comment
# 42 # trailing comment
; # leading comment attaches to next statement
; 7
# 7

# Anonymous args and parents
; { { _ + __ } } 10 5
# 15
; {_^.value} (.value 9;)
# 9

# Numeric literals: hex preserved
; 0xabc
# 0xabc

# Multiline pretty: closure body breaks and indents
; {
;   _ + 1;
;   x + y;
; }
# {
#   _ + 1;
#   x + y;
# }

# Multiline pretty: array breaks, no trailing comma
; [
;   long_value_one,
;   long_value_two,
;   long_value_three
; ]
# [
#   long_value_one,
#   long_value_two,
#   long_value_three
# ]
```
