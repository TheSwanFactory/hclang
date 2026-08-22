# Change Log

All notable changes to the Homoiconic C VS Code extension will be documented in
this file.

## [0.2.1] - 2026-08-21

### Changed

- Highlight `$` as the current file or module namespace and `$$` as the explicit
  host namespace, matching HC v0.11.2. Unsupported dollar runs such as `$word`,
  `$$$`, and identifier suffixes are not highlighted as anchors, even partially.

## [0.2.0] - 2026-08-21

### Changed

- Highlight a mutating method as `method_`, matching HC v0.11.0, where a
  trailing underscore is the one marker for the whole effect axis. A trailing
  colon is no longer part of a name, so `:` highlights as the if-else operator
  everywhere.
- Scope a trailing-underscore name followed by a block as a mutating method
  declaration, dotted or not, and every other trailing-underscore name as a
  mutable name. A mutating method and a mutable name share a spelling now, so
  the following block is the only distinction available to a grammar.

## [0.1.0] - 2025-01-12

### Added

- Initial release of comprehensive HC syntax highlighting
- Support for all HC syntax elements from grammar specification:
  - Special values: `()`, `<>`, `^`, `_`, `.`
  - Comments: inline `#...#` and end-of-line
  - All numeric formats: decimal, binary, octal, hex, float, rational,
    scientific, semver
  - Time literals: `%date%`, `%time%`, `%datetime%`
  - BLOB literals: raw bytes and base64
  - Identifiers with semantic prefixes: `.name`, `@control`, `$reference`
  - Effect typing: `CONST`, `variable`, `mutable_`, `method:`
  - Access modifiers: public, `_protected`, `__private`
  - All operators: arithmetic, comparison, logical, functional
  - Frame delimiters: `{}`, `[]`, `()`
- Language configuration for bracket matching and auto-closing pairs
- Extension integrated into main hclang repository (replaces standalone
  language-hclang repo)

### Changed

- Migrated from standalone repository to monorepo structure in main hclang
  project
- Complete rewrite of TextMate grammar based on comprehensive grammar
  specification

### Deprecated

- Old standalone repository at TheSwanFactory/language-hclang is now deprecated
  in favor of this integrated extension
