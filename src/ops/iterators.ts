import { Frame, FrameString } from "../frames";

export const MetaMap = (source: Frame, block: Frame) => {
  return source.meta_pairs().map( ([key, value]) => {
    const fkey = new FrameString(key);
    return block.call(value, fkey);
  });
};
