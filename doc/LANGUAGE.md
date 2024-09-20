<!-- markdownlint-disable MD049 -->
# Homoiconic C

## Coding Without A Language

### Draft 3 • 24-MAR-2017

## Introduction

Homoiconic C ("HC") is an alternative to traditional programming languages. There are a handful of primitive types, and three types of aggregation.  Everything else is just an expression.  That means it has:

- No grammar
- No keywords
- No globals
- No reserved words
- No special forms

There are pre-defined operators for conditionals, iteration, and typing, but they are not treated specially by the language.

Instead, it has a robust runtime built around:

- Ubiquitous Scope (inheritance)
- Consistent Evaluation (group and fold)
- A Single Generalized Abstraction (rather than many special cases)
- Symmetry of Code and Data (homoiconicity)
- Explicit State Management (why instruction sets are evil)

A stretch goal is to not use any English words in the base language, so as to allow maximal localization; though we may resort to Latin if we run out of special characters.

### The Format

Rather than a complex English-like language, HC is a simple data format for expressions that is “all but” Turing Complete (see Appendix for details). By avoiding complicated grammars, the syntax becomes a thin veneer on top of the semantics, rather than vice versa.  

### Our Philosophy

Our goal is not to make programming painless, but rather to concentrate the pain where it does the most good. You should be able to think about what really maters WHEN it really matters, but not otherwise.

Examples:

- calling conventions (assembly vs. C)
- cache sizes and policies
- copy-on-write semantics

Right now, you either must think about certain things all the time (i.e., when doing assembly) or can never think about them at all (e.g., in a high-level language).

## The Object Model

HC is "monadic", in the sense that everything is a single type of object that we call a Frame.  All syntax (aggregates, primitives, functions, even comments!) create Frames.  Frames combine aspects of dictionaries, arrays, and functions.  They may seem a little complex, they make everything else much simpler. Once you get used to them, constructs in other languages will start to feel like neutered Frames!

### Inheritance

Everything inherits its current scope (like closures). In addition, evaluation of lazy expressions (closures) causes the result to inherit their scope, allowing them to be used as object factories.

### TODO: Explicit Inheritance (Subclassing)

### Effect Typing

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

### Access Modifiers

Closely related to effect typing (which determines *what* can change) are access modifiers (which determine *who* can change or see that). To streamline the grammar and readability, we also bake those into the identifiers, following the typical C conventions:

- `public` # default
- `_protected` # not accessible from parent
- `__private` # not accessible by children

### TODO: Are `_foo` and `foo` the same modifier?

### TODO: Explicit Typing

- Static typing: (the `<` and `>` operators)
- Endian-ness
- Bitfields
- Predicates (the `~` operator)

## The Syntax

Syntactically, Homoiconic C is a variation on the ASCII Property List format popularized by NeXTSTEP and now expressed by Java, JSON, YAML, etc. (This is basically what we did in rudimentary form with CSON files in The [Hour of NODE](http://hourofnode.org)).

In a traditional Property List, there are separate entities for dictionary and array.  Instead we use Frames, which have attributes of both (and few other abilities, such as scoping and call-ability).

### Aggregate Frames

In Homoiconic C, there are four types of Aggregate Frames:

- *FrameArray*: `[ tuple ]` (aka lists)
- *FrameExpr*: `( group )` (aka precedence)
- *FrameLazy*: `{ closure }` (aka functions)
- *FrameSchema*: `< type >` (aka types)

#### Separators

There are two different separators used to separate elements of those aggregates:

- *non-enumerable*: `statement ;`  # dictionary-like
- *enumerable*:     `expression,` # array-like

This is another key insight. Virtually every real-world data structure has both a header of named properties and a variable-length list or tree of enumerated items (e.g., TCP, HTTP, HTML documents, HTML tags, etc.). Yet somehow there is no universal mechanism for describing those semantics.

#### Whitespace

Spaces and newlines serve as terminators and influence binding (and thus precedence). In general, a newline acts like a comma.

Because we allow spaces for indentation, tabs are forbidden and will throw a fatal error (we may reverse this rule in a future dialect).

### Primitives

There are three types of primitive Frames (but note that even these can have properties and be enumerable).

#### Strings

There are three forms of quoting:

- `“Strings”` # Smart quotes!
- `#Comments Inline#` or `#End-of-line`

#### Numeric

##### Integer

- *Decimal*: `123`
- *Binary*: `0b11`
- *Octal*: `0o1337`
- *Hexadecimal*: `0xDEADBEEF`

##### Non-Integer

- *Rational*: `1/3`
- *Float*: `123.456`
- *Scientific*: `123.456.E.-10`
- *Semver*: `123.456.p123`

##### Times

Having times as a primitive avoids having to worry about epochs and whether to use milliseconds or nanoseconds.  Eventually we plan to directly support parsing of ISO/RFC date strings in multiple languages.

- `%date%`
- `%time%`
- `%datetime%`

#### BLOBs

Historically, data formats were either binary or ASCII (later, textual).  HC makes it trivial to represent Binary Large OBjects directly inside a human-readable document.

- `\5\Bytes`
- `0sBASE64`

### Identifiers

Apart from aggregates and primitives, everything else is just an identifier, which can be:

- `.Names`
- `Values`
- `@Controls`
- `$References`

A sequence of identifiers and primitives is an expression.

That is it. That is the entire syntax, apart from a little syntactic sugar for non-alphanumeric identifiers (operators).  This is what makes Homoiconic C a concise yet expressive data format, as well as a trivial-to-parse programming language.

## Examples

The examples (and the eventual HC interpreter) use `;` for the input prompt and `#` for the output prompt. This convention has the nice property that examples can be pasted directly into the interpreter.  We also use in-line comments (`# #`) for multi-line prompts.

### Properties

#### Name versus Value

Names (setters) begin with a '.', and set a property with that label.

    ; .p 42;

Labels by themselves return that value.

    ; p
    # 42

Syntactically, numbers are just special identifiers recognized by the runtime.

    ; 1
    # 1

#### Dictionary

    ; [.x 1; .y 2;]
    # [.x 1; .y 2;]

#### Array

    ; [1, 2, 3]
    # [1, 2, 3]

#### Composite

    ; [.name "weights"; 85, 110, 165]
    # [.name "weights"; 85, 110, 165]

#### Internal Reference

    ; .numbers [.min 3; .max 9; min, max]
    # [.min 3; .max 9; min, max]

#### External Reference

    ; numbers .min
    # 3

Applying a name to a dict (or any Frame) returns the value of that property.
The space before `.min` is optional, but emphasizes that property access is just another expression

### Expressions

#### Binary Operators

    ; [.mean 12; .deviation 3; mean .- deviation, mean .+ deviation]
    # [.mean 12; .deviation 3; 9, 15]

Math operators are just properties on number values (like in Ruby). The '.' can be omitted on non-alphanumeric properties (operators), for syntactic sugar.

    ; 2 + 2
    # 4

This is why HC looks like a Plist with expressions.  And our hypothesis is that this is all you need to do programming.

#### Nil (False)

The result of evaluating the empty expression is conventionally called nil.

    ; (1)
    # 1
    ; ()
    # ()

    ; .nil ();
    ; nil
    # ()

This is also used as boolean `false` (but not zero).

    ; 1 > 5
    # ()

#### All (True)

The opposite of the nil expression is the all type, or universal set:

    ; <>
    # <>
    ; !()
    ; <>

This is also used as boolean `true`.

    ; 1 = 5 # `=` is only use for comparison, never for assignment
    # <>

All has the property that every object is a member (`~`), in contrast to nil of which nothing is a member:

    ; 1 ~ <>
    # <>
    ; 2 ~ ()
    ; ()

#### Closures

Closures are just lazily evaluated expressions.  

    ; .add {2 + 2}
    # {2 + 2}

To evaluate them, apply an argument, such as `nil`:

    ; add ()
    # 4

#### Arguments

##### Anonyomous `_`

Use `_` as the anonymous argument.

    ; .square {_ * _};
    ; square 3
    # 9

##### Argument Lists

When you apply something to a closure, it actually inserts that value above it
in the hierarchy before it is evaluated.

    ; .mag {(x * x) + (y * y )};
    ; mag (.x 1; .y 2;)
    # 5

Since objects capture the scope where they are created, this may allow closures to be called with implicit arguments and access the enclosing scope:

    ; .x 3;
    ; .y 4;
    ; mag []
    # 25

TODO: Determine whether this is a bug or a feature. This should not be that dangerous, since the effect typing and access rules still limit what the called function can do to the calling scope.

#### Schemas

Schemas (similar to types in other languages) test whether an object is a member of a set.
They always return either true or false.
They can be defined inline or given an alias for reuse:

They can be as simple as a list of valid values:

    ; @SmallPrimes <2, 3, 5, 7>;
    ; SmallPrimes 3
    # <>
    ; SmallPrimes 4
    # ()

Or dynamically calculated (a "dependent type"):

    ; @IsEven <_ % 2 == 0>;
    ; IsEven 4
    # <>
    ; IsEven 3
    # ()

Or extracted from an object by using all (`<>`) as an operator:

    ; 0.<> == 1.<>
    # <>
    ; 0.<> == `zero`.<>
    # ()
    ; @Number <0.<>>
    # <0.<>>
    ; .z Number 3
    # 3
    ; .alpha Number `one`
    # $!.type-error Number `one`

### Object-Oriented Programming

#### Super `^`

The `^` property points to the parent (defined) context, in contrast to the applied (argument) context `_`.  This allows a child to directly set properties on its parent or access overridden properties.

    ; .parent_ [
    # # .x 1;
    # # .helper: {
    #   # .x 2;
    #   # .y x + ^.x;
    #   # .^.y y + _;
    #   # }
    # # ]
    ; parent_.x
    # 1
    ; parent.y
    # @missing
    ; parent_.helper: 10;
    ; parent_.y
    # 13

#### TODO: This `.`

#### TODO: @Reference

#### Classes

Impressively, these constructs are sufficiently powerful to enables classes and factories without any additional syntax or semantics!

(In the below examples, we omit the multi-line prompts to reduce visual clutter.)

    ; my-class {
      ._property _;
      .getProperty { ^._property }
      .setProperty: { .^._property _}
    };
    ; .my-instance my-class 3;
    ; my-instance.getProperty()
    # 3
    ; .mutated = my-instance.setProperty: 42;
    ; mutated.getProperty()
    # 42
    ; my-instance.getProperty()
    # 3  

This may seem to good to be true, but that is the power of choosing the correct primitives:

- Data hiding is handled by the implicit access Modifiers
- Scope is always inherited
- Instance methods refer to their parent by `^`
- The class itself is the constructor (as a closure)
- When evaluated, that closure inherits the class as its parent

### TODO: Class variables

#### Singletons

As an added bonus, Frame is perhaps unique in that it is trivial to create singleton objects simply by using a non-lazy constructor:

css
  ; my-singleton (
    ._property_;
    .getProperty { ^._property }
    .setProperty: { .^._property _}
  );
  ;

#### Class Inheritance

Even inheritance is already accounted for, simply by allowing an object to specify its parent:

    ; my-subclass {
      .^ my-class
    };

At this time there does not appear to be any natural way to implement multiple inheritance (which may be a good thing).  However, if you come up with your own it would be trivial to use it:

(Fake code, will give an error.)

    ; my-multiclass {
      .^ multiply-inherit (my-class, my-other-class)
    };

### Predefined Operators

#### Conditionals

The ternary operator can be broken into two binary operators (with slightly different semantics).

In Homoiconic C, these are not special forms, but simply pre-defined on the root object,
and overridden by nil (or more precisely, vice-versa).

Most objects evaluate the argument of `?` and return nil for `:`,
but nil itself does the reverse.

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

Note that this implies that applying nil to anything other than a closure has no effect.

#### Iterators

We use `&` for map, in homage to the UNIX pipeline.

    ; [1, 2, 3] & { _ + 1 }
    # [2, 3, 4]

  Similarly, we use `|` for reduce:

      ; [1, 2, 3] | { . + _ }
      # 6

## Appendices

## Appendix I. On Turing Completeness

Turing undecidability, like Godelian incompleteness, starts by assuming "basic arithmetic" (add, substract, multiply, divide) -- i.e. the Peano Axioms. However, this glosses over the fact that division is a "type violation", and can't be fully represented using the same data structures as for addition and substraction.

We believe that a better starting point for modeling computation are the Presburger Axioms.  These give up multiplication and division as first-class operations (though you can emulate them to some extent using repeated addition and subtraction, respectively).  The big win, though, is that Presburger arithmetic is both consistent **and** complete.  This eliminates the halting problem, and massively simplifies analyses (though it may restrict what is possible).

Instead of Turing completeness, we prefer to focus on "Circuit Universality" (a la Scott Aaronson): the ability to represent the effect of any Boolean circuit, including multiple levels of abstraction above them.
