#!/usr/bin/env hc #
```
# BitScheme Tutorial/Specification
Draft 0.2, 2019-09-07

Declaratively parse, manipulate and generate binary data

BitScheme is a lightweight data format for describing arbitrary sequences of binary data ("bitstreams", like those used for programming FPGAs).[^fpga] It also doubles as a scripting language for manipulating those bitstreams -- what is sometimes called a DREADFUL.[^dreadful]

BitScheme files use "hc" (as in [Homoiconic C](https://github.com/TheSwanFactory/hclang)) as the file extension, and must contain that string in an opening "!#" shebang.[^shebang]

[^fpga]: [Field-Programmable Gate Array](https://en.wikipedia.org/wiki/Field-programmable_gate_array)

[^dreadful]: Declaratively Rendered Executable Abstract Data Format Un-Language

[^shebang]: [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)), aka hashbang
```
#!/use/bin/env hc
```

While you can write parsers in other languages to read the BitScheme format, BitScheme files can also be executed directly from the command line to parse or generate bitstreams. BitScheme can also be run as a REPL.[^repl] The REPL uses ``; `` as the input prompt and ``# `` for the output (plus ``# # `` for multi-line prompts), which is also the format we will use for code examples in this document.

[^repl]: [Read–Eval–Print Loop](https://en.wikipedia.org/wiki/Read–eval–print_loop)

## Syntax

BitScheme syntax is mostly just Identifiers and Grouping.

### Identifiers
#### Literals

The simplest Identifiers are Literals, e.g.:
```
; 12345 # Decimal
# 12345
; 0b101 # Binary
# 0b101
; 0xdeadbeef # Hexadecimal
# 0xdeadbeef
```
##### String (quoted, utf-8)
```
; `Hello`
# `Hello`
;
```
##### ByteString
```
; \5\Hello
# \5\Hello
```
Byte-string lengths can also resolve an already evaluated integer symbol:
```
; .v 4;
; .h 2;
; .size (v * h);
; \size\01234567
# \8\01234567
```
You can also use triple-backquotes for docstrings in [GitHub Flavored Markdown](https://github.github.com/gfm/) format. If you pass a ".md" file to bitscheme, it will prepend the backquotes, execute the code blocks, and warn if the evaluated input does not match the expected output.

Comment strings (using "#") are also considered a type of Literal:
```
; 1234 # trailing comment
# 1234
; #  inline comment before # 4321
# 4321
```

#### Expressions

Identifiers can be combined into Expressions. The default behavior is concatenation:
```
; 0b1101 0b0110
# 0b11010110
; `Hello` ` World`
# “Hello World”
```
#### Symbols

BitScheme also supports Symbolic Identifiers, which use prefix sigils for different usages:
##### .Name (setter)
```
; .the_answer 42;
```
##### Value (getter)
```
; the_answer
# 42
```
##### $Error
```
; ther_answer
# $!.name-missing...
```
##### Alias
```
; @the_answer 7;
; the_answer
# 7
```
Symbols with only non-alphanumeric characters (e.g., "+") are called Operators rather than Identifiers. There are four universal binary Operators in the standard library, which can be used with any Value:

- "?" if-then
- ":" if-else
- "|" map
- "&" reduce

The **|** and **&** operators operate over enumerable elements. Use **&&** to map over properties.

See **Operator Syntax** below for more details.

### Grouping
#### Terminals

Elements are separated using Terminals:
##### newline
```
; `Terminal Expression`
# `Terminal Expression`
```
##### comma
```
; `Expression1`,`Expression2`
# (`Expression1`, `Expression2`)
```
##### semicolon
```
; `Statement`;
```

#### Delimiters
Elements are aggregated using pairs of Delimiters:
##### [] Boxed
```
; [1, 2, 3]
# [1, 2, 3]
```
##### () Unboxed
```
; (0b1 0b0)
# 0b10
```
##### <> Schema (i.e. type; see below)
```
; .Bit <0b0, 0b1>;
```
##### {} Deferred
```
; .AppendZero {_ 0b0};
; AppendZero
# { _ 0b0 }
; AppendZero 0b1
# 0b10
```
#### Properties

Names can be used as properties to extract values from Groupings:
```
; .grp [.a 1; .b 2;];
; grp.a
# 1
```

#### Operator Syntax

Operators are actually just non-alphanumeric properties.
##### _nil_, the empty expression
```
; .false ();
```
##### _all_, the inclusive schema
```
; .true <>;
```
##### Conditional
```
; true ? {`Yes`}
# `Yes`
; () : {`No`}
# `No`
```
##### Map
```
; [0b101, 0b010] & AppendZero
# [0b1010, 0b0100]
```
##### Reduce

Concatenation is what a blob does when applied, so reducing blobs joins them.
There is no empty-bit spelling to start from, so the head is the receiver and the
tail is the stream; a zero-width accumulator is `#375`.
```
; [0b0100] | 0b1010
# 0b10100100
```

## Implementation Status

This specification distinguishes four statuses:

* **implemented** examples are executable assertions and must pass;
* **stale** syntax is shown only when explaining its current replacement;
* **aspirational** examples are executable assertions marked `$!.unimplemented`;
* **environment-dependent** operations, such as writing generated data files, remain non-executable documentation.

The schema and capture gaps are tracked by [#310](https://github.com/TheSwanFactory/hclang/issues/310). The framebuffer example ([#311](https://github.com/TheSwanFactory/hclang/issues/311)) is implemented; the RISC-V example is tracked by [#312](https://github.com/TheSwanFactory/hclang/issues/312).

## Schemas

Schemas can be thought of as a cross between type signatures and regular expressions. Each element of a schema is called a _capture_. Numeric enumeration constraints and the minimal deterministic retrieval and deconstruction forms are implemented. Deterministic constructors, capture lengths that depend on earlier captures, literal fields, and ordered choice and repetition inside bit layouts are implemented; user-defined capture units remain aspirational.

### Numeric Constraints (implemented)

The current declaration syntax binds a schema and an initial value in one expression:
```
; .enum123 <1,2,3> 2
# .enum123 2
; enum123
# 2
; @enum123 4
# $!.type-error .enum123 <1, 2, 3> 4
```

### Schema Retrieval and Captures (implemented, #310)

The `<^>` property retrieves the schema attached to the binding; `.<>` observes
the runtime type:
```
; enum123.<^>
# <1, 2, 3>
```

Fixed-width captures require an exact-width blob. A remainder capture consumes the complete blob:
```
; <8@Bit> 0xff
# 0xff
; <[@Bit]> 0b101
# 0b101
```

### Minimal Deconstructors (implemented, #310)

Property selectors extract direct properties in schema order. A schema-only statement defines a callable deterministic bit splitter:
```
; <.x, .z> [.x 1; .y 2; .z 3;]
# [1, 3]
; .BitSplitter3 <[.head <3@Bit>; .tail <[@Bit]>;]>;
; BitSplitter3 0b10101100
# [.head 0b101; .tail 0b01100;]
```

`@Bit` is the built-in single-bit unit. `@Byte` defaults to eight bits, and an
explicit `Byte` binding to an exact bit schema overrides that default. Other
user-defined capture-unit aliases remain deferred:
```
; .Byte <8@Bit>;
```

### Constructors and Deferred Captures (implemented, #310)

Applying a bit capture to a nonnegative integer (a Count or computed Int)
constructs a binary blob, padding to the
requested width. An integer that does not fit is refused. A remainder capture uses
the minimum width, with one bit for zero. A zero-width capture is refused with
`$!.bit-width 0` until empty blobs are supported (#375). Binding and membership still validate
blobs without converting integers:
```
; <8@Bit> 5
# 0b00000101
; <2@Bit> 5
# $!.bit-width 2
; <[@Bit]> 0
# 0b0
; 5 ~ <8@Bit>
# ()
```

A blob enumerates its bits as Counts, most significant first, including leading
zeros. Decoding uses ordinary HC application and reduction:
```
; 0b00101 | []
# [0, 0, 1, 0, 1]
; .Decode {[.n _; .apply_ {@n (n * 2 + _);}]};
; (0b101 | (Decode 0)).n
# 5
```

The same bit stream feeds all element consumers. Blob `*` makes Cartesian bit
pairs and `|&|` zips bits; `[] + blob` collects bits, and text `+ blob` joins
decimal bit spellings. Applying an integer `0` or `1` to a blob appends that bit,
so blob `+` still concatenates and folding bits into a blob rebuilds them.
`.###.loads` observes the bit values and `.####` derives their KD coordinates.

Reducing a bit layout into an object selects and validates its captures in
schema order, ignoring extra fields. The constructor deliberately returns a
capture list, as the original `BS3_sequence` claim specifies. The resulting
sequence can be joined by applying the tail to the
head; the earlier `& {. _}` claim used stale syntax: `&` maps and keeps a
sequence rather than concatenating it:
```
; .BS3_sequence (BitSplitter3 | [.head 0b000; .tail 0b111;]);
; BS3_sequence
# [0b000, 0b111]
; [BS3_sequence.1] | BS3_sequence.0
# 0b000111
```

A deferred capture is a read-only closure that receives the earlier named
captures and returns a bit schema. `@Byte` uses the `Byte` binding above;
when a width is a blob, its unsigned value supplies the length. Captures keep
their exact binary width. The input must be consumed completely, so the old
example's extra trailing `66666666` is omitted. A prefix parser must declare an
explicit terminal remainder capture, such as `.rest <[@Bit]>`. Binary rendering
preserves the width of each captured field rather than the input's hex base:
```
; .NetString <[.n <4@Bit>; .string {<n@Byte>};]>;
; NetString 0x548656c6c6f
# [.n 0b0101; .string 0b0100100001100101011011000110110001101111;]
```

## Example A: Symbolicated Frame Buffer (implemented, #311)

This example parses a header and a command stream, carries captures from one
command into the next, and renders the result with symbolic names.

The bitstream starts with a 5-byte start marker, and each command starts with a
4-bit opcode. The original marker, `0xf4m3b0ff3c`, is not hexadecimal, so the
example uses `0xf4a3b0ff3c`:
```
; .fb-start 0xf4a3b0ff3c;
; .op [.x 0xa; .y 0xb; .data 0xc;];
```

Inside a bit layout, a capture whose schema holds blobs is a literal field. It
consumes the width of the blob it matches and compares bits rather than
spellings, so `0b1010` matches `0xa`, then answers the blob as declared. Outside
a bit layout, `<0xa>` is still an ordinary enumeration. The _x_ and _y_ commands
carry the display width and height:
```
; .parse-x <[.op <op.x>; .width <2@Byte>;]>;
; .parse-y <[.op <op.y>; .height <2@Byte>;]>;
; parse-x 0xa0004
# [.op 0xa; .width 0b0000000000000100;]
; parse-x 0xb0004
# $!.bit-literal-mismatch .op 0
```

Those values size the data buffer. A deferred capture receives every capture
made earlier in the same parse, including the captures of earlier commands, so
the _data_ command reads the width and height captured before it. Nothing
outside the parse is written. Blob `*` pairs bits rather than multiplying, so
`value` decodes each dimension with the `Decode` closure from above:
```
; .value {(_ | (Decode 0)).n};
; .pixel 2;
; .parse-data <[.op <op.data>; .fb-data {<((value width) * (value height) * pixel)@Byte>};]>;
```

Inside a bit layout, a schema of bit layouts is an ordered choice: the first
option that matches at the cursor wins. `<[command]>` repeats a layout until
the input ends and answers the list of each element's captures. Like a
remainder, a repetition must be the last capture:
```
; .command <parse-x, parse-y, parse-data>;
; .fb-parse <[.start <fb-start>; .commands <[command]>;]>;
```

For simplicity, assume a really small 4 x 2 display with 2-byte pixels:
```
; .mvga-x 0x0004;
; .mvga-y 0x0002;
; .mvga-data (0x0000 0x0001 0x0010 0x0100 0xffff 0xfff0 0xff00 0xf000);
; .fb-bits (fb-start op.x mvga-x op.y mvga-y op.data mvga-data);
; fb-bits
# 0xf4a3b0ff3ca0004b0002c0000000100100100fffffff0ff00f000
```

The bitstream parses back to its marker and commands. The payload keeps all 128
bits, rendered in binary like every captured field:
```
; fb-parse fb-bits
# [.start 0xf4a3b0ff3c; .commands [[.op 0xa; .width 0b0000000000000100;], [.op 0xb; .height 0b0000000000000010;], [.op 0xc; .fb-data 0b00000000000000000000000000000001000000000001000000000001000000001111111111111111111111111111000011111111000000001111000000000000;]];]
```

A data command that comes before the dimensions fails, because its deferred
capture has no width to read yet; the error names the field and the missing
capture. An opcode that no command starts with fails
at its position:
```
; fb-parse (fb-start op.data mvga-data)
# $!.capture-missing .fb-data width
; fb-parse (fb-start 0xd)
# $!.no-bit-alternative .commands.0 40
```

To display symbolic values, map the parsed captures back to names without
changing the parse. `symbol` answers the name in `symbols` whose value has the
same bits, and otherwise answers the value unchanged, so the raw payload stays
as it is. `&&` streams each command's captures as `[key, value]` tuples:
```
; .symbols [.fb-start fb-start; .x op.x; .y op.y; .data op.data; .mvga-x mvga-x; .mvga-y mvga-y;];
; .symbol {.v _; .hits ((symbols && {.t _; ((t.1 | []) = (v | [])) ? {[t.0]} : {[]}}) &| {_}); ((hits.#) = 0) ? {v} : {hits.0}};
; .fb-sym {.p (fb-parse _); [symbol p.start, p.commands & {_ && {.t _; [t.0, symbol t.1]}}]};
; fb-sym fb-bits
# [.fb-start, [[[.op, .x], [.width, .mvga-x]], [[.op, .y], [.height, .mvga-y]], [[.op, .data], [.fb-data, 0b00000000000000000000000000000001000000000001000000000001000000001111111111111111111111111111000011111111000000001111000000000000]]]]
```

## Example B: RISC-V (aspirational, #312)

The following RV32I schema remains non-executable documentation because fixed-length captures and schema constructors are not implemented:

    .OP <7@Bit> (.Register <0b0110011>; .Load 0b0000011; .Math 0b0010011; .Immediate <Load, Math>; .Upper <0b0110111, 0b0010111>; .Store <0b0100011>; .Branch <0b1100011>; .Jump <0b1101111>;);
    .FUNCT3 (.funct3 <3@Bit>;);
    .FUNCT7 (.funct7 <7@Bit>;);
    .RD (.rd <5@Bit>);
    .RS1 (.rs1 <5@Bit>);
    .RS2 (.rs2 <5@Bit>);
    .SOURCE (RS2, RS1, FUNCT3);
    .Register <[FUNCT7, SOURCE, RD, OP.Register]>;
    .Immediate <[.imm11-0 <12@Bit>, RS1, FUNCT3, RD, .opcode OP.Immediate]>;
    .UpperImmediate <[.imm31-12 <20@Bit>, RD, .opcode OP.Upper]>;
    .Store <[.imm11-5 <7@Bit>, SOURCE, .imm4-0 <5@Bit>, .opcode OP.Store]>;
    .Branch <[.b12 <Bit>, .imm10-5 <6@Bit>, SOURCE, .imm4-1 <4@Bit>, .b11 <Bit>, .opcode OP.Branch]>;
    .Jump <[.b20 <Bit>, .imm10-1 <10@Bit>, .b11 <Bit>, .imm19-12 <8@Bit>, RD, .opcode OP.Jump]>;
    .RISC-V <Register, Immediate, UpperImmediate, Store, Branch, Jump>;
    .func (.add 0b000; .slt 0b010; .xor 0b100; .or 0b110; .and 0b111;);
    .addi <[.value, .source, .dest]> ^ {value source func.add dest OP.Math};

Construction, parsing, and generation are tracked independently so each future result can remove one marker:
```
; addi[0b000000001011, 0b01010, 0b00111]
# $!.unimplemented 0b00000000101101010000001110010011
; RISC-V 0b00000000101101010000001110010011
# $!.unimplemented [.imm11-0 0b000000001011; .rs1 0b01010; .funct3 0b000; .rd 0b00111; .opcode 0b0010011;]
; RISC-V | [.imm11-0 0b000000001011; .rs1 0b01010; .funct3 0b000; .rd 0b00111; .opcode 0b0010011;]
# $!.unimplemented [0b000000001011, 0b01010, 0b000, 0b00111, 0b0010011]
```

Writing the generated bytes to a data file is environment-dependent and intentionally remains non-executable documentation. The executable specification ends here.
```
