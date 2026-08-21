; {} [“Life, ” “The Universe, ” “Everything.”]
# (“Life, The Universe, Everything.”)
; .x (6 * 7)
# .x 42
; x
# 42
; .y 7
# .y 7
; [.x 11; @y 3;].x
# 11
; x
# 42
; y
# 3
; .base [.key 42;]
# .base [(.key 42); .key 42;]
; base .key
# 42
; {.key 113} base
# 113
; base .key
# 113
; [.a 1; .b 2;].c
# $!.name-missing “...
; .k 7
# .k 7
; [10] | { _^.k }
# [7]
; [10, 20, 30] | { . }
# [0, 1, 2]
; [1, 2, 3] & { . + _ }
# 6
