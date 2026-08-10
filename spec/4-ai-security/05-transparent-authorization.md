# Transparent Authorization of Implicit I/O

**Status:** conceptual refinement of
[`03-dynamic-total-resource-effect-typing.md`](03-dynamic-total-resource-effect-typing.md)

## Thesis

> **HC provides total isolation through transparent authorization of implicit
> I/O.**

- **Implicit I/O:** HC code applies Frames without knowing or caring whether an
  application is pure, simulated, or connected to an external resource.
- **Transparent authorization:** permission is bound when a resource Frame is
  constructed, then disappears from ordinary evaluation. It is transparent to
  the computation and explicit to the enclosure and verifier.
- **Total isolation:** HC code cannot affect anything for which its measured
  context does not contain an authorized Frame.

## The HC execution model

HC programs are executable Frame structures. Evaluation is a left fold using
uniform double dispatch. These forms are equivalent:

```hc
resource request
(resource request)
resource(request)
```

There is no special call syntax and no I/O instruction. Every application
returns a value, and every top-level value becomes output.

Literals evaluate to themselves. An HCSV file containing only constants
therefore outputs itself: it quines. Code and data do not pass through separate
execution models; operations merely cause some Frames in the same structure to
evaluate differently.

Conceptually:

```text
application : Frame × Frame → Frame
program     : fold-left(application, Frames) → output Frames
```

The caller decides where to assign or emit the returned value. A callee receives
non-mutable values, may read them and perform arbitrarily complex computation,
then returns a value. Mutation requires the caller to supply an explicit mutable
Frame on which assignment is possible.

Application is always double dispatch, so behavior belongs to the interaction
between the participating Frames rather than to special syntax or a privileged
I/O operator.

## Permissioning happens at construction

An ordinary Frame carries no external authority. A trusted enclosure constructs
a resource Frame by resolving a resource and binding the authority under which
it may be used:

```text
authorize(resource, authority, lifetime, evidence-policy)
    → ResourceFrame
```

The constructed Frame is a **capability closure**. It hides:

- stable resource identity;
- the permission bound to this handle;
- any credential or host handle needed to exercise it;
- lifetime, budget, and revocation state;
- the resource-specific implementation; and
- mandatory evidence production.

HC code receives only the resulting Frame. It cannot inspect the credential,
forge the construction provenance, widen the permission, or recover a more
powerful host interface.

After construction, use is ordinary HC application:

```hc
resource request
```

There is no authorization operation in that expression. The code does not ask
for permission, declare an effect, invoke a policy engine, or distinguish a live
resource from a pure substitute. Authorization has already happened.

## Transparent does not mean ambient

Transparent authorization is invisible to the computation but not absent.

| Perspective                     | What is visible                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| HC code or an LLM generating HC | Frames, application, and returned values                                                      |
| Enclosure                       | resource construction, authority, credentials, lifetime, and effect implementation            |
| Verifier                        | measured constructors and dispatch implementations, authority provenance, and effect evidence |

Authority remains explicit as reachability. A computation can exercise a
resource only if its context contains the corresponding constructed Frame.
Strings, paths, URLs, names, metadata, and identifier spelling carry no
authority by themselves.

The concise rule is:

> **Transparent to code; legible to the verifier.**

## Implicit I/O

From the program's perspective, there is no I/O distinction:

```text
left-fold(resource, request)
    → ordinary result Frames       # pure resource
    → deterministic result Frames  # simulated resource
    → ordinary result Frames       # live external resource
```

The same byte-identical HC program works in all three cases. The resource Frame
determines the interpretation supplied by the enclosure; the program sees only
the returned values.

Resource-specific mechanics may remain hidden. A database Frame may encapsulate
transport, pooling, retry, serialization, and credentials. Its construction and
measured implementation must still bound the security-relevant envelope:
resource identity, permitted operations, direction, reversibility, scope,
authority, lifetime, and budget.

Implicit therefore describes the programming model, not the audit model. Every
live external consequence remains attributable to a constructed Frame in the
measured composition.

## Effective purity

HC is not strictly referentially transparent. A resource Frame may mutate the
world, consume a budget, observe changing state, or return different values when
applied twice.

The code's relationship to authority is nevertheless effectively pure:

- authority cannot be created by computation;
- effects cannot occur without a reachable authorized Frame;
- raw credentials never enter the HC value universe;
- replacing a live Frame with a pure Frame requires no code change; and
- the only thing returned to the computation is another value.

Useful descriptions are:

- **effect-opaque:** the effect mechanism is hidden from HC code;
- **authority-oblivious:** the code does not know what permission backs a Frame;
- **effect-parametric:** the same code works with pure, simulated, or live
  Frames; and
- **ambientless:** authority exists only through reachable constructed Frames.

## Attenuation is construction

Delegation does not mutate a resource Frame to make it broader or narrower. It
constructs a new Frame whose authority is a subset:

```text
attenuate(ResourceFrame, narrower-authority)
    → NarrowerResourceFrame
```

The construction mechanism enforces:

```text
authority(child) ⊆ authority(parent)
```

Nested HC contexts receive only the newly constructed narrower Frame. Ordinary
scope inheritance cannot recover the parent credential or manufacture a wider
one.

Expiry and revocation may be enforced behind the Frame, but they do not become
policy decisions made by HC code. An expired or revoked capability simply no
longer produces the authorized external interpretation.

## The isolation invariant

Let `reachable(context)` be the Frames an HC computation can obtain from its
initial context and ordinary Frame results. Then:

```text
effects(program, context)
    ⊆ union(authority(frame)
             for frame in reachable(context)
             if frame was constructed as a resource)
```

In plain language:

> An HC computation can affect only the resources represented by authorized
> Frames made reachable by its enclosure.

Unknown HC code therefore arrives with no unknown effects. It arrives with no
effects of its own. Its entire possible effect set is the authority topology of
the constructed Frames placed in its context.

This dissolves the need to infer effects from source, tool names, or LLM intent.
The enclosure need only prove that:

1. HC code cannot construct or recover a resource Frame independently;
2. every host-backed double-dispatch path belongs to the measured composition;
3. no ambient host operation bypasses those Frames; and
4. constructed Frames cannot exercise authority beyond what construction bound.

## Evidence remains outside program output

Every HC program emits values. Those values are the program's result, not
trusted testimony about how they were obtained.

A live resource Frame or its enclosure must emit evidence as an unavoidable
consequence of exercising authority. The HC code cannot suppress, forge, or
redirect that record. This keeps two streams conceptually distinct:

```text
program output : values returned by Frame evaluation
effect evidence: records emitted by the authorized enclosure
```

An HCSV program may quine exactly while its enclosure separately records which
resource Frames were exercised to produce or transmit it.

## Consequence for the `03` model

`03` describes a separate effect request Frame and general runtime gateway. That
is one possible implementation, but it is not fundamental to HC and may be
unnecessary.

In the more native model:

- the constructor is the authorization gate;
- the constructed Frame is the capability;
- its bounded dispatch behavior is the effect type;
- its hidden implementation is the effect handler;
- ordinary application exercises already-authorized behavior; and
- its enclosure emits the evidence.

A separate gateway remains useful only where multiple resource Frames share a
credential boundary or enforcement mechanism. It is an implementation choice,
not part of HC's programming model.

## Non-negotiable conditions

Transparent authorization provides total isolation only if:

1. Resource Frames cannot be constructed from HC source or serialized data.
2. Credentials and raw host handles are absent from HC-visible Frame metadata.
3. All host-backed dispatch implementations are fixed by the measured
   composition.
4. No general host callback, dynamic loader, process primitive, or ambient
   global recreates external authority.
5. Mutable Frames grant only the mutation authority explicitly bound at their
   construction.
6. Attenuated Frames cannot recover or widen their parent authority.
7. Effect evidence is produced below the HC program and cannot be disabled by
   it.
8. The construction mechanism and hidden effect implementation are small enough
   to isolate, measure, and audit.

Under those conditions, an LLM may generate arbitrary HC structures without
participating in authorization and without gaining a path around it.

## Final formulation

> HC is an executable Frame data structure evaluated by uniform left-fold double
> dispatch. Programs emit values and contain no intrinsic I/O. A trusted
> enclosure introduces external authority only by constructing opaque resource
> Frames. Their authorization is transparent during evaluation, their effects
> are implicit to code, and their provenance and evidence remain explicit to the
> verifier. The computation can affect no resource for which it was not given a
> reachable authorized Frame.
