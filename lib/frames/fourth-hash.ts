import { Frame } from "./frame.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";

/**
 * Builds a Demi from its phase and two loads. The phase is the least positive
 * Count of the observed parity: 2 when even, 1 when odd (011.18g).
 */
export type DemiConstructor = (
  phase: FrameCount,
  left: FrameCount,
  right: FrameCount,
) => Frame;

let construct: DemiConstructor | undefined;

/**
 * Installs what `.####` answers a present Demi with. The Demi is an HC class,
 * `Demi` in `hc/demi.hc`, so the frames package, which cannot run HC, takes
 * its constructor from the evaluator (`lib/execute/demi-prologue.ts`).
 *
 * @param constructor The constructor, called once per present observation.
 */
export function installDemiConstructor(constructor: DemiConstructor): void {
  construct = constructor;
}

/**
 * The fourth hash, `.####`, derived only from the existing observers: Count n,
 * Size s and residual r give the loads (s+r)/2 and (s−r)/2, and n's parity
 * the phase. It never folds, executes or caches the source, and reads each
 * observer at most once.
 *
 * In order: a failure of the source or of any observer is answered as it is;
 * no Count (nil) or Count zero is nil; nil residual is nil; observations that
 * are not exact Counts and an integer are `$!.demi-observations`; and loads
 * that are negative or not whole are `$!.demi-coherence`. Only then is the
 * Demi constructed (011.18b–m).
 *
 * @param source The observed Frame.
 * @returns A Demi, nil, or an error.
 */
export function observeDemi(source: Frame): Frame {
  const failure = source.observationError();
  if (failure) return failure;
  const n = source.sizeFor(Frame.kCOUNT);
  if (n.observationError()) return n;
  if (n === Frame.nil) return Frame.nil; // no Count, no Demi (011.18k)
  if (
    !(n instanceof FrameCount) || typeof n.data !== "bigint" || n.data < 0n
  ) {
    return Frame.error("$!.demi-count");
  }
  if (n.data === 0n) return Frame.nil;
  const s = source.sizeFor(Frame.kLEAVES);
  if (s.observationError()) return s;
  const r = source.sizeFor(Frame.kRESIDUAL);
  if (r.observationError()) return r;
  if (r === Frame.nil) return Frame.nil;
  if (
    !(s instanceof FrameCount) || !(r instanceof FrameInt) ||
    typeof s.data !== "bigint" || typeof r.data !== "bigint" || s.data < 0n
  ) return Frame.error("$!.demi-observations");
  const sum = s.data + r.data;
  const difference = s.data - r.data;
  if (
    sum < 0n || difference < 0n || sum % 2n !== 0n || difference % 2n !== 0n
  ) {
    return Frame.error("$!.demi-coherence");
  }
  if (!construct) return Frame.error("$!.demi-unavailable");
  return construct(
    new FrameCount(n.data % 2n === 0n ? 2n : 1n),
    new FrameCount(sum / 2n),
    new FrameCount(difference / 2n),
  );
}

Frame.demi = observeDemi;
