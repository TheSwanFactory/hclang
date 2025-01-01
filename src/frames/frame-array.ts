import { Frame } from './frame.ts'
import { FrameList } from './frame-list.ts'
import { FrameNote } from './frame-note.ts'
import { NilContext, MetaFrame } from './meta-frame.ts'

export class FrameArray extends FrameList {
  public static readonly BEGIN_ARRAY = '['
  public static readonly END_ARRAY = ']'

  constructor (data: Array<Frame>, meta = NilContext) {
    super(data, meta)
  }

  public string_open () {
    return FrameArray.BEGIN_ARRAY
  };

  public string_close () {
    return FrameArray.END_ARRAY
  };

  public in (contexts = [Frame.nil]): Frame {
    const array = this.array_eval(contexts)
    return new FrameArray(array)
  }

  public get (key: string, origin: MetaFrame = this): Frame {
    if (!isNaN(Number(key))) {
      return this.at(Number(key))
    }
    return super.get(key, origin)
  }

  public apply (argument: Frame, parameter: Frame) {
    if (!argument.is.void) {
      this.data.push(argument)
    }
    return this
  }

  public at (index: number) {
    if (index >= this.size() || -index > this.size()) {
      const source = '[0..' + this.size() + '].' + index
      return FrameNote.index(source)
    }
    if (index >= 0) {
      return this.data[index]
    }
    const n = this.data.length
    return this.data[n + index]
  }

  public length () {
    return this.data.length
  }

  public reset () {
    this.data = []
  }
}
