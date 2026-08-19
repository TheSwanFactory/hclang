# Object Model Refactoring

**Status:** Implemented in v0.10.1, as corrected by
[a05a](a05a-object-model-corrections.md) and resolved by
[a05b](a05b-object-model-resolutions.md). The four roles now have separate
owners: a declared `parent` field written only by `setParent`, a receiver passed
per call, a declared write target, and the lexical `up` pointer. Visibility
grades the declared chain alone, which closed a leak that let a peer's method
and a merely nested aggregate read protected fields. `is.inherited`, the
`FrameGroup`-counting heuristic, and the per-call body copy are gone. Copy is
two named operations with the instance copy bounded to copy-on-write. The parent
declaration is respelled `.^`; the mutating-marker unification a05a proposed
stays deferred per a05b\
**Issue:**
[#306 — Refine object model ownership, inheritance, and copy semantics](https://github.com/TheSwanFactory/hclang/issues/306),
following the seams recorded on
[PR #305](https://github.com/TheSwanFactory/hclang/pull/305)\
**Refines:** [7-live-parent-inheritance.md](7-live-parent-inheritance.md)

## Summary

PR #305 made class support an interpretation of ordinary frames: closures return
aggregates, trailing underscores mark mutable identity, underscore prefixes
grade visibility, and `._^` declares a parent. The implementation is
deliberately minimal, and the price of that minimalism is that four distinct
relationships all travel through the single `up` pointer and a handful of
heuristics:

- **Declaration owner** — the frame whose metadata holds a binding; where a
  write physically lands.
- **Lookup parent** — the next frame consulted when a key is missing; the
  lexical scope chain.
- **Declared parent** — the explicit `._^` inheritance link, currently a magic
  string branch plus an `is.inherited` flag.
- **Runtime receiver** — the frame a method executes against, currently
  installed by reassigning a copied method's `up`.

This spec names those four roles, gives each one owner in the code, and defines
the two contracts the current implementation leaves implicit: what a copy means,
and what visibility must survive wrapping and copying. No HC syntax changes.
Class behavior remains an interpretation, not a language feature.

## Decisions

### Write targets are declared, not divined

`FrameName.bindingTarget()` currently reconstructs where a declaration should
land by walking the context stack and counting nested `FrameGroup` instances: a
lone group is a statement wrapper, two or more mean the inner group is a body.
That census is a proxy for information the evaluator already had when it opened
each context, so the census is replaced by a declaration.

A frame that accepts declarations — an aggregate under construction, the
unwrapped target of a mutable handle, an iteration body — is marked as a
**receiver** when evaluation enters it. A name binds to the innermost marked
receiver, and to the statement context when none is marked. The rule is a lookup
for an explicit property of the stack, not pattern-matching on the classes that
happen to compose it. Groups whose only job is statement grouping never mark
themselves, which is the fact the counting heuristic was trying to infer.

### One parent link, cycle-safe by construction

Declared inheritance currently lives in three places: a `"_^"` string comparison
inside symbol application, an `is.inherited` boolean read in three files, and a
source-level cycle check that callers must remember to run before mutating `up`.
The three become one **parent link** abstraction that owns:

- assignment, including the cycle rejection — the link is the only code path
  that may attach a declared parent, so a cyclic chain cannot be constructed by
  a caller that forgot to check;
- the distinction between a declared parent and a merely lexical `up`, which
  retires `is.inherited` as ambient mutable state;
- propagation, so evaluation and copying preserve a declared parent without each
  site re-implementing the flag dance `FrameArray.in()` does today; and
- rendering, so `._^ base` round-trips as it does now.

The `._^` surface syntax is unchanged. It stops being a special case inside
`FrameSymbol.apply` and becomes an ordinary assignment whose target routes
through the link. Lexical `up` assignments (a value learning its context during
lookup) are unaffected and remain cheap; the invariant is that the _declared_
chain is acyclic by construction, and lookup traversals keep their existing
seen-set guards as defense against the lexical chain.

### The handle sheds jobs it accreted

`FrameHandle` currently carries five responsibilities: mutable provenance from
the trailing underscore, the copy-on-write boundary for immutable receivers,
bound-method construction, metadata proxying, and ancestry preservation. It
keeps its charter — an effect-qualified reference to an identity — and the rest
is either moved or made explicit:

- **Bound methods** become their own named concern beside the handle rather than
  a private class inside it. Binding a method to a receiver is a statement about
  the receiver role, not about handles; the handle is merely where that binding
  is discovered today.
- **Copy-on-write** stops being an inline ternary keyed on a trailing colon in a
  key string. Whether a mutating method gets the real identity or a fresh copy
  is decided by the handle's declared mutability, and the copy it takes is the
  object-semantic copy defined below.
- **Caller-scoped lookup** — the handle answering `get_here` with missing so
  dotted lookup binds to the caller — is kept, documented as a rule rather than
  discovered as a surprise.
- **Metadata proxying and rendering** delegate to the target, as now, stated as
  the handle's transparency contract: wrapping must not change what a value
  prints, equals, or exposes.

### Copies get a contract

`Frame.copy()` is a generic shallow clone: prototype, fields, a fresh metadata
map, copied flags, a new id. Class construction, mutating-method receivers, and
lazy evaluation all lean on it, each wanting slightly different semantics, and
nested aggregates expose the gap: a shallow copy shares its nested arrays, so
mutation through the copy leaks into the original. The contract distinguishes
two operations:

- **Plumbing copy** — the existing shallow clone, for interpreter internals that
  need an independent metadata map or flag set and nothing more. It makes no
  object-semantic promises and callers must not treat it as one.
- **Instance copy** — the object-semantic operation used when a constructor
  produces a fresh instance and when copy-on-write shields an immutable
  receiver. It is defined plane by plane:

| Plane           | Instance copy behavior                                      |
| --------------- | ----------------------------------------------------------- |
| data plane      | nested aggregates get fresh identity; atoms are shared      |
| metadata plane  | fresh map; values follow the data-plane rule                |
| declared parent | preserved through the parent link                           |
| lexical parent  | not inherited; the copy learns its context where it is used |
| handle identity | copying a handle copies the target and yields a new handle  |
| flags and id    | flags copied, id always fresh                               |

Atoms are immutable, so sharing them is unobservable. Aggregates are where
identity matters, so they are the plane the instance copy must isolate: writing
through a copied instance must never be visible through the original, at any
nesting depth.

### Visibility is a matrix, and it must not bend

Visibility already has one resolution point (`resolve_here` and its
authorization walk). What is implicit is the promise that the answers are the
same no matter how the question arrives. The matrix:

| Accessor origin              | public | protected | private |
| ---------------------------- | ------ | --------- | ------- |
| the owner itself             | yes    | yes       | yes     |
| a descendant via parent link | yes    | yes       | no      |
| an unrelated peer            | yes    | no        | no      |

The contract is that this matrix holds identically across every access path: a
direct value, a handle wrapper, a bound method running against its receiver
(including private access from closures nested inside a method body), an
inherited receiver reached through the declared chain, and an instance copy —
which is its own owner, with full access to its own fields and no residual claim
on its source's private fields.

Symmetry rides along: wrapping or copying a value must not change equality
answers, alias identity, visibility outcomes, or which frame a mutation lands
on. Any place a handle unwraps before comparing or assigning is part of this
contract and gets pinned by a test.

## Behavior to preserve

`cli/hc/class-support.hc` is the executable statement of current semantics and
must keep passing unmodified, then grow cases for what this spec clarifies:

- a mutable singleton shares identity through its trailing-underscore handle;
- repeated construction yields fresh instances, proven by uppercase constant
  fields not colliding;
- mutating methods return their receiver, while constant and schema violations
  stay errors through that path;
- descendants see public and protected values and are refused private ones;
- a cyclic `._^` assignment is rejected as an error, not a hang; and
- multiple-base composition remains ordinary user code.

New doctest coverage should pin the clarified seams: nested-aggregate isolation
after instance copy, private access from a closure nested in a method, and
visibility through an inherited receiver reached via a handle.

## Checklist

### Write target

- [ ] Define the receiver mark and set it at each context that accepts
      declarations: aggregates under construction, unwrapped mutable handle
      targets, and iteration bodies.
- [ ] Rewrite name binding to select the innermost marked receiver, falling back
      to the statement context.
- [ ] Delete the `FrameGroup`-counting heuristic.
- [ ] Cover the cases the census encoded: top-level statements, single-group
      wrappers, closure bodies, arrays, and handles.

### Parent link

- [ ] Introduce the parent-link abstraction owning assignment, cycle rejection,
      the declared-versus-lexical distinction, propagation, and rendering.
- [ ] Route `._^` assignment through it, removing the magic-string branch from
      symbol application.
- [ ] Retire `is.inherited`, replacing its three read sites with link queries.
- [ ] Show by construction that no caller can attach a cyclic declared parent,
      and keep a regression test that tries.

### Handle

- [ ] Extract bound-method construction from inside the handle into its own
      named unit beside it.
- [ ] Move the copy-on-write decision onto declared mutability and the instance
      copy, off the trailing-colon string test.
- [ ] Document the caller-scoped lookup rule and the transparency contract; test
      both directly.

### Copy contract

- [ ] Name the two operations and audit every `copy()` call site into one bucket
      or the other.
- [ ] Implement the instance copy per the plane table, including recursive fresh
      identity for nested aggregates.
- [ ] Test mutation isolation through copied instances at depth, handle copying,
      declared-parent preservation, and fresh ids.

### Visibility and symmetry

- [ ] State the visibility matrix in `lib/frames/CLAUDE.md` beside the
      resolution code it describes.
- [ ] Test the full matrix across direct values, handles, bound methods, nested
      closures, inherited receivers, and instance copies.
- [ ] Test that equality, alias identity, and mutation targets are unchanged by
      wrapping and copying.

### Verification

- [ ] `cli/hc/class-support.hc` passes unmodified, then extended with the
      clarified semantics.
- [ ] Focused unit tests accompany each extracted abstraction: receiver mark,
      parent link, bound method, instance copy.
- [ ] `deno task test` green, including doctests and BitScheme.
- [ ] `deno publish --dry-run` green from `lib/`.
- [ ] Record the outcome in this document's status line when it lands.

## Open questions

- Whether the receiver mark is a flag on the context frame or a parallel slot in
  the context stack; the rule above is agnostic, and the implementation should
  pick whichever keeps `in()` signatures stable.
- Whether the parent link lives as a dedicated field beside `up` or as the sole
  writer of `up` with its own bookkeeping. The invariant — declared chain
  acyclic by construction, lexical assignment untouched — is what matters; the
  storage is an implementation choice.
- How far the instance copy recurses into lazy bodies. Methods are copied today
  before receiver binding; the contract must say whether that copy is plumbing
  (sharing the body) or instance (fresh), and the answer likely differs from
  aggregates.

## Non-goals

- Adding a `class` keyword or any class-specific parser or runtime primitive.
- Language-level multiple inheritance; composition remains user-defined.
- Environment-dependent module loading, tracked in
  [#301](https://github.com/TheSwanFactory/hclang/issues/301).
- Reworking the trailing-colon lexer behavior already fixed in PR #305.
- Changing HC surface syntax, token boundaries, or what any delimiter denotes.
