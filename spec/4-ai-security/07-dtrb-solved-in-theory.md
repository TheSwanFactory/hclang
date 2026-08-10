# DTRB Is Solved in Theory

**Status:** theoretical closure, not implementation evidence or security
clearance\
**Requirements:**
[`01-ai-security-requirements.md`](01-ai-security-requirements.md)\
**Conceptual basis:**
[`05-transparent-authorization.md`](05-transparent-authorization.md) and
[`06-the-goldiware-conjecture.md`](06-the-goldiware-conjecture.md)

## Conclusion

> **HC has an in-principle mechanism for every requirement of dynamic total
> resource BitC (DTRB). No requirement in `01` now lacks a conceptual answer.**

This conclusion supersedes the conceptual gaps reported in
[`02-hc-ai-security-triage.md`](02-hc-ai-security-triage.md). It does not
supersede that document's findings about the current implementation. The
repository has not implemented or demonstrated the security model, and no
clearance claim follows from solving it in theory.

The solution is not a larger conventional effect system. It follows from three
HC properties:

1. **Authority is constructed:** external authority enters computation only as
   an opaque resource Frame containing stable identity and scoped authority.
2. **Application is non-amplifying:** all HC execution is Frame application, and
   application cannot create or widen authority.
3. **Meaning is executable:** HC packages carry executable types, protocols,
   constructors, transformations, and evidence definitions across boundaries.

Goldiware extends the third property through the implementation stack. HC is
intended to describe its own evaluator, runtime, and hardware realization, with
time, energy, state, concurrency, and effect represented inside the same
ontology rather than delegated permanently to opaque native code.

## The theoretical construction

### Resource construction

A trusted constructor accepts a stable URI and a credential scoped to the
designated resource:

```text
construct(uri, scoped-credential) -> ResourceFrame
```

The credential is not an HC value. The returned Frame is the authority-bearing
closure: it binds resource identity, permitted operations, lifetime, budget,
revocation, implementation, and evidence production.

Source text can name a resource but cannot authorize it. The same program
receives different effective authority when evaluated with different constructed
Frames.

### Non-amplifying application

Let `authority(frame)` be the external authority reachable through a Frame.
Application must preserve:

```text
authority(frame argument)
    subset-of authority(frame) union authority(argument)
```

Ordinary returned values carry no authority. Any returned resource Frame must be
constructed as an attenuation:

```text
authority(child) subset-of authority(parent)
```

Because every HC program is a left fold of Frame applications, induction gives:

```text
effects(program, context)
    subset-of union(authority(frame)
                    for frame in reachable(context)
                    if frame is a constructed resource)
```

The proof quantifies over arbitrary internal computation. Program complexity,
self-modification, provenance, and model intelligence do not alter the bound.

### Executable packages

An HC package transports meaning rather than merely describing it. A package may
contain:

- executable predicates and resource types;
- request and result protocols;
- constructors and attenuation rules;
- evidence definitions;
- adapter requirements and transformations;
- test vectors; and
- its transitive dependency closure.

Cross-boundary meaning is pinned by:

```text
meaning = package identity
        + dependency closure
        + evaluator identity
        + measured realization
```

A recipient evaluates the identical package, explicitly accepts a mapping
package, or detects the mismatch and refuses. Interpretation is selected by an
explicit package Frame in the composition, never by an ambient registry.

### Semantic closure through hardware

Native code is a legacy representation, not the intended semantic foundation of
HC. [`HCDL`](../../doc/HLIR/HCDL.md) defines one homoiconic specification for
software semantics and hardware realization; its successor,
[`RELIGN`](../../doc/HLIR/RELIGN.md), makes signals, state, time, energy,
triggers, effect, and physical affect first-class.

HC must ultimately express:

- its evaluator and package system;
- Frame construction and dispatch;
- allocation, persistence, and scheduling;
- resource mediation and device behavior;
- time, energy, ordering, and exhaustion bounds;
- hardware structure; and
- the transformations that interpret, compile, or synthesize those descriptions.

C, TypeScript, MLIR, LLVM, Verilog, and VHDL may be generated migration and
bootstrap targets. They are not independent sources of meaning. Their outputs
must be measured implementations of the originating HC package.

The terminating boundary is therefore physical measurement, not handwritten
native semantics:

```text
HC package
    -> homoiconic transformations
    -> software or hardware realization
    -> measured physical behavior
```

## Requirement closure

| Requirement                        | In-principle HC solution                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1 — Total mediation**           | Every external effect is application of a constructed resource Frame; no other authority exists inside HC.                                                                                                    |
| **R2 — Total decision**            | Construction performs bounded credential and scope checks; use performs a terminating subset check; executable predicates run under explicit budgets and refuse on exhaustion.                                |
| **R3 — Dynamic authority**         | Actual authority is the set of resource Frames reachable in the invocation context, not a property inferred from source.                                                                                      |
| **R4 — Attenuation**               | Application is authority-non-amplifying, and child resource Frames can only be constructed as subsets of parents.                                                                                             |
| **R5 — Resource identity**         | URI, canonical resource identity, scoped credential, and implementation are sealed in one resource Frame, eliminating independent check and use resolution.                                                   |
| **R6 — Local resource typing**     | Each resource Frame carries its own executable protocol and authority bound; no whole-program resource inference is required.                                                                                 |
| **R7 — Open-world operations**     | Previously unseen HC computation is bounded by the resource Frames supplied to it, without inferring its intent or behavior. New realizations enter through measured packages, not ambient native extensions. |
| **R8 — Cross-boundary meaning**    | HC packages exchange executable semantics, dependency closure, interpretation, and mismatch behavior under content-addressed identity.                                                                        |
| **R9 — Measured composition**      | The program, packages, initial resource Frames, evaluator, and realization define the maximum authority graph; runtime use can only select within it.                                                         |
| **R10 — Reviewable trust**         | The enforcing semantics are packaged and self-hosted; bootstrap transformations and physical measurements form an explicit, finite trust chain rather than an open-ended native runtime.                      |
| **R11 — Consequence completeness** | Goldiware semantic closure carries effect and affect—state, time, energy, concurrency, ordering, and resource consumption—through software and hardware descriptions to measured behavior.                    |
| **R12 — Migration**                | Existing HC computation remains unchanged; legacy effects and implementations become generated targets or explicitly constructed resource packages, never ambient authority.                                  |

## Two proofs of very different size

The theoretical solution contains two claims that should not be confused.

### 1. Authority confinement

This is the small proof:

1. authority enters only through constructed resource Frames;
2. application cannot amplify authority; and
3. all HC execution is application.

Therefore arbitrary HC computation cannot exceed the authority supplied by its
context.

The implementation burden is to make the premises true: Frames must be opaque
and unforgeable, credentials must be absent from HC values, and no ambient host
path may bypass application.

### 2. Semantic closure

This is the larger Goldiware conjecture:

> Every causal property needed to implement and judge an HC composition can be
> represented in HC and preserved through interpretation, compilation,
> synthesis, and physical realization.

Self-hosting the compiler is insufficient. HC must be able to replace the
semantic role of native software and hardware-description languages. If an
essential consequence can only be introduced by handwritten TypeScript, C, VHDL,
Verilog, firmware, or an unmodeled runtime, then the ontology is incomplete.

The existence of HCDL and RELIGN supplies a proposed mechanism. Equivalence and
physical measurement remain to be demonstrated.

## What “solved in theory” means

The result is specific:

- every `01` requirement has a named HC mechanism;
- the mechanisms compose into a coherent model;
- the authority invariant admits a structural proof;
- the model states where cross-boundary meaning comes from;
- the model does not hide physical consequences behind permanent native code;
  and
- each premise can be falsified by an implementation or experiment.

It does **not** mean:

- current HC enforces these mechanisms;
- the TypeScript evaluator is a security boundary;
- resource Frames are currently opaque or unforgeable;
- package identity currently pins executable semantics;
- HC currently self-hosts its runtime or hardware description;
- the compiler and synthesis chain preserve HC semantics; or
- any required adversarial demonstration has passed.

The status transition is therefore:

```text
before: requirements with unresolved conceptual mechanisms
now:    complete theoretical model with unproven premises
next:   implementation, proof, measurement, and adversarial falsification
```

## Primary falsifiers

The theory fails if any of the following is fundamental rather than a local
implementation defect:

1. An HC value can forge, inspect, or widen a resource Frame.
2. Frame composition can acquire authority absent from its inputs.
3. A real effect requires an ambient operation outside resource application.
4. Unknown HC computation cannot run without either ambient authority or total
   rejection.
5. Package identity cannot pin the executable meaning needed by independent
   recipients.
6. A consequence relevant to composition cannot be expressed in the HC ontology.
7. HC cannot describe its own implementation without semantically authoritative
   native code.
8. Software or hardware lowering introduces behavior not bounded by the source
   package and not detectable by measurement.

## Next step

The first implementation should remain deliberately small:

1. Construct one URI-bound resource Frame with a narrowly scoped credential.
2. Run arbitrary hostile HC computation with that Frame and no ambient host
   authority.
3. Demonstrate that authorized applications work and all attempts to extract,
   widen, forge, bypass, or suppress evidence fail;
4. package the resource protocol and predicates as executable HC semantics; and
5. begin replacing the enforcing TypeScript path with an HC-defined realization
   whose behavior can be compared against the package.

This experiment tests the small theorem first. Hardware/software semantic
closure is the longer program, but it no longer represents an unnamed gap in the
AI-security contract.

## Final claim

> **DTRB is solved in theory because HC treats code, data, type, authority,
> effect, package meaning, and eventually physical realization as composable
> instances of one executable ontology. What remains is to prove that the
> implementation preserves that ontology all the way from Frame construction to
> physical consequence.**
