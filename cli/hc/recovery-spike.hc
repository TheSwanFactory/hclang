#!/usr/bin/env hc
```
Recovery spike scratch corpus (a13a, #360)

Deliberately unregistered: neither `cli/deno.json`'s `test:doc` task nor the
`new URL(…)` list in `cli/hc.test.ts` names this file, because the rulings it
exercises are proposals and must not become a baseline (a13a §5). Run it by hand

    cd cli && deno task hc hc/recovery-spike.hc -t

The handler is spelled `.recover` rather than a13's `.$:`, which does not lex
(a13 §10, a13a §3). Every example wraps its handler in a closure called with
`()`, so no declaration leaks into the examples that follow — which is the
narrow-scope shape a13 §8 argues for anyway

Baseline: with no handler in scope, a failure is terminal, exactly as today
```
; 1 / 0
# $!.division-by-zero /
; './missing.txt' | “”
# $!.resource-absent './missing.txt'
```
A handler in an enclosing scope substitutes its answer for the failing term, and
the reduce continues as if that term had produced it
```
; {.recover {0}; 1 / 0} ()
# 0
; {.recover {0}; (1 / 0) + 5} ()
# 5
; {.recover {0}; 5 + (1 / 0)} ()
# 5
```
The handler receives the refusal name as ordinary text in `_`, with the sigil
stripped (a13 §7)
```
; {.recover {_}; 1 / 0} ()
# “division-by-zero”
; {.recover {_}; './missing.txt' | “”} ()
# “resource-absent”
```
Q6.1 — a constant fallback, which never mentions `_` at all
```
; {.recover {“(defaults)”}; './missing.txt' | “”} ()
# “(defaults)”
```
Q6.2 — the partial handler a13 §7a proposes. It answers for one reason and
declines every other, and the decline propagates the original failure
```
; {.recover {_ = “resource-absent” ? {“(defaults)”}}; './missing.txt' | “”} ()
# “(defaults)”
; {.recover {_ = “resource-absent” ? {“(defaults)”}}; 1 / 0} ()
# $!.division-by-zero /
```
Q6.3 — a handler that builds a message from `_`. This works only while the
message is built at the top level of the body
```
; {.recover {“recovered from ” _}; 1 / 0} ()
# “recovered from division-by-zero”
```
Inside a conditional branch it does not, and it does not fail either. `IfThen`
calls the branch with nil as its argument, so `_` there is the branch's own
empty argument and the reason is silently gone
```
; {.recover {_ = “division-by-zero” ? {“saw ” _}}; 1 / 0} ()
# “saw ”
```
Binding the reason to a name first is the spelling that works, because a branch
closure captures its enclosing scope even though it is handed nil
```
; {.recover {.r _; r = “division-by-zero” ? {“saw ” r}}; 1 / 0} ()
# “saw division-by-zero”
```
Fanning out over two reasons in one body does not work at all, and this is the
`?`/`:` composition a13 §7a already pinned rather than anything about recovery:
`:` tests what `?` answered. When the first test hits, `?` answers text and `:`
sees a truthy source, so it answers nil; when it misses, the `:` branch runs but
is handed nil, so its own test on `_` misses too. Both inputs decline
```
; {.recover {_ = “resource-absent” ? {“(defaults)”} : {_ = “division-by-zero” ? {0}}}; './missing.txt' | “”} ()
# $!.resource-absent './missing.txt'
; {.recover {_ = “resource-absent” ? {“(defaults)”} : {_ = “division-by-zero” ? {0}}}; 1 / 0} ()
# $!.division-by-zero /
```
Q6.4 — recovering by reading a different resource. The handler body is ordinary
HC, so a fallback read needs nothing new
```
; './backup.txt' “from backup”
# 11
; {.recover {'./backup.txt' | “”}; './primary.txt' | “”} ()
# “from backup”
```
When the fallback read fails too, the handler has failed on its own, so it
declines and the original failure is the one that survives (a13 §9)
```
; {.recover {'./nowhere.txt' | “”}; './primary.txt' | “”} ()
# $!.resource-absent './primary.txt'
```
Q6.5 — a handler nested inside another handler's scope. The inner one is never
consulted, because masking a handler for the duration of its own call masks the
key rather than the value (a13 §9's open question), so nothing inside a handler
body can recover
```
; {.recover {{.recover {“inner”}; 1 / 0} ()}; 1 / 0} ()
# $!.division-by-zero /
```
Nesting outside a handler body is unaffected: the nearest declaration wins, the
way any other name would shadow an outer one of the same spelling (a13 §5)
```
; {.recover {“outer”}; {.recover {“inner”}; 1 / 0} ()} ()
# “inner”
; {.recover {“outer”}; {.x 1; 1 / 0} ()} ()
# “outer”
```
Lookup from the failing term's own scope does let an expression declare its own
escape hatch, which is the shape a13 §5 rules out. An array literal declares
into itself, so a handler and the term it recovers are terms of one aggregate
```
; [.recover {0}, 1 / 0]
# [.recover { 0 }; 0]
```
A handler that fails the same way it was called for terminates rather than
recursing, and the original failure survives (a13 §9)
```
; {.recover {1 / 0}; 1 / 0} ()
# $!.division-by-zero /
```
Nil declines, so recovering to nil is unspellable (a13 §7a)
```
; {.recover {()}; 1 / 0} ()
# $!.division-by-zero /
```
Collecting opts out, and the two spellings that differ by one seed land in
different regimes (a13 §6). Neither answer changes when a handler is in scope
```
; {.recover {7}; './missing.txt' | []} ()
# [$!.resource-absent './missing.txt']
; {.recover {7}; './missing.txt' | “”} ()
# 7
```
The handler is ordinary data, so it prints and it streams. Declaring recovery
changes what the value is (a13a Q4)
```
; [.recover {0}, 1]
# [.recover { 0 }; 1]
; [.recover {0}, 1] && {_ .0}
# [.recover, .0]
; [.recover {0}, 1] & {_}
# [1]
```
An aggregate keeps a declaration's echo in its data plane, so the handler also
shifts positional addresses. `[.z {0}, 1] .0` does the same, so recovery inherits
this rather than causing it
```
; [.recover {0}, 1] .0
# .recover { 0 }
; [.recover {0}, 1] .1
# 1
```
The refusal vocabulary a13 §7 slices the sigil from is not one family. A
signature refusal is spelled with no dot at all, and it still has to name itself
```
; .join-name (.first “Jane”, .last) ^ {last “, ” first};
; {.recover {_}; join-name (.middle “Q”)} ()
# “invalid-argument-list”
```
A nil computation is not a failure, so nothing is consulted and the pre-M-3
fallback idiom is untouched (a13 §12)
```
; {.recover {0}; “a” + 1} ()
# ()
; {.recover {0}; (“a” + 1) : {“else”}} ()
# “else”
```
A missing name is a note rather than an error frame, so it is not a failure
either and no handler sees it (a13a Q2)
```
; {.recover {0}; nope-name} ()
# $!.name-missing “$:Frame.0.nope-name”;
```
A mutating method's body is an ordinary reduce, so a handler in scope recovers
its failure before the bound-method boundary ever sees one (a13a Q1)
```
; .constant_ [.Value 1; .change_ {@Value _;}];
; [constant_.change_ 2]
# [($error{$is-constant .Value});]
; {.recover {“handled”}; constant_.change_ 2} ()
# “handled”
```
That failure also shows the refusal vocabulary is not the single `$!.…` family
a13 §7 assumes. This one is spelled `$error{$is-constant …}`, and it reaches the
reduce wrapped in a statement, so naming it takes a second pattern and an unwrap
rather than stripping a sigil
```
; {.recover {_}; constant_.change_ 2} ()
# “is-constant”
