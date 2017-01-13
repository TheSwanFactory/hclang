# Homoiconic C
## Coding Without Language

# TODO
- Syntax for storing names (vs pathing). Potential options:
  ; ..store .name
  ; $store .name

# Introduction

Homoiconic C ("HC") is an alternative to traditional programming languages. There are a handful of primitive types, and three types of aggregation.  Everything else is just an expression.  That means it has:

- No grammar
- No keywords
- No globals
- No reserved words
- No special forms

There are pre-defined operators for conditionals, iteration, and typing but they are not treated specially by the language.

Instead, it has a robust runtime built around:

- Ubiquitous Scope (inheritance)
- Consistent Evaluation (group and fold)
- Generalized Abstraction (rather than a bunch of special cases)
- Symmetry of Code and Data (homoiconicity)
- Explicit State Management (why instruction sets are evil)

## The Format

Rather than a complex language, HC is a simple data format for expressions that is all but Turing Complete (see Appendix for details). By avoiding complicated grammars, the syntax becomes a thin veneer on top of the semantics, rather than vice versa.  

## Our Philosophy

The goal is not to make programming painless, but rather to concentrate the pain where it does the most good. You should be able to worry about what really maters WHEN it really matters, but not otherwise.

Examples:

- calling conventions (assembly vs. C)
- cache sizes and policies
- copy-on-write semantics

Right now, you either must worry about certain things all the time (i.e., when doing assembly) or can never worry about them at all (e.g., in a high-level language).

# The Object Model

HC is "monadic", in the sense that everything is a single type of object, what we call a Frame.  All syntax (aggregates, primitives, functions, even comments!) create Frames.  Frames combine aspects of dictionaries, arrays, and functions.  They may seem a little complex, they make everything else much simpler. Once you get used to them, constructs in other languages will start to feel like neutered Frames!

## Inheritance

Everything inherits its current scope (like closures). In addition, evaluation of lazy expressions (closures) causes the result to inherit their scope, allowing them to be used as object factories.

### TODO: Explicit Inheritance (Subclassing)

## Effect Typing

Rather than specify call-by-value or call-by-reference, HC is designed around the BitC model for effect typing.  Shapiro *et al* proved it is possible to have a [sound *and* complete](www.cs.jhu.edu/~swaroop/aplas.pdf) systems language if you explicitly annotate variables for **constancy** and **mutability** at each context boundary. This gives the compiler enough information to know how and when to safely copy or share data structures.

 Unfortunately, they could not do that within their Lisp-like syntax. Inspired by their work, we have chosen to use the bulk of our "syntax budget" to address that problem.  In particular, we believe effect is so fundamental we bake it into our identifiers:

 - `CONST` # begins with uppercase letter
 - `variable` # does not
 - `mutable_` # trailing underscore
 - `immutable` # default
 - `mutating_method:` # trailing colon

Their core insight is that mutability is a property of the *handle*, not the *object*.  Every object starts out mutable, but as long as it is only referenced from immutable handles the compiler can share a single instance between them.  Even if a context specifies a mutable handle, that only maters if it is called by a mutating method, which becomes copy-on-write.  For that reason, all mutating methods are required to return 'self'.

This approach may seem incomplete, in that it doesn't specify the mutability of object literals.  But if accessed directly without a handle, there is no way of knowing (or caring) whether the literal was mutated or not!

Please note that these particular conventions are preliminary, and may change in future versions based on empirical tests of readability and intuitiveness.  Since HC is just a data format, it is trivial to semantically version, and define conversions from obsolete versions.

## Access Modifiers

Closely related to effect typing (which determines *what* can change) are access modifiers (which determine *who* can change or see that). To streamline the grammar and readability, we also bake those into the identifiers, following the typical C conventions:

- `public` # default
- `_protected` # not accessible from parent
- `__private` # not accessible by children

### TODO: Are `_foo` and `foo` the same modifier?


### TODO: Explicit Typing

- Static typing: (the `<` and `>` operators)

# The Syntax

Syntactically, Homoiconic C is a variation on the ASCII Property List popularized by NeXTSTEP and now used by Java, JSON, YAML, etc. (This is basically what we did in rudimentary form with CSON files in The [Hour of NODE](http://hourofnode.org)).

In a traditional Property List, there are separate entities for dictionary and array.  Instead we use Frames, which have attributes of both (and few other abilities, such as scoping and call-ability).

## Aggregate Frames

In Homoiconic C, there are three types of Aggregate Frames:

- *FrameLazy*: "{ closure }" (aka functions)
- *FrameArray*: "[ tuple ]" (aka lists)
- *FrameExpr*: "( group )" (aka precedence)

### Separators

There are two different separators used to separate elements of those aggregates:

- *non-enumerable*: "statement ;"  # dictionary-like
- *enumerable*:      "expression ," # array-like

This is another key insight. Virtually every real-world data structure has both a header of named properties and a variable-length list or tree of enumerated items (e.g., TCP, HTTP, HTML documents, HTML tags, etc.).

### Whitespace

Spaces and newlines serve as terminators and influence binding (and thus precedence). In general, a newline acts like a comma.

Because we allow spaces for indentation, tabs are forbidden and will throw a fatal error (we may reverse this rule in a future dialect).

## Primitives

There are two types of primitive Frames (but note that even these can have properties and be enumerable).

### Quoted

There are three forms of quoting:

- “Strings”
- #Comments Inline# or #End-of-line
- \5\Bytes

### Numeric

##### Integer

- *Decimal*: 123
- *Binary*: 0b11
- *Octal*: 0o1337
- *Hexadecimal*: 0xDEADBEEF

##### Large Integer

- *Base64*: 0sBASE64

##### Non-Integer

- *Rational*: 1/3
- *Float*: 123.456
- *Scientific*: 123.456.E.-10

##### Times

Having times as a primitive avoids having to worry about epochs and whether to use milliseconds or nanoseconds.  Eventually we plan to directly support parsing of ISO/RFC date strings in multiple languages.

- %date%
- %time%
- %datetime%


## Identifiers

Everything else is just an identifier, which can be:

- .Names
- Values
- @Controls
- $References

A sequence of identifiers and primitives is an expression.

That is it. That is the entire syntax, except from a little syntactic sugar for non-alphanumeric identifiers (operators).  This is what makes Homoiconic C a concise yet expressive data format, as well as a trivial-to-parse programming language.

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

Use `_` as the anonymous argument.
```
    ; .square {_ * _};
    ; square 3
    # 9
```
When you apply something to a closure, it actually inserts that value above it
in the hierarchy before it is evaluated.

    ; .mag {(x*x) + (y*y)};
    ; mag (.x 1, .y 2)
    # 5

### Conditional Operators

The ternary operator can be broken into two binary operators (with slightly different semantics).

In Homoiconic C, these are not special forms, but simply pre-defined on the root object,
and overriden by nil (technically, vice-versa).

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
