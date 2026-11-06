import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { evaluate } from "../execute/evaluate.ts";
import { HCEval } from "../execute/hc-eval.ts";
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { EvaluationScope } from "./evaluation-scope.ts";
import { potentialFootprint } from "./access-footprint.ts";
import { AccessRecord, withAccessRecord } from "./reference-tracking.ts";
import {
  accessesOutside,
  dispatch,
  type DispatchEvent,
  type DispatchPolicy,
  type DispatchReport,
  stepsOf,
  versionOf,
  versionRead,
  versionWritten,
} from "./event-dispatch.ts";

/**
 * The HC program every dispatch below runs against. Two mutable identities,
 * `x_` and `y_`, with a mutable alias `y-of-x_` and an immutable alias `z`;
 * circuits that read, write, and read-then-write them.
 */
const PROGRAM = `
.x_ [.n 5; .set_ {@n _;}; .get {n}; .inner_ [.k 0; .bump_ {@k (k + 1);}]];
.y_ [.n 10; .set_ {@n _;}];
.y-of-x_ x_;
.z x_;
.zy y_;
.incr-x {.a x_.n; x_.set_ (a + 1);};
.incr-y {.a y_.n; y_.set_ (a + 1);};
.read-x {x_.n};
.read-y {y_.n};
.sum-slow {.a x_.n; .pad 0; a + y_.n};
.functional-y {zy.set_ 0};
.poke-inner {x_.inner_.bump_ ()};
.alias-write {.w_ x_; w_.set_ 99};
.move {.v x_.n; x_.set_ (v - 1); y_.set_ (y_.n + 1);};
.sum {x_.n + y_.n};
.ghost {nowhere.set_ 1; x_.set_ 0;};
.via-alias {.a y-of-x_.n; y-of-x_.set_ (a + 1);};
.functional {z.set_ 0};
.t_ x_;
.retarget {@t_ y_;};
.via-t {.a t_.n; t_.set_ (a + 1);};
.apply {_ ()};
`;

const EMPTY = {
  reads: new Set<Frame>(),
  writes: new Set<Frame>(),
  unresolved: [] as string[],
};

interface Program {
  scope: Frame;
  x: Frame;
  y: Frame;
  n: (identity: Frame) => number;
  event: (label: string, key: string, argument?: Frame) => DispatchEvent;
  run: (labels: string[], policy: DispatchPolicy) => DispatchReport;
}

const program = (): Program => {
  const scope = evaluate(PROGRAM);
  const x = scope.get_here("x_");
  const y = scope.get_here("y_");
  const read = (key: string): Frame =>
    FrameSymbol.for(key).in(EvaluationScope.root(scope));
  const event = (
    label: string,
    key: string,
    argument?: Frame,
  ): DispatchEvent => ({ label, target: read(key), argument });
  const run = (labels: string[], policy: DispatchPolicy): DispatchReport =>
    dispatch(
      labels.map((label, index) => event(`${label}${index}`, label)),
      policy,
    );
  const n = (identity: Frame): number =>
    Number(identity.get_here("n").toString());
  return { scope, x, y, n, event, run };
};

describe("event dispatch: stepping", () => {
  it("steps a closure one statement at a time to the same answer as a call", () => {
    const { scope } = program();
    const target = FrameSymbol.for("move").in(EvaluationScope.root(scope));
    const steps = [...stepsOf(target)];
    expect(steps.length).toBe(3);
    expect(scope.get_here("x_").get_here("n").toString()).toBe("4");
    expect(scope.get_here("y_").get_here("n").toString()).toBe("11");
  });

  it("steps a bound mutating method and answers its receiver", () => {
    const { scope, x } = program();
    const target = FrameSymbol.for("x_").in(EvaluationScope.root(scope)).get(
      "set_",
    );
    const generator = stepsOf(target, FrameCount.for("42"));
    let last = generator.next();
    while (!last.done) last = generator.next();
    expect(last.value.referent()).toBe(x);
    expect(x.get_here("n").toString()).toBe("42");
  });
});

describe("event dispatch: same-x write/write (lost update)", () => {
  it("sequential: two read-then-write events on x both land", () => {
    const { n, x, run } = program();
    run(["incr-x", "incr-x"], "sequential");
    expect(n(x)).toBe(7);
  });

  it("interleave: uncoordinated statements lose an update (counterexample)", () => {
    const { n, x, run } = program();
    const report = run(["incr-x", "incr-x"], "interleave");
    expect(report.trace).toEqual([
      "incr-x0:1",
      "incr-x1:1",
      "incr-x0:2",
      "incr-x1:2",
    ]);
    expect(n(x)).toBe(6);
  });

  it("footprint: the second writer waits for the first, so both land", () => {
    const { n, x, run } = program();
    const report = run(["incr-x", "incr-x"], "footprint");
    expect(report.trace).toEqual([
      "incr-x0:1",
      "incr-x0:2",
      "incr-x1:1",
      "incr-x1:2",
    ]);
    expect(report.outcomes[1].waitedFor).toEqual(["incr-x0"]);
    expect(n(x)).toBe(7);
    expect(report.outcomes.every((o) => o.escapes.length === 0)).toBe(true);
  });

  it("footprint: a write through a mutable alias of x is the same conflict", () => {
    const { n, x, run } = program();
    const report = run(["incr-x", "via-alias"], "footprint");
    expect(report.outcomes[1].waitedFor).toEqual(["incr-x0"]);
    expect(n(x)).toBe(7);
  });
});

describe("event dispatch: disjoint x and y", () => {
  it("footprint: independent writers interleave statement by statement", () => {
    const { n, x, y, run } = program();
    const report = run(["incr-x", "incr-y"], "footprint");
    expect(report.trace).toEqual([
      "incr-x0:1",
      "incr-y1:1",
      "incr-x0:2",
      "incr-y1:2",
    ]);
    expect(report.outcomes.map((o) => o.waitedFor)).toEqual([[], []]);
    expect(n(x)).toBe(6);
    expect(n(y)).toBe(11);
  });

  it("footprint: a later disjoint event waits for an earlier blocked one to start, then overlaps it", () => {
    // Admission is in program order (PR #484 review): the earlier event's
    // footprint is read only when it starts, and could by then name what the
    // later one had already written.
    const { run } = program();
    const report = run(["incr-x", "incr-x", "incr-y"], "footprint");
    expect(report.trace).toEqual([
      "incr-x0:1",
      "incr-x0:2",
      "incr-x1:1",
      "incr-y2:1",
      "incr-x1:2",
      "incr-y2:2",
    ]);
    expect(report.outcomes[2].waitedFor).toEqual(["incr-x1"]);
  });
});

describe("event dispatch: cross-circuit read of x versus write of x", () => {
  it("footprint: a reader after a writer waits and reads the new version", () => {
    const { x, run } = program();
    const report = run(["incr-x", "read-x"], "footprint");
    const [writer, reader] = report.outcomes;
    expect(reader.waitedFor).toEqual(["incr-x0"]);
    expect(reader.result.toString()).toBe("6");
    expect(versionRead(reader, x)).toBe(versionWritten(writer, x));
    expect(versionRead(reader, x)).toBe(versionOf(x));
  });

  it("footprint: a reader before a writer reads the old version and blocks the writer", () => {
    const { x, run } = program();
    const report = run(["read-x", "incr-x"], "footprint");
    const [reader, writer] = report.outcomes;
    expect(reader.waitedFor).toEqual([]);
    expect(writer.waitedFor).toEqual(["read-x0"]);
    expect(reader.result.toString()).toBe("5");
    expect(versionRead(reader, x)).toBe(versionWritten(writer, x)! - 1);
  });

  it("footprint: two readers of x interleave", () => {
    const { run } = program();
    const report = run(["read-x", "sum"], "footprint");
    expect(report.outcomes.map((o) => o.waitedFor)).toEqual([[], []]);
  });

  it("footprint: a functional update through an immutable alias does not block a reader", () => {
    const { n, y, run } = program();
    const report = run(["functional-y", "read-y"], "footprint");
    expect(report.outcomes[1].waitedFor).toEqual([]);
    expect(n(y)).toBe(10);
    expect(report.outcomes[0].escapes).toEqual([]);
  });

  it("footprint: a functional update of x writes nothing shared, so a reader of x interleaves", () => {
    const { n, x, run } = program();
    const report = run(["functional", "read-x"], "footprint");
    expect(report.outcomes[0].potential.writes.has(x)).toBe(false);
    expect(report.outcomes[0].actual.sharedWrites()).toEqual([]);
    expect(report.outcomes[1].waitedFor).toEqual([]);
    expect(n(x)).toBe(5);
  });
});

describe("event dispatch: mutation through a nested callee", () => {
  it("footprint: two nested writers of x.inner are serialized", () => {
    const { x, run } = program();
    const report = run(["poke-inner", "poke-inner"], "footprint");
    expect(report.outcomes[1].waitedFor).toEqual(["poke-inner0"]);
    expect(x.get_here("inner_").get_here("k").toString()).toBe("2");
    expect(report.outcomes.every((o) => o.escapes.length === 0)).toBe(true);
  });

  it("footprint: a nested writer of x.inner and a writer of y interleave", () => {
    const { run } = program();
    const report = run(["poke-inner", "incr-y"], "footprint");
    expect(report.outcomes.map((o) => o.waitedFor)).toEqual([[], []]);
  });

  it("footprint: a marked local declaration that aliases x serializes against x", () => {
    const { n, x, run } = program();
    const report = run(["alias-write", "read-x"], "footprint");
    expect(report.outcomes[1].waitedFor).toEqual(["alias-write0"]);
    expect(n(x)).toBe(99);
    expect(report.outcomes[1].result.toString()).toBe("99");
  });
});

describe("event dispatch: multi-value read-then-write invariant", () => {
  const total = (p: Program): number => p.n(p.x) + p.n(p.y);

  it("interleave: two transfers break the conserved sum (counterexample)", () => {
    const p = program();
    const before = total(p);
    p.run(["move", "move"], "interleave");
    expect(total(p)).not.toBe(before);
  });

  it("footprint: the sum is conserved and a concurrent reader never sees it torn", () => {
    const p = program();
    const before = total(p);
    const report = p.run(["move", "sum", "move"], "footprint");
    expect(total(p)).toBe(before);
    expect(report.outcomes[1].result.toString()).toBe(String(before));
    expect(report.outcomes[1].waitedFor).toEqual(["move0"]);
    expect(report.outcomes[2].waitedFor).toContain("sum1");
  });

  it("interleave: a two-statement reader can observe a torn sum", () => {
    const p = program();
    const before = total(p);
    // move: read v; write x; write y. sum-slow: read x; pad; read y. Round
    // robin, the reader takes x before the decrement and y after the
    // increment, so it answers a sum that never existed.
    const report = p.run(["move", "sum-slow"], "interleave");
    expect(report.outcomes[1].result.toString()).toBe(String(before + 1));
    const safe = program();
    const coordinated = safe.run(["move", "sum-slow"], "footprint");
    expect(coordinated.outcomes[1].result.toString()).toBe(String(before));
  });
});

describe("event dispatch: opaque events and escapes", () => {
  it("serializes an opaque event against everything", () => {
    const { run } = program();
    const report = run(["ghost", "incr-y"], "footprint");
    expect(report.outcomes[0].potential.unresolved).toEqual(["nowhere"]);
    expect(report.outcomes[1].waitedFor).toEqual(["ghost0"]);
    expect(report.outcomes[0].result.isFailedResult()).toBe(true);
  });

  it("reports a shared write outside a caller's declaration as undeclared, not as an escape", () => {
    const { x, event } = program();
    const report = dispatch([{ ...event("a", "incr-x"), declared: EMPTY }]);
    expect(report.outcomes[0].undeclared).toEqual([x]);
    expect(report.outcomes[0].escapes).toEqual([]);
    expect(report.outcomes[0].inferred.writes.has(x)).toBe(true);
    expect(report.outcomes[0].potential.writes.has(x)).toBe(true);
  });

  it("reports no read escape when the inferred footprint covers the actual reads", () => {
    const { run } = program();
    const report = run(
      ["incr-x", "read-x", "sum-slow", "poke-inner", "via-alias", "move"],
      "footprint",
    );
    expect(report.outcomes.map((o) => o.readEscapes)).toEqual([
      [],
      [],
      [],
      [],
      [],
      [],
    ]);
  });

  it("reports no escape when the inferred footprint covers the actual writes", () => {
    const { run } = program();
    const report = run(
      ["incr-x", "poke-inner", "alias-write", "move"],
      "footprint",
    );
    expect(report.outcomes.map((o) => o.escapes)).toEqual([[], [], [], []]);
  });

  it("agrees with sequential execution on final state under every policy that coordinates", () => {
    for (const policy of ["sequential", "footprint"] as const) {
      const p = program();
      p.run(
        ["incr-x", "incr-y", "move", "poke-inner", "incr-x", "sum"],
        policy,
      );
      expect([p.n(p.x), p.n(p.y)]).toEqual([6, 12]);
    }
  });
});

describe("event dispatch: admission cannot be narrowed by a declaration", () => {
  it("footprint: an under-declared writer is still serialized against a conflicting writer", () => {
    const { n, x, event } = program();
    // Review thread on event-dispatch.ts:114: an empty declaration for a real
    // writer must not let two read-then-write events on x interleave.
    const report = dispatch([
      { ...event("under", "incr-x"), declared: EMPTY },
      event("other", "incr-x"),
    ]);
    expect(report.trace).toEqual([
      "under:1",
      "under:2",
      "other:1",
      "other:2",
    ]);
    expect(report.outcomes[1].waitedFor).toEqual(["under"]);
    expect(n(x)).toBe(7);
    expect(report.outcomes[0].undeclared).toEqual([x]);
    expect(report.outcomes.map((o) => o.escapes)).toEqual([[], []]);
  });

  it("footprint: an under-declared writer still blocks a later reader of x", () => {
    const { event } = program();
    const report = dispatch([
      { ...event("under", "incr-x"), declared: EMPTY },
      event("reader", "read-x"),
    ]);
    expect(report.outcomes[1].waitedFor).toEqual(["under"]);
    expect(report.outcomes[1].result.toString()).toBe("6");
  });

  it("footprint: a declaration widens the inferred footprint", () => {
    const { x, event } = program();
    const wider = { ...EMPTY, writes: new Set([x]) };
    const report = dispatch([
      { ...event("y-claims-x", "incr-y"), declared: wider },
      event("writer", "incr-x"),
    ]);
    expect(report.outcomes[0].inferred.writes.has(x)).toBe(false);
    expect(report.outcomes[0].potential.writes.has(x)).toBe(true);
    expect(report.outcomes[1].waitedFor).toEqual(["y-claims-x"]);
  });

  it("footprint: an alias rebound by an earlier event is re-read when the writer starts", () => {
    const { n, x, y, run } = program();
    // retarget rebinds t_ from x to y; via-t then writes through t_. Its
    // footprint, read when the dispatch was assembled, named x; read when it
    // starts, after retarget, it names y, so incr-y waits for it.
    const report = run(["retarget", "via-t", "incr-y"], "footprint");
    const [, viaT, incrY] = report.outcomes;
    expect(viaT.waitedFor).toEqual(["retarget0"]);
    expect(viaT.inferred.writes.has(y)).toBe(true);
    expect(viaT.inferred.writes.has(x)).toBe(false);
    expect(incrY.waitedFor).toContain("via-t1");
    expect(n(x)).toBe(5);
    expect(n(y)).toBe(12);
    expect(report.outcomes.map((o) => o.escapes)).toEqual([[], [], []]);
  });

  it("footprint: a closure passed as the argument is walked, so its writes are inferred", () => {
    const { n, x, event, scope } = program();
    const read = (key: string): Frame =>
      FrameSymbol.for(key).in(EvaluationScope.root(scope));
    const applied = potentialFootprint(read("apply"), read("incr-x"));
    expect(applied.writes.has(x)).toBe(true);
    const report = dispatch([
      event("applied", "apply", read("incr-x")),
      event("direct", "incr-x"),
    ]);
    expect(report.outcomes[1].waitedFor).toEqual(["applied"]);
    expect(n(x)).toBe(7);
    expect(report.outcomes.map((o) => o.escapes)).toEqual([[], []]);
    const reading = dispatch([
      event("applied", "apply", read("read-x")),
      event("other", "incr-y"),
    ]);
    expect(reading.outcomes.map((o) => o.waitedFor)).toEqual([[], []]);
  });

  it("footprint: a bound method passed as the argument makes the event opaque", () => {
    const { event, scope } = program();
    const setter = FrameSymbol.for("x_").in(EvaluationScope.root(scope)).get(
      "set_",
    );
    const report = dispatch([
      event("applied", "apply", setter),
      event("other", "incr-y"),
    ]);
    expect(report.outcomes[0].potential.unresolved.length).toBeGreaterThan(0);
    expect(report.outcomes[1].waitedFor).toEqual(["applied"]);
  });
});

describe("event dispatch: escapes on a plain scope Frame", () => {
  /** An HC file whose scope is a plain Frame rather than an aggregate. */
  const plainScope = (source: string): Frame => {
    const out = new FrameArray([]);
    const scope = new Frame();
    const hc = new HCEval(out, scope, Frame.nil);
    hc.call(source);
    expect(hc.finish()).toBe(true);
    return scope;
  };

  const SOURCE = `
    .count 0;
    .bump {@count (count + 1);};
    .peek {count};
  `;

  it("infers a lexical @name write as a write of the plain scope", () => {
    const scope = plainScope(SOURCE);
    expect(scope.className()).toBe("Frame");
    expect(scope.ownsIdentity()).toBe(false);
    const bump = FrameSymbol.for("bump").in(EvaluationScope.root(scope));
    const footprint = potentialFootprint(bump);
    expect(footprint.writes.has(scope)).toBe(true);
  });

  it("footprint: a writer and a reader of the plain scope are serialized", () => {
    const scope = plainScope(SOURCE);
    const read = (key: string): Frame =>
      FrameSymbol.for(key).in(EvaluationScope.root(scope));
    const report = dispatch([
      { label: "bump", target: read("bump") },
      { label: "peek", target: read("peek") },
      { label: "bump2", target: read("bump") },
    ]);
    expect(report.outcomes[1].waitedFor).toEqual(["bump"]);
    expect(report.outcomes[2].waitedFor).toContain("peek");
    expect(report.outcomes[1].result.toString()).toBe("1");
    expect(scope.get_here("count").toString()).toBe("2");
    expect(report.outcomes.map((o) => o.escapes)).toEqual([[], [], []]);
  });

  it("reports a write to a plain scope outside a footprint, with no help from other events", () => {
    // Review thread on event-dispatch.ts:189: the old filter kept only
    // identity owners and frames some potential mentioned, so a plain scope
    // written outside every footprint was never reported.
    const scope = plainScope(SOURCE);
    const bump = FrameSymbol.for("bump").in(EvaluationScope.root(scope));
    const record = new AccessRecord();
    withAccessRecord(record, () => bump.call(Frame.nil, Frame.nil));
    expect(record.sharedWrites()).toContain(scope);
    expect(accessesOutside(record, EMPTY)).toEqual([scope]);
    const report = dispatch([{ label: "bump", target: bump, declared: EMPTY }]);
    expect(report.outcomes[0].undeclared).toEqual([scope]);
  });

  it("reports a read outside a footprint as a read escape", () => {
    const { x, scope } = program();
    const readX = FrameSymbol.for("read-x").in(EvaluationScope.root(scope));
    const record = new AccessRecord();
    withAccessRecord(record, () => readX.call(Frame.nil, Frame.nil));
    expect(accessesOutside(record, EMPTY, "reads")).toContain(x);
    expect(accessesOutside(record, EMPTY, "reads")).toContain(scope);
  });
});
