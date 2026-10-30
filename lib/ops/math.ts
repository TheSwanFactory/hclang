// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameNumeric } from "../frames/frame-numeric.ts";
import { FrameArray } from "../frames/frame-array.ts";
import { FrameCount } from "../frames/frame-count.ts";

type NumericOperation = (left: FrameNumeric, right: FrameNumeric) => Frame;

const numeric = (
  source: Frame,
  block: Frame,
  operation: NumericOperation,
): Frame => {
  return source instanceof FrameNumeric && block instanceof FrameNumeric
    ? operation(source, block)
    : Frame.nil;
};

export const Add = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.add(right));

export const Subtract = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.subtract(right));

/** Star constructs a frame; numeric pairs retain the existing arithmetic ladder. */
export const Multiply = (source: Frame, block: Frame): Frame => {
  const left = source.referent();
  const right = block.referent();
  if (left instanceof FrameNumeric && right instanceof FrameNumeric) {
    return left.multiply(right);
  }
  if (left instanceof FrameArray) return left.inlay(block);
  if (left instanceof FrameCount) return FrameArray.starCount(left, block);
  return Frame.error("$!.star-domain *");
};

export const Divide = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.divide(right));

export const Modulo = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.modulo(right));

export const Power = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.power(right));

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
