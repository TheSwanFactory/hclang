# Homoiconic C (HC) - Developer Guide

## Overview

Homoiconic C (HC) is a universal language for code and data where both share the
same representation. This monorepo contains the complete implementation,
including core library, command-line tools, and web interface.

## Project Structure

This is a Deno workspace (monorepo) organized into several packages:

```
hclang/
├── cli/              # Command-line interface and REPL
├── lib/              # Core library (published to JSR)
│   ├── execute/      # Language processing pipeline
│   ├── frames/       # Core data structures
│   └── ops/          # Built-in operations
├── maml/             # MAML markup language
├── web/              # Web interface
├── doc/              # Documentation and papers
└── vscode-extension/ # VS Code syntax highlighting
```

## Package Documentation

Each package has detailed documentation in its own CLAUDE.md file:

### Core Packages

- **[cli/CLAUDE.md](cli/CLAUDE.md)** - Command-line interface, REPL, and
  BitScheme
  - Interactive interpreter
  - File execution
  - Binary data manipulation with BitScheme

- **[lib/execute/CLAUDE.md](lib/execute/CLAUDE.md)** - Language processing
  pipeline
  - Lexing (tokenization)
  - Parsing (syntax tree construction)
  - Evaluation (execution)

- **[lib/frames/CLAUDE.md](lib/frames/CLAUDE.md)** - Core data structures
  - Frame types and protocol
  - Homoiconic representation
  - Context management

- **[lib/ops/CLAUDE.md](lib/ops/CLAUDE.md)** - Built-in operations
  - Mathematical operations
  - Control flow (conditionals, iteration)
  - Higher-order functions

- **[web/CLAUDE.md](web/CLAUDE.md)** - Web interface
  - Single-file offline `hcweb.html` release artifact
  - Reusable Preact components published as `@swanfactory/hcweb`
  - Browser-based HC execution with transitive hclang loading

## Quick Start

### Installation

```bash
# For library usage
deno add jsr:@swanfactory/hclang

# For development
git clone https://github.com/TheSwanFactory/hclang.git
cd hclang
deno task test
```

### Basic Usage

```typescript
// As a library
import { execute } from "@swanfactory/hclang";
const result = execute("1 + 1");
console.log(result); // "2"

// From command line
deno task hc               # Launch REPL
deno task hc file.hc       # Execute file
```

## Development Workflow

### Running Tests

```bash
deno task test              # Run all tests
deno task test:cli          # Test CLI package
deno task test:lib          # Test library package
deno task test:web          # Test web package
```

### Code Quality

```bash
deno fmt                    # Format code
deno lint --fix             # Lint and fix issues
deno task setup             # Install pre-commit hooks
```

### Building

```bash
deno task build             # Build the CLI and Fresh web application
```

## Key Concepts

### Homoiconicity

HC's fundamental principle: code and data use the same representation (frames).
This enables:

- Treating programs as data
- Meta-programming without special syntax
- Uniform manipulation of code and values

### Frames

The universal building block. Everything in HC is a frame:

- Primitive values (numbers, strings)
- Collections (arrays, dictionaries)
- Expressions and functions
- The evaluation context itself

### Pipeline Architecture

HC processes code through a stateless lexical boundary before its familiar
Lex/Parse/Eval stages:

1. **Symbolicate** - String → `FrameSymbol`
2. **Sigilize** - Symbol + active lexical Frame → routed scan decision
3. **Lex** - Syntax-owned lexical state → Token or structural action
4. **Parse** - Tokens/actions → Frames (AST)
5. **Eval** - Frames → Results

Sigilizer holds no input state. Registered families advertise an immutable
static `SYNTAX` descriptor carrying their `SIGIL_STARTS` metadata and their own
recognition decisions through the neutral protocol in `lib/scan.ts`. Recognition
is class-side and stateless, so `Lex` never constructs a value to ask a question
about syntax; construction happens only through the descriptor's explicit value
factory.

A Sigil start selects one of two lexical paths. `atom` mode reads a
single-delimiter atom, where asymmetric delimiters nest by matching pairs. `run`
mode reads a family whose maximal run length selects nesting depth: an odd run
opens, an equal run closes, an even run is empty, and a longer interior run is
an error. Documents (`` ` ``) and ASCII-quoted strings (`"`) share that one
rule, so run length never selects a type.

### Delimiter Families

A delimiter earns its keep only when it changes what the delimited text denotes:

| Delimiter | Denotes                                         |
| --------- | ----------------------------------------------- |
| `“ ”`     | the characters, canonical spelling              |
| `" "`     | the characters, ASCII input spelling            |
| `'…'`     | an inert name for something outside the program |
| `` ` ``   | foreign content, verbatim GFM prose             |
| `#…#`     | a comment, which is also a string               |

## Project Guidelines

### Code Organization

- **lib/** - Pure, reusable library code
- **cli/** - Command-line interface wrapping lib
- **web/** - Web interface wrapping lib
- Keep lib/ independent of cli/ and web/

### Testing Standards

- Write tests for all new functionality
- Each file should have a corresponding `.test.ts`
- Use `@std/expect` for assertions
- Aim for high coverage

### Documentation

- Update CLAUDE.md files when adding major features
- Keep README.md in sync with capabilities
- Document public APIs in JSDoc comments
- Include usage examples

### Style Guide

- Use TypeScript strict mode
- Prefer explicit return types
- Use descriptive variable names
- Keep functions small and focused
- Follow Deno style guide

## Common Development Tasks

### Adding a Language Feature

1. Read [lib/execute/CLAUDE.md](lib/execute/CLAUDE.md) for pipeline overview
2. Register source starts with the owning Frame's static `SIGIL_STARTS`
3. Publish a static `SYNTAX` descriptor with `recognize`, `finish`, and
   `fromSource`, composing the shared rules in `lib/frames/atom-syntax.ts`
4. Add structural actions in `lib/execute/terminals.ts` when applicable
5. Register the descriptor in `lib/execute/syntax.ts`
6. Implement evaluation in `lib/execute/hc-eval.ts` or `lib/execute/hc-lang.ts`
7. Add tests at each affected boundary
8. Update documentation

### Adding a Built-in Operation

1. Read [lib/ops/CLAUDE.md](lib/ops/CLAUDE.md)
2. Choose appropriate module (math, conditionals, iterators, etc.)
3. Implement as a Frame subclass
4. Register in language context
5. Add tests
6. Document usage

### Adding a Frame Type

1. Read [lib/frames/CLAUDE.md](lib/frames/CLAUDE.md) for frame protocol
2. Extend appropriate base class (Frame, FrameAtom, etc.)
3. Implement required protocol methods
4. Add constructor and initialization
5. Implement toString() and toStringArray()
6. Add comprehensive tests
7. Update frame type documentation

## Publishing

### Version Management

```bash
deno task bump              # Bump the patch version everywhere and commit
deno task bump --minor      # Bump the minor version instead, resetting the patch
```

The task updates the five `deno.json` files and `lib/version.ts`, runs
`deno install`, then stages and commits the result. Any other argument is
refused rather than ignored.

### Publishing to JSR and GitHub Releases

Merge the PR to the `master` branch. GitHub Actions compares the version in
`deno.json` with the version before the merge. When the version changed, it
publishes the package to [JSR](https://jsr.io/@swanfactory/hclang) and creates a
GitHub Release tagged `v<version>` with generated notes. Merges without a
version bump do not publish or create a release; no manual tag is required.

### VS Code Extension

```bash
deno task vscode:package    # Create .vsix file
deno task vscode:publish    # Publish to marketplace
deno task vscode:install    # Install locally
```

The extension versions independently of the runtime packages, in
`vscode-extension/package.json`. GitHub Actions publishes it the same way it
publishes to JSR: when a merge to `master` changes that version, the workflow
runs `deno task vscode:publish` after the full test suite passes. Merges that
leave the version alone do not publish.

Publishing authenticates with a Marketplace personal access token, read from the
`VSCE_PAT` repository secret. The token belongs to the `TheSwanFactory`
publisher and is minted at
[Azure DevOps](https://dev.azure.com/ErnestPrabhakar/_usersSettings/tokens);
these tokens expire within a year, so a publish that fails to authenticate
usually needs a fresh one rather than a workflow change. Rotate it with:

```bash
gh secret set VSCE_PAT   # paste or pipe the token on stdin, never as an argument
```

Publishing a version the Marketplace already has is refused, so the version must
be bumped before the merge. To publish a version the automation would otherwise
skip, run the workflow manually from the Actions tab with **Publish the VS Code
extension** checked. Running `deno task vscode:publish` locally also works and
needs `VSCE_PAT` exported in the shell.

## Architecture Overview

### Library (lib/)

The core interpreter, designed to be:

- Framework-agnostic
- Usable in Node, Deno, and browsers
- Published to JSR as `@swanfactory/hclang`

See sub-package documentation:

- [lib/execute/](lib/execute/CLAUDE.md) - Pipeline stages
- [lib/frames/](lib/frames/CLAUDE.md) - Data structures
- [lib/ops/](lib/ops/CLAUDE.md) - Operations

### CLI (cli/)

Command-line tools built on lib:

- REPL for interactive use
- File execution
- BitScheme for binary data

See [cli/CLAUDE.md](cli/CLAUDE.md)

### Web (web/)

Preact playground distributed two ways:

- `web/dist/hcweb.html`, one offline file attached to each GitHub release
- `@swanfactory/hcweb` on JSR for embedding, loading hclang transitively
- One authoritative browser-based HC interpreter, no server or SSR
- Bundled by `scripts/build-hcweb.ts` using Deno's browser bundler

See [web/CLAUDE.md](web/CLAUDE.md)

## Resources

### Documentation

- **Main README**: [README.md](README.md)
- **Library API**: [JSR Documentation](https://jsr.io/@swanfactory/hclang/doc)
- **Package READMEs**: Each package has a README.md
- **Package Guides**: Each package has a CLAUDE.md

### Links

- **JSR Package**: [@swanfactory/hclang](https://jsr.io/@swanfactory/hclang)
- **GitHub**: [TheSwanFactory/hclang](https://github.com/TheSwanFactory/hclang)
- **Blog**:
  [Homoiconic C Introduction](https://theswanfactory.wordpress.com/2016/12/20/homoiconic-c-a-universal-language-for-code-and-data/)
- **MAML**:
  [HTML6 Proposal](https://theswanfactory.wordpress.com/2016/11/08/introducing-maml-a-draft-proposal-for-html6/)

### Getting Help

- Check package-specific CLAUDE.md files
- Review tests for usage examples
- Read JSR documentation
- Check GitHub issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `deno task test` to ensure everything works
5. Submit a pull request to `master`

All contributions should:

- Include tests
- Follow the style guide
- Update relevant documentation
- Pass all CI checks

## License

MIT - See [LICENSE](LICENSE)
