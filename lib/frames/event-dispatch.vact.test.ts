import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { HCEval } from "../execute/hc-eval.ts";
import { HCTest } from "../execute/hc-test.ts";
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { EvaluationScope } from "./evaluation-scope.ts";
import { DISPATCH_KEY, dispatchNamespace } from "./dispatch-host.ts";
import { FrameResource } from "./frame-resource.ts";
import { RESOURCE_ROOT_KEY } from "./resource-binding.ts";
import { MemoryStore } from "./resource-store.ts";
import { withHCBundle } from "../bundle/hc-bundle.ts";
import {
  footprintsConflict,
  isOpaque,
  isState,
  potentialFootprint,
} from "./access-footprint.ts";
import {
  dispatch,
  type DispatchEvent,
  type DispatchPolicy,
  type DispatchReport,
  type EventOutcome,
  versionOf,
  versionRead,
  versionWritten,
} from "./event-dispatch.ts";

/**
 * The host-side half of the VACT witness in `hc/art-dispatch-vact.hc`
 * (occurrence/figure 015.24j).
 *
 * The testdoc is the one source of truth for the construction: this file
 * takes its bytes from the bundle (`HC_SOURCES`, which `bundle:check` keeps
 * equal to the file), re-runs the whole testdoc in-process through the same
 * harness the CLI uses with the same `$$.dispatch` bridge installed, and then
 * extracts the construction, the statements before the first dispatch, and
 * dispatches the same closures directly, so the finer observers the bridge
 * does not print can be applied: versions xᵢ, certificates, actual accesses,
 * refusals, and the sequential observation of every order of the events.
 */

const TESTDOC = "hc/art-dispatch-vact.hc";
const SOURCE = HC_SOURCES.get(TESTDOC)!;

/**
 * The host namespace the CLI gives a testdoc: the dispatcher, and a resource
 * root over an empty store (with the bundled `hc/` laid over it), so the
 * opaque import in the testdoc fails there as it does under the CLI.
 */
const host = (): Frame => {
  const namespace = new Frame();
  namespace.set(DISPATCH_KEY, dispatchNamespace());
  namespace.set(
    RESOURCE_ROOT_KEY,
    FrameResource.root(withHCBundle(new MemoryStore())),
  );
  return namespace;
};

/** The construction: every statement of the testdoc before its first dispatch. */
const construction = (): string[] => {
  const lines = SOURCE.split("\n");
  const stop = lines.findIndex((line) => line.startsWith("; $$.dispatch"));
  expect(stop).toBeGreaterThan(0);
  return lines.slice(0, stop)
    .filter((line) => /^; .*;$/.test(line))
    .map((line) => line.slice(2));
};

interface World {
  scope: Frame;
  x: Frame;
  y: Frame;
  log: Frame;
  read: (key: string) => Frame;
  event: (label: string, key: string, argument?: Frame) => DispatchEvent;
  /** The testdoc's own observer, `state ()`: `[x_.n, y_.n]`. */
  state: () => string;
}

/** A fresh evaluation of the construction in a plain file scope, as the CLI has. */
const world = (): World => {
  const scope = new Frame();
  const hc = new HCEval(new FrameArray([]), scope, host());
  hc.call(construction().join("\n") + "\n");
  expect(hc.finish()).toBe(true);
  expect(hc.hasFailures()).toBe(false);
  const read = (key: string): Frame =>
    FrameSymbol.for(key).in(EvaluationScope.root(scope));
  const event = (
    label: string,
    key: string,
    argument?: Frame,
  ): DispatchEvent => ({ label, target: read(key), argument });
  const n = (identity: Frame): string => identity.get_here("n").toString();
  return {
    scope,
    x: scope.get_here("x_"),
    y: scope.get_here("y_"),
    log: scope.get_here("log_"),
    read,
    event,
    state: () => `[${n(scope.get_here("x_"))}, ${n(scope.get_here("y_"))}]`,
  };
};

/** The observable of a dispatch: results in program order, then the state. */
interface Observation {
  results: string[];
  state: string;
}

const observe = (
  keys: string[],
  policy: DispatchPolicy,
): { report: DispatchReport; observation: Observation; w: World } => {
  const w = world();
  const report = dispatch(
    keys.map((key, index) => w.event(String(index), key)),
    policy,
  );
  return {
    report,
    w,
    observation: {
      results: report.outcomes.map((o) => o.result.toString()),
      state: w.state(),
    },
  };
};

/** The sequential observation of `keys` run in the order `order`. */
const serial = (keys: string[], order: number[]): Observation => {
  const w = world();
  const report = dispatch(
    order.map((index) => w.event(String(index), keys[index])),
    "sequential",
  );
  // Results are reported in program order, whatever order they ran in.
  const results = keys.map(() => "");
  order.forEach((index, position) => {
    results[index] = report.outcomes[position].result.toString();
  });
  return { results, state: w.state() };
};

const permutations = (n: number): number[][] => {
  if (n === 0) return [[]];
  return permutations(n - 1).flatMap((rest) =>
    Array.from({ length: n }, (_, at) => [
      ...rest.slice(0, at),
      n - 1,
      ...rest.slice(at),
    ])
  );
};

/** Labels of events whose statements interleaved with `label`'s in the trace. */
const overlapping = (report: DispatchReport, label: string): Set<string> => {
  const steps = report.trace.map((entry) => entry.split(":")[0]);
  const first = steps.indexOf(label);
  const last = steps.lastIndexOf(label);
  const others = new Set<string>();
  for (let at = first + 1; at < last; at++) {
    if (steps[at] !== label) others.add(steps[at]);
  }
  return others;
};

/** Every completed event stayed within its certificate, and no two that overlapped conflict. */
const expectCertified = (report: DispatchReport): void => {
  for (const outcome of report.outcomes) {
    // An opaque event was serialized against everything; it certifies nothing.
    if (outcome.refused || isOpaque(outcome.potential)) continue;
    const reads = outcome.actual.sharedReads().filter(isState);
    const writes = outcome.actual.sharedWrites().filter(isState);
    for (const frame of reads) {
      expect(outcome.potential.reads.has(frame)).toBe(true);
    }
    for (const frame of writes) {
      expect(outcome.potential.writes.has(frame)).toBe(true);
    }
    expect(outcome.escapes).toEqual([]);
    expect(outcome.readEscapes).toEqual([]);
  }
  for (const outcome of report.outcomes) {
    for (const other of overlapping(report, outcome.label)) {
      const peer = report.outcomes.find((o) => o.label === other)!;
      expect(footprintsConflict(outcome.potential, peer.potential)).toBe(false);
    }
  }
};

const byLabel = (report: DispatchReport, label: string): EventOutcome =>
  report.outcomes.find((o) => o.label === label)!;

describe("VACT witness: the testdoc itself", () => {
  it("is bundled and runs in-process with the dispatcher installed, every example passing", () => {
    expect(SOURCE).toBeDefined();
    const test = new HCTest(new FrameArray([]));
    const hc = new HCEval(new FrameArray([]), new Frame(), host()).withOutput(
      test,
    );
    // As `cli/runfile.ts` feeds an `.hc` file: one line at a time.
    for (const line of SOURCE.split("\n")) hc.call(line, true);
    expect(hc.finish()).toBe(true);
    test.finish();
    expect(test.n.fail).toBe(0);
    expect(test.n.unimplemented).toBe(0);
    expect(test.n.pass).toBeGreaterThanOrEqual(40);
  });

  it("extracts the construction the witnesses run against", () => {
    const statements = construction();
    expect(statements[0]).toBe(".x_ [.n 5; .set_ {@n _;}];");
    expect(statements).toContain("cell_ -> {log_.tick_ ()};");
    expect(statements.some((s) => s.startsWith(".hidden-incr-x "))).toBe(true);
    expect(statements.some((s) => s.includes("$$"))).toBe(false);
    const w = world();
    expect(w.state()).toBe("[5, 10]");
  });
});

describe("VACT witness: footprint reproduces the sequential observation", () => {
  const SCENARIOS: Record<string, string[]> = {
    "W1 shared x write/write": ["incr-x", "incr-x"],
    "W2 mutable alias": ["incr-x", "via-alias"],
    "W3 disjoint x and y": ["incr-x", "incr-y"],
    "W4 writer then reader": ["incr-x", "read-x"],
    "W4 reader then writer": ["read-x", "incr-x"],
    "W5 functional update": ["functional", "read-x"],
    "W6 transfer and slow reader": ["move", "sum-slow"],
    "W6 two transfers": ["move", "move"],
    "W7 rebound name": ["retarget", "via-t", "incr-y"],
    "W8 returned closure": ["via-mk", "incr-x"],
    "W12 opaque failing event": ["ghost", "incr-y"],
    "mixed": ["incr-x", "incr-y", "move", "via-alias", "incr-x", "read-x"],
  };

  for (const [name, keys] of Object.entries(SCENARIOS)) {
    it(`${name}: equals the program-order serial observation, and stays certified`, () => {
      const { report, observation } = observe(keys, "footprint");
      expect(report.outcomes.every((o) => o.refused === undefined)).toBe(true);
      expect(observation).toEqual(serial(keys, keys.map((_, i) => i)));
      expectCertified(report);
    });
  }

  it("W1, W6, W9: interleave is not serializable in any order (the counterexample)", () => {
    for (
      const keys of [["incr-x", "incr-x"], ["move", "sum-slow"], [
        "hidden-incr-x",
        "incr-x",
      ]]
    ) {
      const { observation } = observe(keys, "interleave");
      const serials = permutations(keys.length).map((order) =>
        serial(keys, order)
      );
      expect(serials.some((s) =>
        s.state === observation.state &&
        s.results.join("|") === observation.results.join("|")
      )).toBe(false);
    }
  });

  it("W4: a reader is given exactly one committed version of x", () => {
    const after = observe(["incr-x", "read-x"], "footprint");
    const [writer, reader] = after.report.outcomes;
    expect(versionRead(reader, after.w.x)).toBe(
      versionWritten(writer, after.w.x),
    );
    const before = observe(["read-x", "incr-x"], "footprint");
    const [reader2, writer2] = before.report.outcomes;
    expect(versionRead(reader2, before.w.x)).toBe(
      versionWritten(writer2, before.w.x)! - 1,
    );
  });

  it("W7: the rebound name is resolved when the event starts, not when dispatched", () => {
    const { report, w } = observe(["retarget", "via-t", "incr-y"], "footprint");
    const viaT = byLabel(report, "1");
    expect(viaT.inferred.writes.has(w.y)).toBe(true);
    expect(viaT.inferred.writes.has(w.x)).toBe(false);
    expect(byLabel(report, "2").waitedFor).toContain("1");
  });
});

describe("VACT witness: the certificate is enforced before the access", () => {
  it("W9: a call hidden in data is refused at its first uncertified read, nothing committed", () => {
    const { report, w, observation } = observe(
      ["hidden-incr-x", "incr-x"],
      "footprint",
    );
    const [hidden, direct] = report.outcomes;
    expect(hidden.inferred.reads.has(w.x)).toBe(false);
    expect(hidden.inferred.writes.has(w.x)).toBe(false);
    expect(hidden.refused).toEqual({ frame: w.x, access: "read" });
    expect(hidden.result.toString()).toBe("$!.uncertified-read");
    expect(hidden.result.isFailedResult()).toBe(true);
    expect(hidden.actual.reads.has(w.x)).toBe(false);
    expect(hidden.actual.writes.has(w.x)).toBe(false);
    expect(versionWritten(direct, w.x)).toBe(versionOf(w.x));
    expect(direct.refused).toBeUndefined();
    // The completed events alone are the serial observation.
    expect(observation.state).toBe("[6, 10]");
    expect(direct.result.toString()).toBe("6");
    expectCertified(report);
  });

  it("W9 at the uncoordinated baseline: the same event loses an update and escapes late", () => {
    const { report, w, observation } = observe(
      ["hidden-incr-x", "incr-x"],
      "interleave",
    );
    const [hidden] = report.outcomes;
    expect(hidden.refused).toBeUndefined();
    expect(hidden.escapes).toEqual([w.x]);
    expect(hidden.readEscapes).toContain(w.x);
    expect(observation.state).toBe("[6, 10]");
    expect(observation.results).toEqual(["6", "6"]);
  });

  it("W10: closures inside a data argument are refused the same way", () => {
    const w = world();
    const report = dispatch([
      w.event("each", "each", w.scope.get_here("setters")),
      w.event("direct", "incr-x"),
    ]);
    expect(byLabel(report, "each").refused?.access).toBe("read");
    expect(byLabel(report, "direct").result.toString()).toBe("6");
    expect(w.state()).toBe("[6, 10]");
  });

  it("W10: a hidden write is refused at the commit point, so the mutation does not land", () => {
    const { report, w, observation } = observe(
      ["hidden-write-x", "read-x"],
      "footprint",
    );
    const [writer, reader] = report.outcomes;
    expect(writer.inferred.reads.has(w.x)).toBe(true);
    expect(writer.inferred.writes.has(w.x)).toBe(false);
    expect(reader.waitedFor).toEqual([]);
    expect(writer.refused).toEqual({ frame: w.x, access: "write" });
    expect(writer.result.toString()).toBe("$!.uncertified-write");
    expect(writer.actual.writes.has(w.x)).toBe(false);
    expect(versionOf(w.x)).toBe(versionRead(writer, w.x));
    expect(observation).toEqual({
      results: ["$!.uncertified-write", "5"],
      state: "[5, 10]",
    });
  });

  it("W11: the arrow's callback is in the writer's certificate, so the pair serializes", () => {
    const w = world();
    const footprint = potentialFootprint(w.read("cell-twice"));
    expect(footprint.writes.has(w.log)).toBe(true);
    expect(footprint.writes.has(w.scope.get_here("cell_"))).toBe(true);
    const report = dispatch([
      w.event("cell-twice", "cell-twice"),
      w.event("log-slow", "log-slow"),
    ]);
    expect(byLabel(report, "log-slow").waitedFor).toEqual(["cell-twice"]);
    expect(report.outcomes.every((o) => o.refused === undefined)).toBe(true);
    expect(w.log.get_here("count").toString()).toBe("12");
    expectCertified(report);
  });

  it("no guard is installed under sequential or interleave", () => {
    for (const policy of ["sequential", "interleave"] as const) {
      const { report } = observe(["hidden-incr-x", "incr-x"], policy);
      expect(report.outcomes.every((o) => o.refused === undefined)).toBe(true);
    }
  });
});
