#!/usr/bin/env hc #
```
= BitScheme Tutorial/Specification
Draft 0.2, 2019-09-07

Declaratively parse, manipulate and generate binary data

BitScheme is a lightweight data format for describing arbitrary sequences of binary data ("bitstreams", like those used for programming FPGAs).footnote:[https://en.wikipedia.org/wiki/Field-programmable_gate_array[Field-Programmable Gate Array]] It also doubles as a scripting language for manipulating those bitstreams -- what is sometimes called a DREADFUL.footnote:[Declaratively Rendered Executable Abstract Data Format Un-Language]

BitScheme files use "hc" (as in https://github.com/TheSwanFactory/hclang[Homoiconic C]) as the file extension, and must contain that string in an opening "!#" shebang.footnote:[https://en.wikipedia.org/wiki/Shebang_(Unix)[shebang], aka hashbang]
```
#!/use/bin/env hc
```

While you can write parsers in other languages to read the BitScheme format, BitScheme files can also be executed directly from the command line to parse or generate bitstreams. BitScheme can also be run as a REPL.footnote:[https://en.wikipedia.org/wiki/Read–eval–print_loop[Read–Eval–Print Loop]]. The REPL uses ``; `` as the input prompt and ``# `` for the output (plus ``# # `` for multi-line prompts), which is also the format we will use for code examples in this document.

== Syntax

BitScheme syntax is mostly just Identifiers and Grouping.

=== Identifiers
==== Literals

The simplest Identifiers are Literals, e.g.:
```
; 12345 # Decimal
# 12345
; 0b101 # Binary
# 0b101
; 0xdeadbeef # Hexadecimal
# 0xdeadbeef
```
===== String (quoted, utf-8)
```
; `Hello`
# `Hello`
;
```
===== ByteString
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
You can also use triple-backquotes for docstrings in https://asciidoctor.org[asciidoc] format. If you pass a ".adoc" file to bitscheme, it will prepend the backquotes, execute the code blocks, and warn if the evaluated input does not match the expected output.

Comment strings (using "#") are also considered a type of Literal:
```
; 1234 # trailing comment
# 1234
; #  inline comment before # 4321
# 4321
```

==== Expressions

Identifiers can be combined into Expressions. The default behavior is concatenation:
```
; 0b1101 0b0110
# 0b11010110
; `Hello` ` World`
# “Hello World”
```
==== Symbols

BitScheme also supports Symbolic Identifiers, which use prefix sigils for different usages:
===== .Name (setter)
```
; .the_answer 42;
```
===== Value (getter)
```
; the_answer
# 42
```
===== $Error
```
; ther_answer
# $!.name-missing...
```
===== Alias
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

The *|* and *&* operators operate over enumerable elements. Use *&&* to map over properties.

See *Operator Syntax* below for more details.

=== Grouping
==== Terminals

Elements are separated using Terminals:
===== newline
```
; `Terminal Expression`
# `Terminal Expression`
```
===== comma
```
; `Expression1`,`Expression2`
# (`Expression1`, `Expression2`)
```
===== semicolon
```
; `Statement`;
```

==== Delimiters
Elements are aggregated using pairs of Delimiters:
===== [] Boxed
```
; [1, 2, 3]
# [1, 2, 3]
```
===== () Unboxed
```
; (0b1 0b0)
# 0b10
```
===== <> Schema (i.e. type; see below)
```
; .Bit <0b0, 0b1>;
```
===== {} Deferred
```
; .AppendZero {_ 0b0};
; AppendZero
# { _ 0b0 }
; AppendZero 0b1
# 0b10
```
==== Properties

Names can be used as properties to extract values from Groupings:
```
; .grp [.a 1; .b 2;];
; grp.a
# 1
```

==== Operator Syntax

Operators are actually just non-alphanumeric properties.
===== _nil_, the empty expression
```
; .false ();
```
===== _all_, the inclusive schema
```
; .true <>;
```
===== Conditional
```
; true ? {`Yes`}
# `Yes`
; () : {`No`}
# `No`
```
===== Map
```
; [0b101, 0b010] | AppendZero
# [0b1010, 0b0100]
```
===== Reduce
```
; [0b1010, 0b0100] & {. _}
# 0b10100100
```

== Implementation Status

This specification distinguishes four statuses:

* *implemented* examples are executable assertions and must pass;
* *stale* syntax is shown only when explaining its current replacement;
* *aspirational* examples are executable assertions marked `$!.unimplemented`;
* *environment-dependent* operations, such as writing generated data files, remain non-executable documentation.

The schema and capture gaps are tracked by https://github.com/TheSwanFactory/hclang/issues/310[#310]. The framebuffer example is tracked by https://github.com/TheSwanFactory/hclang/issues/311[#311], and the RISC-V example by https://github.com/TheSwanFactory/hclang/issues/312[#312].

== Schemas

Schemas can be thought of as a cross between type signatures and regular expressions. Each element of a schema is called a _capture_. Numeric enumeration constraints and the minimal deterministic retrieval and deconstruction forms are implemented. General alternatives, constructors, and deferred capture lengths remain aspirational.

=== Numeric Constraints (implemented)

The current declaration syntax binds a schema and an initial value in one expression:
```
; .enum123 <1,2,3> 2
# .enum123 2
; enum123
# 2
; @enum123 4
# $!.type-error .enum123 <1, 2, 3> 4
```

=== Schema Retrieval and Captures (implemented, #310)

The `<>` property retrieves the schema attached to the binding:
```
; enum123.<>
# <1, 2, 3>
```

Fixed-width captures require an exact-width blob. A remainder capture consumes the complete blob:
```
; <8@Bit> 0xff
# 0xff
; <[@Bit]> 0b101
# 0b101
```

=== Minimal Deconstructors (implemented, #310)

Property selectors extract direct properties in schema order. A schema-only statement defines a callable deterministic bit splitter:
```
; <.x, .z> [.x 1; .y 2; .z 3;]
# [1, 3]
; .BitSplitter3 <[.head <3@Bit>; .tail <[@Bit]>;]>;
; BitSplitter3 0b10101100
# [.head 0b101; .tail 0b01100;]
```

The declarations below remain non-executable because user-defined capture units and aliases are deferred:

[source,hc]
----
.Bit <0b0, 0b1>;
.BitStream <[@Bit]>;
.Byte <8@Bit>;
----

=== Constructors and Deferred Captures (aspirational, #310)

Constructors are intended to reverse schema flow by mapping capture keys into a value. The old dotted iterator spellings are stale; current HC uses `|` for map and `&` for reduce.
```
; BS3_sequence
# $!.unimplemented [0b000, 0b111]
; BS3_sequence & {. _}
# $!.unimplemented 0b000111
```

The intended constructor remains non-executable until schema deconstruction exists:

[source,hc]
----
.BS3_sequence (BitSplitter3 | [.head 0b000; .tail 0b111;]);
----

Deferred captures are intended to reuse the result of an earlier capture:
```
; NetString 0x548656c6c6f666666666
# $!.unimplemented [.n 0x5; .string 0x48656c6c6f;]
```

[source,hc]
----
.NetString <[.n <4@Bit>; .string {<n@Byte>};]>;
----

== Example A: Symbolicated Frame Buffer (aspirational, #311)

This design parses named and unnamed captures, reuses variables across scopes, and symbolicates output. Its declarations are non-executable because they depend on #310 and the parser-specific work in #311:

[source,hc]
----
.fb-start 0xf4m3b0ff3c;
.op {.x 0xa; .y 0xb; .data 0xc;};
.width <2@Byte>;
.height <2@Byte>;
.parse-x <op.x; @width>;
.parse-y <op.y; @height>;
.pixel <2@Byte>;
.parse-data <op.data; .fb-data <width height pixel>>;
.command <parse-x, parse-y, parse-data>;
.fb-parse <fb-start, [command]>;
.sizes {.mvga-x 0x0004; .mvga-y 0x0002;};
.mvga-data [0x0000 0x0001 0x0010 0x0100 0xffff 0xfff0 0xff00 0xf000];
.fb-bits (fb-start op.x mvga-x op.y mvga-y op.data mvga-data);
.sym-x <parse-x |> sizes>;
.sym-y <parse-y |> sizes>;
.sym-commands <sym-x, sym-y, parse-data>;
.fb-sym <fb-start |> @fb-start, [sym-commands]>;
----

The parsing and symbolic-output targets remain authoritative aspirational assertions:
```
; fb-parse fb-bits
# $!.unimplemented [0xf4m3b0ff3c, @width 0x0004, @height 0x0002, .fb-data 0x0000000100100100fffffff0ff00f000]
; fb-sym fb-bits
# $!.unimplemented [{fb-start}, {@width mvga-x}, {@height mvga-y}, .fb-data 0x0000000100100100fffffff0ff00f000]
```

== Example B: RISC-V (aspirational, #312)

The following RV32I schema remains non-executable documentation because fixed-length captures and schema constructors are not implemented:

[source,hc]
----
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
----

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
