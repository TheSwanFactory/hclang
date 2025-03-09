# A Language With No Equal: My Journey to Homoiconic C

In all honesty, I don't actually think I invented Homoiconic C. It feels more
like I discovered it, the way Newton discovered universal gravitation. Let me
explain.

## Origin Story

I came of age in the 1980s, as the C programming language and UNIX operating
system were becoming the gold standard for "serious" computing. I was taught
that:

- Lisp reflects how computers **think**
- C reflects how computers **work**
- Shell scripts reflect how humans **write**

I never questioned this split until 2010, when I was working on a taxonomy of
programming languages. I formalize that dogma into what I now call the RCS
Triad:

- Research languages are created for correctness
- Compiled languages are engineered for speed
- Scripting languages are desgined for readability

It struck me how seemingly every commonly-used language (expect, surprisingly,
SQL):

- Proudly identify with one of those categories
- Shamelessly stole ideas from the other two

The thought struck me: would it be possible to design a single language that had
the best attributes of all three?

1. Simpler than Lisp
2. Realer than C
3. Cleaner than the shell

## On Assignment

It occurred to me that the most profund difference between Lisp and C was the
assignment statement:

```c
int x = 1 + 1;
```

The first Lisp I learned was Schema, which despised variable assignment because
of its focus on immutable, mathematically pure execution contexts.  Yet the
power of C as a systems language came from:

1. **Static typing**: Running directly on native hardware (`int`)
2. **Mutable state**: Allowed changing their values in place (`=`)

On the other hand, the power of Lisp came from **homoiconicity**: using the same
structures to represent code and data.

```lisp
> (eval (quote (+ 1 1)))
2
```

I then asked a question that had never occured to me (or apparently anyone
else)before: was there a homoiconic data structure that could represent C-style
assignment?

### From Lists to Dictionaries

To start, I just started staring a typical C program, asking:

> "How can I turn this into a Lisp data structure?"

```c
void main() {
    int x = 1;
    printf("x = %d\n", x);
}
```

I remember thinking something like: what if this was JSON or YAML?
Then I could turn it into a dictionary:

```yaml
main:
    x: 1
    print: x
```

That almost works!  But how to distinguish:

- immediate versus lazy evaluation
- statements from expressions
- names (left-hand-side) from values (right-hand-side)

Then I realized: syntax!

This was why I always found Lisp hard to read: it used words like 'eval' and
'quote' for special forms that changed the evaluation rules, but were visually
indisguishable from ordinary variables (plus the fact that Lisp methods were  enormous run on setences.)

### The Logic of Symbols

In English, we use letters for content, and punctation for structure.
Maybe we can use C syntax the same way:

- immediate `()` versus lazy `{}`
- statements `;` vs expressions `,`
- `.name` (lhs) versus `value` (rhs)

```hc
.main {
    .x 1;
    x,
}
```

That... works!  In fact, it looks a little like CSS, one of the most elegant and human-editable data formats.

In fact, we can use `<>`  for types, add some syntactic sugar to drop the trailing comma, and get:

```hc
.main {.x <int> 1; x}
```

That looks pretty trivial to parse into a Lisp-like data structure, but reads remarkably like C.  Like in Lisp, everything has a value, but values with different behaviors are clearly identified by the syntax.

The key (no pun intended) is these funny dot-prefixed names, which we call *symbols*. The name `.x` evaluates to `symbol(x)` just like the string `1` evaluates to the number 1. This turns traditional C references into ordinary expressions:

- `main .x`: return the value of the property `x` in the context of `main`
- `.main .x 1`: set the property `x` in the context of `main` to 1

In fact, if we extend this to non-alphabetic symbols, it works great for operators. We can use a little trick calling currying to evaluate `1 .+ 2` one step at a time:

- `1 .+` evaluates `+` in the context of `1` to get the curry `{1 + _}`,
- `{1 + _} 2` evalutes to `3`

### Conditionals

I bet we can even use this to decompose the ternary into `?` for "then" and `:` for "else". We can also use nil `()` for false (like Lisp) and everyting else as true (or all: `<>`),

Using the statement terminator `;` as our input prompt, and the comment `#` as our output prompt, we get:

```hc
; <> ? 1
# 1
; () ? 1
# ()
; () : 2
# 1
; 1 : 2
# 1
; <> ? 1 : 2
# 1
; () ? 1 : 2
```

More importantly, we can use lazy expressions to ensure conditional expressions.
Using `@alias` to modify a value in the parent context, we get:

```hc
; .x 10;
; x
# 10
; <> ? {@x 1} : {@x 2};
; x
# 1
; () ? {@x 1} : {@x 2};
; x
# 2
```

## Universal Application

Without realizing it, I had stumbled into something even more profound.
I had implicitly been assuming that any value could:

- be stored in a property
- be consumed by a function
- act as a function to consume other data
- become a context for other properties
- have both named properties and enumerable elements

Heresy! Functions are not data structures, dicionaries are not arrays, and modules and classes are unique ways to organize all of them.

Everyone knows that. Right?

But... what if they weren't?

Gosh, it would sure make the evaluation rules ridicuously simple:

1. Take a list of properties
2. Evaluate the first one to get A
3. Evaluate the next one to get B
4. Apply A to B -- `A(B)` -- to get C
5. Repeat

There's even a name for it: [Fold](https://ihack.us/2024/09/19/tsm-6-simplifying-lisp-with-homoiconic-c-all-you-need-is-fold/).

That's the only rule you need to evaluate any expression. No more special forms!

In fact, you can perform evalution just by using
symbols and the reduce operator `|`:

```hc
; .x 1;
; x + x
# 2
; (.x, .+, .x) | ()
# 2
; (.x, .+, .x) | (.x 4)
# 8
```

But what about parsing tokens into those expressions?
Or lexing a sequence of symbols into valid tokens?

Well... what if we just used fold?

1. Treat each string as a list of symbols
2. Map those symbols onto lexers that create tokens
3. Map those tokens into aggregators that create different types of expressions

Then use fold all the way down!

It sounds insane, but it actually works. You can [check it out](https://hclang.deno.dev) for yourself.

There's even a name for it -- [monadic parsing](https://gabrijel-boduljak.com/functional-pearl-monadic-parsing/) -- though nobody had ever taken it to quite this extreme before.

## Framing the PEACE Monad

I had accidentally stumbled onto the idea of a monad. Not merely in the
functional sense of monads in Haskell, but in the original sense used by Lienbiz
(Newton's rival): the fundamental building block of everything.

I describe these monads using the acronym PEACE, because they can have:

- **Properties**: like a dictionary
- **Enumerables**: like an array or list
- **Action**: like a function or method
- **Context**: like a class or module
- **Effect**: as in side-effects (safely via sound-and-complete effect typing as in [BitC](https://danluu.com/bitc-retrospective/))

I call this data structure a "frame", out of resemblance to a stack frame,
and the face this is a radical reframing of what we mean by computation.

Everything in HC is a Frame:

- **Symbols**: Variables, Operators, Globals
- **Atoms**: Numbers, Strings, Comments, Exceptions
- **Aggregates**: Expressions, Arrays, Closures, Types
- **Evaluation**: Lex, Parse, Evaluate

## One More Thing: Total Computing

One consequence of a Lisp-like exception model was a lack of exceptions. As you
see above, Exceptions (Error, Break, Continue) are also frames. This was a
radical idea at the time, but nowadays "Maybe Monads" in Haskell and Result
types in Rust have made them commonplace.

In combination with using finite arrays for reduce (and map `&` as syntactic sugar on reduce) instead of open-ended iteration, this means that Homoiconic C is fully decideable. More formally, it is based on Presburger arithmetic, where every input of size `n` is gauranteed to terminate in `2^n` steps.

This may seem shocking to computer scientists raised on  Turing completeness.  But that is only necessary for operations like long division, which in early computers led to the infinite sequence `1.333333...` -- but nowadays is elegantly approximated using bounded boolean circuits (e.g., FPUs).  You can of course *simulate* infinite operaitons on top of the core abstraction, but that is your choice.  The core computational model is inherently finite, enabling a rich array of static analyses with (as far as I can tell) no real loss of expressive power.

## Current Status

### Existing Implementation

As mentioned, you can interact with the current implementation directly at the [HCLang Playground](https://hclang.deno.dev).  This version is written in TypeScript, and available as a JSR module.  It runs in the brower, and can even be distributed as a single HTML file with no back-end (though it uses a CDN to download the module and UI).

### Open Issues

The current list of open issues is available on the [GitHub repository](https://github.com/TheSwanFactory/hclang/issues). The main areas that are underdeveloped are:

1. **Type Checking**: we can declare and parse types, but don't properly throw errors on invalid type assignments. It is possible that further testing may require us to redesign the type system.
2. **Bit Manipulation**: in order to be a full C replacement, we should not only supprot bit-level operations, but also support endian typing for bit representations (which C does not!).
3. **WASM Compilation**:  in theory, it should be straightforward to create an execution context that generates WASM instead of directly evaulating expressions.  The first step is probably defining a `WASM.hc` data structure in Homoiconic C that trivially converts itself to WASM.  But there are probably a lot of steps after that...

### Closing Thoughts

Homoiconic C is currently a background passion project, as I have yet to find a "killer app" to justify productizing it.  If you have any suggestions -- or want to help! -- please [drop me a line](mailto:ernest.prabhakar@gmail.com).
