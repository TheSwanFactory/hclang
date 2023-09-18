import { Frame } from './frame.js'
import { FrameList } from './frame-list.js'
import { NilContext } from './meta-frame.js'

export class FrameExpr extends FrameList {
  constructor (data: Array<Frame>, meta = NilContext) {
    super(data, meta)
    data.forEach((item) => {
      item.up = this
    })
  }

  public in (contexts = [Frame.nil]): Frame {
    contexts.push(this)
    const result = this.data.reduce((sum: Frame, item: Frame) => {
      const value = item.in(contexts)
      const next_sum = sum.call(value)
      return next_sum
    }, Frame.nil)

    if (this.is.statement) {
      this.data = [result]
      return this
    }
    return result
  }

  public call (argument: Frame, parameter = Frame.nil) {
    return this.in([argument, parameter])
  };

  public toStringDataArray (): string[] {
    const array = this.data.map((obj: Frame) => obj.toString())
    return [array.join(' ') + ',']
  }
};
