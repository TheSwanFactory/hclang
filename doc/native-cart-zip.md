# Native Cart and Zip (FOIST 15)

**Status:** HCLang implementation proposed in PR; see the executable
[`hc/native-cart-zip.hc`](../hc/native-cart-zip.hc) and the existing
[`hc/cart-zip.hc`](../hc/cart-zip.hc) derived-pattern testdoc.

The two native infix operators work on **immediate positional elements**:

- `A &|& B` (**Cart**) returns a flat left-major Cartesian product,
  wrapping each pairing as `[a,b]`. Either empty operand gives `[]`;
  duplicated values are not deduplicated.
- `A |&| B` (**Zip**) pairs corresponding positions, stopping at the
  shorter input. Either empty operand gives `[]`.

Nested children are paired as whole values, never descended into.
Named properties on either operand are not part of the pairing domain.
A separate named-property correspondence operation is outside this scope.

```hc
; [1, 2] &|& [10, 20, 30]
# [[1, 10], [1, 20], [1, 30], [2, 10], [2, 20], [2, 30]]
; [1, 2] |&| [10, 20, 30]
# [[1, 10], [2, 20]]
```

These operators use existing HC operator lexing and global operator dispatch;
they do not change the meaning of `&`, `&|`, `&&`, or `|`. HCLang evaluates
operator expressions left-to-right rather than assigning these new operators
arithmetic precedence. Parenthesize chains when grouping matters.

Cart here pairs **immediate elements**. It is not FOIST 13's Foliation,
which takes a Cartesian product of **terminal leaf paths** and reconstructs
a tree.

The older pattern `A && {[_.1, B (_.0)]}` still has the ordinary `&&`
property-plane and missing-address behavior; it is **not** silently changed
into the new truncating, positional `|&|`.

Test with `deno task test:doc` and `deno task test`.
