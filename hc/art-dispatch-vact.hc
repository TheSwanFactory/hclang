#!/usr/bin/env hc
```
ART dispatch soundness: VACT witness for the footprint policy (occurrence/figure 015.24j)

Construction → specified observation → vacted fact → interpretation.
Run from the repository root: `deno task hc hc/art-dispatch-vact.hc -t`.

This testdoc constructs HC state and closures in ordinary file scope, hands
them to the dispatcher under test through the host bridge `$$.dispatch`, and
asserts what each policy does to them. The dispatcher is the library's own
(`lib/frames/event-dispatch.ts`); the bridge only turns an array of closures
into events and prints the report. `lib/frames/event-dispatch.vact.test.ts`
reads this file, re-runs it, and dispatches the same construction from the
host side with the finer observers (versions, certificates, refusals).

The fragment. An event is one call of a closure written here, with nil as its
argument unless a pair `[closure, argument]` is given. The unit of
interleaving is the statement: a `;`-separated step of a sequenced body; a
nested call is inside its statement. The observable of a dispatch is the
tuple of the events' results, in program order, followed by the state
observer `state ()` read afterwards from the same scope. The `trace`,
`waited` and `escapes` properties record the schedule the policy chose; they
are instrumentation, not part of the observable the claim is about.

The claim the witnesses bear on: every dispatch the `footprint` policy lets
run to completion is observably equal to the `sequential` baseline of the
same events, which runs them in program order to completion one by one. The
`interleave` policy is the uncoordinated counterexample. An event whose
actual access leaves its certificate is refused before that access happens
and ends with `$!.uncertified-read` or `$!.uncertified-write`; the others
complete.

Construction: two mutable identities, aliases of x, and the closures.
```
; .x_ [.n 5; .set_ {@n _;}];
; .y_ [.n 10; .set_ {@n _;}];
; .y-of-x_ x_;
; .z x_;
; .t_ x_;
; .incr-x {.a x_.n; x_.set_ (a + 1); x_.n};
; .incr-y {.a y_.n; y_.set_ (a + 1); y_.n};
; .read-x {x_.n};
; .via-alias {.a y-of-x_.n; y-of-x_.set_ (a + 1); y-of-x_.n};
; .functional {(z.set_ 0).n};
; .move {.v x_.n; x_.set_ (v - 1); y_.set_ (y_.n + 1); x_.n + y_.n};
; .sum-slow {.a x_.n; .pad 0; a + y_.n};
; .retarget {@t_ y_; t_.n};
; .via-t {.a t_.n; t_.set_ (a + 1); t_.n};
; .mk {incr-x};
; .via-mk {(mk ()) ()};
; .getters [read-x];
; .setters [{x_.set_ _; x_.n}];
; .hidden-incr-x {.a (getters & {_ ()}); (setters & {_ ((a .0) + 1)}) .0};
; .each {_ & {_ ()}};
; .hidden-write-x {.a x_.n; (setters & {_ (a + 1)}) .0};
; .log_ [.count 0; .tick_ {@count (count + 1);}; .set-count_ {@count _;}];
; .cell_ [.v 1; .put_ {@v _;}];
; cell_ -> {log_.tick_ ()};
; .cell-twice {cell_.put_ 1; cell_.put_ 2; cell_.v};
; .log-slow {.c log_.count; log_.set-count_ (c + 10); log_.count};
; .ghost {Nothing <- './nothing.hc'; x_.set_ 0;};
; .reset {x_.set_ 5; y_.set_ 10; @t_ x_;};
; .state {[x_.n, y_.n]};
; state ()
# [5, 10]
```
W1. Shared x, two read-then-write events. The sequential baseline is the
observation every coordinated policy must reproduce.
```
; $$.dispatch.sequential [incr-x, incr-x]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], []]; .escapes [0, 0]; 6, 7]
; state ()
# [7, 10]
; reset ();
; $$.dispatch.footprint [incr-x, incr-x]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; 6, 7]
; state ()
# [7, 10]
; reset ();
; $$.dispatch.interleave [incr-x, incr-x]
# [.trace “0:1 1:1 0:2 1:2 0:3 1:3”; .waited [[], []]; .escapes [0, 0]; 6, 6]
; state ()
# [6, 10]
; reset ();
```
W2. The conflict is on the identity, not the name: a write through a mutable
alias of x is the same conflict.
```
; $$.dispatch.footprint [incr-x, via-alias]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; 6, 7]
; state ()
# [7, 10]
; reset ();
```
W3. Disjoint x and y: the events interleave statement by statement and the
observation is the baseline's.
```
; $$.dispatch.sequential [incr-x, incr-y]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], []]; .escapes [0, 0]; 6, 11]
; state ()
# [6, 11]
; reset ();
; $$.dispatch.footprint [incr-x, incr-y]
# [.trace “0:1 1:1 0:2 1:2 0:3 1:3”; .waited [[], []]; .escapes [0, 0]; 6, 11]
; state ()
# [6, 11]
; reset ();
```
W4. A reader of x against a writer of x, both orders: the reader is given one
committed version, the one program order puts before it.
```
; $$.dispatch.footprint [incr-x, read-x]
# [.trace “0:1 0:2 0:3 1:1”; .waited [[], [0]]; .escapes [0, 0]; 6, 6]
; $$.dispatch.footprint [read-x, incr-x]
# [.trace “0:1 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; 6, 7]
; state ()
# [7, 10]
; reset ();
```
W5. A mutating method through an immutable alias is a functional update: it
writes nothing shared, so a reader of x need not wait, and x is untouched.
```
; $$.dispatch.footprint [functional, read-x]
# [.trace “0:1 1:1”; .waited [[], []]; .escapes [0, 0]; 0, 5]
; state ()
# [5, 10]
```
W6. A multi-value invariant, x + y. Uncoordinated statements let a slow reader
observe a sum that never existed and two transfers lose the conservation;
footprint keeps both.
```
; $$.dispatch.sequential [move, sum-slow]
# [.trace “0:1 0:2 0:3 0:4 1:1 1:2 1:3”; .waited [[], []]; .escapes [0, 0]; 15, 15]
; state ()
# [4, 11]
; reset ();
; $$.dispatch.interleave [move, sum-slow]
# [.trace “0:1 1:1 0:2 1:2 0:3 1:3 0:4”; .waited [[], []]; .escapes [0, 0]; 15, 16]
; state ()
# [4, 11]
; reset ();
; $$.dispatch.footprint [move, sum-slow]
# [.trace “0:1 0:2 0:3 0:4 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; 15, 15]
; state ()
# [4, 11]
; reset ();
; $$.dispatch.interleave [move, move]
# [.trace “0:1 1:1 0:2 1:2 0:3 1:3 0:4 1:4”; .waited [[], []]; .escapes [0, 0]; 16, 16]
; state ()
# [4, 12]
; reset ();
; $$.dispatch.footprint [move, move]
# [.trace “0:1 0:2 0:3 0:4 1:1 1:2 1:3 1:4”; .waited [[], [0]]; .escapes [0, 0]; 15, 15]
; state ()
# [3, 12]
; reset ();
```
W7. A dynamically rebound name. `retarget` rebinds `t_` from x to y; `via-t`
writes through `t_`. Its footprint is read when it starts, after `retarget`,
so it names y and `incr-y` waits for it.
```
; $$.dispatch.sequential [retarget, via-t, incr-y]
# [.trace “0:1 0:2 1:1 1:2 1:3 2:1 2:2 2:3”; .waited [[], [], []]; .escapes [0, 0, 0]; 10, 11, 12]
; state ()
# [5, 12]
; reset ();
; $$.dispatch.footprint [retarget, via-t, incr-y]
# [.trace “0:1 0:2 1:1 1:2 1:3 2:1 2:2 2:3”; .waited [[], [0], [0, 1]]; .escapes [0, 0, 0]; 10, 11, 12]
; state ()
# [5, 12]
; reset ();
```
W8. A closure returned by a call and then called. The walk reaches the
returned closure's body through the name it was written under, so the event
is seen to write x and is serialized: conservative admission, no refusal.
```
; $$.dispatch.footprint [via-mk, incr-x]
# [.trace “0:1 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; 6, 7]
; state ()
# [7, 10]
; reset ();
```
W9. Hostile: a call reached only through data. `hidden-incr-x` reads x and
writes x through closures held as elements of `getters` and `setters`, which
the walk reads as aggregates without walking the closures inside. Its
certificate therefore names neither a read nor a write of x, and the
dispatcher admits it beside `incr-x`. Uncoordinated, that is a lost update
with an escape reported after the fact. Under footprint the guard refuses
the first access outside the certificate, the read of x, before it happens:
the event ends with `$!.uncertified-read`, nothing it would have written
lands, and `incr-x` completes alone.
```
; $$.dispatch.interleave [hidden-incr-x, incr-x]
# [.trace “0:1 1:1 0:2 1:2 1:3”; .waited [[], []]; .escapes [1, 0]; 6, 6]
; state ()
# [6, 10]
; reset ();
; $$.dispatch.footprint [hidden-incr-x, incr-x]
# [.trace “1:1 1:2 1:3”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-read, 6]
; state ()
# [6, 10]
; reset ();
```
W10. Hostile: closures handed in inside a data argument. `each` applies every
element of its argument; the walk sees the argument as an aggregate and the
element closures stay unwalked. Refused before the first uncertified access.
`hidden-write-x` reads x in the open and writes it through the hidden setter:
its certificate reads x, so a reader of x is admitted beside it, and the
hidden write is refused at the commit point, before it lands: x keeps the
value the reader saw.
```
; $$.dispatch.footprint [[each, setters], incr-x]
# [.trace “1:1 1:2 1:3”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-read, 6]
; state ()
# [6, 10]
; reset ();
; $$.dispatch.footprint [hidden-write-x, read-x]
# [.trace “0:1 1:1”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-write, 5]
; state ()
# [5, 10]
```
W11. A hidden effect that is inferable: the arrow `cell_ -> {log_.tick_ ()}`
registers a callback that writes `log_` whenever `cell_` commits a write. The
walk reads the registered callbacks of every identity the event may write,
so `cell-twice` is seen to write `log_` and is serialized against `log-slow`.
```
; $$.dispatch.sequential [cell-twice, log-slow]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], []]; .escapes [0, 0]; 2, 12]
; [cell_.v, log_.count]
# [2, 12]
; log_.set-count_ 0;
; $$.dispatch.footprint [cell-twice, log-slow]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; 2, 12]
; [cell_.v, log_.count]
# [2, 12]
; log_.set-count_ 0;
```
W12. A failing event. `ghost` imports a resource, which the walk cannot read,
so it is opaque and serialized against everything; it fails at its first
statement as a call would, writes nothing, and the other event runs after it.
```
; $$.dispatch.footprint [ghost, incr-y]
# [.trace “0:1 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; $!.resource-absent './nothing.hc', 11]
; state ()
# [5, 11]
; reset ();
```
Refusals of the bridge itself: an element that is not a callable, and a bare
policy, which is a value.
```
; $$.dispatch.footprint [5]
# $!.dispatch-event 0 FrameCount
; $$.dispatch.footprint
# $$.dispatch.footprint
```
Importing skips the examples and ends on a native true value.
```
[] = []
