import { Frame, FrameArray, FrameExpr, FrameString } from "../frames";

export const MetaMap = (source: Frame, block: Frame) => {
  const array = source.meta_pairs().map( ([key, value]) => {
    const fkey = new FrameString(key);
    return block.call(value, fkey);
  });
  return new FrameArray(array);
};

export const MetaMapExpr = new FrameExpr([
  new FrameArray([]),
]);
