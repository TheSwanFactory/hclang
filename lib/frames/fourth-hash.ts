import { Frame } from "./frame.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";

/**
 * Builds a Demi from its Count and two loads. The Count is the full observed
 * Count of the source, not its parity; the Demi derives its own phase from it,
 * 2 when even and 1 when odd (011.18g, 007.25).
 */
export type DemiConstructor = (
  count: FrameCount,
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

/** The stored fields a Demi instance is reconstructed from, in order. */
const DEMI_STATE = ["count", "left", "right"] as const;

/**
 * A stored field read as an exact nonnegative Count, or undefined.
 *
 * Only the instance's own field is read (`get_here`), never a declared parent
 * or a method, so nothing runs.
 */
function storedCount(source: Frame, key: string): FrameCount | undefined {
  const value = source.get_here(key).referent();
  return value instanceof FrameCount && typeof value.data === "bigint" &&
      value.data >= 0n
    ? value
    : undefined;
}

/**
 * The intrinsic Demi path (007.25e). A constructed Demi is the one Frame whose
 * fourth hash the three observers cannot decide: `Demi [0, 0, 0]` reads 0, 0,
 * 0, exactly as `[]` does, yet it is a present state. Rather than let any
 * class declare its own `.####`, the fourth hash recognizes an instance of the
 * shipped class itself, and nothing else.
 *
 * A source is a Demi exactly when it has stored Counts `count`, `left` and
 * `right`, and it is `==` (same value and same type at every node, fields and
 * methods included) to the Demi the shipped constructor builds from those
 * three Counts. The answer is then that fresh reconstruction, never the source
 * and never anything the source computed. No observer, method or closure of
 * the source runs, so a forged `#`, `##`, `###` or `####` cannot steer it, and
 * comparison is the language's own typed equality, not a spelling. Anything
 * else, a foreign aggregate, a forged or edited instance, or a reconstruction
 * that fails, is undefined, and the source takes the derived path like every
 * other Frame.
 *
 * @param source The observed Frame.
 * @returns A fresh Demi equal to the source, or undefined.
 */
function intrinsicDemi(source: Frame): Frame | undefined {
  if (!construct) return undefined;
  const host = source.referent();
  if (!host.ownsIdentity()) return undefined;
  const [count, left, right] = DEMI_STATE.map((key) => storedCount(host, key));
  if (!count || !left || !right) return undefined;
  const candidate = construct(
    new FrameCount(count.data),
    new FrameCount(left.data),
    new FrameCount(right.data),
  );
  if (candidate.isFailedResult() || candidate.observationError()) {
    return undefined;
  }
  return candidate.typeEquals(host) === Frame.all ? candidate : undefined;
}

/**
 * The fourth hash, `.####`. For a constructed Demi it is that Demi's own state
 * (`intrinsicDemi`), Count zero included. For every other Frame it is derived
 * only from the existing observers: Count n, Size s and residual r give the
 * loads (s+r)/2 and (s−r)/2, and n itself is the Demi's Count, kept whole
 * rather than reduced to its parity (007.25c). It never folds, executes or
 * caches the source, and reads each observer at most once.
 *
 * A derived source with Count zero is nil: a host with no children has no
 * Demi, so `[].####` and `0.####` are nil while `(Demi [0, 0, 0]).####` is
 * present. No class can declare `.####` for itself; only the three observers
 * are declarable (`FrameArray.OBSERVATION_KEYS`).
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
  const intrinsic = intrinsicDemi(source);
  if (intrinsic) return intrinsic;
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
    new FrameCount(n.data),
    new FrameCount(sum / 2n),
    new FrameCount(difference / 2n),
  );
}

Frame.demi = observeDemi;
