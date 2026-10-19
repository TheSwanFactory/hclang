# CHANGELOG

> Create concise entries for changes since the last tag User-visible changes
> only (ignore internal cleanup) one-line per change Ignore spec documents, and
> deprioritize test-only changes

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
