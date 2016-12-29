import { Context, Frame, FrameArray, FrameExpr } from "./frames";

export interface ICurryFunction extends Function {
  (source: Frame, block: Frame): Frame;
}

export const Curry = (func: ICurryFunction, source: Frame) => {
  return (block: Frame) => {
    return func(source, block);
  };
};

import { MetaMap, MetaMapExpr } from "./ops/iterators";

export class FrameCurry extends Frame {
  constructor(func: ICurryFunction) {
    super();
  }
}

export class FrameOps extends Frame {
  constructor(context: Context) {
    super(context);
  }

  public get(key: string, origin: Frame): Frame {
    return MetaMapExpr;
  }
}

export const Ops = new FrameOps({
  "&&": new FrameCurry(MetaMap),
});

export { MetaMap };
