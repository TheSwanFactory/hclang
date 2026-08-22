#!/usr/bin/env hc
`Executable canonical-rendering coverage. Each source line is evaluated and its
printed result is checked by HCTest; this is not a parse-only formatter suite.`

; {1}
# { 1 }
; {_}
# { _ }
; { _ + 1 }
# { _ + 1 }

; [1,2,3]
# [1, 2, 3]

; { { _ + __ } } 10 5
# 15
; {_^.value} (.value 9;)
# $!.name-missing...

; 0xabc
# 0xabc
