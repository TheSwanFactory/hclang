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
  - Standalone HTML page
  - Fresh framework server
  - Browser-based HC execution

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
deno task build             # Build CLI binary
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

HC processes code through a three-stage pipeline:

1. **Lex** - Text → Tokens
2. **Parse** - Tokens → Frames (AST)
3. **Eval** - Frames → Results

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
2. Add token definition in `lib/execute/terminals.ts`
3. Update lexer in `lib/execute/lex.ts`
4. Add syntax rules in `lib/execute/syntax.ts`
5. Implement evaluation in `lib/execute/hc-eval.ts` or `lib/execute/hc-lang.ts`
6. Add tests at each stage
7. Update documentation

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
deno task bump              # Update version everywhere
deno task tag               # Create and push git tag
```

### Publishing to JSR

Merge PR to `master` branch - GitHub Actions automatically publishes to
[JSR](https://jsr.io/@swanfactory/hclang).

### VS Code Extension

```bash
deno task vscode:package    # Create .vsix file
deno task vscode:publish    # Publish to marketplace
deno task vscode:install    # Install locally
```

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

Browser interface built on lib:

- Standalone HTML page
- Fresh framework for dev server
- Client-side HC execution

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
