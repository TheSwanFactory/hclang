# HLIR: Homoiconic, High-Level Intermediate Representation

HLIR is an extremely simple yet powerful syntax for representing low-level
instructions in a homoiconic form. It represents a novel synthesis in compiler
design by bridging the gap between human and machine representations of
programs. By combining monadic composition with homoiconic structure, HLIR
allows developers to express computational intent with minimal syntax while
maintaining direct mappings to MLIR's powerful optimization framework. 

This marriage of high-level semantics with low-level compilation produces a
uniquely ergonomic intermediate representation - one where code is data,
transformations are first-class citizens, and optimization becomes natural
rather than imposed. The result is a language that is both easy for humans to
reason about and efficient for compilers to transform, potentially setting a new
standard for intermediate representations in modern compiler design.

In HLIR's case, this shows up clearly in several design choices:

- Parallel execution as a type hint: You express that parallelism is allowed,
  not how to parallelize
- Map/reduce as core operations: You express the data transformation pattern,
  not the loop mechanics
- Type inference: You express what values mean, not how they're represented
- Block-based structure: You express logical grouping, not control flow details

Key to this design in the [PEACE
Monad](https://ihack.us/2024/09/15/tsm-3-sigma-calculus-and-the-peace-monad/),
which stands for Property, Enumerable, Action, Context, and Effect. Not only is
it used for blocks (code), expressions (grouping), and lists (data), but it
parses and evaluates the HLIR syntax itself. This allows for a simple and
powerful representation of code that can be easily transformed into MLIR
constructs.

As an added bonus, homoiconicity means HLIR can be configured as an interpreter
(executing the intent directly, if inefficiently) or a compiler (generating
standard MLIR), or in-between (unfolding concise HLIR into verbose HLIR showing
all the inffered types and transformations). This makes it a powerful tool for
teaching, debugging, and experimenting with MLIR transformations.

| Concept           | HLIR Syntax                  | MLIR Mapping         |
| ----------------- | ---------------------------- | -------------------- |
| **Blocks**        | `{ ... }, { { } }`           | Regions, Modules     |
| **Types**         | `.name <type>`               | Types, Attribute     |
| **Set Variable**  | `.var <type> 1`              | Block Arguments      |
| **Expressions**   | `.var expr (expr expr)`      | SSA Values           |
| **List**          | `.list [v1, v2]`             | List (auto-typed)    |
| **Vectors**       | `.v <type> [v1, v2]`         | Vector, Tensor, etc. |
| **Function Def**  | `.f (.arg <t>)^{ op arg }`   | `func.func`          |
| **Function Use**  | `f (args)`                   | `func(val)`          |
| **Operations**    | `.val op (arg1, arg2, ...)`  | Operations ()        |
| **If-Else**       | `cond ? { then } : { else }` | `scf.if`             |
| **Reduce**        | `list \| { block }`          | `scf.reduce`         |
| **Map**           | `list & { block }`           | `scf.for`            |
| **Parallel Map**  | `v & { block }`              | `scf.parallel`       |
| **Imports**       | `. <- "foo.hlir"`            | Module, Dialects     |
| **Aliases**       | `.custom <- "foo.hlir"`      | Alias Module         |
| **Arithmetic**    | `+`, `-`, `*`, `/`, etc.     | Arithmetic Binary Op |
| **Comparison**    | `==`, `>>`, `<<`, etc.       | Comparison Binary Op |
| **Logical**       | `and`, `or`, `not`, etc.     | Logical Ops          |
| **Memory**        | `load`, `store`, etc.        | Memory Management    |
| **Exceptions**    | `$literal`                   | Flow Control         |
| **Visibility**    | `._protected, .__private`    | Scope                |

The key aspects of the HLIR design are:

- Everything is a "Frame": blocks, expressions, lists, etc.
- Frames can be nested, applied, and enumerated
- Folding is the same as evaluation (trivial homoiconicity)
- No keywords, only symbols and punctuation
- No loops, only map and reduce operations
- Parallel execution is an (arbitrarily complex) type hint
- Functions use `^` to bind arguments (which are also expressions) to blocks
- Math and comparison operations are binary operators
- Vectors and tensors are represented as typed lists
- Imports merge the module contents into the current context (or an alias)

The compiler would translate this HLIR syntax directly to the corresponding MLIR
constructs, handling type inference and other necessary transformations where
possible (and providing errors where not). The goal is to make it easy for
humans to write and read HLIR code, while still being able to generate efficient
MLIR code from it.

HLIR is built using [Homoiconic C](https://github.com/TheSwanFactory/hclang),
which uses monadic parsing and effect typing to provide a simple and powerful
data format for [deterministic
computing](https://ihack.us/2024/09/15/tsm-1-the-shannon-machine-better-than-turing-complete/).
