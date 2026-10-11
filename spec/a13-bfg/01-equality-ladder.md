# BFG: The Equality Ladder

**Status:** Implemented in v0.17.0\
**Issue:** [#382](https://github.com/TheSwanFactory/hclang/issues/382), item 1.
Resolves
[#358 — equality semantics](https://github.com/TheSwanFactory/hclang/issues/358)\
**Scope:** The meaning of all three equality operators, for every frame family\
**Verified against:** `41b032a` (v0.16.0)

## The defect

The three operators project **planes** instead of measuring **strictness**
(`lib/frames/frame.ts:290-314`):

| Operator | Today it compares                            | Consequence                                                    |
| -------- | -------------------------------------------- | -------------------------------------------------------------- |
| `=`      | `toString()`: data and metadata, by spelling | Value-based only where a family overrides it (numerics, #355)  |
| `==`     | `dataString()`: data only, by spelling       | `0123 == 123` is nil; `[113, .p 887] == [113, .p 661]` is true |
| `===`    | metadata only, ignoring data                 | `3 === 4` is true. Any two frames without metadata are "equal" |

None of them can say whether two references reach **the same frame**. 005.30c
found that this is the missing observer for Bounded Figure Generativity:

```hc
.A []; .B [A]; .B2 [A];
[B = B2, B == B2, B === B2]      # [<>, <>, <>]
```

`B` is a construction and `B2` is another construction that looks the same.
RCT's _sameness_ is reuse of a constructed Figure, and HC already implements
reuse: mapping over `E = [A, B]` reaches the runtime `A` (see
[02](02-closure-write-target.md)). It just cannot be asked about.

## The ladder

Each longer operator is **strictly stronger** than the shorter one. That is the
convention #358 relies on, and the one every language spelling `===` follows.

| Operator | Question                   | Holds when                                           |
| -------- | -------------------------- | ---------------------------------------------------- |
| `=`      | **Same value?**            | Both denote the same value, however written          |
| `==`     | **Same value, same type?** | `=` holds, and both have the same type at every node |
| `===`    | **Same frame?**            | Both reach the same runtime frame                    |

So `a === b` implies `a == b`, and `a == b` implies `a = b`, for every `a` and
`b`.

### `=`: value

- **Numerics** compare exact value across rungs. This is unchanged from #355:
  `3 = 3.0`, `0123 = 123`, and `6/2 = 3` all hold.
- **Typed numbers** compare magnitude and unit: `9.80.m = 9.8.m` holds;
  `9.8.m = 9.8.kg` and `9.8.m = 9.8` do not. A unit is part of the value.
- **Text** compares family and body. `“a” = "a"` holds, because ASCII quotes are
  an input spelling of the same value. A document and a string with the same
  characters do not, because they denote different things (CLAUDE.md, _Delimiter
  Families_).
- **Aggregates** compare their complete view: visible properties in declaration
  order, then elements by index. This is the same view `&&` iterates, and it is
  compared recursively with `=`. So `[3, .p 1] = [3.0, .p 1]` holds. Private
  fields, the declared parent and runtime IDs are not part of the value.
- **Handles** are transparent and compare as their targets.
- **Closures** compare by source, as today.

### `==`: value and type

`=` holds, and at every node both sides are the same family and, for numerics,
the same rung:

- `3 == 3.0` is nil (an integer and a decimal), but `0123 == 123` holds (both
  integers, same value).
- `9.80.m == 9.8.m` holds; `9.8.m == 9.8.kg` does not.
- `[3] == [3.0]` is nil, because the type differs at a child.

This is the "same value and same type" predicate that #358 found unreachable.

### `===`: identity

- **Aggregates** own identity. Unwrap both operands through any handles, then
  compare by reference. `B === B` holds, `B === B2` does not, and `(E .0) === A`
  holds.
- **Atoms** have no identity a program can observe. The copy contract already
  says sharing them is unobservable (`lib/frames/CLAUDE.md`, _Copy Contract_).
  For atoms, `===` is `==`. So `3 === 3` holds and `3 === 3.0` does not, which
  keeps the ladder monotone.
- **Closures** share bodies by the same contract, so `===` is `==` for them too.
- **An instance copy is never `===` its source**, at any depth. Copy-on-write
  becomes observable without exposing IDs.
- The answer is `<>` or nil only. No ID is ever readable, because IDs depend on
  evaluation order.

## What goes away

- **Metadata-only comparison** (today's `===`) has no operator. It is a
  projection, not an equality, and nothing in the corpus depends on it except
  the assertions that pin #358's defect. `Frame.metadataEquals` can stay as an
  internal method if the implementation wants it.
- **Spelling comparison** (today's `==`) has no operator. When spelling matters,
  compare the printed forms as text.

## Implementation

- `Frame` gets the three methods `equals`, `typeEquals` and `identical`, and
  `lib/ops/math.ts` binds `=`, `==` and `===` to them. The current `dataEquals`
  and `metadataEquals` stop being operator targets.
- The default `equals` recurses over the complete view instead of comparing
  `toString()`. Atom families override it, as `FrameNumeric`,
  `FrameTypedNumber`, `FrameSequence` and `FrameTime` already do.
- `typeEquals` is `equals` plus a family and rung check at every node.
- `identical` unwraps handles and compares references for aggregates, and
  delegates to `typeEquals` for everything else.
- `isEqualTo` keeps meaning `=`. Its 15 internal callers keep their behaviour
  except where they relied on spelling. Each one must be checked.

## Corpus changes

Every flip below is intended, and each doctest's prose changes with it:

| File                    | Line | Expression                   | Today | Proposed |
| ----------------------- | ---- | ---------------------------- | ----- | -------- |
| `cli/hc/numerics.hc`    | 76   | `0123 == 123`                | `()`  | `<>`     |
| `cli/hc/numerics.hc`    | 78   | `3 === 3.0`                  | `<>`  | `()`     |
| `cli/hc/units.hc`       | 39   | `9.80.m == 9.8.m`            | `()`  | `<>`     |
| `cli/hc/units.hc`       | 49   | `9.8.m === 9.8.kg`           | `<>`  | `()`     |
| `cli/hc/white-paper.hc` | 692  | `a == b` (properties differ) | `<>`  | `()`     |
| `cli/hc/white-paper.hc` | 696  | `a === c` (different frames) | `<>`  | `()`     |

The units doctest prose "The metadata plane is unchanged, and still answers
every frame without metadata alike (#358)" is removed, along with the numerics
heading "data and metadata equality remain unchanged".

## Tests

- **Ladder monotonicity.** A property-style test over a fixed corpus of values
  from every family: `===` implies `==`, and `==` implies `=`.
- **Per family.** The `=` and `==` rows above, each as a unit test.
- **Identity.** Reuse through a child, through a handle chain and through a
  binding holds. Two constructions do not. An instance copy does not. Atoms fall
  back to `==`.
- **Doctest.** The 005.30c probe, `[B = B2, B == B2, B === B2]`, becomes
  `[<>, <>, ()]`.
- **#358 acceptance.** `3 === 4` is nil.

## Interactions

- **[02](02-closure-write-target.md).** Identity becomes observable just as 02
  stops plain names leaking writes. Ship them in the same release, so the first
  program that can see identity cannot also damage it by accident.
- **#374 (`()` as a set).** A set needs an element rule. With the ladder, the
  choice is a choice of rung: a set of values (`=`) or a set of constructions
  (`===`).
- **#360.** Errors already short-circuit before any comparison runs. The ladder
  does not change that.
