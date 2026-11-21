# Cart and Zip (FOIST 19a) (FOIST 15)

**Status:** Implemented in HCLang; see the executable
[`hc/native-cart-zip.hc`](../hc/native-cart-zip.hc) and the existing
[`hc/cart-zip.hc`](../hc/cart-zip.hc) derived-pattern testdoc.

The two native infix operators work on **immediate positional elements**:

- `A * B` (**Cart**) returns a flat left-major Cartesian product, wrapping each
  pairing as `[a,b]`. Duplicated values are not deduplicated.
- `A |&| B` (**Zip**) pairs corresponding positions, stopping at the shorter
  input. An operand with no positional elements gives `[]`.

Nested children are paired as whole values, never descended into. Named
properties on either operand are not part of the pairing domain. A separate
named-property correspondence operation is outside this scope.

An operand with **no positional elements** (such as `[]` or a Frame containing
only named properties) produces `[]`. In contrast, a non-aggregate operand
counts as **one positional element**, just as with `&`. In particular,
`() |&| [1]` yields `[[(), 1]]`, and `1 * [2, 3]` yields `[[1, 2], [1, 3]]`.
This is deliberate reuse of HC's existing `elements()` convention, not a special
Cart/Zip rule.

A closure's `elements()` are its **code atoms**, not the result of executing the
closure. Consequently, `[1] * {_ + 1}` pairs `1` with the three code atoms `_`,
`+`, and `1`. This is consistent with ordinary HC iteration over closures; pass
an evaluated result instead when values, rather than code atoms, should be
paired.

```hc
; [1, 2] * [10, 20, 30]
# [[1, 10], [1, 20], [1, 30], [2, 10], [2, 20], [2, 30]]
; [1, 2] |&| [10, 20, 30]
# [[1, 10], [2, 20]]
```

These operators use existing HC operator lexing and global operator dispatch;
they do not change the meaning of `&`, `&|`, `&&`, or `|`. HCLang evaluates
operator expressions left-to-right rather than assigning these new operators
arithmetic precedence. Parenthesize chains when grouping matters:
`A |&| B |&| C` pairs `[aᵢ,bᵢ]` with `cᵢ`, producing `[[aᵢ,bᵢ],cᵢ]`, not flat
triples.

Cart here pairs **immediate elements**. It is not FOIST 13's Foliation, which
takes a Cartesian product of **terminal leaf paths** and reconstructs a tree.

The older pattern `A && {[_.1, B (_.0)]}` still has the ordinary `&&`
property-plane and missing-address behavior; it is **not** silently changed into
the new truncating, positional `|&|`.

Test with `deno task test:doc` and `deno task test`.
