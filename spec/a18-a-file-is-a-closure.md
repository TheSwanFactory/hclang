# A File Is a Closure

**Status:** Implemented in v0.30.0.\
**Issue:** #443. Answered in its comments before implementation; this records
the answers as built.\
**Builds on:** `a11` (a read's receiver decides what it answers), `a16` (a comma
expression is a group wherever it is written), `a17` (a closure is evaluation
stopped).

## The one sentence

`'./f.hc' | {}` reads a file as the closure its source is, unevaluated: the
import, stopped before evaluation.

## Why it needs nothing new

- **The import already parses a file.** It runs the file's characters through
  the lexer and parser, then evaluates each form.
- **A closure is that parse, stopped** (`a17`). So a quote reuses the import's
  front end, the same lexer, parser and example filter, between `{` and `}`, and
  keeps the closure instead of evaluating it.
- **The spelling is a fold.** A resource pushes characters, and what a read
  answers is decided by its receiver (`a11`): text joins and an aggregate
  collects. The empty closure already quotes, since `{} x` codifies x. So
  folding a resource's characters into the empty closure parses them.

## Rulings

**A file's lines are the comma terms of one body.** A newline inside brackets is
`,`, and a comma expression is a group wherever it is written (`a16`, v0.30.0).
So calling a file's quote answers the group of its lines' values, the same
values running the file answers:

```text
'./f.hc' holds   .a 1⏎.b (a + 1)⏎'./out.txt' “written”⏎[a, b]
.q ('./f.hc' | {})            → { .a 1, .b (a + 1), './out.txt' “written”, [a, b] }
'./out.txt' | “”              → $!.resource-absent './out.txt'     nothing ran
q & {“” _}                    → [“.a”, “1”, “,”, “.b”, “(a + 1)”, “,”, …]
q ()                          → (.a 1, .b 2, 7, [1, 2])
'./out.txt' | “”              → “written”
```

**Nothing runs on read.**

- An import in the file, `<-`, is parsed into an inert import and walks as one
  atom, so the walk never reads another file.
- A write is an atom like any other.
- A testdoc's example lines, which begin with a semicolon and a space outside
  prose, are dropped, exactly as an import drops them: a quote reads what an
  import would run.

**Calling is evaluation.**

- **Where it is bound:** the quote is bound where the `|` is written, as any
  closure written there would be. Its free names resolve there, after the call's
  own frame and argument.
- **Where it declares:** a call declares into its own fresh frame, so the file's
  names stay inside the call. To evaluate a file into the current scope,
  `. <- './f.hc'` already exists.
- **On failure:** a failing statement stops a sequence and is the answer.

**Paths resolve against the root, as for an import.** A resource path in a
quoted file resolves against the root binding, both when the file is quoted and
when the quote is called. It is not relative to the quoted file.

**Reading needs a root, and discloses only the text.** Without a root binding
`'./f.hc'` is inert and folds as before. The quote discloses the file's text,
which `'./f.hc' | “”` already reads. Its walked words carry the quote's own
scope, the reader's site (`a17`), so resuming them reaches nothing the reader
could not.

**Failures are the read's or the parse's.** An absent file answers
`$!.resource-absent`, and unbalanced source answers the parser's structure
error.

## Root and body

A quoted file walks exactly as the same text written in braces:
`('./f.hc' | {}) & {“” _}` equals `{<the file's text>} & {“” _}`. There are two
documented differences:

- the file's example lines are omitted;
- running the file prints each line's value as the line completes, while calling
  the quote answers them together, as one group.

## Not in scope

Graft or any rewriting of quoted syntax, a new AST, and resolving imports while
quoting. A transformation of the quoted body is ordinary HC over its walk
(`a15`, `a17`).
