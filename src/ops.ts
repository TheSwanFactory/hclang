import { Frame, FrameArg, FrameExpr } from "./frames";
import { MetaMap } from "./ops/iterators";

export interface ICurryFunction extends Function {
  (source: Frame, block: Frame): Frame;
}

export type FuncDict = { [key: string]: ICurryFunction; };

class FrameCurry extends Frame {
  constructor(protected Func: ICurryFunction, protected Source: Frame) {
    super();
  }

  public apply(argument: Frame, parameter: Frame) {
    return this.Func(this.Source, argument);
  }

  public toString() {
    return `.Source ${this.Source}; ${this.Func}`;
  }
}

export class FrameOps extends Frame {
  constructor(protected OpsDict: FuncDict) {
    super();
  }

  public get_here(key: string, origin: Frame): Frame {
    const func = this.OpsDict[key];
    if (func != null) {
      return this.curry(func, origin);
    }
    return Frame.missing;
  }

  public toString() {
    return this.OpsDict.toString();
  }

  protected curry(func: ICurryFunction, origin: Frame): Frame {
    return new FrameExpr([
      new FrameCurry(func, origin),
      FrameArg.here(),
    ]);
  }
}

export const Ops = new FrameOps({
  "&&": MetaMap,
});
