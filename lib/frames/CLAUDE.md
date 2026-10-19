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

What a value contributes is first asked of `Frame.toText()`, which answers the
value itself. An aggregate that declares a `toText` method, on itself or a
declared parent, answers that method's result instead (#398), found the way
`apply` is (#375) and never in the surrounding scope. The answer then follows
the same rule: characters if it has character content, its spelling otherwise.
The printer never asks, so a printed value still reads back.

Two families stay out. `FrameBytes` is byte-backed, with a printable form
derived from a `Uint8Array`. `FrameNote` holds a string, but that string is a
label key resolved through `LABELS`, and a note renders through `toString()`
rather than the shared `toStringData()` path.

A document publishes its characters as a computed `body` property rather than
stored metadata, because stored metadata would switch the shared atom renderer
to its braced form and break fence round-tripping. Reading `.body` does not
change what a document denotes: it still evaluates to itself and still prints
its fences.

### Resources

`FrameResource` is the one family whose application is effectful, and it extends
`FrameURI` rather than replacing it. `'…'` lexes to the inert identity; when a
root binding is reachable in the invocation context, `FrameURI.in` returns a
`FrameResource` extending that binding, and when none is it returns itself. So a
resource prints, compares, and decomposes exactly as the identifier it was
written as, and the authority is the only difference.

Three modules stand behind it, in dependency order:

- `resource-reference.ts` decides what a reference means. Pure, total, and free
  of `Frame`, so it is testable without an evaluator and callable before any
  dispatch. Every refusal is decided here, named in the `$!.…` vocabulary
  without the sigil.
- `resource-store.ts` is the host seam, and the reason `lib/` has no `Deno` in
  it. `MemoryStore` is the browser-safe default and the vehicle for
  deterministic fixtures. The Deno CLI's filesystem store lives in
  `cli/resource-store.ts`. `ResourceMapStore` lays fixed entries under canonical
  keys over another store, read-only, so a harness can serve package-owned
  source without widening its root; `lib/bundle/hc-bundle.ts` uses it to serve
  the bundled `hc/` files in the CLI and `HCLang`.
- `resource-binding.ts` names the capability structurally, because a root
  binding is a `FrameResource` and `FrameURI` has to ask one to extend itself.

Three protocol points are load-bearing. Reads go through `elements()`, which
pushes one character at a time into whatever receiver the reduce was handed, so
no part of the reading is a property of the resource. `asArray()` stays the
structural view and performs no access, which is what lets `isFailedResult()` be
inherited rather than overridden: `FrameExpr` calls it on every term of every
statement, and consulting the reading view there would read once per mention.
`visibleKeys()` answers none, so a doubled read yields indexed characters — the
RFC 3986 components describe the reference the value _is_ rather than contents
it holds. The store is a private TypeScript field, never metadata, so no
iteration can reach the authority. See
[`a10`](../../spec/a10-resource-primitive.md) and
[`a11`](../../spec/a11-resource-iteration.md).

### Resource Imports

`FrameImport` represents the reserved `. <- resource` and `name <- resource`
expressions while receiving its source evaluator as a callback, so the frames
package does not depend on the execution pipeline. A local import evaluates in
the exact current `EvaluationScope`. A named import evaluates and validates its
right side, then evaluates source in one fresh, unbound child namespace; only
complete success commits that exact child through the ordinary `FrameSymbol`
setter. Any right-side, read, parse, evaluation, or setter failure leaves the
previous target binding (or its absence) unchanged.

The child namespace owns imported declarations and falls through to the caller's
ordered live lookup graph. `LiveLookupContext` exposes that graph read-only,
withholds receiver/write authority, and resolves values and binding schema
metadata through the same physical declaration owners. Immutable identity
projections may be reused while their target is unchanged; rebinding a caller
name produces a projection for the new target. Closures derived from the child
retain this lookup without a parallel metadata scope list. The live caller
lookup and its binding resolution both stop before `Frame.globals`, so a caller
layer that shadows a global supplies both its value and its schema. An operator,
or any other global no caller layer declares, is reached once through the outer
lookup's single global tier, which curries an operator with its own operand.

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

`.^ base` writes the structural parent link rather than an ordinary binding. Its
position determines which object it targets:

- **Construction position declares.** On an aggregate under construction, `.^`
  declares that new aggregate's parent. Every frame may be a parent: an atom
  simply has no bindings to inherit.
- **Method position re-parents.** On an existing receiver, `.^` requires the
  same receiver-write capability as `@name`. A method without the mutating
  suffix returns `$!.method-not-mutating .^`. A mutating method reached through
  a mutable handle updates the receiver itself; through an immutable handle it
  updates only the functional instance copy selected by `BoundMethod`, so the
  original keeps its parent.
- **Everywhere else refuses.** With neither an aggregate under construction nor
  an active method receiver, `.^` returns `$!.parent-not-declarable .^`.

`setParent` remains the only writer and rejects any direct or indirect cycle
before changing the link. Method-position re-parenting makes that guard
reachable from HC source; both its frame-level invariant and a language-level
indirect cycle are covered.

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

### Effect Marker

One spelling rule covers the whole effect axis: a trailing underscore on a key
means the key touches identity. `counter_` names a mutable handle on its value,
and `.set_ {…}` declares a method that may write the receiver it runs against.
Because the two halves share a marker, the lexer needs no rule to carve a
mutating marker out of an operator character, and `:` denotes if-else alone.

`effect-marker.ts` is the only place that reads the marker. `FrameSymbol.in`
asks `touchesIdentity` for handle mutability, and every `BoundMethod` is built
from a `MethodEffect` produced by `methodEffect` where the method meets its
receiver, so the effect engine receives a graded fact instead of testing a key's
spelling itself. `MethodEffect.name` is the key without its marker, which is how
a diagnostic names its subject. A marker alone is not a marked key: `_` and the
longer underscore runs `FrameArg` uses are keys of length one and up whose whole
text is the marker, and they grade as non-mutating so that a diagnostic never
loses its subject.

Nothing distinguishes a mutable field from a mutating method at the spelling
level; the value's own type does. A `FrameArray` found under such a key becomes
a handle, and a `FrameLazy` becomes a bound method. That is also why the marker
is not purely additive: a block-valued field spelled with a trailing underscore
before v0.11.0 is a mutating method now. Leading underscores are a separate
axis, graded by `resolve_here` for visibility, so `.__secret_` is a private
mutable binding.

### Handles

A handle is a name's effect-qualified reference to a value, and nothing more.
Two rules define it:

- **Transparency.** Wrapping does not change what a value prints, equals,
  exposes, or answers when applied; rendering, data, metadata, array views, and
  application delegate to the target, and assignment unwraps, so a mutation
  lands where it would have without the wrapper. Application never writes
  through the name: a collect lands on the target's `collectingCopy()`, a fresh
  aggregate sharing its elements, whether or not the name is mutable.
- **Target lookup.** `get_here` answers missing by design, so explicit dotted
  lookup resolves against the caller's origin rather than the wrapper. A handle
  created by a read records the scope of that read for its evaluation roots
  only: lookup through it reaches the target and its declared parents, never
  that scope, so `o.k` misses when `o` has no `k` (#400).

Discovering a method through a handle or by bare name on the active raw receiver
yields a `BoundMethod`, which owns the effect rules for that pairing: a mutating
method acts on the receiver itself through a mutable handle, and on an instance
copy through an immutable one. A method without the mutating suffix retains
receiver read access but receives no receiver-write capability, so a
receiver-targeted `@name` returns `$!.method-not-mutating @name` through either
kind of handle. A bare sibling mutator called from such a method is rebound
functionally instead of escalating the outer method to an in-place write. Handle
mutability selects original identity versus functional copy only after the
method contract authorizes mutation.

One immutable `ReceiverState` carries the exact receiver, copy provenance, bare
sibling binding mode, and private write brand from `BoundMethod` to the
invocation frame. Syntax nested on the explicit evaluation stack reads that same
object. A closure literal evaluated in that invocation receives a plumbing copy
marked with the state object's identity. Fresh built-in conditional and iterator
curries forward authority only when the callback bears that matching marker, so
nested inline blocks retain the decision while unrelated named helpers and
ordinary helper calls cannot acquire it.

An alias first searches the receiver and its declared parents. A hit consumes
the write brand; a miss searches the method's own scope and the scope it was
written in, never the prepared argument or parameter supplied by the caller and
never the scope its receiver was read from. Reads and writes therefore agree: a
method's free names are lexical (#400).

### Equality

The three operators are a ladder, each strictly stronger than the last, and
`Frame` owns one method per rung:

- `equals` (`=`): the same value. Atom families override it, and `FrameArray`
  compares its complete view, visible properties then elements, by `=`.
- `typeEquals` (`==`): `equals` plus the same class at every node, so the
  numeric rung counts.
- `identical` (`===`): the same frame. A frame that `ownsIdentity()`, which is
  every `FrameArray`, compares by reference; anything else falls back to
  `typeEquals`, because the copy contract makes sharing it unobservable.

`referent()` is how a handle stays transparent: every rung unwraps through it,
so a handle is equal, type-equal and identical to its target. No id is ever
returned by a comparison. See
[`a14/01`](../../spec/a14-bfg/01-equality-ladder.md).

### Declared Application

Applying an aggregate collects, unless it declares a method named `apply`, or
`apply_` when the rule writes the receiver (#375).
`FrameArray.applicationMethod` finds it on the aggregate and its declared
parents only, never in the lexical scope, and `apply` runs it as a
`BoundMethod`, so a handle's mutability decides whether `apply_` writes the
target or answers an updated copy, exactly as for any mutating method. A step
answering nil leaves the receiver unchanged. An aggregate with a declared
application no longer `collects()`, so a refusal applied to it stays a refusal
instead of being held.

The interpreter's own output is not application. The evaluator's output array is
also the file scope, so a top-level `.apply` lands on it; `Frame.collect` is the
plumbing path that `EvalPipe` and `evaluate` use, and an aggregate collects
there unconditionally.

### Copy Contract

Copying is two operations, not one, and every call site belongs to exactly one
of them:

- **Plumbing copy** — `Frame.copy()`. A shallow clone with an independent
  metadata map, flags, and a fresh id, for interpreter internals that need those
  and nothing more. It promises no object semantics; nested aggregates are
  shared.
- **Instance copy** — `Frame.instanceCopy()`. The object-semantic operation,
  taken only by copy-on-write, where a mutating method is reached through an
  immutable handle. It gives an aggregate fresh identity and shares its members;
  atoms and closure bodies are shared too, because neither owns identity a write
  can land on. A declared parent is preserved in its own field and the id is
  always fresh.

Copy-on-write therefore means functional update: `p.set_ 2` leaves `p` alone and
evaluates to the new value. Bodies are never copied — a bound method passes its
receiver as an explicit argument rather than rewriting a copied closure.

The copy is lazy (#401). `BoundMethod` copies only the receiver. A handle read
during the call records what it was read from (`FrameHandle.heldBy`), and when a
mutating method is about to run through a mutable one whose target the call has
not copied, `FrameHandle.copyOnWriteTarget` copies that target, installs the
copy in its holder with `replaceMember`, copying the holder first if it is still
shared, and follows the copy. So a call copies exactly the path down to what it
writes, and whatever it never writes keeps its identity: a Figure the receiver
holds is still the same Figure in the result. The original is still untouched at
any depth, because nothing is written before it is copied. The result shares its
unwritten members with the original, as a persistent data structure does, so a
later in-place write through a mutable name reaches that shared member like any
other alias of it.

A declared parent remains shared rather than joining the instance copy. During a
copy-on-write call, `BoundMethod` therefore records the aggregates the call has
copied as call-scoped ownership provenance. Before a nested mutable method
receives any write brand, its receiver must belong to that copied graph, which a
path copy arranges for anything held by a copy; a receiver reached through a
shared declared parent has no copied holder, so the call returns
`$!.copy-on-write-boundary .method`. Alias resolution also checks that its
physical declaration owner belongs to the graph, so reaching a shared declared
parent returns `$!.copy-on-write-boundary .name` instead of mutating shared
state. The provenance follows repeated dotted handle traversal, and the
authority-minting check protects structural writes such as `.^` as well as
aliases. An ordinary mutable receiver still updates an inherited owner directly.

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

```text
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

The public `Context` map supplies initial bindings. Runtime evaluation uses an
immutable `EvaluationScope` with named argument, parameter, receiver, and
write-target roles plus an enclosing-scope link. Syntax derives scopes rather
than pushing positional frames, and closure literals capture a per-evaluation
scope without rewriting shared closure or body ancestry.

A call reads its explicit argument through `Frame.getOwn`: the argument's own
properties and its declared parents, never its lexical scope, so the scope that
built an argument cannot bind a closure's names (spec 7, layer 2). A block
nested in a method runs with the receiver state its method forwarded, and
`EvaluationScope.call` does not push those receiver layers again, so the
method's locals stay ahead of the scope its receiver was read from.

Context bindings remain homoiconic Frames and are created with `make_context`
when entering through the public evaluator.

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
