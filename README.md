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
  JavaScript, SVG) with a single format based on HC. Its HTML renderer ships
  with the core library as `jsr:@swanfactory/hclang/maml`
- **Web** - the offline `hcweb.html` playground and the `@swanfactory/hcweb`
  component

HC can also be used to define easily-parseable variants of other common file
formats (e.g., HCSV, HCSON).

## Quick Start

### Try it Online

Visit [The Swan Factory HC playground](https://theswanfactory.github.io/hclang/)
to try HC directly in your browser with no installation required. For offline
use, download
[`hcweb.html` from the latest release](https://github.com/TheSwanFactory/hclang/releases/latest/download/hcweb.html)
and open it in your browser.

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

### Run the CLI

With Node.js 24 or newer, run the current CLI directly from npm. Deno is not
required:

```bash
# Interactive REPL
npx hclang@latest

# Evaluate a file
npx hclang@latest path/to/program.hc

# Verify executable examples in an HC document
npx hclang@latest path/to/examples.hc --testdoc
```

From source:

```bash
git clone https://github.com/TheSwanFactory/hclang.git
cd hclang
deno task hc
```

This will launch the interactive HC interpreter. The `hc` task regenerates the
local, gitignored HC bundle automatically on a fresh clone.

### Run Tests

```bash
deno task test
```

## Usage

### Available Tasks

The root `deno.json` provides several tasks:

| Task                               | Description                                                         |
| ---------------------------------- | ------------------------------------------------------------------- |
| `deno task hc`                     | Launch the HC REPL                                                  |
| `deno task setup`                  | Install the git hooks (deno-hooks)                                  |
| `deno task test`                   | Check formatting and lint, then run all tests                       |
| `deno task test:all`               | Run every package's tests, without fmt and lint                     |
| `deno task fix`                    | Format sources and apply lint fixes                                 |
| `deno task test:cli`               | Test CLI package                                                    |
| `deno task test:lib`               | Test library package                                                |
| `deno task test:maml`              | Test MAML (`lib/maml/`) alone; `test:lib` also runs it              |
| `deno task test:web`               | Test web package                                                    |
| `deno task test:scripts`           | Test the build and release scripts                                  |
| `deno task test:observer-algebras` | Test experiment 007                                                 |
| `deno task test:classical-cd`      | Test experiment 017                                                 |
| `deno task test:compiled`          | Build the CLI binary and run it from an empty directory             |
| `deno task test:load-order`        | Check that every `lib/` module loads when imported first            |
| `deno task check`                  | Type-check, check the README code blocks, and run `deno doc --lint` |
| `deno task coverage:check`         | Check each package's line-coverage floor, as CI does                |
| `deno task test:bs`                | Test BitScheme documentation                                        |
| `deno task test:doc`               | Test HC documentation examples                                      |
| `deno task build`                  | Build native, npm, and web artifacts                                |
| `deno task build:npm`              | Generate the Node.js CLI package in `dist/npm`                      |
| `deno task test:npm`               | Pack and smoke-test the CLI package through `npx`                   |

`test:doc` automatically discovers every `hc/*.hc` file with an HC shebang and
an executable `; source` / `# expected` pair. It runs each testdoc in an
independent session; there is no file list to update. `test:bs` remains a
convenient focused command for BitScheme alone.

### BitScheme

[BitScheme](hc/BitScheme.hc) is a specialized scripting language for
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

3. (Optional) Install the git hooks with `deno task setup`. It installs
   [deno-hooks](https://jsr.io/@theswanfactory/deno-hooks) as configured in
   `deno-hooks.yml`: a pre-commit hook that runs `deno fmt --check` and
   `deno lint` over the working tree, and a pre-push hook that runs
   `deno task test:all`. The pre-commit hook checks and does not format; run
   `deno task fix` to format.

4. Run tests:

   ```bash
   deno task test
   ```

   This checks formatting and lint without fixing sources, then runs the test
   suite. Use `deno task fix` to format and apply lint fixes.

   A pull request from a branch in this repository is formatted in CI. When
   files change, CI pushes a `style: deno fmt` commit onto the branch; pull it
   before the next `deno task test`. Pushes to the default branch and fork pull
   requests fail `deno fmt --check` on drift.

   Build, test, and publish tasks automatically regenerate the bundled HC
   sources from `hc/*.hc`. `deno task bundle:check` is available to verify the
   generated module when needed. To type-check, run `deno task check`. Before a
   bare `deno test` or editor type-checking on a fresh clone, initialize that
   gitignored module once with `deno task bundle:embed`.

### Project Structure

This is a Deno workspace (monorepo). `cli/`, `lib/` and `web/` are its packages:

```text
hclang/
├── cli/               # HC command-line interface & REPL
├── lib/               # Core library (published to JSR), with MAML in lib/maml/
├── web/               # hcweb playground and component
├── hc/                # Bundled HC programs, modules and testdocs
├── scripts/           # Build, release and test scripts
├── doc/               # Language and design documentation, and papers
├── spec/              # Design records and specifications
├── experiments/       # Experiments, each with its own README
├── vscode-extension/  # VS Code syntax highlighting
└── deno.json          # Workspace configuration and tasks
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

3. Merge the PR to the `master` branch.

   GitHub Actions compares the version in `deno.json` with the version before
   the merge. When the version changed, it publishes the libraries to
   [JSR](https://jsr.io/@swanfactory/hclang), publishes the exact `hclang`
   tarball exercised through `npx`, and creates a GitHub Release tagged
   `v<version>` with generated notes. Each registry is checked independently, so
   a rerun resumes a partial release instead of retrying versions that are
   already immutable. Merges without a version bump do not publish or create a
   release; no manual tag is required.

   The tested web release also deploys to GitHub Pages. CI verifies the live
   version and evaluates HC in a browser after deployment; a daily availability
   workflow checks the public demo between releases. See the
   [web publishing setup](web/README.md#how-the-release-artifact-is-built).

   npm publishing runs in the protected `npm-publish` GitHub environment using a
   trusted publisher for the public `hclang` package. Its npm settings must
   authorize the `TheSwanFactory/hclang` repository,
   `.github/workflows/deno.js.yml`, the `npm-publish` environment, and direct
   `npm publish` before merging a release bump. The build/PR job has no OIDC
   token permission.

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
