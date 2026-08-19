# Object Model Resolutions

**Status:** Implemented in v0.10.1. Corrections 1–3 landed together as this
document required, with the suite green only at the end; the peer-method and
nested-aggregate refusals are pinned in `cli/hc/class-support.hc`. The `.^`
respelling needed no lexer rule, so its one condition held, and `._^` is refused
by name rather than falling through. Two amendments remain open: the residual
per-call `FrameExpr` rewrite of `up` on shared body items
([#329](https://github.com/TheSwanFactory/hclang/issues/329)), and the deferred
mutating-marker unification
([#328](https://github.com/TheSwanFactory/hclang/issues/328))\
**Responds to:**
[a05a-object-model-corrections.md](a05a-object-model-corrections.md)\
**Issue:** [#306](https://github.com/TheSwanFactory/hclang/issues/306)

## Summary

a05a's corrections 1–4 are accepted as written, with the adjustments below.
Correction 5's parent-declaration respelling is accepted; its mutating-marker
unification is deferred. The a05a checklist deltas govern, amended by this
document.

## Verified findings folded in

Review of a05a against the code confirmed every citation and both empirical
claims, and surfaced four facts the plan must absorb:

1. **The protected leak is worse than stated.** Not only nested aggregates: an
   unrelated peer's _method_ reads another frame's `_protected` field today
   (`thief.steal { owner.secret }` returns the value), while the same dotted
   access at top level is correctly refused. Private access is safe in both
   positions. Correction 1 fixes this; the peer-method reproduction becomes a
   pinned test.
2. **Steps 1–3 are one atomic change.** With protected authorization walking the
   declared chain only, method-path access (`derived.values()` reaching
   `protected`) breaks until the receiver is an explicit origin, because today
   the receiver reaches the origin only through the mutated `up` on the copied
   body. The sequencing keeps its order but lands 1–3 in a single change with
   the suite green only at the end.
3. **Bodies are still wrapped per call.** Removing the bound-method copy does
   not remove the per-call `FrameExpr` whose constructor rewrites `up` on the
   shared AST items. That residual mutation is in scope for correction 2's
   receiver work, not dissolved by it.
4. **Denying lexical-nesting access is a semantic change.** It is adopted — the
   matrix governs — but it requires a corpus sweep for code relying on inner
   frames reading outer protected members, and a `class-support.hc` example
   pinning the refusal.

## The `^` decision

No ASCII punctuation is unclaimed — all thirty-two characters carry a role — so
the parent link reuses `^`, disambiguated by position. The syntactic overload is
accepted on one condition: **the lexing must be clean.**

- **`.^` declares the parent.** It already lexes as an ordinary name with zero
  recognizer changes; adopting it deletes the `parentDeclaration` branch and the
  `"_^"` magic-string branch, and converges with the `^`-as-parent spelling
  GRAMMAR.md already documents. No new lexer special case may be added to
  support it — if one turns out to be required, this decision reopens.
- **Reading is untouched.** `_^` remains the outward/parameter reference; bare
  `^` remains the BindType operator. The documented `^.x` super syntax is a
  silent no-op today: fix the docs or make it an error, but do not give
  expression-position `^` a second meaning.
- **`._^` gets an explicit ending.** Unaliased, old `._^ x` silently declares a
  protected member named `^`. Either keep `._^` as a deprecated alias or reject
  it with a pointed error; silent fallthrough is not acceptable.
- The declared parent's own field (correction 1) is the natural place to later
  expose a _readable_ parent property, which `._^` never provided.

## Deferred

The trailing-underscore mutating-marker unification (a05a correction 5, second
half). It is coherent, but "deletes both string tests" overstates — the
mutating-ness must still be represented at declaration time — and it gives one
character two position-dependent meanings while touching #305's lexer work and
the corpus. Revisit after corrections 1–4 land.

## Amendments to the a05a checklist

- Sequencing: steps 1–3 land as one change; step 4 follows; `.^` (step 5, first
  half only) may land with them or after.
- Visibility: add the peer-method protected reproduction and the
  nested-aggregate refusal to `class-support.hc`.
- Receiver: include the per-call `FrameExpr` `up` rewrite in the receiver
  extraction's scope.
- Syntax: `.^` only; `._^` aliased-or-erroring; docs corrected for `^.x`;
  trailing-underscore unification dropped from this round.
