# Unified Effect Marker

**Status:** Implemented in v0.11.0. A trailing underscore is the only mutating
marker; `:` denotes if-else alone.\
**Issue:** [#328](https://github.com/TheSwanFactory/hclang/issues/328)\
**Completes:** [a05a](a05a-object-model-corrections.md) correction 5, deferred
by [a05b](a05b-object-model-resolutions.md)

## The question

HC spelled one effect axis two ways. Mutable identity was a trailing underscore
on a name (`counter_`), read in `FrameSymbol.in`. A mutating method was a
trailing colon on a key (`.set:`), read in `BoundMethod`. The colon spelling
existed only for methods, and because `:` is also the if-else operator
(`ops.ts`), it needed a lexer special case — `FrameSymbol.scanMutatingSuffix` —
to decide when a colon joined an identifier and when it began an operator. That
one function was called from three recognizers: `FrameSymbol`, `FrameName`, and
`FrameAlias`.

a05a proposed unifying on the underscore. a05b deferred it on two grounds: that
"deletes both string tests" overstated the case, since mutating-ness must still
be represented at declaration time, and that it touched the corpus and #305's
lexer work.

## The decision

**A trailing underscore is the marker for the whole effect axis.** A method is
declared `.set_ {…}` and called `counter_.set_ 2`. The colon is only the if-else
operator, at every position.

a05b's objection is answered rather than dismissed. Mutating-ness is still
represented at declaration time, but the representation moves out of the
runtime: `effect-marker.ts` grades a key once and yields a `MethodEffect`, and
`BoundMethod` receives that declared fact instead of testing a key's spelling
when the effect is applied. `FrameHandle` mutability comes from the same rule
through `touchesIdentity`. The two divergent runtime string tests are gone; one
named rule replaces them.

## Why the underscore wins

1. **The lexer special case was the cost of the second spelling.**
   `scanMutatingSuffix` existed only to carve a mutating colon out of an
   operator character. With `_` already a `SYMBOL_CHAR`, `.set_`, `set_`, and
   `@set_` lex with no rule at all, and all three recognizers fall through to
   the ordinary identifier test. The function and its three call sites are
   deleted, not relocated.
2. **The colon gets one meaning back.** `.mutator:x` lexed as
   `[".mutator:", "x"]`; it now lexes as `[".mutator", ":", "x"]`. A name is
   complete at a colon whether or not a space precedes it, so the if-else
   operator no longer depends on what came before it.
3. **The axis reads as one idea.** An underscore touches identity. A name so
   spelled is a mutable handle on its value; a method so declared may write the
   receiver it runs against. Nothing distinguishes the two at the spelling
   level, and nothing needs to: a `FrameArray` under such a key becomes a
   handle, a `FrameLazy` becomes a bound method. Leading underscores remain a
   separate axis, graded by `resolve_here` for visibility, so `.__secret_` is a
   private mutable binding.

## What this change does not do

The a05a sentence proposing the marker also proposed the rule "a mutating method
requires a mutable receiver." **That rule is not adopted here.** A mutating
method reached through an immutable handle remains a functional update against
an instance copy, which is the behavior #330 and #336 established in v0.10.2 and
which `$!.copy-on-write-boundary` and the copy contract are built around.

The #328 triage is explicit that this issue "changes its spelling" while #330,
#331, and #327 "establish behavior," and that the two must not be combined.
Adopting the receiver rule here would retire a documented feature under cover of
a syntax migration. It belongs to its own issue if it is still wanted; the
corpus example pinning the functional update (`pair.bump_ 5`) is the statement
of what would have to change.

## Cost paid

Breaking, with the corpus and documentation migrated in the same change:
`class-support.hc`, `white-paper.hc`, `GRAMMAR.md`, `LANGUAGE.md`, the
`lib/execute` and `lib/frames` tests, `lib/frames/CLAUDE.md`, the older papers
in `doc/onward2017`, `doc/shannon`, and `doc/wisdom`, and the VS Code grammar.
No compatibility alias is retained: old input follows the ordinary boundary
between an identifier and the `:` operator, so `.set: {…}` declares `set`,
applies if-else to the result, and does not silently produce a mutating method.

The VS Code grammar loses the ability to tell a mutating method from a mutable
name by spelling, because they are now the same spelling. It scopes a
declaration (`method_` followed by `{`) as a function and a call site as a
mutable name, which is what the language now says.

`web/static/hc-paper.html` is a pre-v0.8 Madoko rendering that still describes
the colon. It is already stale against the live white paper in other ways, and
no generator for it lives in this repository, so regenerating it is out of
scope.

## Verification

- `deno task test` green, including the doctest corpus and BitScheme.
- `cli/hc/class-support.hc` passes with every mutating method respelled, plus a
  new example pinning a mutable field and a mutating method sharing the marker
  on one aggregate.
- `lex.test.ts` pins the freed colon: a name completes at `:`, and the trailing
  underscore needs no chunk-boundary rule of its own.
- `deno publish --dry-run` green from `lib/`.
