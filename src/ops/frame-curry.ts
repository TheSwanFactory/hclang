import { Frame } from "../frames/frame.ts";

/**
 * ICurryFunction is a type that converts a source Frame
 * and a block Frame into a new Frame.
 */
export type ICurryFunction = (source: Frame, block: Frame) => Frame;


/**
 * FrameCurry is a class that extends the Frame class to represent a curried function.
 */
export class FrameCurry extends Frame {
  constructor(
    protected Func: ICurryFunction,
    protected Source: Frame,
    protected key: string,
  ) {
    super();
    this.id += "." + key;
  }

  /**
   * call invokes the previously-curried function with the given argument.
   * 
   * @param argument 
   * @param _parameter 
   * @returns 
   */
  public override call(argument: Frame, _parameter: Frame): Frame {
    return this.Func(this.Source, argument);
  }

  public override toString(): string {
    return this.id; // `FrameCurry(${this.Source.id}, ${this.Func})`;
  }
}
