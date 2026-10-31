# CHANGELOG

> Create concise entries for changes since the last tag User-visible changes
> only (ignore internal cleanup) one-line per change Ignore spec documents, and
> deprioritize test-only changes

## v0.37.1 2026-10-30

- **Figures uses native observations and incidence.** Remove `pure`, `need` and
  `withness`: branch on `x.###` (including valid zero), use the observed frame
  directly, and replace collective membership with ordinary iteration over
  `~~~`. This deliberately removes the three bundled module exports.
- **Gap and Spin remain derived mathematical abbreviations.** Preserve FrameInt
  Gap, signed Spin, host refusal and positive Count divisor checks;
  construction, Size, residual, identity incidence and Star use native HC.

## v0.37.0 2026-10-30

- **Native Size covers represented quantities.** `.##` now returns exact
  truncated numeric magnitude, Unicode code-point string/document length, blob
  bit width, byte payload length, enumeration alternative count, or one opaque
  occurrence for other atoms and type descriptions. Nonfinite numeric values
  refuse Size; temporal and unit-bearing atoms acquire no implicit measurement
  unit.
- **Changed aggregate weighting:** recursive `.##` uses each child's native
  Size: `[5, “hello”].##` changes from 6 to 10 and `[<1, 2>, 3].##` from 6 to 5.
  Empty aggregates retain Size 1; sharing counts per occurrence, metadata stays
  excluded, and true containment cycles refuse. Cyclic handle/scope reference
  chains refuse with `$!.cyclic-reference` before Size traversal starts.
- **Signed residual accepts mixed arrays and evaluated groups.** `.###`
  alternates complete immediate child Sizes as a FrameInt: `[5, “hello”].###` is
  0 and `(5, 3).###` is 2. Existing pure-array results remain. Atoms, schemas,
  expressions and closures have no residual; cyclic/nonquantifiable walks yield
  nil. Figures helpers remain available and follow this native domain.

## v0.36.1 2026-10-30

- **Restore JSR publication.** Explicitly type the count syntax metadata so
  public declarations resolve correctly. CI now validates the library package
  before release. Includes the v0.36.0 membership and type-accessor changes.

## v0.36.0 2026-10-30

- **Immediate membership on ordinary element hosts mirrors equality.** `f ~ P`,
  `f ~~ P` and `f ~~~ P` use `=`, `==` and `===` over P's immediate elements,
  returning native truth or nil. On schema/runtime matcher hosts, `~` retains
  rich matcher acceptance. Properties, parents and descendants are excluded;
  `point ~~~ line` expresses incidence. `Figures.withness` derives collective
  membership through ordinary iteration and retains vacuous truth.
- **Breaking: runtime type extraction is `F.<>`.** Replace `~~F` with `F.<>`,
  e.g. `~~1` → `1.<>` and `<~~1>` → `<1.<>>`. Named values extract the
  referent's runtime class; closure access does not execute the body. Binary
  `~~` now means typed membership.
- **Breaking: binding schema retrieval is `name.<^>`.** Replace `name.<>` with
  `name.<^>` to read its declared schema; `name.<>` consistently reads the
  value's runtime type. Stored schema metadata and assignment validation are
  unchanged. Existing `value ~ schema` (including nested structural and bit
  matchers) retains rich matching; `value ~ [elements]` now tests membership.

## v0.35.0 2026-10-30

- **Star composes frames through `*`.** Nested-array hosts replace each empty
  terminal with the right operand, sharing its identity and preserving nesting
  and nonterminal metadata. Use native `*` directly; the named `Figures.inlay`
  wrapper is removed. Terminals carrying metadata or statements are refused to
  avoid discarding them.
- **Counts construct occurrences.** `2 * [[]]` is `[[[]], [[]]]`; `0 * [[]]`
  remains count `0` with Size 0. Numeric pairs retain existing multiplication.
  Nested count leaves use the same rule, so `([[], []] * 3) * [[]]` can compose
  again.
- **Breaking: nested counts contribute their Size to `.##`.** `[3, 3].##` is now
  6, so `([[], []] * 3).##` is 6. This applies to all aggregate kinds, including
  groups, schemas, closures and mixed trees: `{4 + 5}.##` is now 10. Other atoms
  and `[]` still contribute one; `.#` and `.###` are unchanged.

## v0.34.0 2026-10-30

- **`.###` is a Figure's signed residual.** On a nested array it answers
  `x₁.## − x₂.## + x₃.## − …` over the immediate elements, always as a FrameInt:
  `[].###` is `0`, `[[]].###` is `1` and `[[], [[], []]].###` is `-1`.
  Properties and declared parents are ignored at every level. Atoms, strings,
  mixed trees, groups, schemas, closures and cycles answer nil; `.####` is
  `.###` before a comment (#455).
- **Figure observations ignore metadata.** `pure x` is now the native `.###`
  check, so an array with properties or a declared parent is a Figure;
  `gap`/`spin` measure only elements. `inlay` preserves nonterminal properties
  and parents. `gap x` is `|x.###|` and `spin x N` is `x.### / N`; `gap []` is
  now the FrameInt `0`, like every other Gap (#455).

## v0.33.0 2026-10-30

- **Breaking: `.##` counts structural terminals.** Empty aggregates now count as
  one, including nested empty frames, empty closures and property-only
  aggregates; `[].##` is `1` and `[1, [2, []]].##` is `3`; `.#` is unchanged
  (#454).
- **Breaking: Figures use native operations directly.** `Figure`, `form`,
  `count`, `size`, `cells`, `many`, `mul`, `sameform`, `sameness`,
  `size_equivalent` and the `A`/`B`/`Z`/`U` aliases are removed; use brackets,
  `.##`, `.#`, native repetition (`x.## [[]]` gives terminal-shaped output), `=`
  and `===`. Gap and Spin read `.##` directly (#454).
- **Breaking: Withness returns a native boolean.** Immediate containment by
  identity now answers `<>` or `()`, replacing `[[]]` or `[]` (#454).
- **The bundled `hc/modules.hc` tutorial is removed.** Import documentation
  lives in `doc/LANGUAGE.md`; reading `'./hc/modules.hc'` now answers
  `$!.resource-absent` (#454).

## v0.32.1 2026-10-28

- **Spin's N is typed as a count.** `x.spin N` now binds N as `.n <~~1>`, the
  count type, so a non-count N — a fraction `1/2`, a float `2.5`, a negative
  `-1`, a string `“3”` — is refused with a native `$!.type-error` instead of
  being hidden behind a division-by-zero. A count N=0 still passes the type and
  is the native `$!.division-by-zero`, and `(5,2).spin 3` is `1` (#449, #447).

## v0.32.0 2026-10-28

- **A Figure has a Spin.** `x.spin N` answers the signed alternating sum of the
  Sizes of x's immediate children, `Size(F₁) − Size(F₂) + Size(F₃) − …`, divided
  by a positive resolution N, as an exact FrameRational in revolutions. It folds
  the same readings Gap does and keeps the sign Gap drops, so `(2,5)` reads
  `−3/4` and `(5,2)` reads `3/4` at N=4, and Gap stays `|Spin × N|`. A
  non-positive N is the native `$!.division-by-zero`. A zero Spin is an
  observation, not a claim that a Walk is closed (#447).

## v0.31.0 2026-10-28

- **A Figure has a Gap.** `x.gap()` answers the absolute value of the
  alternating sum of the Sizes of x's immediate children,
  `|Size(F₁) − Size(F₂) + Size(F₃) − …|`, as a FrameCount. The empty Figure has
  Gap `0`, and children of Sizes 2, 5 and 3 have Gap `0`. A zero Gap is an
  observation, not a claim that a Walk is closed (#445).

## v0.30.0 2026-10-26

- **A comma in a closure body collects, as everywhere else.** Terms separated by
  `,`, or by a newline, are one expression whose value is the group of their
  values, so `{3, 4} ()` is `(3, 4)`, as `3, 4` is at top level. It was `12`,
  the terms juxtaposed. Likewise `[1, 2] & {_, 0}` is `[(1, 0), (2, 0)]`. `;`
  still sequences, and the group's declarations land in the call's frame, so
  `{.a 1, .b 2; a + b} ()` is still `3` (#443, `spec/a16`).
- **A file can be read as a closure, without running it.** `'./f.hc' | {}`
  answers the file's source as an unevaluated closure. Nothing in it runs, and
  no import in it is read, until it is called. Walking it shows its syntax
  exactly as the same text written in braces would show it, and calling it
  answers the group of its lines' values (#443, `spec/a18`).

## v0.29.1 2026-10-26

- **A named import's alias of a caller binding is refused.** The module reads
  its caller through a read-only view, and `@a 5` aimed at the caller's `a`
  answered `5` while writing nothing anywhere. It now answers
  `$!.read-only-scope @a`, so the import fails visibly. A local import,
  `. <- …`, still writes the caller's binding (#441).

## v0.29.0 2026-10-25

- **A fold resumes a walk where its closure was bound.** A walk is evaluation
  stopped before each term's last step, so each atom now holds the scope its
  closure was bound in, and `|` finishes the evaluation there:
  `({f o.x} & {_}) | ()` finds `f` and `o` as `{f o.x} | ()` does. The receiver
  still comes first, declarations land in a fresh frame, and atoms walked from
  two closures each resume in their own scope, never the fold's. A resumed alias
  that would write the closure's scope is refused, `$!.resumed-write`
  (`spec/a17`).
- **A walk discloses what its closure names, read-only.** Resuming a word reads
  the value its name is bound to, even one the closure never returns:
  `.s 42; .f {.k s; 0}; [((f & {_}) .1)] | ()` is `42` (`spec/a17` §4).

## v0.28.0 2026-10-25

- **A source aggregate walks and prints as a body.** A group or array written in
  a closure body walked to its values' positions only, dropping its `;`
  statements, and printed each statement in parentheses. It now walks as the
  closure does, with `;` and `,` kept and its names bound, and prints as
  written: `.f {.a 1; (.a 2; a)}` walks its group to `[.a, 2, ;, a]` and prints
  `{ .a 1; (.a 2; a) }` (`spec/a16`). An evaluated aggregate is unchanged.

## v0.27.0 2026-10-25

- **The Concrete Semantics Graph.** The parser no longer emits its `FrameBind`
  and one-term `FrameExpr` wrappers, which did nothing at evaluation but printed
  as `((+))` and doubled the depth of every walk. Terms that abut, as `o.x` in
  `f o.x`, stay one tight expression, since they bind before `f` applies
  (`spec/a16`).
- **An aggregate literal's own declarations are searched first.** A name a group
  or array literal declared read the enclosing binding when one existed:
  `.gb 1; (.gb 2; gb)` was `(.gb 2; 1)` and is now `(.gb 2; 2)`, as spec 7 §2
  orders. A named import evaluated during a construction keeps seeing the file
  first (#391).
- **A walk keeps every distinction.** `,` between terms is an atom, as `;` is; a
  tight expression is one atom that walks in turn; and a name inside a group or
  array written in a body keeps its binding for `===`. So
  `{.a 1; a + 2, b} & {“” _}` is `[“.a”, “1”, “;”, “a”, “+”, “2”, “,”, “b”]` and
  re-reads by a fold as written.
- **A closure prints as it was written.** `“” {.a 1; a + 2, b}` is
  `“{ .a 1; a + 2, b }”`, with `;` and `,` kept and a tight expression in
  parentheses, `“{ f (o .x) }”`, so printed closures read back.

## v0.26.2 2026-10-25

- **A declaration's echo renders when printed, not when declared.** Building a
  Figure of 16,384 children spelled out every child at declaration, methods
  included, which was most of its 1.7 s. It now takes 6 ms, and so does any
  program declaring large values inside closures (#435).
- **Figures count, and never compute.** Cells answers the children themselves
  when every child is a cell, and Multiplication counts the cells and constructs
  `n [y]`. Every observer answers as before; Size of a 16,384-unit row drops
  from 5.8 s to 8 ms (#435).

## v0.26.1 2026-10-25

- **A method walks as its closure.** `(E.size) & {“” _}` is
  `[“_^”, “.mul”, “U”]`, and `|` over a method calls it against its receiver
  (#429).
- **Figures: Size is Multiplication by the unit** and Tally multiplication is
  Multiplication of a Manyness, so Multiplication holds the module's only zero
  guard; Withness filters with `&|`.

## v0.26.0 2026-10-25

- **A key can be kept in a variable.** `.o [.x 5]; .k .x; o k` is `5`; it was
  `$!.name-missing x`, because the pending declaration was the receiver `.x`
  read from. `“” .x` is `“.x”` (#429).
- **`=` compares names and `===` compares bindings.** A walked `x`, a walked
  `.x` and a written `.x` are `=`; two walked names are `===` when they resolve
  to the same declaration, so `{.a 1; {.a 2; a}}` keeps its inner and outer `a`
  apart (#429).

## v0.25.0 2026-10-25

- **A closure walks as its atoms.** `{4 + 5} & {_}` is `[4, +, 5]`, unevaluated,
  with declarations and `;` kept, and `{4 + 5}.#` is `3` rather than calling the
  closure. A walked symbol is a word that never resolves, however it is carried
  (#429, `spec/a15`).
- **Folding a walk runs it.** `|` over a closure calls it with the receiver, and
  `|` over a stream holding walked words re-reads it as a closure, so
  `{x * y} | (.x 6, .y 7)` is `42` and `{…} | (args)` is `{…} (args)` (#429).

## v0.24.3 2026-10-24

- **A file run frees its call scopes.** A declaration's echo held its scope
  through a `WeakRef`, which the host keeps alive until its job ends, so every
  closure call's scope lived until the program exited, about 1.4 KB per call. A
  200,000-call program that ran out of a 1 GB heap now peaks at 185 MB (#426).

## v0.24.2 2026-10-24

- **A closure evaluates a group body on every call.** A parenthesised group in a
  closure or block body was evaluated in place by the first call, so every later
  call answered that first value and the closure printed it as its body.
  `.f {(.a _; .b (a + 1);)}; [f 1, f 2]` is now
  `[(.a 1; .b 2;), (.a 2; .b 3;)]`, as the bracket form already was, and
  `[1, 2] & {(_, _)}` is `[(1, 1), (2, 2)]` (#404).

## v0.24.1 2026-10-24

- **A closure keeps its scope wherever it is read.** Reading a bound closure
  through a name re-parented it to the read site, so a closure handed to another
  closure resolved its free names in the reader's call, and a closure factory
  nested one level too many with no error. With
  `.Mk {.lower _; {[“level”, lower _]}}; .L0 {“base”};`, `(Mk (Mk L0)) 7` is now
  `[“level”, [“level”, “base”]]` rather than three levels deep (#424).

## v0.24.0 2026-10-23

- **Splice operator `&|`.** `xs &| f` applies each element as `&` does and
  splices the answers into one fresh array: each answer contributes its
  elements, in order and shared, anything that is not an aggregate is one
  element, and nil contributes nothing. So `[[1], [2, 3]] &| {_}` is
  `[1, 2, 3]`, and `[1, 2, 3, 4] &| {(_ = 2) ? {__}}` filters to `[2]` (#422).
- **Breaking: Figures construct and never count.** `x.cells()` answers the cells
  of x themselves, spliced into one array, rather than a bracket tree of `1`s,
  so `(x.cells()).#` replaces `(x.cells()).##`. `x.size()` is
  `Figure (x.cells() & {U})`, `x.mul y` is `Figure (x.cells() & {y})`,
  `x.size_mul y` sizes a constructed Figure, and `x.size_equivalent y` compares
  two Sizes. The Size of a Figure with no cells is a new Figure equal to `Z`
  rather than `Z` itself, and no observer has a size limit. Sizes are as fast as
  counting was (#422).

## v0.23.2 2026-10-23

- **An argument is never written in place.** `_` reads an aggregate as a name
  does, and repetition applies through its operand, so a map block applying its
  element collects onto a copy: with `.xs [[1], [2]]`, `xs & {_ 9}` leaves `xs`
  as `[[1], [2]]`. A class that declares `apply_` repeats on a copy, so `3 a` no
  longer writes `a`. Only a fresh literal or a reduce's own accumulator is
  written in place (#420).
- **Figure application is a functional update.** `x y` is the mutating method
  `apply_`, so it still answers a new Figure and leaves x alone, but a join
  `ys | x` copies x once and appends in place after that: 512 units join in 0.15
  s rather than 17 s (#420).

## v0.23.1 2026-10-23

- **A map keeps its answers apart when its receiver is a literal aggregate.**
  `&` and `&&` apply each element to a fresh copy of the receiver, as through an
  immutable name, so `[1, 2] & [0]` is `[[0, 1], [0, 2]]` rather than one array
  `[0, 1, 2]` answered twice, and `[1, 2, 3] & []` is `[[1], [2], [3]]`. A
  reduce still writes its fresh accumulator in place (#418).

## v0.23.0 2026-10-23

- **Breaking: in a method, `_^` is the receiver.** The caret count is still
  lexical, but the level that reaches the aggregate a method was written in now
  reads the receiver the call is bound to: `_^` from the method body, `_^^` from
  a block one level in. An inherited method reads the descendant, and a
  functional copy's methods read the copy, so chained updates such as
  `((Q.push_ 1).push_ 2)` keep every write. Unlike a bare name, `_^` still skips
  an argument that has the same field. The receiver keeps the authority the call
  was granted: a non-mutating method's `_^.bump_ ()` is a functional update, and
  a mutating method reached through an immutable name writes only its own copy,
  where both used to write the original. A closure written outside an aggregate
  and stored as its method now reaches that aggregate through `_^`; bind an
  outer value where the closure is written to read it instead (#416).
- **A method read by dot from a value no name holds is bound to it.**
  `[.^ Base; .x 2].get()` and `(Q.push_ 1).push_ 2` bind their method to that
  value immutably, as a name would, instead of running it unbound (#416).

## v0.22.0 2026-10-23

- **Breaking: repeating an aggregate concatenates its elements.** `n x` for an
  array, group or schema answers a fresh aggregate of the same kind holding x's
  properties once and its elements n times (every term, for a schema), shared
  rather than copied: `3 [1, 2]` is `[1, 2, 1, 2, 1, 2]`, `0 [1, 2]` is `[]` and
  `0 (1, 2)` is nil. It used to apply x to itself, so `3 [1]` held its own array
  twice and `3 xs` wrote the array named `xs`. The answer holds at most
  1,000,000 elements, refused with `$!.repetition-size 1000000` as repeated text
  is, instead of the 65,536-application bound. Text, closures, and a class that
  declares `apply`, a Figure among them, repeat as before (#414).
- **Size, `mul` and `size_mul` build from a native count.** Each counts cells
  with `x.cells()` and `.##` and builds its Figure by repetition,
  `Figure (n [U])`, or `Figure (n [y])` for `mul`, so every answer and every
  identity is as before, and building and sizing a 256-cell Figure takes about
  0.7 s rather than 12 s. A count above 1,000,000 answers
  `$!.repetition-size 1000000` (#414).
- **Breaking: `Figures.Tally` is removed.** Nothing in the class uses it. Two
  tallies add as the Size of a Figure holding both, `(Figure [x, y]).size()`,
  and a list of them as `(xs | (Figure [Z, Z])).size()`, which is also right for
  an empty list and a lone `Z`. `(Figure [Z]).size()` alone is one cell, because
  `Figure [Z]` has the form of `U` (#414).

## v0.21.2 2026-10-21

- **`x.size_mul Z` is `Z` for every Figure.** A Figure with exactly one child,
  `U` among them, answered a one-cell tally, because one row of nothing,
  `Figure [Z]`, has the form of `U` and counts as a cell. `x.size_mul y` now
  answers `Z` when y is `Z`, as `x.mul y` already did, so Size takes `mul` to
  `size_mul` at a zero factor too (#413).
- **`x.cells()` reads a Figure's Size as a natural number.** It answers the
  bracket tree of x with `1` in place of each cell, so its leaf count `.##` is
  the Size as a `FrameCount`: `(Figure [U, Figure [U, U]]).cells()` is
  `[1, [1, 1]]`, whose `.##` is `3`. Like `x.form()`, it answers a plain bracket
  tree rather than a Figure, and every Figure's full spelling now includes it
  (#413).
- **`size_equivalent` counts instead of joining tallies.** `x.size_equivalent y`
  now compares `(x.cells()).##` with `(y.cells()).##` rather than the two Sizes,
  so it gives the same answers 3 to 5 times faster on the module's example
  Figures (#413).

## v0.21.1 2026-10-19

- **Size operators `.#` and `.##`.** `.#` answers an aggregate's element count
  and `.##` its leaves at any depth, each a `FrameCount`: `[[a, b], [c]]` is `2`
  and `3`. Neither counts a property, a count is its own size, any other value
  answers nil, and `.##` on an aggregate that contains itself is
  `$!.cyclic-aggregate .##`. `#` still begins a comment everywhere else (#411).

## v0.21.0 2026-10-19

- **Breaking: nonnegative integer literals are `FrameCount`.** `0`, `1234567890`
  and `+5` are counts, the new root of the ladder
  `FrameCount → FrameInt → FrameDecimal → FrameRational → FrameNumber`; `+`,
  `*`, `%%` and nonnegative `**` keep a count, while `-`, unary `-` and negative
  literals give `FrameInt` and `/` gives a ratio (or `FrameInt` when whole).
  Values print the same and `2 = (5 - 3)` holds, but `==`, `===` and `~~`
  compare exact types, so `2 == (5 - 3)` is now nil (#407).

## v0.20.3 2026-10-19

- **Breaking: the package ships `hc/`.** Every `.hc` file in the top-level `hc/`
  folder, the testdocs and Figures alike, is bundled with the package and served
  read-only at the same path, so a session includes one with `<-`:
  `Figures <- './hc/figures.hc'`. `'./modules/figures.hc'` is gone, with no
  alias. The testdocs moved there from `cli/hc/` (#405).
- **Breaking: importing a testdoc skips its examples.** `<-` drops every line
  that begins with a semicolon and a space outside prose, an example line, so a
  testdoc imports its code alone: an example that fails on purpose no longer
  fails the import, and an example's names are no longer bound. Figures now
  declares `A`, `B`, `Z` and `U` in code; its example family (`C` through `G`)
  is no longer importable (#405).

## v0.20.2 2026-10-17

- **Breaking: Figures is a class.** `Figure [c, …]` answers a fresh object
  holding its `children` and declaring Manyness, Size, `mul`, `size_mul`,
  `size_equivalent`, `sameform`, `sameness` and Withness as methods, each
  answering a Figure (#395): `many x` → `x.many()`, `size x` → `x.size()`,
  `figure_add [x, y]` → `Figure [x, y]`, `cat [x, y]` → `y.children | x`,
  `figure_mul [x, y]` → `x.mul y`, `withness [.parent P; .figs [f…];]` →
  `P.withness [f…]`, `xs | Tally` → `xs | (Tally Z)`, `x .0` → `x.children .0`.
  A Figure prints with its methods and equals other Figures, not the bracket of
  its children; `x.form()` answers that bracket tree, and `“” x` spells it, so a
  Figure interpolates as `[[], [[]]]` (#398). Applying a Figure appends a child,
  so `xs | (Figure [])` constructs. `Figure (x)` with a Figure x answers an
  empty Figure: write `Figure [x]`. `absent`, `cat`, `figure_add` and
  `figure_mul` are removed, with no aliases. Programs written against v0.20.1's
  Figures, including explore 017.09's, run unchanged on hclang 0.20.1; port them
  with the mapping above.
- **Breaking: a method's free names are lexical.** A method reads and writes
  free names where it was written, never through the path its receiver was
  reached by, so a scope that rebinds one of them no longer captures it (#400,
  #382 H11). `left.shared.read()` now reads the `lexical` visible where `read`
  was written, not `left`'s, and `o.k` misses when `o` has no `k` instead of
  finding a `k` beside `o`. This overrides #347's contextual lookup.
- **`.N` indexes elements.** A declared property no longer shifts an index:
  `[.k 1; 4, 5] .0` is `4`, not the `.k` declaration.
- **Multi-line aggregates read alike everywhere.** A line break inside an open
  bracket ends a term, as LANGUAGE.md says, in the CLI and testdoc as it already
  did on import. `[.k 1;` / `.m 2;` / `4]` was `[.k 1; [.m 2;], [4]]` there.
- **A closure reads only its argument's own properties.** Names now reach an
  argument's own and inherited properties but never the scope that built it
  (spec 7), and a block inside a method reads the method's locals ahead of the
  caller's bindings. Each had let a caller's names leak into a method (#382
  H11).
- **A functional update copies only what it writes.** A mutating method reached
  through an immutable handle copied every aggregate its receiver held; it now
  copies the receiver and then the path down to each write, so anything the call
  never writes keeps its identity in the result (#401). The original is still
  untouched at any depth. The result shares its unwritten members with the
  original, so an in-place write through a mutable name reaches both.
- **A class can declare how text spells its instances.** Text that receives an
  aggregate declaring `toText` contributes that method's answer, so
  `“at ” (Pair [3, 5])` can read `“at (3, 5)”` instead of spelling every field
  and method. Without one, text contributes the spelling as before, and the
  printer always shows the spelling (#398).
- **Experiment: the classical Cayley–Dickson lane runs in HC.**
  `experiments/017-classical-cd/` builds the sign tables of the 1-, 2-, 4-, 8-
  and 16-dimensional algebras from w₀ = 0 with the literal Dickson/Schafer
  doubling, checks each floor's lawful domain and K∘CD = S∘K on every triple,
  and searches the sedenion floor for positive-holonomy squares and two-term
  zero divisors, with an independent dense-arithmetic oracle, mutation and
  causal controls, and a fail-closed driver. Research code: not shipped and not
  part of `test:all`. No runtime change was needed.

## v0.20.1 2026-10-13

- **Figures is a standard module in every host.** The corpus moved to
  `lib/modules/figures.hc`, and `Figures <- './modules/figures.hc'` imports it
  in the CLI, the compiled binary, the npm package, `HCLang`, and the offline
  web playground, including after `reset()`. The module is served read-only
  through a `ResourceMapStore` overlay compiled into the program, so writing it
  is refused and no other path, scheme, or permission widens.
  `cli/hc/modules.hc` is the importing testdoc.
- **Named imports curry operators with their own operand.** On v0.20.0,
  `.n 1; [n = 1, n = n]` inside a named import answered `[(), ()]`, and
  importing Figures by name overflowed the stack.

## v0.20.0 2026-10-12

- **Resources can supply HC source directly.** `. <- 'resource'` evaluates fresh
  source in the exact current scope and retains completed local forms before a
  failure. `name <- 'resource'` evaluates in a fresh child with complete
  ordered, live read-only caller value and schema lookup, then replaces `name`
  only after full success; any read, parse, evaluation, or setter failure
  preserves its prior binding or absence. Imported arrays and closures may span
  logical lines, malformed physical EOF still fails, and recursive self or
  mutual imports return `$!.resource-import-cycle` instead of overflowing.

## v0.19.0 2026-10-11

- **Breaking: an empty reduce answers the receiver it started from.** `[] | []`
  is `[]`, `[] | “”` is `“”`, `[] | 1` is `1`, and an empty resource read
  answers empty text or an empty array instead of nil, as every seeded fold
  does. This keeps a reduce compositional, so `(xs ++ ys) | s` is
  `ys | (xs | s)` even when `xs` is empty. Code that tested for nil to detect an
  empty source should compare with the seed instead.
- **Withness answers correctly at its empty edges.** No Figure is with an empty
  parent, and asking about no Figures answers yes; both were inverted while an
  empty collect answered nil.
- **Manyness counts as a tally**, one mark per immediate child in the same units
  as Size, and the Figure corpus no longer needs `rest` or a fallback for an
  empty Figure.

## v0.18.0 2026-10-11

- **A class can declare how applying it accumulates.** An aggregate with a
  method named `apply`, or `apply_` when it writes, is applied by calling that
  method, so `([1, 2, 4] | (Summer 0)) .total` sums with an ordinary class. An
  immutable name updates a copy, a mutable one fills in place, a step answering
  nil keeps the receiver, and a top-level `apply` never changes how the
  interpreter collects its output (#375).
- **A copy of an aggregate holds its own declarations.** A functional update,
  such as `p.set_ 2` through an immutable name, and a collect through a name no
  longer print the original's declarations a second time or iterate them as
  elements, so the copy equals the same value written out.
- **The Figure corpus now plays in tally form.** Size answers a row of units,
  computed as one fold over the children, so it is idempotent. The Fano
  incidence checks are generated 7×7 tables, and their equality is the plane's
  self-duality.

## v0.17.1 2026-10-11

- **A name bound to an array now applies like the array.** `xs 3` collects into
  a fresh copy of `xs` instead of answering `3`, and a named array seed starts a
  reduce as its literal does instead of being skipped, so `[3, 4] | xs`
  concatenates. The name itself is never written, and the elements keep their
  identity (#386).

- **The executable Figure model now derives recursive Size without host
  numbers.** Its empty Figure is zero, a Figure shaped like `[[]]` is one, and
  every other Figure sums its children's Figure-valued Sizes, so nested cell
  complexes compose, including two Size-4 children producing Size 8. Size reads
  only form, so equal-looking Figures always have equal Size.
- **Size-equivalence classes of finite Figures now have executable commutative
  semiring witnesses.** Figure-valued addition and recursive row multiplication
  preserve Size, including a 2×3 rectangle, with both identities, both
  associativities, both commutativities, both distributive laws, and zero
  annihilation checked in HC.
- **The same Figure constructor now hosts an executable Fano incidence
  arrangement carried by reuse alone.** Seven originals of identical form make
  seven triples of identical form, and identity-based Withness recovers the
  pattern, with all 21 original pairs, all 21 triple pairs, and all four
  no-three subsets checked exhaustively.

## v0.17.0 2026-10-11

- **Equality is a ladder, each rung strictly stronger than the last.** `=` asks
  for the same value, `==` for the same value and the same type at every node,
  and `===` for the same frame. An aggregate compares its visible properties and
  elements, so `[3] = [3.0]` holds while `[3] == [3.0]` does not, and spelling
  no longer matters: `0123 == 123` holds. `===` compares aggregates by identity
  through any handle, so a reused Figure and an equal-looking construction are
  finally distinguishable; an atom owns no identity, so for numbers and text
  `===` is `==`. The old planes are gone: `===` no longer compares metadata
  alone, so `3 === 4` is nil (#358, #382).
- **`:` answers its left operand when it is not nil.** `“value” : {“else”}`
  answers `“value”`, and only nil calls the fallback, so `c ? t : e` now answers
  `t` instead of nil. A taken branch that itself answers nil still falls through
  to `e`; box such a branch as `c ? {[t]} : {[e]}` and take `.0`. Programs that
  used `x : {…}` to drop truthy values must now box instead (#382).
- **A closure no longer writes onto an argument passed by a plain name.**
  `{.key 113} base` binds `key` in the call's own frame and leaves `base` alone,
  exactly as it already did for a literal argument. Writing through requires a
  name declared mutable, `.base_ […]`, as the effect marker says. This also
  stops a map from writing onto reused children (#382).

## v0.16.0 2026-09-12

- **Only declared environment variables reach `$$`.** A curated dictionary of
  standard UNIX and open-source variables replaces the wholesale
  `Deno.env.toObject()`, and the harness now reads one declared name at a time.
  A variable outside the dictionary is absent rather than refused, so
  `$$.SECRET` answers exactly what a typo answers and there is nothing to probe
  a host with. The dictionary is the bound, not the `--allow-env` flag (#366).
- **A resource scheme is dispatched through a handler table, and a scheme with
  no entry is an empty slot.** `'https://…'` still refuses, now because nothing
  is bound to `https` rather than because schemes are unimplemented, and the
  refusal is decided by a table read with no host call. Presence of a scheme is
  the whole discriminator: a colon inside a path stays an ordinary path
  character (#367).
- A handler is a harness value with no HC spelling that installs, replaces, or
  enumerates one, and table composition only ever narrows — a nested harness's
  schemes are a subset of its parent's by construction. Swapping live for
  simulated, or for a deterministic fixture, is swapping one entry, with the
  program byte-identical across all three (#367).
- **`%…%` ships as instants and durations.** An instant is offset-bearing and a
  bare date is the start of that UTC day; a civil time with no offset is
  refused, because it cannot become an instant without tzdata. A duration is
  fixed-length, so `%P1Y%` and `%P1M%` are refused rather than given a calendar
  meaning. Both render canonically, so `%2026-08-21T08:30:00-07:00%` answers
  `%2026-08-21T15:30:00Z%` and output re-reads as the same value (#369).
- The algebra between them is enforced from one dimensional table rather than
  per operator: instant minus instant is a duration, instant plus duration is an
  instant, duration times a number is a duration from either side, duration over
  duration is a plain number, and instant plus instant is a type error. Values
  are exact nanoseconds, so a scaling that would not land on a whole nanosecond
  answers `$!.time-inexact` instead of rounding, and arithmetic leaving the year
  range a literal accepts answers `$!.time-range` rather than a spelling that
  would not read back (#369).
- **`%%` keeps its meaning as Modulo, and there is no empty time literal.** The
  doubled delimiter belongs to an operator that already had behavior, unlike the
  unused `"""` spelling a03 claimed, and a literal with no body would name
  nothing (#369).
- **`now` is a grant, spelled `'clock:now'`, with no ambient name.** Reading it
  answers one instant and writing it is refused. Real, frozen, and scripted
  clocks are three table entries rather than three modes, so a pinned clock
  makes `%2026-08-21T00:00:00Z%` a legitimate expectation, and a time budget is
  a duration plus a clock whose exhaustion is the clock refusing (#370).
- **The CLI no longer runs with `-A`.** The `hc` and `build` tasks take only the
  read, write, and env authority the harness needs, with `--deny-run` and
  `--deny-ffi` as a hard floor, since either one would void every path scope the
  root binding enforces. Those flags are a derived artifact of one harness and
  never the security model, which `cli/CLAUDE.md` now records (#371).
- Library API: `FrameDateTime`, `FrameDuration`, `ResourceHandlers`,
  `StoreHandler`, `dimensionalResult`, and the `Clock` family are exported;
  `FrameResource.root` takes an optional handler table; and `FrameNumeric` gains
  `exactRatio`, so a value outside the promotion ladder can scale exactly (#367,
  #369, #370).

## v0.15.1 2026-09-11

- Restore the current `hclang` CLI to npm: `npx hclang@latest` now runs the
  Node.js 22+ build without Deno, for both the interactive REPL and HC files.
  Every release builds, packs, and exercises that exact artifact through `npx`
  before publishing it under the existing version gate (#364).
- Run every successful CLI and doctest baseline through the same evaluator
  factory users receive, including isolated file scopes, host bindings, and the
  resource root; captured output is now the harness's only deliberate difference
  (#373).

## v0.15.0 2026-09-11

- **Breaking: `|` and `&` have swapped roles.** `|` now reduces and `&` now
  maps, where v0.14.x had `|` map and `&` reduce. Existing iteration expressions
  keep parsing and mean something else, so they must be re-read rather than
  trusted. `cli/hc/apply-tutorial.md` teaches the model and `cli/hc/apply.hc`
  pins each decision to an executable expectation (#368).
- A reduce threads: each element is applied to the value the last step answered,
  so what you start from is the combining rule and no operator carries one. Text
  joins, an aggregate collects, a numeric multiplies, and any receiver that
  answers itself accumulates. `[1, 2, 3] | “”` is `“123”`, `| []` is
  `[1, 2, 3]`, and `| 1` is `6`. A closure threads too, and is spent after one
  element rather than refused (#368).
- A map applies each element on its own and keeps the answers apart, with no
  index in the dot parameter. Use a doubled operator when you need the address
  (#368).
- Bind `||`, and give both doubled operators one stream: every visible property
  in declaration order, then every element by index, each arriving as a
  `[key, value]` tuple whose key is the symbol that addresses the member.
  Project with `_ .0` and `_ .1`. The tuple is an iteration argument only; no
  pair is stored, and folding tuples back does not rebuild the value they came
  from (#368).
- An empty source reduces to nil whatever it started from, and maps to an empty
  array (#368).
- **Reading a resource is a reduce over characters**, replacing v0.14.0's single
  whole-content element. Nothing about the reading is a property of the source:
  `'./out.txt' | “”` answers the whole content, `| []` answers the characters
  apart, and `&& {_}` answers indexed characters. A resource's URI components
  stay readable by name and never appear in the stream, because they describe
  the reference the value is rather than contents it holds (#368).
- Reading an empty location answers nil, which stays distinguishable from an
  absent one: absent is a refusal, empty is not a failure (#368).
- A refusal reaching a receiver mid-stream is collected by an aggregate and
  consumed by nothing else, so a read that fails cannot answer as though it
  succeeded (#368).
- Properties are not elements. A declaration is not iterated, so
  `[.meta 1; 2, 3] & {_}` answers `[2, 3]` and a value whose contents are all
  properties has nothing to iterate. Anything which is not an aggregate is a
  single element, so text still does not enumerate its characters (#368).
- A symbol in value position now prints its dot, so canonical output re-reads as
  the same symbol rather than as a name lookup: `.literal` answers `.literal`,
  and a tuple key prints `.meta`. A symbol still awaiting lookup prints as
  written, so `{a + b}` is unchanged (#368).
- **Canonical rendering puts properties first, then elements** — the same order
  the doubled operators iterate — and a declaration prints once, from the
  property plane it wrote, instead of also as a data-plane echo. `[.a 1; a, 2]`
  now renders `[.a 1; 1, 2]` rather than `[(.a 1); 1, 2, .a 1;]`, so canonical
  output re-reads as the same value instead of declaring `.a` twice. A
  declaration into an enclosing scope still prints its echo, because there the
  echo is the only record of it (#368).
- Declaring a numeric property is refused as `$!.numeric-key`, because `.0`
  already addresses the first element, and the literal answers that refusal
  rather than holding it as a failed statement: a key that collides with the
  aggregate's own addressing leaves nothing well-formed to hand back. A refused
  _write_ — a schema mismatch, a constant, a visibility grade — is unchanged,
  and still leaves a value you can inspect with that one write undone (#368).
- Library API: `Frame.elements` is the enumerable protocol and `Frame.reduce`
  folds it into a supplied receiver; `Frame.asArray` keeps structural access to
  an aggregate's own terms and no longer performs a resource read.
  `FrameString.reduce` is renamed `FrameString.scanInto`, which is what it
  always was — the sigilizer fold (#368).

## v0.14.0 2026-09-09

- Make `'…'` the resource. When a root binding is reachable in the invocation
  context, a resource identifier evaluates to a resource frame extending it:
  applying it writes, and `|` and `&` read. There is no new I/O primitive and no
  separate resolver frame, and path extension is attenuation because a longer
  reference names a location inside the root by construction. With no root
  binding reachable, `'…'` still evaluates to itself and stays powerless (#348).
- A write answers with the count of characters written rather than with the
  receiver, so a refusal cannot hide inside a successful-looking result. A write
  replaces. A read yields one string holding the whole content; typing the
  element is still to come (#348).
- Refuse anything that could leave the root, deterministically and before any
  host call: `..` in any position, `\`, control characters, malformed
  percent-escapes, escapes decoding to `.`, `/`, or `\`, a query, a fragment, an
  authority, and any scheme. Each is a `$!.resource-…` value that flows back
  through ordinary evaluation rather than an exception. `./`, `/`, and a bare
  path name the same location, since there is no ambient working directory
  (#348).
- Re-verify containment against the resolved location, so a symlink inside the
  root cannot serve bytes from outside it. A write to a symlinked ancestor is
  refused before any directory is created (#348).
- Give the Deno CLI a root binding at a fresh temp directory, created on first
  use, and give an `HCLang` session an in-memory one that `reset()` replaces.
  Both are reachable from HC source as `$$.root`, which prints as `'.'` and
  never as the host location behind it (#348).

## v0.13.0 2026-09-07

- Add typed numbers: an alphabetic property on an exact decimal is now an inert
  quantity carrying that magnitude and an opaque unit spelling, so `9.8.m` and
  `0.10.USD` render as written and compare structurally against the same unit at
  the same value. Nothing composes arithmetically, so every operator is a domain
  error even when both operands share a unit. Only decimals receive the segment,
  so a count is written `100.0.kg` and a decimal can no longer carry a named
  method (#362).
- Spell composite units by extending the segment: a segment is letters plus an
  optional integer exponent signed with a hyphen, and further segments absorb,
  so `9.8.m2` is an area and `9.8.kg.m.s-2` is a force. Nothing is validated or
  canonicalized, so `9.8.m.s-1`, `9.8.s-1.m`, and `9.8.m2` are three distinct
  quantities, the same concession the language already makes by holding
  `1000.0.m = 1.0.km` false. `9.8.m.5`, `9.8.m.2s`, and `9.8.m.s_1` remain
  missing names (#362).
- **Breaking:** Stop resolving a name through the numeric receiver a dotted
  numeric value was read from, so `9.8.5.name` and `9.8.m.name` report
  `$!.name-missing` instead of reaching the receiver or the enclosing scope.
  Built-in operators are unaffected (#362).

## v0.12.0 2026-09-06

- **Breaking:** Replace host-number arithmetic with an exact numeric tower of
  arbitrary-precision integers, scaled decimals, reduced rationals, and inexact
  numbers. Integer and rational divisors preserve exact results, decimal
  divisors produce inexact numbers, `%%` accepts integers only and now floors,
  and `=` compares numeric value across every rung (#355).
- **Breaking:** Make dotted chains such as `1.408.055.1212` inert
  spelling-preserving sequences: they now compare equal to themselves instead of
  through `NaN`, and reject arithmetic, ordering, signs, and repetition with
  stable domain errors (#355).
- Bound integer repetition counts and repeated text output, plus exact
  exponentiation, with stable domain, zero, and range errors instead of host
  exceptions or unbounded allocation (#355).
- Read host and CLI values as exact integers when every character is a decimal
  digit and as text otherwise, so `$$` names no longer arrive as `NaN`-backed
  numbers (#355).
- **Breaking:** Parse `0` and zero-led decimal chains such as `0.5` as numeric
  values rather than blobs; explicit `0b`, `0o`, and `0x` literals remain blobs.
  Leading zeros are preserved, so `0123 = 123` holds while `0123 == 123` does
  not (#356).
- Add unary `-` for numeric values, including normalized double negation, while
  a signed sequence reports a stable domain error (#357).

## v0.11.2 2026-08-21

- **Breaking:** Define `$` as the current file/module namespace and `$$` as a
  host namespace whose bindings cannot be replaced by HC source. Host values
  passed to `evaluate`/`execute`, including CLI environment variables, must now
  be read explicitly as `$$.name`; bare names no longer depend on ambient host
  state. Anchored reads preserve ordinary private and protected visibility
  (#349).
- Give each CLI input file an isolated `$` namespace while retaining the same
  host-selected `$$` namespace across files (#349).
- Reject unsupported forms such as `$word`, `$<`, and `$$$` as lexical errors
  instead of consuming or restarting the expression (#349).
- Reserve `$` wherever the preceding character continues an identifier, so an
  anchor abutting a symbol, number, blob, alias, name, argument, or hyphen is a
  lexical error: `name$`, `1$`, `0b101$`, `@ctl$`, `.set$`, `_$`, and `-$` all
  fail alike. Every other operator and sigil ends a token without continuing an
  identifier, so `+$`, `<=$`, `@$`, `.$`, `.+$`, and `_^$` stay legal (#349).
- Update the bundled VS Code grammar to distinguish `$` file anchors from `$$`
  host anchors and to mark every rejected dollar spelling as invalid, released
  as extension v0.2.1 (#349).

## v0.11.1 2026-08-21

- Stop symbol lookup from rewriting shared values' `up` links. Immutable values
  now use per-read lexical projections, while aggregates retain identity through
  contextual handles, so interleaved reads keep independent live contexts
  (#341).
- **Breaking:** Add a call-parameter ladder: `.` reads the current iterator
  parameter, `..` the enclosing call's parameter, and so on. A missing level now
  reports `$!.name-missing` instead of silently becoming an empty-name setter;
  bare `.` has no separate `this` meaning (#345).
- Run `cli/hc/format.hc` as an executable rendering corpus, with the stale `_^`
  expectation corrected and authoritative totals enforced by the CLI suite
  (#344).

## v0.11.0 2026-08-20

- **Breaking:** A mutating method is declared and called with a trailing
  underscore instead of a trailing colon: `.set_ {@value _;}` called as
  `counter_.set_ 2`. One marker now spells the whole effect axis, matching the
  mutable name it acts on. Rename every `method:` declaration and call site to
  `method_`. Unmigrated code fails at its call sites rather than misbehaving:
  `.set: {…}` declares nothing, because the statement applies if-else to a name
  the aggregate never binds, so `owner.set` reports `$!.name-missing` (#328).
- **Breaking:** A trailing underscore on a block-valued field now declares a
  mutating method, so a field that already carried one changes meaning even
  though its spelling did not. `.o [.f_ {41 + 1}; .g {f_()}]; o.g()` returned
  `42` and now returns the receiver, because a mutating method returns the frame
  it ran against. Such a field also gains receiver-write authority: a `@name`
  write that previously reported `$!.method-not-mutating` now lands on a
  discarded instance copy and is dropped without a diagnostic. Rename any
  block-valued field that is not meant to mutate its receiver (#328).
- **Breaking:** `:` is only the if-else operator, so a name ends at a colon with
  or without a space before it. `.mutator:x` used to lex as `.mutator:` followed
  by `x`, and now lexes as `.mutator`, `:`, `x` (#328).
- A mutating method reached through an immutable handle is still a functional
  update against an instance copy; only its spelling changed.
- `deno task bump --minor` reaches the bump script, and the script no longer
  assumes `deno` is on `PATH`, so a pinned or absolute-path toolchain cannot
  leave the tree bumped, uncommitted, and holding a stale lockfile.

## v0.10.5 2026-08-20

- **Breaking:** `_^` no longer reads the call's parameter. It now always means
  one enclosing lexical scope per caret, independent of how the closure was
  invoked, which also makes the enclosing scope reachable from an iterator block
  for the first time. Code using `_^` to read an iterator's index, key, or
  accumulator must use the bare name `.` instead, as in `[1, 2, 3] & { . + _ }`
  (#340).

## v0.10.4 2026-08-20

- Return direct errors and aggregates with immediate error elements from
  mutating methods, and stop sequenced bodies at the same shallow boundary while
  preserving nested errors as data (#338).

## v0.10.3 2026-08-20

- Give every evaluation named argument, parameter, receiver, and write-target
  roles, so repeated or interleaved closure calls preserve their captured scope
  without re-parenting shared closures or body items (#327, #329).
- Declare into a frame belonging to the call instead of into the argument, so
  `{.x _; x}` names its argument and a callee's declarations no longer appear on
  the caller's value.
- Return the last statement from a closure body, and end the sequence at the
  first statement that fails (#323).
- Build objects by returning an aggregate, as in `{[.X _; .getX {X}]}`: a
  closure's own declarations belong to that call and are not reachable through
  its result. `doc/GRAMMAR.md` covers the idiom.
- Print any frame reachable from itself as an identity instead of overflowing
  the host stack, so no source input can reach a `RangeError` while a value is
  being displayed (#337).
- Resolve `_^^` and deeper against enclosing lexical scopes rather than
  positions in a context list, which had no meaning past `_^`.
- Refuse `.^` inside a closure nested in a mutating method, reporting
  `$!.parent-not-declarable .^` where the re-parenting was previously dropped in
  silence.

## v0.10.2 2026-08-19

- Make `.^` the only parent-declaration spelling; old `._^` input follows
  ordinary name/operator tokenization with no compatibility alias or pointed
  diagnostic.
- Keep schema evaluation from leaking its context into later sibling lookups.
- Terminate cyclic scope and handle lookup while retaining global operator
  fallback.
- Let mutable derived methods update inherited declarations, while refusing a
  functional update that would write through a shared declared parent.
- Treat only decimal-digit array properties as positions, so metadata named
  `Infinity`, `1e3`, `0x10`, or the empty string remains accessible.
- Re-parent existing receivers with `.^ base` only from mutating methods,
  updating mutable receivers in place and immutable receivers as functional
  copies while preserving cycle rejection.
- Refuse receiver-targeted `@name` writes from non-mutating methods, while
  preserving in-place mutation through mutable handles and functional updates
  through immutable handles.
- Preserve receiver effects through built-in control-flow blocks evaluated in
  the active method and through bare sibling calls, while excluding unrelated
  named helpers, caller arguments, and shared inherited state from write
  authority.

## v0.10.1 2026-08-18

- Refuse a protected member reached through containment rather than inheritance,
  so a nested aggregate's method reading an enclosing frame's `_secret` reports
  `$!.is-protected` instead of returning the value.
- Declare an aggregate's parent as `.^ base`, which now inherits the parent's
  bindings; the parent is declarable only on the aggregate under construction.
- Report `$!.parent-not-declarable .^` for a parent declaration outside
  construction, such as in a method body, instead of exhausting the stack.

## v0.10.0 2026-08-17

- Read a document's characters without its fences through `.body`, as in
  `` `prose`.body `` returning `“prose”`. A document still evaluates to itself
  and still prints its fences verbatim.

## v0.9.4 2026-08-17

- Build the release artifact from the version the release job just published, so
  a version bump reaches its GitHub release with the `hcweb.html` asset instead
  of failing seconds after publishing. Deno's 24-hour dependency cooldown was
  rejecting our own new release, which is why both v0.9.2 and v0.9.3 reached JSR
  without producing a release.

## v0.9.3 2026-08-13

- Nest curly-quoted strings without an escape character, keeping balanced
  interior quotes as data and reporting an unmatched quote instead of silently
  truncating the string.
- Preserve blank logical lines inside every multi-line literal, so a string
  spelled `"""…"""` has the same value as the same body in `“ ”`.
- Accept `"` as the ASCII input spelling of a canonical string, where run length
  selects nesting depth: `""` is the empty string and `"""…"""` keeps interior
  `"` runs as content.
- Validate string schemas such as `<"red","green">`, which the ASCII quote makes
  expressible.
- Name external resources with inert `'…'` URI references that expose `scheme`,
  `authority`, `path`, `query`, and `fragment` while performing no network,
  filesystem, or registry access, and reject non-URI content as a lexical error.
- Treat prose inside a document fence as GFM, and keep `.adoc` support only as a
  compatibility shim.
- Highlight the new delimiters in the VS Code extension.

## v0.9.2 2026-08-13

- Ship the HC playground as a single self-contained `hcweb.html` release asset
  that runs offline from a local file with no server, install, or network
  access.
- Re-publish hcweb as an island package that loads hclang transitively from JSR
  without consumer-side dependency configuration, with a new `mount` entry.
- Restore accessible submit, history, reset, and recoverable error behavior,
  replacing the obsolete static fallback.

## v0.9.1 2026-08-13

- Resolve previously evaluated integer bindings as dynamic byte-string lengths
  while preserving exact payload boundaries, canonical numeric rendering, and
  recoverable diagnostics.
- Treat schemas and first-class runtime types as composable, evidence-producing
  matchers shared by binding validation, membership, and application, including
  direct-property and deterministic bit-capture matchers that preserve
  leading-zero widths.

## v0.9.0 2026-08-13

- Restore the BitScheme tutorial as a fully traversable executable specification
  with current conditional, map, reduce, and schema syntax.
- Re-baseline advanced capture, framebuffer, and RISC-V behavior as explicitly
  tracked aspirational examples instead of stale failing assertions.

## v0.8.9 2026-08-13

- Negate the `()` and `<>` boolean singletons with `.!`.
- Test membership in all, nil, enumerated schemas, and runtime types extracted
  with `~~`.
- Bind closure argument signatures with `^`, applying defaults, allowing extra
  properties, and reporting omitted required properties.
- Promote all nine boolean and type-operation white-paper examples to passing
  doctests.

## v0.8.8 2026-08-13

- Preserve live closure parent relationships so argument lookup, explicit parent
  lookup, and empty-argument fallback observe the current enclosing scope
  without granting implicit mutation authority.

## v0.8.7 2026-08-13

- Return the assigned value when reassigning variables and preserve it in the
  surrounding expression.
- Reject reassignment of uppercase constant names without changing their
  original value.
- Enforce protected and private visibility for owner, child, parent, and peer
  property reads and writes.
- Support shared mutable handles and trailing-colon mutating methods, including
  copy-on-write through immutable handles, implicit receiver returns, and
  propagated mutation errors.
- Construct singleton and class frames with ordinary aggregates and closures,
  including repeatable construction, source-level parent lookup, and cycle-safe
  inherited frame relationships.
- Keep environment-dependent module loading explicitly aspirational with a
  focused follow-up issue.

## v0.8.6 2026-08-12

- Compare frames independently across their whole value, data plane (`==`), and
  metadata plane (`===`).
- Map enumerable values with `|` and reduce them with `&`, including documented
  element and accumulator closure contexts.
- Promote the supported core frame-operator examples from unimplemented markers
  to passing white-paper doctests.

## v0.8.5 2026-08-12

- Compose numeric properties into decimal and phone-shaped values while
  preserving exact segment spelling and leading zeroes.
- Support leading unary `+` on numeric-property chains without changing binary
  addition.
- Evaluate dotted numeric comparisons `.<`, `.>`, `.<=`, and `.>=`, including
  `<>`/`()` truth results, while preserving raw schema delimiters.
- Make binary `?` and `:` call the selected right operand with `()`, with
  chained conditionals following ordinary left-to-right evaluation.
- Execute the four original HCSV/HCSON phone examples in the full white-paper
  doctest.

## v0.8.4 2026-08-12

- Route symbol-to-token recognition through a stateless Sigilizer and shared
  Frame-level Scan protocol (`scan()`/`finishInput()`), replacing lexer-specific
  boundary workarounds.
- Lex dot-led comparison names such as `.<`, `.>`, `.<=`, and `.>=` while
  preserving raw `<` and `>` as structural type delimiters.
- Restore fixed-length byte strings such as `\5\Hello`, including incremental
  input and exact payload boundaries.
- Report lexical failures for unterminated smart strings, invalid byte lengths,
  and byte payloads that end before their declared length.
- Validate blob continuation against the selected base instead of accepting
  base-64 digits in every blob literal.

## v0.8.3 2026-08-12

- Support document strings opened by any odd backtick run and closed by an equal
  run, preserving their fence length when rendered.
- Treat top-level even backtick runs as empty documents, preserve shorter runs
  inside documents, and reject interior runs longer than the opening fence.
- Preserve document fences across incremental input chunks and validate pending
  runs at EOF.
- Make doctest marker detection and UTF-8 file decoding chunk-independent, and
  suppress test summaries after lexical failure.
- Keep punctuation inside comments inert and allow void doctest statements
  without expected-output lines.
- Traverse the complete white paper as a deterministic doctest with
  non-executable examples retained as native AsciiDoc source blocks.

## v0.8.2 2026-08-10

- Account for every HCTest testdoc source/result pair, including malformed and
  unexpected EOF cases.
- Return a nonzero CLI status when HCTest testdocs fail.
- Support `$!.unimplemented` expectations and report complete HCTest fixture and
  assertion totals.

## v0.8.1 2026-08-10

- Support hyphens in identifiers.
- Support property access on array literals.

## v0.8.0 2026-08-09

- Upgrade development and CI to Deno 2.9.5.

## v0.7.6 2025-12-21

- **Type/Schema Tests**: Added comprehensive test coverage for schema validation
  - 33 total schema tests (was 2): 9 passing, 24 skipped as aspirational
  - ✅ Numeric schemas work: enumerations `<1,2,3>`, constants `<42>`
  - 📝 String schemas documented but not yet implemented (tests skipped with
    `.skip()`)
  - 📝 HLIR advanced types documented: `<i32>`, `<tensor<2x3xf32>>`, function
    signatures
  - Updated `testdoc.hc` with working schema examples
  - Added `spec/2-type-tests/` documenting findings and implementation
    recommendations

## v0.7.5 2025-12-14

- **Closure Improvements**: Significant improvements to closure semantics and
  evaluation
  - ✅ Fixed anonymous parameter `_` and multi-level `___` evaluation outside
    closures
  - ✅ Fixed parameter `^` access in closures and iterators
  - ✅ Closures now properly capture context and stay lazy until called
  - ✅ Fixed closure stringification: `{1}` → `{ 1 }`, `{_}` → `{ _ }` (with
    interior spacing)
  - ✅ Closure application works correctly: `{_} 42` → `[42]`, `{_ * _} 3` →
    `[9]`
  - ⚠️ **BREAKING**: MAML (Markup as Metalanguage) temporarily broken due to
    fundamental conflict with new closure semantics
    - MAML tests skipped in CI (not run in `test:all`)
    - Will be fixed in v0.7.6 with proper symbol lookup in closure contexts
    - See
      [spec/1-fix-closures/12-final-diagnosis.md](spec/1-fix-closures/12-final-diagnosis.md)
      for details
- **Format Specifications**: Added canonical formatting and pretty-printing
  specs for hcfmt
  - Defined canonical format rules for consistent code formatting
  - Added pretty-printing specification for enhanced readability
  - Included smoke tests for format validation
- **Documentation**: Added comprehensive CLAUDE.md guide files
  - Project-wide [CLAUDE.md](CLAUDE.md) developer guide
  - Package-specific guides for [cli](cli/CLAUDE.md),
    [lib/execute](lib/execute/CLAUDE.md), [lib/frames](lib/frames/CLAUDE.md),
    [lib/ops](lib/ops/CLAUDE.md), and [web](web/CLAUDE.md)
  - Detailed architecture and development workflow documentation
  - Added
    [test failures analysis](spec/1-fix-closures/06-test-failures-analysis.md)

## v0.7.4 2025-12-13

- **Deno 2 Compatibility**: Full support for Deno 2.x
  - Fixed `@preact/hooks` import path (hooks is a submodule of preact)
  - Removed deprecated `permissions` field from `cli/deno.json`
  - Added version specifiers to all JSR imports
  - All tests pass with Deno 2
- **VS Code Extension**: Added comprehensive syntax highlighting
  - Full language configuration with bracket matching and auto-closing
  - Complete syntax highlighting for all HC language features
  - Packaged and ready for VS Code Marketplace
  - Published under TheSwanFactory namespace
  - Replaces deprecated standalone language-hclang repository
- **Documentation Enhancements**:
  - Added comprehensive [GRAMMAR.md](doc/GRAMMAR.md) reference
  - Significantly improved [README.md](README.md) with detailed usage examples
  - Added VS Code extension documentation
  - Applied formatting lint to all documentation files
- Top-level `deno task hc` and `test:doc` commands
- Properly returns Frame.all for '<>'

## v0.7.3 2025-02-23

- Reformat hcweb

## v0.7.2 2025-02-22

- Initial working hcweb

## v0.7.1 2025-02-22

- Automate Publishing

## v0.7.0 2025-02-17

- Workspace (monorepo) support
- Seperate packages for CLI, library, and MAML

## v0.6.10 2025-02-17

- Configure `hc` CLI
- Trim Deno dependencies from library

## v0.6.9 2025-02-17

- Move version back to `deno.json`
- Add scripts/bump-version

## v0.6.8 2025-02-17

- Move version into `version.ts`

## v0.6.7 2025-02-16

- Flatten Frames into nodes compatible with
  [react-accessible-treeview](https://dgreene1.github.io/react-accessible-treeview/docs/api)
- move isNumeric and isAlphabetic into MetaFrame
- add Frame, Context, and MetaFrame to exports (with jsdoc)

## v0.6.6 2025-02-16

- Split out Context type
- Add tests for Context
- Expose `make_context` method for use in tests
- Add `equals` and `isEqualTo` methods in Frame

NOTE: Cannot export `Context` without exporing all of `Frame`

## v0.6.5 2025-02-16

- Refactor main module to fix parsing
- Add exports for main, getEval, getOptions, and runfile
- Add tests
- Add return types

## v0.6.4 2025-02-15

- Use `mod.ts`
- Change `evaluate` to accept a context
- Add methods to compare and print contexts

## v0.6.3 2025-02-15

- Tweak release script

## v0.6.2 2025-02-15

- First auto-generated release

## v0.6.1 2025-02-15

- Fix auto-publish
- Get version from deno.json

## v0.6.0 2025-02-15

- Migrated to Deno
- Dropped support for
  [FrameBytes](https://github.com/TheSwanFactory/hclang/issues/220)

## v0.5.14 2023-11-02

- Document auto-publish

## v0.5.12 2023-11-02

- Support naked operators

## v0.5.11 2023-10-09

- Past simple doctests

## v0.5.0 2023-09-30

- Pass CLI tests
- Pass BLOB tests
- npm audit fix --force

## v0.4.0 2023-09-19

- Start keeping Changelog
- First ECMAScrtipt Version
- Pending BLOB and CLI tests
