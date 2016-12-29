import { Context, Frame, FrameArg, FrameArray, FrameExpr } from "./frames";
import { MetaMap } from "./ops/iterators";

export interface ICurryFunction extends Function {
  (source: Frame, block: Frame): Frame;
}

export class FrameCurry extends Frame {
  constructor(protected _func: ICurryFunction, protected _source: Frame) {
    super();
  }

  public apply(argument: Frame, parameter: Frame) {
    return this._func(this._source, argument);
  }
}

export class FrameOps extends Frame {
  constructor(context: Context) {
    super(context);
  }

  public get(key: string, origin: Frame): Frame {
    return new FrameExpr([
      new FrameCurry(MetaMap, origin),
      FrameArg.here(),
    ]);
  }
}

export const Ops = new FrameOps({
});

export { MetaMap };
