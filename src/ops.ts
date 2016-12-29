import { Context, Frame, FrameArg, FrameExpr } from "./frames";
import { MetaMap } from "./ops/iterators";

export interface ICurryFunction extends Function {
  (source: Frame, block: Frame): Frame;
}

export class FrameCurry extends Frame {
  constructor(protected Func: ICurryFunction, protected Source: Frame) {
    super();
  }

  public apply(argument: Frame, parameter: Frame) {
    return this.Func(this.Source, argument);
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
