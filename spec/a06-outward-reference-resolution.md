# Outward Reference Resolution

**Status:** Implemented in v0.10.5 and extended in v0.11.1. `_^` is purely
lexical at every level; `.`, `..`, and deeper dot runs read exact call-parameter
levels.\
**Issues:** [#340](https://github.com/TheSwanFactory/hclang/issues/340),
[#345](https://github.com/TheSwanFactory/hclang/issues/345)

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

| Spelling | Denotes                                                        |
| -------- | -------------------------------------------------------------- |
| `_`      | the call's argument (`__` the enclosing call's, one per `_`)   |
| `_^`     | one enclosing lexical scope (`_^^` two, one per `^`)           |
| `.`      | current call parameter; `..` the enclosing call's, one per `.` |

The count in `_^…` depends only on where the closure was written, never on how
it was invoked. `.k 7; [10] | { _^.k }` now yields `[7]`, and inside a closure
one level deeper the same read is `_^^.k`, matching the block's lexical nesting
exactly.

## What changed

- `FrameParam.in` resolves every level through `lexicalAt`; the
  level-one-parameter branch is deleted. `FrameName` is the only reader of the
  call-parameter role: dot runs resolve through `parameterAt`, and an absent
  exact level reports `name-missing` rather than producing an empty setter.
- `lib/maml.ts` reads the `&&` key through the empty name instead of
  `FrameParam.there()`, as do the iterator tests.
- Pinned in `evaluate.test.ts` (lexical reach from an iterator block; all three
  `.` readings) and `hc/white-paper-core.hc` (executed corpus).
- `doc/GRAMMAR.md` documents the iterator parameter spelling and the
  invocation-independent caret count. Its "skips the argument" gloss on `_^` is
  dropped in both places: it was accurate under the old positional model, where
  `_^` was literally slot 1, but with `_`/`__` walking argument scopes and
  `_^`/`_^^` walking lexical scopes as two unrelated ladders it invites exactly
  the phantom-level counting this change removes.
- `hc/white-paper.hc` no longer calls `_^` a `super` reference. It names the
  scope the closure was written in, not a declared parent, which is read by
  plain name.
- `spec/1-fix-closures/02-underbar-reqs.md` carries a superseded-by pointer
  here: its REQ-9 defines `_^` as the parameter accessor, which is the reading
  this document deletes.

## Parameter ladder follow-up

v0.11.1 resolves #345 with a third outward-reference ladder:

- `.` is the current call's parameter, `..` the enclosing call's, and each
  additional dot walks exactly one more call scope. Parameter-less calls are not
  skipped, so a missing exact level reports `$!.name-missing` with the requested
  dot run.
- Bare `.` has no `this` meaning. Methods already read their receiver through
  plain names, and overloading a missing parameter as self would restore the
  invocation-dependent ambiguity removed from `_^`.
- Source syntax no longer exposes an empty-name setter. Host code may still use
  arbitrary metadata keys, but an unsatisfied dot read is always diagnostic.

The historical Onward! 2017 paper remains unchanged as an archival document. The
maintained grammar and executable white paper document the parameter ladder.

## Executable format corpus follow-up

v0.11.1 also resolves #344 by choosing the executable-document interpretation
for `hc/format.hc`. Its outer document fence is removed, the cases are kept
within HCTest's line-oriented model, the stale `_^` expectation now checks the
missing-name diagnostic, and `cli/hc.test.ts` enforces authoritative totals. A
parse-only, width-aware formatter remains separate future work.

## Method receiver follow-up

v0.23.0 resolves the question 3 follow-up on
[#415](https://github.com/TheSwanFactory/hclang/issues/415). The caret count is
unchanged. What changes is the frame denoted at one level.

**The level that reaches the scope a method was written in denotes the method's
receiver.** A method is written in its aggregate, and a call binds it to the
aggregate it was found on: the aggregate itself, an instance copy of it, or a
declared descendant. `_^` from a method body, or `_^^` from a block nested one
level in it, therefore reads the receiver. Every other level is the enclosing
lexical scope, as before.

Three facts forced it:

1. **No spelling named the receiver.** Bare names read it, but the argument is
   looked up first (spec 7), so a method that takes an argument of its own
   class, such as every Figure method, cannot reach its own fields by bare name.
   Lexical `_^` read the aggregate the method was written in, which is the
   receiver only until the object is copied or inherited from.
2. **The copy contract failed.** An instance copy is its own owner, with no
   residual claim on its source. With lexical `_^`, a functional copy's methods
   read the source's fields: after `.p2 (Pt.bump_ ())`, `p2.n` was `2` while a
   method reading `_^.n` saw `1`, and chained updates lost writes.
3. **The effect axis leaked.** `_^` answered the defining aggregate raw. A
   non-mutating method calling `_^.bump_ ()` wrote its receiver in place, and a
   mutating method reached through an immutable name wrote the original while
   its functional result lost the write.

The receiver is read through the same layer bare-name lookup already uses, a
handle carrying the call's mutability and copy provenance, so `_^` has exactly
the authority bare names have and no more. The count still depends only on where
the closure was written. The receiver is a fact of the call, as the argument `_`
is.

A method read by dot from a value no name holds, such as `(Q.push_ 1).push_ 2`
or `[.^ Base; .x 2].get()`, is bound to that value as a name would bind it,
immutably, because such a value may still be shared. Before v0.23.0 it ran
unbound, so its `_^` fell back to the defining aggregate.

One reading changes: a closure written outside an aggregate and stored as its
method now reaches that aggregate through `_^`, not the scope it was written in.
To read the outer scope, bind the value where the closure is written, as in
`.outer x; .f {outer}`, which resolves lexically (#400).
