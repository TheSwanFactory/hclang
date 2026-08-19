# Object Model Refactoring Corrections

**Status:** Implemented in v0.10.1, except as noted. Corrections 1, 2, and 4 are
implemented in full. Correction 3 deleted the census and made the write target
declared, but kept the flat `Frame[]` context stack rather than introducing a
scope frame with named slots, so `FrameArg`/`FrameParam` still index
positionally ([#327](https://github.com/TheSwanFactory/hclang/issues/327)).
Correction 5's parent respelling landed as `.^`; its mutating-marker unification
stays deferred per [a05b](a05b-object-model-resolutions.md)
([#328](https://github.com/TheSwanFactory/hclang/issues/328))\
**Corrects:**
[a05-object-model-refactoring.md](a05-object-model-refactoring.md)\
**Issue:**
[#306 — Refine object model ownership, inheritance, and copy semantics](https://github.com/TheSwanFactory/hclang/issues/306)

## Summary

a05 diagnoses the problem correctly: the single `up` pointer carries six
distinct relationships — lexical scope (`frame-symbol.ts:100`), syntactic
containment (`frame-expr.ts:12`), declared parent (`frame-symbol.ts:144`),
runtime receiver (`frame-handle.ts:69`), handle-to-target
(`frame-handle.ts:13`), and note provenance (`frame-note.ts:91`). But it then
names four roles and declines to give them separate storage, so several
checklist items exist only to manage the ambiguity it chose to keep, and two of
its open questions are artifacts of that choice rather than genuine design
forks.

This correction promotes three storage and threading decisions from "open" to
"decided," retires the checklist items those decisions subsume, bounds the copy
contract to the one case that needs it, and records two syntax simplifications
that make a05's own goals cheaper to reach. It does not change the diagnosis or
the behavior a05 sets out to preserve; `cli/hc/class-support.hc` still governs.

## Corrections

### 1. The parent link is a separate field, not a storage choice

a05 open question 2 treats "dedicated field beside `up`" versus "sole writer of
`up`" as an implementation detail. It is not, because visibility reads that
chain. Protected access is granted by `isAncestorOf` (`meta-frame.ts:252-261`),
which walks `up`, and `up` is rewritten on every successful lookup by
`value.up = context` (`frame-symbol.ts:99-101`). Protected access therefore
currently means "the owner happens to be on your `up` chain as last written,"
which includes lexical nesting and syntactic containment. A nested aggregate can
read an enclosing aggregate's `_protected` fields even though a05's own matrix
classifies it as an unrelated peer.

Decision: the **declared parent** gets its own field. Protected authorization
walks the declared chain only. This makes a05's "the matrix must not bend" true
by construction instead of by assumption, and it subsumes:

- `is.inherited` — it exists only to stop lexical assignment from clobbering a
  declared parent (`frame-symbol.ts:99`); with separate fields there is nothing
  to clobber.
- the propagation dance in `FrameArray.in` (`frame-array.ts:29-33`) — a declared
  parent is preserved because it lives in a field that evaluation does not
  overwrite.
- the multiple-caller risk around `wouldCreateParentCycle` — one field writer
  means one cycle-check site, by construction.

Decision to record explicitly, because a05 answers it by accident: **lexical
nesting does not grant protected access.** Only the declared parent chain does.

### 2. The runtime receiver is an argument, not a mutation

`BoundMethod.call` copies the closure body and rewrites its `up` per invocation
(`frame-handle.ts:68-69`). `FrameLazy.call` already threads roles explicitly as
`expr.in([prepared, _parameter, this])` (`frame-lazy.ts:95`). Passing the
receiver as an explicit slot rather than as a mutation of a copied body deletes
both the per-call copy and the write.

This resolves a05 open question 3 ("how far does the instance copy recurse into
lazy bodies") by dissolving it: bodies are not copied at all. It also retires
the origin hack at `frame-symbol.ts:91-96`, where the `>>` frame is substituted
as `origin` when the context is a handle. That hack exists because there is no
first-class notion of self — private access is `origin === this`
(`meta-frame.ts:246`), so "self" must be smuggled in. With the receiver as an
explicit slot, `origin` is the receiver, and a05's requested "private access
from a closure nested in a method body" test becomes a consequence rather than a
special case.

### 3. The receiver mark reuses `>>`, and the tradeoff is named

a05 open question 1 offers the receiver mark as either a flag on the context
frame or a parallel stack slot. There is a third option already in the codebase:
the declaration target is threaded today as `out` in `array_eval(contexts, out)`
(`frame-list.ts:95`), stored as `>>` metadata by `EvalPipe` (`eval-pipe.ts:7-8`)
and by `FrameSymbol.setter` (`frame-symbol.ts:178-185`). The census in
`bindingTarget` (`frame-name.ts:72-90`) exists only because `FrameGroup` and
`FrameExpr` push themselves onto the same flat array without recording why.

Decision: push one scope frame carrying named slots in its metadata — `>>` for
the write target, plus argument, parameter, and receiver — so the write target
is read, not inferred. This is more idiomatic for a homoiconic language than a
boolean flag, and it subsumes two positional hacks a05 does not mention:
`FrameArg`/`FrameParam` indexing by stack position (`frame-arg.ts:100-118`,
`:139-165`) and the empty name meaning "iterator accumulator" because it sits at
`contexts[1]` (`frame-name.ts:92-95`).

Named tradeoff: `in(contexts: Frame[])` is the interpreter's universal
signature, and a05 open question 1 explicitly prefers keeping it stable. This
decision does change how that array is populated. That cost is accepted here
deliberately rather than deferred, because leaving the signature "stable" while
overloading positions in the array is what produced the census in the first
place.

### 4. The copy contract is bounded to copy-on-write

`copy()` has four production callers: two in `BoundMethod`
(`frame-handle.ts:66,68`), one for signature defaulting (`frame-lazy.ts:104`),
and the `FrameList` override itself. Of those, only `this.receiver.copy()` wants
object semantics. Constructors do not need it: `FrameArray.in` builds a new
array and re-evaluates every item (`frame-array.ts:28-35`), so nested aggregate
literals are already fresh per call — which is exactly what the `Point` case in
`class-support.hc` proves. The nested-sharing leak a05's plane table is designed
to prevent arises only through copy-on-write.

The one decision the table hangs on — what `p.set: 2` does when `p` is an
immutable handle — is already settled by the larger corpus: **the original is
untouched and the result is the new value.** That is functional update, and it
justifies the deep instance copy. So the plane table stays, but it is scoped to
its single trigger (copy-on-write through an immutable handle) rather than
presented as a general policy over all `copy()` sites, and the semantics are
stated out loud: writing through the copy is invisible through the original at
any depth, and the call evaluates to the new value.

Two trims to the table:

- Drop the **handle identity** row. `FrameHandle` is not exported from
  `lib/frames.ts` and no caller copies one, so that row specifies behavior
  nothing needs. Handles are created only for `FrameArray` values
  (`frame-symbol.ts:105-107`), so "object" here means "aggregate" — worth
  stating in one sentence in place of the row.
- The **lexical parent** row ("not inherited; the copy learns its context where
  it is used") depends on the same lookup-time `up` rewrite that correction 1
  removes from the visibility path. Once the declared parent has its own field,
  this row is just "the copy has no declared parent unless the source had one,"
  which the **declared parent** row already covers.

Keep the two named operations — plumbing copy and instance copy — as a05 defines
them. The correction is only that instance copy has exactly one caller
(copy-on-write) and one meaning (functional update), not a menu.

### 5. Two syntax simplifications that lower a05's cost

a05 fences syntax changes out as non-goals. Two of them are worth reopening
because the fence is what forces the very string tests and magic branches the
checklist is trying to delete.

**`._^` becomes `.^`.** a05 wants `._^` to stop being a magic string in `apply`
and become an ordinary assignment. It cannot, quite: `resolve_here` grades a
leading underscore as visibility (`meta-frame.ts:84-90`), so `_^` reads as
"protected member named `^`." The magic-string branch
(`frame-symbol.ts:135-150`) is what currently prevents that collision. Spelling
it `.^` avoids the collision, matches `^` already meaning "outward"
(`FrameParam.ARG_CHAR`, `frame-arg.ts:123`), and deletes the `parentDeclaration`
branch in the name recognizer (`frame-name.ts:31,42`) — `.^ base` already lexes
as an ordinary name today, because `^` passes `OPERATOR_CHARS` and completes on
the following character. Keep `._^` as a deprecated alias if compatibility
requires it.

**One effect marker instead of two.** Mutable identity is a trailing `_` on the
name (`frame-symbol.ts:106`); a mutating method is a trailing `:` on the key,
tested twice by string in `BoundMethod` (`frame-handle.ts:66,72`). a05's
checklist wants the copy-on-write decision moved off that string test but keeps
the marker, and lists the trailing-colon lexer as a non-goal — while that lexer
special case (`scanMutatingSuffix`, `frame-symbol.ts:66-81`) exists only because
`:` is also the if-else operator (`ops.ts:31`). Unifying on the trailing
underscore — `.set_ {…}`, called as `counter_.set_ 2`, with the rule "a mutating
method requires a mutable receiver" — deletes `scanMutatingSuffix` and both
string tests and returns `:` to one meaning. Cost: rewriting the
`class-support.hc` examples and undoing part of #305's lexer work. That cost is
why #305 fenced it; the point here is that the fence is what forces the string
test the checklist is trying to remove.

## Revised sequencing

a05's checklist runs its five concerns in parallel, which means the receiver
mark, the parent link, and the copy contract each get built against the
ambiguity the others still carry. The corrections above have a dependency order:

1. **Split the declared-parent field** (correction 1). Everything else reads a
   cleaner chain afterward.
2. **Make the scope frame explicit with named `>>` slots** (correction 3).
3. **Move the receiver into that scope frame** (correction 2). Now bodies are no
   longer copied.
4. **Bound the instance copy to copy-on-write** (correction 4), which is now a
   single caller with functional-update semantics.
5. **Apply the syntax simplifications** (correction 5) last, or in a separate
   change, since they touch the corpus and #305's lexer.

After steps 1–3, roughly half of a05's checklist is subsumed rather than
implemented: `is.inherited` retirement, the `FrameArray` propagation dance, the
`bindingTarget` census, the origin hack, and the per-call body copy all go away
as consequences.

## Checklist deltas against a05

- **Write target:** replace "define the receiver mark (flag or slot)" with "add
  named slots to one scope frame; read `>>` for the write target." Keep the
  census deletion and the coverage cases.
- **Parent link:** keep, and add "the declared parent is a distinct field;
  lexical `up` never overwrites it, so `is.inherited` is deleted rather than
  queried." Add "protected authorization walks the declared field only; pin the
  nested-aggregate non-access with a test."
- **Handle:** keep bound-method extraction, but pass the receiver as an explicit
  slot rather than rewriting a copied body's `up`. Drop the copy-on-write string
  test in favor of declared mutability plus the instance copy.
- **Copy contract:** scope the instance copy to its single caller
  (copy-on-write) with functional-update semantics; drop the handle-identity and
  lexical-parent rows.
- **Visibility and symmetry:** unchanged in intent; the matrix now holds by
  construction (correction 1) rather than by test alone, though the tests still
  belong.
- **Syntax (new section):** `._^` → `.^` with optional deprecated alias; unify
  the mutating marker on trailing `_`; delete `scanMutatingSuffix` and the
  `parentDeclaration` recognizer branch. Update `class-support.hc` accordingly.

## Non-goals unchanged from a05

The a05 non-goals stand, with one narrowing: a05 lists "reworking the
trailing-colon lexer behavior already fixed in PR #305" as out of scope.
Correction 5 reopens exactly that, so if the syntax simplifications are adopted,
this non-goal is lifted; if they are deferred, corrections 1–4 stand on their
own and this non-goal remains in force.
