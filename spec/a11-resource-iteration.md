# Reads Are a Character Fold

**Status:** Design, not implemented. Expected to fluctuate before it settles,
and patch-versioned by explicit exception while it does.\
**Issues:** [#368](https://github.com/TheSwanFactory/hclang/issues/368), with
[#338](https://github.com/TheSwanFactory/hclang/issues/338) on the critical path
and [#301](https://github.com/TheSwanFactory/hclang/issues/301) as the caller
that stops being a subsystem.\
**Design rationale:** [`a07`](a07-hc-security-architecture.md) §4 and
[`a10`](a10-resource-primitive.md), whose provisional whole-content read this
replaces. Those documents describe an element type travelling with the resource;
they stand as written until this lands, and this document is where the
correction lives.

## The correction

The earlier design had the resource carry its element type — chars, lines, or HC
code — so `|` and `&` could stay generic and no single reading had to win. That
is backwards.

**The primitive is the character. A resource pushes characters; a receiver
accepts them, chunks on whitespace or newlines, and parses or evaluates as HC
code.** No part of the reading is a property of the source.

## The runtime already works this way

This is not a mechanism to design. It is the mechanism the front end runs on,
and typed resources would have built a second, tag-dispatched answer beside it.

| Capability                 | Where it already lives                                    |
| -------------------------- | --------------------------------------------------------- |
| A source pushes characters | `FrameString.reduce` folds each character into a receiver |
| A receiver decides bounds  | `lib/scan.ts` dispositions, including redispatch pushback |
| A receiver retains state   | "Frames retain any input-dependent lexical state"         |
| Chunk into structure       | `LexPipe`, whose `lex` is a `reduce` over the source      |
| Accumulate terms           | `ParsePipe`                                               |
| Parse and evaluate         | `EvalPipe`                                                |
| Resume across chunks       | `HCEval` pending-lexeme state; `cli/runfile.ts` buffers   |

The receiver protocol is already resumable and already stateful, which is the
whole of what "the receiver chunks" requires.

**Half the protocol is already universal.** `scan` and `finishInput` are defined
on `Frame` itself, defaulting to returning the frame unchanged, so every frame
is nominally a receiver already. Only the source half is stuck on one class. The
asymmetry is the whole defect: receiving is a language protocol and pushing is a
string method.

## The receivers

Not a closed set — the point of putting the reading on the receiver is that the
set stays open. This records the ones the design implies, so the base set is
chosen deliberately rather than by whichever one got written first.

_What a receiver is, and how one gets named, is still being worked out in
[`a11.1`](a11.1-receivers.md); it merges back here when it settles._

**Chunkers.** Characters in, coarser elements out. Composable in front of
anything below.

| Receiver  | Boundary                     | Note                                                                         |
| --------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `chars`   | none; each character         | The degenerate case, and worth naming so the fold's default is spellable     |
| `words`   | whitespace runs              | Whitespace class is a decision, not an obvious constant                      |
| `lines`   | newlines                     | Line-ending convention is the same kind of decision                          |
| counted   | a fixed character count      | Precedent exists: `FrameBytes` has a counted receiver already                |
| delimited | an arbitrary given delimiter | Generalizes the three above; whether the base ships one or three is a choice |

**Aggregators.** Characters in, one value out. **These are not receivers to
design — they are literals, and `apply` is already the protocol.** Applying a
string concatenates and answers a new string; applying an array pushes and
answers itself. So an aggregator is spelled by writing the empty value to fill.

This is a `&` question only. `|` maps, so mapping a character source already
answers an array of characters — `[1, 2, 3] | {_}` answers `[1, 2, 3]` today —
and needs no aggregate at all.

| Spelling | Answers                | Mechanism                                    |
| -------- | ---------------------- | -------------------------------------------- |
| `& “”`   | the whole content      | `FrameString.apply` is `concatenateText`     |
| `& []`   | an array of characters | `FrameArray.apply` pushes and returns itself |
| `& {…}`  | the accumulated value  | What `&` threads today                       |

Both require the accumulator to be threaded as the receiver rather than as the
parameter; see the decision below. It costs no name, no global, and no syntax,
and it removes the temptation to invent a `content` receiver.

**The map spelling is a trap.** `[1, 2, 3] | []` answers
`[[1, 2, 3], [1, 2, 3], [1, 2, 3]]`: the array does accumulate, because `apply`
pushes and answers itself, but map wraps each answer, so the result is the same
array repeated. The accumulation is right and the value is wrong, which is worse
than failing. `| “”` does not accumulate at all — string application answers a
fresh string, so `[1, 2, 3] | “”` answers `[“1”, “2”, “3”]`. An aggregate
belongs to the fold, and putting one in a map should probably be refused rather
than silently half-working.

Not free: **count**. Applying a numeric multiplies, so no numeric literal counts
characters. If a read should answer what a write answers, that is a receiver
after all, or a property of the aggregate afterwards.

**Code receivers.** These are the reason the element type looked necessary, and
they are why a fold beats a tag: each is the next one's front end.

| Receiver | Yields              | Note                                                             |
| -------- | ------------------- | ---------------------------------------------------------------- |
| lex      | lexemes             | `Lex`, `LexRun`, `LexPipe` already                               |
| parse    | frames, unevaluated | Reading a program _as data_ — a07 §5's manifest claim needs this |
| eval     | evaluated results   | `ParsePipe` into `EvalPipe`; this is what `<-` becomes           |

Parse-without-eval deserves the emphasis. a07 §5 says the external identities a
program names are extractable by reading it, and the analyzer is itself HC. That
requires a receiver that builds frames and stops. Under the earlier design it
would have been a fourth element type; here it is the eval receiver minus its
last stage.

**Already built, listed so the protocol does not look empty:** `Lex`, `LexRun`,
`LexPipe`, `ParsePipe`, `EvalPipe`, the counted `FrameBytes` receiver, and
`Malformed`, which absorbs every subsequent character by returning itself — the
existing answer to what a receiver does after it fails.

**Open, and interesting.** A resource is a frame, and a frame is nominally a
receiver, so folding one resource into another would be a copy with no new
primitive — application already writes. Whether that is elegant or a trap is not
settled here, and it should not be settled by accident.

## `asArray` was the shim, and the fold is what should be native

`Frame.asArray` defaults to a one-element array holding the frame itself, and
its own documentation says it exists so frames can be passed to functions that
expect arrays. That is host convenience, not a language protocol.

Building `|` and `&` on it is _why_ an element type looked like something a
source had to declare: **an eager array must commit to a granularity before any
receiver is consulted.** A fold never materializes a list, so granularity is
decided downstream, by composition, at no cost to the source. The element type
was the shim's shape showing through.

`reduce` is not on `Frame` today. It is one method on `FrameString`, hard-wired
to the sigilizer. Lifting it to `Frame` with the receiver supplied is the
substance of the change.

Two uses of `asArray` must be separated, because only one is the shim:

- **Enumerable protocol.** What the fold replaces.
- **Structural access to an aggregate's own terms.** Parsing, expressions, lazy
  frames, and both schema matchers ask a frame for its own terms. That is
  legitimate and stays.

`Frame.isFailedResult` consults `asArray`, which is why `FrameResource` has to
override it — otherwise a read happens once per mention, because every term of
every statement is checked. A native fold removes that cause rather than
patching the symptom a second time.

## Composition replaces projection

`chars`, `lines`, and HC code survive as names. They move from types on the
source to receivers on the sink, and that move deletes the requirement the
earlier design carried: projection between element types, so that choosing one
was not lossy.

Receivers compose natively — a line chunker feeds a parser feeds an evaluator.
Types on a source have to be projected into one another. **Needing a projection
rule was the tell that the type was in the wrong place.**

## Read and write agree on units

A write already answers the count of characters written. With the character as
the element, both verbs are denominated the same way, and neither has a
granularity the other lacks.

## `<-` is a receiver

Not a loader subsystem, and not an element type either. A module load is a
character fold whose receiver is the parse-and-eval chain that already exists.
#301 keeps the parts that are genuinely its own — memoization by normalized
reference, cycle detection, merge-versus-alias binding — and its I/O half is the
fold.

The door [#348](https://github.com/TheSwanFactory/hclang/issues/348) flagged
stays shut for the same reason as before: bytes arrive through the handler table
([#367](https://github.com/TheSwanFactory/hclang/issues/367)) and never through
Deno's module loader, so HC module authority is never Deno import authority.

## The security position does not move

Worth stating plainly, because "the receiver does the parsing" can be misread as
the receiver acquiring something.

A receiver is handed characters. It is not handed the store, the root binding,
or the resource frame. Authority still lives entirely in the three nested
ceilings a10 records, normalization still runs before any dispatch, and a
refusal is still a value that flows back through the fold. The fold changes what
a read _yields_, not what a read is _allowed to reach_.

The one genuinely new question is the last decision below: a receiver that
evaluates HC code has to evaluate it in some scope, and per a07 §3 the authority
that code sees is the frames reachable there. That is a scope decision, and it
is open.

## Decisions to settle

**Do `|` and `&` become folds, or does `reduce` sit beside them?** `&` is a fold
in name, but today it folds an eager array with the accumulator in the parameter
slot, seeds from element zero, and answers nil on empty. A character fold wants
a receiver in that slot, not a block plus an accumulator. Either `&`
generalizes, or the two coexist with a stated division of labor.

**Does a string enumerate its own characters?** It does not today — a string
inherits the one-element default, so mapping over it yields the whole string. A
resource folding characters while a string does not is an asymmetry that needs
either a reason or a fix, and the fix reaches every `|` and `&` in the corpus.

**How does the fold thread its accumulator?** This is the live question, and it
replaces "what spells the whole-content read," which the aggregate literals
answer. Two threadings:

- **Accumulator as parameter, receiver fixed.** What `&` does today. Verified
  against 0.14.1, `[1, 2, 3] & []` answers `[2, 3]` and `[1, 2, 3] & “”` answers
  `“3”` — the aggregate in the parameter slot is ignored, and the seed element
  is dropped or overwritten.
- **Accumulator as receiver.** Each element is applied to the accumulated value,
  which answers the next one. `“”` then rebuilds the content and `[]` collects
  the characters, both by mechanisms that already exist.

The second is what makes an aggregate literal work as a receiver, so adopting
the literals means changing the threading. Whether `&` changes or the fold is
spelled separately is the same question one level down.

**Where does a refusal land in a fold?** a10 relies on the refusal being _the_
single element of a one-element array. In a fold it arrives at a receiver
mid-stream, or before any character does. #338 — an aggregate whose element is
an error reading as success — is on the critical path. Note that the existing
fold already has a refusal story, returning the note's parent on failure; reuse
it rather than inventing a second one.

**Does the store seam stay whole-value?** The store reads the whole location, so
the fold would split an already-complete string: composition without streaming.
That is an acceptable first cut and should be recorded as one, because the
receiver protocol is resumable and could be fed incrementally later with no
language change.

**Which receivers are in the trusted base, and which are written in HC?** Only
`&`'s accumulator threads state through an HC block today, while every real
chunker is host code with retained lexical state. Shipping `chars`, `words`, and
`lines` as base receivers is the same three names relocated; asking HC blocks to
hold partial chunks is a different and larger ask. The enumeration above is the
menu, not the answer — a base that ships one delimited chunker and a base that
ships three named ones are different bets on how often the general case is
wanted.

**What scope does a parse-and-eval receiver evaluate in?** Reading HC code and
evaluating it means choosing what the loaded code can reach. a07 §3's induction
holds either way, but the answer decides whether a module sees its own file
scope, the caller's, or a scope handed to the receiver.

## Scope

None of this is implemented.

- [ ] The character fold native on `Frame`, with the receiver supplied rather
      than fixed.
- [ ] A resource reads by folding characters into a receiver.
- [ ] A base receiver set chosen from the enumeration above, chunkers and
      aggregators both.
- [ ] The parse-and-eval chain reachable as a receiver, which is what makes `<-`
      a fold.
- [ ] `|` and `&` reconciled with the fold, per the first decision above.
- [ ] `asArray` retired from the enumerable path, kept for structural access.
- [ ] `cli/hc/resources.hc` re-spelled against whatever the whole-content read
      turns out to be.

Out, with tickets:

- **Aggregate error propagation** → #338, on the critical path rather than
  beside it.
- **Scheme dispatch** → #367. Unchanged by this document: the fold consumes
  whatever the handler table produced.
- **Module semantics** → #301, minus the I/O half.

## Accepted cost

A fold is less legible at a glance than an array literal. `'./out.txt' | {…}`
answering one whole-content element reads immediately; a character fold does
not, until the chunker receivers exist to name the intent. The corpus pays that
cost between the two, which is an argument for landing the base receivers in the
same change rather than after it.

The version exception is the other cost, accepted deliberately: this ships under
patch versions while the shape moves, rather than claiming stability it does not
have.
