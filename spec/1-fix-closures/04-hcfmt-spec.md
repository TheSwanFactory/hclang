# HC Formatting ("hcfmt") Specification

## Goal

Define the canonical formatting (“quining”) rules for HC source so any valid HC
program can be parsed and re‑emitted in a stable, deterministic form. This spec
is for a formatter tool and does **not** implement code.

## Scope

- Input: Valid HC source (statements and expressions).
- Output: Canonically formatted HC source that round-trips through the parser.
- Stable output: Same input ⇒ same output; formatting idempotent.
- Out of scope: Error recovery, linting, refactors.

## Pipeline Expectations

1. **Parse** input into Frame structures via existing lexer/parser.
2. **Format** by walking Frames and emitting canonical strings using these
   rules.
3. **Round-trip guarantee**: `format(parse(src))` produces equivalent program
   semantics and a deterministic textual form.

## Core Formatting Rules

- **Whitespace normalization**
  - Tokens separated by single spaces where needed for
    readability/disambiguation.
  - No leading/trailing spaces on lines except inside group delimiters as noted.
  - Newlines preserved only where syntactically required (statements remain
    terminated with `;`).

- **Closures `{}` (FrameLazy)**
  - Empty closure: `{}`.
  - Non-empty closure: surround body with single leading/trailing spaces.
    - Examples: `{ 1 }`, `{ _ }`, `{ _ + 1 }`, `{ x y }`.
  - Body uses space separators (no commas).

- **Arrays `[]` (FrameArray)**
  - Elements comma-separated with single space after comma.
  - No trailing comma.
  - Example: `[1, 2, 3]`.

- **Groups `()` (FrameExpr/FrameGroup)**
  - Empty: `()`.
  - Non-empty expressions separated by single space unless operator spacing rule
    applies.

- **Statements (`;`)**
  - Each statement ends with `;`.
  - Inside groups/arrays/closures, statement markers remain attached to their
    expression (no extra space before `;` beyond token separation).

- **Operators**
  - Binary operators spaced: `a + b`, `a * b`.
  - Unary operators tight to operand: `-x`, `!x`.
  - Dot operators keep existing lexical form: `3.+2` remains `3.+2`; plain `+`
    uses spaced form.

- **Strings**
  - String literals preserve their quote style (e.g., `“ ... ”`).
  - Adjacent strings normalized to concatenated form if semantics require (e.g.,
    `“Hello”“, HC!”` ⇒ `“Hello, HC!”` as currently emitted by evaluation).

- **Anonymous arguments `_`, `__`, … and parent `_^`**
  - Preserve underscore counts and caret placement.
  - Follow closure spacing rules when inside closures.

- **Doc strings and comments**
  - Comments are preserved. A comment immediately following a token stays
    attached to that token; otherwise it binds to the following line/statement.
    Canonical placement: a single leading space before an inline comment.
  - Doc strings normalize to triple-backtick blocks with content unchanged.

- **Numeric literals**
  - Preserve input representation (decimal/hex/etc.). Do not normalize the
    numeric base or casing; emit exactly what was parsed for each literal.

- **Metadata (Frame meta)**
  - Formatter should omit runtime metadata (e.g., captured contexts) from
    output, consistent with existing `toString()` behavior for closures.

## Idempotence

Running the formatter repeatedly must produce identical output:
`format(format(src)) == format(src)`.

## Error Handling

- Input that fails to parse: formatter reports parse error and does not emit
  output.
- No attempt to repair invalid syntax.

## Determinism

- Output must not depend on insertion order of metadata keys.
- Traversal order is the parsed order of Frames.

## Examples

| Input            | Canonical Output |
| ---------------- | ---------------- |
| `{_}`            | `{ _ }`          |
| `{1}`            | `{ 1 }`          |
| `{ _ + 1 }`      | `{ _ + 1 }`      |
| `[1,2,3]`        | `[1, 2, 3]`      |
| `{x+y}`          | `{ x + y }`      |
| `(.x 1; .y 2;)`  | `(.x 1; .y 2;)`  |
| `{ { _ + __ } }` | `{ { _ + __ } }` |

## Open Questions

- Multi-line layout / pretty-printing: should the canonical form choose
  single-line, or can it choose an aesthetically “pretty” layout while staying
  deterministic? (Ideal: a deterministic pretty-printer that may introduce line
  breaks/indentation but yields a single canonical result.)

## Acceptance Criteria

- Formatter produces outputs matching rules above for all valid HC inputs.
- All existing parsing/evaluation tests continue to pass when fed formatted
  output.
- Idempotence property holds across the test corpus.
