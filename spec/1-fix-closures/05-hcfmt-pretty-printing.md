# HC Pretty-Printing Specification (hcfmt Pretty Mode)

## Goal

Define a deterministic, opinionated pretty-printing profile for HC, inspired by
established formatters (Go `gofmt`, Rust `rustfmt`, Deno `deno fmt`, Prettier).
This complements the canonical spacing rules by adding line breaks and
indentation while guaranteeing a single stable output for any valid HC source.

All examples below show the **formatted output** shape, not the raw input. Each
example notes the `maxWidth` in effect so it’s clear when line breaks are
expected.

## Guiding Principles

- **Deterministic**: Same input ⇒ same output; idempotent.
- **Semantic preservation**: Output parses to the same AST/behavior.
- **Stability over taste**: Rules are consistent and minimal; no user knobs.
- **Width-aware**: Respect a configured line width (default 128), breaking lines
  predictably.
- **Comment-preserving**: Comments stay attached to their logical anchors.

## Influences (behavioral references)

- `gofmt`: zero configuration, AST-driven, width-aware line breaking.
- `rustfmt`: width-aware, stable ordering, comment preservation.
- `deno fmt` / Prettier: consistent whitespace, trailing commas where allowed,
  strong width-sensitive wrapping.

## Formatting Model

1. **Parse** to Frames/AST.
2. **Annotate** comments with attachment points (before/inline/after).
3. **Measure** to decide when to break lines given `maxWidth` (default 128).
4. **Render** with indentation and spacing rules below.

## Line Breaking Rules

- **General**: Prefer single-line if it fits within `maxWidth`; otherwise apply
  structured breaks.
- **Closures `{ ... }`**:
  - Empty: `{}`.
  - Single short expression: `{ expr }` on one line if it fits.
  - Multi-item or long:

    ```hc
    {
      expr1;
      expr2;
      expr3;
    }
    ```

  - Body indented +2 spaces (configurable indent, default 2).
- **Arrays `[...]`**:
  - Short: `[a, b, c]` if it fits.
  - Long: break after `[` and before `]`, one element per line (no trailing
    comma):

    ```hc
    [
      a,
      b
    ]
    ```

- **Groups `(...)`**:
  - Expr grouping stays compact when possible.
  - Statement groups or long expressions may break similar to arrays, with
    aligned indentation.
- **Binary operators**:
  - Prefer break _after_ the operator (Rust/Prettier style):

    ```hc
    (long_lhs
      + long_rhs)
    ```

  - Chains may align operators vertically when broken.
- **Pipelines / sequences**: If modeled as multiple expressions, place one per
  line when exceeding width.
- NOTE: hclang a) does NOT have lookahead, b) interprets newline as a
  terminator, and c) allows hanging operators as curry
  - SO: multi-line expressions require explicit grouping

## Indentation

- Default 2 spaces per indent level.
- Nesting increases indent for:
  - Closure bodies
  - Array elements when multiline
  - Grouped multi-line expressions
- Comments inherit the indentation of their anchor.

## Comments

- **Inline comments**: Stay on the same line when it fits; otherwise move to the
  preceding line with matching indentation.
- **Leading comments**: Stay immediately before their anchor node, separated by
  a newline if the anchor starts a new block.
- **Trailing comments**: Remain attached to the statement/expression they
  follow, preserving a single space before `#`.

## Trailing Commas

- No trailing commas. Multi-line arrays omit a trailing comma on the final
  element to keep output minimal and uniform.

## Long Literals and Strings

- Do not alter numeric literal base/casing.
- Doc strings and raw blocks keep content; formatter may reflow surrounding
  indentation but not internal text.

## Width Configuration

- `maxWidth` default 128; formatter must emit the same shape for given width.
- No soft/hard wrap modes; a single algorithm decides breaks based on width and
  constructs.

## Idempotence

Running pretty mode twice yields identical output:
`pretty(pretty(src)) ==
pretty(src)`.

## Error Handling

- Parse failures reported; no output emitted.
- If a node cannot be pretty-printed deterministically, fall back to canonical
  single-line form for that node (fail-safe).

## Examples (indent 2)

### Single-line fits (maxWidth 128)

```hc
{ _ + 1 }
[1, 2, 3]
(.x 1; .y 2;)
```

### Multi-line closure (forced by tight width; maxWidth 40)

```hc
{
  _ + 1;
  x + y;
}
```

### Multi-line array (forced by tight width; maxWidth 40)

```hc
[
  long_value_one,
  long_value_two,
  long_value_three
]
```

Operator break:

```hc
long_identifier
  + another_long_identifier
  + third_part
```

Inline comment that overflows:

```hc
_ + 1  # short comment
```

Becomes (if too long for line):

```hc
# short comment
_ + 1
```

## Open Questions

- Operator chains: prefer a consistent break-after-operator style without extra
  alignment columns to keep the formatter simple.
- How to format nested doc strings within closures when width is tight (leave as
  is seems safest)?
