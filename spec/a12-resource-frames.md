# Resource Frames: Env, Handlers, and Time

**Status:** Shipped in v0.16.0.\
**Issues:** [#366](https://github.com/TheSwanFactory/hclang/issues/366),
[#367](https://github.com/TheSwanFactory/hclang/issues/367),
[#369](https://github.com/TheSwanFactory/hclang/issues/369),
[#370](https://github.com/TheSwanFactory/hclang/issues/370),
[#371](https://github.com/TheSwanFactory/hclang/issues/371), indexed by
[#351](https://github.com/TheSwanFactory/hclang/issues/351).\
**Design record:** [`a07`](a07-hc-security-architecture.md). This document
records only the rulings a07 left open, and the shapes those rulings took.

## 1. The env dictionary, not an `--allow-env` scope

`lib/execute/env-visibility.ts` declares which variables are visible, and the
harness reads **one declared name at a time**. There is no wholesale read left,
so a variable the dictionary omits is never read at all rather than read and
discarded.

Two consequences worth stating, because both were arguments during drafting:

- **The flag is not the bound.** `--allow-env` stays unscoped in the CLI,
  because the dependency tree probes a dozen colour-support variables and
  scoping the flag breaks the harness — the finding that stalled this work under
  #348. The dictionary is what a per-invocation flag cannot express.
- **Absence, not refusal.** An undeclared variable and a typo answer the same
  `$!.name-missing`. A read the host itself refuses is also absent, so the
  harness's flags cannot become a channel a program detects.

## 2. The handler table owns scheme, and the colon is never consulted

`ResourceHandlers` is keyed by scheme, and an unbound scheme is an **empty
slot** decided by a table read, with no host call. Two cases, exactly as #348
ruled: a reference publishing a `scheme` dispatches; a reference publishing none
is a path against the root binding, where a colon is an ordinary character.

Three shapes fell out of implementing it:

- **A handler answers elements, not text.** A store-backed handler answers
  characters through `StoreHandler`, which reuses the path plane's normalization
  so a scheme cannot spell a path the root would refuse. A handler that already
  holds a value answers that value, which is what lets a clock be an entry
  without every reader parsing an instant back out of characters.
- **Attenuation is a property of the type.** `restrict` intersects and nothing
  adds, so a child harness's table is a subset of its parent's by construction.
  There is no widening operation to audit for.
- **A handler's resource is a leaf.** What lies below `'https://host/a'` is the
  handler's business, so extending one is `$!.resource-not-extensible` rather
  than a path this binding composes.

Installation authority is harness-only, and structurally so: the table is a
TypeScript value, held privately, absent from `visibleKeys()`, with no HC
spelling that installs, replaces, or enumerates an entry.

## 3. `%…%` versus `%%`: the operator keeps the doubled spelling

**Ruling: `%…%` is a single-delimiter atom. `%%` stays Modulo, and there is no
empty time literal.**

a03 settled `"` against `"""` with run-length parity, but the cases are not
analogous, and the asymmetry is the reason: the doubled quote was an unused
spelling, while `%%` is an operator with behavior and an acceptance corpus. The
parity rule would have bought an empty instant — a value with no meaning, since
a time literal must name an instant or a displacement — at the price of an
operator that works.

The collision is therefore decided _inside_ the family rather than lost in the
lexer table: registering `%` as an exact key silently shadows the operator's
regex key, so the family recognizes the doubled delimiter and hands back the
operator. Both modulo spellings, infix `9 %% 4` and property `3.%%2`, are
unchanged.

## 4. Time literals draw the line at tzdata

- **An instant is offset-bearing.** `Z` or an explicit `±hh:mm`.
- **A bare date is the start of that UTC day.** A day boundary has to be pinned
  somewhere, and UTC is the only choice that is not ambient.
- **A civil time with no offset is refused**, `$!.time-offset-required`. It
  cannot become an instant without tzdata, which is externally mutable data
  revised by political decision, and drawing the line the other way would pull
  that into the trusted base. Named-zone conversion is a handler entry.
- **A duration is fixed-length.** Weeks, days, hours, minutes, seconds. `%P1Y%`
  and `%P1M%` are `$!.time-duration-calendar`, because a month is not a
  displacement and admitting it would put calendar rules in the trusted base.
- **Both render canonically**, so output re-reads as the same value rather than
  as the spelling that produced it. This is the same rule #368 applied to
  symbols.
- **Values are exact nanoseconds.** A scaling that would not land on a whole
  nanosecond is `$!.time-inexact` rather than a rounded answer, and an inexact
  scalar is refused for the same reason.

## 5. The dimensional table is written once

`lib/frames/dimensional-algebra.ts` names every combination that means something
over `point`, `interval`, and `scalar`. Datetime and duration are a two-element
instance of it rather than a special case of time, so #362's T3 consumes the
same table instead of restating the same rules for dimensioned quantities. An
instant is a point, a duration is an interval, and a dimensioned quantity is an
interval on its own line.

The omissions are the ruling as much as the entries: `+ point point` has no
meaning without an origin the values do not carry, and `- interval point` is
refused because subtraction is ordered.

One numeric-tower change was needed. `join` short-circuits on a null rank, so a
right operand now gets one chance to define an operation its left cannot
(`combineFrom`), which is what makes `2 * %PT30M%` mean what `%PT30M% * 2`
means. Every ranked type answers `undefined`, so no existing domain error
changed.

## 6. `now` is a grant, spelled as a read

The clock is a handler entry under the `clock` scheme, and `'clock:now'` answers
one instant. There is no ambient `now` to name. Real, frozen, and scripted
clocks are three entries rather than three modes, and a budget is a duration
plus a clock, where exhaustion is the clock refusing — which is the whole of
#277's time budgets, without a limiter subsystem.

A refused program gets no reading, whether the scheme was never bound or the
clock declined, and either way the refusal is an ordinary value rather than
something that raises. It is **not** true that the two are indistinguishable —
see the note below.

## 7. One harness's flags

The CLI's `-A` is retired. `--allow-read --allow-write --allow-env` is what the
harness needs, and `--deny-run --deny-ffi` is a hard floor because either
authority voids every path scope above it. `cli/CLAUDE.md` records that the list
is a derived artifact of one harness, since `hcweb.html` has none to express and
relies on the same confinement.

`--no-prompt` is deliberately absent. a07 §7 makes it moot rather than
important: the run phase has no inbound channel, so there is no prompt to
disable.

## Noted, not resolved here

- **Refusal names are a discrimination channel, and a07 §7 says they must not
  be.** §7 asks that an ungranted resource be nonexistent rather than forbidden,
  so a program "cannot distinguish 'exists but refused' from 'does not exist'".
  What ships is the opposite, and not only for the clock: a10 made refusals
  nameable, so `$!.resource-scheme-unbound`, `$!.resource-absent`,
  `$!.resource-escaped-root`, and `$!.clock-exhausted` are four different values
  a program can read. A program can therefore learn whether its host bound a
  clock at all.

  Shipped as-is for two reasons: collapsing them would make an unbound scheme
  lie about itself, and #367 specifies and pins that exact refusal; and a budget
  that says why it stopped is debuggable where one that plays dead is not. But
  the ruling has not been made. Either §7 weakens to "no ungranted operation
  succeeds", or the vocabulary gains a split where the program sees one spelling
  and the exported note carries the reason — which is the shape §7 already
  implies, since it has notes _exported_ rather than returned.

  Recorded rather than fixed, because it predates this group and changing it
  edits every resource refusal rather than the clock.
- **Typed resources.** A handler answers elements, which is enough for a clock,
  but the element _type_ still does not travel with a resource. Nothing here
  makes that harder.
- **Leap seconds.** A `:60` second is refused as malformed. The alternative
  needs a leap-second table, which is the same externally mutable data as
  tzdata.
- **Named-zone conversion.** Ruled a handler's business, and no handler for it
  ships.
