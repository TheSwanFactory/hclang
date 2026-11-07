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
  cd,
  cdRank,
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
 * The operations `denum-engine` performs, selected by the first element of its
 * argument. The argument is `[op, count, loads, count, loads]`: the left state,
 * then the right one for the binary operations. A state is exactly
 * `[count, loads]`: there is no rank slot, so a legacy `[rank, count, loads]`
 * payload is refused, not reinterpreted (occurrence/figure 007.35).
 *
 * The engine receives only data, so the public type is chosen by the *op*, not
 * inferred from the arity (occurrence/figure 007.35b). Ops `build`, `rank`,
 * `addDenum` and `denumSchema` are generic and accept any positive arity. Every
 * other op is a CD op: it validates the state as a CD and refuses a non-CD
 * arity with `$!.denum-unsupported-arity`. Which HC class may call which op,
 * and which operands it accepts, is the HC class's identity check in
 * `hc/denum.hc`.
 */
export const DENUM_OPERATIONS = {
  /** Validate a generic state, any positive arity, and answer it as built. */
  build: 0,
  add: 1,
  subtract: 2,
  multiply: 3,
  opposite: 4,
  conjugate: 5,
  /** Promote the left state to the target rung in the third slot. */
  promote: 6,
  /**
   * The integer coordinate of each direction, an observation. The third slot
   * is the mode: 0 signed `W₊ − W₋`, 1 unsigned `W₊ + W₋`.
   */
  coordinates: 7,
  /** Legacy name of {@link DENUM_OPERATIONS.coordinates} (the signed mode). */
  observe: 7,
  /** The native signature names of the left state's channels, as text. */
  names: 8,
  /** The CD schema description `CD[n]` of the left state, which must be CD. */
  schema: 9,
  /** Positive minus negative load total: the declared residual, an integer. */
  residual: 10,
  /** The derived rank `⌊log₂ A⌋` of the left state's loads, an observation. */
  rank: 11,
  /** Generic equal-arity componentwise addition: no CD arity is required. */
  addDenum: 12,
  /** The generic schema description `Arity[A]`, never `CD[n]`. */
  denumSchema: 13,
  /** Validate a state as CD (arity 1, 2, 4, 8, 16, 32) and answer it as built. */
  buildCD: 14,
  /**
   * Refusals the HC classes cannot raise themselves, because source code can
   * write `$!.reason` but cannot raise a system error with it. They take no
   * state: `refuseNotCD` answers `$!.denum-not-cd` (a CD operation on a
   * generic Denum) and `refuseMixed` answers `$!.denum-mixed` (a generic and a
   * CD operand in one operation).
   */
  refuseNotCD: 15,
  refuseMixed: 16,
  /**
   * Whether a state is well formed with a shipped CD arity: Count 1 or 0,
   * never an error. It is a data question that lets the HC classes avoid
   * building a CD from a state that cannot be one. It is not CD identity, which
   * is the class's reconstruction check.
   */
  cdArity: 17,
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

/** The state read as an explicit CD: refuses a non-CD arity by name. */
function readCD(count: Frame | undefined, loads: Frame | undefined): CD {
  const state = readState(count, loads);
  return cd(state.count, state.loads);
}

const stateFrame = (state: Denum): Frame =>
  new FrameArray([
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
  const args = block.referent().elements();
  const op = args[0] === undefined ? undefined : counts(args[0]);
  if (op !== undefined && Number(op) === DENUM_OPERATIONS.cdArity) {
    try {
      const state = readState(args[1], args[2]);
      return Frame.count(isCDArity(state.loads.length) ? 1n : 0n);
    } catch (error) {
      if (error instanceof DenumError) return Frame.count(0n);
      throw error;
    }
  }
  const failure = block.referent().observationError();
  if (failure) return failure;
  if (op === undefined) return Frame.error("$!!.invalid-denum");
  if (Number(op) === DENUM_OPERATIONS.refuseNotCD) {
    return Frame.error("$!.denum-not-cd");
  }
  if (Number(op) === DENUM_OPERATIONS.refuseMixed) {
    return Frame.error("$!.denum-mixed");
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
    }
    // Everything below is a CD operation.
    const left = readCD(args[1], args[2]);
    switch (Number(op)) {
      case DENUM_OPERATIONS.buildCD:
        return stateFrame(left);
      case DENUM_OPERATIONS.opposite:
        return stateFrame(opposite(left));
      case DENUM_OPERATIONS.conjugate:
        return stateFrame(conjugate(left));
      case DENUM_OPERATIONS.coordinates: {
        // Absent (the v0.45.0 call shape) is signed; otherwise exactly 0 or 1.
        const mode = args[3] === undefined ? 0n : counts(args[3]);
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
        const target = args[3] === undefined ? undefined : counts(args[3]);
        if (target === undefined || target > 5n) {
          return Frame.error("$!.denum-rank");
        }
        return stateFrame(promote(left, Number(target)));
      }
      case DENUM_OPERATIONS.add:
      case DENUM_OPERATIONS.subtract:
      case DENUM_OPERATIONS.multiply: {
        const right = readCD(args[3], args[4]);
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
