# FrameDemi and universal fourth-hash observation

Implemented for the v0.38.0 target, following occurrence/figure decisions
011.18b–c and 011.18f. Every Frame has a fourth observation: a native Demi
value, nil, or a propagated error. Nil means zero Count or absent residual; it
does not invariably mean an empty receiver.

## Native API

```ts
import { Frame, FrameCount, FrameDemi } from "../lib/frames.ts";
const d = new FrameDemi(Frame.nil, new FrameCount(7n), new FrameCount(2n));
d.addCount(new FrameCount(3n)); // FrameDemi(<>,7,5)
d.multiplyCount(new FrameCount(3n)); // FrameDemi((),21,6)
const restored = FrameDemi.decode(JSON.parse(JSON.stringify(d.encode())));
```

Orientation must be exactly `Frame.all` (left receives next) or `Frame.nil`
(right receives next). Loads/scalars must be concrete `FrameCount` instances,
not signed integers, other numeric rungs or subclasses. Native invalid arguments
throw TypeError/RangeError. `FrameDemi.create(orientation, left, right)` is the
dynamic native factory returning `$!.demi-constructor` on invalid inputs; it
does not introduce an HC constructor spelling. Hosts can supply these Frames
through the existing namespace: `evaluate("$$.d + 3", { d })`.

Read-only `orientation`, `left`, `right` expose state. Loads are captured as
exact bigints; getters produce Count snapshots, so mutation of a
supplied/returned Count cannot change the state. Load spelling and load metadata
are not data fields. The inherited plumbing copy preserves the value. Outer
metadata remains the HC metadata plane: `dataEquals` ignores it; `equals`
includes it. Separately allocated equal values compare equal with `=`, `==`,
`===`, following immutable atom identity. Arithmetic produces fresh values
without outer metadata, as numeric arithmetic does. There is no full arity
coordinate or Truth class.

HC `FrameDemi + FrameCount` deposits into the active load and flips phase, even
for zero; `FrameDemi * FrameCount` scales both loads and preserves phase, even
for zero. Invalid right operands return `$!.demi-operand +` /
`$!.demi-operand *`. References are normalized for these branches. Numeric and
structural Star rules are retained: `Count * Demi` still repeats an opaque value
by the existing Star rule, rather than acquiring a reverse scalar action. For
example, `[[],[]].#### * 3` gives `FrameDemi(<>,3,3)`, while `3 * [[],[]].####`
gives three copies of `FrameDemi(<>,1,1)`. No Demi/Demi overload or nil/Demi
convenience overload is added.

`FrameDemi((),0,0)` is present. Standalone `()` is absence. Diagnostic display
`FrameDemi((),7,2)` is not HC source. `encode()` yields the frozen,
JSON-compatible data tuple `["nil","7","2"]` (or `"all"`); `decode()` validates
its canonical unsigned decimal magnitudes and reconstructs it exactly. Metadata
is separate. Executable reconstruction currently uses the native constructor or
decode API; there is no claim of an HC textual round trip.

## Demi quantities and constructor laws

A Demi exposes its exact stored loads through native observers: `d.##` is the
Count `L+R`, and `d.###` is the signed FrameInt `L−R`. Its explicit `d.#` is
zero, so `d.####` is nil. Observation reads the immutable bigint fields
directly. Arrays containing Demis use their load sums as child Sizes. A present
zero-load Demi has Size zero and remains distinct from nil. For any source F
with a present Demi, `F.####.## = F.##` and `F.####.### = F.###`.

For pure Figures X and Y, write D(F) for `F.####`. The scalar constructor laws
hold when the host X is nonempty (`X.# > 0`):

- Append: `D(Apply(X,Y)) = D(X) + Y.##`.
- Inlay (native Star): `D(X * Y) = D(X) * Y.##`.

The empty-host boundaries are constructed separately:
`D(Apply([],Y)) = [Y].#### = [[]].#### * Y.##`, and `D([] * Y) = Y.####`.
Existing nil arithmetic is unchanged: `() + Count` passes through nil, while
`() * Count` returns Star's domain error.

Count is a terminal quantity. A positive Count n agrees on all observers with an
n-terminal pure Figure. At zero, `0.##` is zero while `[].##` is one. Pure
nonempty Figures have positive total loads; mixed values may have a present
zero-load Demi, as `[0].####` does. Do not impose pure-Figure positivity on the
mixed domain.

## Fourth hash and dispatch

Let n=F.#. If it fails, propagate the failure; if n=0, return nil without asking
Size or residual. Otherwise read s=F.##, then r=F.###, propagating errors in
that order. A nil residual gives nil Demi. A present residual must be a signed
exact integer and Size a nonnegative exact Count. Require L=(s+r)/2 and
R=(s−r)/2 to be exact nonnegative integers; construct `FrameDemi(all,L,R)` for
even n, or `FrameDemi(nil,L,R)` for odd n. The implementation introduces no fold
or cache.

Diagnostics distinguish invalid Count (`$!.demi-count`), invalid present Size or
residual (`$!.demi-observations`) and inconsistent halves (`$!.demi-coherence`).
Existing failures retain their original value. An error value's observations do
not turn it into an opaque quantity or successful zero. Nonfinite FrameNumbers
fail Count as well as Size/residual/Demi.

The base Frame's missing Count rule falls back to Size for every kind, including
numbers, text, blobs, bytes, opaque atoms and runtime type descriptions.
Explicit Count rules take precedence: lists count immediate elements/words,
schemas retain their own rules, and nil/all/missing and void comments retain
Count zero. Demi also has an explicit carrier Count zero. Nil/all source
dispatch is intercepted, while receiverless observer names remain addresses.
FrameCount retains its explicit magnitude Count and parity residual; other sized
atoms retain the default nil residual.

Non-schema lists observe their stored ordered elements/words for Count, Size and
residual, without executing the host. Source syntax uses the existing pure Size
word view, not the scope-registering enumeration walk. Parent residual always
uses child Size, regardless of whether that child's own residual is nil or zero.
Schemas retain their separate Size and nil residual; annotations remain
metadata, whereas explicitly stored schema elements contribute their Size
normally.

## Verified Frame-family compatibility

`demi-compatibility.test.ts` exercises every public concrete Frame family;
`universal-demi.test.ts` checks derived projections, HC dispatch, absence/error
boundaries, references, mutation, bigint values and non-execution. Internal
hosts are source-audited for inherited rules and covered by import-first checks.

| Family                                                                   | #                               | ##                                                | ###                                       | ####                                                            |
| ------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| FrameCount(n)                                                            | n                               | n                                                 | FrameInt n mod 2                          | nil at zero; otherwise balanced native Demi                     |
| FrameDemi                                                                | 0                               | L+R                                               | FrameInt L−R                              | nil                                                             |
| FrameInt, Decimal, Rational, finite Number                               | Absolute truncated magnitude    | Absolute truncated magnitude                      | nil                                       | nil                                                             |
| String, Doc; Blob; Bytes                                                 | Code points; bits; bytes        | Code points; bits; bytes                          | nil                                       | nil                                                             |
| FrameAtom; Arg, Param, Name, Word, Alias, Literal, Symbol, Operator      | 1                               | One opaque occurrence                             | nil                                       | nil                                                             |
| URI, Resource; Time/DateTime/Duration, TypedNumber, Sequence             | 1                               | One opaque occurrence; no reads or unit inference | nil                                       | nil                                                             |
| ScopeAnchor, StringEnd, BytePayload; non-error Note                      | 1                               | One opaque occurrence                             | nil                                       | nil                                                             |
| nil, all, missing; void Comment                                          | 0                               | One description/occurrence                        | nil                                       | nil                                                             |
| Array, Group, generic List, Expr, Bind, Lazy, source arrays/groups       | Immediate stored elements/words | Sum of complete child Sizes, empty=1              | Alternating complete child Sizes, empty=0 | nil at zero Count; otherwise derived Demi or propagated failure |
| Enumeration Schema                                                       | Existing element Count          | Declared candidates, empty=1                      | nil                                       | nil                                                             |
| Compiled structural/bit/custom Schema                                    | Existing syntax Count           | One description                                   | nil                                       | nil                                                             |
| Handle, Scoped                                                           | Delegate                        | Delegate                                          | Delegate                                  | Delegate                                                        |
| Error value / diagnostic failure Note                                    | Original error                  | Original error                                    | Original error                            | Original error                                                  |
| Nonfinite Number                                                         | Nonquantifiable error           | Same error                                        | Same error                                | Same error                                                      |
| Containment/reference cycles                                             | Immediate Count or cycle error  | Existing cycle error                              | Propagated cycle error                    | Propagated cycle error                                          |
| Shared descendants; metadata/declared-parent cycles                      | Immediate Count                 | Sharing per occurrence; metadata excluded         | Same child Size rule                      | Coherent; no mutable cache                                      |
| Type; Base Frame; Import, BoundMethod; internal hosts derived from Frame | Size fallback                   | One opaque occurrence                             | nil                                       | nil                                                             |
| Internal ParsePipe (Array subtype)                                       | Inherited stored element Count  | Inherited Size                                    | Inherited residual                        | Inherited derivation                                            |

Abstract Numeric/Text/Time/LexHost bases inherit the listed concrete-family
rules. Internal hosts audited include LiveLookupContext, ScopedLexicalContext,
ImportProgress, QuoteSink, LexicalError, MetadataHead, Token, Lex, LexRun,
Terminal, EvalPipe, LexPipe, FrameOps, FrameCurry, HCTest and HCLog. Token and
other Frame-based internal hosts use the Size fallback. BoundMethod/Import are
opaque host Frames, not list bodies; Count fallback does not invoke their
methods.

## Examples and compatibility changes

| HC receiver                                                   | #### diagnostic display                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `[]`, `0`, `()`, `<>`, a string, a finite decimal, any schema | nil                                                                                |
| `1`, `2`, `3`, `7`                                            | `FrameDemi((),1,0)`, `FrameDemi(<>,1,1)`, `FrameDemi((),2,1)`, `FrameDemi((),4,3)` |
| `[0]`                                                         | Present `FrameDemi((),0,0)`                                                        |
| `[“hello”]`                                                   | `FrameDemi((),5,0)`                                                                |
| `[<2,3,5>,2]`                                                 | `FrameDemi(<>,3,2)`; schema Size participates, schema residual does not            |
| `{5 + 3}`                                                     | `FrameDemi((),8,1)` from three stored words with Sizes 5,1,3; no execution         |

Count residual changes nil to FrameInt parity, including present/truthy zero.
Figures Gap/Spin therefore accept Counts. They also now accept non-schema list
syntax/closures with valid residuals. Cycle/nonquantifiable residuals now
propagate errors instead of returning nil. Sized atom Count falls back to Size;
nil/all Count changes name passthrough/absorption to zero. Their native Sizes
are preserved. Stored errors now propagate instead of contributing opaque
Size 1.

The lexer, runtime dispatch and editor recognize `.####` together. A fifth hash
starts a comment; `..#` remains the parameter ladder followed by a comment.
`x.####c#` previously meant `.###` followed by a comment and now begins with a
fourth-hash observation followed by `c`. This is an intentional source break.
Use whitespace before a hash comment after `.###` to preserve the old meaning.
The executable Figures fixture and grammar/chunk-boundary tests cover the
change.
