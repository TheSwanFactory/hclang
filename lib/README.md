# HCLANG: TypeScript Homoiconic C Interpreter

This repository contains the first implementation of Homoiconic C (HC) as
standalone library is designed to be used with Node, Deno, and web browsers.

- jsr:@swanfactory/hclang: [module](https://jsr.io/@swanfactory/hclang) and
  [documentation](https://jsr.io/@swanfactory/hclang/doc)
- GitHub Repo: [swanfactory/hclang](https://github.com/TheSwanFactory/hclang)

## Entry Points

The following functions are exported from the `mod.ts` file:

### `VERSION`

The current version of the HC interpreter.

### [evaluate](http://_vscodecontentref_/0)

Evaluates the given input string within the provided context and returns the
result as a _FrameArray_.

```typescript
import { evaluate } from "path/to/mod.ts";

const input = "1 + 1";
const result = evaluate(input);
console.log(result.toStringArray()); // Output: ['2']
```

### `execute`

Executes the given input string and returns the processed result as a string. It
is a convenience method for `evaluate`.

```typescript
import { execute } from "path/to/mod.ts";

const input = "1 + 1";
const result = execute(input);
console.log(result); // Output: '2'
```

### [make_context](http://_vscodecontentref_/3)

Creates a new evaluation context from a map of strings, which will be converted
to `FrameString` objects (or `FrameNumber` if integers). This can be passed as
the second argument to `evaluate`, in order to predefine variables.

```typescript
This can be passed as the second argument to `evaluate`,
in order to predefine variables.

    import { make_context } from "path/to/mod.ts";
    
    const env = { "x": "2" };
    const context = make_context(env);
    console.log(context.x.toString()); // Output: '2'
```
