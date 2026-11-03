import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import {
  checkPartitions,
  type DependencyEdge,
  partitionPlan,
} from "./partition-check.ts";
import { registerEffect } from "./effect-registry.ts";

/** A fresh distinct managed/observer value for each case. */
const node = (): Frame => new FrameArray([]);

describe("partition check (006.17 §6)", () => {
  it("accepts a local mutable dependency within one partition", () => {
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [{ managed, observer, kind: "mutable" }];
    const plan = partitionPlan([[managed, "p1"], [observer, "p1"]]);

    const result = checkPartitions(edges, plan, []);
    expect(result.ok).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("accepts a mutable dependency when neither value is placed", () => {
    // An unplaced value is local; with no proposed boundary there is nothing
    // to cross, so the rule does not apply.
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [{ managed, observer, kind: "mutable" }];
    const plan = partitionPlan([]);

    expect(checkPartitions(edges, plan, []).ok).toBe(true);
  });

  it("rejects a cross-partition mutable dependency with no effect boundary", () => {
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [{ managed, observer, kind: "mutable" }];
    const plan = partitionPlan([[managed, "p1"], [observer, "p2"]]);

    const result = checkPartitions(edges, plan, []);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].reason).toContain("$!.partition-error");
    expect(result.errors[0].fromPartition).toBe("p2");
    expect(result.errors[0].toPartition).toBe("p1");
  });

  it("accepts the same crossing once an explicit effect boundary covers it", () => {
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [{ managed, observer, kind: "mutable" }];
    const plan = partitionPlan([[managed, "p1"], [observer, "p2"]]);

    // Static coverage: the plan declares the observer's own arrow.
    expect(checkPartitions(edges, plan, [[managed, observer]]).ok).toBe(true);
  });

  it("reads coverage from the live effect registry when none is supplied", () => {
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [{ managed, observer, kind: "mutable" }];
    const plan = partitionPlan([[managed, "p1"], [observer, "p2"]]);

    // Before any arrow: rejected.
    expect(checkPartitions(edges, plan).ok).toBe(false);

    // An actual registration of the observer itself (the arrow operator's
    // effect) now covers the crossing, so the same plan is accepted.
    registerEffect(managed, observer);
    expect(checkPartitions(edges, plan).ok).toBe(true);
  });

  it("accepts a cross-partition transactional dependency without a boundary", () => {
    // A stable completed observation needs no future-mutation notification, so
    // it may cross a boundary with no arrow.
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [
      { managed, observer, kind: "transactional" },
    ];
    const plan = partitionPlan([[managed, "p1"], [observer, "p2"]]);

    expect(checkPartitions(edges, plan, []).ok).toBe(true);
  });

  it("reports every offending edge, covering only those with a boundary", () => {
    const a = node();
    const b = node();
    const oa = node();
    const ob = node();
    const edges: DependencyEdge[] = [
      { managed: a, observer: oa, kind: "mutable" },
      { managed: b, observer: ob, kind: "mutable" },
    ];
    const plan = partitionPlan([
      [a, "p1"],
      [oa, "p2"],
      [b, "p1"],
      [ob, "p2"],
    ]);

    // Only `a` has a boundary; `b`'s crossing is still an error.
    const result = checkPartitions(edges, plan, [[a, oa]]);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].managed).toBe(b);
  });
  it("does not let an arrow to one callback cover another observer (PR #475 review)", () => {
    // A -> B notifies B only. C's cross-partition mutable dependency on A is
    // still uncovered, live and static alike.
    const a = node();
    const b = node();
    const c = node();
    const plan = partitionPlan([[a, "p1"], [b, "p2"], [c, "p2"]]);
    const toC: DependencyEdge[] = [{
      managed: a,
      observer: c,
      kind: "mutable",
    }];
    const toB: DependencyEdge[] = [{
      managed: a,
      observer: b,
      kind: "mutable",
    }];
    registerEffect(a, b);
    const live = checkPartitions(toC, plan);
    expect(live.ok).toBe(false);
    expect(live.errors[0].observer).toBe(c);
    expect(checkPartitions(toB, plan).ok).toBe(true);
    expect(checkPartitions(toC, plan, [[a, b]]).ok).toBe(false);
    expect(checkPartitions(toC, plan, [[a, c]]).ok).toBe(true);
  });
});
