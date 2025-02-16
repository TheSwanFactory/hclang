import { Frame } from "../frames/frame.ts";

export type ICurryFunction = (source: Frame, block: Frame) => Frame;

export class FrameCurry extends Frame {
  constructor(
    protected Func: ICurryFunction,
    protected Source: Frame,
    protected key: string,
  ) {
    super();
    this.id += "." + key;
  }

  public override call(argument: Frame, _parameter: Frame): Frame {
    return this.Func(this.Source, argument);
  }

  public override toString(): string {
    return this.id; // `FrameCurry(${this.Source.id}, ${this.Func})`;
  }
}
