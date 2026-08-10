# Risk Assessment

## Summary

The feasibility of dynamic total resource effect typing in HC has three primary
risks and one additional federation risk:

| Risk                               | Assessment              | Core question                                                                                                             |
| ---------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Expressibility / syntax**        | Low                     | Can Frames and contexts describe Acts, resource handles, capabilities, requests, and evidence without fighting HC?        |
| **Semantic soundness**             | High                    | Can every effect be mediated, resource-bound, attenuation-only, and decided by a terminating procedure under composition? |
| **Substrate security**             | Unknown, plausibly high | Can the runtime keep credentials and raw host authority unreachable except through the measured gateway?                  |
| **Federated meaning and evidence** | High, but deferrable    | Can independent organizations detect whether resource identities and effect records carry the same meaning?               |

## 1. Expressibility and syntax — low risk

HC is unusually well positioned to express the model. Most of its control
surfaces are data:

- Act contracts;
- resource handles;
- effect requests;
- capabilities;
- invocation contexts; and
- evidence records.

All can naturally be represented as Frames. Little new grammar may be required.

The principal syntax risk is false authority. Existing conventions such as `_`
for mutability or `:` for a mutating method may document or narrow an effect,
but their spelling must never grant authority. A declaration in HC source is not
a measurement of what a handler can do. The measured protocol and resource
handle must remain the source of truth, with under-declaration independently
detectable.

## 2. Semantic soundness — high risk

This is the hardest language and runtime problem. It is substantially larger
than implementing HC's documented identifier modifiers.

HC must:

- separate ordinary scope inheritance from authority inheritance;
- prevent closures, globals, handlers, and arbitrary host Frames from amplifying
  authority;
- bind effects to stable resource identity across aliases and check/use races;
- fix a measurable upper bound while resolving actual authority dynamically;
- make nested handler and context composition monotone by construction;
- ensure every permission decision terminates within a stated bound; and
- state how concurrency, shared state, budgets, exhaustion, timing, and other
  consequences outside the effect signature are handled.

A single effect-general host escape collapses the semantic claim. A system with
a sound core and an untyped `eval`, FFI, dynamic host callback, or raw Deno path
does not provide total mediation.

## 3. Substrate and credential containment — unknown, plausibly high risk

Credential isolation is the sharpest part of a broader problem: HC must isolate
all **raw authority**, including:

- credentials and signing material;
- sockets and filesystem handles;
- environment variables and metadata services;
- process execution;
- dynamic loading; and
- host callbacks supplied through embedding contexts.

The gateway or broker should hold real credentials. HC should receive only
unforgeable resource handles whose authority can be attenuated.

The current implementation is not itself a security boundary. The CLI runs with
broad Deno permissions, imports the process environment, accepts arbitrary
Frames through evaluation contexts, and dispatches polymorphically without an
effect gate. Deno permissions, process isolation, or hardware enclaves could
supply a lower boundary, but complete and economical containment has not been
demonstrated.

The key falsification question is:

> Can hostile HC code reach or exercise any raw authority without producing a
> typed request, passing the measured gateway, and emitting evidence?

## 4. Federated meaning and evidence — high but deferrable risk

Perfect isolation and sound local enforcement do not establish that two
organizations mean the same thing by a resource identity, protocol, effect type,
or evidence record.

Portable evidence requires bindings among:

- protocol identity and version;
- handler and gateway measurement;
- resource issuer and stable identity;
- deployment and trust-domain identity;
- capability issuer and delegation chain; and
- the concrete request and result.

A recipient must either ground those bindings in independently observable facts
or detect disagreement and fail safely. Matching labels or code hashes alone are
insufficient.

This risk can be deferred during a single-trust-domain implementation. It cannot
be ignored if the final contract claims portable attestation or independent
cross-organizational judgment.

## Recommended sequencing

1. Confirm HC can express the model without granting authority through syntax.
2. Prove semantic soundness for a narrow resource protocol and effect set.
3. Demonstrate substrate containment and credential non-exposure under hostile
   HC code.
4. Extend the model to cross-domain identity, semantics, and portable evidence.

The first meaningful milestone should therefore remain single-domain: one pure
HC computation, one narrowly scoped resource type, two attenuated authority
contexts, one total gateway, and no raw credential reachable by HC. Federation
should begin only after that boundary survives adversarial testing.
