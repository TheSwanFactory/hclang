import { Frame, FrameArray, FrameString } from "../frames";

export const MapProperties = (source: Frame, block: Frame) => {
  const array = source.meta_pairs().map( ([key, value]) => {
    const fkey = new FrameString(key);
    return block.call(value, fkey);
  });
  return new FrameArray(array);
};
