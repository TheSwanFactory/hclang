import type { Frame } from "./frame.ts";
import { hasEffectSubscribers } from "./effect-registry.ts";

/**
 * A bounded, executable partition/dependency check for HC effect boundaries
 * (occurrence/history 006.17 §6).
 *
 * This is deliberately **not** a general distributed-execution system or a
 * formal partitioner, and it claims no soundness/completeness/preservation
 * theorem (those remain the proof obligations of §7). It is the smallest
 * testable representation of the one partitioning rule 006.17 states:
 *
 *   > A mutable dependency that crosses a proposed partition boundary without
 *   > an explicit effect boundary is a partitioning error.
 *
 * The rule is boundary-relative. Within one partition, a mutable dependency is
 * ordinary and accepted. A stable transactional (immutable / readonly-snapshot)
 * dependency never needs a future-mutation notification, so it is accepted
 * across a boundary too. Only a *mutable* dependency that *crosses* a boundary
 * requires an explicit `A -> B` effect boundary on the managed value, which is
 * precisely what re-invokes the dependent observer when the value later
 * mutates.
 *
 * The check consults the live effect registry (`hasEffectSubscribers`), so a
 * dependency is covered exactly when an `->` arrow was actually registered on
 * the managed value. A caller may also pass an explicit set of covered values
 * for static analysis of a plan that has not been evaluated yet.
 *
 * @module
 */

/** How a dependent observer relies on a managed value. */
export type DependencyKind =
  /** The observer may see later committed mutations of the managed value. */
  | "mutable"
  /** The observer holds a stable completed observation; later writes are invisible. */
  | "transactional";

/** One dependency of an observer on a managed value within a partition plan. */
export interface DependencyEdge {
  /** The value whose mutations matter. */
  readonly managed: Frame;
  /** The computation that depends on the managed value. */
  readonly observer: Frame;
  /** Whether the dependency is on continuing mutation or a stable snapshot. */
  readonly kind: DependencyKind;
}

/**
 * A proposed placement of values into physical partitions.
 *
 * `partitionOf` answers the partition id a value is placed in. Two values with
 * the same id are co-located; different ids are a proposed boundary between
 * them. A value with no placement is treated as unpartitioned (local), so a
 * plan need only name the values it actually separates.
 */
export interface PartitionPlan {
  partitionOf(value: Frame): string | undefined;
}

/** Builds a plan from an explicit value→partition-id map. */
export function partitionPlan(
  placement: ReadonlyArray<readonly [Frame, string]>,
): PartitionPlan {
  const ids = new Map<Frame, string>(placement);
  return { partitionOf: (value: Frame) => ids.get(value) };
}

/** A rejected cross-partition mutable dependency with no effect boundary. */
export interface PartitionError {
  readonly managed: Frame;
  readonly observer: Frame;
  readonly fromPartition: string;
  readonly toPartition: string;
  readonly reason: string;
}

/** The outcome of checking a partition plan against its dependency edges. */
export interface PartitionCheckResult {
  readonly ok: boolean;
  readonly errors: PartitionError[];
}

/** Whether two placements name different partitions (a proposed boundary). */
function crosses(a: string | undefined, b: string | undefined): boolean {
  // Unplaced values are local; a boundary exists only between two named,
  // distinct partitions.
  return a !== undefined && b !== undefined && a !== b;
}

/**
 * Checks a partition plan: accepts local mutable dependencies and transactional
 * dependencies anywhere, and rejects a cross-partition *mutable* dependency
 * that lacks an explicit effect boundary on its managed value.
 *
 * `covered` lets a static (pre-evaluation) caller declare which managed values
 * carry an explicit arrow; when omitted, coverage is read from the live effect
 * registry, so an `A -> B` that actually ran makes the dependency legal.
 */
export function checkPartitions(
  edges: ReadonlyArray<DependencyEdge>,
  plan: PartitionPlan,
  covered?: ReadonlySet<Frame>,
): PartitionCheckResult {
  const isCovered = (managed: Frame): boolean =>
    covered ? covered.has(managed) : hasEffectSubscribers(managed);

  const errors: PartitionError[] = [];
  for (const edge of edges) {
    if (edge.kind !== "mutable") continue; // transactional never needs a boundary
    const from = plan.partitionOf(edge.observer);
    const to = plan.partitionOf(edge.managed);
    if (!crosses(from, to)) continue; // local mutable dependency is fine
    if (isCovered(edge.managed)) continue; // explicit effect boundary present
    errors.push({
      managed: edge.managed,
      observer: edge.observer,
      fromPartition: from as string,
      toPartition: to as string,
      reason:
        "$!.partition-error cross-partition mutable dependency without an effect boundary",
    });
  }
  return { ok: errors.length === 0, errors };
}
