import { Frame, FrameArg, FrameExpr } from "../frames";
import { FrameCurry, ICurryFunction } from "./frame-curry";

export type FuncDict = { [key: string]: ICurryFunction; };

export class FrameOps extends Frame {
  constructor(protected OpsDict: FuncDict) {
    super();
  }

  public get(key: string, origin: Frame): Frame {
    const func = this.OpsDict[key];
    if (func != null) {
      return this.curry(func, origin);
    }
    // console.error(`**WARN** [get]: '${key}' not found in: ${origin}`);
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
