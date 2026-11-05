import { Frame } from "./frame.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { BoundMethod } from "./bound-method.ts";
import {
  AccessRecord,
  versionOf,
  withAccessRecord,
} from "./reference-tracking.ts";
import {
  footprintsConflict,
  isOpaque,
  isState,
  type PotentialFootprint,
  potentialFootprint,
} from "./access-footprint.ts";

/**
 * Effect-aware event dispatch over statement steps (occurrence/figure 015.23,
 * 015.23a §4, 015.24f).
 *
 * An **event** is one call of an HC callable, a `BoundMethod` such as
 * `x_.set_` or a bound closure such as `incr-x`, with an argument. The
 * interpreter is sequential, so two events cannot run at the same instant;
 * what a dispatcher decides is whether their *statements* may interleave. The
 * statement is the finest effect boundary HC defines inside a body
 * (`FrameExpr.stepBody`), so it is the unit of overlap here, and nothing
 * finer is: a statement runs to completion, nested calls included.
 *
 * Three policies make the dispatch question testable:
 *
 * - **sequential**: each event runs to completion in program order. The
 *   baseline every other policy must agree with on the final state.
 * - **interleave**: statements of all events alternate round-robin with no
 *   coordination at all. This is the executable counterexample: two
 *   read-then-write events on one `x` lose an update, which shows that
 *   separate statements, and separate calls, are not a transaction.
 * - **footprint**: an event may start only when no unfinished event that
 *   precedes it in program order, and no running event, has a potential
 *   footprint that conflicts with its own (`footprintsConflict`: a write in
 *   one meets a read or write in the other, or either is opaque). Events that
 *   may both run interleave; the rest wait. Conflicting events therefore
 *   execute in program order, one after another, which is what makes the
 *   final state the sequential one. Readers are not given snapshots: a reader
 *   of `x` waits for an earlier writer of `x` and blocks a later one, so
 *   every read sees one committed version xᵢ and never a torn pair of values.
 *
 * ## Admission is decided on the inferred footprint, at start
 *
 * The footprint an admission decision rests on is always the one the walk
 * infers from the event's code (`potentialFootprint`), and it is inferred
 * when the event is about to start, not when the dispatch is assembled: an
 * earlier event may have rebound a name the body uses, and the walk resolves
 * names to what they denote *now*. A caller may **declare** a footprint, but
 * a declaration can only widen the inferred one, never narrow it: a narrower
 * declaration is reported (`undeclared`), not trusted. Scheduling therefore
 * never rests on an unverified claim, and the policy is sound relative to the
 * walk: two events the walk sees to conflict run in program order, whatever
 * anyone declares.
 *
 * ## Escapes are a diagnostic of the walk, not a safety net
 *
 * Each event runs with an `AccessRecord` active, so its actual reads and
 * writes are dated by version. When it finishes, every shared state frame it
 * wrote outside its potential footprint is reported as an **escape**, and
 * every shared state frame it read outside its potential reads as a
 * **read escape**. Shared state is what the walk counts as state: an
 * aggregate, or a plain scope frame whose binding a `@name` can rebind. An
 * escape means the walk under-inferred, so the schedule that admitted the
 * event was not justified; it is reported after the writes have committed,
 * and nothing is rolled back. The known gaps of the walk are listed in
 * `access-footprint.ts`; an event the walk cannot read at all is opaque and
 * is serialized against everything, which is the fail-closed case.
 *
 * What this is not: it is not threads, it is not a transaction, and it does
 * not roll anything back. An event that fails stops at its failing statement
 * as a call would; the dispatcher reports the failure and runs the others.
 *
 * @module
 */

/** One call to dispatch: a callable Frame and its argument. */
export interface DispatchEvent {
  readonly label: string;
  readonly target: Frame;
  readonly argument?: Frame;
  /**
   * A footprint the caller declares for the event. It widens the inferred
   * footprint for scheduling and is checked against the event's actual
   * accesses (`EventOutcome.undeclared`); it never narrows what the walk
   * inferred, so it cannot admit a conflict the walk would have refused.
   */
  readonly declared?: PotentialFootprint;
}

export type DispatchPolicy = "sequential" | "interleave" | "footprint";

/** What one event did under a dispatch. */
export interface EventOutcome {
  readonly label: string;
  readonly result: Frame;
  /** Statements run, each one scheduler turn. */
  readonly steps: number;
  /** The footprint the walk inferred when the event started. */
  readonly inferred: PotentialFootprint;
  /** The footprint admission rested on: `inferred`, widened by `declared`. */
  readonly potential: PotentialFootprint;
  readonly actual: AccessRecord;
  /** Shared state written outside the potential footprint. */
  readonly escapes: readonly Frame[];
  /** Shared state read outside the potential reads. */
  readonly readEscapes: readonly Frame[];
  /** Shared state written outside the caller's declaration, if it made one. */
  readonly undeclared: readonly Frame[];
  /** Labels of the events this one waited for before starting. */
  readonly waitedFor: readonly string[];
}

export interface DispatchReport {
  readonly policy: DispatchPolicy;
  readonly outcomes: readonly EventOutcome[];
  /** `label:n` for the nth statement of each event, in execution order. */
  readonly trace: readonly string[];
}

interface Running {
  readonly event: DispatchEvent;
  readonly record: AccessRecord;
  readonly waitedFor: Set<string>;
  /** Inferred when the event starts; re-read while it is still waiting. */
  inferred: PotentialFootprint;
  potential: PotentialFootprint;
  generator?: Generator<Frame, Frame>;
  steps: number;
  done: boolean;
  result: Frame;
}

/** The inferred footprint, widened by the caller's declaration if any. */
function widen(
  inferred: PotentialFootprint,
  declared: PotentialFootprint | undefined,
): PotentialFootprint {
  if (!declared) return inferred;
  return {
    reads: new Set([...inferred.reads, ...declared.reads]),
    writes: new Set([...inferred.writes, ...declared.writes]),
    unresolved: [...inferred.unresolved, ...declared.unresolved],
  };
}

/**
 * The shared state frames `record` touched that `footprint` did not allow:
 * writes outside its writes, or reads outside its reads. Shared means not
 * created by the event; state means what the walk would count as state.
 */
export function accessesOutside(
  record: AccessRecord,
  footprint: PotentialFootprint,
  access: "writes" | "reads" = "writes",
): Frame[] {
  const touched = access === "writes"
    ? record.sharedWrites()
    : record.sharedReads();
  const allowed = access === "writes" ? footprint.writes : footprint.reads;
  return touched.filter((frame) => isState(frame) && !allowed.has(frame));
}

/**
 * Runs `events` under `policy` and reports what each did and in what order.
 */
export function dispatch(
  events: readonly DispatchEvent[],
  policy: DispatchPolicy = "footprint",
): DispatchReport {
  const trace: string[] = [];
  const infer = (event: DispatchEvent): PotentialFootprint =>
    potentialFootprint(event.target, event.argument ?? Frame.nil);
  const states: Running[] = events.map((event) => {
    const inferred = infer(event);
    return {
      event,
      record: new AccessRecord(),
      waitedFor: new Set<string>(),
      inferred,
      potential: widen(inferred, event.declared),
      steps: 0,
      done: false,
      result: Frame.nil,
    };
  });

  // A waiting event's names may have been rebound by an event that finished
  // since, so its footprint is read again from its code until it starts.
  const refresh = (state: Running): void => {
    if (state.generator) return;
    state.inferred = infer(state.event);
    state.potential = widen(state.inferred, state.event.declared);
  };

  const mayStart = (index: number): boolean => {
    if (policy === "interleave") return true;
    const state = states[index];
    refresh(state);
    for (let other = 0; other < states.length; other++) {
      if (other === index) continue;
      const peer = states[other];
      if (peer.done) continue;
      // An earlier unfinished event keeps program order; a later one matters
      // only once it is running.
      if (other > index && !peer.generator) continue;
      refresh(peer);
      const conflicts = policy === "sequential" ||
        footprintsConflict(state.potential, peer.potential);
      if (conflicts) {
        state.waitedFor.add(peer.event.label);
        return false;
      }
    }
    return true;
  };

  let remaining = states.length;
  while (remaining > 0) {
    let progressed = false;
    for (let index = 0; index < states.length; index++) {
      const state = states[index];
      if (state.done) continue;
      if (!state.generator) {
        if (!mayStart(index)) continue;
        state.generator = stepsOf(
          state.event.target,
          state.event.argument ?? Frame.nil,
        );
      }
      const generator = state.generator;
      const step = withAccessRecord(state.record, () => generator.next());
      progressed = true;
      if (step.done) {
        state.done = true;
        state.result = step.value;
        remaining--;
      } else {
        state.steps++;
        trace.push(`${state.event.label}:${state.steps}`);
      }
      // Sequential runs each event to completion before looking further.
      if (policy === "sequential" && !state.done) index--;
    }
    if (!progressed) {
      throw new Error("$!.dispatch-stalled: no event could start");
    }
  }

  return {
    policy,
    trace,
    outcomes: states.map((state) => {
      // An opaque event claimed nothing, so nothing it did escapes a claim.
      const opaque = isOpaque(state.potential);
      const declared = state.event.declared;
      return {
        label: state.event.label,
        result: state.result,
        steps: state.steps,
        inferred: state.inferred,
        potential: state.potential,
        actual: state.record,
        escapes: opaque ? [] : accessesOutside(state.record, state.potential),
        readEscapes: opaque
          ? []
          : accessesOutside(state.record, state.potential, "reads"),
        undeclared: declared && !isOpaque(declared)
          ? accessesOutside(state.record, declared)
          : [],
        waitedFor: [...state.waitedFor],
      };
    }),
  };
}

/** The statement steps of calling `target`; a callable without a body is one. */
export function stepsOf(
  target: Frame,
  argument: Frame = Frame.nil,
): Generator<Frame, Frame> {
  if (target instanceof BoundMethod) return target.steps(argument);
  if (target instanceof FrameLazy) return target.steps(argument);
  return (function* (): Generator<Frame, Frame> {
    const result = target.call(argument, Frame.nil);
    yield result;
    return result;
  })();
}

/** The version of `frame` an outcome read, or undefined if it never did. */
export function versionRead(
  outcome: EventOutcome,
  frame: Frame,
): number | undefined {
  return outcome.actual.reads.get(frame);
}

/** The version of `frame` an outcome's last write produced, if it wrote it. */
export function versionWritten(
  outcome: EventOutcome,
  frame: Frame,
): number | undefined {
  return outcome.actual.writes.get(frame);
}

export { versionOf };
