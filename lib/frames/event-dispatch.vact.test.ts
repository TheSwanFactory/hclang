import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { HCEval } from "../execute/hc-eval.ts";
import { HCTest } from "../execute/hc-test.ts";
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameName } from "./frame-name.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { EvaluationScope } from "./evaluation-scope.ts";
import { DISPATCH_KEY, dispatchNamespace } from "./dispatch-host.ts";
import { FrameResource } from "./frame-resource.ts";
import { RESOURCE_ROOT_KEY } from "./resource-binding.ts";
import { MemoryStore } from "./resource-store.ts";
import { withHCBundle } from "../bundle/hc-bundle.ts";
import { HCLang } from "../execute/hc-lang.ts";
import { effectSubscribersOf, registerEffect } from "./effect-registry.ts";
import {
  AccessRecord,
  UncertifiedAccess,
  withAccessRecord,
} from "./reference-tracking.ts";
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
 * (occurrence/figure 015.24j, repaired by 015.24l after the PR #484 review).
 *
 * The testdoc is the one source of truth for the construction: this file
 * takes its bytes from the bundle (`HC_SOURCES`, which `bundle:check` keeps
 * equal to the file), re-runs the whole testdoc in-process through the same
 * harness the CLI uses with the same `$$.dispatch` bridge installed, and then
 * extracts the construction, the statements before the first dispatch, and
 * dispatches the same closures directly, so the finer observers the bridge
 * does not print can be applied: versions xᵢ, certificates, actual accesses,
 * refusals, subscriber lists, and the serial observation of every order of
 * the events.
 *
 * What is checked here is finite: these constructions, these schedules. The
 * argument that carries the claim over the fragment is spec a12 §Soundness;
 * the last describe block exhibits where the fragment ends.
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
  /** Evaluates more HC statements in the same file scope. */
  run: (source: string) => void;
  /**
   * The observer: the testdoc's `state ()`, `[x_.n, y_.n]`, extended by the
   * state every other scenario's observer reads: `w_.n` and `fired_.n` (which
   * callbacks fired), `cell2_.v` and `log2_.count`, and `obj_.k`.
   */
  state: () => string;
}

/** A fresh evaluation of the construction in a plain file scope, as the CLI has. */
const world = (): World => {
  const scope = new Frame();
  const hc = new HCEval(new FrameArray([]), scope, host());
  const run = (source: string): void => {
    hc.call(source + "\n");
    expect(hc.finish()).toBe(true);
    expect(hc.hasFailures()).toBe(false);
  };
  run(construction().join("\n"));
  const read = (key: string): Frame =>
    FrameSymbol.for(key).in(EvaluationScope.root(scope));
  const event = (
    label: string,
    key: string,
    argument?: Frame,
  ): DispatchEvent => ({ label, target: read(key), argument });
  const field = (key: string, name: string): string =>
    scope.get_here(key).get(name).toString();
  return {
    scope,
    x: scope.get_here("x_"),
    y: scope.get_here("y_"),
    log: scope.get_here("log_"),
    read,
    event,
    run,
    state: () =>
      `[${
        [
          field("x_", "n"),
          field("y_", "n"),
          field("w_", "n"),
          field("fired_", "n"),
          field("cell2_", "v"),
          field("log2_", "count"),
          field("obj_", "k"),
        ].join(", ")
      }]`,
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

/** The serial observation of `keys` run in the order `order`. */
const serial = (
  keys: string[],
  order: number[],
  policy: "sequential" | "certified-sequential" = "sequential",
): Observation => {
  const w = world();
  const report = dispatch(
    order.map((index) => w.event(String(index), keys[index])),
    policy,
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

/**
 * Every event, refused or not, stayed within its certificate (a refused
 * access is never recorded), and no two that overlapped conflict.
 */
const expectCertified = (report: DispatchReport): void => {
  for (const outcome of report.outcomes) {
    // An opaque event was serialized against everything; it certifies nothing.
    if (isOpaque(outcome.potential)) continue;
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
    expect(statements).toContain("cell2_ -> {log2_.tick_ ()};");
    expect(statements.some((s) => s.startsWith(".hidden-incr-x "))).toBe(true);
    expect(statements.some((s) => s.startsWith(".arm-hidden "))).toBe(true);
    // Only `nested` reaches for the bridge; every other event is plain HC.
    expect(statements.filter((s) => s.includes("$$"))).toEqual([
      ".nested {$$.dispatch.sequential [read-x]};",
    ]);
    const w = world();
    expect(w.state()).toBe("[5, 10, 0, 0, 0, 0, 1]");
  });

  it("is reachable from an HCLang session (the playground host), not only the CLI", async () => {
    const lang = new HCLang();
    expect(
      await lang.call(
        ".x_ [.n 5; .set_ {@n _;}]; .incr-x {.a x_.n; x_.set_ (a + 1); x_.n}; " +
          "$$.dispatch.certified-sequential [incr-x, incr-x]",
      ),
    ).toContain("6, 7]");
    lang.reset();
    expect(await lang.call("$$.dispatch.footprint")).toBe(
      "$$.dispatch.footprint",
    );
  });
});

describe("VACT witness: footprint reproduces the certified serial observation", () => {
  // Every scenario, refused events included: the baseline is the
  // prefix-and-failure serial run, not the serial run of completed events.
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
    "W9 hidden read and write": ["hidden-incr-x", "incr-x"],
    "W10 hidden write beside a reader": ["hidden-write-x", "read-x"],
    "W11 arrow callback writes log_": ["cell-twice", "log-slow"],
    "W12 opaque failing event": ["ghost", "incr-y"],
    "W13 refused after a certified write": ["prefix-x", "read-x"],
    "W14 hidden registration, then mutation": ["arm-hidden", "poke"],
    "W14 mutation, then hidden registration": ["poke-late", "arm-hidden"],
    "W14 registration by name, then mutation": ["arm", "poke"],
    "W14 mutation, then registration by name": ["poke-late", "arm"],
    "W15 first callback refused": ["poke2"],
    "W16 hidden miss beside a re-parent": ["peek-k", "rebase"],
    "W16 named miss beside a re-parent": ["peek-k-open", "rebase"],
    "W17 a later event cannot overtake": [
      "retarget-holder",
      "via-holder",
      "incr-y",
    ],
    "mixed": ["incr-x", "incr-y", "move", "via-alias", "incr-x", "read-x"],
  };

  for (const [name, keys] of Object.entries(SCENARIOS)) {
    it(`${name}: equals the program-order certified serial observation, and stays certified`, () => {
      const { report, observation } = observe(keys, "footprint");
      const inOrder = keys.map((_, i) => i);
      expect(observation).toEqual(
        serial(keys, inOrder, "certified-sequential"),
      );
      // Where nothing is refused, that is the plain serial observation too.
      if (report.outcomes.every((o) => o.refused === undefined)) {
        expect(observation).toEqual(serial(keys, inOrder));
      }
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
    expect(observation.state).toBe("[6, 10, 0, 0, 0, 0, 1]");
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
    expect(observation.state).toBe("[6, 10, 0, 0, 0, 0, 1]");
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
    expect(w.state()).toBe("[6, 10, 0, 0, 0, 0, 1]");
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
      state: "[5, 10, 0, 0, 0, 0, 1]",
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

describe("VACT witness: PR #484 review repairs, with the finer observers", () => {
  it("W13: the refused event's certified prefix stays, and a later reader sees it", () => {
    const { report, w, observation } = observe(
      ["prefix-x", "read-x"],
      "footprint",
    );
    const [prefix, reader] = report.outcomes;
    expect(prefix.refused).toEqual({ frame: w.y, access: "read" });
    expect(versionWritten(prefix, w.x)).toBeDefined();
    expect(versionRead(reader, w.x)).toBe(versionWritten(prefix, w.x));
    expect(observation.results).toEqual(["$!.uncertified-read", "6"]);
    // The old claim's baseline, the serial run of the completed event alone,
    // reads 5; the plain serial run completes the refused event.
    expect(serial(["read-x"], [0]).results).toEqual(["5"]);
    expect(serial(["prefix-x", "read-x"], [0, 1]).results).toEqual([
      "10",
      "6",
    ]);
  });

  it("W14: an arrow is a write of the managed value, in the certificate and at the seam", () => {
    const w = world();
    const managed = w.scope.get_here("w_");
    const arm = potentialFootprint(w.read("arm"));
    expect(arm.writes.has(managed)).toBe(true);
    // Registered through data, it is outside the certificate: refused before
    // the subscriber list changes, so nothing is registered.
    const before = versionOf(managed);
    const report = dispatch([
      w.event("arm-hidden", "arm-hidden"),
      w.event("poke", "poke"),
    ]);
    expect(byLabel(report, "arm-hidden").refused).toEqual({
      frame: managed,
      access: "write",
    });
    expect(effectSubscribersOf(managed)).toEqual([]);
    expect(byLabel(report, "poke").result.toString()).toBe("0");
    expect(versionOf(managed)).toBe(before + 1);
    // Registered by name, it serializes with the mutation in program order.
    const named = observe(["arm", "poke"], "footprint");
    expect(byLabel(named.report, "1").waitedFor).toEqual(["0"]);
    expect(named.observation.results).toEqual(["0", "1"]);
    expect(effectSubscribersOf(named.w.scope.get_here("w_")).length).toBe(1);
  });

  it("W15: a refusal in the first callback stops delivery; the second never runs", () => {
    const w = world();
    const log2 = w.scope.get_here("log2_");
    const cell2 = w.scope.get_here("cell2_");
    expect(effectSubscribersOf(cell2).length).toBe(2);
    const before = versionOf(log2);
    const report = dispatch([w.event("poke2", "poke2")]);
    const [outcome] = report.outcomes;
    expect(outcome.refused).toEqual({ frame: w.y, access: "read" });
    expect(outcome.potential.writes.has(log2)).toBe(true);
    expect(outcome.actual.writes.has(cell2)).toBe(true);
    expect(outcome.actual.writes.has(log2)).toBe(false);
    expect(versionOf(log2)).toBe(before);
    expect(w.state()).toBe("[5, 10, 0, 0, 1, 0, 1]");
  });

  it("W15: an ordinary host exception in a callback still lets the siblings run", () => {
    const managed = new Frame();
    const fired: string[] = [];
    const boom = new (class extends Frame {
      public override call(): Frame {
        fired.push("boom");
        throw new Error("host bug");
      }
    })();
    const after = new (class extends Frame {
      public override call(): Frame {
        fired.push("after");
        return Frame.nil;
      }
    })();
    managed.set("v", FrameCount.for("0"));
    registerEffect(managed, boom);
    registerEffect(managed, after);
    expect(() => managed.set("v", FrameCount.for("1"))).toThrow("host bug");
    expect(fired).toEqual(["boom", "after"]);
  });

  it("W16: a miss is a read, refused before the lookup falls through", () => {
    const { report, w } = observe(["peek-k", "rebase"], "footprint");
    const obj = w.scope.get_here("obj_");
    const peek = byLabel(report, "0");
    expect(peek.potential.reads.has(obj)).toBe(false);
    expect(peek.refused).toEqual({ frame: obj, access: "read" });
    expect(peek.actual.reads.has(obj)).toBe(false);
    const open = potentialFootprint(w.read("peek-k-open"));
    expect(open.reads.has(obj)).toBe(true);
  });

  it("W16: a pattern binding is opaque to the walk and a guarded write at the seam", () => {
    const w = world();
    // An aggregate, so a read by name keeps its identity behind a handle (a
    // plain `Frame` value would be read through a fresh copy instead).
    const pat = new FrameArray([]);
    const bound = new FrameName("seed");
    pat.set("/k.*/", bound);
    w.scope.set("pat", pat);
    w.run(".pattern-open {pat.kz};");
    w.run(".pats [{pat.kz}];");
    w.run(".pattern-hidden {(pats & {_ ()}) .0};");
    w.run(".pattern-named {.r pat; (pats & {_ ()}) .0};");
    expect(isOpaque(potentialFootprint(w.read("pattern-open")))).toBe(true);
    // Hidden: the miss on `pat` is refused before any match.
    const hidden = dispatch([w.event("h", "pattern-hidden")]);
    expect(hidden.outcomes[0].refused).toEqual({ frame: pat, access: "read" });
    expect(bound.source).toBe("seed");
    // `pat` read by name but not written: the match is refused before it
    // rewrites the bound value's source.
    const named = dispatch([w.event("n", "pattern-named")]);
    expect(named.outcomes[0].potential.reads.has(pat)).toBe(true);
    expect(named.outcomes[0].refused).toEqual({ frame: pat, access: "write" });
    expect(bound.source).toBe("seed");
    // Opaque, it is serialized and unguarded, and the match lands.
    const opaque = dispatch([w.event("o", "pattern-open")]);
    expect(opaque.outcomes[0].refused).toBeUndefined();
    expect(bound.source).toBe("kz");
  });

  it("W17: a later event does not start before an earlier one has", () => {
    const { report } = observe(
      ["retarget-holder", "via-holder", "incr-y"],
      "footprint",
    );
    expect(byLabel(report, "2").waitedFor).toEqual(["1"]);
    expect(report.outcomes.map((o) => o.result.toString())).toEqual([
      "0",
      "11",
      "12",
    ]);
  });

  it("W18: a refusal belongs to the guard that refused it, across nested dispatches", () => {
    const w = world();
    // The outer event's certificate allows nothing shared.
    const outer = new AccessRecord();
    outer.guard = (frame) => !isState(frame);
    let thrown: unknown;
    try {
      withAccessRecord(outer, () => dispatch([w.event("inner", "read-x")]));
    } catch (error) {
      thrown = error;
    }
    // The inner dispatcher does not absorb the outer guard's refusal.
    expect(thrown).toBeInstanceOf(UncertifiedAccess);
    expect((thrown as UncertifiedAccess).record).toBe(outer);
    // An inner event's own refusal is still the inner dispatcher's.
    const permissive = new AccessRecord();
    permissive.guard = () => true;
    const report = withAccessRecord(
      permissive,
      () => dispatch([w.event("hidden", "hidden-incr-x")]),
    );
    expect(report.outcomes[0].refused?.access).toBe("read");
    // From HC, an event reaching for `$$` under a guard is refused there.
    const nested = dispatch([w.event("nested", "nested")]);
    expect(nested.outcomes[0].result.toString()).toBe("$!.uncertified-read");
  });
});

describe("VACT boundary: a native that reads state without a seam is outside the claim", () => {
  it("is admitted, unrefused and unreported, and breaks the equality", () => {
    // A host native that reads y's binding straight from `meta`, as printing
    // and some structural natives do: no `get_here`, no `elements`, so no guard.
    class PeekNative extends Frame {
      constructor(private readonly target: Frame) {
        super();
      }
      public override in(): Frame {
        return this;
      }
      public override call(): Frame {
        return this.target.meta["n"];
      }
    }
    const run = (policy: DispatchPolicy): string[] => {
      const w = world();
      w.scope.set("peek-native", new PeekNative(w.y));
      w.run(".slow-peek {.p 0; .q 0; .r 0; peek-native ()};");
      const report = dispatch([
        w.event("peek", "slow-peek"),
        w.event("incr", "incr-y"),
      ], policy);
      expect(report.outcomes.every((o) => o.refused === undefined)).toBe(true);
      expect(report.outcomes.every((o) => o.readEscapes.length === 0)).toBe(
        true,
      );
      return report.outcomes.map((o) => o.result.toString());
    };
    // The walk sees a value, not code, so the event is not opaque and is
    // admitted beside the writer of y; the read it makes is invisible.
    expect(run("footprint")).toEqual(["11", "11"]);
    expect(run("certified-sequential")).toEqual(["10", "11"]);
  });
});
