import { Frame } from "./frame.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";
import { FrameArray } from "./frame-array.ts";
import {
  kdCoordinates,
  kdMultiplyLoads,
  kdNegateLoads,
} from "./kd-signed-xor.ts";

/**
 * Builds a Denum from its Count and its ordered channel loads, at least one.
 * The Count is the full observed Count of the source, not its parity. Every
 * arity is the same class (007.27, 007.40).
 */
export type DenumConstructor = (
  count: FrameCount,
  loads: readonly FrameCount[],
) => Frame;

let construct: DenumConstructor | undefined;

/**
 * Installs what `.####` answers a present Denum with. The Denum is an HC class,
 * `Denum` in `hc/denum.hc`, so the frames package, which cannot run HC, takes
 * its constructor from the evaluator (`lib/execute/denum-prologue.ts`).
 *
 * @param constructor The constructor, called once per present observation.
 */
export function installDenumConstructor(constructor: DenumConstructor): void {
  construct = constructor;
}

/**
 * Answers the channels of an instance of the shipped `RotorRouter` class, or
 * undefined for any other Frame. The router is an
 * HC class, so the evaluator installs this (`lib/execute/router-prologue.ts`).
 */
export type RouterRecognizer = (source: Frame) => Frame[] | undefined;

let recognizeRouter: RouterRecognizer | undefined;

/**
 * Installs how `.####` recognizes a channel router (007.27).
 *
 * @param recognizer Answers a channel router's channels, or undefined.
 */
export function installRouterRecognizer(recognizer: RouterRecognizer): void {
  recognizeRouter = recognizer;
}

/** A Frame read as an exact nonnegative Count, or undefined. */
function exactCount(frame: Frame): FrameCount | undefined {
  const value = frame.referent();
  return value instanceof FrameCount && typeof value.data === "bigint" &&
      value.data >= 0n
    ? value
    : undefined;
}

/**
 * The stored loads of a Denum instance: its own `loads` field, a nonempty list
 * whose elements are all exact Counts, or undefined.
 *
 * Only the instance's own field is read (`get_here`), never a declared parent
 * or a method, and the list's elements are read as stored, so nothing runs.
 */
function storedLoads(source: Frame): FrameCount[] | undefined {
  const value = source.get_here("loads").referent();
  if (!value.ownsIdentity()) return undefined;
  const elements = value.elements();
  const loads = elements.map(exactCount);
  return loads.every((load) => load !== undefined)
    ? loads as FrameCount[]
    : undefined;
}

/**
 * The intrinsic Denum path (007.25e). A constructed Denum is the one Frame whose
 * fourth hash the three observers cannot decide: `Denum [0, [0, 0]]` reads 0, 0,
 * 0, exactly as `[]` does, yet it is a present state. Rather than let any
 * class declare its own `.####`, the fourth hash recognizes an instance of the
 * shipped class itself, and nothing else.
 *
 * A source is a Denum exactly when it has a stored Count `count` and a stored
 * nonempty list of Counts `loads`, and it is `==` (same value and same type at
 * every node, fields and methods included) to the Denum the shipped constructor
 * builds from them. A Denum stores nothing else (007.40), and the comparison
 * covers its methods too. The answer is then that fresh reconstruction, of
 * the source's own arity, never the source
 * and never anything the source computed. No observer, method or closure of
 * the source runs, so a forged `#`, `##`, `###` or `####` cannot steer it, and
 * comparison is the language's own typed equality, not a spelling. Anything
 * else, a foreign aggregate, a forged or edited instance, or a reconstruction
 * that fails, is undefined, and the source takes the derived path like every
 * other Frame.
 *
 * @param source The observed Frame.
 * @returns A fresh Denum equal to the source, or undefined.
 */
function intrinsicDenum(source: Frame): Frame | undefined {
  return recognizeDenum(source)?.denum;
}

/** A recognized Denum: its fresh reconstruction and the state it was built from. */
interface DenumState {
  readonly denum: Frame;
  readonly count: bigint;
  readonly loads: readonly bigint[];
}

/**
 * Recognizes an instance of the shipped Denum class exactly as
 * `intrinsicDenum` documents, answering its reconstruction together with the
 * stored Count and loads it was rebuilt from, or undefined.
 */
function recognizeDenum(source: Frame): DenumState | undefined {
  if (!construct) return undefined;
  const host = source.referent();
  if (!host.ownsIdentity()) return undefined;
  const count = exactCount(host.get_here("count"));
  const loads = storedLoads(host);
  if (!count || !loads) return undefined;
  const candidate = construct(
    new FrameCount(count.data),
    loads.map((load) => new FrameCount(load.data)),
  );
  if (candidate.isFailedResult() || candidate.observationError()) {
    return undefined;
  }
  return candidate.typeEquals(host) === Frame.all
    ? {
      denum: candidate,
      count: count.data as bigint,
      loads: loads.map((load) => load.data as bigint),
    }
    : undefined;
}

/**
 * The most loads `.#%` materializes. The Count is exact and unbounded, but the
 * bound Denum holds C loads, so a Count above this is refused with
 * `$!.denum-binding-capacity` rather than allocated, truncated or converted.
 */
export const DENUM_BINDING_CAPACITY = 65536n;

/**
 * Count binding, `d.#%` (occurrence/figure 007.39a, 007.40). For a Denum
 * `d = (C; [a0, …, a(A−1)])` with C > 0 it answers the new Denum
 * `(C; [b0, …, b(C−1)])`, where `bj` is the sum of every `ai` with
 * `i mod C = j`: fewer loads than C are copied and zero-filled, exactly C are
 * kept, and more fold onto the first C by index. The Count, the total Size
 * and nonnegativity are kept, the arity becomes C, and binding is idempotent.
 * It is not a rank and allocates no geometry.
 *
 * Only a genuine Denum is bound, recognized as `.####` recognizes it, so
 * nothing of the receiver runs. In order: a failed receiver is answered as it
 * is; anything that is not a Denum is `$!.denum-binding-receiver`; Count zero
 * is `$!.denum-binding-zero-count`, since there is no channel to bind into;
 * and a Count above `DENUM_BINDING_CAPACITY` is `$!.denum-binding-capacity`.
 * The receiver is never changed.
 *
 * @param source The observed Frame.
 * @returns The bound Denum, or an error.
 */
export function bindDenumCount(source: Frame): Frame {
  const bound = boundLoads(source);
  if (bound instanceof Frame) return bound;
  return construct!(
    new FrameCount(BigInt(bound.length)),
    bound.map((load) => new FrameCount(load)),
  );
}

/**
 * The recognized Denum state of `source`, or the error `.#%` answers for a
 * failed or non-Denum receiver. The rank observers (007.43i, 007.44) read this
 * stored Count and the stored loads as they are, without binding.
 *
 * @param source The observed Frame.
 * @returns The Count and stored loads, or the receiver's error.
 */
export function denumState(
  source: Frame,
): { count: bigint; loads: readonly bigint[] } | Frame {
  const failure = source.observationError();
  if (failure) return failure;
  if (!construct) return Frame.error("$!.denum-unavailable");
  const state = recognizeDenum(source);
  if (!state) return Frame.error("$!.denum-binding-receiver");
  return { count: state.count, loads: state.loads };
}

/**
 * The loads of `source.#%`, the C sums `bj = Σ ai` over `i mod C = j`, folded
 * without building the bound Denum, or the binding's error in the order
 * `bindDenumCount` documents. The geometric observers (007.41b) read these, so
 * they consume the same genuine binding as `.#%` at no extra cost.
 *
 * @param source The observed Frame.
 * @returns The C bound loads, or the binding's error.
 */
export function boundLoads(source: Frame): bigint[] | Frame {
  const state = denumState(source);
  if (state instanceof Frame) return state;
  if (state.count === 0n) return Frame.error("$!.denum-binding-zero-count");
  if (state.count > DENUM_BINDING_CAPACITY) {
    return Frame.error("$!.denum-binding-capacity");
  }
  const arity = Number(state.count);
  const bound = new Array<bigint>(arity).fill(0n);
  state.loads.forEach((load, index) => {
    bound[index % arity] += load;
  });
  return bound;
}

/**
 * The router path (007.27). A router of k channels routes to channel C mod k,
 * which only a Denum of k loads follows, so an instance of the shipped
 * `RotorRouter` class, of any number of channels, answers the Denum of its
 * Count and channel loads, `Denum [C, [load0, …]]`, where a load is the summed
 * Size of a channel's children and an empty channel's load is 0.
 *
 * Its Count is the children it holds; at Count zero it has no Denum, as the
 * empty host has none. Each child's Size is read
 * once, and a failed Size is answered as it is.
 *
 * @param source The observed Frame.
 * @returns The router's channel Denum, nil, an error, or undefined when the
 *   source is not a channel router.
 */
function channelRouterDenum(source: Frame): Frame | undefined {
  const channels = recognizeRouter?.(source);
  if (!channels) return undefined;
  const count = channels.reduce(
    (total, channel) => total + BigInt(channel.elements().length),
    0n,
  );
  if (count === 0n && channels.length === 0) {
    return construct?.(new FrameCount(0n), []) ??
      Frame.error("$!.denum-unavailable");
  }
  const loads: FrameCount[] = [];
  for (const channel of channels) {
    if (channel.elements().length === 0) {
      loads.push(new FrameCount(0n));
      continue;
    }
    const size = channel.sizeFor(Frame.kLEAVES);
    if (size.observationError()) return size;
    const load = exactCount(size);
    if (!load) return Frame.error("$!.denum-observations");
    loads.push(new FrameCount(load.data));
  }
  if (!construct) return Frame.error("$!.denum-unavailable");
  return construct(new FrameCount(count), loads);
}

/**
 * The third hash: constructive, ordered Denumeration. A genuine Denum keeps
 * its Count and raw loads; an ordinary Frame contributes the Size of each
 * immediate child. Count is not forced to equal load arity on a Denum.
 */
export function observeDenum(source: Frame): Frame {
  const failure = source.observationError();
  if (failure) return failure;
  const intrinsic = intrinsicDenum(source);
  if (intrinsic) return intrinsic;
  const routed = channelRouterDenum(source);
  if (routed) return routed;
  const count = source.sizeFor(Frame.kCOUNT);
  if (count.observationError()) return count;
  if (count === Frame.nil) return Frame.nil;
  if (!(count instanceof FrameCount)) {
    return Frame.error("$!.denum-count");
  }
  if (!construct) return Frame.error("$!.denum-unavailable");
  // A zero-valued scalar remains the unsigned empty seed. A collecting
  // Frame can declare Count zero while still carrying positional children:
  // raw Denumeration must not discard those children.
  if (count.data === 0n && !source.referent().collects()) {
    return construct(new FrameCount(0n), []);
  }
  const loads: FrameCount[] = [];
  for (const child of source.elements()) {
    // A non-collecting scalar exposes itself as its sole element. That is
    // a valid one-load observation, not a cyclic aggregate. Only recursive
    // collection of an aggregate into itself is an invalid self-child.
    if (
      source.referent().collects() &&
      child.referent() === source.referent()
    ) {
      return Frame.error("$!.cyclic-aggregate .###");
    }
    const size = child.referent().sizeFor(Frame.kLEAVES);
    if (size.observationError()) return size;
    const whole = exactCount(size);
    if (!whole) return Frame.error("$!.denum-observations");
    loads.push(new FrameCount(whole.data));
  }
  if (loads.length === 0 && count.data !== 0n) {
    return Frame.error("$!.denum-observations");
  }
  return construct(new FrameCount(count.data), loads);
}

/** An unforgeable Denum's stored Count and loads, without reconstructing it. */
export function tryDenumState(
  source: Frame,
): { count: bigint; loads: readonly bigint[] } | undefined {
  const state = recognizeDenum(source);
  return state && { count: state.count, loads: state.loads };
}

/**
 * The fourth hash observes KD signed coordinates from the raw third hash.
 * Arity completion is virtual: neither Count nor the stored loads change.
 */
export function observeKDCoordinates(source: Frame): Frame {
  const raw = observeDenum(source);
  if (raw === Frame.nil || raw.observationError()) return raw;
  const state = recognizeDenum(raw);
  if (!state) return Frame.error("$!.denum-observations");
  if (state.loads.length === 0) return new FrameArray([]);
  try {
    return new FrameArray(
      kdCoordinates(state.loads).map((n) =>
        n >= 0n ? new FrameCount(n) : new FrameInt(n)
      ),
    );
  } catch {
    return Frame.error("$!.denum-binding-capacity");
  }
}

/** A Denum's unary sign half-turn, or undefined for a non-Denum value. */
export function negateDenum(source: Frame): Frame | undefined {
  const state = recognizeDenum(source);
  if (!state) return undefined;
  if (!construct) return Frame.error("$!.denum-unavailable");
  try {
    const loads = state.loads.length === 0 ? [] : kdNegateLoads(state.loads);
    return construct(
      new FrameCount(state.count),
      loads.map((n) => new FrameCount(n)),
    );
  } catch {
    return Frame.error("$!.denum-binding-capacity");
  }
}

/**
 * Signed-XOR KD multiplication. A product Count counts pairings of the
 * operands' construction Counts, independent from its normalized load arity:
 * C(A &|& B) := C(A) × C(B). This explicit policy preserves Count zero.
 */
export function multiplyDenum(left: Frame, right: Frame): Frame {
  const a = observeDenum(left);
  if (a.observationError() || a === Frame.nil) return a;
  const b = observeDenum(right);
  if (b.observationError() || b === Frame.nil) return b;
  const x = recognizeDenum(a);
  const y = recognizeDenum(b);
  if (!x || !y || !construct) {
    return Frame.error("$!.denum-observations");
  }
  try {
    const loads = x.loads.length === 0 || y.loads.length === 0
      ? []
      : kdMultiplyLoads(x.loads, y.loads);
    return construct(
      new FrameCount(x.count * y.count),
      loads.map((n) => new FrameCount(n)),
    );
  } catch (error) {
    return Frame.error(
      error instanceof RangeError && error.message.includes("budget")
        ? "$!.denum-product-budget &|&"
        : "$!.denum-product-capacity &|&",
    );
  }
}

Frame.denum = observeDenum;
Frame.observeKD = observeKDCoordinates;
Frame.negateDenum = negateDenum;
