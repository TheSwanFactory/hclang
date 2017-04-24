import { Frame, FrameArg, FrameExpr } from "../frames";

export type ICurryFunction = (source: Frame, block: Frame) => Frame;

export class FrameCurry extends Frame {
  constructor(protected Func: ICurryFunction, protected Source: Frame) {
    super();
  }

  public apply(argument: Frame, parameter: Frame) {
    return this.Func(this.Source, argument);
  }

  public toString() {
    return `FrameCurry(${this.Source}, ${this.Func})`;
  }
}
