import { Frame } from "./frame.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";
import {
  cd,
  type Denum,
  DenumError,
  fromHost,
  MAX_RANK,
  promote,
} from "./denum.ts";

/**
 * Builds an instance of one of the HC classes in `hc/denum.hc` from a state
 * already known to be admissible, or answers the class's failure.
 */
export type DenumConstructor = (state: Denum) => Frame;

/** The two public constructors of `hc/denum.hc`, installed together. */
export interface DenumConstructors {
  /** The explicit `CD [count, loads]` constructor: what `.#n` answers. */
  readonly cd: DenumConstructor;
  /** The generic `Denum [count, loads]` constructor: only to recognize one. */
  readonly denum: DenumConstructor;
}

let constructors: DenumConstructors | undefined;

/**
 * Installs what `.#n` answers with and recognizes. The classes are HC, so the
 * frames package, which cannot run HC, takes both constructors from the
 * evaluator (`lib/execute/denum-prologue.ts`), as `.####` takes its Demi. They
 * are installed as a pair: the CD constructor builds every answer, and the
 * generic one is used only to recognize a generic Denum source, which is
 * refused and never converted.
 *
 * @param installed Both constructors, called once per present observation.
 */
export function installDenumConstructors(installed: DenumConstructors): void {
  constructors = installed;
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
 * The stored state of a Denum instance: its own `count` and `loads` fields
 * (there is no stored rank). Only the instance's own fields are read (`get_here`), never a
 * declared parent or a method, and the loads are read as stored, so nothing
 * runs. Undefined when any field is absent or not an exact Count of the right
 * shape.
 */
function storedState(host: Frame): Denum | undefined {
  const count = exactCount(host.get_here("count"));
  const list = host.get_here("loads").referent();
  if (count === undefined) return undefined;
  if (!list.ownsIdentity()) return undefined;
  const loads = list.elements().map(exactCount);
  if (loads.length === 0 || loads.some((load) => load === undefined)) {
    return undefined;
  }
  return { count, loads: loads as bigint[] };
}

/** True when `construct(state)` builds exactly `host` (same value and type). */
function rebuilds(
  construct: DenumConstructor,
  state: Denum,
  host: Frame,
): boolean {
  let candidate: Frame;
  try {
    candidate = construct(state);
  } catch (error) {
    if (error instanceof DenumError) return false;
    throw error;
  }
  if (candidate.isFailedResult() || candidate.observationError()) return false;
  return candidate.typeEquals(host) === Frame.all;
}

/**
 * The intrinsic path, as `.####` has for a Demi. A source is a CD (or a
 * generic Denum) exactly when its stored `count` and `loads` are a valid state
 * and it is `==` (same value and same type at every node, fields and methods
 * included) to the instance the shipped `CD` (or `Denum`) constructor builds
 * from them. The answer is then built from that reconstruction, never from the
 * source: no observer, method or closure of the source runs, so a forged `#`,
 * `##` or `###` cannot steer it. A zero Count is therefore present, unlike a
 * host with no children. The arity decides nothing: the CD reconstruction of a
 * generic Denum with `2ⁿ` loads is a different type, so it is not a CD.
 *
 * @returns Which constructor rebuilds the source, and its state; or undefined.
 */
function intrinsicDenum(
  source: Frame,
): { kind: "cd" | "denum"; state: Denum } | undefined {
  if (!constructors) return undefined;
  const host = source.referent();
  if (!host.ownsIdentity()) return undefined;
  const state = storedState(host);
  if (!state) return undefined;
  if (rebuilds(constructors.cd, state, host)) return { kind: "cd", state };
  if (rebuilds(constructors.denum, state, host)) {
    return { kind: "denum", state };
  }
  return undefined;
}

/**
 * The ranked hash, `.#n` (occurrence/figure 007.32, 007.32b, 007.35b): the CD of
 * rung n, n from 0 to 5. There is no `#n=`, and a Denum is not a scalar
 * observation; the algebraic value is `d.coordinates ()`.
 *
 * Three different cases answer it, and they are not the same:
 *
 * - **Construction from a host.** A host answers its Count C, Size s and
 *   residual r only, so the Denum is built from those three observers with
 *   the derivation of `.####` (`observeDemi`), at rank n (`fromHost`). A host
 *   with no Count, or Count zero, has no Denum and answers nil, as it has no
 *   Demi; rank 0 reads no residual. Failures are answered as they are, and
 *   unusable observations are `$!.denum-count`, `$!.denum-observations` and
 *   `$!.denum-coherence`.
 * - **Promotion of a CD.** An instance of the shipped `CD` class answers its
 *   own state promoted to rung n, keeping Count and every load, and below its
 *   own derived rank `$!.denum-demotion`. A CD of Count zero is present.
 * - **Refusal of a generic Denum.** An instance of the shipped `Denum` class is
 *   never a CD source, even with `A = 1, 2, 4, 8, 16, 32` loads: its loads are
 *   not signed channels. It is not promoted, interpreted or converted, and it
 *   is not measured as a host from its Count and Size either. The answer is
 *   `$!.denum-not-cd`, and the source is unchanged.
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
 * @returns A CD, nil, or an error.
 */
export function observeDenum(source: Frame, rank: number): Frame {
  const failure = source.observationError();
  if (failure) return failure;
  if (!Number.isInteger(rank) || rank < 0 || rank > MAX_RANK) {
    return Frame.error("$!.denum-rank");
  }
  if (!constructors) return Frame.error("$!.denum-unavailable");
  const construct = constructors.cd;
  try {
    const intrinsic = intrinsicDenum(source);
    if (intrinsic?.kind === "denum") return Frame.error("$!.denum-not-cd");
    if (intrinsic) {
      return construct(
        promote(cd(intrinsic.state.count, intrinsic.state.loads), rank),
      );
    }
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
