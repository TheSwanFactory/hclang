import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameString } from "./frame-string.ts";
import { BoundMethod } from "./bound-method.ts";
import {
  dispatch,
  type DispatchEvent,
  type DispatchPolicy,
  type DispatchReport,
} from "./event-dispatch.ts";

/**
 * The dispatcher as a host-namespace value, so an HC program can hand its
 * own closures to `dispatch` and observe what each policy does to them
 * (occurrence/figure 015.24j: the VACT witness has to reach the dispatcher
 * under test from the testdoc that constructs its state).
 *
 * A harness that installs `dispatchNamespace()` under `DISPATCH_KEY` in its
 * host namespace gives HC source four callables:
 *
 *     $$.dispatch.sequential           [e₁, e₂, …]
 *     $$.dispatch.certified-sequential [e₁, e₂, …]
 *     $$.dispatch.interleave           [e₁, e₂, …]
 *     $$.dispatch.footprint            [e₁, e₂, …]
 *
 * Each `eᵢ` is a bound closure or bound method, called with nil, or a pair
 * `[callable, argument]`. The answer is one aggregate: its elements are the
 * events' results in program order, and its properties the schedule the
 * policy chose, `trace` as `“i:n …”` (the nth statement of event i, in the
 * order they ran), `waited` as each event's indexes waited for, and
 * `escapes` as the count of shared frames each event wrote outside its
 * potential footprint, which the guard keeps at zero under `footprint`. The
 * HC state the events touch is the program's own, so the program reads the
 * final state itself, with its own observer, after the dispatch answers.
 *
 * This is a bridge, not a language feature: the policies are host values
 * reached through `$$`, which a bare name never searches, and nothing here
 * changes how HC evaluates, and it grants no authority: every event is a
 * closure the program already holds, run with the authority it already has.
 * It is installed in every program the CLI runs (`cli/hc.ts`), in every
 * `HCLang` session and so the playground (`lib/execute/hc-lang.ts`), and by
 * the companion Deno test; a host that does not install it has no
 * `dispatch`, and `$$.dispatch` answers `$!.name-missing` there.
 *
 * @module
 */

/** The key the dispatch namespace is bound under in a host namespace. */
export const DISPATCH_KEY = "dispatch";

const POLICIES: readonly DispatchPolicy[] = [
  "sequential",
  "certified-sequential",
  "interleave",
  "footprint",
];

/** One policy as a callable host value. */
class DispatchPolicyFrame extends Frame {
  constructor(private readonly policy: DispatchPolicy) {
    super();
  }

  public override toString(): string {
    return `$$.${DISPATCH_KEY}.${this.policy}`;
  }

  /** A host value is itself; evaluating it performs no dispatch. */
  public override in(): Frame {
    return this;
  }

  public override call(argument: Frame): Frame {
    const events = eventsOf(argument);
    if (!Array.isArray(events)) return events;
    return reportFrame(dispatch(events, this.policy));
  }
}

/** The events an HC argument denotes, or the error that refuses it. */
function eventsOf(argument: Frame): DispatchEvent[] | Frame {
  const items = argument.referent();
  if (!(items instanceof FrameArray)) {
    return Frame.error(`$!.dispatch-events ${items.className()}`);
  }
  const events: DispatchEvent[] = [];
  for (const [index, item] of items.asArray().entries()) {
    const value = item.referent();
    const label = String(index);
    if (isCallable(value)) {
      events.push({ label, target: value });
      continue;
    }
    if (value instanceof FrameArray) {
      const [target, argument] = value.asArray();
      const callee = target?.referent();
      if (callee && isCallable(callee)) {
        events.push({ label, target: callee, argument: argument ?? Frame.nil });
        continue;
      }
    }
    return Frame.error(`$!.dispatch-event ${label} ${value.className()}`);
  }
  return events;
}

const isCallable = (frame: Frame): boolean =>
  frame instanceof FrameLazy || frame instanceof BoundMethod;

/** The report as one aggregate: results as elements, schedule as properties. */
function reportFrame(report: DispatchReport): Frame {
  const result = new FrameArray(report.outcomes.map((o) => o.result));
  result.set("trace", new FrameString(report.trace.join(" ")));
  result.set(
    "waited",
    new FrameArray(
      report.outcomes.map((o) =>
        new FrameArray(o.waitedFor.map((label) => FrameCount.for(label)))
      ),
    ),
  );
  result.set(
    "escapes",
    new FrameArray(
      report.outcomes.map((o) => FrameCount.for(String(o.escapes.length))),
    ),
  );
  return result;
}

/** A fresh namespace holding the three policies, for a host to install. */
export function dispatchNamespace(): Frame {
  const namespace = new Frame();
  for (const policy of POLICIES) {
    namespace.set(policy, new DispatchPolicyFrame(policy));
  }
  return namespace;
}
