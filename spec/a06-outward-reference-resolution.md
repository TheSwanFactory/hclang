# Outward Reference Resolution

**Status:** Implemented in v0.10.5. `_^` is purely lexical at every level; the
iterator parameter is read only through the bare name `.`.\
**Issue:** [#340](https://github.com/TheSwanFactory/hclang/issues/340)

## The question

`FrameParam` resolved one spelling against two roles: `_^` was the explicit
parameter when the call supplied one (how an iterator hands a block its index,
key, or accumulator alongside the value), and the enclosing lexical declaration
target when it did not. `_^^` and deeper were only ever lexical. #339 made the
two accessors visible (`EvaluationScope.parameter` versus
`EvaluationScope.lexicalAt`), and #340 asked which one `_^` denotes.

## The decision

**`_^` means one enclosing lexical scope per caret, and nothing else.** The
iterator parameter keeps the spelling it already had: the bare name `.`.

## Why the evidence forced it

1. **The parameter already had its own spelling.** `FrameName` resolves the
   empty name to `scope.parameter`, which is exactly what bare `.` lexes to in
   expression position. The executed corpus uses it — `BitScheme.hc` reduces
   with `& {. _}`, `white-paper.hc` with `& { . + _ }` — and `iterators.test.ts`
   pinned "`.` as the accumulator" by name. It works for all three iterator
   forms: `|` supplies the index, `&&` the key, `&` the accumulator. Giving the
   parameter a _new_ spelling was never needed; the conflated reading of `_^`
   was a redundant second door.

2. **The documentation already said so.** `doc/GRAMMAR.md` documented `_^` only
   as the enclosing scope ("skips the argument"), in three places. No document
   described the parameter reading. Settling on the lexical meaning aligns the
   implementation with every published description.

3. **The precedence was not benign.** Because the parameter shadowed level one,
   an iterator block could not reach one scope out at all:
   `.k 7; [10] | { _^.k }` returned `name-missing` rather than `7`. Worse, the
   level count depended on invocation: the same block `{_^.k}` read `k` when
   called as a plain closure but the index when called from `|`, so callers had
   to count a phantom level exactly when an iterator was involved. This is the
   same class of defect #333 fixed for `up`, in the argument syntax.

## Semantics now

| Spelling | Denotes                                                                |
| -------- | ---------------------------------------------------------------------- |
| `_`      | the call's argument (`__` the enclosing call's, one per `_`)           |
| `_^`     | one enclosing lexical scope (`_^^` two, one per `^`)                   |
| `.`      | the iterator parameter: index (`\|`), key (`&&`), or accumulator (`&`) |

The count in `_^…` depends only on where the closure was written, never on how
it was invoked. `.k 7; [10] | { _^.k }` now yields `[7]`, and inside a closure
one level deeper the same read is `_^^.k`, matching the block's lexical nesting
exactly.

## What changed

- `FrameParam.in` resolves every level through `lexicalAt`; the
  level-one-parameter branch is deleted. `FrameName`'s empty-name resolution to
  `scope.parameter` is unchanged and now the only reader of that role.
- `lib/maml.ts` reads the `&&` key through the empty name instead of
  `FrameParam.there()`, as do the iterator tests.
- Pinned in `evaluate.test.ts` (lexical reach from an iterator block; all three
  `.` readings) and `cli/hc/white-paper-core.hc` (executed corpus).
- `doc/GRAMMAR.md` documents the iterator parameter spelling and the
  invocation-independent caret count. Its "skips the argument" gloss on `_^` is
  dropped in both places: it was accurate under the old positional model, where
  `_^` was literally slot 1, but with `_`/`__` walking argument scopes and
  `_^`/`_^^` walking lexical scopes as two unrelated ladders it invites exactly
  the phantom-level counting this change removes.
- `cli/hc/white-paper.hc` no longer calls `_^` a `super` reference. It names the
  scope the closure was written in, not a declared parent, which is read by
  plain name.
- `spec/1-fix-closures/02-underbar-reqs.md` carries a superseded-by pointer
  here: its REQ-9 defines `_^` as the parameter accessor, which is the reading
  this document deletes.

## Noted, not resolved here

GRAMMAR.md listed bare `.` as "This (current object)". There is no working
"this" reader today: outside an iterator parameter, the empty name resolves as a
setter against the write target, and a method reads its own properties by plain
name. The grammar now documents `.` as the iterator parameter; if a "this"
reader is ever wanted, it needs its own decision rather than another shared
spelling. `cli/hc/white-paper.hc` still lists a `Self` identifier variety
spelled `.`, which is the same unresolved question in prose.

**The parameter has no ladder, and failing to find it is silent.** `_` has `__`,
`_^` has `_^^`, but `.` has nothing: a closure nested inside an iterator block
cannot reach the parameter at all. Worse, the miss is not reported.
`FrameName.in` falls through to `this.data.setter(scope.writeTarget)` when no
parameter was supplied, so an empty-name _read_ silently becomes an empty-name
setter: `{ . } ()` yields nothing and `{ . + 1 } (5)` swallows the `+ 1`. This
asymmetry predates this document — `_^` reports `$!.name-missing` for an absent
level, and now always did — but making `.` the sole reader of the parameter role
makes it the only outward spelling whose failure mode is silence. Both halves,
the missing ladder and the missing diagnostic, are #345. The fix is not a
one-liner: the empty-name setter is reachable (`. 5` evaluates to `. 5`), so
turning an unsatisfied empty-name read into an error is a decision about what
bare `.` means, of the same kind this document settled for `_^`.

Two published documents still describe the superseded reading and are
deliberately untouched: `doc/onward2017/hc-paper-enp.mdk` is the Onward! 2017
paper, a historical artifact that also predates the `._^` removal in v0.10.2,
and no test runs it.

`cli/hc/format.hc` contains a stale `_^` line, `; {_^.value} (.value 9;)`
expecting `9`, and it is deliberately left alone. That expectation fails
identically before and after this change, because a plain closure call supplies
no parameter and `_^` therefore took the lexical path already, so it is not
evidence about the conflation and not collateral of removing it. The line has
never been checked: the whole file body sits inside a document fence, so
`--testdoc` reports zero assertions for it. Fixing it means deciding what that
file is for — a formatter specification pairing source with its re-printed form,
which is what its other entries do, or an executable document. That is #344, not
this document.
