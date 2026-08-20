# CHANGELOG

> Create concise entries for changes since the last tag User-visible changes
> only (ignore internal cleanup) one-line per change Ignore spec documents, and
> deprioritize test-only changes

## Unreleased

- Remove transitional recognition and the pointed error for `._^`; `.^` is the
  only parent-declaration spelling, and old input follows ordinary name/operator
  tokenization.

## v0.10.1 2026-08-18

- Refuse a protected member reached through containment rather than inheritance,
  so a nested aggregate's method reading an enclosing frame's `_secret` reports
  `$!.is-protected` instead of returning the value.
- Declare an aggregate's parent as `.^ base`, which now inherits the parent's
  bindings; the parent is declarable only on the aggregate under construction.
- Refuse the retired `._^` spelling with `$!.retired-syntax ._^ .^` instead of
  silently declaring a protected member named `^` and leaving the aggregate with
  no parent at all.
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
