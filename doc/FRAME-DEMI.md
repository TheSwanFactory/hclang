# FrameDemi and the universal observer compatibility gate

Implementation status: **partial / blocked**, targeting v0.38.0 after v0.37.3.
The native carrier, scalar operations and Count parity are implemented.
Universal `.####` and its lexical/editor changes are deferred together. This is
not a narrowed public fourth-hash specification.

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
by the existing Star rule, rather than acquiring a reverse scalar action. No
Demi/Demi overload or nil/Demi convenience overload is added.

`FrameDemi((),0,0)` is present. Standalone `()` is absence. Diagnostic display
`FrameDemi((),7,2)` is not HC source. `encode()` yields the frozen,
JSON-compatible data tuple `["nil","7","2"]` (or `"all"`); `decode()` validates
its canonical unsigned decimal magnitudes and reconstructs it exactly. Metadata
is separate. Executable reconstruction currently uses the native constructor or
decode API; there is no claim of an HC textual round trip.

## Intended fourth hash

For every Frame F, read native `n = F.#`, `s = F.##`, `r = F.###`. At n=0 return
nil regardless of s. At n>0 return a present state with L=(s+r)/2, R=(s−r)/2 and
left-next iff n is even. Both halves must be exact nonnegative Counts. No new
fold, implicit evaluation, matcher invocation, resource read or mutable cache is
permitted. Count `###` now supplies FrameInt `n mod 2`, including FrameInt zero.
Counts 1,2,3,7 would therefore derive `(nil,1,0)`, `(all,1,1)`, `(nil,2,1)`,
`(nil,4,3)`; Count 0 and `[]` would return nil. `[0]` would produce a present
`(nil,0,0)`.

## Compatibility matrix

The following are **native `sizeFor` results after the Count repair**, not
claims that a fourth hash exists. `nil` means no integer result, never numerical
zero. `demi-compatibility.test.ts` checks concrete instances of every public
Frame family in `lib/frames`; `native-size.test.ts` covers additional reference
cycles, effect traps, sharing and schema branches. Abstract bases inherit the
listed rules. Internal host classes listed below were also inspected for
overrides.

| Family / concrete classes                                                                                                                                                                              | #                           | ##                                                 | ###                                        | Coherence and remedy                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | -------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| FrameCount(n)                                                                                                                                                                                          | n                           | n                                                  | FrameInt n mod 2                           | Coherent, approved parity repair implemented; explicit known-key dispatch                                  |
| FrameInt, FrameDecimal, FrameRational                                                                                                                                                                  | nil                         | Truncated absolute exact magnitude                 | nil                                        | Missing n,r; authority must choose occurrence count/residual semantics                                     |
| Finite FrameNumber                                                                                                                                                                                     | nil                         | Truncated absolute host magnitude                  | nil                                        | Same; no invented conversion to Count                                                                      |
| FrameNumber NaN/±∞                                                                                                                                                                                     | nil                         | nonquantifiable-size error                         | nil                                        | No finite s; total finite-state contract needs an explicit exceptional policy                              |
| FrameString, FrameDoc                                                                                                                                                                                  | nil                         | Unicode code points (including zero)               | nil                                        | Missing n,r; atomic versus character contributions is a semantic choice                                    |
| FrameBlob                                                                                                                                                                                              | nil                         | Bit width                                          | nil                                        | Missing n,r; choose atomic versus bit contributions                                                        |
| FrameBytes                                                                                                                                                                                             | nil                         | Payload bytes (including zero)                     | nil                                        | Missing n,r; choose atomic versus byte contributions                                                       |
| Evaluated FrameArray, FrameGroup                                                                                                                                                                       | Immediate element count     | Sum of complete child Sizes, empty=1               | Alternating immediate child Sizes, empty=0 | Coherent for finite quantifiable descendants; [5,3] gives 2,8,2; [0] gives 1,0,0                           |
| Generic FrameList                                                                                                                                                                                      | Immediate count             | Recursive sum, empty=1                             | nil                                        | Positive count with missing residual; ordered-data opt-in requires a deliberate domain expansion           |
| FrameExpr, FrameBind, FrameLazy                                                                                                                                                                        | Represented term/word count | Stored syntax Size, empty=1                        | nil                                        | Positive count with missing residual; choose a pure syntax residual or revise contract, never execute      |
| Source FrameArray / FrameGroup                                                                                                                                                                         | Stored-word count           | Stored syntax Size                                 | nil                                        | Deliberate source exclusion; same unresolved syntax policy                                                 |
| Enumeration FrameSchema                                                                                                                                                                                | Element count               | Declared candidates (duplicates included), empty=1 | nil                                        | Missing residual; do not traverse or match candidates to invent one                                        |
| Compiled structural/bit/custom FrameSchema                                                                                                                                                             | Source element count        | One description                                    | nil                                        | Choosing an alternating raw-child fold can conflict with s=1; authority must specify description semantics |
| FrameType                                                                                                                                                                                              | nil                         | One description                                    | nil                                        | Missing n,r; do not enumerate type extension                                                               |
| FrameHandle, FrameScoped                                                                                                                                                                               | Referent observation        | Referent observation                               | Referent observation                       | Transparent, inherits referent coherence/failure; wrappers require no evaluation                           |
| FrameTime: FrameDateTime, FrameDuration; FrameTypedNumber, FrameSequence                                                                                                                               | nil                         | One opaque occurrence                              | nil                                        | Missing n,r; keep quantities unit-free unless authority chooses otherwise                                  |
| Frame, FrameAtom; nil, all, missing; anonymous stored error                                                                                                                                            | nil                         | One opaque occurrence                              | nil                                        | Missing n,r; nil/all also have source dispatch exceptions below                                            |
| FrameArg, FrameParam, FrameName, FrameWord, FrameAlias, FrameLiteral, FrameSymbol, FrameOperator                                                                                                       | nil                         | One opaque occurrence                              | nil                                        | Missing n,r; no binding lookup or lazy echo rendering permitted                                            |
| FrameURI, FrameResource, FrameComment                                                                                                                                                                  | nil                         | One opaque occurrence                              | nil                                        | Missing n,r; resource must stay opaque, without reads                                                      |
| FrameNote, FrameImport, FrameScopeAnchor, FrameStringEnd, FrameBytePayload, BoundMethod                                                                                                                | nil                         | One opaque occurrence                              | nil                                        | Missing n,r; do not invoke method/import, consume payload or resolve scope                                 |
| FrameDemi (new immutable atom)                                                                                                                                                                         | nil                         | One opaque occurrence                              | nil                                        | Also needs an explicit self-observation policy under a universal observer                                  |
| Shared descendants and metadata/declared-parent cycles                                                                                                                                                 | Immediate count             | Sharing per occurrence; metadata excluded          | Same per-occurrence weighting              | Coherent when child quantities are finite; never treat sharing as a cycle                                  |
| Containment cycles (arrays, groups, syntax, closure bodies)                                                                                                                                            | Can be positive             | cyclic-aggregate error                             | nil                                        | **Release blocker**: no exact finite L+R can equal the established error result                            |
| Handle/scope reference cycles                                                                                                                                                                          | nil                         | cyclic-reference error                             | nil                                        | No finite referent observation; keep established non-executing guard pending authority decision            |
| Internal LiveLookupContext, ScopedLexicalContext, ImportProgress, QuoteSink, LexicalError, MetadataHead; Token, Lex/LexRun (LexHost), Terminal, EvalPipe, LexPipe, FrameOps, FrameCurry, HCTest, HCLog | Inherit nil                 | Inherit one opaque occurrence                      | Inherit nil                                | Source audit: no size override; host application/effects must not be invoked to repair n,r                 |
| ParsePipe (internal FrameArray subtype)                                                                                                                                                                | Inherited element count     | Inherited recursive Size                           | Inherited ordered residual when not source | Mutable parser state is not a new canonical Figure domain; inherits cycle/child failures                   |

Source-language dispatch has further compatibility facts: `<>.#` absorbs the
name and answers all; `().#` returns the name `.#` itself. Neither is a Count.
Both `.##` observations return 1 and both `.###` observations return nil. These
must be deliberately repaired with singleton interception if universality is to
include an integer immediate Count; changing `sizeFor` alone is insufficient.
Runtime errors short-circuit ordinary HC evaluation, while a stored error atom's
native Size is one. Observation must distinguish those boundaries too.

## Blocking decisions

1. Specify n,r for opaque/quantity atoms, nil/all, types and the new Demi
   carrier. Atomic n=1,r=s and flat-unit n=s,r=s mod 2 are different coherent
   contracts; existing observers do not select between them.
2. Specify syntax/closure and schema residuals consistently with their existing
   Sizes. Blanket residual opt-in is insufficient for compiled schemas and may
   change source observation semantics. Retain non-executing behavior.
3. Resolve cycles and nonfinite quantities. A one-element self-cycle has n=1,
   s=error,r=nil. Finite Counts satisfying L+R=s cannot exist. Either the
   universal contract admits an explicit error result for nonquantifiable Frames
   or its underlying Size/Count semantics must change. Returning absence would
   violate the accepted n=0 boundary, so it is not implemented as a fallback.

This partial implementation does not decide those policies. No fourth hash is
registered in `SIZE_OPERATORS`, lexer or editor grammar, and no unavailable host
is silently mapped to nil by a new observer.

## Migration and lexical compatibility

Count `###` changes nil to FrameInt parity, and **zero is a present/truthy HC
integer**. Guards that used `k.###` to reject all atoms now accept Counts.
Bundled Figures Gap/Spin consequently accept Counts and compute parity
magnitude/divided parity. Other numeric rungs remain excluded. Array/group
residuals still read child `##`, so Count parity does not change their recursive
weighting or Star. Unknown native Count keys now return nil instead of Count;
this does not register `.####`.

The lexer and editor currently recognize up to three hashes. A fourth hash opens
a comment after `.###`; fifth hashes participate in that comment. `..#` stays
the parameter ladder followed by a comment. A future atomic
observer/lexer/editor patch will make `.####` a name and move comment-start
behavior to the fifth hash. Existing `.###`-then-comment text such as `x.####c#`
will change tokenization. This intentional source compatibility break is
pending, not introduced here.
