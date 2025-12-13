# Homoiconic C (HC) Language Support for VS Code

Syntax highlighting and language support for
[Homoiconic C](https://github.com/TheSwanFactory/hclang) - a universal language
for code and data.

## Features

- **Comprehensive Syntax Highlighting** for all HC syntax elements:
  - Special values: `()` (nil), `<>` (all), `^` (parent), `_` (anonymous), `.`
    (this)
  - Comments: inline `#...#` and end-of-line `#...`
  - Strings: double-quoted `"..."` and backtick `` `...` ``
  - Numbers: decimal, binary `0b`, octal `0o`, hex `0x`, float, rational `1/3`,
    scientific notation
  - Time literals: `%date%`, `%time%`, `%datetime%`
  - BLOB literals: raw bytes `\n\content\` and base64 `0sBase64`
  - Identifiers with semantic prefixes:
    - Names (setters): `.property`
    - Controls: `@control`
    - References: `$reference`
  - Effect typing: `CONST`, `variable`, `mutable_`, `method:`
  - Access modifiers: `public`, `_protected`, `__private`
  - Operators: `+`, `-`, `*`, `/`, `=`, `<`, `>`, `~`, `!`, `?`, `:`, `|`, `&`
  - Frame delimiters: `{}` (lazy), `[]` (array), `()` (expr)

- **Smart Bracket Matching** for all frame types
- **Auto-closing Pairs** for brackets, quotes, and comments
- **Comment Toggle Support** with `#` delimiter

## Installation

### From VS Code Marketplace

Search for "Homoiconic C" in the Extensions view (`Cmd+Shift+X` /
`Ctrl+Shift+X`) and install.

### From Source

```bash
cd vscode-extension
npm install -g @vscode/vsce
vsce package
code --install-extension hclang-*.vsix
```

## Examples

### Basic HC Code

```hc
# Define a property
.square {_ * _}

# Use it
square 5  # Returns 25

# Conditional expression
( 1 > 5 ) ? 100 : 10  # Returns 10
```

### Numbers and Literals

```hc
# Various number formats
0b1101      # Binary
0o1337      # Octal
0xDEADBEEF  # Hexadecimal
123.456     # Float
1/3         # Rational
123.456.E.-10  # Scientific notation

# Time and data
%2025-01-01%  # Date literal
\5\Hello      # Raw bytes
0sQmFzZTY0    # Base64
```

### Identifiers and Effect Typing

```hc
# Effect typing
CONSTANT        # Immutable constant (uppercase)
variable        # Immutable variable
mutable_        # Mutable variable (trailing _)
method:         # Mutating method (trailing :)

# Access modifiers
public          # Public (default)
_protected      # Protected (single _)
__private       # Private (double __)

# Semantic prefixes
.setter         # Property setter
@control        # Control flow
$reference      # Reference/error
```

## Language Specification

For detailed language specification, see:

- [Grammar Reference](https://github.com/TheSwanFactory/hclang/blob/master/doc/GRAMMAR.md)
- [Language Documentation](https://github.com/TheSwanFactory/hclang/blob/master/doc/LANGUAGE.md)
- [HC Blog Post](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/)

## Development

### Setup

```bash
git clone https://github.com/TheSwanFactory/hclang.git
cd hclang/vscode-extension
```

### Testing Locally

Press `F5` in VS Code to launch the extension in a new Extension Development
Host window.

Or use the command line:

```bash
code --extensionDevelopmentPath=/path/to/hclang/vscode-extension
```

### Building and Publishing

Using Deno tasks from the repo root:

```bash
# Package the extension
deno task vscode:package

# Publish to marketplace
deno task vscode:publish

# Install locally
deno task vscode:install
```

## Contributing

Contributions are welcome! Please see the
[main repository](https://github.com/TheSwanFactory/hclang) for contribution
guidelines.

## License

MIT - See [LICENSE](../LICENSE) for details.

## Links

- [HC Repository](https://github.com/TheSwanFactory/hclang)
- [JSR Package](https://jsr.io/@swanfactory/hclang)
- [Issue Tracker](https://github.com/TheSwanFactory/hclang/issues)
