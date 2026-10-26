# Closure Inspection: Walking Code Without Running It

**Status:** Implemented in v0.25.0, with names as values in v0.26.0, and the
warts listed in [Warts](#warts). Each example gives the answer at v0.25.0, and a
line marked _before_ gives what v0.24.3 (`b1867e8`) answered, measured.\
**Issues:** [#429](https://github.com/TheSwanFactory/hclang/issues/429), whose
three design questions this document answers;
[#374](https://github.com/TheSwanFactory/hclang/issues/374), which owns the
syntax/value split of `FrameExpr` and multi-value `()`;
[#411](https://github.com/TheSwanFactory/hclang/issues/411), which ruled what
`.#` and `.##` count.\
**Motivation:** Protology Figure issue 004 asks whether an HC construction can
be inspected by another HC construction. Its audit (004.07a) found one
unavoidable gap: a stable, HC-callable representation of an unevaluated closure.
This document is the UX for that representation, and only that. Inference and
certification over what the walk yields are out of scope.

## The one sentence

**A closure is an aggregate of its atoms, and `&` walks it as it walks any
aggregate, without evaluating anything.** HC has no special forms, so there is
no quote operator to add: `{…}` already is the quotation, and iteration already
is the traversal. What is missing is that the things the walk hands over must be
inert data, which today they are not.

## 1. The walk yields atoms, in order

Iterating a closure yields each atom of its body, in source order, as syntax. An
atom that is itself an aggregate, a closure or a `[…]` written in the body, is
one atom, and walks in turn by the same rule, still unevaluated.

```text
{4 + 5} & {_}                        → [4, +, 5]
{4 + 5}.#                            → 3
{{1 + 2}} & {_}                      → [{ 1 + 2 }]
(({[1, [2, 3]]} & {_}) .0) & {“” _}  → [“1”, “[2, 3]”]
```

_before:_ `{4 + 5} & {_}` yields one term, `(4 + 5)`, and `{4 + 5} &| {_}`
yields `[4, ((+)), ((5))]`, each atom in parser wrappers. `{4 + 5}.#` is `9`,
because a size operator evaluates the closure before counting (#411 asks the
receiver's referent, and a closure's referent is its answer).

**Ruling: `.#` on a closure counts the atoms `&` yields, and `.##` the atoms
below them, so the two agree by construction.** A closure is an aggregate, and
the #411 rule for aggregates applies without a special case.

**Ruling, superseded by [`a16`](a16-concrete-semantics-graph.md):** the parser
no longer emits trivial wrappers, so nothing vanishes; a tight expression, terms
that abut as `o.x` does, is one atom that walks in turn.

## 2. Statements and declarations are visible

Every atom of the body is yielded, including declarations and the terminator
that makes a term a statement: `;` is an atom. So the walk's text, read back in
order, is the same closure.

```text
{.a 1; a + 2} & {“” _}    → [“.a”, “1”, “;”, “a”, “+”, “2”]
{1 + 2; 3 * 4}.#          → 7
{.a 1} && {_}             → [[.0, .a], [.1, 1]]
```

_before:_ `{1 + 2; 3 * 4} & {_}` yields only `(3 * 4)`; the `;` statement and
every declaration are dropped, because `elements()` reads the data plane and an
unevaluated declaration is not yet a property. `“” {1 + 2; 3 * 4}` prints
`“{ 1 + 2 3 * 4 }”`, without the `;`, so the text does not re-read.

**Ruling: the walk sees syntax, so the two-plane rule does not apply to it.**
Properties and elements are planes of a _value_. A closure's body has not been
evaluated, so it has no properties yet, only the declarations that would make
them. `&&` over a closure therefore widens to `[index, atom]` tuples and shows
no keys, which is what it does today.

## 3. A name is a value

The only new value this design needs. A symbol the walk yields is **the name**,
not a lookup: it never resolves, in any scope, however it is carried, indexed,
compared or re-constructed into something else.

```text
.x 5; {x} & {_}                              → [x]
.x 5; .n (({x} & {_}) .0); [n, (“” n) = “x”]  → [x, <>]
(({x} & {_}) .0) = (({y} & {_}) .0)          → ()
.w (({x} & {_}) .0); .z [w]; z               → [x]
```

_before:_ `.x 5; {x} & {_ .0}` answers `$!.name-missing x`: touching the yielded
symbol looked it up. `{x} &| {_ === x}` answers `[]`, because the right-hand `x`
was looked up and found nothing. No existing value is a name: `(.x)` in value
position is a declaration with no value, `@x` answers an address that cannot be
spelled or compared, and the `.x` that `[.x 5] && {_}` yields becomes a lookup
again as soon as it is bound to a name.

**Ruling: a walked name is a word, printed as it was written.** A lookup yields
`x` and a declaration yields `.x`, so the walk's text re-reads as the source.
The class is `FrameWord` (`lib/frames/frame-word.ts`).

**Ruling: a bare `.x` is a name too, and keeps its two live roles.** The address
`.x` written in a program already printed and collected as a name. It now stays
one when it is kept: bound by a declaration, compared, or spelled as text. It
still does its two jobs: applied to a value it declares, `.x 5`, and applied by
an aggregate it reads that member, `o .x`. So a key can be kept in a variable
and used later (v0.26.0):

```text
.o [.x 5]; .k .x; o k                          → 5
.o [.x 5, .y 6]; .ks [.x, .y]; ks & {o _}      → [5, 6]
.k .x; [k, “” k, k = (.x), k = (.y)]           → [.x, “.x”, <>, ()]
```

_before:_ `.k .x` answered `$!.name-missing x`: the pending declaration `.k` was
the receiver `.x` was read from. `“” .x` failed the same way.

The name `.k` keeps is a fresh address, so it carries no write authority over
the scope `.x` was written in: `.k .x; k 7` declares nothing. Text spells a name
only when it has no such member, so a document still answers `.body`. `@x` is
not a name: it is the write alias of the binding `x`, and `.k (@x)` keeps only
its name.

**Ruling: `=` on names compares the name.** A lookup `x`, a declaration `.x`,
and the written name `.x` are all equal, in either order, and `x` and `y` are
not.

**Ruling: `===` on walked names compares the declaration they resolve to.** A
name at the head of an expression declares, and a lookup resolves to the nearest
declaration before it, in its own body or in a body around it, which is the
order a call evaluates them in. A closure's locals come ahead of its argument,
so that much is static, and `===` tells shadowed names apart:

```text
.c {.a 1; {.a 2; a}}; .o ((c & {_}) .0); .i (((c & {_}) .3) & {_});
[(i .3) === (i .0), (i .3) === o, (i .3) = o]  → [<>, (), <>]
.f {a; .a 1}; .w (f & {_}); (w .0) === (w .2)  → ()     a lookup before it is free
.f {.a 1; o .a}; .w (f & {_}); (w .4) === (w .0)  → ()  a member name is not the local
```

A name declared nowhere its body can see is **free**. It resolves per call,
argument first (spec 7), so which `x` it means is not a fact about the closure,
and two free words are `===` when they are spelled alike. A walk of a nested
closure sees the declarations around it whether or not anything walked the outer
closure first: they are recorded when the outer closure's call binds the inner
one. `===` on a word and a written `.x` is nil, and the ladder holds, since
`===` implies the same spelling and so `==` and `=`.

A name answers nothing about the value it would name. `.x.#` is nil, and
applying a name is applying a symbol: `(.x) 5` is the declaration `.x 5`,
evaluated where it is applied, which is the one place a name turns back into
code. That is deliberate: it is how a program builds a closure's body from the
walk of another, and it is evaluation, so it is not the walk's business.

## 4. The snapshot is the closure

Issue #429 asks for an immutable, unevaluated snapshot. No new operation is
needed: the closure literal already is one. `bind` copies the template and
`call` evaluates the copy's body in a fresh scope; nothing ever writes to the
template (`lib/frames/frame-lazy.ts`). So the walk yields the template's own
atoms, and two walks yield the same frames.

```text
.f {.a _; [a, a]};
.before (f & {“” _}); .r (f 1); .after (f & {“” _});
[before = after, r]              → [<>, [1, 1]]
.t ((f & {_}) .0); .u ((f & {_}) .0); t === u   → <>
```

_before:_ both hold already, at term granularity.

**Ruling: the walk never copies and never writes.** A yielded aggregate is the
template's own frame, and a write through it is a functional update, so the
template is unchanged and the writer holds the copy. The same rule already
governs a Figure read through a name (#401).

**Ruling: effects stay in the body.** A resource read, a clock read or a write
written in the body is an atom like any other, and walking past it performs
nothing.

```text
{'clock:now' | []} & {“” _}      → [“'clock:now'”, “|”, “[]”]
```

_before:_ holds, as one term.

## 5. Folding a walk runs it

`|` applies each element to the receiver the last step answered, which is what
the evaluator does with the terms of a body. So a fold over code is a call: a
closure folded is called with the receiver, and a stream that holds a word is
re-read as the closure it spells and called the same way. `{…} | (args)` is a
second spelling of `{…} (args)`, and a walk that was taken apart and put back
together runs as the original did.

```text
{4 + 5} | ()                              → 9
{x * y} | (.x 6, .y 7)                    → 42
{_ + 1} | 3                               → 4
{.a 1; a + 2} | ()                        → 3
.f {x * y}; (f & {_}) | (.x 6, .y 7)      → 42
.y 1; .f {x + y}; f | (.x 5)              → 6
```

_before:_ `{4 + 5} | ()` answered the one wrapped term, `(4 ((+)) ((5)))`.

**Ruling: a fold re-reads, it does not apply atom by atom.** Applying a walked
`x` to `(.x 6, .y 7)` does read `x` from the group, but the answer so far is
then `6`, and `y` would be looked up in the curry `6 *`. The evaluator keeps the
scope apart from the running answer, and a fold has only the one receiver, so
the stream is re-read as a body (`closureFromAtoms`, the inverse of the walk)
and the receiver becomes the argument. A closure folded is simply called, so its
captured names still resolve.

**Ruling: a fold over a closure is a call, whatever the receiver.**
`{4 + 5} | []` is `9`, not `[4, +, 5]`; a walk is `&`. `|` runs, `&` walks.

## 6. What the walk never shows

- **Captured values.** A bound closure's scope is not an atom, and no atom
  reaches it. `.x 5; .f {x}; f & {_}` yields `.x`, never `5`.
- **The interpreter's own plumbing.** The parser's wrappers (§1) and the schema
  written beside a declaration are not atoms; the latter is the `.<>` key, which
  `visibleKeys` already hides, and which is where a representation of internal
  kinds would go if one is needed (#429, noted and not ruled).
- **Evaluation history.** The walk is the source, not a trace.

## 7. The acceptance tests of #429, in HC

| #429 asks                                                  | Test                                  | Status                                             |
| ---------------------------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| No effect executes under the walk                          | §4 clock example                      | holds                                              |
| Terms recovered in order, no execution                     | §2 walk re-reads; `.#` counts atoms   | holds (before: statements dropped, `.#` evaluated) |
| Calling afterwards leaves the snapshot unchanged           | §4 `before = after`                   | holds                                              |
| Nested closures and shadowed names keep their distinctions | §1 nested closure; §3 names and `===` | holds (before: a yielded `x` resolved on touch)    |
| No private values exposed, no AST mutation                 | §6; §4 functional update              | holds for exposure; mutation ruled, untested       |

## Warts

Accepted in v0.25.0 and v0.26.0, each small enough to live with and each a
candidate for its own ruling:

- **`,` was not an atom** until v0.27.0.
  [`a16`](a16-concrete-semantics-graph.md) makes it one, as `;` is, so a walk
  re-reads as its source.
- **A parsed aggregate prints with its wrappers.** `{[1, [2, 3]]} & {_}` is one
  atom, the array as written, and printing it shows the parser's terms:
  `[[(1), ((([(2), (((3)))])))]]`. Walking it is clean, as §1 shows; only its
  spelling is not. The fix belongs to rendering, not to the walk.
- **A decimal literal walks as two atoms.** The parser holds `1.5` as `1` and
  `.5`, and evaluation joins them, so `{1.5} & {_}` is `[1, .5]`.
- **A word has no members.** `{x} & {_ .0}` answers `$!.name-missing`, for the
  member `0` of the word, rather than for `x`. That is the point, but a word
  could reasonably answer its spelling as text instead.
- **A lookup inside an aggregate written in a body was free** for `===`, until
  v0.27.0. [`a16`](a16-concrete-semantics-graph.md) supersedes this: an
  aggregate written in a body is scoped inside it, and its names keep their
  bindings.
- **Applying a kept name to a value echoes a declaration it does not make.**
  `.k .x; k 7` answers `(.x 7)` and writes nothing, because the kept name has no
  write target. Refusing it would be clearer.

## Not in scope

Inference over the walk (what an operation preserves), certification of a
derivation, and any proof kernel: these are Figure 004's questions, and this
document only makes their input stable and traversable.
