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

/**
 * `:` is "or else": a value that is not nil answers itself, and only nil calls
 * the fallback. Composed after `?`, that makes `c ? t : e` answer `t` or `e`,
 * because the taken branch's value reaches `:` as its source.
 */
export const IfElse = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
): Frame => {
  if (source === Frame.nil) {
    return block.call(Frame.nil, Frame.nil, receiverState);
  }
  return source;
};
