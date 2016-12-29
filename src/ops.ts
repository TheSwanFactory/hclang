import { Context, Frame, FrameArray, FrameExpr } from "./frames";

import { MetaMap, MetaMapExpr } from "./ops/iterators";


export class FrameOps extends Frame {
  constructor(context: Context) {
    super(context);
  }

  public get(key: string, origin: Frame): Frame {
    return MetaMapExpr(origin);
  }
}

export const Ops = new FrameOps({
});

export { MetaMap };
