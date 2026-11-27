# Simplifying the REST Design

**Author:** Codex.\
**Status:** Recommendation after the second review; not an accepted decision.\
**Source:** This chat, following the user's question about the design becoming
overly narrow or idiosyncratic.

Parts of the design have become too prescriptive. Codex's reviews contributed by
turning implementation concerns into additional design requirements.

The core remains coherent: harness-selected grants, worker-held credentials,
bounded requests, and attenuation that cannot widen authority. Complexity has
accumulated around startup choreography, static credential checks, generated
commands, and detailed failure protocols.

## Recommended simplification

- **One startup rule:** initialize only installed grants and their ancestors. If
  a required credential is missing, fail with clear instructions. Drop the
  static-literal scan and conditional omission behavior.
- **One enforcement owner:** let the worker own final policy enforcement and
  shared budgets. Avoid duplicating authoritative state across isolates.
- **One diagnostic command:** `--grants` explains selected authority and
  credential requirements. Exact generated launch commands can be a convenience
  later.
- **One honest write contract:** record intent before sending, report
  uncertainty after dispatch failures, and never retry automatically. Worker
  retirement and timeout mechanics belong in implementation unless needed to
  establish that contract.

Separating definitions from installed grants and making write uncertainty
explicit were necessary corrections. The exact handshake sequence, transport
message format, and exhaustive failure-state machinery mostly belong in
implementation.

Revise the proposal around these few invariants rather than expanding it with
every review. This recommendation supersedes Codex's earlier preference for
static checks plus selective omission; it does not silently amend the archived
Kiro proposal.

## Venue

The versioned specification should hold design, rationale and unresolved
choices. Issue #570 should track scope, the spec link and acceptance criteria.
The numbered records preserve the discussion; they do not make every review
suggestion a requirement.
