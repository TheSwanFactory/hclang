# Frames Package - Core Data Structures

## Overview

The `frames` package implements the fundamental data structures for Homoiconic
C. In HC, code and data share the same representation (homoiconicity), and
"frames" are the universal building blocks for both.

## Core Concept

A **Frame** is the basic unit of representation in HC. Every value, expression,
and program is composed of frames. This unified representation enables:

- Code as data, data as code
- Uniform manipulation of programs and values
- Meta-programming capabilities
- Simplified language semantics

## Key Frame Types

### Basic Types

- [frame-number.ts](frame-number.ts) - Numeric values (integers, floats)
- [frame-string.ts](frame-string.ts) - String literals
- [frame-bytes.ts](frame-bytes.ts) - Raw byte data
- [frame-symbol.ts](frame-symbol.ts) - Identifiers and symbols
- [frame-comment.ts](frame-comment.ts) - Comments (preserved in AST)

### Structural Types

- [frame-array.ts](frame-array.ts) - Ordered collections of frames
- [frame-list.ts](frame-list.ts) - Linked list implementation
- [frame-group.ts](frame-group.ts) - Grouped expressions `(...)`
- [frame-blob.ts](frame-blob.ts) - Dictionary/map structures `{...}`

### Expression Types

- [frame-expr.ts](frame-expr.ts) - Executable expressions
- [frame-lazy.ts](frame-lazy.ts) - Lazy evaluation wrappers
- [frame-arg.ts](frame-arg.ts) - Function arguments
- [frame-name.ts](frame-name.ts) - Named bindings

### Advanced Types

- [frame-alias.ts](frame-alias.ts) - Aliases and references
- [frame-match.ts](frame-match.ts) - General membership and match-evidence
  protocol
- [frame-schema.ts](frame-schema.ts) - Immutable evidence-producing type schemas
- [schema-matcher.ts](schema-matcher.ts) - General schema matcher contract and
  enumeration matcher
- [schema-structural-matcher.ts](schema-structural-matcher.ts) - Direct-property
  structural matcher
- [schema-bit-matcher.ts](schema-bit-matcher.ts) - Built-in bit-layout matcher
- [frame-note.ts](frame-note.ts) - Annotations and metadata
- [frame-doc.ts](frame-doc.ts) - Documentation frames
- [frame-uri.ts](frame-uri.ts) - Inert, structured resource identifiers `'…'`
  that name external things without authorizing them

### Meta Types

- [frame.ts](frame.ts) - Base Frame class and core protocol
- [frame-atom.ts](frame-atom.ts) - Atomic (primitive) frame base class
- [frame-text.ts](frame-text.ts) - Body shared by delimited text values, plus
  the `CharacterContent` capability
- [meta-frame.ts](meta-frame.ts) - Meta-programming support
- [context.ts](context.ts) - Evaluation context (variable bindings)

## Architecture

### Frame Protocol

All frames implement the core protocol defined in [frame.ts](frame.ts):

```typescript
interface IFrame {
  at(key: Frame): Frame; // Property access
  call(context: Frame): Frame; // Evaluation
  toString(): string; // String representation
  toStringArray(): string[]; // Array representation
  // ... other methods
}
```

Families that participate in source recognition publish an immutable static
`SYNTAX` descriptor instead of exposing a constructor to the lexer:

- `SIGIL_STARTS` advertises the source characters and lexical modes the family
  owns;
- `recognize(symbol, source, context)` decides what one source Symbol does to
  the lexeme accumulated so far;
- `finish(source)` completes or rejects the lexeme at physical EOF; and
- `fromSource(source)` builds the runtime value, or throws for a family whose
  values never come from source.

Recognition is a property of the family, not of a value: it is stateless, so
`lib/frames/atom-syntax.ts` supplies the shared rules and no family needs a
receiver class. A family that genuinely accumulates lexical state, such as
`FrameBytePayload`, is installed by a `Transition` and keeps instance
`scan()`/`finishInput()` methods. `Frame.scan()` therefore means runtime double
dispatch everywhere else.

The stateless Sigilizer routes only the generic dispositions declared in
`lib/scan.ts`.

### Text Values and Character Content

`FrameString`, `FrameDoc`, `FrameComment`, and `FrameURI` all hold a string body
and render it through their own delimiters, so `FrameText` holds that body once
and they are siblings rather than subclasses of one another. A document is not a
kind of string: `` ` `` denotes foreign content while `“ ”` denotes characters.

Storage is not coercion. Contributing raw characters to a larger string is the
`CharacterContent` capability, advertised only by `FrameString` and `FrameDoc`,
and juxtaposition tests for that capability rather than for a class. A comment
or a resource identifier therefore keeps its delimiters when it joins a string,
which is why `“a” #b#` yields `“a#b#”`.

Two families stay out. `FrameBytes` is byte-backed, with a printable form
derived from a `Uint8Array`. `FrameNote` holds a string, but that string is a
label key resolved through `LABELS`, and a note renders through `toString()`
rather than the shared `toStringData()` path.

A document publishes its characters as a computed `body` property rather than
stored metadata, because stored metadata would switch the shared atom renderer
to its braced form and break fence round-tripping. Reading `.body` does not
change what a document denotes: it still evaluates to itself and still prints
its fences.

### Visibility

A leading underscore grades a declaration, and `resolve_here` in `meta-frame.ts`
is the one place that answers the question. The answer depends only on where the
access originates:

| Accessor origin              | public | protected | private |
| ---------------------------- | ------ | --------- | ------- |
| the owner itself             | yes    | yes       | yes     |
| a descendant via parent link | yes    | yes       | no      |
| an unrelated peer            | yes    | no        | no      |

Two rules make that table hold no matter how the access arrives:

- **Descendant means declared.** `isAncestorOf` walks the declared `parent`
  chain only, never the lexical `up` pointer. Lexical nesting and syntactic
  containment confer nothing, so an aggregate nested inside another is an
  unrelated peer for visibility, and so is a peer's method body. `up` is
  rewritten as lookup learns context, and access control must not depend on
  lookup history.
- **Origin is the receiver.** A method body resolves against the frame it runs
  against, so the owner reaches all three of its own grades, including from a
  scope nested inside the body. A refusal is an error value, not a miss, so it
  never falls through to an ancestor that happens to share the name.

Wrapping and copying must not bend the table. A handle grades against its
target, and an instance copy is its own owner, with full access to its own
fields and no residual claim on its source's private ones.

### Declared Parents

`.^ base` declares a parent. The link is structural rather than an ordinary
binding, so two rules bound it:

- **Constructor position only.** It is declarable on the aggregate under
  construction, and nowhere else. A method body has no aggregate under
  construction, so its target would be the argument; declaring a parent there is
  refused with `$!.parent-not-declarable .^` rather than re-parenting the wrong
  frame. Re-parenting an existing object from a method is not yet a feature: it
  is a mutation of identity and needs an effect rule first
  ([#330](https://github.com/TheSwanFactory/hclang/issues/330)).
- **Any frame may be a parent.** Every frame carries bindings, so nothing
  restricts a parent to an aggregate. An atom simply has none to inherit, and
  lookup reports the name as missing rather than failing at the declaration.

`setParent` is the only writer, so the declared chain is acyclic by
construction. Because the parent is declarable only during construction, a cycle
is currently unreachable from HC source — the guard is covered at the frame
level instead.

The complete lookup graph is broader than that declared chain: lexical `up`
links are rewritten freely, and handles add target links, so either can cycle.
`MetaFrame.get` therefore owns one guarded traversal for every built-in frame.
It checks `lookup_here` first, then follows the links from `lookup_links` with
declared parents before lexical `up`, sharing one seen-set. A revisit is a miss
for that branch rather than an error or recursive overflow, and `Frame.globals`
is consulted once as the final tier after the non-global graph is exhausted.

Specialized frames customize the template through protected hooks instead of
recursing through public `get`: `lookup_here` supplies computed local values,
`lookup_links` supplies structural links such as a handle target, and
`lookup_result` transforms a successful value, such as binding a method to its
handle target. Keeping traversal and cycle state in `MetaFrame.get` prevents a
specialization from accidentally resetting the guard.

### Handles

A handle is a name's effect-qualified reference to a value, and nothing more.
Two rules define it:

- **Transparency.** Wrapping does not change what a value prints, equals, or
  exposes; rendering, data, metadata, and array views delegate to the target,
  and assignment unwraps, so a mutation lands where it would have without the
  wrapper.
- **Caller-scoped lookup.** `get_here` answers missing by design, so explicit
  dotted lookup resolves against the caller's origin rather than the wrapper.

Discovering a method through a handle yields a `BoundMethod`, which owns the
effect rules for that pairing: a mutating method acts on the receiver itself
through a mutable handle, and on an instance copy through an immutable one.

### Copy Contract

Copying is two operations, not one, and every call site belongs to exactly one
of them:

- **Plumbing copy** — `Frame.copy()`. A shallow clone with an independent
  metadata map, flags, and a fresh id, for interpreter internals that need those
  and nothing more. It promises no object semantics; nested aggregates are
  shared.
- **Instance copy** — `Frame.instanceCopy()`. The object-semantic operation,
  with exactly one caller: copy-on-write in `BoundMethod`, where a mutating
  method is reached through an immutable handle. Nested aggregates get fresh
  identity at every depth in both planes, so a write through the copy is
  invisible through the original; atoms and closure bodies are shared, because
  neither owns identity a write can land on. A declared parent is preserved in
  its own field and the id is always fresh.

Copy-on-write therefore means functional update: `p.set: 2` leaves `p` alone and
evaluates to the new value. Bodies are never copied — a bound method passes its
receiver as an explicit argument rather than rewriting a copied closure.

A declared parent remains shared rather than joining the instance copy. During a
copy-on-write call, `BoundMethod` therefore records the aggregates actually
produced by `instanceCopy` as call-scoped ownership provenance. An alias may
write only when its physical declaration owner belongs to that copied graph. If
resolution reaches a shared declared parent or an aggregate inherited from one,
the call returns `$!.copy-on-write-boundary .name` instead of mutating shared
state. The provenance follows repeated dotted handle traversal, so the same rule
holds at any depth; an ordinary mutable receiver still updates the inherited
owner directly.

The boundary belongs to the invocation, not to the returned aggregate. A
functional result can later be bound through a mutable name and then exercise
normal mutable inherited-write authority; it is not permanently marked as an
immutable copy.

Isolation wins where the two effect rules meet. A nested `inner_` declares a
mutable identity, yet reaching it through an **immutable** outer receiver still
forks it, because the outer handle governs the whole aggregate it reaches:
"untouched at any depth" would otherwise be false, and a caller holding the
outer value immutably would observe a write through it. A trailing underscore
declares how a name may be used, not a promise that an enclosing copy will share
its target. Reach the inner identity through a mutable outer handle when sharing
is the point.

### Type Matching

First-class types implement the `FrameMatcher` protocol. A pure match returns
either failure or success evidence. Binding validation and the `~` operator use
only membership, while applying a type returns the evidence. `FrameSchema`
delegates equality, structural, and bit-layout behavior to separate immutable
matchers so adding a domain does not add domain logic to schema storage or
binding resolution.

### Type Hierarchy

```
Frame (base)
├── FrameAtom (primitives)
│   ├── FrameNumber
│   ├── FrameString
│   ├── FrameBytes
│   └── FrameSymbol
├── FrameArray (collections)
│   ├── FrameList
│   ├── FrameGroup
│   └── FrameBlob
├── FrameExpr (execution)
│   ├── FrameLazy
│   └── FrameArg
└── MetaFrame (meta-programming)
```

## Usage Examples

### Creating Frames

```typescript
import { FrameNumber } from "./frame-number.ts";
import { FrameString } from "./frame-string.ts";
import { FrameBlob } from "./frame-blob.ts";

const num = new FrameNumber(42);
const str = new FrameString("hello");
const dict = new FrameBlob({ key: str });
```

### Working with Context

```typescript
import { make_context } from "./context.ts";

const ctx = make_context({
  x: "10",
  y: "20",
});

// Access values
console.log(ctx.x.toString()); // "10"
```

### Frame Operations

```typescript
// Property access
const value = frame.at(key);

// Evaluation
const result = expr.call(context);

// String conversion
const str = frame.toString();
const arr = frame.toStringArray();
```

## Development Guidelines

### Adding New Frame Types

1. Extend appropriate base class ([frame.ts](frame.ts),
   [frame-atom.ts](frame-atom.ts), etc.)
2. Implement required protocol methods
3. For source syntax, declare static `SIGIL_STARTS` and a static `SYNTAX`
   descriptor, reusing the shared recognizers in `atom-syntax.ts` where possible
4. Add constructor and initialization
5. Implement `toString()` and `toStringArray()`
6. Add tests in corresponding `.test.ts` file

### Testing

- Each frame type has comprehensive tests
- Test creation, operations, and conversions
- Test edge cases and error conditions
- Run with: `deno test lib/frames`

### Frame Design Principles

- **Immutability**: Frames should be immutable when possible
- **Lazy Evaluation**: Use [frame-lazy.ts](frame-lazy.ts) for deferred
  computation
- **Protocol First**: Implement core protocol methods consistently
- **Type Safety**: Use TypeScript types to enforce frame contracts

## Important Concepts

### Context

The [context.ts](context.ts) module manages variable bindings during evaluation.
Context is itself a Frame (FrameBlob), making the environment first-class.

### Meta-Programming

[meta-frame.ts](meta-frame.ts) provides reflection and meta-programming
capabilities:

- Inspect frame structure
- Manipulate frames as data
- Generate code programmatically

### Homoiconicity

Frames represent both:

- **Data**: Values like numbers, strings, collections
- **Code**: Expressions, functions, operators

This duality enables powerful meta-programming without special syntax.

## Common Patterns

### Frame Construction

```typescript
// From literals
const num = new FrameNumber(42);
const str = new FrameString("text");

// From collections
const arr = new FrameArray([num, str]);
const blob = new FrameBlob({ key: num });
```

### Frame Traversal

```typescript
// Access elements
const first = array.at(new FrameNumber(0));
const value = blob.at(new FrameString("key"));

// Iteration
for (const frame of frameArray.frames) {
  console.log(frame.toString());
}
```

### Evaluation

```typescript
// Evaluate expression in context
const result = expr.call(context);

// Lazy evaluation
const lazy = new FrameLazy(() => expr.call(context));
const value = lazy.call(context); // Evaluates when called
```

## Performance Considerations

- Frames are relatively lightweight objects
- String conversion is cached where possible
- Lazy frames defer expensive computations
- Context lookup uses hash maps for efficiency

## Important Notes

- All frames must implement the core protocol
- Frames should be immutable or copy-on-write
- Use [frame-lazy.ts](frame-lazy.ts) for expensive operations
- Context threading is essential for proper evaluation
- Meta-frames enable reflection without special syntax
