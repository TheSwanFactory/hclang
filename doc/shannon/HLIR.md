# HLIR: Homoiconic, High-Level Intermediate Representation

HLIR is an extremely simple yet powerful syntax for representing low-level
instructions in a homoiconic form. It is designed to be easy to parse, easy to
manipulate, and easy to translate to other representations. The HLIR syntax is
designed to be a direct mapping to the MLIR syntax, with a few simplifications
and extensions to make it more human-readable.

| Concept           | HLIR Syntax                  | MLIR Mapping         |
| ----------------- | ---------------------------- | -------------------- |
| **Blocks**        | `{ ... }`                    | Regions, Modules     |
| **Expressions**   | `expr, expr, ...`            | SSA Values           |
| **Operations**    | `op(arg1, arg2, ...)`        | Operations           |
| **Set Variable**  | `.var 1`                     | Block Arguments      |
| **Types**         | `<type>`                     | MLIR Types           |
| **If-Else**       | `cond ? { then } : { else }` | `scf.if`             |
| **List**          | `.list  [v1, v2]`            | List                 |
| **Reduce**        | `list \| { op _} `           | `scf.reduce`         |
| **Map**           | `list & { op _ }`            | `scf.for`            |
| **Parallel Map**  | `list <parallel> & { op _ }` | `scf.parallel`       |
| **Function Def**  | `.f (.arg <t>)^{ op arg }`   | `func.func`          |
| **Function Use**  | `f(val)`                     | `func(val)`          |
| **Imports**       | `. <- "foo.hlir"`            | Merge Module         |
| **Aliases**       | `.custom <- "foo.hlir"`      | Alias Module         |
| **Arithmetic**    | `+`, `-`, `*`, `/`, etc.     | Arithmetic Ops       |
| **Comparison**    | `==`, `>>`, `<<`, etc.       | Comparison Ops       |
| **Logical**       | `and`, `or`, `not`, etc.     | Logical Ops          |
| **Memory**        | `load`, `store`, etc.        | Memory Management    |
| **Vectors**       | `.v <type> [v1, v2]`         | Vector, Tensor, etc. |

The key aspects of the HLIR design are:

- No keywords, only symbols and punctuation
- No loops, only map and reduce operations
- Parallel execution is a type hint
- Functions use `^` to bind arguments to blocks
- Math and comparison operations are binary operators
- Vectors and tensors are represented as typed lists
- Imports merge the module contents into the current context

The compiler would translate this HLIR syntax directly to the corresponding MLIR
constructs, handling type inference and other necessary transformations where
possible (and providing errors where not). The goal is to make it easy for
humans to write and read HLIR code, while still being able to generate efficient
MLIR code from it.

HLIR is built using [Homoiconic C](https://github.com/TheSwanFactory/hclang),
which uses monadic parsing and effect typing to provide a simple and powerful
data format for [deterministic
computing](https://ihack.us/2024/09/15/tsm-1-the-shannon-machine-better-than-turing-complete/).
