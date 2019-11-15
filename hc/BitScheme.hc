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
; 0xcafebabe # Hexadecimal
# 0xcafebabe
### String (quoted, utf-8)
; `Hello`
# `Hello`
;
### ByteString
; \5\Hello
# \5\Hello
```
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
