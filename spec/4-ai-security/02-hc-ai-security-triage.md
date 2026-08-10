# HC AI Security Triage

**Date:** 2026-08-09\
**Basis:** current repository on `chore/deno-2.9.5-upgrade`\
**Requirements:**
[01-ai-security-requirements.md](01-ai-security-requirements.md)

## Verdict

HC is **conceptually aligned but not close to security clearance**.

The useful alignment is structural: HC represents code and data as Frames,
passes an explicit context through evaluation, resolves closures dynamically,
and has a small built-in operator table. Those are plausible foundations for
authority-carrying Frames and a single effect gate.

The current implementation, however, has no effect authority, mediation gate,
attenuation rule, artifact measurement, cross-boundary semantics, or reviewable
permission procedure. The identifier conventions described as HC effect typing
are not enforced. No requirement in `01` has received its prescribed security
demonstration.

This is not a verdict that HC cannot meet the framework. It means the work is
primarily **security architecture**, not gap-filling in the existing schema
checker.

## Evidence baseline

The assessment used the following implementation facts:

- Every value and operation participates in the exported
  [`Frame`](../../lib/frames/frame.ts) protocol. Evaluation dispatches directly
  through `call`, `called_by`, and `apply`; there is no effect gate.
- Names resolve through mutable Frame metadata and a mutable `up` chain in
  [`MetaFrame`](../../lib/frames/meta-frame.ts). Missing names fall through to
  the process-wide `Frame.globals` operator table.
- Closures merge captured metadata with the caller context in
  [`FrameLazy`](../../lib/frames/frame-lazy.ts). This is dynamic scope behavior,
  not authority attenuation.
- The global operation set in [`ops.ts`](../../lib/ops.ts) contains arithmetic,
  comparison, conditionals, mapping, and reduction. These built-ins are
  in-memory, but the exported Frame protocol permits a host application to
  supply arbitrary effectful Frame subclasses without registration or typing.
- [`evaluate`](../../lib/execute/evaluate.ts) accepts an arbitrary `Context`, so
  host-created Frames can enter evaluation directly.
- The CLI runs with `-A`, reads requested files, and places the complete process
  environment into HC scope in [`cli/hc.ts`](../../cli/hc.ts). The compiled CLI
  requests read, write, and environment permissions in
  [`cli/deno.json`](../../cli/deno.json). Deno permissions are not derived from
  or represented by HC effects.
- Assignment mutates Frame metadata through `set`. Arrays and schemas mutate
  their backing data through `push`; Frames and their `up` links are mutable.
- The effect and access syntax in [`doc/LANGUAGE.md`](../../doc/LANGUAGE.md) and
  [`white-paper.hc`](../../cli/hc/white-paper.hc) is ahead of the evaluator.
  Parsing and binding do not enforce uppercase constancy, trailing-underscore
  mutability, trailing-colon mutation, or privacy prefixes.
- Numeric schema membership is implemented in
  [`FrameSymbol`](../../lib/frames/frame-symbol.ts), but string schemas and
  advanced schema behavior remain skipped or broken. Schemas constrain values;
  they do not describe or enforce external effects.

### Test and probe results

`deno task test:lib` passes: 30 suites, 278 steps, with five ignored groups. The
ignored coverage includes string schemas, edge cases, advanced HLIR types, and
conversions.

`deno task test:bs` reports **14 passed and 17 failed**, while the command still
exits successfully. Failures cover enums, schema deconstruction, advanced type
features, and related evaluation behavior. The details agree with
[`spec/2-type-tests`](../2-type-tests/).

Focused evaluator probes produced these results:

| HC source                                    | Current result | Finding                                        |
| -------------------------------------------- | -------------- | ---------------------------------------------- |
| `.Constant 1; .Constant 2; Constant`         | `2`            | uppercase constancy is not enforced            |
| `.immutable [1]; immutable 2`                | `[1, 2]`       | an “immutable” handle mutates in place         |
| `.mutable_ [1]; mutable_ 2`                  | `[1, 2]`       | the suffix does not change behavior            |
| `.__private 7; __private`                    | stack overflow | private-name behavior is not enforced safely   |
| `._protected 8; _protected`                  | stack overflow | protected-name behavior is not enforced safely |
| a trailing-colon mutator definition and call | missing name   | mutating-method semantics are not implemented  |

These are diagnostic probes, not yet regression tests.

## Requirement triage

| Requirement                                     | Status                 | Triage                  | Current position                                                                                                                                                         |
| ----------------------------------------------- | ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R1** Every effect crosses an HC boundary      | Not met                | **Architectural gap**   | Pure built-ins make today's internal effect surface small, but arbitrary host Frames dispatch without registration or mediation. CLI effects occur outside the HC model. |
| **R2** Effect decisions are total               | Not met                | **Research gap**        | HC has neither an effect derivation nor a permission decision procedure. Numeric schema matching is not an effect decision.                                              |
| **R3** Actual scope determines authority        | Partial substrate only | **Architectural gap**   | Context affects symbol resolution, but Frames in scope are not typed as authority and no effect permission is resolved from them.                                        |
| **R4** Inheritance and composition attenuate    | Not met                | **Architectural gap**   | Mutable `meta`, mutable `up`, global fallback, and closure context merging have no authority ordering or non-amplification check.                                        |
| **R5** Handles designate resources              | Not met                | **Architectural gap**   | JavaScript object identity exists, but HC resource checks do not. Symbols resolve through mutable contexts and can be rebound between observations.                      |
| **R6** Resource typing is local                 | Not established        | **Research gap**        | Lookup is local, but resource typing does not exist. HC cannot claim to break the O2 × O5 coupling until it types an actual resource locally.                            |
| **R7** Unknown operations receive a sound bound | Not met                | **Research gap**        | Unknown HC symbols are rejected; unknown host Frame behavior can run unclassified. Neither path derives a useful conservative effect bound.                              |
| **R8** Meanings agree across trust boundaries   | Not met                | **Research gap**        | No portable effect vocabulary, issuer, measurement binding, mismatch rule, or federated identity mechanism exists.                                                       |
| **R9** Measured composition bounds effects      | Not met                | **Architectural gap**   | HC has no artifact/configuration manifest or measurement. Runtime contexts and global operations are not included in an attestable composition.                          |
| **R10** Trusted evaluator is reviewable         | Not met                | **Architectural gap**   | No TCB is declared. A first candidate spans roughly 2,948 non-test lines in evaluator, Frames, and ops, plus 177 CLI boundary lines, and remains general and mutable.    |
| **R11** Untracked consequences are explicit     | Not met                | **Documented-only gap** | Exhaustion, divergence, timing, ordering, error content, caches, and shared state have not been enumerated or accepted.                                                  |
| **R12** Existing code has a migration rule      | Not met                | **Architectural gap**   | All current HC code is effectively untyped for external effects. No reject, wrap, sandbox, or typed-protocol policy is specified.                                        |

### What is closest

The following are useful implementation assets, but none is a clearance:

1. **Uniform dispatch.** Because every HC value is a Frame, an effectful Frame
   protocol could be made explicit without adding a second object system.
2. **Explicit context assembly.** `evaluate(input, context)` already identifies
   a natural composition boundary for program plus authority.
3. **Small built-in vocabulary.** `Ops` is a fixed dictionary and can seed an
   artifact-derived operation manifest.
4. **Host-enforced permissions.** Deno can provide a lower enforcement layer if
   HC derives least-privilege permissions rather than launching with `-A`.
5. **Local handles.** Frames are already object references. A distinct,
   unforgeable resource Frame can build on that identity rather than on string
   names.

### What is misleadingly close

- **Identifier effect syntax.** Uppercase, `_`, and `:` provide vocabulary but
  currently have no enforcement and do not describe filesystem, network,
  process, environment, or other host effects.
- **Schemas.** Current schemas validate a small set of value assignments. They
  are neither complete effect derivation nor a bound on what a Frame can do.
- **Dynamic scope.** Resolving a symbol from the current context is not the same
  as resolving permission from an attenuating authority.
- **A pure core.** Having few effects today does not establish total mediation
  for future host Frames, packages, MAML integrations, or embeddings.
- **Deno sandboxing.** Deno permissions can do the enforcement while HC's type
  layer contributes nothing; that would trigger the framework's sandbox-doing-
  the-work disqualifier.

## Gap priorities

### P0 — Pin the security proposal and threat model

Before changing code, define and pin:

- what counts as an HC effect;
- whether in-memory mutation is an effect or only host-observable mutation is;
- the adversary and trust boundaries;
- the measured unit: source, parsed Frames, evaluator build, initial context,
  operator manifest, and host permissions;
- whether the existing identifier conventions remain effect typing, become
  value/alias annotations only, or are replaced for security purposes.

This is the point at which the `08` thread's A10 disclosure state should fire.
Without it, implementation risks shaping an unpinned claim.

### P1 — Create one effect boundary

Introduce a distinct protocol for effectful operations and prohibit ordinary
Frame dispatch from reaching host capabilities. A viable shape is:

- an unforgeable resource Frame containing identity plus attenuable authority;
- a finite operation descriptor derived from registered host adapters;
- one effect gate receiving `(operation, resource, authority, arguments)`;
- refusal for unregistered effectful Frame subclasses; and
- an extracted manifest included in the measured composition.

The exact mechanism is not prescribed by `08`; these properties are.

### P1 — Make context authority monotone

Separate ordinary name bindings from authority. Replace mutation-prone authority
paths with immutable or persistent structures, define attenuation and
composition formally, remove implicit process-global authority, and prove that
closure capture and nested calls cannot amplify it.

The current `meta`/`up` lookup can remain a language feature only if it cannot
silently become an authority path.

### P1 — Reduce the host boundary

- Stop importing the entire process environment by default.
- Replace development `-A` execution with explicit minimum permissions.
- Remove unused write permission from compiled deployments unless a registered
  HC effect requires it.
- Bind Deno permissions to the measured HC configuration.
- Ensure file loading, output, environment access, and future network/process
  adapters enter through the same effect model.

### P2 — Specify a total decision procedure

Define the authority representation, decision algorithm, refusal behavior, and
cost in request and authority size. Add property tests for termination and
attenuation. This discharges neither E10 nor cross-boundary meaning by itself,
but makes them testable.

### P2 — Bind identity and meaning

Define stable resource identity within one runtime, then define what can be
transported across runtimes or organizations. Specify issuer/trust binding,
versioned operation semantics, mismatch detection, and what an artifact
measurement proves without external claims.

This is the hardest research item and should not be hidden inside serialization
or package naming.

### P2 — Decide the legacy-code path

Choose and document what happens to current HC code with no security effects:

- pure-only execution;
- explicit wrapping of host effects;
- sandboxed compatibility mode; or
- unmodified code whose effects exist only at fully typed protocol boundaries.

Any compatibility mode must state what HC adds beyond Deno mediation.

### P3 — Turn the `01` demonstrations into tests

Add a dedicated security suite whose failures exit nonzero. Preserve the
adversarial-input requirement and cover artifact extraction, authority changes,
nested attenuation, aliasing, unknown operations, incomplete derivation,
cross-boundary mismatch, and escape attempts.

Fix the BitScheme harness's successful exit on internal test failure before
using executable documents as security evidence.

## Recommended first milestone

The first credible milestone is deliberately narrower than full clearance:

> A pure HC core plus one read-only file resource Frame, evaluated under two
> measured contexts, with all file access passing one total effect gate and Deno
> receiving only the derived filesystem permission.

It should demonstrate R1-R5 and R9 for that restricted effect vocabulary,
including denial of an unregistered host Frame and attenuation to a narrower
file set. It should make no claim yet about O1 for unknown protocols, O3 across
organizations, or general E10 clearance.

That milestone tests whether HC's Frame/context architecture can carry the
security model before federation, migration, and general host integration make
the problem larger.

## Bottom line

HC is close to the desired model in **shape**, especially its uniform Frame
representation and explicit evaluation context. It is far from it in
**enforcement and evidence**. The correct next move is to make authority and
effects first-class at the host boundary, not to infer security from the
existing BitC-inspired spelling rules.
