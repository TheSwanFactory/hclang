import { Frame } from "../frames.ts";
import type { ReceiverState } from "../frames/bound-method.ts";

export const IfThen = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
): Frame => {
  if (source !== Frame.nil) {
    return block.call(Frame.nil, Frame.nil, receiverState);
  }
  return Frame.nil;
};

export const IfElse = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
): Frame => {
  if (source === Frame.nil) {
    return block.call(Frame.nil, Frame.nil, receiverState);
  }
  return Frame.nil;
};
