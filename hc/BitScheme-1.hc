#!/usr/bin/env hc #
```
=== Constructors

We can also reverse the flow, by mapping capture keys to a dictionary to generate a sequence of values:
```
; .BS3_sequence (BitSplitter3 .& [.head 0b000; .tail 0b111;])
# [0b000, 0b111]

```
The sequence can then be evaluated by folding it into an expression:
```
; BS3_sequence .| ()
# 0b000111
```

=== Deferred Captures
To reuse the results of previous captures, enclose the referencing capture in brackets to defer evaluation:
```
; .NetString <[.n <4@Bit>; .string {<n@Byte>};]>;
; NetString 0x548656c6c6f666666666 # 5:Hello + sixes
# [.n 0x5; .string 0x48656c6c6f;] # Hello

```

== Example A: Symbolicated Frame Buffer

This example demonstrates:

* parsing named and unnamed captures
* reusing variables across scopes
* symbolicating output

The bitstream starts with a 5-byte magic number for the _header_:
```
; .fb-start 0xf4m3b0ff3c;
```
After that come an arbitrary series of one of three _commands_.  Each command starts with a 4-bit _operation_:
```
; .op {
# # .x 0xa
# # .y 0xb
# # .data 0xc
}
```
The _x_ and _y_ operations are to set the top-level _width_ and _height_ variables, respectively:
```
; .width <2 @Byte>;
; .height <2 @Byte>;
; .parse-x <op.x; @width>;
; .parse-y <op.y; @height>;
```
Those variables then determine the size of the data buffer in bytes:
```
; .pixel <2 @Byte>;
; .parse-data <op.data; .fb-data <width height pixel>>;
; .command <parse-x, parse-y, parse-data>;
; .fb-parse <fb-start, [command]>;
```
For simplicity, let's assume a really small 4 x 2 display:
```
; .sizes {.mvga-x 0x0004; .mvga-y 0x0002;};
; .mvga-data [0x0000 0x0001 0x0010 0x0100 0xffff 0xfff0 0xff00 0xf000];

```
The bitstream then becomes:
```
; .fb-bits (fb-start op.x mvga-x op.y mvga-y op.data mvga-data);
```
which parses back to:
```
; fb-parse fb-bits
# [0xf4m3b0ff3c, @width 0x0004, @height 0x0002, .fb-data 0x0000000100100100fffffff0ff00f000]
```
If we would rather display symbolic values, we instead have the captures reverse-map ("|>") into the names:
```
; .sym-x <parse-x |> sizes>;
; .sym-y <parse-y |> sizes>;
; .sym-commands <sym-x, sym-y, parse-data>;
; .fb-sym <fb-start |> @fb-start, [sym-commands]>;
; fb-sym fb-bits
# [{fb-start}, {@width mvga-x}, {@height mvga-y}, .fb-data 0x0000000100100100fffffff0ff00f000]

```

== Example B: RISC V

To see how this works for more complex data, we will construct Schema for the six https://en.wikipedia.org/wiki/RISC-V#ISA_base_and_extensions[32-bit RISC-V Instruction Formats].

=== Fields
We start by defining captures for the various sub-fields used by RISC V instructions (as used by RV 32I):

```
; .OP <7@Bit> (
# # .Register <0b0110011>;
# # .Load 0b0000011;
# # .Math 0b0010011;
# # .Immediate <Load, Math>;
# # .Upper <0b0110111, 0b0010111>;
# # .Store <0b0100011>;
# # .Branch <0b1100011>;
# # .Jump <0b1101111>;
# # );
; .FUNCT3 (.funct3 <3@Bit>;);
; .FUNCT7 (.funct7 <7@Bit>;);
; .RD (.rd <6@Bit>);
; .RS1 (.rs1 <5@Bit>);
; .RS2 (.rs2 <5@Bit>);
; .SOURCE (RS2, RS1, FUNCT3);
```

=== Schema
These Identifiers allow us to define our top-level Schema very concisely:

```
; .Register <[FUNCT7, SOURCE, RD, OP.Register]>;
; .Immediate <[.imm11-0 <12@Bit>, RS1, FUNCT3, RD, .opcode OP.Immediate]>;
; .UpperImmediate <[.imm31-12 <20@Bit>, RD, .opcode OP.Upper]>;
; .Store <[.imm11-5 <7@Bit>, SOURCE, .imm4-0 <5@Bit>, .opcode OP.Store]>;
; .Branch <[.b12 <Bit>,.imm10-5 <6@Bit>, SOURCE, .imm4-1 <4@Bit>,.b11 <Bit>, .opcode OP.Branch]>;
; .Jump <[.b20 <Bit>,.imm10-1 <10@Bit>, .b11 <Bit>, .imm19-12 <8@Bit>, RD, .opcode OP.Jump]>;
; .RISC-V <Register, Immediate, UpperImmediate, Store, Branch, Jump>;

```
==== Immediate Helpers

We can also define helper properties to reconstitute immediates:
```
; @Immediate.immediate { imm11-0 };
; @UpperImmediate.immediate { imm31-12 (12 0b0)};
; @Store.immediate { imm11-5 imm4-0 };
; @Branch.immediate { b12 b11 imm10-5 imm4-1 0b0};
; @Jump.immediate { b20 imm19-12 b11 imm10-1 0b0 };

```
==== Constructors

Constructors allow us to natively write assembly as an internal DSL.footnote:[https://en.wikipedia.org/wiki/Domain-specific_language[Domain Specific Language]]. We use the `^` operator to bind a Schema to a deferred expression. For example:
```
; .func (.add 0b000; .slt 010; .xor 0b100; .or 0b110; .and 0b111;);
; .addi <[.value, .source, .dest]> ^ {value source func.add dest OP.Math };
```
```
; .r10 0b01010;
; .r7 0b00111;
; .v11 (7 0b0) 0b1011; # 11
; .add_11_to_r10_into_r7 addi[v11, r10, r7]
# 0b0000000101101010000001110010011
```
That is, "0b00000001011 01010 000 00111 0010011" with spaces added for clarity.

=== Usage

==== Generating Data Files

Having created our Schema, we can simply evaluate it to expand all the variables:
```
; RISC-V
```
The resulting output contains no variables, and can be used as a schema format for traditional parsers and generators.

==== Parsing

We can also apply this Schema to a 32-bit value to parse it into its components:
```
; .a11r10r7-parsed (RISC-V add_11_to_r10_into_r7)
# (.imm11 0b00000001011; .rs1 0b01010; .func3 0b000; .rd 0b00111; .opcode 0b0010011;)
```
More sophisticated parsers can of course render binary values as symbols for easier readability.

==== Generation

Similarly, we can map the Schema into a dictionary to generate a sequence, and thus a value:
```
; .a11r10r7-sequence (RISC-V .&& a11r10r7-parsed)
# [0b00000001011, 0b01010, 0b000, 0b00111, 0b0010011]
; a11r10r7-sequence .| ()
# 0b00000001011 01010 000 00111 0010011 # spaces added for clarity
```

== Next Steps

As of September 16, 2019 "hc" can evaluate all the primitives in this document except the operators (though only about half the tests pass).

My goal is to have this entire document working by the end of 2019.
