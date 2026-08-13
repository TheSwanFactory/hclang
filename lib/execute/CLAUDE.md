# Execute Package - HC Language Processing Pipeline

## Overview

The `execute` package implements the complete language processing pipeline for
Homoiconic C, from raw text input to evaluated results. This is the core
execution engine that powers both the REPL and programmatic usage.

## Architecture

The execution pipeline has five explicit boundaries:

1. **Symbolication** - Convert source characters into `FrameSymbol` values
2. **Sigilization** - Route each Symbol to the active lexical Frame
3. **Lexing** - Accumulate syntax-owned scan decisions into Tokens or actions
4. **Parsing** - Build Frame expressions and aggregates from Tokens
5. **Evaluation** - Execute the parsed Frames in a context

In compact form:

```text
String -> Symbol -> Sigilizer -> Lex/Frame scanner -> Token or action -> Parse -> Eval
```

Sigilizer is a stateless phase driver. Input-dependent state remains in the
active `Lex` or syntax-specific Frame. Those Frames return the neutral scan
decisions defined in `../scan.ts`; Sigilizer alone routes consume, completion,
redispatch, transition, and lexical failure.

## Key Components

### High-Level API

- [execute.ts](execute.ts) - Main entry point, returns string results
- [evaluate.ts](evaluate.ts) - Returns FrameArray results for more control
- [script-spec.ts](script-spec.ts) - Script execution specifications

### Lexing (Tokenization)

- [sigilizer.ts](sigilizer.ts) - Stateless routing of Frame scan decisions
- [../scan.ts](../scan.ts) - Neutral scan protocol and static Sigil metadata
- [syntax.ts](syntax.ts) - Class-level `SIGIL_STARTS` registration
- [lex.ts](lex.ts) - Generic Token-building lexical state
- [lex-doc.ts](lex-doc.ts) - Document-fence lexical state
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
// Symbol -> Sigilizer -> Lex -> Parse -> Evaluate
text -> FrameSymbol -> scan protocol -> lex-pipe -> parse-pipe -> eval-pipe -> result
```

## Development Guidelines

### Testing

- Each component has corresponding `.test.ts` files
- Tests validate individual stages and end-to-end execution
- Use `deno test lib/execute` to run all tests

### Adding Language Features

1. Advertise lexical or structural starts with static `SIGIL_STARTS`
2. Put syntax-specific continuation and EOF rules in the owning Frame's `scan()`
   and `finishInput()` methods
3. Add structural terminal definitions in [terminals.ts](terminals.ts) if needed
4. Add parser registration in [syntax.ts](syntax.ts)
5. Implement evaluation logic in [hc-eval.ts](hc-eval.ts) or
   [hc-lang.ts](hc-lang.ts)
6. Add focused scan, lexer, parser, and end-to-end tests as applicable

### Debugging

- Set `DEBUG=true` environment variable
- Use [hc-log.ts](hc-log.ts) utilities for debug output
- Check [hc-test.ts](hc-test.ts) for test-specific debugging

## Pipeline Details

### Lex Pipe

1. Takes raw string input
2. Converts each character to a `FrameSymbol`
3. Uses Sigilizer to route the selected Frame's scan decision
4. Emits completed Tokens or committed structural actions

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
