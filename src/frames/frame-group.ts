import { Frame } from './frame.js'
import { FrameList } from './frame-list.js'
import { NilContext } from './meta-frame.js'

export class FrameGroup extends FrameList {
  constructor (data: Array<Frame>, meta = NilContext) {
    super(data, meta)
  }

  public eval_one (contexts = [Frame.nil]): Frame {
    contexts.push(this)
    const expr = this.data[0]
    const result = expr.in(contexts)

    const symbols = this.meta_pairs()
    symbols.forEach(([key, value]) => {
      result.set(key, value)
    })
    return result
  }

  public in (contexts = [Frame.nil]): Frame {
    switch (this.size()) {
      case 0: {
        return Frame.nil
      }
      case 1: {
        return this.eval_one(contexts)
      }
    }
    this.data = this.data.map((f: Frame) => f.in(contexts))
    return this
  }
}
