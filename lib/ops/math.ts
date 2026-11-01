// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameNumeric } from "../frames/frame-numeric.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameCount } from "../frames/frame-count.ts";

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
 * still answers nil, because an error is truthy under `?`, and a comparison
 * that answered one would take the branch.
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

export const Divide = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.divide(right));

export const Modulo = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.modulo(right));

export const Power = (source: Frame, block: Frame): Frame =>
  arithmetic(source, block, (left, right) => left.power(right));

export const Equals = (source: Frame, block: Frame): Frame => {
  return source.equals(block);
};

/** `==`: the same value and the same type at every node. */
export const TypeEquals = (source: Frame, block: Frame): Frame => {
  return source.typeEquals(block);
};

/** `===`: the same frame. Atoms, which own no identity, fall back to `==`. */
export const Identical = (source: Frame, block: Frame): Frame => {
  return source.identical(block);
};

export const GreaterThan = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.greaterThan(right));

export const GreaterThanOrEqual = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.greaterThanOrEqual(right));

export const LessThan = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.lessThan(right));

export const LessThanOrEqual = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.lessThanOrEqual(right));
