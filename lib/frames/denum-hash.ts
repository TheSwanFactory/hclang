import { Frame } from "./frame.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";
import {
  type Denum,
  DenumError,
  fromHost,
  MAX_RANK,
  promoteDenum,
} from "./denum.ts";

/**
 * Builds an instance of one of the HC classes in `hc/denum.hc` from a state
 * already known to be admissible, or answers the class's failure.
 */
export type DenumConstructor = (state: Denum) => Frame;

/** What the evaluator installs for the ranked hash, together. */
export interface DenumConstructors {
  /** The public `Denum [count, loads]` constructor: what `.#n` answers. */
  readonly denum: DenumConstructor;
  /**
   * The derived CD view of the `Denum` the state builds, `d.cd ()`. It is used
   * only to *recognize* a view source, which `.#n` refuses; the frames package
   * never exposes what it builds, and it is not a constructor of retained state.
   */
  readonly view: DenumConstructor;
}

let constructors: DenumConstructors | undefined;

/**
 * Installs what `.#n` answers with and recognizes. The classes are HC, so the
 * frames package, which cannot run HC, takes them from the evaluator
 * (`lib/execute/denum-prologue.ts`), as `.####` takes its Demi. They are
 * installed as a pair: the Denum constructor builds every answer, and the view
 * derivation is used only to recognize a view source, which is refused.
 *
 * @param installed Both, called once per present observation.
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
 * The intrinsic path, as `.####` has for a Demi. A source is a Denum (or a CD
 * view) exactly when its stored `count` and `loads` are a valid state and it is
 * `==` (same value and same type at every node, fields and methods included) to
 * the instance the shipped `Denum` constructor (or its `.cd ()` view) builds
 * from them. The answer is then built from that reconstruction, never from the
 * source: no observer, method or closure of the source runs, so a forged `#`,
 * `##` or `###` cannot steer it. A zero Count is therefore present, unlike a
 * host with no children. The arity decides nothing: a Denum with `2ⁿ` loads is
 * not a view, and a view is not rebuilt by the Denum constructor.
 *
 * @returns Which construction rebuilds the source, and its state; or undefined.
 */
function intrinsicDenum(
  source: Frame,
): { kind: "view" | "denum"; state: Denum } | undefined {
  if (!constructors) return undefined;
  const host = source.referent();
  if (!host.ownsIdentity()) return undefined;
  const state = storedState(host);
  if (!state) return undefined;
  if (rebuilds(constructors.denum, state, host)) {
    return { kind: "denum", state };
  }
  if (rebuilds(constructors.view, state, host)) return { kind: "view", state };
  return undefined;
}

/**
 * The ranked hash, `.#n` (occurrence/figure 007.32, 007.32b, 007.35b, 007.36):
 * a generic Denum of rung n, n from 0 to 5. It never answers a CD view, and
 * there is no `#n=`; the algebraic value is `d.coordinates ()` of a view
 * derived by `d.cd ()`.
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
 * - **Promotion of a Denum.** An instance of the shipped `Denum` class with a
 *   shipped binary arity (1, 2, 4, 8, 16, 32) answers its own state under the
 *   load-preserving embedding at rung n, keeping Count and every load, and
 *   below its own derived rank `$!.denum-demotion`. The embedding is
 *   structural: it does not invoke the CD interpretation, and the answer is a
 *   Denum. A Denum of Count zero is present. Any other arity is
 *   `$!.denum-unsupported-arity`: nothing is truncated, padded or read as
 *   `2^rank`.
 * - **Refusal of a CD view.** A view derived by `d.cd ()` is never a source:
 *   the answer is `$!.denum-view-source`, and it is not measured as a host from
 *   its Count and Size either. Ask the Denum it views, `v.denum ()`.
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
  if (!constructors) return Frame.error("$!.denum-unavailable");
  const construct = constructors.denum;
  try {
    const intrinsic = intrinsicDenum(source);
    if (intrinsic?.kind === "view") return Frame.error("$!.denum-view-source");
    if (intrinsic) return construct(promoteDenum(intrinsic.state, rank));
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
