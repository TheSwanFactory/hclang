# HCLANG: TypeScript Homoiconic C Interpreter

This package contains the core Homoiconic C (HC) interpreter for Deno, Node.js,
and web browsers.

## Installation

### Deno

```bash
deno add jsr:@swanfactory/hclang
```

### Node.js / npm

```bash
npx jsr add @swanfactory/hclang
```

### Links

- JSR Package: [module](https://jsr.io/@swanfactory/hclang) and
  [documentation](https://jsr.io/@swanfactory/hclang/doc)
- GitHub Repo: [swanfactory/hclang](https://github.com/TheSwanFactory/hclang)

## Entry Points

### `VERSION`

The current version of the HC interpreter.

### `evaluate`

Evaluates one HC source unit and returns a `FrameArray` containing its results
and top-level declarations.

```typescript
import { evaluate } from "@swanfactory/hclang";

const result = evaluate(".answer 42; $.answer");
console.log(result.at(0).toString());
```

### `execute`

Evaluates one HC source unit and returns its rendered output as a string.

```typescript
import { execute } from "@swanfactory/hclang";

console.log(execute("1 + 1")); // "2"
```

### `make_context`

Converts a string map to HC values. Passing the result as the second argument to
`evaluate` or `execute` exposes it as the host namespace. Host bindings are
reached explicitly through `$$`; they never participate in bare-name lookup and
cannot be replaced by HC declarations or aliases.

```typescript
import { evaluate, make_context } from "@swanfactory/hclang";

const host = make_context({ x: "2" });
const result = evaluate("1 + $$.x", host);
console.log(result.at(0).toString()); // "3"
```

Binding immutability is not deep freezing: a mutable Frame deliberately supplied
by a host remains a mutable capability under HC's ordinary effect rules.

### `HCLang`

`HCLang` is a stateful interactive source unit. Declarations persist between
`call()` submissions and are reachable by bare name or `$`; constructor values
remain in the separate `$$` host namespace. `reset()` clears both namespaces and
history.

Each CLI input file receives its own `$` namespace, while all files share the
host-selected `$$` namespace.
