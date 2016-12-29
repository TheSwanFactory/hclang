import { Frame, FrameArg, FrameArray, FrameExpr, FrameString } from "../frames";

export interface ICurryFunction extends Function {
  (source: Frame, block: Frame): Frame;
}

export const Curry = (func: ICurryFunction, source: Frame) => {
  return (block: Frame) => {
    return func(source, block);
  };
};

export class FrameCurry extends Frame {
  constructor(protected _func: ICurryFunction, protected _source: Frame) {
    super();
  }

  public apply(argument: Frame, parameter: Frame) {
    return this._func(this._source, argument);
  }
}

export const MetaMap = (source: Frame, block: Frame) => {
  const array = source.meta_pairs().map( ([key, value]) => {
    const fkey = new FrameString(key);
    return block.call(value, fkey);
  });
  return new FrameArray(array);
};

export const MetaMapExpr = (source: Frame) => {
  return new FrameExpr([
    new FrameCurry(MetaMap, source),
    FrameArg.here(),
  ]);
};
