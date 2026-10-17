#!/usr/bin/env hc
```
Modules
A module is HC source read through a resource. `name <- resource` evaluates
that source in a fresh namespace and binds the namespace to `name` only once
every form has succeeded, so everything the module declares is reached here
qualified, through `Figures`, and nothing it declares lands in this file.

`'./modules/figures.hc'` names a standard module. The path is relative to the
root binding, not to this file or to the working directory. The CLI's root is a
fresh temporary directory, and the harness lays exactly one read-only entry over
it, so this import reads the bytes of the maintained artifact,
`lib/modules/figures.hc`, which every host compiles in, so the same import works
in the compiled binary, the npm package, and the browser playground. That
artifact is a testdoc too: its claims count when
it is run directly, and none of them count here. Importing does not yet skip its
examples, which run as ordinary forms and leave their names in the namespace, so
the claims below use only the module's reusable vocabulary
```
; Figures <- './modules/figures.hc';
```
`Figure [c, …]` is the constructor, and every observer is a method that answers
a Figure. Size answers a tally, one unit cell `U` for every cell, while Manyness
marks only the immediate children
```
; Figures.Z.size()
# []
; Figures.U.size()
# [[[]]]
; (Figures.Figure [Figures.U, Figures.U]).many()
# [[[]], [[]]]
; Figures.Figure [Figures.B]
# [[[]]]
```
Sameness of form is `=` and sameness of the constructed Figure is `===`, so `B`
and a fresh `Figure [A]` agree in form and in Size but are not the same Figure
```
; Figures.B.sameform [Figures.Figure [Figures.A]]
# [[]]
; Figures.B.size_equivalent [Figures.Figure [Figures.A]]
# [[]]
; Figures.B.sameness [Figures.B]
# [[]]
; Figures.B.sameness [Figures.Figure [Figures.A]]
# []
```
Imported methods compose with Figures built in this file, each with
`Figures.Figure`. Size counts the cells of a Figure sum and of a Figure product.
On tallies, joining is a reduce, `ys | x`. `size_mul` multiplies, and `Tally Z`
collects a reduce
```
; ((Figures.Figure [Figures.U, Figures.U]).size()) = (Figures.Figure [Figures.U, Figures.U])
# <>
; .trio (Figures.Figure [Figures.U, Figures.U, Figures.U]);
; ((Figures.Figure [Figures.U, Figures.U]).mul [trio]).size()
# [[[]], [[]], [[]], [[]], [[]], [[]]]
; trio | (Figures.Figure [Figures.U])
# [[[]], [[]], [[]], [[]]]
; (Figures.Figure [Figures.U, Figures.U]).size_mul [trio]
# [[[]], [[]], [[]], [[]], [[]], [[]]]
; ([Figures.Figure [Figures.U], Figures.Figure [Figures.U]] | (Figures.Tally Figures.Z)) .row
# [[[]], [[]]]
```
Identity crosses the import boundary. Withness asks for immediate containment
by `===`, so the module's own `A` is with a parent built here, while a fresh
`Figure []` of the same form is not
```
; .pair (Figures.Figure [Figures.A, Figures.B]);
; pair.withness [Figures.A]
# [[]]
; pair.withness [Figures.Figure []]
# []
```
The overlay grants one read and nothing else. Writing to the module is refused,
and every other path still resolves inside the fresh root, including
`deno.json`, which exists in the working directory whether the CLI runs from the
repository root or from `cli/`, and a sibling of the module
```
; './modules/figures.hc' “overwrite”
# $!.resource-read-only './modules/figures.hc'
; './deno.json' | “”
# $!.resource-absent './deno.json'
; './modules/other.hc' | “”
# $!.resource-absent './modules/other.hc'
