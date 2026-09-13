# Handling errors: a tutorial

An error is a value like any other, and it behaves like one everywhere except
one place: applying anything to it, ever, answers the same error back
unchanged. `1 + (1 / 0)` is `(1 / 0)`, and `(1 / 0) ? {…} : {…}` never reaches
either branch, because the failure becomes the answer to the whole expression
before either branch is asked. That is what makes a computation's own failure,
by itself, impossible to recover from — until something in an enclosing scope
declares a way out.

> NOTE: This tutorial follows the applying tutorial's conventions — every `;`
> line is REPL input, every `#` line is the answer it prints, and a line
> ending in `;` is a statement that answers nothing. It describes the design in
> [`spec/a13-error-handling.md`](../../spec/a13-error-handling.md), written here
> as if it already shipped.

## Declaring a recovery

`.$:` is a reserved property. Setting it declares that its enclosing scope is
one a failing term underneath can recover through — an ordinary property
declaration, nothing more

```css
; .$: {0};
; (1 / 0)
# 0
```

Nothing about `(1 / 0)` changed. What changed is that a scope above it now
answers "what do I do when something below me fails," and the failing term
found that answer by ordinary lookup — the same lookup any other name uses,
walking outward from where the failure happened until it finds a `.$:` or runs
out of scope.

## The recovered value keeps going

Recovery replaces the failing term with whatever the handler answers, and the
rest of the expression runs exactly as if that had been the term's answer all
along

```css
; .$: {0};
; (1 / 0) + 1
# 1
```

`(1 / 0)` still fails. The handler answers `0`. `0 + 1` is `1`. Nothing about
`+` or the rest of the expression needed to know a failure ever happened.

## Handlers are ordinary scope, so the nearest one wins

`.$:` shadows the way any declaration shadows — a block that declares its own
answers with that one, and a block that doesn't defers to whatever encloses it

```css
; .$: {“(unknown)”};
; [.$: {0}; (1 / 0)]
# [.$: {0}; 0]
; [(1 / 0)]
# [“(unknown)”]
```

The first array declares its own recovery and gets `0`. The second declares
none, so the failure finds the outer one instead and gets `“(unknown)”`. Where
you put `.$:` is a decision about which failures you're claiming to know how to
answer; everything else keeps going to whoever encloses you.

## Declining to recover

A handler is not obligated to answer for every failure it sees. Answering with
the failure itself — unchanged — declines, and the failure propagates exactly
as if no handler had been declared at all

```css
; .$: {_};
; (1 / 0)
# $!.division-by-zero /
```

This is the difference between "I catch everything here" and "I only catch
what I know how to fix." A handler that only wants to recover from some
failures answers with `_` for the rest, and those keep going outward — to a
narrower handler nested inside, if one exists, or all the way out if none does.

## Reading a resource that might not be there

The case this exists for: a resource that might be absent, might be outside the
root, might have run out of budget — and a program that would rather use a
default than stop

```css
; .$: {“(defaults)”};
; './config.txt' | “”
# “(defaults)”
```

Reading `'./config.txt'` fails exactly as it does without a handler — a missing
file is still `$!.resource-absent`. What's different is that something is now
declared to answer for it, so the read that would have ended the whole
expression instead becomes the fallback text, and whatever the program does
next runs on that.

## One boundary worth knowing

A handler answers *instead of* the failing term — it does not get to inspect
and rebuild around it. `_` inside a handler is the failure itself, and a
failure stays a failure under everything: reading `_` and then applying
anything further to what you read fails the same way `(1 / 0) + 1` does,
because nothing distinguishes "a term that just failed" from "a value that
happens to be a failure," including one sitting in your own parameter. A
handler either answers with something that owes the failure nothing — `0`,
`“(defaults)”`, another read, anything not built out of `_` — or it answers
with `_` and declines. There is no third move where it takes the failure apart.
