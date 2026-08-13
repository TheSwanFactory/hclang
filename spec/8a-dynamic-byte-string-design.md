# Dynamic Byte String Design

**Status:** Implemented in v0.9.1\
**Specification:** [8-dynamic-byte-strings.md](8-dynamic-byte-strings.md)\
**Issue:**
[#311 — Implement the BitScheme framebuffer parsing and symbolic-output example](https://github.com/TheSwanFactory/hclang/issues/311)

## Summary

Dynamic byte strings extend the existing byte-string recognizer rather than
introducing a second value type. A symbolic length is accumulated by the byte
syntax owner, resolved against the current evaluator result scope at the
separating backslash, validated, and converted to the existing fixed-count
payload state.

The generic lexical adapter supplies live scope through the scan boundary. The
Sigilizer remains stateless, the parser remains unaware of byte syntax, and the
completed value remains an ordinary numeric-length byte frame.

## Design Constraints

1. Syntax-specific recognition belongs to the owning Frame.
2. Sigilizer routes generic scan dispositions and retains no input state.
3. The parser aggregates completed Frames without interpreting their syntax.
4. Evaluator instances and scopes remain isolated.
5. Literal and symbolic forms share one payload-recognition path.
6. Recognition must remain invariant across arbitrary input chunks.
7. No global or copied binding context may be introduced.

## Existing Processing Path

Source characters pass through the following stages:

```text
source character
  -> symbol
  -> stateless scan routing
  -> syntax-owned lexical state
  -> completed token
  -> parser
  -> evaluator result scope
```

Literal byte strings already use two syntax-owned states:

1. a length state that recognizes decimal digits and the separating backslash;
   and
2. a fixed-count payload state that emits a byte value after the required
   characters arrive.

The second state already provides the correct payload boundary, chunk handling,
short-payload failure, and canonical value construction. Dynamic lengths reuse
it.

## Recognition Design

### Length classification

The byte-length state classifies its source spelling by the first character:

- a digit selects the existing decimal path;
- an alphabetic character selects the ordinary-identifier path; and
- any other initial character is invalid.

After the first character, the state accepts only characters valid for the
selected form. Literal digits and identifiers cannot be mixed.

### Separator handling

When the separating backslash arrives:

1. A decimal spelling is converted to its literal count.
2. An identifier spelling is resolved from the supplied live scope.
3. The result is checked for numeric kind, finiteness, safety, integrality, and
   non-negativity.
4. Zero emits an empty byte value immediately.
5. A positive count selects the existing fixed-count payload state.
6. A missing or invalid value produces a lexical error before payload
   recognition begins.

### Payload handling

The fixed-count payload state is shared by literal and symbolic lengths. It
collects exactly the resolved count, emits one ordinary byte frame, and returns
the next source character to normal recognition.

Because the byte frame is created from the resolved count and payload, its
rendered form is numeric regardless of whether the source length was literal or
symbolic.

## Live Scope Design

### Context source

Previously evaluated declarations are stored on the terminal result frame used
by the evaluator. The active lexical adapter reaches that frame through its
output chain:

```text
lexical adapter
  -> active parse layer
  -> enclosing parse layer(s)
  -> evaluation layer
  -> terminal result frame
```

The terminal result frame is supplied to syntax scans as optional live context.
Frames that do not require context ignore it. The byte-length state consults it
only for symbolic lengths.

### Why context crosses the scan boundary

The payload boundary must be determined during recognition. Deferring lookup to
ordinary evaluation would leave the recognizer unable to know where the byte
string ends.

Passing the live result scope through the generic scan contract avoids:

- global evaluator state;
- byte-specific dependencies on parser or evaluator classes;
- stale copies of bindings; and
- divergent behavior between high-level evaluation entry points.

### Cycle protection

Output-chain traversal must stop at the terminal frame and guard against cycles.
This prevents malformed pipeline links from turning one source character into an
unbounded traversal.

## State Model

### Length state

The length state retains only the accumulated source spelling. It transitions
when the separating backslash arrives or fails when an invalid character or EOF
prevents a valid length.

### Payload state

The payload state retains:

- the expected character count; and
- the characters collected so far.

It transitions to a completed byte value when the collected count equals the
expected count. EOF before that point is a short-payload failure.

### Completed value

Literal and dynamic source produce the same byte-frame representation. No
identifier, scope, or dynamic marker survives completion.

## Failure Design

Failures are separated by the stage at which they become knowable:

| Stage                     | Failure                                  |
| ------------------------- | ---------------------------------------- |
| Length spelling           | invalid or unterminated byte length      |
| Live lookup               | missing byte length                      |
| Resolved value validation | invalid byte length value                |
| Payload collection        | byte payload shorter than resolved count |

Lexical failure resets the active recognizer through the evaluator's existing
recovery path. A later valid expression starts with a fresh pipeline.

## Alternatives Considered

### Defer the entire byte string to evaluation

Rejected because the recognizer cannot locate the payload boundary without the
resolved count.

### Treat the rest of the line as payload

Rejected because it prevents following expressions, changes literal semantics,
and makes logical newlines part of the feature contract.

### Add a trailing payload delimiter

Rejected because it changes the requested byte-string syntax and duplicates the
existing fixed-count boundary.

### Store evaluator scope globally

Rejected because independent evaluators would no longer be isolated and
concurrent recognition could observe the wrong bindings.

### Copy bindings into lexical states

Rejected because copies become stale and violate live-scope semantics.

### Preserve the symbolic spelling in the completed value

Rejected because byte values are defined by resolved length and payload. Source
spelling would make equal values render differently and retain irrelevant scope
information.

### Accept arbitrary length expressions

Deferred. Without another delimiter, expression boundaries are ambiguous. One
ordinary identifier satisfies #311's focused primitive without prematurely
defining a larger grammar.

## Affected Areas

### Shared scan contract

The base Frame scan boundary accepts optional live context. Existing syntax
participants remain compatible because the context is optional and unused by
default.

### Generic lexical adapter

The adapter resolves the terminal result frame from its output chain and
supplies it to the active syntax owner for each scan decision.

### Byte frame

The byte frame owns identifier recognition, live lookup, value validation, zero
handling, and selection of the existing payload state.

### Executable documentation

The BitScheme tutorial contains the computed-size example as a passing assertion
and its authoritative totals include that assertion.

## Test Design

### Byte-frame unit tests

- symbolic positive and zero lengths;
- missing names;
- nonnumeric values;
- negative, fractional, infinite, and unsafe numeric values; and
- unterminated symbolic lengths.

### Lexical boundary tests

- live scope reaches the byte syntax owner;
- following source is not consumed as payload; and
- zero length returns the first following character to ordinary recognition.

### Streaming and recovery tests

- every two-chunk split of a representative dynamic byte string;
- short dynamic payload at EOF;
- missing and invalid dynamic lengths; and
- evaluator reuse after a dynamic-byte failure.

### Integration tests

- a computed identifier length renders canonically;
- existing literal byte strings remain passing;
- the executable BitScheme example passes; and
- CLI, library, web, and BitScheme suites remain green.

## Design Outcome

The feature adds one context-bearing capability to the generic scan boundary and
one symbolic branch to byte-length recognition. It leaves Sigilizer, parsing,
completed byte values, and fixed-count payload behavior unchanged.
