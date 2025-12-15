# CLI Package - Homoiconic C Command-Line Interface

## Overview

The CLI package provides the interactive REPL and command-line tools for
Homoiconic C (HC). This is the primary interface for users to interact with the
HC interpreter from the command line.

## Key Components

### Main Entry Point

- [hc.ts](hc.ts) - Main CLI entry point and REPL implementation
- Handles command-line arguments, file execution, and interactive mode
- Integrates with the HC interpreter from the lib package

### Core Utilities

- [flatten.ts](flatten.ts) - Flattens nested structures for display
- [prompt.ts](prompt.ts) - REPL prompt handling
- [runfile.ts](runfile.ts) - File execution utilities

### BitScheme

- [hc/BitScheme.hc](hc/BitScheme.hc) - Binary data manipulation language
- Executable documentation with embedded test examples
- Run tests with: `deno task test:bs`

## Usage

### Running the REPL

```bash
deno task hc
# or from root: deno task hc
```

### Running HC Files

```bash
deno task hc path/to/file.hc
```

### Running Tests

```bash
deno task test
```

### Building the Binary

```bash
deno task build
# Outputs to: ../scripts/hc
```

## Development Guidelines

### Testing

- Write tests alongside source files (e.g., [hc.test.ts](hc.test.ts))
- Use `@std/expect` for assertions
- Tests run with: `deno test --allow-env --allow-read --allow-write`

### Adding New Commands

1. Add command handling in [hc.ts](hc.ts)
2. Parse arguments using `@std/cli`
3. Add tests in corresponding `.test.ts` file
4. Document in CLI help text

### Dependencies

- `@nothing628/chalk` - Terminal colors and formatting
- `@std/cli` - Command-line argument parsing
- `@std/expect` - Testing assertions
- Uses `@swanfactory/hclang` library from parent workspace

## Architecture

The CLI acts as a thin wrapper around the core library (`lib/`):

1. Parses command-line arguments
2. Reads input (files or REPL)
3. Calls `execute()` or `evaluate()` from the library
4. Formats and displays results

## Important Notes

- Debug mode: Set `DEBUG=true` environment variable
- The CLI requires `--allow-read`, `--allow-write`, and `--allow-env`
  permissions
- BitScheme is self-documenting - the documentation files are executable
- REPL supports multi-line input and command history
