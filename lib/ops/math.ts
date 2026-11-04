// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameNumeric } from "../frames/frame-numeric.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameCount } from "../frames/frame-count.ts";
import { FrameGroup } from "../frames/frame-group.ts";
import { REPETITION_ELEMENT_LIMIT } from "../frames/frame-numeric.ts";

type NumericOperation = (left: FrameNumeric, right: FrameNumeric) => Frame;

/** Applies a numeric operation, or answers nil for any other pair. */
const numeric = (
  source: Frame,
  block: Frame,
  operation: NumericOperation,
): Frame => {
  return source instanceof FrameNumeric && block instanceof FrameNumeric
    ? operation(source, block)
    : Frame.nil;
};

/**
 * Arithmetic answers an operand that is already an error, left first, rather
 * than nil, so a failed read such as `$!.name-missing` reaches whatever uses
 * the result. As nil it vanished: a write of nil leaves a field unchanged, so a
 * misread load looked like an update that never landed (011.20). Ordering
 * uses the same rule: diagnostic failures now short-circuit before `?` (#467).
 */
const arithmetic = (
  source: Frame,
  block: Frame,
  operation: NumericOperation,
): Frame =>
  failure(source) ?? failure(block) ?? numeric(source, block, operation);

/** An operand that is an error value (`Frame.isError`), unwrapped. */
const failure = (operand: Frame): Frame | undefined => {
  const value = operand.referent();
  return value.isError() ? value : undefined;
};

export const Add = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.add(right));

export const Subtract = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.subtract(right));

/** Star constructs a frame; numeric pairs retain the existing arithmetic ladder. */
export const Multiply = (source: Frame, block: Frame): Frame => {
  const left = source.referent();
  const right = block.referent();
  const refused = failure(left) ?? failure(right);
  if (refused) return refused;
  if (left instanceof FrameNumeric && right instanceof FrameNumeric) {
    return left.multiply(right);
  }
  if (left instanceof FrameArray) return left.star(block);
  if (left instanceof FrameCount) return FrameArray.starCount(left, block);
  return Frame.error("$!.star-domain *");
};

/**
 * `/`, also spelled `./`. A numeric pair keeps the exact numeric ladder. An
 * ordered aggregate, an array or a group, divided by a positive Count n is
 * dealt into n channels (007.27): the element at index i goes to channel
 * i mod n, so `[A, B, C, D, E, F, G] / 3` is `[[A, D, G], [B, E], [C, F]]`.
 * Anything else answers nil, as before.
 */
export const Divide = (source: Frame, block: Frame): Frame => {
  const left = source.referent();
  if (left instanceof FrameArray || left instanceof FrameGroup) {
    return failure(left) ?? failure(block) ?? deal(left, block);
  }
  return arithmetic(source, block, (left, right) => left.divide(right));
};

/**
 * Literal division of an ordered aggregate into `n` channels (007.26, 007.27).
 *
 * Each immediate element is dealt whole, in order, round-robin from channel 0:
 * the same Frame, never copied, evaluated, measured or flattened, so identity,
 * nesting and duplicates are kept and every element lands in exactly one
 * channel. Properties are not elements, so they are not dealt. The answer is a
 * fresh array of exactly n fresh arrays, empty channels included; for n
 * greater than the element count the last channels are empty.
 *
 * The divisor is the channel Count itself, never a Size read from it: it must
 * be a Count, and zero is `$!.division-by-zero /` as it is for numbers. Any
 * other divisor, a negative or fractional number, text, an aggregate or a
 * Demi, is `$!.division-domain /`. More than 1,000,000 channels is
 * `$!.repetition-size 1000000`, the limit repetition uses for elements,
 * checked before anything is allocated.
 */
const deal = (source: FrameArray | FrameGroup, block: Frame): Frame => {
  const divisor = block.referent();
  if (!(divisor instanceof FrameCount) || typeof divisor.data !== "bigint") {
    return Frame.error("$!.division-domain /");
  }
  if (divisor.data === 0n) return Frame.error("$!.division-by-zero /");
  if (divisor.data > REPETITION_ELEMENT_LIMIT) {
    return Frame.error(`$!.repetition-size ${REPETITION_ELEMENT_LIMIT}`);
  }
  const n = Number(divisor.data);
  const channels: Frame[][] = Array.from({ length: n }, () => []);
  source.elements().forEach((element, index) => {
    channels[index % n].push(element);
  });
  return new FrameArray(channels.map((channel) => new FrameArray(channel)));
};

export const Modulo = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.modulo(right));

export const Power = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.power(right));

export const Equals = (source: Frame, block: Frame): Frame => {
  return failure(source) ?? failure(block) ?? source.equals(block);
};

/** `==`: the same value and the same type at every node. */
export const TypeEquals = (source: Frame, block: Frame): Frame => {
  return failure(source) ?? failure(block) ?? source.typeEquals(block);
};

/** `===`: the same frame. Atoms, which own no identity, fall back to `==`. */
export const Identical = (source: Frame, block: Frame): Frame => {
  return failure(source) ?? failure(block) ?? source.identical(block);
};

export const GreaterThan = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.greaterThan(right));

export const GreaterThanOrEqual = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.greaterThanOrEqual(right));

export const LessThan = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.lessThan(right));

export const LessThanOrEqual = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.lessThanOrEqual(right));
