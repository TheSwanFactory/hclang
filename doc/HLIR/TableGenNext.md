# HLIR NextGen - A TableGen Replacement for MLIR

The
**[HLIR](https://ihack.us/2024/11/29/tsm-10-1-hlir-homoiconic-high-level-intermediate-representation/)
(High-Level Intermediate Representation)** framework written in
[Homoiconic C](https://ihack.us/2024/09/19/tsm-5-homoiconic-c-hc-syntax-cheat-sheet/)
could also serve as a next-generation replacement ("HLIR-NG") for LLVM's
[TableGen](https://llvm.org/docs/TableGen/), especially if it's designed to
handle the kind of semantic richness and extensibility required for a dynamic,
multi-level execution framework like [MLIR](https://mlir.llvm.org).

## 1. How HLIR Could Replace TableGen

The current **TableGen** system is primarily declarative, focusing on
describing:

- Dialects and operations.
- Traits and type constraints.
- Limited structural and semantic information.

**HLIR** introduces concepts that go far beyond this. Here’s how it could serve
as an enhanced replacement:

### 1.1 Structural Parity with TableGen

HLIR already supports key features needed to define operations, types, and
constraints in MLIR, such as:

- **Operation schemas**: Describe inputs, outputs, and attributes.
- **Dialect hierarchies**: Group related operations logically.

### 1.2 Semantic Superiority

HLIR’s focus on embedding **rich semantics** makes it ideal for:

- **Behavioral Specifications**: Define operation behavior for interpretation
  and optimization.
- **Data Flow and State Semantics**: Model how data moves between operations or
  changes statefully.
- **Dynamic Execution**: HLIR can encode rules for runtime interpretation or
  simulation of IR.

### 1.3 Integration Points

HLIR could be used as a frontend or backend for MLIR:

- **Frontend**: Replace TableGen as the way dialects, types, and operations are
  defined.
- **Backend**: Generate C++ or Python code for dialect registration,
  optimization passes, or interpreters.

---

## 2. Benefits of Using HLIR Instead of TableGen

### 2.1 Semantic Richness

HLIR is designed for **explicit semantics**, which could enhance MLIR in several
ways:

- **Operation Behavior**: Encode execution logic for an MLIR interpreter.
- **Context-Aware Constraints**: Add runtime constraints or metadata that adapt
  to execution conditions.

### 2.2 Unified Framework

HLIR could unify the currently fragmented workflow in MLIR:

- Replace TableGen for dialect definitions.
- Automatically generate:
  - Dialect registries.
  - Execution logic for an interpreter.
  - Custom analysis and verification passes.

### 2.3 Extensibility

HLIR's flexibility would make it easier to:

- Define new MLIR dialects with minimal boilerplate.
- Add domain-specific semantic information (e.g., for AI, HPC, hardware).

---

## 3. HLIR and the MLIR Interpreter Vision

HLIR’s features align perfectly with the requirements of an MLIR interpreter:

### 3.1 Behavioral Semantics

HLIR could encode the execution rules for MLIR dialects directly, making it
possible to interpret high-level IR without lowering it to LLVM.

#### Example: Execution Rules for Tensor Addition

```shell
.toy {
    .add ^ (.input1 <tensor>, .input2 <tensor>) -> <tensor> {
        element_wise_add(input1, input2)
    }
}
```

HLIR encodes typing rules and inference for operations, allowing for dynamic
checks during interpretation and static checks during compilation.

### 3.2 Interpreter Generation

HLIR could directly generate:

- Execution logic for a runtime interpreter.
- Verification passes to ensure operations adhere to their defined semantics.

---

## 4. HLIR’s Role in a Next-Generation MLIR Ecosystem

### 4.1 Rapid Prototyping

With HLIR, developers could:

- Define and test new dialects with an interpreter, skipping the full
  compilation pipeline.
- Experiment with semantics and optimization strategies.

### 4.2 Multi-Level Execution

HLIR could encode multi-level execution rules, enabling:

- High-level interpretation for debugging or simulation.
- Selective lowering of performance-critical parts to lower-level dialects
  (e.g., LLVM).

### 4.3 Advanced Optimization

HLIR could include semantic information that facilitates optimizations:

- Loop transformations.
- Tensor contraction/fusion.
- Hardware-specific code generation.

---

## 5. HLIR vs. TableGen: Key Advantages

| Feature                | TableGen                 | HLIR                                  |
| ---------------------- | ------------------------ | ------------------------------------- |
| Operation Definition   | Static schema and traits | Schema + behavioral semantics         |
| Type Constraints       | Declarative              | Declarative + runtime typing rules    |
| Execution Rules        | Not supported            | Fully supported with inline semantics |
| Code Generation        | C++/Python stubs only    | Full runtime/interpreter integration  |
| Optimization Semantics | Limited                  | Rich optimization hints               |
| Extensibility          | Requires C++ boilerplate | Extensible via higher-level rules     |

---

## 6. Example Workflow with HLIR

- Define a Dialect in HLIR
- Generate the MLIR Interpreter
- Execute Operations Dynamically

```shell
. <- .toy
.tensor_a <tensor> [1, 2, 3];
.tensor_b <tensor> [4, 5, 6];

.result toy.add(tensor_a, tensor_b);
result
```

---

## 7. Next Steps

- **Integration Exploration**: Combine HLIR with MLIR’s existing pipeline to
  replace TableGen incrementally.
- **Runtime Prototype**: Build a proof-of-concept MLIR interpreter driven by
  HLIR-defined semantics.
- **Community Collaboration**: Engage with MLIR contributors to explore adoption
  paths for HLIR.

This vision could redefine how MLIR dialects are developed and used, enabling
not just compilation pipelines but dynamic and interactive workflows. Let me
know if you'd like to brainstorm specific implementation details!
