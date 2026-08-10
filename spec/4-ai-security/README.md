# HC and AI Security

## Context

The Quilt package
[`marketing/ai-security`](https://nightly.quilttest.com/b/quilt-leadership/packages/marketing/ai-security)
(`quilt+s3://quilt-leadership#package=marketing/ai-security`) develops a
preregistered framework for replacing model-layer authorization with verifiable
control of real-world effects.

Its strongest sufficient specification is dynamic total resource BitC (DTRB):
every effect is mediated, every decision terminates, actual authority is
resolved dynamically, composition only attenuates, handles identify the
resources they authorize, and resource typing remains local.

HC began as a universal language for code and data whose Frame model was already
informed by BitC, executable types, effect typing, and the Goldiware attempt to
unify hardware and software. The AI-security framework therefore provides an
independently derived test of whether HC has identified the right abstractions
for consequential computation.

## Principal result

> **DTRB is solved for HC in theory. It is not implemented or demonstrated in
> the current repository.**

All requirements in the AI-security specification now have candidate HC
mechanisms. The central result is smaller than a conventional effect system:

1. A trusted enclosure constructs a resource Frame from a stable URI and a
   scoped credential.
2. HC code receives the Frame, never the credential or a general host interface.
3. Authority exists only as reachability of constructed resource Frames.
4. Frame application cannot create or widen authority.
5. Every HC program is a left fold of Frame applications.

Therefore arbitrary HC computation cannot exceed the authority supplied in its
initial composition:

```text
effects(program, context)
    subset-of union(authority(frame)
                    for frame in reachable(context)
                    if frame is a constructed resource)
```

This bound does not depend on understanding the program, inferring its intent,
or trusting the model that produced it. More capable reasoning can improve what
the program computes with supplied values; it cannot expand the perimeter of
resources the enclosure supplied.

## Key findings

### Effects are fundamental

AI did not create a new class of effect. It increased capability beyond the
regime in which conventional effect abstractions remained tolerable. Existing
systems conflate knowing how to perform an action, reaching machinery that can
perform it, and being authorized to perform it now. AI turns that conflation
into effective authority expansion at machine speed.

Goldiware starts from the opposite ontology: Experience is what can change,
Values determine what matters, and Capabilities determine what can act. Effects
are not incidental I/O around an otherwise real mathematical computation. They
are what make computation consequential.

### Authorization is transparent, not ambient

Permission is bound at resource-Frame construction time and is thereafter
transparent to HC code and LLMs. Use remains ordinary Frame application. The
same byte-identical program can operate with a pure, simulated, or live resource
Frame without special I/O syntax.

Transparent authorization remains explicit to the enclosure and verifier. The
resource Frame binds identity, scope, lifetime, budget, revocation,
implementation, and mandatory evidence while hiding resource-specific mechanics
and raw credentials from computation.

### Application conserves authority

The small theorem is structural: authority enters only through constructed
Frames, application is non-amplifying, and all execution is application. A
returned ordinary value carries no authority. Any returned resource Frame must
be constructed as an attenuation of authority already present.

This makes the possible effects of unknown or adversarial HC code a property of
its inputs rather than of source analysis. The open world of computation does
not require an open world of ambient authority.

### Types constrain flow

HC types are executable predicates. They allow the interstitial infrastructure
to validate and, where explicitly modeled, canonicalize values at resource
boundaries. Security-critical predicates must execute under bounded budgets and
refuse on exhaustion; an arbitrary predicate is not assumed correct merely
because it is called a type.

Frames constrain effects. Types constrain flow. Code transforms values.

### Packages transport executable meaning

HC packages address cross-boundary semantic agreement by exchanging executable
meaning rather than prose descriptions of meaning. Package identity, dependency
closure, evaluator identity, and measured realization pin the protocol,
predicates, attenuation rules, and evidence interpretation used by a
composition.

A recipient evaluates the identical package, explicitly accepts a mapping
package, or detects the mismatch and refuses. The resource Frame, credential
issuer, and measured adapter ground those executable semantics in a particular
external resource.

### Consequence boundaries must be honest

DTRB requires consequence classes such as exhaustion, non-termination, timing,
ordering, caches, errors, and shared state to be bounded by another mechanism or
explicitly excluded from the guarantee. A measured adapter with declared limits
is sufficient for that security result.

HC's larger Goldiware program is substantially stronger. HLIR, HCDL, RELIGN, and
hexons propose one homoiconic representation spanning executable dialect
semantics, interpretation, verification, software lowering, hardware synthesis,
and physical effect and affect such as state, time, and energy. Full semantic
closure through hardware is not required for DTRB, but it could eventually
replace the legacy native substrate rather than merely trusting and measuring
it.

## First proof point

GitHub issue
[`resource frames` (#277)](https://github.com/TheSwanFactory/hclang/issues/277)
specifies the first implementation experiment: construct a RESTful resource as a
Resource Frame.

REST provides an unusually direct mapping:

```text
URI                 resource identity
scoped credential   bounded authority
HTTP method         operation
request             argument Frame
response            returned value Frame
client adapter      hidden resource semantics
access record       mediation evidence
```

The proof object is intentionally not a general `fetch` function. It is a
resource-specific capability whose constructor fixes origin, path scope,
methods, credential, lifetime, budgets, redirect behavior, and evidence policy.

The demonstration must run arbitrary hostile HC, permit authorized requests, and
refuse attempts to change origin, escape the path scope, invoke forbidden
methods, override or extract credentials, follow out-of-scope redirects, exceed
budgets, forge stronger Frames, reach a raw host callback, or suppress evidence.
The same HC program must also run against a pure or simulated Frame with the
identical protocol.

Success would establish the resource-Frame theorem for one realistic external
resource and exercise the complete DTRB model without requiring general
federation or end-to-end hardware self-hosting.

## Current status

The theoretical result is a pinned architecture, not a finding about current
enforcement. The TypeScript/Deno interpreter presently permits general mutable
Frames, global fallback, arbitrary host-created Frame subclasses, and broad CLI
authority. Resource Frames are not yet opaque capabilities, the authority
invariant is not enforced, package identity does not yet pin executable
semantics, and the prescribed adversarial demonstrations have not been run.

The next phase is therefore implementation and falsification rather than further
invention of the security mechanism. Clearance requires evidence that:

- credentials and raw host handles cannot enter the HC value universe;
- every real effect crosses a constructed resource Frame;
- application, aliasing, mutation, closures, and nested composition cannot
  amplify authority;
- permission checks terminate and fail closed;
- effect evidence is unavoidable and independent of program output;
- packages and measured adapters bind the claimed semantics; and
- the executing composition contains no ambient path around the model.

The goal is not to prove that selected HC programs behave safely. It is to show
that the HC abstractions make the entire space of internal programs incapable of
exceeding the authority supplied at construction.
