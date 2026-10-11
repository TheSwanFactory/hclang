# BFG: An Immutable Handle Is Not a Write Target

**Status:** Implemented in v0.17.0\
**Issue:** [#382](https://github.com/TheSwanFactory/hclang/issues/382), item 3
(005.18a H5)\
**Scope:** Where a statement binding inside a closure body lands when the
argument is an immutable handle\
**Verified against:** `41b032a` (v0.16.0)

## The defect

A binding inside a closure writes onto the argument whenever that argument was
reached **by name**, even though the name carries no effect marker:

```hc
.X [1];
.f {.o 2; o};
f X              # 2
X                # [.o 2; 1]     X was written

.A [];
.E [A];
E & {.o 2; o}    # [2]
A                # [.o 2;]       A was written through E
```

The same closure on a literal argument behaves as #339 intended:

```hc
.M [[]];
M & {.o 2; o}    # [2]
M                # [[]]          untouched
({[.o 2; o]} [1])  # [.o 2; 2]   the binding stays in the call's own frame
```

005.30c hit this as an RCT hazard. A Figure observer that names anything writes
onto the Figure it observes, and because Figures are reused, onto every Figure
that shares that child. 30c's probe 6.4 ended with `A` holding a
self-referential `.o`. Its workaround is to write observers using only `_` and
`__`.

## Why

`EvaluationScope.call` (`lib/frames/evaluation-scope.ts:161-172`) chooses the
write target:

```ts
const local = new Frame();
const target = argument instanceof FrameHandle ? argument.unwrap() : local;
```

The comment that introduced this line in #339 (610c8bb) gives the reason for the
exception:

> A handle argument is the one exception, because a handle is explicitly a
> mutable view requested by the caller for exactly this purpose.

But a handle is not always mutable. `FrameSymbol.in` builds one for **every**
name that resolves to an array (`frame-symbol.ts:169-174`), with `mutable` set
from the effect marker (`touchesIdentity`, see a05c). `X` gives an immutable
handle and `X_` a mutable one. The test checks the class and never reads the
flag, so a plain name is treated as the caller asking for a mutable view, which
it did not do.

This also contradicts the effect-marker rule in `lib/frames/CLAUDE.md`: "a
trailing underscore on a key means the key touches identity." Here, a key
without one touches identity.

## Proposal

Make the exception read the flag the comment already assumes:

```ts
const writable = argument instanceof FrameHandle && argument.isMutable();
const target = writable ? argument.unwrap() : local;
const targetRole: WriteTargetRole = writable ? "handle" : "statement";
```

`FrameHandle.mutable` is `private readonly` (`frame-handle.ts:29`). Add a
read-only accessor rather than widening the field.

### Resulting behaviour

| Call                                        | Today                       | Proposed                                     |
| ------------------------------------------- | --------------------------- | -------------------------------------------- |
| `f X`                                       | writes `.o` onto `X`        | binds `o` in the call's frame; `X` untouched |
| `f X_` (declared `.X_ [1];`)                | writes onto `X_` (verified) | unchanged: writes onto `X_`                  |
| `E & {.o 2; o}` where `E` holds `A` by name | writes onto `A`             | `A` untouched                                |
| `f [1]`                                     | local                       | unchanged                                    |

Lookup is unaffected. The handle stays in `lookupFrames`, so the closure still
reads the argument's members. Only where writes go changes.

## What else could break

- **Corpus programs that relied on the write.** Search `cli/hc/*.hc` and the
  test suite for closures that bind through a plain-named argument and then read
  the binding back _from the argument_ after the call. Each one must either
  spell the name with `_` or be recorded as depending on the defect.
- **Methods are not affected.** Receiver writes go through `ReceiverState` and
  `authorizedReceiverWriteTarget`, not through this path.
- **Construction is not affected.** `writeTargetRole === "construction"` is set
  elsewhere.

## Tests

- `lib/frames/evaluation-scope.test.ts`: an immutable handle argument yields the
  `local` target with role `statement`; a mutable handle yields the unwrapped
  target with role `handle`.
- Language test: the four rows of the table above.
- Doctest: 005.30c probe 6.4 (`E5 & {.o _; o}` leaves `E5` unchanged), next to
  the same probe with `E5_`, which still writes.
- Regression: the full `deno task test:all` corpus, with every behaviour change
  listed in the PR.

## Relation to [01](01-equality-ladder.md)

With this fix, identity becomes something a program can **see** with `===` (01)
without being something it can **damage** by accident. The two should ship in
the same release.
