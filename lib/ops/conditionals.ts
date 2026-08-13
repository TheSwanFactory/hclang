import { Frame, FrameConditional } from "../frames.ts";

export const IfThen = (source: Frame, block: Frame): Frame => {
  if (source !== Frame.nil && source.is.false !== true) {
    return new FrameConditional(block.call(Frame.nil));
  }
  return Frame.false;
};

export const IfElse = (source: Frame, block: Frame): Frame => {
  if (source instanceof FrameConditional) {
    return source.otherwise(block);
  }
  if (source === Frame.nil || source.is.false === true) {
    return block.call(Frame.nil);
  }
  return Frame.false;
};
