# HC Security Architecture

**Status:** Design consensus. Nothing here is implemented; this document records
the reasoning so the tickets can be tuned against it rather than rediscovered.\
**Issues:** [#277](https://github.com/TheSwanFactory/hclang/issues/277),
[#301](https://github.com/TheSwanFactory/hclang/issues/301),
[#338](https://github.com/TheSwanFactory/hclang/issues/338),
[#348](https://github.com/TheSwanFactory/hclang/issues/348),
[#349](https://github.com/TheSwanFactory/hclang/issues/349)

## Terms

Three layers, named so they stop being confused with one another.

| Term           | Definition                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------- |
| **HC program** | Frames evaluated by the runtime. No visible syscalls, no memory addressing, no ambient I/O. |
| **HC runtime** | The fully isolated evaluator. Specifies _and_ restricts the entire external boundary.       |
| **harness**    | Whatever bootstraps the runtime — test, dev, prod, bare metal, or a web page.               |

A harness is not the operating system. The two harnesses that exist today are
the Deno CLI and `hcweb.html`, and the browser one has no filesystem, no
environment, and no syscalls at all. Any rule that only one harness can express
belongs to that harness, not to the language.

## 1. HC is the trusted base

The runtime is the enforcement boundary. This is the object-capability position
— E, Joe-E, Caja, SES — where the language runtime _is_ the perimeter and the OS
is not consulted. If the runtime is trustworthy, OS permissions are a
realization detail of one harness; if it is not, no flag repairs it.

HC's form of the claim is stronger than SES's. SES must retrofit confinement
onto a language full of ambient authority: freeze the primordials, remove
`eval`, censor the globals. HC has nothing to retrofit, because the language
never had an `open` or a `fetch` to take away.

Per [`07-dtrb-solved-in-theory.md`](4-ai-security/07-dtrb-solved-in-theory.md),
generated C, TypeScript, MLIR, LLVM, and Verilog are migration targets and "not
independent sources of meaning." Harness permission flags are in that same
category: derived artifacts, never the source of truth.

## 2. No visible syscalls _is_ the confinement

Implicit I/O does not mean I/O without ceremony. It means there is no nameable
primitive to invoke, so a program cannot request authority it has no vocabulary
for. Automatic memory management belongs in the same sentence for the same
reason: pointers and syscalls are both ways to name something outside your own
value graph. Remove both, and a program's reachable world _is_ the frames it was
handed.

## 3. Evaluation is an unprivileged fold

Every HC program is a left fold of frame applications, which is what lets
`07-dtrb` conclude by induction that effects cannot exceed the authority of the
resource frames reachable in context. The induction _requires_ eval to be
unprivileged: a special form with its own powers would be a hole at exactly that
step. JS `eval` is dangerous because it is not merely application — it re-enters
with ambient scope attached. HC's fold is not a hole in a wall; there is no
wall.

Two consequences.

**The evaluator is the small part of the trusted base, and the context is the
large part.** Security attention belongs on what a harness puts in the root
context, not on the interpreter.

**Symbol resolution is the only privileged operation.** Everything else is inert
application. This is why the object-model backlog was hardening rather than
cleanup: #325, #331, #341, and #340 are all "lookup does something besides
resolve." It is also why an unnameable lookup tier is a structural defect
regardless of what it holds — see §7.

## 4. One boundary, four mechanisms

The runtime specifies and restricts the whole external surface. Four mechanisms
carry it.

**Env whitelist.** An HC dictionary of which environment variables are visible,
defaulting to standard UNIX and open-source vars, statically configurable. This
is not a narrowing of `Deno.env`; it is the declaration whose absence is the
current defect. The curated default is what a per-invocation flag cannot
express: it is a property of the runtime, written once, and it covers the vars
that tooling probes.

**Pluggable resource handlers.** Per-scheme code that mocks, blocks, or
implements. Refusal of an unbound scheme is an empty table slot rather than a
policy rule. This makes #277's simulated/live parity and #301's deterministic
fixtures into table entries rather than separate deliverables, and it makes the
adapter surface a data structure instead of a promise.

**Explicitly typed resources.** The resource carries its element type — chars,
lines, or HC code — so `|` and `&` stay generic and no single reading has to
win. The HC-code type makes `<-` a typed read rather than a loader subsystem.

**Deterministic normalization.** Pure and total, before any handler runs.
Canonicalization does not disappear; it localizes to one handler with a bounded
test surface.

## 5. The program is the manifest

HC programs are data structures, and `'…'` is a distinct lexical family, so the
external identities a program names are extractable by reading it. No separate
manifest, therefore no drift between declared and actual use — the failure mode
of `package.json` versus real imports, or declared Android permissions versus
real API calls. [`a03`](a03-unified-quote-delimiters.md) notes that every
external identity is "lexically marked and greppable"; that is the mechanism,
not just ergonomics.

Two tiers, with the soundness assigned deliberately:

- **Static, partial, advisory.** A handler enumerates literal identifiers before
  loading and may warn or ask. Computed identifiers — concatenated, read from
  another resource, passed as arguments — escape it.
- **Dynamic, sound, authoritative.** The handler refuses at application time.

The analyzer is itself HC, since a program is a frame graph; `cli/flatten.ts`
already walks frames as a tree. A harness's warn/ask policy is therefore an HC
program, not a foreign tool.

**Open option worth keeping:** a mode restricting resource identifiers to
literals makes static enumeration _total_. Not the default, but for a program
handed over by an agent, "the external surface is exactly these four
identifiers, statically proven" is far stronger than refusing at runtime.

## 6. Refusal is a value, not an exception

A refused operation yields `$!.…` and flows back through ordinary evaluation, so
it composes: callers can handle it, iterators collect it. This puts
[#338](https://github.com/TheSwanFactory/hclang/issues/338) on the critical path
rather than beside it — an aggregate whose element is an error currently reads
as success, and refusals will routinely arrive nested inside iterator results.

## 7. Two phases, with different channel topologies

The program is never a party to the decision. It is data; it requests nothing
and narrows nothing. The harness reads it and decides. There is exactly one
model, and it has two phases:

**Read.** The harness reads the program, determines the grants, and escalates to
the user only on a detected miss. The default path involves no interaction: the
user appears only where policy does not already cover what the program needs.

**Run.** The harness runs the program. If the program wants something
impossible, a note is exported.

The phases differ in channel direction, and that is the whole guarantee:

| Phase | Inbound (authority may be added)     | Outbound (evidence leaves) |
| ----- | ------------------------------------ | -------------------------- |
| Read  | yes — harness policy, user on a miss | —                          |
| Run   | **none**                             | notes                      |

Non-amplification is therefore not a rule anyone enforces and not a prompt
anyone must remember to disable. The run phase has no inbound channel to abuse.
Any argument of the form "disable interactive permission prompts" is describing
a door this architecture does not have.

**Impossible, not denied.** From inside the program an ungranted resource is not
forbidden, it is nonexistent, so there is no discrimination channel: a program
cannot distinguish "exists but refused" from "does not exist," and therefore
cannot probe the boundary to learn about its host. This is also why the note is
_exported_ rather than returned — it is evidence for the harness and the human,
not a value for the program to branch on.

**Framing check.** Any statement that a _program_ requests, receives, approves,
or narrows authority is a category error, and reliably a sign of importing the
package-manager model where a module asks and a system grants. A data structure
has no standing to ask.

The related structural defect: `Frame.globals` is `Ops` (`lib/frames.ts:65`),
consulted as the final lookup tier with no spelling at all
(`lib/frames/meta-frame.ts:178-192`). `cli/hc.ts:121` feeds
`Deno.env.toObject()` into the root context via `make_context` (`cli/hc.ts:50`),
so a bare identifier resolves to a process environment variable while a
one-character typo reports `$!.name-missing`. Whether a name is bound depends on
ambient process state. #349's `$` and `$$` make the tiers nameable, which is
what makes the perimeter enumerable.

## 8. Datetime is data; `now` is a grant

Datetime is a first-class type, and `%…%` is its parser: text becomes a
structured value exactly as a numeric literal does. This is documented and
unimplemented — `doc/GRAMMAR.md:66-69` and `:299-300` define `%date%`, `%time%`,
and `%datetime%`, `doc/shannon/5-hclang.md:54-57` repeats them, and no time
family is registered in `lib/execute/syntax.ts`.

The split that matters is between the literal and the reading:

- **A datetime literal is inert data.** Like `'…'`, it denotes without
  authorizing. Parsing one performs no observation.
- **`now` is an observation of something outside the program**, so under §2 it
  cannot be ambient. The clock is a harness grant like any other resource.

**Duration is a peer type**, and the point of first-class time is that the
algebra is enforced: datetime minus datetime yields a duration, datetime plus
duration yields a datetime, duration times a scalar yields a duration, and
datetime plus datetime is a type error. HC needs no new syntax to say this —
type is declared with a pair of operators rather than a syntactic construct, so
`~`, `^`, and schemas carry it instead of the evaluator hard-coding the rules.

**Budgets collapse into this.** A time budget in #277 stops being a limiter
subsystem and becomes a duration value plus a clock grant, where exhaustion is
the clock resource refusing. This is the concrete form of
[`RELIGN`](../doc/HLIR/RELIGN.md) treating time and energy as first-class.

**Where the pain is, and the line it forces.** An unambiguous instant — ISO 8601
with `Z` or an explicit offset — is pure and self-contained. A civil time in a
named zone is not: `America/Los_Angeles` cannot become an instant without
tzdata, which is externally mutable data revised by political decision. So
named-zone conversion is a handler, not a literal. Drawing the line the other
way would pull a mutable external dependency into the trusted base.

**Testing is the payoff, not the afterthought.** A harness installs a frozen or
scripted clock; prod installs the real one; the program is byte-identical across
them, exactly as for any other handler. HCTest's `;` source and `#` expected
pairs currently cannot express anything time-dependent at all, and a pinned
clock makes `# %2026-08-21T00:00:00Z%` a legitimate expectation. It also retires
a workaround: `a02-hcweb-deployment.md:246-248` requires a deterministic UTC
timestamp derived from the commit "so reproducibility is not defeated by
wall-clock time," which is a hand-rolled substitute for a clock that was never
ambient in the first place.

## Noted, not resolved here

- **Nested harnesses.** An HC program acting as harness to another is desirable
  — supervising untrusted code is the point — and at that moment handler
  composition must be attenuation-only.
- **Handler installation authority.** Presumed harness-only and not an HC value.
  Stated as an invariant so it can be tested rather than assumed.
- **`%…%` versus `%%`.** `%%` is Modulo (`lib/ops.ts:39`), which sits exactly
  where an empty time literal would. [`a03`](a03-unified-quote-delimiters.md)
  settled the analogous `"` versus `"""` case with run-length parity, so there
  is precedent, but the collision needs deciding rather than assuming.
- **Ticket hygiene.** #348 still carries a "Required, not optional" section that
  is Deno CLI harness configuration, and its env/`$$` split with #349 was an
  artifact of drafting rather than a design decision. Both need tuning against
  this document.
