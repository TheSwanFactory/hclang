# HCLang Execution Flow

This document traces the execution flow in HCLang, from the high-level `execute`
function through each component in the execution pipeline.

## Execution Pipeline Overview

```
Input String → execute() → evaluate() → HCEval → LexPipe → ParsePipe → EvalPipe → Output
```

The execution process follows these main steps:

1. **Input Processing**: The input string is received by `execute.ts`
2. **Evaluation Setup**: The input is passed to `evaluate.ts` which sets up the
   evaluation environment
3. **Lexical Analysis**: The input is tokenized by the lexer (`lex.ts`,
   `lex-pipe.ts`)
4. **Parsing**: Tokens are parsed into structured expressions (`parse-pipe.ts`)
5. **Execution**: Expressions are evaluated (`eval-pipe.ts`)
6. **Testing**: Optional test operations are performed (`hc-test.ts`)

## Detailed Component Flow

### 1. `execute.ts`

The entry point for code execution is the `execute` function:

```typescript
export const execute = (input: string, meta = NilContext): string => {
  const result = evaluate(input, meta) as FrameArray;
  const array = result.toStringArray();
  const stripped = stripLastCommas(array);
  return stripped.join("\n");
};
```

This function:

- Takes an input string and optional context
- Calls `evaluate` to process the input
- Formats the result as a string (removing trailing commas and joining with
  newlines)

### 2. `evaluate.ts`

The `evaluate` function creates the execution environment:

```typescript
export const evaluate = (input: string, meta = NilContext): FrameArray => {
  const out = new FrameArray([], meta);
  const hc_eval = new HCEval(out);
  hc_eval.call(input);
  return out;
};
```

This function:

- Creates a new `FrameArray` to collect results
- Instantiates an `HCEval` object with the output frame
- Calls the `call` method on the `HCEval` instance with the input string
- Returns the output frame containing the results

### 3. `hc-eval.ts`

The `HCEval` class orchestrates the evaluation process by setting up the
execution pipeline:

```typescript
public static make_pipe(out: Frame): LexPipe {
  const evaluator = new EvalPipe(out); // evaluate groups into results
  const parser = new ParsePipe(evaluator, FrameGroup); // parse tokens into groups of expressions
  const lexer = new LexPipe(parser); // lex characters into tokens
  return lexer;
}
```

The `call` method processes input:

```typescript
public call(input: string): Frame | null {
  if (!input) {
    return null;
  }
  const source = new FrameString(input);
  this.checkInput(input);
  const result = source.reduce(this.lex);
  this.lex = (result instanceof Lex) ? result : this.pipe;
  return result;
}
```

### 4. `lex.ts`

The `Lex` class handles the lexical analysis of individual tokens:

```typescript
export class Lex extends Frame implements ISourced {
  // ...
  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    const char = argument.toString();
    const end = this.isEnd(char);
    const terminal = Lex.isTerminal(char);
    const not_quote = !this.isQuote();
    const not_space = char !== " ";

    if (end && terminal && not_space) { // ends token on a terminal
      return this.finish(argument, true);
    }
    if (end) { // ends token, but not on a terminal
      const use_arg_for_next_token = not_quote && !this.isComment();
      const result = this.finish(argument, use_arg_for_next_token);
      return result;
    }

    if (terminal && not_quote && not_space) { // unquoted terminal implicitly ends token
      return this.finish(argument, true);
    }

    // otherwise, add to body since still in interior
    // including quoted terminals

    if (this.body === "") {
      this.body = this.source;
    }
    this.body = this.body + argument.toString();
    return this;
  }
  // ...
}
```

The `Lex` class:

- Processes input characters one by one
- Determines when a token ends
- Handles special cases like quotes and comments
- Creates token frames when tokens are complete

### 5. `lex-pipe.ts`

The `LexPipe` class manages the lexical analysis process:

```typescript
export class LexPipe extends Frame implements IFinish, IPerformer {
  // ...
  public lex(source: FrameString): Frame {
    return source.reduce(this);
  }

  public perform(action: IAction): LexPipe {
    for (const [key, value] of Object.entries(action)) {
      const skip = key === "push";
      let parser = this.unbind(skip);
      switch (key) {
        case "semi-next": { // statement (property)
          parser.next(true);
          break;
        }
        case "next": { // expression (enumerable)
          parser.next(false);
          break;
        }
          // ... other actions
      }
    }
    return this;
  }
  // ...
}
```

The `LexPipe`:

- Processes the input string character by character
- Identifies tokens and passes them to the appropriate lexer
- Manages the state of the lexical analysis
- Performs actions when terminals are encountered

### 6. `parse-pipe.ts`

The `ParsePipe` class handles parsing tokens into structured expressions:

```typescript
export class ParsePipe extends FrameArray implements IFinish {
  // ...
  public next(statement: boolean = false): ParsePipe {
    if (this.length() === 0) {
      return this;
    }
    const term = this.asArray();
    const expr = new FrameExpr(term);
    if (statement) {
      expr.is.statement = true;
    }
    this.collector.push(expr);
    this.reset();
    return this;
  }

  public finish(terminal: Frame): Frame {
    this.next();
    const out = this.get(Frame.kOUT);
    let value = this.makeFrame();
    if (value instanceof FrameBind && value.isEmpty()) {
      return out;
    }
    if (value instanceof FrameSchema && value.isEmpty()) {
      value = Frame.all;
    }
    const result = out.call(value);
    out.call(terminal);
    return result;
  }
  // ...
}
```

The parser:

- Collects tokens into expressions
- Creates appropriate frame structures based on token types
- Handles nested expressions
- Passes completed expressions to the evaluator

### 7. `eval-pipe.ts`

The `EvalPipe` class handles evaluation of parsed expressions:

```typescript
export class EvalPipe extends Frame {
  // ...
  public override apply(expr: Frame, context: Frame): Frame {
    const out = this.get(Frame.kOUT);
    const result = expr.in([out, context]);
    out.apply(result, context);
    return result;
  }
  // ...
}
```

The evaluator:

- Takes parsed expressions
- Evaluates them according to the language semantics
- Handles function application, variable lookup, etc.
- Stores results in the output frame

### 8. `hc-test.ts`

The `HCTest` class provides testing functionality:

```typescript
export class HCTest extends Frame {
  // ...
  public assertEqual(expected: string, actual: string, source: string): Frame {
    const base = source + " ?" + expected;
    console.log(`assertEqual: ${base}`);

    this.n.total += 1;
    if (this.checkEqual(expected, actual)) {
      this.n.pass += 1;
      return FrameNote.pass(base, JSON.stringify(this.n));
    } else {
      this.n.fail += 1;
      return FrameNote.fail(base + " !" + actual, JSON.stringify(this.n));
    }
  }
  // ...
}
```

The test framework:

- Compares actual outputs with expected outputs
- Tracks test statistics (total, passed, failed)
- Provides assertion methods
- Formats test results

## Complete Flow Example

When you execute a piece of code like `1 + 1`:

1. `execute("1 + 1")` is called
2. `evaluate("1 + 1")` creates an output frame and HCEval instance
3. `hc_eval.call("1 + 1")` processes the input:
   - The input is converted to a FrameString
   - The lexer tokenizes it into `1`, `+`, and `1`
   - The parser combines these into an expression `(+ 1 1)`
   - The evaluator applies the `+` operation to the arguments `1` and `1`
   - The result `2` is stored in the output frame
4. The output frame is returned to `execute`
5. `execute` formats the result as a string and returns `"2"`

## Frame Structure

The result of evaluation is stored in a `FrameArray`, which extends `FrameList`:

```typescript
export class FrameList extends Frame {
  constructor(protected data: Array<Frame>, meta: Context = NilContext) {
    super(meta);
  }

  public toStringArray(): string[] {
    const result = this.toStringDataArray();
    if (this.meta_length() > 0) {
      result.push(this.meta_string());
      return result;
    }
    return stripLastComma(result);
  }

  // ...
}
```

The `FrameList` class:

- Stores an array of Frame objects
- Provides methods to convert the frames to strings
- Handles metadata and formatting
