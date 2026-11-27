#!/usr/bin/env hc
```
HLIR — primitive types as schema candidates (#536)
Import with `HLIR <- './hc/hlir.hc'`. Each name is a value you put inside a
schema: `.x <HLIR.i32> 42` binds 42, `2147483648 ~ <HLIR.i32>` is nil.
The fixed widths are predicate closures, so a schema calls them with the
value and admits it unless the answer is nil or an error.
i8 i16 i32 i64 admit an Int v with -2^(w-1) <= v < 2^(w-1); u8 u16 u32 u64
admit a Count v with v < 2^w; index is any Count; f64 is the Number type.
`int w` and `uint w` build the predicate for any other width.
Binding never converts the value (#410), so 3.14 is refused by <i32> and
narrowing is explicit: floor, trunc and round (half away from zero) answer
the Int rung, and `.whole <i32> (trunc 3.14)` binds 3. They take exact
values only (Count, Int, Decimal, Rational), because they are built on `%%`:
`floor (1 / 3.0)` answers `$!.numeric-domain %% FrameNumber FrameCount`.
`record [.re f64; .im f64]` admits an aggregate with exactly those
properties, each matching its type; `tensor [[2, 3], f64]` admits a 2x3
array of arrays whose leaves match f64.
f32 and encode/decode against bit layouts are not here yet.
```
```
Naming rule: inside a closure a bare name is read from the argument first,
so with a decimal argument a letters-only captured name becomes a typed
number (`1.5.lo`). Every name a predicate reads from an enclosing scope is
therefore hyphenated (`int-lo`, `hlir-leaf`), which cannot be a unit.
```
.int {.w _; .int-lo (0 - (2 ** (w - 1))); .int-hi (2 ** (w - 1));
  {.v _; (v ~ (0 - 1).<>) ? {(v.>= int-lo) ? {v.< int-hi} : {()}} : {()}}};
.uint {.w _; .uint-hi (2 ** w); {.v _; (v ~ 0.<>) ? {v.< uint-hi} : {()}}};
.i8 (int 8);
.i16 (int 16);
.i32 (int 32);
.i64 (int 64);
.u8 (uint 8);
.u16 (uint 16);
.u32 (uint 32);
.u64 (uint 64);
.index 0.<>;
.f64 (1 / 3.0).<>;
.floor {.x _; (x - (x %% 1)) / 1};
.trunc {.x _; (x - (x %% ((x.< 0) ? {0 - 1} : {1}))) / 1};
.round {.x _; .y (x + ((x.< 0) ? {0 - (1 / 2)} : {1 / 2})); (y - (y %% ((x.< 0) ? {0 - 1} : {1}))) / 1};
.record {.hlir-fields _; .hlir-arity ((hlir-fields && {_}).#);
  {.v _; (((v && {_}).#) = hlir-arity) ? {(((hlir-fields && {.t _; .key (t .0); ((v key) ~ <(hlir-fields key)>) ? {[]} : {[key]}}) &| {_}).#) = 0} : {()}}};
.tensor {.hlir-shape (_ .0); .hlir-leaf (_ .1);
  (((hlir-shape.#) = 0) ? {[{.v _; v ~ <hlir-leaf>}]} : {.hlir-rows (hlir-shape .0); .hlir-inner (tensor [(hlir-shape | {[]}), hlir-leaf]);
    [{.v _; (v ~ [].<>) ? {((v.#) = hlir-rows) ? {((v &| {(hlir-inner _) ? {[]} : {[1]}}).#) = 0} : {()}} : {()}}]}) .0};
