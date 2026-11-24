import { Frame } from "./frame.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameInt } from "./frame-int.ts";
import { FrameArray } from "./frame-array.ts";
import {
  kdCoordinates,
  kdMultiplyLoads,
  kdNegateLoads,
  KDProductBudgetError,
} from "./kd-signed-xor.ts";

/**
 * Builds a Denum from its Count and ordered loads, including zero arity.
 * The Count is the full observed Count of the source, not its parity. Every
 * arity is the same class (007.27, 007.40).
 */
export type DenumConstructor = (
  count: FrameCount,
  loads: readonly FrameCount[],
) => Frame;

let construct: DenumConstructor | undefined;

/**
 * Installs the constructor for raw `.###` and KD `.####` observations.
 * The Denum is an HC class,
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
 * Installs how raw `.###` recognizes a channel router (007.27).
 *
 * @param recognizer Answers a channel router's channels, or undefined.
 */
export function installRouterRecognizer(recognizer: RouterRecognizer): void {
  recognizeRouter = recognizer;
}

/**
 * Whether a reconstruction shows its host to be an instance of a shipped HC
 * class (007.25e): the rebuilt instance neither fails nor has an observation
 * error, and it is `==` to the host, the same value and the same type at every
 * node, fields and methods included. The caller rebuilds the instance from the
 * host's own stored fields through the shipped constructor, so nothing of the
 * host runs and a forged or edited record is not an instance.
 *
 * @param host The observed Frame's referent.
 * @param rebuilt What the shipped constructor built from the host's fields.
 * @returns True when the host is an instance of the shipped class.
 */
export function isShippedInstance(host: Frame, rebuilt: Frame): boolean {
  return !rebuilt.isFailedResult() && !rebuilt.observationError() &&
    rebuilt.typeEquals(host) === Frame.all;
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
 * The stored loads of a Denum instance: its own `loads` list (including
 * the canonical empty list), whose elements are exact Counts, or undefined.
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
 * A Frame's Size `##` read as a load: an exact nonnegative Count. A failed Size
 * propagates unchanged, and any other answer is `$!.denum-observations`.
 *
 * @param frame The channel or child whose Size is the load.
 * @returns The load, or the failure to return.
 */
function sizeLoad(frame: Frame): FrameCount | Frame {
  const size = frame.sizeFor(Frame.kLEAVES);
  if (size.observationError()) return size;
  return exactCount(size) ?? Frame.error("$!.denum-observations");
}

/**
 * The intrinsic Denum path (007.25e). A constructed Denum keeps its loads in a
 * field, not as children, so the derived path, which reads the source's Count
 * and each child's Size, cannot rebuild it: `Denum [0, [0, 0]]` would read as
 * `[]` does, yet it is a present state. Rather than let any class declare its
 * own `.###`, the raw Denum observation recognizes an instance of the shipped
 * class itself, and nothing else; `.####` reads its coordinates from that.
 *
 * A source is a Denum exactly when it has a stored Count `count` and a stored
 * list of Counts `loads`, and it is `==` (same value and same type at
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
 * @returns A fresh Denum equal to the source, with the state it was built
 *   from, or undefined.
 */
function intrinsicDenum(source: Frame): DenumState | undefined {
  return recognizeDenum(source);
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
  return isShippedInstance(host, candidate)
    ? {
      denum: candidate,
      count: count.data as bigint,
      loads: loads.map((load) => load.data as bigint),
    }
    : undefined;
}

/**
 * The router path (007.27). A router of k channels routes to channel C mod k,
 * which only a Denum of k loads follows, so an instance of the shipped
 * `RotorRouter` class, of any number of channels, answers the Denum of its
 * Count and channel loads, `Denum [C, [load0, …]]`, where a load is the summed
 * Size of a channel's children and an empty channel's load is 0.
 *
 * Its Count is the number of routed children, independent of channel
 * arity. At Count zero, k existing empty channels produce Denum(0,[0,...,0])
 * rather than the empty Frame's Denum(0,[]). Each child's Size is read once
 * and a failed Size propagates unchanged.
 *
 * @param source The observed Frame.
 * @returns The router's channel Denum, an error, or undefined when the source
 *   is not a channel router.
 */
function channelRouterDenum(source: Frame): Frame | undefined {
  const channels = recognizeRouter?.(source);
  if (!channels) return undefined;
  const count = channels.reduce(
    (total, channel) => total + BigInt(channel.elements().length),
    0n,
  );
  if (channels.length === 0) {
    return construct?.(new FrameCount(0n), []) ??
      Frame.error("$!.denum-unavailable");
  }
  const loads: FrameCount[] = [];
  for (const channel of channels) {
    if (channel.elements().length === 0) {
      loads.push(new FrameCount(0n));
      continue;
    }
    const load = sizeLoad(channel);
    if (!(load instanceof FrameCount)) return load;
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
  const raw = observeRawDenum(source);
  return raw instanceof Frame ? raw : raw.denum;
}

/**
 * The raw third hash as `observeDenum` answers it, except that a recognized
 * Denum answers its state, so a caller that needs the stored Count and loads
 * does not rebuild the reconstruction to recognize it again.
 */
function observeRawDenum(source: Frame): Frame | DenumState {
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
    const load = sizeLoad(child.referent());
    if (!(load instanceof FrameCount)) return load;
    loads.push(new FrameCount(load.data));
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
 * The state of a raw observation: the one already recognized, or, for a
 * Denum the derived or router path constructed, its recognition.
 */
function stateOf(raw: Frame | DenumState): DenumState | undefined {
  return raw instanceof Frame ? recognizeDenum(raw) : raw;
}

/** Whether a raw observation is absent or failed, and so is the answer. */
function isRawRefusal(raw: Frame | DenumState): raw is Frame {
  return raw instanceof Frame &&
    (raw === Frame.nil || raw.observationError() !== undefined);
}

/**
 * The fourth hash observes KD signed coordinates from the raw third hash.
 * Arity completion is virtual: neither Count nor the stored loads change.
 */
export function observeKDCoordinates(source: Frame): Frame {
  const raw = observeRawDenum(source);
  if (isRawRefusal(raw)) return raw;
  const state = stateOf(raw);
  if (!state) return Frame.error("$!.denum-observations");
  if (state.loads.length === 0) return new FrameArray([]);
  try {
    return new FrameArray(
      kdCoordinates(state.loads).map((n) =>
        n >= 0n ? new FrameCount(n) : new FrameInt(n)
      ),
    );
  } catch {
    return Frame.error("$!.denum-kd-capacity");
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
    return Frame.error("$!.denum-kd-capacity");
  }
}

/**
 * Signed-XOR KD multiplication. A product Count counts pairings of the
 * operands' construction Counts, independent from its normalized load arity:
 * C(A &|& B) := C(A) × C(B). This explicit policy preserves Count zero.
 */
export function multiplyDenum(left: Frame, right: Frame): Frame {
  const a = observeRawDenum(left);
  if (isRawRefusal(a)) return a;
  const b = observeRawDenum(right);
  if (isRawRefusal(b)) return b;
  const x = stateOf(a);
  const y = stateOf(b);
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
      error instanceof KDProductBudgetError
        ? "$!.denum-product-budget &|&"
        : "$!.denum-product-capacity &|&",
    );
  }
}

Frame.denum = observeDenum;
Frame.observeKD = observeKDCoordinates;
Frame.negateDenum = negateDenum;
