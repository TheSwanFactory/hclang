#!/usr/bin/env hc #

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
; 0xcafebabe # Hexadecimal
# 0xcafebabe
### String (quoted, utf-8)
; `Hello`
# `Hello`
```
TBD: NetString (sized in bytes) \5\Hello
You can also use triple-backquotes for docstrings in https://asciidoctor.org[asciidoc] format. If you pass a ".adoc" file to bitscheme, it will prepend the backquotes, execute the code blocks, and warn if the evaluated input does not match the expected output.

Comment strings (using "#") are also considered a type of Literal:
```
; 1234 # trailing comment
; #  inline comment # 4321

```

==== Expressions

Identifiers can be combined into Expressions. The default behavior is concatenation:
```
; 0b1101 0b0110
# 0b11010110
; `Hello`` World`
# `Hello World`
```
==== Symbols

BitScheme also supports Symbolic Identifiers, which use prefix sigils for different usages:

```
### .Name (setter)
; .the-answer 42;
### Value (getter)
; the-answer
# 42
### $Error
; ther-answer
# $ther-answer
### Alias
; @the-answer 7;
; the-answer
# 7

```
Symbols with only non-alphanumeric characters (e.g., "+") are called Operators rather than Identifiers. There are four universal binary Operators in the standard library, which can be used with any Value:

- "?" if-then
- ":" if-else
- "&" map
- "|" reduce

The *&* and *|* operators, by default, operate over enumerable elements. Use *&&* and *||* to iterate over properties instead, and *&&&* and *|||* for both.

See *Operator Syntax* below for more details.

=== Grouping
==== Terminals

Elements are separated using Terminals:
```
### newline
; `Terminal Expression`
# `Terminal Expression`
### comma
; `Expression1`,`Expression2`
# `Expression1`,`Expression2`
### semicolon
; `Statement`;
```

==== Delimiters
Elements are aggregated using pairs of Delimiters:
```
### [] Boxed
; [1, 2, 3]
# [1, 2, 3]
### () Unboxed
; (0b1 0b0)
# 0b10
### <> Schema (i.e. type; see below)
; .Bit <0b0, 0b1>;
### {} Deferred
; .AppendZero {0b1 0b0};
; AppendZero
# {0b1 0b0}
; AppendZero()
# 0b10
```
==== Properties

Names can be used as properties to extract values from Groupings:
```
; [.a 1; .b 2;].a
# 1
```

==== Operator Syntax

Operators are actually just non-alphanumeric properties.
```
### _nil_, the empty expression
; .false ()
### _all_, the inclusive schema
; .true <>
### Ternary
; true .? `Yes` .: `No`
# `Yes`
; false .? `Yes` .: `No`
# `No`
### Map
; [0b101, 0b010] .& AppendZero
# [0b1010, 0b0100]
### Reduce
; [0b101, 0b010] .| AppendZero
# 0b10100100
```

== Schemas

Schemas, a novel feature of `bitscheme`, can be thought of as a cross between type signatures and regular expressions.  Syntactically they are ordinary Groupings, so they are easy to compose and refactor.  Each element of a Schema is called a _capture_.

=== Simple Captures

The three simple Schemas resemble C types, though they actually define an interface rather than require a specific representation:
```
; .enum123 <1,2,3>; # Enumerated list of valid values
; .BitStream <[@Bit]>; # Variable-length Sequence of a specific type
; .Byte <8@Bit>; # Fixed-length sequences
```

=== Type Constraints

The Schema constrains which values can be bound to a Symbol, and can be retrieved via the `<>` property.
```
; @enum123 2;
; enum123
# 2
; enum123.<>
# <1,2,3>
; @enum123 4
# $@enum123<1,2,3> 4
```

=== Deconstructors

Schemas can also act directly to extract or bind values from compound sequences:

```
; <.x, .z> [.x 1; .y 2; .z 3;] # Selector
# [1, 3]
; .BitSplitter3 <[.head <3@Bit>; .tail <[@Bit]>;]>;
; BitSplitter3 0b10101100
# [.head 0b101; .tail 0b01100;]

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

== Example: RISC V

To see how this works in practice, we will construct Schema for the six https://en.wikipedia.org/wiki/RISC-V#ISA_base_and_extensions[32-bit RISC-V Instruction Formats].

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
