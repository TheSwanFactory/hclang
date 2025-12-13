# Execute Package - HC Language Processing Pipeline

## Overview

The `execute` package implements the complete language processing pipeline for
Homoiconic C, from raw text input to evaluated results. This is the core
execution engine that powers both the REPL and programmatic usage.

## Architecture

The execution pipeline consists of three main stages:

1. **Lexing** - Convert raw text into tokens
2. **Parsing** - Build syntax trees from tokens
3. **Evaluation** - Execute the syntax trees in a context

## Key Components

### High-Level API

- [execute.ts](execute.ts) - Main entry point, returns string results
- [evaluate.ts](evaluate.ts) - Returns FrameArray results for more control
- [script-spec.ts](script-spec.ts) - Script execution specifications

### Lexing (Tokenization)

- [lex.ts](lex.ts) - Main lexer implementation
- [lexer.ts](lexer.ts) - Lexer interface and types
- [lex-bytes.ts](lex-bytes.ts) - Byte-level lexing
- [lex-pipe.ts](lex-pipe.ts) - Lexer pipeline composition
- [terminals.ts](terminals.ts) - Terminal token definitions

### Parsing

- [parse.ts](parse.ts) - Parser implementation (tests only)
- [parse-pipe.ts](parse-pipe.ts) - Parser pipeline composition
- [syntax.ts](syntax.ts) - Syntax definitions and rules

### Evaluation

- [hc-eval.ts](hc-eval.ts) - Core evaluation logic
- [eval-pipe.ts](eval-pipe.ts) - Evaluation pipeline composition
- [hc-lang.ts](hc-lang.ts) - Language semantics and built-ins
- [hc-test.ts](hc-test.ts) - Test execution support

### Utilities

- [hc-log.ts](hc-log.ts) - Logging and debugging utilities
- [hc-env.test.ts](hc-env.test.ts) - Environment setup tests

## Usage Examples

### Basic Execution

```typescript
import { execute } from "./execute.ts";

const result = execute("1 + 1");
console.log(result); // "2"
```

### Advanced Evaluation

```typescript
import { evaluate } from "./evaluate.ts";
import { make_context } from "../frames/context.ts";

const context = make_context({ x: "10" });
const result = evaluate("x * 2", context);
console.log(result.toStringArray()); // ["20"]
```

### Pipeline Composition

The package uses a pipe-based architecture where each stage can be composed:

```typescript
// Lex -> Parse -> Evaluate
text -> lex-pipe -> parse-pipe -> eval-pipe -> result
```

## Development Guidelines

### Testing

- Each component has corresponding `.test.ts` files
- Tests validate individual stages and end-to-end execution
- Use `deno test lib/execute` to run all tests

### Adding Language Features

1. Add terminal definitions in [terminals.ts](terminals.ts) if needed
2. Update lexer in [lex.ts](lex.ts) to recognize new syntax
3. Add syntax rules in [syntax.ts](syntax.ts)
4. Implement evaluation logic in [hc-eval.ts](hc-eval.ts) or
   [hc-lang.ts](hc-lang.ts)
5. Add tests at each stage

### Debugging

- Set `DEBUG=true` environment variable
- Use [hc-log.ts](hc-log.ts) utilities for debug output
- Check [hc-test.ts](hc-test.ts) for test-specific debugging

## Pipeline Details

### Lex Pipe

1. Takes raw string input
2. Converts to byte stream
3. Tokenizes into terminals
4. Outputs token stream

### Parse Pipe

1. Takes token stream
2. Groups into expressions
3. Builds syntax tree (Frame structures)
4. Outputs Frame objects

### Eval Pipe

1. Takes Frame objects
2. Evaluates in context
3. Applies operators and functions
4. Returns result Frames

## Important Notes

- The pipeline is purely functional - each stage is independent
- Context is threaded through evaluation for variable resolution
- Errors propagate through the pipeline with proper context
- All stages support streaming/lazy evaluation where possible
- The execute/evaluate distinction: `execute()` is convenience wrapper that
  stringifies results
