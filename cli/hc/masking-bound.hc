#!/usr/bin/env hc
```
Masking bound scratch corpus (a13c, #360)

Deliberately unregistered: neither `cli/deno.json`'s `test:doc` task nor the
`new URL(…)` list in `cli/hc.test.ts` names this file, because the rulings it
exercises are proposals and must not become a baseline (a13c §7). Run it by hand

    cd cli && deno task hc hc/masking-bound.hc -t

The handler is spelled `.recover` rather than a13's `.$:`, which does not lex
(a13 §10, a13a §3). Everything below runs under a13c's defaults: value masking
(a13 §9's ruling), §6a's once-per-handler rule on, and handler identity taken as
the parsed first term of the closure body. Every example wraps its declarations
in a closure called with `()`, so nothing leaks into the example that follows

The cases that *diverge* are not here, because a corpus cannot hold a stack
overflow. They are in `lib/frames/masking-bound.test.ts`, and every one of them
needs identity switched from the parsed body term to the closure value

A1 — a handler that fails on its own, which is the hazard a13 §9 exists for
```
; {.recover {1 / 0}; 1 / 0} ()
# $!.division-by-zero /
```
And the same handler literal re-declared on every call of the closure that holds
it. One source literal, so one identity however many closure values it makes
```
; {.f {.recover {(f ())}; (1 / 0)}; (f ())} ()
# $!.division-by-zero /
```
An empty handler body is the one place identity is unstable, and it cannot fail:
`{}` codifies its argument, so an empty handler always answers
```
; {.recover {}; 1 / 0} ()
# (“division-by-zero”)
```
A2 — two handlers provoking each other. Both are masked for the whole of their
own call, so depth is bounded by the number of literals and the original survives
```
; {.m1 {.recover {(m2 ())}; (1 / 0)}; .m2 {(1 / 0)}; .recover {(m1 ())}; (m1 ())} ()
# $!.division-by-zero /
```
A3 — recursion through a helper, which is the case value masking exists to
allow. The helper declares its own handler, and its handler calls the helper
```
; {.help {.recover {(help ())}; (1 / 0)}; .recover {(help ())}; (1 / 0)} ()
# $!.division-by-zero /
```
And the case value masking buys, which key masking made dead code: a handler
declared inside another handler's body does fire
```
; {.recover {{.recover {“inner”}; 1 / 0} ()}; 1 / 0} ()
# “inner”
```
A5 — an aggregate whose handler provokes the construction of the same literal.
The aggregate is built fresh every time; the handler literal inside it is not
```
; {.mk {[.recover {(mk ())}, 1 / 0]}; (mk ())} ()
# [.recover { ((mk ((())))) }; $!.division-by-zero /]
```
A4 — one handler literal reached at two nesting levels with different captures.
The inner instance declines, because its `k` does not match the reason. The outer
instance would answer, and is never asked, because §6a recorded the offer against
an identity that cannot tell one instance of a literal from another
```
; {.mk {.k _; .recover {_ = k ? {“answered by ” k}}; k = “division-by-zero” ? {(mk “resource-absent”)}; (1 / 0)}; (mk “division-by-zero”)} ()
# $!.division-by-zero /
```
§6 — the outward spelling. a13 §7 says the reason is reachable inside a branch
as `__`, and at one level of branching it is
```
; {.recover {“saw ” _}; 1 / 0} ()
# “saw division-by-zero”
; {.recover {_ = “division-by-zero” ? {“saw ” __}}; 1 / 0} ()
# “saw division-by-zero”
```
The count is one underscore per invocation, so a branch inside a branch needs
`___`, and `__` there answers the outer branch's own empty argument
```
; {.recover {_ = “division-by-zero” ? {(1 ? {“saw ” __})}}; 1 / 0} ()
# “saw ”
; {.recover {_ = “division-by-zero” ? {(1 ? {“saw ” ___})}}; 1 / 0} ()
# “saw division-by-zero”
```
An iterator callback is an invocation on the same terms, so `__` reaches the
reason and `_` answers the element — a wrong answer that looks like a right one
```
; {.recover {[1] & {“saw ” __}}; 1 / 0} ()
# [“saw division-by-zero”]
; {.recover {[1] & {“saw ” _}}; 1 / 0} ()
# [“saw 1”]
; {.recover {[1] & {1 ? {“saw ” ___}}}; 1 / 0} ()
# [“saw division-by-zero”]
```
Inside a helper the handler calls, no count reaches the reason: the helper's
enclosing scope is where the helper literal was written, not the handler. The
spelling that works is to hand the reason over as an argument
```
; {.show {“saw ” _}; .recover {(show _)}; 1 / 0} ()
# “saw division-by-zero”
```
```
