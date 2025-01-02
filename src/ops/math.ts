import { Frame, FrameNumber } from "../frames.ts";

export const Add = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.add(block);
  }
  return Frame.nil;
};

export const Subtract = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.subtract(block);
  }
  return Frame.nil;
};

export const Multiply = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.multiply(block);
  }
  return Frame.nil;
};

export const Divide = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.divide(block);
  }
  return Frame.nil;
};

export const Modulo = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.modulo(block);
  }
  return Frame.nil;
};

export const Power = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.power(block);
  }
  return Frame.nil;
};

export const Equals = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.equals(block);
  }
  return Frame.nil;
};

export const GreaterThan = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.greaterThan(block);
  }
  return Frame.nil;
};

export const GreaterThanOrEqual = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.greaterThanOrEqual(block);
  }
  return Frame.nil;
};

export const LessThan = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.lessThan(block);
  }
  return Frame.nil;
};

export const LessThanOrEqual = (source: Frame, block: Frame) => {
  if (source instanceof FrameNumber && block instanceof FrameNumber) {
    return source.lessThanOrEqual(block);
  }
  return Frame.nil;
};
