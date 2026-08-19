# Live Parent Inheritance and Mutation Authority

**Status:** Implemented for closure and argument lookup in v0.8.8; broader
class-composition questions remain deferred\
**Issue:**
[#295 — Argument and context inheritance gaps](https://github.com/TheSwanFactory/hclang/issues/295)\
**Parent:** #197\
**Related:** class and effect support implemented in #305

## Summary

HC children inherit a **live parent relationship**, not a snapshot of their
parent's properties. A child may read values through that relationship without
copying them into its own context. This applies uniformly to objects, classes,
instances, and closures.

Live inheritance grants lookup, not mutation authority. A child declaration or
ordinary assignment is local by default. Changing a value owned by an ancestor
requires an explicit parent-targeting or mutating operation and remains subject
to constancy, visibility, schema, and effect rules.

In short:

> Children implicitly inherit live read access; they do not implicitly inherit
> write access.

This distinction supplies the missing common model for class inheritance and for
the argument/context behavior tracked by #295.

## Motivation

The white paper defines closure application as inserting the argument into an
inheritance hierarchy. It relies on three consequences:

```hc
; .mag {(x * x) + (y * y)};
; mag (.x 1; .y 2;)
# 5

; .print-parent {_^.var};
; .var “parent”;
; print-parent(.var “argument”)
# “parent”

; .x 3;
; .y 4;
; mag []
# 25
```

The first example reads properties from an explicit argument. The second skips
that argument and reads the enclosing scope. The third uses an empty object as
an argument and therefore falls through to its parent for `x` and `y`.

The current implementation passes the first two examples, but the third returns
`1773`: `mag` sees copied values `x = 42` and `y = 3` from the time at which it
was defined. That is snapshot capture. It is inconsistent with an inheritance
model in which the closure remains a child of its enclosing scope.

The discrepancy is not fundamentally about parsing `_` or `_^`. It is about the
identity and lifetime of parent contexts.

## Terms

- **Child:** a Frame whose `up` relationship names another Frame as its parent.
- **Parent:** the next Frame consulted after lookup misses locally.
- **Ancestor:** any Frame reachable by following one or more parent links.
- **Own property:** a binding stored directly on a Frame.
- **Inherited property:** a binding found by following the parent chain.
- **Argument:** the first lookup layer introduced when a closure is called.
- **Enclosing scope:** the live parent captured when a closure is defined.
- **Mutation:** a change to an existing Frame or to a binding owned outside the
  current child.

## Normative Model

### 1. Parent relationships are live

A child MUST retain the identity of its parent. It MUST NOT replace that
relationship with a property copy whose values can become stale.

If an ancestor's eligible property changes, a later inherited lookup MUST see
the new value. If the child owns a property of the same name, the child's value
continues to shadow the ancestor.

"Live" does not require an implementation to expose host-language object
references. It requires observable identity and lookup behavior equivalent to a
live link.

### 2. Lookup follows one ordered chain

Ordinary name lookup MUST proceed from the most specific layer to the least
specific layer:

1. the current child's own properties;
2. an explicit argument's own properties, when application introduced one;
3. the closure's live enclosing scope;
4. successive ancestors; and
5. globals, if globals are not already represented in that ancestry.

Each layer is consulted by identity. Implementations MUST NOT flatten these
layers into merged metadata when doing so changes shadowing, visibility,
ownership, or later observation.

An empty argument such as `[]` is still an explicit child layer. It contributes
no own `x` or `y`, so those names fall through to its live parent. Empty does
not mean "use a snapshot captured earlier."

### 3. `_` and `_^` select layers, not copies

Within a closure call:

- `_` denotes the current argument Frame;
- `_^` denotes the enclosing parent layer beyond that argument;
- additional supported levels continue walking the same live ancestry.

These forms MUST preserve Frame identity. Evaluating `_` or `_^` MUST NOT
materialize a merged property bag.

Ordinary unqualified names use the lookup order above. Thus `{x}` can find an
own `x` on the argument and otherwise continue into the enclosing scope.

### 4. Read inheritance does not grant write authority

Successful inherited lookup does not make the inherited binding local and does
not authorize the child to modify its owner.

An ordinary child declaration MUST create or replace a child-owned binding,
subject to the declaration rules. It MUST NOT silently rewrite an ancestor's
binding merely because lookup would find that name there.

An ordinary assignment MUST obey the language's binding and effect rules. If the
operation is not explicitly defined to target an ancestor, it MUST NOT acquire
that authority merely through inheritance.

Mutation of an ancestor requires syntax or a method contract that explicitly
targets that ancestor, such as a parent-targeting alias or a declared mutating
method. That operation MUST still enforce:

- constant bindings;
- public, protected, and private visibility;
- schemas and types;
- mutable versus immutable handles; and
- any applicable resource/effect authority.

### 5. Shadowing is local and reversible

When a child defines the same name as an ancestor, the child shadows the
ancestor without changing it. Removing or ceasing to use the child binding
reveals the ancestor's current value, not the value the ancestor had when the
child was created.

Sibling and peer Frames do not gain access to child-owned properties merely
because they share an ancestor.

### 6. Class inheritance uses the same mechanism

HC does not require a separate lookup model for classes. A class, instance, or
subclass is a Frame participating in the same live parent chain.

- A subclass sees later eligible changes to its base through inherited lookup.
- An instance sees eligible class properties and methods through its ancestry.
- An instance's own properties shadow class properties.
- Calling an inherited method preserves the receiver and the method's defined
  parent relationships; it does not flatten the class into the instance.
- A child cannot mutate class or base-class state without an explicitly
  mutating, authorized operation.

Multiple-base composition, where supported, MUST define a deterministic lookup
order while preserving ownership. Composition MUST NOT turn inherited bindings
into indistinguishable local copies.

## Closure Application

Calling a closure conceptually adds an argument layer beneath the closure's
enclosing scope:

```text
closure body
    -> argument
    -> live enclosing scope
    -> enclosing ancestors
```

This is a lookup model, not permission escalation. The closure body can read
through the chain. It can mutate only through operations already authorized to
target the relevant owner.

The model distinguishes three cases:

| Call form                               | `_`                                               | Unqualified lookup                         |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `f (.x 1;)`                             | the explicit argument                             | argument first, then enclosing scope       |
| `f []`                                  | the empty explicit argument                       | falls through to enclosing scope           |
| internal call with no supplied argument | nil or the language-defined absent-argument Frame | follows the same documented fallback rules |

The third row must not be conflated with `f []`. An explicit empty Frame has
identity and can participate in inheritance even though it owns no properties.

## Required Examples

> [!NOTE]
> The parent declaration is spelled `.^` as of
> [a05a correction 5](a05a-object-model-corrections.md); the retired `._^`
> spelling is refused with `$!.retired-syntax ._^ .^`. The enclosing-scope
> reference `_^` used elsewhere in this document is unchanged. The normative
> model below is unaffected: only the declaration's spelling moved.

### Live inherited read

```hc
; .parent_ [.x 1;];
; .child_ [.^ parent_];
; child_.x
# 1
; parent_.x: 2;
; child_.x
# 2
```

The exact mutation spelling may be adjusted to selected HC syntax; the required
behavior is that an authorized parent update is visible through the child.

### Local shadowing

```hc
; .parent_ [.x 1;];
; .child_ [.^ parent_; .x 2;];
; child_.x
# 2
; parent_.x
# 1
```

### No implicit parent mutation

A child-local declaration or non-parent-targeting assignment of `x` MUST leave
the parent's `x` unchanged. A regression test MUST verify both the child result
and the parent result after the operation.

### Closure fallback through an empty argument

```hc
; .mag {(x * x) + (y * y)};
; .x 3;
; .y 4;
; mag []
# 25
```

### Explicit argument shadows the enclosing scope

```hc
; .x 3;
; .read-x {x};
; read-x(.x 9;)
# 9
```

### Explicit parent access skips the argument

```hc
; .x 3;
; .read-parent-x {_^.x};
; read-parent-x(.x 9;)
# 3
```

## Implementation Constraints

This specification does not require a particular representation, but an
implementation must preserve these invariants:

1. Lookup owner and origin remain distinguishable so visibility and effects can
   be enforced.
2. Parent cycles are rejected or detected without unbounded lookup.
3. Closure calls do not permanently mutate reusable closure ancestry merely to
   install one argument.
4. Evaluating one call cannot leak its argument into a later call.
5. Nested closures retain the correct enclosing identities at every level.
6. Metadata used for annotations or serialization is not silently treated as a
   substitute for lexical ancestry.

The current `FrameLazy.meta_for()` merge is therefore suspect wherever it acts
as scope capture. Copying metadata can remain valid for value construction or
serialization, but it cannot define live lexical inheritance.

## Verification Requirements

Focused regressions MUST distinguish:

- lexical recognition of `_`, `__`, and `_^`;
- direct Frame-level traversal of arguments and parents;
- source-level explicit argument lookup;
- source-level parent lookup;
- empty explicit argument fallback;
- live observation after an ancestor changes;
- child shadowing without ancestor mutation;
- explicitly authorized ancestor mutation;
- nested closure ancestry;
- repeated calls with different arguments; and
- class, subclass, and instance lookup using the same rules.

Issue #295 is complete when its three white-paper assertions pass without
`$!.unimplemented`, focused tests prove the behaviors above that are within the
issue's scope, and implementation comments no longer describe copied metadata as
the closure's authoritative parent relationship.

## Deferred Questions

The following require later class/effect specifications but do not block #295:

- the selected source spelling for deleting a child shadow;
- the complete linearization rule for multiple-base composition;
- whether class definitions may be sealed against later extension;
- concurrency and transaction semantics for observing parent mutation; and
- serialization of live parent identity across process or package boundaries.

Those questions may refine mutation or composition. They do not change the
central rule: inherited lookup is live, while mutation authority is explicit.
