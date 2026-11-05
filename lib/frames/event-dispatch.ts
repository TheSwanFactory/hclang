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
 * Each event runs with an `AccessRecord` active, so its actual reads and
 * writes are dated by version. When it finishes, every shared identity it
 * wrote outside its potential footprint is reported as an **escape**: the
 * declared authority was narrower than the actual access, so the schedule was
 * not justified. A caller may supply a footprint of its own in place of the
 * inferred one, which is how a declared footprint is checked against the
 * event's behaviour.
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
  /** A footprint to use in place of the inferred one. */
  readonly potential?: PotentialFootprint;
}

export type DispatchPolicy = "sequential" | "interleave" | "footprint";

/** What one event did under a dispatch. */
export interface EventOutcome {
  readonly label: string;
  readonly result: Frame;
  /** Statements run, each one scheduler turn. */
  readonly steps: number;
  readonly potential: PotentialFootprint;
  readonly actual: AccessRecord;
  /** Shared identities written outside the potential footprint. */
  readonly escapes: readonly Frame[];
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
  readonly potential: PotentialFootprint;
  readonly record: AccessRecord;
  readonly waitedFor: Set<string>;
  generator?: Generator<Frame, Frame>;
  steps: number;
  done: boolean;
  result: Frame;
}

/**
 * Runs `events` under `policy` and reports what each did and in what order.
 */
export function dispatch(
  events: readonly DispatchEvent[],
  policy: DispatchPolicy = "footprint",
): DispatchReport {
  const trace: string[] = [];
  const states: Running[] = events.map((event) => ({
    event,
    potential: event.potential ??
      potentialFootprint(event.target, event.argument ?? Frame.nil),
    record: new AccessRecord(),
    waitedFor: new Set<string>(),
    steps: 0,
    done: false,
    result: Frame.nil,
  }));

  const mayStart = (index: number): boolean => {
    if (policy === "interleave") return true;
    const state = states[index];
    for (let other = 0; other < states.length; other++) {
      if (other === index) continue;
      const peer = states[other];
      if (peer.done) continue;
      // An earlier unfinished event keeps program order; a later one matters
      // only once it is running.
      if (other > index && !peer.generator) continue;
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

  const shared = new Set<Frame>();
  for (const state of states) {
    for (const frame of state.potential.reads) shared.add(frame);
    for (const frame of state.potential.writes) shared.add(frame);
  }
  return {
    policy,
    trace,
    outcomes: states.map((state) => ({
      label: state.event.label,
      result: state.result,
      steps: state.steps,
      potential: state.potential,
      actual: state.record,
      escapes: isOpaque(state.potential) ? [] : state.record.sharedWrites()
        .filter((frame) =>
          (frame.ownsIdentity() || shared.has(frame)) &&
          !state.potential.writes.has(frame)
        ),
      waitedFor: [...state.waitedFor],
    })),
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
