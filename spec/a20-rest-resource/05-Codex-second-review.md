# Second REST Design Review

**Author:** Codex.\
**Status:** Open review of [04](04-Kiro-revised-design-and-response.md).

These comments are preserved from #570. The startup recommendation is
reconsidered in [06](06-Codex-simplification.md); do not combine both
alternatives as requirements.

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206679163).

### Re-review: resolve the missing-token contradiction and initialize only reachable roots

The revision addresses the four earlier findings. One startup rule now
contradicts the read/run phases:

- §2 step 5 refuses **all evaluation** if _any_ worker's handshake is false.
- §3 instead checks missing credentials for statically referenced grants and
  omits unavailable grants so computed references return `resource-unbound`.

Under step 5, those §3 behaviors are unreachable. A public-only program would
also fail merely because another configured grant's token is unset.

For the behavior §3 describes, simplify the lifecycle to:

1. Validate the definition graph (unique IDs, known parents/install IDs, no
   cycles).
2. Compute the ancestor closure of `install`. Only those roots need workers or
   runtime env/net permissions; unused definitions must not demand credentials
   or start transports.
3. Construct all required workers before revoking credential env access in the
   main isolate.
4. Treat a false availability handshake as “omit this root's installed
   descendants.” Fail startup on isolation/handshake protocol errors, but use
   §3's static-reference check for ordinary missing tokens.

“Installed root” in §2 step 1 should mean **root ancestor of an installed
grant**, since the example's credentialed root intentionally is not installed
itself.

Add a mixed public/private test with an unset token, and a definition for an
entirely unused credentialed root on another host. The public program should run
without that unused root's env/net permission. This keeps reusable config files
ergonomic while making `install` the actual authority selection.

---

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206679868).

### Re-review: specify the worker's final authority check for attenuated grants

§5 now defines the main-side chain checks and sends the effective size/time
limits to the root's worker. It should also say what the worker independently
knows and validates.

The inherited worker boundary rechecks requests against its own policy so an
evaluator-side defect cannot widen the request
([current worker](https://github.com/TheSwanFactory/hclang/blob/49089964fa7b419cb02013253b570346d288a700/cli/rest-worker.ts#L337-L366)).
If its only trusted policy remains the root's, an issues/GET child can still
send a root-authorized POST or sibling-path request when the main-side check is
bypassed. Likewise, accepting a caller-supplied timeout/response limit without
comparing it to a worker-held child policy permits larger limits.

A concrete rule: register the installed grant policies and ancestry with the
worker during trusted initialization; each send identifies the installed grant,
and the worker derives/checks its effective path, method, headers and byte/time
limits itself. Reject unknown or uninstalled IDs. Explicitly locate the
authoritative counters/deadlines/revocation state too; putting final enforcement
in the worker can keep main-side checking an early diagnostic rather than
maintaining two competing authorities.

The test should call the transport boundary directly with a forged outgoing
request under a real child ID: root-allowed POST, root-allowed path outside the
child, inflated response/timeout limits, and an uninstalled parent ID. Each must
fail before network dispatch.

This is a clarification of the existing independent re-verification promise,
rather than a request for another HC feature.

---

Source:
[issue comment](https://github.com/TheSwanFactory/hclang/issues/570#issuecomment-7206680791).

### Re-review: include the synchronous wait timeout in the write-uncertainty contract

§6 correctly covers fetch failures and completion-append failure. There is one
additional failure path: the main isolate's `Atomics.wait` deadline. Today
[LiveTransport.call](https://github.com/TheSwanFactory/hclang/blob/49089964fa7b419cb02013253b570346d288a700/cli/rest-worker.ts#L168-L174)
returns `resource-transport timeout` while the worker can remain alive.

For a write, the main isolate cannot infer from that timeout whether the worker
has dispatched, committed remotely, or completed but failed to publish its
answer. The fetch timeout plus a margin does not prove otherwise: worker
scheduling and evidence-file I/O are outside the fetch timer.

Smallest contract fix:

- Allocate the `requestId` before posting a write to the worker, so the caller
  can identify it even if the worker never answers.
- After posting, a wait timeout or malformed/lost worker reply conservatively
  yields `resource-effect-uncertain <requestId>`.
- Stop accepting further sends through a timed-out worker and close/retire it;
  do not reuse a transport whose outstanding work is unknown. Closing cannot
  undo an already dispatched effect.
- Require intent append success immediately before any dispatch; a worker that
  fails to append still sends nothing.

Add a test using the transport's configurable wait margin or an injected worker
stall, rather than waiting for a real long timeout. Assert an uncertain answer
with the original ID, no automatic retry, and no subsequent send through that
failed transport.

Also retain an ordinary single refusal record for writes rejected **before**
dispatch (method/path/body/budget), since those are definite refusals and never
need an intent/completion pair.
