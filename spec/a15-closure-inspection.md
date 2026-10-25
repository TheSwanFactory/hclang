# Closure Inspection: Walking Code Without Running It

**Status:** Implemented in v0.25.0, with the warts listed in [Warts](#warts).
Each example gives the answer at v0.25.0, and a line marked _before_ gives what
v0.24.3 (`b1867e8`) answered, measured.\
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

**Ruling: the parser's trivial `()` wrappers vanish.** A single-value `()`
already unboxes everywhere else (#374), so a wrapper with nothing of its own has
nothing for the walk to show. A `(…)` the program wrote with more than one value
stays, as the one aggregate it is.

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
`x` and a declaration yields `.x`, so the walk's text re-reads as the source,
and the two are distinct names. The class is `FrameWord`
(`lib/frames/frame-word.ts`). Whether a bare `.x` in value position should also
be a word, rather than the valueless declaration it is today, is left open:
`obj .x` reaches a property through that same address symbol, so it is not a
change to make lightly.

**Ruling: `=` on names compares spelling.** Two walks of `x` are `=`, and `x`
and `y` are not. Whether `===` on two names can distinguish _which_ `x`, the
binding identity #429 asks for, is left open: it is answerable only for a walk
over a bound closure, and only if the walk can carry the binding without
exposing the scope (§5). Until ruled, `===` on names is `=`.

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

## 5. What the walk never shows

- **Captured values.** A bound closure's scope is not an atom, and no atom
  reaches it. `.x 5; .f {x}; f & {_}` yields `.x`, never `5`.
- **The interpreter's own plumbing.** The parser's wrappers (§1) and the schema
  written beside a declaration are not atoms; the latter is the `.<>` key, which
  `visibleKeys` already hides, and which is where a representation of internal
  kinds would go if one is needed (#429, noted and not ruled).
- **Evaluation history.** The walk is the source, not a trace.

## 6. The acceptance tests of #429, in HC

| #429 asks                                                  | Test                                    | Today                                        |
| ---------------------------------------------------------- | --------------------------------------- | -------------------------------------------- |
| No effect executes under the walk                          | §4 clock example                        | holds                                        |
| Terms recovered in order, no execution                     | §2 join re-reads; `.#` counts atoms     | fails: statements dropped, `.#` evaluates    |
| Calling afterwards leaves the snapshot unchanged           | §4 `before = after`                     | holds                                        |
| Nested closures and shadowed names keep their distinctions | §1 nested closure; §3 names; `===` open | fails: a yielded `x` resolves on touch       |
| No private values exposed, no AST mutation                 | §5; §4 functional update                | holds for exposure; mutation ruled, untested |

## Warts

Accepted in v0.25.0, each small enough to live with and each a candidate for its
own ruling:

- **`,` is not an atom.** A `,` between terms of a closure body separates two
  terms, as it does today, and the walk yields the terms with nothing between
  them, so `{1, 2} & {_}` is `[1, 2]`. A body joined back from its walk loses
  the comma, which only matters where juxtaposition and separation differ.
- **A parsed aggregate prints with its wrappers.** `{[1, [2, 3]]} & {_}` is one
  atom, the array as written, and printing it shows the parser's terms:
  `[[(1), ((([(2), (((3)))])))]]`. Walking it is clean, as §1 shows; only its
  spelling is not. The fix belongs to rendering, not to the walk.
- **A decimal literal walks as two atoms.** The parser holds `1.5` as `1` and
  `.5`, and evaluation joins them, so `{1.5} & {_}` is `[1, .5]`.
- **A word has no members.** `{x} & {_ .0}` answers `$!.name-missing`, for the
  member `0` of the word, rather than for `x`. That is the point, but a word
  could reasonably answer its spelling as text instead.
- **A bare `.x` is still a declaration** (§3).

## Not in scope

Inference over the walk (what an operation preserves), certification of a
derivation, and any proof kernel: these are Figure 004's questions, and this
document only makes their input stable and traversable. Whether `===` on names
carries binding identity, and whether a bare `.x` is a word, are left to later
rulings.
