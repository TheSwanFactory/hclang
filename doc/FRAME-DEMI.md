# Demi and universal fourth-hash observation

Every Frame has a fourth observation, `.####`: a Demi, nil, or a propagated
error, following occurrence/figure decisions 011.18b–m. Nil means no Count, zero
Count or absent residual; it does not invariably mean an empty receiver. Since
v0.38.0 (011.20) a Demi is an instance of an HC class, `Demi` in
[`hc/demi.hc`](../hc/demi.hc), which is its definition and its executable
specification. The native `FrameDemi` carrier of v0.37.3 and its `+` and `*`
overloads are gone.

## The HC class

`Demi [count, left, right]` takes three Counts and answers a fresh aggregate
whose fields are its state and whose methods are the class:

| Member    | Meaning                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| `.count`  | The full application Count (007.25c)                                                                                 |
| `.phase`  | 2 when the Count is even (left next), 1 when odd (right next): the least positive Count of the parity (011.18g)      |
| `.left`   | Left load, an exact Count                                                                                            |
| `.right`  | Right load, an exact Count                                                                                           |
| `.#`      | Declared Count: the stored Count                                                                                     |
| `.##`     | Declared Size: L+R                                                                                                   |
| `.###`    | Declared residual: L−R                                                                                               |
| `.apply_` | `d x`: deposit `x.##` into the active load and add one to the Count, even for Size zero; a failed Size is the answer |
| `.scale_` | `d.scale_ k`: multiply both loads by a Count k, keeping the Count                                                    |
| `.####`   | Declared: the Demi of its own Count and loads, so a Count of zero is present                                         |
| `.toText` | Text `Demi(3,12,3)`: Count, left, right                                                                              |

Anything else is refused with the named error `$!!.invalid-demi` (or
`$!!.invalid-scale`), as Figures refuses an unsupported host. The phase is a
Count because a field cannot hold nil, and a Count keeps the odd phase present:
a Demi in phase 1 is a value, distinct from the nil `.####` answers where there
is no Demi. The rational readings `size-ratio` and `residual-ratio` are below.

Methods read their own state through `_^`, never a bare name, because a bare
name inside a method is looked up on the argument first (spec 7) and a Demi is
applied to arbitrary Frames. Inside a branch the receiver is `_^^`: carets count
lexically (spec a06).

**Application is functional by default.** `apply_` is a mutating method, so
through a name (an immutable handle) `d x` answers a new Demi and leaves d
unchanged, holding exactly the same Count and loads. Through a mutable name,
`d_ x` writes d in place, as for any HC class.

**Display, equality, identity and persistence.** A Demi prints as what it is, an
aggregate of fields and methods, and that printed form reads back as an equal
Demi: the HC source is its serialization, replacing the native `encode`/`decode`
tuple. Two Demis are `=` and `==` exactly when their Count and loads are (their
phase is derived from the Count), since their methods are the same source. `===`
is aggregate identity, so separately built equal Demis are not `===`, and
`d.####` is a new instance equal to d. Text reads `Demi(count,left,right)`.

**No operator is overloaded.** `d + k` is ordinary addition, which answers nil
for a non-number. `d * k` is ordinary Star, which refuses an aggregate with
properties (`$!.star-metadata *`); `k * d` repeats d by the existing Count Star
rule. Scaling is the method `scale_`, because a class cannot declare an
operator. Ordinary `+` and Star are unchanged for every other Frame.

## Declared observations

An aggregate observes its elements, so a class that keeps its state in fields
observes as its empty element list, 0, 1, 0. Any aggregate may instead declare a
method named `#`, `##` or `###`, on itself or a declared parent, and answers
that method's result for the operator, found the way `apply` and `toText` are
(#375, #398) and never in the surrounding scope. The declared Size is also what
the aggregate contributes inside another, so `[d, d].##` is 2(L+R). `.####` is
not declared by default: it is derived from the three, so a class that declares
them gets its fourth hash for free. `.####` itself is never declarable: a method
under that name is an ordinary property the fourth hash never runs. The three
cannot tell a Demi of Count zero from an empty host, so the fourth hash
recognizes an instance of the shipped Demi class intrinsically (007.25e; see
"The empty-host boundary" below).

A declared answer must be a Count for `#` and `##` and an exact integer for
`###`; anything else is `$!.declared-observation .key`. An error the method
answers is answered as it is, so it reaches `.####` and a Demi applied to the
value. Nothing declares one by default, so every other aggregate observes as
before.

Unlike every built-in rule, a declared observation runs code the class wrote;
the class opts into that, as it does for `toText`. What that means, tested in
`lib/execute/demi-prologue.test.ts`:

- **Every observation runs the method.** Nothing is cached and there is no
  at-most-once guarantee across observations; one `.####` reads each of `#`,
  `##` and `###` exactly once.
- **It cannot write its receiver.** The method runs immutably, so `@v` inside it
  answers `$!.method-not-mutating @v` and the field is unchanged.
- **It may act on anything else it reaches,** such as a mutable handle in scope.
  Observation is pure only for a class that keeps it pure; the Demi class does.
- **Recursion terminates.** Observing a receiver and key already being observed,
  directly, across keys (`# {_^.##}` with `## {_^.#}`) or across objects (`a`
  observing `b` observing `a`), is `$!.cyclic-observation .key`. A method that
  builds a fresh receiver each step escapes that check, so nesting deeper than
  32 declared observations is `$!.observation-depth .key` rather than a stack
  overflow.

## Error propagation, as it stands

Before 011.20 a diagnostic note, such as `$!.name-missing`, could vanish. 011.20
made arithmetic (`+ - * / %% **`) answer an error operand, where it answered
nil, and made a mutating method that answers one return it, where it returned
its receiver.

Since v0.39.0 (#467) a diagnostic failure (`$!` errors and a failed test, `$-`)
carries the error flag from construction, so it is an error like
`$!.division-by-zero /` everywhere:

- Arithmetic, ordering and all three equalities answer it from either side.
- `?` and `:` answer it without running a branch.
- A closure stops at the statement that fails, and an import fails as a whole.

So a failed Size reaches the caller of `d x`, and a misread load ends the method
before any later write. The constructor refuses with the named error literals
`$!!.invalid-demi` and `$!!.invalid-scale`, which no binding can shadow.

## How `.####` reaches the class

The derivation stays native (`lib/frames/fourth-hash.ts`), because it is the
universal observation contract: read `#`, `##` and `###` in order with their
absence and error rules, check that the loads are whole, and only then
construct. Construction goes through `installDemiConstructor`, which the
evaluator fills (`lib/execute/demi-prologue.ts`): the first time a Demi is
needed it evaluates `hc/demi.hc` from the compiled-in bundle, the way an import
evaluates a testdoc, with example lines dropped and the first failure failing
the whole. It runs in a namespace of its own, with no host bindings and no root,
so `.####` works in a bare `evaluate`, nothing a program declares can reach the
class, and the file can import nothing (its own import example is an example
line for that reason). The outcome is kept, failure included, so the file is
evaluated once per process. A Demi requested while the file is still loading is
`$!.demi-prologue-reentrant`; without an evaluator, as in the frames package
alone, `.####` is `$!.demi-unavailable`.

## Demi quantities and constructor laws

A present Demi observes as its declared `#`, `##` and `###`, so the unchanged
universal observer rebuilds an equal Demi: `d.####` equals d, and repeated
fourth observation is idempotent. Arrays containing Demis use their load sums as
child Sizes. A present zero-load Demi has Size zero and remains distinct from
nil. For any source F with a present Demi, `F.####.## = F.##` and
`F.####.### = F.###`.

Observing commutes with applying. For a nonempty host X (`X.# > 0`):

- Append: `(X Y).#### = X.#### Y`, and both equal `[...X, Y].####`.
- Inlay (native Star): `(X * Y).#### = X.####.scale_ (Y.##)`.

The empty host is the boundary, by convention rather than theorem: `[].####` is
nil (011.15g), and applying nil answers its argument, so the append law as
written fails there. Lifting the empty host to the Demi of Count zero,
`Demi [0, 0, 0]`, restores it, `([] Y).#### = (Demi [0, 0, 0]) Y`, which is also
what a reduce starts from: `xs | (Demi [0, 0, 0])` equals `xs.####` for a
nonempty xs. For Star, `([] * Y).#### = Y.####`. Retiring `+` gives up the
state-only append evaluation of 011.16 §9.5: a step is computed by applying the
Demi to the Frame, which reads its Size.

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
R=(s−r)/2 to be exact nonnegative integers; construct `Demi [n, L, R]`, which
derives its phase 2 or 1 from the parity of n. The implementation introduces no
fold or cache.

Diagnostics distinguish invalid Count (`$!.demi-count`), invalid present Size or
residual (`$!.demi-observations`) and inconsistent halves (`$!.demi-coherence`).
Existing failures retain their original value. An error value's observations do
not turn it into an opaque quantity or successful zero. Nonfinite FrameNumbers
fail Count as well as Size/residual/Demi.

The base Frame's missing Count rule falls back to Size for every kind, including
numbers, text, blobs, bytes, opaque atoms and runtime type descriptions.
Explicit Count rules take precedence: lists count immediate elements/words,
schemas retain their own rules, all and void comments retain Count zero, and nil
has no Count (`().#` is nil, so `().####` is nil without reading Size or
residual). A Demi declares its stored Count. Nil/all source dispatch is
intercepted, while receiverless observer names remain addresses. Missing
residual falls back to Count parity, `.# mod 2`, on the base Frame (011.18k,
011.18m): every atom, FrameCount included, and every non-atom host (runtime
types, imports, bound methods, internal hosts) takes it. `<>` has residual 0, so
it observes as `[]`. Lists and schemas keep their explicit residual rules, and
an aggregate that declares one, a Demi included, its own. The internal lookup
sentinel `Frame.missing` is never an HC value; observing it natively answers
`$!.name-missing`.

Non-schema lists observe their stored ordered elements/words for Count, Size and
residual, without executing the host. Source syntax uses the existing pure Size
word view, not the scope-registering enumeration walk. Parent residual always
uses child Size, regardless of whether that child's own residual is nil or zero.
Schemas retain their separate Size and nil residual; annotations remain
metadata, whereas explicitly stored schema elements contribute their Size
normally.

## Verified Frame-family compatibility

`demi-compatibility.test.ts` exercises every public concrete Frame family;
`universal-demi.test.ts` checks derived projections, absence/error boundaries,
references, mutation, bigint values and non-execution, and
`demi-prologue.test.ts` the class, its loading and declared observations. In the
`####` column, `Demi(1,1,0)` is the text of the Demi answered. Internal hosts
are source-audited for inherited rules and covered by import-first checks.

| Family                                                                   | #                                     | ##                                                | ###                                       | ####                                                            |
| ------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| FrameCount(n)                                                            | n                                     | n                                                 | FrameInt n mod 2 (atom rule)              | nil at zero; otherwise balanced Demi                            |
| Demi instance (declared observers)                                       | Declared Count `C`                    | Declared L+R                                      | Declared FrameInt L−R                     | An equal Demi, declared (so `C = 0` is present)                 |
| FrameInt, Decimal, Rational, finite Number                               | Absolute truncated magnitude          | Absolute truncated magnitude                      | FrameInt # mod 2                          | nil at zero; otherwise balanced Demi                            |
| String, Doc; Blob; Bytes                                                 | Code points; bits; bytes              | Code points; bits; bytes                          | FrameInt # mod 2                          | nil at zero; otherwise balanced Demi                            |
| FrameAtom; Arg, Param, Name, Word, Alias, Literal, Symbol, Operator      | 1                                     | One opaque occurrence                             | 1                                         | Demi(1,1,0)                                                     |
| URI, Resource; Time/DateTime/Duration, TypedNumber, Sequence             | 1                                     | One opaque occurrence; no reads or unit inference | 1                                         | Demi(1,1,0)                                                     |
| ScopeAnchor, StringEnd, BytePayload; non-error Note                      | 1                                     | One opaque occurrence                             | 1                                         | Demi(1,1,0)                                                     |
| all; void Comment                                                        | 0                                     | One description/occurrence                        | 0                                         | nil                                                             |
| nil                                                                      | nil (no Count)                        | 1                                                 | nil                                       | nil                                                             |
| missing (internal lookup sentinel)                                       | `$!.name-missing` (never an HC value) | Same error                                        | Same error                                | Same error                                                      |
| Array, Group, generic List, Expr, Bind, Lazy, source arrays/groups       | Immediate stored elements/words       | Sum of complete child Sizes, empty=1              | Alternating complete child Sizes, empty=0 | nil at zero Count; otherwise derived Demi or propagated failure |
| Enumeration Schema                                                       | Existing element Count                | Declared candidates, empty=1                      | nil                                       | nil                                                             |
| Compiled structural/bit/custom Schema                                    | Existing syntax Count                 | One description                                   | nil                                       | nil                                                             |
| Handle, Scoped                                                           | Delegate                              | Delegate                                          | Delegate                                  | Delegate                                                        |
| Error value / diagnostic failure Note                                    | Original error                        | Original error                                    | Original error                            | Original error                                                  |
| Nonfinite Number                                                         | Nonquantifiable error                 | Same error                                        | Same error                                | Same error                                                      |
| Containment/reference cycles                                             | Immediate Count or cycle error        | Existing cycle error                              | Propagated cycle error                    | Propagated cycle error                                          |
| Shared descendants; metadata/declared-parent cycles                      | Immediate Count                       | Sharing per occurrence; metadata excluded         | Same child Size rule                      | Coherent; no mutable cache                                      |
| Type; Base Frame; Import, BoundMethod; internal hosts derived from Frame | Size fallback                         | One opaque occurrence                             | 1                                         | Demi(1,1,0)                                                     |
| Internal ParsePipe (Array subtype)                                       | Inherited stored element Count        | Inherited Size                                    | Inherited residual                        | Inherited derivation                                            |

Abstract Numeric/Text/Time/LexHost bases inherit the listed concrete-family
rules. Internal hosts audited include LiveLookupContext, ScopedLexicalContext,
ImportProgress, QuoteSink, LexicalError, MetadataHead, Token, Lex, LexRun,
Terminal, EvalPipe, LexPipe, FrameOps, FrameCurry, HCTest and HCLog. Token and
other Frame-based internal hosts use the Size fallback. BoundMethod/Import are
opaque host Frames, not list bodies; Count fallback does not invoke their
methods.

## Examples and compatibility changes

| HC receiver                               | `“” x.####`                                                          |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `[]`, `0`, `()`, `<>`, `“”`, any schema   | nil                                                                  |
| `“hello”`, `(10 - 5)`, `(0 - 5)`, `(5.0)` | `Demi(5,3,2)`, the same as `5.####`                                  |
| `1`, `2`, `3`, `7`                        | `Demi(1,1,0)`, `Demi(2,1,1)`, `Demi(3,2,1)`, `Demi(7,4,3)`           |
| `[0]`                                     | Present `Demi(1,0,0)`                                                |
| `[“hello”]`                               | `Demi(1,5,0)`                                                        |
| `[<2,3,5>,2]`                             | `Demi(2,3,2)`; schema Size participates, schema residual does not    |
| `{5 + 3}`                                 | `Demi(3,8,1)` from three stored words with Sizes 5,1,3; no execution |

Atom residual changes nil to FrameInt Count parity, including present/truthy
zero, for every atom (011.18k); Count no longer has a rule of its own. Figures
Gap/Spin therefore accept Counts, other numbers, text, opaque atoms and runtime
types (011.18m); only schemas have no residual. `().#` changes from zero to nil.
They also now accept non-schema list syntax/closures with valid residuals.
Cycle/nonquantifiable residuals now propagate errors instead of returning nil.
Sized atom Count falls back to Size; nil/all Count changes name
passthrough/absorption to zero. Their native Sizes are preserved. Stored errors
now propagate instead of contributing opaque Size 1.

The lexer, runtime dispatch and editor recognize `.####` together. A fifth hash
starts a comment; `..#` remains the parameter ladder followed by a comment.
`x.####c#` previously meant `.###` followed by a comment and now begins with a
fourth-hash observation followed by `c`. This is an intentional source break.
Use whitespace before a hash comment after `.###` to preserve the old meaning.
The executable Figures fixture and grammar/chunk-boundary tests cover the
change.

## Constructed-state VACT witness

[`hc/constructed-state.hc`](../hc/constructed-state.hc) implements Explore
022.05a's corrected constructive-state handoff as an executable testdoc. Run
`deno task hc hc/constructed-state.hc -t` from the repository root. It records
native construction, the exact observer contract, compression collisions,
append/Inlay evolution, the empty-host boundary, channel relabeling, and the
scope of future Demi equivalence. Its uniform recipe covers finite nested arrays
with ordinary nonterminal metadata ignored, unadorned empty terminals, and no
declared observers; mixed-value examples are labeled separately.

The testdoc also specifies a finite stick/bin apparatus and a five-criterion
verdict. Software execution supplies the executable witness; the material
apparatus is proposed as physically realizable and has not been executed.
Neither full origin invariance nor sufficiency for arbitrary HC observations is
claimed. This witness is included in `deno task test:doc` and the CLI tests.

## RotorRouter

[`hc/rotor-router.hc`](../hc/rotor-router.hc) (011.21) is the constructive
counterpart of the Demi: an ordinary HC class, `RotorRouter [left, right]`, that
keeps the Frames it routes rather than their Sizes. Its state is the two ordered
channels and nothing else (007.25e): its Count is `C = left.# + right.#`, and
its phase is the parity of C, 2 when even (left next) and 1 when odd (right
next), exactly as a Demi's is. The constructor admits exactly the left-first
alternating histories, `left.# = right.#` or `left.# = right.# + 1`, and refuses
every other pair with `$!!.invalid-router`; there is no phase argument, offset
or compatibility form. Applying a router appends the argument, the same Frame,
as one member of the channel the parity of C selects, without evaluating,
measuring or applying it, and so keeps the invariant. Through a name it is a
functional update, through a mutable name it writes in place, and a channel
argument is copied to its elements, so routers never share a writable channel.

A router declares its Count, Size and residual as the Demi class does: its Count
(the children it holds, `left.# + right.#`, not its phase), L+R and L−R, where
each load is the summed child Sizes of a channel and an empty channel is 0
rather than `[].##`. So `router.####` derives the router's Demi through the
ordinary fourth hash, with no projection method. Observation is where children
are measured, so a failed or cyclic Size shows there and not on routing, and
observing runs no route and writes nothing. Routing an array's children in turn,
`X | r0`, gives the interleaved state `RotorRouter [evens, odds]` whose fourth
hash is `X.####`. For every router whose fourth hash exists (C ≥ 1, children
sized), `(r y).####` is `r.#### y`, because the router's phase and its Demi's
are the parity of the same C. The initial router `RotorRouter [[], []]` has
routed nothing, so like the empty host it has no Demi and none is faked;
`(r0 y).####` is `(Demi [0, 0, 0]) y`.

## Full-Count Demi (007.25c)

`Demi [C, L, R]` keeps the full application Count beside the loads. v0.43.0
migrates the class directly, a breaking change: the earlier phase-only
`Demi [phase, L, R]`, its phase-valued `.#`, its fieldwise equality and its
parity-only `.####` are replaced. The separate `CountedDemi` class that an
earlier revision of this change added is removed; there is no alias or
compatibility twin.

| Old                                      | New                                                            |
| ---------------------------------------- | -------------------------------------------------------------- |
| `Demi [p, L, R]`, `p` is 1 or 2          | `Demi [C, L, R]`, `C` any Count; the phase is derived from `C` |
| `d.#` is the phase                       | `d.#` and `d.count` are `C`; `d.phase` is the phase            |
| `d x` flips the phase                    | `d x` adds one to `C`, which flips the phase                   |
| `+ - * scale_` keep the phase            | They keep `C`, so the phase                                    |
| `x.####` keeps only the parity of `x.#`  | `x.####` keeps `x.#`                                           |
| `Demi [2, L, R]` equals `Demi [4, L, R]` | Different Counts are different Demis                           |
| text `Demi(<>,L,R)` or `Demi((),L,R)`    | text `Demi(C,L,R)`                                             |
| `[]` lifts to `Demi [2, 0, 0]`           | `[]` lifts to `Demi [0, 0, 0]`                                 |
| `CountedDemi [C, L, R]` (unreleased)     | `Demi [C, L, R]`                                               |

| Member                                  | Answer                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `d.count`, `d.#`                        | The stored Count `C`                                                       |
| `d.phase`                               | 2 when `C` is even (0 included), 1 when odd; derived, written with `C`     |
| `d.##`, `d.###`                         | Size `L+R` and signed residual `L-R`                                       |
| `d.####`                                | Intrinsic: a fresh equal Demi, for every `C` including 0                   |
| `d x`                                   | Deposit `x.##` into the phase's load, `C` + 1, even for Size zero          |
| `d + x`, `d - x`, `d * x`, `d.scale_ k` | Fixed-channel or Size-mediated load change, `C` unchanged                  |
| `d.size-ratio ()`                       | `S/C`, exact: FrameInt when whole, FrameRational otherwise; nil at `C = 0` |
| `d.residual-ratio ()`                   | `Δ/C`, signed, same typing; nil at `C = 0`                                 |

A ratio takes no divisor: it is applied to nil because HC runs a method only
when applied, and any other operand is `$!!.unary-observation`. At `C = 0` both
are nil even when `S > 0`: there is no `0/0`, infinity or invented zero.

**Fourth hash and equality.** `x.####` for a host builds `Demi [x.#, L, R]`, so
`(X Y).#### = X.#### Y` and `(X * Y).#### = X.####.scale_ (Y.##)` hold with the
Count included. Two Demis are `=` exactly when `C`, `L` and `R` are, so
`Demi [2, 5, 1]` and `Demi [4, 5, 1]` share phase, Size and residual and are
different. `.####` of a host with Count zero is still nil.

**The empty-host boundary.** The three observers read 0, 0, 0 for both `[]` and
`Demi [0, 0, 0]`, so a derivation from them cannot tell the two apart. The
fourth hash therefore recognizes an instance of the shipped `Demi` class
intrinsically (`lib/frames/fourth-hash.ts`, 007.25e), not through any declarable
override. A source is a Demi exactly when its own stored `count`, `left` and
`right` are Counts and it is `==` (typed equality, fields and methods included)
to the Demi the class constructor builds from those Counts; the answer is that
fresh reconstruction. No observer, method or closure of the source runs, so a
foreign aggregate with forged `#`, `##`, `###`, a `.####` method, a phase that
disagrees with its Count, a decimal or text Count, or an extra field is not a
Demi and takes the ordinary derived path, nil at Count zero. `[].####` and
`0.####` stay nil: a host with no children has no Demi. `Demi [0, 0, 0]` is a
present value and its fourth hash is an equal instance.

The earlier revision of this change let any aggregate declare `.####` and
accepted an answer whose `#`, `##`, `###` spelled the same as the host's. That
is removed: `.####` is not declarable. The limitation is deliberate: a user
class whose state is Demi-like but is not the shipped class gets only the
derived fourth hash, so at Count zero it has none.

**RotorRouter (breaking, 007.25e).** `RotorRouter [phase, left, right]` is
replaced by `RotorRouter [left, right]`, with no alias. A router declares its
Count as `left.# + right.#`, the children it holds, and derives its phase from
that Count's parity, so `router.####` is `Demi(C, L, R)` in the router's own
phase. Channel pairs that are not a left-first alternating history, such as
`RotorRouter [[A, B], []]` or `RotorRouter [[], [A]]`, are refused with
`$!!.invalid-router`, so no router can disagree with its Demi about which
channel receives the next Frame. Migrate `RotorRouter [2, L, R]` to
`RotorRouter [L, R]` when the pair is admissible; a former state whose phase
disagreed with its channels, such as `RotorRouter [2, [A], []]`, has no new
form. The initial router has Count zero and no Demi, as the empty host has none.

**Provenance.** The Count is a number the state stores or an application adds
to, in HC. It is not a Frame-native history theorem. `S/C` and `Δ/C` are
arithmetic readings of it, not a construction of rational geometry.

## Literal division and channel arity (007.27)

`x ./ n` (also `x / n`, the same operator) divides by n literally: it deals into
n channels in turn, round-robin from channel 0. Parity is the case n = 2.
[`hc/division.hc`](../hc/division.hc) is the executable specification. The
divisor is always the channel Count: a positive Count, refused as
`$!.division-by-zero /` at zero and `$!.division-domain /` for anything else
(negative, fractional, decimal, text, an aggregate, a Demi), never read as a
Size; more than 1,000,000 channels is `$!.repetition-size 1000000`. A pair of
numbers keeps exact numeric division, `7 ./ 2` is `7/2`.

| Receiver       | `x ./ n` deals                        | Answer                                                      |
| -------------- | ------------------------------------- | ----------------------------------------------------------- |
| Array or group | its immediate elements, whole         | `RotorRouter` of n channels; element i in channel i mod n   |
| RotorRouter    | the Frames it routed, in routed order | `RotorRouter` of n channels; Count kept, next route C mod n |
| Demi           | S Size units                          | Demi of n loads; Count and Size kept, next deposit C mod n  |

**Lists** (dealing native, in `/`). Elements are the same Frames, never copied,
evaluated, measured or flattened, so identity, nesting and duplicates are kept
and each lands in exactly one channel. Properties are not elements and are not
dealt; a group's channels are arrays. The answer is the `RotorRouter` of the n
channels (built by `lib/execute/router-prologue.ts`, as `.####` builds a Demi;
without an evaluator it is `$!.router-unavailable /`), not a bare list of lists.
007.27c is why: a plain list whose children are lists cannot be told from a
division by its shape, and dividing it must deal those children whole, while
dividing a division must read its channels breadth-first and re-deal the same
Frames. The router carries that distinction, so `(X ./ n) ./ m = X ./ m` and
`(X ./ n) ./ n = X ./ n`. Its `.##` is the summed child Size; the `.##` of
`.channels` taken as a plain list is not, when a channel is empty, because
`[].##` is 1 while an empty channel's load is 0.

**Demi.** `Demi [C, loads]` takes a Count and a nonempty list of Counts. Two
loads are the binary `Demi [C, L, R]`, the same instance; any other arity is a
channel Demi. Every Demi now stores `count` and `loads`; the binary one also
keeps `phase`, `left` and `right`, written together with `loads`. A channel Demi
of arity k deposits into channel `C mod k`; its Size is the sum of its loads and
its residual their alternating sum `e0 − e1 + e2 − …` (the list residual,
`L − R` for two); its fourth hash is intrinsic, a fresh equal Demi of its own
arity, Count zero included; `*`, `scale_` and the ratios work as for the binary
Demi. `-` deposits `x.##` on load 0, the first even load, raising the residual,
and `+` on load 1, the first odd load, lowering it: for two loads that is the
binary left and right. With one load there is no odd load, and `+` is
`$!!.invalid-arity`. Text is `Demi(C,[e0, e1, …])`.

`D ./ n` keeps C and S and canonicalizes the loads to S units dealt into n
channels: with q = ⌊S/n⌋ and r = S mod n, the first r hold q + 1 and the rest q.
So for S = 7, `./ 2` is [4, 3], `./ 3` is [3, 2, 2] and `./ 4` is [2, 2, 2, 1].
It is idempotent, `(D ./ n) ./ m = D ./ m`, equal (C, S) give equal results, and
it is many-to-one: `Demi(3,[5,2])` and `Demi(3,[4,3])` both give
`Demi(3,[3,2,2])`. It answers no number, so it is neither scalar division nor
the ratios.

**RotorRouter.** `RotorRouter [ch0, …, chk−1]` takes k ≥ 1 arrays; two are the
binary router. Every router stores `channels`; the binary one also keeps
`phase`, `left` and `right`. A channel router admits exactly the channels a
round-robin history from channel 0 leaves, whose Counts are the dealing of C
into k, and routes to channel `C mod k`. `r ./ n` reconstructs the routed order
from the channels and routes it into a fresh n-channel router, so it is the
router of the history divided as a list. Its observers are a channel Demi's, and
its fourth hash is its channel Demi, `Demi [C, [load0, …]]`, one load per
channel: `lib/frames/fourth-hash.ts` recognizes an instance of the shipped class
with other than two channels intrinsically (rebuilt through its constructor and
compared with `==`, as a Demi is), since the binary Demi derived from the
observers follows parity, not C mod k. The binary router keeps its derived
`Demi(C, L, R)`. So `(r y).#### = r.#### y` holds for every arity with C ≥ 1; at
C = 0 there is no Demi.

**Whole Frames and Size units do not commute.** Children of Sizes 5 and 2, dealt
whole into two channels, load them 5 and 2; the Demi of the same list normalizes
to 4 and 3. Both conserve Size. They agree when every child has Size one.

**Dotted operators.** `.+ .- .* ./ .%% .**` now dispatch as the bare operator on
every receiver. Before, the dotted name missed a named aggregate and was found
in the scope the name was read in, so `xs ./ 3` or `xs .* 2` with `xs` a name
answered for that scope.

**Migration.** `Demi [C, L, R]`, `RotorRouter [left, right]` and everything they
did are unchanged except their printed form, which now includes `.loads
[L, R]`
and `.channels [left, right]`, and a `./` method. `RotorRouter [[]]` and
`RotorRouter [[], [], []]`, refused before, are routers of one and three
channels. `[1, 2] / 2` was nil and is now `RotorRouter [[1], [2]]`; `Demi / n`
was nil and is now a redistribution.

**Not established.** This shows cyclic position as Count modulo arity on
existing HC frames. It does not prove a cyclic Fact closure, the Stick reversal
bridge or Gaussian arithmetic.
