#!/usr/bin/env hc
```
Modules
A module is HC source read through a resource. `name <- resource` evaluates
that source in a fresh namespace and binds the namespace to `name` only once
every form has succeeded, so everything the module declares is reached here
qualified, through `Figures`, and nothing it declares lands in this file.

Every file in the repository's `hc/` folder ships with the package, so a
session can include any of them. `'./hc/figures.hc'` names one. The path is
relative to the root binding, not to this file or to the working directory. The
CLI's root is a fresh temporary directory, and the harness lays the bundled
files over it read-only, so this import reads the bytes of `hc/figures.hc`,
which every host compiles in, so the same import works in the compiled binary,
the npm package, and the browser playground. That file is a testdoc too: its
claims count when it is run directly, and none of them count here. Importing does not yet skip its
examples, which run as ordinary forms and leave their names in the namespace, so
the claims below use only the module's reusable vocabulary
```
; Figures <- './hc/figures.hc';
```
`Figure [c, …]` is the constructor, and every observer is a method that answers
a Figure. Size answers a tally, one unit cell `U` for every cell, while Manyness
marks only the immediate children
```
; [(Figures.Z.size()) = Figures.Z, (Figures.U.size()) = (Figures.Figure [Figures.U])]
# [<>, <>]
; ((Figures.Figure [Figures.U, Figures.U]).many()) = (Figures.Figure [Figures.B, Figures.B])
# <>
; ((Figures.Figure [Figures.B]).children .0) === Figures.B
# <>
; (“E is ” Figures.E) = “E is [[], [[]]]”
# <>
```
Sameness of form is `=` and sameness of the constructed Figure is `===`, so `B`
and a fresh `Figure [A]` agree in form and in Size but are not the same Figure
```
; .fresh (Figures.Figure [Figures.A]);
; [Figures.B.sameform fresh, Figures.B.size_equivalent fresh, Figures.B.sameness Figures.B, Figures.B.sameness fresh] = [Figures.B, Figures.U, Figures.B, Figures.A]
# <>
```
Imported methods compose with Figures built in this file, each with
`Figures.Figure`. Size counts the cells of a Figure sum and of a Figure product.
On tallies, joining is a reduce, `ys | x`. `size_mul` multiplies, and `Tally Z`
collects a reduce
```
; .duo (Figures.Figure [Figures.U, Figures.U]);
; .trio (Figures.Figure [Figures.U, Figures.U, Figures.U]);
; .six (Figures.Figure [Figures.U, Figures.U, Figures.U, Figures.U, Figures.U, Figures.U]);
; [(duo.size()) = duo, ((duo.mul trio).size()) = six, (duo.size_mul trio) = six]
# [<>, <>, <>]
; (trio.children | (Figures.Figure [Figures.U])) = (Figures.Figure [Figures.U, Figures.U, Figures.U, Figures.U])
# <>
; (([Figures.Figure [Figures.U], Figures.Figure [Figures.U]] | (Figures.Tally Figures.Z)).row) = duo
# <>
```
Identity crosses the import boundary. Withness asks for immediate containment
by `===`, so the module's own `A` is with a parent built here, while a fresh
`Figure []` of the same form is not
```
; .pair (Figures.Figure [Figures.A, Figures.B]);
; [pair.withness [Figures.A], pair.withness [Figures.Figure []]] = [Figures.B, Figures.A]
# <>
```
The overlay grants reads of the bundled files and nothing else. Writing to one is
refused,
and every other path still resolves inside the fresh root, including
`deno.json`, which exists in the working directory whether the CLI runs from the
repository root or from `cli/`, and a path under `hc/` that ships no file
```
; './hc/figures.hc' “overwrite”
# $!.resource-read-only './hc/figures.hc'
; './deno.json' | “”
# $!.resource-absent './deno.json'
; './hc/other.hc' | “”
# $!.resource-absent './hc/other.hc'
