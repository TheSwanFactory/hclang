# The Goldiware Conjecture

**Status:** conceptual bridge from [`Goldiware.adoc`](../../doc/Goldiware.adoc)
to HC's AI-security claim

## Conjecture

> **AI has increased computational capability beyond the regime in which
> conventional abstractions of effect remain safe. Goldiware identifies the
> missing abstractions, and HC may realize them in a form that composes.**

This is not the claim that AI created a new kind of effect. It is the claim that
AI removed the scarcity, predictability, and human latency that concealed an old
abstraction error.

Conventional systems routinely conflate:

1. knowing how to perform an action;
2. reaching machinery capable of performing it; and
3. being authorized to perform it now.

That conflation was survivable while programs were comparatively fixed,
programmers chose effectful calls explicitly, and humans supplied judgment at
human speed. An AI system can discover affordances, reinterpret data as
instructions, compose tools in unanticipated ways, and execute adaptive action
at machine speed. Its nominal permission may remain unchanged while its
effective capability expands dramatically.

AI therefore acts as a stress test. It turns every reachable interface into a
candidate effect path and exposes the weakness of authorizing containers such as
users, processes, service accounts, or persistent Agents instead of authorizing
particular effects on particular resources.

## The abstraction Goldiware changes

Computer science usually begins with Boolean logic and mathematical functions.
State, time, energy, concurrency, topology, I/O, and authority then arrive as
complications around an otherwise ideal computation.

Goldiware begins with consequential action instead. Its primitive, the hexon, is
a stateful switch that admits non-Boolean physical values, consumes time and
energy, and may produce multiple asynchronous outputs. A hexgram is therefore a
causal dependency structure rather than merely an instruction sequence.

The Golden Girls Architecture carries the same inversion upward:

- **Experience** is the state on which action operates.
- **Values** determine which possible action matters now.
- **Capabilities** determine what action can occur.

Effects are not annotations on the real computation. They are what make the
computation real.

A valid abstraction may hide resource-specific mechanism, but it must preserve
every observable that can change the authority or meaning of a composition. For
an external effect, those observables include at least:

- stable resource identity;
- authorized operation and direction;
- delegation and lifetime;
- state transition;
- time, budget, and other resource consumption;
- reversibility or compensation; and
- independently produced evidence.

The Goldiware conjecture is that abstractions organized around experience,
values, capabilities, and action will compose where abstractions organized
around pure evaluation plus incidental I/O leak.

## HC as a software realization

HC inherits the executable-data-structure direction described as PEACE in
Goldiware:

- programs and data are Frames;
- application is the universal operation over Frames;
- evaluation is a left fold of applications;
- every application returns a value;
- types are executable predicates over values; and
- an external capability can be represented by a constructed resource Frame.

This does not make effects disappear. It places them at the boundary where their
real semantics can be preserved while keeping their incidental mechanics out of
ordinary reasoning.

The resulting division is:

```text
HC computation     values, application, predicates, returned values
Resource Frame     identity, bounded authority, effect implementation
Enclosure          credential custody, construction, revocation, evidence
```

The code need not know whether an application is pure, simulated, or live. The
enclosure must know exactly which effects a live application can produce.

> **Transparent to cognition; explicit at the causal boundary.**

## The resource-Frame theorem

The broad conjecture has a small candidate proof.

A trusted enclosure constructs a resource Frame from a URI and a credential
whose scope covers only the identified resource:

```text
construct(uri, scoped-credential) -> ResourceFrame
```

The credential is sealed inside the construction. HC code receives the resource
Frame, not the credential or a general host interface.

Let `authority(frame)` denote the external authority reachable through a Frame.
Require application to be non-amplifying:

```text
authority(frame argument)
    subset-of authority(frame) union authority(argument)
```

For ordinary returned data, authority is empty. If an application deliberately
returns another resource Frame, construction must prove:

```text
authority(child) subset-of authority(parent)
```

The proof is then structural:

1. External authority enters an HC context only through constructed resource
   Frames.
2. Frame application cannot create or widen authority.
3. Every HC program is a left fold of Frame applications.
4. Therefore HC execution cannot create or widen authority.

Equivalently, for any HC program `program` and initial context `context`:

```text
effects(program, context)
    subset-of union(authority(frame)
                    for frame in reachable(context)
                    if frame is a constructed resource)
```

The argument is independent of the program's origin or intelligence. Arbitrary
HC source, a quine, an adversarial executable Frame structure, and HC generated
by a future model all receive the same upper bound: the authority topology of
their constructed inputs.

## What “unbreakable from inside” means

The theorem quantifies over everything expressible inside HC. It depends on a
small set of facts about the boundary:

1. A URI names a resource but grants no authority by itself.
2. Raw credentials and host handles are not HC values and cannot be inspected,
   serialized, or reconstructed from Frame metadata.
3. Resource Frames cannot be forged by HC source or ordinary data.
4. Every host effect is reachable only through a measured resource Frame.
5. Dispatch cannot escape to a general callback, loader, process primitive, or
   ambient host API.
6. Aliasing, mutation, and returned Frames cannot widen the authority supplied
   at construction.
7. Evidence is emitted by the enclosure as a consequence of effect, not by the
   HC program as a voluntary action.

These are not properties to establish separately for every program. They are
properties of the Frame constructor, evaluator, host adapters, and embedding
environment. The trusted computing base is therefore finite and auditable even
when the space of possible HC programs is not.

“Inside” does not include compromise of that trusted computing base, a stolen
credential outside HC, or a hardware and host escape. Those remain substrate
security questions. The claim is that no increase in intelligence inside the HC
value universe expands the perimeter defined by the enclosure.

## Why this is not force-fitting

The AI-security requirement was derived independently: authorization must move
to a boundary that can observe resource, identity, scope, delegation, and
effect. Goldiware independently treats capability and consequential action as
fundamental computational categories. HC independently represents behavior as
uniform application of executable Frames.

The correspondence is therefore testable rather than rhetorical. It predicts
that a narrowly constructed resource Frame should remain confined under
arbitrary internal composition without requiring effect inference, intent
classification, or cooperation from the code exercising it.

The correspondence is false if security requires HC code to declare its intent
truthfully, if source spelling grants authority, if composition can recover
ambient host access, or if resource-specific effects cannot be bounded behind
the Frame abstraction.

## First demonstration

Construct one live resource Frame with:

- a stable URI;
- one narrowly scoped credential;
- a small request and result protocol;
- an explicit lifetime and budget; and
- unavoidable evidence production.

Give hostile HC code that Frame and unrestricted access to ordinary HC
computation. Attempt to:

- read or exercise a sibling resource;
- widen the URI or operation scope;
- extract or serialize the credential;
- manufacture a second live resource Frame;
- recover a raw host callback;
- suppress the evidence record; and
- return a more authoritative Frame.

The demonstration succeeds only if all such attempts fail while authorized
applications continue to return ordinary HC values.

This is the decisive first experiment because it tests the abstraction rather
than a catalog of programs. If it holds, improved model intelligence increases
what can be computed with the supplied values without increasing what can be
affected beyond the supplied capabilities.

## Consequence

The strongest version of the conjecture is:

> **Effects matter, and AI has made incorrect abstractions of effect
> unsustainable. HC can bound real-world consequence compositionally because
> authority is supplied as constructed capability, not inferred from code or
> inherited from the process executing it.**

Transparent authorization is one application of that result. The larger claim is
that HC may preserve the actual causal structure of computation: values
describe, capabilities act, and composition does not manufacture authority.
