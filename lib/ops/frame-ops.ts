import { Frame } from "../frames/frame.ts";
import type { MetaFrame } from "../frames/meta-frame.ts";
import { FrameCurry, type ICurryFunction } from "./frame-curry.ts";

export type FuncDict = { [key: string]: ICurryFunction };

export class FrameOps extends Frame {
  constructor(protected OpsDict: FuncDict) {
    super();
  }

  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    const func = this.OpsDict[key];
    if (func != null) {
      return this.curry(func, origin as Frame, key);
    }
    return Frame.missing;
  }

  public override toString(): string {
    return this.OpsDict.toString();
  }

  protected curry(func: ICurryFunction, origin: Frame, key: string): Frame {
    const expr = new FrameCurry(func, origin, key);
    return expr;
  }
}
