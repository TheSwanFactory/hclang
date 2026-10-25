# The Concrete Semantics Graph

**Status:** Implemented in v0.27.0.\
**Issues:** Figure 004.08 and 004.09a in `occurrence/figure`
(`issues/004-proof-by-observation/`), which found the symptoms; spec 7 §2, whose
lookup order this document brings the runtime into line with.\
**Supersedes:** `a15`'s ruling that "the parser's trivial `()` wrappers vanish"
in the walk, and its warts that `,` is not an atom and that a lookup inside an
aggregate written in a body is free. Those are gone, and `a15` now points here.
`a15` otherwise stands.

## What the parser builds

HC has no abstract syntax tree. What the parser builds is the program's own
runtime object graph: every node is a `Frame` that evaluates itself, so a group
is a scope boundary, a closure captures scope and is called in place, and a node
has identity. That graph is also what the walk (`a15`) and the printer show.
Call it the **Concrete Semantics Graph**.

- **Concrete:** it keeps the source's constructional structure, which an
  abstract tree discards: groups, statements and their `;`, the `,` between
  terms, and the tight binding of terms that abut.
- **Semantics:** its nodes carry their meaning rather than describing it. A node
  is the operation, the scope, the value.
- **Graph:** terms are shared between a bound closure and its template, Figures
  share children by design, and `up` runs to a lexical parent. It walks as a
  tree because the walk follows construction edges only.

Two invariants make the name true, and v0.27.0 is the release that makes the
graph satisfy them:

1. **Every node has a semantic role.** No node exists only because the parser
   needed it.
2. **Every semantic distinction has a node or an edge.** Nothing the source
   means is kept only in a flag a projection can lose.

Each invariant had one violation. Both were found in the same place, where a
parenthesised group or an array literal begins, and both turned out to be the
same mistake: an aggregate written in a body was treated as a value with a scope
of its own, not as syntax scoped inside that body.

## 1. Inert nodes: the parser's wrappers

One whitespace started a _bind pipe_, and the pipe emitted what followed as a
`FrameBind` holding a one-term `FrameExpr` holding the atom. At evaluation those
two nodes did nothing: `evaluateTerms` calls `in` on every term alike, and the
wrappers only passed the call down. But they printed, as `((+))`, and they
doubled the depth of every walk.

**Ruling: a bind emits its term bare, and no `FrameBind` reaches the graph.**
The class remains as the parser's marker for the pipe, and nothing else.

The wrapper was not always inert, and that is the second half of the ruling.
Terms that abut, as `o.x` in `f o.x`, bind tighter than terms a space separates:
`o.x` is evaluated before `f` applies, so `f o.x` is `6` when `o.x` is `5`, as
`f (o .x)` is. That tight binding is a meaning, so it keeps a node:

**Ruling: several abutting terms are one tight `FrameExpr`.** A nested plain
expression inside a statement means "evaluate me first", exactly as a group of
one does.

```text
{f o.x}     parses to   FrameExpr [f, FrameExpr [o, .x]]     (before: f, FrameBind [FrameExpr [o, .x]])
{4 + 5}     parses to   FrameExpr [4, +, 5]                   (before: 4, FrameBind [FrameExpr [+]], FrameBind [FrameExpr [5]])
```

## 2. Lost distinctions: `,`, tight binding, and the group's scope

Three things the graph held were dropped by a projection.

**The walk flattened tight expressions and dropped `,`.** `a15` §1 ruled that
"trivial `()` wrappers vanish", and the walk flattened every nested expression
with them. So `{f o.x}` walked to `[f, o, .x]`, which a fold re-read as `f o`
then `.x`, and `{1 + 2, 3}` walked to `[1, +, 2, 3]`.

**Ruling: the walk keeps every distinction the graph has.** A tight expression
is one atom, and walks in turn. `,` between two terms of a body is an atom, as
`;` already was. A fold's re-read honours both. So the walk's text is the
source:

```text
{.a 1; a + 2, b} & {“” _}   → [“.a”, “1”, “;”, “a”, “+”, “2”, “,”, “b”]
{f o.x} & {“” _}            → [“f”, “(o .x)”]
{4 + 5} & {_}               → [4, +, 5]        unchanged; {4 + 5}.# is still 3
{1, 2}.#                    → 3                (before: 2)
```

**The printer flattened the body.** A closure printed its statements joined by
spaces, so `{ .a 1 a + 2 }` did not read back, and `{ f o .x }` read back as a
different program.

**Ruling: a body prints as it was written.** `;` after a statement, `,` between
separated terms, and a tight expression in parentheses, since the spacing that
bound it cannot be restored and `(o .x)` means the same:

```text
“” {.a 1; a + 2, b}   → “{ .a 1; a + 2, b }”
“” {f o.x}            → “{ f (o .x) }”
```

**An aggregate's own scope was searched last.** Spec 7 §2 orders lookup "1. the
current child's own properties; 2. an explicit argument's own properties; 3. the
closure's live enclosing scope". A group or array literal under construction is
the current child, but its own layer was appended to lookup, so a name the
literal declared read the enclosing binding whenever one existed. The walk had
the mirror defect: it recorded declaration sites only for nested closures, so
below a group every name was free for `===` (004.08), even though execution
resolved it correctly (004.09a).

**Ruling: an aggregate written in a body is syntax scoped inside that body.**
Its own frame is the first lookup layer (`EvaluationScope.withWriteTarget` for a
construction target, `withOwnLayer` for a group's copy), and the walk records it
with the declarations in view, walking its terms as it passes so what it holds
is recorded too.

```text
.gb 1; (.gb 2; gb)          → (.gb 2; 2)       (before: (.gb 2; 1))
{.a 1; [.a 2; a]} ()        → [.a 2; 2]
{.e 1; (.f 2; [e, f])} ()   → (.f 2; [1, 2])   unchanged: a name the literal does not declare
.f {.k _; (k = 3) ? {1} : {2}}
  the walked k in the group === its .k    → <>   (before: ())
  the walked k in the group === a free k  → ()   (before: <>)
```

**The one exception is a named import.** A module imported _during_ a
construction, `(.x 1, M <- './m.hc')`, is not that construction's child: its
statements are its own file's, and the construction is an accident of where the
import was written. Its namespace sees the importing file before the
construction, as #391 designed and its property test pins.

## What remains

- **A parsed aggregate's walk omits its `;` statements.** `FrameList.elements`
  leaves statements out, because a statement answers nothing when an aggregate
  is a value. For a parsed aggregate that drops syntax: `(.a 2; a)` walks to
  `[a]`, so a declaration the group makes cannot be seen by walking the group,
  though execution honours it. A closure's walk keeps `;`. Whether a parsed
  aggregate's should too is the next ruling this document owes.
- **A re-read closure has no captured scope.** `|` over a walked _array_
  re-reads it as a fresh closure, so free names it holds resolve only against
  the receiver. `|` over the closure itself calls the bound closure. This is
  `a15` §5's rule, unchanged.
