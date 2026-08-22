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
for `cli/hc/format.hc`. Its outer document fence is removed, the cases are kept
within HCTest's line-oriented model, the stale `_^` expectation now checks the
missing-name diagnostic, and `cli/hc.test.ts` enforces authoritative totals. A
parse-only, width-aware formatter remains separate future work.
