import { Frame, FrameArray, FrameNumber, FrameString } from "../frames";

export const MapProperties = (source: Frame, block: Frame) => {
  const array = source.meta_pairs().map( ([key, value]) => {
    const fkey = new FrameString(key);
    return block.call(value, fkey);
  });
  return new FrameArray(array);
};

export const MapEnumerable = (source: Frame, block: Frame) => {
  let i = 0;
  const array = source.asArray().map( (value) => {
    const param = FrameNumber.for(i.toString());
    i += 1;
    return block.call(value, param);
  });
  return new FrameArray(array);
};
