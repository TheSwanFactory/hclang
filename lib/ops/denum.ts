// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameCount } from "../frames/frame-count.ts";
import { FrameString } from "../frames/frame-string.ts";
import {
  add,
  arity,
  conjugate,
  coordinates,
  type Denum,
  denum,
  DenumError,
  multiply,
  opposite,
  promote,
  residual,
  schemaName,
  signatureName,
  subtract,
} from "../frames/denum.ts";

/**
 * The operations `denum-engine` performs, selected by the first element of its
 * argument. The argument is `[op, rank, count, loads, rank, count, loads]`: the
 * left Denum state, then the right one for the binary operations.
 */
export const DENUM_OPERATIONS = {
  /** Validate a state and answer it as built. */
  build: 0,
  add: 1,
  subtract: 2,
  multiply: 3,
  opposite: 4,
  conjugate: 5,
  /** Promote the left state to the rank of the right state's first slot. */
  promote: 6,
  /**
   * The integer coordinate of each direction, an observation. The fifth slot
   * is the mode: 0 signed `W₊ − W₋`, 1 unsigned `W₊ + W₋`.
   */
  coordinates: 7,
  /** Legacy name of {@link DENUM_OPERATIONS.coordinates} (the signed mode). */
  observe: 7,
  /** The native signature names of the left state's channels, as text. */
  names: 8,
  /** The schema name `CD[n]` of the left state's rank, as text. */
  schema: 9,
  /** Positive minus negative load total: the declared residual, an integer. */
  residual: 10,
} as const;

const counts = (frame: Frame): bigint | undefined => {
  const value = frame.referent();
  return value instanceof FrameCount && typeof value.data === "bigint"
    ? value.data
    : undefined;
};

/** The state a triple of Frames holds, or the contract failure. */
function readState(
  rank: Frame | undefined,
  count: Frame | undefined,
  loads: Frame | undefined,
): Denum {
  const r = rank === undefined ? undefined : counts(rank);
  const c = count === undefined ? undefined : counts(count);
  // Base Frame.elements() answers [this] for any non-aggregate, so a bare Count
  // would read as a one-element list: require an aggregate, as the hash reader
  // `storedState` does.
  const list = loads?.referent();
  const elements = list?.ownsIdentity() ? list.elements() : undefined;
  const l = elements?.map(counts);
  if (
    r === undefined || c === undefined || !l || l.some((x) => x === undefined)
  ) {
    throw new DenumError("$!!.invalid-denum");
  }
  if (r > 5n) throw new DenumError("$!!.invalid-denum", `rank ${r}`);
  return denum(Number(r), c, l as bigint[]);
}

const stateFrame = (state: Denum): Frame =>
  new FrameArray([
    Frame.count(BigInt(state.rank)),
    Frame.count(state.count),
    new FrameArray(state.loads.map((load) => Frame.count(load))),
  ]);

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
  const failure = block.referent().observationError();
  if (failure) return failure;
  const args = block.referent().elements();
  const op = args[0] === undefined ? undefined : counts(args[0]);
  if (op === undefined) return Frame.error("$!!.invalid-denum");
  try {
    const left = readState(args[1], args[2], args[3]);
    switch (Number(op)) {
      case DENUM_OPERATIONS.build:
        return stateFrame(left);
      case DENUM_OPERATIONS.opposite:
        return stateFrame(opposite(left));
      case DENUM_OPERATIONS.conjugate:
        return stateFrame(conjugate(left));
      case DENUM_OPERATIONS.coordinates: {
        // Absent (the v0.45.0 call shape) is signed; otherwise exactly 0 or 1.
        const mode = args[4] === undefined ? 0n : counts(args[4]);
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
            { length: arity(left.rank) },
            (_, channel) => new FrameString(signatureName(left.rank, channel)),
          ),
        );
      case DENUM_OPERATIONS.residual:
        return Frame.signed(residual(left));
      case DENUM_OPERATIONS.schema:
        return new FrameString(schemaName(left.rank));
      case DENUM_OPERATIONS.promote: {
        const target = args[4] === undefined ? undefined : counts(args[4]);
        if (target === undefined || target > 5n) {
          return Frame.error("$!.denum-rank");
        }
        return stateFrame(promote(left, Number(target)));
      }
      case DENUM_OPERATIONS.add:
      case DENUM_OPERATIONS.subtract:
      case DENUM_OPERATIONS.multiply: {
        const right = readState(args[4], args[5], args[6]);
        const operate = Number(op) === DENUM_OPERATIONS.add
          ? add
          : Number(op) === DENUM_OPERATIONS.subtract
          ? subtract
          : multiply;
        return stateFrame(operate(left, right));
      }
      default:
        return Frame.error("$!!.invalid-denum");
    }
  } catch (error) {
    if (error instanceof DenumError) return Frame.error(error.kind);
    throw error;
  }
};
