# Dynamic Total Resource Effect Typing in HC

**Status:** conceptual model, not an implementation plan or clearance claim\
**Source:** the complete
[`marketing/ai-security`](https://nightly.quilttest.com/b/quilt-leadership/packages/marketing/ai-security)
argument through the `08` thread

## The idea in one sentence

> An HC computation may affect the world only by applying a typed operation to
> an unforgeable resource Frame; the measured HC composition fixes the maximum
> authority, the invocation context supplies the authority actually available,
> and a total, attenuation-only gateway decides and records every use.

This is what **dynamic total resource effect typing** would mean in HC. Each
word excludes a different failure mode.

## Why HC needs a second meaning of effect

HC currently uses _effect typing_ in the BitC sense: constancy and mutability
are properties of handles at context boundaries. An immutable handle may share a
value; a mutable handle admits in-place change; a mutating method changes its
parent. That model answers a language-runtime question:

> What may this name do to this in-memory value?

The AI-security contract asks a wider question:

> What may this computation cause in the world, using which authority, against
> which resource, under which accountable boundary?

These meanings are related but not identical. HC's existing handle insight is
the bridge: permission belongs to the **handle through which an object is
used**, not to a claim about the actor and not merely to the object in
isolation. The security model extends that insight from memory aliasing to
files, networks, models, databases, packages, credentials, budgets, and other
external resources.

The old and new layers should therefore compose:

- constancy and mutability govern local Frame state and aliasing;
- resource effects govern externally observable action; and
- a local mutability marker never grants external authority by itself.

## The four words

### Dynamic

The effect set is not inferred once from HC source and frozen into the program.
It is resolved at each use from the resource Frames and capabilities actually in
the invocation context.

The same byte-identical closure can run in two contexts and receive materially
different authority. A report generator given a read-only package handle can
read that package. The same generator given a narrower handle can read less. It
does not need to be rewritten or reclassified.

Dynamic does **not** mean authority is open-ended. The measured composition
fixes an upper bound. Runtime resolution may select or consume authority within
that bound and may narrow it; it may never acquire an effect class, handler,
resource, or credential outside it.

In HC terms:

- the closure or expression is the computation;
- its context contains values and authority-bearing resource Frames;
- evaluation resolves actual authority from that context; and
- context inheritance must attenuate authority even where ordinary names retain
  HC's usual inheritance behavior.

### Total

Total has two independent meanings.

**Total mediation:** every externally observable effect crosses the same typed
boundary. An HC program cannot open a raw socket, invoke Deno, call an arbitrary
host function, recover a credential from metadata, or use a general `eval` or
FFI path around it. If an escape hatch exists, it is itself a visible typed
effect.

**Total decision:** for every request, the authorization procedure terminates
within a stated bound and returns allow or refuse. It uses only the request,
current authority, capability state, and finite measured metadata. It does not
ask a model whether the request seems safe and does not perform open-ended
policy interpretation in the enforcement path.

Total does not mean the system predicts every consequence. Non-termination,
timing, exhaustion, ordering, caches, error content, and aggregate behavior must
be bounded separately or declared outside the guarantee.

### Resource

The thing carrying authority is a resolved **resource Frame**, not a string name
and not a tool label.

A resource Frame combines:

- an unforgeable object identity;
- the protocol through which the object can be used;
- the authority available through this particular handle;
- its issuer and trust-domain binding;
- lifetime and revocation information; and
- enough provenance to bind later evidence to the same object.

HC source may contain a resource name, but a name grants nothing. At a minting
boundary the host resolves that name, canonicalizes it, binds it atomically to
the actual object, and returns a resource Frame. After minting, the Frame cannot
be made to designate another object.

Two aliases for one object therefore yield handles tied to one identity. A DNS
change, redirect, symlink, mount change, or other check/use race cannot silently
retarget an existing handle. If identity cannot be stabilized, the mismatch is
detected and the operation refuses.

### Effect typing

An effect type is an executable upper bound on a request, not a description
attached after arbitrary behavior has occurred.

The computation cannot perform a file write and then receive the label
`file_write`. It can only ask a file resource handler to perform a write. The
request is already inside the interface, and the handler is the only component
capable of realizing it.

Conceptually, a request has a product type such as:

```text
Effect = <operation, resource, reversibility, blast-scope,
          flow-direction, authority-used, budget>
```

The exact axes remain a design question. Their required properties do not:

- each non-resource axis has a small ordered domain;
- resources form an open set of minted identities;
- one effect is no greater than another by a decidable componentwise order;
- a request is allowed only when its effect is below the capability bound and
  its resource is a member of the granted set; and
- the lattice discriminates operations an adversary would want conflated.

`read < versioned-write < unversioned-write < external-irreversible` illustrates
one useful axis. It makes HC's copy-on-write intuition security-relevant: a
versioned, reconstructable change can safely sit below an irreversible one.

## The HC objects in the model

Everything can remain a Frame, but not every Frame has the same provenance.

### Value Frame

Ordinary HC data. It is serializable and may be constructed by HC source. It
carries no authority merely because it contains a path, URL, operation name, or
credential-shaped string.

### Resource Frame

An opaque, unforgeable handle minted by a trusted boundary. HC can pass,
attenuate, and apply its protocol, but cannot construct its identity or increase
its authority. Serializing it produces a reference or evidence record, never a
live capability.

### Effect request Frame

A pure description created when HC applies a resource operation. Constructing
the request has no external effect. It records the operation, resource identity,
arguments, and mechanically derived effect type.

The request type comes from the measured resource protocol and actual handle,
not from the spelling chosen by HC source. A source annotation may narrow or
document the request; it cannot understate what the handler will do.

### Capability Frame

A short-lived, signed upper bound issued for one invocation or nested scope. It
names the principal, measured composition, permitted effects and resources,
budget, expiry, parent grant, and invocation identity.

HC never receives the underlying host credential. The capability broker or
gateway holds it and exercises it only after a successful subset check.

### Context Frame

An invocation context split conceptually into:

```text
Context = Values × Authority × EffectState
```

`Values` follows ordinary HC lookup. `Authority` contains resource and
capability Frames. `EffectState` contains monotone state such as remaining
budget, expiry, revocation, and any scene-level taint.

This split matters. Ordinary scope inheritance may add names; it must never add
authority. A child context receives an explicitly attenuated authority view.

### Handler

A measured host implementation of one resource protocol. It turns an allowed
effect request into a real operation. It cannot be reached except through the
gateway and receives no broader credential than the request requires.

The handler defines real-world semantics and is part of the trusted composition.
Its author is a better classification locus only for structural reasons: one
measured handler can serve many programs, its review is amortized, and its
behavior can be observed at the boundary. Diligence alone is not a
justification.

### Effect gateway

The sole path from evaluation to handlers. It performs a bounded subset check,
updates monotone effect state, invokes the selected handler, and emits evidence
because the effect passed through it.

The gateway does not interpret intent, inspect prose for danger, or decide
whether an action is appropriate. Those are semantic questions.

## Two gates, not one

The package's correction to the attestation model is essential. A secure HC Act
has two different gates:

1. **Semantic admission at the endpoint:** is this input appropriate for this
   Act to act upon? This may use domain logic and judgment. It cannot be reduced
   to asking the same model to reflect on its own proposal.
2. **Non-semantic effect enforcement at the substrate:** is this mechanically
   described operation within the capability actually held for this resource?
   This is the total subset check.

The semantic gate cannot grant authority. The effect gate cannot establish
domain appropriateness. Passing one never implies passing the other.

## The lifecycle of an HC Act

Here an **Act** is a bounded HC evaluation: code plus input contract, resource
protocols, capabilities, lifetime, and output contract.

### 1. Compose and measure

The deployment assembles:

- the HC source or parsed Frame graph;
- the HC evaluator version;
- the Act's value interface;
- the complete resource-protocol and operation table;
- resource minters and handlers;
- the gateway and decision procedure;
- deployment bindings to actual infrastructure; and
- the host permissions that make the handlers possible.

The measurement covers this **composition**, not the HC source or handler binary
alone. A byte-identical Act may have different authority in different
compositions, so only the composition determines the upper bound.

### 2. Admit input

The Act checks its semantic admission rule. Rejection here says the input is not
appropriate for this Act. It says nothing about whether the requested mechanism
would fit a capability.

### 3. Mint resource handles

Names from configuration are resolved atomically to objects. The minter returns
resource Frames whose identity, protocol, authority ceiling, issuer, and
deployment binding are fixed.

### 4. Issue a capability

A control plane that can see sponsor authority, delegation, duty, budget, and
lifetime evaluates policy once. It issues a short-lived capability bounded by
both sponsor scope and measured composition.

### 5. Evaluate HC purely

HC evaluates Frames, closures, schemas, and local mutations without direct host
authority. When it applies an external operation to a resource Frame, evaluation
produces an effect request Frame.

### 6. Decide and perform

For request `q`, capability `g`, and effect state `s`, the gateway computes:

```text
decide(q, g, s) -> refuse
                | allow(s', evidence, result)
```

The decision allows only if:

```text
type(q) <= g.effect-bound
resource(q) in g.resource-set
g is valid for this composition, principal, invocation, and time
cost(q) <= s.remaining-budget
s' grants no more authority than s
```

The function terminates within a stated bound. Refusal is the only failure
fallback. The handler is invoked only after allowance and only with the
credential needed for that resource operation.

### 7. Narrow state

Every use may consume budget, shorten lifetime, revoke a one-shot grant, or add
monotone taint. Nested Acts receive capabilities no greater than their parent.
No runtime event widens the effect set.

Scene-level taint can partially address composition blindness: after reading a
secret, a scene may permanently narrow its remaining egress. This is useful but
does not claim full information-flow tracking.

### 8. Seal the result

Completion produces an immutable artifact containing inputs, outputs,
composition measurement, capabilities exercised, effect records, identities of
sponsor/runner/reviewer, and relevant revisions. The record is a byproduct of
mediation; HC code cannot omit or forge it.

A recipient judges the artifact under its own policy. Publication does not
create transitive trust.

## Place inside the wider AI-security contract

Dynamic total resource effect typing is the load-bearing enforcement substrate,
not the whole contract.

It directly supplies:

- total mediation and authority as positive enumeration;
- short-lived capability subset checks;
- attenuation-only delegation;
- typed, attributed shared state rather than accidental covert infrastructure;
- affordance-level revocation, where the revoked object is a resource operation
  or capability class rather than only an artifact it produced; and
- evidence emitted automatically for every realized effect.

The surrounding Act system must still provide:

- distinct sponsor, run, track, and review principals;
- a non-penalized “no solution exists” or request-more-authority result;
- semantic admission at each endpoint;
- immutable revision identity, conclusion without overwrite, branching, and
  conflict representation;
- portable sealed evidence and a recipient-controlled trust decision;
- bounded nested scopes and local failure;
- acceptable latency and cost; and
- an explicit external trust root.

Effect typing makes these properties enforceable at action time. It does not
make them appear automatically.

## Illustrative HC shape

The syntax is intentionally schematic. It shows object relationships, not a
proposal for new grammar.

```hc
# `report` is supplied by the invocation context as a minted resource Frame.
# Its source name is not its authority.

.Summarize {
  .text report.read()       # produces a typed read request
  .summary summarize(text)  # pure HC computation
  output.write-versioned: summary
}
```

With a capability for `report.read` and `output.write-versioned`, the requests
may pass. Under a read-only capability, the same byte-identical `Summarize`
closure can read but its write request refuses. Under a context without
`report`, the path is unavailable rather than recovered from ambient process
state.

The trailing colon may remain a useful HC declaration that the method changes a
resource. It is not the source of truth. The measured `output` handler declares
and performs the actual versioned write, so a falsely non-mutating spelling is
detectable at composition time or request construction.

## How the model treats new tools

Unknown HC code may always perform pure computation. It gains effects only from
resource Frames in its context.

A new tool using an existing measured resource protocol is bounded immediately
by the handles it receives; the tool's author does not classify its behavior. A
new protocol requires a new measured handler and composition before it can touch
the world. There is no generic host-call resource through which it can recreate
arbitrary effects.

This is the interface route's answer to the open world: type the boundary the
computation must cross, not every future computation. It remains a genuine open
question whether the protocol families can stay extensible without collapsing
into either a vacuous `IO` capability or a centrally maintained action catalog.
The conceptual model exposes that question; it does not claim to have settled
it.

## Cross-organisational meaning

A handler hash proves code identity, not semantic identity. The same handler
connected to different storage, credentials, network positions, or legal domains
can produce different consequences.

An HC effect record therefore binds at least:

- protocol identifier and version;
- handler and gateway measurement;
- resource issuer and stable identity;
- deployment/domain identity;
- capability issuer and delegation chain; and
- the concrete request and result evidence.

A recipient must either possess an independent binding from those identifiers to
the real-world objects and semantics it recognizes, or detect that it does not
and fail safely. Global uniqueness and matching strings are insufficient.

This means attestation scales per **composition and deployment**, not once per
HC artifact.

## Non-negotiable invariants

An implementation is this model only if all of the following hold:

1. HC source cannot forge a resource or capability Frame.
2. Strings, names, metadata, and identifier spelling carry no ambient authority.
3. Every host effect is reachable only through a measured handler and gateway.
4. The measured operation table contains no effect-general import or invisible
   escape hatch.
5. Resource identity is resolved atomically at minting and cannot be retargeted.
6. Request typing is derived from measured protocol semantics and the resolved
   resource, or a declaration is independently bounded by them.
7. Authorization is a bounded mechanical comparison, never a model judgment.
8. Child contexts and nested handlers can only attenuate authority.
9. Runtime resolution cannot extend the measured upper bound.
10. Every successful effect emits independently inspectable evidence.
11. Raw credentials remain outside HC evaluation.
12. The trusted composition and the consequences outside its guarantee are
    explicitly named.

Removing the effect type while leaving reachability unchanged means the sandbox
is doing all the work and this model has not been implemented.

## What this model deliberately does not promise

- It does not decide whether an action is malicious.
- It does not prevent a human from reading and acting on model output.
- It does not prove all consequences of a permitted operation.
- It does not solve aggregate covert channels or information flow in full.
- It does not make one organization's resource ontology authoritative for
  another.
- It does not make a large semantic handler into a small trusted decision
  procedure; handler and gateway TCBs must still be separated and audited.
- It does not make the existing HC effect syntax sufficient by declaration.

## What implementation would amount to

Implementing dynamic total resource effect typing would not mean adding more
entries to `FrameSchema` or recognizing `_` and `:` correctly, though both may
be supporting work.

It would mean changing the HC runtime boundary so that:

- **Frames are the only way to express both data and requests;**
- **resource Frames are the only way to designate external objects;**
- **contexts are the only way to supply authority;**
- **composition is the only way to set the authority ceiling;**
- **the gateway is the only way to realize an effect;** and
- **the seal is the unavoidable record of what occurred.**

That is the proposed AI-security contract expressed as an HC execution model.
