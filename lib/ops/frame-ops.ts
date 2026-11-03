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

  /**
   * The built-in operation for `key`, curried to `origin` as its left operand,
   * or missing when there is no such operation (015.02).
   *
   * Operator dispatch resolves a left operand's own declared method first, then
   * this global table, and never the lexical scope the operand was read from.
   * That keeps an operator written inside a method body meaning the global
   * operation rather than the class's own method for the same spelling.
   */
  public operation(key: string, origin: Frame): Frame {
    const func = this.OpsDict[key];
    return func != null ? this.curry(func, origin, key) : Frame.missing;
  }

  public override toString(): string {
    return this.OpsDict.toString();
  }

  protected curry(func: ICurryFunction, origin: Frame, key: string): Frame {
    const expr = new FrameCurry(func, origin, key);
    return expr;
  }
}
