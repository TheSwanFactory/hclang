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

    const result = checkPartitions(edges, plan, new Set());
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

    expect(checkPartitions(edges, plan, new Set()).ok).toBe(true);
  });

  it("rejects a cross-partition mutable dependency with no effect boundary", () => {
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [{ managed, observer, kind: "mutable" }];
    const plan = partitionPlan([[managed, "p1"], [observer, "p2"]]);

    const result = checkPartitions(edges, plan, new Set());
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

    // Static coverage: the plan declares an arrow on the managed value.
    const covered = new Set<Frame>([managed]);
    expect(checkPartitions(edges, plan, covered).ok).toBe(true);
  });

  it("reads coverage from the live effect registry when none is supplied", () => {
    const managed = node();
    const observer = node();
    const edges: DependencyEdge[] = [{ managed, observer, kind: "mutable" }];
    const plan = partitionPlan([[managed, "p1"], [observer, "p2"]]);

    // Before any arrow: rejected.
    expect(checkPartitions(edges, plan).ok).toBe(false);

    // An actual `A -> B` registration (the arrow operator's effect) now covers
    // the crossing, so the same plan is accepted.
    registerEffect(managed, node());
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

    expect(checkPartitions(edges, plan, new Set()).ok).toBe(true);
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
    const result = checkPartitions(edges, plan, new Set([a]));
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].managed).toBe(b);
  });
});
