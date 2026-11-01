# Demi and universal fourth-hash observation

Every Frame has a fourth observation, `.####`: a Demi, nil, or a propagated
error, following occurrence/figure decisions 011.18b–m. Nil means no Count, zero
Count or absent residual; it does not invariably mean an empty receiver. Since
v0.38.0 (011.20) a Demi is an instance of an HC class, `Demi` in
[`hc/demi.hc`](../hc/demi.hc), which is its definition and its executable
specification. The native `FrameDemi` carrier of v0.37.3 and its `+` and `*`
overloads are gone.

## The HC class

`Demi [phase, left, right]` takes three Counts and answers a fresh aggregate
whose fields are its state and whose methods are the class:

| Member    | Meaning                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `.phase`  | 2 when even (left next), 1 when odd (right next): the least positive Count of the parity (011.18g)                            |
| `.left`   | Left load, an exact Count                                                                                                     |
| `.right`  | Right load, an exact Count                                                                                                    |
| `.#`      | Declared Count: the phase                                                                                                     |
| `.##`     | Declared Size: L+R                                                                                                            |
| `.###`    | Declared residual: L−R                                                                                                        |
| `.apply_` | `d x`: deposit `x.##` into the active load and flip the phase, even for Size zero; a failed Size is the answer, not a deposit |
| `.scale_` | `d.scale_ k`: multiply both loads by a Count k, keeping the phase                                                             |
| `.toText` | Text `Demi(<>,12,3)`, the phase spelled as the orientation it stands for                                                      |

Anything else is refused with `$!.name-missing .invalid-demi` (or
`.invalid-scale`), the idiom Figures uses for an unsupported host. The phase is
a Count because a field cannot hold nil, and a Count keeps the odd phase
present: a Demi in phase 1 is a value, distinct from the nil `.####` answers
where there is no Demi.

Methods read their own state through `_^`, never a bare name, because a bare
name inside a method is looked up on the argument first (spec 7) and a Demi is
applied to arbitrary Frames. Inside a branch the receiver is `_^^`: carets count
lexically (spec a06).

**Application is functional by default.** `apply_` is a mutating method, so
through a name (an immutable handle) `d x` answers a new Demi and leaves d
unchanged, holding exactly the same three fields, with no history. Through a
mutable name, `d_ x` writes d in place, as for any HC class.

**Display, equality, identity and persistence.** A Demi prints as what it is, an
aggregate of fields and methods, and that printed form reads back as an equal
Demi: the HC source is its serialization, replacing the native `encode`/`decode`
tuple. Two Demis are `=` and `==` exactly when their fields are, since their
methods are the same source. `===` is aggregate identity, so separately built
equal Demis are not `===`, and `d.####` is a new instance equal to d. Text reads
`Demi(phase,left,right)`.

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
not declarable: it is always derived from the three, so a class that declares
them gets its fourth hash for free.

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

HC has two kinds of error value. A flagged error, such as
`$!.division-by-zero /`, propagates through every operator and through `?`. A
diagnostic note, such as `$!.name-missing`, carries no flag, and before 011.20
it could vanish. 011.20 fixed the two places the class depends on:

- **Arithmetic** (`+ - * / %% **`) answers an error operand of either kind,
  where it answered nil.
- **A mutating method** that answers one returns it, where it returned its
  receiver.

So a failed Size reaches the caller of `d x`, and a misread load shows in the
field instead of as a write that silently did nothing. `Frame.isError()` is the
predicate that recognizes both kinds.

This is not a uniform policy. A diagnostic note still differs from a flagged
error in three places (#467):

- It is **true under `?`**: `(1 + ([].nope)) ? {1} : {2}` is `1`.
- On the **right of ordering or `=`** it answers nil: `1 .> ([].nope)` is `()`.
  On the left it answers itself, with the rest of the expression absorbed.
- **Import and statement boundaries** stop on a flagged error but bind a note
  and go on.

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
written fails there. Lifting the empty host to the zero-load Demi in phase 2,
`Demi [2, 0, 0]`, restores it, `([] Y).#### = (Demi [2, 0, 0]) Y`, which is also
what a reduce starts from: `xs | (Demi [2, 0, 0])` equals `xs.####` for a
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
R=(s−r)/2 to be exact nonnegative integers; construct `Demi [2, L, R]` for even
n, or `Demi [1, L, R]` for odd n. The implementation introduces no fold or
cache.

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
residual). A Demi declares its positive parity Count (2 or 1). Nil/all source
dispatch is intercepted, while receiverless observer names remain addresses.
Missing residual falls back to Count parity, `.# mod 2`, on the base Frame
(011.18k, 011.18m): every atom, FrameCount included, and every non-atom host
(runtime types, imports, bound methods, internal hosts) takes it. `<>` has
residual 0, so it observes as `[]`. Lists and schemas keep their explicit
residual rules, and an aggregate that declares one, a Demi included, its own.
The internal lookup sentinel `Frame.missing` is never an HC value; observing it
natively answers `$!.name-missing`.

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
`####` column, `Demi((),1,0)` is the text of the Demi answered. Internal hosts
are source-audited for inherited rules and covered by import-first checks.

| Family                                                                   | #                                     | ##                                                | ###                                       | ####                                                            |
| ------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| FrameCount(n)                                                            | n                                     | n                                                 | FrameInt n mod 2 (atom rule)              | nil at zero; otherwise balanced Demi                            |
| Demi instance (declared observers)                                       | Declared phase: 2 even, 1 odd         | Declared L+R                                      | Declared FrameInt L−R                     | An equal Demi, derived universally                              |
| FrameInt, Decimal, Rational, finite Number                               | Absolute truncated magnitude          | Absolute truncated magnitude                      | FrameInt # mod 2                          | nil at zero; otherwise balanced Demi                            |
| String, Doc; Blob; Bytes                                                 | Code points; bits; bytes              | Code points; bits; bytes                          | FrameInt # mod 2                          | nil at zero; otherwise balanced Demi                            |
| FrameAtom; Arg, Param, Name, Word, Alias, Literal, Symbol, Operator      | 1                                     | One opaque occurrence                             | 1                                         | Demi((),1,0)                                                    |
| URI, Resource; Time/DateTime/Duration, TypedNumber, Sequence             | 1                                     | One opaque occurrence; no reads or unit inference | 1                                         | Demi((),1,0)                                                    |
| ScopeAnchor, StringEnd, BytePayload; non-error Note                      | 1                                     | One opaque occurrence                             | 1                                         | Demi((),1,0)                                                    |
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
| Type; Base Frame; Import, BoundMethod; internal hosts derived from Frame | Size fallback                         | One opaque occurrence                             | 1                                         | Demi((),1,0)                                                    |
| Internal ParsePipe (Array subtype)                                       | Inherited stored element Count        | Inherited Size                                    | Inherited residual                        | Inherited derivation                                            |

Abstract Numeric/Text/Time/LexHost bases inherit the listed concrete-family
rules. Internal hosts audited include LiveLookupContext, ScopedLexicalContext,
ImportProgress, QuoteSink, LexicalError, MetadataHead, Token, Lex, LexRun,
Terminal, EvalPipe, LexPipe, FrameOps, FrameCurry, HCTest and HCLog. Token and
other Frame-based internal hosts use the Size fallback. BoundMethod/Import are
opaque host Frames, not list bodies; Count fallback does not invoke their
methods.

## Examples and compatibility changes

| HC receiver                               | `“” x.####`                                                           |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `[]`, `0`, `()`, `<>`, `“”`, any schema   | nil                                                                   |
| `“hello”`, `(10 - 5)`, `(0 - 5)`, `(5.0)` | `Demi((),3,2)`, the same as `5.####`                                  |
| `1`, `2`, `3`, `7`                        | `Demi((),1,0)`, `Demi(<>,1,1)`, `Demi((),2,1)`, `Demi((),4,3)`        |
| `[0]`                                     | Present `Demi((),0,0)`                                                |
| `[“hello”]`                               | `Demi((),5,0)`                                                        |
| `[<2,3,5>,2]`                             | `Demi(<>,3,2)`; schema Size participates, schema residual does not    |
| `{5 + 3}`                                 | `Demi((),8,1)` from three stored words with Sizes 5,1,3; no execution |

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
