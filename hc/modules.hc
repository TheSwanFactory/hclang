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
claims count when it is run directly, and none of them count here. Importing
skips its examples, the lines that begin `; ` outside prose, so only its code
runs and the namespace holds only what the module declares
```
; Figures <- './hc/figures.hc';
```
A Figure is now an ordinary native nested frame, so `Figure [c, …]` is the
identity on the native array `[c, …]` and the Figures module is an observational
layer of top-level operations, each taking the frame as its argument. Size
counts native terminals `[]`, while Manyness marks only the immediate elements
```
; [(Figures.count Figures.A) = 1, (Figures.count Figures.B) = 1]
# [<>, <>]
; (Figures.many [Figures.B, Figures.B]) = [Figures.B, Figures.B]
# <>
; ([Figures.A, Figures.B] .1) === Figures.B
# <>
; (“E is ” (Figures.Figure [Figures.A, Figures.B])) = “E is [[], [[]]]”
# <>
```
Sameness of form is `=` and sameness of the constructed frame is `===`, so `B`
and a fresh `Figure [A]` agree in form but are not the same frame. A native
frame owns identity, so `===` is reference equality
```
; .fresh (Figures.Figure [Figures.A]);
; [(Figures.sameform Figures.B fresh), (Figures.sameness Figures.B Figures.B), (Figures.sameness Figures.B fresh)]
# [<>, <>, ()]
```
Imported operations compose with Figures built in this file as native arrays.
Count reads the terminals of a sum and of a product. Inlay places y at each
terminal preserving nesting, while `mul` splices y once per terminal flat, so
their terminal counts agree
```
; .duo [[], []];
; .trio [[], [], []];
; [(Figures.count duo) = 2, (Figures.count ((Figures.inlay duo) trio)) = 6, (Figures.count ((Figures.mul duo) trio)) = 6]
# [<>, <>, <>]
; (Figures.form [[[]], [[]]]) = [[[]], [[]]]
# <>
; (Figures.count [[[], []], [[], [], []]]) = 5
# <>
```
Identity crosses the import boundary. Withness asks for immediate containment
by `===`, so a shared child built here is with a parent built here, while a
fresh `Figure []` of the same form is not
```
; .a0 (Figures.Figure []); .pair [a0, Figures.B];
; [(Figures.withness pair [a0]), (Figures.withness pair [Figures.Figure []])]
# [[[]], []]
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
