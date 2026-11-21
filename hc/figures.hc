#!/usr/bin/env hc
```
Figures — native Count, Size, Denumeration and KD observations (FOIST 19a)

Figures are projections of ordinary HC Frames; they do not require a special
constructor. The immediate child Count is .#, and the structural terminal
Size is .##. The third hash .### now constructs the raw Denum of immediate
child Sizes. The fourth hash .#### reads signed KD coordinates.

The former alternate-residual Gap/Spin abbreviations and the native Star
terminal-replacement contract were historical Figure investigations, not
the new public FOIST operators. Structural + Flops; * constructs the ordered
Cartesian pairs of immediate children. KD multiplication is &|& and returns
a Denum. Historical examples remain in pre-0.54.0 Git history.

This module exports no Figure constructor or retired observer wrappers.
```

```
Native Count and Size count immediate entries and structural leaves.
```
; .a []; .b [[]]; .e [a, b];
; [e.#, e.##, [].#, [].##]
# [2, 2, 0, 1]
; [[[], []].##, [[], [[], []]].##, [[]].#]
# [2, 3, 1]

```
Raw Denumeration is not an alternating residual. KD coordinates are
an observation of antipodal half differences.
```
; “” [3, 1].###
# “Denum(2,[3, 1])”
; [3, 1].####
# [2]
; [3, 1, 5].####
# [-2, 1]
; [].####
# []

```
Flop applies the second Frame's children to the receiver in order.
Cart enumerates ordered pairs, not recursive leaf replacement.
```
; [1, 2] + [3, 4]
# [1, 2, 3, 4]
; [1, 2] * [3, 4]
# [[1, 3], [1, 4], [2, 3], [2, 4]]
; [1, 2] * []
# []
; [[1], [2]] * [[3]]
# [[[1], [3]], [[2], [3]]]

```
Native incidence and immediate identity still use shared Frames.
```
; .shared [[]]; .p1 [shared, []]; .p2 [[], shared];
; [shared ~~~ p1, shared ~~~ p2, [[]] ~~~ p1]
# [<>, <>, ()]

```
Scalar numeric arithmetic and modulo remain ordinary HC numeric operators.
The retired geometric hash suffixes are no longer installed.
```
; [2 + 3, 2 * 3, 7 %% 2]
# [5, 6, 1]
; 3.###%
# $!.name-missing .###%

```
The imported file ends with a native true value; nothing is installed in
its caller's scope except the file binding.
```
[] = []
