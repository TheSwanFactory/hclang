import type { Frame } from "./frame.ts";
import { touchesIdentity } from "./effect-marker.ts";

/**
 * Automated Reference Tracking (ART): the runtime's record of which handles
 * refer to an identity, which version of its state is current, and what an
 * active event has actually read and written (occurrence/figure 015.23a,
 * 015.24c §2).
 *
 * ARC-style reference counting answers *how many* references retain a value.
 * This module answers three different questions, and keeps them apart:
 *
 * - **Possession with permission.** `holdersOf(x)` lists every binding that
 *   currently holds the aggregate `x`: the holder frame, the key, and whether
 *   that key's spelling claims mutation authority. A holding is one of three
 *   kinds, after the three planes a frame holds a value in: a **member**
 *   under a name (`.inner_ x`), graded by `touchesIdentity` of the name; an
 *   **element** under an index (`[x]`, `xs.0`), which hands out the identity
 *   itself and so is always mutable; and the **parent** edge (`.^ x`), keyed
 *   `^`, which conveys lookup and no authority of its own, so it is never
 *   mutable. The index is the inverse of the binding relation, maintained at
 *   every place a binding is committed: `MetaFrame.set`, `replaceMember`,
 *   `setParent`, the element-plane commits of `FrameArray`, and the copy
 *   paths that duplicate bindings without going through them. A holding is a
 *   fact about a name, not about an active computation: a frame can hold `x`
 *   mutably and never touch it.
 * - **State version.** `versionOf(x)` is the number of mutations committed on
 *   `x`, so that a read can be dated against the versions xᵢ an identity has
 *   passed through. It is bumped at the commit points and nowhere else.
 * - **Actual access.** An `AccessRecord` made active with `withAccessRecord`
 *   receives every committed write and every keyed or indexed read that
 *   happens while it is active, each dated by version. This is the footprint
 *   an event *actually* had, as distinct from the footprint its code *could*
 *   have (`access-footprint.ts`), and from any consistency contract.
 *
 * ## What is and is not observed
 *
 * Writes are complete: every committed mutation in the runtime lands at
 * `MetaFrame.set`, `MetaFrame.replaceMember`, `Frame.setParent`,
 * `FrameArray.collect` or `FrameArray.reset`, and each one reports here.
 * Reads are observed at keyed lookup (`MetaFrame.get_here`) and element access
 * (`FrameArray.elements`), which is where evaluation reads state; a host that
 * reaches into `meta` or `data` directly is not seen. A missing read therefore
 * means an under-report, never a false report.
 *
 * ## Cost
 *
 * Outside an active record, a read costs one array-length check and a write
 * costs one `WeakMap` update for the version. A binding of an aggregate adds
 * one record to that aggregate's holder set. Holders are held strongly: a
 * `WeakRef` would be kept alive for the whole job (#426), while a strong edge
 * from a value to its holder only closes a cycle the collector already frees
 * once neither side is reachable, the index being keyed weakly by the value.
 * Nothing here allocates per read.
 *
 * @module
 */

/** The plane a holding lives in: a named member, an indexed element, or the parent edge. */
export type HoldingKind = "member" | "element" | "parent";

/** The key a declared parent is held under. */
export const PARENT_KEY = "^";

/** One place an identity is held: a holder frame's key, graded by its marker. */
export interface Holding {
  /** The frame whose binding holds the identity. */
  readonly holder: Frame;
  /** The key the identity is bound under: a name, an index, or `^`. */
  readonly key: string;
  /** Which plane of the holder the key addresses. */
  readonly kind: HoldingKind;
  /**
   * Whether the key claims mutation authority over the identity: a marked
   * name or an index does; an unmarked name and the parent edge do not.
   */
  readonly mutable: boolean;
}

/** A holding as stored. */
interface HoldingRecord {
  readonly holder: Frame;
  readonly key: string;
}

const isIndexKey = (key: string): boolean => /^\d+$/.test(key);

const kindOf = (key: string): HoldingKind =>
  key === PARENT_KEY ? "parent" : isIndexKey(key) ? "element" : "member";

/** Whether a key, by its spelling alone, hands out mutation authority. */
export const keyGrantsMutation = (key: string): boolean =>
  key !== PARENT_KEY && (isIndexKey(key) || touchesIdentity(key));

/** Identity → the bindings that hold it. Keyed weakly by the identity. */
const holdings = new WeakMap<Frame, Set<HoldingRecord>>();

/** Identity → the number of mutations committed on it. */
const versions = new WeakMap<Frame, number>();

/**
 * What one event actually touched while its record was active.
 *
 * `reads` maps each frame read to the version it was first observed at;
 * `writes` maps each frame written to the version its last commit produced.
 * `created` holds the frames constructed while the record was active, so a
 * consumer can tell an event's own fresh state (a functional-update copy, a
 * call frame) from shared state it reached.
 */
export class AccessRecord {
  public readonly reads = new Map<Frame, number>();
  public readonly writes = new Map<Frame, number>();
  public readonly created = new WeakSet<Frame>();
  /**
   * The certificate this record's accesses are confined to, if any. While a
   * guard is installed, an access to a shared frame the guard does not allow
   * is refused before it happens (`guardAccess`), so the record can never
   * show an access outside what its guard admits.
   */
  public guard?: AccessGuard;

  /** The frames this record saw written that it did not itself create. */
  public sharedWrites(): Frame[] {
    return [...this.writes.keys()].filter((frame) => !this.created.has(frame));
  }

  /** The frames this record saw read that it did not itself create. */
  public sharedReads(): Frame[] {
    return [...this.reads.keys()].filter((frame) => !this.created.has(frame));
  }
}

/** The records currently receiving access notes, innermost last. */
const active: AccessRecord[] = [];

/** One of the two things an event can do to a frame's state. */
export type AccessKind = "read" | "write";

/**
 * Whether an active record may perform `access` on `frame`. Installed on an
 * `AccessRecord` by whoever admitted the event it belongs to; the frames the
 * record itself created are never asked about.
 */
export type AccessGuard = (frame: Frame, access: AccessKind) => boolean;

/**
 * An access a guard refused. It is thrown from the commit or read point
 * *before* the access happens, so the state is as it was; the dispatcher
 * that installed the guard reports it as the event's failure.
 */
export class UncertifiedAccess extends Error {
  constructor(
    public readonly frame: Frame,
    public readonly access: AccessKind,
  ) {
    super(`$!.uncertified-${access} ${frame.className()}`);
    this.name = "UncertifiedAccess";
  }
}

/**
 * Refuses `access` to `frame` if any active record's guard does not allow
 * it. Called at every commit point before the mutation lands and at every
 * keyed or indexed read before the value is handed out, so a refusal leaves
 * the state untouched and the value unseen. Costs one length check when no
 * record is active and one `WeakSet` lookup per guarded record otherwise.
 */
export function guardAccess(frame: Frame, access: AccessKind): void {
  if (active.length === 0) return;
  for (const record of active) {
    if (!record.guard || record.created.has(frame)) continue;
    if (!record.guard(frame, access)) {
      throw new UncertifiedAccess(frame, access);
    }
  }
}

/** Runs `work` with `record` receiving every access note it causes. */
export function withAccessRecord<T>(record: AccessRecord, work: () => T): T {
  active.push(record);
  try {
    return work();
  } finally {
    active.pop();
  }
}

/** Whether any record is active, so hot paths can skip their note early. */
export const isTracking = (): boolean => active.length > 0;

/** The number of mutations committed on `frame`; 0 for a never-written one. */
export function versionOf(frame: Frame): number {
  return versions.get(frame) ?? 0;
}

/**
 * Notes a committed mutation of `frame`: its version advances, and every
 * active record learns the version this write produced.
 */
export function noteWrite(frame: Frame): void {
  const next = versionOf(frame) + 1;
  versions.set(frame, next);
  for (const record of active) record.writes.set(frame, next);
}

/** Notes a read of `frame`, dated by the version current at the first read. */
export function noteRead(frame: Frame): void {
  if (active.length === 0) return;
  for (const record of active) {
    if (!record.reads.has(frame)) record.reads.set(frame, versionOf(frame));
  }
}

/** Notes that `frame` was constructed, for every active record. */
export function noteCreated(frame: Frame): void {
  if (active.length === 0) return;
  for (const record of active) record.created.add(frame);
}

/**
 * Notes that `holder` bound `value` under `key`, replacing `previous`. The
 * key is a member name, an element index, or `PARENT_KEY`.
 *
 * Only an identity-owning value is indexed: an atom or a closure has no
 * identity a handle could claim authority over. Rebinding a key releases the
 * previous identity's holding first, so the index reflects the live bindings.
 */
export function noteHolding(
  holder: Frame,
  key: string,
  value: Frame,
  previous?: Frame,
): void {
  const identity = identityOf(value);
  const released = previous === undefined ? undefined : identityOf(previous);
  if (released && released !== identity) dropHolding(released, holder, key);
  if (identity) addHolding(identity, holder, key);
}

/**
 * The identity a stored value holds, if it holds one: the value itself when
 * it owns identity, or the identity behind a handle, which is how an element
 * plane stores a name's value (`[x_]` holds a handle on `x_`).
 */
function identityOf(value: Frame): Frame | undefined {
  const target = value.referent();
  return target.ownsIdentity() ? target : undefined;
}

/** Notes that `holder` no longer holds `previous` under `key`. */
export function noteReleased(
  holder: Frame,
  key: string,
  previous: Frame,
): void {
  const released = identityOf(previous);
  if (released) dropHolding(released, holder, key);
}

/**
 * Notes that `holder` now holds `elements` in its element plane, element i
 * under the index key `i`, releasing whatever it held under those indexes
 * before. This is the commit point for every assignment of an aggregate's
 * element plane as a whole; an append goes through `noteHolding` with its
 * index.
 */
export function noteElements(
  holder: Frame,
  elements: readonly Frame[],
  previous: readonly Frame[] = [],
): void {
  for (let index = 0; index < previous.length; index++) {
    const released = identityOf(previous[index]);
    if (released) dropHolding(released, holder, String(index));
  }
  for (let index = 0; index < elements.length; index++) {
    const identity = identityOf(elements[index]);
    if (identity) addHolding(identity, holder, String(index));
  }
}

/**
 * Indexes the identity-owning bindings `clone` holds: its members, its
 * declared parent, and, when given, its elements. A copy duplicates its
 * source's bindings without committing them through `set`, so the index would
 * otherwise miss every holder that is a copy, functional-update copies
 * included.
 */
export function noteCopiedHoldings(
  clone: Frame,
  elements: readonly Frame[] = [],
): void {
  for (const [key, value] of clone.meta_pairs()) {
    const identity = identityOf(value);
    if (identity) addHolding(identity, clone, key);
  }
  if (clone.hasDeclaredParent()) {
    const parent = identityOf(clone.parent);
    if (parent) addHolding(parent, clone, PARENT_KEY);
  }
  noteElements(clone, elements);
}

/**
 * The live bindings that hold `identity`, each graded by its key's marker.
 *
 * The answer is the ART inverse index: where the reference relation goes from
 * holder to value, this goes from value to holders. It reports possession,
 * which is distinct from active use: an event holding `x` mutably is not
 * thereby writing it (see `AccessRecord`).
 */
export function holdersOf(identity: Frame): Holding[] {
  const records = holdings.get(identity);
  if (!records) return [];
  const result: Holding[] = [];
  for (const record of records) {
    result.push({
      holder: record.holder,
      key: record.key,
      kind: kindOf(record.key),
      mutable: keyGrantsMutation(record.key),
    });
  }
  return result;
}

/** The holdings of `identity` whose key claims mutation authority. */
export function mutableHoldersOf(identity: Frame): Holding[] {
  return holdersOf(identity).filter((holding) => holding.mutable);
}

function addHolding(identity: Frame, holder: Frame, key: string): void {
  let records = holdings.get(identity);
  if (!records) {
    records = new Set();
    holdings.set(identity, records);
  }
  for (const record of records) {
    if (record.key === key && record.holder === holder) return;
  }
  records.add({ holder, key });
}

function dropHolding(identity: Frame, holder: Frame, key: string): void {
  const records = holdings.get(identity);
  if (!records) return;
  for (const record of records) {
    if (record.holder === holder && record.key === key) {
      records.delete(record);
    }
  }
}
