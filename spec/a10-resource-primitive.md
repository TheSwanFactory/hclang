# `'…'` Is the Resource

**Status:** Implemented in v0.14.0. One primitive, not a resolver protocol plus
a resource protocol. Path references resolve; every scheme is an unbound slot
until [#367](https://github.com/TheSwanFactory/hclang/issues/367) supplies the
handler table.\
**Issues:** [#348](https://github.com/TheSwanFactory/hclang/issues/348), with
[#277](https://github.com/TheSwanFactory/hclang/issues/277) and
[#301](https://github.com/TheSwanFactory/hclang/issues/301) as the two tracks it
is the shared substrate for.\
**Design rationale:** [`a07`](a07-hc-security-architecture.md). This document
records only what shipped and the decisions that shipping forced.

## The primitive

`'…'` is a `FrameResource` whenever a root binding is reachable in the
invocation context, and an inert `FrameURI` when one is not. Nothing else
changes: `FrameResource` extends `FrameURI`, so a resource prints as the
reference it was written as, compares by that reference, and publishes the same
RFC 3986 `scheme`, `authority`, `path`, `query`, and `fragment` properties.

Two verbs, both already dispatched by the evaluator:

| Source                | Mechanism                             | Yields                  |
| --------------------- | ------------------------------------- | ----------------------- |
| `'./out.txt' “hello”` | `Frame.apply` — the left fold's write | `5`, characters written |
| `'./out.txt' \| “”`   | `Frame.reduce` via `elements()`       | the whole content       |
| `'./out.txt' \| []`   | `Frame.reduce` via `elements()`       | the characters, apart   |

There is no `<-` I/O primitive and no separate resolver frame. A read is a
reduce over characters, so a resource is a stream for the same reason an array
is a collection, and what a read answers is decided by the receiver rather than
by the source. `spec/a11-resource-iteration.md` owns that reading; this
document's provisional whole-content element is what it replaced.

Two properties fall out rather than being designed. **Path extension is
attenuation**, because a child path is a subset by construction and `..` is
refused outright, so `extend` cannot widen. **A normalized reference is its own
module cache key**, because normalization is pure, total, and deterministic.

## Authority: three nested ceilings

```
harness grant            whatever the harness could express
  HC root binding        $$.root, default a fresh unique temp directory
    resource frame       path extension only
```

Each layer narrows only. The middle ring is the one HC owns, and it is a binding
rather than a nameable path, which is what lets a test install a `MemoryStore`
and never touch a real directory. The outer ring is deliberately vague because
it has to be: for the Deno CLI it is a permission set
([#371](https://github.com/TheSwanFactory/hclang/issues/371)), and `hcweb.html`
has no filesystem, environment, or syscalls to express it with.

`$$.root` is nameable on purpose. Per a07 §7 an unnameable lookup tier is a
structural defect, and the whole point of the middle ring is that the perimeter
is enumerable. Holding `$$.root` is holding the authority; that is the
capability model working, not a leak.

HC's own rules, which hold in every harness:

- descendants of the root: allowed
- parents: refused at normalization, before any host call
- peers: require a second explicit root binding
- unbound scheme: an error frame, never a fetch

## Deterministic normalization

Pure and total, before any dispatch. This is HC's own obligation precisely
because HC is the enforcer rather than a supplicant to a host permission system.

Normalization runs when the `FrameResource` is constructed, which is before any
handler could be selected, but its **refusal is a value surfaced at use**, not
at evaluation. `'https://example.com/x'` therefore still evaluates to itself and
still answers `.authority`; the refusal appears when the reference is applied to
or enumerated. This is what keeps [`a03`](a03-unified-quote-delimiters.md) §2's
inertness guarantee literally true: lexing and evaluating perform no access.

The rules, in order, each total:

| Condition                              | Refusal                           |
| -------------------------------------- | --------------------------------- |
| `scheme` present                       | `$!.resource-scheme-unbound`      |
| `authority` present, `scheme` absent   | `$!.resource-authority-unbound`   |
| `query` or `fragment` present          | `$!.resource-part-unsupported`    |
| `\` anywhere in the path               | `$!.resource-alternate-separator` |
| a control character in the path        | `$!.resource-control-character`   |
| a malformed `%` escape                 | `$!.resource-invalid-encoding`    |
| an escape decoding to `/`, `\`, or `.` | `$!.resource-encoded-separator`   |
| a `..` segment                         | `$!.resource-parent-escape`       |

What survives is a root-relative path of ordinary segments, with `.` and empty
segments dropped. `./out.txt`, `/out.txt`, and `out.txt` normalize identically:
there is no ambient working directory to make them differ, and inventing one
would be ambient authority.

Two deliberate deviations, recorded so they are not mistaken for oversights.

**Every `..` is refused, not only the escaping ones.** `a/../b` is contained and
could be permitted, but permitting it means owning a popping semantics and the
canonicalization differences that come with it. Refusing the segment outright
means there is no canonicalization for a checker and a host to disagree about,
and every location inside the root remains nameable without it.

**Percent-escapes that decode to `/`, `\`, or `.` are refused rather than
decoded.** So `'./a%2Eb'` is refused where `'./a.b'` is fine. The cost is a
nameable refusal on a legal-but-pointless spelling; the benefit is that the
encoded-dot-segment class does not exist.

## Containment is re-verified after resolution

Prefix containment does not survive symlink indirection: a link inside the root
passes a textual check while the bytes come from outside. So containment is
checked twice — once textually at normalization, and once against the resolved
location before any byte moves. `containsResolved` is the shared predicate, and
the store reports `$!.resource-escaped-root` when the second check fails.

The CLI store resolves with `Deno.realPathSync`, walking to the nearest existing
ancestor for a write to a file that does not exist yet, so a symlinked parent
directory is caught before the write rather than after.

## What a write returns

The count of characters written, as an integer. **Not the receiver.** A
receiver-returning call hides errors in its result, which
[#338](https://github.com/TheSwanFactory/hclang/issues/338) demonstrated; the
result or the evidence is the only safe answer. A write replaces, so there is no
append-by-chaining to want the receiver for.

The argument contributes characters if it has character content and its spelling
otherwise, which is the rule `concatenateText` already uses. Writing a resource
identifier therefore writes `'./x'`, its spelling, because a resource identifier
is not character content. Attenuation is not spelled by applying one reference
to another; it is spelled by writing a longer literal, since every literal
extends the root.

## What a read yields

One string holding the whole content. `|` runs the block once with it; `&` folds
a single element, which is the identity.

This is the least presumptuous reading, and it is deliberately provisional.
[#368](https://github.com/TheSwanFactory/hclang/issues/368) makes the element
type travel with the resource — characters, lines, or HC code — at which point
`|` and `&` stay generic and no single reading has to win. Choosing lines here
would have been choosing that answer by accident.

**Superseded by [`a11`](a11-resource-iteration.md), which shipped in v0.15.0.**
The element type belongs to the receiver, not the resource: a read is a
character reduce, and chunking and parsing are what a receiver does. Nothing
above about authority moved; only what a read yields did. Read a11 for the
reading, and the paragraphs above for why this one was provisional rather than
wrong.

Reading a location with nothing at it is `$!.resource-absent`, which flows back
through ordinary evaluation per a07 §6: `'./nope' | []` yields an array whose
element is the refusal, and that array reports itself as a failed result. A
refusal is a value an aggregate collects; every other receiver is poisoned by
it, because an operation on an error is an error and a collect is not one.
Reading an _empty_ location is different and must stay so: an empty stream
reduces to nil, which is not a failure.

`isFailedResult` is inherited rather than overridden, because `asArray()` is the
structural view and performs no access. `FrameExpr` calls `isFailedResult` on
every term of every statement, so a reading `asArray()` would have made a read
happen once per mention — which is why the reading moved to `elements()` instead
of the check being patched a second time.

## Scope

In, because they are the primitive's contract:

- [x] Normalization is pure, total, and runs before dispatch.
- [x] Parent escape refused at normalization: `..`, percent encoding, alternate
      separators, canonicalization differences.
- [x] Containment re-verified after resolution, against symlink indirection.

Out, with tickets:

- **Scheme dispatch and refusal** → #367. Presence of `scheme` is the
  discriminator, the colon is never consulted, and an unbound scheme is an empty
  table slot. This ships as the failing-closed half of that: every scheme is
  unbound, so `'C:/tmp/x'` refuses as scheme `C` and `'a:b'` as scheme `a`. The
  remedy is RFC 3986 §4.2's own, `'./C:/tmp/x'`. Single-letter schemes are not
  special-cased; `C` is a legal scheme and drive-letter heuristics do not belong
  in the trusted base.
- **The element type** → #368, redesigned as a character fold in
  [`a11`](a11-resource-iteration.md).
- **Harness permission flags** → #371. `deno.json`'s `deno run -A` still grants
  every HC program full filesystem, network, and subprocess authority, so the
  root binding attenuates the language and not yet the process.
- **Env** → #366. Env is data the host hands over, not a location the program
  addresses. `'env:…'` was floated in an early draft and stays withdrawn.

## Accepted cost

Application is effectful for this one type, so holding a resource frame is
holding the authority and an unknown frame can never be safely applied. That is
the capability model working as intended.

## Relation to existing work

This supersedes a resolver/resource split as the shared substrate for #277 and
#301, which remain separate tracks.

It revises [`a03`](a03-unified-quote-delimiters.md) §2, which specified `'…'` as
resolving only through a separately constructed resource Frame. The value is now
the resource and the root binding supplies the authority. a03's inertness
guarantee is unaffected, and its other four claims — no access at lex or eval
time, evaluates to itself rather than to a lookup, comparable and printable and
round-trippable, and the same source text yielding different results under
different ambient authority — hold exactly as written.
