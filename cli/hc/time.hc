#!/usr/bin/env hc
```
Datetime and duration (#369), and the clock as a grant (#370)

These examples are the executable acceptance corpus for the `%…%` family. A time
literal is inert data: like `'…'` it denotes without authorizing, and parsing one
performs no observation. Reading the current instant is a separate thing, and it
is a harness grant.

An instant is offset-bearing, and it renders canonically in UTC, so output
re-reads as the same value rather than as the spelling that produced it
```
; %2026-08-21T00:00:00Z%
# %2026-08-21T00:00:00Z%
; %2026-08-21T08:30:00-07:00%
# %2026-08-21T15:30:00Z%
; %1970-01-01T00:00:00.5Z%
# %1970-01-01T00:00:00.5Z%
```
A date alone is the start of that UTC day. A day boundary has to be pinned
somewhere, and UTC is the only choice that is not ambient
```
; %2026-08-21%
# %2026-08-21T00:00:00Z%
; %2024-02-29%
# %2024-02-29T00:00:00Z%
```
A civil time with no offset is refused rather than guessed. It cannot become an
instant without tzdata, which is externally mutable data revised by political
decision, so named-zone conversion is a handler's business and never a literal's
```
; %2026-08-21T08:30:00%
# $!.time-offset-required %2026-08-21T08:30:00%
```
A date the calendar does not have is refused, and so is anything else the
spelling cannot mean
```
; %2026-02-29%
# $!.time-malformed %2026-02-29%
; %2026-13-01%
# $!.time-malformed %2026-13-01%
; %nonsense%
# $!.time-malformed %nonsense%
```
A duration is a peer type, fixed-length, and it also renders canonically
```
; %PT1H%
# %PT1H%
; %PT90M%
# %PT1H30M%
; %P1W%
# %P7D%
; %PT0S%
# %PT0S%
```
A calendar quantity is refused, because a year and a month are not
displacements: admitting them would put calendar rules in the trusted base
```
; %P1Y%
# $!.time-duration-calendar %P1Y%
; %P1M%
# $!.time-duration-calendar %P1M%
; %PT1M%
# %PT1M%
```
The algebra is enforced, and enforced from one dimensional table rather than from
rules spelled per operator. An instant is a point, a duration is an interval, and
the difference of two points is the interval between them
```
; %2026-08-22T00:00:00Z% - %2026-08-21T00:00:00Z%
# %P1D%
; %2026-08-21T00:00:00Z% + %P1D%
# %2026-08-22T00:00:00Z%
; %P1D% + %2026-08-21T00:00:00Z%
# %2026-08-22T00:00:00Z%
; %PT1H% * 3
# %PT3H%
; 2 * %PT30M%
# %PT1H%
```
The fourth row is a type error, and it is a value like any other refusal
```
; %2026-08-21T00:00:00Z% + %2026-08-21T00:00:00Z%
# $!.numeric-domain + FrameDateTime FrameDateTime
; %2026-08-21% * 2
# $!.numeric-domain * FrameDateTime FrameInt
; %PT1H% + 1
# $!.numeric-domain + FrameDuration FrameInt
; 1 + %PT1H%
# $!.numeric-domain + FrameInt FrameDuration
```
Division follows the same table: an interval over a scalar is an interval, and an
interval over an interval is the plain number relating them
```
; %PT1H% / 2
# %PT30M%
; %P1D% / %PT1H%
# 24
; %PT1H% / %P1D%
# 1/24
```
Arithmetic is exact, so a scaling that would not land on a whole nanosecond is
refused rather than rounded into place
```
; %PT1H% * 1.5
# %PT1H30M%
; %PT1S% / 3
# $!.time-inexact / FrameDuration FrameInt
; (%PT1S% * 1000000000) / 1000000000
# %PT1S%
```
Peers of one kind order, and the two kinds do not order against each other
```
; %PT1H%.< %PT2H%
# <>
; %2026-08-21%.> %2026-08-20%
# <>
; %2026-08-21T15:30:00Z% = %2026-08-21T08:30:00-07:00%
# <>
; %PT1H%.< %2026-08-21%
# $!.numeric-domain < FrameDuration FrameDateTime
```
`%%` is Modulo and keeps the doubled spelling. a03 settled `"` against `"""` with
run-length parity, but the cases are not analogous: the doubled quote was an
unused spelling, while this one is an operator with behavior. An empty time
literal would name nothing, so the family hands `%%` back rather than taking it
```
; 9 %% 4
# 1
; 3.%%2
# 1
```
`now` is an observation, so it is not ambient and there is no bare name for it.
The clock is a handler entry, and this harness installed the real one: what is
deterministic about a real clock is that its reading is an instant already past
```
; $$.now
# $!.name-missing $$.now
; ('clock:now' | []) .0 .> %2000-01-01T00:00:00Z%
# <>
; (('clock:now' | []) .0 - %2000-01-01T00:00:00Z%) .> %P1D%
# <>
```
The same source is byte-identical under a frozen or scripted clock, where the
reading is pinned; only the installed entry decides what it answers. Refusal
reaches the program the same way for an absent clock and a spent one, so there is
nothing here to probe a host with
```
; 'clock:now' “2020-01-01”
# $!.clock-read-only 'clock:now'
; 'clock:yesterday' | []
# [$!.clock-unreadable 'clock:yesterday']
