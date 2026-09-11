# Reads Are a Character Reduce

**Status:** Implemented in v0.15.0. The iteration half is decided and taught in
[`cli/hc/apply-tutorial.md`](../cli/hc/apply-tutorial.md), with the reasons and
the executable corpus in [`cli/hc/apply.hc`](../cli/hc/apply.hc). This document
owns only the resource half, and records which of its former questions those
decisions closed.\
**Issues:** [#368](https://github.com/TheSwanFactory/hclang/issues/368), with
[#338](https://github.com/TheSwanFactory/hclang/issues/338) on the critical
path, [#375](https://github.com/TheSwanFactory/hclang/issues/375) holding the
custom accumulator, and
[#301](https://github.com/TheSwanFactory/hclang/issues/301) as the caller that
stops being a subsystem.\
**Design rationale:** [`a07`](a07-hc-security-architecture.md) §4 and
[`a10`](a10-resource-primitive.md), whose provisional whole-content read this
replaces. Those documents describe an element type travelling with the resource;
they stand as written until this lands, and this document is where the
correction lives.\
**Supersedes:** the a11.1–a11.4 working notes, now removed. What stayed useful
from them is folded in below; the originals are in git history.

## The correction

The earlier design had the resource carry its element type — chars, lines, or HC
code — so the iteration operators could stay generic and no single reading had
to win. That is backwards.

**The primitive is the character. A resource pushes characters; a receiver
accepts them, chunks on whitespace or newlines, and parses or evaluates as HC
code.** No part of the reading is a property of the source.

## What the iteration decisions settled

Five of this document's former open questions are answered, and the answers are
not this document's to relitigate.

**Reads are a reduce, and the accumulator is the receiver.** This was the live
question: whether the accumulator travels in a parameter slot with the receiver
fixed, or each element is applied to the value accumulated so far. It is the
second. That is what makes an ordinary value work as the thing a read fills, and
it is why no read needs a name, a global, or new syntax.

**The two readings that matter are spellings, not receivers.** Reducing a read
into empty text answers the whole content, because text joins. Reducing it into
an empty array answers the characters, because an array collects. Both
mechanisms already existed; the design contributes nothing but the threading.
The temptation to invent a `content` receiver is gone with them.

**A map is not the place for either.** A map answers one value per element, so
an accumulator in that slot collects correctly and answers wrongly — the same
value once per element. Whether that refuses or is merely useless is left open
in `apply.hc`; either way it is not how a read is spelled.

**There is no closure form of reduce.** A receiver carries a rule across
elements only if it answers something that still holds the rule. Text answers
new text; an array answers itself; a closure answers its body and is spent after
one character. This kills the unification the a11.1 notes were most attracted to
— that a block already is a receiver, so chunkers could be blocks. They cannot,
and the reason is sharper than the one those notes gave: not only do blocks lack
an end-of-input step, they lose the rule after the first character.

**An empty source reduces to nil, whatever it started from.** For a resource
that means reading an empty location answers nil rather than empty text, which
is the one place the decision costs something here. It has to stay
distinguishable from a missing location, which answers a refusal: absent and
empty are different facts, and only one of them is a failure. Nothing in the
reduce conflates them, but a receiver that treats nil as "nothing to do" would.

**A custom accumulator is a class, not an operator feature.** Anything the
families do not already do — counting characters, for instance, since applying a
number multiplies — needs a receiver that answers itself while carrying state.
That is #375, and it is the honest home for the `count` gap this document used
to list as "not free."

## What a doubled read yields, and why

Doubling an iteration operator widens the stream from values to `[key, value]`
tuples, where the key is the symbol that addresses the member. For a resource
that means indexed characters, and nothing else.

A resource publishes its RFC 3986 components as readable properties, and a10 is
careful that reading one performs no access. They are still not part of the
stream, because they are **derived from the reference the value is rather than
declared into contents the value holds**. Collections iterate contents; streams
iterate content. That distinction is what keeps identity metadata out of a
content stream, and it is the reason a doubled read is positions and characters
rather than a hybrid of the two.

The tuple stream has no inverse. Applying a pair to a frame does not merge it,
so reducing tuples back does not rebuild the value they came from.
Reconstruction belongs to parsed syntax.

## The symbol rendering fix

This design now depends on a rendering change, so it is scoped here rather than
left implicit.

A tuple key is a symbol. Before this change a symbol in value position printed
without its dot, so a stream of tuples prints in a form that cannot be read back
— the printed key is a name lookup rather than a symbol. Canonical output being
re-readable as input is the same principle that decided properties-first
rendering, and it is load-bearing for a07 §5's claim that a program is a
manifest.

**The fix is rendering only**, and it turned out to be narrower than "every
standalone symbol". A bare symbol is a _pending lookup_, and `a` is exactly how
a lookup is written, so dotting every symbol would print a declaration where the
program held a lookup — and would render `{a + b}` as `{.a + .b}`. Only a symbol
already in value position is an address: what an evaluated `.name` answers, and
what a tuple key is. Those print the dot; the rest print as written.

The distinction is carried by a flag set at the two places a symbol becomes a
value, not inferred from the spelling. Inferring it from the spelling was tried
first and is wrong for a second reason: the front end's transport unit is also a
symbol, so `0` as a source character and `.0` as an address would have shared
one rendering, and the lexer builds its lexeme buffer from that rendering.

## The runtime already works this way

This is not a mechanism to design. It is the mechanism the front end runs on,
and typed resources would have built a second, tag-dispatched answer beside it.

| Capability                 | Where it already lives                                      |
| -------------------------- | ----------------------------------------------------------- |
| A source pushes characters | `FrameString.scanInto` folds each character into a receiver |
| A receiver decides bounds  | `lib/scan.ts` dispositions, including redispatch pushback   |
| A receiver retains state   | Frames retain any input-dependent lexical state             |
| Chunk into structure       | `LexPipe`, whose `lex` is a reduce over the source          |
| Accumulate terms           | `ParsePipe`                                                 |
| Parse and evaluate         | `EvalPipe`                                                  |
| Resume across chunks       | `HCEval` pending-lexeme state; `cli/runfile.ts` buffers     |

**Half the protocol is already universal.** `scan` and `finishInput` are defined
on `Frame` itself, defaulting to returning the frame unchanged, so every frame
is nominally a receiver already. Only the source half is stuck on one class. The
asymmetry is the whole defect: receiving is a language protocol and pushing is a
string method.

Two receivers nobody counted, both in production, are worth naming because they
show the protocol is populated rather than aspirational. A backtick-fenced
document is a receiver that treats its body as foreign text and looks for no
structure inside it. And `HCTest` chunks on markers, evaluates, compares,
counts, emits notes, and stays inert inside those fences — a chunk-and-evaluate
receiver composed with another one, running today.

## `asArray` was the shim, and the reduce is what should be native

`Frame.asArray` defaults to a one-element array holding the frame itself, and
its own documentation says it exists so frames can be passed to functions
expecting arrays. That is host convenience, not a language protocol.

Building iteration on it is _why_ an element type looked like something a source
had to declare: **an eager array must commit to a granularity before any
receiver is consulted.** A reduce never materializes a list, so granularity is
decided downstream, by composition, at no cost to the source. The element type
was the shim's shape showing through.

`reduce` was not on `Frame`. It was one method on `FrameString`, hard-wired to
the sigilizer. Lifting it to `Frame` with the receiver supplied was the
substance of the change; the sigilizer fold stayed on `FrameString` under the
name that says what it is, `scanInto`, because that one belongs to the front end
and the general fold belongs to the language.

Two uses of `asArray` had to be separated, because only one was the shim:

- **Enumerable protocol.** What the reduce replaces, now `Frame.elements`.
- **Structural access to an aggregate's own terms.** Parsing, expressions, lazy
  frames, and both schema matchers ask a frame for its own terms. That is
  legitimate and stays, so `asArray` kept the name and lost the other job.

`Frame.isFailedResult` consults `asArray`, which is why `FrameResource` had to
override it — otherwise a read happened once per mention, because every term of
every statement is checked. Moving the read to `elements` removed that cause,
and the override went with it rather than being patched a second time.

The split also settled which view the two planes belong to. `elements` excludes
a statement and a declaration echo, because neither answered a value of its own;
`asArray` keeps them, because a parser needs the terms it was built from. That
is what makes properties and elements two planes rather than one list.

## Deferred, and why each can wait

The two readings that matter are settled, so everything below is additive. Each
entry names what it is waiting on rather than only being postponed.

**Chunkers** — words, lines, a counted boundary, an arbitrary delimiter. These
are the receivers that still need spelling, and the blocker is not syntax. It is
**completion**: something has to flush a partial chunk when the characters run
out. The lexical protocol has `finishInput` and the pipe convention has
`finish`; application has no completion step at all. Since a reduce is
application and there is no closure form, a chunker cannot be written in HC
today. It is host code with retained lexical state, or it waits for the language
to grow an end-of-input step. Recording the rejected spelling too, so it is not
re-proposed: a read spelled as a property, `'./f.txt'.lines`, would make `.`
sometimes-effectful and break a10's inertness, and a reader could not tell which
by looking.

**Code receivers** — lex, parse, evaluate. These were the reason an element type
looked necessary, and they are why a reduce beats a tag: each is the next one's
front end. Parse-without-evaluate deserves its own line, because a07 §5 says the
external identities a program names are extractable by reading it and that the
analyzer is itself HC. Under the earlier design that was a fourth element type;
here it is the evaluate receiver minus its last stage.

**`<-` as a receiver.** A module load is a character reduce whose receiver is
the parse-and-evaluate chain. #301 keeps what is genuinely its own — memoization
by normalized reference, cycle detection, merge-versus-alias binding — and its
I/O half becomes the reduce. Whether `<-` generalizes to take any receiver or
stays the evaluate-shaped case with a general reduce beside it is open.

**Streaming from the store.** The store reads a whole location, so a reduce
splits an already-complete string: composition without streaming. An acceptable
first cut, recorded as one, because the receiver protocol is resumable and can
be fed incrementally later with no language change.

**A resource as a receiver.** A resource is a frame and application already
writes, so reducing one resource into another would be a copy with no new
primitive. Elegant or a trap, but it should not happen by accident.

## Questions this document still owns

**Does a string enumerate its characters?** It does not: a string is a single
element, so mapping one answers the whole string. A resource that pushes
characters while a string does not is an asymmetry that needs either a reason or
a fix, and the fix reaches every iteration expression in the corpus.

**Where does a refusal land mid-stream?** Answered for the receiver, still open
for the caller. a10 relies on a refusal being collectable, so an aggregate
collects one and every other receiver is poisoned by it: an operation on an
error is an error, and a collect is not such an operation. That is one rule,
drawn in one place, and it makes `Frame.error` behave the way an aggregate
already treated a missing-name note. What remains open is what a caller sees,
which is #338 — an aggregate whose element is an error reading as success — and
it is on the critical path. The existing answer to what a receiver does after it
_itself_ fails is `Malformed`, which absorbs every subsequent character by
returning itself; reuse that rather than inventing a second story.

**What scope does a parse-and-evaluate receiver evaluate in?** Reading HC code
and evaluating it means choosing what the loaded code can reach. a07 §3's
induction holds either way, but the answer decides whether a module sees its own
file scope, the caller's, or a scope handed to the receiver. This is the one
genuinely new security question, and it is open.

**Does a reduce answer, or emit?** The pipes take an `out` and emit through it;
the iteration operators answer a value. A receiver built from the pipe
convention and a receiver that is an ordinary accumulator are different shapes,
and the chunker work has to pick one.

**Is a stateful receiver's state an observable effect?** A receiver that
accumulates is mutating. Either it spells that with the trailing underscore, or
its state is internal the way a resource's store is internal — present but
unreachable, and therefore not an effect a program can observe. The second reads
better and needs an argument rather than an assumption. Aggregate literals dodge
the question, since a literal is fresh at every evaluation; a named or
host-supplied chunker does not.

## The security position does not move

Worth stating plainly, because "the receiver does the parsing" can be misread as
the receiver acquiring something.

A receiver is handed characters. It is not handed the store, the root binding,
or the resource frame. Authority still lives entirely in the three nested
ceilings a10 records, normalization still runs before any dispatch, and a
refusal is still a value that flows back through the reduce. The reduce changes
what a read _yields_, not what a read is _allowed to reach_.

## Scope

- [x] The character reduce native on `Frame`, with the receiver supplied rather
      than fixed. `Frame.reduce` threads a stream through a receiver, and
      `Frame.elements` is what a stream answers; `FrameString`'s sigilizer fold
      kept its own name, `scanInto`, because that one is the front end's.
- [x] A resource reads by reducing characters into its receiver.
- [x] The two settled readings work through the real operators: empty text for
      the whole content, an empty array for the characters.
- [x] A doubled read yields position-and-character tuples, with no URI component
      in the stream. `Frame.visibleKeys` is the seam, and a resource answers
      none, because a stream iterates content rather than contents.
- [x] `asArray` retired from the enumerable path, kept for structural access.
      `FrameResource` no longer overrides it, so its `isFailedResult` override
      went with the cause rather than being patched a second time.
- [x] `cli/hc/resources.hc` re-spelled.

Landed alongside, because the model above is unreachable or ill-formed without
them:

- **Operator roles** — `|` reduces and `&` maps, `||` is bound, and `&&` streams
  tuples. The readings above are spellings, so they need the operators the
  tutorial defines rather than the v0.14.0 ones.
- **Symbol rendering** — a symbol _in value position_ prints with its dot. Not
  every symbol: an unevaluated one is a pending lookup, and `a` is how a lookup
  is written, so dotting that would print a declaration instead.
- **A numeric key is refused** — `.0` already addresses the first element, so
  allowing it as a property would put two members under one key in a doubled
  stream. The literal answers that refusal, because a key colliding with the
  aggregate's own addressing leaves nothing well-formed to hand back. A refused
  _write_ is deliberately not promoted: a schema mismatch, a constant, or a
  visibility grade leaves a value a caller can still inspect with that one write
  undone, and collapsing it would lose both the object and the second refusal.
- **Properties-first rendering** — print order and iteration order are one
  order, and a declaration prints once, from the property plane it wrote. The
  echo still prints where the frame does not _hold_ the property: a declaration
  into an enclosing scope leaves its echo in the group and its property outside,
  so there the echo is the only record of it.
- **A refusal mid-stream** — an aggregate collects it; every other receiver is
  poisoned by it. a10 relies on the first, and the second is what an operation
  on an error already meant.

Still adjacent, and still separately scoped:

- **Aggregate error propagation in general** → an aggregate whose _element_ is
  an error still reads as success at a control boundary, which is the shallow
  rule `isFailedResult` documents. Only the ill-formed-key case above is
  promoted, and the general question wants the rule #338's notes asked for
  rather than a deeper scan.
- **Scheme dispatch** → #367. Unchanged by this document: the reduce consumes
  whatever the handler table produced.
- **Module semantics** → #301, minus the I/O half.
- **Custom accumulators** → #375, which also owns what a receiver answering nil
  mid-reduce does.
- **Chunkers and code receivers** → still deferred, for the reasons above:
  application has no completion step, so a chunker cannot be written in HC.

## Accepted cost

A reduce is less legible at a glance than an array literal. A read that answers
one whole-content element reads immediately; a character reduce does not, until
the chunker receivers exist to name the intent. The corpus pays that cost in
between, which is an argument for landing chunkers sooner rather than treating
them as indefinitely deferred.

The other cost is paid in the corpus rather than deferred: `|` and `&` swapped
roles, so every iteration expression written against 0.14.x means something else
now. That is a breaking change to source that will keep parsing, which is the
worst kind, and it is why this ships as a minor version with the reversal named
first in the release notes rather than folded into a list of additions.
