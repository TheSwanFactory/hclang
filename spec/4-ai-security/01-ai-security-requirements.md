# AI Security Requirements in HC Terms

This document translates the finalized `08` thread in the
[`marketing/ai-security`](https://nightly.quilttest.com/b/quilt-leadership/packages/marketing/ai-security)
package into HC terminology. It states requirements, not findings about the
current implementation.

In this document, an **effect** is any change or observation outside the current
HC computation. An **authority-bearing Frame** is a Frame or handle whose use
can produce such an effect. A **mediating operation** is the HC or host
operation through which that use occurs.

## Core requirements

### R1 — Every effect crosses an HC boundary (`D1`)

Every effect reachable from evaluating a Frame MUST pass through a known
mediating operation. The evaluator, built-in operators, imported host functions,
closures, and compositions of otherwise permitted Frames MUST provide no path
around mediation.

The operation set MUST be extracted from the executable artifact or its measured
configuration, not reconstructed from documentation or author memory.

### R2 — Effect decisions are total (`D2`, `H1`)

Given a requested operation and the authority-bearing Frames in scope, the
permission decision MUST terminate for every input within a stated cost bound.
Failure MUST refuse the operation.

If HC derives an effect from code or Frames, the derivation MUST also terminate
within a stated bound. If HC instead accepts effect declarations—such as
identifier conventions—the declaration MUST be bounded by an independent,
terminating observation of what the implementation can actually do.

### R3 — Actual scope determines authority (`D3`)

The effect of an operation MUST be resolved when the operation is evaluated from
the authority-bearing Frames actually present in its context. Source text alone
MUST NOT grant authority.

The same closure or expression MAY produce different permitted effect sets in
different contexts without changing its bytes.

### R4 — Inheritance and composition only attenuate (`D4`)

Scope inheritance, closure capture, Frame composition, and runtime evaluation
MUST NOT enlarge authority beyond the measured starting context. Nested
composition MUST preserve this rule at arbitrary depth as a property of the
mechanism, not as a convention followed by operator authors.

### R5 — A handle designates the resource it authorizes (`D5`)

Resource typing MUST attach to the authority-bearing Frame or handle, not merely
to a symbol or string that is resolved later. The check and the effect MUST
refer to the same resource identity.

HC MUST define the result when:

- two symbols or paths designate the same resource; and
- a symbol or path would resolve differently between checking and use.

### R6 — Resource typing is local (`D6`, `O2 × O5`)

Determining what resource a handle can affect MUST NOT require inference over
the whole HC program. Any mechanism may satisfy this requirement, but it MUST
break the BitC coupling in which precise resource typing introduces regions,
subtyping, and non-local inference.

## Unresolved boundary requirements

### R7 — Unknown operations receive a sound bound (`O1`)

An operator, host function, or Frame type that HC has never seen MUST receive a
sound conservative effect bound derived from an observable boundary. Silently
allowing it and categorically rejecting all unknown operations both fail this
requirement.

Typing at a protocol boundary is acceptable only if every effectful path crosses
such a boundary and the boundary contributes a meaningful effect distinction,
not merely a universal “host call” label.

### R8 — Meanings agree across trust boundaries (`O3`, `H2`, `E4`)

When two runtimes or organizations exchange an authority-bearing Frame,
measurement, package, or effect description, they MUST either establish the same
meaning from independently observable evidence or detect the mismatch and fail
safely.

Where multiple effect interpretations are valid, selection MUST be scoped by an
explicit Frame, context, or composition—not by ambient or process-global
resolution. A measurement MUST state exactly what it proves by itself and what
additional binding is required across organizations.

### R9 — The measured composition bounds all runtime effects (`H3`, `E9`)

HC MUST identify which effect properties are fixed by the program and which are
fixed when its context is assembled. The measured program-plus-context MUST set
an upper bound on effects; runtime resolution may only choose within that bound.
Abstraction MUST NOT defer information needed to establish the bound.

### R10 — The trusted evaluator is reviewable (`E10`)

HC MUST identify every component trusted to enforce these requirements,
including the evaluator, context construction, built-in operations, host
adapters, measurement logic, and effect-decision procedure. The trusted portion
MUST be small and specific enough to review; a terminating or fast decision
procedure alone does not satisfy this requirement.

### R11 — Untracked consequences are explicit (`E7`)

HC MUST enumerate consequence classes its effect model does not bound, including
resource exhaustion, non-termination, timing, ordering, error content, caches,
and shared state. Each MUST be bounded by another mechanism or explicitly
accepted with reasons.

### R12 — Existing HC code has a stated migration rule (`E8`)

HC MUST state what happens to code that carries no effect information:
rejection, wrapping, sandboxing, or unmodified execution behind typed protocols.
If a sandbox or host boundary provides the security, the HC type discipline MUST
state what additional discrimination it contributes.

## Required evidence

Clearance requires executable demonstrations, including:

1. Extract every effect-capable operation from the artifact and show that their
   composition cannot escape mediation.
2. Exercise the permission procedure at its bound and show refusal on failure.
3. Run one byte-identical HC expression in two contexts with materially
   different authority, visible in a third-party-verifiable measurement.
4. Attempt to enlarge authority through nested scope inheritance and
   composition.
5. Exercise aliasing and check/use resolution changes for a resource handle.
6. Show local resource typing without whole-program inference.
7. Introduce both an unforeseen operation in a known host namespace and an
   operation in an unknown namespace; show how each receives its effect bound.
8. Where effects are derived, hide part of an operation's effect from the
   derivation input and show that incompleteness is detected.
9. Exchange an effect description across a genuine trust boundary and show
   agreement or safe mismatch detection.
10. Attempt an effect outside the mediated set and identify the exact layer that
    refuses it.

At least one input to each applicable demonstration is chosen adversarially
after the HC security proposal is pinned. Documentation, identifier spelling,
and plausible architecture are not substitutes for these runs.

## Triage labels for `09`

The HC assessment MUST label every requirement as one of:

- **demonstrated** — implemented and passed the prescribed evidence;
- **implemented, undemonstrated** — enforcement exists but the prescribed
  evidence has not been run;
- **documented only** — stated HC semantics without corresponding enforcement;
- **local gap** — addressable within an isolated evaluator or Frame component;
- **architectural gap** — requires changes across evaluation, context, and host
  boundaries; or
- **research gap** — no adequate mechanism is currently specified.

`09` MUST assess the repository as it exists. HC's use of BitC terminology or
identifier-level mutability markers is evidence of design lineage, not evidence
that any requirement above is satisfied.
