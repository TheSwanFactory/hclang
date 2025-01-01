# The Shannon Machine: Better Than Turing Complete?

The Shannon Machine is a
[decider](https://en.wikipedia.org/wiki/Decider_(Turing_machine)) computational
system which uses bit-level
[word](https://en.wikipedia.org/wiki/Word_(computer_architecture)) operations
(rather than high-level computation) to perform arithmetric. The goal is model
practical computation in a way that is more realistic -- but still as formal --
as the Linear Bounded Automoton, which has a similar level of computational
power.

## Word Processing Units

The key feature is distinguishing between numerical _calculation_ and abstract
_computation_. A Shannon machine of size n (Sigma[n]) uses n-bit words (e.g.,
Sigma[64] mirrors the 64-bit words of modern computers). Calculation is
performed by WPUs (Word Processing Units) of
[bounded depth boolean circuits](https://gilkalai.wordpress.com/2009/02/24/a-little-more-on-boolean-functions-and-bounded-depth-circuits/),
which always take and return one or more words in a fixed number of cycles.
Examples of WPUs include Arithmetic Logic Units (ALUs), Floating Point Units
(FPUs), and Digital Signal Processors (DSPs).

Because WPUs are used for all bit-level operations, there is no need for the
computational layer to implement or support the Peano axioms of basic
arithmetic. Instead, it implements a Presburger-like system known as the Sigma
Calculus.

## Sigma Calculus

The Sigma Calculus is explicitly designed to model stateful systems using nested
contexts. The root context is the immutable Global Object Domain (GOD), which
contains all other contexts. Each context is a set of objects, which can be
interpreted as either data or code. The Sigma Calculus is a formal system for
manipulating these objects, which can be thought of as a generalization of the
Lambda Calculus.

### WPU Sentences

Sentences using only binary operators are evaluated directly by WPUs, without
any true computation. For example (using ';' for input, '#' for output, and '@'
for error):

```css
; 1 + 1
# 2
; 1.0 / 0
@ NaN
```

This is also true when grouping using parentheses:

```css
; (3 + 4) * 6
# 42
```

### Keys and Memory

The first and most crucial aspect of computation is creating and using keys:

```css
; .x 3
# 3
; x + 4
# 7
```

Here, the key `x` is bound to the value 3 in the local context, then
dereferenced to add to 4. We treat memory as a nested series of
[associative arrays](https://brilliant.org/wiki/associative-arrays/#:~:text=Associative%20arrays%2C%20also%20called%20maps,the%20number%20is%20the%20key.).
For simplicity, we assume `load` and `store` take logarithmic time, and memory
can contain 2^n values (with properties taking up neglible space).

Keys use effect typing to share mutable state across contexts. See
[Fractor](https://ihack.us/2024/09/14/the-fractor-model-precise-shared-mutable-state-management-for-systems-programming/)
for the notation and semantics.

### Arrays and Iterators

Arrays are the primary data structure, and can contain both named properties and
unnamed elements:

```css
; .a [.b 4; 1, 2, 3]
# [.b 4; 1, 2, 3]
; [] 1 4 9
# [1, 4, 9]
```

There are no jumps. Iteration is performed solely using map (`&`) and reduce
(`|`):

```css
; a & []
# [[1], [2], [3]]
; a | []
# [1, 2, 3]
```

### Functions

Evaluation is simply reduction of an array:

```css
; [1, .+, 2] | ()
# 3
```

Functions are thus syntactic sugar for arrays that automatically decompose the
symbols:

```css
; .f { 1 + 2 };
; f()
# 3
```

Functions can also take arguments, which are passed or overriden:

```css
; .f { .b 4; b + _ };
; f(3)
# 7
; f(.b 5; 3)
# 8
```

### Conditionals

Similar to Lisp, we use the empty expression `()` for nil (false) and the total
type `<>` for all (true). These are used with the binary operators `?` and `:`
for conditionals:

```css
; <> ? 1
# 1
; () ? 1
# ()
; <> : 2
# <>
; () : 2
# 2
```

Any non-nil expression evaluates to true:

```css
; 1 ? 2
# 2
; 1 : 2
# 1
; 1 ? 2 : 3
# 2
; () ? 2 : 3
# 3
```

## Comparison to Turing Machines

Perhaps surprisingly, we claim these simple operators make the Shannon Machine
roughly equivalent to the Lambda Calculus, without even having to be Turing
complete.

### Turing Machines Are Better at Impossible Problems

In a Shannon-complete language, the resource constraints are indeed implicit in
the model. These constraints are naturally enforced by the system, meaning that
the programmer does not have to explicitly manage limits like recursion depth or
memory usage. This implicit management of resources offers predictable,
efficient execution, particularly in resource-constrained environments like
embedded systems or real-time applications.

The key distinction is that while Turing-complete languages provide theoretical
unbounded computation (with practical limits being imposed by the system during
runtime), Shannon-complete languages are designed to operate fully within finite
constraints from the start, making resource management a built-in feature of the
system rather than an afterthought.

I consider this a feature, rather than a bug.

### Are Turing Machines Simpler?

The Shannon Machine is a more realistic model of computation than the Turing
Machine, which is a theoretical construct. The Shannon Machine is based on the
idea of using bit-level word operations to perform arithmetic, which is more in
line with how modern computers actually work. The Shannon Machine is also
designed to be more practical and efficient than the Turing Machine, which is a
purely theoretical construct that is not intended to be implemented in practice.

That said, the Turing machine is _conceptually_ simpler, in that it is a
theoretical model of computation that is based on a few simple rules. The price
of this is that Turing algorithms can be arbitrarily complex. Conversely, the
Shannon model has a sharp Word/Sentence distinction that makes it easier to
reason about the behavior of programs. So, arguably this is a matter of taste.

### Turing Machines Are More Familiar

The Turing Machine is a well-known model of computation that has been studied
extensively in computer science. It is used to prove theorems about the limits
of computation and to analyze the complexity of algorithms. The Shannon Machine,
on the other hand, is a relatively new model of computation that is still being
developed and studied. It is not as well-known or widely used as the Turing
Machine, but it has the potential to be a more practical and efficient model of
computation for certain types of problems.

## Conclusions

The Shannon Machine is a new model of computation that is based on bit-level
word operations and is designed to be more practical and efficient than the
Turing Machine. It is a decider computational system that uses boolean circuits
bounded in depth (logarithmic in _n_) to perform arithmetic ("calculation"), and
the Sigma Calculus to perform computation. The Sigma Calculus is a formal system
for manipulating objects in nested contexts, and differs from the Lambda
Calculus in that it is memory-centric rather than processor-centric. The Shannon
Machine is designed to be a more realistic model of computation that is more in
line with how modern computers actually work, and it has the potential to be a
more practical and efficient model of computation for the types of problems
computers are actually used for. However, my hope is that it will also provide a
richer and more robust theoretical foundation for computation than the Turing
Machine, with profound implications for the safety and efficiency of future
software and hardware systems.

Whether it will fulfill that potential remains to be seen, but I hope you agree
it is an interesting and promising new model of computation that is worth
studying and exploring further.
