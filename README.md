# Homoiconic C

[![JSR](https://jsr.io/badges/@swanfactory/hclang)](https://jsr.io/@swanfactory/hclang)
[![JSR Score](https://jsr.io/badges/@swanfactory/hclang/score)](https://jsr.io/@swanfactory/hclang)

A universal language for code and data.

## Introduction

[Homoiconic C](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/)
(HC) is a single universal language for code and data. This monorepo contains
the first implementation of HC as an interpreter written in TypeScript running
on [Deno](https://deno.land/).

The repository includes several packages:

- **[@swanfactory/hclang](https://jsr.io/@swanfactory/hclang)** - Core library
  published to JSR
- **CLI** - Interactive REPL and command-line tools
- **MAML** -
  [_Multipurpose Abstract Markup Language_](https://theswanfactory.wordpress.com/2016/11/08/introducing-maml-a-draft-proposal-for-html6/),
  a radically simple proposal for replacing web technologies (HTML, CSS,
  JavaScript, SVG) with a single format based on HC
- **Web** - Web components and Fresh framework integration

HC can also be used to define easily-parseable variants of other common file
formats (e.g., HCSV, HCSON).

## Quick Start

### Use as a Library

```bash
# Deno
deno add jsr:@swanfactory/hclang

# Node.js/npm
npx jsr add @swanfactory/hclang
```

Then in your code:

```typescript
import { execute } from "@swanfactory/hclang";

const result = execute("1 + 1");
console.log(result); // Output: '2'
```

See the [library documentation](https://jsr.io/@swanfactory/hclang/doc) for more
details.

### Run the REPL

From source:

```bash
git clone https://github.com/TheSwanFactory/hclang.git
cd hclang
deno task hc
```

This will launch the interactive HC interpreter.

### Run Tests

```bash
deno task test
```

## Usage

### Available Tasks

The root `deno.json` provides several tasks:

| Task                  | Description                                   |
| --------------------- | --------------------------------------------- |
| `deno task hc`        | Launch the HC REPL                            |
| `deno task test`      | Run all tests (format, lint, and test suites) |
| `deno task test:cli`  | Test CLI package                              |
| `deno task test:lib`  | Test library package                          |
| `deno task test:maml` | Test MAML package                             |
| `deno task test:web`  | Test web package                              |
| `deno task test:bs`   | Test BitScheme documentation                  |
| `deno task test:doc`  | Test HC documentation examples                |
| `deno task build`     | Build the HC CLI binary                       |

### BitScheme

[BitScheme](cli/hc/BitScheme.hc) is a specialized scripting language for
declaratively parsing, manipulating, and generating binary data. It includes
executable documentation that can be tested:

```bash
deno task test:bs
```

This runs the BitScheme interpreter on its own documentation, executing embedded
code examples and verifying outputs.

### Debug Mode

Enable verbose debugging output:

```bash
export DEBUG=true
deno task hc
```

## Development

### Setup

1. Clone the [GitHub repository](https://github.com/TheSwanFactory/hclang.git):

   ```bash
   git clone https://github.com/TheSwanFactory/hclang.git
   cd hclang
   ```

2. Install [Deno](https://github.com/denoland/deno):

   ```bash
   # macOS
   brew install deno

   # Other platforms: see https://deno.land/
   ```

3. Run tests:

   ```bash
   deno task test
   ```

### Project Structure

This is a Deno workspace (monorepo) with the following packages:

```text
hclang/
├── cli/          # HC command-line interface & REPL
├── lib/          # Core library (published to JSR)
├── maml/         # MAML markup language
├── web/          # Web components
├── doc/          # Documentation and papers
└── deno.json     # Workspace root configuration
```

### VS Code Extension

The VS Code extension for HC is now included in this repository at
[vscode-extension/](vscode-extension/). It provides comprehensive syntax
highlighting for all HC language features based on the complete grammar
specification.

**Installation:**

```bash
# Install from source
deno task vscode:install

# Or package for distribution
deno task vscode:package

# Or publish to marketplace
deno task vscode:publish
```

The extension recognizes `.hc` files and provides:

- Syntax highlighting for all HC elements (numbers, strings, identifiers,
  operators, etc.)
- Smart bracket matching for `{}`, `[]`, `()`
- Auto-closing pairs
- Comment toggling with `#`

**Note:** The old standalone
[language-hclang](https://github.com/TheSwanFactory/language-hclang) repository
is now deprecated in favor of this integrated extension.

## Publishing

For maintainers publishing new versions:

1. Ensure all tests pass:

   ```bash
   deno task test
   ```

2. Update version everywhere:

   ```bash
   deno task bump
   ```

   This updates `deno.json`, `lib/version.ts`, and all workspace package
   versions, then commits the changes.

3. Tag the release:

   ```bash
   deno task tag
   ```

   This creates a git tag and pushes it to GitHub.

4. Merge PR to `master` branch

   This automatically publishes to [JSR](https://jsr.io/@swanfactory/hclang) via
   GitHub Actions.

## Links

- **JSR Package**: [@swanfactory/hclang](https://jsr.io/@swanfactory/hclang)
- **Documentation**: [JSR Docs](https://jsr.io/@swanfactory/hclang/doc)
- **GitHub**: [TheSwanFactory/hclang](https://github.com/TheSwanFactory/hclang)
- **Blog**:
  [Homoiconic C Introduction](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/)
- **MAML**:
  [HTML6 Proposal](https://theswanfactory.wordpress.com/2016/11/08/introducing-maml-a-draft-proposal-for-html6/)

## License

MIT
