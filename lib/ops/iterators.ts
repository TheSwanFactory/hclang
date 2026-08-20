import { Frame, FrameArray, FrameNumber, FrameString } from "../frames.ts";
import type { ReceiverState } from "../frames/bound-method.ts";

export const MapEnumerable = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
): FrameArray => {
  let i = 0;
  const array: Frame[] = source.asArray().map((value): Frame => {
    const param = FrameNumber.for(i.toString());
    i += 1;
    return block.call(value, param, receiverState);
  });
  return new FrameArray(array);
};

export const MapProperties = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
): FrameArray => {
  const array: Frame[] = source.meta_pairs().map(([key, value]): Frame => {
    const fkey = new FrameString(key);
    return block.call(value, fkey, receiverState);
  });
  return new FrameArray(array);
};

export const ReduceEnumerable = (
  source: Frame,
  block: Frame,
  receiverState?: ReceiverState,
): Frame => {
  const values = source.asArray();
  if (values.length === 0) {
    return Frame.nil;
  }
  return values.slice(1).reduce(
    (accumulator, value) => block.call(value, accumulator, receiverState),
    values[0],
  );
};
