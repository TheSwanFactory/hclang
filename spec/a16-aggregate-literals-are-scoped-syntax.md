# Aggregate Literals Are Scoped Syntax

**Status:** Implemented in v0.27.0.\
**Issues:** Figure 004.08 and 004.09a in `occurrence/figure`
(`issues/004-proof-by-observation/`), which found the two symptoms; spec 7 §2,
whose lookup order this document brings the runtime into line with.\
**Supersedes:** the wart in [`a15`](a15-closure-inspection.md) that a lookup
inside an aggregate written in a body is free for `===`. That wart is gone, and
`a15` now points here.

## The one decision

A group `( … )` or an array `[ … ]` written in a body is **syntax scoped inside
that body**, not a value with a scope of its own that happens to be evaluated
there. Two things follow, one for execution and one for inspection, and they
were two bugs with one cause.

### Execution: an aggregate's own declarations are searched first

Spec 7 §2 orders lookup "1. the current child's own properties; 2. an explicit
argument's own properties; 3. the closure's live enclosing scope". An aggregate
literal under construction is the current child. Its own layer used to be
appended to lookup, so it was searched **last**, and a name the literal declared
read the enclosing binding whenever one existed:

```text
.gb 1; (.gb 2; gb)            → (.gb 2; 1)     before
.gb 1; (.gb 2; gb)            → (.gb 2; 2)     now
{.a 1; [.a 2; a]} ()          → [.a 2; 2]      now
{.e 1; (.f 2; [e, f])} ()     → (.f 2; [1, 2]) unchanged: a name the literal does not declare
```

**Ruling: an aggregate literal's own frame is the first lookup layer.** A
construction write target is placed first (`EvaluationScope.withWriteTarget`),
and a group's own copy likewise (`withOwnLayer`). A closure's local frame was
already first, which is why closure bodies never showed the defect.

**The one exception is a named import.** A module imported _during_ a
construction, `(.x 1, M <- './m.hc')`, is not that construction's child: its
statements are lexically its own file's, and the construction is an accident of
where the import was written. Its namespace sees the importing file before the
construction, as #391 designed and its property test pins. Nothing else keeps
the old order.

### Inspection: a walk keeps its bindings below a group

The closure walk (`a15`) gave each walked name the declaration it resolves to,
so `===` tells shadowed names apart. It recorded declarations only for nested
_closures_, so below a group or array the names were free. Now an aggregate
written in a body is recorded with the declarations before it, and its terms are
walked as it is passed, so what they hold is recorded too:

```text
.f {.k _; (k = 3) ? {1} : {2}}
  the walked k inside the group === its .k     → <>   (before: ())
  the walked k inside the group === a free k   → ()   (before: <>)
.f {.a 1; [a]}
  the walked a inside the array === its .a     → <>   (before: ())
```

Figure 004.09a showed execution had always resolved these names correctly; only
the walk was wrong. The walk now says what execution does.

## What remains

- **A parsed aggregate's walk omits its `;` statements.** `FrameList.elements`
  leaves statements out, because a statement answers nothing when an aggregate
  is a _value_. For a parsed aggregate that rule drops syntax: the group
  `(.a 2; a)` walks to `[a]`, so a declaration the group makes cannot be seen by
  walking it, though execution honours it. A closure's walk keeps `;` (`a15`
  §2); whether a parsed aggregate's should too is left to a later ruling.
- **Walk depth still doubles at groups.** A group walks to the expression it
  holds, which walks to its atoms. That is the parser's structure, unchanged.
