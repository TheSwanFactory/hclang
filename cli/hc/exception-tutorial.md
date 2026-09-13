# Handling errors: a tutorial

A failure in HC is a value, and it is permanently a value: once something has
failed, every expression that so much as reads it answers that same failure
back. `1 + (1 / 0)` is the division by zero, not a sum. `(1 / 0) ? {“caught”}`
is the division by zero, not `“caught”`, because the failure became the answer
to the whole expression before `?` was ever asked. A computation cannot inspect
its own failure, test it, or route around it — until something in an enclosing
scope declares a way out.

> NOTE: This tutorial follows [`apply.hc`](apply.hc)'s conventions — every `;`
> line is REPL input, every `#` line is the answer it prints, and a line
> ending in `;` is a statement that answers nothing. Unlike that corpus, none of
> it is executed: it describes the design in
> [`spec/a13-error-handling.md`](../../spec/a13-error-handling.md), written as if
> it already shipped. It should become an executable corpus of its own once the
> rulings it encodes are settled, for the same reason `apply.hc` absorbed its
> tutorial — prose that is not run drifts from what the interpreter does.

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

## Knowing what failed

A handler is told the **name** of what went wrong, in `_`, as ordinary text —
the `$!.…` vocabulary with the sigil stripped off

```css
; .$: {_};
; (1 / 0)
# “division-by-zero”
; './missing.txt' | “”
# “resource-absent”
```

It is text, not the failure, and that is the whole point: text composes. You
can compare it, join it, put it in a message, hand it to a closure. Had the
handler been given the failure itself, reading it would have answered the
failure right back, and a handler could never do anything but shrug.

## Recovering from some failures and not others

A handler that answers nothing — nil — declines, and the original failure
carries on outward exactly as if no handler had been declared. That makes a
partial handler a single `?`

```css
; .$: {_ = “resource-absent” ? {“(defaults)”}};
; './config.txt' | “”
# “(defaults)”
; (1 / 0)
# $!.division-by-zero /
```

The read matches, so it recovers. The division does not match, so the test
answers nil, the handler answers nil, and the failure keeps going — to a
narrower handler nested inside, if one exists, or all the way out if none does.

Two things to get right, because both fail quietly rather than loudly.

**Inside a branch, the reason is `__`.** `_` always names the innermost call's
argument, and a branch is a call — one that `?` hands nothing. So a handler that
tests the reason and then mentions it needs the outward spelling

```css
; .$: {_ = “division-by-zero” ? {“saw ” __}};
; 1 / 0
# “saw division-by-zero”
```

Write `_` inside that branch and you get `“saw ”`. Nothing refuses; the reason is
simply gone.

**Write the test with `?` alone.** `? … : …` is not an if/then/else in HC: `:`
tests what the `?` branch answered, not what the condition was, so appending
`: {…}` to a `?` that succeeded turns a good answer into nil. A body that fans
out over two reasons therefore declines on *both* of them. When you want to
answer for several kinds of failure, declare several handlers at the scopes that
care about them rather than fanning out inside one body — that is the grain of
the language, and each handler stays a single `?`.

## Reading a resource that might not be there

The case this exists for: a resource that might be absent, might be outside the
root, might have run out of budget — and a program that would rather use a
default than stop

```css
; .$: {“(defaults)”};
; './config.txt' | “”
# “(defaults)”
```

Reading `'./config.txt'` fails exactly as it does without a handler. What's
different is that something is now declared to answer for it, so the read that
would have ended the whole expression instead becomes the fallback text, and
whatever the program does next runs on that.

Reducing into an array is the exception, and deliberately so. An array collects,
so a refusal becomes an ordinary element and the read answers a perfectly good
array — there is no failure left for a handler to answer for

```css
; .$: {“(defaults)”};
; './missing.txt' | []
# [$!.resource-absent './missing.txt']
; './missing.txt' | “”
# “(defaults)”
```

The two differ by what you seeded the reduce with. Collecting says you intend to
look at the results yourself, so recovery stays out of the way; joining says you
wanted the text, so a failure to produce it is a failure, and the handler
answers.

## One boundary worth knowing

The failure itself never reaches you — only its name. That is a consequence of
the rule at the top of this page rather than a restriction bolted on: a failure
stays a failure under everything, so any expression built from one answers it
unchanged, including an expression inside the handler meant to examine it.
Handing over text is what lets a handler work at all.

So a handler has exactly two moves. Answer with something that owes the failure
nothing — `0`, `“(defaults)”`, another read, a value built from `_`'s text — and
the failure is replaced. Or answer nil and decline, and it carries on untouched.
There is no third move where you take the failure apart, wrap it, or re-raise it
with more context attached. What you can react to is its name, and what you can
hand back is a value of your own.
