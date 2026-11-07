import { Frame } from "./frame.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";
import {
  type Denum,
  DenumError,
  fromHost,
  MAX_RANK,
  promote,
} from "./denum.ts";

/**
 * Builds the Denum instance of the HC class `Denum` (`hc/denum.hc`) from a
 * state already known to be admissible, or answers the class's failure.
 */
export type DenumConstructor = (state: Denum) => Frame;

let construct: DenumConstructor | undefined;

/**
 * Installs what `.#n` answers a present Denum with. The Denum is an HC class,
 * so the frames package, which cannot run HC, takes its constructor from the
 * evaluator (`lib/execute/denum-prologue.ts`), as `.####` takes its Demi.
 *
 * @param constructor The constructor, called once per present observation.
 */
export function installDenumConstructor(constructor: DenumConstructor): void {
  construct = constructor;
}

/** A Frame read as an exact nonnegative Count, or undefined. */
function exactCount(frame: Frame): bigint | undefined {
  const value = frame.referent();
  return value instanceof FrameCount && typeof value.data === "bigint" &&
      value.data >= 0n
    ? value.data
    : undefined;
}

/**
 * The stored state of a Denum instance: its own `rank`, `count` and `loads`
 * fields. Only the instance's own fields are read (`get_here`), never a
 * declared parent or a method, and the loads are read as stored, so nothing
 * runs. Undefined when any field is absent or not an exact Count of the right
 * shape.
 */
function storedState(host: Frame): Denum | undefined {
  const rank = exactCount(host.get_here("rank"));
  const count = exactCount(host.get_here("count"));
  const list = host.get_here("loads").referent();
  if (rank === undefined || count === undefined || rank > BigInt(MAX_RANK)) {
    return undefined;
  }
  if (!list.ownsIdentity()) return undefined;
  const loads = list.elements().map(exactCount);
  if (loads.some((load) => load === undefined)) return undefined;
  try {
    return {
      rank: Number(rank),
      count,
      loads: loads as bigint[],
    };
  } catch {
    return undefined;
  }
}

/**
 * The intrinsic path, as `.####` has for a Demi. A source is a Denum exactly
 * when its stored `rank`, `count` and `loads` are a valid state and it is `==`
 * (same value and same type at every node, fields and methods included) to the
 * Denum the shipped constructor builds from them. The answer is then built
 * from that reconstruction, never from the source: no observer, method or
 * closure of the source runs, so a forged `#`, `##` or `###` cannot steer it.
 * A Denum of Count zero is therefore present, unlike a host with no children.
 *
 * @returns The source's reconstruction as a state, or undefined.
 */
function intrinsicDenum(source: Frame): Denum | undefined {
  if (!construct) return undefined;
  const host = source.referent();
  if (!host.ownsIdentity()) return undefined;
  const state = storedState(host);
  if (!state) return undefined;
  let candidate: Frame;
  try {
    candidate = construct(state);
  } catch (error) {
    if (error instanceof DenumError) return undefined;
    throw error;
  }
  if (candidate.isFailedResult() || candidate.observationError()) {
    return undefined;
  }
  return candidate.typeEquals(host) === Frame.all ? state : undefined;
}

/**
 * The ranked hash, `.#n` (occurrence/figure 007.32, 007.32b): the Denum of
 * rung n, n from 0 to 5. There is no `#n=`, and a Denum is not a scalar
 * observation; the algebraic value is `d.observe ()`.
 *
 * Two different operations answer it, and they are not the same:
 *
 * - **Construction from a host.** A host answers its Count C, Size s and
 *   residual r only, so the Denum is built from those three observers with
 *   the derivation of `.####` (`observeDemi`), at rank n (`fromHost`). A host
 *   with no Count, or Count zero, has no Denum and answers nil, as it has no
 *   Demi; rank 0 reads no residual. Failures are answered as they are, and
 *   unusable observations are `$!.denum-count`, `$!.denum-observations` and
 *   `$!.denum-coherence`.
 * - **Promotion of a Denum.** An instance of the shipped class answers its own
 *   state promoted to rank n, keeping Count and every load, and below its own
 *   rank `$!.denum-demotion`. A Denum of Count zero is present.
 *
 * A multi-channel `RotorRouter` is not special-cased here as it is under
 * `.####` (`channelRouterDemi`): `.#n` reads only Count, Size and residual, so
 * `x.#1` equals `x.####` for ordinary and binary hosts, and for a router of
 * more than two channels is the binary projection while `.####` keeps its
 * channel Demi (pinned in `hc/denum.hc`).
 *
 * Nothing folds, executes or caches the source, and each observer is read at
 * most once. A rank above 5 is `$!.denum-rank`.
 *
 * @param source The observed Frame.
 * @param rank The rung n of `.#n`.
 * @returns A Denum, nil, or an error.
 */
export function observeDenum(source: Frame, rank: number): Frame {
  const failure = source.observationError();
  if (failure) return failure;
  if (!Number.isInteger(rank) || rank < 0 || rank > MAX_RANK) {
    return Frame.error("$!.denum-rank");
  }
  if (!construct) return Frame.error("$!.denum-unavailable");
  try {
    const intrinsic = intrinsicDenum(source);
    if (intrinsic) return construct(promote(intrinsic, rank));
    const n = source.sizeFor(Frame.kCOUNT);
    if (n.observationError()) return n;
    if (n === Frame.nil) return Frame.nil; // no Count, no Denum
    if (
      !(n instanceof FrameCount) || typeof n.data !== "bigint" || n.data < 0n
    ) {
      return Frame.error("$!.denum-count");
    }
    if (n.data === 0n) return Frame.nil;
    const s = source.sizeFor(Frame.kLEAVES);
    if (s.observationError()) return s;
    if (!(s instanceof FrameCount) || typeof s.data !== "bigint") {
      return Frame.error("$!.denum-observations");
    }
    if (rank === 0) return construct(fromHost(0, n.data, s.data, 0n));
    const r = source.sizeFor(Frame.kRESIDUAL);
    if (r.observationError()) return r;
    if (r === Frame.nil) return Frame.nil;
    if (!(r instanceof FrameInt) || typeof r.data !== "bigint") {
      return Frame.error("$!.denum-observations");
    }
    return construct(fromHost(rank, n.data, s.data, r.data));
  } catch (error) {
    if (error instanceof DenumError) return Frame.error(error.kind);
    throw error;
  }
}

Frame.denum = observeDenum;
