import { Frame } from '../frames/frame'

export type ICurryFunction = (source: Frame, block: Frame) => Frame;

export class FrameCurry extends Frame {
  constructor (protected Func: ICurryFunction, protected Source: Frame, protected key: string) {
    super()
    this.id += '.' + key
  }

  public call (argument: Frame, _parameter: Frame) {
    return this.Func(this.Source, argument)
  }

  public toString () {
    return this.id // `FrameCurry(${this.Source.id}, ${this.Func})`;
  }
}
