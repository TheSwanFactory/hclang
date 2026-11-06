#!/usr/bin/env hc
```
ART dispatch soundness: VACT witness for the footprint policy (occurrence/figure 015.24j, 015.24l)

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
nested call, and every arrow callback a commit fires, is inside its
statement. The observable of a dispatch is the tuple of the events' results,
in program order, failures included, followed by the state observer read
afterwards from the same scope (`state ()`, or the scenario's own). An arrow
callback is observed by what it does: the ones here count their firings in
shared state. The `trace`, `waited` and `escapes` properties record the
schedule the policy chose; they are instrumentation, not part of the
observable the claim is about.

The claim the witnesses bear on (spec a12 §Soundness): every `footprint`
dispatch is observably equal to the `certified-sequential` run of the same
events, which runs them alone in program order, each under the certificate
inferred when it starts, so that an event whose actual access leaves its
certificate stops there, refused, keeping what it committed before (its
certified prefix). Where nothing is refused that run is the `sequential`
one. The `interleave` policy is the uncoordinated counterexample. The claim
is conditional on the events staying inside the fragment the guard sees: a
host native that reads state without a seam is outside it, and the
companion test exhibits that boundary.

Arrow callbacks registered here persist, as every registration does, so
each arrow scenario re-arms a fresh managed value first (`rearm ()`).

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
; .ygetters [{y_.n}];
; .prefix-x {x_.set_ 6; .b (ygetters & {_ ()}); b .0};
; .fired_ [.n 0; .tick_ {@n (n + 1);}; .set_ {@n _;}];
; .w_ [.n 0; .set_ {@n _;}];
; .armers [{w_ -> {fired_.tick_ ()}}];
; .arm-hidden {.p 0; (armers & {_ ()}) .0; fired_.n};
; .arm {.w w_; w -> {fired_.tick_ ()}; fired_.n};
; .poke {w_.set_ 1; fired_.n};
; .poke-late {.p 0; w_.set_ 1; fired_.n};
; .rearm {@w_ [.n 0; .set_ {@n _;}]; fired_.set_ 0;};
; .watch {[w_.n, fired_.n]};
; .cell2_ [.v 0; .put_ {@v _;}];
; .log2_ [.count 0; .tick_ {@count (count + 1);}; .set_ {@count _;}];
; cell2_ -> {(ygetters & {_ ()}) .0};
; cell2_ -> {log2_.tick_ ()};
; .poke2 {cell2_.put_ 1; cell2_.v};
; .b1 [.k 1];
; .b2 [.k 2];
; .obj_ [.^ b1; .rebase_ {.^ _;}];
; .objs [{obj_.k}];
; .peek-k {.p 0; .q (b1.k + b2.k); .r (objs & {_ ()}); r .0};
; .peek-k-open {.p 0; obj_.k};
; .rebase {obj_.rebase_ b2; 0};
; .holder_ [.t_ x_; .set-t_ {@t_ _;}];
; .ys [{y_}];
; .retarget-holder {.p 0; .v (ys & {_ ()}); holder_.set-t_ (v .0); 0};
; .via-holder {.a holder_.t_.n; holder_.t_.set_ (a + 1); holder_.t_.n};
; .nested {$$.dispatch.sequential [read-x]};
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
W13. A refused event keeps its certified prefix. `prefix-x` writes x, which
its certificate allows, then reads y through a closure held in data, which
it does not: it is refused at that read, and x keeps the 6 it committed.
`read-x` waits for it and reads 6. The baseline that matches is the
certified serial run, prefix and failure included; the serial run of the
completed event alone (`read-x`) would read 5, and the plain serial run, in
which nothing is refused, completes `prefix-x`.
```
; $$.dispatch.footprint [prefix-x, read-x]
# [.trace “0:1 1:1”; .waited [[], [0]]; .escapes [0, 0]; $!.uncertified-read, 6]
; state ()
# [6, 10]
; reset ();
; $$.dispatch.certified-sequential [prefix-x, read-x]
# [.trace “0:1 1:1”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-read, 6]
; state ()
# [6, 10]
; reset ();
; $$.dispatch.sequential [read-x]
# [.trace “0:1”; .waited [[]]; .escapes [0]; 5]
; $$.dispatch.sequential [prefix-x, read-x]
# [.trace “0:1 0:2 0:3 1:1”; .waited [[], []]; .escapes [0, 0]; 10, 6]
; state ()
# [6, 10]
; reset ();
```
W14. Arrow registration is a write of the managed value: the subscriber list
decides what every later write of the value fires. Both orders, each from a
fresh `w_`. Registered through a closure held in data (`arm-hidden`), the
registration is outside the certificate and refused before it lands, so no
callback is added and none fires, in the footprint run and in the certified
serial run alike; the plain serial run registers and, after it, `poke`
fires the callback once. Registered by name, even through an immutable
alias (`arm`), the arrow is in the certificate as a write of w, so the pair
serializes in program order and fires exactly what the serial run fires.
```
; rearm ();
; $$.dispatch.footprint [arm-hidden, poke]
# [.trace “0:1 1:1 1:2”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-write, 0]
; watch ()
# [1, 0]
; rearm ();
; $$.dispatch.certified-sequential [arm-hidden, poke]
# [.trace “0:1 1:1 1:2”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-write, 0]
; watch ()
# [1, 0]
; rearm ();
; $$.dispatch.sequential [arm-hidden, poke]
# [.trace “0:1 0:2 0:3 1:1 1:2”; .waited [[], []]; .escapes [1, 0]; 0, 1]
; watch ()
# [1, 1]
; rearm ();
; $$.dispatch.footprint [poke-late, arm-hidden]
# [.trace “0:1 1:1 0:2 0:3”; .waited [[], []]; .escapes [0, 0]; 0, $!.uncertified-write]
; watch ()
# [1, 0]
; rearm ();
; $$.dispatch.certified-sequential [poke-late, arm-hidden]
# [.trace “0:1 0:2 0:3 1:1”; .waited [[], []]; .escapes [0, 0]; 0, $!.uncertified-write]
; watch ()
# [1, 0]
; rearm ();
; $$.dispatch.footprint [arm, poke]
# [.trace “0:1 0:2 0:3 1:1 1:2”; .waited [[], [0]]; .escapes [0, 0]; 0, 1]
; watch ()
# [1, 1]
; rearm ();
; $$.dispatch.sequential [arm, poke]
# [.trace “0:1 0:2 0:3 1:1 1:2”; .waited [[], []]; .escapes [0, 0]; 0, 1]
; watch ()
# [1, 1]
; rearm ();
; $$.dispatch.footprint [poke-late, arm]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], [0]]; .escapes [0, 0]; 0, 0]
; watch ()
# [1, 0]
; rearm ();
; $$.dispatch.sequential [poke-late, arm]
# [.trace “0:1 0:2 0:3 1:1 1:2 1:3”; .waited [[], []]; .escapes [0, 0]; 0, 0]
; watch ()
# [1, 0]
; rearm ();
```
W15. A refusal inside an arrow callback ends the event there. `cell2_` has
two callbacks: the first reads y through data, outside the certificate; the
second ticks `log2_`. Writing `cell2_` commits (the certified prefix), the
first callback is refused, and the second does not run: `log2_` stays 0. The
plain serial run, with no guard, runs both.
```
; $$.dispatch.footprint [poke2]
# [.trace “”; .waited [[]]; .escapes [0]; $!.uncertified-read]
; [cell2_.v, log2_.count]
# [1, 0]
; cell2_.put_ 0;
; log2_.set_ 0;
; $$.dispatch.certified-sequential [poke2]
# [.trace “”; .waited [[]]; .escapes [0]; $!.uncertified-read]
; [cell2_.v, log2_.count]
# [1, 0]
; cell2_.put_ 0;
; log2_.set_ 0;
; $$.dispatch.sequential [poke2]
# [.trace “0:1 0:2”; .waited [[]]; .escapes [0]; 1]
; [cell2_.v, log2_.count]
# [1, 1]
; cell2_.put_ 0;
; log2_.set_ 0;
```
W16. A lookup that misses is a read. `obj_` declares no `k`; `obj_.k` falls
through to its parent. `peek-k` reads b1 and b2 by name and `obj_.k`
through data, so its certificate reads neither `obj_` nor its parent edge,
and `rebase` (which re-parents `obj_` to b2) is admitted beside it. The
miss on `obj_` is refused before the lookup falls through, whichever parent
is current, so the answer does not depend on the schedule. Looked up by
name (`peek-k-open`), the miss is in the certificate and the pair
serializes.
```
; $$.dispatch.footprint [peek-k, rebase]
# [.trace “0:1 1:1 0:2 1:2”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-read, 0]
; obj_.k
# 2
; obj_.rebase_ b1;
; $$.dispatch.certified-sequential [peek-k, rebase]
# [.trace “0:1 0:2 1:1 1:2”; .waited [[], []]; .escapes [0, 0]; $!.uncertified-read, 0]
; obj_.k
# 2
; obj_.rebase_ b1;
; $$.dispatch.footprint [peek-k-open, rebase]
# [.trace “0:1 0:2 1:1 1:2”; .waited [[], [0]]; .escapes [0, 0]; 1, 0]
; obj_.k
# 2
; obj_.rebase_ b1;
; $$.dispatch.sequential [peek-k-open, rebase]
# [.trace “0:1 0:2 1:1 1:2”; .waited [[], []]; .escapes [0, 0]; 1, 0]
; obj_.k
# 2
; obj_.rebase_ b1;
```
W17. Admission is in program order. `retarget-holder` points `holder_.t_` at
y through data its certificate does not follow; `via-holder` waits for it
and, when it starts, is seen to write y. `incr-y` must not start before
`via-holder` has: had it run ahead, `via-holder` would increment the y it
had already written, and the two results would swap.
```
; $$.dispatch.sequential [retarget-holder, via-holder, incr-y]
# [.trace “0:1 0:2 0:3 0:4 1:1 1:2 1:3 2:1 2:2 2:3”; .waited [[], [], []]; .escapes [0, 0, 0]; 0, 11, 12]
; state ()
# [5, 12]
; holder_.set-t_ x_;
; reset ();
; $$.dispatch.footprint [retarget-holder, via-holder, incr-y]
# [.trace “0:1 0:2 0:3 0:4 1:1 1:2 1:3 2:1 2:2 2:3”; .waited [[], [0], [1]]; .escapes [0, 0, 0]; 0, 11, 12]
; state ()
# [5, 12]
; holder_.set-t_ x_;
; reset ();
```
W18. A dispatch inside an event. The host namespace `$$` is state the walk
does not follow, so under a guard an event that reaches for `$$.dispatch` is
refused at that read, before any inner event runs; unguarded, it nests. A
nested dispatch reached from the host is covered by the companion test: a
refusal belongs to the guard that refused it.
```
; $$.dispatch.footprint [nested]
# [.trace “”; .waited [[]]; .escapes [0]; $!.uncertified-read]
; $$.dispatch.sequential [nested]
# [.trace “0:1”; .waited [[]]; .escapes [0]; [.trace “0:1”; .waited [[]]; .escapes [0]; 5]]
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
