# The PEACE Monad

The key is interpreting arrays with properties as a new monad called the PEACE
monad, which serves as the single primitive for all computation. PEACE Monads
are designed to encapsulate every aspect of computation in a way that is both
empirically testable and theoretically sound. Each Monad contains:

• Properties: Named attributes that can store information. • Enumerables:
Ordered collections of elements, enabling iteration and selection. • Actions:
Functions or transformations that apply to data. • Context: The scope within
which the Monad operates, akin to namespaces or environments. • Effects: The
side-effects produced by the Monad, particularly in cases where state changes or
external systems are involved.

## HCLANG Notation

Use HCLANG notation:

```sh
; input
# output
; .a 1 # assignment
; a # reference
# 1
; a a # operation
# 2
; [] 1 2 3 # array
# [1, 2, 3]
; [] | () # reduce
; .f {a a} # closure
; .g (.a 1)^{a a} # function
```

## Example

```sh
; 1 1
# 2
; .a 1;
# .a 1
; a
# 1
; a a
# 2
; .f {a a}
# .f {a a}
; f()
# 2
; f(.a 2)
# 4
; .g [a, a]
# .g [1, 1]
; g | ()
# 2
; .h [@a, @a]
# .h [a, a]
; h | ()
# 2
; h | (.a 2)
# 4
```
