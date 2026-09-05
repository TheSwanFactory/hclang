import { Frame, FrameNumeric } from "../frames.ts";

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

export const Multiply = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.multiply(right));

export const Divide = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.divide(right));

export const Modulo = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.modulo(right));

export const Power = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.power(right));

export const Equals = (source: Frame, block: Frame): Frame => {
  return source.equals(block);
};

export const DataEquals = (source: Frame, block: Frame): Frame => {
  return source.dataEquals(block);
};

export const MetadataEquals = (source: Frame, block: Frame): Frame => {
  return source.metadataEquals(block);
};

export const GreaterThan = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.greaterThan(right));

export const GreaterThanOrEqual = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.greaterThanOrEqual(right));

export const LessThan = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.lessThan(right));

export const LessThanOrEqual = (source: Frame, block: Frame): Frame =>
  numeric(source, block, (left, right) => left.lessThanOrEqual(right));
