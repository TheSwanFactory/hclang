# Homoiconic C
## Coding Without Language

# TODO
- Static typing: (the `<` and `>` operators)
- Syntax for storing names (vs pathing). Potential options:
  ; ..store .name
  ; $store .name

# Introduction

Homoiconic C is an alternative to traditional programming languages.  It has:

- No grammar
- No keywords
- No globals
- No reserved words
- No special forms

There are pre-defined operators, but they don't really have any special treatment by the language.

Instead, it has a robust runtime built around:

- Ubiquitous Scope (inheritance)
- Consistent Evaluation (group and fold)
- Generalized Abstraction (rather than a bunch of special cases)
- Symmetry of Code and Data (homoiconicity)
- Explicit State Management (why instruction sets are evil)

# The Approach

The syntax is thus just a thin veneer on top of the semantics, rather than vice versa.

We built our syntax and runtime together to allow a very elegant and efficient way of performing evaluation.  It sounds crazy, but it should make sense by the time we're done.

# Our Philosophy

The goal is not to make programming painless, but rather to concentrate the pain where it does the most good. You should need to (and be able to) worry about what really maters WHEN it really matters, but not otherwise.

Examples:

- calling conventions (assembly vs. C)
- cache sizes and policies
- copy-on-write semantics

Right now, you either must worry about certain things all the time (i.e., when doing assembly) or can never worry about them at all (e.g., in a high-level language).

# The Object Model

Homiconic C is "monadic", in the sense that everything is a single type of object, what we call a Frame.  All syntax (aggregates, primitives, functions, even comments!) create Frames.  Frames combine aspects of dictionaries, arrays, and functions.  They may seem a little complex, they make everything else much simpler. Once you get used to them, constructs in other languages will start to feel like neutered Frames!

## Inheritance

Everything inherits its current scope (like closures). In addition, evaluation of lazy expressions (closures) causes the result to inherit their scope, allowing them to be used as object factories.

### TODO: Explicit Inheritance (Subclassing)

# The Syntax

Syntactically, Homoiconic C is a variation on the ASCII Property List popularized by NeXTSTEP and now used by Java, JSON, YAML, etc. (This is basically what we did in rudimentary form with CSON files in The [Hour of NODE](http://hourofnode.org)).

In a traditional Property List, there are separate entities for, e.g.:
- dictionary
- array
- string
- number
- etc.

## Aggregates

In Homoiconic C, there are three basic aggregates for creating Frames, which act as both dictionaries and arrays (and functions):
- Lazy evaluation: "{ closure }" (aka functions)
- Boxed expressions: "[ tuple ]" (aka arrays)
- Unboxed expressions: "( group )" (aka precedence)

### Separators

There are two different separators used to separate elements of those aggregates:
- non-enumerable: "statement ;"  # dictionary-like
- enumerable:      "expression ," # array-like

This is another key insight. Virtually every real-world data structure has both a header of named properties and a variable-length list or tree of anonymous items (e.g., TCP, HTTP, HTML, etc.).

## Whitespace

In addition, spaces and newlines can serve as terminators.  Tabs, however, are forbidden and will throw a fatal error. :-)

Comments act as whitespace, and are delimited by "# inline #" or "# end-of-line\n".

## Identifiers

Everything else is just an identifier.  A sequence of identifiers is an expression.

That is it. That is the entire data format. Everything is just particular types of identifier, such as:

- .Names
- Values
- @Controls
- $References


# Examples

Using ";" for the input prompt and "#" for the output prompt.

## Names vs. Values

Numbers are just special identifiers recognized by the runtime.

    ; 1
    # 1

Names (setters) begin with a '.', and set a property with that label.

    ; .p 42;

Labels by themselves return that value.

    ; p
    # 42

## Properties

### Dictionary

    ; [.x 1; .y 2;]
    # [.x 1; .y 2;]

### Array

    ; [1, 2, 3]
    # [1, 2, 3]

### Composite

    ; [.name "weights"; 85, 110, 165]
    # [.name "weights"; 85, 110, 165]

### Internal Reference

    ; .numbers [.min 3; .max 9; min, max]
    # [.min 3; .max 9; min, max]

### External Reference

    ; numbers .min
    # 3

Applying a name to a dict returns the value of that property.
The space before '.min' is option, but emphasizes that this is just another expression

# Expressions

### Binary Operators

    ; [.mean 12; .deviation 3; mean .- deviation, mean .+ deviation]
    # [.mean 12; .deviation 3; 9, 15]

Math operators are just properties on number values (like in Ruby). The '.' can be omitted on non-alphanumeric properties, for syntactic sugar.

In other words, this is a Plist with expressions.  And our hypothesis is that this is all you need to do programming.

### Nil

The result of evaluated the empty expression.

    ; (1)
    # 1
    ; ()
    # ()

    ; .nil ();
    ; nil
    # ()

This is also used as boolean false (but not zero).

    ; 1 > 5
    # ()

### Closures

    ; .add {2 + 2}
    # {2 + 2}

    ; add ()
    # 4

### Arguments

Use '_' as the anonymous argument.

    ; .square {_ * _};
    ; square 3
    # 9

When you apply something to a closure, it actually inserts that value above it
in the hierarchy before it is evaluated.

    ; .mag {(x*x) + (y*y)};
    ; mag (.x 1, .y 2)
    # 5

### Conditional Operators

The ternary operator can be broken into two binary operators (with slightly different semantics).
In Homoiconic C, these are not special forms, but simply pre-defined on the root object,
and overriden by nil.

Most objects evaluate the argument of '?' and returns nil for ':',
but nil does the reverse.

    ; 1 ? {2 + 2}
    # 4
    ; 1 : {2 + 2}
    # ()

    ; () ? {2 + 2}
    # ()
    ; () : {2 + 2}
    # 4

  Which, when the first expression does not return nil, acts like the ternary
  operator:

    ; ( 1 > 5 ) ? 100 : 10
    # 10

  Note that this assumes that applying nil to anything other than a closure has no effect.

  ### Dataflow Operators

  We use '|' for map, in homage to the UNIX pipeline.

      ; [1, 2, 3] | { _ + 1 }
      # [2, 3, 4]
