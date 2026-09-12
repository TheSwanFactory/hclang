# CHANGELOG

> Create concise entries for changes since the last tag User-visible changes
> only (ignore internal cleanup) one-line per change Ignore spec documents, and
> deprioritize test-only changes

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
