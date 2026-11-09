# lib/frames: rules for editing

These are invariants that the code relies on but cannot enforce on its own. Each
links to the design it protects in
[doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md).

## One owner per decision

Each of these questions is answered in exactly one place. Extend the owner
rather than answering the question again somewhere else.

- **Numeric rank:** `NUMERIC_RANK` in `frame-numeric.ts` is the only ordering of
  the rungs. To add a rung, renumber that table and nothing else
  ([Numeric Ladder](../../doc/ARCHITECTURE.md#numeric-ladder)).
- **The effect marker:** `effect-marker.ts` is the only code that reads a
  trailing underscore. Everything else receives a graded `MethodEffect` or calls
  `touchesIdentity` ([Effect Marker](../../doc/ARCHITECTURE.md#effect-marker)).
- **Visibility:** `Frame.resolve_here` answers it, and it walks the declared
  `parent` chain, never the lexical `up` pointer
  ([Visibility](../../doc/ARCHITECTURE.md#visibility)).
- **Declared parents:** `setParent` is the only writer, and it rejects cycles
  ([Declared Parents](../../doc/ARCHITECTURE.md#declared-parents)).
- **Lookup traversal:** `MetaFrame.get` owns the traversal and its cycle guard.
  A specialization customizes `lookup_here`, `lookup_links` or `lookup_result`.
  It never recurses through the public `get`.
- **Resource refusals:** `resource-reference.ts` decides every one, and it stays
  free of `Frame` ([Resources](../../doc/ARCHITECTURE.md#resources)).

## Boundaries

- **No `Deno` in `lib/`.** Host access goes through the `resource-store.ts`
  seam, and the filesystem store lives in `cli/`.
- **No parser in `lib/frames` or `lib/ops`.** Behavior that needs the parser or
  the evaluator is installed late-bound from `lib/execute`, as `FrameLazy.quote`
  and `installDenumConstructor` are.
- **Recognition is class-side and stateless.** The lexer never constructs a
  value to ask a question about syntax. Construction happens only in a `SYNTAX`
  descriptor's `fromSource`.
- **Authority is never metadata.** A resource's store is a private field, so no
  iteration can reach it. `asArray()` performs no access: reads go only through
  `elements()`.

## Copying, writing and tracking

- **Every copy call site picks one kind.** Each one is either a plumbing
  `copy()` or an object-semantic `instanceCopy()`, never a mix. Bodies are never
  copied ([Copy Contract](../../doc/ARCHITECTURE.md#copy-contract)).
- **Write only what the operation created.** What an operation is handed is
  read-only (#419). A walk never copies and never writes.
- **Handles are transparent.** Rendering, equality and application delegate to
  the target ([Handles](../../doc/ARCHITECTURE.md#handles)).
- **New commit paths must be tracked.** A new path that commits a binding has to
  update the ART holder index and the version, and call `guardAccess`. Otherwise
  dispatch certificates silently go unsound
  ([Reference Tracking](../../doc/ARCHITECTURE.md#reference-tracking-art)).
- **The printer never asks `toText`,** so a printed value always reads back. A
  document's `.body` is computed, not stored metadata, so fences still
  round-trip.
