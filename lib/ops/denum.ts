// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameCount } from "../frames/frame-count.ts";
import { FrameString } from "../frames/frame-string.ts";
import {
  add,
  addDenum,
  arity,
  type CD,
  cdRank,
  cdViewOf as deriveCDView,
  conjugate,
  coordinates,
  type Denum,
  denum,
  DenumError,
  isCDArity,
  multiply,
  opposite,
  promote,
  rankOf,
  residual,
  schemaOf,
  signatureName,
  subtract,
} from "../frames/denum.ts";

/**
 * The native capability registries (occurrence/figure 007.36). A retained Denum
 * state and a CD view each cross the engine as an ordinary `[count, loads]`
 * array, but the engine records the arrays it makes in these tables, keyed by
 * the array's identity, and trusts only those. A program cannot add to them: an
 * array it writes, copies or builds from `d.count` and `d.loads` is not in the
 * table, so a raw `[count, loads]` payload, a lookalike or a bare `2ⁿ`-load
 * state has no CD capability. The `view` op is the one way into the view table,
 * and it accepts only an entry of the state table. (The arrays stay plain
 * `FrameArray`s so that `~ ([].<>)` and type equality see lists.)
 */
const denumStates = new WeakMap<Frame, Denum>();
const cdViews = new WeakMap<Frame, CD>();

const pairFrame = (state: Denum): FrameArray =>
  new FrameArray([
    Frame.count(state.count),
    new FrameArray(state.loads.map((load) => Frame.count(load))),
  ]);

/** A native Denum state Frame, registered as one. */
export function denumStateFrame(state: Denum): Frame {
  const frame = pairFrame(state);
  denumStates.set(frame, state);
  return frame;
}

/** A native CD view Frame, registered as one. */
export function cdViewFrame(view: CD): Frame {
  const frame = pairFrame(view);
  cdViews.set(frame, view);
  return frame;
}

/** The Denum state a Frame carries by registration, or undefined. */
export function denumStateOf(value: Frame | undefined): Denum | undefined {
  const frame = value?.referent();
  return frame === undefined ? undefined : denumStates.get(frame);
}

/** The CD view a Frame carries by registration, or undefined. */
export function cdViewOf(value: Frame | undefined): CD | undefined {
  const frame = value?.referent();
  return frame === undefined ? undefined : cdViews.get(frame);
}

/**
 * The operations `denum-engine` performs, selected by the first element of its
 * argument. A generic op takes `[op, count, loads]` (a second `count, loads`
 * for `addDenum`) and never a view. A CD op takes `[op, view, view]`: its
 * operands are registered view frames, not payloads (occurrence/figure 007.36).
 * There is no rank slot, so a legacy `[rank, count, loads]` payload is refused,
 * not reinterpreted (occurrence/figure 007.35).
 *
 * The engine receives data, so the public type is chosen by the *op*, not
 * inferred from the arity. Ops `build`, `rank`, `addDenum` and `denumSchema`
 * are generic and accept any positive arity. `view` is the one way to a CD
 * capability: it takes a a registered Denum state. Every other op is a CD op and
 * refuses an operand that is not a view with `$!.denum-not-view`. Which HC
 * class may call which op, and which operands it accepts, is the HC class's
 * identity check in `hc/denum.hc`.
 */
export const DENUM_OPERATIONS = {
  /** Validate a generic state, any positive arity, and answer a Denum state. */
  build: 0,
  add: 1,
  subtract: 2,
  multiply: 3,
  opposite: 4,
  conjugate: 5,
  /** Promote the left view to the target rung in the third slot. */
  promote: 6,
  /**
   * The integer coordinate of each direction, an observation. The third slot
   * is the mode: 0 signed `W₊ − W₋`, 1 unsigned `W₊ + W₋`.
   */
  coordinates: 7,
  /** Legacy name of {@link DENUM_OPERATIONS.coordinates} (the signed mode). */
  observe: 7,
  /** The native signature names of the left view's channels, as text. */
  names: 8,
  /** The CD schema description `CD[n]` of the left view. */
  schema: 9,
  /** Positive minus negative load total: the declared residual, an integer. */
  residual: 10,
  /** The derived rank `⌊log₂ A⌋` of the left state's loads, an observation. */
  rank: 11,
  /** Generic equal-arity componentwise addition: no CD arity is required. */
  addDenum: 12,
  /** The generic schema description `Arity[A]`, never `CD[n]`. */
  denumSchema: 13,
  /**
   * The CD view of a Denum state (`d.cd ()`): the state must be a
   * a registered Denum state, and its arity 1, 2, 4, 8, 16 or 32.
   */
  view: 14,
  /**
   * Refusals the HC classes cannot raise themselves, because source code can
   * write `$!.reason` but cannot raise a system error with it. They take no
   * state: `refuseNotCD` answers `$!.denum-not-cd` (a CD operation on a
   * generic Denum) and `refuseMixed` answers `$!.denum-mixed` (a generic and a
   * view operand in one operation).
   */
  refuseNotCD: 15,
  refuseMixed: 16,
  /**
   * Whether a Denum state could be viewed: 1 or 0, never an error and never a
   * capability. It lets the HC classes avoid deriving a view that cannot exist
   * when they classify an operand. It takes a registered Denum state; anything
   * else is 0.
   */
  viewable: 17,
} as const;

const counts = (frame: Frame): bigint | undefined => {
  const value = frame.referent();
  return value instanceof FrameCount && typeof value.data === "bigint"
    ? value.data
    : undefined;
};

/** The state a pair of Frames holds, or the contract failure. */
function readState(count: Frame | undefined, loads: Frame | undefined): Denum {
  const c = count === undefined ? undefined : counts(count);
  // Base Frame.elements() answers [this] for any non-aggregate, so a bare Count
  // would read as a one-element list: require an aggregate, as the hash reader
  // `storedState` does.
  const list = loads?.referent();
  const elements = list?.ownsIdentity() ? list.elements() : undefined;
  const l = elements?.map(counts);
  if (c === undefined || !l || l.some((x) => x === undefined)) {
    throw new DenumError("$!!.invalid-denum");
  }
  return denum(c, l as bigint[]);
}

/** The CD view an operand must be, or the refusal that names why. */
function readView(operand: Frame | undefined): CD {
  const view = cdViewOf(operand);
  if (view === undefined) throw new DenumError("$!.denum-not-view");
  return view;
}

const stateFrame = denumStateFrame;
const viewFrame = cdViewFrame;

/**
 * `denum-engine`, the one native seam under the HC class in `hc/denum.hc`.
 *
 * It is pure arithmetic over the typed reference in `lib/frames/denum.ts`: it
 * reads Counts and answers fresh data, touches no scope and holds no state,
 * and it refuses anything malformed with a named error rather than guessing.
 * The Denum itself is an HC class; this is only how that class reaches the
 * Cayley–Dickson recurrence without a hand-written table in HC.
 */
export const DenumEngine = (_source: Frame, block: Frame): Frame => {
  const args = block.referent().elements();
  const failure = block.referent().observationError();
  if (failure) return failure;
  const op = args[0] === undefined ? undefined : counts(args[0]);
  if (op === undefined) return Frame.error("$!!.invalid-denum");
  if (Number(op) === DENUM_OPERATIONS.refuseNotCD) {
    return Frame.error("$!.denum-not-cd");
  }
  if (Number(op) === DENUM_OPERATIONS.refuseMixed) {
    return Frame.error("$!.denum-mixed");
  }
  if (Number(op) === DENUM_OPERATIONS.viewable) {
    const source = denumStateOf(args[1]);
    return Frame.count(
      source !== undefined && isCDArity(source.loads.length) ? 1n : 0n,
    );
  }
  try {
    switch (Number(op)) {
      case DENUM_OPERATIONS.build:
        return stateFrame(readState(args[1], args[2]));
      case DENUM_OPERATIONS.rank:
        return Frame.count(BigInt(rankOf(readState(args[1], args[2]))));
      case DENUM_OPERATIONS.denumSchema:
        return new FrameString(schemaOf(readState(args[1], args[2])));
      case DENUM_OPERATIONS.addDenum:
        return stateFrame(
          addDenum(readState(args[1], args[2]), readState(args[3], args[4])),
        );
      case DENUM_OPERATIONS.view: {
        const source = denumStateOf(args[1]);
        if (source === undefined) return Frame.error("$!!.invalid-denum");
        return viewFrame(deriveCDView(source));
      }
    }
    // Everything below is a CD op on views; anything else is not an op.
    if (
      Number(op) < DENUM_OPERATIONS.add ||
      Number(op) > DENUM_OPERATIONS.residual
    ) {
      return Frame.error("$!!.invalid-denum");
    }
    const left = readView(args[1]);
    switch (Number(op)) {
      case DENUM_OPERATIONS.opposite:
        return viewFrame(opposite(left));
      case DENUM_OPERATIONS.conjugate:
        return viewFrame(conjugate(left));
      case DENUM_OPERATIONS.coordinates: {
        // Absent (the v0.45.0 call shape) is signed; otherwise exactly 0 or 1.
        const mode = args[2] === undefined ? 0n : counts(args[2]);
        if (mode !== 0n && mode !== 1n) {
          return Frame.error("$!!.invalid-denum");
        }
        return new FrameArray(
          coordinates(left, mode === 1n).map((c) => Frame.signed(c)),
        );
      }
      case DENUM_OPERATIONS.names:
        return new FrameArray(
          Array.from(
            { length: arity(cdRank(left)) },
            (_, channel) =>
              new FrameString(signatureName(cdRank(left), channel)),
          ),
        );
      case DENUM_OPERATIONS.residual:
        return Frame.signed(residual(left));
      case DENUM_OPERATIONS.schema:
        return new FrameString(schemaOf(left));
      case DENUM_OPERATIONS.promote: {
        const target = args[2] === undefined ? undefined : counts(args[2]);
        if (target === undefined || target > 5n) {
          return Frame.error("$!.denum-rank");
        }
        return viewFrame(promote(left, Number(target)));
      }
      case DENUM_OPERATIONS.add:
      case DENUM_OPERATIONS.subtract:
      case DENUM_OPERATIONS.multiply: {
        const right = readView(args[2]);
        const operate = Number(op) === DENUM_OPERATIONS.add
          ? add
          : Number(op) === DENUM_OPERATIONS.subtract
          ? subtract
          : multiply;
        return viewFrame(operate(left, right));
      }
      default:
        return Frame.error("$!!.invalid-denum");
    }
  } catch (error) {
    if (error instanceof DenumError) return Frame.error(error.kind);
    throw error;
  }
};
